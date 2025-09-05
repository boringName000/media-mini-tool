# 领取每日任务云函数

## 📋 概述

`claim-daily-task` 云函数用于用户领取指定的每日任务，更新任务的领取状态并同步更新文章状态。

## 🎯 功能特性

### **1. 任务领取**

- ✅ **任务验证**: 验证任务是否存在且未被领取
- ✅ **状态更新**: 更新任务的 `isClaimed` 字段为 `true`
- ✅ **文章状态同步**: 同步更新文章状态为"已使用"

### **2. 参数验证**

- ✅ **用户验证**: 验证用户 ID、用户状态
- ✅ **账号验证**: 验证账号 ID、账号状态
- ✅ **任务验证**: 验证任务 ID、任务存在性、领取状态

### **3. 错误处理**

- ✅ **友好提示**: 提供详细的错误信息
- ✅ **异常捕获**: 完善的错误处理和日志记录
- ✅ **数据一致性**: 确保任务和文章状态的一致性

## 🔧 技术实现

### **1. 云函数结构**

```
claim-daily-task/
├── index.js          # 主函数文件
├── package.json      # 依赖配置
├── config.json       # 云函数配置
└── README.md         # 详细文档
```

### **2. 核心逻辑**

```javascript
// 参数验证和任务查找
const { userId, accountId, taskId } = event;

// 查找用户和账号
const user = await db.collection("user-info").where({ userId }).get();
const account = user.accounts.find((acc) => acc.accountId === accountId);

// 查找任务
const task = account.dailyTasks.find((task) => task.articleId === taskId);

// 更新任务状态
task.isClaimed = true;

// 更新文章状态
await db
  .collection("article-mgr")
  .where({ articleId: taskId })
  .update({
    data: { status: ArticleStatusEnum.USED },
  });
```

## 📊 数据流程

### **1. 请求流程**

```
前端调用 → 参数验证 → 用户验证 → 账号验证 → 任务验证 → 更新任务状态 → 更新文章状态 → 返回结果
```

### **2. 返回数据结构**

```javascript
{
  success: true,
  message: "任务领取成功",
  data: {
    claimedTask: {
      articleId: "ART1123456123",
      articleTitle: "美食文章",
      trackType: 1,
      platformType: 1,
      downloadUrl: "https://example.com/article.txt",
      taskTime: "2024-01-15T10:00:00.000Z",
      isCompleted: false,
      isClaimed: true
    },
    allDailyTasks: [...], // 该账号的全部每日任务
    accountId: "AC00001",
    totalTasks: 10
  }
}
```

## 🚀 使用示例

### **1. 前端调用**

```javascript
// 调用云函数
wx.cloud
  .callFunction({
    name: "claim-daily-task",
    data: {
      userId: "user123",
      accountId: "AC00001",
      taskId: "ART1123456123",
    },
  })
  .then((res) => {
    if (res.result.success) {
      const claimedTask = res.result.data.claimedTask;
      const allTasks = res.result.data.allDailyTasks;

      console.log("任务领取成功:", claimedTask);
      console.log("全部任务:", allTasks);
    } else {
      console.error("任务领取失败:", res.result.message);
    }
  })
  .catch((err) => {
    console.error("云函数调用失败:", err);
  });
```

### **2. 在任务列表页面使用**

```javascript
// 领取任务
async claimTask(taskId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'claim-daily-task',
      data: {
        userId: this.data.userId,
        accountId: this.data.accountId,
        taskId: taskId
      }
    });

    if (result.result.success) {
      // 更新本地任务列表
      this.setData({
        dailyTasks: result.result.data.allDailyTasks
      });

      wx.showToast({
        title: '任务领取成功',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: result.result.message,
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('领取任务失败:', error);
    wx.showToast({
      title: '领取失败',
      icon: 'none'
    });
  }
}
```

## 📝 部署指南

### **1. 自动部署**

```bash
# 使用部署脚本
cd miniTool/scripts/clouddeploy
./deploy-claim-daily-task.sh
```

### **2. 手动部署**

```bash
# 进入云函数目录
cd miniTool/cloudfunctions/claim-daily-task

# 安装依赖
npm install

# 部署云函数
wx cloud functions deploy claim-daily-task --force
```

### **3. 部署检查**

```bash
# 检查语法
node -c index.js

# 检查依赖
npm list
```

## 🔍 错误处理

### **1. 常见错误**

| 错误类型           | 原因                 | 解决方案                  |
| ------------------ | -------------------- | ------------------------- |
| `用户ID不能为空`   | 未提供 `userId`      | 确保传入 `userId` 参数    |
| `账号ID不能为空`   | 未提供 `accountId`   | 确保传入 `accountId` 参数 |
| `任务ID不能为空`   | 未提供 `taskId`      | 确保传入 `taskId` 参数    |
| `用户不存在`       | 用户 ID 无效         | 检查用户 ID 是否正确      |
| `账号不存在`       | 账号 ID 无效         | 检查账号 ID 是否正确      |
| `任务不存在`       | 任务 ID 无效         | 检查任务 ID 是否正确      |
| `任务已经被领取`   | 任务已被其他用户领取 | 选择其他未领取的任务      |
| `用户账号已被禁用` | 用户状态异常         | 联系管理员处理            |
| `账号已被禁用`     | 账号状态异常         | 联系管理员处理            |

### **2. 调试建议**

- 检查传入的参数格式是否正确
- 确认用户和账号状态是否正常
- 查看云函数日志获取详细错误信息
- 使用测试数据验证云函数功能

## 📈 性能优化

### **1. 查询优化**

- **精确查询**: 使用精确的用户 ID 和账号 ID 进行查询
- **索引利用**: 利用数据库索引提高查询效率
- **批量操作**: 减少数据库操作次数

### **2. 内存优化**

- **字段选择**: 只查询必要的字段，减少数据传输
- **结果过滤**: 在查询时进行过滤，减少返回数据量
- **缓存策略**: 考虑对频繁查询的数据进行缓存

## 🔗 相关文档

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [数据库操作指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [云函数开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)

---

**创建时间**: 2024-01-15  
**版本**: 1.0.0  
**状态**: ✅ 已完成并测试
