// 微信云开发 Web SDK 封装
import cloudbase from '@cloudbase/js-sdk'

let app = null
let auth = null

// 初始化云开发
export const initCloudBase = async () => {
  try {
    // 获取环境配置
    const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID
    const region = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
    const debug = import.meta.env.VITE_DEBUG === 'true'

    if (!envId || envId === 'your-env-id-here') {
      console.error('请在 .env 文件中配置正确的 VITE_CLOUDBASE_ENV_ID')
      throw new Error('云开发环境ID未配置')
    }

    // 初始化云开发应用
    app = cloudbase.init({
      env: envId,
      region: region
    })

    // 获取认证实例
    auth = app.auth()

    // 匿名登录（获得调用云函数的基础权限）
    // 这是必需的，为后续调用admin登录云函数提供基础权限
    try {
      await auth.signInAnonymously()
      console.log('云开发匿名登录成功 - 已获得调用云函数的基础权限')
    } catch (loginError) {
      // 如果已经登录，会抛出错误，但不影响使用
      if (loginError.code !== 'OPERATION_FAIL' && loginError.code !== 'AUTH_DUPLICATE_ANONYMOUS_USER') {
        throw loginError
      }
      console.log('用户已登录，跳过匿名登录')
    }

    if (debug) {
      console.log('云开发初始化完成', {
        envId,
        region,
        authState: auth.hasLoginState(),
        architecture: 'Web端通过云函数操作数据库'
      })
    }

    return { success: true }
  } catch (error) {
    console.error('云开发初始化失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取云开发实例
export const getCloudBase = () => {
  if (!app) {
    throw new Error('云开发未初始化，请先调用 initCloudBase()')
  }
  return app
}

// 获取认证实例
export const getAuth = () => {
  if (!auth) {
    throw new Error('云开发未初始化，请先调用 initCloudBase()')
  }
  return auth
}

// Web端不能直接操作数据库，所有数据库操作都通过云函数进行
// 已移除数据库操作相关代码

// 云函数调用封装
export const callCloudFunction = async (name, data = {}) => {
  try {
    if (!app) {
      throw new Error('云开发未初始化')
    }

    const debug = import.meta.env.VITE_DEBUG === 'true'
    
    if (debug) {
      console.log(`调用云函数 ${name}:`, data)
    }

    const result = await app.callFunction({
      name,
      data
    })

    if (debug) {
      console.log(`云函数 ${name} 返回结果:`, result)
    }

    return result
  } catch (error) {
    console.error(`调用云函数 ${name} 失败:`, error)
    throw error
  }
}

// 管理员登录状态管理（运行时变量 + localStorage持久化）
let isAdminLoggedIn = false

// 登录状态过期时间（3天）
const LOGIN_EXPIRE_DAYS = 3
const LOGIN_EXPIRE_MS = LOGIN_EXPIRE_DAYS * 24 * 60 * 60 * 1000

// 保存登录状态到localStorage
const saveLoginState = (username = 'admin', userInfo = null) => {
  const loginData = {
    isLoggedIn: true,
    timestamp: Date.now(),
    expires: Date.now() + LOGIN_EXPIRE_MS,
    username: username,
    userInfo: userInfo
  }
  localStorage.setItem('adminLoginState', JSON.stringify(loginData))
}

// 从localStorage读取登录状态
const loadLoginState = () => {
  try {
    const savedData = localStorage.getItem('adminLoginState')
    if (!savedData) return null

    const loginData = JSON.parse(savedData)
    
    // 检查是否过期
    if (Date.now() > loginData.expires) {
      console.log('登录状态已过期，需要重新登录')
      localStorage.removeItem('adminLoginState')
      return null
    }

    return loginData
  } catch (error) {
    console.error('读取登录状态失败:', error)
    localStorage.removeItem('adminLoginState')
    return null
  }
}

// 清除登录状态
const clearLoginState = () => {
  isAdminLoggedIn = false
  localStorage.removeItem('adminLoginState')
}

// 初始化登录状态（从localStorage恢复）
export const initAdminLoginState = () => {
  const loginData = loadLoginState()
  isAdminLoggedIn = loginData ? loginData.isLoggedIn : false
  
  if (isAdminLoggedIn && loginData) {
    console.log('从本地存储恢复登录状态:', {
      username: loginData.username,
      permissionLevel: loginData.userInfo?.permissionLevel
    })
  }
  
  return isAdminLoggedIn
}

// 管理员登录
export const adminLogin = async (username, password) => {
  try {
    const result = await callCloudFunction('admin-login', {
      username,
      password
    })

    if (result.result.success) {
      // 保存到运行时变量和localStorage（包含用户信息）
      isAdminLoggedIn = true
      saveLoginState(username, result.result.data)
      
      console.log('管理员登录成功:', result.result.data)
      return { 
        success: true, 
        message: result.result.message,
        data: result.result.data
      }
    } else {
      return { 
        success: false, 
        message: result.result.error || result.result.message,
        code: result.result.code
      }
    }
  } catch (error) {
    console.error('管理员登录失败:', error)
    return { success: false, message: error.message }
  }
}

// 管理员登出
export const adminLogout = () => {
  clearLoginState()
  console.log('管理员已登出')
}

// 检查管理员登录状态
export const checkAdminLogin = () => {
  // 如果运行时变量为false，尝试从localStorage恢复
  if (!isAdminLoggedIn) {
    const loginData = loadLoginState()
    isAdminLoggedIn = loginData ? loginData.isLoggedIn : false
  }
  
  return isAdminLoggedIn
}

// 获取当前登录的管理员信息
export const getAdminInfo = () => {
  const loginData = loadLoginState()
  if (!loginData || !loginData.isLoggedIn) {
    return null
  }
  
  return {
    username: loginData.username,
    userInfo: loginData.userInfo,
    loginTime: new Date(loginData.timestamp),
    expiresTime: new Date(loginData.expires)
  }
}



// 带权限验证的云函数调用
export const callAdminCloudFunction = async (name, data = {}) => {
  if (!checkAdminLogin()) {
    throw new Error('ADMIN_LOGIN_REQUIRED')
  }

  return callCloudFunction(name, data)
}

// 管理后台专用云函数封装
export const adminCloudFunctions = {
  // ===== 管理员认证 =====
  // 管理员登录
  login: adminLogin,
  
  // 管理员登出
  logout: adminLogout,
  
  // 检查登录状态
  checkLogin: checkAdminLogin,

  // ===== 用户管理 =====
  // 获取用户信息
  getUserInfo: (userId) => callAdminCloudFunction('get-user-info', { userId }),
  
  // 获取所有用户列表（需要新建云函数）
  getAllUsers: (params = {}) => callAdminCloudFunction('admin-get-all-users', params),
  
  // 更新用户信息（需要新建云函数）
  updateUserInfo: (userId, updateData) => callAdminCloudFunction('admin-update-user', { userId, updateData }),
  
  // ===== 账号管理 =====
  // 获取账号信息
  getAccountInfo: (accountId) => callAdminCloudFunction('get-account-info', { accountId }),
  
  // 获取所有账号列表（需要新建云函数）
  getAllAccounts: (params = {}) => callAdminCloudFunction('admin-get-all-accounts', params),
  
  // 更新账号信息（需要新建云函数）
  updateAccountInfo: (accountId, updateData) => callAdminCloudFunction('admin-update-account', { accountId, updateData }),
  
  // ===== 文章管理 =====
  // 添加文章信息
  addArticleInfo: (articleData) => callAdminCloudFunction('add-article-info', articleData),
  
  // 获取文章信息
  getArticleInfo: (articleIds) => callAdminCloudFunction('get-article-info', { articleIds }),
  
  // 获取所有文章列表（需要新建云函数）
  getAllArticles: (params = {}) => callAdminCloudFunction('admin-get-all-articles', params),
  
  // 更新文章状态（需要新建云函数）
  updateArticleStatus: (articleId, status) => callAdminCloudFunction('admin-update-article-status', { articleId, status }),
  
  // 删除文章（需要新建云函数）
  deleteArticle: (articleId) => callAdminCloudFunction('admin-delete-article', { articleId }),
  
  // ===== 任务管理 =====
  // 创建每日任务
  createDailyTasks: (userId) => callAdminCloudFunction('create-daily-tasks', { userId }),
  
  // 获取所有任务列表（需要新建云函数）
  getAllTasks: (params = {}) => callAdminCloudFunction('admin-get-all-tasks', params),
  
  // 更新任务状态（需要新建云函数）
  updateTaskStatus: (taskId, status) => callAdminCloudFunction('admin-update-task-status', { taskId, status }),
  
  // ===== 结算管理 =====
  // 获取结算信息
  getAccountSettlementInfo: (accountId) => callAdminCloudFunction('get-account-settlement-info', { accountId }),
  
  // 更新账号收益
  updateAccountEarnings: (data) => callAdminCloudFunction('update-account-earnings', data),
  
  // 获取所有结算记录（需要新建云函数）
  getAllSettlements: (params = {}) => callAdminCloudFunction('admin-get-all-settlements', params),
  
  // 批量结算（需要新建云函数）
  batchSettle: (settlementData) => callAdminCloudFunction('admin-batch-settle', settlementData),
  
  // ===== 邀请码管理 =====
  // 创建邀请码
  createInvitationCode: (codeData) => callAdminCloudFunction('create-invitation-code', codeData),
  
  // 删除邀请码
  deleteInvitationCode: (codeId) => callAdminCloudFunction('delete-invitation-code', { codeId }),
  
  // 获取所有邀请码（需要新建云函数）
  getAllInvitationCodes: (params = {}) => callAdminCloudFunction('admin-get-all-invitation-codes', params),
  
  // ===== 统计分析 =====
  // 获取用户仪表盘统计数据
  getUserDashboard: () => callAdminCloudFunction('admin-user-dashboard'),
  
  // 获取用户统计（需要新建云函数）
  getUserStats: (params = {}) => callAdminCloudFunction('admin-get-user-stats', params),
  
  // 获取文章统计（需要新建云函数）
  getArticleStats: (params = {}) => callAdminCloudFunction('admin-get-article-stats', params),
  
  // 获取收益统计（需要新建云函数）
  getEarningsStats: (params = {}) => callAdminCloudFunction('admin-get-earnings-stats', params),
  
  // ===== 过期任务管理 =====
  // 获取过期任务用户
  getExpiredTaskUsers: (params = {}) => callAdminCloudFunction('admin-task-expired-users', params)
}

// 向后兼容的云函数封装
export const cloudFunctions = adminCloudFunctions

// 导出默认实例（向后兼容）
export { app as cloudbase }