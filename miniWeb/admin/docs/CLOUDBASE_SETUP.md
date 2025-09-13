# 微信云开发 Web SDK 配置指南

## ⚠️ 重要说明：架构设计

### Web端操作数据库的正确方式

**❌ 错误方式：Web端直接操作数据库**
- 匿名登录权限有限，无法直接写入、更新、删除数据库
- 安全性差，业务逻辑暴露在前端

**✅ 正确方式：Web端通过云函数操作数据库**
- Web端只调用云函数
- 云函数内部操作数据库
- 安全性高，业务逻辑在服务端

```
Web管理后台 → 调用云函数 → 云函数操作数据库
```

### 认证机制详解

#### 为什么需要匿名登录？

**微信云开发的认证要求**：
- 调用云开发服务必须有身份认证
- 小程序端自动使用微信用户身份
- Web端必须选择一种认证方式

**匿名登录的作用**：
- 为Web应用提供调用云函数的基础权限
- 不需要用户注册，自动分配临时身份
- 权限有限，主要用于调用云函数

#### 推荐的管理后台认证方案

**双层认证架构**：
```
1. 匿名登录 → 获得调用云函数的基础权限
2. 管理员登录 → 通过云函数验证管理员身份
```

**具体流程**：
```javascript
// 1. 初始化时自动匿名登录
await auth.anonymousAuthProvider().signIn()

// 2. 管理员登录（调用自定义云函数）
const result = await adminCloudFunctions.login('admin', 'password')

// 3. 登录成功后，保存到localStorage（带时间戳）
// 4. 后续调用云函数时检查登录状态，未登录则跳转登录页
const users = await adminCloudFunctions.getAllUsers()
```

### 登录状态持久化管理

系统使用localStorage结合时间戳来管理登录状态，提供良好的用户体验：

#### 存储机制
- **存储位置**: localStorage
- **存储格式**: `{ isLoggedIn: true, timestamp: Date.now(), username: 'admin' }`
- **有效期**: 3天（259200000毫秒）
- **自动清理**: 超过有效期自动清除，需要重新登录

#### 核心函数
```javascript
// 初始化登录状态（应用启动时调用）
const hasValidLogin = initAdminLoginState()

// 检查当前登录状态
const isLoggedIn = checkAdminLogin()

// 执行登录并保存状态
const result = await adminLogin({ username, password })

// 登出并清除状态
adminLogout()
```

#### 自动化流程
1. **应用启动**: 自动检查localStorage中的登录状态和时间戳
2. **路由守卫**: 实时验证登录状态，未登录自动跳转登录页
3. **状态维护**: 登录成功后自动更新时间戳，登出时清除所有状态
4. **过期处理**: 超过3天自动清除登录状态，确保安全性

这种设计在保证安全性的同时，避免了用户频繁重新登录的困扰。

## 1. 环境配置

### 1.1 获取云开发环境ID

1. 打开微信开发者工具
2. 打开你的小程序项目 (`miniTool`)
3. 点击"云开发"按钮
4. 在云开发控制台中，查看环境列表
5. 复制你要使用的环境ID（格式类似：`cloud1-xxx-xxx`）

### 1.2 配置环境变量

编辑 `miniWeb/admin/.env` 文件，填入正确的环境ID：

```bash
# 微信云开发环境ID（必填）
VITE_CLOUDBASE_ENV_ID=你的环境ID

# 微信云开发地域（可选，默认为 ap-shanghai）
VITE_CLOUDBASE_REGION=ap-shanghai

# 应用标题
VITE_APP_TITLE=西瓜🍉创作者管理中心

# API 基础路径
VITE_API_BASE_URL=/

# 是否启用调试模式
VITE_DEBUG=true
```

## 2. 需要创建的管理后台专用云函数

由于Web端只能通过云函数操作数据库，你需要创建以下云函数：

### 2.1 管理员登录云函数（必需）

**首先创建 `admin-login` 云函数**，这是管理后台的核心认证功能：

参考文件：[admin-login-cloudfunction.js](./admin-login-cloudfunction.js)

```javascript
// admin-login/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 管理员账号配置
const ADMIN_ACCOUNTS = {
  'admin': {
    password: 'your-secure-password', // 请修改为你的密码
    name: '系统管理员',
    permissions: ['all']
  }
}

exports.main = async (event, context) => {
  try {
    const { username, password } = event
    
    if (!username || !password) {
      return { success: false, message: '用户名和密码不能为空' }
    }
    
    const adminAccount = ADMIN_ACCOUNTS[username]
    if (!adminAccount || adminAccount.password !== password) {
      return { success: false, message: '用户名或密码错误' }
    }
    
    return {
      success: true,
      message: '登录成功'
    }
  } catch (error) {
    return { success: false, message: '登录失败' }
  }
}
```

### 2.2 用户管理云函数

创建 `admin-get-all-users` 云函数：

```javascript
// admin-get-all-users/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { page = 1, limit = 20, keyword = '' } = event
    
    let query = db.collection('users')
    
    if (keyword) {
      query = query.where({
        nickname: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
    }
    
    const result = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .orderBy('createTime', 'desc')
      .get()
    
    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

### 2.2 文章管理云函数

创建 `admin-get-all-articles` 云函数：

```javascript
// admin-get-all-articles/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { page = 1, limit = 20, trackType, status } = event
    
    let query = db.collection('article-mgr')
    
    // 添加筛选条件
    const whereCondition = {}
    if (trackType) whereCondition.trackType = trackType
    if (status !== undefined) whereCondition.status = status
    
    if (Object.keys(whereCondition).length > 0) {
      query = query.where(whereCondition)
    }
    
    const result = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .orderBy('createTime', 'desc')
      .get()
    
    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

### 2.3 更新文章状态云函数

创建 `admin-update-article-status` 云函数：

```javascript
// admin-update-article-status/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { articleId, status } = event
    
    const result = await db.collection('article-mgr')
      .doc(articleId)
      .update({
        data: {
          status,
          updateTime: new Date()
        }
      })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

## 3. 在Vue组件中使用

### 3.1 管理员登录和云函数调用

```javascript
import { adminCloudFunctions } from '@/utils/cloudbase'

export default {
  data() {
    return {
      users: [],
      articles: [],
      loading: false,
      isLoggedIn: false
    }
  },
  
  created() {
    // 检查登录状态（运行时变量）
    this.isLoggedIn = adminCloudFunctions.checkLogin()
  },
  
  methods: {
    // 管理员登录
    async adminLogin() {
      try {
        const result = await adminCloudFunctions.login('admin', 'your-password')
        
        if (result.success) {
          this.isLoggedIn = true
          this.$message.success('登录成功')
        } else {
          this.$message.error('登录失败: ' + result.error)
        }
      } catch (error) {
        console.error('登录失败:', error)
        this.$message.error('登录失败')
      }
    },
    
    // 管理员登出
    adminLogout() {
      adminCloudFunctions.logout()
      this.isLoggedIn = false
      this.$message.success('已登出')
    },
    
    // 获取用户列表（需要登录）
    async loadUsers() {
      try {
        this.loading = true
        const result = await adminCloudFunctions.getAllUsers({
          page: 1,
          limit: 20,
          keyword: ''
        })
        
        if (result.result.success) {
          this.users = result.result.data
        } else {
          this.$message.error('获取用户列表失败: ' + result.result.error)
        }
      } catch (error) {
        if (error.message === 'ADMIN_LOGIN_REQUIRED') {
          this.$message.error('登录已过期，请重新登录')
          this.isLoggedIn = false
          // 跳转到登录页面
          this.$router.push('/login')
        } else {
          console.error('加载用户失败:', error)
          this.$message.error('加载用户失败')
        }
      } finally {
        this.loading = false
      }
    },
    
    // 获取文章列表（需要登录）
    async loadArticles() {
      try {
        this.loading = true
        const result = await adminCloudFunctions.getAllArticles({
          page: 1,
          limit: 20,
          trackType: 1, // 美食赛道
          status: 1 // 待发表
        })
        
        if (result.result.success) {
          this.articles = result.result.data
        } else {
          this.$message.error('获取文章列表失败: ' + result.result.error)
        }
      } catch (error) {
        if (error.message === 'ADMIN_LOGIN_REQUIRED') {
          this.$message.error('登录已过期，请重新登录')
          this.isLoggedIn = false
          // 跳转到登录页面
          this.$router.push('/login')
        } else {
          console.error('加载文章失败:', error)
          this.$message.error('加载文章失败')
        }
      } finally {
        this.loading = false
      }
    },
    
    // 更新文章状态（需要登录）
    async updateArticleStatus(articleId, status) {
      try {
        const result = await adminCloudFunctions.updateArticleStatus(articleId, status)
        
        if (result.result.success) {
          this.$message.success('状态更新成功')
          await this.loadArticles() // 刷新列表
        } else {
          this.$message.error('更新失败: ' + result.result.error)
        }
      } catch (error) {
        if (error.message === 'ADMIN_LOGIN_REQUIRED') {
          this.$message.error('登录已过期，请重新登录')
          this.isLoggedIn = false
          // 跳转到登录页面
          this.$router.push('/login')
        } else {
          console.error('更新状态失败:', error)
          this.$message.error('更新状态失败')
        }
      }
    }
  }
}
```

## 4. 部署到微信小程序静态网站

### 4.1 构建项目

```bash
cd miniWeb/admin
npm run build
```

### 4.2 上传到云开发静态网站

1. 在微信开发者工具中打开云开发控制台
2. 点击"静态网站托管"
3. 点击"上传文件"
4. 将 `dist` 目录下的所有文件上传到根目录

## 5. 权限说明

### 5.1 匿名登录权限

Web端使用匿名登录，权限如下：

- ✅ **可以调用云函数**（如果云函数允许匿名访问）
- ❌ **不能直接操作数据库**（Web端不支持直接数据库操作）

### 5.2 管理员登录权限

通过自定义的admin-login云函数验证后：

- ✅ **可以调用所有管理后台云函数**
- ✅ **通过云函数间接操作数据库**
- ✅ **访问管理后台的所有功能**

### 5.3 云函数权限

云函数运行在服务端，拥有完整的数据库操作权限：

- ✅ **完整的数据库读写权限**
- ✅ **可以调用其他云函数**
- ✅ **可以访问所有云开发资源**

## 6. 建议的云函数列表

为了完整的管理后台功能，建议创建以下云函数：

### 用户管理
- `admin-get-all-users` - 获取用户列表
- `admin-update-user` - 更新用户信息
- `admin-delete-user` - 删除用户

### 文章管理
- `admin-get-all-articles` - 获取文章列表
- `admin-update-article-status` - 更新文章状态
- `admin-delete-article` - 删除文章

### 任务管理
- `admin-get-all-tasks` - 获取任务列表
- `admin-update-task-status` - 更新任务状态

### 结算管理
- `admin-get-all-settlements` - 获取结算记录
- `admin-batch-settle` - 批量结算

### 统计分析
- `admin-get-user-stats` - 用户统计
- `admin-get-article-stats` - 文章统计
- `admin-get-earnings-stats` - 收益统计

## 7. 统一的认证处理

### 7.1 使用认证辅助工具

为了简化登录状态检查和错误处理，项目提供了 `auth-helper.js` 工具：

```javascript
import { authMixin, safeCallCloudFunction } from '@/utils/auth-helper'

export default {
  mixins: [authMixin], // 使用认证混入
  
  methods: {
    // 方式1: 使用混入的安全调用方法
    async loadUsers() {
      try {
        const result = await this.$safeCall('getAllUsers', {
          page: 1,
          limit: 20
        })
        
        if (result.result.success) {
          this.users = result.result.data
        }
      } catch (error) {
        // 错误已被自动处理（包括登录跳转）
      }
    },
    
    // 方式2: 直接使用安全调用函数
    async loadArticles() {
      try {
        const result = await safeCallCloudFunction('getAllArticles', {
          page: 1,
          limit: 20
        })
        
        if (result.result.success) {
          this.articles = result.result.data
        }
      } catch (error) {
        // 登录相关错误已被自动处理
        console.error('其他错误:', error)
      }
    }
  }
}
```

### 7.2 路由守卫

在路由配置中使用认证守卫：

```javascript
import { requireAuth } from '@/utils/auth-helper'

const routes = [
  {
    path: '/admin',
    component: AdminLayout,
    beforeEnter: requireAuth, // 需要登录才能访问
    children: [
      { path: 'users', component: UserManagement },
      { path: 'articles', component: ArticleManagement }
    ]
  },
  {
    path: '/login',
    component: LoginPage
  }
]
```

### 7.3 手动错误处理

如果需要自定义错误处理：

```javascript
import { handleCloudFunctionError } from '@/utils/auth-helper'

export default {
  methods: {
    async customOperation() {
      try {
        const result = await adminCloudFunctions.someFunction()
        // 处理成功结果
      } catch (error) {
        // 先尝试处理登录相关错误
        const handled = handleCloudFunctionError(error)
        
        if (!handled) {
          // 处理其他类型的错误
          console.error('操作失败:', error)
          this.$message.error('操作失败，请稍后重试')
        }
      }
    }
  }
}
```

## 8. 注意事项

1. **安全性**: 所有敏感操作都通过云函数进行，不要在前端暴露敏感逻辑
2. **权限控制**: 在云函数中添加适当的权限验证
3. **错误处理**: 始终包装try-catch处理云函数调用
4. **性能优化**: 合理使用分页，避免一次性加载大量数据
5. **日志记录**: 在云函数中记录重要操作日志