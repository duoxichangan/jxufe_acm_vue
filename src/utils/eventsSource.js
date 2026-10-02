/**
 * 大事记数据源读写封装 —— public/data/events/ 的唯一入口。
 *
 *   top.json       置顶卡片（扁平数组）
 *   <year>.json    该年全部数据：{ cards: [...], articles: { <id>: {...} } }
 *
 * 没有索引文件：目录里有哪些年份由 discoverYears() 在运行时自动探出来，
 * 年份 / 月份 / 分类 / 文章定位 / 首页最新动态全部从读到的文件实时算出。
 *
 * 一次年份文件请求就能同时拿到「卡片」与「文章正文」；
 * 页面内缓存已加载的年份文件，所以从时间轴点进文章时正文已在内存里，无需再发请求。
 */
export const EVENTS_DIR = '/data/events'

/** 取数失败留下的清单（url），与 honorPills 的 missingHonorSources 同口径：
    「降级可以，但必须留下信号」—— 原先 404 会被静默换成空数据，页面上就表现为
    「那一年没有大事记」，控制台一片安静，排查时没有任何线索。 */
export const missingEventSources = []

/** 抛错版取数：非 2xx 也要 throw（JSON 解析失败、网络错误本来就会 throw）。 */
const fetchJsonStrict = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 取数 + 失败留痕：失败返回 fallback，并把这次失败记进 missingEventSources（同一 url 只报一次）。 */
const fetchJson = async (url, fallback, label) => {
  try {
    return await fetchJsonStrict(url)
  } catch (e) {
    if (!missingEventSources.includes(url)) {
      missingEventSources.push(url)
      console.warn(
        `[eventsSource] 读不到 ${label || url}（${e.message}）—— 这部分内容会缺席，` +
          "请检查 public/data/events/ 与部署时的上传清单"
      )
    }
    return fallback
  }
}

/** 每年探测的批量大小（并发发起，一次往返） */
const PROBE_BATCH = 24
/** 向下最多探测多少批（防止异常情况下无限循环） */
const MAX_BATCHES = 20

const cache = {
  top: null,
  yearsPromise: null, // 缓存 Promise，避免并发重复探测
  years: null,
  yearData: new Map() // year → { cards, articles }
}

/**
 * 自动探出 events/ 下存在哪些年份文件。
 *
 * 静态站无法列目录，所以从「今年」开始向上探 1 年、向下分批并行探（HEAD，无响应体）：
 * 某一批的末尾连续两年都不存在就认为到底了。全部结果缓存，一次会话只探一次。
 *
 * 约定：年份文件连续存放。新增 <年>.json 后无需任何配置，刷新即可见。
 * @returns {Promise<string[]>} 年份倒序，如 ['2026','2025',…]
 */
export function discoverYears() {
  if (cache.years) return Promise.resolve(cache.years)
  if (cache.yearsPromise) return cache.yearsPromise

  const exists = async (y) => {
    const url = `${EVENTS_DIR}/${y}.json`
    try {
      let r = await fetch(url, { method: 'HEAD' })
      // 少数服务器不支持 HEAD，退化成只取 1 字节
      if (r.status === 405 || r.status === 501) r = await fetch(url, { headers: { Range: 'bytes=0-0' } })
      if (!r.ok) return false
      // 关键：很多托管会用 SPA 兜底，把不存在的路径也返回 200 + index.html，
      // 必须用 content-type 排除，否则会误判所有年份都存在
      return /json/i.test(r.headers.get('content-type') || '')
    } catch {
      return false
    }
  }

  cache.yearsPromise = (async () => {
    const now = new Date().getFullYear()
    const found = new Set()

    // 向上 1 年：新一年的文件可能已经准备好
    if (await exists(now + 1)) found.add(now + 1)

    for (let batch = 0, top = now; batch < MAX_BATCHES; batch++, top -= PROBE_BATCH) {
      const years = Array.from({ length: PROBE_BATCH }, (_, i) => top - i)
      const hit = await Promise.all(years.map(exists))
      let any = false
      years.forEach((y, i) => {
        if (hit[i]) {
          found.add(y)
          any = true
        }
      })
      // 批尾连续两年都没有 → 到底了
      const tail = years.slice(-2)
      if (!any || tail.every((y) => !found.has(y))) break
    }

    // 一律转成字符串：调用方（loadArticle / useTimeline）用的都是 '2026' 这种字符串
    cache.years = [...found].sort((a, b) => b - a).map(String)
    cache.yearsPromise = null
    return cache.years
  })()

  return cache.yearsPromise
}

/** 置顶卡片，进程内缓存 */
export async function loadTop() {
  if (!cache.top) {
    const data = await fetchJson(`${EVENTS_DIR}/top.json`, null, 'top.json')
    // 失败不写缓存：否则一次瞬时失败会把「没有置顶」钉死整个会话，下次进页面也不重试
    if (data) cache.top = data
  }
  return cache.top || []
}

/** 某一年的全部数据 { cards, articles }，进程内缓存 */
export async function loadYear(year) {
  const y = String(year)
  if (cache.yearData.has(y)) return cache.yearData.get(y)
  const data = await fetchJson(`${EVENTS_DIR}/${y}.json`, null, `${y}.json`)
  /* 失败：返回空数据让调用方照常渲染，但**不写缓存** —— 用户再点一次这一格会重新请求。
     原先失败的空数据会被写进 cache.yearData，把「这一年没有大事记」钉死整个会话。 */
  if (!data) return { cards: [], articles: {} }
  const norm = { cards: data.cards || [], articles: data.articles || {} }
  cache.yearData.set(y, norm)
  return norm
}

/**
 * 一篇文章的正文。
 * 文章 id 一律以年份开头（如 2026-4-18-gplt、2011-lanqiao-provincial），
 * 所以取前 4 位就能定位到年份文件，不需要任何映射表。
 * @returns {Promise<object|null>} 文章不存在时返回 null
 */
export async function loadArticle(id) {
  const m = String(id || '').match(/^(\d{4})/)
  if (!m) return null
  const year = m[1]
  const years = await discoverYears()
  if (!years.includes(year)) return null
  const data = await loadYear(year)
  return data.articles[id] || null
}
