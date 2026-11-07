<script setup>
/**
 * 荣誉标签序列（优秀成员页 / 协会负责人页共用）。
 *
 * 为什么有这个组件：这段模板原先在两页里各有一份**逐字相同**的拷贝，导致六个提交
 * （7332ab0 / 9bda135 / eb5c6e7 / 2be4981 / f41d06a / e1c5946）都必须同时改两个文件，
 * 而两页的 @keyframes ring-spin 时长也因此漂成了 5s / 4s（会长 2026-09-23 审查发现）。
 *
 * 顺序（会长裁定）：协会职务（绿）→ 比赛战绩（蓝，三种显示模式）→ 手写荣誉（按类型分色）。
 * 颜色与几何全在 styles/honors.css，本组件不带样式。
 *
 * 容器（.honor-tags / .achievement-tags）**留在各页** —— 两页排布并不相同
 * （优秀成员页居中、负责人页靠左、窄屏才居中），所以这里只渲染标签本身。
 *
 * ⚠ 两条随之搬到全局 styles/honors.css 的规则（不是风格问题，是 scoped 的硬约束）：
 *   · `.medal-emoji` —— 明细模式的奖牌间距；
 *   · 卡片 hover 时胶囊加深。
 *   标签改由子组件渲染后，页面 scoped 选择器（编译成 `.medal-emoji[data-v-页]`）匹配不到它们。
 *   过去能生效，是因为这段模板由页面自己编译、slot 内容带着页面的 data-v。
 */
import { computed } from 'vue'
import { HONOR_TYPE_LABELS } from '../utils/honorType'
import { pillPartsForName, recordsToDetails } from '../utils/honorPills'
import HonorPill from './HonorPill.vue'

const props = defineProps({
  /** 荣誉的主人（members.json / leaders.json 的一条）。只用它的 name 查记录 —— **按真名匹配**，
      对外显示名是另一回事（displayName 只影响渲染，见 utils/honorType.js 的匿名机制说明）。 */
  person: { type: Object, required: true },
  /** loadHonorRecords() 得到的 Map<真名, 记录[]>；两页共用同一份缓存，切换模式不重新取数 */
  records: { type: Object, default: () => new Map() },
  /** 已归一化的手写荣誉 [{ text, type }]。两页的字段名不同（honors / achievements），由各页传入 */
  honors: { type: Array, default: () => [] },
  /** 协会职务胶囊 [{ year, role, text }]，来自 /data/duties.json。
      两个页面都传（2026-09-24 起）—— 负责人页原先漏传，职务胶囊在那页永不显示。 */
  duties: { type: Array, default: () => [] },
  /** 显示模式：count / icons / detail（定义见 utils/honorView.js） */
  view: { type: String, default: 'count' },
})

/** 汇总胶囊：一枚 = 若干段，折行只发生在段间（口径见 utils/honorPills.js 的 recordsToPillParts） */
const pillParts = computed(() => pillPartsForName(props.records, props.person?.name, props.view))

/** 明细：逐条赛事全名 + 奖牌说法（按时间降序；同场双奖的标题已加限定词） */
const details = computed(() => recordsToDetails(props.records?.get?.(props.person?.name) || []))
</script>

<template>
  <span
    v-for="(d, i) in duties.filter(d => !/协会|会长/.test(d.text))"
    :key="`duty-${i}`"
    class="honor-tag honor-tag--honor"
    :title="HONOR_TYPE_LABELS.honor"
    >{{ d.text }}</span
  >
  <template v-if="view === 'detail'">
    <HonorPill v-for="(d, i) in details" :key="`detail-${i}`" :title="`${d.title}${d.medalText}`">
      <span class="honor-tag__seg"
        ><span class="medal-emoji" aria-hidden="true">{{ d.emoji }}</span
        >{{ d.title }}</span
      >
      <span class="honor-tag__seg">{{ d.medalText }}</span>
    </HonorPill>
  </template>
  <template v-else>
    <HonorPill
      v-for="(parts, i) in pillParts"
      :key="`pill-${i}`"
      title="比赛战绩，由站点竞赛数据自动汇总"
    >
      <span v-for="(seg, j) in parts" :key="`seg-${j}`" class="honor-tag__seg">{{ seg }}</span>
    </HonorPill>
  </template>
  <span
    v-for="h in honors.filter(h => !/协会|会长/.test(h.text))"
    :key="h.text"
    class="honor-tag"
    :class="`honor-tag--${h.type}`"
    :title="HONOR_TYPE_LABELS[h.type]"
    >{{ h.text }}</span
  >
</template>
