import { ref } from 'vue'
export const startupComplete = ref(false)
let resolveHome
const homeReady = new Promise(resolve => { resolveHome = resolve })
export const markHomeReady = () => resolveHome()

// Resources and the logo's complete assembly sequence must both be ready.
export async function finishStartup(router) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const splash = document.getElementById('site-splash')
  const emblem = splash?.querySelector('.splash-emblem')
  const minimumSequence = new Promise(resolve => setTimeout(resolve, reducedMotion ? 0 : 3200))
  let timeout
  let pulseTimer
  const move = e => {
    if (reducedMotion || !emblem) return
    const r = emblem.getBoundingClientRect()
    const x = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width / 2)))
    const y = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / (r.height / 2)))
    emblem.style.setProperty('--tilt-x', `${-y * 12}deg`)
    emblem.style.setProperty('--tilt-y', `${x * 16}deg`)
  }
  const reset = () => {
    emblem?.style.setProperty('--tilt-x', '0deg')
    emblem?.style.setProperty('--tilt-y', '0deg')
  }
  const pulse = () => {
    if (reducedMotion || !emblem) return
    emblem.classList.remove('is-pulsing')
    void emblem.offsetWidth
    emblem.classList.add('is-pulsing')
    clearTimeout(pulseTimer)
    pulseTimer = setTimeout(() => emblem.classList.remove('is-pulsing'), 700)
  }
  splash?.addEventListener('pointermove', move)
  splash?.addEventListener('pointerleave', reset)
  splash?.addEventListener('pointerdown', pulse)
  try {
    const resources = Promise.race([
      (async () => {
        await router.isReady()
        if (router.currentRoute.value.name === 'home') await homeReady
        if (document.readyState !== 'complete') await new Promise(resolve => window.addEventListener('load', resolve, { once: true }))
      })(),
      new Promise(resolve => { timeout = setTimeout(resolve, 10000) })
    ])
    await Promise.all([resources, minimumSequence])
  } finally {
    clearTimeout(timeout)
    clearTimeout(pulseTimer)
    splash?.removeEventListener('pointermove', move)
    splash?.removeEventListener('pointerleave', reset)
    splash?.removeEventListener('pointerdown', pulse)
    const finish = () => { splash?.remove(); startupComplete.value = true }
    if (!splash || reducedMotion) finish()
    else {
      splash.classList.add('leaving')
      splash.addEventListener('transitionend', e => { if (e.target === splash) finish() })
      setTimeout(finish, 500)
    }
  }
}
