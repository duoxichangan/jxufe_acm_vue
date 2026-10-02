<script setup>
import { computed, ref, watch } from 'vue'
import { useJson } from '../composables/useJson'
import { useSkeleton } from '../composables/useSkeleton'
import { useMasonry } from '../composables/useMasonry'
import { useHonorDisplay } from '../composables/useHonorDisplay'
import { honorView } from '../utils/honorView'
import { rankWithTimeout, sortByRanking } from '../utils/honorRanking'
import HonorViewSwitch from '../components/HonorViewSwitch.vue'
import HonorTags from '../components/HonorTags.vue'

/** 名单 = members.json **原样** + 综合分 ≥ 阈值自动入册的人。
    入册判据与墙上「分数达标自动入墙」、与本页「卡片显示顺序」是同一份分数（honorRanking.js），
    所以卡片上看到的分数就是入册依据；生成物见 scripts/gen_group_wall.mjs，
    阈值在 public/data/wall_rules.json 的 excellentScoreThreshold（会长可调）。
    读不到生成物就退回 members.json —— 任何情况下这一页都不该空着。
    ⚠ 所以**两份请求都要盯**：只盯生成物那一份的话，生成物 404 时页面会去显示「加载失败」，
    而手里明明有 members.json 那 33 人 —— 上面那句承诺就永远走不到（2026-09-24 审查点出的 bug）。 */
const { data: excellent, loading: genLoading } = useJson('/data/excellent_members.json', { initial: [] })
const { data: baseMembers, loading: baseLoading } = useJson('/data/members.json', { initial: [] })
const members = computed(() => {
  // ⚠ 生成物是个对象（{ _note, threshold, count, members[] }），members.json 才是裸数组 ——
  // 别写成 excellent.value.length 判断：对象没有 length，会静默回退到 members.json 那 33 人
  const list = excellent.value?.members
  return Array.isArray(list) && list.length ? list : baseMembers.value
})

/** 两份都读完还是一个人都没有，才是「加载失败」唯一该出现的时机：
    生成物挂了但有 members.json 兜底 → members.length > 0 → 照常渲染；反过来同理。 */
const failed = computed(() => !members.value.length && !genLoading.value && !baseLoading.value)

const { skeletons } = useSkeleton(9)
const fallback = '/images/excellent_member/default.png'

/** 荣誉显示的三份公共数据与归一化（职务 / 自动汇总记录 / 手写荣誉）——
    与协会负责人页共用同一套取数（composables/useHonorDisplay.js），
    渲染在 <HonorTags>，本页只管卡片与网格。 */
const { records, dutyOf, shownName, cleanHonors } = useHonorDisplay()

/** 手写荣誉：先过掉已被自动汇总覆盖的，再归一化出类型。
    **显示与排名必须用同一份** —— 否则同一块奖牌会在卡片上显示两遍、在分值里算两遍
    （上游名单里还手写着 105 条胶囊已覆盖的竞赛条目，口径与判定见 utils/honorCoverage.js）。
    ⚠ 这一页就是 members.json 那 33 人 + 自动入册者，**不并入干事** —— 会长 2026-09-23 第二轮裁定：
    「我们还是不要让协会干事必定入『优秀成员』吧」（此前那版自动并入已撤掉）。 */
const cleanedMembers = computed(() =>
  (members.value || []).map((m) => ({
    ...m,
    // 第二个参数是**真名**：奖学金按真名查（匿名机制只换显示名，m.name 仍是真名）
    honors: cleanHonors(m.honors, m.name),
  }))
)

/** 显示排名：比赛奖牌 + 手写战绩 + 荣誉加项折算成分值，决定卡片的显示顺序。
    权重表、口径与排序键见 utils/honorRanking.js；数据加载与上面的胶囊共用同一份缓存。
    ⚠ 3 秒超时只是「先按原顺序渲染」，**不是**放弃排名 —— 迟到的那份仍然会覆盖上去
    （策略、超时值与理由见 honorRanking.js 的 rankWithTimeout）。

    「排名到手没有」和「网格可以渲染了」是两件事，**分开记**，别用一个 byName 兼职：
    · `byName`  = 真排名；没到手就是 null，此时列表按 JSON 原序
    · `settled` = 网格可以渲染了；真排名到手、或 3 秒超时降级，都算
    2026-09-24 两修：① 原先是 `byName.value = result ? result.byName : new Map()`，超时先到时
    置空 Map、又被 `byName.value` 挡住重跑 → 迟到的排名被永久丢弃；② 改成 `onApply(null)` 之后，
    模板用 `!byName` 当骨架屏条件，把「先按原序渲染」这条降级又原样抵消（等于天天卡骨架屏）。
    下面没有 `byName.value` 早退守卫 —— 奖学金后到会让 cleanedMembers 换一份、分值跟着变，
    不能因为「已经排过一次」就跳过重算；乱序返回由 rankSeq 挡。 */
const byName = ref(null)
const rankingSettled = ref(false)
let rankSeq = 0
watch(
  cleanedMembers,
  async (val) => {
    if (!val?.length) return
    const seq = ++rankSeq
    await rankWithTimeout(val, {
      onApply: (map) => {
        if (seq === rankSeq) byName.value = map
      },
      onTimeout: () => {
        if (seq === rankSeq) rankingSettled.value = true
      },
    })
    // 及时路径：onTimeout 不会触发，这里补上「可以渲染了」
    if (seq === rankSeq) rankingSettled.value = true
  },
  { immediate: true }
)

/** 卡片顺序：**置顶的历任会长最前** → 其余按显示排名；排名没就绪时保持原序。
    置顶标记 pinned 由 scripts/gen_group_wall.mjs 写在 excellent_members.json 里
    （会长 2026-09-24：「把几个协会负责人，也放进优秀成员，放在前面」——
    这条推翻了 2026-09-23 的「自动入册不应该包含会长」）。

    ⚠ 必须在这里把置顶的人**摘出排序**，不能只靠数据里的顺序：
    下面 sortByRanking 是按综合分排的，只把会长塞进数组开头会被它整个打散，
    「放在前面」当场落空。置顶组内保持数据原序（= 届次从新到旧），也不参与排名。 */
const list = computed(() => {
  const arr = cleanedMembers.value
  const pinned = arr.filter((m) => m.pinned)
  if (!pinned.length) return byName.value ? sortByRanking(arr, byName.value) : arr
  const rest = arr.filter((m) => !m.pinned)
  return [...pinned, ...(byName.value ? sortByRanking(rest, byName.value) : rest)]
})

/** 瀑布流：卡片高度按内容自适应（荣誉条数差别很大），位置由 useMasonry 逐张放进
    当前最短的列并保持源顺序。列数/间距是 .grid 上的两个 CSS 变量，见样式区。 */
const { containerRef } = useMasonry()
</script>

<template>
  <main class="excellent-page container-fluid">
    <!-- 装饰光斑 -->
    <div class="decorative-orb decorative-orb--primary" style="width:500px;height:500px;top:-200px;right:-150px;opacity:0.06"></div>
    <div class="decorative-orb decorative-orb--accent" style="width:350px;height:350px;bottom:8%;left:-120px;opacity:0.04"></div>

    <div class="container excellent-inner">
      <!-- 标题区 -->
      <header class="page-hero">
        <p class="page-label">EXCELLENT MEMBERS</p>
        <h1>优秀<span class="highlight">成员</span></h1>
        <p class="page-desc">星光不问赶路人，时光不负有心人</p>
      </header>

      <!-- 荣誉显示方式（会长 2026-09-23）：放在标题与网格之间 —— 它管的是下面整片网格里
           每张卡片的画法，属于页面级命令区；两页共用一份偏好、控件本身不加说明文字。 -->
      <div class="page-toolbar">
        <HonorViewSwitch />
      </div>

      <!-- Loading（成员数据与排名都有结论再渲染网格，避免卡片先排好又跳位）。
           「结论」包含 3 秒超时降级：那时按 JSON 原序先渲染，真排名回来再重排 ——
           条件必须看 rankingSettled 而不是 byName，否则超时那条路会一直卡在骨架屏上。 -->
      <div v-if="genLoading || baseLoading || (members.length && !rankingSettled)" class="grid">
        <div v-for="n in skeletons" :key="n" class="skeleton" style="height:420px;border-radius:var(--radius-xl);"></div>
      </div>

      <!-- Error：两份数据都拿不出人才显示 —— 手里有兜底名单（或生成物）就必须照常渲染 -->
      <p v-else-if="failed" class="hint">加载失败</p>

      <!-- 成员网格 -->
      <div v-else ref="containerRef" class="grid">
        <article
          v-for="(m, i) in list"
          :key="m.name"
          v-reveal="'scale-in'"
          :style="{ '--reveal-index': i }"
          class="member-card"
        >
          <!-- 头像区 -->
          <div class="member-photo">
            <div class="photo-ring"></div>
            <div class="photo-frame">
              <img :src="m.photo || fallback" :alt="shownName(m)" @error="$event.target.src = fallback" />
            </div>
          </div>

          <!-- 信息区 -->
          <div class="member-body">
            <h3>{{ shownName(m) }}</h3>
            <p v-if="m.class" class="member-class">{{ m.class }}</p>

            <!-- 荣誉标签：职务胶囊（duties.json）在前，比赛战绩胶囊（自动汇总）居中，
                 手写荣誉在后；均按类型分色。顺序与三种显示模式都在 <HonorTags> 里
                 —— 与协会负责人页共用同一份实现（会长 2026-09-23 审查后去重）。 -->
            <div class="honor-tags">
              <HonorTags
                :person="m"
                :records="records"
                :honors="m.honors"
                :duties="dutyOf(m)"
                :view="honorView"
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   优秀成员页
   ========================================================================== */
.excellent-page {
  position: relative;
  overflow: clip;
  min-height: 100vh;
  margin-top: calc(-1 * var(--header-height));
  padding: calc(var(--header-height) + 40px) 0 var(--space-3xl);
  background:
    radial-gradient(ellipse 600px 400px at 80% 5%, rgba(26,115,232,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 400px 300px at 15% 90%, rgba(255,152,0,0.03) 0%, transparent 60%),
    linear-gradient(175deg, #f8fafc 0%, #fff 35%, #fff 100%);
}
.excellent-inner {
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
  background: rgba(26, 115, 232, 0.12);
  border-radius: 2px;
  z-index: -1;
}
.page-desc {
  font-size: var(--font-size-base);
  color: var(--text-muted);
}

/* ── 页面命令区与明细模式的奖牌 emoji ──
   `.page-toolbar` 与 `.medal-emoji` 已移到 styles/honors.css：后者标的是
   <HonorTags> 渲染的节点，写在本文件的 scoped 块里匹配不到（只会静默失效）。 */

.hint {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-3xl) 0;
  font-size: var(--font-size-lg);
}

/* ── 卡片网格（瀑布流的兜底布局 + JS 接管后的定位契约）──
   列数与间距只有这一处旋钮，媒体查询里也只改这两个变量：
     · CSS 这边用它们写 grid 兜底布局（JS 还没接管时/未启用时）；
     · useMasonry 也读同一个元素上的这两个变量算卡片宽度（读不到才用兜底 4 列 / 32px）。
   两边同源，改列数只需改这里。**不要去改 grid-template-columns 的列数**。 */
.grid {
  --masonry-columns: 4;
  --masonry-gap: var(--space-lg);
  display: grid;
  grid-template-columns: repeat(var(--masonry-columns), 1fr);
  gap: var(--masonry-gap);
}
/* useMasonry 接管后：卡片改成绝对定位，位置由 JS 写进内联 left/top。
   用 left/top 而不是 transform，是为了让卡片自己的 hover translateY 继续生效；
   容器高度也由 JS 写（所以这里不设 min-height）。 */
.grid.is-masonry {
  display: block;
  position: relative;
}
.grid.is-masonry > * {
  position: absolute;
  top: 0;
  left: 0;
}

/* ── 卡片 ── */
.member-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  transition: transform var(--transition-spring), box-shadow var(--transition), border-color var(--transition);
}
.member-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 36px rgba(26,115,232,0.08);
  border-color: rgba(26,115,232,0.15);
}

/* ── 头像区 ── */
.member-photo {
  position: relative;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(26,115,232,0.03) 0%, transparent 100%);
  overflow: hidden;
}
/* 底部渐变线 */
.member-photo::after {
  content: "";
  position: absolute;
  left: var(--space-lg);
  right: var(--space-lg);
  bottom: 0;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: 1px;
  transition: left var(--transition), right var(--transition);
}
.member-card:hover .member-photo::after {
  left: 8px;
  right: 8px;
}

/* 头像光环 */
.photo-ring {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(var(--primary), var(--primary-light), var(--accent), var(--primary));
  opacity: 0;
  transition: opacity var(--transition-slow);
  animation: ring-spin 5s linear infinite; /* @keyframes 在 styles/base.css（两页共用） */
}
.member-card:hover .photo-ring {
  opacity: 0.25;
}

/* 头像框 */
.photo-frame {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  padding: 3px;
  background: var(--gradient-primary);
  transition: transform var(--transition-spring);
  z-index: 1;
}
.member-card:hover .photo-frame {
  transform: scale(1.06);
}
.photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #fff;
}

/* ── 信息区 ── */
.member-body {
  flex: 1;
  padding: var(--space-lg);
  text-align: center;
  display: flex;
  flex-direction: column;
}
.member-body h3 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
  transition: color var(--transition-fast);
}
.member-card:hover .member-body h3 {
  color: var(--primary);
}
.member-class {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-bottom: var(--space-md);
}

/* ── 荣誉标签 ──
   标签的几何与分色、以及卡片 hover 时加深，全在 styles/honors.css
   （那边的修饰类只换 --tag-* 五个私有变量）；这里只管容器排布。
   **不要**在这个文件里再写 .honor-tag 的颜色或 hover：标签由 <HonorTags> 渲染，
   scoped 选择器带 [data-v-*]、匹配不到子组件的元素（以前能生效，是因为模板在本页编译）。

   胶囊紧跟正文（2026-09-22 会长裁定）：原先用 margin-top: auto 顶到卡片底部，
   矮卡最多空出 175px；现在空白留在卡片底部。 */
.honor-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

/* ── 响应式 ── */
@media (max-width: 992px) {
  .grid {
    --masonry-columns: 3;
  }
}
@media (max-width: 768px) {
  .excellent-page {
    padding: calc(var(--header-height) + 30px) 0 var(--space-2xl);
  }
  .page-hero {
    margin-bottom: 48px;
  }
  .page-hero h1 {
    font-size: 2rem;
  }
  .grid {
    --masonry-columns: 2;
    /* 间距必须走变量：useMasonry 读的就是它。若只改 gap 属性，JS 侧会仍按 32px 排版 */
    --masonry-gap: var(--space-md);
  }
  .member-photo {
    height: 210px;
  }
  .photo-frame {
    width: 150px;
    height: 150px;
  }
  .photo-ring {
    width: 170px;
    height: 170px;
  }
}
@media (max-width: 576px) {
  .page-hero h1 {
    font-size: 1.7rem;
  }
  .grid {
    --masonry-columns: 1;
  }
}
</style>
