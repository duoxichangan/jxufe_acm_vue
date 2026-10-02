/* eventsSource 的降级纪律（2026-09-24 审查）：
   ——「可以降级，但必须留下信号」；
   ——失败**不许写进进程缓存**：原先 `fetchJson` 把 404 静默换成空数据、`loadYear` 再把它
     写进 cache.yearData —— 一次瞬时失败就把「那年没有大事记」钉死整个会话，点侧栏也不会重试。
   这个用例单独一个文件：结果缓存在模块级，只有新进程才能测「首次加载」的行为。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadYear, missingEventSources } from '../src/utils/eventsSource.js'

test('年份文件 404：返回空数据 + 记进缺失清单 + 不写缓存（下次点击会重试）', async () => {
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return { ok: false, status: 404, json: async () => ({}) }
  }

  const first = await loadYear('2099')
  assert.deepEqual(first, { cards: [], articles: {} }, '读不到就是空数据，调用方照常渲染')
  assert.equal(calls.length, 1)
  assert.ok(
    missingEventSources.includes('/data/events/2099.json'),
    '失败要留痕（原先 404 是静默的：非 2xx 直接回落，连一行日志都没有）'
  )

  await loadYear('2099')
  assert.equal(calls.length, 2, '失败不进缓存 —— 这正是「一次失败之后永远不再重试」的回归点')
})

test('成功照旧缓存：同一年只请求一次', async () => {
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return { ok: true, status: 200, json: async () => ({ cards: [{ title: 'x' }], articles: {} }) }
  }

  const a = await loadYear('2098')
  const b = await loadYear('2098')
  assert.equal(calls.length, 1)
  assert.equal(a, b, '同一份对象：文章正文与卡片共用一次请求')
  assert.equal(a.cards.length, 1)
})
