<script setup>
/**
 * 近期赛事独立页（/upcoming，2026-10-02 新增）
 * ---------------------------------------------------------------------------
 * 会长原话：「我希望把近期赛时显示为独立页面，然后在竞赛信息页，只显示一个看板，点击进入详情页」。
 * 本页 = 完整那张表（UpcomingSchedule.vue：类型筛选 chips + 按月分组 + 一行一场 + 页脚统计），
 * 竞赛信息页留一块看板（UpcomingBoard.vue）指向这里。
 *
 * 为什么值得单独一页：这张表会长到三四十行（线上平台一周好几场）。摆在竞赛信息页时，它把那页
 * 原本的主线（竞赛卡片、全年赛程图）一路压到很下面 —— 想看「最近要比什么」的人得划过竞赛卡片，
 * 想看「协会有哪些竞赛」的人又得先划过三四十行赛程。拆开之后两边都一步到位。
 *
 * 取数走 `useScheduleData()`：与竞赛信息页**同一个入口**，不是两页各写一遍 useJson ——
 * 否则日后加一份数据就会漏改一页（口径写在那个 composable 的头注释里）。
 */
import UpcomingSchedule from '../components/UpcomingSchedule.vue'
import { useScheduleData } from '../composables/useScheduleData.js'

const { competitions, schedule, autoSchedule, platforms, scheduleLoading } = useScheduleData()
</script>

<template>
  <main class="upcoming-page container-fluid">
    <!-- 装饰光斑（与竞赛信息页同一套） -->
    <div
      class="decorative-orb decorative-orb--primary"
      style="width:500px;height:500px;top:-200px;right:-150px;opacity:0.06"
    ></div>
    <div
      class="decorative-orb decorative-orb--accent"
      style="width:350px;height:350px;bottom:10%;left:-120px;opacity:0.04"
    ></div>

    <div class="container upcoming-inner">
      <header class="page-hero">
        <p class="page-label">SCHEDULE</p>
        <h1>近期<span class="highlight">赛事</span></h1>
        <p class="page-desc">
          接下来要比的场次，一场一行、写到日子 · 各赛事官网自动同步 · 可按比赛类型筛选
        </p>
      </header>

      <UpcomingSchedule
        :competitions="competitions || []"
        :platforms="platforms?.items || []"
        :schedule="schedule || {}"
        :auto-schedule="autoSchedule || {}"
        :loading="scheduleLoading"
      />

      <p class="upcoming-page__back">
        <RouterLink to="/contest"><i class="fas fa-arrow-left"></i> 返回竞赛信息</RouterLink>
      </p>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   近期赛事独立页
   （页面骨架与 ContestView 同一套写法：各视图自带 hero 样式，是本仓库的既有惯例）
   ========================================================================== */
.upcoming-page {
  position: relative;
  overflow: clip;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(ellipse 600px 400px at 80% 5%, rgba(26, 115, 232, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse 400px 300px at 15% 90%, rgba(255, 152, 0, 0.03) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.upcoming-inner {
  position: relative;
  z-index: 1;
  width: 90%;
  margin: 0 auto;
}

/* ── 标题区 ── */
.page-hero {
  text-align: center;
  margin-bottom: 8px; /* 表格自己带 56px 上边距，这里不叠加 */
}
.page-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 4px;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 6px;
}
.page-hero h1 {
  font-size: 2.6rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 12px;
}
.page-hero h1 .highlight {
  color: var(--primary);
  position: relative;
}
.page-hero h1 .highlight::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 4px;
  width: 100%;
  height: 9px;
  background: rgba(26, 115, 232, 0.12);
  border-radius: 2px;
  z-index: -1;
}
.page-desc {
  font-size: var(--font-size-base);
  color: var(--text-muted);
}

/* ── 回竞赛信息 ── */
.upcoming-page__back {
  margin-top: var(--space-2xl);
  text-align: center;
}
.upcoming-page__back a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary);
  transition: gap var(--transition-fast);
}
.upcoming-page__back a:hover {
  gap: 12px;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .upcoming-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero h1 {
    font-size: 2rem;
  }
}
@media (max-width: 576px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
}
</style>
