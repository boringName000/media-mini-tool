# 冷启动数据刷新功能说明

## 功能概述

在每次冷启动时，自动获取最新的用户数据并更新全局数据和本地登录态，确保用户使用的是最新的数据。

**注意：** 本功能复用了 `userInfoUtils.js` 中已有的 `refreshUserInfo` 工具函数，避免重复代码。

**错误修复：** 采用双管齐下的策略，工具函数内部进行安全检查后主动更新全局数据，同时返回数据供外部使用。`app.js` 也主动更新全局数据确保数据同步，既解决了 `getApp()` 初始化问题，又保证了数据更新的可靠性。

## 实现逻辑

### 双管齐下策略

为了确保数据更新的可靠性，采用了双管齐下的策略：

1. **工具函数内部更新**：`userInfoUtils.refreshUserInfo()` 在获取数据后，会进行安全检查，如果应用实例已初始化，则主动更新全局数据
2. **外部主动更新**：`app.js` 中的 `refreshUserData()` 也会主动更新全局数据，确保数据同步

这种策略的优势：

- **可靠性高**：即使工具函数内部更新失败，外部也会确保更新
- **兼容性好**：适应不同的调用场景和时机
- **容错性强**：多重保障确保数据一致性

### 1. 检查登录状态

```javascript
checkLoginStatus: function () {
  try {
    // 先从本地存储获取登录结果
    const loginResult = wx.getStorageSync("loginResult");

    if (loginResult && loginResult.success) {
      // 有有效的登录数据，保存到全局数据
      this.globalData.loginResult = loginResult;
      console.log("检测到用户已登录:", loginResult.nickname);

      // 冷启动时获取最新用户数据并更新
      this.refreshUserData();
    } else {
      // 没有登录数据，跳转到登录页面
      console.log("未检测到登录状态，跳转到登录页面");
      this.redirectToLogin();
    }
  } catch (e) {
    console.error("检查登录状态失败:", e);
    this.redirectToLogin();
  }
}
```

### 2. 刷新用户数据

```javascript
refreshUserData: function () {
  console.log("开始刷新用户数据...");

  // 使用工具函数获取最新用户数据（工具函数内部也会尝试更新全局数据）
  userInfoUtils
    .refreshUserInfo()
    .then((result) => {
      if (result.success) {
        // 确保全局数据已更新（双管齐下）
        this.globalData.loginResult = {
          success: true,
          ...result.userInfo,
        };
        console.log("用户数据刷新完成:", this.globalData.loginResult);
      } else {
        console.error("获取用户数据失败:", result.error);
      }
    })
    .catch((error) => {
      console.error("刷新用户数据失败:", error);
      // 即使获取失败，也不影响用户继续使用，只是使用本地缓存的数据
    });
}
```

## 执行流程

### 1. 小程序启动

- 用户打开小程序
- 触发 `onLaunch` 生命周期函数

### 2. 检查登录状态

- 从本地存储获取登录结果
- 如果有有效登录数据，保存到全局数据

### 3. 刷新用户数据

- 调用 `get-user-info` 云函数获取最新数据
- 更新全局数据 `globalData.loginResult`
- 更新本地存储 `loginResult`

### 4. 数据同步

- 确保全局数据和本地存储的数据一致
- 保持最新的用户信息和账户数据

## 优势

### 1. 数据实时性

- 每次冷启动都获取最新数据
- 避免使用过期的用户信息
- 确保账户数据是最新的

### 2. 用户体验

- 用户无需手动刷新数据
- 自动同步最新状态
- 保持登录状态的同时更新数据

### 3. 数据一致性

- 全局数据和本地存储保持同步
- 避免数据不一致的问题
- 确保所有页面使用相同的数据

### 4. 容错处理

- 即使获取最新数据失败，也不影响用户使用
- 使用本地缓存数据作为备选
- 保证应用的稳定性

## 云函数要求

### get-user-info 云函数

需要实现以下功能：

- 接收 `userId` 参数
- 返回最新的用户信息
- 包含账户数据（accounts 数组）

### 返回格式

```javascript
{
  success: true,
  userInfo: {
    userId: "用户ID",
    nickname: "用户昵称",
    phone: "手机号",
    accounts: [
      {
        accountId: "账户ID",
        platform: "平台",
        trackType: "赛道类型",
        accountNickname: "账户昵称",
        phoneNumber: "账户手机号",
        isViolation: false,
        screenshotUrl: "截图URL",
        createTime: "创建时间",
        updateTime: "更新时间"
      }
    ]
  }
}
```

## 测试验证

### 1. 数据更新验证

- 检查控制台输出，确认数据刷新成功
- 验证全局数据是否包含最新的账户信息
- 确认本地存储已更新

### 2. 容错测试

- 模拟网络失败，确认不影响用户使用
- 验证使用本地缓存数据的情况

### 3. 数据一致性测试

- 确认全局数据和本地存储数据一致
- 验证测试页面能获取到最新数据

## 注意事项

### 1. 网络依赖

- 需要网络连接才能获取最新数据
- 网络失败时使用本地缓存数据

### 2. 云函数性能

- 确保 `get-user-info` 云函数响应及时
- 避免影响小程序启动速度

### 3. 数据量控制

- 控制返回数据的大小
- 避免传输过多不必要的数据

## 总结

通过这个功能，实现了冷启动时自动刷新用户数据的需求。这确保了用户每次使用小程序时都能获取到最新的数据，同时保持了良好的用户体验和数据一致性。
