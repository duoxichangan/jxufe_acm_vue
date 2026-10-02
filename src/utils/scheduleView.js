/**
 * 近期赛事时间表 · 纯逻辑（竞赛信息页，2026-10-01 新增）
 * ---------------------------------------------------------------------------
 * 页面只负责画。「今天是哪天、哪些已经结束该消失、还剩几天、报名截止与开赛哪个更近」
 * 全部在这里算。之所以抽成纯函数：这套口径能在 `node --test` 里用**固定的 today**
 * 回归（见 test/schedule-view.test.mjs）—— 组件里写死 `new Date()` 就没法测，
 * 而「月末 / 跨年 / 时区」恰恰是这类表格最容易错的地方。
 *
 * 两条来源合成一张表（2026-10-01 定）：
 *   · public/data/schedule.json      手写真源，**会长说了算**（入库、进 git）
 *   · public/data/schedule.auto.json 生成物，scripts/gen_schedule.mjs 从各赛事公开接口抓
 *                                    （gitignore，抓不到就没有这一份，页面照常）
 * 合并规则：**手写优先**，自动层只补手写没有的场次 —— 手写那条可能是会长刚跟官方
 * 确认过的最新日期，自动层抓到的旧公告不该盖掉它（判重键见 eventKey）。
 *
 * ⚠ 时区：站点面向东八区，日期一律按**本地日历日**算。
 *   · `new Date('2026-10-01')` 被当成 UTC 午夜解析 —— 在 UTC-x 的时区里会退回 09-30；
 *   · `toISOString().slice(0, 10)` 在东八区的 00:00~08:00 之间会把「今天」写成昨天。
 * 所以本文件只走 parseDate / toKey 这对函数做「字符串 ↔ 本地日」的转换，全程不碰 toISOString。
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 'YYYY-MM-DD' → 当天 00:00 的**本地** Date；格式或日历上不合法则返回 null（调用方跳过它）。 */
export function parseDate(s) {
  if (typeof s !== 'string') return null
  const m = DATE_RE.exec(s.trim())
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(y, mo - 1, d)
  // 反查一遍：'2026-02-30' 会被 Date 静默滚成 03-02，这种脏数据必须当无效
  const ok = date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
  return ok ? date : null
}

/** Date → 'YYYY-MM-DD'（**本地**日历日；刻意不用 toISOString，见文件头）。 */
export function toKey(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** 今天 00:00（本地）。测试里传固定的 now，页面里不传。 */
export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** 整天差 to - from（两边都按 00:00 计，故 round 掉夏令时那种 ±1 小时的零头）。 */
export function dayDiff(from, to) {
  return Math.round((to - from) / 86400000)
}

/** '周四' */
export function weekdayOf(date) {
  return WEEKDAYS[date.getDay()]
}

/**
 * 日期区间的展示文本。同日不重复写日期；跨月补月、跨年补年；
 * **不是今年**的一律带上年份（表里会有明年的省赛 / 国赛，不写年份会被当成今年）。
 */
export function formatRange(start, end, today = startOfToday()) {
  const s = parseDate(start)
  if (!s) return ''
  const e = parseDate(end) || s
  const sameDay = e.getTime() === s.getTime()
  const crossYear = s.getFullYear() !== e.getFullYear()
  const withYear = s.getFullYear() !== today.getFullYear() || crossYear
  const head = `${withYear ? s.getFullYear() + '年' : ''}${s.getMonth() + 1}月${s.getDate()}日`
  if (sameDay) return head
  const sameMonth = !crossYear && s.getMonth() === e.getMonth()
  const tail = sameMonth ? '' : `${crossYear ? e.getFullYear() + '年' : ''}${e.getMonth() + 1}月`
  return `${head}—${tail}${e.getDate()}日`
}

/**
 * 判重键：同一赛事的同一天 = 同一场（手写与自动撞车时用它）。
 * ⚠ 只用 contest + start，**不要**把 stage 并进来 —— CCPC / ICPC 一年有多个分站赛，
 * 阶段词相同而日期不同是正常的（桂林站 / 哈尔滨站 / …），并进来会把它们误判成一场。
 */
export function eventKey(item) {
  return `${item?.contest || ''}|${item?.start || ''}`
}

/**
 * 合并两份来源，**手写优先**：先放手写，自动层再补；同一 eventKey 只留先来的那条。
 * 没有合法 start 的条目直接丢掉（它是脏数据，scripts/check_awards.mjs 会先报出来）。
 *
 * 已知残留：手写与自动对**同一场**给出的日期若不相同（比如官方把网络赛推迟了一周），
 * 两条都会进表 —— 这里刻意不猜、不合并。生成器 scripts/gen_schedule.mjs 会在
 * 这种情况下打一条 warn（「同一赛事 21 天内两个日期，请人工核对」），把判断交回给人。
 */
export function mergeSchedule(manualItems = [], autoItems = []) {
  const out = []
  const seen = new Set()
  const push = (item, origin) => {
    if (!item || !parseDate(item.start)) return
    const key = eventKey(item)
    if (seen.has(key)) return
    seen.add(key)
    out.push({ ...item, origin })
  }
  for (const it of manualItems || []) push(it, 'manual')
  for (const it of autoItems || []) push(it, 'auto')
  return out
}

/**
 * 单条的状态。key 供 CSS 上色，label 直接给人看。
 *   today   今天开始        ongoing 进行中          signup 报名中还剩 N 天
 *   soon    还有 N 天（≤7）  later   N 天后（>7）      past   已结束（表里会被收起）
 */
export function statusOf(item, today = startOfToday()) {
  const s = parseDate(item?.start)
  if (!s) return { key: 'invalid', label: '', days: null, urgent: false }
  const e = parseDate(item.end) || s
  const toStart = dayDiff(today, s)
  const toEnd = dayDiff(today, e)

  if (toEnd < 0) return { key: 'past', label: '已结束', days: toEnd, urgent: false }
  if (toStart <= 0) {
    if (toEnd === 0) return { key: 'today', label: '今天', days: 0, urgent: true }
    return { key: 'ongoing', label: '进行中', days: 0, urgent: true }
  }
  // 报名截止比开赛更近时，先提醒截止 —— 学生真正会错过的是这个日子。
  // 用 `<=`：睿抗那种「只公布报名窗口」的场次，deadline 与 start 是同一天，
  // 「报名还剩 N 天」才是这时该说的话（写成「还有 N 天」会让人以为是比赛日）。
  const dl = parseDate(item.deadline)
  if (dl) {
    const toDl = dayDiff(today, dl)
    if (toDl >= 0 && toDl <= toStart) {
      return {
        key: 'signup',
        label: toDl === 0 ? '今天报名截止' : `报名还剩 ${toDl} 天`,
        days: toDl,
        urgent: toDl <= 3,
      }
    }
  }
  const soon = toStart <= 7
  return { key: soon ? 'soon' : 'later', label: `还有 ${toStart} 天`, days: toStart, urgent: soon }
}

/* ==========================================================================
   赛事类型（2026-10-02 会长：「条目要使用左边框指示比赛类型，颜色参考大事记」，
   并给整张表加一个类型筛选）
   --------------------------------------------------------------------------
   配色**不在这里**：色值在 src/styles/tokens.css 的 `--cat-*`，大事记卡片与这张表共用
   一份（本模块只负责「一场比赛 → 一个类型键」的判定，键名与大事记数据的 category
   字段同名同义。大事记的中文名见 views/AllActionView.vue 的 CAT_LABEL，两处顺序一致）。
   判据刻意对齐大事记的既有归类，几条容易写反的：
     · CCPC女生专场                → reg（⚠ 会长 2026-10-02：「xcpc女赛并入全国赛那类」，原先是 inv。
                                        大事记**数据**里 CCPC女生专场 仍归 inv —— 这是有意的一处不一致，
                                        要拉平得改 public/data/events/*.json 的 category，别只改这边）
     · 全国邀请赛（南昌）暨江西省赛   → inv（「暨xx省赛」不因此整条变成 prov）
     · 独立的 xx省赛                → prov（大事记里 prov 下只有广东省赛 / 河南省赛这类）
     · 网络赛 / 网络预选赛           → net
   ========================================================================== */

/** chips 的展示顺序（先 xCPC 的各档，再其他系列，最后兜底；与大事记的次序同构） */
export const CATEGORY_ORDER = [
  'inv', 'reg', 'prov', 'net', 'final',
  'tts', 'lanqiao', 'chuanzhi', 'baidu', 'raicom',
  'school', 'club', 'online', 'other',
]

export const CATEGORY_LABELS = {
  inv: '邀请赛',
  reg: '区域赛·全国赛',
  prov: '省赛·区赛',
  net: '网络赛',
  final: '总决赛',
  tts: '天梯赛',
  lanqiao: '蓝桥杯',
  chuanzhi: '传智杯',
  baidu: '百度之星',
  raicom: '睿抗',
  school: '校赛',
  club: '社团活动',
  online: '线上赛',
  other: '其他',
}

/**
 * 筛选 chips 的两组顺序（2026-10-02 会长：「类型可以分的更开，线上赛要分平台，
 * 然后线下赛要分赛事」）——**线下按赛事、线上按平台**，两组各一个顺序表：
 *   线下 = ICPC / CCPC 在最前（我们真正要提前准备的就是这两项），其余按「系列 vs 自办」排；
 *   线上 = 平台。
 * 没写进表里的 slug 不会被丢掉：调用方按**首次出现的日期先后**兜在末尾（新赛事自动进得来）。
 */
export const CONTEST_ORDER = ['icpc', 'ccpc', 'gplt', 'lanqiao', 'chuanzhi', 'baidu', 'club', 'school']
export const PLATFORM_ORDER = ['codeforces', 'atcoder', 'nowcoder', 'luogu']

/**
 * slug → 兜底名字：competitions.json / platforms.json 里**没有条目**的 slug（协会自办、校赛…）。
 * 有图标的那几个赛事名字与 logo 都取自上面的表格（`buildIconIndex`），这里只管「没图标的」——
 * 它们在这份表里拿不到名字时退化成 slug 本身，而「club」这种 slug 直接摆在 chips 上没人看得懂。
 */
export const CONTEST_LABELS = { club: '协会自办', school: '校赛', luogu: '洛谷', other: '其他' }

/**
 * 线上赛：这几个 slug 的类型恒为「线上赛」，**不看标题** ——
 * 它们不是本站要去参加的赛事，而是赛程的来源平台（会长 2026-10-02 把牛客的日历也接了进来）。
 * luogu 留着是历史原因（它的 `?_contentOnly=1` 已失效、目前抓不到），一旦恢复抓取，类型判断不用再改。
 */
const ONLINE_CONTESTS = new Set(['codeforces', 'atcoder', 'luogu', 'nowcoder'])

/** 赛事 slug 直接决定类型的那些（与大事记里 lanqiao / baidu / tts 的粒度相同）。 */
const CATEGORY_OF_CONTEST = {
  gplt: 'tts',
  lanqiao: 'lanqiao',
  chuanzhi: 'chuanzhi',
  baidu: 'baidu',
  raicom: 'raicom',
  school: 'school',
  club: 'club',
}

/**
 * **不展示**的赛事（会长 2026-10-02：「去除睿抗的 filter，并且最近赛时里也不显示睿抗的比赛」）。
 * 睿抗在工作区里本来就没有任何获奖或参赛记录（见工作区 AGENTS.md），赛程里留着它只会多一颗
 * 点下去看不懂的筛选 chip。分类口径（categoryOf 认 raicom、tokens 有 --cat-raicom）**照旧保留** ——
 * 要恢复只有两处：删掉这里那个 slug + scripts/gen_schedule.mjs 的 SOURCES 里加回 raicom 源。
 */
export const HIDDEN_CONTESTS = new Set(['raicom'])

/**
 * 一场比赛 → 类型键（恒有返回，认不出就是 'other'）。
 * 只看 contest / title / stage —— 不猜、不按日期猜，判据全在字面上。
 */
export function categoryOf(item = {}) {
  const contest = String(item?.contest || '')
  const text = `${item?.title || ''} ${item?.stage || ''}`

  if (ONLINE_CONTESTS.has(contest)) return 'online'
  if (CATEGORY_OF_CONTEST[contest]) return CATEGORY_OF_CONTEST[contest]

  if (contest === 'icpc' || contest === 'ccpc') {
    if (/女生|专场/.test(text)) return 'reg' // 会长 2026-10-02：女生赛并入「区域赛·全国赛」（原 inv）
    if (/网络|预选/.test(text)) return 'net'
    if (/邀请赛/.test(text)) return 'inv'
    if (/总决赛/.test(text)) return 'final'
    if (/区域赛|全国赛|国赛/.test(text)) return 'reg'
    return 'reg' // xCPC 兜底：它至少是国家级赛事，别落到 other
  }

  // 其余（将来新加的赛事）按字面兜底
  if (/省赛|区赛/.test(text)) return 'prov'
  if (/网络|线上|预选/.test(text)) return 'net'
  if (/邀请赛/.test(text)) return 'inv'
  if (/总决赛/.test(text)) return 'final'
  if (/校赛|校内/.test(text)) return 'school'
  if (/协会|社团|招新|选拔/.test(text)) return 'club'
  return 'other'
}

/**
 * 类型键 → 两枚 CSS 变量（组件把它摊到行的 style 上）：
 *   `--cat`       左边框与 chip 的主色   → var(--cat-<key>)
 *   `--cat-soft`  同色 10% 底（无 logo 时的首字母方块用）
 * 未知键退回 other，不会产生一个「颜色是空的」的行。
 */
export function categoryVars(key) {
  const k = CATEGORY_LABELS[key] ? key : 'other'
  return { '--cat': `var(--cat-${k})`, '--cat-soft': `var(--cat-${k}-soft)` }
}

/**
 * 出表。输入 = 手写那份的 `items` / `pending` + 自动那份的 `items`。
 * 返回：
 *   rows          未来与进行中的场次，按开赛日升序（同日按标题，顺序稳定、不随文件里的书写顺序变）
 *   pending       没有确切日期的场次（「10月初」这类，单独一块，不编日期）
 *   expiredCount  已结束、被自动收起的场次数（页脚写出来 —— 让「自动更新」看得见）
 * 每条 row 都带好 startKey / endKey / monthKey / monthLabel / dateText / weekday / status / statusLabel
 * **和 category / filterKey**（前者管左边框配色，后者是筛选 chip 的键 = 赛事 slug，见 filterKeyOf）。
 */
export function buildUpcoming(data = {}, today = startOfToday()) {
  const rows = []
  let expiredCount = 0

  for (const item of mergeSchedule(data.items || [], data.auto || [])) {
    // 整条不展示的赛事（睿抗）在这一步出局，**不计入 expiredCount**：
    // 否则页脚会出现「已自动收起 N 场结束的」，而访客从头到尾没见过这个赛事
    if (HIDDEN_CONTESTS.has(item.contest)) continue
    const st = statusOf(item, today)
    if (st.key === 'past') {
      expiredCount++
      continue
    }
    const s = parseDate(item.start)
    const e = parseDate(item.end) || s
    const withYear = s.getFullYear() !== today.getFullYear()
    rows.push({
      ...item,
      startKey: toKey(s),
      endKey: toKey(e),
      monthKey: `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}`,
      monthLabel: `${withYear ? s.getFullYear() + '年' : ''}${s.getMonth() + 1}月`,
      dateText: formatRange(item.start, item.end, today),
      weekday: weekdayOf(s),
      status: st.key,
      statusLabel: st.label,
      urgent: st.urgent,
      category: categoryOf(item),
      filterKey: filterKeyOf(item),
    })
  }

  rows.sort((a, b) => {
    if (a.startKey !== b.startKey) return a.startKey < b.startKey ? -1 : 1
    return String(a.title || '').localeCompare(String(b.title || ''), 'zh')
  })

  // pending 也挂类型：它照样是「赛事条目」，左边框与小圆点跟着类型上色
  const pending = (data.pending || [])
    .filter((p) => p && p.title && !HIDDEN_CONTESTS.has(p.contest))
    .map((p) => ({ ...p, category: categoryOf(p), filterKey: filterKeyOf(p) }))
  return { rows, pending, expiredCount }
}

/* ==========================================================================
   筛选与显示口径（2026-10-02 抽出）
   --------------------------------------------------------------------------
   会长把近期赛事拆成独立页（/upcoming）+ 竞赛信息页一块看板之后，「取图标」「筛选认哪个键」
   这些事各有了第二个落点。凡是两处都要用同一套判据的，一律放这里 ——
   各写一遍必然漂移，本仓库为这个毛病已经吃过几次亏（见 contestTaxonomy.js 头注释）。
   ========================================================================== */

/**
 * 筛选 chip 的键 = **赛事 slug**（2026-10-02 三次改版：原先线下按「类型」分，
 * 会长改成「线上赛要分平台，然后线下赛要分赛事」）。
 * 于是两行的 chip 键**同形**了：线下那颗是 icpc / ccpc / lanqiao…，线上那颗是
 * codeforces / atcoder / nowcoder…，谁进哪一行由 `categoryOf()` 判定（组件据此摆成两行）。
 * 组件只认 row.filterKey 与本函数，不在模板里自己判 slug。
 */
export function filterKeyOf(item = {}) {
  return String(item?.contest || 'other')
}

/* ── 三颗「范围开关」（全部 / 线下赛 / 线上赛）的关联式选中 ──────────────────────────
   会长 2026-10-02 第三版的口径，原话：「『全部勾选线下赛事』『全部勾选线上赛』『全部』按钮
   都改成可选中式，但是，是关联式的选中，即，其所属的所有按钮都选中时，自动选中，其他时候
   自动不选。然后处于选中状态点击，全部取消选中，未选中状态点击，全部选中」。
   于是这三颗**自己不存状态**：亮不亮完全由「它管的那组标签是不是都勾上」推出来
   （`groupChecked`），点一下就是**整组反转**（`toggleGroup`）。
   为什么放在这里而不是组件里：它们是纯函数、能直接用固定输入回归 —— 而组件是 SSR 渲染的，
   点击行为在 node 里点不到（见 test/upcoming-schedule.test.mjs 的说明）。 */

/**
 * 一组键是不是**都勾上了**。`excluded` = 被取消勾选的键集合（组件的 state）。
 * ⚠ 空组恒为 false：线上赛一场都没有时，「线上赛」那颗开关不该装成「已全选」的样子。
 * 传进来的不是 Set 时（例如 JSON 里的数组）先转一次，调用方不必先自己包一层。
 */
export function groupChecked(excluded, keys = []) {
  const off = excluded instanceof Set ? excluded : new Set(excluded || [])
  return keys.length > 0 && keys.every((k) => !off.has(k))
}

/**
 * 点一下范围开关：**全勾 → 全撤；否则 → 全勾**（「其他时候自动不选」的那一半由
 * `groupChecked` 表达，这里只管按它行动）。
 * 返回**新的 Set**、不改入参 —— Vue 靠换引用来触发更新，原地 clear/add 是不会重渲染的。
 */
export function toggleGroup(excluded, keys = []) {
  const off = excluded instanceof Set ? excluded : new Set(excluded || [])
  const on = groupChecked(off, keys)
  const next = new Set(off)
  for (const k of keys) {
    if (on) next.add(k)
    else next.delete(k)
  }
  return next
}

/**
 * 一批场次里**出现最多**的类型（并列取 CATEGORY_ORDER 靠前者，一个都没有时兜 `other`）。
 * 用途：一格一赛事时那格该用哪条类型色 —— ICPC 一年里既有区域赛也有邀请赛。
 * 2026-10-02 从 UpcomingSchedule.vue 的组件局部函数搬进来：筛选 chip 与仪表盘格都按它上色，
 * 两处各算一遍迟早不一致。
 */
export function dominantCategory(cats = new Map()) {
  let best = ''
  let bestN = 0
  for (const key of CATEGORY_ORDER) {
    const n = cats.get(key) || 0
    if (n > bestN) {
      best = key
      bestN = n
    }
  }
  return best || 'other'
}

/**
 * 仪表板那组数字（2026-10-02 会长要求：从卡片/页脚底部挪到**顶部**，并「详细一些」；
 * 再一条：「线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」）。
 * 输入 = `buildUpcoming()` 的返回值；纯函数，可用固定 today 回归。
 *
 * ⚠ 统计**恒按全部未来场次算**，不受筛选影响：勾掉几个标签时数字不跳，
 *   「勾选后显示几场」由页脚单独说（两件事混在一起会让人以为数据变了）。
 * ⚠ 一格一赛事 / 一格一平台的键都是 `row.contest`（也正是 `filterKey` 的来源），
 *   顺序走 CONTEST_ORDER / PLATFORM_ORDER —— 与筛选 chips **同一套顺序表**；
 *   显示名与图标由调用方去图标表里取（这里不碰 UI 文案）。
 */
export function scheduleStats(view = {}, today = startOfToday()) {
  const rows = view.rows || []
  const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const thisMonth = keyOf(today)
  const nextMonth = keyOf(new Date(today.getFullYear(), today.getMonth() + 1, 1))

  // 线下 / 线上各数一遍。线下那袋顺手记下每个赛事的**类型分布** —— 那格用哪条类型色由
  // dominantCategory 决定（见上）。
  const offline = new Map()
  const online = new Map()
  for (const r of rows) {
    const bag = r.category === 'online' ? online : offline
    let entry = bag.get(r.contest)
    if (!entry) {
      entry = { count: 0, cats: new Map() }
      bag.set(r.contest, entry)
    }
    entry.count += 1
    entry.cats.set(r.category, (entry.cats.get(r.category) || 0) + 1)
  }
  /** 顺序表里登记过的按表排、没登记的排到末尾（彼此保持首次出现序；sort 在现代 JS 里是稳定的） */
  const orderOf = (keys, order) => {
    const rank = (k) => (order.indexOf(k) < 0 ? order.length : order.indexOf(k))
    return [...keys].sort((a, b) => rank(a) - rank(b))
  }

  return {
    total: rows.length,
    monthCount: rows.filter((r) => r.monthKey === thisMonth).length,
    nextMonthCount: rows.filter((r) => r.monthKey === nextMonth).length,
    onlineCount: rows.filter((r) => r.category === 'online').length,
    byContest: orderOf([...offline.keys()], CONTEST_ORDER).map((slug) => ({
      slug,
      count: offline.get(slug).count,
      category: dominantCategory(offline.get(slug).cats),
    })),
    byPlatform: orderOf([...online.keys()], PLATFORM_ORDER).map((slug) => ({
      slug,
      count: online.get(slug).count,
    })),
    signupCount: rows.filter((r) => r.status === 'signup').length,
    expiredCount: view.expiredCount || 0,
    pendingCount: (view.pending || []).length,
    next: rows[0] || null, // rows 已按开赛日升序，第一条就是最近一场
  }
}

/**
 * 图标索引：competitions.json + platforms.json 合成**一张** slug → `{ image, label }` 表。
 * 平台那份**故意不写进 competitions.json**（那份数据的每一条都会在卡片网格里长出一张大卡，
 * 还要过奖项文件与届次映射的校验，而 Codeforces / AtCoder / 牛客我们并不参赛），
 * 所以取图标必须合表 —— 组件各自拼一遍的话，日后加数据源就会漏改一处、静默没图标。
 */
export function buildIconIndex(competitions = [], platforms = []) {
  const map = new Map()
  for (const item of [...(competitions || []), ...(platforms || [])]) {
    if (!item?.slug) continue
    map.set(item.slug, { image: item.image || '', label: item.shortName || item.name || '' })
  }
  return map
}

/**
 * 赛事/平台在界面上的显示名：图标表的 `shortName || name` → `CONTEST_LABELS` 的中文兜底 →
 * slug 本身（`club` 这种没登记的 slug 露出中文「协会自办」比露出 `club` 强）。
 * 2026-10-02 收口：看板的行、筛选 chip、仪表板的格子原先各写一遍兜底顺序，
 * 而它们写得不完全一样 —— 仪表板那格就露了裸 slug（`club`），同一个东西在两处长得不同。
 */
export function contestLabel(icons, slug) {
  return icons?.get?.(slug)?.label || CONTEST_LABELS[slug] || String(slug || '')
}

/**
 * 没有图标的赛事（睿抗 / 协会自办…）用「首字母 / 首字」方块顶上：
 * 那一格整块空着，与「这里本来就只有一个字母」看着完全不同，后者不会像漏图。
 */
export function initialOf(label, fallback = '?') {
  const text = String(label || '')
  const m = /[A-Za-z0-9]/.exec(text)
  return (m ? m[0] : text.slice(0, 1) || fallback).toUpperCase()
}

/* 「数据更新：手写 X月X日 · 官网自动同步 X月X日」那行字 2026-10-02 由会长要求撤掉
   （看板与完整表右上角各有一处）。原先它的日期换算口径就写在这个位置 —— 自动层是 UTC 的
   ISO、必须先 +8h 再取日期，否则北京时间 0~8 点构建会显示成「昨天」（2026-10-01 踩过）——
   连同函数一起删了。数据本身照旧带 schedule.updated 与 schedule.auto.generated_at，
   /data:check 也照旧校验它们，只是不再往页面上摆。 */

/** 表格按月份分组的表头（同一 startKey 的月份归一组，顺序沿用 rows 的日期序）。 */
export function groupByMonth(rows = []) {
  const groups = []
  for (const row of rows) {
    let g = groups[groups.length - 1]
    if (!g || g.key !== row.monthKey) {
      g = { key: row.monthKey, label: row.monthLabel, rows: [] }
      groups.push(g)
    }
    g.rows.push(row)
  }
  return groups
}
