<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useJson } from '../composables/useJson'

const route = useRoute()
const { data: competitions, loading, error } = useJson('/data/competitions.json', {
  initial: []
})

const comp = computed(
  () => (competitions.value || []).find((c) => c.slug === route.params.slug)
)
</script>

<template>
  <main class="competition-page">
    <div class="container">
      <p v-if="loading" class="hint">加载中…</p>
      <p v-else-if="error" class="hint">加载失败</p>
      <p v-else-if="!comp" class="hint">未找到该竞赛</p>

      <template v-else>
        <header class="comp-header">
          <h1>{{ comp.name }}</h1>
          <p class="subtitle">{{ comp.subtitle }}</p>
        </header>

        <!-- 简介 -->
        <section class="comp-intro">
          <img :src="comp.image" :alt="comp.name" class="comp-logo" />
          <div class="intro-text">
            <h2>竞赛简介</h2>
            <p v-for="(p, i) in comp.intro" :key="i">{{ p }}</p>
          </div>
        </section>

        <!-- 详情卡片 -->
        <section class="comp-details">
          <div v-for="d in comp.details" :key="d.title" class="detail-card">
            <i :class="`fas ${d.icon}`"></i>
            <h3>{{ d.title }}</h3>
            <p v-for="(line, i) in d.lines" :key="i">{{ line }}</p>
          </div>
        </section>

        <!-- 参赛历史 -->
        <section class="comp-history">
          <h2>我校参赛历史</h2>
          <div v-for="g in comp.history" :key="g.year" class="history-group">
            <div class="history-year">{{ g.year }}</div>
            <div class="history-entries">
              <div v-for="(e, i) in g.entries" :key="i" class="history-entry">
                <h3 v-if="e.title">{{ e.title }}</h3>
                <p v-if="e.desc">{{ e.desc }}</p>
                <img v-if="e.image" :src="e.image" :alt="e.title || ''" class="history-image" loading="lazy" />
              </div>
              <p v-if="!g.entries.length" class="empty">暂无参赛记录</p>
            </div>
          </div>
        </section>

        <RouterLink to="/contest" class="back-link">← 返回竞赛信息</RouterLink>
      </template>
    </div>
  </main>
</template>

<style scoped>
.competition-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 80px;
}
.hint {
  text-align: center;
  color: var(--text-light);
  padding: 60px 0;
}
.comp-header {
  text-align: center;
  margin: 40px 0;
}
.comp-header h1 {
  font-size: 2.5rem;
  color: var(--primary-dark);
  margin-bottom: 10px;
}
.subtitle {
  font-size: 1.2rem;
  color: var(--text-light);
  font-style: italic;
}

/* 简介 */
.comp-intro {
  display: flex;
  align-items: center;
  gap: 40px;
  margin: 40px 0;
}
.comp-logo {
  width: 200px;
  height: auto;
  flex-shrink: 0;
}
.intro-text h2 {
  color: var(--text);
  border-bottom: 2px solid var(--primary);
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.intro-text p {
  margin-bottom: 12px;
}

/* 详情卡片 */
.comp-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 40px 0;
}
.detail-card {
  text-align: center;
  padding: 20px;
  border-radius: var(--radius);
  background: #f9f9f9;
  box-shadow: var(--shadow);
}
.detail-card i {
  font-size: 2rem;
  color: var(--primary);
  margin-bottom: 15px;
}
.detail-card h3 {
  margin-bottom: 10px;
  color: var(--primary-dark);
}
.detail-card p {
  color: var(--text-light);
}

/* 历史 */
.comp-history {
  margin: 60px 0 40px;
}
.comp-history > h2 {
  color: var(--primary-dark);
  margin-bottom: 30px;
}
.history-group {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}
.history-year {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: bold;
  color: #fff;
  background: var(--primary);
}
.history-entries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  flex: 1;
}
.history-entry {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
}
.history-entry h3 {
  color: var(--primary-dark);
  margin-bottom: 6px;
}
.history-entry p {
  margin-bottom: 12px;
}
.history-image {
  max-width: 100%;
  border-radius: 4px;
}
.empty {
  color: var(--text-light);
}

.back-link {
  display: inline-block;
  margin-top: 20px;
  color: var(--primary);
  font-weight: 500;
}
.back-link:hover {
  color: var(--primary-dark);
}

@media (max-width: 768px) {
  .comp-intro {
    flex-direction: column;
  }
  .comp-logo {
    margin-bottom: 10px;
  }
}
</style>
