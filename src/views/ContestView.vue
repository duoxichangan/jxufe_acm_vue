<script setup>
import { useJson } from '../composables/useJson'

const { data: competitions, loading, error } = useJson('/data/competitions.json', {
  initial: []
})
</script>

<template>
  <main class="contest-page">
    <h1 class="page-title">竞赛信息</h1>

    <p v-if="loading" class="hint">加载中…</p>
    <p v-else-if="error" class="hint">加载失败</p>

    <div v-else class="grid">
      <RouterLink
        v-for="c in competitions"
        :key="c.slug"
        v-reveal
        :to="`/competition/${c.slug}`"
        class="card"
      >
        <img :src="c.image" :alt="c.name" class="card-image" />
        <div class="card-body">
          <h2>{{ c.name }}</h2>
          <p>{{ c.desc }}</p>
          <span class="btn btn-primary">查看详情</span>
        </div>
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.contest-page {
  max-width: 1600px;
  margin: 40px auto;
  padding: 0 20px;
}
.page-title {
  text-align: center;
  font-size: 2.2rem;
  color: var(--primary-dark);
  margin-bottom: 40px;
}
.hint {
  text-align: center;
  color: var(--text-light);
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(250px, 1fr));
  gap: 30px;
}
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  color: var(--text);
  transition: transform var(--transition), box-shadow var(--transition);
}
.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
  color: var(--text);
}
.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
}
.card-body h2 {
  font-size: 1.5rem;
  color: var(--text);
  margin-bottom: 10px;
}
.card-body p {
  flex: 1;
  margin-bottom: 20px;
  color: var(--text-light);
  line-height: 1.6;
}
.card .btn {
  align-self: flex-start;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .page-title {
    font-size: 1.8rem;
  }
}
</style>
