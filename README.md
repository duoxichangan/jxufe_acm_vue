# 江西财经大学程序设计竞赛协会

江西财经大学 ACM 程序设计竞赛协会官方网站，基于 Vue 3 重构的单页应用（SPA）。

## ✨ 特性

- **Vue 3 组件化** — `<script setup>` + Composition API，页面路由级懒加载，首屏极速
- **内容数据驱动** — 竞赛、成员、负责人、友链等全部抽离为 JSON，增删改无需改代码
- **手写 CSS 体系** — 设计令牌（`tokens.css`）+ 全局基础样式 + 组件 scoped，彻底告别类名冲突
- **滚动入场动画** — 基于 IntersectionObserver 的 `v-reveal` 指令，声明式使用
- **大事记 Block 渲染** — 类型化的内容块系统，支持文本、图片、奖项、表格、FAQ 等十余种块类型
- **炫彩交互细节** — 光标涟漪（`useCursorRipple`）、代码拖尾（`useCodeTrail`）、骨架屏（`useSkeleton`）

## 🛠 技术栈

| 类别 | 选型 |
|------|------|
| 构建工具 | Vite 5 |
| 框架 | Vue 3（Composition API） |
| 路由 | Vue Router 4 |
| 样式 | 手写 CSS（设计令牌 + Scoped） |
| 图标 | Font Awesome 6（CDN） |
| UI 框架 | 无 |

## 📄 页面路由

| 路由 | 页面 | 数据源 |
|------|------|--------|
| `/` | 首页 — Hero 轮播 · 协会宗旨 · 赛事 Logo · 最新动态 | `useNews.js` |
| `/all-action` | 大事记 — 置顶条目 + 按年份手风琴时间轴 | `useTimeline.js` |
| `/action/:slug` | 大事记详情 | `data/actions.json` |
| `/contest` | 竞赛信息卡片网格 | `data/competitions.json` |
| `/competition/:slug` | 竞赛详情 | `data/competitions.json` |
| `/leader` | 协会负责人 | `data/leaders.json` |
| `/excellent` | 优秀成员 | `data/members.json` |
| `/links` | 友链 — 官方友链 · 成员站点 · 申请入口 | `data/links.json` |

## 📁 目录结构

```
jxufe-acm-vue/
├── index.html                     # Vite 入口
├── vite.config.js
├── public/
│   ├── data/                      # ★ 全部内容数据（JSON）
│   │   ├── actions.json           # 大事记详情
│   │   ├── competitions.json      # 竞赛信息 + 详情
│   │   ├── leaders.json           # 历届负责人
│   │   ├── members.json           # 优秀成员
│   │   └── links.json             # 友链
│   └── images/                    # 静态图片资源
└── src/
    ├── main.js                    # 入口：挂载 + 全局样式 + 指令注册
    ├── App.vue                    # 根组件：Header / RouterView / Footer / FloatingJoin
    ├── router.js                  # 路由配置（全部懒加载）
    ├── styles/
    │   ├── tokens.css             # 设计令牌（颜色 / 阴影 / 圆角 / 布局变量）
    │   ├── base.css               # 重置 + 容器 + 按钮 + 标题 + 动画
    │   └── index.css              # 样式入口
    ├── components/
    │   ├── AppHeader.vue          # 导航栏（滚动变色 + 汉堡菜单）
    │   ├── AppFooter.vue          # 页脚
    │   ├── FloatingJoin.vue       # 右下角悬浮"加入我们"
    │   └── action/
    │       ├── BlockRenderer.vue  # 大事记块类型渲染器
    │       └── OrganizerGrid.vue  # 招新二维码卡片
    ├── composables/
    │   ├── useJson.js             # 通用 JSON 加载
    │   ├── useNews.js             # 最新动态
    │   ├── useTimeline.js         # 大事记（按年分组）
    │   ├── useSkeleton.js         # 骨架屏
    │   ├── useCodeTrail.js        # 代码字符拖尾效果
    │   └── useCursorRipple.js     # 光标涟漪效果
    ├── directives/
    │   └── reveal.js              # v-reveal 滚动入场动画
    ├── data/
    │   └── navigation.js          # 导航 / 页脚链接
    └── views/                     # 8 个页面组件（各自 Scoped 样式）
```

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器 → http://localhost:5173
npm run dev

# 构建生产版本 → dist/
npm run build

# 预览生产构建
npm run preview
```

## 📝 内容维护

所有内容存放在 `public/data/` 下，修改后刷新即可生效，无需重启或重新构建：

| 操作 | 编辑文件 |
|------|----------|
| 加 / 改竞赛 | `competitions.json` |
| 加 / 改优秀成员 | `members.json` |
| 加 / 改负责人 | `leaders.json` |
| 加 / 改友链 | `links.json` |
| 加大事记详情 | `actions.json` |
| 改导航菜单 | `src/data/navigation.js` |
| 改主题配色 | `src/styles/tokens.css` |

### 大事记 Block 类型

`actions.json` 中每条大事记的 `blocks` 数组支持以下类型：

`text` · `heading` · `images` · `awards`（获奖卡片）· `highlight`（引述）· `partners`（合作高校 Logo）· `list` · `table` · `info`（信息卡片网格）· `join`（二维码加入）· `organizers`（招新二维码）· `platformList`（学习平台）· `faq`（折叠问答，答案可嵌套任意块）

正文中 `**加粗**` 和 `[文字](链接)` 由内联解析器自动转换。

---

> 由原静态站 `jxufe-acm.cn` 迁移重构而来，去除了大量历史遗留问题（CSS 冲突、硬编码内容、手写 DOM 操作），以现代化前端工程体系重新组织。
