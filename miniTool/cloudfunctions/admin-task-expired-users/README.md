# admin-task-expired-users 云函数

## 功能描述

查询用户每个账号的数据，检查每个账号下的每日任务字段，检查任务时间是否过期（不是当日的就算过期），返回查询到的用户数据。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `page` | Number | ❌ | 1 | 页码，从1开始 |
| `pageSize` | Number | ❌ | 20 | 每页数量，范围1-100 |
| `includeUserInfo` | Boolean | ❌ | false | 是否包含用户基础信息（昵称、手机号等） |

## 返回数据结构

```javascript
{
  success: Boolean,
  message: String,
  data: {
    users: [
      {
        userId: String,                    // 用户ID
        nickname: String,                  // 用户昵称（当includeUserInfo=true时返回）
        phone: String,                     // 用户手机号（当includeUserInfo=true时返回）
        accounts: [                        // 有过期任务的账号列表
          {
            accountId: String,             // 账号ID
            accountNickname: String,       // 账号昵称
            platform: Number,              // 平台类型
            trackType: Number,             // 赛道类型
            phoneNumber: String,           // 账号手机号
            status: Number,                // 账号状态
            auditStatus: Number,           // 审核状态
            expiredTasks: [                // 过期任务列表
              {
                articleId: String,         // 文章ID
                articleTitle: String,      // 文章标题
                trackType: Number,         // 赛道类型
                platformType: Number,      // 平台类型
                taskTime: Date,            // 任务时间
                isCompleted: Boolean,      // 是否完成
                isClaimed: Boolean,        // 是否领取
                isExpired: Boolean,        // 是否过期（固定为true）
                expiredDays: Number        // 过期天数
              }
            ],
            expiredTasksCount: Number,     // 过期任务数量
            totalTasksCount: Number        // 总任务数量
          }
        ],
        totalExpiredTasksCount: Number,    // 用户总过期任务数量
        accountsWithExpiredTasksCount: Number, // 有过期任务的账号数量
        totalAccountsCount: Number         // 用户总账号数量
      }
    ],
    pagination: {
      page: Number,                        // 当前页码
      pageSize: Number,                    // 每页数量
      totalCount: Number,                  // 总记录数
      totalPages: Number,                  // 总页数
      hasNextPage: Boolean,                // 是否有下一页
      hasPrevPage: Boolean                 // 是否有上一页
    },
    queryInfo: {
      todayStart: String,                  // 当日开始时间
      todayEnd: String,                    // 当日结束时间
      includeUserInfo: Boolean,            // 是否包含用户信息
      strategy: String                     // 查询策略：'database_query'
    }
  },
  timestamp: String,
  openid: String,
  appid: String,
  unionid: String
}
```

## 性能优化特性

### 1. 统一查询策略
- 使用数据库条件查询，逻辑单一清晰
- 分批查询避免单次查询数据量过大
- 只查询有账号的用户，减少无效数据传输

### 2. 条件查询优化
- 只查询有账号的用户（`accounts` 字段存在且非空）
- 支持选择性字段查询，减少数据传输量
- 使用索引友好的查询条件

### 3. 分页机制
- 支持标准的分页参数（page, pageSize）
- 返回完整的分页信息，便于前端实现分页组件
- 按过期任务数量降序排序，优先显示问题较严重的用户

### 4. 内存优化
- 分批处理大数据集，避免内存溢出
- 及时释放不需要的数据引用
- 使用流式处理减少峰值内存占用

## 过期任务判断逻辑

任务被认为过期的条件（必须同时满足）：
- `isClaimed` 为 `true`（任务已领取）
- `isCompleted` 为 `false`（任务未完成）
- `taskTime` 不在当日时间范围内（< 当日00:00:00 或 > 当日23:59:59）

过期天数计算：
- 正数：表示任务过期的天数
- 负数：表示未来的任务（理论上不应该存在）

## 使用示例

### 基础查询
```javascript
// 查询第一页，每页20条记录
wx.cloud.callFunction({
  name: 'admin-task-expired-users',
  data: {
    page: 1,
    pageSize: 20
  }
})
```

### 包含用户信息的查询
```javascript
// 查询第二页，每页10条记录，包含用户基础信息
wx.cloud.callFunction({
  name: 'admin-task-expired-users',
  data: {
    page: 2,
    pageSize: 10,
    includeUserInfo: true
  }
})
```

## 错误处理

| 错误码 | 错误信息 | 说明 |
|--------|----------|------|
| `EXPIRED_TASK_QUERY_ERROR` | 查询过期任务用户失败 | 系统错误，查看详细错误信息 |
| - | 分页参数无效，page >= 1, pageSize 1-100 | 参数验证失败 |

## 注意事项

1. **权限控制**：此云函数应仅供管理员使用，建议在调用前验证用户权限
2. **数据量考虑**：当用户数量很大时，建议使用较小的pageSize以提高响应速度
3. **时区处理**：过期判断基于服务器时区，确保时区设置正确
4. **性能监控**：建议监控函数执行时间，根据实际情况调整查询策略阈值

## 版本历史

- **v1.0**：初始版本，支持过期任务查询和分页功能