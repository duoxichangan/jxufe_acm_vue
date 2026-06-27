import { ref, onMounted } from 'vue'
import { useJson } from './useJson'

/**
 * 最新动态：读取 /data/actions.json，按日期倒序取最近 5 条。
 * 摘要直接来自 JSON（不再 fetch action HTML）。
 */
export function useNews() {
  const { data: raw, loading, error, load } = useJson('/data/actions.json', {
    initial: [],
    auto: false
  })
  const newsList = ref([])

  onMounted(async () => {
    await load()
    newsList.value = (raw.value || [])
      .map((it) => ({ ...it, date: new Date(it.date) }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map((it) => ({
        ...it,
        day: it.date.getDate(),
        month: it.date.toLocaleDateString('zh-CN', { month: 'short' })
      }))
  })

  return { newsList, loading, error }
}
