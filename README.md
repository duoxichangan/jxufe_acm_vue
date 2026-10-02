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
│   │   ├── schedule.json          # ★ 近期赛事时间表的手写真源（竞赛信息页，见第八节）
│   │   ├── schedule.auto.json     # 同表「自动层」：各赛事官网抓来的场次（生成物，已 gitignore）
│   │   ├── platforms.json         # ★ 线上平台（CF / AtCoder / 牛客）的图标与简称，只服务该表行首 logo
│   │   ├── hero_wall.json         # 上游那份 33 人墙的文案（现只剩 message 被首页墙按姓名并入）
│   │   ├── hero_wall.manifest.json # 上游那份墙的图片清单（现无消费者，也不再自动重写）
│   │   └── links.json             # 友情链接
│   └── images/                    # 静态图片
│       ├── slider/                # 首页轮播图（slider1.jpg ~ slider10.jpg）
│       ├── contest/               # 竞赛 logo + 线上平台 logo（CF / AtCoder / 牛客，见第八节）
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
│   ├── gen_schedule.mjs           # ★ 抓各赛事官网 → schedule.auto.json（失败只 warn，绝不让构建挂掉）
│   ├── lib/                       # 生成器共用的纯函数（整个目录随部署上传，见 scripts/README.md）
│   │   ├── data-io.mjs            # 读数据文件的策略（缺文件 / 坏 JSON 就指名道姓地停下）
│   │   └── schedule-parse.mjs     # ★ 官网赛程的日期与 HTML 解析（真实样本见 test/schedule-parse.test.mjs）
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
    │   ├── UpcomingSchedule.vue   # ★ 近期赛事完整表（独立页 /upcoming；过期自动收起 + 倒计时 + 三颗范围开关 + 一整排筛选：赛事 ｜ 全部 ｜ 平台）
    │   ├── UpcomingBoard.vue      # ★ 竞赛信息页那块「近期赛事」看板（2 场非线上 + 2 场线上 + 仪表板，整块链到 /upcoming）
    │   ├── ScheduleStats.vue      # ★ 看板顶部的仪表板（**看板专属**：一格一赛事 + 一格一平台，都带 logo；完整表页 2026-10-02 起不再渲染它）
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
    │   ├── useScheduleData.js     # ★ 赛程取数（竞赛信息页看板 + /upcoming 独立页共用一份）
    │   ├── useMasonry.js          # ★ 优秀成员页瀑布流（逐张放进最短列；列数/间距走 .grid 上的 CSS 变量）
    │   ├── useHonorDisplay.js     # ★ 荣誉取数与归一化（职务 / 自动汇总战绩 / 手写荣誉 + 奖学金，两页共用）
    │   ├── useSectionSnap.js      # ★ 首页滚轮「按部分对齐」吸附（#home / #about / #news 三个分界）
    │   ├── useCodeTrail.js        # 代码字符拖尾特效
    │   └── useCursorRipple.js     # 光标涟漪特效
    ├── directives/
    │   └── reveal.js              # v-reveal 滚动入场指令
    ├── data/
    │   └── navigation.js          # 导航菜单 + 页脚链接（页脚有「近期赛事」，顶部导航有意不加）
    ├── utils/
    │   ├── inline.js              # 内联标记解析（**加粗**、[链接](url)）
    │   ├── awardGroups.js         # ★ 获奖数据展示工具（两个竞赛页共用）
    │   ├── honorPills.js          # ★ 比赛战绩胶囊：由 awards/ 自动汇总（不用手写进名单）
    │   ├── honorRanking.js        # ★ 卡片排序分与入墙阈值的分数口径（改口径只改这个文件）
    │   ├── honorType.js           # 荣誉分类 / 归一化 / 类型中文名（配色见 styles/honors.css）
    │   ├── honorCoverage.js       # 剔掉「已被胶囊覆盖」的手写荣誉（显示与计分共用一份口径）
    │   ├── honorView.js           # 荣誉显示偏好：count / icons / detail（存 localStorage）
    │   ├── contestTaxonomy.js     # 赛事分类与奖牌枚举（页面与生成器共用一份口径）
    │   ├── scheduleView.js        # ★ 近期赛事的日期与类型口径（排序 / 状态 / 合并 / 图标表 / 类型与筛选键；纯函数可测）
    │   └── eventsSource.js        # ★ 大事记数据源读写封装（events/ 目录唯一入口：卡片/置顶/索引/文章）
    └── views/
        ├── HomeView.vue           # 首页 /
        ├── AllActionView.vue      # 大事记列表 /all-action
        ├── PostView.vue           # 大事记文章 /post/:id（新闻 / 战报 / 赛事卡片文章共用）
        ├── ContestView.vue        # 竞赛信息 /contest（顶部只有一块「近期赛事」看板）
        ├── UpcomingView.vue       # ★ 近期赛事 /upcoming（完整表；看板与页脚链到这里）
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

### 八、维护「近期赛事时间表」（独立页 `/upcoming` + 竞赛信息页看板）

一场一行的**具体日期**表（`src/components/UpcomingSchedule.vue`）。它与紧挨着的「全年赛程」时间轴
分工不同 —— 时间轴回答「这类比赛一般几月比」（月份区间的历年统计），这张表回答「最近要比哪一场」。

#### 两个页面：看板（`/contest`）→ 完整表（`/upcoming`）

2026-10-02 会长：「把近期赛时显示为独立页面，然后在竞赛信息页，只显示一个看板，点击进入详情页」。

| 位置 | 组件 | 内容 |
|---|---|---|
| 竞赛信息页 `/contest` | `src/components/UpcomingBoard.vue` | **一块看板**：**卡片顶部的仪表板**（**一条带**：**一格一个赛事** + **一格一个平台**，都带 logo；为 0 的格不渲染，结构见 `ScheduleStats.vue`。⚠ 原先它上面还有一条「时间与状态」—— 场待办 / 本月 / 下月 / 报名中 / 已收起 / 时间待定，2026-10-02 已整行撤掉）+ **2 场非线上 + 2 场线上**（两拨合起来仍按开赛日混排）+「查看完整赛程」；**白卡整块就是一个指向 `/upcoming` 的 RouterLink**（点哪儿都进详情页）。版式与同页的「全年赛程」逐条对齐 —— 标题在卡外（`.board__head`）、白卡只包内容（`.board__card`），字号 / 说明行 / 内边距 / 边框 / 阴影都照抄 `.schedule*`（2026-10-02 会长：「在『竞赛信息』页显示的看板要统一风格」） |
| 独立页 `/upcoming` | `src/views/UpcomingView.vue` 包着 `UpcomingSchedule.vue` | 完整那张表：**顶部直接就是筛选**（2026-10-02 会长：「在近期比赛的详情页不要显示这个 class="sched-stats sched-stats--catalog upcoming__stats"」→ 仪表板**不再是本页的一部分**，它现在只挂在竞赛信息页看板上）→ **一整排筛选**（线下赛事 chips（带 logo）→「线下赛」→「全部」→「线上赛」→ 线上平台 chips（带 logo）；三颗开关**关联式选中**、夹在两拨 chip 中间）→ 行首 logo、左边框类型色、月份分组 → 时间待定块 → 页脚（勾选后显示几场 / 收起了几场 / 哪个源没同步上） |

- **看板列什么：2 场线上 + 2 场非线上**（会长 2026-10-02：「我希望在竞赛信息页显示的应该的最近的
  2 场线上和 2 场非线上赛」）。两拨**合起来仍按开赛日排、不分成两段** —— 做法是各取前 N 条
  （props `limit` / `onlineLimit`，都默认 2）再回全表按原顺序滤一遍；**别把两拨拼起来重排**，
  同一天的两条会随拼接顺序抖动。防淹从此靠**条数上限**：早先（2026-10-01）线上赛一行都不给，
  理由是 CF / AtCoder / 牛客一周十几场会把「ICPC 南昌站 12 月 19 日」这类真要提前准备的场次挤下去。
- **仪表板现在只在看板上，但结构与口径仍各只有一份**（2026-10-02 会长四条连着来：先是「『共 35 场待办 ·
  本月 25 场 · 线上赛 19 场』这一部分要放到卡片顶部详细一些」，紧接着「我希望做成类似仪表板的东西」，
  再一条「线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」，最后一条
  「**去除第一行的那些场待办 35 本月 25 下月 6 报名中**」；同日晚些时候又一条
  「**在近期比赛的详情页不要显示这个 class="sched-stats sched-stats--catalog upcoming__stats"**」
  ⇒ 完整表页 /upcoming **整块撤掉**，仪表板从此只出现在竞赛信息页看板上）：
  - 结构 = `src/components/ScheduleStats.vue`（**唯一一份**，**现在只有 `UpcomingBoard.vue` 挂它** ——
    完整表页的 import 与模板都已撤掉，只留墓碑注释写明「要挂回来加哪两行」）。
    ⚠ 组件**没有跟着删**，理由有二：① 它是成型的结构 + 全局样式体（顺带有人要拿回来时不必重写）；
    ② 完整表页的**筛选 chip 计数仍走同一个 `scheduleStats()`** —— 口径依旧只有一份，
    `UpcomingSchedule.vue` 里的 `stats` computed 因此**不能跟着删**（删了两行芯片的计数与颜色全空）。
    它现在只有**一条带**：
    **一格一个赛事**（ICPC / CCPC / 传智杯 / 百度之星…）+ **一格一个平台**
    （Codeforces / AtCoder / 牛客…），每格带**真 logo**（没登记图标的赛事给首字母圆片）。
    **为 0 的格整格不渲染** —— 线上常见 7 格（4 个赛事 + 3 个平台）。
    ⚠ 原先它上面还有一条「① 时间与状态」（场待办 / 本月 / 下月 / 报名中 / 已收起 / 时间待定），
    已按会长那条要求**整行撤掉**：那几个数仍在 `scheduleStats()` 里算（口径只有一份、回归集仍在钉），
    其中「已自动收起 N 场结束的」**搬回完整表页脚**（`UpcomingSchedule.vue` 的 `footParts` ——
    否则「表里少了几场」就没地方说了），其余几个数当前全站不再显示；要整行拿回来，
    照 `ScheduleStats.vue` 文件头与 `schedule-stats.css` 末尾「已撤」注释恢复即可。
  - 形态 = 小标签在上（`em`；赛事/平台格是「logo + 名字」的 flex）、大数字在下（`b`，等宽数字）、
    顶部一道 3px 指标色 —— 赛事格取该赛事**最常见的类型色**（`dominantCategory`）、
    平台格统一 `--cat-online`，由组件内联 `--stat-color` 给出。
  - 口径 = `src/utils/scheduleView.js` 的 `scheduleStats(view, today)`：状态几个数 + `byContest`
    （按赛事，每项带该格的类型）+ `byPlatform`（按平台）+ `next`（最近一场）。
    ⚠ 它**恒按全部未来场次算，不受筛选影响**：勾掉几个标签时数字不跳，「勾选后显示几场」由页脚单独说
    （两件事混在一起会让人以为数据变了）。
    **筛选 chips 的数与顺序也取这一份**（`byContest` / `byPlatform`）—— 2026-10-02 收口：此前组件里
    另有一套 `tallyRows` / `dominantCat`，改一处忘一处就是「chip 上的数字与仪表盘对不上」。
  - 样式 = **全局** `src/styles/schedule-stats.css` 的 `.sched-stats` / `.sched-stat` / `.sched-stat--*`
    （与 `honors.css` / `view-toggle.css` 同一做法：跨页复用的组件级样式放全局，组件里只留自己的排布）。
    `index.css` 引它；回归集有用例钉住「两个页面都挂同一个组件、谁都不许自己再写一份格子」。
    ⚠ **这条带的格子是 `minmax(124px, 1fr)`**（撤掉的那条状态带是 88px）：挤窄了「Codeforces」会被截成
    「Codef…」、「百度之星」截成「百度…」（2026-10-02 截图实测；回归集用正则钉住这个宽度）。
  - 每一格带 `data-stat` —— 赛事/平台格是 `contest-<slug>` / `platform-<slug>`
    （那条已撤的状态带用的是 `total|month|next|signup|closed|pending`）。回归与页面探针**按它取数**：
    文案从「共 6 场待办」拆成「场待办」+「6」两截之后，按文案的断言整批失效（2026-10-02 踩过）。
  - 显示名的兜底顺序也只有一份：`scheduleView.contestLabel(icons, slug)` = 图标表的
    `shortName || name` → `CONTEST_LABELS` 的中文名 → slug 本身。2026-10-02 就是靠它发现「同一个
    `club` 在一颗 chip 上叫『协会自办』、在仪表板里却写着 `club`」——两处各自写一遍兜底就会这样。
- **完整表组件不再自带表头**（会长 2026-10-02：「`upcoming__head` 可以取消」）：独立页的 hero
  已经写了同一个 h2 与更全的说明行，组件再重复一遍就是同一句话出现两次。组件的第一个元素现在是仪表板。
  ⚠ 竞赛信息页看板的标题**仍然保留**（`.board__head`）—— 那一页需要它当小节标题，与「全年赛程」对齐。
  要改独立页的标题/说明，改 `src/views/UpcomingView.vue` 的 hero，别把表头加回组件。
- **取数只有一份**：`src/composables/useScheduleData.js`（两个页面共用）。它给两个 loading：
  `loading`（四份数据任一在路上 → 页首骨架屏）与 `scheduleLoading`（只有赛程那三份 —— 看板/表用这一个，
  不让竞赛卡片那份拖住赛程显示）。
- **入口**：看板（主要）+ 页脚「近期赛事」（兜底）。**顶部导航有意不加**（会长选的档：只加页脚）；
  要加就同时改 `src/data/navigation.js` 的 `navLinks` —— 两个数组有意不一样，那边有注释。
- 独立页底部有「← 返回竞赛信息」；`/upcoming` 是懒加载路由（`src/router.js`）。
- 看板与完整表的**图标表、类型判据、筛选键全部来自 `src/utils/scheduleView.js`**
  （`buildIconIndex` / `categoryOf` / `filterKeyOf`）—— 两处各写一份就会出现「看板有 logo、表里没有」
  这种谁也说不清的表现。`row.category === 'online'` 是判线上赛的**唯一**口径
  （`filterKeyOf` 现在恒返赛事 slug，两行 chips 谁的键都一样，见《表怎么呈现》）。
- **右上角那行「数据更新：手写 X月X日 · 官网自动同步 X月X日」2026-10-02 由会长要求去掉**，
  两个页面各一处，连同 `scheduleView.dataStamp()` 一起删了（`.upcoming__stamp` 的墓碑注释留在
  组件样式里）。**数据字段没动**：`schedule.json` 的 `updated`、自动层的 `generated_at` 照旧在，
  `npm run data:check` 也照旧校验。要加回来只需复活那个函数（UTC→东八区的换算坑写在墓碑注释里：
  自动层是 UTC ISO，必须先 +8h 再取日期，否则北京时间 0~8 点构建会显示成「昨天」）。

#### 两份赛程数据（手写优先）+ 一份图标数据

| 文件 | 谁写 | 入库 | 作用 |
|---|---|---|---|
| `public/data/schedule.json` | **会长手写** | ✅ 入库 | 权威层：协会自己定的场次、官网公告里确认过的日期 |
| `public/data/schedule.auto.json` | `scripts/gen_schedule.mjs` 抓官网 | ❌ gitignore | 自动层：构建时抓来，页面照常合并显示 |
| `public/data/platforms.json` | 维护者手写 | ✅ 入库 | **只**给行首 logo 与 alt 文本用：`codeforces` / `atcoder` / `nowcoder` 的图标与简称 |

页面同时请求两份再合并：**手写优先**，自动层只补手写没有的场次（判重键 = `contest` + `start`，
见 `src/utils/scheduleView.js` 的 `mergeSchedule`）。两份任一缺失都不影响另一份 ——
自动层整条挂掉时页面照常显示手写那部分，并在页脚写明「暂未同步到：某某」。

> **平台图标为什么不写进 `competitions.json`**：那份数据的每一条都会在页面下方长出**一张竞赛大卡**，
> 还要过奖项文件、届次映射等一串校验；而 Codeforces / AtCoder / 牛客我们并不「参赛」，只是赛程的来源。
> 分开放之后，加一个平台只动 `platforms.json` + 丢一张 png 进 `public/images/contest/`，
> `npm run data:check` 会核对图标文件是否真的存在（取不到图页面不报错，只会静默退回首字母方块）。

#### 怎么加一场

编辑 `public/data/schedule.json` 的 `items`，然后 `npm run verify` → 提交 → 部署。字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `contest` | ✅ | 赛事 slug：`icpc` / `ccpc` / `gplt` / `lanqiao` / `baidu` / `chuanzhi` / `club`（协会自办）/ `codeforces` / `atcoder` / `luogu` / `nowcoder`。写别的会被 `data:check` 拦下 —— 页面按 slug 取图标，拼错不会报错、只会静悄悄没图标。⚠ **`raicom`（睿抗）2026-10-02 起不在白名单里**：它的场次已被 `HIDDEN_CONTESTS` 整条隐藏，再手写一条只会「写了却永远不显示」，故让校验当场报错 |
| `title` | ✅ | 一行里给人看的名字。**xCPC 场次必须写成标准形式**（见下面《xCPC 场次的标准命名》） |
| `start` | ✅ | `YYYY-MM-DD`，**唯一必填的日期**。没确定日期的别硬编 |
| `end` | | 结束日；单日省略 |
| `deadline` | | 报名截止。比开赛日更近时表格优先提醒它（「报名还剩 N 天」）—— 学生真正会错过的是这个日子 |
| `time` / `place` / `link` / `note` | | 时间（`14:00-19:00`）/ 地点 / 官方链接 / 一句话备注（悬停可见） |
| `tentative` | | 官网原文就写着「暂定」时置 `true`，表格会挂一枚「暂定」角标 —— 不把暂定的写成确定的 |
| `source` | | 出处（如「CCPC 官网《2026 CCPC 各场比赛安排》」），留给自己日后复核 |

日期还没定的（「10 月初」「拟定四月中旬」）写进 `pending`（`title` + `when`），
表格底部单列一块「时间待定」，**不编日期**。这也是本表的纪律：**没有依据的日期不写** ——
宁可少一行，不写错一行（与 `CompetitionSchedule.vue` 的「没有证据的阶段不画」同一口径）。

> ⚠ **2026-10-02：`pending` 现为空，页面上没有「时间待定」那一块** —— 会长要求撤下原有的两条
> 协会自办条目（招新选拔「2026 年 10 月初」、JCPC「2027 年 4 月中旬（拟定）」，依据《2026-2027学年工作计划》）。
> **机制没删**：往 `pending` 里加一条（`title` + `when`），表格底部就会重新长出那一块 ——
> 组件在 `pending` 为空时整块不渲染，所以撤下/加回都**不用改代码**，只改这一份数据。

#### xCPC 场次的标准命名（2026-10-02 统一）

ICPC / CCPC 的场次名不再自由书写，一律取这 11 种形式之一（会长裁定）：

| 形式 | 例子 | 用在哪 |
|---|---|---|
| `ICPC/CCPC xx省赛` | `ICPC江西省赛` | 独立的省赛 |
| `ICPC/CCPC全国邀请赛（xx）` | `ICPC全国邀请赛（昆明）` | 全国邀请赛 |
| `ICPC/CCPC全国邀请赛（xx）暨xx省赛` | `CCPC全国邀请赛（南昌）暨江西省赛` | 邀请赛与省赛合办 |
| `CCPC全国赛（xx）` | `CCPC全国赛（长春）` | CCPC 分站赛（官网原文字面是「长春国赛」） |
| `ICPC亚洲区域赛（xx）` | `ICPC亚洲区域赛（西安）` | ICPC 区域赛 |
| `ICPC东亚区总决赛（xx）` / `ICPC世界总决赛（xx）` | `ICPC世界总决赛（开罗）` | ICPC 总决赛 |
| `CCPC总决赛（xx）` | `CCPC总决赛（深圳）` | CCPC 总决赛 |
| `CCPC网络预选赛` | —— | CCPC 网络赛 |
| `ICPC网络赛预选赛第一场` / `第二场` | —— | ICPC 网络赛 |
| `CCPC女生专场（xx）` | `CCPC女生专场（成都）` | 女生赛（会长单列的口径；城市未知时写 `CCPC女生专场`，**不编城市**） |

- **`ICPC` / `CCPC` 之后不加空格** —— 与仓库既有数据一致（`awards/*.json`、`events/*.json` 通篇是
  `ICPC亚洲区域赛 南京站`、`CCPC全国邀请赛（南昌）暨江西省赛`）。2026-10-02 之前手写层写作
  「CCPC 长春国赛」，已统一为 `CCPC全国赛（长春）` 等。
- 抓取层由 `scripts/lib/schedule-parse.mjs` 的 `ccpcStandardName()` / `icpcStandardName()` 生成；
  白名单 `XCPC_TITLE_RES` 与**这两个函数同住一个文件**：`npm run data:check` 拿它给
  `schedule.json` 与自动层打提示（**只 warn 不 err** —— 官网偶尔给不出干净的站名，
  硬拦会逼着维护者把名字改坏来讨好校验）。
- 名字与**左边框颜色**是同一件事的两面：颜色由 `src/utils/scheduleView.js` 的 `categoryOf()` 判。
  两处判据要一起改 —— 名字写成「网络预选赛」而颜色还是区域赛，就是这两处走失了。
- 本次只统一「近期赛事表」这条线（手写层 + 抓取层）；**历史成绩、历届数据页与竞赛卡片的名字不动**
  （会长 2026-10-02 定的范围）。

#### 「自动更新」到底自动了什么

每次打开页面就重算，无需任何人操作：

1. **已结束的场次自动收起**，页脚写明「已自动收起 N 场结束的」；
2. 按开赛日**自动排序**、自动分到月份；
3. 「还有 N 天 / 报名还剩 N 天 / 今天 / 进行中」**按当天现算**，7 天内与报名中的高亮；
4. 抓来的场次带「自动同步」角标，官网标注暂定的带「暂定」角标。

数据侧的刷新发生在**构建时**：`prebuild` 会跑 `scripts/gen_schedule.mjs` 重抓一遍官网
（deploy.bat 在服务器上构建，所以**每次部署 = 自动层刷新一次**）。
本地想立刻刷新：`npm run data:schedule`（`npm run data:schedule -- --dry` 只打印不落盘）。
离线 / 不想等网络：`set SCHEDULE_SKIP_FETCH=1` 跳过抓取。

> 为什么抓取**不**挂在 `predev` 上：`npm run dev` 每次都要等一门外网，
> 而这份数据缺了页面也能用（降级成只显示手写层）。所以开发时看到的线上赛少几行是正常的，
> 跑一次 `npm run data:schedule` 即可补齐。

#### 表怎么呈现（2026-10-02 十七次改版）

| 会长原话 | 现在的做法 | 落点 |
|---|---|---|
| 「线上赛不是自动折叠，而是所有赛时都显示，然后添加一个 filter」 | Codeforces / AtCoder / 牛客 **与主表按日期混排**（原先的 `<details>` 折叠块已删）；顶部**筛选 chips**（现在分两行，见本表最后一条） | `UpcomingSchedule.vue` 的 `excluded` / `contestChips` / `platformChips` / `visibleRows` |
| 「并没有一个 filter 叫『全部』，而是默认全部勾选，点击『全部』后就把全部的标签勾选，『全部』本身不能勾选」 | 筛选是**多选、默认全勾**；「全部」当时是**动作按钮**（把每个标签勾回来），没有 `aria-pressed`、也就永远不会有「选中」的样子。**状态存的是「被取消勾选的键集合」**（`excluded`），故数据里新冒出来的类型默认就是勾上的，不需要任何 watcher 去补默认值。⚠ 「『全部』不能勾选」这半句**已被本节最后一条取代**（第三版改成关联式可勾选） | 同上；当时的 `.upcoming__cat--all` 只有虚线边框与 hover 态、**没有 `.active`** |
| 「把 logo 放到每个卡片的最前面，然后大小要放大很多」＋「不要被半透明边框包裹，logo 还可以更大一些」 | 每行**第一格就是 logo**：桌面 **96px**、768 / 576 两档 72 / 64px；**不套边框、不套内边距、不上底色**（真 logo 透出卡片白底）。96 是**上限** —— 会长给的原图 CF 101×89、牛客 98×98 就这么大，再放就糊 | `.upcoming__logo-slot`；没有图标的赛事（协会自办 / 将来新赛事）给 `--cat-soft` 底的**首字母方块**，不留白 |
| 「我希望你添加牛客的竞赛日历到这里来」 | 抓取层新增 `nowcoder` 源；行首用牛客 logo，类型归「线上赛」 | `scripts/gen_schedule.mjs`、`public/data/platforms.json` |
| 「条目要使用左边框指示比赛类型，颜色参考大事记」 | `border-left: 4px solid var(--cat, …)`；`--cat` 由 `categoryOf()` 判定，**色值在 `src/styles/tokens.css` 的 `--cat-*`**，大事记卡片引同一份 → 两页同色；状态改由右侧**状态胶囊**与今天 / 报名中的行底色表达（不再占用左边框） | `tokens.css`、`AllActionView.vue` 的 `.tl-card--X` |
| xCPC 命名标准化 | 见上一节 | `scripts/lib/schedule-parse.mjs` |
| 「去除右上角『手写 10月2日·官网自动同步 10月2日』的提示文本」 | 那行日期戳**删掉**（看板与完整表各一处），`scheduleView.dataStamp()` 连函数一起删 —— 数据字段不动，校验照旧 | 两个组件的 head；口径（UTC→东八区）留成墓碑注释 |
| 「在『竞赛信息』页显示的看板要统一风格」 | 看板改成**标题在卡外、白卡只包内容**：`h2` 1.35rem、说明行 0.9rem `--text-secondary`、卡 `padding: 18px 20px 22px` + `--radius-xl` + `rgba(15,23,42,…)` 边框与阴影 —— 全部照抄同页的「全年赛程」 | `UpcomingBoard.vue`；回归集有一条**两边数值比对**的用例钉住它们不再漂移 |
| 「增强详情页的 filter：线上赛要分平台，然后支持一键勾选所有线上赛、非线上赛」 | 筛选分**两组**：「赛事类型」与「**线上平台**」（一颗 chip 一个平台，名字取 `platforms.json` 的 `shortName`）。每组末尾一颗虚线**动作按钮**「全部勾选线上赛 / 非线上赛」（与「全部」同一规矩：只勾不撤、无 `aria-pressed`）。⚠ 这一版的「赛事类型」那一组**已被下一条取代**（键从类型改成了赛事），此处只记当时的档 | 当时的 `typeChips` / `checkAllTypes`；`platformChips` 与 `checkAllPlatforms` 沿用至今 |
| 「类型可以分的更开，线上赛要分平台，然后线下赛要分赛事，并且要显示 logo」 | 筛选改成**两行、彼此不重叠、也没有第三层**：第一行「**线下赛事**」= 一颗 chip 一个**赛事**（ICPC / CCPC / 传智杯 / 百度之星…），第二行「**线上平台**」= 一颗 chip 一个**平台**。**类型 chips 整组撤掉** —— 那条信息仍在：它就是**每行左边框的颜色**，而 chip 的选中色取该赛事**最常见的类型色**（`dominantCat`；线上统一 `--cat-online`），所以两边仍对得上。每颗 chip 带**真 logo**（18px + 白圆底：勾选后整颗变实色，垫白底任何 logo 都看得清，且切换时宽度不跳）。键 `row.filterKey` 从此**恒为赛事 slug**（两行同形），故「撤一颗」只撤这一项赛事，不会连带同类型的别家赛事一起消失；两行末尾各一颗动作按钮「全部勾选线下赛事 / 全部勾选线上赛」 | `UpcomingSchedule.vue` 的 `contestChips` / `platformChips` / `tallyRows` / `dominantCat` / `checkAllContests`（⚠ 其中 `tallyRows` / `dominantCat` 后来搬进 `scheduleView.js`、`checkAllContests` 换成了关联式开关，见本节最后一条与后两条）；`scheduleView.js` 的 `CONTEST_ORDER` / `PLATFORM_ORDER` / `CONTEST_LABELS` / `filterKeyOf()` |
| 「xcpc女赛并入全国赛那类」 | `categoryOf()` 里女生专场 → **`reg`**（原 `inv`）。⚠ **大事记数据仍归 `inv`**（`public/data/events/*.json` 的 `category`）—— 有意的一处不一致，要拉平得改那份数据 | `scheduleView.js` 的 `categoryOf`；`AllActionView.vue` 的 `CAT_LABEL` 不动 |
| 「去除睿抗的 filter，并且最近赛时里也不显示睿抗的比赛」 | 新增 `HIDDEN_CONTESTS = new Set(['raicom'])`：**整条不进表、不进 pending、也不计入「已收起」**（chip 随之消失）；抓取层撤掉 raicom 源；`data:check` 的 slug 白名单同步移出 `raicom`。分类口径（`categoryOf` 的 `raicom`、令牌 `--cat-raicom`）照旧保留 —— 恢复只改两处，代码注释里写了具体位置 | `scheduleView.js`、`scripts/gen_schedule.mjs`、`scripts/check_awards.mjs` |
| 「『共 35 场待办 · 本月 25 场 · 线上赛 19 场』这一部分要放到卡片顶部详细一些」 | 数字条从**页脚 / 卡底挪到最上面**并拆细：共 N 场待办 / 本月 / 下月 / 线上赛（按平台拆开，形如「Codeforces 4 · AtCoder 8 · 牛客 7」）/ 报名中 / 已收起 / 时间待定（为 0 的条目不渲染）。看板与完整表**两处同款**，口径与样式各只有一份 —— 下一轮又把它从「一行文字」改成了仪表板（见下两条） | `scheduleView.scheduleStats()` + 全局 `src/styles/schedule-stats.css`；看板页脚只剩「查看完整赛程」，完整表页脚只剩「勾选后显示 N 场」与「自动同步失败：…」 |
| 「`upcoming__head` 可以取消」 | 完整表组件**自带的表头整组删掉**（h2「近期赛事」+ 说明行）—— 独立页 hero 已经写了同一句话。组件顶部现在直接从数字条开始；看板（`/contest`）的 `.board__head` **保留**（那一页要靠它当小节标题） | `UpcomingSchedule.vue`；模板里的墓碑注释写明「要做表头请改 `views/UpcomingView.vue` 的 hero」 |
| 「我希望在竞赛信息页显示的应该的最近的 2 场线上和 2 场非线上赛」 | 看板从「只列 3 场、线上赛一行不给」改成 **2 + 2**：两拨各取前 N 条（`limit` / `onlineLimit`，都默认 2），**合起来仍按开赛日混排、不分成两段**。线上赛从此**占看板的行**，防淹改由条数上限负责 | `UpcomingBoard.vue` 的 `top` computed + `rowKey`；回归集有一条把两个 props 各压到 1 的用例（钉住「不是先到先得的 4 条」） |
| 「（顶部的『共 35 场待办 本月 25 场 下月 6 场 线上赛 19 场（牛客 7 · AtCoder 8 · Codeforces 4）报名中 1 场』）我希望做成类似仪表板的东西」 | 一行用「·」串起来的文字改成**一格一个指标的仪表板**：小标签在上、1.5rem 大数字在下（等宽数字）、顶部一道 3px 指标色（总数 / 本月 = `--primary`、下月 = `--cat-inv`、报名中 = `--accent` 且数字同色、已收起 = `--cat-other`、时间待定 = `--cat-club`）；为 0 的格整格不渲染 | 当时的两个组件各内联一份仪表板块 + 全局 `styles/schedule-stats.css`；每格带 `data-stat` 供回归与页面探针取数。⚠ 那一版的「线上赛」聚合格**已被下面那条取代** |
| 「**我说的不是fliter那，而是说的仪表盘那里**」（纠正上一条的落点：拆格要落在仪表盘，不是筛选） | 仪表盘改成**两条带**并**按赛事/平台拆成一格一格**：聚合的「线上赛 19（小字写平台分布）」**整格撤掉** → **一格一个平台**；线下**新增一格一个赛事**；两拨格子都**带真 logo**（没登记图标的给首字母圆片）。结构**抽成共用的 `ScheduleStats.vue`**（原先两个组件各内联一份 7 格模板，格子涨到十几个后必然漂移）；带 logo 的那条带格子更宽 —— 否则「Codeforces」被截成「Codef…」（截图实测过） | `src/components/ScheduleStats.vue`（**新**）、`scheduleView.scheduleStats()` 的 `byContest`；两个页面各挂一行组件；`styles/schedule-stats.css` 的 `.sched-stats-wrap` / `.sched-stats--catalog` |
| （同一轮的顺手收口，无会长原话） | ① `byPlatform` 顺序由「首次出现」改成 `PLATFORM_ORDER`（与筛选 chips 同一套顺序表，不再随数据先后抖）；② `dominantCat` 从组件搬进 `scheduleView.dominantCategory()`，筛选 chips 的数与顺序改取 `stats.byContest` / `stats.byPlatform`（消掉组件里那套 `tallyRows`）；③ 显示名兜底统一走 `contestLabel()` —— 它当场抓出「同一个 `club` 在一颗 chip 上叫『协会自办』、在仪表板里写着 `club`」 | `src/utils/scheduleView.js`（三个新导出）、`UpcomingSchedule.vue`（chips 改取统计、删 `tallyRows`/`dominantCat`）、`ScheduleStats.vue` |
| 「**去除第一行的那些场待办 35 本月 25 下月 6 报名中**」 | 仪表板上那条「① 时间与状态」**整行撤掉** —— 现在只剩「赛事与平台」一条带（一格一赛事 + 一格一平台，都带 logo）。那几个数 `scheduleStats()` **仍然照算**（口径只有一份、回归集也仍在钉它），只是不再摆出来；其中「**已自动收起 N 场结束的**」**搬回完整表页脚**（`footParts`）—— 这条信息不能跟着一起消失，否则「表里少了几场」就没人说了。撤掉的 6 条色类在 `schedule-stats.css` 末尾以「已撤」注释原样留档，要拿回来不必重写。⚠ 两个调用点的 `v-if="stats.total"` 一并删掉 —— 有没有格子改由组件自己判 | `ScheduleStats.vue`（删 6 个 span，文件头写恢复说明）、`UpcomingSchedule.vue` 的 `footParts` + 两处调用点、`src/styles/schedule-stats.css` |
| 「『全部勾选线下赛事』『全部勾选线上赛』的按钮文本改成『线上赛』与『线下赛』，并且放到所属行的最前面，并且……三颗按钮都改成可选中式，但是，是关联式的选中，即，其所属的所有按钮都选中时，自动选中，其他时候自动不选。然后处于选中状态点击，全部取消选中，未选中状态点击，全部选中」＋「『全部』按钮要放到两个 `upcoming__cat-row` 上面，然后两个 `upcoming__cat-row` 最前面的纯文本『线下赛事』和『线上平台』的文本都要删除」 | ①「全部」提到**两行之上**、自己占一行；②两行行首的**纯文本标签删掉**，由同名开关「**线下赛**」「**线上赛**」顶上（原先吊在行尾的动作按钮随之消失）；③三颗都是**可选中式**（`.active` + `aria-pressed`），但**自己不存状态** —— 亮不亮由「它管的那组标签是不是全勾上」推出来，点一下是**整组反转**（亮 → 全撤、不亮 → 全勾）。判据抽成两个纯函数 `groupChecked()` / `toggleGroup()`：组件是 SSR 渲染的，node 里点不到按钮，**点击语义只能压在这对纯函数上**（`toggleGroup` 返回**新 Set**、不改入参 —— 原地 `clear/add` 不会触发 Vue 重渲染）。⚠ **空组恒不亮**：线上赛一场都没有时，「线上赛」那颗不许装成「已全选」 | `scheduleView.js` 的 `groupChecked` / `toggleGroup`；`UpcomingSchedule.vue` 的 `allOn` / `contestsOn` / `platformsOn` + `toggleAll` / `toggleContests` / `togglePlatforms`；CSS 里 `.upcoming__cat--all` / `.upcoming__cat--group` 从「虚线动作按钮」改成「主色开关」（选中态由通用规则 `.upcoming__cat.active` 填实色） |
| 「我希望两个行都应该居左」＋「悬停在高亮的『全部』『线上』『线下』按钮上时，文本会看不见」 | 两条都在 CSS 层：① 两行**行首那颗开关**被一条 `margin-left: auto` 推到了行中间（flex 会把 auto 解成像素值报出来 —— 实测开关 `x=213`、行首 `x=53`，肉眼只看到「这两行没居左」），改成 `margin-right: 4px` 即可；② 悬停把选中态冲掉了：那条 hover 与 `.upcoming__cat.active` **特异性完全相同**（都是两个类选择器），**源序在后的赢** —— 选中时一悬停，实色底被换成近乎白的 `rgba(26,115,232,.06)`，而 `color:#fff` 留着不动，**白字落白底**。拆成两条写：未选中的 hover 才配浅蓝底（`:not(.active):hover`），选中的 hover 换深一档的 `--primary-dark`（#0d47a1，白字对比度 **8.63:1**）。⚠ **当时磁盘上这两条其实已经改好了，会长看到的仍是旧样式** —— vite 的 SFC **样式块** HMR 漏了更新（模板已是新版、CSS 停在两版之前：源码里早删掉的 `margin-left: auto` 在浏览器里照样生效），**重启 dev server 才吃到新样式** | `UpcomingSchedule.vue` 的 `.upcoming__cat--group` / `.upcoming__cat--all` 与两条 `:hover`；回归集新增一条：`margin-left: auto` 不许再出现、hover 必须 `:not(.active)` 拆开且带 `--primary-dark` |
| 「圆形 logo 组件与胶囊圆角匹配」 | chip 里的白圆与**胶囊端头同心同曲率**：判据就是同心圆角那一条 —— **内圆角 = 外圆角 − 圆环宽度**。白圆总尺寸由一个变量定（`--cat-logo: 30px`），胶囊上下各 1px 内边距 + 1px 边框 → 高 34px、外圆角 17px；白圆 30px 的 `--radius-full` 被夹到 15px = 17 − 2 ✓。左边内边距同时收到 1px，白圆圆心刚好落在 `x = 17px = height/2`，与端头圆心**重合**（实测：7 颗 chip 逐项相等，浏览器探针 31/31）。白圆从 20px 长到 30px（真图 26px，原先 18px），没有 logo 的三颗开关靠 `min-height: calc(var(--cat-logo) + 4px)` 追平高度 —— 这一版之前是 31 与 32px 参差。⚠ 改尺寸只改 `--cat-logo` 一处；**别再写死 `border-radius: 50%`**（原先白圆半径 10px、端头 16px，两个曲率不一路，就是这么来的） | `UpcomingSchedule.vue` 的 `.upcoming__cat`（变量 + 内边距 + min-height）与 `.upcoming__cat-logo`（`calc(var(--cat-logo) - 4px)` + `var(--radius-full)`）；回归集一条**算术用例**（内圆角必须恰好比外圆角小一个圆环）+ 浏览器探针 `chip-radius.mjs`（盒几何 + 命中测试，31 项） |
| 「我希望现在把各按钮放到一行，这样排布：ICPC CCPC 传智杯 百度之星 线下 全部 线上 .....」 | **整排并成一行**（同日第四版）：顺序 = 线下赛事 chip →「线下赛」开关 →「全部」→「线上赛」开关 → 线上平台 chip。三颗开关**夹在两拨 chip 中间**（位置本身就是语义：左边管线下那串、右边管线上那串、中间的「全部」管两边一起），左右各 3px 自成一小簇；`.upcoming__cat-row` 从三个减到**一个**（回归集与探针都钉这个数）。窄屏由 flex-wrap 折行 —— 实测 1280 宽 **1 行**、1024 与 900 各 2 行，三档都无横向溢出。⚠ 别给单颗开关加 `margin-left: auto`（会把整排推歪，就是同日那条「两个行都应该居左」的成因） | `UpcomingSchedule.vue` 模板 `.upcoming__filters`（单行）+ CSS `.upcoming__cat--all, .upcoming__cat--group { margin: 0 3px }`（第三版那条 `.upcoming__cat--group { margin-right: 4px }` 已删，位置留墓碑注释）；回归集断「顺序 + 只剩一排 + 老规则已删」；探针 `filter-oneline.mjs`（三档宽度量行数 / 顺序 / 溢出，9 项）。⚠ 该版那条 `margin: 0 3px` 已被本节最后一条取代 —— 位置改由**结构**决定 |
| 「**我希望“全部”居中、线上平台部分居右**」 | 一排之内分成**三格**：左组（线下赛事 chip +「线下赛」）｜「**全部**」｜右组（「线上赛」+ 线上平台 chip）。居中的依据是**结构**而不是边距：左右两组都吃 `flex: 1 1 0` —— basis=0 加两份等量 grow，两组拿到的宽度**恰好相等**（实测 1280 宽下 511 / 511），中间那颗因此落在整排正中（实测**偏离行中心 0px**）；右组 `justify-content: flex-end` 贴右（右组右沿 = 行右沿，最后一颗「牛客」就在端头）。⚠ **别用 `margin: auto` 顶**：auto 分掉的是空白，中间那颗的位置会被「左组宽 − 右组宽」带偏（实测左组 490px、右组 408px → 能偏 41px）。两个组容器**恒渲染**（哪怕组里一颗 chip 都没有）—— 少一个，中间那颗就跑到端头去了。窄到一行放不下时（≤1200px，整排内容约 1099px、容器占视口 90%）两组改 `display: contents`，让子元素直接参与整排排布、退回**单流折行**；不这么做会得到「左组折两行 + 全部孤零零一行 + 右组末尾一个词又掉到第三行」（实测 1024 宽：牛客独自一行） | `UpcomingSchedule.vue` 模板（两个 `.upcoming__cat-group` 各包住一拨 chip、「全部」独立在中间）+ CSS `.upcoming__cat-group`（`flex: 1 1 0`、`--offline{flex-start}` / `--online{flex-end}`、组作用域里的开关间距 `margin-left/right: 4px`、末尾 `@media (max-width: 1200px) { display: contents }`）；回归集断「不许 auto 边距 + 两组等宽 + 左组 flex-start + 右组 flex-end + 老规则 `margin: 0 3px` 已删」并加结构断言（左右组各一个、左组含「线下赛」且**不含**「线上赛」、右组排在「全部」之后）；探针 `filter-oneline.mjs` 扩出 `geo`：1280 档量「全部」偏离行中心 ≤ 4px / 两组等宽 / 右组贴右 / 最后一颗贴右，1024·900 档量「最后一行不该只有一个按钮」 |
| 「**我希望“线下赛”“线上赛”“全部”的按钮都宽一些**」 | 三颗范围开关给**下限宽度** `min-width: 96px` + `justify-content: center`（≈ 最小的那颗 chip「牛客」86px 的量级；是**下限**不是定宽，将来文案变长仍撑得开）—— 实测三颗从 60 / 60 / 64px 一律变成 **96px**。**代价是窄屏兜底的断点被顶上来**：加宽后整排内容 = **1058px**（10 颗 chip 宽 + 9×6px 间距），而 1280 宽时容器只有 1099px、加宽前就已经用到 1059 —— 也就是说只要加宽，1280 档就必然折行。断点因此从 1200 上移到 **1340**，依据是**逐 10px 扫视口量真实排版**（新探针 `switch-width.mjs`）：内容装得进只要求视口 ≥ 1236，但两组等宽时左组只分到 (可用 − 96 − 12)/2、得装下它那 512px 才不折行 → **实测视口 ≥ 1330 才是真的一行**（1240~1320 会掉进「左组折两行 + 全部孤零零一行」的三行怪相），断点取 1330 + 10px 余量 = 1340。顺带量到两个页面级事实：**容器宽 = 0.9 × 视口 − 53，封顶 1360**（视口 ≥1570 后不再变宽） | `UpcomingSchedule.vue` 的 `.upcoming__cat--all, .upcoming__cat--group`（`min-width: 96px` + `justify-content: center`）与断点段 `@media (max-width: 1340px)`；回归集新增两条（下限宽度必须还在、有了宽度文字必须居中）并把断点断言从 1200 改成 1340；探针 `filter-oneline.mjs` 的「正片档」从 1280 挪到 **1600**（1280 现在落在窄屏兜底档里 —— 它仍是**一行**（1058 ≤ 1099），只是不再居中），并新增两条「内容装得进一行（需 1058 ≤ 可用 1360）」「容器宽封顶 1360」；新探针 `switch-width.mjs`（逐 10px 扫 1000~2200 找最小一行视口 + 打印每颗 chip 宽度 + 量容器宽随视口的曲线） |
| 「**动画风格需要与官网其他功能统一**」（原话；我先追问「指的是哪一处」，他勾了三条：悬停手感 / 逐条入场太慢 / 筛选瞬间切换） | ① ~~**入场改成整块一次**~~（⚠ **这一版已被下一行推翻**，留档只为说明成因）：行不再各自 `v-reveal` + `--reveal-index`（原先 10 月那组 25 行、最后一行要等 25×0.1s = **2.4s** 才出现，行像挨个滴出来）→ 改用**一次** `v-reveal="'fade-up'"` 罩住整块内容。挂点特意放在 `.upcoming__body` 而**不是** `<section>`：section 在骨架屏阶段就已挂载、IntersectionObserver 那时就触发过了，等数据到位反而一次动画都没有（正是会长看到的「瞬间铺开」）。站内先例 = `CompetitionDetailView.vue:435` 的成绩表（给外层容器挂一次）。② **悬停照抄大事记**：行的上浮从 `transform var(--transition)` + 抬 2px + 中性 `var(--shadow-md)` → `var(--transition-spring)` + 抬 **3px** + `0 10px 32px rgba(26,115,232,.07)`，与 `AllActionView.vue:870-879` 的 `.tl-card` 逐条同源（原先曲线是线性缓动、投影是灰的，抬起来「发死」）。③ **筛选加淡入淡出**：行列表与月份分组各套一层 `<TransitionGroup name="upcoming-fade">`（外层管整月被筛掉的情况，否则行还没淡完分组就先没了），时长与曲线**照抄站内已有的 `.nested-fade`**（`src/styles/base.css:169`：opacity 0.2s ease）——站内此前没有列表过渡的先例，最近的先例就是路由嵌套那段，故沿用同一口径、不另造曲线。④ chip 的过渡属性补上 **`box-shadow`**：大事记 `.cat-chip` 是四个属性，漏了它选中态那条 `0 2px 10px rgba(0,0,0,.12)` 会「啪」地跳出来 | `UpcomingSchedule.vue`（模板两处 `<TransitionGroup>` + `.upcoming__body` 挂点、`rowStyle(row)` 去掉索引参数、行悬停与 chip 过渡、新增 `.upcoming-fade-*` 四条规则）；回归集新增一条「动画口径与站内统一」（还顺手钉住大事记那边仍是抬 3px，防止只改一边）；探针 `anim-check.mjs` 用 CDP 逐项量 |
| 「**现在怎么什么动画都没了**」（原话，紧跟上一行改完之后 —— 我上一版把入场收成「整块一次」做过头了） | **入场还给每一行**（`.upcoming__row` 各挂 `v-reveal="'fade-up'"`），`.upcoming__body` 那个 wrapper 与它的 CSS 规则一并删掉。**为什么整块那版等于「没动画」**：整张表 4000px 长，而它只有 **1 个**入场元素（挂在 `.upcoming__body` 上）—— 数据到位那一瞬淡完就再也没有了，往下滚屏一路都没有入场。⚠ 别再收成整块。<br>**然后浏览器实测又揪出两件事**（一次性诊断探针 `row-entrance.mjs` 打印的原始序列，改前 → 改后）：<br>① **行不带 `--reveal-index`**：原先以为「序号封顶 4 → 最多等 0.4s」是个折中，实测**根本不起作用** —— 行自己的 `transition` 简写（`.upcoming__row[data-v-*]`，特异性 0,2,0）压过了 base.css 的 `[data-reveal][style*="--reveal-index"]`（0,1,0），那条 `transition-delay: calc(var(--reveal-index) * 0.1s)` 连延迟带属性一起被冲掉，浏览器报的是 **`transitionDelay: 0s, 0s, 0s`**。要让它真生效就得给行加 `transition-delay`，而那会**连悬停上浮一起延迟**（序号 4 的行悬停要等 0.4s 才抬起、移开鼠标还要再等 0.4s 才落回）—— 不值得，故**撤掉错位**（行是一行一行滚进视口的，本来也不需要）。<br>② **行的 transition 列表里必须写 `opacity 0.7s ease`**：同一个覆盖还会**吃掉淡入** —— `[data-reveal] { transition: opacity .7s ease, transform .7s ease }` 被行的简写整体顶掉，而行的列表里原先是 `transform, box-shadow, border-color`（**没有 opacity**）⇒ 入场**只有上滑、淡入是瞬跳**（逐帧序列：opacity 一直 `0`、一帧跳到 `1`，同时 transform 从 `ty=40` 弹到 0 还带回弹）。补上 opacity 后同一采样拿到 **11 个中间态**（`0.012 → 0.126 → 0.328 → 0.532 → 0.689 …`）⇒ 才是真的 `fade-up`。站内 `ExcellentView.vue:270` / `LinksView.vue:236,335` / `ContestView.vue:193` 的卡片是同一个写法（它们同样只有位移、没有淡入）—— 我们补上是为了让 base.css 承诺的语义名副其实 | `UpcomingSchedule.vue`（模板 `<li v-for="row in g.rows" v-reveal="'fade-up'">`、`rowStyle(row) = categoryVars(row.category)` 不再带索引、`.upcoming__row` 的 transition 补 `opacity 0.7s ease`、删 `.upcoming__body` 与其 CSS）；回归集那条「动画口径」用例按最终口径重写（行**必须**有 `v-reveal`、**不许**有 `--reveal-index` / `ROW_STAGGER_MAX`、**必须**有 `opacity 0.7s ease`、`.upcoming__body` 不许回来）；探针 `anim-check.mjs` **21 项**（新增「行的过渡含 opacity」「行不带错位延迟」「没有一行带 `--reveal-index`」「屏外最后一行滚动前 `is-visible=false`、`scrollIntoView` 后变 `true` 且**采样到 `0 < opacity < 1` 的中间态**」），另有一次性诊断探针 `row-entrance.mjs`（打印行的 transition 列表 / 延迟 / 入场逐帧序列 / 悬停序列） |
| 「**在近期比赛的详情页不要显示这个 class="sched-stats sched-stats--catalog upcoming__stats"**」 | 完整表页 `/upcoming` 的仪表板**整块撤掉**（import + 模板 + `.upcoming__stats` 外边距规则），顶部现在直接就是筛选 chips；仪表板从此只是**竞赛信息页看板**的东西。⚠ 两处**刻意没跟着删**：① `ScheduleStats.vue` 组件本身（它仍是看板的结构来源，样式体仍在全局 `styles/schedule-stats.css`）；② `UpcomingSchedule.vue` 里的 `stats` computed —— 两行筛选 chip 的**计数与颜色就取自它**（`stats.byContest` / `stats.byPlatform`），删了芯片会全空。撤掉的位置都留了墓碑注释写明「要挂回来加哪两行」 | `UpcomingSchedule.vue`（删 import / 模板块 / `.upcoming__stats`）、`ScheduleStats.vue` 与 `UpcomingBoard.vue` 的文件头注释（「两页共用」→「看板专属」）、回归集改写（新增「完整表页不许再挂仪表板」+ 反向断言 `stat(html,'contest-ccpc') === null`） |
| 「**我希望仍然有逐一出现的动画，并且有卡片离开时，下方的卡片应该向上运动到最终位置**」（原话，紧跟上一行） | ① **逐行错位入场回来了，这次靠 `animation-delay`**（上一行刚把错位撤掉，他觉得「什么动画都没了」）。做法 = `.upcoming__row.is-visible` 跑 `@keyframes upcoming-row-in`（`from { opacity: 0; transform: translateY(24px) }`，0.5s `cubic-bezier(0.22,1,0.36,1)`，**`fill-mode: backwards` 必写** —— 否则延迟期间会先亮一下），延迟 = `calc(var(--reveal-index, 0) * 0.1s)`，序号 = `Math.min(i, ROW_STAGGER_MAX = 4)`（**分组内**下标、封顶 → 最多等 0.4s）。**为什么这次用 animation 而不是 `transition-delay`**：上一行刚实测过 `transition-delay` 会把悬停上浮一起延迟（序号 4 的行悬停要等 0.4s 才抬），而 animation 的延迟只作用于入场 —— 两条需求因此能同时成立。实测：行 `transitionDelay` 全是 `0s`、悬停 120ms 内已抬 `ty=-2.87px`、前 3 行分别在 **40 / 120 / 200ms** 开始变亮（各差约 100ms）<br>② **「下面的滑上来」不靠 FLIP**：`TransitionGroup` 的 `-move` 实测**根本不触发**（`anim2-check.mjs` 第 ⑥ 步：`0` 个 `-move` 类、下方行 `top` 一动不动 `746 → 746`）—— leave 期间离开的行仍占位，而 Vue 只在**数据变更那次渲染**比对位置、DOM 移除却发生在 leave 结束的回调里。改成让**离开行把自己的盒收成 0 高**（`.upcoming__row.upcoming-fade-leave-active { overflow: hidden; max-height: 0; padding-top/bottom: 0; border-top/bottom-width: 0; transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.18s ease }`）：行始终在文档流里，下面的行**每帧**跟着上移，不需要 FLIP。`max-height` 要有可过渡的起点 → 基类 **200px**（桌面行实测 122px）、`≤576px` 断点 **260px**（堆叠布局实测最高 178px；原先统一 160px 时 520 宽下**正好顶到上限**=行被裁住）。移除时机用 `:duration="{ enter: 200, leave: 300 }"` 钉死，别让 Vue 猜 `transitionend`。实测（`anim4-why.mjs`，25ms 采样）：离开行 `opacity 1 → 0.36 → 0.04 → 0`、高度 `119 → 112 → 52 → 15 → 3 → 0`；下方那行 `top 398 → 395 → 389 → 330 → 293 → 284 → 279 → 278`（**9 个中间位置**，不是跳变） | `UpcomingSchedule.vue`（脚本 `ROW_STAGGER_MAX` + `rowStyle(row, i)`；模板 `v-for="(row, i) in g.rows"` 与 `:duration`；CSS `@keyframes upcoming-row-in` + `.upcoming__row.is-visible` + 重写的离开规则 + 基类/断点的 `max-height`）；回归集那条**动画口径**用例按新口径重写；探针 `anim2-check.mjs`（①~⑥）、`anim3-collapse.mjs`（隔离 CSS）、`anim4-why.mjs`（逐帧定案） |

类型键与大事记数据的 `category` 字段**同名同义**：`inv`（邀请赛）/ `reg`（区域赛·全国赛）/ `prov`（省赛·区赛）/
`net`（网络赛）/ `final`（总决赛）/ `tts`（天梯赛）/ `lanqiao` / `chuanzhi` / `baidu` / `raicom`（⚠ 当前被
`HIDDEN_CONTESTS` 整条隐藏，令牌与分类照旧保留）/ `school`（校赛）/ `club`（社团活动）/ `online`（线上赛）/
`other`。中文名两处各一份、顺序同构：`scheduleView.js` 的 `CATEGORY_LABELS` 与 `AllActionView.vue` 的
`CAT_LABEL`。几条容易写反的判据：
**女生专场归 `reg`**（会长 2026-10-02 改的口径，大事记数据仍归 `inv`）、**「暨xx省赛」归 `inv`**
（不因出现「省赛」二字掉进 `prov`）、**网络预选赛归 `net`**。这些类型仍然决定**每一行左边框的颜色**
与 chip 的选中色，但**筛选不再按类型分组**：`filterKeyOf()` 恒返**赛事 slug**，两行 chips
（线下赛事 / 线上平台）的键同形，线上赛只是「另一行」而已（见上面最后一条）。

#### 各赛事官网抓取现状（2026-10-02 逐条实测）

| 源 | 能自动？ | 拿到什么 | 备注 |
|---|---|---|---|
| ICPC（`icpc.pku.edu.cn`） | ✅ | 各区域赛站日期（含南昌站、香港、杭州 EC Final） | 汇总页文件名是**内容哈希**，每次现发现；页尾原文即「暂定」 |
| CCPC（`ccpc.io`） | ⚠️ | 《各场比赛安排》正文里的分站赛日期 | 正文只写 `10.17-18`、**没有年份**，按「不早于今天且最近」补；实测它家 API 会连续 500，故手写层备了一份 |
| 百度之星（`star.baidu.com`） | ✅ | 决赛日期与报名截止 | 唯一一个正文写明「决赛时间为YYYY年M月D日」的国产源 |
| ~~睿抗 RAICOM~~ | — | —— | **2026-10-02 撤掉**（会长：「去除睿抗的 filter，并且最近赛时里也不显示睿抗的比赛」）。原接口 `https://service.raicom.com.cn/api/matches`（毫秒 `enrollstartdate`/`enrollenddate`，只出报名期）；要恢复就把 `gen_schedule.mjs` 里那段墓碑注释整块加回来，并删掉 `scheduleView.js` 的 `HIDDEN_CONTESTS` 里那个 slug |
| 传智杯（`gateway.boxuegu.com`） | ✅ | 程序设计赛道的报名窗口（**日级结构化**） | 比赛日期官网只公布到月份，故不写；其余 15 条赛道（AIGC / 设计类）不收录。⚠ 域名是 `gateway.boxuegu.com`，`dasai.ityxb.com` 只是 301 跳官网 |
| Codeforces / AtCoder | ✅ | 线上赛程 | 时间戳按**东八区**换算后再进表（用构建机时区会在 UTC 机器上差一天） |
| 牛客（`ac.nowcoder.com`，日历接口 `/acm/calendar/contest?month=YYYY-MM`） | ✅ | 牛客自己的场次（周赛 / 挑战赛 / 小白月赛 / 国庆集训派对…） | **只公布当月**：实测 2026-07/08/09 各 23/25/16 场、11 月起恒为 `{"code":0,"data":[]}` → 生成器取「当月 + 后两月」，取到空是**正常**。它是一份**聚合**日历（`ojName` 实测只有 `NowCoder` / `AtCoder`）→ **只收 `ojName=NowCoder`**，AtCoder 交给更权威的 `atcoder` 源（同一场若两个源的 slug 不同，判重键 `contest\\|start` 认不出来，会在表里出现两行） |
| 蓝桥杯（`www.guoxinlanqiao.com`） | ⚠️ 只报不抓 | 新公告的标题与链接 | 第 18 届软件赛日程尚未公布，公告里的日期是自然语言 / 图片附件 → 抽出来等于猜。看到新公告会打印提示，由人写进 `schedule.json` |
| 天梯赛（`gplt.patest.cn`） | ❌ | —— | 官网是 CSR 空壳（所有路由返回同一个壳），接口全在登录态后面（实测 `/api/announcements` → 401），第 12 届日期也尚未公布。一年一届 → 只在 `schedule.json` 里手工维护 |
| 洛谷 / xcpcio | ❌ | —— | 洛谷的 `?_contentOnly=1` 实测已失效（返回空壳 HTML）；xcpcio 是**赛后**榜单镜像，结构上给不出未来赛站 |

抓取纪律：**任何源失败都只 warn、退出码永远 0**（它挂在 `prebuild` 上，官网抽风不能让部署失败）；
各源并行抓、各自超时、失败重试一次；手写与自动对同一赛事给出不同日期时，生成器会打印一条
「请人工核对」—— **它不替人做主**。

#### 回归集

- `test/schedule-view.test.mjs` —— 日期口径：时区、跨月跨年、过期收起、报名优先、排序稳定；
  **赛事类型判据**（含「女生专场归 `reg`」「暨xx省赛归 `inv`」「牛客归线上赛」这类容易写反的）、
  类型变量退回 `other`、**睿抗整条不展示且不计入「已收起」**、**筛选键 `filterKeyOf`**
  （恒为赛事 slug，且**不再是** `reg` 这类类型键）、两行 chips 的**顺序表与兜底名**
  （`CONTEST_ORDER` / `PLATFORM_ORDER` / `CONTEST_LABELS`）、**仪表板口径 `scheduleStats`**
  （总数 / 本月 / 下月 / **按赛事拆 `byContest`（每格带该赛事的类型，顺序 = `CONTEST_ORDER`）** /
  线上赛按平台拆 `byPlatform`（顺序 = `PLATFORM_ORDER`）/ 报名中 / 已收起 / 最近一场，
  且空数据与不传参数都不炸）；另有**两条「范围开关」的纯函数用例**（`groupChecked()`：少一颗就不亮、
  空组恒不亮、传数组也认；`toggleGroup()`：「全勾 → 全撤 / 否则 → 全勾」、连点两次回到原样、
  **返回新 Set 且不改入参**）—— 三颗开关的**点击语义只能在这里测**：
  组件是 SSR 渲染的，node 里点不到按钮
- `test/schedule-parse.test.mjs` —— 两个官网解析器，样本是**官网真实原文**（`西安 10 月17- 18 日`、
  `长春国赛 … 10.17-18`）。官网一改版这里先红，而不是线上静悄悄少几行；
  另有 **xCPC 标准命名 + 白名单**两条（生成器产出的名字必须自己判为规范）
- `test/upcoming-schedule.test.mjs` —— 组件**真渲染**（`vue/compiler-sfc` 现场编译 SFC + SSR 成 HTML）：
  手写优先、线上赛与主表的混排顺序、**筛选 = 一整排**（线下 chips ｜ 三颗范围开关 ｜ 线上 chips，开关夹在两拨中间（默认全勾、三颗都带
  `aria-pressed` 且默认为真、「全部」排在两个 `upcoming__cat-row` **之前**、行首的纯文本行标签已删、
  chip 上带 logo、取消一颗**赛事**只撤那一项
  （同类型的别家赛事不受影响 —— 键是赛事不是类型）、取消一个平台只筛掉那一类、
  **关联式选中**：撤一颗赛事 → 「线下赛」灭而「线上赛」仍亮、「全部」灭；整组撤掉 → 那颗灭、另一颗照旧亮；
  全取消 → 三颗全灭 + 空态提示）、
  行首 logo / 首字母方块 / **平台图标入口**、
  左边框引的是类型色、**睿抗在表与看板里都不出现**（fixture 里特意留了一条睿抗）、**日期戳已撤掉**；
  **完整表顶部**（自带表头已不存在、**仪表板也整块撤掉** —— `bare()` 里一条 `sched-stats` 都不许有、
  类名不许出现在**生效区**、顶部直接就是筛选 chips，而「已收起几场」由页脚接着说）；
  **仪表板形态**一条（样式体只有全局那份：一格竖排 / 顶部 3px 指标色 / 只剩 `contest` + `platform`
  两组指标色类（原「时间与状态」那 6 条**已撤** —— 断言判的是**剔掉注释后的生效区**：不剔就会被
  自己的墓碑注释判红或误判绿）/ `.sched-stats--catalog` 那条带的格子宽度写死 ≥124px
  （不然「Codeforces」被截成「Codef…」）/ 聚合的「线上赛」格与 `--wide` 都已撤掉；
  共用的 `ScheduleStats.vue` 只渲染赛事/平台格、**6 个状态格一个都不再出现**（同样判生效区）、
  每一格都带 `data-stat` 且都是「标签 + 数字」两块、赛事/平台格带 logo 或首字母圆片）；
  **仪表板只挂看板**（完整表页不许再 import / 挂它、谁都不许自己再写一份格子、两页都走 `scheduleStats`、
  `index.css` 引了那份全局样式）；
  一条**动画口径**用例（**每一行**都要 `v-reveal="'fade-up'"`；行要拿到**分组内下标**并挂
  `--reveal-index`（`Math.min(i, ROW_STAGGER_MAX = 4)`）—— 错位**只许**走 `animation-delay`；
  `@keyframes upcoming-row-in` 与 `.upcoming__row.is-visible` 的动画声明（含 `backwards`）逐字在；
  行的 `transition` 里**不许**出现 `transition-delay`（会把悬停上浮一起延迟）；
  行的 `transition` 简写里**必须**有 `opacity 0.7s ease`（不然 `fade-up` 只剩位移、淡入是瞬跳）；
  `.upcoming__body`（「整块入场」那一版）不许再回来；行悬停走 `--transition-spring` 且抬 3px + 主色调投影；
  两处 `<TransitionGroup name="upcoming-fade">`，且**行列表那条**要带 `:duration="{ enter: 200, leave: 300 }"`；
  离开规则要 `overflow: hidden` + `max-height: 0` + 内边距与上下边框一起收，**不许**改成靠 `-move`；
  两档 `max-height` 起点（基类 200px / `≤576px` 的 260px）；chip 的四个过渡属性齐全）；
  另有一组**看板**用例（白卡是指向 `/upcoming` 的链接、**2 场非线上 + 2 场线上共 4 行**、
  两拨合起来按开赛日排、`limit` / `onlineLimit` 各压到 1 时只剩 2 行（不是先到先得的 4 条）、
  仪表板在第一行之前且**每个赛事/平台各有自己的 `data-stat`**、
  **6 个状态格的 `data-stat` 全为 `null`**（「第一行撤掉」这件事的回归口径）、聚合的「线上赛」格已不存在）、
  一条**看板版式与「全年赛程」
  数值一致**的用例（`h2` 字号 / 说明行字号 / 卡内边距 / 卡阴影四组数值两边相等 —— 抄错一个数就红），
  以及「路由 / 页脚 / 看板三处对得上、顶部导航不含它」
  - ⚠ 写断言时七个坑（都踩过）：① 数字**按 `data-stat` 取、别按文案** —— 仪表板把「共 6 场待办」
    拆成「场待办」+「6」两截渲染，按整句的断言整批失效（原先那个 `flat()` helper 就是干这个的，
    现在没有调用点了，已删）；② Vue 的 dev 构建**保留模板注释** → 判「某元素还在不在」要先剥注释
    （`bare()`），否则我写在模板里的墓碑注释会被当成「元素还在」；③ 别拿「源码里有没有旧文案」当
    负向断言 —— 文件头与模板注释里正引着旧写法，会命中自己的说明文字；④ **判 CSS/模板的「生效区」
    要连注释一起剥**（`/* */`、`<!-- -->`）—— 「已撤」的色类与格子写法正是以注释形式留档的，
    不剥等于拿注释当代码判（2026-10-02 撤第一行时踩到：`.sched-stat--total {` 就躺在注释里）；
    ⑤ **源码改了 ≠ 页面改了** —— vite 的 SFC **样式块** HMR 会漏（实测：模板已是新版、CSS 还停在两版之前，
    源码里早删掉的 `margin-left: auto` 在浏览器里照样生效）。判「浏览器到底跑的是哪版样式」用 CDP
    `CSS.getMatchedStylesForNode`（把命中规则连来源一起打出来，探针 `filter-rule.mjs`），**修法是重启 dev server**；
    ⑥ **验悬停必须真鼠标**（`Input.dispatchMouseEvent` + 等过渡跑完）—— `CSS.forcePseudoState` 强制出来的 `:hover`
    **不反映到页面的 `getComputedStyle`**，于是「白字浅底」那条断言**假通过**（选中态本来就是白字蓝底，怎么写都过），
    探针 `switch-hover.mjs` 里两种都留着做对照；
    ⑦ **探针里注入浏览器的代码是 Node 的模板字符串**：正则要写 `\\d`（写成 `\d` 会被当成未识别转义吞成 `d`，
    断言于是永远差一个字符却看着像产品 bug）、注释与字符串里**不能出现反引号或 `${}`**（我曾在注入的注释里写
    一个反引号，直接把模板字符串截断成 `SyntaxError: Invalid or unexpected token`）—— 本轮两条都是这么踩的；
    ⑧ **`transitionTimingFunction` 的字符串里带逗号**（`cubic-bezier(0.34, 1.56, 0.64, 1), ease, ease`）→
    按逗号切分会把曲线切成四段，「弹簧曲线对不对」那条断言于是**假失败**（探针 `anim-check.mjs` 第一版就这么红的）：
    曲线要按**整串**搜，只有 `transitionDuration` 那种纯数值列表才敢按逗号切；
    ⑨ **自带 `transition` 简写的元素挂 `v-reveal` ⇒ 淡入与错位序号会一起失效**：`.my-row[data-v-*]`（0,2,0）
    压过 base.css 的 `[data-reveal]`（0,1,0），简写里**没列出的属性不会过渡**、`transition-delay` 也被一起重置
    （实测行 `transitionProperty: transform, box-shadow, border-color`、`transitionDelay: 0s, 0s, 0s`）——
    于是 `fade-up` 只剩上滑、`--reveal-index` 写了等于没写。站内 `ExcellentView.vue:270` /
    `LinksView.vue:236,335` / `ContestView.vue:193` 全是这个写法（它们同样只有位移、没有淡入）。
    **判据**：CDP 读 `getComputedStyle` 的 `transitionProperty` / `transitionDelay`；
    **验「渐变还是瞬跳」必须采样中间态**（`0 < opacity < 1`），只看终值分不出（探针 `row-entrance.mjs`）；
    ⑩ **`getAnimations()` 对已播完的 CSS 动画返回空数组**（没有 fill-forwards 就不再「relevant」）→
    判「动画有没有挂上」要读 `getComputedStyle().animationName / animationDelay / animationFillMode`
    （我第一版按 `getAnimations()` 判，7 行全报 `null`，差点当成「动画没生效」）；另外 Vue **会给
    keyframes 名字加 scope 后缀**（实测 `upcoming-row-in-72f9d6a1`），断言按前缀匹配、别写全等；
    ⑪ **采样列表里的元素必须按稳定属性锁定**：被删的行一离开 DOM，`querySelector('[class*="upcoming-fade-leave"]')`
    就每帧换成**另一个**元素 —— 我据此得出过两个假结论：「淡出是瞬跳」（真值是 `1 → 0.36 → 0.04 → 0`）与
    「`:duration` 没生效」（把行列表那条临时改成 `leave: 900` 后，行在 275ms 仍在 ⇒ 其实生效）。
    做法：进页先给每行打 `data-probe-i`，之后一律 `querySelector('[data-probe-i="k"]')`；
    同理，判「下方的行有没有动」要挑**第一颗被删行之后**的那一行（挑在它之前的本来就不该动，
    我在第一版里就这么误判过一次）

四个文件共 **51 条**（18 + 9 + 23 + 1），加上 `honor-scoring.test.mjs` 的 12 条合计 **63 条**，
都在 `npm test` 里；改过 `scheduleView.js` / `schedule-parse.mjs` /
`UpcomingSchedule.vue` / `UpcomingBoard.vue` / `platforms.json` / `styles/schedule-stats.css`
先跑 `npm run verify`。

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
