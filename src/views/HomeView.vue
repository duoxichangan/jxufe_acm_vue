<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useNews } from "../composables/useNews";

// ── 轮播图 ──
const slides = Array.from({ length: 10 }, (_, i) => ({
  src: `/images/slider/slider${i + 1}.jpg`,
  alt: `程序设计竞赛奖项${i + 1}`,
}));

const current = ref(0);
let timer = null;
const next = () => (current.value = (current.value + 1) % slides.length);
const pick = (i) => {
  current.value = i;
  restart();
};
const restart = () => {
  clearInterval(timer);
  timer = setInterval(next, 4000);
};
onMounted(restart);
onUnmounted(() => clearInterval(timer));

// ── 我们参与的赛事 logo（首页用，与竞赛信息页同源数据）──
const contestLogos = [
  { slug: "icpc", src: "/images/contest/icpc.png", alt: "ICPC" },
  { slug: "ccpc", src: "/images/contest/ccpc_logo.png", alt: "CCPC" },
  { slug: "gplt", src: "/images/contest/gplt.png", alt: "GPLT" },
  { slug: "baidu", src: "/images/contest/baidu.png", alt: "CCCC" },
  { slug: "chuanzhi", src: "/images/contest/czb.png", alt: "CZB" },
  { slug: "raicom", src: "/images/contest/rk.png", alt: "RK" },
  { slug: "lanqiao", src: "/images/contest/lqb.png", alt: "LQB" },
];

const features = [
  {
    icon: "fa-trophy",
    title: "竞赛培训",
    desc: "提供系统的算法培训，包括基础数据结构、动态规划、图论等，帮助成员在各类竞赛中取得优异成绩。",
  },
  {
    icon: "fa-users",
    title: "团队协作",
    desc: "组织校内模拟赛和团队训练，培养默契配合和高效解题能力，提升团队协作精神。",
  },
  {
    icon: "fa-laptop-code",
    title: "技术交流",
    desc: "定期举办技术分享会，拓展成员的技术视野。",
  },
];

const { newsList, loading, error } = useNews();
</script>

<template>
  <!-- 英雄区 -->
  <section class="hero container-fluid">
    <div class="container hero-inner">
      <div class="hero-content">
        <h2>写码码，拿奖奖<br />加分分，领钱钱</h2>
        <p>❀欢迎各位新同学来到江西财经大学❀</p>
        <div class="hero-buttons">
          <a href="#about" class="btn btn-secondary">了解更多</a>
        </div>
      </div>

      <div class="hero-image">
        <div class="hero-image-container">
          <div class="slideshow">
            <div
              v-for="(slide, i) in slides"
              :key="i"
              class="slide"
              :class="{ active: i === current }"
            >
              <img :src="slide.src" :alt="slide.alt" class="hero-image-main" />
            </div>
            <div class="dots">
              <span
                v-for="(slide, i) in slides"
                :key="i"
                class="dot"
                :class="{ active: i === current }"
                @click="pick(i)"
              ></span>
            </div>
          </div>

          <div class="floating-code fc-1">
            for(int i=0; i&lt;n; i++) {<br />
            &nbsp;&nbsp;solve(problems[i]);<br />
            }
          </div>
          <div class="floating-code fc-2">
            if(teamwork) {<br />
            &nbsp;&nbsp;return success;<br />
            }
          </div>
          <div class="floating-code fc-3">
            while (happyCoding) {<br />
            &nbsp;&nbsp;happy_Every_day();<br />
            }
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 宗旨 -->
  <section id="about" class="about container-fluid">
    <div class="container about-inner">
      <div v-reveal class="about-content">
        <h2 class="section-title">我们的宗旨</h2>
        <p>
          程序设计竞赛协会旨在激励大家运用计算机编程技术和技能来解决实际问题，激发兴趣，培养团队合作意创新能力和挑战精神。
        </p>
        <p>
          协会汇集了一批对算法和编程充满热情的学生，在这里，你可以结识志同道合的朋友，共同进步，挑战自我。
        </p>

        <div class="features">
          <div v-for="f in features" :key="f.title" class="feature">
            <div class="feature-icon"><i :class="`fas ${f.icon}`"></i></div>
            <div class="feature-body">
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-reveal class="about-image">
        <div class="contest-logos">
          <h3>我们参与的赛事</h3>
          <div class="logo-stack">
            <RouterLink
              v-for="(logo, i) in contestLogos"
              :key="logo.slug"
              :to="`/competition/${logo.slug}`"
              :class="`logo-item li-${i + 1}`"
            >
              <img :src="logo.src" :alt="logo.alt" />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <a href="#news" class="scroll-down-arrow"
      ><i class="fas fa-chevron-down"></i
    ></a>
  </section>

  <!-- 最新动态 -->
  <section id="news" class="news container-fluid">
    <div class="container">
      <h2 class="section-title">最新动态</h2>
      <div class="news-grid">
        <p v-if="loading">加载中…</p>
        <p v-else-if="error">加载新闻失败</p>
        <article
          v-reveal
          v-for="item in newsList"
          :key="item.file"
          class="news-card"
        >
          <div class="news-date">
            <span class="day">{{ item.day }}</span>
            <span class="month">{{ item.month }}</span>
          </div>
          <div class="news-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary }}</p>
            <RouterLink :to="`/action/${item.slug}`" class="read-more"
              >阅读更多</RouterLink
            >
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── 英雄区 ── */
.hero {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: center;
  padding: 120px 0 80px;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="10" y="30" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.05)">{code}</text><text x="5" y="50" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.05)">function()</text><text x="15" y="70" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.05)">while(true)</text></svg>');
}
.hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}
.hero-content {
  text-align: left;
}
.hero h2 {
  font-size: 3rem;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.8s ease-out;
}
.hero p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}
.hero-buttons {
  margin-top: 30px;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}
.hero .btn-secondary {
  color: #fff;
  border-color: #fff;
  background: transparent;
}
.hero .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 轮播 */
.hero-image {
  display: flex;
  justify-content: center;
  animation: fadeIn 1s ease-out;
}
.hero-image-container {
  position: relative;
  width: 100%;
  max-width: 700px;
}
.slideshow {
  position: relative;
}
.hero-image-main {
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transform: perspective(1000px) rotateY(-5deg);
  transition: transform 0.5s ease;
}
.hero-image-container:hover .hero-image-main {
  transform: perspective(1000px) rotateY(0);
}
.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
}
.slide.active {
  position: relative;
  opacity: 1;
  pointer-events: auto;
}
.dots {
  text-align: center;
  margin-top: 15px;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 0 5px;
  border-radius: 50%;
  background: #bbb;
  cursor: pointer;
  transition: background var(--transition);
}
.dot.active {
  background: var(--primary);
}

.floating-code {
  position: absolute;
  z-index: 2;
  max-width: 220px;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.85rem;
  font-weight: bold;
  color: #000;
}
.fc-1 {
  top: -20px;
  right: 20%;
  animation: float 4s ease-in-out infinite;
}
.fc-2 {
  bottom: 10%;
  left: -30px;
  animation: float 5s ease-in-out infinite 1s;
}
.fc-3 {
  top: 40%;
  right: -20px;
  animation: float 6s ease-in-out infinite 2s;
}

/* ── 宗旨 ── */
.about {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 80px 0;
  background-color: var(--bg-light);
}
.about::before,
.about::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  z-index: 0;
}
.about::before {
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background-color: rgba(79, 195, 247, 0.1);
}
.about::after {
  bottom: -30px;
  left: -30px;
  width: 150px;
  height: 150px;
  background-color: rgba(255, 152, 0, 0.1);
}
.about-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}
.about-content :deep(.section-title) {
  text-align: left;
}
.about-content p {
  margin-bottom: 20px;
}
.features {
  margin: 30px 0;
}
.feature {
  display: flex;
  align-items: flex-start;
  margin-bottom: 25px;
  transition: transform var(--transition);
}
.feature:hover {
  transform: translateX(5px);
}
.feature-icon {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  margin-right: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--primary);
  background-color: rgba(26, 115, 232, 0.1);
  transition:
    background var(--transition),
    color var(--transition),
    transform var(--transition);
}
.feature:hover .feature-icon {
  background: var(--primary);
  color: #fff;
  transform: scale(1.1);
}
.feature-body h3 {
  margin-bottom: 8px;
  color: var(--primary-dark);
  font-size: 1.2rem;
}
.feature-body p {
  color: var(--text-light);
}

/* 赛事 logo 堆 */
.about-image {
  display: flex;
  justify-content: center;
}
.contest-logos {
  width: 100%;
  max-width: 1200px;
  padding: 20px 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
}
.contest-logos h3 {
  font-size: 2rem;
  margin-bottom: 30px;
  text-align: center;
}
.logo-stack {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 50px;
  padding: 30px 0;
}
.logo-item {
  justify-self: center;
  max-width: 220px;
  padding: 25px;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition:
    transform var(--transition),
    box-shadow var(--transition);
}
.logo-item img {
  width: 100%;
  object-fit: contain;
}
.li-1 {
  transform: rotate(-5deg);
}
.li-2 {
  transform: rotate(3deg);
}
.li-3 {
  transform: rotate(-2deg);
}
.li-4 {
  transform: rotate(4deg);
}
.li-5 {
  transform: rotate(-3deg);
}
.li-6 {
  transform: rotate(2deg);
}
.li-7 {
  transform: rotate(-1deg);
}
.logo-item:hover {
  transform: scale(1.1) rotate(0) !important;
  z-index: 10;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.scroll-down-arrow {
  position: absolute;
  bottom: 20px;
  left: 50%;
  z-index: 10;
  font-size: 2rem;
  color: var(--primary);
  animation: bounce 2s infinite;
}
.scroll-down-arrow:hover {
  color: var(--accent);
  transform: scale(1.2);
}

/* ── 最新动态 ── */
.news {
  padding: 80px 0;
  background-color: var(--bg-light);
}
.news-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}
.news-card {
  display: flex;
  overflow: hidden;
  background: #fff;
  transition: transform var(--transition);
}
.news-card:hover {
  transform: translateY(-5px);
}
.news-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 15px;
  color: #fff;
  background: var(--primary);
}
.news-date .day {
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1;
}
.news-date .month {
  font-size: 0.9rem;
}
.news-body {
  flex: 1;
  padding: 20px;
}
.news-body h3 {
  margin-bottom: 10px;
  color: var(--primary-dark);
}
.news-body p {
  margin-bottom: 15px;
  color: var(--text-light);
}
.read-more {
  font-weight: 500;
  color: var(--primary);
}
.read-more:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* ── 响应式 ── */
@media (max-width: 992px) {
  .hero-inner,
  .about-inner {
    grid-template-columns: 1fr;
  }
  .about-content {
    text-align: center;
  }
  .about-content :deep(.section-title) {
    text-align: center;
  }
  .about-image {
    max-width: 600px;
    margin: 0 auto 30px;
  }
  .floating-code {
    max-width: 200px;
  }
  .fc-1 {
    right: 15%;
  }
  .fc-2 {
    left: -20px;
  }
}
@media (max-width: 768px) {
  .hero {
    padding: 80px 0 60px;
    min-height: auto;
  }
  .hero-inner {
    text-align: center;
  }
  .hero-content {
    order: 1;
  }
  .hero h2 {
    font-size: 2.2rem;
  }
  .hero-image {
    order: 2;
    margin-top: 20px;
  }
  .floating-code {
    max-width: 180px;
  }
  .news-grid {
    grid-template-columns: 1fr;
  }
  .logo-stack {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }
  .feature {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .feature-icon {
    margin: 0 0 15px;
  }
}
@media (max-width: 576px) {
  .hero {
    padding: 50px 0 40px;
  }
  .hero h2 {
    font-size: 1.8rem;
  }
  .floating-code {
    display: none;
  }
  .contest-logos {
    padding: 20px 15px;
  }
}
</style>
