<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { navLinks } from '../data/navigation'

const scrolled = ref(false)
const menuOpen = ref(false)

const onScroll = () => {
  scrolled.value = window.scrollY > 50
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
        <img src="/images/logo.png" alt="协会logo" class="logo-image" />
        <h1>江西财经大学程序设计竞赛协会</h1>
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
        <svg class="hamburger-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M73.591065 278.392498c0-29.520337 24.016996-53.537334 53.537334-53.537334l876.816846 0c29.521361 0 53.537334 24.016996 53.537334 53.537334 0 29.519314-24.015973 53.53631-53.537334 53.53631L127.128399 331.928808c-29.520337 0-53.537334-24.016996-53.537334-53.53631zM73.591065 592.350003c0-29.520337 24.016996-53.541427 53.537334-53.541427l876.816846 0c29.521361 0 53.537334 24.01802 53.537334 53.541427 0 29.520337-24.015973 53.537334-53.537334 53.537334L127.128399 645.887337c-29.520337 0-53.537334-24.016996-53.537334-53.537334zM73.591065 903.797337c0-29.521361 24.016996-53.537334 53.537334-53.537334l876.816846 0c29.521361 0 53.537334 24.015973 53.537334 53.537334 0 29.521361-24.015973 53.537334-53.537334 53.537334L127.128399 957.334671c-29.520337 0-53.537334-24.015973-53.537334-53.537334z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow);
  transition: background-color var(--transition), box-shadow var(--transition);
}
header.scrolled {
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(15px);
}

.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 15px;
}
.logo-image {
  height: 50px;
  object-fit: contain;
}
.logo h1 {
  color: var(--primary);
  font-size: 1rem;
  letter-spacing: 0.5px;
}

nav ul {
  display: flex;
}
nav li {
  margin-left: 20px;
}
nav a {
  display: block;
  padding: 8px 12px;
  border-radius: 4px;
  color: var(--text);
  font-weight: 500;
}
nav a:hover,
nav a.router-link-active {
  color: var(--primary);
  background-color: rgba(26, 115, 232, 0.1);
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--primary);
}
.hamburger-icon {
  width: 24px;
  height: 24px;
  transition: transform var(--transition);
}
header.menu-open .hamburger-icon {
  transform: rotate(90deg);
}

/* ≤992px：启用汉堡菜单 */
@media (max-width: 992px) {
  .logo h1 {
    font-size: 0.95rem;
  }
  .logo-image {
    height: 45px;
  }
  .menu-toggle {
    display: block;
  }
  nav ul {
    position: fixed;
    inset: 0 0 0 0;
    height: 100vh;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    padding: 110px 20px 40px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  header.menu-open nav ul {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  nav li {
    margin: 0;
    width: 100%;
    max-width: 300px;
    text-align: center;
  }
  nav a {
    padding: 15px 20px;
    font-size: 1.2rem;
    font-weight: 600;
    border-radius: 8px;
  }
  nav a:hover,
  nav a.router-link-active {
    color: #fff;
    background-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
  }
}

@media (max-width: 576px) {
  .logo h1 {
    font-size: 0.75rem;
    line-height: 1.2;
  }
  .logo-image {
    height: 32px;
  }
  .menu-toggle {
    padding: 6px;
  }
  nav a {
    font-size: 1.1rem;
    padding: 12px 15px;
  }
}
</style>
