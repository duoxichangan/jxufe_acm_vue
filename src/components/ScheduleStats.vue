<script setup>
/**
 * 赛程仪表板（2026-10-02 抽出）—— **竞赛信息页那块看板专属**。
 *
 * ⚠ 它原先挂在两处（看板 + 独立页 /upcoming 的完整表）。2026-10-02 会长：
 *   「**在近期比赛的详情页不要显示这个 class="sched-stats sched-stats--catalog upcoming__stats"**」
 *   → 完整表页**不再渲染**它（`UpcomingSchedule.vue` 里的 import 与模板都已撤掉，只留墓碑注释），
 *   现在唯一的挂点是 `UpcomingBoard.vue`（`class="board__stats"`）。
 *   ⚠ 组件**没有跟着删**：它是成型的结构 + 全局样式体（styles/schedule-stats.css），
 *     而且完整表页的**芯片计数仍走同一个 scheduleStats()** —— 口径仍是一份。
 *     要把它挂回完整表：在 `UpcomingSchedule.vue` 里 import 回来 + 在 `.upcoming__body` 里加一个
 *     `<ScheduleStats :stats :competitions :platforms />` 即可，样式不用重写。
 *
 * 为什么当初抽成一个组件：会长那天连着两条要求 —— ①「做成类似仪表板的东西」
 * ②「线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」。格子从 7 个涨到十几个
 * （每个赛事、每个平台各一格），两个组件再各内联一份模板，必然改一处忘一处、
 * 两页数字长得不一样 —— 而这两处本来就该永远一致。
 *
 * ⚠ 现在只有**一条带**：一格一个赛事（线下）+ 一格一个平台（线上），都带 logo。
 *   原先它上面还有一条「时间与状态」带（场待办 / 本月 / 下月 / 报名中 / 已收起 / 时间待定），
 *   2026-10-02 会长要求撤掉，原话：「**去除第一行的那些场待办 35 本月 25 下月 6 报名中**」。
 *   那几个数 `src/utils/scheduleView.js` 的 `scheduleStats()` **仍然照算**（口径只有一份、
 *   回归集也仍在钉它），只是不再摆在这块仪表板上：
 *     · 「已自动收起 N 场结束的」搬回**完整表页脚**（`UpcomingSchedule.vue` 的 `footParts`）；
 *     · 场待办 / 本月 / 下月 / 报名中 目前全站不再显示；
 *     · 「时间待定 N 条」本来就有下面那个 .upcoming__pending 列表，不缺。
 *   要整行拿回来：在这个模板里恢复 6 个 `<span class="sched-stat sched-stat--total|month|next|signup|closed|pending">`
 *   （每个 `<em>标签</em><b>数字</b>`），样式类在 `src/styles/schedule-stats.css` 里同样按
 *   「已撤」注释留着，不用重写。
 *
 * 口径**全部**在 src/utils/scheduleView.js 的 `scheduleStats()`：恒按全部未来场次算，
 * 与筛选无关（勾掉几个标签时这里的数字不跳，「勾选后显示几场」由页脚单独说）。
 * 样式体在全局 src/styles/schedule-stats.css（.sched-stats / .sched-stat），这里只出结构。
 * 每格带 `data-stat="contest-<slug>"` / `"platform-<slug>"` —— 回归与页面探针按它取数，
 * 文案改了断言也不会失效。
 */
import { computed } from 'vue'
import { buildIconIndex, categoryVars, contestLabel, initialOf } from '../utils/scheduleView.js'

const props = defineProps({
  /** scheduleView.scheduleStats() 的返回值（这里只用得到 byContest / byPlatform） */
  stats: { type: Object, default: () => ({}) },
  /** 与筛选 chips、表格行**同一张**图标表：competitions.json + platforms.json */
  competitions: { type: Array, default: () => [] },
  platforms: { type: Array, default: () => [] },
})

const icons = computed(() => buildIconIndex(props.competitions, props.platforms))
/** 显示名与筛选 chip、表格行走**同一个**兜底顺序（图标表 → 中文名表 → slug），见 contestLabel */
const labelOf = (slug) => contestLabel(icons.value, slug)
const imageOf = (slug) => icons.value.get(slug)?.image || ''
/** 没图标的赛事（协会自办 / 校赛…）给一枚首字母小圆片（判据与表格行、筛选 chip 同一个 initialOf） */
const initialOfSlug = (slug) => initialOf(labelOf(slug))

/** 带 logo 的格子：`--stat-color` 取该格所属类型的色（线下=该赛事最常见的类型色，
    线上=线上赛色），`--cat-soft` 给首字母圆片当底色 —— 与行左边框、筛选 chip 同源。 */
const tileStyle = (cat) => ({ ...categoryVars(cat), '--stat-color': `var(--cat-${cat || 'other'})` })
</script>

<template>
  <!-- 没有赛事也没有平台时整块不渲染（数据还没到 / 表是空的） -->
  <div
    v-if="(stats.byContest || []).length || (stats.byPlatform || []).length"
    class="sched-stats sched-stats--catalog"
  >
    <!-- ① 线下赛事：**一格一个赛事**（会长：「线下赛要分赛事，并且要显示 logo」） -->
    <span
      v-for="c in stats.byContest || []"
      :key="`contest-${c.slug}`"
      class="sched-stat sched-stat--contest"
      :data-stat="`contest-${c.slug}`"
      :style="tileStyle(c.category)"
    >
      <em>
        <img v-if="imageOf(c.slug)" class="sched-stat__logo" :src="imageOf(c.slug)" :alt="labelOf(c.slug)" />
        <span v-else class="sched-stat__initial">{{ initialOfSlug(c.slug) }}</span>
        <span class="sched-stat__text">{{ labelOf(c.slug) }}</span>
      </em>
      <b>{{ c.count }}</b>
    </span>

    <!-- ② 线上平台：**一格一个平台**（原先是一格「线上赛 N」+ 一行小字写分布） -->
    <span
      v-for="p in stats.byPlatform || []"
      :key="`platform-${p.slug}`"
      class="sched-stat sched-stat--platform"
      :data-stat="`platform-${p.slug}`"
      :style="tileStyle('online')"
    >
      <em>
        <img v-if="imageOf(p.slug)" class="sched-stat__logo" :src="imageOf(p.slug)" :alt="labelOf(p.slug)" />
        <span v-else class="sched-stat__initial">{{ initialOfSlug(p.slug) }}</span>
        <span class="sched-stat__text">{{ labelOf(p.slug) }}</span>
      </em>
      <b>{{ p.count }}</b>
    </span>
  </div>
</template>
