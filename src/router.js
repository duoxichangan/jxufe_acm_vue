import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/all-action', name: 'all-action', component: () => import('./views/AllActionView.vue') },
  { path: '/action/:slug', name: 'action', component: () => import('./views/ActionDetailView.vue') },
  { path: '/contest', name: 'contest', component: () => import('./views/ContestView.vue') },
  {
    path: '/competition/:slug',
    name: 'competition',
    component: () => import('./views/CompetitionDetailView.vue')
  },
  { path: '/leader', name: 'leader', component: () => import('./views/LeaderView.vue') },
  { path: '/excellent', name: 'excellent', component: () => import('./views/ExcellentView.vue') },
  { path: '/links', name: 'links', component: () => import('./views/LinksView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

export default router
