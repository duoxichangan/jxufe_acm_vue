/**
 * 显示排名：把「比赛奖牌 + 手写战绩 + 荣誉加项」折算成一个可比的分值，
 * 用来决定**优秀成员页的显示顺序**（不是给卡片加一个数字徽标）。
 *
 * ── 为什么用「可解释的加权积分」而不是 Elo / TrueSkill ─────────────────────
 *  1. 站内数据里能拿到的难度信号很薄：xCPC 团队奖 77 行（icpc 32 + ccpc 45，
 *     见 public/data/awards/）**没有任何名次字段**，只有奖牌档位与赛事层级；
 *     有真实名次的只有蓝桥杯个人榜（省内组别名次）与天梯赛（分数）。
 *     拿不到对手强度，就算不出可信的 Elo 期望胜率。
 *  2. 工作区另有一个独立项目 `07_技术项目/Jxufe Rating` 用 TrueSkill 算校内 Rating，
 *     但它**明确不含蓝桥省赛/国赛**（那份数据的理由是「仅奖项无排名」），而蓝桥杯
 *     恰好是站内最大的数据源（17 届 2863 行个人成绩）；它也不含毕业去向/个人荣誉。
 *  3. 排序要能对成员解释。所以这里的每个数字都指着一条写明的规则，
 *     全部权重集中在下面四张表里，会长改一个数字就能调整口径。
 *
 * ── 口径（2026-09 设计，改动前先看这里）──────────────────────────────────
 *  · 总分 = 比赛奖牌分 + 手写战绩分 + 荣誉加项 × HONOR_SCALE
 *  · 比赛奖牌分 = 每个系列只取**最高的那一条**计满分，同系列其余记录一律 × EXTRA_FACTOR(0.1)
 *    —— 2026-09-22 会长裁定：「单一比赛只计入最高，数量叠加只提供很小的贡献（10%）」。
 *    「系列」= xCPC / 天梯赛 / 蓝桥杯 / 百度之星，即 xCPC 的区域赛＋邀请赛＋省赛
 *    只按其中最高的那一条算，天梯赛的团体＋个人也只按最高的那一条算（其余各 10%）。
 *  · 名次型奖项（冠军/亚军/季军）在档位基准分之上再乘 RANK_MULTIPLIER（季军也有小幅加成）
 *  · 档位基准 10/5/3 对应 ICPC 官方金:银:铜 = 10%:20%:30% 的名额比例
 *  · **特等奖（grand）独立成一档、单独计数**（2026-09 会长裁定）：基准分 16
 *    = 金牌 10 × RANK_MULTIPLIER.champion 1.6，即「比金牌还高一档」。
 *    它在胶囊里显示 🏆（见 honorPills.js），不并入金牌；全站当前只有一条
 *    （第五届蓝桥杯国赛 陈天楚，PR #13 补回）。手写条目里的「特等」同走这一档。
 *  · 层级系数以「xCPC 亚洲区域赛 = 1.0」为基准，其余按参赛规模与对手强度定档
 *  · 团体奖队内每人各计满额（沿用站点胶囊口径，见 honorPills.js）
 *  · 累计全部历史成绩（会长 2026-09 裁定），不做时间衰减
 *  · 手写战绩（members.json 里 type=contest 的条目）覆盖站内数据查不到的赛事：
 *    睿抗 / 传智杯 / 数学建模 / CSP / 名次类（季军、首刀）；可用 `points` 字段显式覆盖
 *  · 荣誉加项：毕业去向（保研/考研/就业）与学业荣誉（国奖/国励/加权第一/优秀学生/职务）
 *  · 玩梗类荣誉（「江财网安神」「程设守门员」「亲传弟子」）与联系方式不计分
 *
 * ── 确定性 ────────────────────────────────────────────────────────────
 *  排序键：总分 ↓ → 单条最高分 ↓ → 比赛记录条数 ↓ → 姓名（localeCompare 'zh'）
 *  四段全同才可能并列，保证同一份数据永远得到同一个顺序（构建/渲染可复现）。
 */

import { collectRecords, MANUAL_PILLS, loadHonorRecords } from './honorPills.js'
import { MEDAL_EMOJI_REVERSE } from './contestTaxonomy.js'

/* ───────────────────────── 表 1：档位基准分 ───────────────────────── */

/**
 * 金牌 10 / 银牌 5 / 铜牌 3 —— 对应 ICPC 官方金银铜 10%:20%:30% 的名额比例。
 * 特等奖 16 = 金牌 10 × RANK_MULTIPLIER.champion(1.6)（2026-09 会长裁定，见文件头）。
 */
export const MEDAL_BASE = { grand: 16, gold: 10, silver: 5, bronze: 3 }

/* ───────────────────────── 表 2：赛事层级系数 ───────────────────────── */

/**
 * 以「xCPC 亚洲区域赛」为 1.0 基准。
 * 括号里是定档依据（写进注释是为了让成员问起来时有话可说）。
 */
export const LEVEL_WEIGHT = {
  // xCPC：区域赛是本校能参加的最高层级赛事，全国强队同场（每场约 400 队）
  'xcpc|区域赛': 1.0, //   ICPC/CCPC 亚洲区域赛、CCPC 全国赛分站
  'xcpc|邀请赛': 0.5, //   全国邀请赛：全国范围，但强队参与度低于区域赛
  'xcpc|省赛': 0.2, //     省级（数据里即「暨江西省赛」），对手以省内高校为主
  'xcpc|girls': 0.35, //   CCPC 女生专场：全国性质、参赛队较少
  // 天梯赛：全国 595 校 18062 人（2026 届 scale），个人一等奖为全国前约 4%（名额 791）
  'gplt|团体': 0.55,
  'gplt|个人': 0.55,
  // 天梯赛「省赛」段 = 省内个人名次（黄亦诚 2025 省内第 1 等，推算法见 honorPills.js 注释）。
  // **与「蓝桥杯省赛」同系数**（2026-09-24 会长裁定：「天梯省赛就按蓝桥省赛同等数据算」）——
  // 两者都是「省级范围内的名次」，量级可比；不要拿它跟 gplt|个人(0.55) 比，那是国家级档位。
  // 不登记它会落进 LEVEL_FALLBACK(0.1)。
  'gplt|省赛': 0.12,
  // 蓝桥杯：国赛选手须先进入省内前约 10%；省赛参赛基数大、门槛低
  'lanqiao|国赛': 0.5,
  'lanqiao|省赛': 0.12,
  // 百度之星：决赛为全国赛，初赛（数据里记作「省赛」）为线上初赛
  'baidu|国赛': 0.5,
  'baidu|省赛': 0.12,
}

/** 层级系数的兜底值：数据里出现了未登记的分段时，按最低档计，避免静默按 1.0 计满分 */
export const LEVEL_FALLBACK = 0.1

/* ───────────────────────── 表 3：同一系列只计最高 ───────────────────────── */

/**
 * 每个系列只把最高的那一条计入满分，同系列其余记录（更低档位、或重复获奖）
 * 一律按 EXTRA_FACTOR 折算 —— 这是刻意的刷量上限：
 * 拿再多低档奖牌，也超不过「同系列里有一块高档奖牌」的人。
 * 2026-09-22 会长裁定为 10%。
 */
export const EXTRA_FACTOR = 0.1

/**
 * 手写战绩里「睿抗国一*4」这种自带次数的写法仍用递减（会长只要求改比赛奖牌口径，
 * 手写条目保持原样）。等比数列和 ≈ 1/(1-0.7) = 3.33。
 */
export const REPEAT_DECAY = 0.7
export const REPEAT_FLOOR = 0.2

/* ───────────────────────── 表 4：荣誉加项 ───────────────────────── */

/**
 * 荣誉整体权重旋钮：会长想「更看重比赛」就往下调，想「更看重综合」就往上调。
 * 2026-09-22 会长裁定取 1.5（比比赛成绩略重）——调这个值不需要动任何其它表。
 */
export const HONOR_SCALE = 1.5

/**
 * 名次型战绩的倍率（作用于金牌基准分 10）：
 * 冠/亚/季军本身就是前三名，含金量高于「金牌」档（后者是前 10%）。
 * 2026-09-22 会长裁定：季军原来取 1.0（等于没有名次加成），改为 1.2 —— 冠亚军不动。
 */
export const RANK_MULTIPLIER = { champion: 1.6, runnerup: 1.3, third: 1.2 }

/** 手写「参赛经历」分值：条目只写了赛事名、没有任何档位/名次词时的保守取值 */
export const ATTEND_POINTS = 0.6

/**
 * 「认得出档位但不计分」的档位词：优秀奖 / 优胜奖，计 0 分。
 * 胶囊聚合口径本就不把优秀奖算作奖牌（见 `src/utils/honorPills.js` 文件头「不计优秀奖」），
 * 手写条目照同一口径。**关键：不能让它落进 ATTEND_POINTS 的「参赛经历」分支** ——
 * 那条的前提是「只写了赛事名、没有任何档位/名次词」，而写「优秀奖」的条目是写了档位的，
 * 给它 0.6 分等于把「优秀奖」当「参赛」。2026-09-24 会长裁定计 0。
 */
export const NON_SCORING_TIERS = /优秀奖|优胜奖/

/** 毕业去向 */
export const DESTINATION_RULES = [
  { re: /保研|推免/, points: 4.0, label: '保研' },
  { re: /考研|上岸/, points: 4.0, label: '考研上岸' },
  {
    re: /小米|腾讯|阿里|字节|美团|华为|百度|京东|网易|就业|入职|offer|科技|集团|公司|银行|证券|研究院|事务所/i,
    points: 2.5,
    label: '就业',
  },
]

/** 学业荣誉与职务（按条目顺序取第一个命中，故把「国励」放在「国奖」之前无关紧要，但保持可读） */
export const HONOR_RULES = [
  { re: /国励|国家励志奖学金/, points: 1.5, label: '国家励志奖学金' },
  { re: /国家奖学金|国奖/, points: 3.0, label: '国家奖学金' },
  { re: /加权|绩点|GPA|年级第一|学年第一|专业第一/i, points: 2.0, label: '成绩年级第一' },
  { re: /优秀学生|优秀干部|优秀团干|先进|标兵|三好|优秀共青团员/, points: 1.0, label: '校级荣誉' },
  { re: /党员/, points: 0.5, label: '党员' },
  {
    re: /负责人|部长|副部|主席|会长|班长|团支书|委员|干事|队长|主任/,
    points: 1.0,
    label: '学生职务',
  },
]

/**
 * 手写战绩的赛事层级（用于 members.json 里 type=contest 的条目）。
 * 顺序即优先级：先认具体赛事名，再认「区域赛/邀请赛/省赛」这类只说层级的写法
 * （本数据里这三个词只属于 xCPC），最后才按赛事名兜底。
 */
export const MANUAL_LEVELS = [
  { re: /睿抗|RAICOM/i, weight: 0.4, label: '睿抗（RAICOM）国赛' },
  { re: /传智杯/, weight: 0.35, label: '传智杯' },
  { re: /数学建模/, weight: 0.45, label: '全国大学生数学建模竞赛' },
  { re: /区域赛/, weight: 1.0, label: 'xCPC 区域赛' },
  { re: /邀请赛/, weight: 0.5, label: 'xCPC 邀请赛' },
  { re: /省赛/, weight: 0.2, label: 'xCPC 省赛' },
  { re: /ICPC|CCPC|xCPC/i, weight: 0.5, label: 'xCPC（未标层级，保守按邀请赛计）' },
  { re: /蓝桥/, weight: 0.5, label: '蓝桥杯（未标层级，按国赛计）' },
  { re: /天梯/, weight: 0.55, label: '天梯赛' },
]

/* ───────────────────────── 基础工具 ───────────────────────── */

const TIER_RULES = [
  // 特等必须排在 gold 之前：老规则把「特等」与「一等」一并算金牌，现在特等是独立一档（16 分）
  ['grand', /特等/],
  ['gold', /冠军|一等奖|金奖|金牌|一等|国一|省一|第一名|第\s*1\s*名/],
  ['silver', /亚军|二等|银奖|银牌|国二|省二|第二名|第\s*2\s*名/],
  ['bronze', /季军|三等|铜奖|铜牌|国三|省三|第三名|第\s*3\s*名/],
]

/**
 * 名次型战绩的识别。注意**不要**把「首刀」「满分」塞进来：
 * 「省赛季军+首刀」若让首刀命中冠军规则，会把季军误升成冠军（设计时踩过）。
 * 首刀是附加成就，按下面 FIRST_BLOOD_POINTS 单独加分。
 */
const RANK_RULES = [
  ['champion', /冠军|第一名|第\s*1\s*名/],
  ['runnerup', /亚军|第二名|第\s*2\s*名/],
  ['third', /季军|第三名|第\s*3\s*名/],
]

/** 首刀（全场第一个过题）：附加成就，小幅加分 */
export const FIRST_BLOOD_POINTS = 0.5

/**
 * 奖项文字里的名次倍率（冠军/亚军/季军）。
 * 站点结构化数据里目前 0 条命中（榜单只写「金牌/一等」这类档位词），保留这条通路是为了
 * 将来某届榜单直接写「冠军」时，与手写条目用同一套倍率，不会两处口径分叉。
 */
function rankFactorOf(award) {
  const hit = RANK_RULES.find(([, re]) => re.test(String(award || '')))
  return hit ? RANK_MULTIPLIER[hit[0]] : 1
}

/** 档位基准分 → 层级系数 → 名次倍率，得到单条奖牌的分值 */
export function recordPoints(record) {
  const base = MEDAL_BASE[record?.medal] ?? 0
  if (!base) return 0
  const key = `${record.family}|${record.segment}`
  const level = LEVEL_WEIGHT[key] ?? LEVEL_FALLBACK
  return base * level * rankFactorOf(record?.award)
}

/** 第 k 次（k 从 0 起）的递减系数 */
export const repeatFactor = (k) => Math.max(REPEAT_DECAY ** k, REPEAT_FLOOR)

/**
 * 比赛奖牌记录 → 分值：**按系列分组，只有最高的一条计满分，其余 × EXTRA_FACTOR**。
 * 同分时按年份升序决定谁当「最高」，保证同一份数据每次得到同样的分配。
 * @param {{family:string, segment:string, medal:string, year:string, award:string}[]} records
 * @returns {{ total:number, count:number, best:number, items:{label:string,points:number}[] }}
 */
export function scoreRecords(records = []) {
  const groups = new Map()
  for (const r of records) {
    const pts = recordPoints(r)
    if (!pts) continue
    if (!groups.has(r.family)) groups.set(r.family, [])
    groups.get(r.family).push({ record: r, pts })
  }
  let total = 0
  let count = 0
  let best = 0
  const items = []
  for (const [family, list] of groups) {
    // 分值降序（并列时年份早的在前），第 0 条是这一系列的最高奖
    list.sort((a, b) => b.pts - a.pts || String(a.record.year).localeCompare(String(b.record.year)))
    const topPoints = list[0]?.pts ?? 0
    list.forEach((entry, k) => {
      const points = k === 0 ? entry.pts : entry.pts * EXTRA_FACTOR
      total += points
      count += 1
      if (entry.pts > best) best = entry.pts
      items.push({
        key: family,
        label: describeRecord(entry.record),
        points,
        raw: entry.pts,
        nth: k + 1,
        top: k === 0,
        // 供核验读：这条是不是该系列的最高奖（不是则只值 10%）
        topPoints,
      })
    })
  }
  return { total, count, best, items }
}

/** 「xCPC 区域赛🥉」式短标签（仅用于核验输出与将来的悬停说明） */
export function describeRecord(record) {
  const family = { xcpc: 'xCPC', gplt: '天梯赛', lanqiao: '蓝桥杯', baidu: '百度之星' }[record.family] || record.family
  const segment = record.segment === 'girls' ? '女生专场' : record.segment
  const medal = { grand: '特', gold: '金', silver: '银', bronze: '铜' }[record.medal] || record.medal
  return `${family}${segment}${medal}`
}

/* ───────────────────────── 手写战绩（type=contest） ───────────────────────── */

/**
 * 解析一条手写战绩。返回 { points, label }；识别不出赛事时返回 0 分并保留原文，
 * 以便核验脚本把「没算进去的条目」全部列出来（避免静默漏算）。
 */
export function scoreManualContest(text) {
  const raw = String(text || '')
  if (!raw) return { points: 0, label: '', raw }
  // CSP 认证：与竞赛不同体系，单独给分（满分是全国极少数）
  if (/csp/i.test(raw)) {
    if (/满分/.test(raw)) return { points: 3.0, label: 'CSP 满分', raw }
    return { points: 1.0, label: 'CSP 认证', raw }
  }
  const level = MANUAL_LEVELS.find((l) => l.re.test(raw))
  if (!level) return { points: 0, label: '', raw }

  // 「*4」「×3」「x2」：同一赛事的多次记录
  const countMatch = raw.match(/[*×x]\s*(\d+)/i)
  const times = countMatch ? Math.max(1, Number(countMatch[1])) : 1

  const rank = RANK_RULES.find(([, re]) => re.test(raw))
  const tier = TIER_RULES.find(([, re]) => re.test(raw))

  let unit
  let label
  if (rank) {
    const [kind] = rank
    unit = MEDAL_BASE.gold * RANK_MULTIPLIER[kind] * level.weight
    label = `${level.label} ${({ champion: '冠军', runnerup: '亚军', third: '季军' })[kind]}`
  } else if (tier) {
    const [medal] = tier
    unit = MEDAL_BASE[medal] * level.weight
    label = `${level.label} ${({ gold: '一等', silver: '二等', bronze: '三等' })[medal]}`
  } else if (NON_SCORING_TIERS.test(raw)) {
    // 优秀奖 / 优胜奖：写明了档位，只是这个档位不计分（口径见 NON_SCORING_TIERS）
    unit = 0
    label = `${level.label} 优秀奖（不计分）`
  } else {
    // 只写了赛事名（如「ICPC区域赛 *4」），按参赛经历保守计分
    unit = ATTEND_POINTS
    label = `${level.label} 参赛`
  }

  let points = 0
  for (let k = 0; k < times; k++) points += unit * repeatFactor(k)
  if (/首刀/.test(raw)) points += FIRST_BLOOD_POINTS
  const suffix = (times > 1 ? ` ×${times}` : '') + (/首刀/.test(raw) ? ' +首刀' : '')
  return { points, label: label + suffix, raw, times, ambiguous: !tier && !rank }
}

/* ───────────────────────── 荣誉加项 ───────────────────────── */

/**
 * 解析一条荣誉条目（按 type 分流）。
 *
 * 条目可带 `points`（数字）**显式覆盖**规则算出的分值 —— 用于「要显示、但按既定口径
 * 不该计分」的条目。当前唯一用处：其他协会的会长身份（会长 2026-09-23：「我只是不希望
 * 在优秀成员页显示本协会的会长，其他协会的会长还是可以以荣誉（绿色）的形式显示的」）。
 * 绿色胶囊照常显示，但要按 AGENTS.md「职务只用于显示，不进『卡片显示顺序』的分值」
 * 记 0 分 —— 否则会被下面 HONOR_RULES 的 `/会长/` 命中，白拿 1.0 × HONOR_SCALE。
 */
export function scoreHonorEntry(entry) {
  const text = String(entry?.text ?? entry ?? '')
  const type = entry?.type
  if (!text) return { points: 0, label: '', raw: text }
  if (typeof entry?.points === 'number') return { points: entry.points, label: '显式指定', raw: text, overridden: true }
  if (type === 'contact' || type === 'more') return { points: 0, label: '', raw: text, skipped: type }
  if (type === 'contest') return scoreManualContest(text)
  const rules = type === 'destination' ? DESTINATION_RULES : HONOR_RULES
  const hit = rules.find((r) => r.re.test(text))
  if (!hit) return { points: 0, label: '', raw: text, unmatched: true }
  return { points: hit.points, label: hit.label, raw: text }
}

/* ───────────────────────── 手工战绩胶囊（MANUAL_PILLS） ───────────────────────── */

/** emoji → 档位。表由 contestTaxonomy.js 的 MEDAL_EMOJI 派生（不再手写第二份，
    两处不同步时手写胶囊的「🥉1」会解析不出奖牌、那条战绩静默变 0 分）。
    遍历顺序 = MEDAL_ORDER（🏆 在最前），决定 repeatFactor 的递减次序。 */

/**
 * 解析「xCPC 邀请赛🥉1」式胶囊（MANUAL_PILLS 里手工折算的比赛战绩，
 * 与页面展示的是同一份数据，避免两处口径分叉）。
 *
 * ⚠ 入参是**分段数组**（MANUAL_PILLS 的形状，也是运行时真正传进来的形状：
 * `rankMembers({ manualPills: MANUAL_PILLS })` → `scorePerson` 的 for 循环里
 * `pill` = 一枚胶囊 = 若干档位分段，如 `['xCPC 邀请赛🥉1', '省赛🥇1']`，
 * **系列名只写在第一段上**）。整串文本（string）仍然接受，向后兼容。
 * 所以判据是：**系列从整枚认、档位逐段认**。
 * 先前这里对整枚做 `String(pill)` —— 数组会被**逗号**粘连成一整串，再取
 * 「第一个命中的档位」给全串 emoji 计分：vesper 那枚的 🥉1 与 🥇1 都按 0.5 的邀请赛
 * 系数算，得 6.05 分；而按表应是 🥉1×3×0.5 + 🥇1×10×0.2 = **3.5**。
 */
export function scoreManualPill(pill) {
  const segments = (Array.isArray(pill) ? pill : [pill])
    .map((s) => String(s ?? ''))
    .filter((s) => s.trim())
  const text = segments.join(' ')
  const family = /xCPC/i.test(text) ? 'xcpc' : /天梯/.test(text) ? 'gplt' : /蓝桥/.test(text) ? 'lanqiao' : /百度/.test(text) ? 'baidu' : null
  if (!family) return { points: 0, label: text, raw: text }
  const levelOf = (s) =>
    /区域赛/.test(s) ? '区域赛' : /邀请赛/.test(s) ? '邀请赛' : /省赛/.test(s) ? '省赛' : null
  /* 某一段自己没写档位时，退回「整枚里第一个出现的档位」（= 旧算法对全串的判法）——
     保证新算法不会漏计旧算法算过的任何一枚奖牌。 */
  const fallbackLevel = segments.map(levelOf).find(Boolean) || null
  let total = 0
  let count = 0
  for (const seg of segments) {
    const segment = levelOf(seg) || fallbackLevel
    if (!segment) continue
    /* 段内计数器：跨 emoji 连续递减（= 旧算法对整串的判法，如「🥈2🥉1」里 🥉 吃 0.7²），
       只在**段与段之间**归零 —— 「邀请赛🥉1」与「省赛🥇1」是两场不同的比赛，
       不是同一战绩重复获奖（REPEAT_DECAY 是给「同一战绩 ×N」准备的）。
       单段入参（含整串文本那条兼容路径）因此与旧算法逐位相同。 */
    let k = 0
    for (const [emoji, medal] of Object.entries(MEDAL_EMOJI_REVERSE)) {
      const m = seg.match(new RegExp(`${emoji}\\s*(\\d+)`))
      if (!m) continue
      const times = Number(m[1])
      const unit = MEDAL_BASE[medal] * (LEVEL_WEIGHT[`${family}|${segment}`] ?? LEVEL_FALLBACK)
      for (let t = 0; t < times; t++) {
        total += unit * repeatFactor(k)
        k += 1
        count += 1
      }
    }
  }
  return { points: total, label: text, raw: text, count }
}

/* ───────────────────────── 汇总：一个人的分 ───────────────────────── */

/**
 * @param {{ name:string, honors?:{text:string,type:string}[], records?:object[], manualPills?:string[][]|string[] }} person
 * @returns {{ total:number, contest:number, manual:number, honor:number, medalCount:number, best:number, items:object[] }}
 */
export function scorePerson({ name, honors = [], records = [], manualPills = [] } = {}) {
  const contest = scoreRecords(records)
  let manual = 0
  let honor = 0
  let best = 0
  const items = []

  for (const entry of honors) {
    const r = scoreHonorEntry(entry)
    if (entry?.type === 'contest') {
      manual += r.points
      if (r.points > best) best = r.points
      if (r.points > 0 || r.ambiguous) items.push({ source: '手写战绩', ...r })
    } else if (r.points > 0) {
      honor += r.points
      items.push({ source: '荣誉', ...r })
    } else if (r.unmatched) {
      items.push({ source: '荣誉', ...r, points: 0 })
    }
  }

  for (const pill of manualPills) {
    const r = scoreManualPill(pill)
    manual += r.points
    if (r.points > best) best = r.points
    items.push({ source: '手工战绩胶囊', ...r })
  }

  for (const it of contest.items) items.push({ source: '比赛', ...it })

  return {
    name,
    total: contest.total + manual + honor * HONOR_SCALE,
    contest: contest.total,
    manual,
    honor,
    medalCount: contest.count,
    best,
    items,
  }
}

/**
 * 给一批人算分并排序。
 * @param {{ members:{name:string,honors?:object[]}[], recordsByName?:Map<string,object[]>, manualPills?:Record<string,string[]> }} params
 * @returns {{ rows:object[], byName:Map<string,object> }} rows 已按排序键降序
 */
export function rankMembers({ members = [], recordsByName = new Map(), manualPills = {} } = {}) {
  const rows = members.map((m) =>
    scorePerson({
      name: m.name,
      honors: m.honors || [],
      records: recordsByName.get(m.name) || [],
      manualPills: manualPills[m.name] || [],
    })
  )
  rows.sort(
    (a, b) =>
      b.total - a.total ||
      b.best - a.best ||
      b.medalCount - a.medalCount ||
      String(a.name).localeCompare(String(b.name), 'zh')
  )
  rows.forEach((r, i) => {
    r.rank = i + 1
  })
  return { rows, byName: new Map(rows.map((r) => [r.name, r])) }
}

/* ───────────────────────── 站点加载（异步） ───────────────────────── */

/**
 * 按算出的名次给任意列表排序（页面显示用）。
 * 未登记排名的人保留原相对顺序并排在最后；用下标兜底比较，保证排序稳定、可复现。
 */
export function sortByRanking(list = [], byName = new Map()) {
  return list
    .map((item, index) => ({
      item,
      index,
      rank: byName.get(item.name)?.rank ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((x) => x.item)
}

/**
 * 优秀成员页用的加载入口：站内竞赛数据（与胶囊共用缓存）→ 记录索引 → 排名。
 * @param {{name:string,honors?:object[]}[]} members
 */
export async function loadMemberRanking(members = []) {
  const recordsByName = await loadHonorRecords()
  return rankMembers({ members, recordsByName, manualPills: MANUAL_PILLS })
}

/**
 * 排名加载的**超时策略**：3 秒没回来就先按 JSON 原顺序渲染，**迟到的那份仍然生效**。
 *
 * 为什么不是「超时即放弃」：优秀成员页原先在超时后把 byName 置成空 Map、又用 `byName.value`
 * 挡住重跑，于是一份 3.1 秒才到的排名被**永久丢弃**（页面从此停在 JSON 原序，直到刷新）。
 * 「退化成原序」本身是文档化契约（sortByRanking 给未登记的人 Number.MAX_SAFE_INTEGER、
 * 再按原下标稳定排序，出来就是原顺序），但「迟到即永久降级」不是 —— 网络慢一次就再没有排名。
 *
 * @param {{name:string}[]} members
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs=3000] 先按原序渲染的等待上限
 * @param {(members:object[]) => Promise<{byName:Map}|null>} [opts.load] 只为可测而注入，默认走站点数据
 * @param {(byName:Map) => void} [opts.onApply] 只给**真实**排名（可能调两次：先及时的那份，后迟到的那份）
 * @param {() => void} [opts.onTimeout] 「可以按原顺序渲染了」的信号（超时降级，或加载直接失败）
 * @returns {Promise<{byName:Map}|null>} 最终生效的那次结果（加载失败 / 始终没回来 = null）
 */
export async function rankWithTimeout(
  members = [],
  { timeoutMs = 3000, load = loadMemberRanking, onApply, onTimeout } = {}
) {
  /* 失败一律折算成 null：这一层不该把 rejection 抛给 watch 回调（那会变成未处理的 rejection ——
     页面上什么都没发生，控制台里一条红字）。真实原因由 loadHonorRecords 的降级信号报出来。 */
  const ranking = Promise.resolve()
    .then(() => load(members))
    .catch((err) => {
      console.warn('[honorRanking] 排名加载失败，先按 JSON 原顺序渲染：', err)
      return null
    })

  let timer = null
  const first = await Promise.race([
    ranking,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs)
    }),
  ])
  if (timer) clearTimeout(timer)

  if (first) {
    onApply?.(first.byName)
    return first
  }
  /* 超时（或加载失败）：给页面一个「可以按原顺序渲染了」的信号 —— **不是**「还没准备好」。
     2026-09-24 踩过：原先这里回调 `onApply(null)`，而 ExcellentView 的模板拿「排名为 null」
     当骨架屏条件，这条降级被原样抵消 —— 网格一直等到真排名回来（慢网下远超 3 秒），
     「3 秒先按原序渲染」这条契约事实上从未生效。改成本回调之后，页面不必再分辨 null。 */
  onTimeout?.()
  const late = await ranking // 等的是同一个 promise：迟到的排名仍然生效
  if (late) onApply?.(late.byName)
  return late
}

export { collectRecords }
