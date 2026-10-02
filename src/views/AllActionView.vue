<script setup>
import { ref, computed } from "vue";
import { useTimeline } from "../composables/useTimeline";
import { useJson } from "../composables/useJson";

// 数据来自 public/data/events/：年份自动探测，首屏 = top + 最新两个年份，其余年份点侧栏再拉
// 月份 / 分类计数随年份加载实时派生，没有任何索引文件
const {
  years,
  yearMonthTree,
  categories,
  topEvents,
  yearGroups,
  loadedYears,
  loadYear,
  loadAllYears,
  pendingYears,
  loading,
  error,
} = useTimeline();
const ready = computed(() => !loading.value);

// ── 卡片右上角的奖牌角标（旧站还原，2026-09-23 会长要求）──
// 旧站（integration 分支）的大事迹卡片右上角有一枚角标，内容是**当场比赛的奖牌计数**，
// 颜色按最高奖项定。旧实现直接读旧数据里的 `summary` 字段；新数据层的 cards[] 只有
// { kind, date, category, title, tagline, link }，没有奖牌字段、也不允许加，
// 故由 scripts/gen_event_badges.mjs 在构建期从 awards/*.json 反算，产出这个几 KB 的生成物
// （不这么做就得让大事记页把 3103 条获奖记录全拉下来）。
const { data: badgeData } = useJson("/data/event_badges.json", { initial: { badges: {}, tiers: {} } });
const badgeOf = (item) => badgeData.value?.badges?.[item.link] || "";
/** 角标配色 = 最高奖项：特等奖（蓝桥杯早期，旧站没有这一档）> 金 > 银 > 铜。
    档位直接取生成物的 tiers 字段；老生成物没有该字段时才回退到从 emoji 文本反推。 */
function badgeToneOf(item) {
  const tier = badgeData.value?.tiers?.[item.link];
  if (tier) return tier;
  const text = badgeOf(item);
  if (text.includes("🏆")) return "grand";
  if (text.includes("🥇")) return "gold";
  if (text.includes("🥈")) return "silver";
  if (text.includes("🥉")) return "bronze";
  return "";
}

// ── 筛选：年份 + 月份 + 类型 + 搜索 ──
const searchQuery = ref("");
const selectedYear = ref(null);   // null = 全部（展示已加载的年份）
const selectedMonth = ref(null);  // null = 该年全部月份
const selectedCat = ref(null);    // null = 全部类型

const isPending = (year) => pendingYears.value.includes(String(year));

async function selectYear(y) {
  if (selectedYear.value === y) {
    selectedYear.value = null;
    selectedMonth.value = null;
    return;
  }
  selectedYear.value = y;
  selectedMonth.value = null;
  await loadYear(y); // 该年尚未加载则懒加载
}

function selectMonth(m) {
  selectedMonth.value = selectedMonth.value === m ? null : m;
}

function selectCat(k) {
  selectedCat.value = selectedCat.value === k ? null : k;
}

function resetAll() {
  searchQuery.value = "";
  selectedYear.value = null;
  selectedMonth.value = null;
  selectedCat.value = null;
}

// 「全部」：清空筛选，并把尚未加载的年份并发拉下来（逐年出现）
function showAll() {
  resetAll();
  loadAllYears();
}

// ── 类型筛选 ──
// category 直接来自数据；计数由 useTimeline 按「已加载的年份 + 置顶」实时算出。
// 顺序即侧栏 chips 展示顺序
const CAT_LABEL = {
  inv: "邀请赛",
  reg: "区域赛·全国赛",
  prov: "省赛·区赛",
  net: "网络赛",
  tts: "天梯赛",
  lanqiao: "蓝桥杯",
  chuanzhi: "传智杯",
  baidu: "百度之星",
  school: "校赛",
  club: "社团活动",
  other: "其他",
};
const CAT_ORDER = Object.keys(CAT_LABEL);

const availableCats = computed(() => {
  const counts = categories.value || {};
  return CAT_ORDER.filter((k) => counts[k]).map((k) => ({ key: k, label: CAT_LABEL[k], count: counts[k] }));
});

function matchCat(item) {
  return selectedCat.value === null || item.category === selectedCat.value;
}

// ── 综合筛选 + 搜索（只作用于已加载的年份）──
const isFiltering = computed(
  () =>
    selectedYear.value !== null ||
    selectedMonth.value !== null ||
    selectedCat.value !== null ||
    searchQuery.value.trim() !== ""
);

const filteredGroups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  let groups = yearGroups.value;
  if (selectedYear.value !== null) groups = groups.filter((g) => Number(g.year) === selectedYear.value);

  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        if (selectedMonth.value !== null && (!it.date || it.date.getMonth() + 1 !== selectedMonth.value)) return false;
        if (!matchCat(it)) return false;
        if (q && !it.title.toLowerCase().includes(q) && !it.tagline.toLowerCase().includes(q)) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);
});

// 搜索结果同样应用于置顶条目
const filteredTopEvents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return topEvents.value.filter(
    (it) => matchCat(it) && (!q || it.title.toLowerCase().includes(q) || it.tagline.toLowerCase().includes(q))
  );
});

const filteredYears = computed(() => filteredGroups.value.map((g) => Number(g.year)));

// 某年过滤后的时间轴条目（上游已按日期倒序）
function yearItems(year) {
  const g = filteredGroups.value.find((g) => Number(g.year) === year);
  return g ? g.items : [];
}

// 还有多少年份未加载（用于提示"点击侧栏年份可加载更多"）
const unloadedCount = computed(() => years.value.length - loadedYears.value.length);
</script>

<template>
  <main class="timeline-page container-fluid">
    <!-- 装饰光斑 -->
    <div
      class="decorative-orb decorative-orb--primary"
      style="width:600px;height:600px;top:-250px;right:-200px;opacity:0.06"
    ></div>
    <div
      class="decorative-orb decorative-orb--accent"
      style="width:400px;height:400px;bottom:10%;left:-150px;opacity:0.04"
    ></div>
    <div
      class="decorative-orb decorative-orb--light"
      style="width:350px;height:350px;top:40%;right:-120px;opacity:0.04"
    ></div>

    <!-- 标题区 -->
    <header class="page-hero">
      <p class="page-label">LATEST NEWS</p>
      <h1>协会<span class="highlight">大事记</span></h1>
      <p class="page-desc">在岁月的单行道上，拓下所有光影交错的印章。</p>
    </header>

    <div class="timeline-layout">
      <!-- 左侧：筛选 + 搜索 -->
      <aside class="tl-sidebar">
        <!-- 搜索框 -->
        <div class="sidebar-search">
          <i class="fas fa-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索标题或摘要…"
            class="search-input"
          />
          <button
            v-if="searchQuery"
            class="search-clear"
            @click="searchQuery = ''"
            title="清除"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 事件类型筛选（颜色与卡片左边框一致） -->
        <div class="sidebar-cats" v-if="years.length">
          <p class="sidebar-cats-label">事件类型</p>
          <div class="cat-chips">
            <button
              class="cat-chip"
              :class="{ active: selectedCat === null }"
              @click="selectedCat = null"
            >
              <span class="cat-dot" style="--cat: #b0bec5"></span>
              <span>全部</span>
            </button>
            <button
              v-for="m in availableCats"
              :key="m.key"
              class="cat-chip"
              :class="['tl-card--' + m.key, { active: selectedCat === m.key }]"
              @click="selectCat(m.key)"
            >
              <span class="cat-dot"></span>
              <span>{{ m.label }}</span>
              <span class="cat-count">{{ m.count }}</span>
            </button>
          </div>
        </div>

        <!-- 年份 / 月份导航（年份自动探测，点击年份按需加载该年数据，月份随之出现） -->
        <nav class="sidebar-nav" v-if="years.length">
          <button
            class="sn-item sn-all"
            :class="{ active: selectedYear === null && selectedCat === null && !searchQuery }"
            @click="showAll"
          >
            <span class="sn-bullet"></span>
            <span>全部</span>
            <span v-if="unloadedCount" class="sn-loading">+{{ unloadedCount }}</span>
          </button>

          <div
            v-for="entry in yearMonthTree"
            :key="entry.year"
            class="sn-group"
          >
            <button
              class="sn-item sn-year"
              :class="{ active: selectedYear === entry.year, loading: isPending(entry.year) }"
              @click="selectYear(entry.year)"
            >
              <span class="sn-bullet"></span>
              <span class="sn-year-num">{{ entry.year }}</span>
              <i v-if="isPending(entry.year)" class="fas fa-circle-notch fa-spin sn-pending"></i>
              <span
                v-else-if="!loadedYears.includes(String(entry.year))"
                class="sn-loading"
                title="点击加载该年"
                >·</span
              >
            </button>

            <button
              v-for="m in entry.months"
              :key="m"
              v-show="selectedYear === entry.year"
              class="sn-item sn-month"
              :class="{ active: selectedMonth === m }"
              @click="selectMonth(m)"
            >
              <span class="sn-bullet"></span>
              <span>{{ m }}月</span>
            </button>
          </div>
        </nav>
      </aside>

      <!-- 右侧：内容 -->
      <div class="tl-content">
        <div v-if="!ready" class="skeleton-list">
          <div
            v-for="n in 4"
            :key="n"
            class="skeleton"
            style="height:120px;border-radius:var(--radius-lg);margin-bottom:var(--space-md)"
          ></div>
        </div>

        <p v-else-if="error" class="hint">加载失败</p>

        <template v-else>
          <!-- 置顶事件（不受年月筛选，但受搜索影响） -->
          <section v-if="filteredTopEvents.length" class="pinned-section">
            <h2 class="section-label">
              <i class="fa-solid fa-thumbtack"></i> 置顶
            </h2>
            <div class="pinned-grid">
              <RouterLink
                v-for="(top, i) in filteredTopEvents"
                :key="top.key"
                v-reveal="'fade-up'"
                :style="{ '--reveal-index': i }"
                :to="`/post/${top.link}`"
                class="pinned-card"
                :class="'tl-card--' + top.category"
              >
                <span class="pinned-mark"
                  ><i class="fa-solid fa-thumbtack"></i
                ></span>
                <span class="pinned-title">{{ top.title }}</span>
                <span class="pinned-arrow">→</span>
              </RouterLink>
            </div>
          </section>

          <!-- 懒加载提示：还有年份没拉下来 -->
          <p v-if="!isFiltering && unloadedCount" class="load-hint">
            <i class="fas fa-circle-info"></i>
            已加载最近 {{ loadedYears.length }} 年，点击左侧年份可加载该年，或点「全部」加载所有年份
          </p>

          <!-- 无结果 -->
          <div
            v-if="isFiltering && !filteredGroups.length && !filteredTopEvents.length"
            class="empty-state"
          >
            <i class="fas fa-inbox"></i>
            <p>没有找到匹配的事件</p>
            <button class="btn btn-secondary" @click="resetAll">清除筛选</button>
          </div>

          <!-- 时间轴 -->
          <section
            v-for="(year, gi) in filteredYears"
            :key="year"
            class="year-section"
          >
            <h2
              v-reveal="'fade-up'"
              :style="{ '--reveal-index': gi }"
              class="year-heading"
            >
              <span class="year-num">{{ year }}</span>
              <span class="year-count">{{ yearItems(year).length }} 件事</span>
            </h2>

            <!-- 时间轴（新闻 + 比赛节点，按日期倒序） -->
            <div v-if="yearItems(year).length" class="timeline">
              <RouterLink
                v-for="(item, idx) in yearItems(year)"
                :key="item.key"
                :to="`/post/${item.link}`"
                v-reveal="'fade-up'"
                :style="{ '--reveal-index': idx }"
                class="tl-item"
                :class="{ right: idx % 2 === 1 }"
              >
                <div class="tl-card" :class="'tl-card--' + item.category">
                  <span
                    v-if="badgeOf(item)"
                    class="tl-badge"
                    :class="'tl-badge--' + badgeToneOf(item)"
                  >{{ badgeOf(item) }}</span>
                  <span class="tl-date">{{ item.dateStr }}</span>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.tagline }}</p>
                </div>
                <div class="tl-dot"></div>
              </RouterLink>
            </div>
          </section>
        </template>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   大事记页
   ========================================================================== */
.timeline-page {
  position: relative;
  overflow: clip;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(ellipse 700px 500px at 75% 5%, rgba(26,115,232,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 500px 400px at 15% 85%, rgba(255,152,0,0.04) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}

/* ── 标题区 ── */
.page-hero {
  text-align: center;
  margin-bottom: 48px;
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

/* ==========================================================================
   双栏布局：左侧筛选 + 右侧内容
   ========================================================================== */
.timeline-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-2xl);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
  align-items: start;
}

/* ── 左侧栏（sticky 跟随滚动）── */
.tl-sidebar {
  position: sticky;
  top: calc(var(--header-height) + 20px);
  align-self: stretch;
  display: flex;
  flex-direction: column;
}

/* 搜索框 */
.sidebar-search {
  position: relative;
  margin-bottom: var(--space-lg);
}
.sidebar-search i.fa-search {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: var(--radius-md);
  background: #fff;
  font-size: 0.85rem;
  color: var(--text);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.search-input::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}
.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(26,115,232,0.08);
}
.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 4px;
  border-radius: 50%;
  transition: color var(--transition-fast);
}
.search-clear:hover {
  color: var(--text);
}

/* ── 事件类型筛选（颜色 chips，--cat 与卡片左边框一致）── */
.sidebar-cats {
  margin-bottom: var(--space-lg);
}
.sidebar-cats-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
}
.cat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(0,0,0,0.08);
  background: #fff;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}
.cat-chip:hover {
  border-color: var(--cat, #b0bec5);
  color: var(--text);
}
.cat-chip.active {
  border-color: var(--cat, #b0bec5);
  background: var(--cat, #b0bec5);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
}
.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cat, #b0bec5);
  transition: background var(--transition-fast);
}
.cat-chip.active .cat-dot {
  background: #fff;
}
.cat-count {
  font-size: 0.68rem;
  opacity: 0.75;
}
.cat-chip.active .cat-count {
  opacity: 0.9;
}

/* ── 年份 / 月份导航（左侧竖轴）── */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  padding-left: 16px;
}
/* 竖轴线 */
.sidebar-nav::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: linear-gradient(
    180deg,
    rgba(26,115,232,0.4) 0%,
    rgba(26,115,232,0.1) 100%
  );
  border-radius: 1px;
}
.sn-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.84rem;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
  text-align: left;
  width: 100%;
}
.sn-item:hover {
  color: var(--text);
  background: rgba(0,0,0,0.02);
}
.sn-item.active {
  color: var(--primary);
  font-weight: 600;
  background: rgba(26,115,232,0.05);
}
/* 圆点 */
.sn-bullet {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(0,0,0,0.2);
  z-index: 1;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}
.sn-item.active .sn-bullet {
  border-color: var(--primary);
  background: var(--primary);
  box-shadow: 0 0 0 6px rgba(26,115,232,0.08);
}
.sn-all .sn-bullet {
  width: 10px;
  height: 10px;
  border-width: 2.5px;
}
.sn-year {
  font-weight: 600;
}
.sn-year .sn-year-num {
  font-family: var(--font-mono);
  font-size: 0.88rem;
}
.sn-month {
  padding-left: 36px;
  font-size: 0.78rem;
}
/* 年份懒加载状态：未加载显示淡点，加载中显示转圈 */
.sn-loading {
  margin-left: auto;
  color: var(--text-muted);
  opacity: 0.7;
  font-size: 0.72rem;
  font-family: var(--font-mono);
}
.sn-pending {
  margin-left: auto;
  font-size: 0.68rem;
  color: var(--primary);
  opacity: 0.8;
}
.sn-item.loading {
  color: var(--primary);
}

/* ── 右侧内容 ── */
.tl-content {
  min-width: 0;
}

.load-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-lg);
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  background: rgba(26, 115, 232, 0.05);
  border: 1px solid rgba(26, 115, 232, 0.12);
  color: var(--text-light);
  font-size: var(--font-size-sm);
}
.load-hint i {
  color: var(--primary);
}

.hint {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-3xl) 0;
  font-size: var(--font-size-lg);
}

.skeleton-list {
  max-width: 700px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
  color: var(--text-muted);
}
.empty-state i {
  font-size: 2.5rem;
  margin-bottom: var(--space-md);
  display: block;
  opacity: 0.3;
}
.empty-state p {
  margin-bottom: var(--space-lg);
}

/* ── 小节标签 ── */
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

/* ── 置顶 ── */
.pinned-section {
  margin-bottom: var(--space-2xl);
}
.pinned-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}
.pinned-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-left: 4px solid var(--cat, #b0bec5);
  border-radius: var(--radius-lg);
  color: var(--text);
  text-decoration: none;
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    border-color var(--transition);
}
.pinned-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(26,115,232,0.08);
  border-color: rgba(26,115,232,0.18);
  border-left-color: var(--cat, #b0bec5); /* hover 时保留类别左边框色 */
  color: var(--text);
}
.pinned-mark {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.85rem;
}
.pinned-title {
  flex: 1;
  font-weight: 600;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pinned-arrow {
  color: var(--text-muted);
  transition:
    transform var(--transition-fast),
    color var(--transition-fast);
}
.pinned-card:hover .pinned-arrow {
  transform: translateX(4px);
  color: var(--primary);
}

/* ── 年份标题 ── */
.year-section {
  margin-bottom: var(--space-xl);
}
.year-heading {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.year-num {
  font-family: var(--font-mono);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}
.year-count {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--bg-light);
  padding: 2px 12px;
  border-radius: var(--radius-full);
}

/* ── 时间轴：交错布局 ── */
.timeline {
  position: relative;
  padding: 0 0 var(--space-lg);
}
.timeline::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    rgba(26,115,232,0.3) 0%,
    rgba(26,115,232,0.1) 50%,
    rgba(26,115,232,0.05) 100%
  );
  border-radius: 1px;
  transform: translateX(-50%);
}

.tl-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--space-xl);
  color: var(--text);
  text-decoration: none;
}
.tl-item:last-child {
  margin-bottom: 0;
}

.tl-card {
  position: relative;
  width: calc(50% - 50px);
  padding: var(--space-lg);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-left: 4px solid var(--cat, #b0bec5);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    border-color var(--transition);
}
.tl-item:hover .tl-card {
  transform: translateY(-3px);
  box-shadow: 0 10px 32px rgba(26,115,232,0.07);
  border-color: rgba(26,115,232,0.15);
  border-left-color: var(--cat, #b0bec5); /* hover 时保留类别左边框色 */
}
/* ── 卡片类别左边框配色（--cat 变量）──
   inv=ICPC/CCPC全国邀请赛  reg=ICPC亚洲区域赛/CCPC全国赛  prov=xcpc省赛(含区赛)
   net=网络预选赛  tts=天梯赛  lanqiao=蓝桥杯  chuanzhi=传智杯
   baidu=百度之星  club=社团活动/讲座/集训  school=校赛  other=其他 */
/* ⚠ 色值一律引 tokens.css 的 `--cat-*`（2026-10-02 提上去的）：竞赛信息页的「近期赛事」
   也要用同一套颜色标比赛类型，若这里继续写死十六进制，两页就会各自漂移。
   改颜色只改 src/styles/tokens.css，本页与赛程表同时变。 */
.tl-card--inv { --cat: var(--cat-inv); }
.tl-card--reg { --cat: var(--cat-reg); }
.tl-card--prov { --cat: var(--cat-prov); }
.tl-card--net { --cat: var(--cat-net); }
.tl-card--tts { --cat: var(--cat-tts); }
.tl-card--lanqiao { --cat: var(--cat-lanqiao); }
.tl-card--chuanzhi { --cat: var(--cat-chuanzhi); }
.tl-card--baidu { --cat: var(--cat-baidu); }
.tl-card--club { --cat: var(--cat-club); }
.tl-card--school { --cat: var(--cat-school); }
.tl-card--other { --cat: var(--cat-other); }
.tl-card h3 {
  padding-right: 96px; /* 给右上角的奖牌角标留位 */
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  transition: color var(--transition-fast);
}
/* ── 奖牌角标（右上角；底色与最高奖项同色，样式沿用旧站 .tl-badge）── */
.tl-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid;
  font-size: 0.78rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
/* 特等奖是蓝桥杯早期届次才有的最高档，旧站没有这一档 —— 配色与全站的特等奖红一致 */
.tl-badge--grand {
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-color: rgba(198, 40, 40, 0.45);
  color: var(--honor-grand);
}
.tl-badge--gold {
  background: linear-gradient(135deg, #fff3d6, #ffe3a1);
  border-color: rgba(212, 167, 44, 0.45);
  color: #8a6d1a;
}
.tl-badge--silver {
  background: linear-gradient(135deg, #f3f3f4, #dcddde);
  border-color: rgba(150, 152, 156, 0.5);
  color: #6d6f73;
}
.tl-badge--bronze {
  background: linear-gradient(135deg, #fbe9dc, #f0cdb0);
  border-color: rgba(205, 127, 50, 0.45);
  color: #9c5a1e;
}
.tl-date {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-bottom: 6px;
}
.tl-item:hover .tl-card h3 {
  color: var(--primary);
}
.tl-card p {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  line-height: 1.6;
  white-space: pre-line; /* 说明文本中的换行（国赛/省赛分行） */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tl-dot {
  position: absolute;
  left: 50%;
  top: 28px;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--primary);
  z-index: 1;
  transition:
    transform var(--transition-spring),
    box-shadow var(--transition),
    background var(--transition);
}
.tl-item:hover .tl-dot {
  transform: translate(-50%, -50%) scale(1.6);
  background: var(--primary);
  box-shadow: 0 0 0 10px rgba(26,115,232,0.1);
}

.tl-item:not(.right) {
  justify-content: flex-start;
}
.tl-item:not(.right) .tl-card {
  margin-right: auto;
}
.tl-item.right {
  justify-content: flex-end;
}

/* ── 响应式 ── */
@media (max-width: 992px) {
  .timeline-layout {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }
  .tl-sidebar {
    position: static;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    padding-left: 0;
    gap: var(--space-xs);
  }
  .sidebar-nav::before {
    display: none;
  }
  .sn-item {
    padding: 6px 12px;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: var(--radius-full);
    font-size: 0.78rem;
    width: auto;
  }
  .sn-item.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }
  .sn-bullet {
    display: none;
  }
  .sn-month {
    padding-left: 12px;
  }
}
@media (max-width: 768px) {
  .timeline-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero {
    margin-bottom: 36px;
  }
  .page-hero h1 {
    font-size: 2rem;
  }
  .pinned-grid {
    grid-template-columns: 1fr;
  }
  .timeline::before {
    left: 24px;
  }
  .tl-item,
  .tl-item.right {
    justify-content: flex-start;
    padding-left: 52px;
  }
  .tl-card {
    width: 100%;
  }
  .tl-dot {
    left: 24px;
  }
  .year-num {
    font-size: 1.4rem;
  }
}
@media (max-width: 576px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .tl-card {
    padding: var(--space-md);
  }
}
</style>
