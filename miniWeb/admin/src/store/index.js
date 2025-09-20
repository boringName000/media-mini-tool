/**
 * 统一的Store管理中心
 * 为各个页面提供专用的数据缓存Store实例
 */
import BaseStore from './BaseStore.js'

// ===== 仪表盘Store =====
const dashboardStore = new BaseStore('dashboard', {
  dayOnly: true,           // 按天过期，每天重新获取数据
  enablePersist: false,    // 不持久化，重启后重新获取
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== 用户管理Store =====
const usersStore = new BaseStore('users', {
  expireTime: 2 * 60 * 60 * 1000,  // 2小时过期
  enablePersist: false,        // 用户数据变化频繁，不持久化
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== 用户收益Store =====
const accountsStore = new BaseStore('accounts', {
  expireTime: 2 * 60 * 60 * 1000, // 2小时过期
  enablePersist: false,        // 收益数据实时性要求高
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== 用户信息Store =====
const userInfoStore = new BaseStore('userInfo', {
  expireTime: 2 * 60 * 60 * 1000,  // 2小时过期
  enablePersist: false,        // 用户信息变化频繁，不持久化
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== 文章管理Store =====
const articlesStore = new BaseStore('articles', {
  expireTime: 2 * 60 * 60 * 1000,  // 2小时过期
  enablePersist: false,        // 文章状态变化频繁
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== 文章审核Store =====
const articleAuditStore = new BaseStore('articleAudit', {
  expireTime: 2 * 60 * 60 * 1000,  // 2小时过期
  enablePersist: false,
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== 邀请码管理Store =====
const invitationsStore = new BaseStore('invitations', {
  expireTime: 2 * 60 * 60 * 1000, // 2小时过期
  enablePersist: false,        // 邀请码变化不频繁但需要准确
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== 系统设置Store =====
const settingsStore = new BaseStore('settings', {
  expireTime: 2 * 60 * 60 * 1000, // 2小时过期
  enablePersist: true,         // 系统设置变化不频繁，可以持久化
  persistKey: 'admin_settings',
  debug: import.meta.env.VITE_DEBUG === 'true'
})

// ===== Store工厂函数 =====
/**
 * 创建临时Store实例（用于一次性数据获取）
 */
export const createTempStore = (name, options = {}) => {
  return new BaseStore(name, {
    expireTime: 30 * 1000, // 30秒过期
    enablePersist: false,
    debug: import.meta.env.VITE_DEBUG === 'true',
    ...options
  })
}

/**
 * 创建长期缓存Store实例
 */
export const createLongTermStore = (name, options = {}) => {
  return new BaseStore(name, {
    expireTime: 24 * 60 * 60 * 1000, // 24小时过期
    enablePersist: true,
    debug: import.meta.env.VITE_DEBUG === 'true',
    ...options
  })
}

// ===== Store管理工具 =====
/**
 * 获取所有Store的状态信息
 */
export const getAllStoreStatus = () => {
  return {
    dashboard: dashboardStore.getStatus(),
    users: usersStore.getStatus(),
    accounts: accountsStore.getStatus(),
    userInfo: userInfoStore.getStatus(),
    articles: articlesStore.getStatus(),
    articleAudit: articleAuditStore.getStatus(),
    invitations: invitationsStore.getStatus(),
    settings: settingsStore.getStatus()
  }
}

/**
 * 清除所有Store的数据
 */
export const clearAllStores = () => {
  dashboardStore.reset()
  usersStore.reset()
  accountsStore.reset()
  userInfoStore.reset()
  articlesStore.reset()
  articleAuditStore.reset()
  invitationsStore.reset()
  settingsStore.reset()
  
  console.log('[Store] 所有Store数据已清除')
}

/**
 * 清除过期的Store数据
 */
export const clearExpiredStores = () => {
  const stores = [
    dashboardStore, usersStore, accountsStore, userInfoStore,
    articlesStore, articleAuditStore, invitationsStore, settingsStore
  ]
  
  stores.forEach(store => {
    if (store.hasData() && !store.isDataValid()) {
      store.clearData()
      console.log(`[Store] ${store.name} 过期数据已清除`)
    }
  })
}

// ===== 导出所有Store实例 =====
export {
  dashboardStore,
  usersStore,
  accountsStore,
  userInfoStore,
  articlesStore,
  articleAuditStore,
  invitationsStore,
  settingsStore
}

// 导出BaseStore类供扩展使用
export { default as BaseStore } from './BaseStore.js'