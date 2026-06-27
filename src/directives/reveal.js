/**
 * v-reveal：元素进入视口时加 .is-visible 触发入场动画。
 *
 * 用法：
 *   <div v-reveal>…</div>                    → 默认 fade-up
 *   <div v-reveal="'fade-in'">…</div>        → 纯淡入
 *   <div v-reveal="'scale-in'">…</div>       → 缩放淡入
 *   <div v-reveal="'slide-left'">…</div>     → 从左滑入
 *   <div v-reveal="'slide-right'">…</div>    → 从右滑入
 *   <div v-reveal="'fade-up'" :style="{ '--reveal-index': index }">…</div>  → 级联延迟
 */

const VARIANTS = ['fade-up', 'fade-in', 'scale-in', 'slide-left', 'slide-right']

function normalize(value) {
  if (!value) return 'fade-up'
  if (VARIANTS.includes(value)) return value
  return 'fade-up'
}

export const vReveal = {
  mounted(el, binding) {
    const variant = normalize(binding.value)
    el.setAttribute('data-reveal', variant)

    // 不支持 IntersectionObserver 时直接显示，避免内容永远不可见
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    el._revealObserver = io
  },
  unmounted(el) {
    el._revealObserver?.disconnect()
  }
}
