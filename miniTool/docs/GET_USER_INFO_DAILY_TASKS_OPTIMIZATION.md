# get-user-info 云函数每日任务更新优化

## 📋 优化概述

在 `get-user-info` 云函数中，添加了前置判断逻辑，避免不必要的 `create-daily-tasks` 云函数调用，提升性能和响应速度。

## 🔧 优化内容

### **1. 前置判断逻辑**

在调用 `create-daily-tasks` 云函数之前，先检查用户的账号和每日任务状态：

#### **检查条件**

- ✅ **无账号**: 用户没有账号，跳过每日任务更新
- ✅ **无每日任务**: 账号没有 `dailyTasks` 数组或数组为空，需要初始化
- ✅ **任务过期**: 检查 `dailyTasks` 中的任务时间是否过期

#### **过期判断逻辑**

```javascript
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

for (const task of dailyTasks) {
  if (!task.taskTime) continue;

  const taskDate = new Date(task.taskTime);
  const taskDay = new Date(
    taskDate.getFullYear(),
    taskDate.getMonth(),
    taskDate.getDate()
  );

  if (taskDay < today) {
    // 发现过期任务，需要更新
    needUpdateDailyTasks = true;
    break;
  }
}
```

### **2. 条件调用**

只有在以下情况下才调用 `create-daily-tasks` 云函数：

- 用户有账号
- 账号缺少每日任务数据
- 存在过期的每日任务

### **3. 日志记录**

添加了详细的日志记录，便于调试和监控：

- 无账号时的跳过日志
- 需要初始化的账号信息
- 过期任务的账号信息
- 无需更新时的跳过日志

## 🎯 优化效果

### **性能提升**

- ✅ **减少云函数调用**: 避免不必要的 `create-daily-tasks` 调用
- ✅ **降低延迟**: 减少网络请求和数据库操作
- ✅ **节省资源**: 减少云函数执行次数和费用

### **用户体验**

- ✅ **响应更快**: `get-user-info` 响应时间更短
- ✅ **数据准确**: 只在真正需要时更新每日任务
- ✅ **稳定性**: 减少云函数调用失败的风险

## 📊 使用场景

### **场景 1: 新用户**

- 用户刚注册，没有账号
- 前置判断：无账号 → 跳过每日任务更新
- 结果：不调用 `create-daily-tasks`

### **场景 2: 有账号但无每日任务**

- 用户有账号，但 `dailyTasks` 为空
- 前置判断：需要初始化 → 调用 `create-daily-tasks`
- 结果：创建初始每日任务

### **场景 3: 任务未过期**

- 用户有账号，每日任务都在今天或未来
- 前置判断：无需更新 → 跳过云函数调用
- 结果：直接返回用户信息

### **场景 4: 任务已过期**

- 用户有账号，存在过期的每日任务
- 前置判断：需要更新 → 调用 `create-daily-tasks`
- 结果：更新过期任务

## 🔍 代码位置

**文件**: `miniTool/cloudfunctions/get-user-info/index.js`

**关键代码段**:

```javascript
// 前置判断：检查是否需要更新每日任务
let needUpdateDailyTasks = false;
const accounts = user.accounts || [];

if (accounts.length === 0) {
  // 没有账号，不需要更新每日任务
  console.log("用户没有账号，跳过每日任务更新");
} else {
  // 检查每个账号的每日任务状态
  for (const account of accounts) {
    const dailyTasks = account.dailyTasks || [];

    if (dailyTasks.length === 0) {
      // 账号没有每日任务，需要初始化
      needUpdateDailyTasks = true;
      console.log(`账号 ${account.accountId} 没有每日任务，需要初始化`);
      break;
    }

    // 检查是否有过期的任务
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const task of dailyTasks) {
      if (!task.taskTime) continue;

      const taskDate = new Date(task.taskTime);
      const taskDay = new Date(
        taskDate.getFullYear(),
        taskDate.getMonth(),
        taskDate.getDate()
      );

      if (taskDay < today) {
        // 发现过期任务，需要更新
        needUpdateDailyTasks = true;
        console.log(`账号 ${account.accountId} 有过期任务，需要更新`);
        break;
      }
    }

    if (needUpdateDailyTasks) break;
  }
}

// 只有在需要更新时才调用 create-daily-tasks 云函数
if (needUpdateDailyTasks) {
  // 调用云函数逻辑
} else {
  console.log("每日任务无需更新，跳过云函数调用");
}
```

## 📈 监控建议

### **日志监控**

- 监控 "跳过每日任务更新" 的日志频率
- 监控 "需要初始化" 和 "有过期任务" 的日志
- 监控云函数调用成功/失败率

### **性能指标**

- `get-user-info` 响应时间
- `create-daily-tasks` 调用频率
- 云函数执行次数和费用

## 🚀 后续优化

### **可能的进一步优化**

1. **缓存机制**: 对每日任务状态进行短期缓存
2. **批量处理**: 对多个账号的每日任务进行批量更新
3. **异步更新**: 将每日任务更新改为异步处理，不阻塞用户信息获取
4. **智能调度**: 根据用户活跃时间智能安排任务更新时间
