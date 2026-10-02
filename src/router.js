import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/all-action', name: 'all-action', component: () => import('./views/AllActionView.vue') },
  { path: '/post/:id', name: 'post', component: () => import('./views/PostView.vue') },
  /* 历史前缀兼容：`/action/<id>` 曾是文章路由（生成器至今在给 cards[].link 削掉这道前缀，
     见 scripts/gen_events_articles.mjs:193），但**正文里**的 markdown 链接不经过那道清洗 ——
     2026 年那篇暑期集训的正文就留着两条 `/action/2026-7-4-summer-training`（目标文章存在），
     点进去落到 404。重定向一次，比只改那两处稳：以后有人照图片目录 /action/tmp/*.jpg 的
     习惯再写错，也不会掉流量。（/contest-news/ 同样是历史前缀，但数据里 0 命中，不投机加。） */
  { path: '/action/:id', redirect: (to) => `/post/${to.params.id}` },
  { path: '/contest', name: 'contest', component: () => import('./views/ContestView.vue') },
  {
    path: '/competition/:slug/:year',
    name: 'competition-event',
    component: () => import('./views/CompetitionEventView.vue')
  },
  {
    path: '/competition/:slug',
    name: 'competition',
    component: () => import('./views/CompetitionDetailView.vue')
  },
  { path: '/leader', name: 'leader', component: () => import('./views/LeaderView.vue') },
  { path: '/excellent', name: 'excellent', component: () => import('./views/ExcellentView.vue') },
  { path: '/links', name: 'links', component: () => import('./views/LinksView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // html 元素设置了 overflow-y:auto 作为滚动容器，需要显式操作
    nextTick(() => {
      document.documentElement.scrollTop = 0
      window.scrollTo(0, 0)
    })
    return { top: 0, behavior: 'instant' }
  }
})

/* 换 dist 部署后，旧 index.html 引用的 chunk 哈希当场失效：首次导航的 import() 会 reject，
   RouterView 拿不到任何匹配 → 用户看到的是一张「只剩页头页脚」的白页。整页刷新一次去取新的
   index.html；用 sessionStorage 打时间戳节流（10 秒内只刷一次），避免资源真的 404 时刷成死循环。
   sessionStorage 在隐私模式下可能抛（同仓库 CompetitionDetailView 处理 localStorage 的做法）。 */
router.onError((err) => {
  if (!/Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(String(err))) return
  try {
    const last = Number(sessionStorage.getItem('chunk-reload-at') || 0)
    if (Date.now() - last < 10000) return
    sessionStorage.setItem('chunk-reload-at', String(Date.now()))
  } catch {
    /* 存不下就算了：宁可这次不刷，也不要因为隐私模式把错误处理本身搞崩 */
  }
  location.reload()
})

export default router
