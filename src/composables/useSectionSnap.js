import { onMounted, onUnmounted } from 'vue'
import { BODY_WALL_SHEET } from '../utils/domMarkers.js'

/**
 * 主页「按部分对齐」的滚轮吸附（会长 2026-09-23）。
 *
 * 主页自上而下是三部分：英雄区（#home，正好一屏）→ ABOUT US（#about）→ LATEST NEWS（#news）。
 * 会长要求：一次滚动（滚轮动一格）如果**会露出下一部分**，就别停在半路 ——
 *   · 开始滚动前没对齐在分界处 → 直接落在**正在逼近的那个分界**上；
 *   · 开始滚动前已经对齐在分界处 → 直接跳到**下一页显示的位置**（再往前一个分界）。
 * 两条合起来就是一条规则：**吸附到当前滚动位置严格之后（或之前）的那个分界**。
 *
 * 分界用布局盒算（offsetTop 链），不用 getBoundingClientRect：后者会被任何 transform
 * （悬停位移、动画）污染，而吸附必须按**真实文档位置**算。
 *
 * 监听由本 composable 自己注册（wheel 必须 passive: false，否则拦不下默认滚动），
 * 组件销毁时自己摘干净 —— 2026-09-24 之前它是被 useMaskReveal 在滚轮处理里回调的
 * （遮罩优先、吸附其次）；首页撤掉遮罩后，它自己听滚轮。
 * 触摸**不做**吸附（会长只要求滚轮）。
 *
 * @param {string[]} sectionIds 参与吸附的区块 id（自上而下）
 */
export function useSectionSnap(sectionIds) {
  const SNAP_EPS = 2 // 像素容差：判定「已经对齐在分界处」
  const SNAP_LOCK_MS = 560 // 吸附之后的静默期：别让触控板惯性再触发一整屏
  const SNAP_EXTEND_MS = 180 // 静默期内每来一次滚动就往后顺延一点
  const SNAP_CAP_MS = 1400 // 顺延的上限（惯性尾巴再长也总会结束）
  let snapLockUntil = 0
  let snapCapUntil = 0

  /** 元素在文档里的纵坐标（布局盒，与 transform 无关） */
  const docTopOf = (el) => {
    let y = 0
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop
    return Math.round(y)
  }

  /** 各区块的分界（升序、去重） */
  const sectionBounds = () => {
    const tops = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map(docTopOf)
    return [...new Set(tops)].sort((a, b) => a - b)
  }

  /** 返回 true = 这次滚动已被吸附处理（调用方负责 preventDefault） */
  const snapToSection = (dy) => {
    const now = Date.now()
    if (now < snapLockUntil) {
      // 吸附动画期间（含触控板的惯性尾巴）：吃掉这些滚动，并把静默期往后顺延
      snapLockUntil = Math.min(snapLockUntil + SNAP_EXTEND_MS, snapCapUntil)
      return true
    }
    if (!dy) return false
    const y = window.scrollY
    const bounds = sectionBounds()
    if (bounds.length < 2) return false
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const alignedIdx = bounds.findIndex((b) => Math.abs(b - y) <= SNAP_EPS)
    let target = null
    if (dy > 0) {
      if (alignedIdx >= 0) {
        // 已经对齐在分界处 → 直接去「下一页显示的位置」
        target = alignedIdx + 1 < bounds.length ? bounds[alignedIdx + 1] : null
      } else {
        // 没对齐 → 只有这一格滚下去**真的会露出下一部分**才吸附到那个分界
        const nextB = bounds.find((b) => b > y + SNAP_EPS)
        if (nextB != null && y + dy >= nextB - SNAP_EPS) target = nextB
      }
    } else if (alignedIdx >= 0) {
      // 往上同理；页首就是第一个分界，再往上没有可去的分界了（返回 null 即不吸附）
      target = alignedIdx > 0 ? bounds[alignedIdx - 1] : null
    } else {
      const prevB = [...bounds].reverse().find((b) => b < y - SNAP_EPS)
      if (prevB != null && y + dy <= prevB + SNAP_EPS) target = prevB
    }
    if (target == null || target < 0 || target > maxY + SNAP_EPS) return false
    snapLockUntil = now + SNAP_LOCK_MS
    snapCapUntil = now + SNAP_CAP_MS
    window.scrollTo({ top: target, left: 0, behavior: 'smooth' })
    return true
  }

  /** 成员卡浮窗开着时，滚轮归浮窗自己（它的正文本就可滚）。
      HeroAvatarWall 开卡时会给 body 挂 `hero-wall-sheet`（常量 BODY_WALL_SHEET，见 utils/domMarkers.js）
      并锁掉 body 的 overflow，
      这里不站开的话会 preventDefault，浮窗正文就滚不动了。 */
  const sheetOpen = () => document.body.classList.contains(BODY_WALL_SHEET)

  /** 滚轮 = 桌面。位移量取**原始** deltaY（浏览器真正会滚多少），不是阻尼后的值 ——
      吸附判据要比的是「这一格滚下去会不会露出下一部分」。deltaMode 1 = 行、2 = 页。 */
  const onWheel = (e) => {
    if (sheetOpen()) return
    const raw =
      e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY
    if (snapToSection(raw)) e.preventDefault()
  }

  onMounted(() => {
    // passive: false —— Chrome 把 window 上的 wheel 默认当 passive，那样 preventDefault 无效
    window.addEventListener('wheel', onWheel, { passive: false })
  })
  onUnmounted(() => window.removeEventListener('wheel', onWheel))

  return { snapToSection }
}
