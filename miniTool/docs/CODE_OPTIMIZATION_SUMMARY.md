# 代码优化总结

## 概述

本次优化主要解决了审核状态处理逻辑的重复代码问题，统一使用 `accountUtils.js` 中的工具函数。

## 优化内容

### 1. 重复代码问题

#### **问题描述**

多个页面中存在相同的审核状态处理逻辑：

- `data-center.js`: 手动判断 `auditStatus` 并返回状态文本
- `task.js`: 手动判断 `auditStatus` 并返回状态文本
- `account-list.js`: 手动定义状态文本数组和颜色数组

#### **优化方案**

统一使用 `accountUtils.js` 中的工具函数：

- `getAuditStatusText(auditStatus)`: 获取审核状态文本
- `getAuditStatusColor(auditStatus)`: 获取审核状态颜色

### 2. 具体优化

#### **data-center.js**

```javascript
// 优化前
let status = "正常运营";
if (account.auditStatus === 0) {
  status = "待审核";
} else if (account.auditStatus === 2) {
  status = "未通过";
}

// 优化后
const status = accountUtils.getAuditStatusText(account.auditStatus);
```

#### **task.js**

```javascript
// 优化前
if (account.auditStatus === 0) {
  return "待审核";
} else if (account.auditStatus === 1) {
  return "正常运营";
} else if (account.auditStatus === 2) {
  return "审核未通过";
}

// 优化后
return accountUtils.getAuditStatusText(account.auditStatus);
```

#### **account-list.js**

```javascript
// 优化前
auditStatusText: ["待审核", "已通过", "未通过"][account.auditStatus || 0],
auditStatusColor: ["#f39c12", "#27ae60", "#e74c3c"][account.auditStatus || 0],

// 优化后
auditStatusText: accountUtils.getAuditStatusText(account.auditStatus || 0),
auditStatusColor: accountUtils.getAuditStatusColor(account.auditStatus || 0),
```

### 3. 优化效果

#### **代码复用性**

- ✅ 统一的状态处理逻辑
- ✅ 减少重复代码
- ✅ 便于维护和修改

#### **一致性**

- ✅ 所有页面使用相同的状态文本
- ✅ 所有页面使用相同的状态颜色
- ✅ 避免状态文本不一致的问题

#### **可维护性**

- ✅ 状态文本和颜色集中管理
- ✅ 修改状态只需在 `accountUtils.js` 中修改
- ✅ 新增状态类型时只需更新工具函数

#### **代码规范**

- ✅ 统一在文件顶部引入依赖
- ✅ 避免在函数内部使用 `require`
- ✅ 符合模块化开发最佳实践

### 4. 保留的代码

#### **统计计算**

`account-list.js` 中的统计计算逻辑保留，因为：

- 这是计算数量，不是获取状态文本
- 逻辑简单且合理
- 不涉及状态文本的重复定义

```javascript
const approvedCount = accountList.filter(
  (item) => item.auditStatus === 1
).length;
const pendingCount = accountList.filter(
  (item) => item.auditStatus === 0
).length;
```

### 5. 工具函数说明

#### **getAuditStatusText(auditStatus)**

返回审核状态的文本描述：

- `0`: "待审核"
- `1`: "已通过"
- `2`: "未通过"

#### **getAuditStatusColor(auditStatus)**

返回审核状态的颜色：

- `0`: "#f39c12" (橙色 - 待审核)
- `1`: "#27ae60" (绿色 - 已通过)
- `2`: "#e74c3c" (红色 - 未通过)

## 总结

通过本次优化，成功消除了审核状态处理逻辑的重复代码，提高了代码的复用性和可维护性。所有页面现在都统一使用 `accountUtils.js` 中的工具函数来处理审核状态的显示。

## 版本历史

- **v1.0**: 初始优化，统一审核状态处理逻辑
