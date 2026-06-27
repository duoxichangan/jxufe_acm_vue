<script setup>
import { useTimeline } from "../composables/useTimeline";

const { topEvents, yearGroups, loading } = useTimeline();
</script>

<template>
  <main class="timeline-page container-fluid">
    <!-- 装饰光斑 -->
    <div
      class="decorative-orb decorative-orb--primary"
      style="
        width: 600px;
        height: 600px;
        top: -250px;
        right: -200px;
        opacity: 0.06;
      "
    ></div>
    <div
      class="decorative-orb decorative-orb--accent"
      style="
        width: 400px;
        height: 400px;
        bottom: 10%;
        left: -150px;
        opacity: 0.04;
      "
    ></div>
    <div
      class="decorative-orb decorative-orb--light"
      style="
        width: 350px;
        height: 350px;
        top: 40%;
        right: -120px;
        opacity: 0.04;
      "
    ></div>

    <div class="container timeline-inner">
      <!-- 标题区 -->
      <header class="page-hero">
        <p class="page-label">LATEST NEWS</p>
        <h1>协会<span class="highlight">大事记</span></h1>
        <p class="page-desc">在岁月的单行道上，拓下所有光影交错的印章。</p>
      </header>

      <div v-if="loading" class="skeleton-list">
        <div
          v-for="n in 4"
          :key="n"
          class="skeleton"
          style="
            height: 120px;
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-md);
          "
        ></div>
      </div>

      <template v-else>
        <!-- 置顶事件 -->
        <section v-if="topEvents.length" class="pinned-section">
          <h2 class="section-label">
            <i class="fa-solid fa-thumbtack"></i> 置顶
          </h2>
          <div class="pinned-grid">
            <RouterLink
              v-for="(top, i) in topEvents"
              :key="top.slug"
              v-reveal="'fade-up'"
              :style="{ '--reveal-index': i }"
              :to="`/action/${top.slug}`"
              class="pinned-card"
            >
              <span class="pinned-mark"
                ><i class="fa-solid fa-thumbtack"></i
              ></span>
              <span class="pinned-title">{{ top.title }}</span>
              <span class="pinned-arrow">→</span>
            </RouterLink>
          </div>
        </section>

        <!-- 时间轴：所有年份平铺，无折叠 -->
        <section
          v-for="(g, gi) in yearGroups"
          :key="g.year"
          class="year-section"
        >
          <h2
            v-reveal="'fade-up'"
            :style="{ '--reveal-index': gi }"
            class="year-heading"
          >
            <span class="year-num">{{ g.year }}</span>
            <span class="year-count">{{ g.items.length }} 件事</span>
          </h2>

          <div class="timeline">
            <RouterLink
              v-for="(item, idx) in g.items"
              :key="item.slug"
              :to="`/action/${item.slug}`"
              v-reveal="'fade-up'"
              :style="{ '--reveal-index': idx }"
              class="tl-item"
              :class="{ right: idx % 2 === 1 }"
            >
              <div class="tl-card">
                <span class="tl-date">{{ item.dateStr }}</span>
                <h3>{{ item.title }}</h3>
                <p>{{ item.summary }}</p>
              </div>
              <div class="tl-dot"></div>
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   大事记页
   ========================================================================== */
.timeline-page {
  position: relative;
  overflow: hidden;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(
      ellipse 700px 500px at 75% 5%,
      rgba(26, 115, 232, 0.05) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 500px 400px at 15% 85%,
      rgba(255, 152, 0, 0.04) 0%,
      transparent 60%
    ),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.timeline-inner {
  position: relative;
  z-index: 1;
  max-width: 1100px;
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
.skeleton-list {
  max-width: 700px;
  margin: 0 auto;
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.section-label i {
  color: var(--primary);
}

/* ── 置顶 ── */
.pinned-section {
  margin-bottom: var(--space-2xl);
}
.pinned-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-md);
}
.pinned-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--radius-lg);
  color: var(--text);
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    border-color var(--transition);
}
.pinned-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(26, 115, 232, 0.08);
  border-color: rgba(26, 115, 232, 0.18);
  color: var(--text);
}
.pinned-mark {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.85rem;
}
.pinned-title {
  flex: 1;
  font-weight: 600;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pinned-arrow {
  color: var(--text-muted);
  transition:
    transform var(--transition-fast),
    color var(--transition-fast);
}
.pinned-card:hover .pinned-arrow {
  transform: translateX(4px);
  color: var(--primary);
}

/* ── 年份标题 ── */
.year-section {
  margin-bottom: var(--space-xl);
}
.year-heading {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.year-num {
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}
.year-count {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--bg-light);
  padding: 2px 12px;
  border-radius: var(--radius-full);
}

/* ── 时间轴：交错布局 ── */
.timeline {
  position: relative;
  padding: 0 0 var(--space-lg);
}
/* 中轴线 */
.timeline::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    rgba(26, 115, 232, 0.3) 0%,
    rgba(26, 115, 232, 0.1) 50%,
    rgba(26, 115, 232, 0.05) 100%
  );
  border-radius: 1px;
  transform: translateX(-50%);
}

/* 单项 */
.tl-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--space-xl);
  color: var(--text);
}
.tl-item:last-child {
  margin-bottom: 0;
}

/* 卡片 */
.tl-card {
  width: calc(50% - 50px);
  padding: var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    border-color var(--transition);
}
.tl-item:hover .tl-card {
  transform: translateY(-3px);
  box-shadow: 0 10px 32px rgba(26, 115, 232, 0.07);
  border-color: rgba(26, 115, 232, 0.15);
}
.tl-date {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-bottom: 6px;
}
.tl-card h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  transition: color var(--transition-fast);
}
.tl-item:hover .tl-card h3 {
  color: var(--primary);
}
.tl-card p {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 时间点圆圈 */
.tl-dot {
  position: absolute;
  left: 50%;
  top: 28px;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--primary);
  z-index: 1;
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    background var(--transition);
}
.tl-item:hover .tl-dot {
  transform: translate(-50%, -50%) scale(1.6);
  background: var(--primary);
  box-shadow: 0 0 0 10px rgba(26, 115, 232, 0.1);
}

/* 奇数：卡片在左 */
.tl-item:not(.right) {
  justify-content: flex-start;
}
.tl-item:not(.right) .tl-card {
  margin-right: auto;
}

/* 偶数：卡片在右 */
.tl-item.right {
  justify-content: flex-end;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .timeline-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero {
    margin-bottom: 48px;
  }
  .page-hero h1 {
    font-size: 2rem;
  }
  .pinned-grid {
    grid-template-columns: 1fr;
  }

  /* 移动端：全部左对齐，中轴线移到左边 */
  .timeline::before {
    left: 24px;
  }
  .tl-item,
  .tl-item.right {
    justify-content: flex-start;
    padding-left: 52px;
  }
  .tl-card {
    width: 100%;
  }
  .tl-dot {
    left: 24px;
  }
  .year-num {
    font-size: 1.5rem;
  }
}
@media (max-width: 480px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .tl-card {
    padding: var(--space-md);
  }
}
</style>
