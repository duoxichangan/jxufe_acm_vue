import { ref, onMounted } from 'vue'
import { useJson } from './useJson'

/** 大事记：读取 /data/news.json，置顶事件单独抽出，其余按年份倒序分组。 */
export function useTimeline() {
  const { data: raw, load } = useJson('/data/news.json', { initial: [], auto: false })
  const topEvents = ref([])
  const yearGroups = ref([])
  const loading = ref(true)

  onMounted(async () => {
    await load()
    const items = (raw.value || []).map((it) => ({ ...it, date: new Date(it.date) }))

    topEvents.value = items.filter((it) => it.isTop)

    const groups = {}
    for (const it of items) {
      if (it.isTop) continue
      const y = it.date.getFullYear()
      ;(groups[y] ||= []).push({ ...it, dateStr: it.date.toLocaleDateString('zh-CN') })
    }
    yearGroups.value = Object.keys(groups)
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        items: groups[year].sort((a, b) => b.date - a.date)
      }))
    loading.value = false
  })

  return { topEvents, yearGroups, loading }
}
