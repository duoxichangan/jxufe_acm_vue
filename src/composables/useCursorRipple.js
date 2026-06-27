/**
 * useCursorRipple — 全局光标涟漪特效
 *
 * 在鼠标移动时，每隔 400ms 从光标位置扩散一圈蓝色涟漪。
 *
 * 用法：
 *   const { start, stop } = useCursorRipple()
 *   onMounted(start); onUnmounted(stop)
 */

import { ref, onUnmounted } from 'vue'

export function useCursorRipple() {
  const ripples = ref([])
  let rippleId = 0
  let lastRippleTime = 0
  let handler = null

  const spawn = (e) => {
    const now = Date.now()
    if (now - lastRippleTime < 400) return
    lastRippleTime = now
    const id = ++rippleId
    ripples.value.push({ id, x: e.clientX, y: e.clientY })
    if (ripples.value.length > 5) ripples.value.splice(0, ripples.value.length - 5)
    setTimeout(() => {
      ripples.value = ripples.value.filter((r) => r.id !== id)
    }, 1200)
  }

  const start = () => {
    handler = (e) => spawn(e)
    document.addEventListener('mousemove', handler, { passive: true })
  }

  const stop = () => {
    if (handler) {
      document.removeEventListener('mousemove', handler)
      handler = null
    }
    ripples.value = []
  }

  onUnmounted(stop)

  return { ripples, start, stop }
}
