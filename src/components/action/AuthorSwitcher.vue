<script setup>
/**
 * 多作者文章（大事记）的「换个人看」切换器。
 *
 * 一条大事记 = 一篇文章，文章里 `authors: [...]` 可能有好几位分享人；
 * 正文一次只显示一位（每位都是长篇，并排不可读），这里只负责选人。
 *
 * 每个 tag 上写「展示名 · 年级 · 最终去向」：选谁、他是哪一级、去了哪，一眼看到底，
 * 不再另起一行说明（队伍、专业排名这些字段仍在数据里，只是不上屏）。
 *
 * 分段控件复用站内既有的 `.view-toggle` / `.view-btn`（view-toggle.css），
 * 与「表格 / 卡片」视图切换、优秀成员页的荣誉视图同源 —— 会长 2026-09-23
 * 明确要求复用这套样式，不要另造一套。这里只是把「切换视图」换成「切换人」。
 *
 * 数据越简单越稳：只吃 `{ name, grade?, final? }`，哪段没有就不显示哪段。
 * 加第三位分享人时改的是数据（events/<年>.json 的 authors），这个文件不用动。
 */
import { computed } from 'vue'

const props = defineProps({
  authors: { type: Array, required: true },
  active: { type: Number, default: 0 }
})
const emit = defineEmits(['select'])

const textOf = (v) => String(v || '').trim()
/** tag 上名字后面的两段小字（年级、去向），都缺就只剩名字 */
const tailOf = (a) =>
  [
    { kind: 'grade', text: textOf(a.grade) },
    { kind: 'final', text: textOf(a.final) }
  ].filter((t) => t.text)

const current = computed(() => props.authors[props.active] || null)

/** 键盘左右方向键切人（分段控件既有的无障碍预期） */
function onKeydown(e) {
  const last = props.authors.length - 1
  if (e.key === 'ArrowRight' && props.active < last) emit('select', props.active + 1)
  else if (e.key === 'ArrowLeft' && props.active > 0) emit('select', props.active - 1)
  else if (e.key === 'Home') emit('select', 0)
  else if (e.key === 'End') emit('select', last)
}
</script>

<template>
  <section class="author-switch" aria-label="分享人">
    <span class="as-label"><i class="fa-solid fa-user-pen"></i> 分享人</span>

    <div class="view-toggle as-toggle" role="tablist" aria-label="切换经验分享人" @keydown="onKeydown">
      <button
        v-for="(a, i) in authors"
        :key="a.name"
        type="button"
        role="tab"
        class="view-btn as-btn"
        :class="{ active: i === active }"
        :aria-selected="i === active"
        :tabindex="i === active ? 0 : -1"
        :title="[a.group, a.meta, textOf(a.grade), textOf(a.final)].filter(Boolean).join(' · ')"
        :data-author="a.name"
        @click="emit('select', i)"
      >
        <i class="fa-solid fa-user-graduate"></i>
        <span class="as-name">{{ a.name }}</span>
        <span v-for="t in tailOf(a)" :key="t.kind" class="as-tail" :class="`as-tail--${t.kind}`">{{ t.text }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* 控制条做成一张浅色卡：切换器是正文之前的一道「选人」关口，别让它浮在文章里 */
.author-switch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px var(--space-md);
  margin: 0 0 var(--space-xl);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, rgba(26, 115, 232, 0.05), rgba(26, 115, 232, 0.015));
  border: 1px solid rgba(26, 115, 232, 0.1);
  border-radius: var(--radius-lg);
}
.as-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-muted);
}
.as-label i {
  color: var(--primary);
}
.as-toggle {
  background: #fff;
  /* 人多了自动换行，而不是把控件撑出卡片 */
  flex-wrap: wrap;
  max-width: 100%;
}
.as-btn {
  font-size: var(--font-size-sm);
  padding: 7px 16px;
  max-width: 100%;
}
.as-name {
  white-space: nowrap;
}
/* 名字后面的小字（年级 / 去向）：各段自己带分隔线，缺哪段都不会留下多余的竖线。
   选中态按钮是深蓝底，所以两种底色各给一套颜色 */
.as-tail {
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.as-tail--final {
  color: var(--text-light);
}
.as-btn.active .as-tail {
  border-left-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.82);
}
.as-btn.active .as-tail--final {
  color: #fff;
}

@media (max-width: 768px) {
  /* ── 手机端：一人一行，且要有「可点的列表」的样子 ──
     桌面那套（横排胶囊 + 名字/年级/去向各占一段）在 375px 上排不下：一个 tag 要装三段文字，
     只会折成三行、文字溢出到胶囊外。所以手机端换布局：
       · 一人一行，行与行之间用细分割线断开（三行挨在一起会糊成一坨）
       · 行内第一排：图标 + 名字 + 年级；第二排：去向
       · 选中的人**不做成一颗大蓝胶囊**：整行铺满再加上 9999px 圆角，在这个尺寸下既笨重、
         又跟卡片的 15px 圆角打架。改成「极淡蓝底 + 左侧一条主色竖条」——
         整行仍然是点击区，但重量只有原来的一小块，和站内其它卡片同一套语言。 */
  .author-switch {
    display: block; /* 桌面是「一行：标签 + 控件」，手机改成竖排两段 */
    padding: 0;
    border-radius: var(--radius-md);
    overflow: hidden; /* 让选中行的淡蓝底不越过卡片圆角 */
  }
  /* 「分享人」：三行名字摆在那儿，没有这行提示就不知道能点。做成卡片的表头条 */
  .as-label {
    display: flex;
    margin: 0;
    padding: 11px 14px;
    border-bottom: 1px solid rgba(26, 115, 232, 0.1);
    background: rgba(26, 115, 232, 0.04);
  }
  /* 白底容器整个去掉：它只是桌面横排胶囊的视觉容器，竖排之后既多余、圆角又会打架 */
  .as-toggle {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    width: 100%;
    gap: 0;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
  }
  /* 行：图标 + 名字 + 年级一行，去向换第二行（flex-wrap + 100% basis 换行最稳） */
  .as-btn {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    text-align: left;
    width: 100%;
    max-width: 100%;
    min-width: 0; /* 没有它，ellipsis 不会生效 */
    padding: 11px 14px;
    font-size: var(--font-size-base);
    /* 圆角收到「卡片圆角 - 内容内边距」以内（12 - 14 取 0），才不会出现里外两套圆角 */
    border-radius: 0;
    /* 行与行之间的分隔线；最后一行由 :last-child 去掉 */
    border-top: 1px solid rgba(26, 115, 232, 0.08);
  }
  .as-btn:first-child {
    border-top: 0;
  }
  .as-btn.active {
    background: rgba(26, 115, 232, 0.07);
    box-shadow: none; /* 换掉分段控件的投影：这里是列表的一行，不是浮起来的胶囊 */
    /* 选中标记：左侧一条主色竖条（站内 L3 小标题用的同一套语言） */
    border-left: 3px solid var(--primary);
    padding-left: 11px; /* 14 - 3：让文字位置不因竖条而挪动 */
    color: var(--primary-dark);
  }
  .as-btn > i {
    flex: 0 0 auto;
    margin-right: 7px;
    align-self: center;
    font-size: 0.82rem;
  }
  .as-name {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  /* 年级、去向：手机端一律不要桌面那段左分隔线 */
  .as-tail {
    margin-left: 0;
    padding-left: 0;
    border-left: 0;
  }
  .as-tail--grade {
    flex: 0 0 auto;
    margin-left: 7px;
    font-size: 0.74rem;
  }
  /* 去向：独占整行（flex-basis:100% 强制换行），行高放松一点，别贴着名字 */
  .as-tail--final {
    flex: 1 0 100%;
    margin-top: 3px;
    font-size: 0.76rem;
    line-height: 1.5;
  }
  /* 选中行的两段小字：桌面那套是为「深蓝底 + 白字」写的，这里底色是淡蓝，得换成主色系 */
  .as-btn.active .as-tail {
    color: var(--primary);
  }
  .as-btn.active .as-tail--final {
    color: var(--primary-dark);
    font-weight: 600;
  }
}
</style>
