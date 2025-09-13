import { createRouter, createWebHistory } from 'vue-router'
import { checkAdminLogin } from '@/utils/cloudbase'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' }
      },
      {
        path: '/articles',
        name: 'Articles',
        component: () => import('@/views/Articles.vue'),
        meta: { title: '文章管理', icon: 'Document' }
      },
      {
        path: '/accounts',
        name: 'Accounts',
        component: () => import('@/views/Accounts.vue'),
        meta: { title: '用户收益', icon: 'Money' }
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户信息审核', icon: 'User' }
      },
      {
        path: '/article-audit',
        name: 'ArticleAudit',
        component: () => import('@/views/ArticleAudit.vue'),
        meta: { title: '用户文章审核', icon: 'EditPen' }
      },
      {
        path: '/invitations',
        name: 'Invitations',
        component: () => import('@/views/Invitations.vue'),
        meta: { title: '邀请码管理', icon: 'Ticket' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = checkAdminLogin()
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router