# 江西财经大学程序设计竞赛协会官网（Vue 版）

由原静态站 `../jxufe-acm.cn` 迁移重构而来。

## 技术栈

Vite 5 + Vue 3（`<script setup>`）+ Vue Router 4。无 UI 框架，样式为手写 CSS（设计令牌 + 组件 scoped）。

## 已迁移页面

| 路由 | 页面 | 数据来源 |
|------|------|----------|
| `/` | 首页（Hero 轮播 / 宗旨 / 赛事 logo / 最新动态） | `data/news.json` |
| `/all-action` | 大事记（置顶 + 按年份手风琴时间轴） | `data/news.json` |
| `/action/:slug` | 大事记详情（9 篇活动报道/培训课/FAQ） | `data/actions.json` |
| `/contest` | 竞赛信息（卡片网格） | `data/competitions.json` |
| `/competition/:slug` | 竞赛详情（7 项赛事：简介/详情卡/参赛历史） | `data/competitions.json` |
| `/leader` | 协会负责人 | `data/leaders.json` |
| `/excellent` | 优秀成员 | `data/members.json` |
| `/links` | 相关链接（官方友链 / 成员站点 / 申请友链） | `data/links.json` |

> 协会负责人虽不在最初的迁移清单里，但用户要求其 JSON 动态加载，故一并迁入。

### 大事记详情的 block schema

`data/actions.json` 每篇为 `{ slug, title, subtitle, blocks: [...] }`，`blocks` 是类型化数组，由 `components/action/BlockRenderer.vue` 渲染。支持的块类型：

`text` / `heading` / `images` / `awards`（获奖卡片）/ `highlight`（引述）/ `partners`（合作高校 logo）/ `list` / `table`（含 rowspan）/ `info`（信息卡片网格）/ `join`（二维码加入）/ `organizers`（可展开招新二维码卡片，`OrganizerGrid.vue`）/ `platformList`（学习平台）/ `faq`（`<details>` 折叠问答，答案可嵌套任意块）。

正文里的 `**加粗**` 与 `[文字](链接)` 由 `utils/inline.js` 渲染（先转义再转换，安全）。

## 目录结构

```
jxufe-acm-vue/
├── index.html                 # Vite 入口（仅 Font Awesome CDN + 挂载点）
├── vite.config.js
├── public/
│   ├── data/                  # ★ 全部内容数据（JSON），改内容不改代码
│   │   ├── news.json
│   │   ├── contests.json
│   │   ├── members.json
│   │   ├── leaders.json
│   │   └── links.json
│   ├── images/                # 原样拷贝的图片资源
│   └── jxufe.png
└── src/
    ├── main.js                # 挂载 + 全局 CSS + v-reveal 指令
    ├── App.vue                # 壳：Header / RouterView / Footer / FloatingJoin + 控制台彩蛋
    ├── router.js              # 6 条路由（懒加载）
    ├── styles/
    │   ├── tokens.css         # 设计令牌（颜色/阴影/圆角/布局变量）
    │   ├── base.css           # 重置 + 容器 + 按钮 + 标题 + keyframes + reveal
    │   └── index.css          # 入口
    ├── components/
    │   ├── AppHeader.vue      # 导航 + 滚动变色 + 汉堡菜单（scoped）
    │   ├── AppFooter.vue
    │   └── FloatingJoin.vue   # 右下角“加入我们”悬浮按钮
    ├── composables/
    │   ├── useJson.js         # 通用 JSON 加载
    │   ├── useNews.js         # 最新动态（2025 年，含摘要抓取）
    │   └── useTimeline.js     # 大事记（全部，按年分组）
    ├── directives/
    │   └── reveal.js          # v-reveal：IntersectionObserver 入场动画
    ├── data/
    │   └── navigation.js      # 导航 / 页脚链接（to=站内路由，href=未迁移）
    └── views/                 # 6 个页面，各自 scoped 样式
```

## 相对原站的关键改进

- **组件系统**：原 `ComponentLoader` + 占位符 + `../` 路径前缀自适应全部移除，改为 Vue 原生组件 + RouterLink，资源走 `/` 绝对路径。
- **内容数据化**：原硬编码在 HTML / JS 类里的竞赛、成员、负责人、友链全部抽成 `public/data/*.json`，加人加赛事只改 JSON。
- **CSS 去屎山**：原 1500+ 行 `style_v1.css` + 5 个页面 CSS 重复严重、跨页类名冲突（如 `.member-card` / `.members-grid` 在优秀成员页和友链页含义不同）。重构为：
  - 全局只留 `tokens.css`（变量）+ `base.css`（重置/容器/按钮/动画/工具），单一来源；
  - 页面专属样式下沉到各 `.vue` 的 `<style scoped>`，类名冲突天然消除，媒体查询不再散落重复。
- **滚动动画**：原 `main.js` 往 DOM 塞 `<style>` + 手动滚动监听，改为 `v-reveal` 指令（IntersectionObserver），声明式使用。
- **路由级代码分割**：每个页面懒加载，首屏只下首页代码。

## 已知限制

- 导航中“大移民计划 / 每日打卡”尚未迁移，仍为普通 `<a>` 链接。
- 大事记/竞赛的详情页内图片均使用原始外链（imgdb / bing 图床）或本地 `public/images`、`public/competition`、`public/action/tmp` 资源；外链图失效需在 JSON 里更换地址。

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物 dist/
npm run preview
```

## 维护速查

- 加竞赛：编辑 `public/data/contests.json`
- 加优秀成员：编辑 `public/data/members.json`
- 加负责人：编辑 `public/data/leaders.json`
- 加友链：编辑 `public/data/links.json`
- 加新闻 / 大事记条目：编辑 `public/data/news.json`（列表摘要）
- 加大事记详情正文：编辑 `public/data/actions.json`（同 slug）
- 加竞赛详情：编辑 `public/data/competitions.json`（卡片区 + detail 区同源）
- 改导航：编辑 `src/data/navigation.js`
- 改配色：编辑 `src/styles/tokens.css`
