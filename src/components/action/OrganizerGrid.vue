<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  items: { type: Array, default: () => [] }
})

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
        <div class="card-icon">
          <i :class="`fas ${item.icon}`"></i>
        </div>
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
  gap: var(--space-md);
  margin-top: var(--space-md);
}
.organizer-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
}
.organizer-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.organizer-card.expanded {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.card-main {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-weight: 600;
  color: var(--text);
}
.card-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 1.2rem;
  color: var(--primary);
  background: rgba(26, 115, 232, 0.08);
  transition: background var(--transition);
}
.organizer-card:hover .card-icon {
  background: var(--primary);
  color: #fff;
}
.qr-panel {
  width: 100%;
  max-height: 0;
  opacity: 0;
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  transition: max-height var(--transition-smooth), opacity 0.25s ease, padding 0.25s ease;
}
.organizer-card.expanded .qr-panel {
  max-height: 360px;
  opacity: 1;
  padding: var(--space-md);
}
.qr-img {
  width: 160px;
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: var(--shadow-md);
}
.qr-text {
  font-size: 0.95rem;
  color: var(--text-light);
}

@media (max-width: 576px) {
  .qr-img { width: 140px; }
}
</style>
