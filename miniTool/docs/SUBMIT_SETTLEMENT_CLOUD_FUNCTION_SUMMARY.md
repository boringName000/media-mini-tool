# 提交结算页面集成云函数实现总结

## 📋 **功能概述**

实现了 `submit-settlement` 页面集成 `update-account-earnings` 云函数，用于提交和更新用户收益数据，包括图片上传功能。

## 🔧 **核心功能**

### **1. 图片上传功能**

#### **结算单图片上传**

- **上传路径**: `userSettlementScreenshot/` 云文件夹
- **文件命名**: `settlement_doc_{timestamp}_{random}.jpg`
- **功能**: 选择、预览、删除结算单图片

#### **转账截图上传**

- **上传路径**: `userTransferScreenshot/` 云文件夹
- **文件命名**: `transfer_screenshot_{timestamp}_{random}.jpg`
- **功能**: 选择、预览、删除转账截图

### **2. 云函数集成**

#### **调用时机**

- 用户填写完所有表单信息
- 点击"已结算提交数据"按钮
- 图片上传成功后

#### **更新字段**

```javascript
const updateFields = {
  settlementStatus: 2, // 已结算
  settlementTime: new Date().toISOString(),
  settlementMethod: this.getSettlementMethodValue(this.data.selectedMethod),
  transferOrderNo: this.data.orderNumber,
  accountEarnings: parseFloat(this.data.accountEarnings),
  settlementEarnings: parseFloat(this.data.settlementEarnings),
  settlementImageUrl: finalSettlementDocUrl,
  transferImageUrl: finalTransferScreenshotUrl,
};
```

## 📊 **数据结构扩展**

### **新增数据字段**

```javascript
data: {
  // 云函数需要的参数
  userId: "",
  startTime: "",
  endTime: "",
  year: null,
  month: null,
  periodType: "",

  // 图片上传相关
  settlementDocFile: null, // 结算单文件信息
  transferScreenshotFile: null, // 转账截图文件信息
}
```

## 🔄 **实现流程**

### **1. 图片上传流程**

```javascript
// 选择图片
uploadSettlementDoc: function () {
  wx.chooseMedia({
    count: 1,
    mediaType: ["image"],
    sourceType: ["album", "camera"],
    success: function (res) {
      // 文件大小验证（10MB限制）
      // 存储临时文件路径
      // 显示成功提示
    }
  });
}

// 删除图片
deleteSettlementDoc: function () {
  wx.showModal({
    title: "确认删除",
    content: "确定要删除这张结算单吗？",
    success: (res) => {
      if (res.confirm) {
        // 清除本地临时文件
      }
    }
  });
}

// 预览图片
previewSettlementDoc: function () {
  wx.previewImage({
    urls: [imageUrl],
    current: imageUrl,
  });
}
```

### **2. 提交流程**

```javascript
submitSettlementToCloud: async function () {
  // 1. 表单验证
  if (!this.validateForm()) return;

  // 2. 显示加载提示
  wx.showLoading({ title: "提交中...", mask: true });

  // 3. 上传图片到云存储
  if (this.data.settlementDocFile) {
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: `userSettlementScreenshot/${fileName}`,
      filePath: this.data.settlementDocFile.tempFilePath,
    });
    finalSettlementDocUrl = uploadResult.fileID;
  }

  if (this.data.transferScreenshotFile) {
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: `userTransferScreenshot/${fileName}`,
      filePath: this.data.transferScreenshotFile.tempFilePath,
    });
    finalTransferScreenshotUrl = uploadResult.fileID;
  }

  // 4. 调用云函数更新数据
  const result = await wx.cloud.callFunction({
    name: 'update-account-earnings',
    data: {
      userId: this.data.userId,
      accountId: this.data.accountId,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      updateFields: updateFields
    }
  });

  // 5. 处理结果
  if (result.result.success) {
    // 提交成功，返回上一页
  } else {
    // 提交失败，显示错误信息
  }
}
```

## 🎨 **UI 更新**

### **图片上传区域**

```xml
<!-- 结算单上传 -->
<view class="upload-area" bindtap="uploadSettlementDoc">
  <view class="upload-content" wx:if="{{!settlementDocImage}}">
    <view class="upload-icon">📄</view>
    <text class="upload-text">点击上传</text>
  </view>
  <view wx:else class="uploaded-image-container">
    <image class="uploaded-image" src="{{settlementDocImage}}" mode="aspectFit" bindtap="previewSettlementDoc"></image>
    <view class="delete-button" catchtap="deleteSettlementDoc">🗑️</view>
  </view>
</view>

<!-- 转账截图上传 -->
<view class="upload-area" bindtap="uploadTransferScreenshot">
  <view class="upload-content" wx:if="{{!transferScreenshotImage}}">
    <view class="upload-icon">📱</view>
    <text class="upload-text">点击上传</text>
  </view>
  <view wx:else class="uploaded-image-container">
    <image class="uploaded-image" src="{{transferScreenshotImage}}" mode="aspectFit" bindtap="previewTransferScreenshot"></image>
    <view class="delete-button" catchtap="deleteTransferScreenshot">🗑️</view>
  </view>
</view>
```

### **样式更新**

```css
.uploaded-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.delete-button {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(255, 0, 0, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: white;
  z-index: 10;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}
```

## 🔧 **技术特点**

### **1. 图片上传优化**

- **延迟上传**: 选择图片时只存储临时路径，提交时才上传到云存储
- **文件大小限制**: 10MB 限制，防止过大文件
- **错误处理**: 上传失败时显示详细错误信息
- **进度提示**: 显示加载状态和成功提示

### **2. 云函数集成**

- **参数传递**: 完整传递云函数所需的所有参数
- **数据验证**: 提交前验证所有必要字段
- **错误处理**: 完善的错误提示和重试机制
- **状态管理**: 自动更新结算状态为已结算

### **3. 用户体验**

- **图片预览**: 点击图片可预览
- **删除确认**: 删除图片前显示确认对话框
- **实时反馈**: 操作结果实时反馈给用户
- **自动返回**: 提交成功后自动返回上一页

## 📝 **使用示例**

### **完整提交流程**

1. **填写表单**: 选择结算方式、输入订单号、收益金额
2. **上传图片**: 上传结算单和转账截图
3. **提交数据**: 点击提交按钮
4. **图片上传**: 自动上传图片到云存储
5. **数据更新**: 调用云函数更新收益数据
6. **结果反馈**: 显示成功或失败信息

### **云函数调用示例**

```javascript
const result = await wx.cloud.callFunction({
  name: "update-account-earnings",
  data: {
    userId: "user123",
    accountId: "account456",
    startTime: "2024-01-01T00:00:00.000Z",
    endTime: "2024-01-31T23:59:59.999Z",
    updateFields: {
      settlementStatus: 2,
      settlementTime: "2024-02-01T10:00:00.000Z",
      settlementMethod: 1,
      transferOrderNo: "ORDER123456",
      accountEarnings: 2000,
      settlementEarnings: 1800,
      settlementImageUrl: "cloud://xxx.userSettlementScreenshot/xxx.jpg",
      transferImageUrl: "cloud://xxx.userTransferScreenshot/xxx.jpg",
    },
  },
});
```

## ✅ **功能特点**

1. **完整集成**: 完全集成云函数，实现真实的数据更新
2. **图片管理**: 完整的图片上传、预览、删除功能
3. **错误处理**: 完善的错误处理和用户提示
4. **用户体验**: 流畅的操作流程和实时反馈
5. **数据安全**: 严格的数据验证和类型检查

该实现为用户提供了完整的结算提交功能，确保数据准确性和用户体验！🚀
