<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useNews } from "../composables/useNews";
import AppFooter from "../components/AppFooter.vue";

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
onUnmounted(() => {
  clearInterval(timer);
});

// ── 鼠标视差 + 聚光灯 ──
const heroEl = ref(null);
const mx = ref(0); // 0..1 鼠标在 hero 中的相对位置
const my = ref(0);
const mouseX = ref(0); // 像素坐标
const mouseY = ref(0);

const onMouseMove = (e) => {
  if (!heroEl.value) return;
  const rect = heroEl.value.getBoundingClientRect();
  mx.value = (e.clientX - rect.left) / rect.width;
  my.value = (e.clientY - rect.top) / rect.height;
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
  // 浮动形状排斥
  updateShapeRepel(e.clientX, e.clientY);
  // 磁吸按钮
  updateBtnMagnet(e.clientX, e.clientY);
};
const onMouseLeave = () => {
  mx.value = 0.5;
  my.value = 0.5;
};

// ── 浮动形状（带排斥） ──
const floatingShapes = ref([]);
const initShapes = () => {
  const shapes = [];
  for (let i = 0; i < 8; i++) {
    shapes.push({
      id: i,
      baseX: 5 + Math.random() * 90, // % 基准位置
      baseY: 5 + Math.random() * 90,
      size: 12 + Math.random() * 28,
      speed: 3 + Math.random() * 5,
      offsetX: 0,
      offsetY: 0,
      opacity: 0.12 + Math.random() * 0.2,
    });
  }
  floatingShapes.value = shapes;
};
const updateShapeRepel = (cx, cy) => {
  if (!heroEl.value) return;
  const rect = heroEl.value.getBoundingClientRect();
  floatingShapes.value.forEach((s) => {
    const sx = rect.left + (s.baseX / 100) * rect.width;
    const sy = rect.top + (s.baseY / 100) * rect.height;
    const dx = cx - sx;
    const dy = cy - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repelRadius = 180;
    if (dist < repelRadius && dist > 1) {
      const force = (1 - dist / repelRadius) * 80;
      s.offsetX = (-dx / dist) * force;
      s.offsetY = (-dy / dist) * force;
    } else {
      s.offsetX *= 0.85;
      s.offsetY *= 0.85;
    }
  });
};

// ── 磁吸按钮 ──
const heroBtn = ref(null);
const btnMagnetX = ref(0);
const btnMagnetY = ref(0);
const updateBtnMagnet = (cx, cy) => {
  if (!heroBtn.value) return;
  const rect = heroBtn.value.getBoundingClientRect();
  const bx = rect.left + rect.width / 2;
  const by = rect.top + rect.height / 2;
  const dx = cx - bx;
  const dy = cy - by;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const magnetRadius = 250;
  if (dist < magnetRadius && dist > 1) {
    const force = (1 - dist / magnetRadius) * 18;
    btnMagnetX.value = (dx / dist) * force;
    btnMagnetY.value = (dy / dist) * force;
  } else {
    btnMagnetX.value *= 0.8;
    btnMagnetY.value *= 0.8;
  }
};

onMounted(() => {
  mx.value = 0.5;
  my.value = 0.5;
  initShapes();
});

// ── 滚动吸附（延迟 + 非线性缓动）──
let snapTimer = null;
let isSnapping = false;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateScrollTo(targetY, duration = 700) {
  const html = document.documentElement;
  html.style.scrollBehavior = "auto";
  isSnapping = true;

  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 5) {
    html.style.scrollBehavior = "";
    isSnapping = false;
    return;
  }

  const startTime = performance.now();

  function step(currentTime) {
    if (!isSnapping) return;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      html.style.scrollBehavior = "";
      isSnapping = false;
    }
  }

  requestAnimationFrame(step);
}

function findNearestSection() {
  const currentY = window.scrollY;
  const els = document.querySelectorAll("section[id]");
  let closest = null;
  let closestDist = Infinity;
  els.forEach((el) => {
    const dist = Math.abs(currentY - el.offsetTop);
    if (dist < closestDist) {
      closestDist = dist;
      closest = el;
    }
  });
  return { section: closest, distance: closestDist };
}

function scheduleSnap() {
  clearTimeout(snapTimer);
  if (isSnapping) return;
  snapTimer = setTimeout(() => {
    const { section, distance } = findNearestSection();
    if (section && distance > 50) {
      animateScrollTo(section.offsetTop, 700);
    }
  }, 800);
}

function onScrollSnap() {
  if (isSnapping) {
    // 用户手动滚动了，取消吸附动画
    isSnapping = false;
    document.documentElement.style.scrollBehavior = "";
    return;
  }
  scheduleSnap();
}

onMounted(() => {
  window.addEventListener("scroll", onScrollSnap, { passive: true });
  window.addEventListener("scrollend", scheduleSnap, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScrollSnap);
  window.removeEventListener("scrollend", scheduleSnap);
  clearTimeout(snapTimer);
  isSnapping = false;
  document.documentElement.style.scrollBehavior = "";
});

// ── 我们参与的赛事 logo ──
const contestLogos = [
  { slug: "icpc", src: "/images/contest/icpc.png", alt: "ICPC", rot: -4 },
  { slug: "ccpc", src: "/images/contest/ccpc_logo.png", alt: "CCPC", rot: 2 },
  { slug: "gplt", src: "/images/contest/gplt.png", alt: "天梯赛", rot: -2 },
  { slug: "baidu", src: "/images/contest/baidu.png", alt: "百度之星", rot: 3 },
  { slug: "chuanzhi", src: "/images/contest/czb.png", alt: "传智杯", rot: -2 },
  { slug: "lanqiao", src: "/images/contest/lqb.png", alt: "蓝桥杯", rot: -1 },
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

// ── 横滚代码背景 ──
const codeSyms = "{}[]();:<>+-*/%=&|!?.,";
const codeKeys =
  "import export const let var function return async await class extends if else for while do switch case break continue try catch throw new this super typeof instanceof void delete in of then catch";
const codeNums = "0 1 2 3 4 5 6 7 8 9";
const codeMix =
  "if(x>0){} for(;;){} while(i--){} return data.map(x=>x*2); await fetch(url); const [a,b]=arr; {...spread} typeof x === 'number' ? 1 : 0;";

function randCode(len) {
  const pool = codeSyms + " " + codeKeys + " " + codeNums;
  let s = "";
  for (let i = 0; i < len; i++) {
    s += pool[Math.floor(Math.random() * pool.length)];
    if (Math.random() < 0.08) s += "  ";
  }
  return s;
}

const codeRows = Array.from({ length: 12 }, (_, i) => {
  const isKeyword = i % 3 === 0;
  const isMixed = i % 3 === 1;
  let text;
  if (isKeyword) {
    // 关键词行：重复拼贴关键词
    const keys = codeKeys.split(" ");
    text = Array.from(
      { length: 18 },
      () => keys[Math.floor(Math.random() * keys.length)],
    ).join("  ");
  } else if (isMixed) {
    // 混合代码片段行
    text = Array.from({ length: 10 }, () => {
      const frags = codeMix.split(" ");
      return frags[Math.floor(Math.random() * frags.length)];
    }).join("  ");
  } else {
    // 随机符号 + 数字行
    text = randCode(80 + Math.floor(Math.random() * 70));
  }
  return {
    id: i,
    text,
    duration: 28 + Math.random() * 50,
    delay: -(Math.random() * 30),
    dir: i % 2 === 0 ? 1 : -1,
    size: isKeyword ? "15px" : isMixed ? "12px" : "11px",
    weight: isKeyword ? 700 : 400,
    opacity: isKeyword ? 0.1 : isMixed ? 0.07 : 0.05,
  };
});

const { newsList, loading, error } = useNews();

// ── 时间轴 ──
const selectedDate = ref(null); // 'YYYY-MM-DD' or null

const uniqueNewsDates = computed(() => {
  const seen = new Set();
  const result = [];
  [...newsList.value]
    .sort((a, b) => b.date - a.date)
    .forEach((n) => {
      if (!n.date) return;
      const y = n.date.getFullYear();
      const m = String(n.date.getMonth() + 1).padStart(2, "0");
      const d = String(n.date.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          key,
          day: n.date.getDate(),
          month: n.date.toLocaleDateString("zh-CN", { month: "short" }),
        });
      }
    });
  return result;
});

const filteredNews = computed(() => {
  if (!selectedDate.value) return newsList.value;
  return newsList.value.filter((n) => {
    if (!n.date) return false;
    const y = n.date.getFullYear();
    const m = String(n.date.getMonth() + 1).padStart(2, "0");
    const d = String(n.date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}` === selectedDate.value;
  });
});

const selectDate = (key) => {
  selectedDate.value = selectedDate.value === key ? null : key;
};
</script>

<template>
  <!-- 英雄区 -->
  <section
    id="home"
    ref="heroEl"
    class="hero container-fluid"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- 横滚代码背景 -->
    <div class="code-scroll-bg" aria-hidden="true">
      <div
        v-for="row in codeRows"
        :key="row.id"
        class="code-scroll-row"
        :class="{ 'scroll-reverse': row.dir === -1 }"
        :style="{
          '--d': row.duration + 's',
          '--delay': row.delay + 's',
          fontSize: row.size,
          fontWeight: row.weight,
          opacity: row.opacity,
        }"
      >
        <span class="code-scroll-text">{{ row.text }}</span>
        <span class="code-scroll-text">{{ row.text }}</span>
        <span class="code-scroll-text">{{ row.text }}</span>
      </div>
    </div>

    <!-- 浮动形状（排斥鼠标） -->
    <div class="float-shapes" aria-hidden="true">
      <span
        v-for="s in floatingShapes"
        :key="s.id"
        class="float-shape"
        :style="{
          left: s.baseX + '%',
          top: s.baseY + '%',
          width: s.size + 'px',
          height: s.size + 'px',
          opacity: s.opacity,
          transform: `translate(${s.offsetX}px, ${s.offsetY}px)`,
        }"
      ></span>
    </div>

    <!-- 底部白渐变遮罩 -->
    <div class="hero-fade-bottom"></div>

    <!-- 浮动粒子 -->
    <div class="hero-particles" aria-hidden="true">
      <span
        v-for="n in 12"
        :key="n"
        class="particle"
        :style="{
          '--x': `${Math.random() * 100}%`,
          '--d': `${8 + Math.random() * 16}s`,
          '--s': `${2 + Math.random() * 4}px`,
          '--o': `${0.08 + Math.random() * 0.18}`,
        }"
      ></span>
    </div>

    <div
      class="container hero-inner"
      :style="{
        '--mx': mx,
        '--my': my,
      }"
    >
      <div class="hero-content">
        <h2>写码码，拿奖奖<br />加分分，领钱钱</h2>
        <p>❀ 欢迎各位新同学来到江西财经大学 ❀</p>
        <div class="hero-buttons">
          <a
            ref="heroBtn"
            href="#about"
            class="btn btn-secondary hero-btn-magnet"
            :style="{
              transform: `translate(${btnMagnetX}px, ${btnMagnetY}px)`,
            }"
            >了解更多</a
          >
        </div>
      </div>

      <div class="hero-image">
        <div
          class="hero-image-container"
          :style="{
            '--mx': mx,
            '--my': my,
          }"
        >
          <div class="slideshow">
            <div
              v-for="(slide, i) in slides"
              :key="i"
              class="slide"
              :class="{ active: i === current }"
            >
              <img :src="slide.src" :alt="slide.alt" class="hero-image-main" />
            </div>
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

  <!-- Hero → About 过渡桥 -->
  <div class="section-bridge" aria-hidden="true">
    <span
      class="decorative-orb decorative-orb--primary"
      style="width: 600px; height: 600px; top: -320px; left: 5%; opacity: 0.1"
    ></span>
    <span
      class="decorative-orb decorative-orb--accent"
      style="width: 400px; height: 400px; top: -220px; right: 8%; opacity: 0.07"
    ></span>
    <span
      class="decorative-orb decorative-orb--light"
      style="width: 300px; height: 300px; top: -180px; left: 40%; opacity: 0.06"
    ></span>
  </div>

  <!-- 宗旨 -->
  <section id="about" class="about container-fluid">
    <!-- 承接 Hero 的装饰光斑 -->
    <div
      class="decorative-orb decorative-orb--primary about-orb--top-left"
    ></div>

    <div class="container about-inner">
      <!-- 左侧：赛事 Logo 展示 -->
      <div v-reveal="'slide-left'" class="about-visual">
        <div class="contest-grid">
          <RouterLink
            v-for="logo in contestLogos"
            :key="logo.slug"
            :to="`/competition/${logo.slug}`"
            class="contest-card"
          >
            <div class="contest-card-img">
              <img :src="logo.src" :alt="logo.alt" />
            </div>
            <span class="contest-card-label">{{ logo.alt }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- 右侧：宗旨 + 特色 -->
      <div v-reveal="'fade-up'" class="about-content">
        <p class="about-label">ABOUT US</p>
        <h2 class="about-heading">
          以代码为<span class="highlight">桥梁</span><br />连接技术与未来
        </h2>
        <p class="about-desc">
          程序设计竞赛协会旨在激励大家运用计算机编程技术和技能来解决实际问题，激发兴趣，培养团队合作意识和创新能力和挑战精神。
        </p>

        <div class="features">
          <div v-for="(f, i) in features" :key="f.title" class="feature">
            <span class="feature-num">{{
              String(i + 1).padStart(2, "0")
            }}</span>
            <div class="feature-body">
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <a href="#news" class="scroll-down-arrow"
      ><i class="fas fa-chevron-down"></i
    ></a>
  </section>

  <!-- About → News 过渡桥 -->
  <div class="section-bridge" aria-hidden="true">
    <span
      class="decorative-orb decorative-orb--primary"
      style="width: 550px; height: 550px; top: -300px; right: 5%; opacity: 0.09"
    ></span>
    <span
      class="decorative-orb decorative-orb--light"
      style="width: 400px; height: 400px; top: -220px; left: 8%; opacity: 0.07"
    ></span>
    <span
      class="decorative-orb decorative-orb--accent"
      style="width: 280px; height: 280px; top: -160px; left: 45%; opacity: 0.05"
    ></span>
  </div>

  <!-- 最新动态 -->
  <section id="news" class="news container-fluid">
    <div class="container news-inner">
      <!-- 第一行：标题 + 时间轴 -->
      <div class="news-topbar">
        <div class="news-header">
          <p class="news-label">LATEST NEWS</p>
          <h2 class="news-heading">
            协会<span class="highlight">大事记</span>
          </h2>
        </div>
        <div class="news-timeline">
          <button
            class="nt-item"
            :class="{ active: selectedDate === null }"
            @click="selectedDate = null"
          >
            全部
          </button>
          <button
            v-for="(item, i) in uniqueNewsDates"
            :key="i"
            class="nt-item"
            :class="{ active: selectedDate === item.key }"
            @click="selectDate(item.key)"
          >
            <span class="nt-day">{{ item.day }}</span>
            <span class="nt-mon">{{ item.month }}</span>
          </button>
        </div>
      </div>

      <div v-if="loading" class="news-grid">
        <div
          v-for="n in 4"
          :key="n"
          class="skeleton"
          style="height: 100px; border-radius: var(--radius-lg)"
        ></div>
      </div>
      <p v-else-if="error" class="hint">加载新闻失败</p>

      <!-- 第二行：新闻 Grid -->
      <div v-else class="news-grid">
        <article
          v-for="(item, i) in filteredNews"
          :key="item.file"
          v-reveal="'fade-up'"
          :style="{ '--reveal-index': i }"
          class="news-card"
        >
          <div class="nc-date">
            <span>{{ item.day }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
          <RouterLink :to="`/action/${item.slug}`" class="read-more"
            >阅读更多 →</RouterLink
          >
        </article>
      </div>
    </div>
    <AppFooter />
  </section>
</template>

<style scoped>
/* ==========================================================================
   英雄区 —— 浅色主题
   ========================================================================== */
.hero {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  align-items: center;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 120px) 0 var(--space-2xl);
  color: var(--text);
  background:
    radial-gradient(
      ellipse 800px 500px at 20% 70%,
      rgba(26, 115, 232, 0.06) 0%,
      transparent 55%
    ),
    radial-gradient(
      ellipse 500px 400px at 80% 20%,
      rgba(79, 195, 247, 0.05) 0%,
      transparent 55%
    ),
    /* 底部过渡：向 About 区渐变 */
    radial-gradient(
        ellipse 1000px 400px at 50% 100%,
        rgba(26, 115, 232, 0.06) 0%,
        transparent 60%
      ),
    linear-gradient(175deg, #f8fafc 0%, #fff 40%, #fff 100%);
  background-size: 100% 100%;
  cursor: default;
}

/* ── 横滚代码背景 ── */
.code-scroll-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.code-scroll-row {
  white-space: nowrap;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  line-height: 2.2;
  color: var(--primary);
  animation: code-scroll-x var(--d, 50s) linear infinite;
  animation-delay: var(--delay, 0s);
}
.code-scroll-row.scroll-reverse {
  animation-name: code-scroll-x-rev;
}
.code-scroll-text {
  display: inline-block;
  padding-right: 60px;
}
@keyframes code-scroll-x {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-33.333%);
  }
}
@keyframes code-scroll-x-rev {
  0% {
    transform: translateX(-33.333%);
  }
  100% {
    transform: translateX(0);
  }
}

/* ── 浮动形状（排斥鼠标）── */
.float-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.float-shape {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(26, 115, 232, 0.15);
  background: rgba(26, 115, 232, 0.04);
  backdrop-filter: blur(2px);
  transition: none;
}

/* ── 底部白渐变（浅色背景无需此遮罩）── */
.hero-fade-bottom {
  display: none;
}

/* ── 磁吸按钮 ── */
.hero-btn-magnet {
  transition: transform 0.15s ease-out;
}

/* 浮动粒子 */
.hero-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.particle {
  position: absolute;
  left: var(--x);
  bottom: -10px;
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: rgba(26, 115, 232, var(--o));
  animation: particle-rise var(--d) linear infinite;
  animation-delay: calc(var(--d) * -0.5);
}
@keyframes particle-rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-110vh) scale(0.3);
    opacity: 0;
  }
}

.hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  align-items: center;
}
.hero-content {
  text-align: left;
  padding-left: 6%;
  /* 视差：文字轻微反向移动 */
  transform: translate(
    calc((var(--mx, 0.5) - 0.5) * -30px),
    calc((var(--my, 0.5) - 0.5) * -20px)
  );
  transition: transform 0.3s ease-out;
}
.hero h2 {
  font-family:
    "Noto Serif SC", "Source Han Serif SC", "SimSun", "STSong", serif;
  font-weight: 900;
  font-size: 4.2rem;
  margin-bottom: var(--space-lg);
  line-height: 1.5;
  letter-spacing: 4px;
  color: var(--primary-dark);
  animation: fadeInUp 0.7s ease-out;
}
.hero p {
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-lg);
  color: var(--text-light);
  animation: fadeInUp 0.7s ease-out 0.12s both;
}
.hero-buttons {
  margin-top: var(--space-lg);
  animation: fadeInUp 0.7s ease-out 0.24s both;
}
.hero .btn-secondary {
  color: var(--primary);
  border-color: var(--primary);
  background: transparent;
  border-radius: var(--radius-full);
  padding: 14px 36px;
  font-size: var(--font-size-lg);
  backdrop-filter: blur(4px);
  transition:
    background var(--transition),
    border-color var(--transition),
    transform var(--transition),
    box-shadow var(--transition);
}
.hero .btn-secondary:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(26, 115, 232, 0.25);
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
  /* 视差：图片同向移动 */
  transform: translate(
    calc((var(--mx, 0.5) - 0.5) * 20px),
    calc((var(--my, 0.5) - 0.5) * 14px)
  );
  transition: transform 0.3s ease-out;
}
.slideshow {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--radius-xl);
}
.hero-image-main {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-xl);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.06);
  /* 3D 倾斜跟随鼠标 */
  transform: perspective(1200px) rotateY(calc((var(--mx, 0.5) - 0.5) * -12deg))
    rotateX(calc((var(--my, 0.5) - 0.5) * 8deg));
  transition:
    transform 0.3s ease-out,
    box-shadow var(--transition);
}
.hero-image-container:hover .hero-image-main {
  box-shadow:
    0 20px 60px rgba(26, 115, 232, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08);
}
.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}
.slide.active {
  position: relative;
  opacity: 1;
  pointer-events: auto;
}
.dots {
  text-align: center;
  margin-top: var(--space-md);
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 0 5px;
  border-radius: var(--radius-full);
  background: rgba(26, 115, 232, 0.2);
  cursor: pointer;
  transition:
    background var(--transition),
    transform var(--transition);
}
.dot.active {
  background: var(--primary);
  transform: scale(1.4);
}
.dot:hover {
  background: rgba(26, 115, 232, 0.5);
}

.floating-code {
  position: absolute;
  z-index: 2;
  max-width: 300px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--primary);
  box-shadow: var(--shadow-md);
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-dark);
  pointer-events: none;
}
.fc-1 {
  top: -25px;
  right: 18%;
  animation: float 4s ease-in-out infinite;
}
.fc-2 {
  bottom: 12%;
  left: -35px;
  animation: float 5s ease-in-out infinite 1s;
}
.fc-3 {
  top: 40%;
  right: -25px;
  animation: float 6s ease-in-out infinite 2s;
}

/* ==========================================================================
   宗旨区
   ========================================================================== */
.about {
  position: relative;
  overflow: visible;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--section-padding);
  background:
    /* 顶部过渡：承接 Hero */
    radial-gradient(
      ellipse 1000px 350px at 50% 0%,
      rgba(26, 115, 232, 0.06) 0%,
      transparent 60%
    ),
    /* 底部过渡：衔接 News */
    radial-gradient(
        ellipse 800px 300px at 50% 100%,
        rgba(79, 195, 247, 0.05) 0%,
        transparent 60%
      ),
    #fff;
}

/* 装饰光斑 */
.about-orb--top-left {
  width: 500px;
  height: 500px;
  top: -120px;
  left: -180px;
  opacity: 0.07;
}

/* ── 两栏布局 ── */
.about-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

/* ── 左侧：赛事 Logo 展示 ── */
.about-visual {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.about-visual-title {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--text-muted);
  margin-bottom: var(--space-xl);
  font-weight: 600;
  align-self: flex-end;
}
.contest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}
.contest-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 20px;
  background: #fff;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    border-color var(--transition);
  text-decoration: none;
}
.contest-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(26, 115, 232, 0.12);
  border-color: rgba(26, 115, 232, 0.25);
}
.contest-card-img {
  width: 150px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.contest-card-img img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.contest-card-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  transition: color var(--transition);
}
.contest-card:hover .contest-card-label {
  color: var(--primary);
}

/* ── 右侧：文字 + 特色 ── */
.about-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: var(--space-sm);
}
.about-heading {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text);
  margin-bottom: var(--space-md);
}
.about-heading .highlight {
  color: var(--primary);
  position: relative;
}
.about-heading .highlight::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 2px;
  width: 100%;
  height: 7px;
  background: rgba(26, 115, 232, 0.12);
  border-radius: 2px;
  z-index: -1;
}
.about-desc {
  font-size: 0.95rem;
  color: var(--text-light);
  line-height: 1.75;
  max-width: 46ch;
  margin-bottom: var(--space-lg);
}

/* ── 特色列表 ── */
.features {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.feature {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: border-color var(--transition);
}
.feature:last-child {
  border-bottom: none;
}
.feature:hover {
  border-bottom-color: rgba(26, 115, 232, 0.15);
}
.feature-num {
  flex-shrink: 0;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(26, 115, 232, 0.2);
  padding-top: 3px;
  min-width: 24px;
  transition: color var(--transition);
}
.feature:hover .feature-num {
  color: var(--primary);
}
.feature-body h3 {
  margin-bottom: 1px;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 600;
}
.feature-body p {
  color: var(--text-light);
  font-size: 0.85rem;
  line-height: 1.55;
}

/* ── 向下箭头 ── */
.scroll-down-arrow {
  position: absolute;
  bottom: var(--space-lg);
  left: 50%;
  z-index: 10;
  font-size: 1.6rem;
  color: var(--text-muted);
  animation: bounce 2s infinite;
  transition:
    color var(--transition),
    transform var(--transition-spring);
}
.scroll-down-arrow:hover {
  color: var(--primary);
  transform: translateX(-50%) scale(1.3);
}

/* ==========================================================================
   最新动态
   ========================================================================== */
.news {
  position: relative;
  overflow: visible;
  min-height: 100vh;
  padding: 120px 0 0;
  background:
    /* 顶部过渡：承接 About */
    radial-gradient(
      ellipse 1000px 350px at 50% 0%,
      rgba(79, 195, 247, 0.06) 0%,
      transparent 60%
    ),
    #fff;
}

/* ── 第一行：标签在左，时间轴在右 ── */
.news-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xl);
  margin-bottom: 48px;
  padding: 0 var(--space-md);
}
.news-header {
  flex-shrink: 0;
}
.news-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 2px;
}
.news-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}
.news-heading .highlight {
  color: var(--primary);
  position: relative;
}
.news-heading .highlight::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 1px;
  width: 100%;
  height: 6px;
  background: rgba(26, 115, 232, 0.12);
  border-radius: 2px;
  z-index: -1;
}

/* 时间轴 */
.news-timeline {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px 0;
  min-width: 0;
}
.news-timeline::-webkit-scrollbar {
  display: none;
}
.nt-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
  position: relative;
}
.nt-item::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2.5px;
  border-radius: 2px;
  background: var(--primary);
  transition: width var(--transition-fast);
}
.nt-item:hover::after {
  width: 60%;
}
.nt-item.active::after {
  width: 100%;
}
.nt-item.active {
  color: var(--primary);
}
.nt-day {
  font-size: 1.05rem;
  font-weight: 700;
  color: inherit;
  line-height: 1;
}
.nt-mon {
  font-size: 0.65rem;
  color: var(--text-muted);
}

/* ── 第二行：新闻 Grid ── */
.hint {
  text-align: center;
  color: var(--text-light);
  padding: var(--space-xl) 0;
}
.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
  padding: 0 var(--space-md);
}
.news-card {
  display: grid;
  grid-template-columns: 56px 1fr;
  grid-template-rows: auto 1fr auto;
  column-gap: var(--space-md);
  padding: var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--radius-lg);
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    border-color var(--transition);
}
.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(26, 115, 232, 0.08);
  border-color: rgba(26, 115, 232, 0.15);
}

/* 日期徽章 */
.nc-date {
  grid-row: 1 / 3;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: start;
}
.nc-date span {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.news-card h3 {
  grid-column: 2;
  margin-bottom: 2px;
  color: var(--text);
  font-size: 1rem;
  font-weight: 600;
  align-self: end;
}
.news-card p {
  grid-column: 2;
  margin-bottom: var(--space-sm);
  color: var(--text-light);
  font-size: 0.84rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.read-more {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--primary);
  transition:
    gap var(--transition),
    color var(--transition-fast);
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}
.read-more:hover {
  color: var(--primary-dark);
  gap: 10px;
}
.news :deep(footer) {
  margin-top: 100px;
}

/* ── 板块过渡桥 ── */
.section-bridge {
  position: relative;
  height: 0;
  z-index: 2;
  pointer-events: none;
}
.section-bridge .decorative-orb {
  position: absolute;
}

/* ── 响应式 ── */
@media (max-width: 992px) {
  .hero-inner,
  .about-inner {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }
  .hero-content {
    transform: none;
  }
  .hero-image-container {
    transform: none;
  }
  .hero-image-main {
    transform: none !important;
  }
  .float-shapes,
  .code-scroll-bg {
    display: none;
  }
  .hero-fade-bottom {
    display: none;
  }
  .about-visual {
    order: 2;
    align-items: center;
  }
  .about-visual-title {
    align-self: center;
  }
  .contest-grid {
    max-width: 480px;
  }
  .about-content {
    text-align: center;
    order: 1;
  }
  .about-desc {
    max-width: none;
  }
  .about-heading {
    font-size: 1.8rem;
  }
  .features {
    text-align: left;
  }
  .floating-code {
    max-width: 200px;
  }
  .fc-1 {
    right: 12%;
  }
  .fc-2 {
    left: -20px;
  }
}
@media (max-width: 768px) {
  .hero {
    padding: calc(var(--header-height) + 10px) 0 var(--space-xl);
    min-height: auto;
    cursor: default;
  }
  .hero-inner {
    text-align: center;
  }
  .hero-content {
    order: 1;
  }
  .hero h2 {
    font-size: var(--font-size-4xl);
  }
  .hero-image {
    order: 2;
    margin-top: var(--space-md);
  }
  .hero-particles,
  .code-trail-container {
    display: none;
  }
  .floating-code {
    max-width: 180px;
  }
  .news-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }
  .news-timeline {
    width: 100%;
  }
  .news-grid {
    grid-template-columns: 1fr;
  }
  .contest-grid {
    grid-template-columns: repeat(4, 1fr);
    max-width: none;
  }
  .contest-card {
    padding: 16px 12px;
  }
  .contest-card-img {
    width: 60px;
    height: 44px;
  }
  .about {
    padding: var(--section-padding-mobile);
  }
  .news {
    padding: 60px 0 0;
  }
}
@media (max-width: 576px) {
  .hero {
    padding: calc(var(--header-height) + 10px) 0 var(--space-lg);
  }
  .hero h2 {
    font-size: var(--font-size-3xl);
  }
  .floating-code {
    display: none;
  }
  .contest-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .about-heading {
    font-size: 1.5rem;
  }
}
</style>
