<script setup>
/**
 * 近期赛事时间安排表（竞赛信息页，2026-10-01 新增；2026-10-02 二次改版）
 * ---------------------------------------------------------------------------
 * 与上面那张「全年赛程」时间轴的分工：
 *   · 全年赛程（CompetitionSchedule.vue）= **宏观**，各赛事在一年中的月份区间，
 *     数据是历年真实赛历的统计结果，它回答「这类比赛一般几月比」；
 *   · 本表 = **具体**，一场一行、写到日子，读两份数据合成（口径见 utils/scheduleView.js）：
 *       public/data/schedule.json      会长手写的真源（入库）
 *       public/data/schedule.auto.json 各赛事官网抓来的（构建期生成）
 *
 * **这一页的「自动」在哪**（无需任何人维护就会变）：
 *   1. 已结束的场次自动收起（页脚写明收起了几场）；
 *   2. 按开赛日自动排序、自动分组到月份；
 *   3. 「还有 N 天 / 报名还剩 N 天 / 今天 / 进行中 / 已结束」全部按当天现算；
 *   4. 自动层抓来的场次带「自动」角标，官网标注「暂定」的带「暂定」角标 ——
 *      不把抓来的和确认过的混成一谈。
 *
 * 2026-10-02 会长四条改动（本文件是落点）：
 *   ① 「线上赛不是自动折叠，而是所有赛时都显示，然后添加一个 fliter」——
 *      原先 Codeforces / AtCoder 收在 `<details>` 里，现在与主表**按日期混排**；
 *      避免「一周十几场 CF 把 ICPC 南昌站淹掉」的办法从「替人藏起来」换成
 *      「让人自己挑」：顶部一排类型 chips（视觉与大事记侧栏一致，颜色共用 tokens 的 --cat-*）。
 *   ② 「logo 放到每个卡片最前面，大小放大很多」——行首第一个格子就是 logo（64px，
 *      原先 22px 的小图标夹在标题前）；competitions.json 里没有条目的赛事
 *      （睿抗 / 线上平台 / 协会自办）给一枚「简称首字母」方块，不留空。
 *   ③ xCPC 命名标准形式 —— 名字来自数据层与抓取层（见 scripts/lib/schedule-parse.mjs），
 *      本组件只负责画。
 *   ④ 「条目要使用左边框指示比赛类型」——左边框改成**类型色**（此前是状态色）；
 *      状态改由右侧状态胶囊 + 今天/报名中的行底色渐变表达，两件事不再抢同一个位置。
 *
 * 数据由页面（ContestView）取好再传进来 —— 与隔壁 CompetitionSchedule.vue 一样是**纯渲染组件**：
 * 加载态、取数都归页面管，组件只负责画。这样它也能在 node 里用 fixture 直接渲染出来回归
 * （见 test/upcoming-schedule.test.mjs 的 SSR 冒烟），不必起浏览器。
 *
 * 2026-10-02 会长第二轮的四条（落点：本文件 + public/data/platforms.json + 抓取层）：
 *   ⑤ 「我希望并没有一个 fliter 叫『全部』，而是默认全部勾选，点击『全部』后就把全部的标签勾选，
 *      『全部』本身不能勾选」——类型 chips 由单选改**多选**：状态存 `excluded`（被取消勾选的类型），
 *      默认空集 = 全部勾上；「全部」是**动作按钮**（把每个标签勾回来），它自己永远不高亮。
 *   ⑥ 「logo 不要被半透明边框包裹，然后 logo 还可以更大一些」——去掉那圈 1px 边框/内边距/白底，
 *      64px → 96px。96 是**上限**：会长给的原图 CF 101×89、牛客 98×98 就这么大，再放就糊。
 *   ⑦ 「我添加了 cf 和 atcoder 和牛客的 logo」——三个平台图标进 public/data/platforms.json，
 *      由页面当 props 传进来；组件把两份数据合成同一张 slug → 图标 表（取图标只有一条路径）。
 *   ⑧ 「把牛客的竞赛日历添加到这里」——抓取层新增 nowcoder 源（模板与去重见 scripts/gen_schedule.mjs）。
 *
 * 2026-10-02 会长第三轮的四条（落点：本文件 + src/utils/scheduleView.js 的两个纯函数）：
 *   ⑨ 「我希望类型可以分的更开，线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」
 *      ——chip 第一行按**赛事**（ICPC / CCPC / 天梯赛 / 蓝桥杯…），第二行按**线上平台**；都带 logo。
 *   ⑩ 「我希望『全部勾选线下赛事』『全部勾选线上赛』的按钮文本改成『线上赛』与『线下赛』，
 *      并且放到所属行的最前面……都改成可选中式，但是是关联式的选中」——三颗**范围开关**
 *      （全部 / 线下赛 / 线上赛）改成关联式高亮：它管的那组全勾上才亮，点击 = 整组全勾/全撤
 *      （语义在 scheduleView.js 的 groupChecked / toggleGroup，SSR 里点不到按钮，只能测纯函数）。
 *   ⑪ 「『全部』按钮要放到两个 upcoming__cat-row 上面」+ 删掉两行行首的纯文本标签。
 *   ⑫ 「圆形 logo 组件与胶囊圆角匹配」——白圆与胶囊端头**同心同曲率**（内圆角 = 外圆角 − 圆环，
 *      见 .upcoming__cat 顶部那段推算：白圆 30px、胶囊 34px、外圆角 17 = 内圆角 15 + 圆环 2）。
 *      这一版之前白圆只有 20px、圆角写死 `50%`，半径 10px 对 16px —— 两个曲率不一路。
 *   ⑬ 「我希望现在把各按钮放到一行，这样排布：ICPC CCPC 传智杯 百度之星 线下 全部 线上 .....」
 *      ——**整排并成一行**（同日第四版）：线下赛事 chips →「线下赛」开关 →「全部」→「线上赛」开关
 *      → 线上平台 chips；三颗开关夹在两拨 chip **中间**（位置本身就是语义）。⑪ 那条
 *      「『全部』提到两行之上」随之作废；窄屏一行放不下时由 .upcoming__cat-row 自己 flex-wrap 折行。
 */
import { computed, ref } from 'vue'
import {
  buildUpcoming,
  groupByMonth,
  startOfToday,
  categoryVars,
  buildIconIndex,
  contestLabel,
  scheduleStats,
  groupChecked,
  toggleGroup,
  initialOf as initialLetter,
} from '../utils/scheduleView.js'
/* ⚠ 这里原先 import 了共用的 ScheduleStats.vue（仪表板）。2026-10-02 会长要求本页不显示它
   （「在近期比赛的详情页不要显示这个 class=…upcoming__stats」）→ import 与模板一起撤掉。
   组件本身仍在（`UpcomingBoard.vue` 用），样式体仍在全局 `styles/schedule-stats.css`。 */

const props = defineProps({
  /** competitions.json 原样传入：给已知赛事（icpc / ccpc / gplt / lanqiao / baidu / chuanzhi）配图标与简称。 */
  competitions: { type: Array, default: () => [] },
  /** platforms.json 原样传入：线上平台（Codeforces / AtCoder / 牛客）的图标与简称。
      ⚠ 它们**故意不写进 competitions.json** —— 那份数据的每一条都会在竞赛卡片网格里长出一张大卡
      （并进奖项文件、届次映射等校验），而这三个我们并不「参赛」，只是赛程的来源。
      两份在这里合成同一张 slug → 图标 表，故取图标只有一条路径。 */
  platforms: { type: Array, default: () => [] },
  /** schedule.json 原样传入（手写真源）：{ updated, items, pending } */
  schedule: { type: Object, default: () => ({}) },
  /** schedule.auto.json 原样传入（构建期抓取）：{ generated_at, sources, alerts, items }。缺省视为空。 */
  autoSchedule: { type: Object, default: () => ({}) },
  /** 两份数据是否还在路上（页面把两个请求的 loading 或起来传进来） */
  loading: { type: Boolean, default: false },
  /** 今天。页面不传（取本地当天 00:00）；**只给回归测试注入固定日期用**。 */
  today: { type: Date, default: () => startOfToday() },
  /** 初始「取消勾选」的类型集合。页面不传（默认空集 = 每个类型都勾上）；
      **只给回归测试注入** —— 点击在 SSR 里模拟不了，而「哪些行被筛掉」恰恰是最该钉住的一段。 */
  initialExcluded: { type: Array, default: () => [] },
})

const view = computed(() =>
  buildUpcoming(
    {
      items: props.schedule?.items || [],
      pending: props.schedule?.pending || [],
      auto: props.autoSchedule?.items || [],
    },
    props.today
  )
)

/* ── 筛选（2026-10-02 四改：按类型 → 按赛事/平台 → 并成**一整排**）──────────────
   会长口径：「类型可以分的更开，线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」，
   第四版又定：「我希望现在把各按钮放到一行，这样排布：ICPC CCPC 传智杯 百度之星 线下 全部 线上 .....」。
   于是整排**只有一条** .upcoming__cat-row —— 两拨 chip 夹着三颗开关，彼此不重叠、也没有第三层：
     · 线下赛事：一颗 chip = 一个赛事（ICPC / CCPC / 天梯赛 / 蓝桥杯 / 传智杯 / 百度之星 / 协会自办…）；
     · 线上平台：一颗 chip = 一个平台（Codeforces / AtCoder / 牛客…）。
   两拨 chip 的键**同形**（都是 contest slug，见 scheduleView.filterKeyOf），谁属于哪一拨由
   categoryOf() 判定 —— 键同形的好处是「一颗 chip 就是一个独立的开关」，
   不需要为两拨各写一套筛选逻辑。
   原先那套「邀请赛 / 区域赛 / 省赛 / 网络赛」的类型 chips 撤掉了 —— 那条信息仍然看得见：
   它就是**每一行左边框的颜色**（与大事记同一套色，见 tokens.css 的 --cat-*），
   而 chip 的选中色取该赛事**最常见的类型色**，两边对得上。
   其余规矩不变（2026-10-02 二次改版定下的）：
     · 默认**全勾**：状态存的是**被取消勾选的键集合**（excluded），不是「选中了哪些」——
       数据里新冒出来的赛事默认就是勾上的，不需要 watcher 去补齐；
     · 「全部」与两颗范围开关（线下赛 / 线上赛）2026-10-02 第三版改成**关联式选中**：
      它们自己不存状态 —— 亮不亮由「它管的那组标签是不是都勾上」推出来（全勾 → 亮）；
      点一下 = **整组反转**（亮着点 → 全撤，不亮点 → 全勾）。⚠ 这推翻了本文件早先那句
      「三颗都只是动作按钮、永远不会高亮」（会长当时的要求，当天又改了口径）——
      纯判据在 scheduleView 的 `groupChecked` / `toggleGroup`，组件这边只负责画；
     · 计数按**未筛选**的全部场次算，切筛选时数字不会跳；
     · 数据里没有的赛事不摆 chip —— 摆一个点下去空表的按钮等于给访客挖坑。 */
const excluded = ref(new Set(props.initialExcluded))

/** 图标只有一条来源：scheduleView 的**合表**（competitions.json + platforms.json）。
    完整表与看板（UpcomingBoard.vue）共用它 —— 两处各拼一张 slug → 图标 表的话，
    日后加一个数据源就会漏改一处，而漏改的表现是「静默没图标」，不是报错。
    chips 上的 logo 与文字也走它，故这张表必须排在 chips 之前。 */
const icons = computed(() => buildIconIndex(props.competitions, props.platforms))
const iconOf = (row) => icons.value.get(row?.contest) || {}
const logoOf = (row) => iconOf(row).image || ''
const nameOf = (row) => iconOf(row).label || ''

/** chip 上的文字与 logo：显示名的兜底顺序（图标表 → CONTEST_LABELS 中文名 → slug）
    与仪表板格子共用 scheduleView.contestLabel —— 两处不一致的话，同一个 `club`
    在一颗 chip 上叫「协会自办」、在仪表板里却叫 `club`（2026-10-02 就是这么发现的）。 */
const chipLabel = (slug) => contestLabel(icons.value, slug)
const chipImage = (slug) => icons.value.get(slug)?.image || ''

/** 按赛事 / 按平台各数一遍 —— **直接用仪表板那份统计**（scheduleView.scheduleStats 的
    byContest / byPlatform）。2026-10-02 收口：这里原先自己 `tallyRows` + `dominantCat` 又数了一遍，
    与仪表板成了两份实现，改一处忘一处就会「chip 上的数字与仪表盘对不上」；
    「这个赛事该用哪条类型色」（一格多种类型时取最常见的）也一并由它给。 */
const stats = computed(() => scheduleStats(view.value, props.today))

/** 线下赛事 chips：**一颗一个赛事**（会长 2026-10-02：「线下赛要分赛事，并且要显示 logo」）。
    顺序 = scheduleStats 的 CONTEST_ORDER（未登记的新赛事兜在末尾，不许静默丢掉）。 */
const contestChips = computed(() =>
  stats.value.byContest.map((c) => ({
    key: c.slug,
    label: chipLabel(c.slug),
    image: chipImage(c.slug),
    cat: c.category,
    count: c.count,
  }))
)

/** 线上平台 chips：**一颗一个平台**（会长 2026-10-02：「线上赛要分平台」）。颜色统一
    --cat-online（与这些行的左边框同色）；顺序 = scheduleStats 的 PLATFORM_ORDER，
    文件里没登记的平台（例如将来恢复抓取的洛谷）兜在末尾、不会漏。 */
const platformChips = computed(() =>
  stats.value.byPlatform.map((p) => ({
    key: p.slug,
    label: chipLabel(p.slug),
    image: chipImage(p.slug),
    cat: 'online',
    count: p.count,
  }))
)

/** 三颗范围开关各自的键清单：「线下赛」= 赛事那组，「线上赛」= 平台那组，「全部」= 两者相加 */
const contestKeys = computed(() => contestChips.value.map((c) => c.key))
const platformKeys = computed(() => platformChips.value.map((c) => c.key))
const allKeys = computed(() => [...contestKeys.value, ...platformKeys.value])

/** 筛选键是 row.filterKey = **赛事 slug**（线下那颗是 icpc / ccpc / 蓝桥杯…，线上那颗是
    Codeforces / 牛客…）—— 两拨的键同形，故这一句就够，见 scheduleView 的 filterKeyOf */
const visibleRows = computed(() => view.value.rows.filter((r) => !excluded.value.has(r.filterKey)))

const groups = computed(() => groupByMonth(visibleRows.value))

/** 勾选的标签一个都不剩（表会空着）——页面据此给一句「点全部恢复」而不是空白 */
const noneChecked = computed(() => view.value.rows.length > 0 && visibleRows.value.length === 0)

function toggleCat(key) {
  const next = new Set(excluded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  excluded.value = next // 换新 Set 而不是原地改：状态变化对 Vue 与测试都是显式的
}

/** 三颗范围开关的**选中态**（关联式，自己不存状态）：它管的那组标签全勾上才亮。
    判据在 scheduleView.groupChecked —— 空组恒 false（线上赛一场都没有时，那颗开关不该亮着）。 */
const allOn = computed(() => groupChecked(excluded.value, allKeys.value))
const contestsOn = computed(() => groupChecked(excluded.value, contestKeys.value))
const platformsOn = computed(() => groupChecked(excluded.value, platformKeys.value))

/** 点一下 = **整组反转**（会长 2026-10-02 第三版：「处于选中状态点击，全部取消选中；
    未选中状态点击，全部选中」）。三颗走同一条路径，只有键清单不同。 */
const toggleScope = (keys) => {
  excluded.value = toggleGroup(excluded.value, keys) // 换新 Set：原地 clear/add 不会触发重渲染
}
const toggleAll = () => toggleScope(allKeys.value)
const toggleContests = () => toggleScope(contestKeys.value)
const togglePlatforms = () => toggleScope(platformKeys.value)

/** 没图标的赛事（睿抗 / 协会自办…）给一枚首字母方块：那一格整块空着，与
    「这里本来就只有一个字母」看着完全不同，后者不会像漏图。判据在 scheduleView.initialOf。 */
const initialOf = (row) => initialLetter(nameOf(row) || row.title)

/** 行的内联样式：两枚类型色变量（`--cat` / `--cat-soft`）。
 *
 *  ⚠ **逐一出现的错位压在「动画延迟」上，不是「过渡延迟」**（会长 2026-10-02 第三轮：
 *    「我希望仍然有逐一出现的动画，并且有卡片离开时，下方的卡片应该向上运动到最终位置」）：
 *    · 行挂 `v-reveal="'fade-up'"`、**每一行各自入场** —— 别收回成整块入场：那会让这张 4000px
 *      长的表只剩 1 个入场元素，加载那一瞬淡完、往下滚就再没有动画（会长第二轮的原话就是
 *      「现在怎么什么动画都没了」）。
 *    · base.css 那条 `[data-reveal][style*="--reveal-index"] { transition-delay: … }` 在这张表上
 *      **不起作用**：`.upcoming__row` 自己的 `transition` 简写（0,2,0）压过 base.css 的
 *      `[data-reveal]`（0,1,0），延迟被重置（实测行 `transitionDelay: 0s, 0s, 0s`）。
 *    · 若改成给行加 `transition-delay` 来修，会**连悬停上浮一起延迟**（序号 4 的行悬停要等 0.4s
 *      才抬起、移开鼠标还要再等 0.4s 落回）—— 那正是第一版被撤掉的原因。
 *    · 故改用**入场动画**（CSS 的 `@keyframes upcoming-row-in` +
 *      `animation-delay: calc(var(--reveal-index, 0) * 0.1s)`）：animation-delay 只作用于这一条动画，
 *      悬停的 transition 完全不受影响。animation 与 transition 同时命中 transform/opacity 时，
 *      动画在运行期间优先，跑完自然交还给 transition（悬停手感不受损）。
 *    · 序号**按月份分组内的下标**算（模板 `v-for="(row, i) in g.rows"`，每组从 0 重新数）并**封顶**：
 *      滚动时一屏通常只进来一两行，封顶避免「第 20 行要等 2s」那种慢。 */
const ROW_STAGGER_MAX = 4
const rowStyle = (row, i) => ({
  ...categoryVars(row.category),
  '--reveal-index': Math.min(i, ROW_STAGGER_MAX),
})

/* 顶部那块仪表板的数字口径在 scheduleView.scheduleStats（上面给筛选 chips 时已取过一次），
   结构与两页一致性由共用的 components/ScheduleStats.vue 保证 —— 看板用的是同一个组件。 */

/** 抓取失败的源也要说出来：否则「自动层少了几行」在页面上看不出来。 */
const failedSources = computed(() =>
  (props.autoSchedule?.sources || []).filter((s) => !s.ok).map((s) => s.label || s.id)
)

/** 页脚：只说**例外**三件 —— 收起了几场、勾选后剩几场、哪个源没同步上。
    拼成一句再渲染，免得某个片段为空时留下一个孤零零的「 · 」。
    ⚠「已自动收起 N 场」原先在仪表板第一行（那格叫「已收起」），2026-10-02 会长要求撤掉
    第一行（「去除第一行的那些场待办 35 本月 25 下月 6 报名中」）后**搬回这里** ——
    否则「表里少了 8 场」这件事在页面上就没地方说了。数字口径仍是 scheduleStats()。 */
const footParts = computed(() => {
  const parts = []
  if (view.value.expiredCount) parts.push(`已自动收起 ${view.value.expiredCount} 场结束的`)
  if (view.value.rows.length && visibleRows.value.length !== view.value.rows.length) {
    parts.push(`勾选后显示 ${visibleRows.value.length} 场`)
  }
  if (failedSources.value.length) {
    parts.push(`自动同步失败：${failedSources.value.join('、')}（表内相关场次来自手写层）`)
  }
  return parts
})
</script>

<template>
  <!-- 入场动画：**每一行各自入场**（`v-reveal="'fade-up'"`，一行一个挂点）。会长 2026-10-02
       两轮反馈的折中 —— 先是「逐条错位淡入太慢」、我收成「整块一次」后他又说「现在怎么什么动画
       都没了」（整张 4000px 长的表只剩 1 个入场元素，加载一瞬淡完就没了）。现在：行照旧各自入场。
       ⚠ 别再收成整块。⚠ 也**别给行加 `--reveal-index`** —— 实测它在这张表里不起作用（行的
         transition 简写会冲掉 base.css 那条 0.1s 延迟，`transitionDelay` 实测 `0s`），
         要真生效就得连悬停上浮一起延迟；详见脚本 rowStyle 的注释。 -->
  <section class="upcoming">
    <!-- ⚠ 这里原先有一个自带的表头（.upcoming__head：「近期赛事」h2 + 一行说明）。
         2026-10-02 会长要求取消 —— 独立页 /upcoming 的 hero 已经写了同一个标题与更全的说明，
         组件再重复一遍是同一句话出现两次。**要做表头请改 views/UpcomingView.vue 的 hero**，
         别在这里加回来（竞赛信息页那边由 UpcomingBoard.vue 自己的标题承担）。 -->
    <div v-if="loading" class="upcoming__skeleton">
      <div v-for="n in 3" :key="n" class="skeleton"></div>
    </div>

    <template v-else>
      <!-- ⚠ 这里原先挂着仪表板（`class="sched-stats sched-stats--catalog upcoming__stats"`）。
           2026-10-02 会长：「在近期比赛的详情页不要显示这个 class=…upcoming__stats」→
           本页**不再渲染它**，本页顶部现在直接就是筛选 chips。
           仪表板改为「竞赛信息页那块看板」的专属（UpcomingBoard.vue 挂 components/ScheduleStats.vue）。
           ⚠ 组件脚本里的 `stats` computed **不能跟着删** —— 两行 chip 的计数与颜色就取自它
             （stats.byContest / stats.byPlatform），删了芯片会全空。 -->

      <!-- 筛选：**一整排**，中间那颗「全部」居中、右组贴右（会长 2026-10-02：
           「我希望现在把各按钮放到一行，这样排布：ICPC CCPC 传智杯 百度之星 线下 全部 线上 .....」，
           随后又定：「我希望『全部』居中、线上平台部分居右」）。
           结构 = **左组（线下赛事 chips +「线下赛」开关）｜「全部」｜右组（「线上赛」开关 + 平台 chips）**。
           左右两组都吃 `flex: 1 1 0`（**等宽**，与各自内容多少无关），中间那颗才落在整排正中；
           右组靠 `justify-content: flex-end` 贴右。⚠ 两组**恒渲染**（哪怕某组一颗 chip 都没有）——
           少渲染一个，中间那颗就会偏；两组各自 flex-wrap，窄屏先各自折行、不会溢出。

           三颗开关是**关联式选中**：自己不存状态，亮不亮由「它管的那组标签是不是全勾上」推出来
           （脚本的 allOn / contestsOn / platformsOn，判据在 scheduleView 的 groupChecked）；
           点一下 = 整组反转，**空组恒不亮**。默认**全勾**：状态存的仍是「被取消勾选的键」
           （见脚本的 excluded）。每颗 chip 都带该赛事/平台的 logo：线下那颗的选中色取该赛事
           **最常见的类型色**（线上统一 --cat-online）—— 与行左边框同源，一眼能对回大事记那套颜色。 -->
      <div v-if="contestChips.length || platformChips.length" class="upcoming__filters">
        <div class="upcoming__cat-row">
          <!-- 左组：线下赛事 -->
          <div class="upcoming__cat-group upcoming__cat-group--offline">
            <button
              v-for="c in contestChips"
              :key="c.key"
              type="button"
              class="upcoming__cat"
              :class="{ active: !excluded.has(c.key) }"
              :aria-pressed="!excluded.has(c.key)"
              :style="categoryVars(c.cat)"
              @click="toggleCat(c.key)"
            >
              <img v-if="c.image" :src="c.image" alt="" class="upcoming__cat-logo" />
              <span class="upcoming__cat-text">{{ c.label }}</span>
              <span class="upcoming__cat-count">{{ c.count }}</span>
            </button>
            <button
              v-if="contestChips.length"
              class="upcoming__cat upcoming__cat--group"
              type="button"
              :class="{ active: contestsOn }"
              :aria-pressed="contestsOn"
              title="线下赛那几个标签：全勾上时亮，点一下全勾 / 全撤"
              aria-label="线下赛"
              @click="toggleContests"
            >
              线下赛
            </button>
          </div>

          <!-- 正中那颗：管两边一起 -->
          <button
            class="upcoming__cat upcoming__cat--all"
            type="button"
            :class="{ active: allOn }"
            :aria-pressed="allOn"
            title="全部标签（线下赛 + 线上赛）：亮着点一下全撤，不亮点一下全勾"
            aria-label="全部标签"
            @click="toggleAll"
          >
            <i class="fas fa-check-double"></i>全部
          </button>

          <!-- 右组：线上平台 -->
          <div class="upcoming__cat-group upcoming__cat-group--online">
            <button
              v-if="platformChips.length"
              class="upcoming__cat upcoming__cat--group"
              type="button"
              :class="{ active: platformsOn }"
              :aria-pressed="platformsOn"
              title="线上赛那几个标签：全勾上时亮，点一下全勾 / 全撤"
              aria-label="线上赛"
              @click="togglePlatforms"
            >
              线上赛
            </button>
            <button
              v-for="p in platformChips"
              :key="p.key"
              type="button"
              class="upcoming__cat"
              :class="{ active: !excluded.has(p.key) }"
              :aria-pressed="!excluded.has(p.key)"
              :style="categoryVars('online')"
              @click="toggleCat(p.key)"
            >
              <img v-if="p.image" :src="p.image" alt="" class="upcoming__cat-logo" />
              <span class="upcoming__cat-text">{{ p.label }}</span>
              <span class="upcoming__cat-count">{{ p.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 一场一行，按月份分组。主表与线上赛已经合流：靠左边框的颜色与角标区分，
           不再有「折叠起来的那一块」。
           ⚠ 两处 <TransitionGroup> 是会长 2026-10-02 要的「筛选时行别瞬间消失 / 出现」：
              外层管**月份分组**（整月被筛掉时整块淡出，否则行还没淡完它就先没了），
              内层管行本身。
           ⚠ 过渡名 upcoming-fade 的时长与曲线**照抄站内已有的 .nested-fade**
             （`src/styles/base.css:169`：opacity 0.2s ease）—— 站内没有列表过渡的先例，
              但路由嵌套过渡有，就按那一套来，不另造一条曲线。
           ⚠ **每一行各自** v-reveal（整块入场在这张 4000px 长的表里只有 1 个入场元素，往下滚就没动画了）；
           逐条出现的错位走入场动画的 animation-delay（见脚本 rowStyle 的注释，别用 transition-delay）。 -->
      <TransitionGroup name="upcoming-fade" tag="div" class="upcoming__months">
      <div v-for="g in groups" :key="g.key" class="upcoming__month">
        <h3 class="upcoming__month-label">{{ g.label }}</h3>
        <TransitionGroup name="upcoming-fade" tag="ul" class="upcoming__list" :duration="{ enter: 200, leave: 300 }">
          <li
            v-for="(row, i) in g.rows"
            :key="`${row.contest}-${row.startKey}-${row.title}`"
            v-reveal="'fade-up'"
            class="upcoming__row"
            :class="`is-${row.status}`"
            :style="rowStyle(row, i)"
            :title="row.note || ''"
          >
            <!-- logo 在最前面，且是最大的那个元素 -->
            <span class="upcoming__logo-slot">
              <img v-if="logoOf(row)" :src="logoOf(row)" :alt="nameOf(row)" />
              <em v-else>{{ initialOf(row) }}</em>
            </span>

            <span class="upcoming__when">
              <b>{{ row.dateText }}</b>
              <em>{{ row.weekday }}</em>
            </span>

            <span class="upcoming__main">
              <a
                v-if="row.link"
                class="upcoming__title"
                :href="row.link"
                target="_blank"
                rel="noopener noreferrer"
                >{{ row.title }}</a
              >
              <span v-else class="upcoming__title">{{ row.title }}</span>
              <span class="upcoming__meta">
                <em v-if="row.stage" class="upcoming__chip">{{ row.stage }}</em>
                <em v-if="row.time">{{ row.time }}</em>
                <em v-if="row.place">{{ row.place }}</em>
                <em v-if="row.deadline" class="upcoming__chip">报名截止 {{ row.deadline.slice(5) }}</em>
                <em v-if="row.tentative" class="upcoming__chip upcoming__chip--tentative">暂定</em>
                <em v-if="row.origin === 'auto'" class="upcoming__chip upcoming__chip--auto">自动同步</em>
              </span>
            </span>

            <span class="upcoming__status">{{ row.statusLabel }}</span>
          </li>
        </TransitionGroup>
      </div>
      </TransitionGroup>

      <!-- 类型全被取消勾选：给一句能照着做的提示，而不是留一张白表（同样淡入） -->
      <Transition name="upcoming-fade">
        <p v-if="noneChecked" class="upcoming__empty">
          <i class="fas fa-filter"></i> 类型都取消勾选了 —— 点上面的「全部」把标签勾回来
        </p>
      </Transition>

      <!-- 时间待定：只写了「几月初」的场次单独摆，**不硬编日期** -->
      <div v-if="view.pending.length" class="upcoming__pending">
        <h3 class="upcoming__month-label"><i class="fas fa-clock"></i> 时间待定</h3>
        <ul>
          <li v-for="(p, i) in view.pending" :key="`${p.contest}-${i}`" :style="categoryVars(p.category)">
            <a v-if="p.link" :href="p.link" target="_blank" rel="noopener noreferrer">{{ p.title }}</a>
            <span v-else>{{ p.title }}</span>
            <em v-if="p.when">{{ p.when }}</em>
          </li>
        </ul>
      </div>

      <!-- 页脚：只说「筛掉了几场」「收起了几场」「哪个源没同步上」。
           ⚠ 场次统计（total / month / next / signup / 一格一赛事 / 一格一平台）的**口径仍在**
             scheduleView 的 scheduleStats()，但本页 2026-10-02 起不再渲染仪表板
             （会长：「在近期比赛的详情页不要显示这个 class=…upcoming__stats」）——
             它现在只在竞赛信息页那块看板上出现。 -->
      <p v-if="footParts.length" class="upcoming__foot">{{ footParts.join(' · ') }}</p>
      <p v-else-if="!view.rows.length && !view.pending.length" class="upcoming__foot">
        暂无已公布的近期赛程 —— 官网发布后会自动出现在这里
      </p>
    </template>
  </section>
</template>

<style scoped>
/* ==========================================================================
   近期赛事时间安排表
   ========================================================================== */
.upcoming {
  /* 2026-10-02 起组件不再自带表头（独立页的 hero 承担标题），故不再是 56px ——
     留一点间距让数字条与 hero 说明行分得开即可 */
  margin-top: 32px;
}

/* ── 入场与筛选过渡 ──
   入场的**基座**在 `src/styles/base.css:136-154` 的 [data-reveal] 段（变体 fade-up、opacity/transform
   各 0.7s ease、错位延迟 calc(var(--reveal-index) * 0.1s)），本组件只补它在这张表上覆盖不到的两件：
   ① 淡入（行的 transition 简写压过 [data-reveal]，实测见 `.upcoming__row` 那条规则上的说明）；
   ② 错位（那条 transition-delay 同样被压掉 → 改用**动画延迟**，见脚本 rowStyle 的推导）。

   会长 2026-10-02 第三轮：「我希望仍然有逐一出现的动画，并且有卡片离开时，下方的卡片应该向上运动
   到最终位置」—— 前半句 = `@keyframes upcoming-row-in` 的 animation-delay（下面）；
   后半句 = 本段末尾的 `.upcoming-fade-move`（Vue TransitionGroup 的 FLIP）。
   ⚠ 这里曾有一条 `.upcoming__body { … }`（整块入场的挂点）：会长说「**现在怎么什么动画都没了**」
     —— 整块入场在这张 4000px 长的表里**只有 1 个入场元素**，加载那一瞬淡完、往下滚就再没有动画了。
     故把入场还给每一行，wrapper 与那条规则一起删。
   ⚠ 原先还有一条 `.upcoming__stats { margin-bottom: var(--space-lg) }` —— 仪表板从本页撤掉后它也没有主人了。 */
@keyframes upcoming-row-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
/* 行入场：`backwards` 必写 —— 延迟期间要保持 from 那一帧，否则行会先亮一下再从头发动画。
   ⚠ 用 animation 而不是 transition：transition-delay 会把悬停上浮一起延迟（脚本 rowStyle 有推导）；
     animation 只在入场这一瞬间接管 transform/opacity，跑完交还给 `transition`（悬停弹簧照旧）。 */
.upcoming__row.is-visible {
  animation: upcoming-row-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--reveal-index, 0) * 0.1s);
}

/* 被筛掉的行：淡出 + **把自己的盒收成 0 高**，于是下面的行**每一帧**跟着上移 —— 这就是会长
   2026-10-02 第三轮要的「有卡片离开时，下方的卡片应该向上运动到最终位置」。
   ⚠ 为什么不用 `TransitionGroup` 的 `-move`（FLIP）让下面滑上来：**实测它根本不触发**
     （探针 `node_modules/.cache/schedule-probe/anim2-check.mjs`）：leave 期间离开的行仍然占位，
     而 Vue 只在**数据变更那次渲染**比对位置、DOM 移除却发生在 leave 结束的回调里 → 全程
     0 个 `-move` 类、下方行的 top 一动不动（`746 → 746`）。腾位那套（给离开行
     `position: absolute`）在网格单列里会让它自己跳位，故不采用。
   ✅ 本做法不需要 FLIP：离开行一直在文档流里，只是盒在缩小。
   ⚠ `max-height` 要有个**可过渡的起点**，故基类 `.upcoming__row` 上给了 200px、≤576px 断点里给 260px
     —— 它必须比该布局下**最高的一行**还高（否则正常状态就被 max-height 裁到），但又不能太离谱：
     可过渡区间里真正在缩的只有「上限 − 实际行高」那一段，上限太大就成了「先僵住、再掉下来」。
     实测行高（探针 `anim2-check.mjs`，2026-10-02）：1400px → 122、900px → 122、520px → 最高 160
     —— 520 那个 160 恰好等于当时的上限（160），说明窄屏行被裁住了，故该断点单独放宽到 260。 */
.upcoming__row.upcoming-fade-enter-active,
.upcoming__month.upcoming-fade-enter-active,
.upcoming__month.upcoming-fade-leave-active {
  transition: opacity 0.2s ease;
}
.upcoming__row.upcoming-fade-leave-active {
  overflow: hidden;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-top-width: 0;
  border-bottom-width: 0;
  transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.18s ease;
}
.upcoming__row.upcoming-fade-enter-from,
.upcoming__row.upcoming-fade-leave-to,
.upcoming__month.upcoming-fade-enter-from,
.upcoming__month.upcoming-fade-leave-to {
  opacity: 0;
}
/* 被筛掉的行被移除后，**下面的行/分组滑到最终位置** —— Vue 的 TransitionGroup 给位置变了的元素
   加 `-move` 类并做 FLIP（先按旧位置画、再过渡回新位置）。行自己那条 transition 里已经有
   transform（站内弹簧 0.4s）且特异性更高，故行用的是弹簧曲线；这条规则管的是**月份分组**
   （它自身没有 transition），以及给这条 FLIP 一个兜底口径。 */
.upcoming-fade-move {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
/* ⚠ 原先这里有一组 .upcoming__head / .upcoming__label / .upcoming__desc ——
   2026-10-02 会长要求取消（与独立页 hero 重复），模板里那块也一起删了。
   另：更早还有一条 .upcoming__stamp（右上角「数据更新：手写 X月X日 · 官网自动同步 …」），
   同日一并去掉；数据字段没动（schedule.json 的 updated / 自动层的 generated_at 照旧在）。 */

/* ── 筛选 chips（一整排：线下 chips ｜ 线下赛 / 全部 / 线上赛 ｜ 线上 chips） ──
   视觉与大事记侧栏的 .cat-chip 一致；颜色走 tokens 的 --cat-*，
   故两页同一个类型是同一种颜色（会长 2026-10-02：「颜色参考大事记」）。 */
.upcoming__filters {
  display: grid; /* 只有一排了；留着 grid 是为了「以后要再加一行」时不必改这里 */
  gap: 8px;
  margin-bottom: var(--space-md);
}
.upcoming__cat-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
/* ── 左右两组：**等宽**才会让中间那颗「全部」落在正中（会长 2026-10-02：「我希望『全部』居中、
   线上平台部分居右」）────────────────────────────────────────────────────────
   `flex: 1 1 0` 的 basis 是 0、两份 grow 相同 → 两组拿到的宽度**恰好相等**（= (整排 − 全部 − 间距) / 2），
   与各自装了几颗 chip 无关 —— 这正是不用 `margin: auto` 的原因：auto 边距分掉的是空白，
   中间那颗的位置会被「左组宽 − 右组宽」带偏（实测左组 490px、右组 408px，能偏 41px）。
   两组各自 flex-wrap：窄屏先各自折行（min-content 只有一颗 chip 那么宽），不会溢出、也不会把中间那颗挤走。
   ⚠ 两个组容器**恒渲染**（哪怕组里空的）—— 少一个，中间那颗就跑到端头去了。 */
.upcoming__cat-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: 1 1 0;
}
.upcoming__cat-group--offline {
  justify-content: flex-start;
}
.upcoming__cat-group--online {
  justify-content: flex-end; /* 线上平台部分贴右 */
}
/* 「线下赛」开关跟在左组 chip 后面、「线上赛」开关领着右组 chip —— 各留一点间距，
   免得被看成「又一个赛事 / 平台」。⚠ 别用 `margin-left: auto`：那会把整组推开、整排不居左
   （会长 2026-10-02 提过「我希望两个行都应该居左」，当时就是这么踩的）。 */
.upcoming__cat-group--offline .upcoming__cat--group {
  margin-left: 4px;
}
.upcoming__cat-group--online .upcoming__cat--group {
  margin-right: 4px;
}
/* 一行放不下时两组的「等宽 + 贴右」已经没有意义 —— 那时「全部」本来就挤不到正中，硬撑只会得到
   「左组折两行 + 全部孤零零占一行 + 右组最后一个词又掉到第三行」（实测 1024 宽：牛客独自一行）。
   改用 display: contents 让两组的子元素**直接参与整排的排布**，于是退回单流折行；
   顺序不变（线下 chips → 线下赛 → 全部 → 线上赛 → 线上 chips）。

   1340 这个数是**量出来的，不是拍的**（探针 `switch-width.mjs`，2026-10-02 三颗开关加宽到 96px 之后）：
     · 整排内容 = Σchip 宽 + 9×6px 间距 = **1059px**（十颗：4 个赛事 + 3 个平台 + 3 颗开关）
     · 容器宽 = 0.9 × 视口 − 53，**封顶 1360**（视口 ≥1570 之后不再变宽）
     · 「内容装得进」只要求视口 ≥1236，但**真实排版要更宽**：两组等宽时左组只分到
       (可用 − 96 − 12)/2，得装下它那 512px 才不折行 → 实测**视口 ≥1330 才真的是一行**
       （1240~1320 会掉进上面那种三行怪相，探针在那些宽度上量到 `行数 3`）。
   断点取 1340 = 实测阈值 1330 再留 10px 余量（字体渲染差一两像素时不至于漏进来）。 */
@media (max-width: 1340px) {
  .upcoming__cat-group {
    display: contents;
  }
}
/* 原先每行行首有一枚纯文本标签（「线下赛事」「线上平台」）—— 2026-10-02 第三版删掉，
   由同名开关代替（会长：「两个 upcoming__cat-row 最前面的纯文本……都要删除」）；
   第四版整排并成一行后，那两颗开关落在两拨 chip **中间**（见上面 `margin: 0 3px` 那条）。 */
.upcoming__cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  /* ── 胶囊与 logo 的「圆角匹配」（会长 2026-10-02：「圆形 logo 组件与胶囊圆角匹配」）──
     判据就是同心圆角那一条：**内圆角 = 外圆角 − 圆环宽度**。
     外圆角由 `--radius-full` 定，浏览器把它夹到短边的一半（= height/2）；圆环 = 1px 边框
     + 1px 内边距 = 2px。于是白圆当且仅当**比胶囊矮 2×2px** 时两个曲率才一路：
       height = 30(--cat-logo) + 2(内边距) + 2(边框) = 34  → 外圆角 17px
       内圆角应 = 17 − 2 = 15px，而白圆 30px 的 --radius-full 恰好 = 15px ✓
     圆心也重合：白圆中心 x = 1(边框) + 1(内边距) + 15 = 17px = height/2 ✓
     ⚠ 这三个数（--cat-logo / 内边距 / 边框）是**一组**，改 --cat-logo 一处即可推导其余；
       文字型开关没有白圆，靠 min-height 追平，否则一排 chip 高矮不齐（原先 31 与 32 就差 1px）。 */
  --cat-logo: 30px; /* 26px 真图 + 2×2px 白边（见 .upcoming__cat-logo） */
  padding: 1px 11px 1px 1px; /* 左边只留 1px：白圆贴住端头，圆环宽度才处处相等 */
  min-height: calc(var(--cat-logo) + 4px); /* 34px = 白圆 30 + 内边距 1×2 + 边框 1×2 */
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-full);
  background: #fff;
  font: inherit;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
  /* 四个属性与大事记的 .cat-chip 逐字同源（`src/views/AllActionView.vue:533-537`）——
     ⚠ 别漏 box-shadow：选中态那条 `0 2px 10px rgba(0,0,0,.12)` 不参与过渡就会「啪」地跳出来。 */
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}
.upcoming__cat:hover {
  border-color: var(--cat, var(--primary));
}
.upcoming__cat.active {
  border-color: var(--cat, var(--primary));
  background: var(--cat, var(--primary));
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}
/* 三颗**范围开关**（全部 / 线下赛 / 线上赛）：与 chip 同形，但颜色统一走 --primary、
   未选中就带主色，与「某个赛事 / 某个平台」的 chip 一眼可分；选中态是**关联式**的 ——
   它管的那组标签全勾上才亮（脚本的 allOn / contestsOn / platformsOn），亮着时由下面
   那条 .upcoming__cat.active 填成主色实心（--cat 已在上一行改成 var(--primary)）。
   ⚠ 2026-10-02 第三版改的：这一版之前它们是虚线边框的「动作按钮」、**永远不高亮**。 */
.upcoming__cat--all,
.upcoming__cat--group {
  --cat: var(--primary);
  /* 没有 logo，左右都该留 11px（带 logo 的 chip 左边只留 1px 给白圆贴边）；
     上下仍是 1px，高度由 .upcoming__cat 的 min-height 追平到与带 logo 的一致。 */
  padding: 1px 11px;
  /* 会长 2026-10-02：「我希望『线下赛』『线上赛』『全部』的按钮都宽一些」——
     三颗范围开关给一个**下限宽度**（≈ 最小的那颗 chip「牛客」的宽度）+ 文字居中，
     免得它们比旁边的 chip 明显短一截。是**下限**不是定宽：将来文案变长仍撑得开。
     ⚠ 加宽会让整排变长 —— 1280 宽时这排本来就是满的（内容 1099px ≈ 可用 1099px），
       所以下面那条窄屏兜底的断点跟着往上挪（取值是量出来的，见 @media 那段注释）。 */
  min-width: 96px;
  justify-content: center; /* 有了下限宽度，字得居中（默认 flex-start 会靠左） */
  /* ⚠ 这里原先是 `margin: 0 3px`（第四版把三颗开关当成挤在两拨 chip 中间的一小簇）。
     2026-10-02 第五版改成「左右两组等宽、中间那颗居中」后，位置由**结构**决定
     （`.upcoming__cat-group` 的 flex: 1 1 0 + 中间那颗自己不伸缩），
     两颗组开关的间距也挪到了组作用域里（见 `.upcoming__cat-group--offline/--online .upcoming__cat--group`）。 */
  border-color: rgba(26, 115, 232, 0.28);
  color: var(--primary);
  font-weight: 600;
}
/* ⚠ 悬停**不许**盖掉选中态（会长 2026-10-02：「悬停在高亮的『全部』『线上』『线下』
   按钮上时，文本会看不见」）。成因是纯 CSS 的：这条 hover 与 `.upcoming__cat.active`
   特异性**完全相同**（都是两个类选择器），谁赢只看源序 —— 这条在后面，于是选中时一悬停
   就把实底冲成近乎白的 `rgba(26,115,232,.06)`，而 `color:#fff` 留着不动，
   **白字落在白底上**。所以分两半写：未选中的给浅蓝底，选中的给一档更深的主色
   （`--primary-dark`: #0d47a1），既有悬停反馈又不丢对比度。
   改这里之前先想一遍特异性：`--all/--group` 单类 (0,1,0) 永远输给 `.active` (0,2,0)。 */
.upcoming__cat--all:not(.active):hover,
.upcoming__cat--group:not(.active):hover {
  border-color: var(--primary);
  background: rgba(26, 115, 232, 0.06);
}
.upcoming__cat--all.active:hover,
.upcoming__cat--group.active:hover {
  border-color: var(--primary-dark);
  background: var(--primary-dark);
}
.upcoming__cat--all i {
  font-size: 0.7rem;
}
/* ⚠ 这里原先是 `.upcoming__cat--group { margin-right: 4px }` —— 第三版「线下赛 / 线上赛」
   吊在**行首**时，靠它与被它管的那串 chip 拉开。2026-10-02 第四版整排并成一行后，
   两颗开关挪到了两拨 chip 中间、左右各留边距（见上面那条 `margin: 0 3px`），故删掉。 */
/* chip 上的 logo（会长 2026-10-02：「并且要显示 logo」；同日又补「圆形 logo 组件与胶囊
   圆角匹配」）。白圆底的两个作用没变：勾选后整颗 chip 变成实色，logo 直接压在上面会糊；
   白底常在（不勾选时在白 chip 上看不出来），于是切换勾选不会让 chip 的宽度跳一下。
   ⚠ 尺寸与圆角**由 .upcoming__cat 的 --cat-logo 推导**，不要写死数字：白圆总尺寸 =
   --cat-logo(30px)、圆角必须用 `var(--radius-full)`（与胶囊同一个令牌，浏览器各自夹到
   自身短边的一半 → 内外曲率同心）。原先这里是写死的 18px + `border-radius: 50%`，
   白圆半径只有 10px 而胶囊端头 16px —— 两个曲率不一路，会长一眼就看出来了。 */
.upcoming__cat-logo {
  width: calc(var(--cat-logo) - 4px); /* 26px = 总尺寸 30 − 白边 2×2 */
  height: calc(var(--cat-logo) - 4px);
  padding: 2px;
  box-sizing: content-box;
  border-radius: var(--radius-full);
  background: #fff;
  object-fit: contain;
  flex: none;
}
/* 没图标的那几颗（协会自办 / 校赛…）只有文字，别让长名字把 chip 撑成两行 */
.upcoming__cat-text {
  white-space: nowrap;
}
.upcoming__cat-count {
  font-size: 0.68rem;
  opacity: 0.75;
}

/* ── 骨架屏（全局 .skeleton 提供底色与微光） ── */
.upcoming__skeleton {
  display: grid;
  gap: var(--space-sm);
}
.upcoming__skeleton .skeleton {
  height: 122px; /* 与一行（含 96px logo）的实际高度对齐 */
  border-radius: var(--radius-md);
}

/* ── 月份分组 ── */
.upcoming__month {
  margin-bottom: var(--space-md);
}
.upcoming__month-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-light);
  letter-spacing: 1px;
}
.upcoming__month-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.08), transparent);
}

/* ── 一场一行 ──
   四列：logo ｜ 日期 ｜ 主体 ｜ 状态。
   **左边框 = 比赛类型**（会长 2026-10-02 的第 4 条），色值来自 tokens 的 --cat-*
   （由 categoryVars() 写在行的 style 上）；状态那件事交给右边的状态胶囊与行底色，
   两件事不再抢同一个左边框。 */
.upcoming__list {
  display: grid;
  gap: 6px;
  list-style: none;
}
.upcoming__row {
  --status-color: var(--text-muted);
  display: grid;
  grid-template-columns: 96px 132px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-md);
  padding: 12px var(--space-md) 12px 14px;
  /* 只是给「离开时收成 0 高」那条过渡一个起点（见 .upcoming__row.upcoming-fade-leave-active）：
     比桌面行高（122px）高一截，正常状态不生效；≤576px 那种堆叠布局另给了更大的上限。别拿它当普通样式改小。 */
  max-height: 200px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-left: 4px solid var(--cat, #b0bec5);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  /* 悬停手感**照抄大事记卡片**（会长 2026-10-02：动画风格要与站内其他功能统一）：
     与 `src/views/AllActionView.vue:870-879` 的 .tl-card 逐条同源 —— transform 走
     var(--transition-spring)（站内所有「抬起来」的卡片都用这条弹簧曲线）、抬 3px、
     投影换成主色调的 0 10px 32px rgba(26,115,232,.07)。
     ⚠ 原先这里是 `transform var(--transition)` + 抬 2px + 中性投影 var(--shadow-md)：
       曲线是线性缓动、投影是灰的，抬起来「发死」，与大事记 / 竞赛卡 / 看板不是一路手感。

     ⚠ `opacity` 必须写进这条简写里（浏览器实测，2026-10-02）：它与 base.css 的
       `[data-reveal] { transition: opacity .7s ease, transform .7s ease }` 直接冲突，
       而 `.upcoming__row[data-v-*]`（0,2,0）**特异性高于** `[data-reveal]`（0,1,0）→ 简写整体胜出；
       原先列表里没有 opacity ⇒ 入场的**淡入是瞬跳**（探针逐帧采样：opacity 一直 0、一帧跳到 1，
       只有 transform 在动 = 只见上滑不见淡入）。同一原因，`[data-reveal][style*="--reveal-index"]`
       那条错位延迟也被冲掉（实测行 `transitionDelay: 0s, 0s, 0s`）—— 故错位**不走 transition-delay**，
       改由入场动画的 `animation-delay` 实现（见脚本 rowStyle 与 CSS 的 @keyframes upcoming-row-in）。
       站内 `ExcellentView.vue:270` / `LinksView.vue:236,335` / `ContestView.vue:193` 的卡片是同一个写法
       （它们同样只有位移、没有淡入）；这里补上 opacity，是让 base.css 承诺的 `fade-up` 名副其实。 */
  transition: transform var(--transition-spring), box-shadow var(--transition),
    border-color var(--transition), opacity 0.7s ease;
}
.upcoming__row:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 32px rgba(26, 115, 232, 0.07);
  border-color: rgba(26, 115, 232, 0.15);
  border-left-color: var(--cat, #b0bec5); /* hover 不改类型色 */
}

/* 状态配色：一眼看出「哪几场要提前动手」。今天 / 进行中 = 主色实感；
   报名中 = 橙（真正会错过的那个日子）；7 天内 = 浅蓝；其余 = 中性。
   ⚠ 这里只上色「状态胶囊 + 行底色」，左边框留给类型。 */
.upcoming__row.is-today,
.upcoming__row.is-ongoing {
  --status-color: var(--primary);
  background: linear-gradient(90deg, rgba(26, 115, 232, 0.05), #fff 60%);
}
.upcoming__row.is-signup {
  --status-color: var(--accent);
  background: linear-gradient(90deg, rgba(255, 152, 0, 0.07), #fff 60%);
}
.upcoming__row.is-soon {
  --status-color: var(--primary-light);
}

/* ── 行首 logo（整行最前、最大的元素）──
   两个尺寸约束：
     · **96px 是像素上限** —— 会长给的 codeforces(101×89) 与牛客(98×98) 原图就这么大，
       再放只会被拉糊（AtCoder 那张 280×280 有余量）。宁可停在原生尺寸附近。
     · **不套边框/内边距/底色**（会长 2026-10-02：「logo 不要被半透明边框包裹」）——
       上一版那圈 `1px rgba(0,0,0,.06)` 在白卡片上像给每个 logo 加了道虚框。
   没有图标可用的赛事（睿抗 / 协会自办）由 <em> 首字母方块顶上：那才需要一块底色，
   故 --cat-soft 只上在 em 上，真 logo 一律透出卡片白底。 */
.upcoming__logo-slot {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
}
.upcoming__logo-slot img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.upcoming__logo-slot em {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
  background: var(--cat-soft, var(--bg-light));
  font-style: normal;
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--cat, var(--text-muted));
}

/* ── 日期列 ── */
.upcoming__when {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.upcoming__when b {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.upcoming__when em {
  font-size: var(--font-size-xs);
  font-style: normal;
  color: var(--text-muted);
}

/* ── 主体列 ── */
.upcoming__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  min-width: 0;
}
.upcoming__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text);
  transition: color var(--transition-fast);
}
a.upcoming__title:hover {
  color: var(--primary);
}
.upcoming__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  font-size: var(--font-size-xs);
  font-style: normal;
  color: var(--text-muted);
}
.upcoming__meta em {
  font-style: normal;
}
.upcoming__chip {
  padding: 1px 8px;
  border: 1px solid rgba(26, 115, 232, 0.16);
  border-radius: var(--radius-full);
  background: rgba(26, 115, 232, 0.07);
  color: var(--primary);
  white-space: nowrap;
}
/* 「暂定」用中性格（官网原话就是暂定，不冒充已确认）；「自动同步」用淡色，标明来源 */
.upcoming__chip--tentative {
  border-color: rgba(107, 114, 128, 0.35);
  background: transparent;
  color: var(--text-muted);
}
.upcoming__chip--auto {
  border-color: rgba(46, 125, 50, 0.25);
  background: rgba(46, 125, 50, 0.07);
  color: var(--honor-honor);
}

/* ── 状态列 ── */
.upcoming__status {
  padding: 4px 12px;
  border: 1px solid var(--status-color, var(--text-muted));
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--status-color, var(--text-muted));
  white-space: nowrap;
}
.upcoming__row.is-today .upcoming__status,
.upcoming__row.is-ongoing .upcoming__status {
  background: var(--primary);
  color: #fff;
}

/* ── 时间待定（同样按类型上色：左边框 + 类型色标题点） ── */
.upcoming__pending {
  margin-top: var(--space-md);
  padding: var(--space-md);
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  background: var(--bg-light);
}
.upcoming__pending ul {
  display: grid;
  gap: 8px;
  list-style: none;
}
.upcoming__pending li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  padding-left: 10px;
  border-left: 3px solid var(--cat, #b0bec5);
  font-size: var(--font-size-sm);
  color: var(--text-light);
}
.upcoming__pending a:hover {
  color: var(--primary);
}
.upcoming__pending em {
  font-style: normal;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ── 页脚：把「自动做了什么事」写出来，免得看起来像没人维护 ── */
.upcoming__foot {
  margin-top: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ── 「类型一个都没勾」的空态提示（表本身不渲染，别留白） ── */
.upcoming__empty {
  padding: var(--space-lg);
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  background: var(--bg-light);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
.upcoming__empty i {
  margin-right: 6px;
}

/* ── 响应式（断点按 tokens.css 约定的 576 / 768 两档） ── */
@media (max-width: 768px) {
  .upcoming__row {
    grid-template-columns: 72px 96px minmax(0, 1fr) auto;
    gap: var(--space-sm);
  }
  .upcoming__logo-slot {
    width: 72px;
    height: 72px;
  }
  .upcoming__logo-slot em {
    font-size: 1.8rem;
  }
  .upcoming__label {
    font-size: var(--font-size-xl);
  }
}
@media (max-width: 576px) {
  .upcoming__row {
    grid-template-columns: 64px minmax(0, 1fr) auto;
    grid-template-areas:
      'logo when status'
      'main main main';
    row-gap: 8px;
    /* 堆叠布局（main 独占一行）后行会变高：实测最高 160px，故这里把「离开时收成 0 高」的
       过渡起点放大到 260 —— 基类那 200px 会把它裁掉。改这里之前先看基类 max-height 上的注释。 */
    max-height: 260px;
  }
  .upcoming__logo-slot {
    grid-area: logo;
    width: 64px;
    height: 64px;
  }
  .upcoming__logo-slot em {
    font-size: 1.6rem;
  }
  .upcoming__when {
    grid-area: when;
    flex-direction: row;
    align-items: baseline;
    gap: 8px;
  }
  .upcoming__main {
    grid-area: main;
  }
  .upcoming__status {
    grid-area: status;
    align-self: start;
  }
}
</style>
