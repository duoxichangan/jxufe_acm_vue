<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadArticle } from '../utils/eventsSource.js'
import BlockRenderer from '../components/action/BlockRenderer.vue'
import AuthorSwitcher from '../components/action/AuthorSwitcher.vue'

const route = useRoute()
const router = useRouter()

// 一篇文章 = events/<年>.json 里 articles[id]
//
// 路由只有一条 /post/:id，id 就是卡片 link 的值，恒等于某年文件 articles 里的 key。
// 大事记与竞赛数据（competitions.json + awards/）完全独立：这里只读 events/。
//
// loadArticle(id) 内部：id 前 4 位就是年份，直接定位年份文件；
// 若该年文件已因时间轴加载过则直接命中内存，否则补发一次请求。
const id = computed(() => route.params.id)

const article = ref(null)
const loading = ref(true)
const error = ref(false)

// ── 多作者文章（保研经验分享）：一条大事记里放多位分享人，一次只看一位 ──
// 正文在 authors[i].blocks；没有 authors 的文章（其余全部文章）走原来的 article.blocks。
const authors = computed(() => (Array.isArray(article.value?.authors) ? article.value.authors : []))
const isMultiAuthor = computed(() => authors.value.length > 0)
const activeIndex = ref(0)

const activeAuthor = computed(() => authors.value[activeIndex.value] || null)
/** 当前要渲染的 blocks：多作者取选中那位，普通文章取顶层 */
const blocks = computed(() => (isMultiAuthor.value ? activeAuthor.value?.blocks || [] : article.value?.blocks || []))

/** 分享人定位支持 URL 参数 ?a=<序号>，刷新 / 分享链接能落到同一个人 */
const indexFromQuery = () => {
  const n = Number.parseInt(String(route.query.a ?? ''), 10)
  return Number.isInteger(n) && n >= 0 && n < authors.value.length ? n : 0
}

function selectAuthor(i) {
  if (i === activeIndex.value) return
  activeIndex.value = i
  // replace 而非 push：连点几个人不该在浏览历史里堆一串记录，但地址栏仍可分享
  router.replace({
    query: i === 0 ? {} : { ...route.query, a: String(i) }
  })
}

// 换人后正文长度会变，视线留在原地容易落到半截：回到文章顶部
watch(activeIndex, async () => {
  await nextTick()
  document.documentElement.scrollTop = 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

watch(
  () => route.query.a,
  () => {
    if (isMultiAuthor.value) activeIndex.value = indexFromQuery()
  }
)

watch(
  id,
  async (v) => {
    loading.value = true
    error.value = false
    article.value = null
    if (!v) {
      loading.value = false
      return
    }
    try {
      // 返回 null 表示文件不存在（→ 未找到该文章）；抛错表示加载失败
      article.value = await loadArticle(v)
      activeIndex.value = indexFromQuery()
    } catch (e) {
      console.error(`加载文章 ${v} 失败:`, e)
      error.value = true
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

const failed = computed(() => error.value)
</script>

<template>
  <main class="detail-page container-fluid">
    <!-- 装饰光斑 -->
    <div class="decorative-orb decorative-orb--primary" style="width:500px;height:500px;top:-200px;right:-150px;opacity:0.06"></div>
    <div class="decorative-orb decorative-orb--accent" style="width:350px;height:350px;bottom:15%;left:-120px;opacity:0.04"></div>

    <div class="container detail-inner">
      <!-- Loading -->
      <div v-if="loading" class="skeleton-list">
        <div class="skeleton" style="height:60px;width:60%;border-radius:var(--radius-md);margin:0 auto var(--space-md);"></div>
        <div class="skeleton" style="height:24px;width:40%;border-radius:var(--radius-md);margin:0 auto var(--space-xl);"></div>
        <div v-for="n in 6" :key="n" class="skeleton" style="height:80px;border-radius:var(--radius-md);margin-bottom:var(--space-md);"></div>
      </div>

      <!-- Error / Not found -->
      <p v-else-if="failed" class="hint">加载失败</p>
      <p v-else-if="!article" class="hint">未找到该文章</p>

      <!-- 文章 -->
      <article v-else>
        <header class="article-header">
          <p class="article-label">ACTION DETAIL</p>
          <h1>{{ article.title }}</h1>
          <div class="header-divider"></div>
          <p v-if="article.subtitle" class="subtitle">{{ article.subtitle }}</p>
        </header>

        <!-- 多位分享人：选一个人看（正文一次只放一位，两位都是长篇） -->
        <AuthorSwitcher
          v-if="isMultiAuthor"
          :authors="authors"
          :active="activeIndex"
          @select="selectAuthor"
        />

        <div
          id="post-body"
          class="article-body"
          :class="{ 'article-body--switching': isMultiAuthor }"
          :role="isMultiAuthor ? 'tabpanel' : null"
        >
          <Transition name="author-fade" mode="out-in">
            <div :key="isMultiAuthor ? activeIndex : 'single'">
              <BlockRenderer v-for="(block, i) in blocks" :key="i" :block="block" />
            </div>
          </Transition>
        </div>

        <RouterLink to="/all-action" class="back-link">
          <i class="fa-solid fa-arrow-left"></i> 返回大事记
        </RouterLink>
      </article>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   大事记详情页
   ========================================================================== */
.detail-page {
  position: relative;
  overflow: clip;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 80px) 0 var(--space-3xl);
  background:
    radial-gradient(ellipse 600px 400px at 80% 5%, rgba(26,115,232,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 400px 300px at 15% 90%, rgba(255,152,0,0.03) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.detail-inner {
  position: relative;
  z-index: 1;
  width: 90%;
  margin: 0 auto;
}

.hint {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-3xl) 0;
  font-size: var(--font-size-lg);
}

/* ── Loading ── */
.skeleton-list {
  max-width: 700px;
  margin: 0 auto;
}

/* ── 文章容器 ── */
article {
  padding: 0;
}

/* ── 标题区 ── */
.article-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.article-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 4px;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 8px;
}
.article-header h1 {
  font-size: 2.4rem;
  font-weight: 700;
  color: var(--primary-dark);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-md);
}
.header-divider {
  width: 60px;
  height: 3px;
  margin: 0 auto var(--space-md);
  border-radius: 2px;
  background: var(--gradient-primary);
}
.subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-muted);
  line-height: 1.6;
}

/* ── 正文 ── */
.article-body {
  line-height: var(--line-height-relaxed);
  color: #333;
  font-size: var(--font-size-lg);
}
.article-body :deep(strong) {
  color: var(--primary-dark);
}
.article-body :deep(a) {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}
/* 划掉的话（原文用 `~~…~~` 自嘲的那些）：压暗一档，别和正文抢注意力 */
.article-body :deep(del) {
  color: var(--text-muted);
  text-decoration: line-through;
}

/* ── 换分享人时的淡入淡出 ──
   mode="out-in" + 固定高度容器：退场是绝对定位的，容器高度由进场的那份撑着，
   所以长文换短文不会出现「页面先塌一下再弹回来」。 */
.author-fade-enter-active,
.author-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.author-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.author-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
.article-body--switching {
  position: relative;
}

/* ── 返回链接 ── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--space-2xl);
  padding: 10px 24px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(26,115,232,0.15);
  color: var(--primary);
  font-weight: 600;
  font-size: var(--font-size-sm);
  transition: all var(--transition-spring);
}
.back-link:hover {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  transform: translateX(-4px);
  box-shadow: 0 4px 16px rgba(26,115,232,0.2);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .detail-page {
    padding: calc(var(--header-height) + 50px) 0 var(--space-2xl);
  }
  .article-header h1 {
    font-size: 1.8rem;
  }
}
@media (max-width: 576px) {
  .article-header h1 {
    font-size: 1.5rem;
  }
}
</style>
