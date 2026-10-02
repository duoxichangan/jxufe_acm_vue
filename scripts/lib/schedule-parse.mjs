/**
 * 近期赛事时间表 · 解析工具（纯函数，无网络）
 * ---------------------------------------------------------------------------
 * 从 scripts/gen_schedule.mjs 抽出来的：那边的适配器负责「去哪取」，这里负责
 * 「取回来的东西怎么变成日期」。分成两半是为了**测得动** —— 国内几个官网给的
 * 赛程日期是「无年份 + 数字与月/日之间夹空格」的写法（ICPC 汇总是 `西安 10 月17- 18 日`，
 * CCPC 是 `长春国赛 … 10.17-18`），只能靠正则啃；而这套正则一旦被官网改版改坏，
 * 页面不会报错，只会**静默少几行**。所以拿实测原文当固定样本钉在
 * test/schedule-parse.test.mjs 里。
 *
 * ⚠ 两条口径（与 src/utils/scheduleView.js 一致，别在这里另立一套）：
 *   1. 时区钉死东八区：给中国学生看的表，日期必须是中国的「几月几号（周几）」。
 *   2. 无年份不许猜：候选 {今年, 明年} 里取不早于今天且 180 天内最近的那个，
 *      否则**丢弃**。往期赛站会因此自动落空 —— 它们本就不该出现在「近期安排」里。
 */

export const DAY_MS = 86400000
const pad = (n) => String(n).padStart(2, '0')

/** 东八区的「今天」'YYYY-MM-DD'（与跑脚本的机器时区无关）。 */
export function todayKey(now = Date.now()) {
  const d = new Date(now + 8 * 3600 * 1000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** UTC 毫秒 → 东八区的 { day, time }。 */
export function msToBeijing(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null
  const d = new Date(ms + 8 * 3600 * 1000) // 先位移到东八区，再按 UTC 读 —— 与构建机时区无关
  return {
    day: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  }
}

/** 秒级（Codeforces）与毫秒级（睿抗 / 百度之星）时间戳都可能出现，按量级判。 */
export function epochToBeijing(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n) || n <= 0) return null
  return msToBeijing(n < 1e12 ? n * 1000 : n)
}

/**
 * 报名**截止**时刻的日期。与 epochToBeijing 只差一条规则：
 * 时刻恰好是东八区 00:00 时，日期往前挪一天。
 *
 * 睿抗的报名窗口就是这么存的：`enrollenddate = 1795968000000` = 2026-11-29T16:00Z
 * = 北京 11-30 00:00 —— 它表达的是「**29 日**结束」，不是「30 日结束」。
 * 截止日只能往早说、不能往晚说：学生照着「30 日」等到 30 号白天，窗口其实已经关了。
 * （2026-10-02 实测值；这条是本表最容易被写错一天的地方。）
 */
export function enrollmentEnd(ms) {
  let t = msToBeijing(ms)
  if (t && t.time === '00:00') t = msToBeijing(Number(ms) - DAY_MS)
  return t ? { day: t.day, time: undefined } : null
}

/** 'YYYY-MM-DD' → 天数序号（UTC 口径，只用于比较）。 */
export const dayNumber = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS)

export function isUpcoming(day, today) {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= today
}

/** 今天起 180 天内算「近期」—— 无年份日期补年时的容差，超出即认为那是往期内容。 */
export const INFER_HORIZON_DAYS = 180

/** 补年规则，见文件头第 2 条。返回 null = 这条不要（宁可少一行，不写错一行）。 */
export function inferYear(month, day, today) {
  if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) return null
  const base = Number(String(today).slice(0, 4))
  for (const y of [base, base + 1]) {
    const key = `${y}-${pad(month)}-${pad(day)}`
    const d = new Date(`${key}T00:00:00Z`)
    // 反查一遍，挡掉 2 月 30 日这种被 Date 静默滚动的写法
    if (d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) continue
    if (key >= today && dayNumber(key) - dayNumber(today) <= INFER_HORIZON_DAYS) return key
  }
  return null
}

/* ── HTML 小工具（不引依赖：项目只有 vue / vue-router） ─────────────────── */

export function decodeEntities(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
}

/** 去标签 → 纯文本；`<br>` / `</p>` / `</tr>` 等块级收尾变回车，其余标签直接删。
    末尾 `.trim()`：脚本/样式段被替换成空格后会留下首尾空白，留着只会在别处冒成怪 diff。 */
export function stripTags(html) {
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t\u00a0]+/g, ' ')
    .trim()
}

/* ── 官网赛程解析 ──────────────────────────────────────────────────────── */

/** 城市名里混进表格表头时的清洗（实测 ICPC 页表头有「名额分配方案」这类词）。 */
function cleanCity(raw) {
  const city = String(raw || '')
    .replace(/^.*(名额分配方案|名额分配|分配方案|方案|说明|承办|通知|时间|拟)/, '')
    .replace(/[（(].*$/, '')
    .trim()
  return city.length >= 2 && city.length <= 6 ? city : ''
}

/**
 * CCPC 官网《2026 CCPC 各场比赛安排》正文 → 场次。
 * 实测原文形如（日期 **无年份**，写作 `M.D-D` 或 `M.D-M.D`）：
 *   网络赛 PTA平台 9.19
 *   长春国赛 东北师范大学承办 清华大学 10.17-18
 *   女生赛 成都信息工程大学承办 杭州电子科技大学 10.31-11.1
 *   乐山国赛 电子科技大学 11.7-8
 */
export function parseDotRange(text, today) {
  const out = []
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const d = /(\d{1,2})\.(\d{1,2})\s*[-–—~]\s*(\d{1,2})(?:\.(\d{1,2}))?/.exec(line)
    if (!d) continue
    // 站名取行首的中文串（长春国赛 / 女生赛 / 乐山国赛 …）
    const name = /^([\u4e00-\u9fa5]{2,10})/.exec(line)
    if (!name) continue
    const start = inferYear(Number(d[1]), Number(d[2]), today)
    if (!start) continue
    let end
    if (d[4]) {
      const e = inferYear(Number(d[3]), Number(d[4]), today)
      if (e && e > start) end = e
    } else if (d[3]) {
      const e = inferYear(Number(d[1]), Number(d[3]), today)
      if (e && e > start) end = e
    }
    out.push({ name: name[1], start, end })
  }
  return out
}

/**
 * ICPC 北京总部《各区域赛情况汇总》表格 → 场次。
 * 实测原文（数字与「月 / 日」之间有空格，第二段常省略月份，年份只在跨年赛站上出现）：
 *   西安 10 月17- 18 日   成都 10 月24- 25 日   武汉 10 月31- 11月01 日
 *   南京 11 月07- 08 日   上海 12 月05- 06日    香港 2027年1月09日-10日
 *   杭州（EC Final) 2027年1月26日-28日
 */
export function parseCnMonthRange(text, today) {
  const RE =
    /([\u4e00-\u9fa5]{2,10})\s*(?:[（(][^）)]{0,24}[）)])?\s*((?:(\d{4})\s*年)?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?)\s*(?:[-–—~至]\s*(?:(\d{1,2})\s*月\s*)?(\d{1,2})\s*日?)?/g
  const out = []
  for (const m of String(text || '').matchAll(RE)) {
    const [, rawCity, , y4, mo, d1, mo2, d2] = m
    const city = cleanCity(rawCity)
    if (!city) continue
    const month = Number(mo)
    const day = Number(d1)
    const start = y4 ? `${y4}-${pad(month)}-${pad(day)}` : inferYear(month, day, today)
    if (!start || !isUpcoming(start, today)) continue
    let end
    if (d2) {
      const eMonth = mo2 ? Number(mo2) : month
      const eDay = Number(d2)
      // 写了年份的：同一次公告里的第二段要么同年、要么就是次年（12 月31- 1月1 这种）
      const e = y4
        ? `${eMonth < month && !mo2 ? Number(y4) + 1 : Number(y4)}-${pad(eMonth)}-${pad(eDay)}`
        : inferYear(eMonth, eDay, today)
      if (e && e > start) end = e
    }
    out.push({ city, start, end })
  }
  return out
}

/* ── xCPC 场次的标准命名（会长 2026-10-02 裁定）────────────────────────────
   会长原话：「xcpc 的命名要标准一些，应该是 ICPC/CCPC xx省赛、ICPC/CCPC全国邀请赛（xx）、
   ICPC/CCPC全国邀请赛（xx）暨xx省赛、CCPC全国赛（xx）、ICPC亚洲区域赛（xx）、
   ICPC东亚区总决赛（xx）、ICPC世界总决赛（xx）、CCPC总决赛（xx）、CCPC网络预选赛、
   ICPC网络赛预选赛第一场、ICPC网络赛预选赛第二场中的一个」。

   ⚠ 与仓库既有数据写法对齐：**ICPC / CCPC 之后不加空格**（awards/*.json 与 events/*.json
     通篇是 `ICPC亚洲区域赛 南京站`、`CCPC全国邀请赛（南昌）暨江西省赛`），
     本次也只统一「近期赛事」这条线（schedule.json 手写层 + 本目录的抓取层），
     历史成绩、历届数据与竞赛卡片**不动**。
   ⚠ 名字与类型是两张表、要一起改：类型判据在 src/utils/scheduleView.js 的 categoryOf()
     （名字写成「网络预选赛」而颜色是区域赛，就是这两处走失了）。
*/

/**
 * CCPC 站名 → 标准名。站名来自《2026 CCPC 各场比赛安排》的行首（**没有城市字段**）：
 *   长春国赛 / 乐山国赛 → CCPC全国赛（长春）/ CCPC全国赛（乐山）
 *   女生赛               → CCPC女生专场（有城市才带括号；不编城市）
 *   网络赛               → CCPC网络预选赛
 * 认不出的按「全国赛（原名去掉 国赛/赛/站 后缀）」处理 —— 宁可名字朴素，
 * 也不要凭猜换个档位：档位写错，左边框的颜色跟着错，等于两处一起骗人。
 */
export function ccpcStandardName(raw, city = '') {
  const s = String(raw || '').trim()
  const inCity = city ? `（${city}）` : ''
  if (!s) return city ? `CCPC全国赛${inCity}` : ''
  if (/网络|预选/.test(s)) return 'CCPC网络预选赛'
  if (/女生|专场/.test(s)) return `CCPC女生专场${inCity}`
  if (/总决赛/.test(s)) return `CCPC总决赛${inCity}`
  if (/邀请赛/.test(s)) return `CCPC全国邀请赛${inCity}`
  const m = /^([\u4e00-\u9fa5]{2,6}?)(?:国赛|站|赛)$/.exec(s)
  const place = city || (m ? m[1] : s)
  return place ? `CCPC全国赛（${place}）` : 'CCPC全国赛'
}

/** ICPC 赛站 → 标准名（汇总页给的本来就是城市名） */
export function icpcStandardName(city) {
  const c = String(city || '').trim()
  return c ? `ICPC亚洲区域赛（${c}）` : 'ICPC亚洲区域赛'
}

/** 标准名 → 表里那个阶段角标。判据与命名同源，别在两处各写一份正则。 */
export function ccpcStageOf(title) {
  const s = String(title || '')
  if (/网络预选赛/.test(s)) return '网络预选赛'
  if (/女生专场/.test(s)) return '女生专场'
  if (/总决赛/.test(s)) return '总决赛'
  return '分站赛'
}

/**
 * xCPC 标题的**标准形式白名单**（会长 2026-10-02 的 11 种 + 他指定的女生专场写法）。
 * scripts/check_awards.mjs 用它给 schedule.json 打 warn（不拦构建）。
 * ⚠ 上面两个命名函数与本表必须同步：生成器自己产出的名字若不在白名单里，
 *   每次 `npm run data:check` 都会多一条自己给自己发的警告。
 */
export const XCPC_TITLE_RES = [
  /^(ICPC|CCPC)[\u4e00-\u9fa5]{2,8}省赛$/, // ICPC江西省赛 / CCPC江西省赛
  /^(ICPC|CCPC)全国邀请赛（[^）]{2,8}）$/, // ICPC全国邀请赛（昆明）
  /^(ICPC|CCPC)全国邀请赛（[^）]{2,8}）暨[\u4e00-\u9fa5]{2,8}省赛$/, // …（南昌）暨江西省赛
  /^CCPC全国赛（[^）]{2,8}）$/, // CCPC全国赛（长春）
  /^ICPC亚洲区域赛（[^）]{2,10}）$/, // ICPC亚洲区域赛（西安）
  /^ICPC东亚区总决赛（[^）]{2,10}）$/,
  /^ICPC世界总决赛（[^）]{2,10}）$/,
  /^CCPC总决赛（[^）]{2,10}）$/,
  /^CCPC网络预选赛$/,
  /^ICPC网络赛预选赛第一场$/,
  /^ICPC网络赛预选赛第二场$/,
  /^CCPC女生专场$/, // 没有城市时的写法（官网只给「女生赛」、城市未知就不编）
  /^CCPC女生专场（[^）]{2,8}）$/,
]

export function isStandardXcpcTitle(title) {
  const t = String(title || '').trim()
  return XCPC_TITLE_RES.some((re) => re.test(t))
}
