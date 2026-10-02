<script setup>
import { computed } from 'vue'
import { useJson } from '../composables/useJson'
import { useSkeleton } from '../composables/useSkeleton'
import CompetitionSchedule from '../components/CompetitionSchedule.vue'
import { mergeXcpc, XCPC_MODE } from '../utils/contestTaxonomy.js'

const { data: competitions, loading, error } = useJson('/data/competitions.json', {
  initial: []
})
const { skeletons } = useSkeleton(8)

// ICPC 与 CCPC 合并为一张 xCPC 大卡（1×2：一张卡片、两大赛事并排）。
// 子卡保留各自原有内容布局，仅卡片合并；点击进入 /competition/xcpc 合并页。
// 合并判据与合并页、与奖项文件列表**共用一份**：contestTaxonomy.js 的 mergeXcpc()
// （2026-09-24 收口 —— 原先这里按 slug 写死，合并页又写死一套 awards 名单）。
const cards = computed(() => {
  const list = competitions.value || []
  const xcpc = mergeXcpc(list)
  if (!xcpc) return list
  return [xcpc, ...list.filter((c) => c.mode !== XCPC_MODE)]
})
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

      <!-- 全年赛程 + 竞赛卡片（同一份数据，故共用加载态）
           会长 2026-09-23：日程放到各竞赛卡片**上方** —— 它是「什么时候比」，
           比「有哪些比赛」更该先看到 -->
      <template v-else>
      <CompetitionSchedule :competitions="competitions || []" />
      <div class="grid">
        <RouterLink
          v-for="(c, i) in cards"
          :key="c.slug"
          v-reveal="'scale-in'"
          :style="{ '--reveal-index': i }"
          :to="`/competition/${c.slug}`"
          class="card"
          :class="{ 'card--xcpc': c.isXcpc }"
        >
          <!-- xCPC 合并大卡：ICPC / CCPC 两张子卡并排（1×2），各自内容布局不变。
               ⚠ 下面两支标记树必须同步改：xCPC 那支多一层 .xcpc-sub 包裹（并排的 flex 容器、
                 是 .card 的 flex item），普通卡则是 .card 的直系子元素 —— 合成一个 v-for
                 会多出一个 box（.xcpc-sub 的 flex: 1 1 50% 在 column 容器里语义不同），
                 要塌成一个循环就得连带改 .card 的布局，故有意保留两份。 -->
          <template v-if="c.isXcpc">
            <div v-for="child in c.children" :key="child.slug" class="xcpc-sub">
              <div class="card-image-wrap">
                <img :src="child.image" :alt="child.name" class="card-image" />
              </div>
              <div class="card-body">
                <h2>{{ child.name }}</h2>
                <p>{{ child.desc }}</p>
                <span class="card-link">查看详情 <i class="fa-solid fa-arrow-right"></i></span>
              </div>
            </div>
          </template>
          <!-- 普通卡片 -->
          <template v-else>
            <div class="card-image-wrap">
              <img :src="c.image" :alt="c.name" class="card-image" />
            </div>
            <div class="card-body">
              <h2>{{ c.name }}</h2>
              <p>{{ c.desc }}</p>
              <span class="card-link">查看详情 <i class="fa-solid fa-arrow-right"></i></span>
            </div>
          </template>
        </RouterLink>
      </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   竞赛信息页
   ========================================================================== */
.contest-page {
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
  padding: var(--space-md); /* 图片与卡片边缘留出间距 */
  background: #fff;
}
.card-image {
  width: 100%;
  height: 220px;
  object-fit: contain; /* 完整显示整张 logo，不裁剪；留白透出卡片白底 */
  object-position: center;
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

/* ── xCPC 合并大卡（1×2：一张卡片、两大赛事并排，子卡内容布局与原卡片一致）── */
.card--xcpc {
  grid-column: span 2;
  flex-direction: row;
  align-items: stretch;
  gap: var(--space-lg); /* 两子卡间距 = grid 卡片间距 */
}
.card--xcpc .xcpc-sub {
  flex: 1 1 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.card--xcpc .xcpc-sub .card-body {
  flex: 1;
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
  .card--xcpc {
    grid-column: auto;
    flex-direction: column;
    gap: var(--space-md); /* 移动端 grid 卡片间距 */
  }
}
@media (max-width: 576px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
