import { ref, onMounted } from 'vue'
import { useJson } from './useJson'

/**
 * 最新动态：读取 /data/news.json，只保留 2025 年并按日期倒序。
 * 摘要直接来自 JSON（不再 fetch action HTML）。
 */
export function useNews() {
  const { data: raw, loading, error, load } = useJson('/data/news.json', {
    initial: [],
    auto: false
  })
  const newsList = ref([])

  onMounted(async () => {
    await load()
    newsList.value = (raw.value || [])
      .map((it) => ({ ...it, date: new Date(it.date) }))
      .filter((it) => it.date.getFullYear() === 2025)
      .sort((a, b) => b.date - a.date)
      .map((it) => ({
        ...it,
        day: it.date.getDate(),
        month: it.date.toLocaleDateString('zh-CN', { month: 'short' })
      }))
  })

  return { newsList, loading, error }
}
