# 登录获取最新用户信息函数

## 功能概述

`loginGetLatestUserInfo` 函数用于直接调用云函数获取最新的用户信息，不更新任何本地数据或全局数据，纯粹用于数据获取。

## 函数定义

```javascript
loginGetLatestUserInfo: async function () {
  try {
    console.log("开始获取最新用户信息...");

    // 直接调用云函数获取最新用户信息
    const res = await wx.cloud.callFunction({
      name: "get-user-info",
      data: {},
    });

    if (res && res.result && res.result.success) {
      console.log("获取最新用户信息成功:", res.result.userInfo);
      return {
        success: true,
        userInfo: res.result.userInfo,
        queryContext: res.result.queryContext,
      };
    } else {
      console.error("获取用户信息失败:", res.result);
      return {
        success: false,
        error: res.result.error || "获取用户信息失败",
      };
    }
  } catch (error) {
    console.error("调用获取用户信息云函数失败：", error);
    return {
      success: false,
      error: error.message || "网络错误",
    };
  }
}
```

## 使用场景

### 1. 纯数据获取

- 只需要获取最新用户信息，不需要更新本地状态
- 用于数据验证或检查
- 临时获取数据用于计算或显示

### 2. 自定义数据处理

- 获取数据后需要自定义处理逻辑
- 需要根据返回数据做条件判断
- 需要将数据传递给其他函数或组件

### 3. 避免副作用

- 不希望影响全局数据状态
- 不希望更新本地存储
- 只读操作场景

## 返回值格式

### 成功时

```javascript
{
  success: true,
  userInfo: {
    // 用户信息对象
    userId: "xxx",
    nickname: "xxx",
    accounts: [...],
    // 其他用户数据
  },
  queryContext: {
    // 查询上下文信息
  }
}
```

### 失败时

```javascript
{
  success: false,
  error: "错误信息"
}
```

## 使用示例

### 1. 基本使用

```javascript
const userInfoUtils = require("./utils/userInfoUtils");

// 获取最新用户信息
userInfoUtils.loginGetLatestUserInfo().then((result) => {
  if (result.success) {
    console.log("用户信息:", result.userInfo);
    // 自定义处理逻辑
  } else {
    console.error("获取失败:", result.error);
  }
});
```

### 2. 在 async/await 中使用

```javascript
async function checkUserInfo() {
  try {
    const result = await userInfoUtils.loginGetLatestUserInfo();
    if (result.success) {
      // 处理用户信息
      const userInfo = result.userInfo;
      // 自定义逻辑
    }
  } catch (error) {
    console.error("检查用户信息失败:", error);
  }
}
```

### 3. 条件判断

```javascript
userInfoUtils.loginGetLatestUserInfo().then((result) => {
  if (result.success && result.userInfo.accounts.length > 0) {
    // 用户有账户数据
    console.log("账户数量:", result.userInfo.accounts.length);
  } else {
    // 用户没有账户数据或获取失败
    console.log("无账户数据或获取失败");
  }
});
```

## 与其他函数的区别

| 函数                     | 功能                 | 是否更新全局数据 | 是否更新本地存储 | 适用场景         |
| ------------------------ | -------------------- | ---------------- | ---------------- | ---------------- |
| `getCurrentUserInfo`     | 获取当前用户信息     | ✅               | ❌               | 需要更新全局数据 |
| `refreshUserInfo`        | 刷新用户信息         | ✅               | ✅               | 完整的数据更新   |
| `loginGetLatestUserInfo` | 登录获取最新用户信息 | ❌               | ❌               | 纯数据获取       |

## 注意事项

1. **无副作用**：此函数不会修改任何本地数据或全局状态
2. **网络依赖**：需要网络连接才能获取数据
3. **错误处理**：调用方需要处理可能的网络错误
4. **数据新鲜度**：返回的是服务器端的最新数据
5. **权限要求**：需要用户已登录才能获取数据

## 最佳实践

1. **错误处理**：始终检查返回的 `success` 字段
2. **超时处理**：考虑添加超时机制
3. **缓存策略**：如果需要频繁调用，考虑添加缓存
4. **用户体验**：在获取数据时显示加载状态

通过这个函数，可以灵活地获取最新用户信息而不影响现有的数据状态，为不同的使用场景提供了更多的选择。
