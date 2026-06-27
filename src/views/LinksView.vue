<script setup>
import { ref } from 'vue'
import { useJson } from '../composables/useJson'

const { data: links, loading, error } = useJson('/data/links.json', {
  initial: { official: [], members: [], apply: { requirements: [], contacts: [] } }
})

// 招新群二维码展开状态（按官方友链 name 索引）
const opened = ref({})
const toggle = (name) => {
  opened.value[name] = !opened.value[name]
}
const linkText = (m) => m.linkText || '访问个人网站'
</script>

<template>
  <main class="links-page">
    <div class="container">
      <section class="links-header">
        <h1>友情链接</h1>
        <p>与我们携手共进的伙伴们</p>
      </section>

      <template v-if="loading">
        <p class="hint">加载中…</p>
      </template>
      <template v-else-if="error">
        <p class="hint">加载失败</p>
      </template>
      <template v-else>
        <!-- 官方友链 -->
        <section class="block">
          <h2 class="section-title"><i class="fas fa-university"></i> 官方友链</h2>
          <div class="official-grid">
            <article v-for="o in links.official" :key="o.name" v-reveal class="official-card">
              <div class="official-icon">
                <img :src="o.icon" :alt="o.name" />
              </div>
              <div class="official-body">
                <h3>{{ o.name }}</h3>
                <p>{{ o.desc }}</p>

                <a v-if="o.website" :href="o.website" class="link-btn" target="_blank" rel="noreferrer"
                  >访问网站</a
                >

                <button v-if="o.qrCode" class="toggle-btn" @click="toggle(o.name)">
                  {{ opened[o.name] ? '收起招新群二维码' : '展开招新群二维码' }}
                </button>
                <div v-if="o.qrCode" v-show="opened[o.name]" class="qr-code">
                  <img :src="o.qrCode" :alt="`${o.name} 招新群二维码`" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- 成员个人网站 -->
        <section class="block">
          <h2 class="section-title"><i class="fas fa-users"></i> 成员个人网站</h2>
          <div class="member-grid">
            <a
              v-for="m in links.members"
              :key="m.name"
              v-reveal
              :href="m.website"
              class="member-card"
              target="_blank"
              rel="noreferrer"
            >
              <div class="member-avatar">
                <img :src="m.avatar" :alt="m.name" />
              </div>
              <div class="member-info">
                <h3>{{ m.name }}</h3>
                <p class="member-role">{{ m.role }}</p>
                <p class="member-desc">{{ m.desc }}</p>
                <span class="member-link">{{ linkText(m) }}</span>
              </div>
            </a>
          </div>
        </section>

        <!-- 申请友链 -->
        <section class="apply-section">
          <h2 class="section-title"><i class="fas fa-handshake"></i> 申请友链</h2>
          <div class="apply-content">
            <div class="apply-requirements">
              <h3>申请要求</h3>
              <ul>
                <li v-for="r in links.apply.requirements" :key="r">{{ r }}</li>
              </ul>
            </div>
            <div class="apply-contact">
              <h3>联系方式</h3>
              <p>如果您希望与我们建立友情链接，请通过以下方式联系我们：</p>
              <div class="contact-info">
                <div v-for="c in links.apply.contacts" :key="c.name" class="contact-person">
                  <h4>{{ c.name }}</h4>
                  <p v-if="c.email"><i class="fas fa-envelope"></i> 邮箱：{{ c.email }}</p>
                  <p v-if="c.phone"><i class="fas fa-phone"></i> 电话：{{ c.phone }}</p>
                  <p v-if="c.qq"><i class="fab fa-qq"></i> QQ：{{ c.qq }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.links-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
.links-header {
  text-align: center;
  padding: 60px 0;
  margin-bottom: 60px;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: 0 0 50px 50px;
}
.links-header h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.links-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.block {
  margin-bottom: 80px;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--primary);
}
.section-title i {
  margin-right: 15px;
  font-size: 1.8rem;
}
.hint {
  text-align: center;
  color: var(--text-light);
}

/* 官方友链 */
.official-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 40px 50px;
  padding: 0 20px;
}
.official-card {
  padding: 20px;
  text-align: center;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform var(--transition), box-shadow var(--transition);
}
.official-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}
.official-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.official-icon img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}
.official-body h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: var(--text);
}
.official-body p {
  margin-bottom: 20px;
  color: var(--text-light);
  line-height: 1.6;
}
.link-btn {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  color: #fff;
  background: var(--primary);
  transition: background var(--transition), transform var(--transition);
}
.link-btn:hover {
  background: var(--primary-dark);
  color: #fff;
  transform: scale(1.05);
}
.toggle-btn {
  margin-top: 10px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  color: #fff;
  background: #007bff;
  cursor: pointer;
  transition: background var(--transition);
}
.toggle-btn:hover {
  background: #0056b3;
}
.qr-code {
  margin-top: 12px;
}
.qr-code img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
}

/* 成员个人网站 */
.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
  gap: 40px 50px;
  justify-content: center;
}
.member-card {
  padding: 20px;
  text-align: center;
  border: 2px solid #e9ecef;
  border-radius: var(--radius-lg);
  background: #f8f9fa;
  color: var(--text);
  overflow: hidden;
  transition: background var(--transition), color var(--transition),
    transform var(--transition), box-shadow var(--transition), border-color var(--transition);
  animation: fadeInUp 0.6s ease-out;
}
.member-card:hover {
  background: linear-gradient(135deg, #4285f4, #1a73e8);
  color: #fff;
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(66, 133, 244, 0.3);
  border-color: #4285f4;
}
.member-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e9ecef;
  transition: border-color var(--transition), transform var(--transition);
}
.member-card:hover .member-avatar {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}
.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.member-info h3 {
  font-size: 1.1rem;
  margin-bottom: 5px;
  font-weight: 600;
}
.member-role {
  color: var(--primary);
  font-weight: 500;
  margin-bottom: 10px;
  font-size: 0.85rem;
}
.member-card:hover .member-role {
  color: rgba(255, 255, 255, 0.9);
}
.member-desc {
  margin-bottom: 15px;
  color: var(--text-light);
  font-size: 0.85rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.member-card:hover .member-desc {
  color: rgba(255, 255, 255, 0.8);
}
.member-link {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.85rem;
  color: #fff;
  background: var(--primary);
  border: 2px solid var(--primary);
  transition: background var(--transition), color var(--transition),
    border-color var(--transition), transform var(--transition);
}
.member-card:hover .member-link {
  background: #fff;
  color: var(--primary);
  border-color: #fff;
  transform: translateY(-2px);
}

/* 申请友链 */
.apply-section {
  margin-bottom: 60px;
  padding: 50px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
.apply-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  margin-top: 30px;
}
.apply-requirements h3,
.apply-contact h3 {
  color: var(--primary);
  margin-bottom: 20px;
  font-size: 1.3rem;
}
.apply-requirements ul {
  list-style: none;
}
.apply-requirements li {
  position: relative;
  padding: 10px 0 10px 30px;
  border-bottom: 1px solid #eee;
}
.apply-requirements li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary);
  font-weight: bold;
}
.apply-requirements li:last-child {
  border-bottom: none;
}
.contact-info {
  margin-top: 20px;
}
.contact-person {
  margin-bottom: 20px;
}
.contact-person h4 {
  margin-bottom: 8px;
}
.contact-info p {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.contact-info i {
  margin-right: 10px;
  width: 20px;
  color: var(--primary);
}

@media (max-width: 900px) {
  .member-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}
@media (max-width: 768px) {
  .links-header {
    padding: 40px 0;
    margin-bottom: 40px;
  }
  .links-header h1 {
    font-size: 2rem;
  }
  .section-title {
    font-size: 1.5rem;
  }
  .official-grid,
  .member-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .apply-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .apply-section {
    padding: 30px 20px;
  }
}
</style>
