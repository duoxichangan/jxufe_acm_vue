# 江西财经大学程序设计竞赛协会

江西财经大学 ACM 程序设计竞赛协会官方网站，基于 Vue 3 重构的单页应用（SPA）。

在线地址：**https://jxufe-acm.cn**

---

## ✨ 特性

- **Vue 3 组件化** — `<script setup>` + Composition API，路由级懒加载，首屏极速
- **内容数据驱动** — 新闻、竞赛、成员、负责人、友链等全部抽离为 JSON，增删改无需改代码
- **首页头像墙** — hero 区底纹：协会成员的头像铺成一面缓慢漂移的墙，点 hero 底部那颗「成员墙」按钮看全，再点一下（此时是「返回」）退出（见「维护群成员头像墙」一节）
- **手写 CSS 体系** — 设计令牌（`tokens.css`）+ 全局基础样式 + 组件 Scoped，无 UI 框架依赖
- **滚动入场动画** — 基于 IntersectionObserver 的 `v-reveal` 指令，声明式使用
- **大事记 Block 渲染** — 类型化内容块系统，支持 13 种块类型（文本、图片、奖项、表格、FAQ 等）
- **全局交互特效** — 光标涟漪（`useCursorRipple`）、代码拖尾（`useCodeTrail`）、骨架屏加载态
- **响应式设计** — 适配桌面端与移动端，导航栏支持汉堡菜单

> 📖 **要往网站里加内容，先看 [`knowledge.md`](./knowledge.md)** —— 它按「我要做什么」组织，
> 逐字段说明大事记 / 获奖记录 / 优秀成员 / 负责人 / 头像墙怎么加，以及怎么部署。
> 本 README 偏技术实现。

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
│   │   ├── awards/                # ★★ 获奖数据唯一真源（每个赛事一个文件，见「获奖数据格式」）
│   │   │   ├── icpc.json          # ICPC 获奖（团队赛）
│   │   │   ├── ccpc.json          # CCPC 获奖（团队赛）
│   │   │   ├── gplt-team.json     # 天梯赛（国赛）团队奖
│   │   │   ├── gplt-individual.json # 天梯赛（国赛）个人奖
│   │   │   ├── lanqiao.json       # 蓝桥杯（单人赛）
│   │   │   ├── baidu.json         # 百度之星（单人赛）
│   │   │   └── chuanzhi.json      # 传智杯（单人赛，暂空）
│   │   ├── competitions.json      # 竞赛展示元信息：slug / 名称 / logo / 简介 / 详情卡 / mode / awards / sessions
│   │   ├── events/                # ★ 大事记的全部数据（一年一个文件，卡片 + 文章正文）
│   │   │   │                       #   与 competitions.json / awards/ 完全独立，允许重复
│   │   │   ├── top.json           # 置顶卡片
│   │   │   └── <year>.json        # 该年全部数据：{ cards: [...], articles: { <id>: {...} } }
│   │   │                           #   每张卡片的 link 恒等于本文件 articles 里的一个 key
│   │   ├── leaders.json           # 历届协会负责人
│   │   ├── members.json           # 优秀成员列表（手写真源；页面实际读的是下面那份生成物）
│   │   ├── group_members.json     # ★ 群成员名单，当前 138 人（由仓外 build_site_assets.py 派生）
│   │   ├── duties.json            # 协会职务胶囊（由仓外 build_duties.py 派生，只显示不进排名）
│   │   ├── scholarships.json      # ★ 国奖 / 国励（由仓外 build_scholarships.py 派生，见第七节）
│   │   ├── wall_rules.json        # ★ 头像墙入墙规则：people[] + 两条分数阈值（手写，会长维护）
│   │   ├── group_wall.manifest.json # 头像墙要铺哪些图（生成物，已 gitignore）
│   │   ├── group_wall.json        # 头像墙每格的文案（生成物，已 gitignore）
│   │   ├── excellent_members.json # 优秀成员页名单 = members.json + 自动入册（生成物，已 gitignore）
│   │   ├── event_badges.json      # 大事记时间轴的奖牌徽章（生成物，已 gitignore）
│   │   ├── hero_wall.json         # 上游那份 33 人墙的文案（现只剩 message 被首页墙按姓名并入）
│   │   ├── hero_wall.manifest.json # 上游那份墙的图片清单（现无消费者，也不再自动重写）
│   │   └── links.json             # 友情链接
│   └── images/                    # 静态图片
│       ├── slider/                # 首页轮播图（slider1.jpg ~ slider10.jpg）
│       ├── contest/               # 竞赛 logo
│       ├── leader/                # 负责人头像（2021.jpg ~ 2026.jpg）
│       ├── excellent_member/      # 优秀成员照片（members.json 的 photo 指这里；不是墙上唯一来源）
│       ├── group_members/         # 群头像出图：full/ 640 原图 + thumbs/ 160 WebP（仓外脚本产出）
│       ├── group_wall_thumbs/     # ★ 协会成员墙缩略图 384/ 与 256/ 两档（npm run data:group-thumbs）
│       ├── hero_wall_thumbs/      # 上游那份墙的缩略图 384/ 与 256/ 两档（现无消费者）
│       ├── links/                 # 友链 logo + 二维码
│       └── ...
├── knowledge.md                   # ★ 内容维护手册（加内容 / 改字段 / 部署，面向内容维护者）
├── scripts/
│   ├── check_awards.mjs           # 全量数据校验
│   ├── gen_events_articles.mjs    # 由 scripts/source/ 生成「赛事卡片」的大事记文章
│   ├── gen_hero_wall.mjs          # 上游那套：扫 excellent_member/ → 重写 hero_wall.manifest.json
│   ├── gen_hero_wall_thumbs.ps1   # 上游那套缩略图（无消费者；本地 Windows 专用，不参与服务器构建）
│   ├── gen_group_wall.mjs         # ★ 生成协会成员墙 group_wall.*.json + excellent_members.json
│   ├── gen_group_wall_thumbs.ps1  # ★ 生成成员墙缩略图 384/256（本地 Windows 专用，不参与服务器构建）
│   ├── gen_event_badges.mjs       # 由 awards/ + events/ 生成大事记奖牌徽章 event_badges.json
│   ├── source/                    # 生成器专用输入（不参与运行时，不部署）
│   │   ├── editions/gplt/<年>.json    # 天梯赛：国赛/省赛 × 高校奖/团队奖/个人奖 + scale
│   │   ├── editions/lanqiao/<年>.json # 蓝桥杯：国赛/省赛 × 个人奖（含科目/排名）
│   │   └── baidu.json                 # 百度之星：决赛/初赛场次 × 获奖名单
│   └── README.md                  # ★ 本目录五类文件与规矩（构建链 / 按需 / 共用库 / 一次性工具 / 数据源）

└── src/
    ├── main.js                    # 应用入口
    ├── App.vue                    # 根组件（Header + RouterView + Footer + FloatingJoin）
    ├── router.js                  # 10 条路由，全部懒加载
    ├── styles/
    │   ├── tokens.css             # 设计令牌（颜色 / 阴影 / 圆角 / 间距 / 字体）
    │   ├── base.css               # CSS 重置 + 全局样式 + 动画关键帧
    │   ├── honors.css             # 荣誉胶囊配色（按类型：竞赛 / 去向 / 荣誉 / 联系方式）
    │   ├── view-toggle.css        # 「表格 / 卡片」「计数 / 图标 / 明细」共用的切换按钮
    │   └── index.css              # 样式入口
    ├── components/
    │   ├── AppHeader.vue          # 导航栏（滚动变色 + 移动端汉堡菜单）
    │   ├── AppFooter.vue          # 页脚（三栏布局 + ICP 备案）
    │   ├── FloatingJoin.vue       # 右下角悬浮"加入我们"按钮
    │   ├── HeroAvatarWall.vue     # ★ 首页 hero 头像墙（环面漂移 + 悬停卡 + 触屏交互 + 开关按钮）
    │   ├── CompetitionSchedule.vue # ★ 竞赛信息页的全年赛程时间轴（桌面横轴图 + 窄屏竖排表）
    │   ├── HonorPill.vue          # 荣誉胶囊（按类型分色，配色在 styles/honors.css）
    │   ├── HonorTags.vue          # ★ 荣誉标签序列：职务 → 战绩（三种模式）→ 手写荣誉（两页共用）
    │   ├── HonorViewSwitch.vue    # 荣誉显示方式切换器：计数 / 图标 / 明细（优秀成员页与负责人页共用）
    │   ├── action/
    │   │   ├── BlockRenderer.vue  # 大事记块类型渲染器
    │   │   └── OrganizerGrid.vue  # 招新二维码卡片网格
    │   └── lanqiao/
    │       └── RosterGroup.vue    # 获奖分组名单（奖等徽章 + 姓名表格）
    ├── composables/
    │   ├── useJson.js             # 通用 JSON 数据加载器
    │   ├── useNews.js             # 首页最新动态（从 events/ 按年取最近 5 条新闻）
    │   ├── useTimeline.js         # ★ 大事记数据源（按年懒加载 + 归一化 + 分组）
    │   ├── useSkeleton.js         # 骨架屏占位
    │   ├── useMasonry.js          # ★ 优秀成员页瀑布流（逐张放进最短列；列数/间距走 .grid 上的 CSS 变量）
    │   ├── useHonorDisplay.js     # ★ 荣誉取数与归一化（职务 / 自动汇总战绩 / 手写荣誉 + 奖学金，两页共用）
    │   ├── useSectionSnap.js      # ★ 首页滚轮「按部分对齐」吸附（#home / #about / #news 三个分界）
    │   ├── useCodeTrail.js        # 代码字符拖尾特效
    │   └── useCursorRipple.js     # 光标涟漪特效
    ├── directives/
    │   └── reveal.js              # v-reveal 滚动入场指令
    ├── data/
    │   └── navigation.js          # 导航菜单 + 页脚链接
    ├── utils/
    │   ├── inline.js              # 内联标记解析（**加粗**、[链接](url)、~~删除线~~）
    │   ├── awardGroups.js         # ★ 获奖数据展示工具（两个竞赛页共用）
    │   ├── honorPills.js          # ★ 比赛战绩胶囊：由 awards/ 自动汇总（不用手写进名单）
    │   ├── honorRanking.js        # ★ 卡片排序分与入墙阈值的分数口径（改口径只改这个文件）
    │   ├── honorType.js           # 荣誉分类 / 归一化 / 类型中文名（配色见 styles/honors.css）
    │   ├── honorCoverage.js       # 剔掉「已被胶囊覆盖」的手写荣誉（显示与计分共用一份口径）
    │   ├── honorView.js           # 荣誉显示偏好：count / icons / detail（存 localStorage）
    │   ├── contestTaxonomy.js     # 赛事分类与奖牌枚举（页面与生成器共用一份口径）
    │   └── eventsSource.js        # ★ 大事记数据源读写封装（events/ 目录唯一入口：卡片/置顶/索引/文章）
    └── views/
        ├── HomeView.vue           # 首页 /
        ├── AllActionView.vue      # 大事记列表 /all-action
        ├── PostView.vue           # 大事记文章 /post/:id（新闻 / 战报 / 赛事卡片文章共用）
        ├── ContestView.vue        # 竞赛信息 /contest
        ├── CompetitionDetailView.vue  # 竞赛详情 /competition/:slug
        ├── CompetitionEventView.vue   # 单届详情 /competition/:slug/:year
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

> ⚠️ `preview` 的地址必须用 **http://localhost:4173** —— 别用 `127.0.0.1`。
> Vite 只监听了 IPv6 的 `::1`，用 `127.0.0.1` 会得到「连接被拒绝」。

`dev` 与 `build` 都会先自动跑**两个生成器**（`predev` / `prebuild` 钩子，实际执行的就是下面这两条）：

```bash
node scripts/gen_group_wall.mjs     # ★ 协会成员墙：group_wall.*.json + excellent_members.json
node scripts/gen_event_badges.mjs   # 大事记时间轴的奖牌徽章 event_badges.json
```

> 上游那套 `gen_hero_wall.mjs` **已从 predev / prebuild 里摘掉**（2026-09-23）：它的产物
> `hero_wall.manifest.json` 在 `src/` 下已无消费者 —— 首页那面墙读的是 `group_wall.*` ——
> 而它每次都重写两个上游跟踪的文件，净产生时间戳噪声。需要它时手动 `npm run data:hero-wall`。
> `hero_wall.json`（作者的留言）仍是**真源**：我们的生成器只读它，按姓名并入墙上。

> 也就是说**改完数据不用手动跑任何命令**，`npm run dev` 会自己重新生成。
> 唯一的例外是**缩略图**（它按 mtime 增量跳过，且只能在本地 Windows 上跑），得单独跑：

```bash
npm run data:group-wall     # 只重新生成成员墙数据（dev/build 会自动跑，一般不用手动）
npm run data:group-thumbs   # ★ 生成成员墙缩略图 ← 加人 / 换头像后必须跑，不会自动
npm run data:event-badges   # 只重新生成奖牌徽章（dev/build 会自动跑）
npm run data:hero-wall      # 上游那套清单（已不在 dev/build 里；首页墙不消费它）
npm run data:hero-thumbs    # 上游那套缩略图（无消费者，一般不用跑）
npm run data:check          # 数据校验（格式 + 交叉引用）
npm test                    # 计分口径回归集（node --test，零依赖、不构建、不联网）
npm run verify              # = data:check + test ← 改动代码或数据后跑这个
```

## 📦 部署

**双击 `deploy.bat` 即可**（Windows 一键脚本，SSH 密钥免密登录，全程无需输入密码）。

脚本按顺序做五件事，任何一步失败都会停下并打印原因：

| 步骤 | 做什么 |
|---|---|
| 1 | 本地检查：部署密钥、`src/main.js`、`package.json`、`tar` 是否就位 |
| 2 | **先检查工作区**（见下），再把 `src` `public` `package.json` `package-lock.json` `vite.config.js` `index.html`、`scripts/` 下的**两个生成器**（`gen_group_wall.mjs` `gen_event_badges.mjs`）以及它们共用的 `scripts/lib/` 打成 tar.gz |
| 3 | 上传到服务器 `/tmp`，解包到 `/var/www/jxufe_acm_vue`（会先删掉远端的旧 `src` 与 `public`；Nginx 根目录是 `dist/`，所以这一步不会影响线上） |
| 4 | 服务器上 `npm install` + **构建到 `dist.new`**（`npm run build -- --outDir dist.new`，`prebuild` 钩子会重新生成头像墙数据与奖牌徽章）；确认 `dist.new/index.html` 真的存在后，才把它换出成 `dist`，上一版留作 `dist.old` |
| 5 | `nginx -t` → `systemctl reload nginx` → curl 验证站点返回 `HTTP 200` |

最后打印 `Deploy success!` 与 `https://jxufe-acm.cn`。

| | |
|---|---|
| 服务器 | `root@47.99.92.213` |
| 站点目录 | `/var/www/jxufe_acm_vue`（Nginx 根目录是其中的 `dist/`） |
| 登录方式 | SSH 密钥 `.deploy/id_ed25519`（**不要删、不要外传**，已在 `.gitignore` 里） |

> **每次都是全量上传 `src` 与 `public`**（约 36 MB），不做增量比对 —— 用一轮 tar 换掉逐文件
> 判断，出问题的可能性更低。第一次部署与第十次耗时相同。
>
> **第 2 步会拒绝「工作区不干净」**（2026-09-24 加）：tar 打的是**本地工作树**，不是 git 里的内容，
> 于是上面那些路径里**任何未提交的改动都会静默上线** —— 而且在作者本机永远看不出来，只有别人克隆仓库、
> 或 CI 构建时才会表现成「站点和别人不一样」。现在这些路径只要与 HEAD 不一致就停下并逐条列出文件；
> 真有紧急热修要走，先 `set DEPLOY_ALLOW_DIRTY=1` 再跑（会打印 `[WARN]` 说明这次是明知故犯）。
> 不带 `.git` 的副本会明确警告「门禁是关的」，不会假装检查过。
>
> **构建失败不再影响线上**：构建产物先落在 `dist.new`，`dist` 全程不动，所以第 4 步失败时线上仍是
> 上一次成功的版本（脚本会这样告诉你）。换出失败时 `dist.old` 就是上一版，手工回滚：
> `ssh root@47.99.92.213 "cd /var/www/jxufe_acm_vue && rm -rf dist && mv dist.old dist"`。

> **`scripts/` 里只有这两个生成器需要上传**，缺一个服务器构建就直接失败：`prebuild` 会依次执行
> 它们，脚本不在 → `node` 报「找不到文件」→ `npm run build` 以非零退出，整次部署停在第 4 步。
> 其余脚本（`check_awards.mjs`、`gen_events_articles.mjs`、`gen_hero_wall.mjs`、两个 `.ps1` 缩略图生成器、
> 以及各种 `*.cjs` 一次性工具）都不参与服务器构建，**不要**加进 `UPLOAD_ITEMS` ——
> 那是人工维护的清单，多传一份就多一份要跟着改的东西。

> ⚠️ **成员墙的缩略图必须在本地先生成**（`npm run data:group-thumbs`）——
> 那个脚本是 Windows PowerShell + GDI+，服务器是 Linux 跑不了。忘了跑不会坏版
> （组件会回退加载原图，单张最大 1.79 MB），只是又慢又费流量。
> 而 `group_wall.*.json` 这些**数据**相反：服务器构建时会自动重新生成，
> 而且它们本来就在 `.gitignore` 里 —— 部署靠的是 tar 打包本地工作树，不是 git。

详见 `deploy.bat` 内注释，以及 [`knowledge.md` 第 7 节](./knowledge.md)
（⚠️ 那一节表格里的 tar 清单写的是旧版，只有 `gen_hero_wall.mjs` 一个 —— **以 `deploy.bat` 为准**）。

---

## 📝 内容维护指南

> 📖 **只想加内容、不想读代码？直接看 [`knowledge.md`](./knowledge.md)。**
> 那份文档按「我要做什么」组织（开头就是速查表），逐字段说明大事记 / 获奖记录 /
> 优秀成员 / 协会负责人怎么改，以及更新部署的全流程。
> 下面这一节讲的是**数据格式与设计取舍**，偏实现。

> ⚠️ **一处例外**：`knowledge.md` 第 6 节（头像墙）与速查表里的「首页头像墙加/换图」讲的是**上游作者那套
> `hero_wall.*` 流水线** —— 那面墙已被协会成员墙取代，往 `public/images/excellent_member/` 丢图
> **不会再让任何人上首页墙**（`hero_wall.manifest.json` 与 `hero_wall_thumbs/` 现在都没有消费者，
> 只剩 `hero_wall.json` 的留言被按姓名并入）。改这面墙请看本 README 的
> **《六、维护群成员头像墙》**（在「内容维护指南」一节末尾）。

所有可变内容存放在 `public/data/` 目录下的 JSON 文件中。**修改后刷新页面即可生效，无需重启，无需重新构建。**

> **注意：** 如果你提交了 Pull Request 并被合并，但网站迟迟没有更新，请联系 **QQ：3200513041** 手动触发部署。

---

### 一、如何添加 / 修改 News（大事记）

大事记的数据**全部在 `public/data/events/` 一个目录里，一年一个文件**：

| 文件 | 装什么 |
|---|---|
| `events/top.json` | 置顶卡片（扁平数组；置顶的不要同时留在年份文件里） |
| `events/<年>.json` | 该年**全部**数据：`cards`（时间轴卡片）+ `articles`（该年所有文章正文，key = id） |

```
events/2026.json
├── cards     [ { kind, date, category, title, tagline, link }, … ]   19 张时间轴卡片
└── articles  { "<id>": { title, date, subtitle?, blocks }, … }        16 篇文章正文
```

> **为什么卡片和正文不分成两个文件**：HTTP 只能整文件下载。放在同一个文件里，从时间轴点开文章时正文已经在内存里（**0 额外请求**）；代价是只看时间轴的访客也要把该年正文一起下载（首屏约 123 KB，压成单行约 69 KB）。这个取舍是按「一年一个文件」的要求做的。

#### 添加一条新 News

**两步，都在同一个文件 `public/data/events/<年>.json` 里：**

**① 在 `articles` 里写正文**（key = 文章 id）：

```json
"articles": {
  "2026-6-27-new-contest": {
    "title": "我校在XX竞赛中取得佳绩",
    "date": "2026-06-27",
    "subtitle": "副标题（可省略，仅详情页显示）",
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
}
```

**② 在同一个文件的 `cards` 里加一张时间轴卡片**（字段顺序保持 `kind, date, category, title, tagline, link`）：

```json
{
  "kind": "news",
  "date": "2026-06-27",
  "category": "club",
  "title": "我校在XX竞赛中取得佳绩",
  "tagline": "简短的摘要描述",
  "link": "2026-6-27-new-contest"
}
```

`link` 就是 ① 里的 id（**纯 id，不带任何路由前缀**）—— 值必须与 `articles` 的 key 完全一致。

> 全部 114 张卡片的 `link` 无一例外都是 `articles` 里的 key。赛事卡片（天梯赛 / 蓝桥杯 / 百度之星）的文章由 `scripts/gen_events_articles.mjs` 从 `scripts/source/` 生成，见下文「大事记与竞赛数据的关系」。

- 要**置顶**：卡片放到 `public/data/events/top.json`（数组最前面 = 最先显示），**正文照旧写在年份文件的 `articles` 里**。切勿两处都放卡片，否则时间轴会出现两次（校验会报「新闻在时间轴里重复出现」）
- 卡片的 `title` / `date` 必须与 `articles` 里那条一致，校验脚本会强制检查
- 只想给个直达链接、**不上时间轴**：就只写 `articles`，不写 `cards`（校验会把它记为「无卡片入口的文章」，这是允许的）
- 加完跑 `npm run data:check` 校验。**没有索引文件需要维护**：目录里有哪些年份由前端自动探测，月份与分类计数随年份文件加载实时算出

#### 多作者文章：一条大事记放多位分享人（`authors` 形态）

一篇正文有两种形态，**二选一**（校验脚本按字段名与顺序强制区分）：

| 形态 | 字段 | 用在 |
|---|---|---|
| `blocks` | `{ title, date, subtitle?, blocks }` | 普通文章（绝大多数） |
| `authors` | `{ title, date, subtitle?, authors: [{ name, group?, meta?, final?, blocks }, …] }` | 一条大事记里放多位分享人 |

`authors` 是给「保研经验分享」这类**同一条大事记、多个作者各写一篇长文**的场景用的：时间轴上仍只有一张卡片，文章页用切换器选人看（`src/components/action/AuthorSwitcher.vue`，分段控件复用 `.view-toggle`）。每位分享人的字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | ✅ | 展示名（切换器 tag 上的字）。两位及以上、且不能重名 |
| `group` | —— | 队伍/归属。**当前不上屏**（tag 上只留名字、年级、去向），存在数据里备用 |
| `grade` | —— | 年级（`2023级`）。显示在 tag 上名字右侧 |
| `meta` | —— | 一句话身份（专业 · rank）。**当前不上屏**，同上 |
| `final` | —— | 最终去向，显示在 tag 上年级右侧（`名字 · 年级 · 去向`），没有就不显示这一段 |
| `blocks` | ✅ | 这位分享人的正文，块类型与普通文章完全一样 |

- 切换器**只在 ≥2 位时渲染**（1 位就该用 `blocks` 形态，校验会报错）
- 选中状态同步到 URL：`/post/<id>?a=1` 直接落在第 2 位分享人，刷新与分享都保持同一个人
- `group` / `grade` / `meta` / `final` 会被直接渲染成文本（`group`/`meta` 目前只进 hover 提示），**不能含 `|` 或换行**（校验会拦，防生成器抠错行）

> 现有那篇（`2026-10-2-postgraduate-share`）由 `npm run data:share` 从**仓外**的 Markdown 原文
> 生成：转换逻辑与两个开关都在 `scripts/gen_postgraduate_share.mjs` ——
> `SHARE` 登记表（每人一行：`name` / `group` / `grade`，原文不在默认目录时加 `file`，
> 原文抠不出干净去向时加 `final`）与 `PINNED`（是否置顶）。
> **加人 = 丢一个 md + 在 `SHARE` 里加一行 + 重跑**。该脚本依赖仓外的原文，所以**没有**挂进
> `predev` / `prebuild`（服务器上没有那些 md）。
>
> **置顶由 `PINNED` 管**：`true` → 卡片写进 `top.json`，年份文件里的同名卡片由脚本摘掉；
> 改回 `false` 再跑一次就回到时间轴。**两个文件都放会重复出现**（校验会报）。
>
> **生成边界**（重跑不会盖掉手写的文案）：`final`、文章 `subtitle`、卡片 `tagline` 都是
> 「文件里已有就保留」，只有文件里没有（或传 `--reset-text`）才用推导值 / 兜底值。
> 想让文案回到兜底值：`node scripts/gen_postgraduate_share.mjs --reset-text`。
> 卡片 `title` 与文章 `title` 必须一致（校验会拦），生成器以文章标题为准同步卡片标题。
>
> 内联标记的口径：正文只认 `**加粗**`、`[文字](链接)`、`~~删除线~~`（`src/utils/inline.js`）。
> 原文里用富文本编辑器排出来的`` `行内代码` ``站内渲染不出来，转换时会**把反引号去掉、只留文字**
> （`stripCode()`，段落 / 标题 / 列表 / 表格 / 引用全走一遍）—— 别在数据里手写反引号，它会原样上屏。


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
3. 刷新页面即可看到新成员（页面读的是生成物 `excellent_members.json` = `members.json` **原样** + 自动入册的人，
   所以手写的条目一定在；那份文件由 `predev` / `prebuild` 自动重新生成，不用手动跑）

**photo 字段**支持两种写法：
- 本地图片：`"/images/excellent_member/xxx.png"`
- 外部 URL：`"https://example.com/avatar.jpg"`

> **哪些荣誉不该手写在这里**：五个竞赛系列（ICPC / CCPC / 天梯赛 / 百度之星 / 蓝桥杯）
> 由 `honorPills.js` 自动汇总，**别手写**；协会职务由 `duties.json` 提供，**也别手写**；
> 国家奖学金 / 国家励志奖学金来自生成物 `scholarships.json`，**同样别手写** —— 这三类
> 手写都会与自动来源重复显示。详见第七节。

#### 荣誉怎么显示：计数 / 图标 / 明细（三种方式）

同一个人的荣誉在**优秀成员页**与**协会负责人页**有三种看法，偏好两页共用、切一次两页一起变：

| 取值 | 长什么样 | 用途 |
|---|---|---|
| `count`（**默认**） | `🥇1🥈2🥉2` | 只关心「拿了几块什么牌」 |
| `icons` | `🥇🥈🥈🥉🥉` | 想一眼看出长短 |
| `detail` | `第45届ICPC亚洲区域赛 南京站 铜牌` | 想看赛事全名与具体奖牌 |

- 实现：`src/utils/honorView.js`（`HONOR_VIEWS` 三档 + 共享的 `honorView` 引用）与
  `src/components/HonorViewSwitch.vue`（只有模板，样式复用既有的 `.view-toggle` / `.view-btn`）。
- 偏好存在 **localStorage 键 `jxufe:honor-view`**：刷新不丢；读不到或值不认识
  （隐私模式 / 老浏览器）一律**退回 `count`** —— 那是默认口径，不会把页面显示搞空。
- `detail` 的文案与首页成员墙**点开的浮窗**同源（都走 `recordsToDetails()`），
  所以两处的赛事全名说法永远一致；墙上的悬停预览卡仍是 `count` 口径（卡片窄，塞不下长句）。

> 这里改的只是**怎么显示**，不改数据。荣誉胶囊的**数据**不用手写：ICPC / CCPC / 天梯赛 /
> 百度之星 / 蓝桥杯 由 `src/utils/honorPills.js` 从 `awards/*.json` 自动汇总；
> 手写只留给胶囊表达不了的名次类条目（**季军 / 首刀**）与没有数据源的赛事
> （睿抗 / 传智杯 / 数学建模 / CSP）—— 判据写在 `src/utils/honorCoverage.js` 的文件头，
> 改动前先读那里，否则同一块奖牌会在卡片上出现两遍、在排名里被算两遍。
> 「全省第一 / 全省第二」原先也在这份手写清单里，2026-09-24 已删除：胶囊自带的省赛名次段
> （明细版 `🏆第10届天梯赛江西省个人冠军`、`🏆第16届蓝桥杯 C++·B组省赛亚军`）已经表达了它们。
> **优秀奖是特例：显示可以，计分一律 0** ——「不计优秀奖」是胶囊聚合的既有口径，手写条目里写了
> 也照此归零（`honorRanking.js` 的 `NON_SCORING_TIERS`）；**别让它退成 `ATTEND_POINTS` 的
> 「参赛经历」0.6 分** —— 那等于把优秀奖当参赛。

#### 不愿公开真名：用 `displayName`，**不要**改 `name`

一条记录可以多写一个可选的 `displayName`：

```json
{
  "name": "张三",
  "displayName": "匿名学长",
  "class": "23软件工程2班",
  "photo": "/images/excellent_member/zhangsan.png",
  "honors": ["保研至XX大学"]
}
```

规则只有一句：**真名写在主键字段里，只有渲染层用 `displayName`。**

- 所有**匹配**都按真名走：自动汇总的战绩胶囊（按 `name`）、卡片排序的分数（按 `name`）、
  首页成员墙的荣誉关联（按 `realName`）。
- 只有**显示**用 `displayName || name`：两个页面各有一个取显示名的函数
  （`shownName(x) = x.displayName || x.name`，卡片标题与图片 `alt` 都走它），以及墙面每一格的文本。
- 群成员走另一条路：真名与显示名都填在工作区那份 **`07_技术项目/qq-group-avatars/群成员真名对照表.csv`**
  的「真实姓名 / 显示名」两列，`build_site_assets.py` 会把它们带进 `group_members.json`
  的 `realName` / `displayName`。
- ⚠️ **别用旧办法**（把 `name` 直接改成匿称、再靠手写荣誉兜底）：那样自动汇总永远匹配不到这个人，
  他的奖项会凭空少一大半。
- 匿名只覆盖**成员卡片与头像墙**。公开 JSON 里仍然是真名，竞赛信息 / 大事记 / 获奖名单页面里的
  **队伍名单也仍然是实名**（这一条是有意留着的，改它得单独处理）。

---

### 三、如何添加 / 修改 Leaders（协会负责人）

**文件：** `public/data/leaders.json`

```json
{
  "session": "2027学年会长",
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

竞赛相关数据分三层，各司其职：

| 文件 | 职责 | 是否含获奖数据 |
|---|---|---|
| `public/data/awards/*.json` | **获奖数据唯一真源** | ✅ 是 |
| `public/data/competitions.json` | 展示元信息（名称 / logo / 简介 / 详情卡 / 渲染模式 / 年份→届数） | ❌ 否 |
| `public/data/events/` | 大事记时间轴节点（该年的新闻 + 比赛卡片） | ❌ 否 |

---

#### 4.1 获奖数据 `public/data/awards/*.json`

**这是获奖数据的唯一来源。** 竞赛详情页与单届详情页的获奖名单、参赛历史、分组名单全部由它渲染，字段使用统一 schema（不再有 `history` / `editions` 两套并存的数据）。

| 文件 | 赛事 | 记录粒度 |
|---|---|---|
| `icpc.json` | ICPC | 一支队伍在一个场次中的成绩 |
| `ccpc.json` | CCPC | 同上 |
| `gplt-team.json` | 天梯赛（仅国赛） | 一支队伍 |
| `gplt-individual.json` | 天梯赛（仅国赛） | 一个人 |
| `lanqiao.json` | 蓝桥杯 | 一个人次 |
| `baidu.json` | 百度之星 | 一个人次 |
| `chuanzhi.json` | 传智杯 | 一个人次（当前为空数组） |

**团队赛（ICPC / CCPC）**——数组，按 `date` 升序：

```json
{
  "competition_name": "ICPC全国邀请赛（南昌）暨江西省赛",
  "medal_level": "invitational",
  "team_name": "天空之矛",
  "medal_type": "bronze",
  "rank": 89,
  "rank_official": 86,
  "members": ["张瑞杰", "曹京顺", "李鑫"],
  "coach_names": [],
  "date": "2026-05-24"
}
```

**天梯赛团队奖（gplt-team）**——无 `medal_level`（数据源只收录国赛）：

```json
{ "session": 11, "team_name": "JXUFE_C1", "medal_type": "gold", "members": ["…"], "coach_names": ["李季"], "date": "2025-04-19" }
```

**单人赛（gplt-individual / lanqiao / baidu / chuanzhi）**——`members` 固定一个元素；蓝桥杯额外含 `language` / `group`：

```json
{
  "session": 17,
  "members": ["万俊哲"],
  "language": "C++",
  "group": "B",
  "medal_level": "provincial",
  "medal_type": "gold",
  "rank": 12,
  "coach_names": [],
  "date": "2026-04-12"
}
```

字段取值：

| 字段 | 取值 |
|---|---|
| `session` | 届数（int），如 `11` = 第十一届 |
| `medal_level` | `regional` / `invitational` / `provincial` / `final`（团队赛）；`provincial` / `national`（单人赛） |
| `medal_type` | `gold` / `silver` / `bronze`（分别渲染为 金/银/铜奖 或 一/二/三等奖）；蓝桥杯另有 `grand`（特等奖，全站仅 2014 年国赛 陈天楚 一条） |
| `language` | `C++` / `Java` / `Python` / `null`（仅蓝桥杯） |
| `group` | `A` / `B` / `研究生组` / `null`（仅蓝桥杯） |
| `date` | `YYYY-MM-DD`；**未知填 `null`**（数组内 `null` 排末尾） |
| `rank` | 名次（int ≥ 1，**可选**）。语义随赛事不同：xCPC 是**队伍名次**、蓝桥杯 / 百度之星是**选手在本组别内的名次**、天梯赛是**全体获奖者中的推算名次** |
| `rank_official` | 仅 xCPC：**正式队排名**（源里 `rankOfficial`）。与 `rank`（全体队伍总排名）并存，悬停名次胶囊时两个都显示 |
| `rank_provincial` | 仅 xCPC：「暨江西省赛」场的**省赛组内名次**，只写在 `medal_level` 为 `provincial` 的那条上（同队当天有邀请赛 + 省赛两条记录，全场总排名两条都成立，组内名次只对省赛有意义） |
| `rank_to` | **并列区间上界**（仅天梯赛推算）：官方不公布名次，`rank` = 同分并列块起点、`rank_to` = 块尾；`rank_to === rank` 时省略该字段 |
| `rank_source` | `official`（榜单直接公布的）/ `derived`（按「更高奖项名额之和 + 档内位置」推算的）/ `backfill`（来自补录层：源里 `rank` 是字符串、`medals[].tier` 为 `null`，源自标「待核实」—— xCPC 的西安 2023 / 2024 / 2025 共 3 条，可信度低于其余 74 条）。**默认值 `official` 不写**，只在非默认时出现 |

> 名次是**可选**字段：不是每条获奖记录都有名次（蓝桥杯旧源里第 1 届等 74 条本就没有，
> 天梯赛 2020 年前的个人奖名单也不存在）。**缺就不显示，不猜、不补 0。**
> 规范位置一律紧跟 `medal_type`（`npm run data:check` 会按此校验字段顺序）。

> **冠亚季军**：`rank` 为 1 / 2 / 3 时页面不显示 `#1` 而显示 **冠军 / 亚军 / 季军**
> （判据是 `src/utils/contestTaxonomy.js` 的 `isTrophyRank()`，全站唯一、别处不要另写
> `rank <= 3`）；大事记卡片右上角的角标把冠亚季军与特等奖**一并计进 🏆**（见
> `scripts/gen_event_badges.mjs`）。天梯赛的并列区间显示为 `797+`（意为「第 797 名起」），
> 悬停可看到完整区间与并列人数。

> 新增/修改获奖记录：直接编辑对应文件即可（保持数组按 `date` 升序、`null` 末尾）。
> 改完执行 `npm run data:check` 校验格式。

#### 4.2 赛事元信息 `public/data/competitions.json`

只放展示所需字段，**不含任何获奖记录**：

```json
{
  "slug": "gplt",
  "name": "团体程序设计天梯赛",
  "shortName": "团体程序设计天梯赛",
  "image": "/images/contest/gplt.png",
  "desc": "简短描述",
  "subtitle": "副标题",
  "intro": ["段落1", "段落2"],
  "details": [
    { "icon": "fa-solid fa-clock", "title": "比赛时间", "lines": ["每年 4 月"] }
  ],
  "mode": "gplt",
  "awards": ["gplt-team", "gplt-individual"]
}
```

- `shortName`：届次标题用的简称（如「第十七届**蓝桥杯**（2026年）」）
- `mode`：决定竞赛详情页用哪种渲染，`xcpc`（团队赛表格）/ `gplt`（天梯赛六列表）/ `roster`（分组名单）/ `none`（无数据）
- `awards`：该赛事对应的 `awards/*.json` 文件名列表；视图只用这个列表去加载获奖数据，**新增赛事时改这里即可，无需改代码**
- `sessions`：`{ "年份": 届数 }` 对照表，供单届详情页把 URL 里的自然年换算成 awards 的 `session`（如 `{"2026": 11}`）。ICPC/CCPC 标题不含届数，故为空对象
- 页面标题里的 xCPC 合并页（`/competition/xcpc`）由代码在运行时合并 `icpc` + `ccpc` 得到

#### 4.3 大事记时间轴 `public/data/events/`

**一年一个文件**，该年的卡片与全部文章正文都在里面：

```
events/
├── top.json      置顶卡片（扁平数组）
├── 2026.json     { cards: [...19 张卡片], articles: {...16 篇文章} }
├── 2025.json     { cards: [...24], articles: {...25} }
└── …             共 17 个年份文件
```

**`cards`** —— 该年的时间轴卡片，按 `date` 倒序、`null` 排最后。`year` 由文件名给出，卡片内不重复存：

```json
{
  "kind": "event",
  "date": "2026-04-18",
  "category": "tts",
  "title": "第十一届团体程序设计天梯赛",
  "tagline": "时隔八年，再夺团队国一",
  "link": "2026-4-18-gplt"
}
```

| 字段 | 说明 |
|---|---|
| `kind` | `news`（新闻）或 `event`（比赛） |
| `date` | `YYYY-MM-DD` / `YYYY-MM` / `YYYY`，**未知填 `null`**（此时按所在年份文件归年） |
| `category` | 决定卡片左边框配色与筛选 chips，取值见下 |
| `title` | 卡片标题 |
| `tagline` | 卡片正文 |
| `link` | **纯 id**，恒等于本文件 `articles` 里的一个 key（不允许出现 `/`）。路由侧固定拼成 `/post/<id>` |

**`articles`** —— 该年所有文章的正文，key 是文章 id，内容 `{ title, date, subtitle?, blocks }`。

id 统一为 `<年>-<月>-<日>-<名字>` 风格（月/日不补零，与 `date` 字段的补零写法不同），例如：

| 类型 | id 示例 |
|---|---|
| 协会新闻 | `2026-8-24-xcpc-select` |
| 比赛战报 | `2026-7-29-icpc-invitational-shenyang` |
| 省赛战报 | `2024-5-12-gxcpc9th` |
| 赛事卡片文章（生成） | `2026-4-18-gplt`、`2026-4-12-lanqiao-provincial`、`2026-9-3-baidu-preliminary-1` |

> **新闻的卡片标题与文章标题必须一致**；**战报/赛事的卡片是短标签（「ICPC全国邀请赛（沈阳）」）、文章是官方全称（「2026 年 ICPC 国际大学生程序设计竞赛全国邀请赛（沈阳）」），故意不同**，校验脚本对此不作要求。
> **没有卡片入口的文章**（参赛但未获奖的场次、网络预选赛共 44 篇）也在 `articles` 里，手输 `/post/<id>` 能打开，但不上时间轴。

### 没有索引文件：年份是自动探出来的

`public/data/events/` 里**只有一个 `top.json` + 若干个 `<年>.json`**，没有 index 之类的清单文件。
静态站没法列目录，所以前端启动时自己探一遍（`src/utils/eventsSource.js` 的 `discoverYears()`）：

1. 从「今年 + 1」向上探 1 年（新一年的文件可能已准备好）
2. 从今年开始向下，**每批 24 年并行发 `HEAD` 请求**（无响应体，一次往返）
3. 某一批的末尾连续两年都不存在 → 认为到底了，停止
4. 结果缓存在模块作用域，一次会话只探一次

> ⚠️ 探测会同时检查 `content-type`。很多托管（含 `vite preview`）对不存在的路径也返回
> `200 + index.html`（SPA 兜底），只看状态码会把所有年份都误判为存在。

实测：17 个年份文件 → 25 个 HEAD 请求（一批并发，约一次往返）。

**新增一年的数据，不需要改任何配置**：放上 `2027.json`，刷新页面侧栏就有 2027。

其余东西全部由读到的文件实时算出，也不存在需要重建的派生文件：

| 界面上的 | 怎么来的 |
|---|---|
| 侧栏年份列表 | `discoverYears()` 的探测结果 |
| 侧栏月份 | 该年文件加载完成后，从卡片日期算出（未加载则该年不展开月份） |
| 分类 chips 计数 | 已加载年份的卡片 + `top.json` 实时统计（点「全部」后即全量） |
| 打开某篇文章 | id 前 4 位就是年份（如 `2026-4-18-gplt` → `2026.json`），不需要 id→年份 映射表 |
| 首页「最新动态」5 条 | 从最新年份往下读，凑够 5 条新闻就停（最多读 3 个年份文件） |


### 大事记与竞赛数据的关系

两者是**完全独立的两套数据**，刻意允许重复：

| | 大事记 | 竞赛信息 / 获奖列表 |
|---|---|---|
| 数据 | `public/data/events/`（自给自足） | `public/data/competitions.json` + `awards/*.json` |
| 入口 | `/all-action` → `/post/<id>` | `/contest` → `/competition/<slug>` |
| 获奖内容 | 写死在文章 `blocks` 里（团队奖全列 + 省赛/国赛个人奖统计表） | 由结构化获奖记录实时渲染 |
| 维护 | 编辑文章 JSON（赛事文章可由脚本重新生成） | 维护 `awards/*.json` |

改一边不会影响另一边。大事记文章末尾的 `related` block 只是**一个链接**，指向 `/competition/<slug>` 竞赛介绍页，不产生数据依赖。

**赛事卡片文章重新生成**（源数据在 `scripts/source/`，改完重跑即可）：

```bash
node scripts/gen_events_articles.mjs   # 幂等：重复运行结果一致
```

它会为每张 `赛事卡片` 生成：摘要（赛事规模）→ 国赛/省赛 `heading` → 高校奖/团队奖 `awards` block → 个人奖 `table`（组别 / 奖项 / 人数 / 名单）→ `related` 链接。

`category` 取值（侧栏分类 chips 与卡片配色共用）：

| 值 | 含义 | | 值 | 含义 |
|---|---|---|---|---|
| `inv` | 邀请赛 | | `lanqiao` | 蓝桥杯 |
| `reg` | 区域赛·全国赛 | | `chuanzhi` | 传智杯 |
| `prov` | 省赛·区赛 | | `baidu` | 百度之星 |
| `net` | 网络赛 | | `school` | 校赛 |
| `tts` | 天梯赛 | | `club` | 社团活动 / `other` 其他 |

**加载策略**（`useTimeline.js` / `useNews.js` / `eventsSource.js`）：

| 时机 | 请求 |
|---|---|
| 首页 LATEST NEWS | `top.json` + 最新的 1~3 个年份文件（凑够 5 条新闻就停） |
| 大事记首屏 | `top.json` + **最新的两个年份**（年份清单由启动时的探测得到） |
| 点击侧栏某年 | 该年文件（首次，之后走内存缓存） |
| 打开一篇文章 | id 前 4 位就是年份 → 该年文件；**若从时间轴点进去则该年已在内存，0 请求** |

> 已加载的年份文件会被缓存（`eventsSource.js`），所以同一页面内点开文章不会再发请求。

#### 4.4 单届页如何取数

`/competition/<slug>/<year>` 的数据全部来自 `competitions.json` + `awards/*.json`（两次请求，无 events 文件）：

1. 读 `comp.sessions[year]` 得到该届的 `session`（届数）
2. 加载该赛事 `awards` 列出的文件
3. 按 `session` 过滤，再按 `medal_level` 分成「国赛 / 省赛」两段
4. 段内按有无 `team_name` 区分团队奖（卡片）与个人奖（蓝桥杯走分组名单，其余走表格）

> **参赛历史表**：`mode` 决定渲染形态——
> - `xcpc`：按场次分组的「日期 / 赛事 / 队名 / 成绩 / 参赛成员」表格（数据来自 `awards/icpc|ccpc.json`，**只含获奖记录**）
> - `gplt`：「日期 / 届数 / 队名 / 国赛 / 省赛 / 参赛成员」六列表格，成员姓名按 `gplt-individual.json` 的个人奖以金/银/铜牌色标注
> - `roster`：按届 → 国赛/省赛 → 分组 → 奖等 → 姓名的分组名单（蓝桥杯按语言×组别分组）
>
> 表格与卡片视图可切换（桌面默认表格、移动端默认卡片，选择记入 localStorage）。

- 新增赛事时需要：① `competitions.json` 加条目（含 `shortName` / `mode` / `awards` / `sessions`）；② 按需新增 `awards/<file>.json`；③ 若该赛事要上大事记时间轴，再往 `events/<年>.json` 加卡片 + 一篇自己的文章（两者互不影响）

### 五、维护页面导航

**文件：** `src/data/navigation.js`

修改导航文字、顺序、页脚链接。也是 JSON 结构，修改后刷新即可。

---

### 六、维护群成员头像墙

组件：`src/components/HeroAvatarWall.vue`（**上游那份组件，我们一行没改**，只是换了喂进去的数据）｜
数据：`public/data/group_wall.json` + `group_wall.manifest.json`（**生成物，别手改**）｜
缩略图：`public/images/group_wall_thumbs/{384,256}/`（**必须本地生成**，见下）

> ⚠️ **先记住这一句：首页那面墙读的是 `group_wall.*`，不是 `hero_wall.*`。**
> `hero_wall.manifest.json` 与 `public/images/hero_wall_thumbs/` 是上游作者那套 33 人墙的产物，
> 现在**已经没有任何消费者**（`gen_hero_wall.mjs` 也已在 2026-09-23 从 `predev`/`prebuild` 摘掉，
> 因而不会再被重写；`npm run data:hero-wall` 可手动跑）。
> 唯一还在用的是 `public/data/hero_wall.json` 里的**留言文案** —— 生成器按姓名并进我们的墙（见下文）。
> 也就是说：**往 `public/images/excellent_member/` 丢一张图，不会再让任何人出现在首页墙上。**

首页 hero 铺的是这面「协会成员墙」：里面有群成员、优秀成员、协会负责人，
以及规则名单补进来的人，**全部由站点已有数据推导**（没有任何人名字是手写进去的）。

#### 数据链：谁派生谁

| 环节 | 谁产出 | 说明 |
|---|---|---|
| 群成员 | `07_技术项目/qq-group-avatars/build_site_assets.py` → `public/data/group_members.json` | **仓外依赖**：读 `群成员名单.csv` + 头像归档 `avatars.json` / `avatars/` / `已标注/`，产出 `group_members.json`（当前 138 人：QQ / 群昵称 / 身份 / 真名 / 头像 / 班级）与 `public/images/group_members/{full,thumbs}/` |
| 协会职务 | `07_技术项目/qq-group-avatars/build_duties.py` → `public/data/duties.json` | **仓外依赖**：由工作区根目录三份《协会干事名单》派生（当前 24 人），在墙上显示为绿色胶囊 |
| 站点名单（手写） | `public/data/members.json`、`leaders.json` | 优秀成员的 `honors`、负责人的 `achievements`。两份字段名不一样是站点既有数据的现状，**别去统一** |
| 奖学金（生成） | `07_技术项目/奖学金数据/build_scholarships.py` → `public/data/scholarships.json` | **仓外依赖**：从信息库那份**全校**名单（4379 条 / 九个学年）匹配到协会成员，当前 14 人 / 21 条。国奖、国励**不要再手写进上面两份名单**，见第七节 |
| 战绩（手写） | `public/data/awards/*.json` | 墙上蓝色「比赛战绩胶囊」由 `src/utils/honorPills.js` 自动汇总，**不要手写进名单** |
| 入墙规则（手写） | `public/data/wall_rules.json` | 会长维护：`people[]` 无条件入墙 + 两条分数阈值，详见下文 |
| 留言（手写，只读） | `public/data/hero_wall.json` | 上游那份 37 条文案，**只有 `message` 被并进来** |
| ↓ 生成 | `npm run data:group-wall`（= `scripts/gen_group_wall.mjs`；`predev` / `prebuild` 也会自动跑） | |
| 产物 A | `public/data/group_wall.manifest.json` | 墙上铺哪些图：`{ source: '/images/group_members/full/', count, images[] }` |
| 产物 B | `public/data/group_wall.json` | 每格的文案：`tiles[缩略图文件名] = { name, line, full, tags, sheetTags, message? }`（`sheetTags` 的战绩条目另带 `family`，见下文） |
| 产物 C | `public/data/excellent_members.json` | **优秀成员页实际读的名单** = `members.json` 原样 + 自动入册的人，见「两条分数阈值」 |
| ↓ 缩略图 | `npm run data:group-thumbs`（= `scripts/gen_group_wall_thumbs.ps1`，**本地 Windows 专用**） | 按 `tiles[].full` 出 `public/images/group_wall_thumbs/{384,256}/<基名>.jpg`，**按 mtime 增量跳过**（输出比源新就不重做；`-Force` 强制重建） |
| ↓ 渲染 | `src/views/HomeView.vue` 里的 `<HeroAvatarWall>` | 除 `v-model:active` / `:hover-card="wallOn"` 外只传了 3 个数据源 prop：`manifest-url` / `copy-url` / `thumbs-base`，其余全用组件默认值（`label` = 「成员墙」/「返回」、`dim-opacity` = `0.18`） |

生成器为什么打乱顺序：名单是按身份排的、优秀成员又是追加在末尾的，不打乱就会在墙上连成一片。
用的是**固定种子**（`seed = 20260922`）的 LCG 洗牌 —— 输出可复现，也不依赖 `Math.random()`
（那会让每次 build 都产生不同的文件，diff 全是噪声）。

缩略图生成器为什么要读 `group_wall.json` 的 `tiles` 而不是像作者那套那样扫目录：墙上那一百多张原图
**分散在三处**（`group_members/full/`、`excellent_member/`、`leader/`），逐条读 `full` 才不会漏。

> ⚠️ **缩略图必须本地生成，而且必须在 `deploy.bat` 之前生成**：它是 Windows PowerShell + GDI+
> （系统自带、零依赖），服务器是 Linux 跑不了；`prebuild` 也只跑那两个 node 生成器
> （`gen_group_wall.mjs` + `gen_event_badges.mjs`，见 `package.json` 的 `predev` / `prebuild`）。
> `deploy.bat` 打包 `public` 时带上去的就是你本地那一份缩略图 —— 本地没生成，
> 线上就只能回退加载原图（最 1.79 MB 的 PNG），慢但不会错版。

#### 首页上墙的两个状态：底纹 / 进入

首页那颗「成员墙」按钮由**组件自带**（`.wall-toggle`，HomeView 一行样式都不写它）：
桌面贴在 hero 底部居中，≤991px 收到左下角 44px 圆形只留图标，769–991px 挪到顶栏下方。
它落在 `.hero-inner` 之外，所以文案退场后它还在原处 —— 进入和退出是同一颗按钮。

| | 底纹态（默认） | 激活态（点那颗按钮进入） |
|---|---|---|
| `active` | `false` | `true` |
| 按钮 | 白胶囊 + 网格图标 +「成员墙」 | 蓝底反色 + 返回箭头 +「返回」← **退出口** |
| 漂移速度 | `11 px/s`（`speedBackdrop`） | `22 px/s`（`speed`） |
| 组件侧透明度 | `0.18`（`dimOpacity` 默认值） | `1`（`opacity` 默认值） |
| 悬停 | 该格放大并模糊成一团软斑（`hover-card` 为 `false`） | 弹出**预览卡**（姓名 / 班级 / 身份胶囊一排 +「比赛」战绩一排 / 留言前 10 行） |
| 点击 | 无响应 | 弹出**全文卡**（留言与战绩明细都不截断，桌面与触屏同一入口） |
| 文案与轮播 | 正常 | 淡出退场（`.hero-inner.is-wall-on`，用 `visibility` 保留占位，墙的几何不跳） |
| 顶栏 | 正常 | 加一层白纱 + 加重阴影（`body.hero-wall-on`，规则写在组件里） |

进入与退出都只由这颗按钮负责，**页面不发生位移** —— hero 之外的内容照旧在原处，往下滚即到 `#about`。
`:hover-card="wallOn"` 让弹卡跟着 `active` 走：底纹态不弹卡，进入后才弹。

> 2026-09-23 → 09-24 之间曾短暂有过另一套「整页滑走」的遮罩机制（`.page-mask` / `.page-wall` /
> `useMaskReveal.js` / `useHeaderHint.js` / 导航栏里那枚「上箭头 + 成员墙」入口 / `--mask-travel` 令牌）。
> 会长 2026-09-24 要求回到旧版：按钮回 hero 底部、进出都靠它 —— 那套机制已整体删除，
> 若要找回，见 git 历史（`e20f61b`）。

预览卡与全文卡的分工：`message` 可以是一整段话。悬停卡只做预览 —— 超长时尾部用 `mask` 淡出并挂一行
「点击查看全文」（**实测** `scrollHeight` vs `clientHeight` 决定要不要挂，短留言不挂）；
点开全文卡则是「不滚的头 + 滚的正文 + 不滚的脚」，留言再长也只是正文区自己滚，
姓名与关闭钮始终可见。两处都只是显示层截断，数据永远存全文。

#### 卡片与浮窗：`tags` 与 `sheetTags` 两个字段

同一格在**悬停预览卡**和**点开的浮窗**里显示的战绩**故意不一样**：

| 字段 | 用在哪 | 战绩怎么写 | 上限 |
|---|---|---|---|
| `tags` | 悬停预览卡 | **计数版**：一个系列一枚（如 `🥇1🥈2`） | 最多 `MAX_TAGS = 12` 枚，超出时末位换成灰色的「…」 |
| `sheetTags` | 点开的浮窗 | **明细版**：`recordsToDetails()` 逐条列赛事全名与奖牌（如 `🥇第47届 ICPC 亚洲区域赛（南京）金牌`），每条带 `family` | **不设上限**（浮窗正文自己滚） |

两个字段里的战绩条目都是 `{ text, type: 'contest', family? }`，`family` 是
`contestTaxonomy.js` 的系列键（`xcpc` / `gplt` / `baidu` / `lanqiao`），由
`recordsToDetails()` 从 **awards 的文件名**映射出来（`FAMILY_OF_FILE`）——浮窗靠它把明细
按系列分组。**不要**改成在组件里解析文案判系列：「暨江西省赛」这种标题同时含两个段名，
正则守卫拦不住（踩过）。

浮窗正文的排布（会长 2026-09-24：「tag、奖项、寄语三者要有布局、要能区分」）：

| 位置 | 内容 | 形态 |
|---|---|---|
| 头部（不滚） | 姓名 / 班级 + **身份类**短标签（会长身份 / 协会职务 / 学业排名 / 奖学金 / 毕业去向） | 全站分色胶囊 |
| 正文第一节 | **寄语** | 无色底 + 一对大引号（会长 2026-09-23 裁定不许加底色），字号比正文其余部分大一档 |
| 正文第二节 | **竞赛战绩** | 按 `family` 分组（xCPC / 天梯赛 / 百度之星 / 蓝桥杯 各一小组；没有 `family` 的手写竞赛——传智杯 / 睿抗 / 数模等——归「其他赛事」），**一条一行**的清单，不再是一堆蓝胶囊 |
| 脚（不滚） | 关闭提示 | —— |

悬停卡同理，把身份与战绩**分成两排**（战绩那排挂一枚 11px 的「比赛」小标题），各自折自己的
`+N`（身份 ≤3、战绩 ≤2）——原先两者混在同一排里，会长身份的金色胶囊紧挨着蓝桥杯的蓝色胶囊，
读起来是一堆没有主次的色块。

早先的 `MAX_TAGS` 是 6，后来放宽到 12 —— 四个系列的战绩胶囊一到手就把 6 枚占满，
手写的奖学金 / 保研 / 个人荣誉一律被「…」顶掉（实测 11 人如此），看起来就像「这面墙只有竞赛」。
两个字段都**不用手写**，由 `gen_group_wall.mjs` 的 `tagsOf()` / `sheetTagsOf()` 生成，顺序完全一致：

`wall_rules.json` 注入的个人荣誉（绿）→ 会长身份（金，只给本会会长）→ 协会职务（绿，来自 `duties.json`）
→ 比赛战绩（蓝，来自 `awards/`）→ 手写荣誉（按类型分色）。

手写荣誉会先过掉**已被自动汇总覆盖**的竞赛条目（口径见 `src/utils/honorCoverage.js`）——
否则同一块奖牌会在卡上出现两遍、把 12 枚的位置全占了，在排名里还会被算两遍。

#### 留言：从上游那份 `hero_wall.json` 按姓名并入

`hero_wall.json` 是上游作者手写的文案字典（37 条，key 是图片文件名）。我们的墙上**不消费**它的
`name` / `line` / `tags`（那三个我们自己推得出来），只有 `message`（本人留言）没有别的数据源，所以按姓名并进来：

- 匹配键依次是「显示名 → 真名 → 清洗后的群昵称 → 别名」；**对不上就整个字段不写**，
  组件对空 `message` 一个字符都不渲染（作者自己的口径：墙上绝大多数人没留言，
  写一句「这位成员还没有留言」只是噪音）。实测当前只有 4 格带留言。
- 别名表是 `gen_group_wall.mjs` 里的 `HERO_WALL_ALIAS = { 衷铭川: '多喜长安' }` ——
  上游墙上第 4 位用的网名「多喜长安」，真人就是我们的 2024 学年会长衷铭川。
  **不要**把「多喜长安」写进 `wall_rules.json` 的 `people[]`：人已经在墙上，再加一次会变成两张卡。

#### 两条分数阈值，与「会长不参与自动入册」

`public/data/wall_rules.json` 是这面墙唯一的**规则**入口（会长维护）。它的 `_note` / `_peopleNote` /
`_scoreNote` / `_scoreNote2` 四个字段里写着最细的口径 —— **改规则前先读它**，本节只是索引。两块规则：

- `people[]`：**无条件入墙**。人还不在墙上 → 给齐 `name` / `photo` / `className` 就新增一格；
  人已经在墙上（群成员或站点名单里）→ **只按 `name` 给他补标签**，不会变成两张卡
  （例：数智技术协会会长凌航本来就在群里，只补了一枚绿标签）。
  `title`（金色「会长身份」）**只给本会会长**；其他协会的会长身份写 `honors`（绿色「个人荣誉」）。
- `scoreThreshold`（当前 `20`）：综合分**达到该值的人自动入墙**；
  `excellentScoreThreshold`（当前 `5`）：综合分达标的人**自动进优秀成员页**。

两条阈值用的是**同一份分数** —— 也就是优秀成员页给卡片**排序**用的那个综合分
（`src/utils/honorRanking.js`：比赛奖牌分 + 手写战绩分 + 荣誉加项 × 1.5），由本生成器拿同一份数据算出，
所以**页面上看到的分数就是入册依据**，不存在两套口径。

手写战绩分里有两条硬口径：名次类按冠军 / 亚军 / 季军倍率算；**写了「优秀奖 / 优胜奖」的条目恒计 0 分**
（`NON_SCORING_TIERS`，2026-09-24 会长裁定 —— 这类条目照常显示，只是不进分数）。

三条容易踩的规则：

1. **`0` = 关闭规则**（不是「分数等于 0」）。`excellentScoreThreshold = 0` 时生成器照旧**无条件重写**
   `excellent_members.json`，内容就是 `members.json` 原样。这是修过的坑：早先写成「阈值 > 0 才落盘」，
   把阈值改成 0 后文件根本不更新，页面继续吃上一次的旧名单（阈值已改、名单没变），**静默发陈旧数据**。
2. **会长不进优秀成员页**（`leaders.json` 那 6 位自动跳过）—— 他们已经在「协会负责人」页有一张卡，
   两张名单都出现就是同一批人重复曝光。注意这条**只影响自动入册**，`members.json` 里手写的人一个都不动。
3. **没有可用头像的人上不了墙、也进不了优秀成员页**（缩略图生成器要拿原图出图）。生成器会把这些人打进
   日志里的「达标但无头像被跳过」清单 —— 看到阈值「没生效」先去日志里找这份清单。

同理，自动入册的人**头像优先取站点名单里的照片，没有就退回他在墙上那一张** ——
否则「没有头像」会把一批 10 分以上、明明在墙上露着脸的人挡在优秀成员页外（实测阈值 10 分时，7 位达标者全被这一条挡下）。

#### 换头像 / 加人：四个命令，其中两个在**仓库外**

**① 换头像（会长自己更新头像时走这条，一步都不能少）：**

1. 新图放进 `06_共享资源/图片资源/群成员头像/已标注/<班级> <真名>.jpg` —— **文件名保持一致**。
   `apply_annotated.py` 靠「文件名精确相等、内容哈希却对不上」认出「同一张照片被换掉了」，
   并顺手删掉站点里已过期的原图与缩略图、逼生成器重建；改了名字就得走哈希重绑那条路。
2. `python apply_annotated.py` ← **仓外**（`07_技术项目/qq-group-avatars/`）
3. `python build_site_assets.py` ← **仓外**（同目录；重建 `public/images/group_members/` 与 `group_members.json`）
4. 回站点仓库：`npm run data:group-wall && npm run data:group-thumbs`

> 只跑到第 3 步就刷新页面，看到的多半还是旧图 —— 墙面读的是**缩略图**，而缩略图按 mtime 增量跳过。
> 换完头像**两个都得跑**，这是最容易漏的一步。

**② 新人入墙**：先走 ①（进群 → 归档头像 → `build_site_assets.py`）；名字对不上就在
`07_技术项目/qq-group-avatars/群成员真名对照表.csv` 里补真名（该表**只在不存在时创建，绝不覆盖**你填好的内容）。
急着上墙又不进群的，直接写 `wall_rules.json` 的 `people[]`。

**③ 改规则 / 改职务**：改 `wall_rules.json`，或重跑 `build_duties.py` 更新 `duties.json`，
然后 `npm run data:group-wall`（页面代码一行都不用动）。

> ⚠️ **派生文件已进 `.gitignore`**（`group_wall.json` / `group_wall.manifest.json` /
> `excellent_members.json` / `event_badges.json`）—— **不要手工提交它们**。
> 入库只带来两种噪声：纯粹的 `generated_at` 时间戳 diff，以及「生成物比生成器活得久」造成的
> 静默陈旧数据（例：把 `excellentScoreThreshold` 改成 0 之后，页面仍读上一次落盘的名单）。
> 部署不受影响：`deploy.bat` 用 tar 打包的是**本地工作树**（不是 git 跟踪的文件），
> 服务器端 `npm run build` 的 `prebuild` 会重新生成它们。

#### 运动模型：一张环面 + 两条锯齿

把整面墙铺成一张**环面** —— 第 `(r, c)` 格取周期块里的 `block[(r % Py) * Px + (c % Px)]`
（横向周期 `Px` 列、纵向周期 `Py` 行）。环面的周期是轴对齐的，所以要让两个轴**各自**走满一个周期
（`0 → ±Px·step`、`0 → ±Py·step`，时长各 = 自己的周期 ÷ 自己轴上的速度）：
任一轴走到头时画面正好平移了自己一整个周期，**逐像素与起点相同**，那次跳回看不见；
两个轴各跳各的，合起来就是一条**任意角度的匀速直线**。

- ⚠️ 两条动画必须落在**两个不同的元素**上（这里是两层嵌套 wrapper），否则同元素上的两条
  `transform` 动画会互相覆盖。刻意**不用 `translate` 这个独立变换属性** —— 它 iOS 14.1 以下
  不支持，一旦不支持横向那条整条失效。
- ⚠️ 前提是**瓷砖边界本身不可见**（gap 0、无边框、无圆角）。给瓷砖加圆角或间隙，这套立刻就露馅。
- 周期取值：装得下所有图（`Px × Py ≥ n`）**且每个方向都比视口大一截**（`Px > 可见列数`、
  `Py > 行数`），在此前提下尽量放大到视口的 1.2~1.5 倍。tile 只给目标值，
  实际尺寸由组件按容器盒子扫描决定（三档优先级：周期合格且不超 DOM 预算 → 只保证不超预算 →
  只求贴近目标尺寸）。

#### 排布：优选「分栏周期」，一屏之内不出现同一个人

周期块的内容**首选**由 `buildSeparatedPeriod()` 生成：周期切成 ≥2 个等宽栏，同一个人的每一份都落在
**同一列号、不同栏**上 → 任意两份都隔着一整个可见宽度，**一屏之内不可能出现两张同一个人**。
排不出来（人少 / 屏大 / 格数超预算）才退回 `buildPeriod()` 的**配平多重集 → 洗牌 → 八邻域冲突修复**。

- 更早的写法 `list[(r*Px + c) % n]`（顺序铺）虽然也不会相邻同图，但每张重复的图都落在**同一个偏移**上
  （第 `i` 张和第 `i+n` 张恰好差固定的「几列几行」），整面墙就是一张有规律的、会动的壁纸。
- `buildPeriod()` 的修复阶段保证**八邻域（含对角、含环面 wrap）内不出现同一张图**；只有图片数少到
  `⌈N/n⌉ > ⌈Px/2⌉·⌈Py/2⌉`（数学上排不开，比如整面墙只有一两张图）时才放弃，且一定有界退出。
  退回它就会重新出现「一屏内撞见两张同一个人」（1440×900 实测稳定 2 对）—— 那是退路，不是常态。
- 用**带种子的 PRNG**（mulberry32）而不是 `Math.random`：拖窗口会重算几何，用 `Math.random`
  会让整面墙在缩放过程中不停重新洗牌，看着像花屏。种子每次**刷新**换一个。
- **图不够依然会重复**，这是数学：`n` 张图铺 `m` 格就重复 `⌈m/n⌉` 次。分栏周期能做的是让这些
  「第二次出现」**落在屏幕之外**，而不是落在随时可能被看见的位置上。人数变多不用改代码 ——
  `n` 变大 → 同一个人的份数自然变少。

#### 响应式与兼容

- 几何量的是**组件自己的盒子**（= hero 的盒子）而不是视口 → 手机地址栏收放、横竖屏切换、
  `min-height: auto` 全都自动跟随；`100vh` 而非 `dvh`，避免地址栏变化导致几何反复重算。
- 瓷砖尺寸由 CSS 变量 `--wall-tile` + 媒体查询分档（188 / 148 / 132 / 96 px），组件读它再扫描，
  断点因此留在 CSS 里。
- 交互按能力检测分两套：`(hover: hover) and (pointer: fine)` → 悬停卡；否则 → 点击弹居中卡。
- 瓷砖必须 `touch-action: pan-y`，否则墙会吃掉触摸事件、手机上在 hero 区域滑不动页面。
- 悬停穿透：`.hero-inner` 设 `pointer-events: none`，只给圆点和按钮放行；
  组件自带的「激活态」还会改用 `visibility: hidden`（保留布局占位、同时退出命中测试与绘制）——
  首页**进入激活态后正走这条路**：文案与轮播彻底退出命中测试，指针才能落到墙的瓷砖上点开成员卡。

#### 增删图片

分两类，别搞混：

- **首页这面墙**：一切从数据来 —— 加人走「换头像 / 加人」那四个命令（`group_members.json` 变了，
  `npm run data:group-wall && npm run data:group-thumbs` 就跟着变）。**不要**往
  `public/images/excellent_member/` 丢图来试图改这面墙，它不看那个目录。
- **优秀成员页自己的照片**：那个照旧是 `public/images/excellent_member/`（`members.json` 的 `photo`
  指过去），加了图只需重新生成缩略图 —— 但注意用的是 `npm run data:group-thumbs`
  （优秀成员的照片也在墙的原图三处之一里），**不是**上游那个 `npm run data:hero-thumbs`。

---

### 七、如何添加 / 修改 奖学金（国家奖学金 / 国家励志奖学金）

**文件：** `public/data/scholarships.json`（**生成物，请勿手改**）

国奖、国励**不写进** `members.json` / `leaders.json`，而是单独一份生成物。两个理由：
它们来自信息库那份**全校**名单（4379 条，2016-2017 ~ 2024-2025 九个学年），每年新增学年
重跑脚本即可；而且它还要承载**当前没有展示位的人**（见下面「只存不显示」）。

#### 数据从哪来

| 环节 | 位置 |
|---|---|
| 全校名单（唯一真源） | `D:\江西财经大学信息库\未处理\jxufe_scholarships.json` |
| 生成脚本 | `07_技术项目/奖学金数据/build_scholarships.py`（工作区，**仓库外**） |
| 产物 | `public/data/scholarships.json` —— 当前 **14 人 / 21 条** |

重跑（源名单更新后）：

```powershell
cd D:\Entrust\程序设计竞赛协会
python "07_技术项目\奖学金数据\build_scholarships.py"   # 会打印匹配表 + 丢弃清单 + 窗口校准
cd 07_技术项目\jxufe_acm_vue
npm run build      # prebuild 会把新数据并进 group_wall.json / excellent_members.json
```

#### 文字口径与颜色

一律 `<学年>学年<奖项>`：`2024-2025学年国家奖学金`、`2023-2024学年国家励志奖学金`。
学年取**学校口径**（2023 年公示 = 2022-2023 学年 —— 评审在学年结束后的秋季），依据写在源文件
meta 的 caveats 里。

每条都显式带 `"type": "honor"`，即**个人荣誉·绿色**。**不靠** `honorType.js` 的关键词兜底
（那里虽有 `奖学金|国奖|国励` 规则）—— 显式标注后，将来兜底规则重排也不会改色。

#### 身份判据：为什么不能只按姓名匹配

全校名单 3474 个不同姓名、协会 82 个真名 —— 交集里**必然有同名不同人**。实测排掉两个：

| 姓名 | 源里的记录 | 为什么不是本人 |
|---|---|---|
| 李志文 | 2018-2019 国励，金融学院 金融学，学号 `0163817` | 学号是 2016 级；本人是 2023 级 |
| 陈帆 | 2018-2019 国励，软件与物联网工程学院 软件工程，学号 `0164785` | 学号是 2016 级；本人是 2023 级（`0235207`） |

两人在源里都**只有这一条**记录、姓名与站点成员完全同名 —— 只按姓名匹配必然写错。

脚本四道判据，任一不成立即丢弃（完整说明见脚本 docstring）：

1. **学号** —— 江财学号 = `0` + 两位入学年 + 四位序号（`0224588` = 2022 级）→ 入学年必须相符
2. **源记录入学年月** —— 源里给了 `enroll`（如「2022年09月」）时必须相符
3. **学年窗口** —— 学年起始年必须落在 `[入学年, 入学年+3]`（本科四年制）
4. **可比对性** —— 以上都无从比对时**一律丢弃**，留给人复核，不做「大概是他」的猜测

> 判据 3 是兜住 2023-2024 / 2024-2025 两届国励的关键：这两届的 `student_id` 与 `enroll`
> **全为空**（790 + 869 条），只剩姓名 + 学院 + 专业可用。
> 脚本每次运行都打印窗口校准分布（当前 `{0:7, 1:8, 2:6}`，全在 0~3 内）——
> 一旦跑出 0~3 之外，说明学年口径或名单匹配出了问题，别急着用。

#### 只存不显示：没有展示位的人也照存

`scholarships.json` 里有 2 人**当前不在站点任何名单上**（只有协会队员名册里有他们）：

| 姓名 | 记录 | 现状 |
|---|---|---|
| 朱子豪 | 2023-2024 + 2024-2025 国励 | 综合分 16.4，但**没有站点头像** → 墙与优秀成员页都跳过 |
| 官祺舰 | 2024-2025 国励 | 同上 |

会长 2026-09-24 的口径：「没有显示荣誉的地方不代表不能存他们的信息，只是我们显示时，
会卡一下综合分」。所以 `gen_group_wall.mjs` 把这批人也放进候选池参与综合分 ——
他们进墙的唯一缺口是头像，补了头像、走一遍头像归档流程就会**自动露出，不用改代码**。

#### 三条显示路径

| 显示端 | 怎么拿到 |
|---|---|
| 协会成员墙（首页） | `gen_group_wall.mjs` 把 `scholarships.json` 并进 `siteHonors` 表 → 进 `tags` / `sheetTags`，并按 `text` 与手写条目去重 |
| 优秀成员页 | `src/composables/useHonorDisplay.js` 的 `cleanHonors(list, name)`，渲染期并入 |
| 协会负责人页 | 同上（两页共用这个 composable；调用时要传**真名**，匿名机制只换显示名） |

> **手写过的同一条不会显示两遍**（`cleanHonors` 按 `text` 去重）。2026-09-24 已把
> `members.json` / `leaders.json` 里被本文件取代的 **7 条**手写奖学金删掉 —— 其中 3 条是
> 没写学年的 `"国家奖学金"`，它们与新条目的文本不同、**去重不会命中**，留着就会重复显示。
> `"上饶银行奖学金 *2"` 是**另一个奖项**（不在源名单里），保留不动。

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
| `/` | 首页 | `events/top.json` + 最新 1~3 个年份文件，直接拼 `/post/<id>`；hero 底纹另有 `group_wall.manifest.json` + `group_wall.json`（`hero_wall.json` 只供留言） |
| `/all-action` | 大事记 | `events/`（置顶 + 年份文件按需懒加载，年份靠 HEAD 探测，**无索引文件**） |
| `/post/:id` | 大事记文章（新闻 / 战报 / 赛事，共用一页） | `events/<年>.json` 的 `articles`（**靠 id 前 4 位定位年份文件**） |
| `/contest` | 竞赛信息 | `competitions.json`（元信息） |
| `/competition/:slug` | 竞赛详情 | `competitions.json` + `awards/*.json` |
| `/competition/:slug/:year` | 单届获奖详情 | `competitions.json`（sessions）+ `awards/*.json` |
| `/leader` | 协会负责人 | `leaders.json` |
| `/excellent` | 优秀成员 | `excellent_members.json`（= `members.json` + 自动入册的人，生成物） |
| `/links` | 友链 | `links.json` |
| `*` | 404 | — |

---

## ✅ 数据校验

```bash
npm run data:check         # 全量校验（awards + competitions + events + top）
npm run data:gen           # 由 scripts/source/ 重新生成「赛事卡片」的大事记文章（幂等）
npm run data:group-wall    # 重新生成成员墙数据 group_wall.*.json + excellent_members.json（幂等，dev/build 会自动跑）
npm run data:group-thumbs  # 生成成员墙缩略图（384/256 两档；增量，本机 Windows 专用）
npm run data:event-badges  # 重新生成大事记时间轴的奖牌徽章 event_badges.json（幂等，dev/build 会自动跑）
npm run data:hero-wall     # 上游那套清单：重扫 excellent_member/ 并补文案骨架（首页墙不消费它）
npm run data:hero-thumbs   # 上游那套缩略图（384/256 两档；无消费者，一般不用跑）
```

`check_awards.mjs` 校验内容：

- `awards/*.json`：字段名与顺序、枚举取值、类型、日期格式与升序排列
- `competitions.json`：`awards` 引用、`shortName`、`sessions` 合法性
- `events/<年>.json` 的 `cards`：字段与顺序、`kind` / `category` 取值、`link` 必须是纯 id（不含 `/`）、日期倒序
- `events/<年>.json` 的 `articles`：文章字段与顺序、`blocks` 非空、日期年份与所在文件一致、`related` block 指向的赛事必须存在、**id 必须以所在年份开头**（前端靠它定位文件）
- `events/<年>.json` 的 `articles[id].authors`（多作者文章）：`authors` 必须是 **≥2 位**的数组、`name` 非空且不重名、`blocks` 非空、`group`/`grade`/`meta`/`final` 必须是字符串且不含 `|` 或换行；`related` block 在**每一位分享人的正文里**都查一遍
- `events/top.json`：节点格式，且置顶条目不得在年份文件里重复出现
- **每一张卡片的 `link` 必须在 `articles` 里存在对应文章**，`date` 与卡片一致（`kind: news` 还要求 `title` 一致）；无卡片入口的文章允许存在，报告里会列出数量

存在问题时以退出码 1 结束，可挂在提交前或 CI 上。

`scholarships.json` **在 `data:check` 里**（`scripts/check_awards.mjs:489-503`）：逐条校验
`type` 恒为 `honor`、`text` 必须含「学年」，并打印「N 人 / M 条」。但它查的只是**格式** ——
**身份匹配的判据**跟着仓外生成脚本走：重跑 `07_技术项目/奖学金数据/build_scholarships.py`
会打印匹配表、每条的判据、判据不过的丢弃清单，以及学年窗口的校准分布（见第七节）。
分布跑出 0~3 就说明有问题。

### 计分口径回归集（`npm test`）

`test/` 下是 `node --test` 写的零依赖回归集（不构建、不联网），钉住**显示排名那套口径**：
优秀奖 / 优胜奖计 0、复合条目里的省一等奖照计（5.00）、手工胶囊按分段计分（3.5）而整串入参保持
旧口径（6.05）、`gplt|省赛` = `lanqiao|省赛` = 0.12、13 位成员的分值快照、≥5 分池的前 10 顺序、
墙上被胶囊覆盖吃掉 85 条手写条目、胶囊人名数 1795，以及「战绩数据取不到时必须留下缺失清单」。

另一条不属口径、但同样会**静默降级**的契约：**排名加载超过 3 秒就先按 `members.json` 原顺序
渲染，迟到的排名仍然会覆盖上去**（`src/utils/honorRanking.js` 的 `rankWithTimeout`）。2026-09-24
之前不是这样 —— 超时即把 `byName` 置成空 Map 并用它挡住重跑，3 秒后回来的排名被永久丢弃，
网络慢一次那一页就再没有排序（回归集里 3 个用例钉住这条）。

`test/postgraduate-share.test.mjs` 钉的是**多作者大事记的转换产物**（正文由 Markdown 转 blocks，
块类型写错、表格缺列、整段丢掉时页面上只会「少一段」，`check_awards.mjs` 只看结构看不出来）：
块类型必须在 `BlockRenderer.vue` 的白名单里、表格每行列数与表头一致、图片 src 有来源、
没有空气泡，以及**生成器幂等**（直接跑 `--check` 应为「已是最新」）。
原文在仓外取不到时这条自动跳过，不当失败。

**改 `src/utils/honorRanking.js` 顶部那几张表或 `src/utils/honorCoverage.js` 的放行判据之前，先跑
`npm test`** —— 这套口径是表驱动的，动一个系数会静默改变全站名次，这些快照就是那个报警器。
（它也是被教训出来的：2026-09-24 的审查里，靠手工核验算法得出过三个错结论。）

### 生成器读数据的策略（`scripts/lib/data-io.mjs`）

`predev` / `prebuild` 链上的生成器统一走这一个模块，只有两种态度：

- **必需数据**（`readJsonRequired`）：`public/data` 下随仓库提交的站点数据 —— 缺了就**让构建停下**，
  报错里写清「哪份文件、谁要的、怎么补」。静默少一份数据，页面上表现为「某个系列凭空消失」，
  没人会发现；而构建停一次，五秒钟就能看懂。
- **可选数据**（`readJsonOptional`）：会长手写、缺了不影响页面结构的（`wall_rules.json` 的入墙规则、
  `hero_wall.json` 的留言）—— 读不到就用回落值继续，但**必须打一行 warn**：降级可以有，无声降级不行。

前端同一原则：`honorPills.js` 的 `loadHonorRecords()` 在某个战绩文件取不到时仍然降级（页面不该因此
报错），但会把缺的文件攒进 `missingHonorSources` 并统一 warn 一条，说清缺的是哪几个系列。

> 服务器构建也依赖 `scripts/lib/`：两个生成器都 import 它，所以它必须在 `deploy.bat` 的
> `UPLOAD_ITEMS` 里（上传的是整个 `scripts\lib` 目录，以后加共用模块不用再改清单）。

---

## ⚠️ 网站未更新？

如果你提交了 Pull Request 并被合并到 `master` 分支，但网站迟迟没有更新：

**联系 QQ：3200513041**

---

> 由原静态站 `jxufe-acm.cn` 迁移重构而来，以现代化前端工程体系重新组织。
