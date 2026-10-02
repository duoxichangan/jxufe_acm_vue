/**
 * 近期赛事时间表：日期口径回归（2026-10-01 新增）。
 *
 * 这套逻辑的每一处都出过「看起来对、跨过某个边界就错」的形态，所以全部用**固定的 today**
 * 钉住：东八区的纯日期解析、月末与跨年、过了当天的场次必须消失、报名截止比开赛更近时
 * 该提醒哪个。组件里没写死 `new Date()`（在 src/utils/scheduleView.js 里），才测得动。
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  parseDate,
  toKey,
  startOfToday,
  dayDiff,
  weekdayOf,
  formatRange,
  mergeSchedule,
  statusOf,
  buildUpcoming,
  groupByMonth,
  categoryOf,
  categoryVars,
  filterKeyOf,
  scheduleStats,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CONTEST_ORDER,
  PLATFORM_ORDER,
  CONTEST_LABELS,
  groupChecked,
  toggleGroup,
} from '../src/utils/scheduleView.js'

const TODAY = parseDate('2026-10-01') // 周四

test('纯日期按本地日历日解析，不当时区偏移', () => {
  const d = parseDate('2026-10-01')
  assert.equal(d.getFullYear(), 2026)
  assert.equal(d.getMonth(), 9) // 0-based
  assert.equal(d.getDate(), 1)
  assert.equal(d.getHours(), 0)
  assert.equal(toKey(d), '2026-10-01')
  assert.equal(weekdayOf(d), '周四')
})

test('日历上不存在的日期、坏格式、非字符串一律判无效', () => {
  assert.equal(parseDate('2026-02-30'), null) // Date 会静默滚成 03-02，必须拦住
  assert.equal(parseDate('2026-13-01'), null)
  assert.equal(parseDate('2026/10/01'), null)
  assert.equal(parseDate(''), null)
  assert.equal(parseDate(undefined), null)
  assert.equal(parseDate(20261001), null)
  assert.equal(parseDate('2026-2-1'), null) // 只认补零的 ISO 写法
})

test('startOfToday 抹掉时分秒；dayDiff 跨月末与跨年都对', () => {
  const noon = new Date(2026, 9, 1, 13, 45, 30)
  assert.equal(toKey(startOfToday(noon)), '2026-10-01')
  assert.deepEqual([dayDiff(TODAY, parseDate('2026-10-02')), dayDiff(TODAY, TODAY)], [1, 0])
  assert.equal(dayDiff(parseDate('2026-12-31'), parseDate('2027-01-01')), 1)
  assert.equal(dayDiff(parseDate('2026-09-30'), parseDate('2026-10-01')), 1)
  assert.equal(dayDiff(parseDate('2024-02-28'), parseDate('2024-03-01')), 2) // 闰年
  assert.equal(dayDiff(parseDate('2025-02-28'), parseDate('2025-03-01')), 1)
})

test('区间文本：同日、同月、跨月、跨年；不是今年就带年份', () => {
  assert.equal(formatRange('2026-10-17', '2026-10-17', TODAY), '10月17日')
  assert.equal(formatRange('2026-10-17', undefined, TODAY), '10月17日')
  assert.equal(formatRange('2026-10-17', '2026-10-18', TODAY), '10月17日—18日')
  assert.equal(formatRange('2026-10-30', '2026-11-01', TODAY), '10月30日—11月1日')
  assert.equal(formatRange('2026-12-30', '2027-01-02', TODAY), '2026年12月30日—2027年1月2日')
  // 明年的场次必须写出年份，否则会被当成今年
  assert.equal(formatRange('2027-04-17', '2027-04-17', TODAY), '2027年4月17日')
  assert.equal(formatRange('bogus', undefined, TODAY), '')
})

test('合并：手写优先，自动只补缺；脏日期进不了表', () => {
  const manual = [
    { contest: 'lanqiao', title: '蓝桥杯校内选拔（最新口径）', start: '2027-03-14' },
    { contest: 'icpc', title: '缺日期的一条', start: '' },
  ]
  const auto = [
    { contest: 'lanqiao', title: '蓝桥杯校内选拔（旧公告）', start: '2027-03-14' }, // 同赛事同日 → 被手写顶掉
    { contest: 'ccpc', title: 'CCPC 网络赛', start: '2026-10-11' }, // 手写没有 → 补进来
    { contest: 'ccpc', title: '坏日期', start: '2026-02-30' },
  ]
  const merged = mergeSchedule(manual, auto)
  assert.deepEqual(
    merged.map((m) => [m.title, m.origin]),
    [
      ['蓝桥杯校内选拔（最新口径）', 'manual'],
      ['CCPC 网络赛', 'auto'],
    ]
  )
})

test('状态：今天 / 进行中 / 已结束 / 报名中 / 还有几天', () => {
  const at = (item) => statusOf(item, TODAY)
  assert.equal(at({ start: '2026-10-01' }).key, 'today')
  assert.equal(at({ start: '2026-09-29', end: '2026-10-02' }).key, 'ongoing')
  assert.equal(at({ start: '2026-09-29', end: '2026-09-30' }).key, 'past')
  // 报名截止比开赛更近 → 提醒报名（学生真正会错过的是这个日子）
  const signup = at({ start: '2026-10-20', deadline: '2026-10-05' })
  assert.equal(signup.key, 'signup')
  assert.equal(signup.label, '报名还剩 4 天')
  assert.equal(at({ start: '2026-10-20', deadline: '2026-10-01' }).label, '今天报名截止')
  // 截止已过则不提醒，回到开赛倒计时
  assert.equal(at({ start: '2026-10-20', deadline: '2026-09-30' }).key, 'later')
  // 只公布「报名窗口」的场次（睿抗那种：赛道比赛日官方从不公布）：deadline 与 start 同一天，
  // 这时该说「报名还剩 N 天」—— 写成「还有 N 天」会被读成比赛日
  const window = at({ start: '2026-11-30', deadline: '2026-11-30' })
  assert.equal(window.key, 'signup')
  assert.equal(window.label, '报名还剩 60 天')
  assert.equal(at({ start: '2026-10-05' }).key, 'soon')
  assert.equal(at({ start: '2026-10-05' }).urgent, true)
  assert.equal(at({ start: '2026-11-05' }).label, '还有 35 天')
  assert.equal(at({ start: '2026-11-05' }).urgent, false)
  assert.equal(at({}).key, 'invalid') // 没日期不炸
})

test('出表：已结束的自动收起并计数，按日期升序，待定的原样带出', () => {
  const view = buildUpcoming(
    {
      items: [
        { contest: 'gplt', title: '天梯赛校内选拔', start: '2027-03-20' },
        { contest: 'lanqiao', title: '已结束的校内赛', start: '2026-09-20' },
        { contest: 'ccpc', title: 'CCPC 区域赛', start: '2026-10-17', end: '2026-10-18' },
      ],
      auto: [{ contest: 'baidu', title: '百度之星决赛', start: '2026-12-05' }],
      pending: [{ contest: 'icpc', title: 'ICPC 区域赛（赛站未公布）', when: '2026 年 11-12 月' }, { title: '' }],
    },
    TODAY
  )

  assert.deepEqual(
    view.rows.map((r) => r.title),
    ['CCPC 区域赛', '百度之星决赛', '天梯赛校内选拔']
  )
  assert.equal(view.expiredCount, 1)
  assert.equal(view.pending.length, 1)

  const ccpc = view.rows[0]
  assert.equal(ccpc.dateText, '10月17日—18日')
  assert.equal(ccpc.weekday, '周六')
  assert.equal(ccpc.status, 'later') // 距 10-01 有 16 天，还没进「7 天内」的紧急档
  assert.equal(ccpc.statusLabel, '还有 16 天')
  assert.equal(ccpc.monthKey, '2026-10')
  assert.equal(ccpc.monthLabel, '10月')
  assert.equal(ccpc.origin, 'manual') // 手写层来的（它写在 items 里）

  const gplt = view.rows[2]
  assert.equal(gplt.monthLabel, '2027年3月') // 明年的场次要带年份
  assert.equal(gplt.dateText, '2027年3月20日')

  const groups = groupByMonth(view.rows)
  assert.deepEqual(
    groups.map((g) => [g.label, g.rows.length]),
    [
      ['10月', 1],
      ['12月', 1],
      ['2027年3月', 1],
    ]
  )
})

test('同一天多场：排序稳定（按标题），不随数据文件里的书写顺序变', () => {
  const a = buildUpcoming(
    {
      items: [
        { contest: 'x', title: '乙场', start: '2026-10-17' },
        { contest: 'y', title: '甲场', start: '2026-10-17' },
      ],
    },
    TODAY
  )
  const b = buildUpcoming(
    {
      items: [
        { contest: 'y', title: '甲场', start: '2026-10-17' },
        { contest: 'x', title: '乙场', start: '2026-10-17' },
      ],
    },
    TODAY
  )
  assert.deepEqual(a.rows.map((r) => r.title), b.rows.map((r) => r.title))
})

test('空数据不炸：两份都没读到也要出空表', () => {
  const view = buildUpcoming(undefined, TODAY)
  assert.deepEqual(view.rows, [])
  assert.deepEqual(view.pending, [])
  assert.equal(view.expiredCount, 0)
  assert.deepEqual(groupByMonth(), [])
})

/* ── 赛事类型（左边框配色 + 筛选的唯一判据）────────────────────────────── */

test('类型判据：女生专场并入「区域赛·全国赛」、暨xx省赛归邀请赛、网络预选赛归网络赛', () => {
  // xCPC 各档
  assert.equal(categoryOf({ contest: 'ccpc', title: 'CCPC全国赛（长春）' }), 'reg')
  assert.equal(categoryOf({ contest: 'icpc', title: 'ICPC亚洲区域赛（西安）' }), 'reg')
  assert.equal(categoryOf({ contest: 'icpc', title: 'ICPC世界总决赛（开罗）' }), 'final')
  assert.equal(categoryOf({ contest: 'icpc', title: 'ICPC东亚区总决赛（昆明）' }), 'final')
  assert.equal(categoryOf({ contest: 'ccpc', title: 'CCPC总决赛（深圳）' }), 'final')
  // ⚠ 会长 2026-10-02：「xcpc女赛并入全国赛那类」→ reg（大事记**数据**里仍归 inv，
  //   这是有意的一处不一致，别照这边去改 public/data/events/*.json）
  assert.equal(categoryOf({ contest: 'ccpc', title: 'CCPC女生专场（成都）' }), 'reg')
  assert.equal(categoryOf({ contest: 'icpc', title: 'ICPC全国邀请赛（昆明）' }), 'inv')
  // 「暨江西省赛」在大事记里就归邀请赛（不因为出现「省赛」二字掉进 prov）
  assert.equal(categoryOf({ contest: 'ccpc', title: 'CCPC全国邀请赛（南昌）暨江西省赛' }), 'inv')
  assert.equal(categoryOf({ contest: 'ccpc', title: 'CCPC网络预选赛' }), 'net')
  assert.equal(categoryOf({ contest: 'icpc', title: 'ICPC网络赛预选赛第一场' }), 'net')

  // 其他系列按 slug 直判
  assert.equal(categoryOf({ contest: 'gplt', title: '天梯赛' }), 'tts')
  assert.equal(categoryOf({ contest: 'lanqiao', title: '蓝桥杯国赛' }), 'lanqiao')
  assert.equal(categoryOf({ contest: 'chuanzhi', title: '传智杯' }), 'chuanzhi')
  assert.equal(categoryOf({ contest: 'baidu', title: '百度之星决赛' }), 'baidu')
  assert.equal(categoryOf({ contest: 'raicom', title: '睿抗' }), 'raicom')
  assert.equal(categoryOf({ contest: 'club', title: '协会招新选拔' }), 'club')
  // 线上平台：**不看标题**，由 slug 决定。牛客 2026-10-02 接进来（它的日历里也夹着校赛/集训，
  // 但那是「线上举办的训练/校赛」，归到线上赛而不是 club/school —— 会长要的是「顺便能看到」）
  for (const c of ['codeforces', 'atcoder', 'luogu', 'nowcoder']) assert.equal(categoryOf({ contest: c, title: 'x' }), 'online')

  // 字面兜底与不认识的
  assert.equal(categoryOf({ contest: 'new', title: '广东省赛' }), 'prov')
  assert.equal(categoryOf({ contest: 'new', title: '校内选拔赛' }), 'school')
  assert.equal(categoryOf({}), 'other')
  assert.equal(categoryOf(), 'other') // 不传参数也不炸
})

test('类型变量：未知键退回 other，绝不产生「颜色是空的」那一行', () => {
  assert.deepEqual(categoryVars('reg'), { '--cat': 'var(--cat-reg)', '--cat-soft': 'var(--cat-reg-soft)' })
  assert.deepEqual(categoryVars(undefined), { '--cat': 'var(--cat-other)', '--cat-soft': 'var(--cat-other-soft)' })
  assert.deepEqual(categoryVars('没这个键'), { '--cat': 'var(--cat-other)', '--cat-soft': 'var(--cat-other-soft)' })
  // 顺序表与中文名表必须一一对应（组件按 CATEGORY_ORDER 摆 chips，缺名字会渲染成英文键）
  assert.equal(CATEGORY_ORDER.length, new Set(CATEGORY_ORDER).size, 'CATEGORY_ORDER 有重复键')
  for (const k of Object.keys(CATEGORY_LABELS)) assert.ok(CATEGORY_ORDER.includes(k), `${k} 不在 CATEGORY_ORDER 里`)
})

test('出表时每行、每条待定都带类型（左边框与筛选都靠它）', () => {
  const view = buildUpcoming(
    {
      items: [
        { contest: 'ccpc', title: 'CCPC全国赛（长春）', start: '2026-10-17' },
        { contest: 'atcoder', title: 'AtCoder Beginner Contest 478', start: '2026-10-03' },
      ],
      pending: [{ contest: 'club', title: '协会招新选拔（新生赛）', when: '2026 年 10 月，日期待定' }],
    },
    TODAY
  )
  assert.deepEqual(
    view.rows.map((r) => [r.title, r.category]),
    [
      ['AtCoder Beginner Contest 478', 'online'],
      ['CCPC全国赛（长春）', 'reg'],
    ]
  )
  assert.equal(view.pending[0].category, 'club')
})

test('睿抗整条不展示（会长 2026-10-02），也不计入「已自动收起 N 场」', () => {
  const view = buildUpcoming(
    {
      items: [
        { contest: 'raicom', title: '睿抗机器人开发者大赛', start: '2026-11-29', deadline: '2026-11-29' },
        { contest: 'raicom', title: '已结束的睿抗场次', start: '2026-09-01' },
        { contest: 'ccpc', title: 'CCPC全国赛（长春）', start: '2026-10-17' },
      ],
      pending: [
        { contest: 'raicom', title: '睿抗（时间待定）', when: '2026 年 11 月' },
        { contest: 'club', title: '协会招新选拔', when: '2026 年 10 月，日期待定' },
      ],
    },
    TODAY
  )
  assert.deepEqual(view.rows.map((r) => r.title), ['CCPC全国赛（长春）'])
  assert.deepEqual(view.pending.map((p) => p.title), ['协会招新选拔'])
  assert.equal(view.expiredCount, 0, '隐藏的赛事没露过面，就不该报「已自动收起」')
})

test('筛选键：一律是**赛事 slug**（线下按赛事、线上按平台 —— 两行同形）', () => {
  assert.equal(filterKeyOf({ contest: 'ccpc', title: 'CCPC全国赛（长春）' }), 'ccpc')
  assert.equal(filterKeyOf({ contest: 'gplt', title: '天梯赛' }), 'gplt')
  assert.equal(filterKeyOf({ contest: 'atcoder', title: 'AtCoder Beginner Contest 478' }), 'atcoder')
  assert.equal(filterKeyOf({ contest: 'codeforces', title: 'Codeforces Round 999' }), 'codeforces')
  assert.equal(filterKeyOf({}), 'other')
  // ⚠ 键**不再**是类型：2026-10-02 三次改版前，线下那颗 chip 的键是 'reg'（区域赛·全国赛），
  // 撤一颗会连带别的赛事一起消失；现在「一颗 = 一项赛事」。
  assert.notEqual(filterKeyOf({ contest: 'ccpc', title: 'CCPC全国赛（长春）' }), 'reg')
  // 出表时每行都挂上它（组件只认 row.filterKey，不在模板里自己判 slug）
  const view = buildUpcoming(
    { items: [{ contest: 'nowcoder', title: '牛客周赛 Round 164', start: '2026-10-04' }] },
    TODAY
  )
  assert.equal(view.rows[0].filterKey, 'nowcoder')
  assert.equal(view.rows[0].category, 'online', '分类仍是「线上赛」—— 只是筛的时候按平台分家')
})

test('两行 chips 的顺序表与兜底名（组件不自己写死）', () => {
  assert.ok(
    CONTEST_ORDER.indexOf('icpc') < CONTEST_ORDER.indexOf('lanqiao'),
    'xCPC 排在其他系列之前 —— 我们真正要提前准备的就是它们'
  )
  assert.ok(CONTEST_ORDER.includes('club') && CONTEST_ORDER.includes('school'), '协会自办 / 校赛也在表里')
  assert.deepEqual(PLATFORM_ORDER, ['codeforces', 'atcoder', 'nowcoder', 'luogu'])
  assert.equal(CONTEST_LABELS.club, '协会自办', '没图标的 slug 要有中文兜底名，不能把 slug 摆到页面上')
})

/* ── 顶部数字条（2026-10-02 会长要求从页脚挪到顶部并「详细一些」，看板与完整表共用）── */

test('数字条：总数/本月/下月/线上赛按平台拆/报名中/已收起，全部按固定 today 算', () => {
  const view = buildUpcoming(
    {
      items: [
        { contest: 'ccpc', title: 'CCPC全国赛（长春）', start: '2026-10-17' },
        { contest: 'lanqiao', title: '蓝桥杯校内选拔赛', start: '2026-10-20', deadline: '2026-10-03' },
        { contest: 'gplt', title: '天梯赛', start: '2026-11-15' },
        { contest: 'atcoder', title: 'AtCoder Beginner Contest 478', start: '2026-10-03' },
        { contest: 'atcoder', title: 'AtCoder Regular Contest 200', start: '2026-10-10' },
        { contest: 'nowcoder', title: '牛客周赛 Round 164', start: '2026-10-04' },
        { contest: 'codeforces', title: 'Codeforces Round 999', start: '2026-11-02' },
        { contest: 'club', title: '已经比完的新生赛', start: '2026-09-20' },
      ],
      pending: [{ contest: 'club', title: '协会招新选拔', when: '2026 年 10 月，日期待定' }],
    },
    TODAY // 2026-10-01
  )
  const s = scheduleStats(view, TODAY)
  assert.equal(s.total, 7, '已结束那场不算（buildUpcoming 已经把它收进 expiredCount）')
  assert.equal(s.monthCount, 5, '10 月：10-03 / 10-04 / 10-10 / 10-17 / 10-20')
  assert.equal(s.nextMonthCount, 2, '11 月：11-02 / 11-15 —— 「下月」是 today 的下一个月，不是「+30 天」')
  assert.equal(s.onlineCount, 4, '线上赛：2 AtCoder + 1 牛客 + 1 Codeforces')
  assert.deepEqual(
    s.byPlatform.map((p) => [p.slug, p.count]),
    [
      ['codeforces', 1],
      ['atcoder', 2],
      ['nowcoder', 1],
    ],
    '平台拆分按行数统计，顺序 = PLATFORM_ORDER（与筛选 chip 同一套顺序表，不随数据先后抖）'
  )
  assert.deepEqual(
    s.byContest.map((c) => [c.slug, c.count, c.category]),
    [
      ['ccpc', 1, 'reg'],
      ['gplt', 1, 'tts'],
      ['lanqiao', 1, 'lanqiao'],
    ],
    '线下按赛事拆（会长 2026-10-02），顺序 = CONTEST_ORDER；每格带上该赛事的类型（一格一色用）'
  )
  assert.equal(s.signupCount, 1, '报名截止比开赛近的那条算「报名中」')
  assert.equal(s.expiredCount, 1)
  assert.equal(s.pendingCount, 1)
  assert.equal(s.next.title, 'AtCoder Beginner Contest 478', '最近一场 = 排序后的第一条')
  // 数字条只报数字，不碰 UI 文案：显示名由调用方去图标表里取（见 scheduleView.contestLabel）
  assert.ok(!('label' in s.byPlatform[0]), 'byPlatform 只给 slug + count')
  assert.ok(!('label' in s.byContest[0]), 'byContest 只给 slug + count + category')

  // 空数据 / 不传参数都不炸（组件在两份数据都缺时会渲染空态，不该先崩在统计里）
  const empty = scheduleStats(buildUpcoming(undefined, TODAY), TODAY)
  assert.equal(empty.total, 0)
  assert.equal(empty.next, null)
  assert.deepEqual(empty.byPlatform, [])
  assert.deepEqual(empty.byContest, [])
  assert.deepEqual(scheduleStats(), {
    total: 0,
    monthCount: 0,
    nextMonthCount: 0,
    onlineCount: 0,
    byContest: [],
    byPlatform: [],
    signupCount: 0,
    expiredCount: 0,
    pendingCount: 0,
    next: null,
  })
})

// ==========================================================================
// 三颗范围开关（全部 / 线下赛 / 线上赛）的关联式选中 —— 会长 2026-10-02 第三版：
// 「其所属的所有按钮都选中时，自动选中，其他时候自动不选。然后处于选中状态点击，
//   全部取消选中，未选中状态点击，全部选中」。
// 组件是 SSR 渲染的（node 里点不到按钮），所以**点击语义全压在这两个纯函数上**：
// 组件只负责把 groupChecked 的结果画成 .active / aria-pressed，把点击交给 toggleGroup。
// ==========================================================================

test('范围开关的选中态：全勾才亮；空组恒不亮（没有线上赛时那颗开关不该装成已全选）', () => {
  const keys = ['icpc', 'ccpc']
  assert.equal(groupChecked(new Set(), keys), true, '一个都没被取消 = 全勾 = 亮')
  assert.equal(groupChecked(new Set(['icpc']), keys), false, '少一颗就不亮')
  assert.equal(groupChecked(new Set(['icpc', 'ccpc']), keys), false, '整组撤掉当然不亮')
  assert.equal(groupChecked(new Set(), []), false, '空组不亮')
  // 传数组（例如 JSON 里读来的）也要能用，调用方不必先自己包一层
  assert.equal(groupChecked(['icpc'], keys), false)
  assert.equal(groupChecked(null, keys), true)
})

test('范围开关的点击：全勾 → 全撤；否则 → 全勾；返回新 Set、不改入参', () => {
  const keys = ['icpc', 'ccpc']
  const untouched = new Set(['lanqiao'])

  // 亮着点一下 → 整组进 excluded（别人不动）
  const off = toggleGroup(untouched, keys)
  assert.deepEqual([...off].sort(), ['ccpc', 'icpc', 'lanqiao'], '整组被撤掉，别的键照旧')
  assert.deepEqual([...untouched], ['lanqiao'], '原 Set 一个字都不许改（Vue 靠换引用触发更新）')

  // 只撤了一颗（没全勾）→ 点一下是「全勾」，而不是把剩下那颗也撤掉
  const on = toggleGroup(new Set(['icpc', 'lanqiao']), keys)
  assert.deepEqual([...on], ['lanqiao'], '缺的补上、组外的保留')
  assert.equal(groupChecked(on, keys), true, '点完这一组就该亮')

  // 连点两次回到原样（幂等地成对）
  assert.deepEqual([...toggleGroup(off, keys)].sort(), [...untouched].sort(), '再点一下回到全勾')

  // 空组点了什么也不发生（没有线上赛时那三颗里的「线上赛」不该把整表清空）
  assert.deepEqual([...toggleGroup(untouched, [])], ['lanqiao'])
})
