// 添加账号页面
// 赛道类型和平台枚举已通过工具函数获取，无需直接导入
const {
  getTrackTypeName,
  getTrackTypeIcon,
  getTrackTypeList,
} = require("../../utils/trackTypeUtils");
const {
  getPlatformName,
  getPlatformIcon,
  getPlatformList,
} = require("../../utils/platformUtils");
const userInfoUtils = require("../../utils/userInfoUtils");
const accountUtils = require("../../utils/accountUtils");
const authUtils = require("../../utils/authUtils");
const imageUtils = require("../../utils/imageUtils");
const timeUtils = require("../../utils/timeUtils");

Page({
  data: {
    // 表单数据
    selectedTrackType: null,
    selectedPlatform: null,
    phoneNumber: "",
    accountNickname: "",
    accountId: "",
    registerDate: "",
    isViolation: false,
    screenshotUrl: "",
    screenshotFile: null, // 存储截图文件信息，用于后续上传

    // 选择器数据
    trackTypeList: [],
    platformList: [],

    // 错误提示
    errors: {
      trackType: "",
      platform: "",
      phoneNumber: "",
      accountNickname: "",
      accountId: "",
    },

    // 上传状态
    isUploading: false,
  },

  onLoad: function (options) {
    console.log("添加账号页面加载");

    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }

    this.initData();
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 初始化数据
  initData: function () {
    // 使用工具函数获取赛道列表
    const trackTypeList = getTrackTypeList();

    // 使用工具函数获取平台列表
    const platformList = getPlatformList();

    // 设置当前日期
    const registerDate = timeUtils.formatTime(new Date(), "YYYY-MM-DD");

    this.setData({
      trackTypeList,
      platformList,
      registerDate,
    });
  },

  // 选择赛道
  onTrackTypeChange: function (e) {
    const index = e.detail.value;
    const selectedTrack = this.data.trackTypeList[index];

    this.setData({
      selectedTrackType: selectedTrack,
      "errors.trackType": "",
    });

    console.log("选择的赛道:", selectedTrack);
  },

  // 选择平台
  onPlatformChange: function (e) {
    const index = e.detail.value;
    const selectedPlatform = this.data.platformList[index];

    this.setData({
      selectedPlatform: selectedPlatform,
      "errors.platform": "",
    });

    console.log("选择的平台:", selectedPlatform);
  },

  // 手机号输入
  onPhoneInput: function (e) {
    const phoneNumber = e.detail.value;
    this.setData({
      phoneNumber,
      "errors.phoneNumber": "",
    });
  },

  // 账号昵称输入
  onNicknameInput: function (e) {
    const accountNickname = e.detail.value;
    this.setData({
      accountNickname,
      "errors.accountNickname": "",
    });
  },

  // 账号ID输入
  onAccountIdInput: function (e) {
    const accountId = e.detail.value;
    this.setData({
      accountId,
      "errors.accountId": "",
    });
  },

  // 注册日期选择
  onDateChange: function (e) {
    const registerDate = e.detail.value;
    this.setData({
      registerDate,
      "errors.registerDate": "", // 清除注册时间错误
    });
  },

  // 违规状态切换
  onViolationChange: function (e) {
    const isViolation = e.detail.value;
    this.setData({
      isViolation,
    });
  },

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
  },

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
  },

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
  },

  // 验证表单
  validateForm: function () {
    // 格式化数据用于验证
    const accountData = accountUtils.formatAccountData(this.data);

    // 使用工具函数进行验证
    const validation = accountUtils.validateAccountData(accountData);

    // 设置错误信息到页面
    this.setData({
      errors: validation.errors,
    });

    return validation.isValid;
  },

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
      const accountData = accountUtils.formatAccountData({
        ...this.data,
        screenshotUrl: finalScreenshotUrl,
      });

      // 调用云函数添加账号
      const result = await accountUtils.addUserAccount(accountData);

      wx.hideLoading();

      if (result.success) {
        // 提交成功
        wx.showToast({
          title: "添加成功",
          icon: "success",
          duration: 2000,
        });

        console.log("账号添加成功:", result.accountData);
        console.log("当前总账号数:", result.totalAccounts);

        // 刷新用户信息，更新全局数据
        try {
          const refreshResult = await userInfoUtils.refreshUserInfo();

          if (refreshResult.success) {
            console.log("用户信息刷新成功");
          } else {
            console.error("用户信息刷新失败:", refreshResult.error);
          }
        } catch (refreshError) {
          console.error("刷新用户信息时出错:", refreshError);
        }

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
          });
        }, 2000);
      } else {
        // 提交失败
        wx.showToast({
          title: result.error || "添加失败",
          icon: "none",
          duration: 2500,
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error("提交账号信息失败:", error);
      wx.showToast({
        title: "网络错误，请重试",
        icon: "none",
        duration: 2000,
      });
    }
  },
});
