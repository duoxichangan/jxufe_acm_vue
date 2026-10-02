/**
 * 显示排名的计分口径回归集（node --test，零依赖，不需要构建）。
 *
 * 为什么要有它：这套口径一直只靠手工核验，2026-09-24 那次审查里我因此得出过三个错结论
 * （把真值 5.00 的手写条目当成 0 分、漏掉 `normalizeHonors()` 从文字推断出的
 *  `type: 'contest'` 路径、据此算出的整张名次表偏低）。下面每个数字都是**实测钉住的**，
 * 改动口径时它会立刻报警，逼人确认「这次改的是故意的」。
 *
 * 跑法：`npm test`（或 `npm run verify` = data:check + test）
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { AWARD_FILES, XCPC_MODE, mergeXcpc } from '../src/utils/contestTaxonomy.js'
import { collectRecords, MANUAL_PILLS, buildHonorPills } from '../src/utils/honorPills.js'
import {
  rankMembers,
  rankWithTimeout,
  scoreManualContest,
  scoreManualPill,
  scorePerson,
  LEVEL_WEIGHT,
  LEVEL_FALLBACK,
  NON_SCORING_TIERS,
} from '../src/utils/honorRanking.js'
import { normalizeHonors } from '../src/utils/honorType.js'
import { isCoveredByPills, stripCoveredHonors } from '../src/utils/honorCoverage.js'

const read = (p) => JSON.parse(fs.readFileSync(new URL(`../public/data/${p}`, import.meta.url), 'utf8'))
/** 浮点表算出的值常有 2.4000000000000004 这种尾巴 —— 比到 1e-9 就够 */
const near = (actual, expected, msg) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${msg}：实测 ${actual}，期望 ${expected}`)

/* ── 与 gen_group_wall.mjs 同构地重建「综合分池」────────────────────────
   分数口径必须与墙上/优秀成员页看到的完全一致，否则这份回归集毫无意义。
   对应 gen_group_wall.mjs:313-338（scoreKeyOf / scorePool / rankMembers）。 */
const awards = Object.fromEntries(AWARD_FILES.map((f) => [f, read(`awards/${f}.json`)]))
const competitions = read('competitions.json')
const membersJson = read('members.json')
const leadersJson = read('leaders.json')
const scholarshipPeople = read('scholarships.json').people || {}
const group = read('group_members.json')

const siteHonors = new Map()
const addSite = (name, list) => {
  if (!name) return
  if (!siteHonors.has(name)) siteHonors.set(name, [])
  siteHonors.get(name).push(...(Array.isArray(list) ? list : []))
}
for (const m of membersJson) addSite(m.name, m.honors)
for (const l of leadersJson) addSite(l.name, l.achievements)
for (const [name, list] of Object.entries(scholarshipPeople)) addSite(name, list)

/** gen_group_wall.mjs:205-211 的 manualHonorsOf：群昵称侧 honors + 站点两份名单 → 剥覆盖 → 归一化 */
const manualHonorsOf = (m) =>
  normalizeHonors(
    stripCoveredHonors([...(m.honors || []), ...(m.realName ? siteHonors.get(m.realName) || [] : [])])
  )

const scoreKeyOf = (m) => String(m.realName || m.name || '').trim()
const pool = new Map()
for (const m of group.members || []) {
  const key = scoreKeyOf(m)
  if (key && !pool.has(key)) pool.set(key, { name: key, honors: manualHonorsOf(m) })
}
for (const p of [...membersJson, ...leadersJson]) {
  const key = String(p?.name || '').trim()
  if (!key || pool.has(key)) continue
  pool.set(key, { name: key, honors: manualHonorsOf({ name: key, realName: key }) })
}
for (const name of Object.keys(scholarshipPeople)) {
  const key = String(name).trim()
  if (!key || pool.has(key)) continue
  pool.set(key, { name: key, honors: manualHonorsOf({ name: key, realName: key }) })
}

const records = collectRecords({ awards, competitions })
const { rows, byName } = rankMembers({
  members: [...pool.values()],
  recordsByName: records,
  manualPills: MANUAL_PILLS,
})

const totalOf = (name) => (byName.get(name) ? byName.get(name).total : null)

/* ── 1. 手写条目的档位口径（含「优秀奖不计分」这条 2026-09-24 的裁定）── */
test('手写条目 → 分值：优秀奖/优胜奖 0，档位与倍率照旧', () => {
  const c = (t) => scoreManualContest(t)

  // 优秀奖必须落在「不计分」而不是「参赛 0.6」——写了档位就不是「只写了赛事名」
  assert.equal(c('第十五届蓝桥杯国家级优秀奖').points, 0)
  assert.match(c('第十五届蓝桥杯国家级优秀奖').label, /不计分/)
  assert.equal(c('优胜奖').points, 0)

  // 复合条目：优秀奖不计分，但里面的省一等奖照计（5.00 = 蓝桥 0.5 × 一等 10）
  near(c('第十六届蓝桥杯国家级优秀奖、省一等奖').points, 5, '复合条目')

  near(c('ICPC区域赛 *4').points, 1.5198, '参赛分支（×4）')
  near(c('数学建模 M 奖').points, 0.6, '数学建模 M 奖')
  near(c('省赛季军').points, 2.4, '省赛季军')
  near(c('省赛季军+首刀').points, 2.9, '省赛季军+首刀')
  near(c('csp 满分').points, 3, 'csp 满分')
  near(c('2024 ICPC 江西省赛季军').points, 2.4, '名次类条目（胶囊表达不了，保留）')
})

/* ── 2. 手工胶囊：按分段数组计分（旧代码用逗号黏成一整串）── */
test('手工胶囊按分段计分，整串入参保持旧口径', () => {
  // MANUAL_PILLS 的真实形状是「一枚胶囊 = 一个分段数组」；系列从整枚认、档位逐段认
  near(scoreManualPill(MANUAL_PILLS.vesper[0]).points, 3.5, 'vesper 那枚胶囊（分段数组）')
  assert.equal(scoreManualPill(MANUAL_PILLS.vesper[0]).count, 2)
  // 整串入参（旧口径）必须逐位不变，否则历史数据会跟着变
  near(scoreManualPill('xCPC 邀请赛🥉1 省赛🥇1').points, 6.05, '同为整串时的旧口径')
  near(scoreManualPill(['xCPC 区域赛🥈2', '省赛🥉1']).points, 9.1, '区域赛+省赛分段')
})

/* ── 3. 权重表：天梯省赛 = 蓝桥省赛（会长 2026-09-24 裁定）── */
test('权重表：gplt|省赛 与 lanqiao|省赛 同值，且两键都存在', () => {
  assert.equal(LEVEL_WEIGHT['gplt|省赛'], 0.12)
  assert.equal(LEVEL_WEIGHT['lanqiao|省赛'], 0.12)
  // 缺键会静默落进 LEVEL_FALLBACK(0.1)，这是本表最容易出的错
  assert.notEqual(LEVEL_WEIGHT['gplt|省赛'], LEVEL_FALLBACK)
  assert.ok(NON_SCORING_TIERS.test('优秀奖') && NON_SCORING_TIERS.test('优胜奖'))
})

/* ── 4. 优秀奖：显示保留、计分 0（上游是裸渲染，被「覆盖」吃掉就是整条消失）── */
test('优秀奖条目：胶囊覆盖不了它，所以显示保留；计分为 0 而不是 0.6', () => {
  assert.equal(isCoveredByPills('第十五届蓝桥杯国家级优秀奖'), false)
  // 复合条目仍然被遮蔽：放行整条会让里面的奖牌主张白拿一次分
  assert.equal(isCoveredByPills('第十六届蓝桥杯国家级优秀奖、省一等奖'), true)
  // 名次类条目与职务条目都不该被遮蔽
  assert.equal(isCoveredByPills('2024 ICPC 江西省赛季军'), false)
  assert.equal(isCoveredByPills('程序设计竞赛协会组织部负责人'), false)

  // 走真实路径：normalizeHonors 会把这条文字推断成 type:'contest'
  const honor = normalizeHonors(['第十五届蓝桥杯国家级优秀奖'])
  assert.equal(honor[0].type, 'contest')
  near(scorePerson({ name: '探针', honors: honor }).total, 0, '优秀奖单人总分')
})

/* ── 5. 单人分值快照（真实路径：群昵称 honors + 站点名单 + 记录 + MANUAL_PILLS）── */
/** 按显示精度比对（容差半个末位）—— 表算出来的原始值常有 38.581 / 21.305 这种尾巴 */
const near2 = (actual, expected, msg) =>
  assert.ok(Math.abs(actual - expected) < 0.005, `${msg}：实测 ${actual}，期望约 ${expected}`)

test('单人分值快照（13 人）', () => {
  const expected = {
    石翰林: 38.58,
    万俊哲: 37.16,
    黄亦诚: 32.54,
    张云菲: 25.06,
    陈帆: 23.26,
    肖俊杰: 21.3,
    王海峰: 21.24,
    彭俊杰: 19.76,
    钟明皓: 13.51,
    罗文轩: 12.44,
    vesper: 9.5,
    陶金杰: 9.39,
    邓一帆: 8.49,
  }
  for (const [name, total] of Object.entries(expected)) {
    const actual = totalOf(name)
    assert.notEqual(actual, null, `${name} 不在综合分池里`)
    near2(actual, total, name)
  }
})

/* ── 6. 名次快照 ── */
test('综合分池：≥5 分的人与顺序', () => {
  const leaderNames = new Set(leadersJson.map((l) => l.name))
  const over5 = rows.filter((r) => r.total >= 5)
  const leaderCount = over5.filter((r) => leaderNames.has(r.name)).length
  const top = over5
    .slice(0, 10)
    .map((r) => `${r.name} ${r.total.toFixed(2)}`)
    .join(' | ')
  console.log(
    `[快照] 综合分池 ≥5 分 ${over5.length} 人（含 ${leaderCount} 位会长；优秀成员页会再跳过会长、并要求有头像）`
  )
  // 全池前 10。会长在前 10 里是**对的**：优秀成员页按规则跳过他们、另在负责人页显示
  assert.equal(
    top,
    '石翰林 38.58 | 万俊哲 37.16 | 黄亦诚 32.54 | 张云菲 25.06 | 陈帆 23.26 | 衷铭川 22.57 | 王玛琪 22.33 | 肖俊杰 21.30 | 王海峰 21.24 | 李梦豪 21.04'
  )
  assert.ok(over5.length >= 44, `≥5 分的人数不该少于 44（实测 ${over5.length}）`)
})

/* ── 7. 墙上被胶囊吃掉的手写条目数（优秀奖修复把它从 87 降到 85）── */
test('墙上手写条目：被胶囊覆盖吃掉的条数 = 85', () => {
  let before = 0
  let after = 0
  for (const g of group.members || []) {
    const real = String(g.realName || '').trim()
    const list = [...(g.honors || []), ...(real ? siteHonors.get(real) || [] : [])]
    before += list.length
    after += stripCoveredHonors(list).length
  }
  assert.equal(before - after, 85)
  // 邓一帆那条优秀奖必须留在墙上（显示保留、计分 0）
  const deng = manualHonorsOf(group.members.find((m) => String(m.realName || '') === '邓一帆'))
  assert.ok(deng.some((h) => h.text.includes('优秀奖')), '邓一帆的蓝桥优秀奖应当在墙上')
})

/* ── 8. 胶囊聚合的规模快照 ── */
test('胶囊：人名数 1795，vesper 那枚在', () => {
  const pills = buildHonorPills({ awards, competitions })
  assert.equal(pills.size, 1795)
  assert.deepEqual(pills.get('vesper'), ['xCPC 邀请赛🥉1 省赛🥇1'])
})

/* ── 9. xCPC 合并判据只有一条（mode === 'xcpc'）── */
test('xCPC 合并：判据、子项、奖项文件都由 competitions.json 决定', () => {
  const comps = read('competitions.json')
  const xcpc = mergeXcpc(comps)
  assert.equal(xcpc.slug, 'xcpc')
  assert.equal(xcpc.mode, XCPC_MODE)
  assert.equal(xcpc.isXcpc, true, '首页卡片模板靠它分支')
  assert.deepEqual(xcpc.children.map((c) => c.slug), ['icpc', 'ccpc'])
  // 奖项文件列表不再写死，而是各项自带的 awards 拼出来
  assert.deepEqual(xcpc.awards, ['icpc', 'ccpc'])
  assert.deepEqual(xcpc.awards, xcpc.children.flatMap((c) => c.awards || []))
  assert.equal(xcpc.awards.every((f) => AWARD_FILES.includes(f)), true)
  // 数据不齐时返回 null（调用方各自决定怎么退），不抛
  assert.equal(mergeXcpc([]), null)
  assert.equal(mergeXcpc([{ slug: 'x', mode: 'roster' }]), null)
  assert.equal(mergeXcpc(comps.filter((c) => c.mode !== XCPC_MODE)), null)
})

/* ── 10. 排名加载的超时策略：超时只是「先按原序渲染」，迟到的排名照样生效 ──
   2026-09-24 修过两次，两次的坑都钉在下面：
   ① 超时先到时把 byName 置成空 Map 并用它挡住重跑 → 3 秒后才回来的排名被永久丢弃；
   ② 改成 `onApply(null)` 之后，页面把「排名为 null」当骨架屏条件 → 降级被原样抵消、
      网格一直等到真排名回来。现在契约是：**onApply 只拿真实排名**，超时/失败走 onTimeout。 */
test('排名超时：onTimeout 先放行渲染，迟到的排名随后覆盖上去', async () => {
  const applied = []
  const timeouts = []
  const load = () =>
    new Promise((resolve) => setTimeout(() => resolve({ byName: new Map([['a', { rank: 1 }]]) }), 5))
  await rankWithTimeout([{ name: 'a' }], {
    timeoutMs: 1,
    load,
    onApply: (m) => applied.push(m),
    onTimeout: () => timeouts.push(true),
  })
  assert.equal(timeouts.length, 1, '超时只报一次「先按原序渲染」')
  assert.equal(applied.length, 1, 'onApply 只拿真实排名，不再拿 null')
  assert.ok(applied[0] instanceof Map)
  assert.equal(applied[0].get('a').rank, 1)
})

test('排名及时：只放行一次，不会先闪一下 JSON 原序', async () => {
  const applied = []
  const timeouts = []
  await rankWithTimeout([{ name: 'a' }], {
    timeoutMs: 1000,
    load: async () => ({ byName: new Map([['a', { rank: 3 }]]) }),
    onApply: (m) => applied.push(m),
    onTimeout: () => timeouts.push(true),
  })
  assert.equal(applied.length, 1)
  assert.equal(applied[0].get('a').rank, 3)
  assert.deepEqual(timeouts, [], '没超时就不该报「先按原序渲染」')
})

test('排名加载抛错：退回原序，且不留下未处理的 rejection', async () => {
  const applied = []
  const timeouts = []
  const orphans = []
  const onUnhandled = (err) => orphans.push(err)
  process.on('unhandledRejection', onUnhandled)
  const out = await rankWithTimeout([{ name: 'a' }], {
    timeoutMs: 1000,
    load: async () => {
      throw new Error('boom')
    },
    onApply: (m) => applied.push(m),
    onTimeout: () => timeouts.push(true),
  })
  await new Promise((r) => setTimeout(r, 5)) // 给 unhandledRejection 一个冒头的机会
  process.off('unhandledRejection', onUnhandled)
  assert.deepEqual(applied, [], '失败不调 onApply —— 页面不必分辨 null')
  assert.equal(timeouts.length, 1, '失败也要放行渲染，否则页面永远停在骨架屏')
  assert.equal(out, null)
  assert.deepEqual(orphans, [])
})
