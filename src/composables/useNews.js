import { markHomeReady } from '../utils/startup.js'
import { ref, onMounted } from 'vue'
import { discoverYears, loadTop, loadYear } from '../utils/eventsSource.js'

/**
 * 首页「最新动态 / 协会大事记」：取最近的 5 条新闻。
 *
 * 没有索引文件：年份自动探测，最多读 3 个年份文件就能凑够 5 条新闻；
 * 置顶新闻不在年份文件里，单独从 top.json 拼进来。
 *
 * 输出项形状（id / date / day / month / title / summary），
 * 其中 id 就是卡片 link 的值 —— 直接拼成 /post/<id> 即可。
 */
const NEED = 5
const MAX_YEARS = 3

/**
 * 挑选最近的 N 条新闻（纯函数，便于测试与数据比对）。
 * @param {Array} fromYears 从年份文件里收集到的新闻卡片
 * @param {Array} tops      top.json 的全部节点
 */
export function selectLatestNews(fromYears = [], tops = [], need = NEED) {
  // 置顶新闻拼在末尾：稳定排序后同日期时置顶项排在后面，
  // 与旧版「按 actions.json 顺序取 N 条」的结果一致
  const pool = [...fromYears, ...tops.filter((n) => n.kind === 'news')]
  return pool
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, need)
    .map((n) => {
      const d = new Date(n.date)
      return {
        id: String(n.link || ''),
        date: d,
        day: d.getDate(),
        month: d.toLocaleDateString('zh-CN', { month: 'short' }),
        title: n.title,
        summary: n.tagline
      }
    })
}

/** 从最新年份往下取新闻卡片，凑够 need 条为止（最多读 MAX_YEARS 个年份文件） */
export async function collectNews(years, need = NEED, maxYears = MAX_YEARS) {
  const pool = []
  for (const y of years.slice(0, maxYears)) {
    const data = await loadYear(y)
    pool.push(...data.cards.filter((c) => c.kind === 'news'))
    if (pool.length >= need) break
  }
  return pool
}

export function useNews() {
  const newsList = ref([])
  const loading = ref(true)
  const error = ref(false)

  onMounted(async () => {
    try {
      const [years, tops] = await Promise.all([discoverYears(), loadTop()])
      newsList.value = selectLatestNews(await collectNews(years), tops)
    } catch (e) {
      console.error('加载最新动态失败:', e)
      error.value = true
    } finally {
      loading.value = false
      markHomeReady()
    }
  })

  return { newsList, loading, error }
}
