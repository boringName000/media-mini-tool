import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { cloudbase } from '@/utils/cloudbase'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('admin_token') || '')
  
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  
  // 登录
  const login = async (credentials) => {
    try {
      // 演示模式：使用固定的管理员账号
      if (credentials.username === 'admin' && credentials.password === '123456') {
        // 模拟登录成功
        const mockToken = 'demo_admin_token_' + Date.now()
        const mockUserInfo = {
          id: 'admin_001',
          username: 'admin',
          nickname: '系统管理员',
          email: 'admin@example.com',
          role: 'admin',
          avatar: '',
          loginTime: new Date().toISOString()
        }
        
        token.value = mockToken
        userInfo.value = mockUserInfo
        localStorage.setItem('admin_token', token.value)
        localStorage.setItem('admin_user', JSON.stringify(userInfo.value))
        
        // 记住用户名
        if (credentials.remember) {
          localStorage.setItem('admin_username', credentials.username)
        } else {
          localStorage.removeItem('admin_username')
        }
        
        ElMessage.success('登录成功')
        return { success: true }
      } else {
        ElMessage.error('用户名或密码错误')
        return { success: false, message: '用户名或密码错误' }
      }
      
      // TODO: 生产环境中调用微信云函数进行管理员登录验证
      /*
      const result = await cloudbase.callFunction({
        name: 'admin-login',
        data: credentials
      })
      
      if (result.result.success) {
        token.value = result.result.token
        userInfo.value = result.result.userInfo
        localStorage.setItem('admin_token', token.value)
        localStorage.setItem('admin_user', JSON.stringify(userInfo.value))
        ElMessage.success('登录成功')
        return { success: true }
      } else {
        ElMessage.error(result.result.message || '登录失败')
        return { success: false, message: result.result.message }
      }
      */
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error('网络错误，请重试')
      return { success: false, message: '网络错误' }
    }
  }
  
  // 登出
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    ElMessage.success('已退出登录')
  }
  
  // 检查登录状态
  const checkLoginStatus = () => {
    const savedToken = localStorage.getItem('admin_token')
    const savedUser = localStorage.getItem('admin_user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        userInfo.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        logout()
      }
    }
  }
  
  // 刷新用户信息
  const refreshUserInfo = async () => {
    try {
      // TODO: 调用云函数获取最新用户信息
      const result = await cloudbase.callFunction({
        name: 'admin-get-user-info',
        data: { token: token.value }
      })
      
      if (result.result.success) {
        userInfo.value = result.result.userInfo
        localStorage.setItem('admin_user', JSON.stringify(userInfo.value))
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }
  
  return {
    userInfo,
    token,
    isLoggedIn,
    login,
    logout,
    checkLoginStatus,
    refreshUserInfo
  }
})