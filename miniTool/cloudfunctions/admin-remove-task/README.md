# admin-remove-task 云函数

## 功能描述

管理员移除任务云函数，用于批量处理过期任务的移除操作。主要功能包括：
1. 清空指定用户账号下的每日任务字段数组内容
2. 将相关文章状态修改为待重新修改状态
3. 支持批量操作，提高处理效率

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `tasks` | Array | ✅ | 任务数组，包含需要移除的任务信息 |

### tasks 数组元素结构

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `userId` | String | ✅ | 用户ID |
| `accountId` | String | ✅ | 账号ID |
| `articleId` | String | ✅ | 文章ID |

## 返回数据结构

```javascript
{
  success: Boolean,
  message: String,
  data: {
    processedUsers: Number,        // 处理的用户数量
    processedAccounts: Number,     // 处理的账号数量
    clearedTasks: Number,          // 清空的任务数量
    updatedArticles: Number,       // 更新的文章数量
    errors: [                      // 错误信息数组
      {
        userId: String,            // 出错的用户ID（可选）
        error: String,             // 错误信息
        type: String,              // 错误类型：'user_processing' | 'article_update' | 'article_batch_update'
        batchStart: Number,        // 批次开始位置（批量更新错误时）
        batchEnd: Number           // 批次结束位置（批量更新错误时）
      }
    ]
  },
  timestamp: String,
  openid: String,
  appid: String,
  unionid: String
}
```

## 核心功能

### 1. 清空每日任务
- 根据用户ID和账号ID定位到具体账号
- 清空该账号下的 `dailyTasks` 数组
- 更新用户的 `lastUpdateTimestamp` 字段

### 2. 更新文章状态
- 根据文章ID批量查询文章信息
- 将文章状态修改为 `status: 3`（待重新修改）
- 支持批量更新，提高处理效率

## 性能优化特性

### 1. 高性能数据库查询
- 使用精确字段查询：`field({ accounts: true })`
- 使用索引友好的条件查询：`where({ userId: userId })`
- 批量更新文章：`where({ articleId: _.in(batchArticleIds) })`

### 2. 批量操作策略
- **用户分组**：按用户ID分组处理，减少数据库连接次数
- **批量更新**：文章更新每批处理20篇，避免单次操作过多数据
- **内存优化**：使用Map数据结构提高查找效率

### 3. 错误处理机制
- **分批容错**：单个批次失败不影响其他批次处理
- **详细错误记录**：记录具体的错误类型、位置和原因
- **操作统计**：返回详细的处理结果统计信息

## 使用示例

### 单个任务移除
```javascript
wx.cloud.callFunction({
  name: 'admin-remove-task',
  data: {
    tasks: [{
      userId: "user123",
      accountId: "AC00001", 
      articleId: "ART1234567890"
    }]
  }
})
```

### 批量任务移除
```javascript
wx.cloud.callFunction({
  name: 'admin-remove-task',
  data: {
    tasks: [
      { userId: "user123", accountId: "AC00001", articleId: "ART1111111111" },
      { userId: "user123", accountId: "AC00002", articleId: "ART2222222222" },
      { userId: "user456", accountId: "AC00003", articleId: "ART3333333333" }
    ]
  }
})
```

### 批量移除用户所有过期任务
```javascript
// 假设从 admin-task-expired-users 获取的数据
const expiredTasksData = [
  {
    userId: "user123",
    accounts: [
      {
        accountId: "AC00001",
        expiredTasks: [
          { articleId: "ART1111111111" },
          { articleId: "ART2222222222" }
        ]
      }
    ]
  }
];

// 转换为 admin-remove-task 需要的格式
const tasks = [];
expiredTasksData.forEach(user => {
  user.accounts.forEach(account => {
    account.expiredTasks.forEach(task => {
      tasks.push({
        userId: user.userId,
        accountId: account.accountId,
        articleId: task.articleId
      });
    });
  });
});

wx.cloud.callFunction({
  name: 'admin-remove-task',
  data: { tasks }
})
```

## 数据库操作详情

### 1. 用户信息更新
```javascript
// 查询用户信息（只获取accounts字段）
const userResult = await db.collection('user-info')
  .where({ userId: userId })
  .field({ accounts: true })
  .get();

// 更新用户账号信息
await db.collection('user-info')
  .where({ userId: userId })
  .update({
    data: {
      accounts: updatedAccounts,
      lastUpdateTimestamp: db.serverDate()
    }
  });
```

### 2. 文章状态更新
```javascript
// 批量更新文章状态
const updateResult = await db.collection('article-mgr')
  .where({
    articleId: _.in(batchArticleIds)
  })
  .update({
    data: {
      status: 3 // 待重新修改
    }
  });
```

## 错误处理

| 错误码 | 错误信息 | 说明 |
|--------|----------|------|
| `INVALID_PARAMS` | 参数错误：tasks 必须是非空数组 | 输入参数格式错误 |
| `INVALID_TASK_PARAMS` | 参数错误：第 X 个任务缺少必填字段 | 任务对象缺少必填字段 |
| `REMOVE_TASK_ERROR` | 移除任务操作失败 | 系统错误，查看详细错误信息 |

## 安全特性

1. **参数验证**：严格验证输入参数格式和必填字段
2. **权限控制**：通过云函数调用权限控制访问
3. **错误隔离**：单个操作失败不影响整体流程
4. **操作日志**：详细记录所有操作过程和结果

## 注意事项

1. **权限控制**：此云函数应仅供管理员使用，建议在调用前验证用户权限
2. **数据一致性**：操作会同时修改用户信息和文章信息，确保数据一致性
3. **批量限制**：建议单次操作不超过100个任务，避免超时
4. **错误处理**：注意检查返回的errors数组，处理可能的部分失败情况
5. **性能监控**：建议监控函数执行时间，根据实际情况调整批次大小

## 版本历史

- **v1.0**：初始版本，支持批量移除任务和更新文章状态功能