/**
 * 官网赛程解析回归（2026-10-01 新增）。
 *
 * 这些正则是**照着官网真实原文写**的，样本直接取自学 ICPC 北京总部汇总页与 CCPC
 * 《各场比赛安排》正文的实测原文（2026-10-02 抓取）。两组样本的共同毛病：
 *   · 日期**没有年份**（要按 inferYear 补，补不出来必须丢弃而不是瞎补）；
 *   · 数字与「月 / 日」之间**夹着空格**（`10 月17- 18 日`）；
 *   · 第二段经常省略月份（`12 月05- 06日`）、跨月时才写（`10 月31- 11月01 日`）。
 * 官网一改版，这里的正则就会失配 —— 而线上页面**不会报错，只会静默少几行**，
 * 所以把真实样本钉在这里。
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  todayKey,
  msToBeijing,
  epochToBeijing,
  enrollmentEnd,
  inferYear,
  stripTags,
  decodeEntities,
  parseDotRange,
  parseCnMonthRange,
  ccpcStandardName,
  icpcStandardName,
  ccpcStageOf,
  isStandardXcpcTitle,
} from '../scripts/lib/schedule-parse.mjs'

const TODAY = '2026-10-02'

test('补年：取「不早于今天且 180 天内」的最近一个；补不出来就丢弃', () => {
  assert.equal(inferYear(10, 17, TODAY), '2026-10-17') // 今年还没到
  assert.equal(inferYear(1, 9, TODAY), '2027-01-09') // 今年已过 → 次年，且在 180 天内
  assert.equal(inferYear(9, 19, TODAY), null) // 今年这场已经比过了，明年那场又太远 → 丢
  assert.equal(inferYear(2, 30, TODAY), null) // 日历上不存在
  assert.equal(inferYear(13, 1, TODAY), null)
  assert.equal(inferYear(10, 2, TODAY), '2026-10-02') // 今天当天算未来
})

test('时区：按东八区换算，与机器时区无关', () => {
  // Codeforces 的 UTC 时间戳（实测 2026-10-07T14:35Z → 北京 22:35 当晚）
  assert.deepEqual(epochToBeijing(Date.parse('2026-10-07T14:35:00Z')), { day: '2026-10-07', time: '22:35' })
  // AtCoder 的 JST 写成带偏移的 ISO（2026-10-03 21:00+0900 → 北京 20:00）
  assert.deepEqual(msToBeijing(Date.parse('2026-10-03T21:00:00+09:00')), { day: '2026-10-03', time: '20:00' })
  // 跨零点：UTC 19:00 已是北京时间次日 03:00
  assert.deepEqual(msToBeijing(Date.parse('2026-10-07T19:00:00Z')), { day: '2026-10-08', time: '03:00' })
  // 百度之星的毫秒时间戳（调研实测值）
  assert.deepEqual(epochToBeijing(1790756232000), { day: '2026-09-30', time: '16:17' })
  // 秒级与毫秒级都认（按量级判），脏值返回 null
  assert.deepEqual(epochToBeijing(1790756232), epochToBeijing(1790756232000))
  assert.equal(epochToBeijing(0), null)
  assert.equal(epochToBeijing('abc'), null)
  assert.deepEqual(todayKey(Date.parse('2026-10-01T16:30:00Z')), '2026-10-02') // UTC 16:30 = 北京次日 00:30
})

test('报名截止恰好落在东八区 00:00 时，日期往前挪一天（截止只能往早说）', () => {
  // 睿抗实测值：enrollenddate = 2026-11-29T16:00Z = 北京 11-30 00:00 → 官方意思是「29 日结束」
  assert.deepEqual(enrollmentEnd(1795968000000), { day: '2026-11-29', time: undefined })
  // 不是零点的截止时刻照原样（北京 17:00 截止就是当天）
  assert.deepEqual(enrollmentEnd(Date.parse('2026-11-30T09:00:00Z')), { day: '2026-11-30', time: undefined })
  assert.equal(enrollmentEnd(0), null)
  // 与通用换算的差别只在零点这一种情况上，别把两条路径混用
  assert.equal(epochToBeijing(1795968000000).day, '2026-11-30')
})

test('HTML → 纯文本：块级标点转换行、实体解码、空白收敛', () => {
  // 末尾的 `</p>` 也转换行，故多一个空行；空白已收敛、首尾已 trim（解析器按行切并跳过空行）
  assert.equal(stripTags('<p>西安&nbsp;10&nbsp;月17- 18 日</p><p>成都</p>'), '西安 10 月17- 18 日\n成都')
  assert.equal(decodeEntities('A &amp; B &lt;C&gt; &#65;'), 'A & B <C> A')
  assert.equal(stripTags('<script>var x=1</script>正文'), '正文')
})

test('CCPC 正文（M.D-D，无年份）→ 场次；往期的自动落空', () => {
  const fixture = [
    '2026 CCPC比赛安排（暂定）',
    '网络赛 PTA平台 9.19',
    '长春国赛 东北师范大学承办 清华大学 10.17-18',
    '女生赛 成都信息工程大学承办 杭州电子科技大学 10.31-11.1',
    '乐山国赛 电子科技大学 11.7-8',
    '荆州国赛 南京大学 11.14-15',
    '厦门国赛 上海交通大学 11.21-22',
    '报名与缴费（微信和支付宝渠道）延期至 9月11日12:00 截止',
  ].join('\n')

  assert.deepEqual(parseDotRange(fixture, TODAY), [
    { name: '长春国赛', start: '2026-10-17', end: '2026-10-18' },
    { name: '女生赛', start: '2026-10-31', end: '2026-11-01' }, // 跨月：第二段带月份
    { name: '乐山国赛', start: '2026-11-07', end: '2026-11-08' },
    { name: '荆州国赛', start: '2026-11-14', end: '2026-11-15' },
    { name: '厦门国赛', start: '2026-11-21', end: '2026-11-22' },
  ])
  // 9.19 那场网络赛已经比过了：不许被补成 2027-09-19 混进「近期」
  assert.ok(!parseDotRange(fixture, TODAY).some((i) => i.start.endsWith('-09-19')))
})

test('ICPC 汇总页（M 月D- D 日，无年份）→ 场次；表头噪音不进名字', () => {
  const fixture = [
    '时间（拟） 名额分配方案 报名通知',
    '西安 10 月17- 18 日 成都 10 月24- 25 日 武汉 10 月31- 11月01 日',
    '南京 11 月07- 08 日 沈阳 11 月14-15 日 上海 12 月05- 06日',
    '南昌 12 月19- 20日 香港 2027年1月09日-10日 杭州（EC Final) 2027年1月26日-28日',
    '注：以上时间都是暂定，最终以报名通知为准',
  ].join('\n')

  const got = parseCnMonthRange(fixture, TODAY)
  assert.deepEqual(
    got.map((i) => [i.city, i.start, i.end]),
    [
      ['西安', '2026-10-17', '2026-10-18'],
      ['成都', '2026-10-24', '2026-10-25'],
      ['武汉', '2026-10-31', '2026-11-01'], // 跨月
      ['南京', '2026-11-07', '2026-11-08'],
      ['沈阳', '2026-11-14', '2026-11-15'],
      ['上海', '2026-12-05', '2026-12-06'],
      ['南昌', '2026-12-19', '2026-12-20'],
      ['香港', '2027-01-09', '2027-01-10'], // 跨年：官网自己写了年份
      ['杭州', '2027-01-26', '2027-01-28'], // 城市后带括注
    ]
  )
})

test('解析器对垃圾输入不炸：空串 / 非字符串 / 没有城市名的行', () => {
  assert.deepEqual(parseDotRange('', TODAY), [])
  assert.deepEqual(parseDotRange(undefined, TODAY), [])
  assert.deepEqual(parseCnMonthRange(null, TODAY), [])
  assert.deepEqual(parseDotRange('10.17-18（没有站名）', TODAY), []) // 行首不是中文 → 不冒充赛站
  assert.deepEqual(parseCnMonthRange('（拟） 10 月17- 18 日', TODAY), [])
})

/* ── xCPC 标准命名（会长 2026-10-02）───────────────────────────────────── */

test('xCPC 标准命名：站名 → 标准写法；城市未知时不编城市', () => {
  // CCPC 官网只给站名、没有城市字段
  assert.equal(ccpcStandardName('长春国赛'), 'CCPC全国赛（长春）')
  assert.equal(ccpcStandardName('乐山国赛'), 'CCPC全国赛（乐山）')
  assert.equal(ccpcStandardName('南昌站'), 'CCPC全国赛（南昌）')
  assert.equal(ccpcStandardName('女生赛', '成都'), 'CCPC女生专场（成都）')
  assert.equal(ccpcStandardName('女生赛'), 'CCPC女生专场') // 不编城市（会长指定的写法）
  assert.equal(ccpcStandardName('网络赛'), 'CCPC网络预选赛')
  assert.equal(ccpcStandardName('总决赛', '深圳'), 'CCPC总决赛（深圳）')
  assert.equal(ccpcStandardName('全国邀请赛', '昆明'), 'CCPC全国邀请赛（昆明）')
  assert.equal(ccpcStandardName(''), '')

  // ICPC 汇总页给的就是城市名
  assert.equal(icpcStandardName('西安'), 'ICPC亚洲区域赛（西安）')

  // 阶段角标与命名同判据（名字写「网络预选赛」而角标写「分站赛」就是这两处走失了）
  assert.equal(ccpcStageOf('CCPC网络预选赛'), '网络预选赛')
  assert.equal(ccpcStageOf('CCPC女生专场（成都）'), '女生专场')
  assert.equal(ccpcStageOf('CCPC总决赛（深圳）'), '总决赛')
  assert.equal(ccpcStageOf('CCPC全国赛（长春）'), '分站赛')
})

test('标准形式白名单：生成器产出的名字必须判为规范，旧写法必须判为不规范', () => {
  // 这条是「自己生成的名字自己认不认」的闸门 —— 生成器与校验器共用同一份正则
  const produced = [
    ccpcStandardName('长春国赛'),
    ccpcStandardName('女生赛', '成都'),
    ccpcStandardName('女生赛'),
    ccpcStandardName('网络赛'),
    icpcStandardName('西安'),
    'ICPC江西省赛',
    'CCPC全国邀请赛（南昌）暨江西省赛',
    'ICPC东亚区总决赛（昆明）',
    'ICPC世界总决赛（开罗）',
    'CCPC总决赛（深圳）',
    'ICPC网络赛预选赛第一场',
    'ICPC网络赛预选赛第二场',
  ]
  for (const t of produced) assert.ok(isStandardXcpcTitle(t), `应判为规范：${t}`)

  // 2026-10-02 之前的写法（带空格）、以及不在这 11 种里的写法
  for (const t of ['CCPC 长春国赛', 'ICPC 亚洲区域赛（西安）', 'CCPC长春国赛', '长春国赛', 'CCPC公开赛（长春）', ''])
    assert.ok(!isStandardXcpcTitle(t), `不该放行：${t}`)
})
