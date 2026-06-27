<script setup>
import { renderInline } from '../../utils/inline.js'
import OrganizerGrid from './OrganizerGrid.vue'

defineOptions({ name: 'BlockRenderer' })

defineProps({
  block: { type: Object, required: true }
})

// 把可能含 **bold** / [text](url) 的字符串转成 HTML（先转义，安全）
const html = (s) => renderInline(s)

// 表格单元格统一成对象，便于绑定 rowspan / colspan
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

  <!-- 表格（支持 rowspan/colspan） -->
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

  <!-- 加入我们 / 二维码 -->
  <section v-else-if="block.type === 'join'" class="b-join">
    <h2 v-if="block.heading">
      <i v-if="block.icon" :class="`fas ${block.icon}`"></i>
      <span v-html="html(block.heading)"></span>
    </h2>
    <p v-if="block.qq">参与活动需加入QQ群：{{ block.qq }}</p>
    <div class="qr-row">
      <figure v-for="(img, i) in block.images" :key="i">
        <img :src="img.src" :alt="img.alt" loading="lazy" />
        <figcaption v-if="img.caption">{{ img.caption }}</figcaption>
      </figure>
    </div>
    <p v-if="block.note" class="qr-note">{{ block.note }}</p>
  </section>

  <!-- 主办部门可展开二维码卡片 -->
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

  <!-- FAQ 折叠问答（原生 details） -->
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
.b-text {
  margin-bottom: 25px;
}
.b-text p {
  margin-bottom: 12px;
}

.b-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 30px 0 16px;
  color: var(--primary);
  font-size: 1.4rem;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}
.b-heading i {
  color: var(--primary);
}

.b-images {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  margin: 25px 0;
}
.b-images figure,
.b-join .qr-row figure {
  flex: 1 1 300px;
  max-width: 400px;
  text-align: center;
}
.b-images img,
.award-image,
.b-join .qr-row img {
  width: 100%;
  max-width: 800px;
  margin: 12px auto;
  border-radius: 8px;
  box-shadow: var(--shadow);
}
.b-images figcaption,
.b-join .qr-row figcaption {
  color: #777;
  font-size: 0.9rem;
  margin-top: 0.3rem;
}

.b-awards .award-card {
  background: #f9f9f9;
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.b-awards h3 {
  color: var(--primary);
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 12px;
}
.b-awards p {
  margin: 8px 0;
}
.highlight {
  color: #d9534f;
  font-weight: bold;
  font-style: italic;
}

.b-highlight {
  background: #f8f9fa;
  border-left: 4px solid var(--primary);
  padding: 20px;
  margin: 20px 0;
}

.b-partners .partner-logos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
}
.partner-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
}
.partner-note {
  text-align: center;
}

.b-list ul {
  margin: 8px 0 20px 20px;
  list-style: disc;
}
.b-list li {
  margin-bottom: 8px;
}

.b-table {
  margin: 20px 0;
}
.table-wrap {
  overflow-x: auto;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #eee;
}
th {
  background: var(--primary);
  color: #fff;
  font-weight: bold;
  position: sticky;
  top: 0;
}
tr:nth-child(even) {
  background: #f7f9fc;
}
tr:hover {
  background: rgba(26, 115, 232, 0.08);
}

.b-info .info-grid,
.b-info {
  margin-bottom: 20px;
}
.b-info h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary);
  margin-bottom: 16px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 15px;
}
.info-card {
  text-align: center;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  border: 1px solid transparent;
  transition: transform var(--transition), box-shadow var(--transition),
    border-color var(--transition);
}
.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--primary);
}
.info-card i {
  font-size: 1.6rem;
  color: var(--primary);
  margin-bottom: 10px;
}
.info-card h3 {
  margin-bottom: 8px;
  color: var(--primary-dark);
}

.b-join .qr-row {
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
  margin: 16px 0;
}
.b-join .qr-row img {
  max-width: 300px;
}
.qr-note {
  text-align: center;
  margin-top: 1rem;
}

.b-organizers {
  margin: 25px 0;
}
.b-organizers h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary);
  margin-bottom: 16px;
}

.b-platform ul {
  list-style: none;
}
.b-platform li {
  display: flex;
  padding: 12px 15px;
  margin: 5px 0;
  border-bottom: 1px solid #eee;
  border-radius: 5px;
  transition: background var(--transition), transform var(--transition);
}
.b-platform li:hover {
  background: #f8f9fa;
  transform: translateX(5px);
}
.b-platform li i {
  margin-right: 10px;
  color: var(--primary);
}

.b-faq details {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 12px;
  padding: 16px 20px;
}
.b-faq summary {
  font-weight: bold;
  color: var(--primary);
  font-size: 1.05rem;
  cursor: pointer;
  list-style: none;
}
.b-faq summary::-webkit-details-marker {
  display: none;
}
.b-faq summary::before {
  content: '▸';
  display: inline-block;
  margin-right: 8px;
  transition: transform var(--transition);
}
.b-faq details[open] summary::before {
  transform: rotate(90deg);
}
.faq-answer {
  padding-left: 20px;
  margin-top: 12px;
}
.faq-answer :deep(strong) {
  color: var(--primary-dark);
}

@media (max-width: 768px) {
  .partner-logo {
    width: 80px;
    height: 80px;
  }
}
</style>
