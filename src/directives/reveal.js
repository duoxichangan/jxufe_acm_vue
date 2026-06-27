/**
 * v-reveal：元素进入视口时加 .is-visible 触发入场动画（替代原 main.js 手动滚动监听）。
 * 用法：<div v-reveal>…</div>
 */
export const vReveal = {
  mounted(el) {
    el.setAttribute('v-reveal', '') // 命中 base.css 的 [v-reveal] 初始隐藏样式
    // 不支持 IntersectionObserver 时直接显示，避免内容永远不可见。
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
      { threshold: 0.12 }
    )
    io.observe(el)
    el._revealObserver = io
  },
  unmounted(el) {
    el._revealObserver?.disconnect()
  }
}
