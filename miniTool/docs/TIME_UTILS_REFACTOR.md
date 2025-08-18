# 时间工具函数重构文档

## 概述

将原有的多个时间格式化函数重构为一个通用的 `formatTime` 函数，统一处理各种时间格式，提高代码复用性和维护性。

## 重构原因

### 原有问题

1. **功能重复**：多个函数处理相似的时间格式化逻辑
2. **维护困难**：每个函数都需要单独维护和测试
3. **格式不统一**：不同页面使用不同的格式化方式
4. **扩展性差**：添加新格式需要修改多个函数

### 解决方案

创建一个通用的 `formatTime` 函数，支持：

- 多种输入格式（ISO、时间戳、Date 对象、字符串等）
- 多种输出格式（预定义格式 + 自定义格式）
- 统一的错误处理和边界情况处理
- 向后兼容的别名函数

## 新的 API 设计

### 核心函数：`formatTime`

```javascript
timeUtils.formatTime(timeInput, format, options);
```

#### 参数说明

- `timeInput`: 时间输入（支持多种格式）
  - Date 对象
  - 时间戳（数字）
  - ISO 字符串（"2024-01-15T00:00:00.000Z"）
  - 简单日期字符串（"2024-01-15"）
  - 纯数字字符串（"1705276800000"）
- `format`: 输出格式（默认 "YYYY-MM-DD"）
- `options`: 配置选项
  - `defaultValue`: 默认值（当输入无效时返回）

#### 预定义格式

- `"YYYY-MM-DD"` - 日期格式（2024-01-15）
- `"YYYY-MM-DD HH:mm"` - 日期时间格式（2024-01-15 14:30）
- `"YYYY-MM-DD HH:mm:ss"` - 完整时间格式（2024-01-15 14:30:25）
- `"MM-DD"` - 月日格式（01-15）
- `"HH:mm"` - 时分格式（14:30）
- `"HH:mm:ss"` - 时分秒格式（14:30:25）
- `"chinese"` - 中文格式（2024 年 1 月 15 日）
- `"relative"` - 相对时间（5 分钟前、1 小时前等）

#### 自定义格式

支持占位符：`YYYY`、`MM`、`DD`、`HH`、`mm`、`ss`

```javascript
timeUtils.formatTime(date, "YYYY年MM月DD日 HH时mm分");
// 输出：2024年01月15日 14时30分
```

## 页面更新

### 1. me.js 页面

**功能**：显示用户注册时间

```javascript
// 更新前
const timeLabel = timeUtils.formatTimestamp(ts, "YYYY-MM-DD HH:mm");

// 更新后
const timeLabel = timeUtils.formatTime(ts, "YYYY-MM-DD HH:mm");
```

### 2. account-list.js 页面

**功能**：显示账号注册时间

```javascript
// 更新前
registerTime: timeUtils.formatRegisterDate(account.registerDate),

// 更新后
registerTime: timeUtils.formatTime(account.registerDate, "YYYY-MM-DD"),
```

### 3. account-detail.js 页面

**功能**：显示账号注册日期

```javascript
// 更新前
registerDateDisplay: timeUtils.formatRegisterDate(accountData.registerDate),

// 更新后
registerDateDisplay: timeUtils.formatTime(accountData.registerDate, "YYYY-MM-DD"),
```

### 4. add-account.js 页面

**功能**：设置默认注册日期

```javascript
// 更新前
const registerDate = timeUtils.getCurrentDateString();

// 更新后
const registerDate = timeUtils.formatTime(new Date(), "YYYY-MM-DD");
```

### 5. test-db.js 页面

**功能**：测试日期格式化

```javascript
// 更新前
const formatted = timeUtils.formatRegisterDate(testCase);

// 更新后
const formatted = timeUtils.formatTime(testCase, "YYYY-MM-DD");
```

## 统一使用 formatTime

所有时间格式化都统一使用 `formatTime` 函数，不再提供其他别名函数，确保代码的一致性和清晰性。

## 新增功能

### 1. 相对时间显示

```javascript
timeUtils.formatTime(date, "relative");
// 输出：刚刚、5分钟前、1小时前、2天前等
```

### 2. 中文日期格式

```javascript
timeUtils.formatTime(date, "chinese");
// 输出：2024年1月15日
```

### 3. 更灵活的格式支持

```javascript
timeUtils.formatTime(date, "MM-DD"); // 01-15
timeUtils.formatTime(date, "HH:mm"); // 14:30
timeUtils.formatTime(date, "HH:mm:ss"); // 14:30:25
```

### 4. 更好的错误处理

- 自动处理无效输入
- 支持默认值配置
- 详细的错误日志

## 测试验证

### 测试用例

```javascript
// 不同输入格式
timeUtils.formatTime("2024-01-15T00:00:00.000Z"); // 2024-01-15
timeUtils.formatTime("2024-01-15"); // 2024-01-15
timeUtils.formatTime(1705276800000); // 2024-01-15
timeUtils.formatTime(new Date("2024-01-15")); // 2024-01-15

// 不同输出格式
timeUtils.formatTime("2024-01-15", "YYYY-MM-DD"); // 2024-01-15
timeUtils.formatTime("2024-01-15", "chinese"); // 2024年1月15日
timeUtils.formatTime("2024-01-15", "MM-DD"); // 01-15

// 错误处理
timeUtils.formatTime("invalid-date"); // ""
timeUtils.formatTime(null); // ""
timeUtils.formatTime("", "YYYY-MM-DD", { defaultValue: "未设置" }); // "未设置"
```

## 优势总结

### 1. 代码复用

- 一个函数处理所有时间格式化需求
- 减少重复代码，提高维护性

### 2. 统一性

- 所有页面使用相同的格式化逻辑
- 确保时间显示的一致性

### 3. 扩展性

- 易于添加新的时间格式
- 支持自定义格式模式

### 4. 健壮性

- 统一的错误处理
- 支持多种输入格式
- 自动处理边界情况

### 5. 代码清晰

- 统一使用 formatTime 函数
- 避免别名函数引起的混淆

## 使用建议

### 1. 统一使用 formatTime

所有时间格式化都使用 `formatTime` 函数：

```javascript
// 推荐
const dateStr = timeUtils.formatTime(date, "YYYY-MM-DD");
const timeStr = timeUtils.formatTime(date, "HH:mm");
const chineseStr = timeUtils.formatTime(date, "chinese");
```

### 2. 格式选择

- **日期显示**：`"YYYY-MM-DD"`
- **时间显示**：`"HH:mm"` 或 `"HH:mm:ss"`
- **完整时间**：`"YYYY-MM-DD HH:mm:ss"`
- **中文显示**：`"chinese"`
- **相对时间**：`"relative"`

### 3. 错误处理

```javascript
// 设置默认值
const dateStr = timeUtils.formatTime(input, "YYYY-MM-DD", {
  defaultValue: "未设置",
});
```

这次重构大大简化了时间处理逻辑，提高了代码质量和可维护性！
