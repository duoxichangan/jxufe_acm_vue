<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goHome = () => router.push({ name: 'home' })
</script>

<template>
  <main class="notfound-page container-fluid">
    <!-- 装饰光斑 -->
    <div class="decorative-orb decorative-orb--primary" style="width:600px;height:600px;top:-250px;right:-200px;opacity:0.05"></div>
    <div class="decorative-orb decorative-orb--accent" style="width:400px;height:400px;bottom:5%;left:-150px;opacity:0.04"></div>
    <div class="decorative-orb decorative-orb--light" style="width:300px;height:300px;top:40%;right:10%;opacity:0.03"></div>

    <div class="container notfound-inner">
      <!-- 404 大数字 -->
      <div class="glitch-wrapper" v-reveal="'scale-in'">
        <span class="glitch-number" aria-hidden="true">404</span>
        <span class="glitch-number glitch-number--main">404</span>
        <span class="glitch-number" aria-hidden="true">404</span>
      </div>

      <!-- 标题区 -->
      <header class="page-hero" v-reveal="'fade-up'" :style="{ '--reveal-index': 1 }">
        <p class="page-label">OOPS!</p>
        <h1>页面<span class="highlight">走丢了</span></h1>
        <p class="page-desc">你访问的页面不存在或已被移走，请检查网址是否正确</p>
      </header>

      <!-- 操作区 -->
      <div class="notfound-actions" v-reveal="'fade-up'" :style="{ '--reveal-index': 2 }">
        <button class="btn btn-primary btn-home" @click="goHome">
          <i class="fas fa-home"></i> 返回首页
        </button>
        <button class="btn btn-secondary btn-back" @click="router.back()">
          <i class="fas fa-arrow-left"></i> 回到上一页
        </button>
      </div>

      <!-- 底部小提示 -->
      <p class="notfound-hint" v-reveal="'fade-in'" :style="{ '--reveal-index': 3 }">
        或者通过顶部导航前往其他页面
      </p>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   404 页面
   ========================================================================== */
.notfound-page {
  position: relative;
  overflow: clip;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 700px 500px at 75% 10%, rgba(26,115,232,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 500px 400px at 20% 85%, rgba(255,152,0,0.04) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}

.notfound-inner {
  position: relative;
  z-index: 1;
  width: 90%;
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
}

/* ── 404 大数字（故障风格）── */
.glitch-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
}
.glitch-number {
  font-family: var(--font-mono);
  font-size: clamp(8rem, 16vw, 12rem);
  font-weight: 900;
  color: var(--primary-dark);
  line-height: 1;
  letter-spacing: 0.02em;
  user-select: none;
}
.glitch-number--main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  color: var(--primary);
  animation: glitch-skew 0.5s ease-in-out infinite alternate-reverse;
}
.glitch-wrapper .glitch-number:first-child {
  color: rgba(26,115,232,0.25);
  animation: glitch-clip-1 0.6s ease-in-out infinite alternate-reverse;
}
.glitch-wrapper .glitch-number:last-child {
  color: rgba(255,152,0,0.25);
  animation: glitch-clip-2 0.55s ease-in-out infinite alternate-reverse;
}

@keyframes glitch-skew {
  0%   { transform: translate(0); }
  20%  { transform: translate(-3px, 2px); }
  40%  { transform: translate(3px, -1px); }
  60%  { transform: translate(-2px, -2px); }
  80%  { transform: translate(1px, 3px); }
  100% { transform: translate(0); }
}
@keyframes glitch-clip-1 {
  0%   { clip-path: inset(10% 0 85% 0); transform: translate(-2px, 1px); }
  20%  { clip-path: inset(60% 0 30% 0); transform: translate(3px, -1px); }
  40%  { clip-path: inset(20% 0 55% 0); transform: translate(-1px, -2px); }
  60%  { clip-path: inset(80% 0 5% 0);  transform: translate(2px, 1px); }
  80%  { clip-path: inset(40% 0 45% 0); transform: translate(-2px, 2px); }
  100% { clip-path: inset(0% 0 75% 0);  transform: translate(1px, -1px); }
}
@keyframes glitch-clip-2 {
  0%   { clip-path: inset(75% 0 10% 0); transform: translate(3px, -1px); }
  20%  { clip-path: inset(25% 0 60% 0); transform: translate(-2px, 2px); }
  40%  { clip-path: inset(55% 0 15% 0); transform: translate(1px, 1px); }
  60%  { clip-path: inset(5% 0 85% 0);  transform: translate(-1px, -2px); }
  80%  { clip-path: inset(45% 0 40% 0); transform: translate(2px, -1px); }
  100% { clip-path: inset(70% 0 5% 0);  transform: translate(-1px, 1px); }
}

/* ── 标题区 ── */
.page-hero {
  text-align: center;
  margin-bottom: 40px;
  padding: 0;
}
.page-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 4px;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 6px;
}
.page-hero h1 {
  font-size: 2.2rem;
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
  background: rgba(26,115,232,0.12);
  border-radius: 2px;
  z-index: -1;
}
.page-desc {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  line-height: 1.7;
}

/* ── 操作按钮 ── */
.notfound-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-bottom: var(--space-xl);
}
.btn-home,
.btn-back {
  padding: 14px 36px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all var(--transition-fast);
}
.btn-home {
  box-shadow: 0 4px 16px rgba(26,115,232,0.2);
}
.btn-home:hover {
  box-shadow: 0 8px 28px rgba(26,115,232,0.3);
}
.btn-back {
  border-color: rgba(0,0,0,0.1);
  color: var(--text-light);
}
.btn-back:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* ── 底部提示 ── */
.notfound-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .notfound-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .glitch-number {
    font-size: clamp(6rem, 18vw, 10rem);
  }
}
@media (max-width: 576px) {
  .page-hero h1 {
    font-size: 1.4rem;
  }
  .glitch-number {
    font-size: clamp(5rem, 20vw, 8rem);
  }
  .notfound-actions {
    flex-direction: column;
    align-items: center;
  }
  .btn-home,
  .btn-back {
    width: 100%;
    max-width: 260px;
    justify-content: center;
  }
}
</style>
