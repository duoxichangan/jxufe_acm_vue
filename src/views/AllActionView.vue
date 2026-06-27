<script setup>
import { ref } from 'vue'
import { useTimeline } from '../composables/useTimeline'

const { topEvents, yearGroups, loading } = useTimeline()

// 同一时间只展开一个年份（手风琴）。默认全部展开。
const openYear = ref(null)
const toggle = (year) => {
  openYear.value = openYear.value === year ? null : year
}
const isOpen = (year) => openYear.value === null || openYear.value === year
</script>

<template>
  <main class="timeline-page container">
    <h1 class="page-title">协会大事记</h1>

    <p v-if="loading" class="hint">加载中…</p>

    <!-- 置顶 -->
    <RouterLink
      v-for="(top, i) in topEvents"
      :key="top.slug"
      v-reveal
      :to="`/action/${top.slug}`"
      class="pinned-event"
      :style="{ animationDelay: `${0.1 * i}s` }"
    >
      <div class="pinned-icon"><i class="fa-solid fa-thumbtack"></i></div>
      <div class="pinned-content">
        <h2>{{ top.title }}</h2>
        <p class="summary">{{ top.summary }}</p>
      </div>
    </RouterLink>

    <!-- 年份分组 -->
    <div v-for="g in yearGroups" :key="g.year" class="year-block" :class="{ active: isOpen(g.year) }">
      <button class="year-header" @click="toggle(g.year)">
        {{ g.year }} <i class="fa-solid fa-chevron-down"></i>
      </button>
      <div class="year-content">
        <div class="timeline">
          <RouterLink
            v-for="item in g.items"
            :key="item.slug"
            v-reveal
            :to="`/action/${item.slug}`"
            class="timeline-item"
          >
            <div class="timeline-icon"><i class="fa-solid fa-circle"></i></div>
            <div class="timeline-content">
              <span class="date">{{ item.dateStr }}</span>
              <h3>{{ item.title }}</h3>
              <p class="summary">{{ item.summary }}</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.timeline-page {
  max-width: 1000px;
  padding: 40px 20px 80px;
}
.page-title {
  text-align: center;
  font-size: 2.2rem;
  color: var(--primary-dark);
  margin-bottom: 40px;
}
.hint {
  text-align: center;
  color: var(--text-light);
}

/* 置顶事件 */
.pinned-event {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 25px 30px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  animation: fadeInUp 0.6s ease-out both;
}
.pinned-event:hover {
  color: #fff;
  filter: brightness(1.05);
}
.pinned-icon {
  font-size: 1.5rem;
  color: var(--accent);
}
.pinned-content h2 {
  font-size: 1.4rem;
  margin-bottom: 6px;
}
.pinned-content .summary {
  opacity: 0.9;
  font-size: 0.95rem;
}

/* 年份块 */
.year-block {
  margin-bottom: 30px;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  background: #fff;
}
.year-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 25px;
  border: none;
  background: var(--bg-light);
  color: var(--primary-dark);
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: background var(--transition);
}
.year-header:hover {
  background: var(--bg-dark);
}
.year-header i {
  transition: transform var(--transition);
}
.year-block:not(.active) .year-header i {
  transform: rotate(-90deg);
}
.year-content {
  max-height: 5000px;
  overflow: hidden;
  transition: max-height 0.4s ease;
}
.year-block:not(.active) .year-content {
  max-height: 0;
}

/* 时间轴 */
.timeline {
  position: relative;
  padding: 20px 25px 30px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 38px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: var(--bg-dark);
}
.timeline-item {
  position: relative;
  display: flex;
  gap: 20px;
  padding: 18px 0 18px 50px;
  color: var(--text);
}
.timeline-item:hover {
  color: var(--text);
}
.timeline-icon {
  position: absolute;
  left: 18px;
  top: 22px;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: var(--primary);
  background: #fff;
  border: 3px solid var(--primary);
  border-radius: 50%;
}
.timeline-content {
  flex: 1;
}
.timeline-content .date {
  font-size: 0.85rem;
  color: var(--text-light);
}
.timeline-content h3 {
  font-size: 1.1rem;
  color: var(--primary-dark);
  margin: 4px 0;
}
.timeline-content .summary {
  font-size: 0.9rem;
  color: var(--text-light);
}

@media (max-width: 576px) {
  .pinned-event {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }
  .year-header {
    font-size: 1.1rem;
    padding: 15px 18px;
  }
}
</style>
