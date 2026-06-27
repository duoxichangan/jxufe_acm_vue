/**
 * 极简内联标记渲染：先转义 HTML，再把 **bold** 与 [text](url) 转回标签。
 * 用于 action 文章正文里少量加粗 / 链接，避免在数据里手写 HTML。
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
    .replace(/\n/g, '<br>')
}
