<script setup>
import { useJson } from '../composables/useJson'
import { useSkeleton } from '../composables/useSkeleton'

const { data: members, loading, error } = useJson('/data/members.json', { initial: [] })
const { skeletons } = useSkeleton(9)
const fallback = '/images/excellent_member/default.png'
</script>

<template>
  <main class="excellent-page container-fluid">
    <!-- 装饰光斑 -->
    <div class="decorative-orb decorative-orb--primary" style="width:500px;height:500px;top:-200px;right:-150px;opacity:0.06"></div>
    <div class="decorative-orb decorative-orb--accent" style="width:350px;height:350px;bottom:8%;left:-120px;opacity:0.04"></div>

    <div class="container excellent-inner">
      <!-- 标题区 -->
      <header class="page-hero">
        <p class="page-label">EXCELLENT MEMBERS</p>
        <h1>优秀<span class="highlight">成员</span></h1>
        <p class="page-desc">星光不问赶路人，时光不负有心人</p>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="grid">
        <div v-for="n in skeletons" :key="n" class="skeleton" style="height:420px;border-radius:var(--radius-xl);"></div>
      </div>

      <!-- Error -->
      <p v-else-if="error" class="hint">加载失败</p>

      <!-- 成员网格 -->
      <div v-else class="grid">
        <article
          v-for="(m, i) in members"
          :key="m.name"
          v-reveal="'scale-in'"
          :style="{ '--reveal-index': i }"
          class="member-card"
        >
          <!-- 头像区 -->
          <div class="member-photo">
            <div class="photo-ring"></div>
            <div class="photo-frame">
              <img :src="m.photo" :alt="m.name" @error="$event.target.src = fallback" />
            </div>
          </div>

          <!-- 信息区 -->
          <div class="member-body">
            <h3>{{ m.name }}</h3>
            <p class="member-class">{{ m.class }}</p>

            <!-- 荣誉标签 -->
            <div class="honor-tags">
              <span v-for="h in m.honors" :key="h" class="honor-tag">{{ h }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   优秀成员页
   ========================================================================== */
.excellent-page {
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
.excellent-inner {
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
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

/* ── 卡片 ── */
.member-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  transition: transform var(--transition-spring), box-shadow var(--transition), border-color var(--transition);
}
.member-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 36px rgba(26,115,232,0.08);
  border-color: rgba(26,115,232,0.15);
}

/* ── 头像区 ── */
.member-photo {
  position: relative;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(26,115,232,0.03) 0%, transparent 100%);
  overflow: hidden;
}
/* 底部渐变线 */
.member-photo::after {
  content: "";
  position: absolute;
  left: var(--space-lg);
  right: var(--space-lg);
  bottom: 0;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: 1px;
  transition: left var(--transition), right var(--transition);
}
.member-card:hover .member-photo::after {
  left: 8px;
  right: 8px;
}

/* 头像光环 */
.photo-ring {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(var(--primary), var(--primary-light), var(--accent), var(--primary));
  opacity: 0;
  transition: opacity var(--transition-slow);
  animation: ring-spin 5s linear infinite;
}
@keyframes ring-spin {
  to { transform: rotate(360deg); }
}
.member-card:hover .photo-ring {
  opacity: 0.25;
}

/* 头像框 */
.photo-frame {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  padding: 3px;
  background: var(--gradient-primary);
  transition: transform var(--transition-spring);
  z-index: 1;
}
.member-card:hover .photo-frame {
  transform: scale(1.06);
}
.photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #fff;
}

/* ── 信息区 ── */
.member-body {
  flex: 1;
  padding: var(--space-lg);
  text-align: center;
  display: flex;
  flex-direction: column;
}
.member-body h3 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
  transition: color var(--transition-fast);
}
.member-card:hover .member-body h3 {
  color: var(--primary);
}
.member-class {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-bottom: var(--space-md);
}

/* ── 荣誉标签 ── */
.honor-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: auto;
}
.honor-tag {
  display: inline-block;
  padding: 3px 12px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(26,115,232,0.06);
  border: 1px solid rgba(26,115,232,0.1);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}
.member-card:hover .honor-tag {
  background: rgba(26,115,232,0.1);
  border-color: rgba(26,115,232,0.2);
}

/* ── 响应式 ── */
@media (max-width: 992px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .excellent-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero {
    margin-bottom: 48px;
  }
  .page-hero h1 {
    font-size: 2rem;
  }
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
  .member-photo {
    height: 210px;
  }
  .photo-frame {
    width: 150px;
    height: 150px;
  }
  .photo-ring {
    width: 170px;
    height: 170px;
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
