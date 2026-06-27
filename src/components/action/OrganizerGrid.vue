<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  items: { type: Array, default: () => [] } // [{ icon, name, qr?, text? }]
})

// 同一时间只展开一张卡片
const openIdx = ref(-1)
const toggle = (i) => {
  openIdx.value = openIdx.value === i ? -1 : i
}

const onDocClick = (e) => {
  if (!e.target.closest('.organizer-grid')) openIdx.value = -1
}
const onKey = (e) => {
  if (e.key === 'Escape') openIdx.value = -1
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="organizer-grid">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="organizer-card"
      :class="{ expanded: openIdx === i }"
      @click="toggle(i)"
    >
      <div class="card-main">
        <i :class="`fas ${item.icon}`"></i>
        <span>{{ item.name }}</span>
      </div>
      <div class="qr-panel">
        <img v-if="item.qr" class="qr-img" :src="item.qr" :alt="`${item.name} 招新群二维码`" />
        <p v-if="item.text" class="qr-text">{{ item.text }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.organizer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 12px;
}
.organizer-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
}
.organizer-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.organizer-card.expanded {
  transform: translateY(-6px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}
.card-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-main i {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  line-height: 38px;
  text-align: center;
  border-radius: 9px;
  font-size: 1.15rem;
  color: var(--primary);
  background: linear-gradient(135deg, rgba(26, 115, 232, 0.12), rgba(26, 115, 232, 0.06));
}
.qr-panel {
  width: 100%;
  max-height: 0;
  opacity: 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: max-height 0.36s cubic-bezier(0.2, 0.9, 0.2, 1),
    opacity 0.22s ease, padding 0.22s ease;
}
.organizer-card.expanded .qr-panel {
  max-height: 360px;
  opacity: 1;
  padding: 12px;
}
.qr-img {
  width: 160px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.qr-text {
  font-size: 0.95rem;
  color: #444;
}
@media (max-width: 420px) {
  .qr-img {
    width: 140px;
  }
}
</style>
