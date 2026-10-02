# scripts/ —— 生成器、校验与一次性工具

> 这个目录里混着**五类**东西（构建链 / 按需生成器 / 共用库 / 一次性工具 / 数据源），
> 动手前先看这张表。分类依据是「谁跑它」，不是扩展名。
> 站点运行时的数据都在 `public/data/`；这里只有**生成它们的东西**与历史工具。

## 一、构建链（`npm run dev` / `npm run build` 每次都会跑）

`package.json` 的 `predev` 与 `prebuild` 是同一条链：

```bash
node scripts/gen_group_wall.mjs && node scripts/gen_event_badges.mjs
```

| 文件 | 产出（都被 `.gitignore` 忽略） | 说明 |
| --- | --- | --- |
| `gen_group_wall.mjs` | `public/data/group_wall.json`、`group_wall.manifest.json` | 协会成员墙：把 `competitions.json` / `awards/*.json` / `members.json` / `leaders.json` / `duties.json` / `scholarships.json` / `hero_wall.json` / `group_members.json` 合成每格的头像、标签与综合分 |
| `gen_event_badges.mjs` | `public/data/event_badges.json` | 大事记时间轴的奖牌徽章（`badges` 与 `tiers` 两个键集必须完全相同） |
| `lib/data-io.mjs` | —— | 两个生成器共用的读取：`readJsonRequired`（缺文件 / 坏 JSON 就停下并指名是哪份、谁要的、怎么补）与 `readJsonOptional`（回落但**必须** warn） |

## 二、按需生成器（`npm run …` 手动跑）

| npm script | 文件 | 什么时候跑 |
| --- | --- | --- |
| `data:check` | `check_awards.mjs` | 改完 `public/data/` 必跑。只读校验：`SCHEMA` 登记、字段、条数、跨文件一致性。**新增 awards 文件要先去它的 `SCHEMA` 登记**，否则报「未在 schema 中登记」 |
| `data:gen` | `gen_events_articles.mjs` | 改 `scripts/source/` 之后重跑（幂等，结果一致） |
| `data:share` | `gen_postgraduate_share.mjs` | 保研经验分享（多作者大事记文章）：**加/改分享人之后重跑**。原文是**仓外**的 Markdown（默认桌面 `share\`，`file:` / `--source` 可换），转换逻辑、分享人登记表 `SHARE`、置顶开关 `PINNED` 都在脚本里（`PINNED: true` → 卡片进 `top.json`，年份文件里的同名卡片由脚本摘掉）。**刻意不挂进 `predev`/`prebuild`**：服务器上没有那些 md，挂了就会构建失败；正文已落进 `public/data/events/2026.json`，一次生成、长期有效 |
| `data:hero-wall` | `gen_hero_wall.mjs` | 给首页留言墙补**空条目**，已有条目一个字都不动（`hero_wall.json` 是会长手写的真源，别拿它当生成物） |
| `data:group-wall` | `gen_group_wall.mjs` | 只想重生成成员墙、不跑整条 `prebuild` 时 |
| `data:event-badges` | `gen_event_badges.mjs` | 同上 |
| `data:hero-thumbs` | `gen_hero_wall_thumbs.ps1` | 首页那批真源照片换过之后（本地 Windows 专用） |
| `data:group-thumbs` | `gen_group_wall_thumbs.ps1` | 成员墙原图换过之后（源取自 `group_wall.json` 的 `tiles`，原图分散在 `group_members/full`、`excellent_member`、`leader` 三处） |

两个缩略图脚本都 dot-source 了 `lib/thumbs.ps1`，**只差「源从哪来」**——
改缩放 / 编码参数改那一份就够了（`Resize-One` 单张、`Write-ThumbSet` 批量 + 增量跳过 + 统计）。

## 三、共用库 `lib/`

- `data-io.mjs` —— 见上表。
- `thumbs.ps1` —— GDI+ 缩放的唯一实现（两面墙的缩略图脚本共用）。

> ⚠ `.ps1` 一律 **UTF-8 带 BOM + CRLF**。PowerShell 5.1 只有看见 BOM 才按 UTF-8 解析；
> 缺 BOM 时它按 ANSI(GBK) 读，脚本里的中文会把字符串提前截断、直接解析失败
> （实测：用工具重写 / 归一化行尾时最容易踩，报错还是错位的乱码）。
> `.gitattributes` 已钉 `*.ps1 text eol=crlf`；BOM 得靠写文件时带 `UTF8Encoding($true)`。

## 四、一次性工具（`.cjs`，历史任务用过，留着以备重跑）

**都不参与构建、也没被任何 npm script 引用。** 多数依赖 `sharp` / `xlsx` 等
**非项目依赖**（项目 `package.json` 里没有，用 `npm install --no-save sharp xlsx` 临时装）。
除 `verify_members.cjs` 外都支持 `--apply`：**不给参数时只打印计划、不落盘**。

| 文件 | 干什么 |
| --- | --- |
| `rename_excellent_member.cjs` | 把 `public/images/excellent_member/` 的图片改名成学号（判据 = `members.json` + 全校学生信息导出的「姓名 → 学号」） |
| `update_members_photo.cjs` | 把 `members.json` 的 `photo` 指向本地 `excellent_member/<学号>.png`（逐行字面替换，格式保持不变） |
| `fetch_member_photos.cjs` | 把 11 位仍留在图床（imgdb.cn）的照片下载到本地并存成 PNG |
| `fetch_remote_member_photos.cjs` | 同上，处理其余仍为远程 URL 的成员（学号解析不到时用拼音缩写命名） |
| `normalize_member_images.cjs` | 把「JPEG 字节却叫 .png」的文件就地转成真 PNG（尺寸不变、像素 1:1） |
| `gen_member_report.cjs` | 由当前状态重新生成 `excellent_member_rename_report.csv` |
| `verify_members.cjs` | 收尾核对：`members.json` 与 `excellent_member/` 是否一一对上（含与 `default.png` 的 sha256 比对） |

它们留下的产物（**已入库，别手改**）：`excellent_member_rename_report.csv`、
`member_photo_fetch_result.json`、`remote_photo_fetch_result.json`。

## 五、数据源 `source/`

`gen_events_articles.mjs` 的输入（**不参与运行时**，站点读的是 `public/data/`）：

- `source/editions/gplt/<年>.json` —— 天梯赛：国赛 / 省赛 × 高校奖 / 团队奖 / 个人奖 + scale
- `source/editions/lanqiao/<年>.json` —— 蓝桥杯：国赛 / 省赛 × 个人奖（含科目、排名）
- `source/baidu.json` —— 百度之星：决赛 / 初赛场次 × 获奖名单（含排名）

## 规矩（改这个目录之前）

1. **新增共用模块放 `lib/`**，并确认 `deploy.bat` 的 `UPLOAD_ITEMS` 带上它 ——
   目前那里是 `scripts\lib`（整个目录，所以以后往 lib 里加模块不用再改清单）、
   `scripts\gen_group_wall.mjs`、`scripts\gen_event_badges.mjs` 三项。
   其余脚本**不要**加进去：服务器只跑构建，不需要校验器与一次性工具。
2. 构建链**只**跑 `gen_group_wall.mjs` + `gen_event_badges.mjs`（`predev` / `prebuild` 同串），
   别把需要人工确认的脚本挂上去。
3. 生成物（`public/data/group_wall.json`、`event_badges.json`、`excellent_members.json`）
   一律不要手改，跑生成器；`public/data/` 下哪些入库、哪些忽略见仓库根 `.gitignore` 的注释。
4. 改完口径 / 数据先跑 `npm run verify`（= `data:check` + `node --test` 的回归集），
   再按 `README.md` 对应章节的说明提交。回归集在 `test/`，改动计分口径前**先跑一遍**。
