/**
 * 跨组件的 DOM 标记：**一个组件写在 `<body>` 上、别的文件去读**的那个类名。
 *
 * 全项目只有这一条（2026-09-24 复查过一遍：grep 所有 body / html 状态类，逐个看写方与读方）：
 *
 *   BODY_WALL_SHEET 「成员卡（浮窗）打开中」
 *     写方：`src/components/HeroAvatarWall.vue` 的 lockPage()（toggle，顺带锁掉 body 的 overflow）
 *     读方①：`src/composables/useSectionSnap.js` 的 sheetOpen() —— 浮窗开着时滚轮归浮窗自己，
 *            吸附不许 preventDefault，否则浮窗正文滚不动
 *     读方②：组件自己的全局 CSS `body.hero-wall-sheet .floating-join-button`（藏掉悬浮球）——
 *            那一处**只能写字面量**（自定义属性拼不进选择器），改名时一起改
 *
 * ⚠ 下面这几个**故意不在这里导出**：它们在新 master 上是单文件自用（写方读方都在
 *   `HeroAvatarWall.vue` 里），导出只会多一层跳转：
 *     · `hero-wall-present`（本页有头像墙 → 影响手机端 hero 高度的布局规则）
 *     · `hero-wall-on`（进 / 退墙的过渡态）
 *     · `#app > header`（顶部导航栏，headerBottom() 用；同文件的 CSS 也读它）
 *   将来若真有别的文件要读它们，再挪进来 —— **判据是「写方与读方分处不同文件」**。
 *   （2026-09-24 之前 `hero-wall-sheet` 的第二个 JS 读方在 `useMaskReveal.js`；那套遮罩机制已被
 *   `efb797c` 撤掉，读方换成了 `useSectionSnap.js` —— 这条契约本身没有消失。）
 */

/** 成员卡（浮窗）打开中：HeroAvatarWall 写 → useSectionSnap 读 → 全局 CSS 读 */
export const BODY_WALL_SHEET = 'hero-wall-sheet'
