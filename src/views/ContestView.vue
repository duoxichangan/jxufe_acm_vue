<script setup>
import { useJson } from '../composables/useJson'
import { useSkeleton } from '../composables/useSkeleton'

const { data: competitions, loading, error } = useJson('/data/competitions.json', {
  initial: []
})
const { skeletons } = useSkeleton(8)
</script>

<template>
  <main class="contest-page container-fluid">
    <!-- 装饰光斑 -->
    <div class="decorative-orb decorative-orb--primary" style="width:500px;height:500px;top:-200px;right:-150px;opacity:0.06"></div>
    <div class="decorative-orb decorative-orb--accent" style="width:350px;height:350px;bottom:10%;left:-120px;opacity:0.04"></div>

    <div class="container contest-inner">
      <!-- 标题区 -->
      <header class="page-hero">
        <p class="page-label">COMPETITIONS</p>
        <h1>竞赛<span class="highlight">信息</span></h1>
        <p class="page-desc">探索我们参与的各项编程竞赛，了解赛事详情与参赛历史</p>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="grid">
        <div v-for="n in skeletons" :key="n" class="skeleton" style="height:380px;border-radius:var(--radius-xl);"></div>
      </div>

      <!-- Error -->
      <p v-else-if="error" class="hint">加载失败</p>

      <!-- 竞赛卡片 -->
      <div v-else class="grid">
        <RouterLink
          v-for="(c, i) in competitions"
          :key="c.slug"
          v-reveal="'scale-in'"
          :style="{ '--reveal-index': i }"
          :to="`/competition/${c.slug}`"
          class="card"
        >
          <div class="card-image-wrap">
            <img :src="c.image" :alt="c.name" class="card-image" />
          </div>
          <div class="card-body">
            <h2>{{ c.name }}</h2>
            <p>{{ c.desc }}</p>
            <span class="card-link">查看详情 <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   竞赛信息页
   ========================================================================== */
.contest-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(ellipse 600px 400px at 80% 5%, rgba(26,115,232,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 400px 300px at 15% 90%, rgba(255,152,0,0.03) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.contest-inner {
  position: relative;
  z-index: 1;
  width: 90%;
  margin: 0 auto;
}

/* ── 标题区 ── */
.page-hero {
  text-align: center;
  margin-bottom: 56px;
  padding: 0;
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

.hint {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-3xl) 0;
  font-size: var(--font-size-lg);
}

/* ── 卡片网格 ── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
}

/* ── 卡片 ── */
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  color: var(--text);
  transition: transform var(--transition-spring), box-shadow var(--transition), border-color var(--transition);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(26,115,232,0.08);
  border-color: rgba(26,115,232,0.15);
  color: var(--text);
}
.card-image-wrap {
  overflow: hidden;
}
.card-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  transition: transform var(--transition-slow);
}
.card:hover .card-image {
  transform: scale(1.05);
}
.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: var(--space-lg);
}
.card-body h2 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-sm);
  transition: color var(--transition-fast);
}
.card:hover .card-body h2 {
  color: var(--primary);
}
.card-body p {
  flex: 1;
  margin-bottom: var(--space-lg);
  color: var(--text-light);
  font-size: var(--font-size-sm);
  line-height: 1.65;
}
.card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--primary);
  transition: gap var(--transition-fast);
}
.card:hover .card-link {
  gap: 10px;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .contest-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero {
    margin-bottom: 48px;
  }
  .page-hero h1 {
    font-size: 2rem;
  }
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-md);
  }
}
@media (max-width: 480px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
