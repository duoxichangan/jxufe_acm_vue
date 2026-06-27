<script setup>
import { useJson } from "../composables/useJson";
import { useSkeleton } from "../composables/useSkeleton";

const {
  data: leaders,
  loading,
  error,
} = useJson("/data/leaders.json", { initial: [] });
const { skeletons } = useSkeleton(5);
</script>

<template>
  <main class="leader-page container-fluid">
    <!-- 装饰光斑 -->
    <div
      class="decorative-orb decorative-orb--primary"
      style="
        width: 550px;
        height: 550px;
        top: -220px;
        right: -180px;
        opacity: 0.06;
      "
    ></div>
    <div
      class="decorative-orb decorative-orb--accent"
      style="
        width: 380px;
        height: 380px;
        bottom: 8%;
        left: -140px;
        opacity: 0.04;
      "
    ></div>
    <div
      class="decorative-orb decorative-orb--light"
      style="
        width: 300px;
        height: 300px;
        top: 50%;
        right: -100px;
        opacity: 0.04;
      "
    ></div>

    <div class="container leader-inner">
      <!-- 标题区 -->
      <header class="page-hero">
        <p class="page-label">ASSOCIATION LEADERS</p>
        <h1>协会<span class="highlight">负责人</span></h1>
        <p class="page-desc">这故事开始一个人，我认真写成了我们</p>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="skeleton-list">
        <div
          v-for="n in skeletons"
          :key="n"
          class="skeleton"
          style="
            height: 280px;
            border-radius: var(--radius-xl);
            margin-bottom: var(--space-lg);
          "
        ></div>
      </div>

      <!-- Error -->
      <p v-else-if="error" class="hint">加载失败</p>

      <!-- 负责人列表 -->
      <div v-else class="leader-grid">
        <article
          v-for="(l, i) in leaders"
          :key="l.name"
          v-reveal="'fade-up'"
          :style="{ '--reveal-index': i }"
          class="leader-card"
        >
          <!-- 届数飘带 -->
          <div class="session-ribbon">{{ l.session }}</div>

          <!-- 头像区 -->
          <div class="leader-avatar-wrap">
            <div class="avatar-ring"></div>
            <img :src="l.avatar" :alt="l.name" class="leader-avatar" />
          </div>

          <!-- 信息区 -->
          <div class="leader-body">
            <h2 class="leader-name">{{ l.name }}</h2>
            <p class="leader-class">{{ l.class }}</p>
            <p class="leader-message">{{ l.message }}</p>

            <!-- 成就标签 -->
            <div class="achievement-tags">
              <span v-for="a in l.achievements" :key="a" class="ach-tag">{{
                a
              }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   协会负责人页
   ========================================================================== */
.leader-page {
  position: relative;
  overflow: clip;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(
      ellipse 700px 500px at 75% 5%,
      rgba(26, 115, 232, 0.04) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 500px 400px at 15% 85%,
      rgba(255, 152, 0, 0.03) 0%,
      transparent 60%
    ),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.leader-inner {
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
.skeleton-list {
  max-width: 700px;
  margin: 0 auto;
}

/* ── 双列布局 ── */
.leader-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
}

/* ── 卡片 ── */
.leader-card {
  position: relative;
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-xl) var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    border-color var(--transition);
}
.leader-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(26, 115, 232, 0.08);
  border-color: rgba(26, 115, 232, 0.15);
}

/* ── 届数飘带 ── */
.session-ribbon {
  position: absolute;
  top: 0;
  right: var(--space-lg);
  transform: translateY(-50%);
  padding: 5px 20px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #fff;
  background: var(--gradient-primary);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
  letter-spacing: 1px;
  white-space: nowrap;
}

/* ── 头像区 ── */
.leader-avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  height: 120px;
}
.avatar-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: conic-gradient(
    var(--primary),
    var(--primary-light),
    var(--accent),
    var(--primary)
  );
  opacity: 0;
  transition: opacity var(--transition-slow);
  animation: ring-spin 4s linear infinite;
}
@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}
.leader-card:hover .avatar-ring {
  opacity: 0.3;
}
.leader-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition);
  z-index: 1;
}
.leader-card:hover .leader-avatar {
  transform: scale(1.06);
  box-shadow: 0 6px 24px rgba(26, 115, 232, 0.15);
}

/* ── 信息区 ── */
.leader-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.leader-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 2px;
}
.leader-class {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
  font-family: var(--font-mono);
}
.leader-message {
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--text-light);
  margin-bottom: var(--space-md);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── 成就标签 ── */
.achievement-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}
.ach-tag {
  display: inline-block;
  padding: 3px 12px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(26, 115, 232, 0.06);
  border: 1px solid rgba(26, 115, 232, 0.1);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}
.leader-card:hover .ach-tag {
  background: rgba(26, 115, 232, 0.1);
  border-color: rgba(26, 115, 232, 0.2);
}

/* ── 响应式 ── */
@media (max-width: 992px) {
  .leader-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
  .leader-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero {
    margin-bottom: 48px;
  }
  .page-hero h1 {
    font-size: 2rem;
  }
}
@media (max-width: 576px) {
  .leader-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-lg) var(--space-md);
  }
  .leader-avatar-wrap {
    width: 100px;
    height: 100px;
  }
  .leader-avatar {
    width: 100px;
    height: 100px;
  }
  .avatar-ring {
    inset: -4px;
  }
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .achievement-tags {
    justify-content: center;
  }
  .leader-message {
    -webkit-line-clamp: unset;
  }
}
</style>
