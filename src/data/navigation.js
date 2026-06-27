// 顶部导航与页脚链接。to = 站内路由；href = 未迁移/外部，渲染为普通 <a>。
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
  { label: '协会负责人', to: '/leader' },
  { label: '优秀成员', to: '/excellent' },
  { label: '相关链接', to: '/links' },
  { label: '大移民计划', href: '/big_migrate.html' },
  { label: '每日打卡', href: '/clock.html' }
]
