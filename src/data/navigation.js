// 顶部导航与页脚链接。to = 站内路由；href = 未迁移/外部，渲染为普通 <a>。
// ⚠ 两份**有意不一样**（2026-10-02）：「近期赛事」只进页脚，不进顶部导航 ——
// 会长选的档是「只加页脚，不动顶部导航」，顶部保持 6 项。它的主要入口是竞赛信息页
// 那块看板（UpcomingBoard.vue），页脚这一条是给「已经在找赛程」的人的兜底入口。
export const navLinks = [
  { label: '首页', to: '/' },
  { label: '大事记', to: '/all-action' },
  { label: '竞赛信息', to: '/contest' },
  { label: '协会负责人', to: '/leader' },
  { label: '优秀成员', to: '/excellent' },
  { label: '相关链接', to: '/links' }
]

export const footerLinks = [
  { label: '首页', to: '/' },
  { label: '大事记', to: '/all-action' },
  { label: '竞赛信息', to: '/contest' },
  { label: '近期赛事', to: '/upcoming' },
  { label: '协会负责人', to: '/leader' },
  { label: '优秀成员', to: '/excellent' },
  { label: '相关链接', to: '/links' }
]
