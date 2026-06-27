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

// 将按年分组的 history 展平为表格行（按年份降序）
const historyRows = computed(() => {
  if (!comp.value?.history) return []
  const sorted = [...comp.value.history].sort((a, b) => Number(b.year) - Number(a.year))
  return sorted.flatMap((g) =>
    (g.entries || []).map((e) => ({ year: g.year, ...e }))
  )
})

// 奖牌颜色
function medalClass(desc) {
  if (!desc) return ''
  if (/金牌|🥇|一等/.test(desc)) return 'medal-gold'
  if (/银牌|🥈|二等/.test(desc)) return 'medal-silver'
  if (/铜牌|🥉|三等/.test(desc)) return 'medal-bronze'
  if (/铁牌/.test(desc)) return 'medal-iron'
  return ''
}

// 赛事等级
function entryLevel(entry) {
  return entry.level || '国家级'
}
</script>

<template>
  <main class="comp-page container-fluid">
    <!-- 装饰光斑 -->
    <div class="decorative-orb decorative-orb--primary" style="width:500px;height:500px;top:-200px;right:-150px;opacity:0.06"></div>
    <div class="decorative-orb decorative-orb--accent" style="width:350px;height:350px;bottom:10%;left:-120px;opacity:0.04"></div>

    <div class="container comp-inner">
      <!-- Loading / Error -->
      <div v-if="loading" class="skeleton-list">
        <div v-for="n in 3" :key="n" class="skeleton" style="height:200px;border-radius:var(--radius-xl);margin-bottom:var(--space-lg);"></div>
      </div>
      <p v-else-if="error" class="hint">加载失败</p>
      <p v-else-if="!comp" class="hint">未找到该竞赛</p>

      <template v-else>
        <!-- 标题区 -->
        <header class="page-hero">
          <p class="page-label">COMPETITION DETAIL</p>
          <h1>{{ comp.name }}</h1>
          <p v-if="comp.subtitle" class="page-subtitle">{{ comp.subtitle }}</p>
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
          <div
            v-for="(d, i) in comp.details"
            :key="d.title"
            v-reveal="'scale-in'"
            :style="{ '--reveal-index': i }"
            class="detail-card"
          >
            <div class="detail-icon">
              <i :class="`fas ${d.icon}`"></i>
            </div>
            <h3>{{ d.title }}</h3>
            <p v-for="(line, idx) in d.lines" :key="idx">{{ line }}</p>
          </div>
        </section>

        <!-- 参赛历史 -->
        <section class="comp-history">
          <h2 class="section-label"><i class="fas fa-timeline"></i> 我校参赛历史</h2>
          <p v-if="!historyRows.length" class="empty">暂无参赛记录</p>
          <div v-else class="history-table-wrap" v-reveal="'fade-up'">
            <table class="history-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th>等级</th>
                  <th>赛事</th>
                  <th>成绩</th>
                  <th>参赛成员</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in historyRows" :key="i">
                  <td class="cell-year">{{ row.year }}</td>
                  <td class="cell-level" :class="'level-' + entryLevel(row).replace('级','')">{{ entryLevel(row) }}</td>
                  <td class="cell-title">{{ row.title }}</td>
                  <td class="cell-desc" :class="medalClass(row.desc)">{{ row.desc }}</td>
                  <td class="cell-members">{{ row.members || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <RouterLink to="/contest" class="back-link">
          <i class="fa-solid fa-arrow-left"></i> 返回竞赛信息
        </RouterLink>
      </template>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   竞赛详情页
   ========================================================================== */
.comp-page {
  position: relative;
  overflow: clip;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(ellipse 600px 400px at 80% 5%, rgba(26,115,232,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 400px 300px at 15% 90%, rgba(255,152,0,0.03) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.comp-inner {
  position: relative;
  z-index: 1;
  width: 90%;
  margin: 0 auto;
}

.hint {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-3xl) 0;
  font-size: var(--font-size-lg);
}
.skeleton-list {
  max-width: 700px;
  margin: 0 auto;
}

/* ── 标题区 ── */
.page-hero {
  text-align: center;
  margin-bottom: 56px;
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
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--primary-dark);
  line-height: var(--line-height-tight);
  margin-bottom: 12px;
}
.page-subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-muted);
}

/* ── 小节标签 ── */
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.section-label i { color: var(--primary); }

/* ── 简介 ── */
.comp-intro {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}
.comp-logo {
  width: 180px;
  height: auto;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.intro-text {
  flex: 1;
}
.intro-text h2 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid rgba(26,115,232,0.12);
}
.intro-text p {
  margin-bottom: var(--space-md);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-light);
}

/* ── 详情卡片 ── */
.comp-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}
.detail-card {
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  transition: transform var(--transition-spring), box-shadow var(--transition), border-color var(--transition);
}
.detail-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(26,115,232,0.07);
  border-color: rgba(26,115,232,0.12);
}
.detail-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--space-md);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(26,115,232,0.08), rgba(26,115,232,0.03));
}
.detail-icon i {
  font-size: 1.4rem;
  color: var(--primary);
}
.detail-card h3 {
  margin-bottom: var(--space-sm);
  color: var(--text);
  font-size: var(--font-size-lg);
  font-weight: 700;
}
.detail-card p {
  color: var(--text-light);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

/* ── 参赛历史 ── */
.comp-history {
  margin-bottom: var(--space-xl);
}
.empty {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-xl) 0;
  font-size: var(--font-size-sm);
}
.history-table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0,0,0,0.06);
}
.history-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  font-size: var(--font-size-sm);
}
.history-table thead {
  background: linear-gradient(135deg, rgba(26,115,232,0.04), rgba(26,115,232,0.01));
}
.history-table th {
  padding: 14px 16px;
  text-align: center;
  font-weight: 700;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  border-bottom: 2px solid rgba(26,115,232,0.1);
  white-space: nowrap;
}
.history-table th:first-child {
  padding-left: 24px;
}
.history-table td {
  padding: 14px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  color: var(--text);
  vertical-align: middle;
}
.history-table td:first-child {
  padding-left: 24px;
}
.history-table tbody tr {
  transition: background var(--transition-fast);
}
.history-table tbody tr:hover {
  background: rgba(26,115,232,0.02);
}
.history-table tbody tr:last-child td {
  border-bottom: none;
}
.cell-year {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
  width: 1%;
}
.cell-level {
  white-space: nowrap;
  font-weight: 650;
  font-size: 0.78rem;
  width: 1%;
}
.level-国际 {
  color: #c79100;
}
.level-国家 {
  color: var(--primary);
}
.level-省 {
  color: #7a8b99;
}
.cell-title {
  font-weight: 600;
}
.cell-desc {
  color: var(--text-light);
}
/* 奖牌颜色 */
.medal-gold {
  color: #c79100 !important;
  font-weight: 700;
}
.medal-silver {
  color: #7a8b99 !important;
  font-weight: 600;
}
.medal-bronze {
  color: #b87333 !important;
  font-weight: 600;
}
.medal-iron {
  color: #999 !important;
}
.cell-members {
  color: var(--text-light);
  font-size: var(--font-size-sm);
}

/* ── 返回链接 ── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--space-lg);
  padding: 10px 24px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(26,115,232,0.15);
  color: var(--primary);
  font-weight: 600;
  font-size: var(--font-size-sm);
  transition: all var(--transition-spring);
}
.back-link:hover {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  transform: translateX(-4px);
  box-shadow: 0 4px 16px rgba(26,115,232,0.2);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .comp-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero h1 {
    font-size: 2rem;
  }
  .comp-intro {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .comp-logo {
    width: 140px;
  }
}
@media (max-width: 576px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
}
</style>
