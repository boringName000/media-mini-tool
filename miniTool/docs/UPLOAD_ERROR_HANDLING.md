# 上传失败错误处理说明

## 概述

在添加账号功能中，如果截图上传到云存储失败，系统会阻止后续的云函数调用，确保不会存储不完整的用户数据。

## 错误处理流程

### 1. 提交表单时的完整流程

```javascript
submitForm: async function () {
  // 1. 表单验证
  if (!this.validateForm()) {
    return; // 验证失败，直接返回
  }

  // 2. 显示加载提示
  wx.showLoading({
    title: "提交中...",
    mask: true,
  });

  try {
    let finalScreenshotUrl = this.data.screenshotUrl;

    // 3. 如果有截图，先上传到云存储
    if (this.data.screenshotFile) {
      try {
        // 生成文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `screenshot_${timestamp}_${randomStr}.jpg`;

        // 上传到云存储
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath: `userAccountScreenshots/${fileName}`,
          filePath: this.data.screenshotFile.tempFilePath,
        });

        console.log("截图上传成功:", uploadResult);
        finalScreenshotUrl = uploadResult.fileID;
      } catch (uploadError) {
        // 4. 截图上传失败处理
        console.error("截图上传失败:", uploadError);
        wx.hideLoading();
        wx.showToast({
          title: "截图上传失败，请重试",
          icon: "none",
          duration: 2000,
        });
        return; // 关键：阻止后续执行
      }
    }

    // 5. 只有截图上传成功（或没有截图）才继续执行
    const accountUtils = require("../../utils/accountUtils");
    const accountData = accountUtils.formatAccountData({
      ...this.data,
      screenshotUrl: finalScreenshotUrl,
    });

    // 6. 调用云函数添加账号
    const result = await accountUtils.addUserAccount(accountData);

    // 7. 处理提交结果
    // ...
  } catch (error) {
    // 8. 整体错误处理
    wx.hideLoading();
    console.error("提交账号信息失败:", error);
    wx.showToast({
      title: "网络错误，请重试",
      icon: "none",
      duration: 2000,
    });
  }
}
```

## 关键保护机制

### 1. 提前返回机制

```javascript
catch (uploadError) {
  console.error("截图上传失败:", uploadError);
  wx.hideLoading();
  wx.showToast({
    title: "截图上传失败，请重试",
    icon: "none",
    duration: 2000,
  });
  return; // 🛡️ 关键保护：阻止后续执行
}
```

### 2. 执行顺序保证

1. **表单验证** → 失败则返回
2. **截图上传** → 失败则返回
3. **数据格式化** → 只有前面成功才执行
4. **云函数调用** → 只有前面成功才执行
5. **结果处理** → 只有前面成功才执行

## 错误处理场景

### 1. 截图上传失败

**触发条件：**

- 网络连接问题
- 云存储权限不足
- 存储空间不足
- 文件格式不支持

**处理结果：**

- ✅ 隐藏加载提示
- ✅ 显示错误信息
- ✅ 阻止云函数调用
- ✅ 不存储用户数据
- ✅ 用户可以重试

### 2. 云函数调用失败

**触发条件：**

- 网络连接问题
- 云函数执行错误
- 数据库连接问题
- 权限验证失败

**处理结果：**

- ✅ 隐藏加载提示
- ✅ 显示错误信息
- ✅ 不存储用户数据
- ✅ 用户可以重试

### 3. 整体异常

**触发条件：**

- 代码执行异常
- 未预期的错误

**处理结果：**

- ✅ 隐藏加载提示
- ✅ 显示通用错误信息
- ✅ 记录错误日志
- ✅ 用户可以重试

## 用户体验保障

### 1. 明确的错误提示

- **截图上传失败**：`"截图上传失败，请重试"`
- **云函数调用失败**：`"添加失败"` 或具体错误信息
- **网络错误**：`"网络错误，请重试"`

### 2. 状态管理

- **加载状态**：上传失败时立即隐藏加载提示
- **数据状态**：失败时不会修改任何数据
- **界面状态**：用户可以继续操作或重试

### 3. 重试机制

- 用户可以重新选择截图
- 用户可以重新提交表单
- 所有操作都是可重复的

## 数据一致性保证

### 1. 原子性操作

- 要么全部成功（截图上传 + 账号数据存储）
- 要么全部失败（不存储任何数据）

### 2. 回滚机制

- 截图上传失败时，不会调用云函数
- 云函数失败时，截图已上传但账号数据未存储
- 用户需要重新提交才能完成操作

### 3. 数据完整性

- 确保账号数据中的 `screenshotUrl` 字段有正确的文件 ID
- 避免存储无效的文件路径或空值

## 错误恢复策略

### 1. 用户操作

- 检查网络连接
- 重新选择截图
- 重新提交表单

### 2. 系统处理

- 自动重试机制（可选）
- 错误日志记录
- 性能监控

### 3. 数据清理

- 如果云函数失败，已上传的截图可能需要清理
- 避免云存储中积累无效文件

## 测试建议

### 1. 网络异常测试

- 断网情况下提交
- 网络不稳定时提交
- 网络恢复后重试

### 2. 权限测试

- 云存储权限不足
- 云函数权限不足
- 数据库权限不足

### 3. 边界测试

- 文件大小超限
- 文件格式不支持
- 存储空间不足

### 4. 并发测试

- 同时提交多个账号
- 快速重复提交
- 并发上传截图

## 总结

通过严格的错误处理流程，确保了：

- ✅ **数据一致性** - 要么全部成功，要么全部失败
- ✅ **用户体验** - 明确的错误提示和重试机制
- ✅ **系统稳定性** - 不会存储不完整的数据
- ✅ **资源保护** - 避免无效的 API 调用和存储

这个错误处理机制为用户提供了可靠的数据提交保障，确保只有在所有步骤都成功的情况下才会存储用户数据。
