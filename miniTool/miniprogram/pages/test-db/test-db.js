// 云存储图片显示测试页面
const userInfoUtils = require("../../utils/userInfoUtils");

Page({
  data: {
    // 真实的账户数据（从全局数据获取）
    realAccountData: null,
    // 图片加载状态
    smartImageStatus: "加载中...",
    normalImageStatus: "加载中...",
  },

  onLoad: function (options) {
    console.log("云存储图片显示测试页面加载");
    // 获取真实的账户数据
    this.getRealAccountData();
  },

  // 获取真实的账户数据
  getRealAccountData: function () {
    const app = getApp();
    const globalData = app.globalData;

    console.log("=== 获取真实账户数据 ===");
    console.log("globalData:", globalData);
    console.log("loginResult:", globalData.loginResult);

    if (
      globalData.loginResult &&
      globalData.loginResult.accounts &&
      globalData.loginResult.accounts.length > 0
    ) {
      // 获取第一个账户的数据
      const firstAccount = globalData.loginResult.accounts[0];
      console.log("第一个账户数据:", firstAccount);

      // 检查截图URL格式
      if (firstAccount.screenshotUrl) {
        console.log("截图URL:", firstAccount.screenshotUrl);
        console.log(
          "是否以cloud://开头:",
          firstAccount.screenshotUrl.startsWith("cloud://")
        );
        console.log("URL长度:", firstAccount.screenshotUrl.length);
        console.log(
          "URL前10个字符:",
          firstAccount.screenshotUrl.substring(0, 10)
        );
        console.log(
          "URL前20个字符:",
          firstAccount.screenshotUrl.substring(0, 20)
        );
      }

      this.setData({
        realAccountData: firstAccount,
      });

      wx.showToast({
        title: "获取真实数据成功",
        icon: "success",
        duration: 2000,
      });
    } else {
      console.log("没有找到账户数据");
      wx.showToast({
        title: "没有找到账户数据",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 切换不同的账户进行测试
  switchAccount: function () {
    const app = getApp();
    const globalData = app.globalData;

    if (
      !globalData.loginResult ||
      !globalData.loginResult.accounts ||
      globalData.loginResult.accounts.length === 0
    ) {
      wx.showToast({
        title: "没有账户数据",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    const accounts = globalData.loginResult.accounts;
    const currentIndex = this.data.realAccountData
      ? accounts.findIndex(
          (acc) => acc.accountId === this.data.realAccountData.accountId
        )
      : -1;

    // 切换到下一个账户，如果没有当前账户或到达末尾，则选择第一个
    const nextIndex = (currentIndex + 1) % accounts.length;
    const nextAccount = accounts[nextIndex];

    this.setData({
      realAccountData: nextAccount,
    });

    console.log("切换到账户:", nextAccount);
    console.log("账户截图URL:", nextAccount.screenshotUrl);

    wx.showToast({
      title: `切换到账户 ${nextIndex + 1}`,
      icon: "success",
      duration: 1500,
    });
  },

  // 智能图片组件加载成功
  onImageLoad: function (e) {
    console.log("智能图片组件加载成功:", e.detail);
    this.setData({
      smartImageStatus: "加载成功",
    });

    // 获取图片元素信息
    wx.createSelectorQuery()
      .select(".image-test-item:first-child .test-image")
      .boundingClientRect((rect) => {
        console.log("智能图片组件尺寸:", rect);
      })
      .exec();
  },

  // 智能图片组件加载错误
  onImageError: function (e) {
    console.error("智能图片组件加载失败:", e.detail);
    this.setData({
      smartImageStatus: "加载失败",
    });
  },

  // 普通 image 组件加载成功
  onNormalImageLoad: function (e) {
    console.log("原生image组件加载成功:", e.detail);
    this.setData({
      normalImageStatus: "加载成功",
    });

    // 获取图片元素信息
    wx.createSelectorQuery()
      .select(".image-test-item:last-child .test-image")
      .boundingClientRect((rect) => {
        console.log("原生image组件尺寸:", rect);
      })
      .exec();
  },

  // 普通 image 组件加载错误
  onNormalImageError: function (e) {
    console.error("普通 image 组件加载失败:", e.detail);
    this.setData({
      normalImageStatus: "加载失败",
    });
  },

  // 测试重构后的智能图片组件
  testRefactoredSmartImage: function () {
    console.log("=== 测试重构后的智能图片组件 ===");

    if (
      !this.data.realAccountData ||
      !this.data.realAccountData.screenshotUrl
    ) {
      wx.showToast({
        title: "没有截图URL",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    const screenshotUrl = this.data.realAccountData.screenshotUrl;
    console.log("截图URL:", screenshotUrl);

    // 检查是否为云存储图片
    const isCloud = screenshotUrl.startsWith("cloud://");
    console.log("是否为云存储图片:", isCloud);

    if (isCloud) {
      console.log("云存储图片，微信原生image组件应该能直接显示");
      wx.showToast({
        title: "云存储图片，查看显示效果",
        icon: "success",
        duration: 2000,
      });
    } else {
      console.log("非云存储图片");
      wx.showToast({
        title: "非云存储图片",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 测试云存储图片直接加载
  testCloudImageDirectLoad: function () {
    console.log("=== 测试云存储图片直接加载 ===");

    if (
      !this.data.realAccountData ||
      !this.data.realAccountData.screenshotUrl
    ) {
      wx.showToast({
        title: "没有截图URL",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    const screenshotUrl = this.data.realAccountData.screenshotUrl;

    // 尝试获取临时URL来验证文件是否存在
    wx.cloud.getTempFileURL({
      fileList: [screenshotUrl],
      success: (res) => {
        console.log("获取临时URL成功:", res);
        if (res.fileList && res.fileList[0]) {
          console.log("文件存在，临时URL:", res.fileList[0].tempFileURL);

          // 如果文件存在，说明云存储图片应该能直接显示
          wx.showToast({
            title: "文件存在，应该能直接显示",
            icon: "success",
            duration: 2000,
          });
        } else {
          wx.showToast({
            title: "文件不存在",
            icon: "none",
            duration: 2000,
          });
        }
      },
      fail: (err) => {
        console.error("获取临时URL失败:", err);
        wx.showToast({
          title: "文件访问失败",
          icon: "none",
          duration: 2000,
        });
      },
    });
  },

  // 比较两个组件的样式差异
  compareComponentStyles: function () {
    console.log("=== 比较组件样式差异 ===");

    // 获取智能图片组件的样式信息
    wx.createSelectorQuery()
      .select(".image-test-item:first-child .test-image")
      .boundingClientRect((smartImageRect) => {
        console.log("智能图片组件样式:", smartImageRect);

        // 获取原生image组件的样式信息
        wx.createSelectorQuery()
          .select(".image-test-item:last-child .test-image")
          .boundingClientRect((nativeImageRect) => {
            console.log("原生image组件样式:", nativeImageRect);

            // 比较尺寸差异
            if (smartImageRect && nativeImageRect) {
              const widthDiff = smartImageRect.width - nativeImageRect.width;
              const heightDiff = smartImageRect.height - nativeImageRect.height;

              console.log("尺寸差异:", {
                widthDiff: widthDiff,
                heightDiff: heightDiff,
                smartImageSize: `${smartImageRect.width}x${smartImageRect.height}`,
                nativeImageSize: `${nativeImageRect.width}x${nativeImageRect.height}`,
              });

              if (Math.abs(widthDiff) > 5 || Math.abs(heightDiff) > 5) {
                wx.showToast({
                  title: `尺寸差异: ${widthDiff.toFixed(
                    0
                  )}x${heightDiff.toFixed(0)}`,
                  icon: "none",
                  duration: 3000,
                });
              } else {
                wx.showToast({
                  title: "尺寸相同",
                  icon: "success",
                  duration: 2000,
                });
              }
            }
          })
          .exec();
      })
      .exec();
  },

  // 详细分析组件样式
  analyzeComponentStyles: function () {
    console.log("=== 详细分析组件样式 ===");

    // 获取智能图片组件的详细信息
    wx.createSelectorQuery()
      .select(".image-test-item:first-child")
      .boundingClientRect((containerRect) => {
        console.log("智能图片容器尺寸:", containerRect);

        wx.createSelectorQuery()
          .select(".image-test-item:first-child .test-image")
          .boundingClientRect((imageRect) => {
            console.log("智能图片元素尺寸:", imageRect);

            // 检查是否有尺寸差异
            if (containerRect && imageRect) {
              const containerWidth = containerRect.width;
              const imageWidth = imageRect.width;
              const widthRatio = imageWidth / containerWidth;

              console.log("智能图片尺寸分析:", {
                containerWidth: containerWidth,
                imageWidth: imageWidth,
                widthRatio: widthRatio.toFixed(2),
                isFullWidth: widthRatio > 0.9,
              });
            }
          })
          .exec();
      })
      .exec();

    // 获取原生image组件的详细信息
    wx.createSelectorQuery()
      .select(".image-test-item:last-child")
      .boundingClientRect((containerRect) => {
        console.log("原生image容器尺寸:", containerRect);

        wx.createSelectorQuery()
          .select(".image-test-item:last-child .test-image")
          .boundingClientRect((imageRect) => {
            console.log("原生image元素尺寸:", imageRect);

            // 检查是否有尺寸差异
            if (containerRect && imageRect) {
              const containerWidth = containerRect.width;
              const imageWidth = imageRect.width;
              const widthRatio = imageWidth / containerWidth;

              console.log("原生image尺寸分析:", {
                containerWidth: containerWidth,
                imageWidth: imageWidth,
                widthRatio: widthRatio.toFixed(2),
                isFullWidth: widthRatio > 0.9,
              });
            }
          })
          .exec();
      })
      .exec();
  },

  // 测试强制样式是否生效
  testForceStyles: function () {
    console.log("=== 测试强制样式是否生效 ===");

    // 获取智能图片组件的计算样式
    wx.createSelectorQuery()
      .select(".image-test-item:first-child .test-image")
      .boundingClientRect((rect) => {
        console.log("智能图片组件实际尺寸:", rect);

        if (rect) {
          const expectedWidth = 150; // 300rpx ≈ 150px
          const expectedHeight = 100; // 200rpx ≈ 100px
          const widthDiff = Math.abs(rect.width - expectedWidth);
          const heightDiff = Math.abs(rect.height - expectedHeight);

          console.log("强制样式测试:", {
            actualWidth: rect.width,
            actualHeight: rect.height,
            expectedWidth: expectedWidth,
            expectedHeight: expectedHeight,
            widthDiff: widthDiff,
            heightDiff: heightDiff,
            isCorrectSize: widthDiff < 10 && heightDiff < 10,
          });

          if (widthDiff < 10 && heightDiff < 10) {
            wx.showToast({
              title: "强制样式生效",
              icon: "success",
              duration: 2000,
            });
          } else {
            wx.showToast({
              title: `尺寸错误: ${rect.width}x${rect.height}`,
              icon: "none",
              duration: 3000,
            });
          }
        }
      })
      .exec();
  },
});
