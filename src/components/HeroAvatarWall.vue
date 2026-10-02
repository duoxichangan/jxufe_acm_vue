<script setup>
/**
 * HeroAvatarWall —— 首页 hero 的头像墙（可切换、可交互）
 *
 * 按下按钮 → 原有的 hero 文案与轮播淡出，墙从背后浮上来并开始缓慢漂移；
 * 再按一次 → 墙退场，文案与轮播原样回来。**原有文案与轮播逻辑一行未改**，
 * 只是被盖住 / 淡出（见 HomeView.vue 的 .hero-inner.is-wall-on）。
 *
 * ## 运动模型：一张环面 + 两条锯齿
 * 直接把这一页铺成一张环面 —— 第 (r, c) 格取 `list[((r % Py) * Px + (c % Px)) % n]`
 * （横向周期 Px 列、纵向周期 Py 行）。环面的周期是轴对齐的，所以要让两个轴**各自**
 * 走满一个周期（0 → ±Px·step、0 → ±Py·step，时长各 = 自己的周期 ÷ 自己轴上的速度）：
 * 任一轴走到头时画面正好平移了自己一整个周期，逐像素与起点相同，那次跳回看不见；
 * 两个轴各跳各的，合起来就是一条**任意角度的匀速直线**。
 *
 * ⚠ 两条动画必须落在**两个不同的元素**上，否则同元素上的两条 transform 动画互相覆盖。
 *   这里用两层嵌套 wrapper（.wall__drift-x / .wall__drift-y），各自用自己的
 *   `transform: translate3d()`。**不用 `translate` 这个独立变换属性** ——
 *   它 iOS 14.1 以下不支持，一旦不支持横向那条就整条失效（墙不动）。
 *   嵌套 wrapper 兼容到老 iOS，而且每层能独立合成，移动端 GPU 更稳。
 *
 * ⚠ 前提是**瓷砖边界本身不可见**（gap 0、无边框、无圆角）—— 我们是无缝墙。
 *   哪天要给瓷砖加圆角或间隙，这套「两轴各跳各的」立刻露馅。
 *
 * ## 环面周期 (Px, Py) 怎么取
 *   · 装得下所有图（Px × Py ≥ n）—— 周期是取图的唯一范围；
 *   · **每个方向都比视口大一截**（Px > 可见列数、Py > 行数）。
 * 第二条是会被忽略但很要命的一条：周期等于视口时，一屏正好是一个完整周期，
 * 屏幕上下两端就是同一张脸，而且是**周期性**地重复（竖着滚一个周期就回到原样）。
 * 所以周期在预算内尽量放大到视口的 1.2~1.5 倍；实在放不下（超大屏 / 图片极多）
 * 才退回「周期 = 视口」的老取法。网格 = 视口 + 一个周期（两轴都要多铺一整个周期，
 * 这是这套设计避不开的代价）。
 *
 * ## 排布：先打乱，再让「同一个人的两张」隔开一整屏
 * 老写法是 `list[(r*Px + c) % n]` —— 顺序铺。它不会出现相邻同图，但每张重复的图
 * 都落在**同一个偏移**上（第 i 张和第 i+n 张恰好差固定的「几列几行」），
 * 于是整面墙是一张有规律的、会动的壁纸，一屏内同图的偏移只有一两种。
 * 之后改成「配平多重集 → 洗牌 → 八邻域冲突修复」（buildPeriod()），偏移散开了，
 * 但**一屏之内仍会撞见两张同一个人**（实测 1440×900 稳定 2 对，会长 2026-09-23 提出要治）。
 * 现在首选「分栏周期」（buildSeparatedPeriod()）：周期切成 ≥2 个等宽栏，同一个人的
 * 每一份都落在**同一列号、不同栏**上 → 任意两份都隔着一整个可见宽度，
 * **一屏之内不可能出现两张同一个人**。排不出来（人少 / 屏大 / 格数超预算）才退回
 * buildPeriod() 的多重集洗牌 —— 那种情况下屏里能放的格子比人数还多，重复躲不掉。
 *
 * ## 图不够会重复 —— 躲不掉，但可以让它落在屏幕外
 * n 张图铺 m 格就重复 ⌈m/n⌉ 次，这在数学上躲不掉（36 张图、一屏 55 格，
 * 一屏里必然有约 19 格是"第二次出现"）。分栏周期做的就是：让这些"第二次出现"
 * **永远落在屏幕之外**（相隔一整屏宽），而不是落在随机的、随时可能被看见的位置上。
 * **往图片文件夹里加图不用改任何代码**，n 变大 → 同一个人的份数自然变少。
 *
 * ## 响应式
 * 瓷砖边长不写死在 JS 里，而是由 CSS 变量 `--wall-tile` 给目标值、媒体查询调档，
 * 组件读出来后再在 4px 网格上扫描（40→260），取「离目标最近、且排得出合格周期、
 * 且 DOM 不超预算」的那组。
 * 几何量的是**本组件的盒子**（= hero 的盒子）而不是视口，于是白拿三件事：
 * 手机地址栏收放、≤768px 的 `min-height: auto`、横竖屏切换，全都自动跟随。
 *
 * ## 交互（悬停=预览，点击=读全文）
 * 用 `matchMedia('(hover: hover) and (pointer: fine)')` 做能力检测，不看 UA：
 *   · 桌面：悬停弹出**预览卡**（锚在格子上，头像从砖里飞进圆框）；卡片位置 JS 夹紧，
 *           免得贴边格子的卡被 hero 的 overflow: clip 裁掉。
 *   · 点任意一格 → 弹**全文卡**（.wall-sheet）：桌面与触屏**同一个入口、同一个组件**。
 *     桌面上悬停卡只是预览，留言超长时尾部淡出并提示「点击查看全文」。
 * ⚠ 瓷砖必须 `touch-action: pan-y`，否则墙会吃掉触摸事件、**手机上在 hero 区域滑不动页面**。
 *
 * ## 卡片内容（hero_wall.json 的四个字段）
 * name 姓名 · line 一句话（一般是班级）· tags 奖项胶囊 · message 留言。
 * 前三个都是短文本（nowrap + 省略号）；message 可以是一整段话，于是分两级呈现：
 *   · 预览卡（.wall__card）：clamp 到 10 行。被截断时底部用 mask 淡出 + 挂一行
 *     「点击查看全文」—— 截没截断是**实测**出来的（scrollHeight vs clientHeight），
 *     短留言的卡片上不会多这一行废话。
 *   · 全文卡（.wall-sheet）：一个字不截。结构是「不滚的头 + 滚的正文 + 不滚的脚」，
 *     留言再长也只是正文区自己滚，姓名和关闭方式始终在。
 * 数据层不做任何截断，两个视图读的是同一份完整文本。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { FAMILY_LABELS, FAMILY_ORDER } from '../utils/contestTaxonomy.js'
import { honorText } from '../utils/honorType.js'
import { BODY_WALL_SHEET } from '../utils/domMarkers.js'

const props = defineProps({
  /** 由父组件 v-model:active 控制（HomeView 里就是那个按钮的开关） */
  active: { type: Boolean, default: false },
  /** 漂移速度（px/秒，激活态）。屏幕速度恒定，与方向无关。
      参考项目首页用的是 4 —— 那是当纯底纹用的；实测 4px/s 走完一格要 47 秒，
      肉眼等于静止。要「一直在滚」的观感，取 20 上下（约 9 秒一格）。 */
  speed: { type: Number, default: 22 },
  /** 底纹态的速度。比激活态慢一档：它只是垫在文案后面的质感，不该抢阅读。 */
  speedBackdrop: { type: Number, default: 11 },
  /** 墙的整体不透明度（激活态） */
  opacity: { type: Number, default: 1 },
  /** 底纹态的暗淡程度。参考项目首页用的就是 0.16：
      0.09 时肉眼只剩一层灰雾、看不出是头像，0.16 才读得出「一面人脸墙」。 */
  dimOpacity: { type: Number, default: 0.18 },
  /** 单个网格允许的最大格数 —— DOM 节点数上的偏好（最软的一条约束） */
  blockBudget: { type: Number, default: 700 },
  /** 悬停/点击是否弹成员卡（会长 2026-09-23）。
      与 active 分开是为**别的宿主**留的余地 —— 组件最初那份首页用法里，墙是随遮罩让开
      而「露」出来的，墙并没进入激活态，但那时恰恰要弹卡。
      首页（HomeView）现在传 `:hover-card="wallOn"`：跟 active 走 —— 底纹态不弹卡
      （悬停只出模糊亮斑），点「成员墙」进入后才弹。
      false = 底纹态的那套「放大并虚化」；true = 弹卡。 */
  hoverCard: { type: Boolean, default: false },
  /** 可用的缩略图档位（<thumbsBase>/ 下的目录名） */
  sizes: { type: Array, default: () => [384, 256] },
  /** 缩略图根目录。默认是首页那 33 位优秀成员的墙；「协会成员头像墙」（QQ 群 110 +
      优秀成员 33 + 负责人 6，按真名去重后 141 人）传自己的目录即可，不用动组件。 */
  thumbsBase: { type: String, default: '/images/hero_wall_thumbs' },
  /** 缩略图扩展名。默认 .jpg（hero_wall_thumbs 是 GDI+ 转出来的）；群成员墙用 .webp */
  thumbsExt: { type: String, default: '.jpg' },
  /** 有哪些图（生成物） */
  manifestUrl: { type: String, default: '/data/hero_wall.manifest.json' },
  /** 悬浮卡片的文案（手写物） */
  copyUrl: { type: String, default: '/data/hero_wall.json' },
  /** 开关按钮的文案 —— 想换词在 HomeView 传 prop 即可，不用碰组件 */
  label: { type: String, default: '成员墙' },
  labelActive: { type: String, default: '返回' },
})
const emit = defineEmits(['update:active', 'tile-hover'])

/* 这个类在 setup 期就挂上，而不是等 onMounted ——
   它控制的是「hero 在手机上一屏高」这条布局规则，晚一帧挂就会看到首屏先 683px、
   装载后再跳到一屏高的抖动。 */
if (typeof document !== 'undefined') document.body.classList.add('hero-wall-present')

const rootEl = ref(null)
const items = ref([])
const sourceBase = ref('/images/excellent_member/')
/** 触屏端弹出的那一条 —— 存**条目对象本身**，不存下标：
    瓷砖序号（0..cols×rows-1）和图片下标（0..n-1）不是一个东西，
    而且几何重排后同一序号会换成另一张脸。 */
const openItem = ref(null)
/* ── 浮窗里的标签分三类（会长 2026-09-23：「点出成员个人浮窗时，荣誉不再以『计数』显示，
      而是用『详细条目』」；2026-09-24 又要求「tag、奖项、寄语三者要有布局、要能区分」）：
        · 身份类（会长身份 / 协会职务 / 学业排名 / 奖学金 / 毕业去向）→ 头部胶囊，短；
        · 战绩明细（逐条赛事全名）→ 正文，**按赛事系列分组**成清单；
        · 寄语 → 正文第一节，无色底 + 一对大引号。
      卡片只有 360×132，明细长句必须换行显示，头部放不下 —— 正文本来就能滚。 */
const openShortTags = computed(() => (openItem.value?.sheetTags || []).filter((t) => t.type !== 'contest'))
const openDetailTags = computed(() => (openItem.value?.sheetTags || []).filter((t) => t.type === 'contest'))

/** 战绩明细按赛事系列分组，组顺序 = contestTaxonomy 的 FAMILY_ORDER（与胶囊同序）。
    family 是生成器从 awards 文件名映射出来的数据；手写在 members.json / leaders.json 里的
    条目没有 family（实测 141 格里 17 人 / 21 条），归到最后一组。
    ⚠ 这一组里绝大多数是「胶囊表达不了的其它竞赛」（睿抗 / 传智杯 / 数模 / CSP…），但**不是全部**：
    王海峰的「2024 ICPC 江西省赛季军」与邓一帆的「第十五届蓝桥杯国家级优秀奖」其实是主线赛事，
    只是手写条目同样没有 family —— 所以组名不能用「其他赛事」这种断言（会写错归类）。
    根治要在数据侧给这两条补 family（members/leaders 的 honors 目前是纯字符串，属会长口径）；
    组件里不去猜文案里的赛事名（「暨江西省赛」这类标题同时含两个段名，正则拦不住）。 */
const openDetailGroups = computed(() => {
  const byFamily = new Map()
  for (const t of openDetailTags.value) {
    const key = FAMILY_LABELS[t.family] ? t.family : ''
    if (!byFamily.has(key)) byFamily.set(key, [])
    byFamily.get(key).push(t)
  }
  const groups = []
  for (const f of FAMILY_ORDER) {
    if (!byFamily.has(f)) continue
    groups.push({ key: f, label: FAMILY_LABELS[f], items: byFamily.get(f) })
    byFamily.delete(f)
  }
  for (const [key, items] of byFamily) {
    groups.push({ key: key || 'other', label: key ? FAMILY_LABELS[key] : '其他战绩', items })
  }
  return groups
})

/* ── 环境能力 ── */
const canHover = ref(true)
const inView = ref(true)
const pageHidden = ref(false)

/* ── 盒子尺寸 + 瓷砖目标值（都从 CSS 读，媒体查询负责调档） ── */
const boxW = ref(0)
const boxH = ref(0)
const tileTarget = ref(188)

const measure = () => {
  const el = rootEl.value
  if (!el) return
  boxW.value = el.clientWidth
  boxH.value = el.clientHeight
  const v = parseFloat(getComputedStyle(el).getPropertyValue('--wall-tile'))
  if (Number.isFinite(v) && v > 0) tileTarget.value = v
  // 视口一变，栅格几何就变了 —— 指针映射那份缓存矩形必须作废（见 onWindowMove 上方注释）
  invalidatePointerRect()
  /* 几何一变，`tiles` 就重排，**同一个瓷砖节点换人**（见 clipped 的注释）。
     下面这三处状态是按「节点」或「文件名」记的，不清就会串到别人身上：
       · pointerTile（存节点）→ is-pointer 高亮留在换人后的那一格上；
       · lastTile（存节点）+ openTileFile（存文件名）→ 悬停卡内容是 v-if 比对**文件名**渲染的，
         新几何下没有任何一格与它相等 → 卡片内容整块消失；而 onGridOver 有
         `if (tile === lastTile) return` 早退，指针不动就再也回不来，
         要等指针离开整面墙（onWallLeave）或换一格才恢复。
     与 watch(() => props.hoverCard) 那处的清理同一道理。 */
  clearPointerTile()
  lastTile = null
  openTileFile.value = ''
}

/* ── 数据：清单（有哪些图）× 文案（写什么） ── */
/**
 * 悬停卡最多铺几条标签，其余折成一枚「+N」。
 * 不设上限时，标签是一条条往下的柱子（实测最多 9 条，韩家欢 5 条就已经看不出主次）；
 * 全站 141 人里 100 人 ≤3 条 —— 这个上限对大多数人不产生「+N」，真正收拾的是标签多的那批
 * （实测 2026-09-24：≥6 条 14 人、≥5 条 26 人、最多 9 条）。明细在浮窗里，点一下就有。
 *
 * ⚠ 2026-09-24 起「身份」与「战绩」**分开计数**（会长：tag 与奖项要能区分）：
 *   两者本来混在同一排里，会长身份的金色胶囊紧挨着蓝桥杯的蓝色胶囊，读起来是一堆
 *   没有主次的色块。现在身份那排归身份、战绩那排归战绩，各自折各自的 +N。
 *   战绩里四个「自动汇总」系列各一枚，另有手写竞赛条目会再加（实测单卡 contest 标签最多 6 枚），
 *   给 2 枚就够看出「这人打过什么比赛」。
 */
const PREVIEW_IDENTITY = 3
const PREVIEW_CONTEST = 2

/**
 * 卡片标签的两种写法都收：
 *   · 纯字符串 —— 首页那 33 位优秀成员的 hero_wall.json 就是这么写的（中性蓝胶囊）；
 *   · { text, type, family } —— 协会成员头像墙。type 交给全站那套分色（styles/honors.css 的
 *     .honor-tag--contest|destination|honor|contact|leader|more）；
 *     family 只有浮窗的战绩明细有（gen_group_wall.mjs 的 sheetTagsOf 从 awards 的文件名映射），
 *     浮窗正文靠它按赛事系列分组。
 * 统一成 { text, type, family }，type 为空字符串时按纯字符串渲染。
 * 取值那一步（字符串 / { text }，也认 { label } / { name }）收口到 honorType.js 的 honorText()，
 * 这里不再自己写第二遍 —— 同一份 JSON 在墙上与在两个页面必须认得出同一批字段。
 *
 * ⚠ 有意**不**调用 honorType.js 的 normalizeHonors()（它就是干这件事的）：那个函数会按关键词
 * **推断** type（认不出的兜底成 contest），而本组件对「没有 type」的默认观感是中性色。
 * 实测两种实现在生成物上逐条相同（group_wall.json 939 条标签 0 差异 —— 因为
 * gen_group_wall.mjs 写标签时已经过 normalizeHonors），但在上游那份纯字符串数据
 * （hero_wall.json 92 条）上会整片变成推断出来的类型色、并给「ICPC」补上空格 ——
 * 那是渲染口径的改动，不该顺手做。真要统一就整卡一起改，别只换这一处。
 */
const normalizeTags = (list) => {
  if (!Array.isArray(list)) return []
  return list
    .map((t) =>
      typeof t === 'string'
        ? { text: t, type: '', family: '' }
        : {
            text: honorText(t),
            type: String(t?.type ?? ''),
            family: String(t?.family ?? ''),
          }
    )
    .filter((t) => t.text.trim())
}

async function loadData() {
  const getJson = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  const [man, copy] = await Promise.all([getJson(props.manifestUrl), getJson(props.copyUrl)])
  if (man && typeof man.source === 'string') sourceBase.value = man.source
  const files = Array.isArray(man?.images) ? man.images : []
  const dict = copy && typeof copy.tiles === 'object' && copy.tiles ? copy.tiles : {}
  items.value = files.map((file) => {
    const c = dict[file] || {}
    const tags = normalizeTags(c.tags)
    /* 悬停卡那一版：身份与战绩**各切各的前几条**，剩下的只留个数字（见 PREVIEW_IDENTITY /
        PREVIEW_CONTEST）。切在这里而不是模板里，是为了让 clampCard() 量到的胶囊就是真正
       渲染的那几条 —— 它按「最宽的一条」定卡宽，多出来的隐藏标签不该参与。 */
    const identity = tags.filter((t) => t.type !== 'contest')
    const contest = tags.filter((t) => t.type === 'contest')
    const identShown = identity.slice(0, PREVIEW_IDENTITY)
    const contestShown = contest.slice(0, PREVIEW_CONTEST)
    /* 浮窗那一版标签：同一套顺序，但**战绩是逐条明细**而不是计数（🥇1🥈2 → 「🥇第47届 ICPC
       亚洲区域赛（南京）金牌」）。只有我们的生成器会给这个字段（gen_group_wall.mjs 的
       sheetTagsOf），作者的数据没有 → 没有就退回 tags，形状一致。 */
    const sheet = normalizeTags(c.sheetTags)
    const message = typeof c.message === 'string' ? c.message.trim() : ''
    /* 悬停卡的「块」= 身份 / 竞赛战绩 / 寄语（会长 2026-09-24：内容之间要有线、要有层次）。
       块与块之间画一条发丝线；**块标题只在块数 ≥2 时出现** —— 全墙 141 人里 100 人 ≤3 条
       标签、多数只有一块，给一张只有一条标签的卡挂一枚「身份」小标题纯属噪音。 */
    const blockCount =
      (identity.length ? 1 : 0) + (contest.length ? 1 : 0) + (message ? 1 : 0)
    return {
      file,
      // 原图（缩略图失败时的兜底）。留空则退回 manifest 的 source 前缀。
      full: typeof c.full === 'string' ? c.full : '',
      name: typeof c.name === 'string' ? c.name : '',
      line: typeof c.line === 'string' ? c.line : '',
      tags,
      identShown,
      identHidden: identity.length - identShown.length,
      contestShown,
      contestHidden: contest.length - contestShown.length,
      hasBlocks: blockCount > 0,
      secLabeled: blockCount >= 2,
      sheetTags: sheet.length ? sheet : tags,
      /* 留言：可以是一整段话（「给未来留一行」那种）。**不截断数据**，只由 CSS 限制行数 ——
         同一份文本在悬停卡里显示 5 行、在触屏居中卡里显示全文。 */
      message,
    }
  })
}

/* ── 缩略图路径：按 瓷砖 × DPR 自动选档；缺图时 onerror 回退原图 ── */
const thumbSize = computed(() => {
  const list = [...props.sizes].map(Number).filter((n) => n > 0).sort((a, b) => a - b)
  if (!list.length) return 384
  const need = tileTarget.value * Math.min(window.devicePixelRatio || 1, 2)
  return list.find((s) => s >= need) || list[list.length - 1]
})
const thumbOf = (file) =>
  `${props.thumbsBase}/${thumbSize.value}/${file.replace(/\.[^.]+$/, props.thumbsExt)}`
/** 原图：只在缩略图失败时兜底。tiles 里写了 `full`（站内绝对路径）就直接用它 ——
    群成员墙的原图分散在三个目录（群头像 / 优秀成员 / 负责人），单一 source 前缀盖不住。 */
const originalOf = (file, full) => (full ? String(full) : sourceBase.value + file)

const onImgError = (e, item) => {
  const el = e.target
  if (el.dataset.fallback === '1') return // 原图也失败就认了，别再循环
  el.dataset.fallback = '1'
  el.src = originalOf(item.file, item.full)
}

/* ── 环面周期 (px, py) 取多大 ──
   两条硬约束：
     · 装得下所有图（px × py ≥ n）—— 周期是「取图」的唯一范围；
     · 每个方向都不小于视口 —— 否则一屏之内同一格会出现两次。
   在这之上，周期**越大越好**（只要格数还塞得进预算）：
   周期正好等于视口时，一屏就是一个完整周期，屏幕上下两端是同一张脸；
   更糟的是每张重复的图都落在**同一个偏移**上（老写法里第 i 张和第 i+n 张
   恰好差固定的「几列几行」），于是整面墙是一张有规律的、会动的壁纸。
   把周期放大到视口的 1.2~1.5 倍之后，一屏只是周期里的一块随机窗口 ——
   重样依然在（照片数 < 屏幕格数，数学上躲不掉），但位置不再有规律。 */

/** 周期最多放大到视口的多少倍。再大只是徒增 DOM，排布的随机感已经不缺了 */
const PERIOD_MAX_SCALE = 1.5

const periodFor = (n, cols0, rows0, budget) => {
  const fit = (k) => {
    const px = Math.max(cols0 + 1, Math.round(cols0 * k))
    const py = Math.max(rows0 + 1, Math.round(rows0 * k), Math.ceil(n / px))
    return { px, py }
  }
  const cells = (px, py) => (cols0 + px) * (rows0 + py)

  /* ① 首选「分栏周期」：同一个人的每一份都隔着一整个可见宽度，于是**任何一屏都不可能
        同时出现两张同一个人的头像**（构造与证明见 buildSeparatedPeriod）。两个方向各试一次，
        谁的格数装得进预算就用谁。附带条件 `px*py ≤ bands*n`：一个栏装不下同一个人的全部
        副本时排不出来，宁可退回老写法也别排出坏周期。 */
  const bands = 2
  if (n) {
    const opts = []
    {
      const px = bands * cols0
      const py = Math.max(rows0 + 1, Math.ceil(n / px))
      opts.push({ px, py, sep: 'x' })
    }
    {
      const py = bands * rows0
      const px = Math.max(cols0 + 1, Math.ceil(n / py))
      opts.push({ px, py, sep: 'y' })
    }
    for (const c of opts) {
      if (c.px * c.py <= bands * n && cells(c.px, c.py) <= budget) return c
    }
  }

  // ② 退回老写法：周期比视口大一圈、重复格尽量分散 —— 但同屏仍可能出现两张同一个人
  for (let k = PERIOD_MAX_SCALE; k >= 1; k -= 0.05) {
    const c = fit(k)
    if (cells(c.px, c.py) <= budget) return { px: c.px, py: c.py, sep: '' }
  }
  /* 这个瓦片尺寸下排不出「比视口大一圈」的周期 —— 返回 null 让 geom 换个尺寸再试。
     周期退化成和视口一样大时，一屏正好是一个完整周期、上下两端就是同一张脸，
     那正是要修的东西；宁可把瓦片放大一点。 */
  return null
}

/** 兜底周期：等价于加周期放大之前的老写法（周期 = 视口）。
    只有所有瓦片尺寸都排不出合格周期时（超大屏 / 图片极多）才会用到。 */
const fallbackPeriod = (n, cols0, rows0) => {
  let best = null
  for (let px = cols0; px <= Math.max(n, cols0); px++) {
    const py = Math.max(rows0, Math.ceil(n / px))
    const cells = (cols0 + px) * (rows0 + py)
    if (!best || cells < best.cells) best = { px, py, cells }
  }
  return best || { px: cols0, py: rows0, cells: (cols0 + 1) * (rows0 + 1) }
}

/* ── 一格的大小：4px 网格上取离目标最近的那个，且要排得出合格周期、格数不超预算 ── */
const geom = computed(() => {
  const n = items.value.length || 1
  const base = Math.max(40, Math.round(tileTarget.value / 4) * 4)
  const W = boxW.value
  const H = boxH.value
  if (!W || !H) return { s: base, px: 1, py: 1, cols: 1, rows: 1 }

  /* 三档挑选，从好到差：
       ① best     —— 周期比视口大（不会再「上下重复」）**且**格数在预算内；
       ② budgetOk —— 格数在预算内，但周期只能退化成视口大小；
       ③ lax      —— 预算全超了，只求瓦片最贴近 CSS 目标（宁可多几个节点，也别算不出几何）。
     每一档都取「离 CSS 给的目标瓦片最近」的那个尺寸。 */
  let best = null
  let sepBest = null
  let budgetOk = null
  let lax = null
  for (let s = 40; s <= 260; s += 4) {
    const cols0 = Math.ceil(W / s)
    const rows0 = Math.ceil(H / s)
    const p = periodFor(n, cols0, rows0, props.blockBudget)
    const pp = p || fallbackPeriod(n, cols0, rows0)
    const cand = {
      s,
      px: pp.px,
      py: pp.py,
      cols: cols0 + pp.px,
      rows: rows0 + pp.py,
      c0: cols0,
      r0: rows0,
      sep: (p && p.sep) || '',
    }
    cand.cells = cand.cols * cand.rows
    const closer = (b) => !b || Math.abs(s - base) < Math.abs(b.s - base)
    if (closer(lax)) lax = cand
    if (cand.cells <= props.blockBudget && closer(budgetOk)) budgetOk = cand
    /* 分栏周期（sep）优先：它是唯一能保证「一屏不出现两张同一个人」的排布，
       代价只是周期格数多些 —— 只要装得进预算就用它，装不下才退回老排布。 */
    if (cand.sep && cand.cells <= props.blockBudget && closer(sepBest)) sepBest = cand
    if (p && closer(best)) best = cand
  }
  return (
    sepBest || best || budgetOk || lax || { s: base, px: 1, py: 1, cols: 2, rows: 2, c0: 1, r0: 1, sep: '' }
  )
})

/* ── 漂移：方向每次加载随机，两轴各走自己的一整个周期 ── */
const angle = ref(Math.random() * Math.PI * 2)
/** 一个轴慢到这个速度以下就当它不动 —— 否则时长算出 Infinity，CSS 当 0s，整面墙每帧跳一次周期 */
const MIN_AXIS_SPEED = 0.02

const drift = computed(() => {
  // 底纹态慢一档（见 props 说明）。方向角不随状态变，切换时不会突然拐弯。
  const speed = props.active ? props.speed : props.speedBackdrop
  const vx = Math.cos(angle.value) * speed
  const vy = Math.sin(angle.value) * speed
  const px = geom.value.px * geom.value.s
  const py = geom.value.py * geom.value.s
  return {
    // 位移 = ±一整个周期；Math.sign(0) === 0 → 速度为 0 的那个轴位移干脆为 0
    dx: Math.sign(vx) * px,
    dy: Math.sign(vy) * py,
    xDur: px / Math.max(Math.abs(vx), MIN_AXIS_SPEED),
    yDur: py / Math.max(Math.abs(vy), MIN_AXIS_SPEED),
  }
})
/** 网格起点：位移取正的那一侧要往反方向让出一个周期，保证走到头也不露白边 */
const gridX = computed(() => -Math.max(0, drift.value.dx))
const gridY = computed(() => -Math.max(0, drift.value.dy))

/* ── 排布：周期块在环面上取图，一个周期里每张图都排得到 ── */
/* ==========================================================================
   周期块的内容：把 n 张图排进 px×py 的环面
   --------------------------------------------------------------------------
   两个目标：
     ① 每张图至少出现一次 —— 不然有人永远上不了墙；
     ② 八邻域内不出现同一张图（环面上，含跨行列的 wrap）——
        这就是「一样的照片不要连在一起」。对角也算，肉眼一样明显。
   做法：配平多重集 → 洗牌 → 局部修复。
   N = px×py 通常只有 n 的两三倍，重复的图本来就不多，冲突几步就能修干净。
   ⚠ 为什么用带种子的 PRNG 而不是 Math.random：几何一变（拖窗口）就要重排，
     用 Math.random 的话缩放过程中整面墙会不停重新洗牌，看着像花屏。
     种子每次**刷新**换一个 —— 刷新一次换一批排布，同一次加载里稳定。
   ========================================================================== */
const layoutSeed = (Math.random() * 0xffffffff) >>> 0

/** mulberry32：32 位种子的小 PRNG */
const makeRng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** 八邻域（含对角） */
const NEIGH8 = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

/** 环面格 (r, c) 的八邻域里有几张和自己一样（>0 即冲突） */
const clashesAt = (grid, r, c, px, py) => {
  const v = grid[r * px + c]
  let hits = 0
  for (let k = 0; k < NEIGH8.length; k++) {
    const rr = (r + NEIGH8[k][0] + py) % py
    const cc = (c + NEIGH8[k][1] + px) % px
    if (grid[rr * px + cc] === v) hits++
  }
  return hits
}

/* ── 分栏周期：让「同一个人的两张头像」永远隔着一整个可见宽度 ──
   会长 2026-09-23：「成员墙上尽量不要同时出现两张代表同一个人的头像」。

   做法：把周期块横向切成 bands(≥2) 个等宽栏，每栏正好 cols0 列（= 一屏最多能看到的列数）。
   同一个人的每一份都落在**同一列号、不同栏**里，于是任意两份的横向距离 = 整数倍 × cols0
   —— 而一屏最多只跨 cols0 列，**装不下相距 cols0 的两份**，同屏重复从「大概率」变成「不可能」。
   栏内行序随机洗牌、人的顺序也洗过，观感与老写法没有区别（同栏同列不会撞人）。

   代价：周期格数要 ≥ 2×人数（每人至多两份），所以只在预算内才用；
   排不出来（人少、屏大、预算紧）就退回 buildPeriod 的多重集洗牌，那时候重复不可避免
   —— 一屏能放下的格子数比人数还多，怎么排都得有人出现两次。 */
const buildSeparatedPeriod = (n, cols0, rows0, px, py, rng, axis = 'x') => {
  /* y 轴分栏：行列互换用同一套构造，再转置回来 —— 保证的是「隔着一整屏高」 */
  if (axis === 'y') {
    const g = buildSeparatedPeriod(n, rows0, cols0, py, px, rng, 'x')
    if (!g) return null
    const out = new Array(px * py)
    for (let r = 0; r < py; r++) {
      for (let c = 0; c < px; c++) out[r * px + c] = g[c * py + r]
    }
    return out
  }

  const cols = cols0
  const bands = Math.floor(px / cols)
  if (bands < 2 || !n || cols < 1 || py < 1) return null
  const N = bands * cols * py
  if (N < n) return null
  const q = Math.floor(N / n) // 每人至少几份
  const extra = N - q * n // 其中多少人要多占一份
  if (q < 1 || q + (extra > 0 ? 1 : 0) > bands) return null

  const mix = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0
      const t = arr[i]
      arr[i] = arr[j]
      arr[j] = t
    }
    return arr
  }

  // ① 把人随机分到各列，列内人数尽量平均
  const ids = []
  for (let i = 0; i < n; i++) ids.push(i)
  mix(ids)
  const sizes = new Array(cols).fill(Math.floor(n / cols))
  for (let c = 0; c < n % cols; c++) sizes[c]++

  const grid = new Array(N).fill(-1)
  const stride = bands * cols
  let at = 0
  for (let c = 0; c < cols; c++) {
    const m = sizes[c]
    const multi = bands * py - q * m // 这一列里要「多占一份」的人数
    if (multi < 0 || multi > m) return null
    const people = []
    for (let i = 0; i < m; i++) {
      people.push({ id: ids[at + i], k: q + (i < multi ? 1 : 0), used: new Array(bands).fill(false) })
    }
    at += m
    /* ② 给每个人挑 k 个**不同的栏**，并且每栏正好落 py 个（多份的人先挑空位最多的栏） */
    const cap = new Array(bands).fill(py)
    const slot = []
    for (let b = 0; b < bands; b++) slot.push([])
    const order = people.map((_, i) => i).sort((a, b) => people[b].k - people[a].k)
    for (const i of order) {
      for (let t = 0; t < people[i].k; t++) {
        let pick = -1
        for (let b = 0; b < bands; b++) {
          if (people[i].used[b] || cap[b] <= 0) continue
          if (pick < 0 || cap[b] > cap[pick]) pick = b
        }
        if (pick < 0) return null
        people[i].used[pick] = true
        cap[pick]--
        slot[pick].push(people[i].id)
      }
    }
    // ③ 每栏那 py 个位置随机排进本栏的各行
    for (let b = 0; b < bands; b++) {
      if (slot[b].length !== py) return null
      mix(slot[b])
      for (let r = 0; r < py; r++) grid[r * stride + b * cols + c] = slot[b][r]
    }
  }
  return grid.every((v) => v >= 0) ? grid : null
}

/** 排出一个 px×py 的周期块，返回长度 px*py 的图片下标数组 */
const buildPeriod = (n, px, py, rng) => {  const N = px * py
  /* ① 配平多重集：每张图 ⌊N/n⌋ 或 ⌈N/n⌉ 份，加起来正好 N */
  const base = Math.floor(N / n)
  const extra = N - base * n
  const grid = new Array(N)
  let w = 0
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < base + (i < extra ? 1 : 0); t++) grid[w++] = i
  }
  /* ② Fisher–Yates 洗牌 */
  for (let i = N - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0
    const t = grid[i]
    grid[i] = grid[j]
    grid[j] = t
  }

  /* ③ 局部修复：反复挑一个还有冲突的格子，跟随机另一格对调，
        直到「对调之后两边都干净」。 */
  const swap = (a, b) => {
    const t = grid[a]
    grid[a] = grid[b]
    grid[b] = t
  }
  const clash = (i) => clashesAt(grid, (i / px) | 0, i % px, px, py)

  for (let pass = 0; pass < 120; pass++) {
    let bad = -1
    for (let i = 0; i < N; i++) {
      if (clash(i)) {
        bad = i
        break
      }
    }
    if (bad < 0) break // 全干净了

    let done = false
    for (let t = 0; t < 120 && !done; t++) {
      const j = (rng() * N) | 0
      if (j === bad || grid[j] === grid[bad]) continue
      swap(bad, j)
      if (!clash(bad) && !clash(j)) done = true
      else swap(bad, j)
    }
    if (done) continue

    /* 找不到「两边都干净」的位置，就退而求其次挑一个让冲突总数降得最多的。
       只有图片数少到八邻域根本排不开时才会走到这里；实在降不下去就收手，绝不空转。 */
    let pick = -1
    let gain = 0
    for (let t = 0; t < 200; t++) {
      const j = (rng() * N) | 0
      if (j === bad || grid[j] === grid[bad]) continue
      const before = clash(bad) + clash(j)
      swap(bad, j)
      const after = clash(bad) + clash(j)
      swap(bad, j)
      if (before - after > gain) {
        gain = before - after
        pick = j
      }
    }
    if (pick < 0) break
    swap(bad, pick)
  }
  return grid
}

/** 当前几何下的周期块。几何没变就是同一份，所以窗口缩放时不会重新洗牌 */
const periodGrid = computed(() => {
  const n = items.value.length
  const { px, py, c0, r0, sep } = geom.value
  if (!n || px < 1 || py < 1) return []
  const seed = (layoutSeed ^ Math.imul(n, 0x9e3779b1) ^ Math.imul(px, 0x85ebca6b) ^ Math.imul(py, 0xc2b2ae35)) >>> 0
  const rng = makeRng(seed)
  /* 分栏周期排不出来（人数太少 / 屏太大）就退回多重集洗牌 —— 那种情况下周期怎么排都得有人重复 */
  if (sep) {
    const g = buildSeparatedPeriod(n, c0, r0, px, py, rng, sep)
    if (g) return g
  }
  return buildPeriod(n, px, py, rng)
})

/* ── 平铺序列：把周期块按 (r % py, c % px) 铺满整张网格 ── */
const tiles = computed(() => {
  const list = items.value
  const n = list.length
  const { px, py, cols, rows } = geom.value
  const block = periodGrid.value
  const out = []
  if (!n || !cols || !rows || !block.length) return out
  const total = cols * rows
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / cols)
    const c = i - r * cols
    out.push(list[block[(r % py) * px + (c % px)]])
  }
  return out
})

const wallStyle = computed(() => ({
  '--step': geom.value.s + 'px',
  '--cols': geom.value.cols,
  '--rows': geom.value.rows,
  '--grid-x': gridX.value + 'px',
  '--grid-y': gridY.value + 'px',
  '--drift-x': drift.value.dx + 'px',
  '--drift-y': drift.value.dy + 'px',
  '--drift-x-dur': drift.value.xDur + 's',
  '--drift-y-dur': drift.value.yDur + 's',
  /* 暗淡度挂在**每一张图**上，不挂在 .wall 容器上：
     容器的 opacity 会把整棵子树一起压暗，那样悬停那一格永远亮不起来，
     底纹态的「模糊亮斑」就无从谈起。 */
  '--wall-opacity': props.active ? props.opacity : props.dimOpacity,
}))

/* ── 暂停：悬停 / 卡片打开 / 滚出视口 / 标签页切走 ── */
const paused = computed(() => !inView.value || pageHidden.value || !!openItem.value)

/* ── 悬停：卡片夹紧（免得贴边格子的卡被 hero 的 overflow: clip 裁掉） ── */
/** 兜底尺寸：**只在量不到真实卡片时**用（正常情况下都能量到 —— clampCard 读 offsetWidth）。
    CARD_W 与 CSS 里那一层的 `--card-w: 360px` 必须同值：CSS 先给「还没量到」的卡定宽，
    JS 量到实测宽度后再把 --card-w 回写；`.has-message` 变体在 CSS 是 440px，同理只影响
    量到之前的那一帧。CARD_H **没有**对应的 CSS 变量（卡片高度完全由内容决定），
    它只是 clampCard 的占位高度 —— 别拿它去和 contain-intrinsic-size 的 145px 凑同一个数。 */
const CARD_W = 360
const CARD_H = 132
let lastTile = null

/** 顶栏下沿（视口坐标）。顶栏是 fixed 的，所以它的下沿就是「内容不该钻进去」的那条线。
    ⚠ 必须用 offsetTop/offsetHeight，**不能**用 getBoundingClientRect()：首页露墙时导航栏
    被 translate3d(0,105vh,0) 推走，rect.bottom 会变成 900+，于是 clampCard 里
    「不许钻到导航栏底下」这条会把**每一张**卡都往下推 ~700px —— 整卡飞到屏幕外。
    offsetTop/offsetHeight 走的是布局盒，不受 transform 影响。 */
const headerBottom = () => {
  const h = typeof document !== 'undefined' ? document.querySelector('#app > header') : null
  return h ? h.offsetTop + h.offsetHeight : 0
}

const clampCard = (tile) => {
  const root = rootEl.value
  if (!tile || !root) return
  const r = tile.getBoundingClientRect()
  const c = root.getBoundingClientRect()
  if (!c.width || !c.height) return
  // 卡宽随内容自适应，所以这里量实测值：
  // 既用于边界钳制，也回写 --card-w 供「头像起飞点」--from-x 定位。
  // 用 offsetWidth 而不是 getBoundingClientRect —— 后者含卡片自身的 scale(.88)。
  const cardEl = tile.querySelector('.wall__card')
  if (cardEl) {
    // 卡宽 = 「正好装得下最宽的那一条」（见 .wall__card 的 width: max-content 注释）。
    // 先按「胶囊不折行」量自然宽度：.is-fitw 给出 nowrap + flex:none，
    // 此时胶囊的 offsetWidth 就是它整条摊开的宽度，与当前卡宽无关。
    cardEl.classList.add('is-fitw')
    const natural = [
      ...cardEl.querySelectorAll('.wall__tag, .wall__tag--typed, .wall__name, .wall__line'),
    ].reduce(
      // 姓名/班级是 nowrap + ellipsis：被截断时 offsetWidth 只是截断后的宽度，
      // scrollWidth 才是全文宽度（标准的「有没有被省略」判据）。
      (m, el) => Math.max(m, el.offsetWidth || 0, el.scrollWidth || 0),
      0
    )
    // 卡内固定开销：左右内边距 + 头像与文字块的间距 + 头像 —— 跟随 CSS 变量，不写死。
    const cs = getComputedStyle(cardEl)
    const chrome =
      parseFloat(cs.paddingLeft) +
      parseFloat(cs.paddingRight) +
      (parseFloat(cs.columnGap) || 0) +
      (parseFloat(cs.getPropertyValue('--avatar')) || 96)
    const avail = Math.max(240, window.innerWidth - 32)
    const fit = natural + chrome + 2 // +2：亚像素取整留余量，免得差 1px 又折行
    // 视口实在装不下最宽那条 → 摘掉 .is-fitw，退回「允许折行」，而不是让文字溢出卡片
    if (fit > avail) cardEl.classList.remove('is-fitw')
    tile.style.setProperty('--card-max', Math.max(300, Math.min(fit, avail)) + 'px')
  }
  const cardW = Math.min((cardEl && cardEl.offsetWidth) || CARD_W, c.width - 32)
  if (cardEl) tile.style.setProperty('--card-w', cardW + 'px')
  /* 卡片高度也**实测**，不用常量：它完全由留言行数决定 ——
     拿写死的 132 去夹紧，留言一多卡片就会从 hero 底部探出去。
     ⚠ 用 offsetWidth/offsetHeight 而不是 getBoundingClientRect()：卡片隐藏时带着
       scale(0.88)、头像还飞在外面，getBoundingClientRect 会把那些 transform 算进去。 */
  const cardH = cardEl?.offsetHeight || CARD_H
  const halfW = cardW / 2 + 10
  const halfH = cardH / 2 + 10
  const cx = r.left + r.width / 2 - c.left
  const cy = r.top + r.height / 2 - c.top
  // 上边界用「顶栏下沿」而不是容器上沿：顶栏的 pointer-events 已放开（横屏下墙要在
  // 那一条里也能悬停），但卡片不能钻到导航栏底下去 —— 那样只会露出半张。
  const minY = Math.max(0, headerBottom() - c.top) + halfH
  const maxY = c.height - halfH
  let sx = 0
  let sy = 0
  // 卡片中心 = 格子中心 + (sx, sy)，所以「贴左边界」要往右推（正）、
  // 「贴右边界」要往左推（负）—— 两边的符号相反，别写反。
  if (cx < halfW) sx = halfW - cx
  else if (cx > c.width - halfW) sx = c.width - halfW - cx
  if (cy < minY) sy = minY - cy
  else if (cy > maxY) sy = maxY - cy
  tile.style.setProperty('--sx', sx.toFixed(1) + 'px')
  tile.style.setProperty('--sy', sy.toFixed(1) + 'px')
}

/** 悬停卡里**留言被 line-clamp 截掉了**的图片名集合（只增不减）。
 *  用来决定要不要在卡片上挂「点击查看全文」和底部淡出 —— 短留言不该多一行废话。
 *  测量必须在**卡片已经渲染**之后做（悬停时它就在 DOM 里，只是 opacity: 0），
 *  而 opacity 不影响布局，clientHeight / scrollHeight 照样是准的。
 *  ⚠ 存文件名而不是给 DOM 挂 class：瓷砖是按下标复用的，几何一变同一个节点就换人了，
 *    DOM 上的标记会串到别人身上。 */
const clipped = reactive(new Set())

/** 量一格里的留言有没有被截断 —— line-clamp 的标准判据：内容高 > 可见高 */
const markClipped = (tile) => {
  const msgEl = tile.querySelector('.wall__msg')
  if (!msgEl) return
  const item = tiles.value[Number(tile.dataset.i)]
  if (!item?.message || !item.file || clipped.has(item.file)) return
  if (msgEl.scrollHeight - msgEl.clientHeight > 1) clipped.add(item.file)
}

/** 当前正在展示悬停卡的那一格（存 file，作为 v-for 的稳定键）。
    ⚠ 卡内内容（姓名 / 班级 / 胶囊 / 留言）**只在这一格渲染** —— 这是这次性能优化的核心：
    429 张完整的悬停卡占了整面墙 DOM 的约七成（4684 个元素里 ~3300 个在卡里）。
    实测 1440×900 DPR=2 + CPU 4× 节流（.tmp/shots/wall-ab.mjs）：
      429 张卡全渲染  35~46fps，Layout 0.32~0.60s / 2.6s
      只留一张        57fps， Layout 0.011s / 2.6s
    卡元素本身**保留**（只有它才能让 CSS 的淡入 + 放大过渡在悬停时跑起来，
    新插入的元素不会播放过渡），去掉的只是卡里的内容。 */
const openTileFile = ref('')

/** 只在「换了一格」时才算，避免 pointerover 在子元素间反复触发时反复量布局。
    底纹态不需要（那时不弹卡），直接跳过 —— 省掉每次悬停的一次布局读取。
    ⚠ 量宽高（clampCard 读 offsetWidth、markClipped 读 scrollHeight）必须等这次重渲染落地：
    openTileFile 刚改，卡内内容还没挂上去，立刻量到的是「只有头像」的空卡。 */
const onGridOver = (e) => {
  if (!canHover.value || !props.hoverCard) return
  const tile = e.target.closest?.('.wall__tile') || null
  if (tile === lastTile) return
  lastTile = tile
  openTileFile.value = tile ? tiles.value[Number(tile.dataset.i)]?.file || '' : ''
  if (!tile) return
  nextTick(() => {
    markClipped(tile)
    clampCard(tile)
    /* markClipped 可能刚把「点击查看全文」那一行加上去，卡片会高一点点 ——
       再夹一次，免得卡片底部压到 hero 边界外面。 */
    nextTick(() => clampCard(tile))
  })
}
/** 指针离开整面墙：把内容收回去（同一面墙内换格子由 onGridOver 负责）。 */
const onWallLeave = () => {
  lastTile = null
  openTileFile.value = ''
}

/* ── 底纹态下的悬停：不依赖 :hover，按坐标算 ──
   它原先**必需**：首页那套遮罩（.page-mask）整层盖在墙上面，指针事件全被它接走，
   瓷砖的 :hover 永远不会发生。2026-09-24 遮罩撤掉、墙回到 .hero 里之后，:hover 能正常
   触发了 —— 这条 window pointermove 的路子于是成了冗余的备份（两条选择器共用同一套
   CSS 声明，结果一致，留着不冲突）。保留它是因为本组件要与上游保持一致，改动越少越好。
   效果只作用在墙自己这一层：**不动任何外层的透明度**（会长 2026-09-23 明确要求）。
   只在**未开启弹卡**时工作：进入激活态后指针直接摸瓷砖，走 :hover / pointerover 那条路。 */
let pointerTile = null
const setPointerTile = (tile) => {
  if (tile === pointerTile) return
  pointerTile?.classList.remove('is-pointer')
  pointerTile = tile
  pointerTile?.classList.add('is-pointer')
  // 供宿主页面做联动（首页目前不消费；任何外层的透明度都必须保持静态）
  emit('tile-hover', !!tile)
}

/* ── 指针 → 瓷砖的映射必须节流（性能，2026-09-23 实测）──
   原实现**每一次 pointermove** 都读一次 grid.getBoundingClientRect()。那是强制布局读，
   实测（.tmp/shots/wall-perf.mjs，1440×900，429 格）：
     60 次移动 → 主线程 0.554s（≈9.2ms/次）、强制布局 104 次
   鼠标一路移动时这就吃掉一半以上的主线程，页面自然卡。
   而墙的漂移只有 speedBackdrop ≈ 11px/s —— **一张 150ms 前量的矩形最多偏 1.7px**，
   远小于一格 136px。于是：
     ① 每帧最多算一次（rAF 合并，鼠标事件可能一帧来好几个）；
     ② 矩形按 POINTER_RECT_TTL 复用，过期才重读；
     ③ 网格尺寸/位置一变（resize、重新 loadData）立即失效，绝不吃过期几何。 */
const POINTER_RECT_TTL = 150
let moveRaf = 0
let lastPt = null
let rectCache = { r: null, at: 0 }
const invalidatePointerRect = () => {
  rectCache = { r: null, at: 0 }
}
const pointerRect = (grid) => {
  const now = performance.now()
  if (!rectCache.r || now - rectCache.at > POINTER_RECT_TTL) {
    rectCache = { r: grid.getBoundingClientRect(), at: now }
  }
  return rectCache.r
}
const applyPointer = (pt) => {
  if (!canHover.value || props.hoverCard) return setPointerTile(null)
  const grid = rootEl.value?.querySelector('.wall__grid')
  const n = geom.value
  if (!grid || !n.s) return setPointerTile(null)
  const r = pointerRect(grid)
  // 先用**缓存**矩形做一次廉价的范围判断，指针不在墙上就直接结束（不再触碰 DOM）
  if (pt.x < r.left || pt.x >= r.right || pt.y < r.top || pt.y >= r.bottom) return setPointerTile(null)
  const col = Math.floor((pt.x - r.left) / n.s)
  const row = Math.floor((pt.y - r.top) / n.s)
  if (col < 0 || col >= n.cols || row < 0) return setPointerTile(null)
  setPointerTile(grid.children[row * n.cols + col] || null)
}
const onWindowMove = (e) => {
  lastPt = { x: e.clientX, y: e.clientY }
  if (moveRaf) return
  moveRaf = requestAnimationFrame(() => {
    moveRaf = 0
    if (lastPt) applyPointer(lastPt)
  })
}
const clearPointerTile = () => setPointerTile(null)

/* ── 点击：弹「全文卡」 ──
   桌面也走这条路：悬停卡只给预览（留言截断），想看全文得点一下。
   ⚠ 触屏端本来就是靠点击（没有 hover），所以这里是两端的统一入口。 */
let downPt = null
const onGridDown = (e) => {
  downPt = { x: e.clientX, y: e.clientY }
}
const onGridClick = (e) => {
  // 门控用 hoverCard（首页露墙后才为 true）：底纹态 / 有遮罩时不响应点击。
  // ⚠ 不能退回 `if (canHover.value) return`：桌面端现在也要靠点击看留言全文。
  if (!props.hoverCard) return
  // 顶栏那一条的 pointer-events 已放开（横屏下墙要在那里也能悬停），
  // 但那是导航栏的地盘 —— 点在它的空白处不该弹出成员卡。
  if (e.clientY <= headerBottom()) return
  const tile = e.target.closest?.('.wall__tile')
  if (!tile) return
  if (downPt && (Math.abs(e.clientX - downPt.x) > 10 || Math.abs(e.clientY - downPt.y) > 10)) return
  const i = Number(tile.dataset.i)
  if (Number.isInteger(i)) openItem.value = tiles.value[i] || null
}

const closeCard = () => (openItem.value = null)

const toggle = () => emit('update:active', !props.active)
const onKeydown = (e) => {
  if (e.key !== 'Escape') return
  if (openItem.value) closeCard()
  else if (props.active) emit('update:active', false)
}

/* ── 顶栏：底纹态下把它「掏空」 ──
   顶栏是 position: fixed 的整条，高 80px。竖屏时它只占视口的 9%，感知不到；
   **手机横屏时它占 20%+**（实测 844×390 时整片墙有 22% 落在它下面收不到悬停）。
   底纹态顶栏本身是透明的，那一条其实只有左边 logo 和右边导航是真的可点，
   中间是空的 —— 把顶栏整体放开、只留这些可点元素，墙就能在那一条里被悬停到。
   ⚠ 只在**底纹态**这么做：激活态顶栏压着一层 90% 白纱，墙在它下面本来就看不见，
   放开反而会让「点顶栏空白处」误弹出成员卡。 */
watch(
  () => props.active,
  (v) => {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('hero-wall-on', !!v)
  },
  { immediate: true }
)

/* ── 生命周期 ── */
let ro = null
let io = null
const mq = typeof window !== 'undefined' ? window.matchMedia('(hover: hover) and (pointer: fine)') : null
const onMqChange = (e) => {
  canHover.value = e.matches
  if (canHover.value) openItem.value = null
}
const onVis = () => (pageHidden.value = document.hidden)

onMounted(async () => {
  canHover.value = mq ? mq.matches : true
  mq?.addEventListener?.('change', onMqChange)

  measure()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(measure)
    ro.observe(rootEl.value)
  } else {
    window.addEventListener('resize', measure, { passive: true })
  }
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(([entry]) => (inView.value = entry.isIntersecting), { threshold: 0 })
    io.observe(rootEl.value)
  }
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointermove', onWindowMove, { passive: true })
  document.addEventListener('pointerleave', clearPointerTile)

  await loadData()
  invalidatePointerRect() // 数据一换，网格尺寸/周期可能也变了，缓存矩形作废
})

onBeforeUnmount(() => {
  ro?.disconnect()
  io?.disconnect()
  mq?.removeEventListener?.('change', onMqChange)
  window.removeEventListener('resize', measure)
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('visibilitychange', onVis)
  window.removeEventListener('pointermove', onWindowMove)
  document.removeEventListener('pointerleave', clearPointerTile)
  if (moveRaf) cancelAnimationFrame(moveRaf)
  lockPage(false) // 组件卸载（比如离开首页）时别把页面留在锁死状态
  if (typeof document !== 'undefined') document.body.classList.remove('hero-wall-present', 'hero-wall-on')
})

/* ── 成员卡打开 / 关闭时的全局副作用 ──
   ① 锁滚动：本项目的滚动容器是 **html**（base.css 里 `html { overflow-y: auto }`），
      所以锁的是 documentElement，不是 body。手机上不加这个，手指在卡片上滑动时
      底下的 hero 会跟着滚，卡片像"浮在滚动的纸上"。
   ② 给 body 挂类，把「加入我们」那个 fixed 悬浮球藏掉 —— 它和卡片是两个不相干的
      层，不管的话它会盖在抽屉上面（它在 App.vue 里，只能从外部按类命中）。
      规则写在下面的非 scoped <style> 里，随组件一起删除。 */
const lockPage = (on) => {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = on ? 'hidden' : ''
  document.body.style.overflow = on ? 'hidden' : ''
  document.body.classList.toggle(BODY_WALL_SHEET, on)
}

watch(openItem, (v) => {
  if (!v) lastTile = null // 关掉卡片时把上一格的 hover 位移清掉，免得下次悬停用到旧值
  lockPage(!!v)
})

// 弹卡态切换（露墙 / 收回遮罩）时把上一格的状态清干净：
// 底纹态那格（is-pointer）与卡内内容（openTileFile）都不该跨状态残留 ——
// 否则遮罩收回去时，上次停留的那格会带着内容一起回来。
watch(() => props.hoverCard, () => {
  clearPointerTile()
  lastTile = null
  openTileFile.value = ''
})
</script>

<template>
  <div ref="rootEl" class="hero-avatar-wall">
    <!-- 头像墙本体：固定铺满 hero 盒子，在文案与轮播背后（z-index 见 scoped 样式）。
         两种状态共用**同一套几何**（同样的瓷砖、同样的环面），只切不透明度与是否可交互 ——
         于是切换是一次纯淡入淡出，不重排、不重启漂移动画，画面不会跳。
           · 底纹态（默认）：淡着铺在背景里，悬停出模糊亮斑，不弹卡；
           · 激活态（is-active）：全强度，悬停弹卡、点击弹居中卡。 -->
    <div
      v-if="tiles.length"
      class="wall"
      :class="{ 'is-active': active, 'is-hovercard': hoverCard, 'is-paused': paused }"
      aria-hidden="true"
      :style="wallStyle"
      @pointerover="onGridOver"
      @pointerleave="onWallLeave"
      @pointerdown="onGridDown"
      @click="onGridClick"
    >
      <div class="wall__drift-x">
        <div class="wall__drift-y">
          <div class="wall__grid">
            <div
              v-for="(m, i) in tiles"
              :key="i"
              class="wall__tile"
              :data-i="i"
            >
              <img
                class="wall__img"
                :src="thumbOf(m.file)"
                alt=""
                loading="eager"
                decoding="async"
                fetchpriority="low"
                @error="onImgError($event, m)"
              />

              <!-- 悬停卡（仅 hover 设备）：左圆框头像 + 右侧姓名 / 班级 / 奖项 / 留言 -->
              <div class="wall__card" :class="{ 'has-message': !!m.message }">
                <div class="wall__avatar">
                  <img :src="thumbOf(m.file)" alt="" loading="lazy" decoding="async" @error="onImgError($event, m)" />
                </div>
                <!-- 卡内内容只在指针所在那一格渲染（性能，见 openTileFile 的注释）。
                     头像留在外面：它要能从格子「飞」到卡里，而新插入的元素不会播放过渡。 -->
                <div v-if="openTileFile === m.file" class="wall__info">
                  <p class="wall__name">{{ m.name || ' ' }}</p>
                  <p v-if="m.line" class="wall__line">{{ m.line }}</p>

                  <!-- 姓名（谁）与下面所有内容之间一条发丝线。会长 2026-09-23 把胶囊与正文的
                       间距收到 4px 是为了紧凑，但两段信息贴在一起就读不出层次了 ——
                       一条线比再加一截空白更省纵向空间。 -->
                  <div v-if="m.hasBlocks" class="wall__rule"></div>

                  <!-- ① 身份：会长身份 / 协会职务 / 学业排名 / 奖学金 / 毕业去向。
                       「块」是这张卡的排版单位（见 loadData 里 blockCount 的注释）：
                       每块之间一条线，块数 ≥2 才挂小标题。 -->
                  <section v-if="m.identShown.length || m.identHidden" class="wall__sec">
                    <p v-if="m.secLabeled" class="wall__sec-label">身份</p>
                    <div class="wall__tags">
                      <span
                        v-for="(t, j) in m.identShown"
                        :key="j"
                        :class="t.type ? ['honor-tag', `honor-tag--${t.type}`, 'wall__tag--typed'] : 'wall__tag'"
                        >{{ t.text }}</span
                      >
                      <!-- 「+N」用全站那枚中性虚线胶囊（.honor-tag--more）：它得一眼看出
                           「这里还有东西」，又不能被误读成一条真荣誉 —— 所以不上任何一类色。 -->
                      <span
                        v-if="m.identHidden"
                        class="honor-tag honor-tag--more wall__tag--typed wall__tag-more"
                        :title="`另有 ${m.identHidden} 条身份标签，点开看全部`"
                        >+{{ m.identHidden }}</span
                      >
                    </div>
                  </section>

                  <!-- ② 竞赛战绩：每个系列一枚计数胶囊（xCPC / 天梯赛 / 百度之星 / 蓝桥杯）。
                       计数版在卡片上，**明细版在浮窗里**（点一下就有）。 -->
                  <section v-if="m.contestShown.length || m.contestHidden" class="wall__sec">
                    <p v-if="m.secLabeled" class="wall__sec-label">竞赛战绩</p>
                    <div class="wall__tags">
                      <span
                        v-for="(t, j) in m.contestShown"
                        :key="j"
                        :class="t.type ? ['honor-tag', `honor-tag--${t.type}`, 'wall__tag--typed'] : 'wall__tag'"
                        >{{ t.text }}</span
                      >
                      <span
                        v-if="m.contestHidden"
                        class="honor-tag honor-tag--more wall__tag--typed wall__tag-more"
                        :title="`另有 ${m.contestHidden} 个系列，点开看全部`"
                        >+{{ m.contestHidden }}</span
                      >
                    </div>
                  </section>

                  <!-- ③ 寄语：悬停卡里只是**预览**（最多 10 行，见 .wall__msg 的 line-clamp）。
                       被截断时底部淡出并挂一行「点击查看全文」，全文在 .wall-sheet 里。
                       它是这张卡里唯一「人说的话」，所以单独成一块、字号抬一档，
                       与上面两排胶囊在**形态**上区分开（无色底 + 大引号，会长 2026-09-23 裁定）。 -->
                  <section v-if="m.message" class="wall__sec">
                    <p v-if="m.secLabeled" class="wall__sec-label">寄语</p>
                    <div class="wall__msg-block" :class="{ 'is-clipped': clipped.has(m.file) }">
                      <p class="wall__msg"><span class="wall__quote" aria-hidden="true">“</span>{{ m.message }}<span class="wall__quote wall__quote--close" aria-hidden="true">”</span></p>
                      <p v-if="clipped.has(m.file)" class="wall__msg-more">点击查看全文</p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全文卡（点任意一格弹出，桌面与触屏共用）。
         不能放进网格里 —— 网格的祖先带 transform，position: fixed 会相对那个祖先定位。
         结构固定三件套：不滚的头（是谁）+ 滚的正文（留言全文）+ 不滚的脚（怎么关）。
         头和脚不参与滚动，长留言滚到底也能看见姓名与关闭方式。
         门控：active（作者的激活态）或 hoverCard（首页露墙后的弹卡态）——
         首页走的是自有遮罩机制，从不置位 active，少了 hoverCard 就永远弹不出来。 -->
    <div v-if="(active || hoverCard) && openItem" class="wall-sheet" @click.self="closeCard">
      <div class="wall-sheet__card" role="dialog" aria-modal="true">
        <button class="wall-sheet__close" type="button" aria-label="关闭" @click="closeCard">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <div class="wall-sheet__head">
          <div class="wall-sheet__avatar">
            <img :src="thumbOf(openItem.file)" alt="" decoding="async" @error="onImgError($event, openItem)" />
          </div>
          <div class="wall-sheet__ident">
            <p class="wall-sheet__name">{{ openItem.name || ' ' }}</p>
            <p v-if="openItem.line" class="wall-sheet__line">{{ openItem.line }}</p>
            <div v-if="openShortTags.length" class="wall-sheet__tags">
              <!-- 与悬停卡同一套：带 type 的走全站分色胶囊，纯字符串走中性蓝。
                   这里只有**短标签**（会长身份 / 协会职务 / 手写荣誉）—— 战绩明细在下面的正文里。 -->
              <span
                v-for="(t, j) in openShortTags"
                :key="j"
                :class="t.type ? ['honor-tag', `honor-tag--${t.type}`, 'wall__tag--typed'] : 'wall__tag'"
                >{{ t.text }}</span
              >
            </div>
          </div>
        </div>

        <!-- 留言是**全文**，一个字都不截：这里没有悬停卡那种高度焦虑（正文自己滚）。
             没有留言的人（墙上绝大多数）就只显示头像 / 姓名 / 班级 / 奖项 ——
             刻意**不写**「这位成员还没有留下留言」这类占位：墙上没留言的是绝大多数，
             那句话不提供任何信息，只是噪音。
             ⚠ v-if 挂在这一层（而不是里面的 <p>）也是刻意的：这一块带 padding，
               空着留在这儿会在「奖项」和底部提示之间拉出一条几十像素的空白带。 -->
        <div v-if="openItem.message || openDetailGroups.length" class="wall-sheet__body">
          <!-- 正文分「节」：寄语一节、荣誉明细一节，两节之间一条分隔线 + 一个小节标题。
               没有这层结构时，一小段灰字留言和几十枚彩色胶囊直接挨在一起，
               留言会被胶囊的色块淹掉（会长 2026-09-24：寄语「和别的没有层次区分」）。 -->
          <section v-if="openItem.message" class="wall-sheet__sec">
            <p class="wall-sheet__label">寄语</p>
            <!-- 留言：无色底，两端用一对引号括住（会长 2026-09-23 裁定）。
                 引号是 aria-hidden 的装饰，读屏听到的还是原句。
                 无色的代价是它没有色块撑腰，所以字号 / 字重 / 颜色都得单独抬一档，
                 否则在这张卡里它比胶囊还弱。 -->
            <p class="wall-sheet__msg">
              <span class="wall-sheet__quote" aria-hidden="true">“</span>{{ openItem.message
              }}<span class="wall-sheet__quote wall-sheet__quote--close" aria-hidden="true">”</span>
            </p>
          </section>

          <!-- 战绩：逐条明细（与优秀成员页「详细条目」模式同一口径），
               **按赛事系列分组、一条一行**（会长 2026-09-24：「奖项堆成一团，没有布局、
               也没有区分」）。分组键 family 是生成器从 awards 文件名映射出来的数据，
               顺序走 contestTaxonomy 的 FAMILY_ORDER（与胶囊同序），不在组件里解析文案。
               仍然**不写条数** —— 会长 2026-09-23：荣誉不以「计数」显示，用详细条目。 -->
          <section v-if="openDetailGroups.length" class="wall-sheet__sec">
            <p class="wall-sheet__label">竞赛战绩</p>
            <div v-for="g in openDetailGroups" :key="g.key" class="wall-sheet__group">
              <p class="wall-sheet__group-title">{{ g.label }}</p>
              <ul class="wall-sheet__list">
                <li v-for="(t, j) in g.items" :key="j" class="wall-sheet__item">{{ t.text }}</li>
              </ul>
            </div>
          </section>
        </div>

        <div class="wall-sheet__foot">
          <span class="wall-sheet__hint">点空白处或按 Esc 关闭</span>
        </div>
      </div>
    </div>

    <!-- 开关：必须在 .hero-inner 之外，否则会跟着文案一起退场就回不来了。
         文案由 label / labelActive 两个 prop 给，改词不用碰组件。
         成员卡打开时整个藏掉 —— 那一刻屏幕上是「一个人的卡」，底下再压一个
         「返回/收起」按钮既抢注意力，也容易被误触。 -->
    <button
      v-if="items.length && !openItem"
      class="wall-toggle"
      :class="{ 'is-on': active }"
      type="button"
      :aria-pressed="active"
      :aria-label="active ? labelActive : label"
      @click="toggle"
    >
      <!-- 空闲：2×2 网格，指代「一面墙」 -->
      <svg v-if="!active" class="wall-toggle__icon" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="1" y="1" width="8" height="8" rx="2.6" fill="currentColor" />
        <rect x="11" y="1" width="8" height="8" rx="2.6" fill="currentColor" />
        <rect x="1" y="11" width="8" height="8" rx="2.6" fill="currentColor" />
        <rect x="11" y="11" width="8" height="8" rx="2.6" fill="currentColor" />
      </svg>
      <!-- 激活：返回箭头 -->
      <svg v-else class="wall-toggle__icon" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M12 4 6 10l6 6"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="wall-toggle__text">{{ active ? labelActive : label }}</span>
    </button>
  </div>
</template>

<style scoped>
/* ==========================================================================
   容器：铺满 hero 的 padding box（.hero 是最近的定位祖先）
   ========================================================================== */
.hero-avatar-wall {
  /* 瓷砖目标边长 —— 媒体查询调档，组件读它，再在 4px 网格上扫描取最优。
     量的是本元素的盒子（= hero 的盒子），不是视口。
     档位取自旧版头像墙的实测值（会长 2026-09-23：新版 188px 太大，按旧代码找回）：
     旧组件 AvatarMosaic 首页用的是 :tile="136"，故这里以 136 为基准，
     其余断点按同一比例（136/188 ≈ 0.72）缩到 4 的倍数。 */
  --wall-tile: 136px;

  position: absolute;
  inset: 0;
  /* ⚠ 这里**故意不设 z-index**：一旦设了（哪怕 0），本元素就会形成层叠上下文，
     内部按钮的 z-index 再高也压不过外面的 .hero-inner —— 按钮会被 hero 内容盖住、点不到。
     墙面本身由下面 .wall 的 z-index: 0 定位在 hero 最底层。 */
  pointer-events: none; /* 只有瓷砖和按钮自己打开事件，其余交给页面 */
}
@media (max-width: 1199px) {
  .hero-avatar-wall { --wall-tile: 108px; }
}
@media (max-width: 991px) {
  .hero-avatar-wall { --wall-tile: 96px; }
}
@media (max-width: 767px) {
  .hero-avatar-wall { --wall-tile: 72px; }
}

/* ==========================================================================
   墙
   ========================================================================== */
.wall {
  position: absolute;
  inset: 0;
  /* 与 .code-scroll-bg / .float-shapes / .hero-particles 同为 z-index: 0，
     DOM 序决定它在最下面；.hero-inner 是 z-index: 1，天然在墙上面 */
  z-index: 0;
  overflow: hidden;
  animation: wall-in 520ms ease both;
  /* 悬停卡的头像「起飞点」要按卡宽算（见 .wall__card 的 --from-x），
     而卡宽现在随内容自适应 —— clampCard 会在每次悬停时把实测宽度写回这一层，
     这里的 360px 只是没量到之前的兜底值，与 JS 的 `CARD_W`（本文件 setup 里）同值。 */
  --card-w: 360px;
}
@keyframes wall-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 两层嵌套 wrapper：两条 transform 动画必须落在**两个不同的元素**上，
   否则同元素上的两条会互相覆盖。各自 translate3d 自己的一个周期。 */
.wall__drift-x {
  position: absolute;
  left: var(--grid-x);
  top: var(--grid-y);
  animation: wall-drift-x var(--drift-x-dur) linear infinite;
  will-change: transform;
}
.wall__drift-y {
  animation: wall-drift-y var(--drift-y-dur) linear infinite;
  will-change: transform;
}
@keyframes wall-drift-x {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(var(--drift-x), 0, 0); }
}
@keyframes wall-drift-y {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(0, var(--drift-y), 0); }
}

.wall__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--step));
  grid-template-rows: repeat(var(--rows), var(--step));
  width: calc(var(--cols) * var(--step));
  height: calc(var(--rows) * var(--step));
  /* 无缝：gap 恒为 0、无边框、无圆角 —— 这是「两轴各跳各的」能成立的前提 */
}

.wall__tile {
  position: relative;
  width: var(--step);
  height: var(--step);
  background: #eef2f7;
  overflow: visible; /* 悬停卡比格子大得多，要能探出去 */
  pointer-events: auto;
  /* ⚠ 垂直滑动必须交还给浏览器，否则手机上在 hero 区域滑不动页面 */
  touch-action: pan-y;
}
.wall__img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 暗淡度在这里：底纹态 0.18、激活态 1，切换时 160 张一起淡入 —— 这就是「墙亮起来」 */
  opacity: var(--wall-opacity, 1);
  transition:
    opacity 520ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 300ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── 底纹态的悬停：这一格「亮起来并模糊」 ──
   为什么模糊的是图本身、而不是加一层毛玻璃（backdrop-filter）：
   墙在底纹态只有 0.18 的不透明度，隔着它去模糊背后那层平滑的渐变底，肉眼看不出任何变化；
   模糊自己这张图才有东西可看 —— 效果是一团柔和的亮斑跟着鼠标在墙面上走。
   参数取「大模糊 + 中等不透明度 + 放大」：blur 会把元素自身的 alpha 一起抹开，
   于是边缘自然摊成十几像素的软过渡，不会是一块硬邦邦的方块；
   再抬 z-index 保证它压在相邻格子之上。只在底纹态生效，激活态交给悬停卡。 */
@media (hover: hover) and (pointer: fine) {
  /* .is-pointer = 指针隔着遮罩停在格子上时 JS 挂的类（见 onWindowMove）：
     遮罩挡住指针事件，:hover 不会发生，但效果要一样 —— 两条选择器共用同一套声明。 */
  .wall:not(.is-hovercard) .wall__tile:hover,
  .wall:not(.is-hovercard) .wall__tile.is-pointer {
    z-index: 4;
  }
  .wall:not(.is-hovercard) .wall__tile:hover .wall__img,
  .wall:not(.is-hovercard) .wall__tile.is-pointer .wall__img {
    opacity: 0.55;
    filter: blur(18px) saturate(1.2);
    transform: scale(1.4);
  }
}

/* ── 暂停：卡片打开 / 滚出视口 / 标签页切走 ──
   ⚠ 刻意**不**把「悬停」算进来。悬停暂停看着很美，实测下来是反效果：
     墙铺满 hero（≈整屏），鼠标只要在页面上就必然悬停着某一格 ——
     于是漂移这个招牌效果等于被永久冻结（这一条对底纹态和激活态都成立）。
     悬停卡跟着瓷砖以 4px/s 走，读完一张卡才移动十几个像素，完全不影响阅读。
     （顺带也省掉了每次 mousemove 都要对 160 个格子重算 :has() 的开销。） */
.wall.is-paused .wall__drift-x,
.wall.is-paused .wall__drift-y {
  animation-play-state: paused;
}

/* ==========================================================================
   悬停卡（仅 hover 设备）
   ========================================================================== */
.wall__card {
  --avatar: 96px;
  /* 旧版头像墙（integration 的 AvatarMosaic）悬停卡的内边距是 12px、卡内间距 12px。
     卡片视觉整体按旧版还原（会长 2026-09-23：无遮罩时的悬停要「之前我做的样式」）：
     圆角 8px、边框 rgba(0,0,0,.058)、双层阴影、200ms cubic-bezier(.1,.9,.2,1)。
     见 .tmp/ref/old-hover-card.md 里抄出的旧 CSS 原文。
     会长随后要求「再贴近边缘」：内边距与卡内间距从旧版的 12px 收到 10px。 */
  --pad: 10px;
  /* 头像的起飞点：卡片正好以格子中心为锚 → 卡片中心 == 原格子中心。
     头像自然位置在卡片左侧，其中心距卡片中心 = 卡片半宽 − 内边距 − 头像半宽；
     于是「右移这么多 + 放大到格子尺寸」正好盖回原格子上，归零即飞到位。
     再减去卡片的夹紧位移 (--sx/--sy)，贴边格子也能精确落回原砖。 */
  --from-x: calc(var(--card-w) / 2 - var(--pad) - var(--avatar) / 2);
  --shift-x: var(--sx, 0px);
  --shift-y: var(--sy, 0px);

  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 6;
  /* 性能：429 张卡里绝大多数在视口外（网格 4488×1768 ≈ 6~7 屏），它们没必要参与布局与绘制。
     content-visibility: auto 让浏览器跳过「与用户无关」的子树（进入视口附近才算相关，
     与瓦片一样会跟着动画层一起判定）。卡片是绝对定位、出流元素，跳过它不会挤动任何兄弟；
     尺寸由内容决定，所以给一个接近实测中位数的 contain-intrinsic-size 兜底占位
     （衷铭川那张 10 枚标签的卡是 420×288，普通卡 420×145）。
     ⚠ 这里的 420×145 与 `--card-w`(360/440) **不是同一个数、也不是同一个概念**：
     它要的是「占位盒尽量接近实测尺寸」，让滚动条不跳；别为了「统一魔法数」去改它。
     ⚠ clampCard() 读的是 offsetWidth，必须等卡片已被渲染才准 —— 它只在指针下的格子被调用，
     那时卡片一定在视口里（已渲染），所以量到的仍是真实宽度。 */
  content-visibility: auto;
  contain-intrinsic-size: 420px 145px;
  display: flex;
  align-items: center;
  gap: 10px;
  /* 卡宽**由内容决定**（会长 2026-09-23：先「卡片没有适应宽度，有些内容会超」，
     再「成员墙的胶囊内还是换行了」）。
     ⚠ 光靠 `fit-content` 不行：卡片绝对定位在格子里（--step = 136px），
     收缩到合适宽度时的「可用宽度」就是那 136px → 只会退到 min-width，
     于是每张卡都被钉在 ~300px，而信息列只剩 172px，最宽的一条战绩胶囊有 278px
     —— 胶囊只能折成两行（实测 695 条胶囊里 104 条折行）。
     现在：`max-content` 按内容撑开，上限 --card-max 由 clampCard() 每次悬停实测回写
     （= 最宽的那一条 + 头像 96 + 间距 10 + 内边距 20），即「正好装得下最宽的一条」。
     配合 .is-fitw 下胶囊禁止内部折行，要换行就只在两条胶囊之间换。 */
  width: max-content;
  min-width: min(300px, calc(100vw - 32px));
  max-width: min(var(--card-max, 420px), calc(100vw - 32px));
  padding: var(--pad);
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.058);
  border-radius: 8px; /* 旧版用 --fluent-radius-overlay */
  box-shadow:
    0 2px 21px rgba(0, 0, 0, 0.14),
    0 32px 64px rgba(0, 0, 0, 0.24);
  text-align: left;
  opacity: 0;
  pointer-events: none;
  /* 起点压得更小 + 260ms 带一点回弹的曲线 —— 会长 2026-09-23：「整个卡片要有一个放大的
     动画」。原来的 0.88 配 200ms 只有 12% 的幅度，肉眼几乎看不出来（实测补间只有两帧
     落在中间值上），所以把起点收到 0.78 并把时长放到 260ms。 */
  transform: translate(calc(-50% + var(--shift-x)), calc(-50% + var(--shift-y))) scale(0.78);
  transition:
    opacity 160ms ease-out,
    transform 260ms cubic-bezier(0.22, 1.32, 0.36, 1);
}
.wall__avatar {
  flex: none;
  width: var(--avatar);
  height: var(--avatar);
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  transform: translate(calc(var(--from-x) - var(--shift-x)), calc(0px - var(--shift-y)))
    scale(calc(var(--step) / var(--avatar)));
  transition: transform 300ms cubic-bezier(0.1, 0.9, 0.2, 1);
}
.wall__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #e2e8f0;
}
.wall__info {
  min-width: 0;
}
.wall__name {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wall__line {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.4;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 身份（姓名 / 班级）与内容（标签 / 留言）之间的发丝线。
   比「再加一截空白」更省纵向空间，又能真把两段分开 ——
   会长 2026-09-23 把胶囊与正文的间距收到 4px 是为了紧凑，但两段信息贴在一起
   就读不出层次了（会长 2026-09-24：「所有都堆在一起，没有 line 或者层次的区分」）。 */
.wall__rule {
  height: 1px;
  /* 刻意压得很紧（4px / 5px）：会长 2026-09-23 嫌过「胶囊与正文的距离太大」，
     所以这条线只负责「分开」，不负责「撑开」—— 总间距 10px，比当年被嫌的 8px 方案还省。 */
  margin: 4px 0 5px;
  background: rgba(0, 0, 0, 0.07);
}
.wall__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 0;
}
/* ── 悬停卡的「块」：身份 / 竞赛战绩 / 寄语 ──
   会长 2026-09-24：「不同内容之间要有 line 或者别的东西做出划分，不要全部堆在一起」。
   所以每块之间一条发丝线 + 一块一枚小标题，标题样式与浮窗的 .wall-sheet__label 同构
   （11px / 拉开字距 / 灰字 / 前面一小段主色竖条）—— 两个界面因此有同一套层次语言。
   ⚠ 线只画在**块与块之间**（.wall__sec + .wall__sec）：只有一块的卡（全墙大多数）
     不会多出一条孤零零的线。 */
.wall__sec + .wall__sec {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
}
.wall__sec-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 5px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: #94a3b8;
}
.wall__sec-label::before {
  content: '';
  flex: none;
  width: 3px;
  height: 10px;
  border-radius: 2px;
  background: var(--primary);
}
/* 胶囊是**不该拆开的单位**（会长 2026-09-23：「成员墙的胶囊内还是换行了」）：
   一条战绩胶囊要么整条在一行、要么整条换到下一行。`.is-fitw` 由 clampCard() 在
   「这条胶囊装得下」时挂上（卡宽也正好按它撑开，两条是一件事的两面）。
   视口实在装不下最宽那条时它会摘掉这个类 —— 退回「允许折行」，而不是让文字溢出卡片。
   ⚠ 只作用于格子里的悬停卡：触屏的居中卡不在 .wall__tile 下，不受影响。 */
.wall__card.is-fitw .wall__tag,
.wall__card.is-fitw .wall__tag--typed {
  white-space: nowrap;
  flex: none;
}
.wall__tag {
  font-size: 0.75rem;
  line-height: 1.7;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(26, 115, 232, 0.08);
  color: #1a73e8;
  /* 不再 nowrap：nowrap 的 flex 项不肯收缩，会把卡片顶穿。放不下时在空格处换行
     （整条战绩本身就是「系列 段 段」用空格分隔的，所以换行正好落在段之间）。 */
}

/* 带头像墙分色的标签（协会成员头像墙用）——颜色走全站那套：
   styles/honors.css 的 .honor-tag--contest|destination|honor|contact|leader|more，
   每个修饰类自己持有 --tag-* 私有变量。这里只压小卡内几何：整页那套 3px 12px 的内边距
   会把卡片撑高（旧版实测能撑到 262px），故压到 1px 8px。
   **不要**在这里回写颜色，否则六种色会退化成一种。 */
.wall__tag--typed {
  font-size: 0.72rem;
  line-height: 1.7;
  padding: 1px 8px;
}

/* 「+N」＝悬停卡里被折起来的标签条数（明细在浮窗里）。
   几何跟 .wall__tag--typed 一致、跟着它一起参与 clampCard 的量宽；
   颜色与虚线边框由全站那枚 .honor-tag--more 给 —— 中性灰，不冒充任何一类荣誉。 */
.wall__tag-more {
  font-variant-numeric: tabular-nums;
}

/* 留言（「给未来留一行」那种一整段话）。
   长段落 clamp 到 10 行 —— 悬停卡只是**预览**，不该随留言长度无限变高
   （hero 是 overflow: clip，卡片长过头会被切掉半张）。
   clamp 只是**视觉截断，数据一个字都没丢**：点一下弹出来的 .wall-sheet 里是全文。
   ⚠ 截断的前提是卡片宽度够读：所以 .wall__card.has-message 把卡放宽到 440px。
   margin-top 归 0：它现在住在 .wall__sec 里，上方的间距由「块标题 / 块间那条线」给。 */
.wall__msg-block {
  margin-top: 0;
}
.wall__msg {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 10;
  line-clamp: 10;
  overflow: hidden;
  /* 无色底（会长 2026-09-23）：「留言不要以现有的蓝色底显示，而是无色底，
     然后用一对引号把留的言括起来」。原先这里是 3px 蓝色左边线 + 5% 蓝底 + 圆角。
     它的层次感只能靠**字**来给：13px 灰字读起来跟胶囊一样重，而这张卡里它是唯一
     「人说的话」，所以字号抬到 14px、字重 500、颜色压深一档（会长 2026-09-24：
     寄语和别的内容没有层次区分）。 */
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.75;
  color: #334155;
  /* 作者自己敲的换行留着；一长串英文 / URL 也必须能断，否则会把卡片撑破 */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
/* 留言两端那对引号（悬停卡与浮窗共用）。
   ⚠ 别写 line-height: 0 —— 它确实能让大引号「不撑高行盒」，但悬停卡那段是 line-clamp 的
     `overflow: hidden`：实测引号盒过高时会被**齐根裁掉**，页面上只剩一道发丝。
     保留 line-height: 1 让首行跟着长高。字号从 2.2em 收到 1.6em（会长 2026-09-24：
     寄语「很丑」）—— 2.2em 在 13px 正文上是 28.6px 的蓝块，比句子本身还抢眼；
     1.6em 在现在的 14px / 1.75 正文上是 22.4px，落在 24.5px 的行盒里，既不被裁、
     也不再喧宾夺主。浮窗正文是 17px / 1.85（.wall-sheet__msg）⇒ 27.2px，落在 31.45px 的
     行盒里同样不裁、也不撑破（2026-09-24 复核：这条规则悬停卡与浮窗共用，两处都算过）。 */
.wall__quote,
.wall-sheet__quote {
  font-family: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;
  font-size: 1.6em;
  line-height: 1;
  vertical-align: -0.14em;
  margin: 0 0.04em;
  color: rgba(26, 115, 232, 0.5);
}
/* 悬停卡里留言被 clamp 到 10 行时，收尾的引号根本看不到 —— 留一个孤零零的开引号
   反而像排版事故，所以只在「整段看得见」的时候才给收尾引号。 */
.wall__msg-block.is-clipped .wall__quote--close {
  display: none;
}
/* 被截断时把最后一行淡掉 —— 一眼看出「后面还有」，不用先读提示文字。
   用 mask 而不是盖一层渐变：mask 不占布局、不用去猜卡片底色，
   也不会和 line-clamp 依赖的 overflow: hidden 打架。 */
.wall__msg-block.is-clipped .wall__msg {
  -webkit-mask-image: linear-gradient(to bottom, #000 62%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 62%, transparent 100%);
}
.wall__msg-more {
  margin-top: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1a73e8;
}

/* 有留言时卡片放宽一档：留言要在头像右边的窄栏里换行，360px 的卡读起来太憋屈。
   只覆盖 --card-w —— --from-x（头像起飞点）是用 var(--card-w) 算的，
   这里改了它会跟着重算，头像是从新的卡片中心飞回原格的，动画不受影响。
   （JS 的兜底常量 CARD_W 仍是 360：它只在量不到元素时生效，量到就以实测为准。） */
.wall__card.has-message {
  --card-w: 440px;
}

/* 悬停卡只在**激活态**出现 —— 底纹态悬停是上面那块模糊亮斑，不弹卡。
   用能力检测包住，触屏上不启用（iOS 会把第一次 tap 当 hover）。 */
@media (hover: hover) and (pointer: fine) {
  .wall.is-hovercard .wall__tile:hover {
    z-index: 5;
  }
  .wall.is-hovercard .wall__tile:hover .wall__card {
    opacity: 1;
    transform: translate(calc(-50% + var(--shift-x)), calc(-50% + var(--shift-y))) scale(1);
  }
  .wall.is-hovercard .wall__tile:hover .wall__avatar {
    transform: translate(0, 0) scale(1);
  }
}

/* ==========================================================================
   全文卡：点任意一格弹出（桌面与触屏共用）
   --------------------------------------------------------------------------
   结构是固定的三件套，缺一不可：
     .wall-sheet__head   不滚 —— 「这是谁」始终看得见
     .wall-sheet__body   滚   —— 留言全文；再长也只是它自己在滚
     .wall-sheet__foot   不滚 —— 「怎么关」始终看得见
   为什么不整张卡一起滚（以前就是那样）：留言一长，滚下去头像和姓名就没了，
   读到一半不知道在读谁的；「点空白处关闭」也被推到看不见的地方。
   ⚠ 必须 position: fixed（相对**视口**定位），不能用 absolute 相对 hero——
     hero 在横屏下能高到 900px+ 而视口只有 390px，相对 hero 居中的卡片会整张弹到屏幕外。
   这里能用 fixed 是因为它**不在网格里**：网格的祖先带 transform，
    那条链上的 fixed 会退化成相对祖先定位（组件头部注释里提过）。 */
.wall-sheet {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 顶部让开固定导航栏（会长 2026-09-24：「展开卡片上部会被遮挡」）。
     全文卡是**垂直居中**的，卡片一高，顶部就钻到导航栏底下 —— 导航栏 z-index 1000、
     本层 20，激活态它还带一层 90% 白的白纱，于是正好糊住「这是谁」那一行。
     实测 1440×900：卡 860px 高、top = 20px，导航栏下沿 81px ⇒ 顶部被压 61px，
     头像与姓名被盖掉一半。让出来的高度不需要新机制 —— 正文本来就是 overflow-y: auto，
     卡片变矮之后它自己就滚起来（实测正文可视 638 / 内容 803）。
     ⚠ 导航栏实际占位是 **80 + 1**：AppHeader 的 header 恒定带一条 1px 底边框
     （颜色透明而已），所以量到的是 81。少算这 1px，抽屉贴底那一档就会差 1px 压线。 */
  --sheet-top: calc(var(--header-height) + 1px);
  /* 一处留白 = --sheet-gap：padding 与卡片 max-height 必须成对（卡片是垂直居中的，
     只改一半就会让展开卡片顶部重新顶回导航栏底下，而 CSS 不会报错、不报错就看不出）。
     下面 .wall-sheet__card 的 `- 2 * var(--sheet-gap)` 就是这份 padding 的对应项，
     矮屏那档只覆写 --sheet-gap 一个数。 */
  --sheet-gap: 20px;
  padding: calc(var(--sheet-top) + var(--sheet-gap)) var(--sheet-gap) var(--sheet-gap);
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: auto;
  /* 遮罩层不接受触摸滑动：手指落在卡片外面时不应该滚动底下的 hero。
     卡片正文自己声明了 pan-y，留言照样能滚。 */
  touch-action: none;
  animation: wall-in 200ms ease both;
}
.wall-sheet__card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(560px, 100%);
  /* ⚠ 上限写两行：认识 dvh 的浏览器用 dvh（手机地址栏收放时跟得上），
     不认识的忽略第二行、落到 vh。顺序不能反。
     上限还要再减去上下两份 --sheet-gap —— 与上面 .wall-sheet 的 padding 是同一个账：
     容器内容区 = 视口 −(导航栏 + gap)−gap，卡片的 max-height 必须 ≤ 它，否则居中之后
     顶部又会顶回导航栏底下。`2 * var(--sheet-gap)` 让这对数只能一起改。 */
  max-height: calc(100vh - var(--sheet-top) - 2 * var(--sheet-gap));
  max-height: calc(100dvh - var(--sheet-top) - 2 * var(--sheet-gap));
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  overflow: hidden; /* 圆角要能裁住里面的滚动区 */
  animation: wall-sheet-in 260ms cubic-bezier(0.22, 1.32, 0.36, 1) both;
}
@keyframes wall-sheet-in {
  /* 与悬停卡同一套「放大进场」：起点 0.92（原来 0.97 基本看不出在放大） */
  from { opacity: 0; transform: translateY(10px) scale(0.92); }
  to { opacity: 1; transform: none; }
}

/* 显式关闭钮 —— 「点空白处 / 按 Esc」都是要用户先知道的约定，手机上尤其不明显 */
.wall-sheet__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.05);
  color: #64748b;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}
.wall-sheet__close svg {
  width: 16px;
  height: 16px;
}
.wall-sheet__close:hover {
  background: rgba(15, 23, 42, 0.1);
  color: #0f172a;
}

/* 头：不滚 —— 读到一半也永远知道这是谁 */
.wall-sheet__head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 56px 14px 20px; /* 右边给关闭钮让位 */
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  text-align: left;
}
.wall-sheet__avatar {
  flex: none;
  width: 64px;
  height: 64px;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #4fc3f7);
}
.wall-sheet__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #e2e8f0;
}
.wall-sheet__ident {
  min-width: 0;
}
.wall-sheet__name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
}
.wall-sheet__line {
  margin-top: 2px;
  font-size: 0.8125rem;
  color: #64748b;
}
.wall-sheet__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

/* 正文：滚 —— 留言再长也只是这里在滚，头和脚钉住不动 */
.wall-sheet__body {
  /* ⚠ flex-grow 必须是 0（老写法是 1 1 auto）。
     卡片是 max-height 限高、高度由内容决定的 flex 列；grow=1 时这一块会去
     「吃掉」所有剩余空间 —— 留言短的时候它就被撑成一大片空白。
     0 1 auto：内容多就缩（配合 min-height: 0 自己滚起来），内容少就贴着自己那点高度。 */
  flex: 0 1 auto;
  /* ⚠ min-height: 0 不能省。flex 子项默认 min-height: auto —— 内容比容器高时
     它会被内容撑开、把卡片顶破，而不是自己滚起来。 */
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain; /* 滚到底别把整页也带着滚 */
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y; /* 只有这里还允许纵向滑动（遮罩那层是 none） */
  padding: 18px 20px;
  text-align: left;
}
/* 正文分「节」：寄语一节、荣誉明细一节。这是这张卡里唯一的层次来源 ——
   在此之前，一小段灰字留言和几十枚彩色胶囊直接挨在一起，留言被色块整个淹掉
   （会长 2026-09-24：「寄语部分很丑，而且和别的没有层次区分」）。
   `.wall-sheet__sec + .wall-sheet__sec` 只在**两节都在**时才画线，
   所以「只有荣誉」的绝大多数人（141 人里 137 人没有留言）不会多出一条孤线。 */
.wall-sheet__sec + .wall-sheet__sec {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(15, 23, 42, 0.07);
}
/* 小节标题：11px、字距拉开、灰。
   前面那一小段主色竖条是这一节**唯一**的颜色 —— 留言被裁定为无色底，
   颜色就得由标题来给，否则整节仍是灰的，等于没分层。 */
.wall-sheet__label {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 9px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: #94a3b8;
}
.wall-sheet__label::before {
  content: '';
  flex: none;
  width: 3px;
  height: 10px;
  border-radius: 2px;
  background: var(--primary);
}

/* 正文排版是给「读一段话」的，不是给「扫一眼」的：17px / 1.85 行距 / 深一档的字色。
   字号刻意比下面的荣誉胶囊（0.72rem）重得多 —— 寄语是这张卡的主句，
   原来和胶囊同为 15px 灰字，读者根本分不出哪句是「人说的话」。
   悬停卡那套 13px / 1.6 是短句用的，拿来读 200 字很累。 */
.wall-sheet__msg {
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.85;
  font-weight: 500;
  color: #1e293b;
  white-space: pre-wrap; /* 作者自己敲的换行留着 */
  overflow-wrap: anywhere;
}
/* 浮窗里的战绩：**一条一行**的清单，不再是胶囊。
   为什么不留胶囊：明细是「🥇第10届天梯赛团体国家级一等奖」这种 25 字长句，
   26 条 flex-wrap 起来就是一片蓝云 —— 分不出条目边界，也扫不出拿了几个系列
   （会长 2026-09-24：「奖项、tag 堆在一起，没有布局」）。
   每行开头的 🥇/🥈/🥉/🏆 就是它的项目符号，所以不再另加 bullet。
   竖线 + 缩进把这组圈成一块，与寄语那种「无色底 + 大引号」在形态上区分开。 */
.wall-sheet__group + .wall-sheet__group {
  margin-top: 14px;
}
.wall-sheet__group-title {
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}
.wall-sheet__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0 0 0 10px;
  border-left: 2px solid rgba(26, 115, 232, 0.14);
  list-style: none;
}
.wall-sheet__item {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #334155;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}


/* 脚：不滚 —— 「怎么关」不会随着正文滚走 */
.wall-sheet__foot {
  flex: none;
  padding: 10px 20px;
  /* 全面屏底部的横条别压住提示 */
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  text-align: center;
}
.wall-sheet__hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ── 手机（<600px）：从底部升起的抽屉 ──
   居中弹窗在窄屏上，上下留白纯属浪费；贴底抽屉一屏能多读三四行。 */
@media (max-width: 599px) {
  .wall-sheet {
    padding: 0;
    align-items: flex-end; /* 贴着底边 */
  }
  .wall-sheet__card {
    width: 100%;
    /* 同样是「顶部让开导航栏」：抽屉贴底，所以约束落在高度上 ——
       88dvh 在 568px 高的机器上会让抽屉顶部伸到导航栏底下 12px。
       减掉 --sheet-top（80 + 1px 边框）之后顶部落在导航栏下沿，但**紧贴着**它；
       会长 2026-09-24：「内容多时和顶部贴在一起了，留点空隙」→ 先让 16px，
       再要求「上侧留白再大点」→ 24px（约等于抽屉圆角 20px 的呼吸量）。
       内容多时由正文自己滚，不再往上顶。 */
    /* 贴底抽屉没有下/侧 padding（上面 .wall-sheet 的 padding: 0），这 24px 只是**顶部**空隙，
       所以是 -24 而不是 -2 * var(--sheet-gap)：改 --sheet-gap 不影响这一档，有意如此。 */
    max-height: calc(100vh - var(--sheet-top) - 24px);
    max-height: calc(100dvh - var(--sheet-top) - 24px);
    border-radius: 20px 20px 0 0;
  }
  .wall-sheet__head {
    padding: 16px 56px 12px 16px;
  }
  .wall-sheet__avatar {
    width: 56px;
    height: 56px;
  }
  .wall-sheet__body {
    padding: 16px;
  }
  .wall-sheet__foot {
    padding-left: 16px;
    padding-right: 16px;
  }
}

/* ── 矮屏（横屏手机 / 拉扁的桌面窗口）：把上下留白全压掉，正文多显示几行 ──
   限定 min-width 是**故意**的：又窄又矮的窗口（≈390×480）仍该走上面那个贴底抽屉，
   这里只处理「宽但矮」的横屏形态。 */
@media (max-height: 520px) and (min-width: 600px) {
  .wall-sheet {
    /* 矮屏把留白压到 10px，但**导航栏那 80px（+1px 边框）不能省**：这一档最容易出
       「上部被遮挡」（520px 高的窗口里导航栏占 15%）。让出来的空间从正文里扣，
       头上那条线照旧看得见。
       只改这一个数就够：padding 与卡片 max-height 都由基档的公式按 --sheet-gap 算。 */
    --sheet-gap: 10px;
  }
  .wall-sheet__card {
    width: min(640px, 100%);
    border-radius: 14px;
  }
  .wall-sheet__head {
    padding: 12px 52px 10px 14px;
  }
  .wall-sheet__avatar {
    width: 48px;
    height: 48px;
  }
  .wall-sheet__body {
    padding: 12px 14px;
  }
  .wall-sheet__msg {
    font-size: 0.875rem;
    line-height: 1.75;
  }
  .wall-sheet__foot {
    padding: 8px 14px;
  }
}

/* ==========================================================================
   开关按钮：在墙之上（z-index: 30），且不在 .hero-inner 里。
   位置分两套（见下面的断点）：
     · 桌面：底部居中的药丸 —— 那个位置本来就是空的；
     · ≤991px：**左下角**的圆形图标钮。hero 在这一档变成单列，文案与轮播竖着排下来，
       下面这两样都会跟「底部居中 / 右下」抢位置：
         · slider 的圆点是 text-align:center 的，落在底部居中（实测 375px 时占 x 91–283）；
         · 「加入我们」浮动按钮固定在视口右下（实测 375×667 时正好压住 hero 的右下角）。
       左下角两边都让开，是唯一不打架的位置。
       这一档同时收起文字只留图标，按钮也就不必为了塞下文案而变宽。
   ========================================================================== */
.wall-toggle {
  position: absolute;
  left: 50%;
  bottom: 24px;
  z-index: 30;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px; /* 触控目标下限（Apple HIG） */
  padding: 0 18px 0 16px;
  border: 1px solid rgba(26, 115, 232, 0.24);
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
  color: #1a73e8;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
  transition:
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 200ms ease,
    background 200ms ease,
    color 200ms ease,
    border-color 200ms ease;
}
/* 激活态：反色，一眼能看出「现在是墙在前面」 */
.wall-toggle.is-on {
  background: #1a73e8;
  border-color: #1a73e8;
  color: #fff;
  box-shadow: 0 6px 20px rgba(26, 115, 232, 0.3);
}
.wall-toggle:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.16);
}
.wall-toggle.is-on:hover {
  box-shadow: 0 10px 26px rgba(26, 115, 232, 0.36);
}
.wall-toggle:active {
  transform: translateX(-50%) scale(0.97);
}
.wall-toggle__icon {
  display: block;
  flex: none;
  width: 16px;
  height: 16px;
}
.wall-toggle__text {
  white-space: nowrap;
}
@media (max-width: 991px) {
  .wall-toggle {
    left: 16px; /* 取消居中：靠左下，避开 slider 居中的圆点与右下角的「加入我们」 */
    right: auto;
    bottom: 16px;
    /* 手机浏览器底部那条地址栏会盖住视口：hero 用的是 100vh（= 大视口，地址栏收起时的
       高度），真正看得见的只有 100svh。把按钮再往上顶「地址栏高度」那么多，它才落在
       首屏内 —— 否则真机上要往下滑才看得见这个按钮（实测 390×844 模拟器里它在 784px，
       真机地址栏一盖就出屏）。
       不支持 svh 的浏览器会丢掉这条 calc，自动退回上面那行 16px。 */
    bottom: calc(16px + 100vh - 100svh);
    transform: none;
    width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
  }
  .wall-toggle:hover {
    transform: translateY(-2px);
  }
  .wall-toggle:active {
    transform: scale(0.96);
  }
  .wall-toggle__text {
    display: none; /* 只留图标 */
  }
  .wall-toggle__icon {
    width: 18px;
    height: 18px;
  }
}

/* 769–991px 这一档要单独处理：
   它虽然也是单列（≤992px 单列），但 hero 仍是 min-height: 100vh 且内容撑得比视口高
   （实测 900×800 时 hero 高约 1120px），贴在 hero 底部的按钮就落到首屏之外了。
   好消息是这一档 hero 的上内边距是 header + 120px，顶上有一大片空白 —— 挪上去正好。 */
@media (min-width: 769px) and (max-width: 991px) {
  .wall-toggle {
    /* 高度只认令牌（与 AppHeader 的 height / --sheet-top 同一份）：兜底的 80px 是第三份
     字面量，令牌改名时它会静默顶上、当天看不出差别。 */
  top: calc(var(--header-height) + 24px);
    bottom: auto;
  }
}

/* ==========================================================================
   无障碍：尊重「减弱动态效果」
   ========================================================================== */
@media (prefers-reduced-motion: reduce) {
  .wall__drift-x,
  .wall__drift-y {
    animation: none;
  }
  .wall,
  .wall-sheet {
    animation: none;
  }
  .wall__img,
  .wall__card,
  .wall__avatar,
  .wall-toggle {
    transition: none;
  }
}
</style>

<!-- ==========================================================================
     非 scoped：头像墙激活时，给顶部固定导航栏加一层「白纱 + 阴影」。

     为什么写在**这个组件**里而不是 AppHeader.vue：
     这条规则完全属于头像墙这个功能，放在这里它就会随组件一起被删除，
     AppHeader 一个字符都不用改（回滚时不留死代码）。

     选择器用 `#app > header` 而不是 `header`：站内还有 .page-hero 之类的
     <header> 元素，用 id 限定到 App.vue 里的那个固定顶栏，且 id 的特异性
     足以压过 AppHeader 自己的 `header.scrolled[data-v-*]`。

     长相直接沿用顶栏「已滚动」那套（同样的 rgba(255,255,255,.88) + blur），
     只把阴影加重一档 —— 人像墙比纯色背景「吵」得多，靠阴影把栏和墙分开。
     ========================================================================== -->
<style>
body.hero-wall-on #app > header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px) saturate(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(1.1);
  border-bottom-color: rgba(15, 23, 42, 0.06);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 8px 28px rgba(15, 23, 42, 0.14);
}

/* 把顶栏那条「掏空」，只留真正可点的元素（底纹态与激活态都放开）。
   横屏时这一条占视口 20%+（实测 844×390 是 22%），不放开的话整片墙在顶部那一带
   都收不到悬停。放开后有两个副作用，都在 JS 里挡掉了（见 onGridClick 与 clampCard）：
   点顶栏空白处不会误弹成员卡，悬停卡也不会钻到导航栏底下去。 */
body.hero-wall-present #app > header {
  pointer-events: none;
}
body.hero-wall-present #app > header a,
body.hero-wall-present #app > header button {
  pointer-events: auto;
}

/* 成员卡打开时，把「加入我们」那个 fixed 悬浮球藏掉。
   它在 App.vue 里，和成员卡是两个互不知情的层 —— 不处理的话它会直接盖在卡上。
   （成员墙自己的开关按钮是在组件里用 v-if 藏掉的，不需要这条。） */
body.hero-wall-sheet .floating-join-button {
  opacity: 0;
  pointer-events: none;
  transition: opacity 160ms ease;
}

/* ── 让 hero 在手机上至少占满一屏 ──
   ≤768px 时 .hero 是 min-height: auto（高度由内容撑）。实测：
     390×844 → hero 683px，底部露出 168px 的 About 区
     430×932 → hero 708px，露出 228px
     375×667 → hero 673px，不露（矮屏反而没问题）
   —— 就是「有的时候会露一点」的来源：屏幕越高露得越多。
   墙在场时把 hero 撑到一屏高，那条缝就没了。
   用 100vh（静态值 = 大视口）而不是 dvh：dvh 会随地址栏收放实时变，
   墙的 ResizeObserver 会跟着不停重算几何、漂移动画不停重启。
   100vh 在地址栏收放时盒子不动，墙一次都不用重排。
   放在这里（而不是 HomeView）是为了让这条规则随组件一起被删除。 */
@media (max-width: 768px) {
  body.hero-wall-present .hero {
    min-height: 100vh;
    /* 内容**顶部对齐**，不要居中。
       hero 被撑到一屏高之后，.hero 原本的 align-items: center 会把内容在上下各留出
       ~80px 空白：实测「写码码」被推到离顶 207px，于是下方的轮播圆点（706px）和
       成员墙按钮（784px）都掉到首屏之外，手机上得往下滑才看得见。
       顶部对齐后标题回到 126px（= 被撑高之前的位置），多出来的空间全留在下方 ——
       那一片是墙的空白区，没有内容需要露出来。 */
    align-items: flex-start;
  }
}
</style>
