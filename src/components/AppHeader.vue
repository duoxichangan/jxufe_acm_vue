<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { navLinks } from '../data/navigation'

const scrolled = ref(false)
const menuOpen = ref(false)

const onScroll = () => {
  scrolled.value = window.scrollY > 80
}
const onDocumentClick = (e) => {
  const headerEl = document.querySelector('header')
  if (headerEl && !headerEl.contains(e.target)) menuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onDocumentClick)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <header :class="{ scrolled, 'menu-open': menuOpen }">
    <div class="container bar">
      <RouterLink to="/" class="logo" @click="menuOpen = false">
        <div class="logo-mark">
          <img src="/images/logo.png" alt="协会logo" />
        </div>
        <div class="logo-text">
          <span class="logo-title">程序设计竞赛协会</span>
          <span class="logo-sub">江西财经大学</span>
        </div>
      </RouterLink>

      <nav>
        <ul>
          <li v-for="link in navLinks" :key="link.to">
            <RouterLink :to="link.to" @click="menuOpen = false">{{ link.label }}</RouterLink>
          </li>
        </ul>
      </nav>

      <button
        class="menu-toggle"
        :aria-expanded="menuOpen"
        @click.stop="menuOpen = !menuOpen"
        aria-label="菜单"
      >
        <svg class="hamburger-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="28" width="70" height="4" rx="2" fill="currentColor" />
          <rect x="15" y="48" width="70" height="4" rx="2" fill="currentColor" />
          <rect x="15" y="68" width="70" height="4" rx="2" fill="currentColor" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: var(--z-header);
  background: transparent;
  border-bottom: 1px solid transparent;
  transition:
    background var(--transition-smooth),
    box-shadow var(--transition-smooth),
    border-color var(--transition-smooth),
    backdrop-filter var(--transition-smooth);
}
header.scrolled {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 1px 24px rgba(0, 0, 0, 0.06);
  border-bottom-color: rgba(0, 0, 0, 0.05);
}

.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-md);
  height: 80px;
}

/* ---- Logo ---- */
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-mark {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform var(--transition);
}
.logo:hover .logo-mark img {
  transform: scale(1.06);
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.logo-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;
}
.logo-sub {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* ---- 导航 ---- */
nav ul {
  display: flex;
  gap: 2px;
}
nav a {
  position: relative;
  display: block;
  padding: 8px 18px;
  border-radius: var(--radius-full);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: color var(--transition-fast), background var(--transition-fast);
}
nav a:hover {
  color: var(--primary);
}
nav a.router-link-active {
  color: var(--primary);
  font-weight: 600;
  background: transparent;
}
/* 底部蓝色下划线 */
nav a.router-link-active::after {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 2px;
  height: 2.5px;
  border-radius: 2px;
  background: var(--primary);
}

/* ---- 汉堡按钮 ---- */
.menu-toggle {
  display: none;
  background: none;
  border: none;
  padding: 10px;
  border-radius: var(--radius-full);
  cursor: pointer;
  color: var(--text);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.menu-toggle:hover {
  background: rgba(0,0,0,0.05);
  color: var(--primary);
}
.hamburger-icon {
  width: 22px;
  height: 22px;
  transition: transform var(--transition);
}
header.menu-open .hamburger-icon {
  transform: rotate(90deg);
}

/* ≤992px：启用汉堡菜单 */
@media (max-width: 992px) {
  .logo-title { font-size: 0.9rem; }
  .logo-sub { font-size: 0.65rem; }
  .logo-mark { width: 36px; height: 36px; }
  .menu-toggle { display: block; }
  nav ul {
    position: fixed;
    inset: 0;
    height: 100vh;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 4px;
    padding: 100px 20px 40px;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: transform var(--transition-smooth), opacity var(--transition-smooth);
  }
  header.menu-open nav ul {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  nav a {
    padding: 14px 24px;
    font-size: 1.15rem;
    font-weight: 600;
    border-radius: var(--radius-full);
    width: 100%;
    max-width: 280px;
    text-align: center;
  }
  nav a.router-link-active {
    color: var(--primary);
    background: transparent;
  }
  nav a.router-link-active::after {
    left: 50%;
    right: auto;
    width: 40px;
    transform: translateX(-50%);
    bottom: 6px;
  }
}

@media (max-width: 576px) {
  .logo-title { font-size: 0.8rem; }
  .logo-mark { width: 32px; height: 32px; }
  .bar { padding: 0 var(--space-sm); }
  nav a { font-size: 1.05rem; padding: 12px 20px; }
}
</style>
