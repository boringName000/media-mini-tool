/**
 * 管理员登录云函数示例
 * 文件路径: miniTool/cloudfunctions/admin-login/index.js
 */

const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 管理员账号配置（实际使用时建议存储在数据库中）
const ADMIN_ACCOUNTS = {
  'admin': {
    password: 'your-secure-password-hash', // 实际使用时应该是加密后的密码
    name: '系统管理员',
    permissions: ['all'] // 权限列表
  }
  // 可以添加更多管理员账号
}

// 简化版本：不需要生成token，只返回登录成功状态

// 验证密码（实际使用时应该使用bcrypt等安全的密码验证）
function verifyPassword(inputPassword, storedPassword) {
  // 这里只是示例，实际使用时应该进行加密验证
  return inputPassword === storedPassword
}

exports.main = async (event, context) => {
  try {
    const { username, password } = event
    
    // 参数验证
    if (!username || !password) {
      return {
        success: false,
        message: '用户名和密码不能为空'
      }
    }
    
    // 检查管理员账号是否存在
    const adminAccount = ADMIN_ACCOUNTS[username]
    if (!adminAccount) {
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }
    
    // 验证密码
    if (!verifyPassword(password, adminAccount.password)) {
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }
    
    // 记录登录日志（可选）
    console.log(`管理员 ${username} 登录成功，时间: ${new Date().toISOString()}`)
    
    return {
      success: true,
      message: '登录成功'
    }
    
  } catch (error) {
    console.error('管理员登录失败:', error)
    return {
      success: false,
      message: '登录失败，请稍后重试'
    }
  }
}

/**
 * 使用说明:
 * 
 * 1. 在微信开发者工具中创建新的云函数 'admin-login'
 * 2. 将此代码复制到 index.js 文件中
 * 3. 修改 ADMIN_ACCOUNTS 中的用户名和密码
 * 4. 部署云函数
 * 5. 在Web端调用: adminCloudFunctions.login('admin', 'password')
 * 
 * 简化设计说明:
 * - 不生成token，只返回登录成功状态
 * - Web端将登录状态保存在本地变量中
 * - 后续云函数调用前检查本地登录状态
 * 
 * 安全建议:
 * - 使用bcrypt等库对密码进行加密存储
 * - 添加登录失败次数限制
 * - 记录详细的操作日志
 * - 定期更换密码
 */