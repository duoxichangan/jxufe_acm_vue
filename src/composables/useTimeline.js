import { ref, computed, onMounted } from 'vue'
import { discoverYears, loadTop, loadYear } from '../utils/eventsSource.js'

/**
 * 大事记数据源（年份自动发现 + 按年懒加载）
 *
 * 没有索引文件：年份清单由 discoverYears() 探出，月份 / 分类计数
 * 随年份文件加载实时派生。数据布局见 utils/eventsSource.js。
 *
 * 加载策略：首屏取 top + 最新的两个年份；其余年份在用户点击时才拉。
 *
 * 年份文件内节点 shape（year 由文件名给出）：
 *   { kind, date, category, title, tagline, link }
 * 归一化后节点额外带 year / dateStr / key，且 date 为 Date 对象。
 */

/** `"2017-09"` 这种只有年月的精度 → 「2017年9月」；其它精度返回空串（交给 toLocaleDateString） */
const monthOnlyStr = (s) => {
  const m = typeof s === 'string' ? /^(\d{4})-(\d{2})$/.exec(s) : null
  return m ? `${m[1]}年${Number(m[2])}月` : ''
}

/** 年份文件内容 → 统一节点（纯函数，便于测试与比对） */
export function buildNodes(nodes = [], year = '') {
  return nodes.map((n) => {
    const kind = n.kind || 'event'
    const d = n.date ? new Date(n.date) : null
    const valid = d && !isNaN(d.getTime())
    return {
      kind,
      year: String(year),
      date: valid ? d : null,
      category: n.category || 'other',
      title: n.title || '',
      tagline: n.tagline || '',
      link: n.link || '',
      key: `${kind}|${n.link || ''}|${n.title || ''}`,
      // 无具体日期的节点（如天梯赛 2018 届）回退显示年份；
      // 只有年月的（"2017-09"，如协会成立）不能走 Date —— ISO 会补成 1 日、显示成「2017/9/1」，
      // 那种精度数据里没有，所以直接按字符串格式化（顺带免掉时区把月份挪走的风险）。
      dateStr: valid ? monthOnlyStr(n.date) || d.toLocaleDateString('zh-CN') : `${year}年`
    }
  })
}

/** 有日期的按日期倒序，无日期的排最后 */
export const byDateDesc = (a, b) => {
  const ta = a.date ? a.date.getTime() : -Infinity
  const tb = b.date ? b.date.getTime() : -Infinity
  return tb - ta
}

/** 一组节点里出现过的月份（倒序） */
export function monthsOf(nodes = []) {
  return [
    ...new Set(
      nodes
        .filter((n) => n.date)
        .map((n) => n.date.getMonth() + 1)
        .filter((m) => Number.isFinite(m))
    )
  ].sort((a, b) => b - a)
}

export function useTimeline() {
  const years = ref([]) // 自动探出的全部年份（倒序）
  const topEvents = ref([])
  const yearGroups = ref([]) // [{ year, items }]，只含已加载的年份
  const loadedYears = ref([])
  const pendingYears = ref([]) // 正在懒加载的年份
  const loading = ref(true) // 仅首屏
  const error = ref(false)

  const cache = new Map() // year → 归一化后的节点数组

  function refreshGroups() {
    yearGroups.value = [...loadedYears.value]
      .sort((a, b) => Number(b) - Number(a))
      .map((y) => ({ year: y, items: [...cache.get(y)].sort(byDateDesc) }))
  }

  /** 读不到的年份（供页面按需提示）—— 失败的年份进不了 loadedYears，光看列表分辨不出
      「这年没事件」和「这年没拉下来」，所以单独记一份。 */
  const failedYears = ref([])

  /** 懒加载某一年（已加载则直接返回） */
  async function loadOneYear(year) {
    const y = String(year)
    if (cache.has(y)) return
    if (!pendingYears.value.includes(y)) pendingYears.value = [...pendingYears.value, y]
    try {
      // 年份文件是 { cards, articles }：时间轴只用 cards，
      // 正文随文件一起到手并缓存在 eventsSource 里，点进文章无需再请求
      const data = await loadYear(y)
      cache.set(y, buildNodes(data.cards, y))
      if (!loadedYears.value.includes(y)) loadedYears.value = [...loadedYears.value, y]
      refreshGroups()
    } catch (e) {
      /* 失败必须留痕（原先只有 finally，异常直接往外抛：年份静默不出现、控制台一条
         无人接管的 rejection，用户分不清「这年没事件」和「这年没拉下来」）。
         这里不写 cache，下一次点击还会重试。 */
      if (!failedYears.value.includes(y)) failedYears.value = [...failedYears.value, y]
      console.warn(`[useTimeline] ${y} 年的大事记没读到：`, e)
    } finally {
      pendingYears.value = pendingYears.value.filter((x) => x !== y)
    }
  }

  /** 加载全部年份（供侧栏「全部」使用；并发发起，逐年出现）
      allSettled 而不是 all：调用方是 AllActionView 的 showAll() —— 它既不接返回值也不 catch，
      单年失败会变成一条未处理的 rejection。loadOneYear 自己已经不抛了，这里是第二道保险。 */
  function loadAllYears() {
    return Promise.allSettled(years.value.map((y) => loadOneYear(y)))
  }

  // ── 以下全部由已加载的数据实时派生，不依赖任何索引文件 ──

  /** 侧栏年份树：年份来自探测，月份来自该年已加载的数据（未加载则为空） */
  const yearMonthTree = computed(() => {
    const loaded = new Set(loadedYears.value) // 依赖：某年加载完成后重算月份
    return years.value.map((y) => ({ year: Number(y), months: loaded.has(y) ? monthsOf(cache.get(y)) : [] }))
  })

  /** 分类计数：已加载年份的卡片 + 置顶卡片 */
  const categories = computed(() => {
    const counts = {}
    for (const y of loadedYears.value) {
      for (const n of cache.get(y) || []) counts[n.category] = (counts[n.category] || 0) + 1
    }
    for (const n of topEvents.value) counts[n.category] = (counts[n.category] || 0) + 1
    return counts
  })

  onMounted(async () => {
    try {
      const [ys, tops] = await Promise.all([discoverYears(), loadTop()])
      years.value = ys
      // 置顶节点的 year 由日期推出（top.json 不带 year）
      topEvents.value = buildNodes(tops, '').map((t) => ({
        ...t,
        year: t.date ? String(t.date.getFullYear()) : ''
      }))
      // 首屏年份取最新的两个
      await Promise.all(ys.slice(0, 2).map((y) => loadOneYear(y)))
    } catch (e) {
      console.error('加载大事记失败:', e)
      error.value = true
    } finally {
      loading.value = false
    }
  })

  return {
    years,
    yearMonthTree,
    categories,
    topEvents,
    yearGroups,
    loadedYears,
    failedYears,
    loadYear: loadOneYear,
    loadAllYears,
    pendingYears,
    loading,
    error
  }
}
