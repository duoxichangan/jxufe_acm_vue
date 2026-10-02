# scripts/ —— 生成器、校验与一次性工具

> 这个目录里混着**五类**东西（构建链 / 按需生成器 / 共用库 / 一次性工具 / 数据源），
> 动手前先看这张表。分类依据是「谁跑它」，不是扩展名。
> 站点运行时的数据都在 `public/data/`；这里只有**生成它们的东西**与历史工具。

## 一、构建链（每次构建都会跑；`dev` 只跑前两个）

`package.json` 里这两条钩子**不再是同一条链**（2026-10-01 起有意分开）：

```bash
# predev  —— 只跑确定性的生成器，不碰网络
node scripts/gen_group_wall.mjs && node scripts/gen_event_badges.mjs

# prebuild —— 再多一步「抓各赛事官网」，使每次部署都把线上赛程刷成最新
node scripts/gen_group_wall.mjs && node scripts/gen_event_badges.mjs && node scripts/gen_schedule.mjs
```

> `predev` 少那一步是有意的：抓取要出外网（最坏 30 秒、八个源），而 `npm run dev` 是高频动作；
> 那份数据缺了页面也能用（自动降级成只显示手写层）。要补齐就在本地跑一次 `npm run data:schedule`。

| 文件 | 产出（都被 `.gitignore` 忽略） | 说明 |
| --- | --- | --- |
| `gen_group_wall.mjs` | `public/data/group_wall.json`、`group_wall.manifest.json` | 协会成员墙：把 `competitions.json` / `awards/*.json` / `members.json` / `leaders.json` / `duties.json` / `scholarships.json` / `hero_wall.json` / `group_members.json` 合成每格的头像、标签与综合分 |
| `gen_event_badges.mjs` | `public/data/event_badges.json` | 大事记时间轴的奖牌徽章（`badges` 与 `tiers` 两个键集必须完全相同） |
| `gen_schedule.mjs` | `public/data/schedule.auto.json` | 近期赛事时间表的**自动层**：抓 CCPC / ICPC 北京总部 / 百度之星 / 传智杯 / Codeforces / AtCoder / **牛客竞赛日历** 的公开接口与页面（蓝桥杯只报公告不抽日期；天梯赛与洛谷没有可用公开源，只能手工维护）。⚠ **睿抗源 2026-10-02 已撤**（会长要求不显示睿抗；`scheduleView.js` 的 `HIDDEN_CONTESTS` 也把它整条滤掉），恢复办法写在源数组那段墓碑注释里。⚠ 牛客那份日历是**聚合**的（也列 AtCoder），只收 `ojName=NowCoder`，且官方**只公布当月**（下月起恒为空，不是故障）。**任何源失败都只 warn、退出码恒为 0** —— 它挂在 `prebuild` 上，官网抽风不能让服务器构建失败；`SCHEDULE_SKIP_FETCH=1` 可整体跳过 |
| `lib/data-io.mjs` | —— | 两个墙生成器共用的读取：`readJsonRequired`（缺文件 / 坏 JSON 就停下并指名是哪份、谁要的、怎么补）与 `readJsonOptional`（回落但**必须** warn） |
| `lib/schedule-parse.mjs` | —— | 上一条用的日期 / HTML 解析：东八区换算、无年份日期的补年规则、ICPC 与 CCPC 两个官网的行解析。回归样本是官网**真实原文**，见 `test/schedule-parse.test.mjs`。另有 **xCPC 场次的标准命名**（`ccpcStandardName` / `icpcStandardName` / `ccpcStageOf`）与标准形式**白名单** `XCPC_TITLE_RES` —— `check_awards.mjs` 用它给 `schedule.json` 的标题打提示（只 warn），生成器与校验器因此永远看同一份正则 |

## 二、按需生成器（`npm run …` 手动跑）

| npm script | 文件 | 什么时候跑 |
| --- | --- | --- |
| `data:check` | `check_awards.mjs` | 改完 `public/data/` 必跑。只读校验：`SCHEMA` 登记、字段、条数、跨文件一致性。**新增 awards 文件要先去它的 `SCHEMA` 登记**，否则报「未在 schema 中登记」 |
| `data:gen` | `gen_events_articles.mjs` | 改 `scripts/source/` 之后重跑（幂等，结果一致） |
| `data:hero-wall` | `gen_hero_wall.mjs` | 给首页留言墙补**空条目**，已有条目一个字都不动（`hero_wall.json` 是会长手写的真源，别拿它当生成物） |
| `data:group-wall` | `gen_group_wall.mjs` | 只想重生成成员墙、不跑整条 `prebuild` 时 |
| `data:event-badges` | `gen_event_badges.mjs` | 同上 |
| `data:schedule` | `gen_schedule.mjs` | 想立刻刷新近期赛事时间表时（本地开发 / 部署前手动跑）；`npm run data:schedule -- --dry` 只打印不落盘 |
| `data:hero-thumbs` | `gen_hero_wall_thumbs.ps1` | 首页那批真源照片换过之后（本地 Windows 专用） |
| `data:group-thumbs` | `gen_group_wall_thumbs.ps1` | 成员墙原图换过之后（源取自 `group_wall.json` 的 `tiles`，原图分散在 `group_members/full`、`excellent_member`、`leader` 三处） |

两个缩略图脚本都 dot-source 了 `lib/thumbs.ps1`，**只差「源从哪来」**——
改缩放 / 编码参数改那一份就够了（`Resize-One` 单张、`Write-ThumbSet` 批量 + 增量跳过 + 统计）。

## 三、共用库 `lib/`

- `data-io.mjs` —— 见上表。
- `schedule-parse.mjs` —— 见上表（只被 `gen_schedule.mjs` 与 `check_awards.mjs` 用；纯函数、不发请求，所以测得动）。
  它是 **xCPC 命名与白名单的唯一定义处**：改标准写法只改这里（`ccpcStandardName` + `XCPC_TITLE_RES` 一起改），
  生成器产出的名字与校验器认的名字才不会分叉。
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
   `scripts\gen_group_wall.mjs`、`scripts\gen_event_badges.mjs`、`scripts\gen_schedule.mjs` 四项。
   其余脚本**不要**加进去：服务器只跑构建，不需要校验器与一次性工具。
   ⚠ `deploy.bat` 里还有**第二份**同样的清单：第 2 步的「未提交改动守卫」
   （`git status --porcelain -- …`）。加了新脚本只改 `UPLOAD_ITEMS` 会让守卫漏掉它 ——
   于是没提交的脚本也会被传上服务器，构建出「本地根本没提交过」的产物。
2. 构建链跑 `gen_group_wall.mjs` + `gen_event_badges.mjs`（`predev` / `prebuild` 同串）
   + `gen_schedule.mjs`（**只在 `prebuild`** —— 它要出外网，理由见第一节），
   别把需要人工确认的脚本挂上去。
3. 生成物（`public/data/group_wall.json`、`event_badges.json`、`excellent_members.json`）
   一律不要手改，跑生成器；`public/data/` 下哪些入库、哪些忽略见仓库根 `.gitignore` 的注释。
4. 改完口径 / 数据先跑 `npm run verify`（= `data:check` + `node --test` 的回归集），
   再按 `README.md` 对应章节的说明提交。回归集在 `test/`，改动计分口径前**先跑一遍**。
