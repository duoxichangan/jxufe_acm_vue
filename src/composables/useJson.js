import { ref, onMounted } from 'vue'

/**
 * 通用 JSON 加载器。
 * @param {string} url     数据地址（通常为 /data/xxx.json）
 * @param {object} [opts]
 * @param {any}    [opts.initial] 初始值
 * @param {boolean}[opts.auto=true] 是否在挂载时自动加载；自行编排加载流程时置 false
 */
export function useJson(url, opts = {}) {
  const { initial, auto = true } = opts
  const data = ref(initial ?? null)
  const loading = ref(true)
  const error = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data.value = await res.json()
    } catch (e) {
      console.error(`加载 ${url} 失败:`, e)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  if (auto) onMounted(load)

  return { data, loading, error, load }
}
