<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { startupComplete } from '../utils/startup.js'
const route = useRoute()
const dialog = ref(null)
let previousFocus
function close() { dialog.value?.close() }
function remember() {
  previousFocus?.focus?.()
}
function outside(e) {
  if (e.target !== dialog.value) return
  const r = dialog.value.getBoundingClientRect()
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close()
}
watch([startupComplete, () => route.name], async ([ready, name]) => {
  if (name !== 'home') { if (dialog.value?.open) close(); return }
  if (!ready) return
  await nextTick()
  if (route.name !== 'home' || dialog.value?.open) return
  previousFocus = document.activeElement
  dialog.value?.showModal()
}, { immediate: true, flush: 'post' })
</script>
<template>
  <dialog ref="dialog" class="welcome-notice" aria-labelledby="welcome-title" aria-describedby="welcome-copy" @close="remember" @click="outside" @wheel.stop>
    <button type="button" class="notice-close" aria-label="关闭说明" @click="close">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
    </button>
    <div class="notice-brand">
      <img src="/images/favicon.png" width="44" height="44" alt="" />
      <span>代码与日常<span class="notice-label">A PERSONAL BLOG</span></span>
    </div>
    <div class="notice-body">
      <p class="notice-kicker">个人博客网站说明</p>
      <h2 id="welcome-title">很高兴，在这里遇见你<span>。</span></h2>
      <div id="welcome-copy">
        <p>这是我的个人博客，记录学习路上的收获、技术探索与项目实践，也收藏日常生活里的小事。</p>
        <p>这里还有朋友们的故事和有趣的经历。希望你能找到一点灵感，也欢迎随时交流想法。</p>
      </div>
    </div>
    <div class="notice-footer">
      <span>从一段记录，开始认识。</span>
      <button type="button" class="notice-start" autofocus @click="close">开始浏览
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
  </dialog>
</template>
<style scoped>
.welcome-notice {
  position:fixed; inset:0; margin:auto; box-sizing:border-box;
  width:min(540px,calc(100% - 32px)); max-height:calc(100dvh - 40px);
  overflow:auto; padding:0; border:1px solid rgba(255,255,255,.9);
  border-radius:24px; box-shadow:0 24px 80px rgba(24,49,78,.18);
  background:var(--bg); color:var(--text);
}
.welcome-notice::backdrop { background:rgba(26,42,62,.28); backdrop-filter:blur(8px); }
.notice-brand { display:flex; align-items:center; gap:12px; padding:28px 36px 22px;
  background:linear-gradient(125deg,#f1f7fd, #fff 80%); color:#3d5369; font-size:14px; font-weight:600; }
.notice-brand img { object-fit:contain; flex-shrink:0; }
.notice-label { display:block; margin-top:5px; font-size:9px; font-weight:500; letter-spacing:2px; color:#8a9bac; }
.notice-close { position:absolute; right:16px; top:16px; display:grid; place-items:center;
  width:32px; height:32px; padding:0; border:0; border-radius:50%;
  background:transparent; color:#84909c; cursor:pointer; transition:background .2s,color .2s; }
.notice-close:hover { background:#edf2f7; color:#324b66; }
.notice-body { padding:12px 36px 28px; }
.notice-kicker { margin:0 0 12px; font-size:11px; letter-spacing:1px; color:#8090a0; }
.welcome-notice h2 { margin:0 0 20px; font-size:25px; font-weight:600; line-height:1.5; letter-spacing:-.5px; }
.welcome-notice h2 span { color:var(--primary); }
#welcome-copy { font-size:14px; line-height:1.95; color:#6c7885; }
#welcome-copy p { margin:0; }
#welcome-copy p + p { margin-top:12px; }
.notice-footer { display:flex; align-items:center; justify-content:space-between; gap:16px;
  margin:0 36px; padding:22px 0 28px; border-top:1px solid #edf1f5; }
.notice-footer > span { font-size:11px; color:#94a0ad; }
.notice-start { display:inline-flex; align-items:center; justify-content:center; gap:18px;
  padding:12px 18px; border:0; border-radius:10px; font:inherit; font-size:13px;
  background:var(--primary); color:white; cursor:pointer; transition:background .2s,transform .2s; }
.notice-start:hover { background:var(--primary-dark); transform:translateY(-1px); }
.welcome-notice button:focus-visible { outline:2px solid #9dc4f5; outline-offset:3px; }
@media(max-width:576px) {
  .notice-brand { padding:24px 24px 18px; }
  .notice-body { padding:12px 24px 24px; }
  .welcome-notice h2 { font-size:22px; }
  .notice-footer { margin:0 24px; padding:20px 0 24px; }
  .notice-footer > span { max-width:100px; line-height:1.7; }
  .notice-start { flex-shrink:0; gap:12px; }
}
@media(prefers-reduced-motion:reduce) { .notice-start,.notice-close { transition:none; } }
</style>
