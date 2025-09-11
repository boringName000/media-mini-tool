/**
 * 认证辅助工具
 * 统一处理登录状态检查和页面跳转
 */

import { adminCloudFunctions } from './cloudbase'
import router from '@/router'
import { ElMessage } from 'element-plus'

/**
 * 处理云函数调用错误
 * 如果是登录过期，自动跳转到登录页
 */
export const handleCloudFunctionError = (error) => {
  if (error.message === 'ADMIN_LOGIN_REQUIRED') {
    ElMessage.error('登录已过期，请重新登录')
    // 跳转到登录页面
    router.push('/login')
    return true // 表示已处理
  }
  return false // 表示未处理，需要其他错误处理
}

/**
 * 安全调用云函数的包装器
 * 自动处理登录状态检查
 */
export const safeCallCloudFunction = async (functionName, ...args) => {
  try {
    return await adminCloudFunctions[functionName](...args)
  } catch (error) {
    const handled = handleCloudFunctionError(error)
    if (!handled) {
      throw error // 重新抛出未处理的错误
    }
  }
}

/**
 * 检查登录状态的路由守卫
 */
export const requireAuth = (to, from, next) => {
  if (adminCloudFunctions.checkLogin()) {
    next()
  } else {
    ElMessage.error('请先登录管理员账号')
    next('/login')
  }
}

/**
 * Vue组件混入，提供统一的错误处理方法
 */
export const authMixin = {
  methods: {
    // 安全调用云函数
    async $safeCall(functionName, ...args) {
      try {
        this.loading = true
        return await safeCallCloudFunction(functionName, ...args)
      } catch (error) {
        console.error(`调用 ${functionName} 失败:`, error)
        ElMessage.error(`操作失败: ${error.message}`)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 检查登录状态
    $checkAuth() {
      return adminCloudFunctions.checkLogin()
    },
    
    // 登出
    $logout() {
      adminCloudFunctions.logout()
      this.$router.push('/login')
    }
  }
}