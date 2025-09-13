import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import App from './App.vue'
import router from './router'
import './styles/index.scss'

// 初始化微信云开发
import { initCloudBase, initAdminLoginState } from './utils/cloudbase'

const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 初始化云开发和登录状态（异步）
initCloudBase().then((result) => {
  if (result.success) {
    console.log('云开发初始化成功，启动应用')
  } else {
    console.warn('云开发初始化失败，但应用仍可启动:', result.error)
  }
  
  // 初始化管理员登录状态
  const hasValidLogin = initAdminLoginState()
  if (hasValidLogin) {
    console.log('检测到有效的登录状态')
  } else {
    console.log('未检测到有效的登录状态')
  }
  
  // 挂载应用
  app.mount('#app')
}).catch((error) => {
  console.error('应用启动失败:', error)
  // 即使云开发初始化失败，也要挂载应用
  app.mount('#app')
})