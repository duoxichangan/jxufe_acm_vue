<script setup>
import { ref } from 'vue'
import { useJson } from '../composables/useJson'

const { data: links, loading, error } = useJson('/data/links.json', {
  initial: { official: [], members: [], apply: { requirements: [], contacts: [] } }
})

const opened = ref({})
const toggle = (name) => {
  opened.value[name] = !opened.value[name]
}
const linkText = (m) => m.linkText || '访问个人网站'
</script>

<template>
  <main class="links-page container-fluid">
    <!-- 装饰光斑 -->
    <div class="decorative-orb decorative-orb--primary" style="width:500px;height:500px;top:-200px;right:-150px;opacity:0.06"></div>
    <div class="decorative-orb decorative-orb--accent" style="width:350px;height:350px;bottom:10%;left:-120px;opacity:0.04"></div>

    <div class="container links-inner">
      <!-- 标题区 -->
      <header class="page-hero">
        <p class="page-label">FRIENDLY LINKS</p>
        <h1>友情<span class="highlight">链接</span></h1>
        <p class="page-desc">与我们携手共进的伙伴们</p>
      </header>

      <template v-if="loading">
        <div class="skeleton-list">
          <div v-for="n in 4" :key="n" class="skeleton" style="height:120px;border-radius:var(--radius-xl);margin-bottom:var(--space-md);"></div>
        </div>
      </template>

      <template v-else-if="error">
        <p class="hint">加载失败</p>
      </template>

      <template v-else>
        <!-- 官方友链 -->
        <section class="block">
          <h2 class="section-label"><i class="fas fa-university"></i> 官方友链</h2>
          <div class="official-grid">
            <article
              v-for="(o, i) in links.official"
              :key="o.name"
              v-reveal="'fade-up'"
              :style="{ '--reveal-index': i }"
              class="official-card"
            >
              <div class="official-icon">
                <img :src="o.icon" :alt="o.name" />
              </div>
              <div class="official-body">
                <h3>{{ o.name }}</h3>
                <p>{{ o.desc }}</p>
                <div class="official-actions">
                  <a v-if="o.website" :href="o.website" class="link-btn" target="_blank" rel="noreferrer">
                    访问网站 <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                  <button v-if="o.qrCode" class="toggle-btn" @click="toggle(o.name)">
                    {{ opened[o.name] ? '收起二维码' : '展开二维码' }}
                  </button>
                </div>
                <div v-if="o.qrCode" v-show="opened[o.name]" class="qr-code">
                  <img :src="o.qrCode" :alt="`${o.name} 招新群二维码`" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- 成员个人网站 -->
        <section class="block">
          <h2 class="section-label"><i class="fas fa-users"></i> 成员个人网站</h2>
          <div class="member-grid">
            <a
              v-for="(m, i) in links.members"
              :key="m.name"
              v-reveal="'scale-in'"
              :style="{ '--reveal-index': i }"
              :href="m.website"
              class="member-card"
              target="_blank"
              rel="noreferrer"
            >
              <div class="member-avatar">
                <img :src="m.avatar" :alt="m.name" />
              </div>
              <h3>{{ m.name }}</h3>
              <p class="member-role">{{ m.role }}</p>
              <p class="member-desc">{{ m.desc }}</p>
              <span class="member-link">{{ linkText(m) }} →</span>
            </a>
          </div>
        </section>

        <!-- 申请友链 -->
        <section class="apply-section">
          <h2 class="section-label"><i class="fas fa-handshake"></i> 申请友链</h2>
          <div class="apply-grid">
            <div class="apply-card">
              <h3><i class="fas fa-clipboard-list"></i> 申请要求</h3>
              <ul>
                <li v-for="r in links.apply.requirements" :key="r">{{ r }}</li>
              </ul>
            </div>
            <div class="apply-card">
              <h3><i class="fas fa-address-book"></i> 联系方式</h3>
              <p class="apply-intro">如果您希望与我们建立友情链接，请通过以下方式联系我们：</p>
              <div class="contact-grid">
                <div v-for="c in links.apply.contacts" :key="c.name" class="contact-person">
                  <h4>{{ c.name }}</h4>
                  <p v-if="c.email"><i class="fas fa-envelope"></i>{{ c.email }}</p>
                  <p v-if="c.phone"><i class="fas fa-phone"></i>{{ c.phone }}</p>
                  <p v-if="c.qq"><i class="fab fa-qq"></i>{{ c.qq }}</p>
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
/* ==========================================================================
   友情链接页
   ========================================================================== */
.links-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(ellipse 600px 400px at 80% 5%, rgba(26,115,232,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 400px 300px at 15% 90%, rgba(255,152,0,0.03) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.links-inner {
  position: relative;
  z-index: 1;
  width: 90%;
  margin: 0 auto;
}

/* ── 标题区 ── */
.page-hero {
  text-align: center;
  margin-bottom: 56px;
  padding: 0;
}
.page-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 4px;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 6px;
}
.page-hero h1 {
  font-size: 2.6rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 12px;
}
.page-hero h1 .highlight {
  color: var(--primary);
  position: relative;
}
.page-hero h1 .highlight::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 4px;
  width: 100%;
  height: 9px;
  background: rgba(26,115,232,0.12);
  border-radius: 2px;
  z-index: -1;
}
.page-desc {
  font-size: var(--font-size-base);
  color: var(--text-muted);
}

.hint {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-3xl) 0;
  font-size: var(--font-size-lg);
}
.skeleton-list {
  max-width: 800px;
  margin: 0 auto;
}

/* ── 小节标签 ── */
.block {
  margin-bottom: var(--space-2xl);
}
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.section-label i {
  color: var(--primary);
}

/* ── 官方友链 ── */
.official-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}
.official-card {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  transition: transform var(--transition-spring), box-shadow var(--transition), border-color var(--transition);
}
.official-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(26,115,232,0.07);
  border-color: rgba(26,115,232,0.12);
}
.official-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(26,115,232,0.06), rgba(26,115,232,0.02));
  display: flex;
  align-items: center;
  justify-content: center;
}
.official-icon img {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
}
.official-body {
  flex: 1;
  min-width: 0;
}
.official-body h3 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-xs);
}
.official-body > p {
  color: var(--text-light);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  margin-bottom: var(--space-md);
}
.official-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}
.link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: #fff;
  background: var(--gradient-primary);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.link-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  color: #fff;
}
.toggle-btn {
  padding: 8px 20px;
  border: 1px solid rgba(26,115,232,0.2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--primary);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.toggle-btn:hover {
  background: var(--primary);
  color: #fff;
}
.qr-code {
  margin-top: var(--space-md);
}
.qr-code img {
  max-width: 160px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

/* ── 成员个人网站 ── */
.member-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-md);
}
.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-xl);
  color: var(--text);
  transition: transform var(--transition-spring), box-shadow var(--transition), border-color var(--transition);
}
.member-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 36px rgba(26,115,232,0.08);
  border-color: rgba(26,115,232,0.15);
  color: var(--text);
}
.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(26,115,232,0.1);
  margin-bottom: var(--space-md);
  transition: border-color var(--transition), transform var(--transition-spring);
}
.member-card:hover .member-avatar {
  border-color: var(--primary);
  transform: scale(1.08);
}
.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.member-card h3 {
  font-size: var(--font-size-base);
  font-weight: 700;
  margin-bottom: 2px;
}
.member-role {
  font-size: var(--font-size-xs);
  color: var(--primary);
  font-weight: 500;
  margin-bottom: var(--space-sm);
}
.member-desc {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  line-height: 1.5;
  margin-bottom: var(--space-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.member-link {
  display: inline-block;
  margin-top: auto;
  padding: 6px 18px;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--primary);
  border: 1px solid rgba(26,115,232,0.15);
  transition: all var(--transition-fast);
}
.member-card:hover .member-link {
  background: var(--primary);
  color: #fff;
}

/* ── 申请友链 ── */
.apply-section {
  margin-bottom: var(--space-xl);
}
.apply-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}
.apply-card {
  padding: var(--space-xl);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}
.apply-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.apply-card h3 i {
  color: var(--primary);
}
.apply-card ul {
  list-style: none;
}
.apply-card li {
  position: relative;
  padding: var(--space-sm) 0 var(--space-sm) 28px;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  color: var(--text-light);
  font-size: var(--font-size-sm);
}
.apply-card li:last-child {
  border-bottom: none;
}
.apply-card li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--primary);
  font-weight: bold;
}
.apply-intro {
  color: var(--text-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-lg);
}
.contact-grid {
  display: grid;
  gap: var(--space-md);
}
.contact-person {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: rgba(26,115,232,0.03);
}
.contact-person h4 {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}
.contact-person p {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
  color: var(--text-light);
  font-size: var(--font-size-sm);
}
.contact-person i {
  width: 16px;
  color: var(--primary);
  text-align: center;
}

/* ── 响应式 ── */
@media (max-width: 1200px) {
  .member-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 1024px) {
  .member-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .links-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero {
    margin-bottom: 48px;
  }
  .page-hero h1 {
    font-size: 2rem;
  }
  .official-grid {
    grid-template-columns: 1fr;
  }
  .member-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .apply-grid {
    grid-template-columns: 1fr;
  }
  .official-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .official-actions {
    justify-content: center;
  }
}
@media (max-width: 480px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .member-grid {
    grid-template-columns: 1fr;
  }
}
</style>
