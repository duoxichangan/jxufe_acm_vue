/**
 * 近期赛事时间表：组件渲染冒烟（2026-10-01 新增）。
 *
 * 为什么要在 node 里编译 SFC 再 SSR 渲染一遍：这台开发机的沙箱**不让起 esbuild 子进程**
 * （`npm run build` 直接 `spawn EPERM`），所以「模板有没有写错、两份数据合并后到底渲染成什么」
 * 在构建那一步是看不见的。这里用 `vue/compiler-sfc` 把 .vue 现场编译成组件、
 * 用 `vue/server-renderer` 渲成字符串，拿**固定 today** 断言真实的 HTML ——
 * 于是模板回归（改坏一个 v-if、写错个字段名）在 `npm test` 里就会红。
 *
 * 编译产物落在 `node_modules/.cache/`，那里能被 gitignore 覆盖、又上溯得到 `vue`（裸包名解析）。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { parse, compileScript } from 'vue/compiler-sfc'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

const ROOT = path.resolve(import.meta.dirname, '..')
const SFC = path.join(ROOT, 'src', 'components', 'UpcomingSchedule.vue')
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'schedule-probe')

let seq = 0
/** 已编译过的 .vue → 生成的临时模块 URL（同一个子组件被多个 SFC import 时只编译一次） */
const compiledVue = new Map()

/** 把一个 SFC 编译成可直接 import 的临时模块（模板内联进 setup）。
 *  2026-10-02 起**递归**编译它 import 的 .vue 子组件：仪表板抽成共用的 ScheduleStats.vue 之后，
 *  顶层文件里那句 `from './ScheduleStats.vue'` 直接交给 node 会
 *  `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".vue"`。
 *  （这个 harness 代替不了 vite —— 沙箱里起不了 esbuild 子进程 —— 但足够把模板与 props 渲成 HTML 回归。） */
async function compileVue(file) {
  if (compiledVue.has(file)) return compiledVue.get(file)
  const source = fs.readFileSync(file, 'utf8')
  const { descriptor, errors } = parse(source, { filename: file })
  assert.deepEqual(errors, [], `${path.basename(file)} 解析失败`)
  const compiled = compileScript(descriptor, { id: `probe${++seq}`, inlineTemplate: true })
  const out = path.join(CACHE, `sfc-${seq}-${path.basename(file, '.vue')}.mjs`)
  let code = compiled.content

  // ① 先把 .vue 子组件递归编译掉，并把 import 改写指向它们的编译产物
  for (const rel of new Set([...code.matchAll(/from\s+'(\.\.?\/[^']+\.vue)'/g)].map((m) => m[1]))) {
    const childUrl = await compileVue(path.resolve(path.dirname(file), rel))
    code = code.split(`'${rel}'`).join(`'${childUrl}'`)
  }
  // ② 其余相对导入（../utils/*.js 这类）换成绝对 file:// —— 临时模块不在原目录下，相对路径会失效
  code = code.replace(
    /from\s+'(\.\.?\/[^']+)'/g,
    (_, rel) => `from '${pathToFileURL(path.resolve(path.dirname(file), rel)).href}'`
  )
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(out, code, 'utf8')
  const url = pathToFileURL(out).href
  compiledVue.set(file, url)
  return url
}

async function loadSFC(file) {
  return (await import(await compileVue(file))).default
}

const UpcomingSchedule = await loadSFC(SFC)

/** 页面打开那天固定住 —— 「还有几天」这类断言必须与真实日期无关。 */
const TODAY = new Date(2026, 9, 1) // 2026-10-01（本地日历日）

const COMPETITIONS = [
  { slug: 'ccpc', shortName: 'CCPC', image: '/images/contest/ccpc_logo.png' },
  { slug: 'lanqiao', shortName: '蓝桥杯', image: '/images/contest/lqb.png' },
]

/** 线上平台的图标 —— 与 competitions.json **分开**的那一份（public/data/platforms.json 的形状）。
    页面把它当 `platforms` 数组传进来（取的是 items）。 */
const PLATFORMS = [
  { slug: 'atcoder', name: 'AtCoder', shortName: 'AtCoder', image: '/images/contest/atcoder.png' },
  { slug: 'nowcoder', name: '牛客竞赛', shortName: '牛客', image: '/images/contest/nowcoder.png' },
]

const SCHEDULE = {
  updated: '2026-10-02',
  items: [
    { contest: 'ccpc', title: 'CCPC全国赛（长春）', stage: '分站赛', start: '2026-10-17', end: '2026-10-18', tentative: true, link: 'https://ccpc.io/' },
    { contest: 'lanqiao', title: '蓝桥杯校内选拔赛', stage: '校内选拔赛', start: '2026-10-20', deadline: '2026-10-03' },
    // 协会自办在 competitions.json / platforms.json 里都没有条目 → 走首字母方块那条路（J）
    { contest: 'club', title: 'JCPC 校内选拔赛', start: '2026-11-09' },
    // 睿抗**故意留在 fixture 里**：会长 2026-10-02 要求它整条不显示（scheduleView 的
    // HIDDEN_CONTESTS），下面的断言钉着「任何一处都不许出现睿抗」
    { contest: 'raicom', title: '睿抗机器人开发者大赛', stage: '报名', start: '2026-11-29', deadline: '2026-11-29' },
    { contest: 'club', title: '已经比完的新生赛', start: '2026-09-20' },
  ],
  pending: [{ contest: 'club', title: '江西财经大学程序设计竞赛（JCPC）', when: '2027 年 4 月中旬（拟定）' }],
}

const AUTO = {
  // ISO/UTC：北京时间 2026-10-02 00:30。页面上必须显示成 10月2日（不是 10月1日）——
  // 直接截字符串就是差一天，这条断言钉的就是那个坑
  generated_at: '2026-10-01T16:30:00.000Z',
  sources: [
    { id: 'ccpc', label: 'CCPC', ok: false, count: 0, error: 'HTTP 500' },
    { id: 'atcoder', label: 'AtCoder', ok: true, count: 9 },
    { id: 'nowcoder', label: '牛客竞赛日历', ok: true, count: 8 },
  ],
  items: [
    { contest: 'atcoder', title: 'AtCoder Beginner Contest 478', start: '2026-10-03', time: '20:00', source: 'atcoder' },
    { contest: 'nowcoder', title: '牛客周赛 Round 164', start: '2026-10-04', time: '19:00', source: 'nowcoder' },
    { contest: 'ccpc', title: 'CCPC全国赛（长春）（自动抓到的旧公告）', start: '2026-10-17', source: 'ccpc' },
    { contest: 'icpc', title: 'ICPC亚洲区域赛（南昌）', stage: '区域赛', start: '2026-12-19', end: '2026-12-20', tentative: true, source: 'icpc' },
  ],
}

async function render(props = {}) {
  const app = createSSRApp(UpcomingSchedule, {
    competitions: COMPETITIONS,
    platforms: PLATFORMS,
    schedule: SCHEDULE,
    autoSchedule: AUTO,
    today: TODAY,
    ...props,
  })
  app.directive('reveal', {}) // v-reveal 是 main.js 里全局注册的，SSR 下给个空实现
  return await renderToString(app)
}

/** 剥掉模板注释 —— Vue 的 dev 构建会**原样保留** <!-- -->，而我在模板里写了墓碑注释
    （例如「原先这里有个 .upcoming__head …，2026-10-02 取消」）。判「某元素还在不在」之前
    必须先剥注释，否则会把自己写的说明文字当成「元素还在」（2026-10-02 踩过）。 */
const bare = (html) => html.replace(/<!--[\s\S]*?-->/g, '')

/** ⚠ 曾经有个 `flat()`（剥标签后判「共 6 场待办」这类整句）—— 2026-10-02 那行数字改成仪表板后
    整句不复存在，它就没有调用点了。要看文字先用 `bare()` 剥注释与标签自己拼，别再加回来。 */

/** 取仪表板某一格的数字：`data-stat="total"` → `<em>场待办</em><b>6</b>`。
    ⚠ 按 `data-stat` 取数、**不按文案** —— 会长 2026-10-02 把那一行「共 6 场待办 · 本月 4 场 …」
    改成仪表板之后，同一件事的文案变成「场待办」+「6」两截分开渲染，按文案的断言整批失效。 */
const stat = (html, key) => {
  const m = new RegExp(`data-stat="${key}"[\\s\\S]*?<b>(\\d+)</b>`).exec(bare(html))
  return m ? Number(m[1]) : null
}

/** 仪表板某一格的**片段**（从 data-stat 锚点起截 `len` 个字符）。
    ⚠ 别用 `</span>` 配对去截整格：2026-10-02 起格子内部还有嵌套的 `<span>`（首字母圆片、名字），
    懒匹配会停在第一个内层闭合标签上。格子就这么大，定长窗口够用且不会误伤相邻格。 */
const statChunk = (html, key, len = 400) => {
  const at = bare(html).indexOf(`data-stat="${key}"`)
  return at < 0 ? '' : bare(html).slice(at, at + len)
}

/** 取某颗**范围开关**（全部 / 线下赛 / 线上赛）那一整段 HTML —— 判它的 aria-pressed 与 .active。
    这三颗没有 data-* 锚点，但按钮文本是唯一的，故按「>标签</button>」反着找最近的 `<button`。
    ⚠ 标签与 `</button>` 之间**有换行与缩进**（模板里是单独一行），不能用 `>标签</button>` 直接找 ——
    那样取到空串，断言会「假通过」（2026-10-02 踩过：`-1 < 下标` 恒真）。 */
const scopeChunk = (html, label) => {
  const src = bare(html)
  const m = new RegExp(`>\\s*${label}\\s*</button>`).exec(src)
  return m ? src.slice(src.lastIndexOf('<button', m.index), m.index) : ''
}

test('两张数据合并后真的渲染出表：手写优先、按日期升序、过期收起', async () => {
  const html = await render()

  // 手写那条赢了：自动层同赛事同日的「旧公告」不该出现
  assert.ok(html.includes('CCPC全国赛（长春）'))
  assert.ok(!html.includes('旧公告'), '手写层应顶掉同赛事同日的自动条目')

  // 顺序 = 开赛日升序（10-17 → 10-20 → 12-19）
  const order = ['CCPC全国赛（长春）', '蓝桥杯校内选拔赛', 'ICPC亚洲区域赛（南昌）'].map((t) => html.indexOf(t))
  assert.ok(order.every((i) => i > -1), '三场主表赛程都要在')
  assert.deepEqual(order, [...order].sort((a, b) => a - b), '必须按日期升序')

  // 已结束的自动收起，并在**页脚**说出来（会长 2026-10-02 先把它做成一格「已收起」放上仪表板，
  // 同一天又要求撤掉仪表板第一行 → 这条信息搬回页脚，页面上仍有一处说得清）
  assert.ok(!html.includes('已经比完的新生赛'), '过期场次不该渲染')
  assert.ok(html.includes('已自动收起 1 场结束的'), '收起几场要写在页脚（第一行撤掉后的落点）')

  // 月份分组；**当年**的场次不补年份、跨年的才补（见 scheduleView.test.mjs 的 formatRange）
  assert.ok(html.includes('10月'))
  assert.ok(html.includes('12月19日—20日'))
})

test('状态与角标按当天现算：报名优先、暂定、自动同步', async () => {
  const html = await render()
  assert.ok(html.includes('还有 16 天'), '10-17 距 10-01 十六天')
  assert.ok(html.includes('报名还剩 2 天'), '报名截止比开赛更近时应先提醒截止')
  assert.ok(html.includes('暂定'))
  assert.ok(html.includes('自动同步'))
})

test('线上赛不再折叠：与主表按日期混排，顶部给类型筛选 chips', async () => {
  const html = await render()
  assert.ok(!html.includes('<details'), '线上赛不该再收进折叠块（会长 2026-10-02：所有赛时都显示）')

  const atcoder = html.indexOf('AtCoder Beginner Contest 478')
  const main = html.indexOf('CCPC全国赛（长春）')
  assert.ok(atcoder > -1 && main > -1, '线上赛与主表比赛都要在表里')
  assert.ok(atcoder < main, '10-03 的线上赛排在 10-17 之前 —— 混排之后仍然按日期')

  // 筛选：**一整排**（2026-10-02 第四版 —— 会长：「我希望现在把各按钮放到一行，这样排布：
  // ICPC CCPC 传智杯 百度之星 线下 全部 线上 .....」）。
  // 顺序 = 线下赛事 chips →「线下赛」开关 →「全部」→「线上赛」开关 → 线上平台 chips。
  assert.ok(!html.includes('upcoming__cat-row-label'), '纯文本标签（线下赛事 / 线上平台）要删掉')
  assert.ok(!bare(html).includes('线上平台'), '「线上平台」这个纯文本标签不许再出现')
  assert.equal(
    (bare(html).match(/class="upcoming__cat-row"/g) || []).length,
    1,
    '只剩**一排**（第四版之前是「全部」独占一行 + 线下 / 线上各一行，共三排）'
  )

  // 一排之内分**三格**：左组（线下 chips +「线下赛」）｜「全部」｜右组（「线上赛」+ 平台 chips）。
  // 两个组容器**恒渲染**（哪怕组里空的）—— 少一个，中间那颗「全部」就跑到端头去了。
  const b = bare(html)
  assert.equal((b.match(/upcoming__cat-group--offline/g) || []).length, 1, '一个左组容器')
  assert.equal((b.match(/upcoming__cat-group--online/g) || []).length, 1, '一个右组容器')
  const allAt = b.indexOf('upcoming__cat--all')
  const offlineChunk = b.slice(b.indexOf('upcoming__cat-group--offline'), allAt)
  const onlineAt = b.indexOf('upcoming__cat-group--online')
  assert.match(offlineChunk, /线下赛\s*<\/button>/, '「线下赛」开关在左组里')
  assert.ok(!offlineChunk.includes('线上赛'), '左组里不该出现「线上赛」开关')
  assert.ok(onlineAt > allAt, '右组排在「全部」之后')
  assert.match(b.slice(onlineAt), /线上赛\s*<\/button>/, '「线上赛」开关在右组里')

  // ⚠ 比下标之前先确认**都找得到**：找不到时 -1 会让顺序断言恒真、假通过。
  // 也不能直接 indexOf('CCPC') —— 仪表板的赛事 / 平台格子里也写着「CCPC」「AtCoder」，
  // 而仪表板**排在筛选区之前**（实测下标 1321 对 4627，差 3300 字符），
  // 故这里锚在 chip 自己的 `upcoming__cat-text` / 开关自己的类上，不锚裸名字。
  const atRe = (label, re) => {
    const i = html.search(re)
    assert.ok(i > -1, `找不到「${label}」（找不到时 -1 会让顺序断言假通过）`)
    return i
  }
  const seq = [
    atRe('线下 chip（CCPC）', /upcoming__cat-text"[^>]*>CCPC<\/span>/),
    atRe('「线下赛」开关', /upcoming__cat--group[^>]*>\s*线下赛\s*<\/button>/),
    atRe('「全部」开关', /fa-check-double"><\/i>全部\s*<\/button>/),
    atRe('「线上赛」开关', /upcoming__cat--group[^>]*>\s*线上赛\s*<\/button>/),
    atRe('线上 chip（AtCoder）', /upcoming__cat-text"[^>]*>AtCoder<\/span>/),
  ]
  assert.deepEqual(
    seq,
    [...seq].sort((a, b) => a - b),
    '顺序必须是：线下 chips →「线下赛」→「全部」→「线上赛」→ 线上 chips（三颗开关夹在两拨中间）' +
      `；实测下标 ${JSON.stringify(seq)}`
  )
  assert.match(html, /upcoming__cat--group[^>]*>\s*线下赛\s*<\/button>/, '线下那颗开关写着「线下赛」')
  assert.match(html, /upcoming__cat--group[^>]*>\s*线上赛\s*<\/button>/, '线上那颗开关写着「线上赛」')
  // 线下那颗是**赛事**：fixture 里三场线下 = CCPC / 蓝桥杯 / 协会自办。club 在图标表里没有条目
  // （competitions.json 与 platforms.json 都没有它）→ 走 CONTEST_LABELS 的中文兜底名，
  // 不能把裸 slug「club」摆到页面上
  assert.match(html, /upcoming__cat[^>]*>[\s\S]{0,120}?CCPC/, 'CCPC 要自己占一颗 chip')
  assert.match(html, /upcoming__cat[^>]*>[\s\S]{0,120}?蓝桥杯/, '蓝桥杯要自己占一颗 chip')
  assert.match(html, /upcoming__cat[^>]*>[\s\S]{0,120}?协会自办/, '没图标的赛事用中文兜底名，不露出 slug')
  assert.ok(!html.includes('睿抗'), '会长 2026-10-02：睿抗的场次与它的 chip 都不许出现')
  // 两行的 chip 都要带 logo（会长 2026-10-02：「并且要显示 logo」）——
  // 同一个 logo 至少出现两次：一次在行首，一次在筛选 chip 上
  assert.ok(html.includes('class="upcoming__cat-logo"'), 'chip 上要有 logo 位')
  assert.ok(
    [...html.matchAll(/ccpc_logo\.png/g)].length >= 2,
    'CCPC 的 logo 既要在行首、也要在赛事 chip 上'
  )
  assert.ok([...html.matchAll(/atcoder\.png/g)].length >= 2, 'AtCoder 的 logo 也要上平台 chip')
  // 线上赛**按平台分开**（会长 2026-10-02：「线上赛要分平台」）
  assert.match(html, /upcoming__cat[^>]*>[\s\S]{0,120}?AtCoder/, 'AtCoder 要自己占一颗 chip')
  assert.match(html, /upcoming__cat[^>]*>[\s\S]{0,120}?牛客/, '牛客要自己占一颗 chip')
  assert.ok(
    !bare(html).includes('全部勾选'),
    '第三版起不再有「全部勾选…」这类动作按钮文本（改成行首的「线下赛」/「线上赛」开关）'
  )
  // chip 的选中色：线下取该赛事**最常见的类型色**（与行左边框同源），线上统一 --cat-online
  assert.ok(html.includes('--cat:var(--cat-online)'), '线上平台那几颗用线上赛的类型色')
  assert.ok(html.includes('--cat:var(--cat-reg)'), 'CCPC 那一颗取「区域赛·全国赛」的颜色')
})

test('筛选是多选、默认全勾；三颗范围开关是关联式选中（全勾才亮、点一下整组反转）', async () => {
  const html = await render()
  // ⚠ 只数 <button>：`upcoming__cat-dot` / `upcoming__cat-count` 也以 upcoming__cat 开头，
  //   光按 class 前缀匹配会多数出若干个（2026-10-02 踩过）
  const buttons = [...html.matchAll(/<button[^>]*class="upcoming__cat[^"]*"/g)].length
  const toggles = [...html.matchAll(/aria-pressed=/g)].length
  const pressed = [...html.matchAll(/aria-pressed="true"/g)].length
  // fixture：线下赛事 4（ICPC 1 / CCPC 1 / 蓝桥杯 1 / 协会自办 1）+ 线上平台 2（AtCoder / 牛客）
  // + 三颗范围开关（全部 / 线下赛 / 线上赛）—— 第三版起**三颗也是可勾选的开关**
  assert.equal(toggles, 9, '六颗标签 + 三颗范围开关，都带 aria-pressed')
  assert.equal(buttons, toggles, '页面上不再有「不带勾选态」的按钮')
  assert.equal(pressed, toggles, '默认全部勾选（会长：默认全部勾选）')
  assert.ok(!html.includes('aria-pressed="false"'), '默认状态下不该有未勾选的标签')

  // 三颗开关的文本、图标与默认形态（第三版：「按钮文本改成『线上赛』与『线下赛』」）
  assert.match(scopeChunk(html, '全部'), /fa-check-double/, '「全部」保留双勾图标')
  assert.ok(/active/.test(scopeChunk(html, '全部')), '默认全勾时「全部」自己是亮的')

  // 关联式选中：撤掉一颗**赛事** → 「线下赛」不亮、「线上赛」仍亮、「全部」不亮
  const noCcpc = await render({ initialExcluded: ['ccpc'] })
  assert.ok(!noCcpc.includes('CCPC全国赛（长春）'), '取消的赛事不显示')
  assert.ok(noCcpc.includes('蓝桥杯校内选拔赛'), '同类型的别家赛事不受影响（键是赛事不是类型）')
  assert.ok(noCcpc.includes('AtCoder Beginner Contest 478'), '线上赛也不受影响')
  assert.match(scopeChunk(noCcpc, '线下赛'), /aria-pressed="false"/, '少勾一颗 → 这一行的开关不亮')
  assert.match(scopeChunk(noCcpc, '线上赛'), /aria-pressed="true"/, '线上那组没动，仍然亮着')
  assert.match(scopeChunk(noCcpc, '全部'), /aria-pressed="false"/, '不是全勾 →「全部」不亮')

  // 取消「AtCoder」这一平台 → 只筛掉 AtCoder 那行，别的照旧
  const filtered = await render({ initialExcluded: ['atcoder'] })
  assert.ok(!filtered.includes('AtCoder Beginner Contest 478'), '取消勾选的平台不显示')
  assert.ok(filtered.includes('牛客周赛 Round 164'), '别的平台不受影响')
  assert.ok(filtered.includes('CCPC全国赛（长春）'), '取消一颗不该影响别的赛事')
  assert.ok(filtered.includes('勾选后显示 5 场'), '页脚要写明筛选后还剩几场')

  // 两个线上平台一起取消 → 只剩非线上那 4 场，且「线上赛」那颗开关跟着灭（关联式）
  const noOnline = await render({ initialExcluded: ['atcoder', 'nowcoder'] })
  assert.ok(!noOnline.includes('牛客周赛 Round 164'))
  assert.ok(noOnline.includes('勾选后显示 4 场'))
  assert.match(scopeChunk(noOnline, '线上赛'), /aria-pressed="false"/, '整组撤掉 → 它不亮')
  assert.match(scopeChunk(noOnline, '线下赛'), /aria-pressed="true"/, '另一组没动，照旧亮着')
  assert.match(scopeChunk(noOnline, '全部'), /aria-pressed="false"/)

  // 全部取消 → 三颗开关都灭，并给一句能照着做的提示（键就是各赛事 slug + 各平台 slug）
  const empty = await render({
    initialExcluded: ['atcoder', 'nowcoder', 'icpc', 'ccpc', 'lanqiao', 'club'],
  })
  assert.ok(empty.includes('upcoming__empty'), '标签全取消时要有空态提示')
  assert.ok(empty.includes('点上面的「全部」把标签勾回来'))
  assert.ok(!empty.includes('CCPC全国赛（长春）'))
  for (const label of ['全部', '线下赛', '线上赛']) {
    assert.match(scopeChunk(empty, label), /aria-pressed="false"/, `全取消时「${label}」不该亮着`)
  }
})

test('每行最前面是 logo：放大了、不套边框，没有图标的赛事给首字母方块', async () => {
  const html = await render()
  assert.ok(html.includes('upcoming__logo-slot'), '每行都要有行首 logo 槽')
  assert.ok(html.includes('/images/contest/ccpc_logo.png'), '有图标的赛事用真 logo')
  assert.ok(html.includes('/images/contest/atcoder.png'), '线上平台（platforms.json）也要有自己的 logo')
  assert.ok(html.includes('/images/contest/nowcoder.png'), '牛客行用牛客的 logo')
  // 协会自办（JCPC）两份数据里都没有图标 → 首字母方块，不能留白
  assert.match(html, /upcoming__logo-slot[^>]*><em>J<\/em>/, '没有 logo 的赛事要给首字母方块')

  const css = fs.readFileSync(SFC, 'utf8')
  const slot = /\.upcoming__logo-slot \{([^}]*)\}/.exec(css)
  assert.ok(slot, '找不到 .upcoming__logo-slot 的规则')
  assert.match(slot[1], /width:\s*96px/, '会长 2026-10-02：logo 要再大一些（上一版是 64px）')
  assert.ok(!/border/.test(slot[1]), 'logo 不该再被（半透明）边框包住')
  assert.ok(!/background/.test(slot[1]), '真 logo 透出卡片白底，槽本身不上底色')
})

test('平台图标的数据入口：platforms.json 由页面取、传给表与看板（不混进竞赛卡片网格）', () => {
  // 取数只有一条路径：useScheduleData（两个页面共用）。原先这里断的是 ContestView 里的
  // `useJson('/data/platforms.json')` —— 2026-10-02 拆出独立页后那份取数搬进了 composable。
  const composable = fs.readFileSync(
    path.join(ROOT, 'src', 'composables', 'useScheduleData.js'),
    'utf8'
  )
  assert.ok(composable.includes("'/data/platforms.json'"), '取 platforms.json 的唯一入口在 useScheduleData')

  for (const [rel, who] of [
    ['src/views/ContestView.vue', '看板'],
    ['src/views/UpcomingView.vue', '完整表'],
  ]) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    assert.match(src, /:platforms="platforms\?\.items \|\| \[\]"/, `${rel} 要把它当 props 传给${who}`)
  }

  // 图标文件必须真在仓库里 —— 取不到图不会报错，只会静默退化成首字母方块
  const plat = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'platforms.json'), 'utf8'))
  assert.deepEqual(
    plat.items.map((p) => p.slug),
    ['codeforces', 'atcoder', 'nowcoder'],
    '会长 2026-10-02 补的三个平台 logo'
  )
  for (const it of plat.items) {
    assert.ok(fs.existsSync(path.join(ROOT, 'public', it.image)), `${it.slug} 的图 ${it.image} 不在仓库里`)
  }
})

test('左边框指示比赛类型：不同赛事类型带不同的 --cat', () => {
  // 只读不改：色值来自 tokens.css 的 --cat-*，大事记与这张表共用一份
  const css = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingSchedule.vue'), 'utf8')
  assert.match(css, /border-left:\s*4px solid var\(--cat,/, '左边框要引类型色变量')
  const tokens = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8')
  for (const k of ['inv', 'reg', 'prov', 'net', 'final', 'tts', 'lanqiao', 'chuanzhi', 'baidu', 'raicom', 'school', 'club', 'online', 'other']) {
    assert.ok(tokens.includes(`--cat-${k}:`), `tokens.css 里缺 --cat-${k}`)
    assert.ok(tokens.includes(`--cat-${k}-soft:`), `tokens.css 里缺 --cat-${k}-soft`)
  }
  // 大事记那边必须引令牌，不能再写死十六进制（否则两页会各自漂移）
  const annals = fs.readFileSync(path.join(ROOT, 'src', 'views', 'AllActionView.vue'), 'utf8')
  assert.ok(annals.includes('.tl-card--reg { --cat: var(--cat-reg); }'), '大事记的类别色要引 tokens 令牌')
  assert.ok(!/\.tl-card--\w+ \{ --cat: #[0-9a-f]{6}; \}/.test(annals), '大事记不该再留写死的色值')
})

test('时间待定与页脚：待定块与抓取失败的源都在（右上角那行「数据更新」已撤掉）', async () => {
  const html = await render()
  assert.ok(html.includes('时间待定'))
  assert.ok(html.includes('2027 年 4 月中旬（拟定）'))
  // 会长 2026-10-02：看板与完整表右上角那行「手写 X月X日 · 官网自动同步 X月X日」去掉
  assert.ok(!html.includes('数据更新'), '不该再渲染「数据更新」那行')
  assert.ok(!html.includes('官网自动同步'), '两页都不要再出现这行字')
  assert.ok(html.includes('自动同步失败：CCPC'), '抓取失败的源必须让访客/维护者看得见')
})

test('加载态：两份数据都还在路上时不显示表，只显示骨架', async () => {
  const html = await render({ loading: true })
  assert.ok(html.includes('skeleton'))
  assert.ok(!html.includes('CCPC全国赛（长春）'), '加载中不该先把行渲染出来')
})

test('自动层整份缺失（离线构建 / 抓取全挂）时仍渲染手写层', async () => {
  const html = await render({ autoSchedule: {} })
  assert.ok(html.includes('CCPC全国赛（长春）'))
  assert.ok(!html.includes('AtCoder Beginner Contest 478'), '自动层不在场就不该有线上赛')
  assert.ok(!html.includes('--cat:var(--cat-online)'), '也不该出现「线上赛」那颗筛选 chip')
  assert.ok(!html.includes('暂未同步到'))
})

test('两份都空时给一句可读的话，而不是空白', async () => {
  const html = await render({ schedule: {}, autoSchedule: {} })
  assert.ok(html.includes('暂无已公布的近期赛程'))
})

/* ==========================================================================
   看板（竞赛信息页那一块，2026-10-02 新增）
   —— 独立页 /upcoming 放完整表，竞赛信息页只留这块「最近 3 场 + 统计」。
   同样靠 SSR 真渲染回归：整块是不是链接、列了几场、统计数字对不对，
   在沙箱里（起不了 vite）只有这一条路能验。
   ========================================================================== */
const UpcomingBoard = await loadSFC(path.join(ROOT, 'src', 'components', 'UpcomingBoard.vue'))

async function renderBoard(props = {}) {
  const app = createSSRApp(UpcomingBoard, {
    competitions: COMPETITIONS,
    platforms: PLATFORMS,
    schedule: SCHEDULE,
    autoSchedule: AUTO,
    today: TODAY,
    ...props,
  })
  app.directive('reveal', {})
  return await renderToString(app)
}

test('看板：整块白卡指向 /upcoming，2 场非线上 + 2 场线上，仪表板在卡片顶部', async () => {
  const html = await renderBoard()
  // SSR 里 RouterLink 没被注册（这个 harness 只编译单个 SFC），Vue 会把它原样渲成
  // `<RouterLink to="/upcoming">`；真跑起来是 `<a href="/upcoming">`。两种都认。
  assert.match(html, /(to|href)="\/upcoming"/, '看板白卡就是进详情页的链接（会长：点击进入详情页）')
  assert.ok(html.includes('查看完整赛程'))

  // 会长 2026-10-02：「我希望在竞赛信息页显示的应该是最近的 2 场线上和 2 场非线上赛」
  // fixture 合并后共 6 行（线上 2：10-03 / 10-04；非线上 4：10-17 / 10-20 / 11-09 / 12-19）
  const rows = [...html.matchAll(/class="board__row[^"]*"/g)].length
  assert.equal(rows, 4, '看板列 2 场非线上 + 2 场线上 = 4 行')
  for (const t of [
    'AtCoder Beginner Contest 478',
    '牛客周赛 Round 164',
    'CCPC全国赛（长春）',
    '蓝桥杯校内选拔赛',
  ]) {
    assert.ok(html.includes(t), `看板的 4 行里应该有「${t}」`)
  }
  assert.ok(!html.includes('JCPC 校内选拔赛'), '非线上第 3 场（11-09）不进看板')
  assert.ok(!html.includes('ICPC亚洲区域赛（南昌）'), '非线上第 4 场（12-19）也不进看板')

  // 仪表板（会长 2026-10-02 三条连着来：先在卡片顶部 →「做成类似仪表板的东西」→
  //   「线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」→「去除第一行的那些场待办 /
  //   本月 / 下月 / 报名中」）
  assert.ok(html.includes('sched-stats'), '仪表板要用共用的 .sched-stats（与完整表同一份样式）')
  assert.ok(html.indexOf('sched-stats') < html.indexOf('board__row'), '仪表板必须在第一行之前（卡片顶部）')
  assert.ok(html.indexOf('sched-stats') < html.indexOf('board__foot'), '也不该再留在页脚')
  // 「第一行」（时间与状态）整行撤掉 —— 那 6 格一个都不许再渲染
  for (const k of ['total', 'month', 'next', 'signup', 'closed', 'pending']) {
    assert.equal(stat(html, k), null, `状态格「${k}」随第一行一起撤掉了，别再渲染`)
  }
  // 会长 2026-10-02：「线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」——
  // 原先那格聚合的「线上赛（小字写平台分布）」被逐平台格取代了
  assert.equal(stat(html, 'online'), null, '聚合的「线上赛」格已撤掉，改成一格一个平台')
  assert.equal(stat(html, 'contest-icpc'), 1, '线下：一格一个赛事（ICPC 1 场，含自动层那场）')
  assert.equal(stat(html, 'contest-ccpc'), 1, '线下：CCPC 1 场')
  assert.equal(stat(html, 'contest-lanqiao'), 1, '线下：蓝桥杯 1 场')
  assert.equal(stat(html, 'contest-club'), 1, '线下：协会自办 1 场（JCPC）')
  assert.equal(stat(html, 'platform-atcoder'), 1, '线上：一格一个平台（AtCoder 1 场）')
  assert.equal(stat(html, 'platform-nowcoder'), 1, '线上：牛客 1 场')
  // 格子里的 logo：fixture 里 icpc / club 没配图标 → 走首字母圆片（同上一条「别留空格」）
  assert.match(statChunk(html, 'contest-ccpc'), /class="sched-stat__logo"/, 'CCPC 那格要带 logo 图')
  assert.match(statChunk(html, 'platform-atcoder'), /class="sched-stat__logo"/, 'AtCoder 那格要带 logo 图')
  assert.match(statChunk(html, 'contest-icpc'), /sched-stat__initial">I</, '没配图的赛事给首字母圆片（I）')
  assert.match(statChunk(html, 'contest-club'), /sched-stat__initial">协</, '协会自办没图 → 用中文首字')
  // 带 logo 的格子顶部色要跟着类型走（ICPC/CCPC 都是区域赛色，平台统一线上赛色）
  assert.match(statChunk(html, 'contest-ccpc'), /--cat-soft/, '赛事格的颜色变量要落到内联样式上')
})

test('看板版式与同页「全年赛程」统一：标题在卡外，字号/内边距/阴影照抄邻居', () => {
  const board = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingBoard.vue'), 'utf8')
  const sched = fs.readFileSync(path.join(ROOT, 'src', 'components', 'CompetitionSchedule.vue'), 'utf8')

  // 结构：<section> 里先 header、再一张 RouterLink 白卡
  // （会长 2026-10-02：「在『竞赛信息』页显示的看板要统一风格」—— 早先整块 section 就是链接、
  //   标题裹在卡里，与同页那张「全年赛程」不是一路）
  assert.match(
    board,
    /<section class="board"[\s\S]*?<header class="board__head"[\s\S]*?<RouterLink to="\/upcoming" class="board__card">/,
    '标题要在卡外、白卡只包内容'
  )
  assert.ok(board.includes('board__desc'), '要有与「全年赛程」同款的说明行')
  assert.ok(board.includes('--text-secondary'), '说明行用 --text-secondary（与邻居同一个变量）')

  // 同一组数值必须两边一致 —— 抄错了这一条就红，省得靠肉眼比对
  const one = (src, re) => re.exec(src)?.[1]
  assert.equal(
    one(board, /\.board__label \{[\s\S]*?font-size:\s*([^;]+);/),
    one(sched, /\.schedule__label \{[\s\S]*?font-size:\s*([^;]+);/),
    'h2 字号要与 .schedule__label 一致'
  )
  assert.equal(
    one(board, /\.board__desc \{[\s\S]*?font-size:\s*([^;]+);/),
    one(sched, /\.schedule__desc \{[\s\S]*?font-size:\s*([^;]+);/),
    '说明行字号要与 .schedule__desc 一致'
  )
  assert.equal(
    one(board, /\.board__card \{[\s\S]*?padding:\s*([^;]+);/),
    one(sched, /\.schedule__chart \{[\s\S]*?padding:\s*([^;]+);/),
    '卡内边距要与 .schedule__chart 一致'
  )
  assert.equal(
    one(board, /\.board__card \{[\s\S]*?box-shadow:\s*([^;]+);/),
    one(sched, /\.schedule__chart \{[\s\S]*?box-shadow:\s*([^;]+);/),
    '卡阴影要与 .schedule__chart 一致'
  )
})

test('看板：2 场非线上 + 2 场线上，两拨合起来仍按开赛日排（不是分成两段）', async () => {
  const html = await renderBoard()
  const order = [
    'AtCoder Beginner Contest 478',
    '牛客周赛 Round 164',
    'CCPC全国赛（长春）',
    '蓝桥杯校内选拔赛',
  ].map((t) => html.indexOf(t))
  assert.ok(order.every((i) => i > -1), '4 行都要在')
  assert.deepEqual(order, [...order].sort((a, b) => a - b), '按 10-03 / 10-04 / 10-17 / 10-20 排')

  // 两拨的条数各自受 props 控 —— 压到 1 就能看出来它们不是「先到先得的前 4 条」
  const one = await renderBoard({ limit: 1, onlineLimit: 1 })
  assert.equal([...one.matchAll(/class="board__row[^"]*"/g)].length, 2, '各 1 场 → 2 行')
  assert.ok(
    one.includes('AtCoder Beginner Contest 478') && !one.includes('牛客周赛 Round 164'),
    '线上那拨只取最近 1 场'
  )
  assert.ok(
    one.includes('CCPC全国赛（长春）') && !one.includes('蓝桥杯校内选拔赛'),
    '非线上那拨也只取最近 1 场（线上赛排在它前面也不许顶掉它）'
  )
})

test('看板：行首留了 logo 位（4 行都是真图标），左边框仍是类型色', async () => {
  const html = await renderBoard()
  // fixture 里这 4 行都有图标（CCPC / 蓝桥杯 / AtCoder / 牛客）——
  // 没图标那行（协会自办的 JCPC，走首字母方块）现在不占看板的行，
  // 那条路仍由完整表的用例钉着（见上面 `upcoming__logo-slot ... <em>J</em>`）。
  for (const p of ['ccpc_logo.png', 'lqb.png', 'atcoder.png', 'nowcoder.png']) {
    assert.ok(html.includes(p), `看板的 4 行都该有自己的图标：${p}`)
  }
  assert.ok(html.includes('--cat:var(--cat-reg)'), '左边框引类型色变量（与完整表、大事记共用 tokens）')
  assert.ok(html.includes('--cat:var(--cat-online)'), '线上赛那两行走线上赛的类型色')
})

test('仪表板：共用一个 ScheduleStats 组件（状态格 + 一格一赛事 + 一格一平台）', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'schedule-stats.css'), 'utf8')
  assert.match(css, /\.sched-stat \{[\s\S]*?flex-direction: column/, '一格竖排：标签在上、数字在下')
  assert.match(css, /border-top: 3px solid var\(--stat-color/, '指标色落在顶部那道 3px 上')
  // 「状态格」那 6 条色类 2026-10-02 随第一行一起撤了 —— 样式文件末尾那段「已撤」注释里
  // 原样列着，恢复时取消注释即可。故这里判「生效区」要先把 /* */ 注释整块剔掉：
  // 直接搜源码会被自己的墓碑注释判红（或反过来误判绿）。
  const liveCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const k of ['contest', 'platform']) {
    assert.ok(liveCss.includes(`.sched-stat--${k} {`), `全局样式里要有「${k}」这格的指标色`)
  }
  for (const k of ['total', 'month', 'next', 'signup', 'closed', 'pending']) {
    assert.ok(!liveCss.includes(`.sched-stat--${k} {`), `「${k}」那格的色类已随第一行撤掉，别留在生效区`)
  }
  assert.ok(!/sched-stat--wide/.test(liveCss), '「线上赛占两格」那套随聚合格一起撤掉，别留死样式')
  // 带 logo 的那条带要更宽 —— 挤窄了「Codeforces」会被截成「Codef…」（实测踩过）
  assert.match(
    liveCss,
    /\.sched-stats--catalog \{[\s\S]*?minmax\(1[2-9]\dpx/,
    '赛事/平台那条带的格子要明显宽于状态格，并排时不截断名字'
  )

  // 格子结构只有一份（2026-10-02 抽成组件）：会长再改口径时只会改这一个文件
  const stats = fs.readFileSync(path.join(ROOT, 'src', 'components', 'ScheduleStats.vue'), 'utf8')
  // 同理：判「渲染了什么」也要剔掉注释（文件头那段「已撤」说明里正列着那 6 格的恢复写法）
  const liveStats = stats.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
  for (const k of ['total', 'month', 'next', 'signup', 'closed', 'pending']) {
    assert.ok(!liveStats.includes(`data-stat="${k}"`), `「${k}」格整行撤掉后不该再渲染（恢复说明见文件头）`)
  }
  assert.ok(liveStats.includes('`contest-${c.slug}`'), '赛事格的 data-stat 是 contest-<slug>')
  assert.ok(liveStats.includes('`platform-${p.slug}`'), '平台格的 data-stat 是 platform-<slug>')
  assert.match(liveStats, /class="sched-stat__logo"/, '赛事/平台各一格都要显示 logo（会长原话）')
  assert.match(liveStats, /class="sched-stat__initial"/, '没图标的赛事给首字母圆片，别让那格空着')
  // 每一格都要是「小标签 + 大数字」两块，不是「共 N 场待办」那样把数字夹在文字里。
  // ⚠ 别拿负则 regex 去搜源码里有没有旧文案 —— 文件头与模板注释里引着旧写法，会命中自己的说明文字
  assert.match(
    liveStats,
    /data-stat="`contest-\$\{c\.slug\}`"[\s\S]*?<b>\{\{ c\.count \}\}<\/b>/,
    '赛事格要是「标签（logo + 名字）+ 数字」两块'
  )

  // ⚠ 2026-10-02 会长：「在近期比赛的详情页不要显示这个 class="sched-stats sched-stats--catalog
  //   upcoming__stats"」→ 仪表板从此是**看板专属**，完整表页 import 与模板都不许再挂它。
  const boardSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingBoard.vue'), 'utf8')
  assert.ok(boardSrc.includes("from './ScheduleStats.vue'"), '看板要 import 共用的 ScheduleStats')
  assert.ok(boardSrc.includes('<ScheduleStats'), '看板模板里要挂上它')
  assert.ok(!/<span[^>]*data-stat=/.test(boardSrc), '看板不该自己写格子（口径只留一处）')
  const fullSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingSchedule.vue'), 'utf8')
  // ⚠ 只看**生效区**：文件里刻意留了墓碑注释（引着被撤掉的类名），连注释一起搜必然假失败
  const fullLive = fullSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
  assert.ok(!fullLive.includes('ScheduleStats'), '完整表页不许再挂仪表板（import 与模板都已撤掉）')
  assert.ok(!fullLive.includes('upcoming__stats'), '那个类名也不该再出现在完整表的生效区里')
})

test('看板与完整表共用取数口径：图标表来自 scheduleView（日期戳已按会长要求撤掉）', () => {
  for (const rel of ['src/components/UpcomingBoard.vue', 'src/components/UpcomingSchedule.vue']) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    assert.ok(src.includes('buildIconIndex'), `${rel} 要从 scheduleView 取图标表，不要自己拼一张`)
    assert.ok(src.includes('scheduleStats'), `${rel} 的计数要走 scheduleView.scheduleStats，口径只有一份`)
    assert.ok(!src.includes('dataStamp'), `${rel} 不该再渲染「数据更新」那行（2026-10-02 撤掉）`)
    assert.ok(!/<span[^>]*class="sched-stat/.test(src), `${rel} 不该自己写格子（改口径只改一处）`)
    assert.ok(!/\.sched-stat b \{/.test(src), `${rel} 不该自己再写一份数字条样式`)
  }
  // 挂共用的 ScheduleStats 组件的只剩看板（完整表页 2026-10-02 撤掉了）
  const board = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingBoard.vue'), 'utf8')
  assert.ok(board.includes('ScheduleStats'), '看板要挂共用的 ScheduleStats 组件')
  assert.ok(board.includes('schedule-stats.css'), '看板注释里要指明那份共用样式的出处')
  const util = fs.readFileSync(path.join(ROOT, 'src', 'utils', 'scheduleView.js'), 'utf8')
  assert.ok(!/export function dataStamp/.test(util), 'dataStamp 连着函数一起删了，不留死代码')

  const index = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'index.css'), 'utf8')
  assert.ok(index.includes("'./schedule-stats.css'"), 'index.css 要引数字条那份样式（跨页复用）')
  const statsCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'schedule-stats.css'), 'utf8')
  assert.match(statsCss, /\.sched-stats \{/, '全局里要有 .sched-stats 的排版')
  assert.match(statsCss, /\.sched-stat b \{/, '数字加粗/等宽那条也在全局（两页同一个观感）')
})

test('完整表顶部：自带表头与仪表板都已取消，顶部直接就是筛选 chips', async () => {
  const html = await render()
  // 会长 2026-10-02：「upcoming__head 可以取消」—— 独立页 hero 已经写了同一个标题
  assert.ok(!bare(html).includes('upcoming__head'), '组件不该再自带表头（模板注释里提到不算）')
  assert.ok(!bare(html).includes('upcoming__label'), '标题块整组删掉（独立页 hero 承担）')

  // 会长 2026-10-02：「在近期比赛的详情页不要显示这个 class="sched-stats sched-stats--catalog
  //   upcoming__stats"」→ 整条带都不许再有（连「赛事与平台」那条也一起），类名也不许留
  assert.ok(!bare(html).includes('sched-stats'), '完整表页不该再有仪表板（一条带都不许有）')
  assert.ok(!bare(html).includes('upcoming__stats'), '那个类名也不该再出现')
  assert.equal(stat(html, 'contest-ccpc'), null, '一格一赛事 / 一格一平台也是仪表板的一部分，一起撤掉')
  assert.equal(stat(html, 'platform-atcoder'), null, '线上平台那格同理')

  const bi = bare(html).indexOf('upcoming__cat-row')
  const ri = bare(html).indexOf('upcoming__row')
  assert.ok(bi > -1, '筛选 chips 要在')
  assert.ok(bi < ri, '顶部现在直接就是筛选 chips（它排在表体之前）')

  // 「已收起」这条信息不能跟着仪表板一起丢 —— 由页脚接着说（下一条断言钉的就是它）
  assert.ok(html.includes('已自动收起 1 场结束的'), '页脚要接着说收起了几场')
  assert.ok(!html.includes('睿抗'), '睿抗仍不显示（会长 2026-10-02）')

  // 标题由独立页 hero 提供 —— 删了组件的表头之后，页面上仍要有一处写着「近期赛事」
  const view = fs.readFileSync(path.join(ROOT, 'src', 'views', 'UpcomingView.vue'), 'utf8')
  assert.ok(view.includes('page-hero') && view.includes('近期'), '独立页 hero 要承担标题与说明')
})

test('动画口径与站内统一：逐行错位入场、悬停照抄大事记、离开时收高让下方上移', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingSchedule.vue'), 'utf8')
  // 只看**生效区**：CSS 注释、模板注释、脚本块注释里都引着旧写法（说明文字不算数）
  const liveCss = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
  const liveTpl = liveCss

  // ① 入场：**每一行各自 v-reveal**（会长 2026-10-02 两轮反馈的折中）。
  //    第一轮他说「35 行逐条错位淡入太慢」→ 我收成「整块一次」，第二轮他立刻说
  //    「现在怎么什么动画都没了」：整块入场在这张 4000px 长的表里**只有 1 个入场元素**，
  //    加载那一瞬淡完、往下滚就再没有动画了。结论：入场还给每一行。
  assert.match(liveTpl, /v-reveal="'fade-up'"[\s\S]{0,200}class="upcoming__row"/, '行要自己 v-reveal')
  assert.ok(!liveTpl.includes('upcoming__body'), '.upcoming__body（整块入场的挂点）不许再回来')
  assert.match(liveTpl, /v-for="\(row, i\) in g\.rows"/, '行要拿到分组内下标（错位序号靠它）')
  assert.match(liveTpl, /:style="rowStyle\(row, i\)"/, '行样式要把下标传进去')

  // ② 逐行出现的错位：**只能压在 animation-delay 上**（第三轮会长「我希望仍然有逐一出现的动画」）
  //    前半句能成立的全部理由都在这几条断言里：序号封顶 + 动画延迟 + 行上不许有 transition-delay。
  //    ⚠ 为什么不是 transition-delay：行自带 transition 简写（悬停要弹簧），transition-delay 会把
  //      悬停上浮一起延迟（序号 4 的行悬停要等 0.4s 才抬起）—— 那正是第一版被撤掉的原因。
  assert.match(liveCss, /const ROW_STAGGER_MAX = 4/, '错位序号封顶 4（最大等 0.4s）')
  assert.match(
    liveCss,
    /'--reveal-index': Math\.min\(i, ROW_STAGGER_MAX\)/,
    'rowStyle 要给 CSS 一枚封顶后的 --reveal-index'
  )
  assert.match(liveCss, /@keyframes upcoming-row-in \{[\s\S]*?opacity: 0;[\s\S]*?transform: translateY\(24px\);/, '入场动画的 from 帧')
  assert.match(
    liveCss,
    /\.upcoming__row\.is-visible \{\s*\n\s*animation: upcoming-row-in 0\.5s cubic-bezier\(0\.22, 1, 0\.36, 1\) backwards;\s*\n\s*animation-delay: calc\(var\(--reveal-index, 0\) \* 0\.1s\);/,
    '入场动画要按序号延迟，且 fill-mode 必须是 backwards（否则延迟期间会先亮一下）'
  )
  assert.ok(
    !/\.upcoming__row \{[\s\S]*?transition-delay/.test(liveCss),
    '行的 transition 里不许出现 transition-delay（会把悬停上浮一起延迟）'
  )
  //    ⚠ 行的 transition 简写里**必须有 opacity**：它特异性高于 base.css 的 `[data-reveal]`，
  //    漏了 opacity 就只有上滑、没有淡入（探针逐帧采样抓到的：opacity 一直 0、一帧跳到 1）。
  assert.match(
    liveCss,
    /\.upcoming__row \{[\s\S]*?transition: transform var\(--transition-spring\)[\s\S]*?opacity 0\.7s ease;/,
    '行的过渡必须带 opacity，否则 fade-up 只剩位移、淡入是瞬跳'
  )

  // ③ 悬停：与大事记 .tl-card 逐条同源（弹簧曲线 / 抬 3px / 主色调投影）
  assert.match(
    liveCss,
    /\.upcoming__row \{[\s\S]*?transition: transform var\(--transition-spring\)/,
    '行的上浮要跟大事记卡片一样走弹簧曲线'
  )
  assert.match(liveCss, /\.upcoming__row:hover \{[\s\S]*?transform: translateY\(-3px\)/, '抬 3px（与 .tl-card 同值）')
  assert.match(
    liveCss,
    /\.upcoming__row:hover \{[\s\S]*?0 10px 32px rgba\(26, 115, 232, 0\.07\)/,
    '投影用大事记那支主色调（原先的中性 var(--shadow-md) 已换掉）'
  )
  const allAction = fs.readFileSync(path.join(ROOT, 'src', 'views', 'AllActionView.vue'), 'utf8')
  assert.match(allAction, /translateY\(-3px\)/, '站内基准（大事记 .tl-card）仍然是抬 3px —— 别只改一边')

  // ④ 筛选：进去淡入；出去**淡出 + 把自己的盒收成 0 高**，于是下面的行每帧跟着上移
  //    （会长第三轮：「有卡片离开时，下方的卡片应该向上运动到最终位置」）
  //    ⚠ 别改成「靠 TransitionGroup 的 -move(FLIP)」：实测它不触发 —— leave 期间离开的行仍然占位，
  //      而 Vue 只在数据变更那次渲染比对位置、DOM 移除发生在 leave 结束的回调里
  //      （探针 anim2-check.mjs 第 ⑥ 步：0 个 -move 类、下方行 top 一动不动）。
  assert.match(liveTpl, /<TransitionGroup name="upcoming-fade" tag="div"/, '月份分组要有过渡组')
  assert.match(
    liveTpl,
    /<TransitionGroup name="upcoming-fade" tag="ul" class="upcoming__list" :duration="\{ enter: 200, leave: 300 \}">/,
    '行列表要有过渡组，并把移除时机钉死（别让 Vue 猜 transitionend）'
  )
  assert.match(
    liveCss,
    /\.upcoming__row\.upcoming-fade-leave-active \{[\s\S]*?overflow: hidden;[\s\S]*?max-height: 0;[\s\S]*?transition: max-height 0\.3s ease, padding 0\.3s ease, opacity 0\.18s ease;/,
    '离开时要把盒收成 0（overflow 必须 hidden，否则收不下去）'
  )
  assert.match(
    liveCss,
    /\.upcoming__row\.upcoming-fade-leave-active \{[\s\S]*?padding-top: 0;[\s\S]*?padding-bottom: 0;/,
    '只收 max-height 会在底部留下 24px 空壳，内边距也要一起收'
  )
  // 收高的过渡需要一个可过渡的起点：基类 200px（桌面行 122px）、≤576 断点 260px（堆叠后最高 178px）
  assert.match(liveCss, /\.upcoming__row \{[\s\S]*?max-height: 200px;/, '桌面档 max-height 起点 200px')
  assert.match(liveCss, /@media \(max-width: 576px\) \{[\s\S]*?\.upcoming__row \{[\s\S]*?max-height: 260px;/, '窄屏档起点 260px')
  assert.match(liveCss, /\.upcoming-fade-move \{/, '月份分组的 FLIP 兜底还在（行不用它）')
  const base = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'base.css'), 'utf8')
  assert.match(base, /\.nested-fade-enter-active \{ transition: opacity 0\.2s ease; \}/, '站内先例还在（进场的 0.2s 就是照它写的）')

  // chips 的过渡属性列表要和大事记 .cat-chip 一样四个 —— 漏了 box-shadow，选中态投影会「啪」地跳出来
  const catRule = /\.upcoming__cat \{[\s\S]*?\}/.exec(liveCss)?.[0] || ''
  for (const prop of ['border-color', 'background', 'color', 'box-shadow']) {
    assert.match(catRule, new RegExp(`${prop} var\\(--transition-fast\\)`), `chip 过渡要含 ${prop}`)
  }
})

test('独立页与入口：路由、页脚、看板三处对得上（顶部导航有意不加）', async () => {
  const router = fs.readFileSync(path.join(ROOT, 'src', 'router.js'), 'utf8')
  assert.match(router, /path:\s*'\/upcoming'/, '要有 /upcoming 路由')
  assert.match(router, /views\/UpcomingView\.vue/, '路由要指向 UpcomingView')

  // 会长 2026-10-02 选的是「只加页脚，不动顶部导航」
  const nav = fs.readFileSync(path.join(ROOT, 'src', 'data', 'navigation.js'), 'utf8')
  const [navPart, footerPart] = nav.split('export const footerLinks')
  assert.ok(!navPart.includes("'/upcoming'"), '顶部导航不该有它')
  assert.ok(footerPart.includes("'/upcoming'"), '页脚要有它（兜底入口）')

  // 竞赛信息页：只剩看板，完整表搬去独立页
  const contest = fs.readFileSync(path.join(ROOT, 'src', 'views', 'ContestView.vue'), 'utf8')
  assert.ok(contest.includes('UpcomingBoard'), '竞赛信息页要用看板')
  assert.ok(!contest.includes('UpcomingSchedule'), '完整表不该再由竞赛信息页渲染')
  assert.ok(contest.includes('useScheduleData'), '两个页面共用同一取数入口')

  // 独立页真的把完整表渲染出来了（不是只挂了个空壳）
  const view = fs.readFileSync(path.join(ROOT, 'src', 'views', 'UpcomingView.vue'), 'utf8')
  assert.ok(view.includes('<UpcomingSchedule'), '独立页里要有完整表')
})

test('筛选排布：居中 / 贴右不许用 auto 边距，悬停不许冲掉选中态（2026-10-02 会长反馈的回归）', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingSchedule.vue'), 'utf8')
  // 只看**生效区**：规则上方与文件头都引着旧写法（说明文字不算数）
  const liveCss = src.replace(/\/\*[\s\S]*?\*\//g, '')

  // ①「我希望两个行都应该居左」+「我希望『全部』居中、线上平台部分居右」——
  //    位置一律由**结构**决定，不许用 auto 边距顶：auto 边距分的是空白，中间那颗「全部」
  //    会被左右两组的宽度差带偏（实测左组 490px、右组 408px → 能偏 41px）。
  //    踩过的坑两层：源码里早就删了 auto 边距，但浏览器仍在跑两版之前的样式
  //    （vite 的样式块 HMR 漏了），所以「源码删了」不等于「页面改了」；当时的证据是
  //    margin-left 被 flex 解析成 160.188px、开关 x=213 而行首 x=53。
  assert.ok(!/margin-left:\s*auto/.test(liveCss), '不许有 margin-left: auto（会把整排推歪）')
  assert.match(
    liveCss,
    /\.upcoming__cat-group \{[\s\S]*?flex:\s*1 1 0/,
    '左右两组必须等宽（flex: 1 1 0）—— 这才是「全部」居中的依据'
  )
  assert.match(liveCss, /\.upcoming__cat-group--offline \{[\s\S]*?justify-content:\s*flex-start/, '左组内容居左')
  assert.match(liveCss, /\.upcoming__cat-group--online \{[\s\S]*?justify-content:\s*flex-end/, '右组（线上平台）贴右')
  assert.ok(!/margin:\s*0 3px/.test(liveCss), '第四版那条「三颗开关 margin: 0 3px」该删干净（位置改由结构决定）')
  // 窄到一行放不下时两组必须退回单流折行（display: contents 让子元素直接参与整排排布）——
  // 否则两组各自折行，会得到「全部孤零零一行 + 末行只剩一个按钮」（实测 1024 宽：牛客独自一行）
  assert.match(
    liveCss,
    /@media \(max-width: 1340px\)[\s\S]*?\.upcoming__cat-group \{[\s\S]*?display:\s*contents/,
    '≤1340px 要给两组 display: contents（窄屏单流折行的兜底，别删）'
  )
  // 三颗范围开关的**下限宽度**（会长「我希望『线下赛』『线上赛』『全部』的按钮都宽一些」）：
  // 96px ≈ 最小的那颗 chip（牛客 86px）；加宽会让整排变长，1340 这个断点就是被它顶上来的
  assert.match(liveCss, /\.upcoming__cat--all,[\s\S]*?\.upcoming__cat--group \{[\s\S]*?min-width:\s*96px/, '三颗开关的下限宽度要在（96px）')
  assert.match(liveCss, /\.upcoming__cat--all,[\s\S]*?\.upcoming__cat--group \{[\s\S]*?justify-content:\s*center/, '有了下限宽度，文字要居中（默认 flex-start 会靠左）')

  // ②「悬停在高亮的按钮上时，文本会看不见」—— hover 与 .upcoming__cat.active 特异性**相同**
  //    （两个类选择器），源序在后的赢：选中时一悬停就把实底冲成近白，而 color:#fff 留着不动。
  //    故必须拆成「未选中的 hover」与「选中的 hover」两条，后者用更深的主色。
  assert.match(liveCss, /\.upcoming__cat--(all|group):not\(\.active\):hover/, '未选中的 hover 才配浅蓝底')
  assert.match(
    liveCss,
    /\.upcoming__cat--(all|group)\.active:hover[\s\S]*?var\(--primary-dark\)/,
    '选中的 hover 要换成深一档的主色（--primary-dark），白字才一直看得见'
  )
})

test('chip 里白圆与胶囊同心同曲率（会长：「圆形 logo 组件与胶囊圆角匹配」）', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'components', 'UpcomingSchedule.vue'), 'utf8')
  const liveCss = src.replace(/\/\*[\s\S]*?\*\//g, '') // 只判生效区：注释里引着旧写法

  // 四个数要构成同心圆角：内圆角 = 外圆角 − 圆环，其中圆环 = 胶囊边框 + 胶囊内边距。
  const logo = Number(/--cat-logo:\s*(\d+)px/.exec(liveCss)?.[1])
  assert.ok(logo > 0, '白圆总尺寸要由一个 --cat-logo 变量定，不能在宽度/高度/推导里各写一遍')

  const chipBlock = /\.upcoming__cat \{[\s\S]*?\n\}/.exec(liveCss)?.[0] || ''
  const chipPad = Number(/padding:\s*(\d+)px/.exec(chipBlock)?.[1]) // 上下内边距
  const chipBorder = Number(/border:\s*(\d+)px solid/.exec(chipBlock)?.[1])
  const logoBlock = /\.upcoming__cat-logo \{[\s\S]*?\n\}/.exec(liveCss)?.[0] || ''
  const imgPad = Number(/padding:\s*(\d+)px/.exec(logoBlock)?.[1])
  const offset = Number(/width:\s*calc\(var\(--cat-logo\) - (\d+)px\)/.exec(logoBlock)?.[1])

  assert.ok(chipPad > 0 && chipBorder > 0 && imgPad > 0, '这四个数都要能解析出来（正则改了记得同步这里）')
  assert.equal(offset, 2 * imgPad, '白圆的「总尺寸 − 内边距×2」才是真图尺寸，别把白边算漏')

  const chipH = logo + 2 * chipPad + 2 * chipBorder // 胶囊高：白圆 + 上下内边距 + 上下边框
  const outerR = chipH / 2 // --radius-full 被浏览器夹到短边的一半
  const innerR = logo / 2
  assert.equal(
    outerR - innerR,
    chipBorder + chipPad,
    `内圆角(${innerR}) 应恰好比外圆角(${outerR}) 小一个圆环(${chipBorder + chipPad})：` +
      `白圆 ${logo}px、胶囊 ${chipH}px（内边距 ${chipPad} + 边框 ${chipBorder}）。改了 --cat-logo 就要同步内边距，否则两个曲率又不一路`
  )

  // 白圆必须用**与胶囊同一个圆角令牌**；写死 50% 就是这一版之前的错（半径 10px vs 端头 16px）
  assert.match(logoBlock, /border-radius:\s*var\(--radius-full\)/, '白圆圆角要走 --radius-full，与胶囊同源')
  assert.ok(!/border-radius:\s*50%/.test(logoBlock), '别再写死 50%（曲率对不上就是这么来的）')
  assert.match(logoBlock, /box-sizing:\s*content-box/, 'content-box 才能让「总尺寸 = 宽高 + 白边」成立')

  // 圆心重合靠的是胶囊左侧不留多余内边距：左 1px = 边框，与上下同一个圆环宽度
  assert.match(chipBlock, /padding:\s*1px 11px 1px 1px/, '带 logo 的 chip 左边只留 1px（白圆贴住端头）')
  // 没有白圆的开关（全部 / 线下赛 / 线上赛）左右都留 11px，高度靠 min-height 追平
  assert.match(liveCss, /\.upcoming__cat--all,[\s\S]*?\.upcoming__cat--group \{[\s\S]*?padding:\s*1px 11px/, '文字型开关左右都留 11px')
  assert.match(chipBlock, /min-height:\s*calc\(var\(--cat-logo\)/, '文字型开关靠 min-height 与带 logo 的等高，否则一排 chip 高矮不齐')
})

test('本次改动过的 SFC 都还能编译（沙箱里起不了 vite，这是替代的语法闸门）', () => {
  // 只编译、不 import：ContestView / UpcomingView 会 import 别的 .vue + 用到 RouterLink，
  // node 直接 import 会失败，但「模板与 <script setup> 有没有语法错」在编译期就能查出来 ——
  // 正是这台机器上 `npm run build`（spawn EPERM）查不了的那部分。
  for (const rel of [
    'src/components/UpcomingSchedule.vue',
    'src/components/UpcomingBoard.vue',
    'src/components/ScheduleStats.vue',
    'src/components/CompetitionSchedule.vue',
    'src/views/ContestView.vue',
    'src/views/UpcomingView.vue',
  ]) {
    const file = path.join(ROOT, rel)
    const { descriptor, errors } = parse(fs.readFileSync(file, 'utf8'), { filename: file })
    assert.deepEqual(errors, [], `${rel} 解析失败`)
    const compiled = compileScript(descriptor, { id: 'gate', inlineTemplate: true })
    assert.ok(compiled.content.includes('export default'), `${rel} 编译产物里没有组件定义`)
  }
})
