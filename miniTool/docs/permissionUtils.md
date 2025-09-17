# 权限管理工具使用说明

## 概述

`permissionUtils.js` 是一个专门用于处理用户权限和账号权限的工具模块，提供了完整的权限检查和处理机制。

## 主要功能

### 1. 用户状态检查
- 检查用户是否被禁用
- 自动处理禁用用户的跳转和提示

### 2. 账号状态检查
- 检查指定账号是否被禁用
- 处理账号禁用时的提示

### 3. 登录权限检查
- 在用户登录时检查权限状态
- 阻止被禁用用户的登录

### 4. 下载权限检查
- 在下载操作前检查用户和账号权限
- 防止被禁用的用户或账号进行下载操作

### 5. APP冷启动权限检查
- 在小程序启动时检查用户权限
- 确保被禁用用户无法正常使用小程序

## API 参考

### 基础检查函数

#### `checkUserStatus(userInfo)`
检查用户状态是否正常
- **参数**: `userInfo` - 用户信息对象
- **返回**: `Boolean` - true表示正常，false表示禁用

#### `checkAccountStatus(userInfo, accountId)`
检查指定账号状态是否正常
- **参数**: 
  - `userInfo` - 用户信息对象
  - `accountId` - 账号ID
- **返回**: `Boolean` - true表示正常，false表示禁用

### 权限处理函数

#### `checkAndHandleUserPermission(userInfo)`
检查用户权限并处理禁用状态
- **参数**: `userInfo` - 用户信息对象
- **返回**: `Boolean` - true表示权限正常，false表示权限被禁用
- **副作用**: 如果用户被禁用，会显示提示并跳转到登录页面

#### `checkAndHandleAccountPermission(userInfo, accountId)`
检查账号权限并处理禁用状态
- **参数**: 
  - `userInfo` - 用户信息对象
  - `accountId` - 账号ID
- **返回**: `Boolean` - true表示权限正常，false表示权限被禁用
- **副作用**: 如果账号被禁用，会显示提示

### 高级功能函数



#### `checkLoginPermission(loginResult)`
登录时的权限检查
- **参数**: `loginResult` - 登录结果对象
- **返回**: `Boolean` - true表示可以继续登录，false表示需要阻止登录
- **副作用**: 如果用户被禁用，会显示提示

#### `checkDownloadPermission(userInfo, accountId)`
下载权限检查（仅检查账号权限）
- **参数**: 
  - `userInfo` - 用户信息对象
  - `accountId` - 要下载内容的账号ID
- **返回**: `Boolean` - true表示可以下载，false表示禁止下载
- **功能**: 检查账号权限（用户权限已在 getCurrentUserInfo 中检查）

### 工具函数

#### `getActiveAccounts(userInfo)`
获取用户的所有正常状态账号
- **参数**: `userInfo` - 用户信息对象
- **返回**: `Array` - 正常状态的账号数组

#### `getDisabledAccounts(userInfo)`
获取用户的所有禁用状态账号
- **参数**: `userInfo` - 用户信息对象
- **返回**: `Array` - 禁用状态的账号数组

## 使用示例

### 1. 在APP冷启动时检查权限

```javascript
// app.js
const { checkAndHandleUserPermission } = require("./utils/permissionUtils");

App({
  refreshUserData: function () {
    userInfoUtils.loginGetLatestUserInfo()
      .then((result) => {
        if (result.success) {
          // 检查用户权限状态
          if (!checkAndHandleUserPermission(result.userInfo)) {
            console.log("用户权限被禁用，清除登录状态");
            this.clearLoginStatus();
            return; // 权限检查失败，已处理跳转
          }
          // 继续正常流程...
        }
      });
  }
});
```

### 2. 在页面中使用权限检查

```javascript
// 用户权限检查已集成在 getCurrentUserInfo 中，无需额外调用
// 直接使用 userInfoUtils.getCurrentUserInfo() 即可
const userInfoUtils = require('../../utils/userInfoUtils.js');

Page({
  async onLoad() {
    try {
      const result = await userInfoUtils.getCurrentUserInfo();
      if (result.success) {
        // 用户权限正常，继续页面逻辑
        this.setData({ userInfo: result.userInfo });
      }
      // 如果用户被禁用，getCurrentUserInfo 会自动处理跳转
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }
});
```

### 3. 在登录页面中使用

```javascript
const { checkLoginPermission } = require('../../utils/permissionUtils.js');

// 在登录成功的回调中
success: (result) => {
  if (result.success) {
    // 检查登录权限
    if (!checkLoginPermission(result)) {
      return; // 权限检查失败，已显示提示
    }
    
    // 继续登录流程
    // ...
  }
}
```

### 4. 在下载功能中使用

```javascript
const { checkDownloadPermission } = require('../../utils/permissionUtils.js');

downloadArticle(e) {
  const { accountId } = e.currentTarget.dataset;
  
  // 从全局数据获取用户信息
  const app = getApp();
  const userInfo = app.globalData.loginResult;
  
  if (!userInfo) {
    wx.showToast({
      title: "无法获取用户信息",
      icon: "none",
    });
    return;
  }
  
  // 检查下载权限（仅检查账号权限）
  const hasPermission = checkDownloadPermission(userInfo, accountId);
  if (!hasPermission) {
    return; // 权限检查失败，已显示提示
  }
  
  // 继续下载逻辑
  // ...
}
```

### 5. 获取可用账号列表

```javascript
const { getActiveAccounts } = require('../../utils/permissionUtils.js');

// 获取用户的所有可用账号
const activeAccounts = getActiveAccounts(userInfo);
console.log('可用账号数量:', activeAccounts.length);
```

## 常量定义

### USER_STATUS
- `NORMAL: 1` - 用户正常状态
- `DISABLED: 0` - 用户禁用状态

### ACCOUNT_STATUS
- `NORMAL: 1` - 账号正常状态
- `DISABLED: 0` - 账号禁用状态

### ADMIN_CONTACT
管理员联系方式，当前设置为 "微信：admin888"

## 权限检查时机

### 1. APP冷启动检查
- **时机**: 小程序启动时，在 `app.js` 的 `refreshUserData` 函数中
- **作用**: 确保被禁用的用户无法正常使用小程序
- **处理**: 如果用户被禁用，清除登录状态并跳转到登录页面

### 2. 页面级权限检查
- **时机**: 每次调用 `getCurrentUserInfo` 时
- **作用**: 在用户使用过程中实时检查权限状态
- **处理**: 发现权限异常时立即处理

### 3. 操作级权限检查
- **时机**: 执行关键操作（如下载）前
- **作用**: 确保只有有权限的用户和账号才能执行操作
- **处理**: 阻止无权限的操作并显示友好提示

## 注意事项

1. **权限检查的时机**: 建议在关键操作前都进行权限检查，如APP启动、页面加载、登录、下载等
2. **错误处理**: 所有权限检查函数都包含了错误处理，但调用方仍需要适当的 try-catch
3. **用户体验**: 权限被禁用时会自动显示友好的提示信息，包含管理员联系方式
4. **自动跳转**: 用户被禁用时会自动跳转到登录页面，账号被禁用时不会跳转
5. **依赖关系**: 该模块依赖 `userInfoUtils.js` 中的 `getCurrentUserInfo` 函数
6. **冷启动保护**: APP启动时会自动检查用户权限，确保被禁用用户无法使用小程序

## 集成说明

该权限管理工具已经集成到以下文件中：

1. **app.js**: 在APP冷启动时的 `refreshUserData` 函数中添加了权限检查
2. **userInfoUtils.js**: 在 `getCurrentUserInfo` 函数中添加了权限检查
3. **login.js**: 在登录成功后添加了权限检查
4. **article-list.js**: 在文章下载功能中添加了权限检查
5. **task-list.js**: 在任务下载功能中添加了权限检查

这样确保了在所有关键节点都会进行适当的权限检查，形成完整的权限管理体系：

- **启动保护**: APP启动时检查权限
- **实时监控**: 页面使用过程中持续检查
- **操作拦截**: 关键操作前验证权限
- **友好提示**: 权限异常时给出明确指引

通过多层次的权限检查机制，确保系统安全性和用户体验的平衡。