<script setup>
import { useJson } from '../composables/useJson'

const { data: leaders, loading, error } = useJson('/data/leaders.json', { initial: [] })
</script>

<template>
  <main class="leader-page">
    <h2 class="section-title">协会负责人</h2>

    <p v-if="loading" class="hint">加载中…</p>
    <p v-else-if="error" class="hint">加载失败</p>

    <article v-for="l in leaders" :key="l.name" v-reveal class="leader-card">
      <div class="session-number">{{ l.session }}</div>
      <img :src="l.avatar" :alt="l.name" class="leader-avatar" />
      <div class="leader-info">
        <h3 class="leader-name">{{ l.name }}</h3>
        <p class="leader-class">{{ l.class }}</p>
        <p class="leader-message">{{ l.message }}</p>
        <div class="leader-achievements">
          <h3>个人成就</h3>
          <ul>
            <li v-for="a in l.achievements" :key="a">{{ a }}</li>
          </ul>
        </div>
      </div>
    </article>
  </main>
</template>

<style scoped>
.leader-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 80px;
}
.hint {
  text-align: center;
  color: var(--text-light);
}
.leader-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 30px 0;
  padding: 25px 20px 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: var(--shadow);
  transition: transform var(--transition);
}
.leader-card:hover {
  transform: translateY(-5px);
}
.session-number {
  position: absolute;
  top: -15px;
  left: 20px;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  background: #4a6baf;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
.leader-avatar {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  border: 5px solid var(--bg-light);
  box-shadow: var(--shadow);
  margin-bottom: 20px;
}
.leader-info {
  width: 100%;
  text-align: center;
}
.leader-name {
  font-size: 24px;
  color: var(--text);
  margin-bottom: 5px;
}
.leader-class {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 15px;
}
.leader-message {
  padding: 0 20px;
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.6;
  color: #444;
  text-align: justify;
}
.leader-achievements {
  width: 100%;
  padding: 15px;
  border-radius: var(--radius);
  background: var(--bg-light);
}
.leader-achievements h3 {
  font-size: 18px;
  color: var(--text);
  margin-bottom: 10px;
}
.leader-achievements ul {
  padding-left: 20px;
  list-style: disc;
}
.leader-achievements li {
  margin-bottom: 8px;
  color: #555;
}

@media (max-width: 768px) {
  .leader-card {
    padding: 15px;
  }
  .leader-avatar {
    width: 120px;
    height: 120px;
  }
  .leader-message {
    padding: 0 10px;
  }
}
</style>
