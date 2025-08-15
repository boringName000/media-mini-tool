# 云存储上传功能实现说明

## 概述

为添加账号页面的截图上传功能集成了微信小程序云存储 API，采用**延迟上传策略**：用户选择图片时仅保存到本地临时文件，在提交表单时才上传到云端的 `userAccountScreenshots` 文件夹中，并在账号数据中存储文件 ID。

## 设计策略

### 延迟上传的优势

- ✅ **减少 API 调用** - 避免用户频繁操作时的重复上传/删除
- ✅ **提升用户体验** - 选择图片后立即可用，无需等待上传
- ✅ **节省流量** - 只有最终提交时才上传，避免无效上传
- ✅ **简化操作** - 用户可以在提交前自由更换图片

### 上传时机

- **选择图片时**：仅保存到本地临时文件
- **提交表单时**：上传到云存储并获取文件 ID
- **删除图片时**：仅清除本地临时文件

## 功能特性

### 1. 本地图片管理

- 使用 `wx.chooseMedia` 选择图片
- 保存临时文件路径和文件信息
- 支持本地预览和删除操作

### 2. 延迟云存储上传

- 提交表单时统一上传
- 存储路径：`userAccountScreenshots/` 文件夹
- 文件命名：`screenshot_时间戳_随机字符串.jpg`
- 文件大小限制：10MB

### 3. 文件 ID 存储

- 账号数据中的 `screenshotUrl` 字段存储云存储文件 ID
- 文件 ID 格式：`cloud://环境ID.存储桶ID/文件路径`
- 支持后续的文件管理和访问

## 实现细节

### 1. 选择图片功能 (`uploadScreenshot`)

```javascript
// 选择截图
uploadScreenshot: function () {
  const that = this;

  wx.chooseMedia({
    count: 1,
    mediaType: ["image"],
    sourceType: ["album", "camera"],
    success: function (res) {
      const tempFilePath = res.tempFiles[0].tempFilePath;
      const fileSize = res.tempFiles[0].size;

      // 检查文件大小（限制为10MB）
      if (fileSize > 10 * 1024 * 1024) {
        wx.showToast({
          title: "图片大小不能超过10MB",
          icon: "none",
          duration: 2000,
        });
        return;
      }

      // 直接存储临时文件路径，不立即上传到云存储
      that.setData({
        screenshotUrl: tempFilePath,
        screenshotFile: res.tempFiles[0], // 保存文件信息用于后续上传
      });

      wx.showToast({
        title: "图片已选择",
        icon: "success",
        duration: 1500,
      });
    },
    fail: function (err) {
      console.error("选择图片失败:", err);
      wx.showToast({
        title: "选择图片失败",
        icon: "none",
        duration: 2000,
      });
    },
  });
}
```

### 2. 删除功能 (`deleteScreenshot`)

```javascript
// 删除截图
deleteScreenshot: function () {
  const currentScreenshotUrl = this.data.screenshotUrl;

  if (!currentScreenshotUrl) {
    return;
  }

  wx.showModal({
    title: "确认删除",
    content: "确定要删除这张截图吗？",
    success: (res) => {
      if (res.confirm) {
        // 直接清除本地临时文件
        this.setData({
          screenshotUrl: "",
          screenshotFile: null,
        });

        wx.showToast({
          title: "删除成功",
          icon: "success",
          duration: 1500,
        });
      }
    },
  });
}
```

### 3. 预览功能 (`previewScreenshot`)

```javascript
// 预览截图
previewScreenshot: function () {
  const screenshotUrl = this.data.screenshotUrl;
  if (screenshotUrl) {
    // 直接预览临时文件
    wx.previewImage({
      urls: [screenshotUrl],
      current: screenshotUrl,
    });
  }
}
```

### 4. 提交时上传 (`submitForm`)

```javascript
// 提交表单
submitForm: async function () {
  if (!this.validateForm()) {
    wx.showToast({
      title: "请完善表单信息",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  // 显示加载提示
  wx.showLoading({
    title: "提交中...",
    mask: true,
  });

  try {
    let finalScreenshotUrl = this.data.screenshotUrl;

    // 如果有截图，先上传到云存储
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
        console.error("截图上传失败:", uploadError);
        wx.hideLoading();
        wx.showToast({
          title: "截图上传失败，请重试",
          icon: "none",
          duration: 2000,
        });
        return;
      }
    }

    // 格式化账号数据，使用最终的文件ID
    const accountUtils = require("../../utils/accountUtils");
    const accountData = accountUtils.formatAccountData({
      ...this.data,
      screenshotUrl: finalScreenshotUrl,
    });

    // 调用云函数添加账号
    const result = await accountUtils.addUserAccount(accountData);

    // ... 处理提交结果
  } catch (error) {
    // ... 错误处理
  }
}
```

## 数据流程

### 1. 选择图片阶段

```
用户选择图片 → 保存临时文件路径 → 本地预览可用
```

### 2. 编辑阶段

```
用户可自由更换图片 → 删除旧图片 → 选择新图片
```

### 3. 提交阶段

```
验证表单 → 上传图片到云存储 → 获取文件ID → 提交账号数据
```

## 文件命名规则

### 文件名格式

```
screenshot_时间戳_随机字符串.jpg
```

### 示例

```
screenshot_1703123456789_a1b2c3.jpg
```

### 命名规则说明

- **前缀**：`screenshot_` - 标识文件类型
- **时间戳**：`1703123456789` - 毫秒级时间戳，确保唯一性
- **随机字符串**：`a1b2c3` - 6 位随机字符串，进一步避免冲突
- **扩展名**：`.jpg` - 统一使用 JPG 格式

## 存储路径结构

```
云存储根目录/
└── userAccountScreenshots/
    ├── screenshot_1703123456789_a1b2c3.jpg
    ├── screenshot_1703123456790_d4e5f6.jpg
    └── ...
```

## 数据存储格式

### 账号数据结构

```javascript
{
  // ... 其他字段
  screenshotUrl: "cloud://env-id.bucket-id/userAccountScreenshots/screenshot_1703123456789_a1b2c3.jpg",
  // ... 其他字段
}
```

### 文件 ID 格式

```
cloud://环境ID.存储桶ID/文件路径
```

## 错误处理

### 1. 文件大小限制

- 限制：10MB
- 提示：`图片大小不能超过10MB`

### 2. 选择图片失败

- 用户取消选择
- 权限问题
- 设备问题

### 3. 上传失败

- 网络错误
- 云存储权限问题
- 存储空间不足

### 4. 提交失败

- 表单验证失败
- 云函数调用失败
- 网络错误

## 用户体验优化

### 1. 即时反馈

- 选择图片后立即显示
- 删除操作即时生效
- 预览功能响应迅速

### 2. 操作确认

- 删除前显示确认对话框
- 防止误删重要文件

### 3. 错误提示

- 明确的错误信息
- 友好的用户提示
- 操作建议

### 4. 加载状态

- 提交时显示 `提交中...`
- 包含图片上传进度
- 防止重复提交

## 安全性考虑

### 1. 文件类型限制

- 仅支持图片格式
- 通过 `mediaType: ["image"]` 限制

### 2. 文件大小限制

- 10MB 大小限制
- 防止过大文件影响性能

### 3. 文件命名安全

- 使用时间戳和随机字符串
- 避免文件名冲突
- 防止路径遍历攻击

### 4. 权限控制

- 云存储权限配置
- 文件访问权限管理

## 性能优化

### 1. 延迟上传

- 减少不必要的 API 调用
- 节省网络流量
- 提升响应速度

### 2. 本地操作

- 选择、删除、预览都在本地进行
- 无需等待网络请求
- 操作响应迅速

### 3. 异步处理

- 提交时异步上传图片
- 不阻塞用户界面
- 支持错误重试

### 4. 文件压缩

- 微信小程序会自动压缩图片
- 减少上传时间和存储空间

## 测试建议

### 1. 功能测试

- 选择不同大小的图片
- 测试删除功能
- 测试预览功能
- 测试提交流程

### 2. 网络测试

- 网络较慢时的提交
- 网络中断时的处理
- 重连后的恢复

### 3. 权限测试

- 云存储权限配置
- 文件访问权限
- 上传权限

### 4. 边界测试

- 文件大小边界（接近 10MB）
- 文件类型边界
- 存储空间边界

## 总结

通过采用延迟上传策略，实现了高效、用户友好的图片管理功能。主要优势包括：

- ✅ **减少 API 调用** - 避免频繁的上传/删除操作
- ✅ **提升用户体验** - 本地操作响应迅速
- ✅ **节省资源** - 只有最终提交时才上传
- ✅ **简化操作** - 用户可自由更换图片
- ✅ **完整生命周期** - 上传、预览、删除全流程支持
- ✅ **安全性** - 文件类型和大小限制
- ✅ **性能优化** - 异步操作和错误重试

这个实现为账号管理功能提供了高效、可靠的图片存储解决方案。
