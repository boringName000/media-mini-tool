# admin-login 云函数

## 功能描述

管理员登录验证云函数，用于Web管理后台的身份认证。

## 功能特性

- ✅ 管理员账号信息验证
- ✅ 权限等级管理（3个等级）
- ✅ 详细的权限列表返回
- ✅ 完整的错误处理和日志记录
- ✅ 安全的密码验证

## 权限等级说明

### 1. 文章管理员 (权限等级: 1)
- **权限范围**: 只能查看和操作文章
- **适用场景**: 内容编辑人员

### 2. 查看管理员 (权限等级: 2)
- **权限范围**: 能查看全部信息，但不能操作
- **适用场景**: 数据分析人员、监控人员

### 3. 超级管理员 (权限等级: 3)
- **权限范围**: 拥有系统全部权限
- **适用场景**: 系统管理员

## 预设账号

| 用户名 | 密码 | 权限等级 | 说明 |
|--------|------|----------|------|
| admin | dzht888.. | 3 | 系统管理员，拥有全部权限 |

## 入参格式

```javascript
{
  "username": "admin",        // 必填，用户名
  "password": "dzht888.."     // 必填，密码
}
```

## 返回格式

### 登录成功

```javascript
{
  "success": true,
  "message": "登录成功",
  "code": "LOGIN_SUCCESS",
  "data": {
    "username": "admin",
    "name": "系统管理员",
    "description": "拥有系统全部权限",
    "permissionLevel": 3,
    "permissionLevelName": "超级管理员",
    "loginTime": "2024-01-01T12:00:00.000Z",
    "loginTimestamp": 1704110400000
  },
  "openid": "xxx",
  "appid": "xxx",
  "unionid": "xxx"
}
```

### 登录失败

```javascript
{
  "success": false,
  "error": "密码错误",
  "code": "INVALID_PASSWORD",
  "openid": "xxx",
  "appid": "xxx",
  "unionid": "xxx"
}
```

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `INVALID_PARAMS` | 参数不完整 | 检查用户名和密码是否都已提供 |
| `INVALID_USERNAME` | 用户名格式错误 | 检查用户名格式 |
| `INVALID_PASSWORD` | 密码格式错误或密码错误 | 检查密码是否正确 |
| `USER_NOT_FOUND` | 用户名不存在 | 检查用户名是否正确 |
| `SYSTEM_ERROR` | 系统错误 | 联系技术支持 |

## 部署方法

### 方法1: 使用脚本部署
```bash
cd miniTool
./scripts/clouddeploy/deploy-admin-login.sh
```

### 方法2: 手动部署
1. 在微信开发者工具中打开项目
2. 点击"云开发"按钮
3. 进入"云函数"页面
4. 找到 `admin-login` 函数
5. 点击"部署并上传"

### 方法3: 命令行部署
```bash
# 需要先安装微信开发者工具命令行工具
miniprogram-cli cloudfunctions:deploy admin-login
```

## 测试方法

### 在Web管理后台测试
1. 访问 `/test-login` 页面
2. 点击"测试登录"按钮
3. 查看返回的用户信息和权限列表

### 直接调用测试
```javascript
// 在小程序或Web端调用
wx.cloud.callFunction({
  name: 'admin-login',
  data: {
    username: 'admin',
    password: 'dzht888..'
  }
}).then(res => {
  console.log('登录结果:', res.result)
})
```

## 安全注意事项

1. **密码安全**: 当前密码写死在云函数中，生产环境建议：
   - 使用环境变量存储密码
   - 实现密码加密存储
   - 定期更换密码

2. **权限控制**: 
   - 根据实际需求调整权限等级
   - 定期审查权限分配
   - 记录管理员操作日志

3. **访问控制**:
   - 限制登录尝试次数
   - 实现IP白名单
   - 添加登录日志记录

## 扩展功能

如需添加更多管理员账号，修改 `ADMIN_ACCOUNTS` 对象：

```javascript
const ADMIN_ACCOUNTS = {
  'admin': {
    username: 'admin',
    password: 'dzht888..',
    permissionLevel: PERMISSION_LEVELS.FULL_ACCESS,
    name: '系统管理员',
    description: '拥有系统全部权限'
  },
  'editor': {
    username: 'editor',
    password: 'editor123',
    permissionLevel: PERMISSION_LEVELS.ARTICLE_ONLY,
    name: '内容编辑',
    description: '负责文章内容管理'
  }
  // 添加更多账号...
}
```

## 版本历史

- **v1.0.0** (2024-01-01)
  - 初始版本
  - 支持基础的管理员登录验证
  - 实现三级权限管理
  - 完整的错误处理机制