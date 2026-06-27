<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useJson } from '../composables/useJson'
import BlockRenderer from '../components/action/BlockRenderer.vue'

const route = useRoute()
const { data: actions, loading, error } = useJson('/data/actions.json', { initial: [] })

const article = computed(() =>
  (actions.value || []).find((a) => a.slug === route.params.slug)
)
</script>

<template>
  <main class="action-page">
    <div class="container">
      <p v-if="loading" class="hint">加载中…</p>
      <p v-else-if="error" class="hint">加载失败</p>
      <p v-else-if="!article" class="hint">未找到该文章</p>

      <article v-else class="article">
        <header class="article-header">
          <h1>{{ article.title }}</h1>
          <p class="subtitle">{{ article.subtitle }}</p>
        </header>

        <div class="article-body">
          <BlockRenderer v-for="(block, i) in article.blocks" :key="i" :block="block" />
        </div>

        <RouterLink to="/all-action" class="back-link">← 返回大事记</RouterLink>
      </article>
    </div>
  </main>
</template>

<style scoped>
.action-page {
  padding: 20px 0 80px;
}
.hint {
  text-align: center;
  color: var(--text-light);
  padding: 60px 0;
}
.article {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}
.article-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--primary);
}
.article-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 10px;
}
.subtitle {
  font-size: 1.1rem;
  color: var(--text-light);
  font-style: italic;
}
.article-body {
  line-height: 1.7;
  color: #333;
}
.article-body :deep(strong) {
  color: var(--primary-dark);
}
.article-body :deep(a) {
  color: var(--primary);
  text-decoration: underline;
}
.back-link {
  display: inline-block;
  margin-top: 40px;
  color: var(--primary);
  font-weight: 500;
}
.back-link:hover {
  color: var(--primary-dark);
}

@media (max-width: 576px) {
  .article-header h1 {
    font-size: 1.6rem;
  }
}
</style>
