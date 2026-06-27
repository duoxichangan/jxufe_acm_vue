<script setup>
import { renderInline } from '../../utils/inline.js'
import OrganizerGrid from './OrganizerGrid.vue'

defineOptions({ name: 'BlockRenderer' })

defineProps({
  block: { type: Object, required: true }
})

const html = (s) => renderInline(s)
const cells = (row) => row.map((c) => (typeof c === 'string' ? { text: c } : c))
</script>

<template>
  <!-- 段落 -->
  <section v-if="block.type === 'text'" class="b-text">
    <p v-for="(p, i) in block.paras" :key="i" v-html="html(p)"></p>
  </section>

  <!-- 小标题 -->
  <h2 v-else-if="block.type === 'heading'" class="b-heading">
    <i v-if="block.icon" :class="`fas ${block.icon}`"></i>
    <span v-html="html(block.text)"></span>
  </h2>

  <!-- 图片组 -->
  <section v-else-if="block.type === 'images'" class="b-images">
    <figure v-for="(img, i) in block.items" :key="i">
      <img :src="img.src" :alt="img.alt || ''" loading="lazy" />
      <figcaption v-if="img.caption">{{ img.caption }}</figcaption>
    </figure>
  </section>

  <!-- 获奖卡片 -->
  <section v-else-if="block.type === 'awards'" class="b-awards">
    <h2 v-if="block.heading" v-html="html(block.heading)"></h2>
    <div class="award-card" v-for="(card, i) in block.cards" :key="i">
      <h3 v-html="html(card.title)"></h3>
      <p v-for="(f, j) in card.fields" :key="j">
        <strong>{{ f.label }}：</strong>{{ f.value }}
      </p>
      <p v-if="card.highlight" class="highlight" v-html="html(card.highlight)"></p>
      <img
        v-for="(src, k) in card.images || []"
        :key="k"
        :src="src"
        class="award-image"
        alt="获奖照片"
        loading="lazy"
      />
    </div>
  </section>

  <!-- 高亮引述 -->
  <blockquote v-else-if="block.type === 'highlight'" class="b-highlight" v-html="html(block.text)"></blockquote>

  <!-- 合作高校 logo -->
  <section v-else-if="block.type === 'partners'" class="b-partners">
    <div class="partner-logos">
      <img v-for="(l, i) in block.logos" :key="i" :src="l.src" :alt="l.alt" class="partner-logo" loading="lazy" />
    </div>
    <p v-if="block.note" class="partner-note">{{ block.note }}</p>
  </section>

  <!-- 列表 -->
  <section v-else-if="block.type === 'list'" class="b-list">
    <p v-if="block.intro" v-html="html(block.intro)"></p>
    <ul>
      <li v-for="(it, i) in block.items" :key="i" v-html="html(it)"></li>
    </ul>
  </section>

  <!-- 表格 -->
  <section v-else-if="block.type === 'table'" class="b-table">
    <div class="table-wrap">
      <table>
        <thead v-if="block.headers">
          <tr>
            <th v-for="(h, i) in block.headers" :key="i">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in block.rows" :key="i">
            <td
              v-for="(c, j) in cells(row)"
              :key="j"
              :rowspan="c.rowspan"
              :colspan="c.colspan"
              v-html="html(c.text)"
            ></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- 信息卡片网格 -->
  <section v-else-if="block.type === 'info'" class="b-info">
    <h2 v-if="block.heading">
      <i v-if="block.icon" :class="`fas ${block.icon}`"></i>
      <span v-html="html(block.heading)"></span>
    </h2>
    <div class="info-grid">
      <div class="info-card" v-for="(c, i) in block.cards" :key="i">
        <i :class="`fas ${c.icon}`"></i>
        <h3>{{ c.title }}</h3>
        <p>{{ c.desc }}</p>
      </div>
    </div>
  </section>

  <!-- 主办部门 -->
  <section v-else-if="block.type === 'organizers'" class="b-organizers">
    <h2 v-if="block.heading">
      <i v-if="block.icon" :class="`fas ${block.icon}`"></i>
      <span v-html="html(block.heading)"></span>
    </h2>
    <OrganizerGrid :items="block.items" />
  </section>

  <!-- 学习平台列表 -->
  <section v-else-if="block.type === 'platformList'" class="b-platform">
    <ul>
      <li v-for="(it, i) in block.items" :key="i">
        <i class="fas fa-link"></i>
        <strong>{{ it.name }}</strong>：{{ it.desc }}
      </li>
    </ul>
  </section>

  <!-- FAQ -->
  <section v-else-if="block.type === 'faq'" class="b-faq">
    <details v-for="(item, i) in block.items" :key="i" open>
      <summary v-html="html(item.q)"></summary>
      <div class="faq-answer">
        <BlockRenderer v-for="(b, j) in item.a" :key="j" :block="b" />
      </div>
    </details>
  </section>
</template>

<style scoped>
.b-text { margin-bottom: 28px; }
.b-text p { margin-bottom: 14px; }

.b-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 40px 0 20px;
  color: var(--primary-dark);
  font-size: 1.45rem;
  font-weight: 700;
  padding-bottom: 12px;
  position: relative;
}
.b-heading::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 3px;
  border-radius: 2px;
  background: var(--gradient-primary);
}
.b-heading i { color: var(--primary); }

.b-images {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  margin: 32px 0;
}
.b-images figure,
.b-join .qr-row figure {
  flex: 1 1 300px;
  max-width: 480px;
  text-align: center;
}
.b-images img,
.award-image,
.b-join .qr-row img {
  width: 100%;
  max-width: 800px;
  margin: 12px auto;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.b-images figcaption,
.b-join .qr-row figcaption {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 6px;
}

.b-awards .award-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: box-shadow var(--transition);
}
.b-awards .award-card:hover {
  box-shadow: 0 6px 24px rgba(26,115,232,0.06);
}
.b-awards h3 {
  color: var(--primary);
  font-size: 1.1rem;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.b-awards p { margin: 8px 0; font-size: 0.95rem; }
.highlight {
  color: #d9534f;
  font-weight: bold;
  font-style: italic;
}

.b-highlight {
  background: linear-gradient(135deg, rgba(26,115,232,0.03), rgba(26,115,232,0.01));
  border-left: 4px solid var(--primary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: var(--space-lg);
  margin: var(--space-lg) 0;
  font-size: 1.05rem;
  color: var(--primary-dark);
}

.b-partners .partner-logos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-lg);
  margin: var(--space-lg) 0;
}
.partner-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  transition: transform var(--transition-spring);
}
.partner-logo:hover {
  transform: scale(1.08);
}
.partner-note { text-align: center; color: var(--text-muted); font-size: var(--font-size-sm); }

.b-list ul { margin: 8px 0 20px 20px; list-style: disc; color: var(--text-light); }
.b-list li { margin-bottom: 8px; }

.b-table { margin: var(--space-lg) 0; }
.table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.06);
}
table { width: 100%; border-collapse: collapse; }
th, td { padding: 14px 16px; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05); }
th {
  background: var(--primary-dark);
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
}
tr:nth-child(even) { background: rgba(26,115,232,0.02); }
tr:hover { background: rgba(26,115,232,0.06); }

.b-info h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-dark);
  font-size: 1.3rem;
  font-weight: 700;
  margin: 40px 0 20px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
.info-card {
  text-align: center;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-lg);
  transition: transform var(--transition-spring), box-shadow var(--transition), border-color var(--transition);
}
.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(26,115,232,0.08);
  border-color: rgba(26,115,232,0.15);
}
.info-card i {
  font-size: 2rem;
  color: var(--primary);
  margin-bottom: var(--space-sm);
}
.info-card h3 {
  margin-bottom: var(--space-sm);
  color: var(--primary-dark);
  font-size: var(--font-size-base);
}

.b-join .qr-row {
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
  margin: 16px 0;
}
.b-join .qr-row img { max-width: 300px; }
.qr-note { text-align: center; margin-top: 1rem; color: var(--text-muted); }

.b-organizers { margin: 32px 0; }
.b-organizers h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-dark);
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.b-platform ul { list-style: none; }
.b-platform li {
  display: flex;
  padding: var(--space-md);
  margin: var(--space-xs) 0;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.b-platform li:hover {
  background: rgba(26,115,232,0.03);
  transform: translateX(6px);
}
.b-platform li i { margin-right: 10px; color: var(--primary); }

.b-faq details {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  transition: box-shadow var(--transition), border-color var(--transition);
}
.b-faq details:hover {
  border-color: rgba(26,115,232,0.12);
}
.b-faq details[open] {
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  border-color: rgba(26,115,232,0.1);
}
.b-faq summary {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 1rem;
  cursor: pointer;
  list-style: none;
  padding: 4px 0;
}
.b-faq summary::-webkit-details-marker { display: none; }
.b-faq summary::before {
  content: '▸';
  display: inline-block;
  margin-right: 8px;
  color: var(--primary);
  transition: transform var(--transition-spring);
}
.b-faq details[open] summary::before { transform: rotate(90deg); }
.faq-answer { padding-left: 20px; margin-top: 14px; border-left: 2px solid rgba(26,115,232,0.1); }
.faq-answer :deep(strong) { color: var(--primary-dark); }

@media (max-width: 768px) {
  .partner-logo { width: 80px; height: 80px; }
}
</style>
