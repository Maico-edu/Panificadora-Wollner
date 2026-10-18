import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import { useContent } from './stores/content.js'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: '' } },
  {
    path: '/encomendas',
    name: 'encomendas',
    component: () => import('./views/EncomendasView.vue'),
    meta: { title: 'Encomendas' },
  },
  {
    path: '/sobre',
    name: 'sobre',
    component: () => import('./views/SobreView.vue'),
    meta: { title: 'Sobre a Wollner' },
  },
  {
    path: '/contato',
    name: 'contato',
    component: () => import('./views/ContatoView.vue'),
    meta: { title: 'Localização e contato' },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./views/AdminView.vue'),
    meta: { title: 'Painel administrativo', admin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/NotFoundView.vue'),
    meta: { title: 'Página não encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.path === from.path && !to.hash) return false
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const { content } = useContent()
  const name = content.value.company.name
  document.title = to.meta.title ? `${to.meta.title} — ${name}` : `${name} — Joinville`
})

export default router
