#!/usr/bin/env node
/**
 * 近期赛事时间表 · 抓取器（2026-10-01 新增）
 * ---------------------------------------------------------------------------
 * 产出 public/data/schedule.auto.json —— 竞赛信息页那张「近期赛事时间安排表」的
 * **自动层**。手写层是 public/data/schedule.json（会长维护、入库）；页面把两份合并，
 * **手写优先**（口径见 src/utils/scheduleView.js 的 mergeSchedule）。
 *
 * 为什么分两份而不合成一个文件：
 *   · 手写那份要进 git（是人的判断，得能 review、能追溯）；
 *   · 抓来的那份每次构建都重生成（内容随官网变，入库只会制造噪声 diff）。
 *   分开还有个好处：自动层整条挂掉时，页面照常显示手写那部分 —— 降级是可见的。
 *
 * ⚠ 四条纪律（改这个文件之前先读）：
 *   1. **抓不到不算失败**。任何源超时 / 改版 / 反爬，只 warn 并跳过，退出码永远 0 ——
 *      本脚本挂在 `prebuild` 上，服务器构建不能因为某个官网抽风而部署失败
 *      （deploy.bat 第 4 步一旦非零退出，整次部署就停在那里，线上还是旧 dist）。
 *   2. **不猜日期**。只认结构化字段（时间戳 / 带偏移的 ISO）或**行文里明确写了年份的
 *      完整日期**（如「决赛时间为2026年10月17日」）。官网只写「M.D」「M 月D- D 日」
 *      没写年份的（CCPC / ICPC 就是这样），补年规则在 scripts/lib/schedule-parse.mjs
 *      的 inferYear —— 补不出来就**丢掉这一行**，不写错一行。
 *   3. **有疑虑就报给人**。官网自己标注「暂定」的进 tentative 标记，抽不出日期但看着
 *      像新赛程的进 alerts 清单，由 `npm run data:check` 打出来 —— 而不是静悄悄写进表里当事实。
 *   4. **时区钉死东八区**（见 schedule-parse.mjs）：国外平台给 UTC / JST，这张表是给
 *      中国学生看的「几月几号（周几）」；用构建机本地时区会在 UTC 机器上整体差一天。
 *
 * 各源实测记录（2026-10-02，逐条真机实测；「不可用」的也留着，免得下次再踩一遍）：
 *   ✅ codeforces  https://codeforces.com/api/contest.list   phase==='BEFORE'，UTC 秒
 *   ✅ atcoder     https://atcoder.jp/contests/  SSR HTML 的 #contest-table-upcoming，+0900
 *   ✅ ccpc        https://ccpc.io/api/archive → 取标题含「比赛安排」的正文，`M.D-D` 无年份
 *                  ⚠ 实测 2026-10-02 凌晨它连续返回 **HTTP 500（0 字节）**，半小时前还是 200
 *                    —— 后端偶发抽风，故本文件对每个源做一次重试；它挂了就只少这几行
 *   ✅ icpc        https://icpc.pku.edu.cn/ssxx/index.htm → 找「区域赛情况汇总」，
 *                  文件名是**内容哈希**（每次现发现，不能硬编码），表格 `M 月D- D 日` 无年份
 *   ✅ baidu       https://star.baidu.com/web/getArticlesByClassId.do?classId=14&start=0&limit=100
 *                  正文是纯文本且**写明「决赛时间为YYYY年M月D日」**，可锚定抽取
 *   —  raicom      2026-10-02 由会长撤掉（「去除睿抗的 filter，并且最近赛时里也不显示睿抗的比赛」）
 *                  原接口 https://service.raicom.com.cn/api/matches（报名窗口毫秒时间戳），
 *                  解析器与 lib 的 enrollmentEnd 都还留着，要恢复见 SOURCES 里的墓碑注释
 *   ✅ chuanzhi    https://gateway.boxuegu.com/portal-marketing/competition/track/list
 *                  赛道报名窗口 registStartTime / registEndTime 是日级结构化；比赛日期只到月份 → 不写
 *   ❌ luogu       实测 `?_contentOnly=1` 与 x-luogu-type 均已失效（返回 SPA 空壳 HTML）→ 不抓
 *   ❌ xcpcio      board-data 是**赛后**榜单镜像（最新一条 2026-09-19 已结束），结构上给不出未来赛站
 *   ❌ gplt        天梯赛官网 gplt.patest.cn 是 CSR 空壳（所有路由同一个壳），接口全在登录态后面
 *                  （实际测 /api/announcements → 401 USER_NOT_LOGGED_IN），第 12 届日期也尚未公布
 *                  → 只能手工维护：一年一届，在 schedule.json 里留人工条目 + 官网链接
 *   ⚠ lanqiao     host 是 www.guoxinlanqiao.com（不是 dasai.lanqiao.cn，后者 /api 全 404）；
 *                  接口能吐未来日期，但第 18 届**软件赛**省赛/国赛截至 2026-10-02 尚未公布，
 *                  且公告正文里的日期是非结构化自然语言（常放在图片/PDF 里）→ 只报 alerts，不抽日期
 *
 * 用法：
 *   node scripts/gen_schedule.mjs                    # 抓取并落盘
 *   node scripts/gen_schedule.mjs --dry              # 只打印，不写文件
 *   node scripts/gen_schedule.mjs --only=icpc,ccpc   # 只跑指定源（调试用）
 *   set SCHEDULE_SKIP_FETCH=1                        # 完全跳过抓取（离线构建）
 */
import fs from 'node:fs'
import path from 'node:path'

import {
  todayKey,
  msToBeijing,
  epochToBeijing,
  isUpcoming,
  stripTags,
  parseDotRange,
  parseCnMonthRange,
  ccpcStandardName,
  ccpcStageOf,
  icpcStandardName,
} from './lib/schedule-parse.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_FILE = path.join(ROOT, 'public', 'data', 'schedule.auto.json')
const MANUAL_FILE = path.join(ROOT, 'public', 'data', 'schedule.json')

const DRY = process.argv.includes('--dry')
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7)
const ONLY_IDS = ONLY ? ONLY.split(',').map((s) => s.trim()).filter(Boolean) : null

/** 逐源超时。宁可少抓一个源，也不要让 `npm run build` 在服务器上卡住。 */
const TIMEOUT_MS = Number(process.env.SCHEDULE_FETCH_TIMEOUT_MS || 12000)
/** Codeforces 实测首响应可达 11 s 以上，单独放宽。 */
const CF_TIMEOUT_MS = Number(process.env.SCHEDULE_CF_TIMEOUT_MS || 30000)

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const DAY_MS = 86400000

/* ── 取数 ──────────────────────────────────────────────────────────────── */

async function fetchText(url, { headers = {}, timeout = TIMEOUT_MS } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', ...headers },
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

async function fetchJson(url, opts) {
  const text = await fetchText(url, opts)
  try {
    return JSON.parse(text)
  } catch {
    // 返回 HTML（反爬页 / 改版 / 登录墙）时要说清楚，别让它伪装成「没有赛程」
    throw new Error(`不是 JSON（前 80 字：${text.slice(0, 80).replace(/\s+/g, ' ')}）`)
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ── 各赛事源的适配器 ─────────────────────────────────────────────────────
   { id, label, contest, timeout?, run({ today, alert }) → item[] }
   item 字段与手写层完全一致，页面不需要知道一条是从哪来的（source 只用于角标与排查）：
     contest / title / start 必填，end / deadline / time / place / link / note / tentative 可选
   alert({ title, url, date, why }) —— 看到「可能有新赛程」但抽不出日期时报给 data:check
   打出来提醒人工处理（**不写进表**）。 */

const SOURCES = [
  {
    id: 'codeforces',
    label: 'Codeforces',
    contest: 'codeforces',
    timeout: CF_TIMEOUT_MS,
    async run({ today }) {
      const data = await fetchJson('https://codeforces.com/api/contest.list?gym=false')
      if (data.status !== 'OK') throw new Error(`API status=${data.status}`)
      // 判据用 === 'BEFORE'：实测现行只出现 BEFORE / FINISHED，别写成 !== 'FINISHED'
      // —— 万一将来多出 CODING / SYSTEM_TEST 这类中间态，!== 会把正在比的也算进来
      return (data.result || [])
        .filter((c) => c.phase === 'BEFORE')
        .map((c) => {
          const t = epochToBeijing(c.startTimeSeconds)
          if (!t || !isUpcoming(t.day, today)) return null
          return {
            contest: 'codeforces',
            title: c.name,
            stage: 'Codeforces Round',
            start: t.day,
            time: t.time,
            link: `https://codeforces.com/contest/${c.id}`,
            source: 'codeforces',
            note: `时长约 ${Math.round((c.durationSeconds || 0) / 3600)} 小时`,
          }
        })
        .filter(Boolean)
    },
  },
  {
    id: 'atcoder',
    label: 'AtCoder',
    contest: 'atcoder',
    async run({ today }) {
      // 官方无 JSON API，未来源只在 SSR HTML 里。用 timeanddate 链接里的 iso=YYYYMMDDTHHMM
      // 取时间（比抠 <time> 文本里的空格/时区稳），iso 是 +0900 日本时间。
      const html = await fetchText('https://atcoder.jp/contests/')
      const block = html.split('contest-table-upcoming')[1]
      if (!block) throw new Error('结构变了：找不到 #contest-table-upcoming')
      const body = block.split('contest-table-recent')[0]
      const rows = [...body.matchAll(/iso=(\d{8})T(\d{4})[\s\S]{0,400}?href="\/contests\/([^"]+)"[^>]*>([^<]+)</g)]
      return rows
        .map(([, ymd, hm, slug, name]) => {
          const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hm.slice(0, 2)}:${hm.slice(2, 4)}:00+09:00`
          const t = msToBeijing(Date.parse(iso))
          if (!t || !isUpcoming(t.day, today)) return null
          return {
            contest: 'atcoder',
            title: name.trim(),
            stage: 'AtCoder Contest',
            start: t.day,
            time: t.time,
            link: `https://atcoder.jp/contests/${slug}`,
            source: 'atcoder',
          }
        })
        .filter(Boolean)
    },
  },
  {
    id: 'ccpc',
    label: 'CCPC',
    contest: 'ccpc',
    async run({ today, alert }) {
      // /api/archive 固定返回最新 10 条、**不支持分页**（?page / ?limit / ?channel_id 实测被忽略）。
      // 赛程在标题含「比赛安排」的那条正文里，日期写作 `10.17-18`（无年份）→ parseDotRange。
      const list = await fetchJson('https://ccpc.io/api/archive')
      const arr = list?.data?.archives ?? list?.data ?? list
      const rows = Array.isArray(arr) ? arr : arr?.rows
      if (!Array.isArray(rows)) throw new Error('结构变了：archive 不是数组')
      const hit = rows.find((r) => /比赛安排|赛程/.test(r.title || ''))
      if (!hit) {
        alert({
          title: 'CCPC 官网最新 10 条里没有「比赛安排」类文章',
          url: 'https://ccpc.io/',
          why: '需要人工确认本赛季赛站日期（文章可能已滚出列表）',
        })
        return []
      }
      const detail = await fetchJson(`https://ccpc.io/api/archive/${hit.id}`)
      const info = detail?.data?.archivesInfo ?? detail?.data ?? detail
      const parsed = parseDotRange(stripTags(info?.content || ''), today)
      if (!parsed.length) {
        alert({ title: `CCPC《${hit.title}》没抽到未来日期`, url: 'https://ccpc.io/', why: '正文格式可能变了，请人工核对' })
      }
      return parsed.map((p) => ({
        contest: 'ccpc',
        // 标准名由 ccpcStandardName 一处生成（会长 2026-10-02 定的 11 种写法）：
        // 「长春国赛」→「CCPC全国赛（长春）」、「女生赛」→「CCPC女生专场」、
        // 「网络赛」→「CCPC网络预选赛」。阶段角标与名字同判据，不各写一份正则。
        title: ccpcStandardName(p.name),
        stage: ccpcStageOf(ccpcStandardName(p.name)),
        start: p.start,
        end: p.end,
        link: 'https://ccpc.io/',
        source: 'ccpc',
        tentative: true, // 官网原文即标注「暂定」
        note: `官网《${hit.title}》，暂定以报名通知为准`,
      }))
    },
  },
  {
    id: 'icpc',
    label: 'ICPC 北京总部',
    contest: 'icpc',
    async run({ today, alert }) {
      // 汇总页文件名是内容哈希（实测 ssxx/bed2c89264fd4d90b08bc93036051186.htm）→ 每次现发现。
      const index = await fetchText('https://icpc.pku.edu.cn/ssxx/index.htm')
      const links = [...index.matchAll(/href=["']([^"']+\.htm)["'][^>]*>([\s\S]{0,120}?)<\/a>/g)]
      const hit = links.find(([, , text]) => /区域赛|汇总/.test(stripTags(text)))
      if (!hit) throw new Error('结构变了：/ssxx/index.htm 里找不到「区域赛情况汇总」')
      const url = new URL(hit[1], 'https://icpc.pku.edu.cn/ssxx/').href
      const parsed = parseCnMonthRange(stripTags(await fetchText(url)), today)
      if (!parsed.length) alert({ title: 'ICPC 汇总页没抽到未来赛站', url, why: '正文格式可能变了，请人工核对' })
      return parsed.map((p) => ({
        contest: 'icpc',
        // 「ICPC 亚洲区域赛（西安）」→「ICPC亚洲区域赛（西安）」：仓库既有数据（awards / events）
        // 通篇是**不加空格**的写法，近期赛事这条线跟着统一（会长 2026-10-02）
        title: icpcStandardName(p.city),
        stage: '区域赛',
        start: p.start,
        end: p.end,
        link: url,
        source: 'icpc',
        tentative: true, // 页尾原文：「以上时间都是暂定，最终以报名通知为准」
        note: '官网汇总页，暂定（各站报名截止在详情 PDF 里，需人工确认）',
      }))
    },
  },
  {
    id: 'baidu',
    label: '百度之星',
    contest: 'baidu',
    async run({ today, alert }) {
      // 列表接口的分页只认 start / limit（page / pageSize / currentPage 实测均被忽略）。
      // simpleContent 是**纯文本**，且原文写明「决赛时间为2026年10月17日14:00-19:00」——
      // 这是唯一一个能锚定抽取日期的国产赛事源。
      const data = await fetchJson('https://star.baidu.com/web/getArticlesByClassId.do?classId=14&start=0&limit=100', {
        headers: { Referer: 'https://star.baidu.com/', Accept: 'application/json' },
      })
      const rows = data?.data?.datas
      if (!Array.isArray(rows)) throw new Error('结构变了：data.datas 不是数组')

      const dateOf = (text, re) => {
        const m = re.exec(text)
        return m ? `${m[1]}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[3])).padStart(2, '0')}` : null
      }
      const seen = new Set()
      const items = []
      for (const art of rows) {
        const text = String(art.simpleContent || '') + ' ' + String(art.title || '')
        const finalDay = dateOf(text, /决赛时间为\s*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
        const signupEnd = dateOf(text, /报名时间[^。；]{0,40}?[-–—~至]\s*(?:(\d{4})\s*年\s*)?(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
        const start = finalDay || signupEnd
        if (!start || !isUpcoming(start, today)) continue
        // 同一个决赛日期会被「第一场初赛」「第二场初赛」两篇公告各提一次 → 按日期去重，
        // 标题写**赛事**而不是那篇文章的标题（文章标题是「获奖名单公示」，摆在决赛日期旁边会误导）
        const key = `${start}|${finalDay ? 'final' : 'signup'}`
        if (seen.has(key)) continue
        seen.add(key)
        const timeMatch = /(\d{1,2}:\d{2})\s*[-–—~至]\s*(\d{1,2}:\d{2})/.exec(text)
        items.push({
          contest: 'baidu',
          title: '百度之星程序设计大赛',
          stage: finalDay ? '决赛' : '报名',
          start,
          time: finalDay && timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : undefined,
          deadline: finalDay && signupEnd && signupEnd <= finalDay ? signupEnd : undefined,
          link: 'https://star.baidu.com/',
          source: 'baidu',
          note: `官网公告《${art.title || ''}》`,
        })
      }
      if (!items.length) {
        alert({
          title: '百度之星通知公告里没有可抽取的未来决赛/报名日期',
          url: 'https://star.baidu.com/',
          why: '可能已过报名期，或正文换成了图片',
        })
      }
      return items
    },
  },
  /* 睿抗（RAICOM）源 2026-10-02 由会长撤掉：「去除睿抗的 filter，并且最近赛时里也不显示睿抗的
     比赛」。要恢复是**两处**：把这一段整块加回来（连同上面 import 里的 `enrollmentEnd,`，
     它是这个源专用的），再删掉 src/utils/scheduleView.js 的 HIDDEN_CONTESTS 里那个 slug。
     原接口：https://service.raicom.com.cn/api/matches —— 毫秒 enrollstartdate/enrollenddate，
     赛道级 matchTime 常年为空，故出的是**报名期**而非比赛日（note 里要写明白）。 */
  {
    id: 'chuanzhi',
    label: '传智杯',
    contest: 'chuanzhi',
    async run({ today }) {
      // 赛道列表给的是**日级结构化**报名窗口（`data.competitionTracks[].registStartTime/registEndTime`，
      // 形如 "2026-07-29"）；而公告列表（competition-notice/page）只给 createTime、**没有未来时间戳**，
      // 比赛日期在公告正文里只到「月」这一级（省赛 11 月 / 国赛 12 月）→ 那部分**不写成日期**（宁缺勿造）。
      // ⚠ host 是 gateway.boxuegu.com：dasai.ityxb.com 只是 301 跳官网 https://www.boxuegu.com/match/ 。
      const data = await fetchJson('https://gateway.boxuegu.com/portal-marketing/competition/track/list')
      const tracks = data?.data?.competitionTracks
      if (!Array.isArray(tracks)) throw new Error('结构变了：data.competitionTracks 不是数组')
      // 16 条赛道里只有程序设计这条与协会有关（其余是 AIGC / 设计 / 数据类）
      return tracks
        .filter((t) => /程序设计|编程|算法/.test(t.name || ''))
        .map((t) => {
          const end = String(t.registEndTime || '')
          if (!/^\d{4}-\d{2}-\d{2}$/.test(end) || !isUpcoming(end, today)) return null
          const begin = String(t.registStartTime || '')
          return {
            contest: 'chuanzhi',
            title: `传智杯 · ${t.name}`,
            stage: '报名',
            start: end,
            deadline: end, // start == deadline：表格会说「报名还剩 N 天」，不会说成比赛日
            link: 'https://www.boxuegu.com/match/',
            source: 'chuanzhi',
            note: `《${data.data.name || '传智杯'}》报名窗口${/^\d{4}-\d{2}-\d{2}$/.test(begin) ? `（${begin} 起）` : ''}；比赛日期官网只公布到月份`,
          }
        })
        .filter(Boolean)
    },
  },
  {
    id: 'lanqiao',
    label: '蓝桥杯（只报不抓）',
    contest: 'lanqiao',
    async run({ alert }) {
      // 只报「有新公告」，不抽日期：第 18 届软件赛日程尚未公布，正文里的日期是非结构化
      // 自然语言（且常放在图片 / PDF 附件里），抽出来等于猜。
      // ⚠ progid=20 必须带：不带会把「最新热点」SEO 软文混进来（实测 total 1722 vs 738）。
      const data = await fetchJson(
        'https://www.guoxinlanqiao.com/api/news/find?status=1&project=dasai&progid=20&pageno=1&pagesize=200',
        { headers: { Accept: 'application/json' } }
      )
      const rows = data?.datalist
      if (!Array.isArray(rows)) throw new Error('结构变了：datalist 不是数组')
      const KEY = /(软件赛|省赛|国赛|总决赛|时间安排|报名指南|竞赛时间|赛程)/
      // 获奖名单 / 公示这类也是「省赛国赛」字样，但它们是结果不是日程 → 排除
      const NOISE = /(名单|公示|获奖|优胜|优秀组织|优秀指导教师|证书|设计|文创|视觉|艺术|专项赛|志愿者|讲座|集训|教师|准考证|培训|会议)/
      // 再只看**新**公告：半年前的集训/准考证通知不是待办事项，报出来只会把真信号淹没
      const cutoff = Date.now() - 120 * 86400000
      const recent = rows
        .filter((r) => {
          const t = r.title || ''
          if (!KEY.test(t) || NOISE.test(t)) return false
          const ts = Date.parse(r.publishTime || r.creatTime || '')
          return Number.isFinite(ts) && ts >= cutoff
        })
        .slice(0, 5)
      for (const r of recent) {
        alert({
          title: r.title,
          url: `https://www.guoxinlanqiao.com/api/web/news/selectone?nnid=${r.nnid}`,
          date: r.publishTime || r.creatTime,
          why: '蓝桥杯新公告（日期在正文/附件里，需人工确认后写进 public/data/schedule.json）',
        })
      }
      return []
    },
  },
  {
    id: 'nowcoder',
    label: '牛客竞赛日历',
    contest: 'nowcoder',
    async run({ today }) {
      // 牛客的比赛日历（会长 2026-10-02 点名要接的那一页 https://ac.nowcoder.com/acm/contest/calendar）。
      // 接口来自日历页自己的 main.entry.js：`calendar: "/acm/calendar/contest"`，query 只有 month。
      // 两个实测事实决定了下面怎么写（2026-10-02 实测）：
      //   ① **只公布当月**：2026-07/08/09 分别 23/25/16 场、当月（10 月）9 场，
      //      而 11 月起恒为 {"msg":"OK","code":0,"data":[]}。所以取「当月 + 后两个月」，
      //      取到空的是**正常**（还没排期），不是故障 —— 这是全表里唯一「越远越空」的源。
      //   ② 它是一份**聚合**日历：ojName 实测只有 NowCoder(51) / AtCoder(22) 两种。
      //      AtCoder 的场次交给更权威的 atcoder 源（带 contest slug 的官方链接）——
      //      同一场若从两个源进来而 slug 不同，scheduleView 的判重键 `contest|start` 认不出来，
      //      表里就会同一场比赛出现两行。
      // ⚠ `today` 在本文件里是 **'YYYY-MM-DD' 字符串**（todayKey() 的产物，其余源都拿它做字符串比较），
      // 不是 Date —— 别直接调 getFullYear()（2026-10-02 踩过：`today.getFullYear is not a function`）。
      const [y0, m0] = String(today).split('-').map(Number)
      const months = [0, 1, 2].map((d) => {
        const dt = new Date(y0, m0 - 1 + d, 1) // 只用年月，不碰时刻 → 没有时区陷阱
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      })
      const settled = await Promise.allSettled(
        months.map((mm) => fetchJson(`https://ac.nowcoder.com/acm/calendar/contest?month=${mm}`))
      )
      const failed = settled
        .map((s, i) => (s.status === 'rejected' ? `${months[i]}（${s.reason?.message || s.reason}）` : null))
        .filter(Boolean)
      // 任何一个月没取到就**整体算失败**：这张表的意义是「接下来要比什么」，
      // 悄悄少一个月比让页面写明「牛客今天没同步上」危险得多（重试见 runWithRetry）。
      if (failed.length) throw new Error(`月份取数失败：${failed.join('、')}`)

      const byId = new Map()
      for (const s of settled) {
        const rows = s.value?.data
        if (!Array.isArray(rows)) throw new Error('结构变了：data 不是数组')
        for (const r of rows) if (r?.ojName === 'NowCoder') byId.set(r.contestId, r)
      }
      return [...byId.values()]
        .map((r) => {
          const t = msToBeijing(r.startTime)
          if (!t || !isUpcoming(t.day, today)) return null
          const e = msToBeijing(r.endTime)
          const hours = e && r.endTime > r.startTime ? Math.round((r.endTime - r.startTime) / 3600000) : 0
          return {
            contest: 'nowcoder',
            title: r.contestName || '牛客竞赛',
            start: t.day,
            end: e && e.day !== t.day ? e.day : undefined,
            time: t.time,
            link: r.link || 'https://ac.nowcoder.com/acm/contest/calendar',
            source: 'nowcoder',
            note: hours ? `时长约 ${hours} 小时` : undefined,
          }
        })
        .filter(Boolean)
    },
  },
]

/* ── 主流程 ────────────────────────────────────────────────────────────── */

function readManual() {
  if (!fs.existsSync(MANUAL_FILE)) return null
  try {
    return JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf8'))
  } catch (e) {
    console.warn(`[schedule] 手写层 ${path.relative(ROOT, MANUAL_FILE)} 解析失败（跳过交叉核对）：${e.message}`)
    return null
  }
}

/**
 * 手写与自动对**同一赛事**给出不同日期时提醒人工核对 —— 脚本刻意不替人做决定：
 * 手写那条可能是会长刚跟官方确认过的，自动那条可能是还没更新的旧公告，谁对只有人知道。
 */
function warnConflicts(manual, autoItems) {
  const mine = (manual?.items || []).filter((i) => i?.start)
  const hits = []
  for (const a of autoItems) {
    for (const m of mine) {
      if (m.contest !== a.contest) continue
      const dm = Date.parse(`${m.start}T00:00:00Z`)
      const da = Date.parse(`${a.start}T00:00:00Z`)
      if (!Number.isFinite(dm) || !Number.isFinite(da)) continue
      const days = Math.abs(dm - da) / DAY_MS
      if (days > 0 && days <= 21) {
        hits.push(`  · ${a.contest}｜手写 ${m.start}「${m.title}」vs 自动 ${a.start}「${a.title}」（差 ${days} 天）`)
      }
    }
  }
  if (hits.length) {
    console.warn(`[schedule] ${hits.length} 处手写与自动日期不一致，请人工核对（脚本不替你做主）：`)
    hits.forEach((h) => console.warn(h))
  }
  return hits.length
}

/** 每个源最多试两次：国内几个官网偶发 500 / 超时（实测 CCPC 半小时前 200、之后连续 500）。 */
async function runWithRetry(src, ctx, attempts = 2) {
  let last
  for (let i = 1; i <= attempts; i++) {
    try {
      return await src.run(ctx)
    } catch (e) {
      last = e
      if (i < attempts) await sleep(600)
    }
  }
  throw last
}

async function main() {
  if (process.env.SCHEDULE_SKIP_FETCH === '1') {
    console.log('[schedule] SCHEDULE_SKIP_FETCH=1 —— 跳过抓取，不动 schedule.auto.json')
    return
  }

  const today = todayKey()
  const alerts = []
  const alert = (a) => alerts.push(a)
  const sources = ONLY_IDS ? SOURCES.filter((s) => ONLY_IDS.includes(s.id)) : SOURCES

  // 并行抓：各源相互独立，串行跑最坏情况会叠加成几分钟（Codeforces 单独就可能 11 s+）
  const results = await Promise.allSettled(sources.map((src) => runWithRetry(src, { today, alert })))

  const items = []
  const report = []
  results.forEach((res, i) => {
    const src = sources[i]
    if (res.status === 'fulfilled') {
      const got = res.value || []
      items.push(...got)
      report.push({ id: src.id, label: src.label, ok: true, count: got.length })
      console.log(`  OK   ${src.label.padEnd(18)} ${String(got.length).padStart(3)} 场（未来）`)
    } else {
      // 抓不到不是错误：这张表本来就有手写层兜着，只是少几行自动补的
      const msg = res.reason?.message || String(res.reason)
      report.push({ id: src.id, label: src.label, ok: false, count: 0, error: msg })
      console.warn(`  WARN ${src.label.padEnd(18)} 抓取失败，已跳过：${msg}`)
    }
  })

  items.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  const conflicts = warnConflicts(readManual(), items)

  for (const a of alerts) {
    console.warn(`  ℹ ${a.why}\n      ${a.title}${a.date ? `（${a.date}）` : ''}\n      ${a.url}`)
  }

  const payload = {
    generated_at: new Date().toISOString(),
    timezone: 'Asia/Shanghai',
    note: '本文件由 scripts/gen_schedule.mjs 抓取生成，请勿手改；手写内容放 public/data/schedule.json。',
    sources: report,
    alerts,
    items,
  }

  if (DRY) {
    console.log(`\n[--dry] 不写文件。共 ${items.length} 场：`)
    for (const it of items) {
      const span = it.end ? `${it.start}~${it.end}` : it.start.padEnd(21)
      console.log(`  ${span} ${(it.time || '').padEnd(11)} [${it.contest.padEnd(10)}] ${it.title}${it.tentative ? '（暂定）' : ''}`)
    }
    return
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(
    `\n[schedule] ${path.relative(ROOT, OUT_FILE)} 已写出：${items.length} 场自动场次 / ` +
      `${report.filter((r) => r.ok).length}/${report.length} 个源可用 / ${alerts.length} 条待人工确认` +
      (conflicts ? ` / ${conflicts} 处日期冲突` : '')
  )
}

await main()
