/**
 * 多作者大事记文章（保研经验分享）的回归集。
 *
 * 这类文章的正文由 `scripts/gen_postgraduate_share.mjs` 从 Markdown 转成 blocks：
 * 转换器一旦改坏（块类型写错、表格缺列、正文整段丢掉、作者字段抠进表格竖线），
 * 页面上只会「少一段」或「显示怪东西」，而 check_awards.mjs 只校验结构、不读内容。
 * 所以这里对着**实际落盘的数据**把渲染前必须成立的几条钉住。
 *
 * 为什么块类型白名单写在这里而不是 import 自 BlockRenderer.vue：
 * 那是 .vue 单文件组件，node --test 直接 import 不了（Vite 才能编译）。
 * 白名单与 BlockRenderer.vue 的 v-if 分支一一对应，改那边记得改这里。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const EVENTS = path.join(process.cwd(), 'public', 'data', 'events')

/** BlockRenderer.vue 认识的块类型（改组件时同步维护） */
const BLOCK_TYPES = new Set([
  'text',
  'heading',
  'images',
  'awards',
  'highlight',
  'partners',
  'list',
  'table',
  'info',
  'organizers',
  'platformList',
  'related',
  'faq'
])

/** 读全部年份文件，返回 [{ year, id, article }]，只含多作者文章 */
function multiAuthorArticles() {
  const out = []
  for (const f of fs.readdirSync(EVENTS)) {
    if (!/^\d{4}\.json$/.test(f)) continue
    const year = f.replace('.json', '')
    const data = JSON.parse(fs.readFileSync(path.join(EVENTS, f), 'utf8'))
    for (const [id, article] of Object.entries(data.articles || {})) {
      if (Array.isArray(article.authors)) out.push({ year, id, article })
    }
  }
  return out
}

const articles = multiAuthorArticles()

test('多作者文章存在，且每位分享人都有正文', () => {
  assert.ok(articles.length > 0, 'public/data/events/ 下应至少有一篇 authors 形态的文章')
  for (const { year, id, article } of articles) {
    assert.ok(article.authors.length >= 2, `${id}：authors 至少 2 位（1 位就该用 blocks 形态）`)
    for (const au of article.authors) {
      assert.ok(au.name, `${id}：分享人 name 为空`)
      assert.ok(Array.isArray(au.blocks) && au.blocks.length >= 10, `${id}/${au.name}：正文过少，疑似转换失败`)
      // 这些字段会被直接渲染：混进表格竖线或换行说明抠错了行
      for (const k of ['group', 'grade', 'meta', 'final']) {
        if (au[k] === undefined) continue
        assert.equal(typeof au[k], 'string', `${id}/${au.name}：${k} 不是字符串`)
        assert.doesNotMatch(au[k], /[|\n]/, `${id}/${au.name}：${k} 混进了表格竖线/换行`)
      }
      // 年级显示在切换器 tag 上：给了就得是「20xx级」这个形状
      if (au.grade) assert.match(au.grade, /^\d{4}级$/, `${id}/${au.name}：grade 形状应为「2023级」，实为 ${JSON.stringify(au.grade)}`)
    }
  }
})

test('分享人按年级升序排列（先 2022 级，再 2023 级…）', () => {
  for (const { id, article } of articles) {
    const grades = article.authors.map((a) => Number((/(\d{4})/.exec(a.grade || '') || [])[1] || Infinity))
    const sorted = [...grades].sort((a, b) => a - b)
    assert.deepEqual(grades, sorted, `${id}：分享人顺序应按年级升序，实为 ${article.authors.map((a) => a.grade || '(无)').join(' → ')}`)
  }
})

test('标题层级落在 1..3，且同一篇里大节/小节分得开', () => {
  for (const { id, article } of articles) {
    for (const au of article.authors) {
      const heads = au.blocks.filter((b) => b.type === 'heading')
      for (const h of heads) {
        assert.ok([1, 2, 3].includes(h.level), `${id}/${au.name}：标题「${h.text}」的 level 应在 1..3，实为 ${JSON.stringify(h.level)}`)
      }
      // 每篇都该有 1 级标题（否则整篇会平掉 —— 归一化的 base 算错了就会这样）
      assert.ok(heads.some((h) => h.level === 1), `${id}/${au.name}：一个 1 级标题都没有，层级归一化可能失效`)
    }
  }
})

test('块类型必须是渲染器认识的，且正文不能有空气泡', () => {
  for (const { id, article } of articles) {
    for (const au of article.authors) {
      au.blocks.forEach((b, i) => {
        const at = `${id}/${au.name} blocks[${i}]`
        assert.ok(BLOCK_TYPES.has(b.type), `${at}：未知块类型 ${b.type}`)
        if (b.type === 'text') assert.ok(b.paras?.some((p) => p.trim()), `${at}：text 块全空`)
        if (b.type === 'heading') assert.ok(b.text?.trim(), `${at}：heading 缺文字`)
        if (b.type === 'highlight') assert.ok(b.text?.trim(), `${at}：highlight 缺文字`)
        if (b.type === 'list') assert.ok(b.items?.length, `${at}：list 无条目`)
        if (b.type === 'images') {
          assert.ok(b.items?.length, `${at}：images 无图片`)
          for (const img of b.items) assert.match(img.src, /^https?:\/\/|^\//, `${at}：图片 src 既不是绝对路径也不是 http(s)：${img.src}`)
        }
      })
    }
  }
})

test('表格每行列数与表头一致（Markdown 管道表转换最容易在这里错位）', () => {
  for (const { id, article } of articles) {
    for (const au of article.authors) {
      au.blocks
        .filter((b) => b.type === 'table')
        .forEach((t, i) => {
          const at = `${id}/${au.name} 第 ${i + 1} 张表`
          assert.ok(t.headers?.length >= 2, `${at}：表头少于 2 列`)
          assert.ok(t.rows?.length, `${at}：没有数据行`)
          t.rows.forEach((row, r) => {
            assert.equal(row.length, t.headers.length, `${at} 第 ${r + 1} 行有 ${row.length} 列，表头 ${t.headers.length} 列`)
          })
        })
    }
  }
})

test('转换器是幂等的：直接跑一遍 --check 应为「已是最新」', async () => {
  const { spawnSync } = await import('node:child_process')
  const res = spawnSync(process.execPath, ['scripts/gen_postgraduate_share.mjs', '--check'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  // 源 .md 在仓外（桌面 share/ 目录）：别的机器上取不到就跳过这条，不当失败
  if (/缺少分享原文/.test(res.stderr + res.stdout)) return
  assert.equal(res.status, 0, `生成物与源不一致，需要重跑生成器：\n${res.stdout}${res.stderr}`)
})
