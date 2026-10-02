/**
 * 极简内联标记渲染：先转义 HTML，再把 **bold**、[text](url)、~~删除线~~ 转回标签。
 * 用于 action 文章正文里少量加粗 / 链接 / 划掉的话，避免在数据里手写 HTML。
 *
 * 刻意只做这三样：数据里的标记来自手写与 Markdown 转换（scripts/gen_postgraduate_share.mjs），
 * 遇到不认识的语法（`` `行内代码` `` 等）应当由转换侧处理掉 —— 这里保持「一眼能看完」的体量，
 * 不做通用 Markdown 解析器。
 */
export function renderInline(text) {
  if (text == null) return ''
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\n/g, '<br>')
}
