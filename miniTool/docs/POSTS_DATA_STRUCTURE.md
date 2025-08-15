# 文章数据结构扩展说明

## 概述

将账号数据结构中的 `totalPosts` 字段改为 `posts` 数组，以支持存储详细的文章发布数据。

## 字段变更

### 变更前

```javascript
{
  // ... 其他字段
  totalPosts: 0,                 // 总发文数量（数字）
  // ... 其他字段
}
```

### 变更后

```javascript
{
  // ... 其他字段
  posts: [],                     // 已发布的文章数据数组
  // ... 其他字段
}
```

## 文章数据结构设计

### 基础文章对象

```javascript
{
  postId: "string",              // 文章唯一ID
  title: "string",               // 文章标题
  content: "string",             // 文章内容（可选）
  publishTime: Date,             // 发布时间
  platform: "string",            // 发布平台
  status: "string",              // 文章状态：draft-草稿，published-已发布，deleted-已删除
  views: number,                 // 浏览量
  likes: number,                 // 点赞数
  comments: number,              // 评论数
  shares: number,                // 分享数
  tags: ["string"],              // 标签数组
  images: ["string"],            // 图片URL数组
  videoUrl: "string",            // 视频URL（可选）
  location: "string",            // 发布位置（可选）
  isTop: boolean,                // 是否置顶
  isRecommend: boolean,          // 是否推荐
  createTimestamp: Date,         // 创建时间戳
  updateTimestamp: Date          // 更新时间戳
}
```

### 扩展字段（可选）

```javascript
{
  // ... 基础字段
  category: "string",            // 文章分类
  topic: "string",               // 话题标签
  mentionUsers: ["string"],      // @用户列表
  mentionProducts: ["string"],   // @商品列表
  monetization: {                // 变现信息
    type: "string",              // 变现类型：ad-广告，product-商品，service-服务
    amount: number,              // 变现金额
    currency: "string"           // 货币类型
  },
  performance: {                 // 性能指标
    engagementRate: number,      // 互动率
    reachRate: number,           // 触达率
    conversionRate: number       // 转化率
  }
}
```

## 使用示例

### 1. 添加文章数据

```javascript
// 在账号的posts数组中添加新文章
const newPost = {
  postId: "POST_" + Date.now(),
  title: "美食探店分享",
  content: "今天发现了一家超棒的餐厅...",
  publishTime: new Date(),
  platform: "XIAOHONGSHU",
  status: "published",
  views: 1250,
  likes: 89,
  comments: 12,
  shares: 5,
  tags: ["美食", "探店", "推荐"],
  images: ["https://example.com/image1.jpg"],
  createTimestamp: new Date(),
  updateTimestamp: new Date(),
};

// 更新账号数据
const updatedAccount = {
  ...existingAccount,
  posts: [...existingAccount.posts, newPost],
  dailyPostCount: existingAccount.posts.length + 1,
  lastPostTime: newPost.publishTime,
};
```

### 2. 查询文章数据

```javascript
// 获取账号的所有文章
const allPosts = account.posts;

// 获取最近发布的文章
const recentPosts = account.posts
  .filter((post) => post.status === "published")
  .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
  .slice(0, 10);

// 获取高互动文章
const highEngagementPosts = account.posts.filter(
  (post) => post.likes > 100 || post.comments > 20
);

// 按月份统计文章数量
const monthlyStats = account.posts.reduce((stats, post) => {
  const month = new Date(post.publishTime).toISOString().slice(0, 7);
  stats[month] = (stats[month] || 0) + 1;
  return stats;
}, {});
```

### 3. 更新文章数据

```javascript
// 更新文章互动数据
const updatePostStats = (accountId, postId, newStats) => {
  const account = findAccountById(accountId);
  const postIndex = account.posts.findIndex((post) => post.postId === postId);

  if (postIndex !== -1) {
    account.posts[postIndex] = {
      ...account.posts[postIndex],
      ...newStats,
      updateTimestamp: new Date(),
    };

    // 更新数据库
    updateAccountInDatabase(account);
  }
};

// 使用示例
updatePostStats("AC00001", "POST_123456", {
  views: 1500,
  likes: 95,
  comments: 15,
});
```

## 数据统计功能

### 1. 基础统计

```javascript
const getAccountStats = (account) => {
  const posts = account.posts.filter((post) => post.status === "published");

  return {
    totalPosts: posts.length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0),
    totalLikes: posts.reduce((sum, post) => sum + post.likes, 0),
    totalComments: posts.reduce((sum, post) => sum + post.comments, 0),
    totalShares: posts.reduce((sum, post) => sum + post.shares, 0),
    averageEngagement:
      posts.length > 0
        ? posts.reduce((sum, post) => sum + post.likes + post.comments, 0) /
          posts.length
        : 0,
  };
};
```

### 2. 时间维度统计

```javascript
const getTimeBasedStats = (account, timeRange = "month") => {
  const posts = account.posts.filter((post) => post.status === "published");
  const now = new Date();

  const filteredPosts = posts.filter((post) => {
    const postDate = new Date(post.publishTime);
    const diffTime = now - postDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (timeRange) {
      case "week":
        return diffDays <= 7;
      case "month":
        return diffDays <= 30;
      case "quarter":
        return diffDays <= 90;
      case "year":
        return diffDays <= 365;
      default:
        return true;
    }
  });

  return getAccountStats({ posts: filteredPosts });
};
```

## 数据库优化建议

### 1. 索引设计

```javascript
// 为posts数组中的常用查询字段创建索引
{
  "accounts.posts.postId": 1,
  "accounts.posts.publishTime": -1,
  "accounts.posts.status": 1,
  "accounts.posts.platform": 1
}
```

### 2. 分页查询

```javascript
// 支持分页查询文章列表
const getPostsWithPagination = (account, page = 1, pageSize = 20) => {
  const posts = account.posts
    .filter((post) => post.status === "published")
    .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    posts: posts.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      pageSize: pageSize,
      totalPosts: posts.length,
      totalPages: Math.ceil(posts.length / pageSize),
    },
  };
};
```

## 迁移策略

### 1. 数据迁移

```javascript
// 将现有的totalPosts数据迁移到posts数组
const migrateTotalPostsToPostsArray = (userData) => {
  const updatedAccounts = userData.accounts.map((account) => {
    if (account.totalPosts && account.totalPosts > 0 && !account.posts) {
      // 创建占位文章数据
      const placeholderPosts = Array.from(
        { length: account.totalPosts },
        (_, index) => ({
          postId: `MIGRATED_${account.accountId}_${index + 1}`,
          title: `历史文章 ${index + 1}`,
          content: "数据迁移中的历史文章",
          publishTime: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // 按时间倒序
          platform: account.platform?.type || "UNKNOWN",
          status: "published",
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          tags: ["历史数据"],
          images: [],
          createTimestamp: new Date(),
          updateTimestamp: new Date(),
        })
      );

      return {
        ...account,
        posts: placeholderPosts,
        totalPosts: undefined, // 移除旧字段
      };
    }
    return account;
  });

  return {
    ...userData,
    accounts: updatedAccounts,
  };
};
```

### 2. 兼容性处理

```javascript
// 在读取数据时处理兼容性
const getAccountPosts = (account) => {
  // 如果存在posts数组，直接返回
  if (account.posts && Array.isArray(account.posts)) {
    return account.posts;
  }

  // 如果只有totalPosts，返回空数组（后续会迁移）
  if (account.totalPosts) {
    console.warn(
      `Account ${account.accountId} still uses old totalPosts field`
    );
    return [];
  }

  return [];
};
```

## 总结

通过将 `totalPosts` 改为 `posts` 数组，我们获得了以下优势：

- ✅ **详细数据存储** - 可以存储每篇文章的详细信息
- ✅ **统计分析能力** - 支持多维度数据分析和统计
- ✅ **历史记录追踪** - 完整记录文章发布历史
- ✅ **性能指标监控** - 跟踪文章表现和互动数据
- ✅ **扩展性** - 支持未来功能扩展（如文章分类、标签等）
- ✅ **数据完整性** - 提供更完整的内容管理能力

这个变更为后续的文章管理、数据分析和内容运营提供了强大的数据基础。
