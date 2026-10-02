import { computed } from 'vue'
import { useJson } from './useJson'

/**
 * 竞赛信息页（ContestView.vue）与近期赛事页（UpcomingView.vue）共用的取数入口。
 * ---------------------------------------------------------------------------
 * 为什么单拎出来：这两页要的是**同一份数据** —— 竞赛卡片、全年赛程、看板读
 * competitions.json，近期赛事那张表读 schedule.json + schedule.auto.json + platforms.json。
 * 原先只有竞赛信息页一个落点，四行 `useJson` 写在哪儿都行；2026-10-02 会长把近期赛事
 * 拆成独立页以后，两页各抄一遍就会出现「加了一份数据只改了一页」的静默差 ——
 * 本仓库为这类事已经立过好几次规矩（见 utils/contestTaxonomy.js 的头注释）。
 *
 * 三件事在这里定死，调用方不要再自己判：
 *   · `loading`          四份任一在路上 —— 给页首骨架屏用；
 *   · `scheduleLoading`  赛程那三份任一在路上 —— 给 UpcomingSchedule / UpcomingBoard 的
 *                        `:loading`。**不能拿 `loading` 顶替**：competitions.json 单独慢时，
 *                        赛程表不该跟着一直转圈（它一个字都不需要那份数据）。
 *   · `error`            **只有 competitions.json 的失败**。页面上的「加载失败」说的是竞赛卡片
 *                        那一份；赛程那两份缺任何一份都得照常降级显示（手写层 / 自动层各自独立，
 *                        离线构建时 schedule.auto.json 整份都不存在）。
 *
 * 返回值与 `useJson` 逐字同形（`data` 是 ref），故页面里的 template 写法与原来完全一致。
 */
export function useScheduleData() {
  const {
    data: competitions,
    loading: competitionsLoading,
    error,
  } = useJson('/data/competitions.json', { initial: [] })

  const { data: schedule, loading: manualLoading } = useJson('/data/schedule.json', {
    initial: { items: [], pending: [] },
  })

  const { data: autoSchedule, loading: autoLoading } = useJson('/data/schedule.auto.json', {
    initial: { items: [] },
  })

  const { data: platforms, loading: platformsLoading } = useJson('/data/platforms.json', {
    initial: { items: [] },
  })

  const scheduleLoading = computed(
    () => manualLoading.value || autoLoading.value || platformsLoading.value
  )
  const loading = computed(() => scheduleLoading.value || competitionsLoading.value)

  return { competitions, schedule, autoSchedule, platforms, loading, scheduleLoading, error }
}
