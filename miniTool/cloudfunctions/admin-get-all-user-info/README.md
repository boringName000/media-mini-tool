# admin-get-all-user-info 云函数

## 功能描述

管理端获取所有用户信息的云函数，支持高性能的游标分页查询。

## 技术方案

### 分页策略：游标分页 (Cursor-based Pagination)

**选择理由：**
1. **性能稳定**：查询时间不受分页深度影响，适合1万用户规模
2. **扩展性好**：未来数据增长仍能保持良好性能
3. **排序友好**：天然支持按 `lastUpdateTimestamp` 排序

**核心优势：**
- 查询复杂度：O(log n) - 基于索引的范围查询
- 内存使用：固定 - 每次只加载一页数据
- 网络传输：优化 - 避免传输不必要的数据

## 请求参数

```javascript
{
  pageSize: 20,           // 每页数量，默认20，最大100
  cursor: null,           // 游标，用于分页（首次查询不传）
  direction: 'next',      // 分页方向：'next'下一页，'prev'上一页
  filters: {              // 筛选条件（可选）
    status: 1,            // 用户状态：1-正常，0-禁用
    hasAccounts: true,    // 账号筛选：true-有账号，false-无账号
    keyword: '张三'        // 关键词搜索（昵称、手机号）
  }
}
```

## 返回结果

```javascript
{
  success: true,
  message: '获取用户数据成功',
  data: [                 // 用户数据列表
    {
      userId: 'xxx',
      nickname: 'xxx',
      phone: 'xxx',
      status: 1,
      // ... 其他用户字段
      accounts: [...],    // 完整账号信息
      // 统计信息
      totalAccounts: 5,
      activeAccounts: 4,
      disabledAccounts: 1,
      pendingAuditAccounts: 2,
      approvedAccounts: 2,
      rejectedAccounts: 1,
      totalPosts: 10,
      totalRejectPosts: 2
    }
  ],
  pagination: {
    nextCursor: 'xxx',    // 下一页游标
    prevCursor: 'xxx',    // 上一页游标
    hasNext: true,        // 是否有下一页
    hasPrev: false,       // 是否有上一页
    pageSize: 20,         // 当前页面大小
    total: 1000           // 总数据量（估算）
  },
  overview: {             // 全库统计概览（仅首次查询返回）
    totalUsers: 1000,     // 总用户数
    activeUsers: 850,     // 活跃用户数（status=1）
    usersWithAccounts: 600, // 有账号用户数
    disabledUsers: 150    // 禁用用户数（status=0）
  }
}
```

## 使用示例

### 首次查询
```javascript
const result = await wx.cloud.callFunction({
  name: 'admin-get-all-user-info',
  data: {
    pageSize: 20
  }
})
```

### 下一页查询
```javascript
const nextResult = await wx.cloud.callFunction({
  name: 'admin-get-all-user-info',
  data: {
    pageSize: 20,
    cursor: result.result.pagination.nextCursor,
    direction: 'next'
  }
})
```

### 带筛选条件查询
```javascript
// 筛选有账号的正常用户
const filteredResult = await wx.cloud.callFunction({
  name: 'admin-get-all-user-info',
  data: {
    pageSize: 20,
    filters: {
      status: 1,
      hasAccounts: true,
      keyword: '张三'
    }
  }
})

// 筛选无账号的用户
const noAccountsResult = await wx.cloud.callFunction({
  name: 'admin-get-all-user-info',
  data: {
    pageSize: 20,
    filters: {
      hasAccounts: false
    }
  }
})
```

## 性能特点

- **1万用户**：每页查询 < 100ms
- **10万用户**：每页查询 < 200ms
- **支持并发**：不会因为分页深度影响性能
- **内存优化**：固定内存使用，不会随数据量增长

## 数据库索引建议

为了获得最佳性能，建议在 `user-info` 集合上创建以下复合索引：

```javascript
// 主要排序索引
db.collection('user-info').createIndex({
  "lastUpdateTimestamp": -1,
  "_id": -1
})

// 筛选条件索引
db.collection('user-info').createIndex({
  "status": 1,
  "lastUpdateTimestamp": -1
})

// 账号存在性索引
db.collection('user-info').createIndex({
  "accounts": 1,
  "lastUpdateTimestamp": -1
})

// 搜索索引
db.collection('user-info').createIndex({
  "nickname": "text",
  "phone": "text"
})
```

## 注意事项

1. **游标有效性**：游标包含时间戳和ID信息，请妥善保存
2. **数据一致性**：分页过程中数据可能发生变化，这是正常现象
3. **内存限制**：单次查询最大100条记录，避免内存溢出
4. **索引依赖**：性能依赖于数据库索引，请确保索引已创建
5. **排序一致性**：查询时先排序后筛选，确保游标分页的一致性
6. **复合条件**：游标条件与筛选条件会自动合并，保证查询准确性

## 错误处理

- **400**：参数错误（无效的游标、页面大小等）
- **500**：服务器内部错误（数据库连接失败等）

所有错误都会返回详细的错误信息，便于调试和问题定位。