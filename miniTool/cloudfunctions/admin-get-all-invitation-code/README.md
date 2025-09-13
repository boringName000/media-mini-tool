# admin-get-all-invitation-code

管理员获取所有邀请码数据的云函数，用于管理端邀请码管理页面展示所有邀请码信息。

## 功能描述

获取 `invitation-code-mgr` 集合中的所有邀请码数据，并提供以下功能：

1. **获取完整数据** - 返回所有邀请码的完整信息
2. **状态计算** - 自动计算邀请码是否过期和剩余有效天数
3. **时间处理** - 统一处理不同格式的时间戳
4. **统计信息** - 提供总数、有效数、过期数等统计
5. **排序** - 按创建时间倒序排列

## 参数

无需传入参数，云函数会自动获取所有邀请码数据。

## 返回值

```javascript
{
  success: true,
  data: [
    {
      invitationCode: "ABC123DEFG",     // 邀请码
      createTime: Date,                 // 创建时间（Date对象）
      creatorId: "创建者openid",
      isExpired: false,                 // 是否过期
      remainingDays: 25,               // 剩余有效天数（过期则为null）
      expirationDays: 30               // 总有效期天数
    },
    // ... 更多邀请码数据
  ],
  statistics: {
    totalCount: 50,    // 总邀请码数
    validCount: 35,    // 有效邀请码数
    expiredCount: 15   // 过期邀请码数
  },
  timestamp: "2025-09-13T09:00:00.000Z",
  openid: "调用者openid",
  // ... 其他系统信息
}
```

## 数据字段说明

### 输入数据（invitation-code-mgr 集合）
- **invitationCode**: 邀请码字符串
- **createTime**: 创建时间（db.serverDate()格式）
- **creatorId**: 创建者ID（openid）
- **_id**: 数据库记录ID

### 输出数据（处理后）
- **invitationCode**: 邀请码
- **createTime**: 标准化的Date对象
- **creatorId**: 创建者ID
- **isExpired**: 是否过期（布尔值）
- **remainingDays**: 剩余有效天数（数字或null）
- **expirationDays**: 总有效期天数（固定30天）

## 业务规则

- **有效期**: 邀请码有效期为30天
- **排序**: 按创建时间倒序排列（最新的在前）
- **状态判断**: 自动计算每个邀请码的过期状态
- **时间处理**: 兼容多种时间格式（db.serverDate、Timestamp、Date等）

## 使用场景

1. **管理端邀请码列表**: 为管理端提供完整的邀请码数据
2. **邀请码统计**: 提供邀请码使用情况的统计信息
3. **过期管理**: 识别和管理过期的邀请码

## 性能考虑

- 使用单次查询获取所有数据，适合中小规模邀请码管理
- 如果邀请码数量很大（>1000），建议添加分页功能
- 数据按创建时间排序，便于管理员查看最新邀请码

## 错误处理

- 数据库查询失败时返回错误信息
- 时间格式处理异常时会记录错误但不中断处理
- 返回统一的错误格式便于前端处理

## 版本历史

- **v1.0**: 初始版本，实现基础的邀请码数据获取和状态计算功能