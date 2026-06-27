<script setup>
import { useJson } from '../composables/useJson'

const { data: members, loading, error } = useJson('/data/members.json', { initial: [] })
const fallback = '/images/excellent_member/default.png'
</script>

<template>
  <main class="excellent-page">
    <h2 class="section-title">优秀成员</h2>

    <p v-if="loading" class="hint">加载中…</p>
    <p v-else-if="error" class="hint">加载失败</p>

    <div v-else class="grid">
      <article v-for="m in members" :key="m.name" v-reveal class="member-card">
        <div class="member-photo">
          <img :src="m.photo" :alt="m.name" @error="$event.target.src = fallback" />
        </div>
        <div class="member-info">
          <h3>{{ m.name }}</h3>
          <p><strong>班级：</strong>{{ m.class }}</p>
          <div class="honors">
            <strong>荣誉 / 毕业去向：</strong>
            <ul>
              <li v-for="h in m.honors" :key="h">{{ h }}</li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  </main>
</template>

<style scoped>
.excellent-page {
  max-width: 1500px;
  margin: 0 auto;
  padding: 30px 20px 80px;
}
.hint {
  text-align: center;
  color: var(--text-light);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  padding: 20px;
  justify-content: center;
}
.member-card {
  display: flex;
  flex-direction: column;
  width: 300px;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  transition: transform var(--transition);
}
.member-card:hover {
  transform: translateY(-5px);
}
.member-photo {
  position: relative;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
.member-photo::after {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 0;
  height: 2px;
  background: var(--primary);
}
.member-photo img {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid var(--primary);
}
.member-info {
  flex: 1;
  padding: 20px;
}
.member-info h3 {
  margin-bottom: 10px;
  text-align: center;
  color: var(--primary);
}
.member-info p {
  margin: 8px 0;
  color: #555;
}
.honors {
  margin-top: 10px;
}
.honors ul {
  margin: 8px 0 0 20px;
  list-style: disc;
}
.honors li {
  margin-bottom: 8px;
  color: #555;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .member-photo::after {
    display: none;
  }
}
</style>
