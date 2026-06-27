<script setup>
import { onMounted, onUnmounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import FloatingJoin from './components/FloatingJoin.vue'

// 控制台彩蛋：开发者工具打开时输出问候语。
let timer = null
let devtoolsOpen = false
const threshold = 160

const greet = () => {
  console.log(
    '%c🐟 woodfish到此一游 🐟',
    'color:#4CAF50;font-size:20px;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.3);'
  )
  console.log('%c欢迎来到程序设计竞赛协会！', 'color:#2196F3;font-size:14px;font-weight:bold;')
  console.log('%c如果你对我们的网站感兴趣，欢迎加入我们！', 'color:#FF9800;font-size:12px;')
}
const check = () => {
  const open =
    window.outerHeight - window.innerHeight > threshold ||
    window.outerWidth - window.innerWidth > threshold
  if (open && !devtoolsOpen) {
    devtoolsOpen = true
    greet()
  } else if (!open) {
    devtoolsOpen = false
  }
}
const onKey = (e) => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) setTimeout(greet, 100)
}

onMounted(() => {
  timer = setInterval(check, 500)
  document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <AppHeader />
  <main>
    <RouterView />
  </main>
  <AppFooter />
  <FloatingJoin />
</template>
