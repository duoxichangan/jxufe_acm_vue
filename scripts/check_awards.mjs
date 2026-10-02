#!/usr/bin/env node
/**
 * 获奖数据校验器
 * ---------------------------------------------------------------------------
 * 校验 public/data/awards/*.json 是否符合约定 schema，以及
 * competitions.json / events/index.json 的引用是否完整。
 *
 * 用法: node scripts/check_awards.mjs
 * 退出码：0 = 全部通过；1 = 存在问题
 *
 * 数据格式（详见 README「获奖数据格式」）：
 *   团队赛（icpc / ccpc）
 *     competition_name, medal_level, team_name, medal_type, members, coach_names, date
 *   天梯赛团队奖（gplt-team）
 *     session, team_name, medal_type, members, coach_names, date
 *   单人赛（gplt-individual / lanqiao / baidu / chuanzhi）
 *     session, members, medal_level, medal_type, coach_names, date
 *     其中 lanqiao 额外含 language, group（插在 members 之后）
 *
 * medal_type 取值：gold / silver / bronze；lanqiao 另允许 grand（特等奖，
 * 只有第五届国赛 陈天楚 这一条）。grand 与金/银/铜并列展示，不并入一等奖。
 *
 * 名次字段（2026-09-24 新增，**可选**，规范位置一律紧跟 medal_type）：
 *   rank          单一数字名次。**语义随赛事不同**：xCPC 是队伍名次、
 *                 蓝桥杯/百度之星是选手在本组别内的名次。作用域见下面的 rankScope。
 *   rank_official xCPC 专有：正式队排名（源里 rankOfficial）。rank 取总排名。
 *   rank_provincial xCPC 专有：「暨江西省赛」场的**省赛组内名次**（源里按省赛分组重算），
 *                 只写在 medal_level === 'provincial' 那条上 —— 同一支队伍当天有
 *                 邀请赛 + 省赛两条记录，全场总排名两条都成立，组内名次只对省赛有意义。
 *   rank_to       并列区间上界（天梯赛推算专用）。天梯赛官方不公布名次，
 *                 rank = 同分并列块的起点、rank_to = 块尾，两者相同则省略 rank_to。
 *   rank_source   'official'（榜单直接给的）| 'derived'（按名额与分数推算的）
 *                 | 'backfill'（来自补录层：源里 rank 是字符串、medals[].tier 为 null，
 *                 源自标「待核实」—— xCPC 的西安 2023/2024/2025 共 3 条）。
 *   province_rank  gplt-individual 专有：**省内个人名次**（2026-09-24 会长要的「省冠军」）。
 *                 天梯赛官方分省名单只有高校奖与团队奖、**没有个人奖**，故这个名次也是推算的
 *                 （全国名单的逐人成绩 + 分省名单反推学校归属；推法见工作区
 *                 `.tmp/ref/jiangxi-individual-rank.mjs`），rank_source 沿用 'derived'。
 *   province_rank_to 省内名次的并列区间上界，仅当 > province_rank 时写。
 *   规则：出现即须落在规范位置；rank 为 int ≥ 1；rank_to ≥ rank；province_rank_to ≥ province_rank；
 *   作用域内「单一数字名次」不得被两个人共用（带 rank_to / province_rank_to 的区间不参与该检查，
 *   因为同分并列块首被多人共用是预期）；省内名次与全国名次**各自一个作用域**，不可混比
 *   （2025 黄亦诚：全国 110~185、省内 1）。
 */
import fs from 'node:fs'
import path from 'node:path'
// 荣誉类型（contest / destination / honor / contact / more / leader）只有一处真源：
// src/utils/honorType.js —— 校验 wall_rules.json 的 honors[].type 时按它判定，别再抄一份。
import { HONOR_TYPE_LABELS } from '../src/utils/honorType.js'
// 日期合法性只有一处判据：src/utils/scheduleView.js 的 parseDate（竞赛信息页也用它），别再抄一份
import { parseDate } from '../src/utils/scheduleView.js'
// xCPC 标题的标准形式白名单与命名函数同住一处（scripts/lib/schedule-parse.mjs）：
// 生成器用它造名字、这里用它验名字，两边永远看同一份正则
import { isStandardXcpcTitle } from './lib/schedule-parse.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const AWARDS = path.join(DATA, 'awards')

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

const HONOR_TYPES = Object.keys(HONOR_TYPE_LABELS)

const MEDAL_TYPES = ['gold', 'silver', 'bronze']
// 特等奖（grand）：只有蓝桥杯早期届次存在这一档（第五届国赛 陈天楚）。
// 按文件限定，刻意不并进 MEDAL_TYPES —— 其它赛事的 medal_type 仍只能是金/银/铜。
const GRAND_MEDAL_TYPES = ['grand', ...MEDAL_TYPES]
const XCPC_LEVELS = ['regional', 'invitational', 'provincial', 'final']
const SINGLE_LEVELS = ['provincial', 'national']
const LANGS = ['C++', 'Java', 'Python']
const GROUPS = ['A', 'B', '研究生组']

const SCHEMA = {
  'icpc.json': {
    keys: ['competition_name', 'medal_level', 'team_name', 'medal_type', 'rank', 'rank_official', 'rank_provincial', 'rank_source', 'members', 'coach_names', 'date'],
    optionalKeys: ['rank', 'rank_official', 'rank_provincial', 'rank_source'],
    rankScope: (r) => `${r.date}|${r.competition_name}|${r.medal_level}`,
    levels: XCPC_LEVELS,
    team: true
  },
  'ccpc.json': {
    keys: ['competition_name', 'medal_level', 'team_name', 'medal_type', 'rank', 'rank_official', 'rank_provincial', 'rank_source', 'members', 'coach_names', 'date'],
    optionalKeys: ['rank', 'rank_official', 'rank_provincial', 'rank_source'],
    rankScope: (r) => `${r.date}|${r.competition_name}|${r.medal_level}`,
    levels: XCPC_LEVELS,
    team: true
  },
  'gplt-team.json': {
    keys: ['session', 'team_name', 'medal_type', 'members', 'coach_names', 'date'],
    optionalKeys: [],
    levels: null,
    team: true
  },
  'gplt-individual.json': {
    keys: ['session', 'members', 'medal_level', 'medal_type', 'rank', 'rank_to', 'rank_source', 'province_rank', 'province_rank_to', 'coach_names', 'date'],
    optionalKeys: ['rank', 'rank_to', 'rank_source', 'province_rank', 'province_rank_to'],
    rankScope: (r) => `${r.session}`,
    // 省内名次与全国名次不可比，各占一个作用域
    provinceRankScope: (r) => `${r.session}|province`,
    levels: SINGLE_LEVELS,
    team: false
  },
  'lanqiao.json': {
    keys: ['session', 'members', 'language', 'group', 'medal_level', 'medal_type', 'rank', 'coach_names', 'date'],
    optionalKeys: ['rank'],
    rankScope: (r) => `${r.session}|${r.medal_level}|${r.language}|${r.group}`,
    levels: SINGLE_LEVELS,
    team: false,
    langs: LANGS,
    groups: GROUPS,
    medals: GRAND_MEDAL_TYPES
  },
  'baidu.json': {
    keys: ['session', 'members', 'medal_level', 'medal_type', 'rank', 'coach_names', 'date'],
    optionalKeys: ['rank'],
    rankScope: (r) => `${r.date}`,
    levels: SINGLE_LEVELS,
    team: false
  },
  'chuanzhi.json': {
    keys: ['session', 'members', 'medal_level', 'medal_type', 'rank', 'coach_names', 'date'],
    optionalKeys: ['rank'],
    rankScope: (r) => `${r.session}|${r.medal_level}`,
    levels: SINGLE_LEVELS,
    team: false
  }
}

function validateRecords(file, rows) {
  const spec = SCHEMA[file]
  const problems = []
  const push = (i, msg) => problems.push(`[${i}] ${msg}`)

  rows.forEach((r, i) => {
    const keys = Object.keys(r)
    /* 名次字段是**可选**的（不是每条获奖记录都有名次）：把规范键序里没出现的键过滤掉，
       剩下的必须与 keys 逐字相等 —— 即「出现即须落在规范位置」，多出未知键也会被抓到。 */
    const expected = spec.keys.filter((k) => keys.includes(k))
    if (keys.length !== expected.length || keys.some((k, j) => k !== expected[j])) {
      push(i, `字段名/顺序不符: ${keys.join(',')}（期望 ${expected.join(',')}；可选键 ${(spec.optionalKeys || []).join('/') || '无'}）`)
      return
    }
    if (spec.team) {
      if (!r.team_name || typeof r.team_name !== 'string') push(i, `team_name 为空或非 string`)
    }
    if ('competition_name' in r && (!r.competition_name || typeof r.competition_name !== 'string'))
      push(i, `competition_name 为空或非 string`)
    if ('session' in r && !Number.isInteger(r.session)) push(i, `session 非 int: ${JSON.stringify(r.session)}`)
    if (spec.levels && !spec.levels.includes(r.medal_level))
      push(i, `medal_level 非法: ${JSON.stringify(r.medal_level)}`)
    if (!(spec.medals || MEDAL_TYPES).includes(r.medal_type))
      push(i, `medal_type 非法: ${JSON.stringify(r.medal_type)}`)
    if (!Array.isArray(r.members) || !r.members.length || !r.members.every((m) => typeof m === 'string' && m))
      push(i, `members 非法: ${JSON.stringify(r.members)}`)
    if (!Array.isArray(r.coach_names) || !r.coach_names.every((m) => typeof m === 'string'))
      push(i, `coach_names 非法: ${JSON.stringify(r.coach_names)}`)
    if (r.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) push(i, `date 非法: ${JSON.stringify(r.date)}`)
    if (spec.langs && r.language !== null && !spec.langs.includes(r.language))
      push(i, `language 非法: ${JSON.stringify(r.language)}`)
    if (spec.groups && r.group !== null && !spec.groups.includes(r.group))
      push(i, `group 非法: ${JSON.stringify(r.group)}`)
    if ('rank' in r) {
      if (!Number.isInteger(r.rank) || r.rank < 1) push(i, `rank 非法: ${JSON.stringify(r.rank)}`)
      if ('rank_official' in r && (!Number.isInteger(r.rank_official) || r.rank_official < 1))
        push(i, `rank_official 非法: ${JSON.stringify(r.rank_official)}`)
      if ('rank_provincial' in r && (!Number.isInteger(r.rank_provincial) || r.rank_provincial < 1))
        push(i, `rank_provincial 非法: ${JSON.stringify(r.rank_provincial)}`)
      if ('rank_to' in r && (!Number.isInteger(r.rank_to) || r.rank_to < Number(r.rank)))
        push(i, `rank_to 非法: ${JSON.stringify(r.rank_to)}（应 ≥ rank）`)
      if ('rank_source' in r && !['official', 'derived', 'backfill'].includes(r.rank_source))
        push(i, `rank_source 非法: ${JSON.stringify(r.rank_source)}`)
      if ('province_rank' in r && (!Number.isInteger(r.province_rank) || r.province_rank < 1))
        push(i, `province_rank 非法: ${JSON.stringify(r.province_rank)}`)
      if ('province_rank_to' in r && (!Number.isInteger(r.province_rank_to) || r.province_rank_to < Number(r.province_rank)))
        push(i, `province_rank_to 非法: ${JSON.stringify(r.province_rank_to)}（应 ≥ province_rank）`)
    }
  })

  /* 名次在**自己的作用域**内不得被两个人共用 —— 作用域的定义与 src/utils/awardGroups.js
     的 byRank() 一致（名次只在同一比较范围内可比）。同一个人在同作用域重复出现是允许的
     （源里确有一例：2024 省赛 C/C++ B 组「刘鑫」一等奖与三等奖两条同 rank 2401），
     但两个人共用同一个名次说明合并脚本连错了人。
     全国名次与省内名次各查一遍，规则相同、作用域不同。 */
  for (const scope of [
    { label: '名次', fn: spec.rankScope, value: (r) => r.rank, blockEnd: (r) => r.rank_to },
    { label: '省内名次', fn: spec.provinceRankScope, value: (r) => r.province_rank, blockEnd: (r) => r.province_rank_to },
  ]) {
    if (!scope.fn) continue
    const seen = new Map()
    rows.forEach((r, i) => {
      const v = scope.value(r)
      if (v == null) return
      /* 带 rank_to / province_rank_to 的是**区间**（天梯赛推算：同分并列块只能给区间），
         块首被多人共用是预期，不参与撞号检查 —— 只有「单一数字名次」才可能撞。 */
      if (scope.blockEnd(r) != null) return
      const who = (r.members || []).join('、')
      const k = `${scope.fn(r)}#${v}`
      if (seen.has(k) && seen.get(k).who !== who) {
        problems.push(`[${i}] ${scope.label}撞号: 作用域 ${scope.fn(r)} 内 ${v} 已被 ${seen.get(k).who}（[${seen.get(k).i}]）占用`)
      } else if (!seen.has(k)) {
        seen.set(k, { who, i })
      }
    })
  }

  // date 升序，null 排末尾
  let prev = null
  for (const r of rows) {
    if (r.date === null) continue
    if (prev !== null && r.date < prev) {
      problems.push(`date 未按升序排列: ${prev} → ${r.date}`)
      break
    }
    prev = r.date
  }
  return problems
}

let failed = 0
console.log('=== awards/*.json ===')
const existing = fs.readdirSync(AWARDS).filter((f) => f.endsWith('.json')).sort()
for (const f of existing) {
  if (!SCHEMA[f]) {
    console.log(`  ?    ${f.padEnd(22)} 未在 schema 中登记`)
    failed++
    continue
  }
  const rows = readJSON(path.join(AWARDS, f))
  if (!Array.isArray(rows)) {
    console.log(`  ERR  ${f.padEnd(22)} 顶层不是数组`)
    failed++
    continue
  }
  const problems = validateRecords(f, rows)
  const dist = {}
  for (const r of rows) dist[r.medal_type] = (dist[r.medal_type] || 0) + 1
  console.log(
    `  ${problems.length ? 'ERR' : 'OK '}  ${f.padEnd(22)} ${String(rows.length).padStart(5)} 条  ` +
      Object.entries(dist).map(([k, v]) => `${k}=${v}`).join(' ')
  )
  problems.slice(0, 8).forEach((p) => console.log('         ' + p))
  failed += problems.length ? 1 : 0
}

console.log('\n=== competitions.json 引用 ===')
const comps = readJSON(path.join(DATA, 'competitions.json'))
const referenced = new Set()
for (const c of comps) {
  const list = c.awards || []
  const missing = list.filter((a) => {
    referenced.add(`${a}.json`)
    return !fs.existsSync(path.join(AWARDS, `${a}.json`))
  })
  const ok = missing.length === 0 && !!c.shortName
  console.log(
    `  ${ok ? 'OK ' : 'ERR'}  ${c.slug.padEnd(9)} mode=${String(c.mode).padEnd(7)} awards=[${list.join(', ')}]` +
      (c.shortName ? '' : '  缺少 shortName') +
      (missing.length ? `  缺失文件: ${missing.join(', ')}` : '')
  )
  if (!ok) failed++
}
const orphans = existing.filter((f) => !referenced.has(f))
if (orphans.length) {
  console.log(`  ERR  未被任何赛事引用的 awards 文件: ${orphans.join(', ')}`)
  failed++
}

console.log('\n=== sessions（年份 → 届数）===')
// 单届详情页 /competition/:slug/:year 靠它把 URL 的自然年换算成 awards 的 session
for (const c of comps) {
  const m = c.sessions || {}
  const keys = Object.keys(m)
  const bad = keys.filter((y) => !/^\d{4}$/.test(y) || !Number.isInteger(m[y]) || m[y] <= 0)
  if (bad.length) {
    console.log(`  ERR  ${c.slug}: sessions 非法项 ${bad.join(', ')}`)
    failed++
  } else {
    console.log(`  OK   ${c.slug.padEnd(9)} ${keys.length} 年${keys.length ? `（${keys[0]}→${m[keys[0]]} … ${keys[keys.length - 1]}→${m[keys[keys.length - 1]]}）` : ''}`)
  }
}

console.log('\n=== events/ 大事记数据（一年一个文件：cards + articles）===')
const CATS = ['inv', 'reg', 'prov', 'net', 'tts', 'lanqiao', 'chuanzhi', 'baidu', 'school', 'club', 'other']
const NODE_KEYS = ['kind', 'date', 'category', 'title', 'tagline', 'link']
const EVENTS_DIR = path.join(DATA, 'events')
const compBySlug = Object.fromEntries(comps.map((c) => [c.slug, c]))

const evProblems = []
const yearFiles = fs
  .readdirSync(EVENTS_DIR)
  .filter((f) => /^\d{4}\.json$/.test(f))
  .map((f) => f.replace('.json', ''))
  .sort((a, b) => b - a)

const yearData = {}
for (const y of yearFiles) {
  const d = readJSON(path.join(EVENTS_DIR, `${y}.json`))
  if (!d || Array.isArray(d) || !Array.isArray(d.cards) || typeof d.articles !== 'object') {
    evProblems.push(`${y}.json 顶层应为 { cards: [...], articles: {...} }`)
    yearData[y] = { cards: [], articles: {} }
    continue
  }
  yearData[y] = d
}

const validateCards = (nodes, where) => {
  nodes.forEach((n, i) => {
    const keys = Object.keys(n)
    if (keys.length !== NODE_KEYS.length || keys.some((k, j) => k !== NODE_KEYS[j]))
      evProblems.push(`${where}[${i}] 卡片字段名/顺序不符: ${keys.join(',')}（期望 ${NODE_KEYS.join(',')}）`)
    if (!['news', 'event'].includes(n.kind)) evProblems.push(`${where}[${i}] kind 非法: ${JSON.stringify(n.kind)}`)
    if (n.date !== null && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(n.date)) evProblems.push(`${where}[${i}] date 非法: ${JSON.stringify(n.date)}`)
    if (!CATS.includes(n.category)) evProblems.push(`${where}[${i}] category 非法: ${JSON.stringify(n.category)}`)
    if (!n.title) evProblems.push(`${where}[${i}] title 为空`)
    if (!n.link) evProblems.push(`${where}[${i}] link 为空`)
    else if (String(n.link).includes('/')) evProblems.push(`${where}[${i}] link 必须是纯 id（不含 /）: ${n.link}`)
  })
}

const allNewsSlugs = []
let cardTotal = 0
for (const y of yearFiles) {
  const { cards } = yearData[y]
  cardTotal += cards.length
  validateCards(cards, `${y}.json cards`)
  let seenNull = false
  let prev = null
  for (const n of cards) {
    if (n.date === null) {
      seenNull = true
      continue
    }
    if (seenNull || (prev !== null && n.date > prev)) {
      evProblems.push(`${y}.json cards date 未按倒序排列（${prev} → ${n.date}）`)
      break
    }
    prev = n.date
  }
  for (const n of cards) if (n.kind === 'news') allNewsSlugs.push(String(n.link))
  // articles：字段与顺序
  for (const [id, a] of Object.entries(yearData[y].articles)) {
    const keys = Object.keys(a)
    const expected = keys.includes('subtitle') ? ['title', 'date', 'subtitle', 'blocks'] : ['title', 'date', 'blocks']
    if (keys.join(',') !== expected.join(','))
      evProblems.push(`${y}.json articles["${id}"] 字段名/顺序不符: ${keys.join(',')}（期望 ${expected.join(',')}）`)
    if (!a.title) evProblems.push(`${y}.json articles["${id}"] title 为空`)
    if (a.date !== null && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(a.date)) evProblems.push(`${y}.json articles["${id}"] date 非法: ${JSON.stringify(a.date)}`)
    if (!Array.isArray(a.blocks) || !a.blocks.length) evProblems.push(`${y}.json articles["${id}"] blocks 缺失或为空`)
    // date 为 null 表示日期待考（与卡片一致），年份由所在文件给出
    if (a.date !== null && String(a.date).slice(0, 4) !== y) evProblems.push(`${y}.json articles["${id}"] 日期年份(${String(a.date).slice(0, 4)}) 与所在文件(${y}) 不一致`)
    // related block（大事记文章 → 竞赛介绍页）指向的赛事必须存在
    for (const b of a.blocks || []) {
      if (b.type !== 'related') continue
      if (!b.text || !b.to) evProblems.push(`${y}.json articles["${id}"] related block 缺 text/to`)
      const m = String(b.to || '').match(/^\/competition\/([^/]+)$/)
      if (!m) evProblems.push(`${y}.json articles["${id}"] related.to 形状非法: ${b.to}`)
      else if (!compBySlug[m[1]]) evProblems.push(`${y}.json articles["${id}"] related.to 指向未知赛事: ${b.to}`)
    }
  }
}

const topNodes = readJSON(path.join(EVENTS_DIR, 'top.json'))
validateCards(topNodes, 'top.json')
for (const n of topNodes) if (n.kind === 'news') allNewsSlugs.push(String(n.link))
const articleTotal = yearFiles.reduce((s, y) => s + Object.keys(yearData[y].articles).length, 0)

console.log(
  `  ${evProblems.length ? 'ERR' : 'OK '}  ${yearFiles.length} 个年份文件 + top.json(${topNodes.length})  ` +
    `共 ${cardTotal + topNodes.length} 张卡片、${articleTotal} 篇文章`
)
evProblems.slice(0, 10).forEach((p) => console.log('         ' + p))
if (evProblems.length) failed += 1 + evProblems.length

// 文章 id → 年份（供下方「卡片 ↔ 文章」一致性检查使用）。
// 没有索引文件：前端靠 id 前 4 位定位年份文件，这里把同样的规则校验一遍。
const derivedArticles = {}
for (const y of yearFiles) for (const id of Object.keys(yearData[y].articles)) derivedArticles[id] = y

const idProblems = []
for (const [id, y] of Object.entries(derivedArticles)) {
  if (!id.startsWith(y + '-')) idProblems.push(`文章 id 必须以所在年份开头（${y}.json 里的 "${id}"）`)
  if (id.includes('/')) idProblems.push(`文章 id 不能含 /: ${id}`)
}
console.log('\n=== 文章 id 能否自解析年份（前端靠 id 前 4 位定位文件）===')
console.log(`  ${idProblems.length ? 'ERR' : 'OK '}  ${Object.keys(derivedArticles).length} 个文章 id`)
idProblems.slice(0, 8).forEach((p) => console.log('         ' + p))
if (idProblems.length) failed += idProblems.length

console.log('\n=== 卡片 ↔ 文章 的一致性 ===')
const artProblems = []
const cardArticles = [...topNodes, ...yearFiles.flatMap((y) => yearData[y].cards)]
const linkedIds = new Set()
for (const n of cardArticles) {
  const id = String(n.link)
  linkedIds.add(id)
  const year = derivedArticles[id]
  if (!year) {
    artProblems.push(`卡片 link 在年份文件里找不到对应文章: ${id}（${n.title}）`)
    continue
  }
  const a = yearData[year].articles[id]
  // news：卡片标题与文章标题必须一致；战报/赛事的卡片是短标签、文章是官方全称，故意不同
  if (n.kind === 'news' && a.title !== n.title) artProblems.push(`${id} title 不一致: 卡片=${JSON.stringify(n.title)} 文章=${JSON.stringify(a.title)}`)
  if (a.date !== n.date) artProblems.push(`${id} date 不一致: 卡片=${n.date} 文章=${a.date}`)
}
const orphanIds = Object.keys(derivedArticles).filter((id) => !linkedIds.has(id))
const dupNews = allNewsSlugs.filter((s, i) => allNewsSlugs.indexOf(s) !== i)
if (dupNews.length) artProblems.push(`新闻在时间轴里重复出现: ${[...new Set(dupNews)].join(', ')}`)
console.log(
  `  ${artProblems.length ? 'ERR' : 'OK '}  卡片引用 ${linkedIds.size} 篇文章（全部存在）  ` +
    `/ 无卡片入口的文章 ${orphanIds.length} 篇（参赛未获奖场次，保留但不上时间轴）`
)
artProblems.slice(0, 10).forEach((p) => console.log('         ' + p))
if (artProblems.length) failed += artProblems.length

/* ==========================================================================
   我们这一支新增的数据文件（会长 2026-09-23 屎山审查：knowledge.md 把本脚本称作
   「全量校验」，但它原先对下面这些文件一行都没查）。
   分两类：**真源**（入库、缺了就是错）与**派生**（构建期由生成器产出、可以不在场，
   在场就顺手交叉核对 —— 它们正是最容易「生成物比生成器活得久」的地方）。
   ========================================================================== */
console.log('\n=== 协会名单 / 规则 / 奖学金（真源）===')
const srcProblems = []
const needJSON = (name) => {
  const p = path.join(DATA, name)
  if (!fs.existsSync(p)) {
    srcProblems.push(`${name} 不存在（真源，必须入库）`)
    return null
  }
  return readJSON(p)
}
const ROLES = ['owner', 'admin', 'member', 'excellent', 'leader']

// 群成员名单：由仓外 build_site_assets.py 派生后入库（页面的「墙上有没有这个人」看它）
const gm = needJSON('group_members.json')
if (gm) {
  if (!Array.isArray(gm.members)) srcProblems.push('group_members.json 缺 members 数组')
  else {
    if (gm.counts?.total !== gm.members.length)
      srcProblems.push(`group_members.json counts.total=${gm.counts?.total} 与 members.length=${gm.members.length} 不等`)
    const badRole = gm.members.filter((m) => !ROLES.includes(m.roleKey)).map((m) => m.name || m.qq)
    if (badRole.length) srcProblems.push(`group_members.json 身份非法（roleKey 应为 ${ROLES.join('/')}）: ${badRole.slice(0, 5).join(', ')}`)
    // counts 是生成器写的统计，最容易和名单脱节 —— 三项群身份逐个对账
    for (const k of ['owner', 'admin', 'member']) {
      const real = gm.members.filter((m) => m.roleKey === k).length
      if (gm.counts?.[k] !== real) srcProblems.push(`group_members.json counts.${k}=${gm.counts?.[k]} 与实际 ${real} 人不等`)
    }
    const noImg = gm.members.filter((m) => !m.blank && !m.thumb).map((m) => m.name || m.qq)
    if (noImg.length) srcProblems.push(`group_members.json 有 ${noImg.length} 人既非 blank 又没有 thumb 缩略图: ${noImg.slice(0, 5).join(', ')}`)
    const real = gm.members.filter((m) => m.realName).length
    if (gm.counts?.realName !== real) srcProblems.push(`group_members.json counts.realName=${gm.counts?.realName} 与实际有真名的 ${real} 人不等`)
    console.log(`  OK   group_members.json      ${gm.members.length} 人（真名 ${real} / 无头像 ${gm.counts?.blank ?? 0}）`)
  }
}

// 协会职务胶囊：文字口径必须逐字是「<年份>学年<职务>」（会长裁定的展示口径）
const duties = needJSON('duties.json')
if (duties) {
  const rows = Object.entries(duties.people || {})
  const bad = []
  for (const [name, list] of rows) {
    if (!Array.isArray(list)) { bad.push(`${name} 的值不是数组`); continue }
    for (const d of list) {
      if (typeof d?.year !== 'number' || !d?.role) { bad.push(`${name} 条目缺 year/role`); continue }
      if (d.text !== `${d.year}学年${d.role}`) bad.push(`${name} 的 text「${d.text}」与「${d.year}学年${d.role}」不符`)
    }
  }
  if (duties.count !== rows.length) bad.push(`count=${duties.count} 与实际 ${rows.length} 人不等`)
  srcProblems.push(...bad)
  console.log(`  ${bad.length ? 'ERR' : 'OK '}  duties.json              ${rows.length} 人 / ${rows.reduce((s, [, l]) => s + l.length, 0)} 条（文字口径 <年份>学年<职务>）`)
}

// 入墙规则：两个阈值 + 规则名单；`0` 是「关闭这条规则」的合法值
const rules = needJSON('wall_rules.json')
if (rules) {
  const rp = []
  for (const k of ['scoreThreshold', 'excellentScoreThreshold']) {
    if (typeof rules[k] !== 'number' || rules[k] < 0) rp.push(`${k} 应为 ≥0 的数字（0 = 关闭该规则），实际 ${JSON.stringify(rules[k])}`)
  }
  for (const p of rules.people || []) {
    if (!p?.name) rp.push('people[] 有缺 name 的条目')
    for (const h of p?.honors || []) {
      if (!h?.text) rp.push(`${p.name} 的 honors 有缺 text 的条目`)
      else if (h.type && !HONOR_TYPES.includes(h.type)) rp.push(`${p.name} 的荣誉类型「${h.type}」不在 ${HONOR_TYPES.join('/')} 内`)
    }
  }
  srcProblems.push(...rp)
  console.log(
    `  ${rp.length ? 'ERR' : 'OK '}  wall_rules.json          上墙阈值 ${rules.scoreThreshold} 分` +
      `（0=关） / 优秀成员页阈值 ${rules.excellentScoreThreshold} 分（0=关） / 规则名单 ${(rules.people || []).length} 人`
  )
}

// 奖学金（仓外 build_scholarships.py 产出后入库）：type 恒为 honor，文字含学年
const sch = needJSON('scholarships.json')
if (sch) {
  const rows = Object.entries(sch.people || {})
  const bad = []
  for (const [name, list] of rows) {
    if (!Array.isArray(list)) { bad.push(`${name} 的值不是数组`); continue }
    for (const s of list) {
      if (!s?.text) bad.push(`${name} 有条目缺 text`)
      else if (s.type !== 'honor') bad.push(`${name} 的「${s.text}」type=${JSON.stringify(s.type)}（应恒为 honor）`)
      else if (!/学年/.test(s.text)) bad.push(`${name} 的「${s.text}」不含学年`)
    }
  }
  srcProblems.push(...bad)
  console.log(`  ${bad.length ? 'ERR' : 'OK '}  scholarships.json        ${rows.length} 人 / ${rows.reduce((s, [, l]) => s + l.length, 0)} 条（type 恒为 honor）`)
}

/* 近期赛事时间表的手写真源（2026-10-01 新增）。页面会把它与构建期抓来的
   schedule.auto.json 合并、**手写优先** —— 所以两份的日期写法必须一致，这里钉住格式。 */
const sched = needJSON('schedule.json')
if (sched) {
  const sp = []
  /** 命名类问题只提示、不算失败（见下面那条注释） */
  const nameWarns = []
  // 赛事 slug 除了 competitions.json 里那六个，还允许线上平台与协会自办：
  // 页面按 slug 取图标 / 配色，写错不会报错、只会静悄悄没图标，所以在这里拦下拼写错。
  // ⚠ raicom **有意不在**白名单里（会长 2026-10-02：「去除睿抗的 filter，并且最近赛时里也不
  //   显示睿抗的比赛」）：睿抗场次已被 scheduleView 的 HIDDEN_CONTESTS 整条滤掉，
  //   再手写一条只会「写了却永远不显示」—— 故让它在这里就报错，而不是静默吞掉。
  const KNOWN = new Set([
    ...(comps || []).map((c) => c.slug),
    'codeforces',
    'atcoder',
    'luogu',
    'nowcoder',
    'club',
  ])
  const seen = new Set()
  const badDay = (v) => (parseDate(v) ? '' : `「${v}」不是合法日历日（要 YYYY-MM-DD）`)
  for (const [i, it] of (sched.items || []).entries()) {
    const where = `items[${i}]${it?.title ? `「${it.title}」` : ''}`
    if (!it?.contest) sp.push(`${where} 缺 contest`)
    else if (!KNOWN.has(it.contest)) sp.push(`${where} 的 contest「${it.contest}」不在已知赛事里（可用：${[...KNOWN].join(' / ')}）`)
    if (!it?.title) sp.push(`${where} 缺 title`)
    // xCPC 的标题要写成标准形式（会长 2026-10-02；11 种写法见 scripts/lib/schedule-parse.mjs）。
    // **warn 不 err**：官网通告偶尔给不出干净的站名，硬拦会逼着维护者把名字改坏来讨好校验 ——
    // 但也不该静默放过，那会让表里同时出现「CCPC 长春国赛」和「CCPC全国赛（长春）」。
    if ((it?.contest === 'icpc' || it?.contest === 'ccpc') && it?.title && !isStandardXcpcTitle(it.title)) {
      nameWarns.push(`${where} 的标题不是 xCPC 标准写法（允许的写法见 scripts/lib/schedule-parse.mjs 的 XCPC_TITLE_RES）`)
    }
    if (!it?.start) sp.push(`${where} 缺 start（start 是唯一必填；没确定日期的场次请写进 pending）`)
    for (const k of ['start', 'end', 'deadline']) {
      if (it?.[k] == null) continue
      const bad = badDay(it[k])
      if (bad) sp.push(`${where} 的 ${k}：${bad}`)
    }
    if (parseDate(it?.start) && parseDate(it?.end) && parseDate(it.start) > parseDate(it.end))
      sp.push(`${where} 的 end(${it.end}) 早于 start(${it.start})`)
    if (parseDate(it?.deadline) && parseDate(it?.start) && parseDate(it.deadline) > parseDate(it.start))
      sp.push(`${where} 的 deadline(${it.deadline}) 晚于开赛日(${it.start}) —— 报名截止不该在比赛之后`)
    const key = `${it?.contest}|${it?.start}`
    if (it?.start && seen.has(key)) sp.push(`${where} 与前面某条同为「${key}」—— 页面按「同赛事同日」去重，只会显示一条`)
    seen.add(key)
  }
  for (const [i, p] of (sched.pending || []).entries()) {
    const where = `pending[${i}]${p?.title ? `「${p.title}」` : ''}`
    if (!p?.title) sp.push(`${where} 缺 title`)
    if (!p?.when) sp.push(`${where} 缺 when（形如「2026 年 10 月，日期待定」）`)
  }
  if (!sched.updated) sp.push('缺 updated（最后改动日期，页面右上角「数据更新」会显示它）')
  else if (!parseDate(sched.updated)) sp.push(`updated 的 ${badDay(sched.updated)}`)
  srcProblems.push(...sp)

  const next = (sched.items || []).filter((i) => i?.start).sort((a, b) => (a.start < b.start ? -1 : 1))[0]
  console.log(
    `  ${sp.length ? 'ERR' : 'OK '}  schedule.json            ${(sched.items || []).length} 场 + ${(sched.pending || []).length} 条时间待定` +
      (next ? `（最近一场 ${next.start}「${next.title}」）` : '')
  )
  nameWarns.forEach((w) => console.log(`         ℹ ${w}`))
}

/* 线上平台（Codeforces / AtCoder / 牛客）的图标与简称（2026-10-02 新增，随牛客源一起进来）。
   这一份**故意不进 competitions.json**：那份数据的每一条都会在竞赛卡片网格里长出一张大卡，
   还要过奖项文件与届次映射，而这些平台本站并不「参赛」，只是赛程的来源。
   页面取不到图标**不会报错**，只会静默画一枚首字母方块 —— 正是「写错一个字看不出来」那类错，
   故在此核对结构、图标文件是否真的存在、以及 slug 有没有被赛程数据真正用到。
   （自动层自己读一遍：本块在 srcProblems 汇总之前、而 optJSON/schedAuto 在本块之后才声明。） */
{
  const platFile = path.join(DATA, 'platforms.json')
  const plat = fs.existsSync(platFile) ? readJSON(platFile) : null
  const pp = []
  if (!plat) {
    pp.push('platforms.json 不在场（线上赛的行首 logo 会退化成首字母方块）')
  } else if (!Array.isArray(plat.items)) {
    pp.push('items 不是数组')
  } else {
    const autoFile = path.join(DATA, 'schedule.auto.json')
    const autoItems = fs.existsSync(autoFile) ? readJSON(autoFile).items || [] : []
    const used = new Set([...(sched?.items || []), ...autoItems].map((i) => i?.contest).filter(Boolean))
    const seen = new Set()
    for (const [i, it] of plat.items.entries()) {
      const where = `platforms.items[${i}]${it?.slug ? `「${it.slug}」` : ''}`
      if (!it?.slug) pp.push(`${where} 缺 slug`)
      else {
        if (seen.has(it.slug)) pp.push(`${where} slug 重复`)
        seen.add(it.slug)
        if (!used.has(it.slug)) pp.push(`${where} 没有被任何赛程行用到（抓取层是不是改了 slug？）`)
      }
      if (!it?.name || !it?.shortName) pp.push(`${where} 缺 name / shortName（行内 alt 文本要用）`)
      if (!it?.image) pp.push(`${where} 缺 image`)
      else if (!it.image.startsWith('/images/')) pp.push(`${where} 的 image 要以 /images/ 开头（public 下按绝对路径取）`)
      else if (!fs.existsSync(path.join(ROOT, 'public', it.image))) pp.push(`${where} 的图 ${it.image} 不存在`)
    }
  }
  srcProblems.push(...pp)
  console.log(
    `  ${pp.length ? 'ERR' : 'OK '}  platforms.json           ${plat?.items?.length ?? 0} 个平台（图标文件、slug 均核对）`
  )
}

srcProblems.slice(0, 8).forEach((p) => console.log('         ' + p))
if (srcProblems.length) failed += srcProblems.length

/* 派生文件：不在场只提示（构建期会生成、且已 gitignore），在场就交叉核对 ——
   这两条恰好把两类「静默错」钉死：阈值被改而生成物没重建、以及 tiles 键撞名丢格。 */
console.log('\n=== 派生文件（构建期生成；在场则交叉核对）===')
const optJSON = (name) => {
  const p = path.join(DATA, name)
  return fs.existsSync(p) ? readJSON(p) : null
}
const derProblems = []
const gw = optJSON('group_wall.json')
const gwm = optJSON('group_wall.manifest.json')
if (gw && gwm) {
  const tileKeys = Object.keys(gw.tiles || {})
  if (gwm.count !== gwm.images?.length)
    derProblems.push(`group_wall.manifest.json count=${gwm.count} 与 images.length=${gwm.images?.length} 不等`)
  if (tileKeys.length !== (gwm.images || []).length)
    derProblems.push(
      `group_wall.json 有 ${tileKeys.length} 格、manifest 有 ${gwm.images?.length} 张图 —— ` +
        '缩略图文件名撞名会让 tiles 静默覆盖（生成器已改为抛错，这里是第二道网）'
    )
  console.log(`  ${derProblems.length ? 'ERR' : 'OK '}  group_wall.json          ${tileKeys.length} 格 / manifest ${gwm.images?.length} 张图`)
} else {
  console.log('  --   group_wall.*.json       不在场（跑 npm run data:group-wall 生成）')
}

// 阈值这条最重要：生成物记的 threshold 必须与 wall_rules.json 现在写的一致，
// 否则页面会拿旧名单渲染（2026-09-23 修的就是这个：阈值设 0 时生成器曾不重写文件）。
const exMembers = optJSON('excellent_members.json')
if (exMembers && rules) {
  const exProblems = []
  if (exMembers.threshold !== rules.excellentScoreThreshold)
    exProblems.push(
      `excellent_members.json 的 threshold=${exMembers.threshold} 与 wall_rules.json 的 ` +
        `excellentScoreThreshold=${rules.excellentScoreThreshold} 不一致 —— 页面读的是前者，请重跑 npm run data:group-wall`
    )
  if (exMembers.count !== exMembers.members?.length)
    exProblems.push(`excellent_members.json count=${exMembers.count} 与 members.length=${exMembers.members?.length} 不等`)
  const auto = (exMembers.members || []).filter((m) => m.auto).length
  derProblems.push(...exProblems)
  console.log(`  ${exProblems.length ? 'ERR' : 'OK '}  excellent_members.json   ${exMembers.count} 人（自动入册 ${auto} 人，阈值 ${exMembers.threshold}）`)
} else if (exMembers) {
  console.log('  --   excellent_members.json   在场，但 wall_rules.json 缺失，无法核对阈值')
} else {
  console.log('  --   excellent_members.json   不在场（跑 npm run data:group-wall 生成）')
}

const badges = optJSON('event_badges.json')
if (badges) {
  const bkTiers = Object.keys(badges.tiers || {})
  const bkB = Object.keys(badges.badges || {})
  const badTier = bkTiers
    .map((k) => badges.tiers[k])
    .filter((t) => !['grand', 'gold', 'silver', 'bronze'].includes(t))
  const mismatch = bkTiers.length !== bkB.length || bkB.some((k) => !(k in (badges.tiers || {})))
  if (badTier.length) derProblems.push(`event_badges.json 有非法 tier: ${[...new Set(badTier)].join(', ')}`)
  if (mismatch) derProblems.push('event_badges.json 的 badges 与 tiers 键集合不一致（页面按 tiers 取档位配色）')
  console.log(`  ${badTier.length || mismatch ? 'ERR' : 'OK '}  event_badges.json        ${bkB.length} 枚角标 / tiers 同键 ${bkTiers.length}`)
} else {
  console.log('  --   event_badges.json       不在场（跑 npm run data:event-badges 生成）')
}

/* 自动层（构建期由 scripts/gen_schedule.mjs 抓各赛事官网）：不在场只提示，
   在场就把**源健康**摆出来 —— 抓取失败在构建日志里只是一行 warn，跑 data:check 时才看得见谁挂了。 */
const schedAuto = optJSON('schedule.auto.json')
if (schedAuto) {
  const srcs = schedAuto.sources || []
  const dead = srcs.filter((s) => !s.ok)
  const badDates = (schedAuto.items || []).filter((i) => !parseDate(i?.start))
  if (badDates.length) derProblems.push(`schedule.auto.json 有 ${badDates.length} 条非法日期（生成器不该写出这种）`)
  if (!schedAuto.generated_at) derProblems.push('schedule.auto.json 缺 generated_at')
  console.log(
    `  ${badDates.length ? 'ERR' : 'OK '}  schedule.auto.json      ${(schedAuto.items || []).length} 场自动场次 / ` +
      `${srcs.filter((s) => s.ok).length}/${srcs.length} 个源可用` +
      (dead.length ? `（未同步：${dead.map((s) => s.label || s.id).join('、')}）` : '')
  )
  for (const a of (schedAuto.alerts || []).slice(0, 5)) {
    console.log(`         ℹ 公告待人工确认：${a.title}`)
    if (a.url) console.log(`           ${a.url}`)
  }
  const genDays = Math.floor((Date.now() - Date.parse(schedAuto.generated_at || 0)) / 86400000)
  if (Number.isFinite(genDays) && genDays >= 7)
    console.log(`         ℹ 自动层生成于 ${genDays} 天前 —— 部署时 prebuild 会重抓，想立刻更新跑 npm run data:schedule`)
  // 自动层的 xCPC 名字也该是标准形式（生成器负责）；不是就说明那份是无格式改造前抓的
  for (const i of (schedAuto.items || []).filter(
    (i) => (i?.contest === 'icpc' || i?.contest === 'ccpc') && i?.title && !isStandardXcpcTitle(i.title)
  )) {
    console.log(`         ℹ 自动层标题不是 xCPC 标准写法：${i.title}（跑 npm run data:schedule 重抓即可）`)
  }
} else {
  console.log('  --   schedule.auto.json     不在场（跑 npm run data:schedule 抓取；页面会自动降级成只显示手写层）')
}

derProblems.slice(0, 8).forEach((p) => console.log('         ' + p))
if (derProblems.length) failed += derProblems.length

console.log(failed ? `\n校验未通过：${failed} 处问题` : '\n全部通过。')
process.exit(failed ? 1 : 0)
