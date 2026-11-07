/**
 * 荣誉条目分类。
 *
 * 「优秀成员」与「协会负责人」两个页面上的荣誉标签按类型分色：比赛 / 毕业去向 /
 * 个人荣誉·职位 / 联系方式（另有第五类「会长身份」，只用于头像墙的身份胶囊）。
 * （配色见 styles/tokens.css 的 --honor-*，标签样式见 styles/honors.css）。
 *
 * 数据侧优先：members.json / leaders.json 里每条荣誉可以写成对象并显式标注类型——
 *   { "text": "保研至北京邮电大学", "type": "destination" }
 * 漏标、或仍写成纯字符串时，由下面的关键词规则兜底猜一个类型，
 * 保证以后谁手写一条新荣誉也不会漏色。
 *
 * `type` 既接受英文键，也接受中文名（比赛 / 去向 / 荣誉 / 联系）；
 * 写错的值不报错，退回关键词判断。
 */

/** 类型键 → 中文名（标签的 title 提示用） */
export const HONOR_TYPE_LABELS = {
  contest: '比赛',
  destination: '毕业去向',
  honor: '个人荣誉 / 职位',
  contact: '联系方式',
  leader: '人物标签',
  more: '更多荣誉',
}

/** 显式 type 的别名表：中英文写法都认（英文不区分大小写） */
const TYPE_ALIASES = {
  contest: 'contest',
  competition: 'contest',
  award: 'contest',
  比赛: 'contest',
  竞赛: 'contest',
  赛事: 'contest',
  destination: 'destination',
  graduation: 'destination',
  去向: 'destination',
  毕业去向: 'destination',
  升学: 'destination',
  就业: 'destination',
  honor: 'honor',
  荣誉: 'honor',
  个人荣誉: 'honor',
  职位: 'honor',
  个人荣誉职位: 'honor',
  contact: 'contact',
  联系: 'contact',
  联系方式: 'contact',
  社交: 'contact',
  leader: 'leader',
  president: 'leader',
  会长: 'leader',
  会长身份: 'leader',
  more: 'more',
  更多: 'more',
  更多荣誉: 'more',
}

/** leaders.json 里用 "..." 表示「还有更多荣誉」 */
const ELLIPSIS = /^(?:\.{3,}|…+)$/

/**
 * 关键词兜底规则，自上而下取第一条命中的。
 * 顺序有讲究：
 *   1. 去向最先——「保研至北京邮电大学」里也含「大学」，被别的规则截胡就错了；
 *   2. 联系方式（「关注小羊谢谢喵」这类彩蛋/社交）；
 *   3. 个人荣誉 / 职位（奖学金、优秀学生、协会职务）；
 *   4. 都不命中则按比赛算——荣誉字段里本就以竞赛奖项为主，
 *      而且这样兜底的观感与「全部一个颜色」的改造前一致，不会把没标的新条目变突兀。
 *
 * 「会长身份」（leader）**刻意不进兜底规则**：它只由协会成员头像墙按 leaders.json 的
 * session 显式生成（来源见 AGENTS.md 的「协会职务胶囊」节）。若把「会长」加进下面的
 * 关键词表，含「会长」二字的手写条目会整条变成金色，改动就溢出到优秀成员页与负责人页了。
 */
const FALLBACK_RULES = [
  ['destination', /保研|考研|直博|留学|升学|去向|上岸|入职|就职|就业|签约|offer/i],
  ['destination', /硕士|博士|研究生/],
  ['destination', /(?:至|到)[^，。；]{2,20}?(?:大学|学院|研究院|科学院|研究所|实验室)/],
  ['destination', /^[\u4e00-\u9fa5A-Za-z]{2,10}(?:科技|集团|公司|银行|证券|研究院|事务所)$/],
  ['contact', /🛰|📮|微信|QQ|邮箱|二维码|公众号/i],
  ['contact', /关注|B站|bilibili|友链|博客|个人站|主页|喵/],
  ['contact', /https?:\/\/|www\.|[\w-]+\.(?:com|cn|net|org|site|me|top|dev|io)\b/i],
  // 「优秀(?!奖)」：蓝桥杯的「国家级优秀奖」是竞赛奖项档位，不是个人荣誉，别被「优秀」两个字截胡
  ['honor', /奖学金|国奖|国励|助学|优秀(?!奖)|先进|标兵|三好|党员|团员|干部|团干/],
  ['honor', /负责人|部长|副部|主席|会长|班长|团支书|委员|干事|队长|主任|年级第一|专业第[一二三四五1-5]|加权|绩点|GPA/i],
]

function aliasOf(key) {
  if (key == null) return ''
  const raw = String(key).trim()
  if (Object.prototype.hasOwnProperty.call(TYPE_ALIASES, raw)) return TYPE_ALIASES[raw]
  const lower = raw.toLowerCase()
  return Object.prototype.hasOwnProperty.call(TYPE_ALIASES, lower) ? TYPE_ALIASES[lower] : ''
}

/** 取出一条荣誉的文本（兼容字符串写法与 { text } 对象写法） */
export function honorText(item) {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object') {
    return String(item.text ?? item.label ?? item.name ?? '')
  }
  return ''
}

/** 判定一条荣誉的类型：显式标注优先，否则关键词兜底 */
export function resolveHonorType(item) {
  if (item && typeof item === 'object') {
    const alias = aliasOf(item.type)
    if (alias) return alias
  }
  const text = honorText(item)
  if (ELLIPSIS.test(text.trim())) return 'more'
  for (const [type, pattern] of FALLBACK_RULES) {
    if (pattern.test(text)) return type
  }
  return 'contest'
}

/**
 * ICPC / CCPC 这类拉丁缩写前后补一个空格（会长 2026-09-23）：
 *   「2024ICPC江西省赛季军」→「2024 ICPC 江西省赛季军」
 *   「CCPC湘潭邀请赛铜牌」 →「CCPC 湘潭邀请赛铜牌」（开头那个空格会被 trim 掉）
 * 只动空白、不改别的字符；本来就带空格的（「CCPC 东盟…」）结果不变。
 * 放在**展示归一化**里做而不是去改数据：需要它的是渲染，数据里那 40 多条手写条目
 * 保持原样；口径判定（honorCoverage / honorRanking）匹配的是中文关键词与「优秀奖」
 * 这类字样，不受空格影响，而且它们都在这一步之前跑。
 *
 * 只在本文件内部用（normalizeHonors 调用），不对外导出。
 */
function spaceAcronyms(text) {
  return String(text)
    .replace(/\s*(ICPC|CCPC)\s*/g, ' $1 ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * 把 honors / achievements 数组统一成 [{ text, type }]。
 * @param {Array<string|{text:string,type?:string}>} list
 * @returns {Array<{text:string,type:string}>}
 */
export function normalizeHonors(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    text: spaceAcronyms(honorText(item)),
    type: resolveHonorType(item),
  }))
}
