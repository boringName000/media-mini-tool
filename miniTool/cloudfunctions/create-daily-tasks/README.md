# 创建每日任务云函数

## 功能描述

根据用户 ID 创建每日任务，自动更新过期的任务并分配新的文章。

## 主要功能

1. **用户验证**: 验证用户 ID 是否存在
2. **任务检查**: 检查用户账号的每日任务状态
3. **新账号初始化**: 为新账号创建初始每日任务
4. **过期任务更新**: 更新已过期的任务
5. **文章分配**: 为过期任务分配新的文章
6. **时间安排**: 为任务安排新的执行时间

## 入参

| 参数名   | 类型   | 必填 | 说明           |
| -------- | ------ | ---- | -------------- |
| `userId` | String | ✅   | 用户唯一标识符 |

## 返回值

### 成功返回

```javascript
{
  "success": true,
  "data": {
    "userId": "用户ID",
    "totalTasksCreated": 5,        // 创建的任务总数
    "totalTasksSkipped": 3,        // 跳过的任务总数
    "totalTasksContinued": 2,      // 继续原任务的总数
    "updatedAccounts": [           // 更新的账号列表
      {
        "accountId": "AC00001",
        "accountNickname": "美食账号",
        "tasksCreated": 2,
        "tasksSkipped": 1,
        "tasksContinued": 1
      }
    ],
    "totalAccounts": 3             // 用户总账号数
  },
  "message": "成功创建 5 个任务，继续 2 个任务，跳过 3 个任务"
}
```

### 失败返回

```javascript
{
  "success": false,
  "error": "错误类型",
  "message": "错误描述"
}
```

## 业务逻辑

### 1. 任务检查逻辑

- **新账号初始化**: 没有 dailyTasks 或 dailyTasks 为空的账号会创建初始任务
- **今天任务**: 任务时间在今天范围内的任务保持不变
- **过期任务**: 任务时间已过期的任务需要更新

### 2. 文章分配逻辑

- **初始任务创建**: 为新账号从 article-mgr 中随机选择符合赛道类型的文章
- **任务完成检查**: 通过检查 posts 数组判断任务是否已完成
- **状态同步**: 无论任务是否过期，都会同步更新 isCompleted 状态
- **继续原任务**: 未完成的任务继续使用原文章
- **分配新文章**: 已完成的任务分配新文章
- **赛道匹配**: 根据账号的赛道类型选择文章
- **排除已发布**: 排除账号已发布的文章
- **随机选择**: 从符合条件的文章中随机选择

### 3. 时间安排逻辑

- **当前时间**: 新任务使用当前时间
- **时间精度**: 精确到秒

## 数据库操作

### 查询操作

1. **用户信息查询**: 从 `user-info` 集合查询用户信息
2. **文章查询**: 从 `article-mgr` 集合查询可用文章

### 更新操作

1. **任务更新**: 更新用户账号的 `dailyTasks` 数组

## 错误处理

### 常见错误

| 错误类型     | 错误描述           | 解决方案                |
| ------------ | ------------------ | ----------------------- |
| 缺少必要参数 | 请提供用户 ID      | 检查入参是否包含 userId |
| 用户不存在   | 未找到指定用户     | 验证用户 ID 是否正确    |
| 用户无账号   | 用户没有关联的账号 | 检查用户是否已添加账号  |

### 异常处理

- **数据库异常**: 捕获并记录数据库操作异常
- **参数异常**: 验证入参格式和内容
- **业务异常**: 处理业务逻辑异常

## 使用示例

### 调用示例

```javascript
// 调用云函数
wx.cloud
  .callFunction({
    name: "create-daily-tasks",
    data: {
      userId: "user_openid_123",
    },
  })
  .then((res) => {
    if (res.result.success) {
      console.log("任务创建成功:", res.result.data);
    } else {
      console.error("任务创建失败:", res.result.message);
    }
  })
  .catch((err) => {
    console.error("云函数调用失败:", err);
  });
```

### 返回示例

```javascript
// 成功示例
{
  "success": true,
  "data": {
    "userId": "user_openid_123",
    "totalTasksCreated": 3,
    "totalTasksSkipped": 2,
    "updatedAccounts": [
      {
        "accountId": "AC00001",
        "accountNickname": "美食账号",
        "tasksCreated": 2,
        "tasksSkipped": 1
      },
      {
        "accountId": "AC00002",
        "accountNickname": "旅游账号",
        "tasksCreated": 1,
        "tasksSkipped": 1
      }
    ],
    "totalAccounts": 2
  },
  "message": "成功创建 3 个任务，跳过 2 个任务"
}

// 失败示例
{
  "success": false,
  "error": "用户不存在",
  "message": "未找到指定用户"
}
```

## 注意事项

1. **性能考虑**: 大量账号时可能需要分批处理
2. **文章库存**: 确保 article-mgr 数据库中有足够的文章
3. **时间精度**: 任务时间精确到秒
4. **并发安全**: 支持并发调用，但需要注意数据一致性

## 扩展功能

### 可能的扩展

1. **批量处理**: 支持批量用户任务创建
2. **时间优化**: 支持自定义时间分配策略
3. **优先级**: 支持任务优先级设置
4. **通知机制**: 任务创建后发送通知

## 版本历史

- **v1.0**: 初始版本，支持基本的每日任务创建功能
