/**
 * 简单的骨架屏辅助：返回一个占位数组，配合 .skeleton 类渲染加载态。
 *
 * 用法：
 *   const { skeletons } = useSkeleton(6)  // 6 个占位元素
 *   <div v-for="n in skeletons" :key="n" class="skeleton" style="height:300px"></div>
 */
export function useSkeleton(count = 6) {
  return { skeletons: Array.from({ length: count }, (_, i) => i) }
}
