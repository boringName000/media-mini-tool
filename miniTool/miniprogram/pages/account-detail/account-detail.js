// 账号详情页面
// 赛道类型和平台枚举已通过工具函数获取，无需直接导入
const {
  getTrackTypeName,
  getTrackTypeIcon,
  getTrackTypeList,
} = require("../../utils/trackTypeUtils");
const {
  getPlatformName,
  getPlatformIcon,
} = require("../../utils/platformUtils");
const authUtils = require("../../utils/authUtils");

const timeUtils = require("../../utils/timeUtils");

Page({
  data: {
    // 账号信息
    accountInfo: null,

    // 表单数据
    selectedTrackType: null,
    selectedTrackIndex: 0, // 添加选中赛道的索引
    phoneNumber: "",
    accountNickname: "",
    isViolation: false,
    screenshotUrl: "",
    registerDate: "", // 注册日期

    // 选择器数据
    trackTypeList: [],

    // 错误提示
    errors: {
      trackType: "",
      phoneNumber: "",
      accountNickname: "",
    },

    // 上传状态
    isUploading: false,

    // 截图文件信息（用于上传到云存储）
    screenshotFile: null,
  },

  onLoad: function (options) {
    console.log("账号详情页面加载，参数:", options);

    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }

    // 先初始化数据
    this.initData();

    // 获取传递过来的账号信息
    if (options.accountData) {
      try {
        const accountData = JSON.parse(decodeURIComponent(options.accountData));
        console.log("解析的账号数据:", accountData);
        this.setData({
          accountInfo: accountData,
        });
        // 延迟初始化表单数据，确保trackTypeList已经准备好
        setTimeout(() => {
          this.initFormData(accountData);
        }, 100);
      } catch (error) {
        console.error("解析账号数据失败:", error);
        wx.showToast({
          title: "数据加载失败",
          icon: "none",
          duration: 2000,
        });
      }
    }
  },

  onShow: function () {
    // 页面显示时的逻辑
    console.log("页面显示，当前数据状态:");
    console.log("accountInfo:", this.data.accountInfo);
    console.log("selectedTrackType:", this.data.selectedTrackType);
    console.log("phoneNumber:", this.data.phoneNumber);
    console.log("accountNickname:", this.data.accountNickname);
    console.log("isViolation:", this.data.isViolation);
    console.log("screenshotUrl:", this.data.screenshotUrl);
  },

  // 初始化数据
  initData: function () {
    // 使用工具函数获取赛道列表
    const trackTypeList = getTrackTypeList();

    this.setData({
      trackTypeList,
    });
  },

  // 初始化表单数据
  initFormData: function (accountData) {
    console.log("初始化表单数据，账号数据:", accountData);
    console.log("当前trackTypeList:", this.data.trackTypeList);

    // 获取赛道类型
    const trackTypeEnum = accountData.trackType;
    console.log("账号的赛道枚举值:", trackTypeEnum);
    console.log("赛道枚举值类型:", typeof trackTypeEnum);

    // 根据账号数据初始化表单
    const selectedTrackIndex = this.data.trackTypeList.findIndex(
      (item) => item.type === trackTypeEnum
    );
    const selectedTrack =
      selectedTrackIndex >= 0
        ? this.data.trackTypeList[selectedTrackIndex]
        : null;

    console.log("找到的赛道索引:", selectedTrackIndex);
    console.log("找到的赛道:", selectedTrack);

    // 处理截图URL - 直接使用原始URL，让smart-image组件处理
    const screenshotUrl = accountData.screenshotUrl || "";

    // 获取平台信息
    const platformEnum = accountData.platform;
    console.log("账号的平台枚举值:", platformEnum);

    // 获取平台名称和图标
    const platformName = getPlatformName(platformEnum);
    const platformIcon = getPlatformIcon(platformEnum);
    console.log("平台名称:", platformName);
    console.log("平台图标:", platformIcon);

    // 格式化注册日期为YYYY-MM-DD格式用于picker
    let registerDateDisplay = "";
    if (accountData.registerDate) {
      const date = new Date(accountData.registerDate);
      registerDateDisplay = date.toISOString().split("T")[0]; // 格式化为YYYY-MM-DD
    }

    // 设置表单数据
    const formData = {
      selectedTrackType: selectedTrack || null,
      selectedTrackIndex: selectedTrackIndex >= 0 ? selectedTrackIndex : 0,
      phoneNumber: accountData.phoneNumber || "",
      accountNickname:
        accountData.accountNickname || accountData.accountName || "",
      isViolation: accountData.isViolation || false,
      screenshotUrl: screenshotUrl,
      registerDate: registerDateDisplay,
    };

    // 更新账号信息，确保平台信息和注册日期正确显示
    const updatedAccountInfo = {
      ...this.data.accountInfo,
      platform: platformName,
      platformIcon: platformIcon,
      // 格式化注册日期显示
      registerDateDisplay: timeUtils.formatTime(
        accountData.registerDate,
        "YYYY-MM-DD"
      ),
    };

    this.setData({
      accountInfo: updatedAccountInfo,
    });

    console.log("要设置的表单数据:", formData);
    console.log("截图URL:", accountData.screenshotUrl);
    console.log("是否有截图:", !!accountData.screenshotUrl);

    this.setData(formData);

    console.log("表单数据初始化完成");
  },

  // 选择赛道
  onTrackTypeChange: function (e) {
    const index = e.detail.value;
    const selectedTrack = this.data.trackTypeList[index];

    this.setData({
      selectedTrackType: selectedTrack,
      selectedTrackIndex: index,
      "errors.trackType": "",
    });

    console.log("选择的赛道:", selectedTrack);
    console.log("选择的赛道索引:", index);
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

  // 违规状态切换
  onViolationChange: function (e) {
    const isViolation = e.detail.value;
    this.setData({
      isViolation,
    });
  },

  // 注册日期选择（已禁用，只读显示）
  onRegisterDateChange: function (e) {
    // 注册日期不允许修改，此方法保留但不执行任何操作
    console.log("注册日期不允许修改");
  },

  // 上传截图
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
    if (this.data.screenshotUrl) {
      wx.previewImage({
        urls: [this.data.screenshotUrl],
        current: this.data.screenshotUrl,
      });
    }
  },

  // 验证表单
  validateForm: function () {
    const errors = {};
    let isValid = true;

    // 验证赛道选择
    if (!this.data.selectedTrackType) {
      errors.trackType = "请选择赛道";
      isValid = false;
    }

    // 验证手机号
    if (!this.data.phoneNumber) {
      errors.phoneNumber = "请输入注册手机号";
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(this.data.phoneNumber)) {
      errors.phoneNumber = "请输入正确的手机号格式";
      isValid = false;
    }

    // 验证账号昵称
    if (!this.data.accountNickname) {
      errors.accountNickname = "请输入账号昵称";
      isValid = false;
    }

    this.setData({
      errors,
    });

    return isValid;
  },

  // 提交审核
  submitAudit: async function () {
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

      // 如果有新的截图文件，先上传到云存储
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

      // 准备更新的字段数据
      const updateFields = {};

      // 检查并添加需要更新的字段
      if (
        this.data.selectedTrackType &&
        this.data.selectedTrackType.type !== this.data.accountInfo.trackType
      ) {
        updateFields.trackType = this.data.selectedTrackType.type;
      }

      if (this.data.phoneNumber !== this.data.accountInfo.phoneNumber) {
        updateFields.phoneNumber = this.data.phoneNumber;
      }

      if (this.data.accountNickname !== this.data.accountInfo.accountNickname) {
        updateFields.accountNickname = this.data.accountNickname;
      }

      if (this.data.isViolation !== this.data.accountInfo.isViolation) {
        updateFields.isViolation = this.data.isViolation;
      }

      // 使用最终的文件ID（可能是新上传的或原有的）
      if (finalScreenshotUrl !== this.data.accountInfo.screenshotUrl) {
        updateFields.screenshotUrl = finalScreenshotUrl;
      }

      // 注册日期不允许修改，移除相关更新逻辑

      // 如果没有需要更新的字段，直接返回
      if (Object.keys(updateFields).length === 0) {
        wx.hideLoading();
        wx.showToast({
          title: "没有需要更新的内容",
          icon: "none",
          duration: 2000,
        });
        return;
      }

      console.log("准备更新的字段:", updateFields);

      // 获取用户ID
      const app = getApp();
      const userId = app.globalData.loginResult?.userId;

      if (!userId) {
        wx.hideLoading();
        wx.showToast({
          title: "用户信息获取失败",
          icon: "none",
          duration: 2000,
        });
        return;
      }

      // 调用云函数更新账号信息
      const res = await wx.cloud.callFunction({
        name: "update-user-account",
        data: {
          userId: userId,
          accountId: this.data.accountInfo.accountId,
          updateFields: updateFields,
        },
      });

      wx.hideLoading();

      if (res.result.success) {
        console.log("账号更新成功:", res.result);

        // 更新本地数据
        this.setData({
          accountInfo: {
            ...this.data.accountInfo,
            ...updateFields,
          },
        });

        wx.showToast({
          title: "更新成功",
          icon: "success",
          duration: 2000,
        });

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
          });
        }, 2000);
      } else {
        console.error("账号更新失败:", res.result.error);
        wx.showToast({
          title: res.result.error || "更新失败",
          icon: "none",
          duration: 2000,
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error("提交账号信息失败:", error);
      wx.showToast({
        title: "网络错误，请稍后重试",
        icon: "none",
        duration: 2000,
      });
    }
  },
});
