<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import FloatingJoin from './components/FloatingJoin.vue'
import { useCodeTrail } from './composables/useCodeTrail.js'
import { useCursorRipple } from './composables/useCursorRipple.js'

const route = useRoute()
const { start: trailStart, stop: trailStop } = useCodeTrail()
const { ripples, start: rippleStart, stop: rippleStop } = useCursorRipple()

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
  trailStart()
  rippleStart()
})
onUnmounted(() => {
  clearInterval(timer)
  trailStop()
  rippleStop()
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <!-- 全局光标涟漪 -->
  <div class="ripple-layer" aria-hidden="true">
    <span
      v-for="r in ripples"
      :key="r.id"
      class="ripple-ring"
      :style="{ left: r.x + 'px', top: r.y + 'px' }"
    ></span>
  </div>

  <AppHeader />
  <main>
    <RouterView v-slot="{ Component }">
      <Transition name="fade-slide">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter v-if="route.name !== 'home'" />
  <FloatingJoin />
</template>
