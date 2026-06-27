# 江西财经大学程序设计竞赛协会

江西财经大学 ACM 程序设计竞赛协会官方网站，基于 Vue 3 重构的单页应用（SPA）。

在线地址：**https://jxufe-acm.cn**

---

## ✨ 特性

- **Vue 3 组件化** — `<script setup>` + Composition API，路由级懒加载，首屏极速
- **内容数据驱动** — 新闻、竞赛、成员、负责人、友链等全部抽离为 JSON，增删改无需改代码
- **手写 CSS 体系** — 设计令牌（`tokens.css`）+ 全局基础样式 + 组件 Scoped，无 UI 框架依赖
- **滚动入场动画** — 基于 IntersectionObserver 的 `v-reveal` 指令，声明式使用
- **大事记 Block 渲染** — 类型化内容块系统，支持 13 种块类型（文本、图片、奖项、表格、FAQ 等）
- **全局交互特效** — 光标涟漪（`useCursorRipple`）、代码拖尾（`useCodeTrail`）、骨架屏加载态
- **响应式设计** — 适配桌面端与移动端，导航栏支持汉堡菜单

## 🛠 技术栈

| 类别 | 选型 |
|------|------|
| 构建工具 | Vite 5 |
| 框架 | Vue 3（Composition API） |
| 路由 | Vue Router 4（HTML5 History 模式） |
| 样式 | 手写 CSS（设计令牌 + Scoped） |
| 图标 | Font Awesome 6（CDN） |
| 字体 | Google Fonts: Noto Sans SC, Noto Serif SC, ZCOOL KuaiLe |
| UI 框架 | 无 |

## 📁 目录结构

```
jxufe-acm-vue/
├── index.html                     # Vite 入口 HTML
├── vite.config.js                 # Vite 配置
├── package.json                   # 依赖：vue + vue-router + vite
├── deploy.bat                     # Windows 一键部署脚本
├── public/
│   ├── data/                      # ★ 所有内容数据（JSON），修改即生效，无需重新构建
│   │   ├── actions.json           # 大事记 / 新闻（含文章正文）
│   │   ├── competitions.json      # 竞赛信息 + 参赛历史
│   │   ├── leaders.json           # 历届协会负责人
│   │   ├── members.json           # 优秀成员列表
│   │   └── links.json             # 友情链接
│   └── images/                    # 静态图片
│       ├── slider/                # 首页轮播图（slider1.jpg ~ slider10.jpg）
│       ├── contest/               # 竞赛 logo
│       ├── leader/                # 负责人头像（2021.jpg ~ 2026.jpg）
│       ├── excellent_member/      # 优秀成员头像
│       ├── links/                 # 友链 logo + 二维码
│       └── ...
└── src/
    ├── main.js                    # 应用入口
    ├── App.vue                    # 根组件（Header + RouterView + Footer + FloatingJoin）
    ├── router.js                  # 9 条路由，全部懒加载
    ├── styles/
    │   ├── tokens.css             # 设计令牌（颜色 / 阴影 / 圆角 / 间距 / 字体）
    │   ├── base.css               # CSS 重置 + 全局样式 + 动画关键帧
    │   └── index.css              # 样式入口
    ├── components/
    │   ├── AppHeader.vue          # 导航栏（滚动变色 + 移动端汉堡菜单）
    │   ├── AppFooter.vue          # 页脚（三栏布局 + ICP 备案）
    │   ├── FloatingJoin.vue       # 右下角悬浮"加入我们"按钮
    │   └── action/
    │       ├── BlockRenderer.vue  # 大事记块类型渲染器（13 种块）
    │       └── OrganizerGrid.vue  # 招新二维码卡片网格
    ├── composables/
    │   ├── useJson.js             # 通用 JSON 数据加载器
    │   ├── useNews.js             # 首页最新动态（最近 5 条）
    │   ├── useTimeline.js         # 大事记按年分组 + 置顶
    │   ├── useSkeleton.js         # 骨架屏占位
    │   ├── useCodeTrail.js        # 代码字符拖尾特效
    │   └── useCursorRipple.js     # 光标涟漪特效
    ├── directives/
    │   └── reveal.js              # v-reveal 滚动入场指令
    ├── data/
    │   └── navigation.js          # 导航菜单 + 页脚链接
    ├── utils/
    │   └── inline.js              # 内联标记解析（**加粗**、[链接](url)）
    └── views/
        ├── HomeView.vue           # 首页 /
        ├── AllActionView.vue      # 大事记列表 /all-action
        ├── ActionDetailView.vue   # 大事记详情 /action/:slug
        ├── ContestView.vue        # 竞赛信息 /contest
        ├── CompetitionDetailView.vue  # 竞赛详情 /competition/:slug
        ├── LeaderView.vue         # 协会负责人 /leader
        ├── ExcellentView.vue      # 优秀成员 /excellent
        ├── LinksView.vue          # 友链 /links
        └── NotFoundView.vue       # 404 页面
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

## 📦 部署

项目使用 `deploy.bat` 一键部署到服务器：

1. 确保本机代码已 `git commit`
2. 双击 `deploy.bat`
3. 脚本自动：检测变更文件 → 增量上传 → 服务器构建 → 重载 Nginx

首次运行全量上传，后续只上传有变化的文件/目录。详见脚本内注释。

---

## 📝 内容维护指南

所有可变内容存放在 `public/data/` 目录下的 JSON 文件中。**修改后刷新页面即可生效，无需重启，无需重新构建。**

> **注意：** 如果你提交了 Pull Request 并被合并，但网站迟迟没有更新，请联系 **QQ：3200513041** 手动触发部署。

---

### 一、如何添加 / 修改 News（大事记）

**文件：** `public/data/actions.json`

每条记录的结构如下：

```json
{
  "slug": "2025-4-19-tts",          // 唯一标识，用于 URL（/action/2025-4-19-tts）
  "title": "时隔8年，我校再获天梯赛团体国一",
  "date": "2025-04-19",
  "isTop": false,                    // true = 置顶
  "summary": "简短摘要，显示在首页和列表页",
  "subtitle": "副标题（可选，详情页显示）",
  "blocks": [ ... ]                  // 文章正文，见下方 Block 类型
}
```

#### Block 类型一览

`blocks` 是一个数组，每个元素有一个 `type` 字段。**正文中的 `**加粗**` 和 `[文字](链接)` 会自动转换为 HTML。**

| type | 用途 | 关键字段 |
|------|------|---------|
| `text` | 正文段落 | `paras: string[]` |
| `heading` | 小标题 | `text`, `icon?`（Font Awesome 类名） |
| `images` | 图片 | `items: [{ src, alt?, caption? }]` |
| `awards` | 获奖卡片 | `heading?`, `cards: [{ title, fields, highlight?, images }]` |
| `highlight` | 引用 / 高亮文本 | `text: string` |
| `partners` | 合作高校 Logo 墙 | `logos: [{ src, alt }]`, `note?` |
| `list` | 列表 | `intro?`, `items: string[]` |
| `table` | 表格 | `headers?`, `rows: 二维数组` |
| `info` | 信息卡片网格 | `heading?`, `icon?`, `cards: [{ icon, title, desc }]` |
| `organizers` | 招新二维码卡片（可点击展开） | `heading?`, `icon?`, `items: [{ icon, name, qr?, text? }]` |
| `join` | 二维码加入区 | `heading?`, `icon?`, `qq?`, `images`, `note?` |
| `platformList` | 学习平台列表 | `items: [{ name, desc }]` |
| `faq` | 折叠问答（答案可嵌套任意 Block） | `items: [{ q, a: Block[] }]` |

#### 添加一条新 News

在 `actions.json` 数组最前面插入一条新对象即可。示例：

```json
{
  "slug": "2026-6-27-new-contest",
  "title": "我校在XX竞赛中取得佳绩",
  "date": "2026-06-27",
  "isTop": false,
  "summary": "简短的摘要描述",
  "subtitle": "副标题（可省略）",
  "blocks": [
    {
      "type": "text",
      "paras": ["第一段正文。**加粗文字**会自动渲染。", "第二段正文。访问 [官网](https://jxufe-acm.cn) 了解更多。"]
    },
    {
      "type": "heading",
      "text": "获奖详情",
      "icon": "fa-solid fa-trophy"
    },
    {
      "type": "images",
      "items": [
        { "src": "/images/slider/slider1.jpg", "alt": "描述", "caption": "图片说明" }
      ]
    }
  ]
}
```

---

### 二、如何添加 / 修改 Members（优秀成员）

**文件：** `public/data/members.json`

```json
{
  "name": "张三",
  "class": "22计算机科学与技术1班",
  "photo": "/images/excellent_member/zhangsan.png",
  "honors": [
    "2024 ICPC 区域赛金牌",
    "蓝桥杯国家级一等奖",
    "保研至XX大学"
  ]
}
```

**添加步骤：**

1. 将成员头像放到 `public/images/excellent_member/` 目录
2. 在 `members.json` 数组末尾添加一条记录
3. 刷新页面即可看到新成员

**photo 字段**支持两种写法：
- 本地图片：`"/images/excellent_member/xxx.png"`
- 外部 URL：`"https://example.com/avatar.jpg"`

---

### 三、如何添加 / 修改 Leaders（协会负责人）

**文件：** `public/data/leaders.json`

```json
{
  "session": "2027届会长",
  "name": "李四",
  "class": "26计算机科学与技术2班",
  "avatar": "/images/leader/2027.jpg",
  "message": "对协会的寄语，一段话即可。",
  "achievements": [
    "ICPC 区域赛银牌",
    "天梯赛个人国家级一等奖",
    "..."
  ]
}
```

**添加步骤：**

1. 将负责人头像放到 `public/images/leader/` 目录
2. 在 `leaders.json` 数组最前面插入新一届负责人（按届数降序排列）
3. `achievements` 数组支持用 `"..."` 结尾表示"更多荣誉"

---

### 四、如何添加 / 修改 Competitions（竞赛）

**文件：** `public/data/competitions.json`

```json
{
  "slug": "icpc",
  "name": "ICPC 国际大学生程序设计竞赛",
  "image": "/images/contest/icpc.png",
  "desc": "简短描述",
  "subtitle": "国际级赛事",
  "intro": ["段落1", "段落2"],
  "details": [
    { "icon": "fa-solid fa-clock", "title": "比赛时间", "lines": ["每年9-12月"] }
  ],
  "history": [
    {
      "year": "2025",
      "entries": [
        {
          "title": "第50届 ICPC 西安邀请赛",
          "desc": "金牌（历史首金）",
          "level": "国际级",
          "members": "黄亦诚、王玛琪、石翰林"
        }
      ]
    }
  ]
}
```

### 五、维护页面导航

**文件：** `src/data/navigation.js`

修改导航文字、顺序、页脚链接。也是 JSON 结构，修改后刷新即可。

---

## 🎨 自定义样式

- **主题色 / 间距 / 阴影 / 字体：** `src/styles/tokens.css`
- **全局样式 / 动画：** `src/styles/base.css`
- **组件样式：** 每个 `.vue` 文件中的 `<style scoped>` 块

本项目不使用任何 UI 框架，所有样式均为手写 CSS，修改自由度极高。

---

## 📄 路由一览

| 路径 | 页面 | 数据源 |
|------|------|--------|
| `/` | 首页 | `actions.json`（最近 5 条） |
| `/all-action` | 大事记 | `actions.json`（全部，按年分组） |
| `/action/:slug` | 大事记详情 | `actions.json` |
| `/contest` | 竞赛信息 | `competitions.json` |
| `/competition/:slug` | 竞赛详情 | `competitions.json` |
| `/leader` | 协会负责人 | `leaders.json` |
| `/excellent` | 优秀成员 | `members.json` |
| `/links` | 友链 | `links.json` |

---

## ⚠️ 网站未更新？

如果你提交了 Pull Request 并被合并到 `master` 分支，但网站迟迟没有更新：

**联系 QQ：3200513041**

---

> 由原静态站 `jxufe-acm.cn` 迁移重构而来，以现代化前端工程体系重新组织。
