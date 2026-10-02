<script setup>
/**
 * 近期赛事「看板」（竞赛信息页用，2026-10-02 新增；同日按会长要求统一版式）
 * ---------------------------------------------------------------------------
 * 会长原话：「我希望把近期赛时显示为独立页面，然后在竞赛信息页，只显示一个看板，
 * 点击进入详情页」。于是完整那张表搬去 /upcoming（views/UpcomingView.vue），
 * 竞赛信息页只留这一块摘要 —— 白卡整块是 RouterLink，点哪儿都进详情页。
 *
 * 看板放什么（会长 2026-10-02 选定，同日又改过一次口径）：
 *   · **2 场线上 + 2 场非线上**（原话：「我希望在竞赛信息页显示的应该的最近的 2 场线上和
 *     2 场非线上赛」），两拨合起来**仍按开赛日排**、不分成两段；
 *   · 顶部一块**仪表板**：一格一个指标（场待办 / 本月 / 下月 / 线上赛（含平台分布）/ 报名中 /
 *     已收起 / 时间待定）。样式体在全局 styles/schedule-stats.css（与完整表共用一份）；
 *     原先它是一行「共 N 场待办 · 本月 M 场 · 线上赛 K 场」的文字，会长：
 *     「我希望做成类似仪表板的东西」；
 *   · 末尾一句「查看完整赛程 →」。
 *
 * ⚠ 版式：**标题在卡外、白卡只包内容**，各条数值照抄同页的「全年赛程」
 * （CompetitionSchedule.vue 的 .schedule / .schedule__head / .schedule__label /
 * .schedule__desc / .schedule__chart）。会长 2026-10-02：「在『竞赛信息』页显示的看板要统一
 * 风格」—— 两节并排看必须是同一套节奏：
 *     · 节容器 margin 56px、标题距卡 20px；
 *     · h2 1.35rem / 图标 1.1rem 主色；说明行 0.9rem --text-secondary；
 *     · 卡 padding 18px 20px 22px、圆角 --radius-xl、边框 rgba(15,23,42,.08)、
 *       阴影 0 1px 2px rgba(15,23,42,.04), 0 12px 32px rgba(15,23,42,.06)。
 * 早先那一版把标题与内容裹进同一张会浮起的卡片、字号也自成一套（--font-size-xl），
 * 与全页不是一路 —— 改版时这些值**照抄邻居**，别就地发明。
 * 同一轮里，右上角那行「数据更新：手写 X月X日 · 官网自动同步 X月X日」也按会长要求去掉了。
 *
 * ⚠ 为什么非线上那拨只给 2 行：会长 2026-10-01 定的分层是「ICPC 这类要报名、要组队训练的
 * 场次，不该被一周十几场 Codeforces 淹掉」。2026-10-02 起线上赛**也占看板的行**了（2 + 2），
 * 防淹靠的是**条数上限**（props 的 limit / onlineLimit），不再是「一行都不给」；
 * 完整页把选择权交回给访客自己（两组 chips 多选、默认全勾），线上赛在那边的仪表板里
 * 还有按平台的细分。
 *
 * 与 UpcomingSchedule / CompetitionSchedule 同规矩：**纯渲染组件** —— 取数、loading 都归页面管，
 * 这样它能在 node 里用 fixture 直接 SSR 渲染出来回归（见 test/upcoming-schedule.test.mjs），
 * 不必起浏览器。
 */
import { computed } from 'vue'
import {
  buildUpcoming,
  scheduleStats,
  startOfToday,
  categoryVars,
  buildIconIndex,
  initialOf,
} from '../utils/scheduleView.js'
import ScheduleStats from './ScheduleStats.vue'

const props = defineProps({
  /** competitions.json 原样传入（给 icpc / ccpc / gplt / lanqiao / baidu / chuanzhi 配图标与简称） */
  competitions: { type: Array, default: () => [] },
  /** platforms.json 原样传入（线上平台图标；与上面合成同一张 slug → 图标 表） */
  platforms: { type: Array, default: () => [] },
  /** schedule.json 原样传入（手写真源） */
  schedule: { type: Object, default: () => ({}) },
  /** schedule.auto.json 原样传入（构建期抓取）。缺省视为空。 */
  autoSchedule: { type: Object, default: () => ({}) },
  /** 赛程数据是否还在路上（页面传 scheduleLoading，不是四份的或） */
  loading: { type: Boolean, default: false },
  /** 今天。页面不传（取本地当天 00:00）；**只给回归测试注入固定日期用**。 */
  today: { type: Date, default: () => startOfToday() },
  /** 列几场**非线上**赛。会长 2026-10-02 定的是 2；**回归测试会压到 1** 来钉住排序与截断。 */
  limit: { type: Number, default: 2 },
  /** 列几场**线上**赛（会长 2026-10-02：「最近的 2 场线上和 2 场非线上赛」）。
      ⚠ 这是 2026-10-02 的口径变更：早先线上赛**不占看板的行**（只由数字条报个数），
      理由是 CF / AtCoder / 牛客一周十几场会把要提前准备的比赛挤下去。
      现在改成 2 + 2 —— 防淹靠的是**条数上限**，不再是「一行都不给」。 */
  onlineLimit: { type: Number, default: 2 },
})

const view = computed(() =>
  buildUpcoming(
    {
      items: props.schedule?.items || [],
      pending: props.schedule?.pending || [],
      auto: props.autoSchedule?.items || [],
    },
    props.today
  )
)

/** 图标只有一条来源：scheduleView 的合表（competitions + platforms），两个页面共用 */
const icons = computed(() => buildIconIndex(props.competitions, props.platforms))
const iconOf = (row) => icons.value.get(row?.contest) || {}
/** 是不是线上平台（Codeforces / AtCoder / 洛谷 / 牛客）。
    ⚠ 判据走 `categoryOf` 的结果 `row.category === 'online'`，**不要**在这里再拿一份
    slug 白名单自己判：scheduleView 里加一个平台时，只有跟着 categoryOf 走才会同时改到
    「分类色 / 筛选 chip / 看板排除线上赛」三处。 */
const isOnline = (row) => row?.category === 'online'

/** 看板列哪些行：最近的 `limit` 场**非线上** + `onlineLimit` 场**线上**（会长 2026-10-02：
    「最近的 2 场线上和 2 场非线上赛」），两拨合起来**仍按开赛日排**（不分成两段）。
    做法：各取前 N 条 → 用键集合回到 `view.rows`（已按开赛日升序）里滤一遍。
    别把两拨拼起来重新排序 —— 同一天的两条会随拼接顺序抖动。 */
const rowKey = (r) => `${r.contest}|${r.startKey}|${r.title}`
const top = computed(() => {
  const rows = view.value.rows
  const picked = new Set(
    [
      ...rows.filter((r) => !isOnline(r)).slice(0, props.limit),
      ...rows.filter(isOnline).slice(0, props.onlineLimit),
    ].map(rowKey)
  )
  return rows.filter((r) => picked.has(rowKey(r)))
})

/** 卡片**顶部**那块仪表板（会长 2026-10-02：从卡片底部挪上来、「详细一些」、做成仪表板，
    再一条「线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」）。
    口径在 scheduleView.scheduleStats —— 恒按全部未来场次算，与筛选无关；
    结构与样式体收在共用的 components/ScheduleStats.vue + styles/schedule-stats.css。
    ⚠ 2026-10-02 起仪表板是**本卡专属**：会长「在近期比赛的详情页不要显示这个
    class="sched-stats sched-stats--catalog upcoming__stats"」→ 完整表页 /upcoming 不再渲染它。 */
const stats = computed(() => scheduleStats(view.value, props.today))
</script>

<template>
  <section class="board" v-reveal="'fade-up'">
    <!-- 标题在卡外 —— 与下方「全年赛程」同一版式（见文件头 ⚠ 版式） -->
    <header class="board__head">
      <h2 class="board__label"><i class="fas fa-calendar-check"></i> 近期赛事</h2>
      <p class="board__desc">最近 {{ top.length }} 场（含线上赛）· 点进来看完整赛程</p>
    </header>

    <!-- 白卡整块都是进详情页的链接（会长：「点击进入详情页」） -->
    <RouterLink to="/upcoming" class="board__card">
      <!-- 加载态：与内容同高，数据到位时不把页面顶一下 -->
      <div v-if="loading" class="board__skeleton">
        <div v-for="n in limit" :key="n" class="skeleton"></div>
      </div>

      <template v-else>
        <!-- 仪表板：**一格一个赛事 / 一格一个平台**（都带 logo），放在**卡片顶部**。
             结构在共用的 components/ScheduleStats.vue，样式体在 styles/schedule-stats.css，
             这里只负责它在卡里的排布（.board__stats）。
             ⚠ 会长 2026-10-02 又撤掉了原先那条「时间与状态」带（场待办 / 本月 / 下月 / 报名中），
             故这里没有 v-if="stats.total" 那道门 —— 有没有格子由组件自己判（见它的 v-if）。 -->
        <ScheduleStats
          class="board__stats"
          :stats="stats"
          :competitions="competitions"
          :platforms="platforms"
        />

        <ul v-if="top.length" class="board__list">
          <li
            v-for="row in top"
            :key="`${row.contest}-${row.startKey}-${row.title}`"
            class="board__row"
            :class="`is-${row.status}`"
            :style="categoryVars(row.category)"
            :title="row.note || ''"
          >
            <span class="board__logo">
              <img
                v-if="iconOf(row).image"
                :src="iconOf(row).image"
                :alt="iconOf(row).label"
                loading="lazy"
              />
              <em v-else>{{ initialOf(iconOf(row).label || row.title) }}</em>
            </span>
            <span class="board__when">
              <b>{{ row.dateText }}</b>
              <em>{{ row.weekday }}</em>
            </span>
            <span class="board__title">{{ row.title }}</span>
            <span class="board__status">{{ row.statusLabel }}</span>
          </li>
        </ul>

        <p v-else class="board__empty">暂无已公布的近期赛程 —— 官网发布后会自动出现在这里</p>

        <!-- 页脚只剩「进详情页」这一步：数字都搬到卡片顶部去了 -->
        <p class="board__foot">
          <span class="board__more">查看完整赛程 <i class="fas fa-arrow-right"></i></span>
        </p>
      </template>
    </RouterLink>
  </section>
</template>

<style scoped>
/* ==========================================================================
   近期赛事看板（竞赛信息页 /contest）
   ⚠ 下面这几条是**照抄 CompetitionSchedule 的同名规则**（会长 2026-10-02 要求看板与全页统一）：
   节间距 56 / 标题距卡 20 / h2 1.35rem / 说明 0.9rem --text-secondary /
   卡 padding 18px 20px 22px + radius-xl + rgba(15,23,42,…) 边框与阴影。
   改这里之前先看那一份 —— 两节要一直长得像。
   ========================================================================== */
.board {
  margin-top: 56px;
  /* 与下方竞赛卡片拉开距离（同 .schedule）：相邻兄弟的 margin 会合并，故两节之间仍是 56px */
  margin-bottom: 56px;
}

/* ── 表头（在卡外） ── */
.board__head {
  margin-bottom: 20px;
}
.board__label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
}
.board__label i {
  color: var(--primary);
  font-size: 1.1rem;
}
.board__desc {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* ── 白卡（整块是 <RouterLink>） ── */
.board__card {
  display: block;
  padding: 18px 20px 22px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: var(--radius-xl);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.06);
  color: var(--text);
  transition: transform var(--transition-spring), box-shadow var(--transition),
    border-color var(--transition);
}
.board__card:hover {
  transform: translateY(-3px);
  border-color: rgba(26, 115, 232, 0.18);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 40px rgba(26, 115, 232, 0.12);
  color: var(--text);
}

/* ── 三行场次 ── */
.board__skeleton {
  display: grid;
  gap: 10px;
}
.board__skeleton .skeleton {
  height: 64px;
  border-radius: var(--radius-md);
}
.board__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.board__row {
  display: grid;
  grid-template-columns: 56px 116px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-md);
  padding: 6px 0 6px 12px;
  /* 左边框 = 比赛类型（与完整表、与大事记同一套色，见 styles/tokens.css 的 --cat-*） */
  border-left: 4px solid var(--cat, var(--cat-other));
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
.board__logo {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
}
.board__logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.board__logo em {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--cat-soft, var(--bg-light));
  color: var(--cat, var(--text-muted));
  font-size: 1.15rem;
  font-weight: 700;
  font-style: normal;
}
.board__when {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.board__when b {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}
.board__when em {
  font-size: var(--font-size-xs);
  font-style: normal;
  color: var(--text-light);
}
.board__title {
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}
.board__card:hover .board__title {
  color: var(--primary);
}
.board__status {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}
/* 状态只在右侧文字里表达（左边框已经被类型占用了，与完整表同一口径） */
.board__row.is-today .board__status,
.board__row.is-ongoing .board__status {
  color: var(--primary);
}
.board__row.is-signup .board__status {
  color: var(--accent);
}
.board__empty {
  margin: 0;
  padding: var(--space-sm) 0;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

/* ── 卡片顶部：数字条（会长 2026-10-02 从底部挪上来，「详细一些」） ──
   样式体在全局 styles/schedule-stats.css（.sched-stats / .sched-stat），这里只管排布 */
.board__stats {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
}

/* ── 页脚：只剩「查看完整赛程」 ── */
.board__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
}
.board__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary);
  transition: gap var(--transition-fast);
}
.board__card:hover .board__more {
  gap: 10px;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .board {
    margin-top: 40px;
    margin-bottom: 40px;
  }
  .board__row {
    grid-template-columns: 48px 100px minmax(0, 1fr) auto;
    gap: var(--space-sm);
  }
  .board__logo {
    width: 48px;
    height: 48px;
  }
  .board__logo em {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }
}
@media (max-width: 576px) {
  .board__row {
    grid-template-columns: 44px minmax(0, 1fr);
    grid-template-areas:
      'logo main'
      'logo when'
      'logo status';
    row-gap: 2px;
  }
  .board__logo {
    grid-area: logo;
    width: 44px;
    height: 44px;
  }
  .board__title {
    grid-area: main;
  }
  .board__when {
    grid-area: when;
    flex-direction: row;
    gap: 8px;
    align-items: baseline;
  }
  .board__status {
    grid-area: status;
  }
}
</style>
