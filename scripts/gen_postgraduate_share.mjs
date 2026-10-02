#!/usr/bin/env node
/**
 * 保研经验分享（大事记「多作者文章」）生成器
 *
 *   node scripts/gen_postgraduate_share.mjs [--source <默认目录>] [--check] [--reset-text]
 *
 * 输入：每位分享人的一篇 Markdown 原文，一个文件 = 一位分享人。
 *       默认到 <默认目录>/<名字>经验分享.md 找；名字对不上或文件在别的目录时，
 *       在那个人身上写 `file:` 直接指定（见下方 SHARE 表）。
 * 输出：public/data/events/<年>.json 里的一条「多作者文章」：
 *
 *   "2026-10-2-postgraduate-share": {
 *     "title": "协会成员保研经验分享贴",
 *     "date": "2026-10-02",
 *     "subtitle": "…",
 *     "authors": [ { name, group, grade, meta, final, blocks: [...] }, … ]   ← 按年级升序（见 SHARE）
 *   }
 *   + cards 里对应的一张时间轴卡片（date 倒序插到正确位置）
 *
 * 为什么要有脚本：原文各 130~190 行、含管道表与十来处标题/引用/列表，手抄一遍必然出错；
 * 脚本转换是幂等的，**加一位分享人 = 丢一个 md + 在 SHARE 里登记一行 + 重跑**。
 *
 * ⚠ 生成边界（重要，别手动改错地方）：
 *   - 生成器**只管** `authors[]` 的 name/group/grade/blocks 与文章 `title`/`date`。
 *   - `final`（去向）与文章 `subtitle`、卡片 `tagline` 是**人写过的就保留**：
 *     文件里已有值 → 原样不动；没有（或传 `--reset-text`）才用原文抠出来的 / 兜底值。
 *     原文没写成「最终去向：X」时抠不出干净的校名，就在 SHARE 里给那个人写 `final`
 *     （人工收敛一次，之后重跑一直是它）。
 *   - 卡片的 `title` 跟着文章 `title` 走（校验强制两者一致）。
 *
 * 支持的 Markdown 子集（刻意只做原文用到的那几种）：YAML frontmatter（丢弃）、
 * #/##/### 标题、段落、无序号列表、管道表格、`> 引用`、`![](图)` 独立成行。
 * 不支持（原文没有）：代码围栏、行内代码、嵌套列表、有序列表、HTML。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const YEAR = '2026'
const ID = `${YEAR}-10-2-postgraduate-share`
const DATE = `${YEAR}-10-02`
const CATEGORY = 'club'
const EVENTS_DIR = path.join(ROOT, 'public', 'data', 'events')

/**
 * 是否置顶这条大事记。
 * true  → 卡片写进 top.json 的「置顶」区（大事记页最上面一块），年份文件里不留
 * false → 卡片回到年份文件的时间轴上（按日期倒序）
 * ⚠ 同一张卡片**不能两处都放**（校验会报「新闻在时间轴里重复出现」），
 *   所以这里是个开关，两个文件由脚本各自清理。
 */
const PINNED = true

/** 文案兜底值（只在文件里缺这些字段时用；人写过就不动，见文件头「生成边界」） */
const FALLBACK = {
  title: '协会成员保研经验分享贴',
  subtitle: '潺潺流水终于穿过了群山一座座。',
  tagline: '命运的洪流不可阻挡，我的回答是向前！'
}

/** 默认到哪个目录找 `<名字>经验分享.md`（仓外；用 --source 换） */
const DEFAULT_SOURCE_DIR = 'C:\\Users\\duoxichangan\\Desktop\\share'

/**
 * 分享人登记表：**加人只改这里**。
 *   name  展示名（切换器 tag 上的字，也是文件名前缀）
 *   group 队伍/归属（当前不上屏，存着备用）
 *   grade 年级，显示在 tag 上（如 '2023级'）。**切换器里的先后顺序按年级升序自动排**
 *         （先 2022 级，再 2023 级…），所以这里按什么顺序写都不影响页面顺序
 *   file  可选：原文路径（绝对路径，或相对默认目录）。不写就找 `<默认目录>/<name>经验分享.md`
 *   final 可选：最终去向。原文里有「最终去向：X」就自动抠，没有（只写了半句、或写成一句话）才在这里补
 */
const SHARE = [
  { name: 'duoxichangan', group: '喜欢只是错觉', grade: '2023级' },
  { name: 'ErrorNotFound', group: '喜欢只是错觉', grade: '2023级' },
  {
    name: '𝐉𝐮𝐧𝐢𝐞',
    group: '喜欢只是错觉',
    grade: '2022级',
    file: 'C:\\Users\\duoxichangan\\Downloads\\PosgraRecExp.md',
    // 原文写法：「### 最终去向」下面一整句「华东师范大学软件工程学院软件工程专业(085405-01)。」
    // 抠不出干净的校名，人工收敛成这一条（别在页面上写一长串专业代码）
    final: '华东师范大学 软件学院'
  }
]

/** `#` 之后的标题 → 图标；没命中就用默认 */
const HEADING_ICONS = [
  [/写在前面|前言/, 'fa-feather-pointed'],
  [/bg|背景|笔者/i, 'fa-id-card'],
  [/夏令营/, 'fa-sun'],
  [/预推免/, 'fa-hourglass-half'],
  [/去向/, 'fa-flag-checkered'],
  [/简历/, 'fa-file-lines'],
  [/套磁/, 'fa-envelope-open-text'],
  [/机试/, 'fa-keyboard'],
  [/面试/, 'fa-comments'],
  [/考核/, 'fa-clipboard-check'],
  [/推荐/, 'fa-user-check'],
  [/定位|海投|选择/, 'fa-code-branch'],
  [/交流/, 'fa-people-group'],
  [/准备好/, 'fa-hourglass-start'],
  [/鸽|院校/, 'fa-triangle-exclamation'],
  [/释放/, 'fa-handshake'],
  [/科研/, 'fa-flask'],
  [/竞赛/, 'fa-trophy'],
  [/心态|焦虑/, 'fa-heart-pulse'],
  [/经验|心得|建议/, 'fa-lightbulb'],
  [/写在最后|结语|总结|后记/, 'fa-flag-checkered']
]
const iconFor = (text) => (HEADING_ICONS.find(([re]) => re.test(text)) || [, 'fa-bookmark'])[1]

/**
 * 标题层级归一到 1..3。
 *
 * 三篇原文的写法各不相同：duoxichangan 用 h1/h2、ErrorNotFound 用 h1/h2/h3、
 * 𝐉𝐮𝐧𝐢𝐞 从 h2 起步（h2/h3/h4）。原文的 `#` 数量在**同一篇文章里**才是相对的，
 * 三篇并排放在一起就没法直接比 —— 所以按「每篇自己的最顶层 = 1」来归一，
 * 篇内相对层级保留。这样三篇的「大节 / 小节 / 再下一层」在页面上才是同一套视觉。
 */
function headingNormalizer(md) {
  const levels = [...String(md).matchAll(/^(#{1,6})\s+/gm)].map((m) => m[1].length)
  const base = levels.length ? Math.min(...levels) : 1
  return (hashes) => Math.min(hashes + (1 - base), 3)
}

/**
 * 少数小节在原文里是 `## 心得` 这种「一句话小结」，一个词当小标题太重，
 * 降级成普通段落（内容一字不改，只改呈现层级）。按 `作者::标题` 精确点名。
 */
const DEMOTE_HEADINGS = new Set(['duoxichangan::心得', 'ErrorNotFound::心得'])

/** 去掉 `**加粗**` 与 `**前缀` 这类 Markdown 残渣，抠出来的字段要直接上屏 */
const clean = (s) =>
  String(s || '')
    .replace(/^\*+/, '')
    .replace(/\*+$/, '')
    .replace(/\*\*/g, '')
    .trim()

/**
 * 去掉行内代码的反引号：`` `szu ai` `` → `szu ai`。
 *
 * 站点正文的内联渲染（src/utils/inline.js）只认 `**加粗**`、`[文字](链接)` 与 `~~删除线~~`，
 * 没有行内代码这一档 —— 反引号会**原样显示**成「`szu ai` 是一天半的宣讲」。
 * 原文那里是富文本编辑器（知乎）的代码样式，落成纯文本就该把标记去掉：
 * 只删标记、一个字的正文都不动，原文 .md 也不改（要还原随时能改回来）。
 *
 * 成对的先删；剩下的单个反引号（原稿里有过落单的）也一并去掉，否则页面上会留个孤零零的 `。
 */
const stripCode = (s) => String(s ?? '').replace(/`([^`]*)`/g, '$1').replace(/`/g, '')

/** 丢掉文件开头的 YAML frontmatter（博客导出常见；那是元信息，不该上正文） */
const stripFrontmatter = (md) => String(md).replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')

// ── Markdown 解析 ────────────────────────────────────────────────────────────

const isHeading = (l) => /^#{1,6}\s+/.test(l)
const isQuote = (l) => /^>\s?/.test(l)
const isList = (l) => /^[-*]\s+/.test(l)
const isImageOnly = (l) => /^!\[[^\]]*\]\([^)]+\)$/.test(l.trim())
const isTableSep = (l) => /^\|[\s:|-]+\|$/.test(l.trim()) && l.includes('-')
const isTableRow = (l) => l.trim().startsWith('|') && l.trim().endsWith('|')

const splitRow = (l) =>
  l
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => stripCode(c.trim()))

const imageItem = (l) => {
  const m = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(l.trim())
  return { src: m[2], alt: m[1] || '配图', caption: m[1] || '' }
}

/**
 * Markdown（受支持子集）→ 站点 blocks。
 * 连续段落合并进同一个 text block 的 paras（少一些对象，渲染出来一样）。
 */
function mdToBlocks(md, authorKey = '') {
  const lines = stripFrontmatter(String(md)).replace(/\r\n?/g, '\n').split('\n')
  const normLevel = headingNormalizer(lines.join('\n'))
  const blocks = []
  let paras = []
  const flushParas = () => {
    if (paras.length) {
      blocks.push({ type: 'text', paras })
      paras = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()

    if (!t) {
      flushParas()
      continue
    }

    // 分隔线 `---`：只是版式，丢弃（flush 一下保证前后分成两块）
    if (/^-{3,}$/.test(t)) {
      flushParas()
      continue
    }

    if (isHeading(line)) {
      flushParas()
      const hashes = /^(#{1,6})\s+/.exec(line)[1].length
      const text = stripCode(line.replace(/^#{1,6}\s+/, '').trim())
      if (DEMOTE_HEADINGS.has(`${authorKey}::${text}`)) paras.push(text)
      else blocks.push({ type: 'heading', text, level: normLevel(hashes), icon: `fa-solid ${iconFor(text)}` })
      continue
    }

    if (isTableRow(line)) {
      flushParas()
      const rows = []
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isTableSep(lines[i])) rows.push(splitRow(lines[i]))
        i++
      }
      i-- // 回退到表格后第一行
      const [headers, ...body] = rows
      blocks.push({ type: 'table', headers, rows: body, left: true })
      continue
    }

    if (isImageOnly(line)) {
      flushParas()
      const items = [imageItem(line)]
      // 紧挨着的多张图合成一个 images block
      while (i + 1 < lines.length && isImageOnly(lines[i + 1])) {
        items.push(imageItem(lines[i + 1]))
        i++
      }
      blocks.push({ type: 'images', items })
      continue
    }

    if (isQuote(line)) {
      flushParas()
      const buf = []
      while (i < lines.length && isQuote(lines[i])) {
        const s = lines[i].replace(/^>\s?/, '').trim()
        if (s) buf.push(s)
        i++
      }
      i--
      blocks.push({ type: 'highlight', text: stripCode(buf.join(' ')) })
      continue
    }

    if (isList(line)) {
      flushParas()
      const items = []
      // 允许条目之间夹空行：原文那份 bg 列表就是「一条一段」的写法，
      // 不留神会散成 5 个只有一个条目的 list block。
      while (i < lines.length) {
        if (isList(lines[i])) {
          items.push(stripCode(lines[i].replace(/^[-*]\s+/, '').trim()))
          i++
          continue
        }
        if (lines[i].trim() === '' && i + 1 < lines.length && isList(lines[i + 1])) {
          i++
          continue
        }
        break
      }
      blocks.push({ type: 'list', items })
      continue
    }

    // 有序列表（`1. xxx`）：原文里是问卷式的问题清单，保留序号、按普通段落排版
    if (/^\d+[.、]\s+/.test(t)) {
      flushParas()
      paras.push(t)
      continue
    }

    // 普通段落：不 flush，连续段落攒进同一个 text block
    paras.push(stripCode(t))
  }

  flushParas()
  return blocks
}

/**
 * 从正文里抠出「最终去向」，只认明确的写法：「> 最终去向：厦门大学 MAC 组学硕」。
 *
 * ⚠ 刻意不做“聪明”的兜底（去表格里找半句、按作者名猜学校、从一整句里截校名）：
 * 抠出来的去向会直接显示在切换器上，猜错的代价是把别人的学校挂到他头上。
 * 原文没写清楚时**留空**，需要补就在 SHARE 里给那个人写 `final`（人工收敛一次）。
 */
function finalDestOf(md, who) {
  const quoted = /最终去向[：:]\s*([^\n*|]+)/.exec(md)
  if (quoted) return clean(quoted[1])
  if (/最终去向/.test(md)) {
    console.log(`[info] ${who} 的原文没写成「最终去向：X」，final 留空（需要的话在 SHARE 里补）`)
  }
  return ''
}

/**
 * 一句话身份行（当前不上屏，存着备用）：专业 + rank。
 * 兼容两种写法：「专业与成绩：数据科学与大数据技术，rank 2 / 104」与
 * bg 列表里的「计算机科学与技术专业」「排名：1/171」。
 */
function metaOf(md) {
  /** 取第一个捕获到非空内容的模式 */
  const first = (...res) => {
    for (const re of res) {
      const m = re.exec(md)
      if (m && m[1] && m[1].trim()) return clean(m[1])
    }
    return ''
  }
  const major = first(
    /专业与成绩[：:]\s*([^，,\n]+)/, // 表格/行内写法：专业与成绩：数据科学与大数据技术，rank 2 / 104
    /^[-*]\s*院校[：:][^\n]*?，([^，,\n]+)$/m, // bg 列表：院校：江西四非，计算机科学与技术专业
    /^[-*]\s*专业[：:]\s*(.+)$/m, // bg 列表：专业：计算机科学与技术专业
    /^[-*]\s*(计科专业)(?=\s*rank)/m, // bg 列表：计科专业 rank 1 / 130+（只取专业名，rank 交给下面）
    /^[-*]\s*院校[：:]\s*(.+)$/m // 没写专业时退回院校
  )
  const rank = first(
    /rank\s*([0-9]+\s*\/\s*[0-9]+)/i, // 「rank 2 / 104」
    /^[-*]\s*排名[：:]\s*([0-9]+\s*\/\s*[0-9]+)/m // bg 列表：排名：1/171
  )
  return [major, rank ? `rank ${rank.replace(/\s+/g, '')}` : ''].filter(Boolean).join(' · ')
}

// ── 组装 ────────────────────────────────────────────────────────────────────

/** 找这个人的原文：先 `file:`，再 `<默认目录>/<name>经验分享.md`，最后 `<默认目录>/<name>.md` */
function resolveSource(person, sourceDir) {
  const cands = []
  if (person.file) cands.push(path.isAbsolute(person.file) ? person.file : path.join(sourceDir, person.file))
  cands.push(path.join(sourceDir, `${person.name}经验分享.md`))
  cands.push(path.join(sourceDir, `${person.name}.md`))
  const hit = cands.find((p) => fs.existsSync(p))
  if (!hit) {
    throw new Error(
      `找不到 ${person.name} 的原文。找过：\n  ${cands.join('\n  ')}\n` +
        `（在 SHARE 里给这个人写 file: '<绝对路径>'，或用 --source 指定目录）`
    )
  }
  return hit
}

/** 年级排序键：'2022级' → 2022；没写年级的排最后（1e9），同年级按 SHARE 里的登记顺序 */
const gradeKey = (p) => {
  const m = /(\d{4})/.exec(p.grade || '')
  return m ? Number(m[1]) : 1e9
}

function buildAuthors(sourceDir, prevAuthors = []) {
  // 上一次落盘的 final：人手工收敛过的值（原文抠不出来时）优先于任何自动推导
  const prevFinal = new Map(prevAuthors.map((a) => [a.name, a.final]))
  // 切换器里的先后顺序 = 年级升序（先 2022 级，再 2023 级…）；Array.sort 稳定，
  // 同年级保持 SHARE 里的登记顺序。
  return [...SHARE].sort((a, b) => gradeKey(a) - gradeKey(b)).map((person) => {
    const md = fs.readFileSync(resolveSource(person, sourceDir), 'utf8')
    const blocks = mdToBlocks(md, person.name)
    if (!blocks.length) throw new Error(`${person.name} 的原文解析出 0 个 block`)
    const prior = clean(prevFinal.get(person.name) || '')
    const author = {
      name: person.name,
      group: person.group || '',
      grade: person.grade || '',
      meta: metaOf(md),
      // 去向，三者按优先级：文件里已有的（人或上一次敲定的）> SHARE 里写的 > 从原文抠
      final: prior || person.final || finalDestOf(md, person.name),
      blocks
    }
    // 这些字段会被拼进 JSON 直接上屏：混进表格竖线 / 换行说明抠错了行，
    // 与其静默显示怪东西，不如让生成停下来。
    for (const k of ['name', 'group', 'grade', 'meta', 'final']) {
      if (/[|\n]/.test(author[k])) throw new Error(`${person.name} 的 ${k} 抠出了异常字符：${JSON.stringify(author[k])}`)
    }
    return author
  })
}

function main() {
  const argv = process.argv.slice(2)
  const check = argv.includes('--check')
  const resetText = argv.includes('--reset-text')
  const si = argv.indexOf('--source')
  const sourceDir = si >= 0 ? path.resolve(argv[si + 1]) : DEFAULT_SOURCE_DIR

  const file = path.join(ROOT, 'public', 'data', 'events', `${YEAR}.json`)
  const raw = fs.readFileSync(file, 'utf8')
  const data = JSON.parse(raw)
  data.articles = data.articles || {}
  data.cards = data.cards || []
  const prev = data.articles[ID] || {}

  // 文案（subtitle / tagline）是「人写的」：文件里有就保留，别拿兜底值盖掉；
  // --reset-text 才回到兜底值。title / date / authors 由生成器负责。
  const keep = (cur, fallback) => (resetText || !cur ? fallback : cur)
  const prevCard = data.cards.find((c) => c.link === ID)
  const article = {
    title: FALLBACK.title,
    date: DATE,
    subtitle: keep(prev.subtitle, FALLBACK.subtitle),
    authors: buildAuthors(sourceDir, prev.authors || [])
  }

  const before = JSON.stringify(data)
  data.articles[ID] = article

  // 卡片：字段顺序固定 kind, date, category, title, tagline, link。
  // 置顶时卡片住 top.json（**不能两处都放**，否则时间轴会出现两次，校验会报重复），
  // 所以两个文件各自把同 id 的旧卡片摘掉，再按下面的规则放回去。
  const card = {
    kind: 'news',
    date: DATE,
    category: CATEGORY,
    title: article.title, // 与文章 title 必须一致（校验强制）
    tagline: keep(prevCard && prevCard.tagline, FALLBACK.tagline),
    link: ID
  }
  const topFile = path.join(EVENTS_DIR, 'top.json')
  const topRaw = fs.readFileSync(topFile, 'utf8')
  const topNodes = JSON.parse(topRaw)
  const beforeTop = JSON.stringify(topNodes)

  data.cards = data.cards.filter((c) => c.link !== ID)
  const topKept = topNodes.filter((c) => c.link !== ID)
  if (PINNED) {
    // 置顶：住 top.json。数组最前面 = 最先显示；再按日期倒序排，与被摘掉的顺序无关
    topNodes.splice(0, topNodes.length, card, ...topKept)
    topNodes.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
  } else {
    // 不置顶：按 date 倒序插进年份文件（避免乱序），top.json 里不留
    topNodes.splice(0, topNodes.length, ...topKept)
    const at = data.cards.findIndex((c) => c.date !== null && c.date < DATE)
    data.cards.splice(at === -1 ? data.cards.length : at, 0, card)
  }

  const after = JSON.stringify(data)
  const afterTop = JSON.stringify(topNodes)
  if (before === after && beforeTop === afterTop) {
    console.log(`[ok] 已是最新，无需改动：${ID}（${PINNED ? '置顶' : '进时间轴'}）`)
    return
  }
  const stat = (d) => d.authors.map((a) => `${a.name}(${a.grade || '—'}，${a.blocks.length} blocks)`).join('，')
  if (check) {
    console.log(`[diff] ${ID} 需要更新：${stat(article)}`)
    process.exitCode = 1
    return
  }
  // 行尾跟随原文件（Windows 工作树里是 CRLF，`core.autocrlf=true`）；写死 \n 会把整份
  // 3000+ 行的年份文件变成「全文件重写」，git diff 里看到的就是一整个文件被替换。
  const writeSameEol = (f, obj, template) => {
    const eol = template.includes('\r\n') ? '\r\n' : '\n'
    fs.writeFileSync(f, JSON.stringify(obj, null, 2).split('\n').join(eol) + eol, 'utf8')
  }
  writeSameEol(file, data, raw)
  writeSameEol(topFile, topNodes, topRaw)
  console.log(`[write] ${path.relative(ROOT, file)}`)
  if (beforeTop !== afterTop) console.log(`[write] ${path.relative(ROOT, topFile)}`)
  console.log(`        ${ID}：${stat(article)}`)
  console.log(`        卡片 ${card.date} ${card.title} ｜ ${PINNED ? '置顶' : '时间轴'} ｜ tagline「${card.tagline}」`)
}

main()
