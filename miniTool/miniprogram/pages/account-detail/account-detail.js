// 账号详情页面
const { TrackTypeEnum } = require("../../type/type");
const { PlatformEnum } = require("../../type/type");
const {
  getTrackTypeName,
  getTrackTypeIcon,
} = require("../../utils/trackTypeUtils");
const {
  getPlatformName,
  getPlatformIcon,
} = require("../../utils/platformUtils");

Page({
  data: {
    // 账号信息
    accountInfo: null,

    // 表单数据
    selectedTrackType: null,
    phoneNumber: "",
    accountNickname: "",
    isViolation: false,
    screenshotUrl: "",

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
  },

  onLoad: function (options) {
    console.log("账号详情页面加载，参数:", options);

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
    // 初始化赛道列表
    const trackTypeList = [
      {
        type: TrackTypeEnum.FOOD_TRACK,
        name: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
        icon: getTrackTypeIcon(TrackTypeEnum.FOOD_TRACK),
      },
      {
        type: TrackTypeEnum.ENTERTAINMENT,
        name: getTrackTypeName(TrackTypeEnum.ENTERTAINMENT),
        icon: getTrackTypeIcon(TrackTypeEnum.ENTERTAINMENT),
      },
      {
        type: TrackTypeEnum.TRAVEL_TRACK,
        name: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
        icon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_TRACK),
      },
      {
        type: TrackTypeEnum.TRAVEL_ARTICLE,
        name: getTrackTypeName(TrackTypeEnum.TRAVEL_ARTICLE),
        icon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_ARTICLE),
      },
      {
        type: TrackTypeEnum.CALLIGRAPHY,
        name: getTrackTypeName(TrackTypeEnum.CALLIGRAPHY),
        icon: getTrackTypeIcon(TrackTypeEnum.CALLIGRAPHY),
      },
      {
        type: TrackTypeEnum.FOOD_GIF,
        name: getTrackTypeName(TrackTypeEnum.FOOD_GIF),
        icon: getTrackTypeIcon(TrackTypeEnum.FOOD_GIF),
      },
      {
        type: TrackTypeEnum.FOOD_GREEN,
        name: getTrackTypeName(TrackTypeEnum.FOOD_GREEN),
        icon: getTrackTypeIcon(TrackTypeEnum.FOOD_GREEN),
      },
      {
        type: TrackTypeEnum.PHOTOGRAPHY,
        name: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
        icon: getTrackTypeIcon(TrackTypeEnum.PHOTOGRAPHY),
      },
      {
        type: TrackTypeEnum.ANTIQUE,
        name: getTrackTypeName(TrackTypeEnum.ANTIQUE),
        icon: getTrackTypeIcon(TrackTypeEnum.ANTIQUE),
      },
      {
        type: TrackTypeEnum.PET,
        name: getTrackTypeName(TrackTypeEnum.PET),
        icon: getTrackTypeIcon(TrackTypeEnum.PET),
      },
    ];

    this.setData({
      trackTypeList,
    });
  },

  // 初始化表单数据
  initFormData: function (accountData) {
    console.log("初始化表单数据，账号数据:", accountData);
    console.log("当前trackTypeList:", this.data.trackTypeList);

    // 根据账号数据初始化表单
    const selectedTrack = this.data.trackTypeList.find(
      (item) => item.type === accountData.trackTypeEnum
    );

    console.log("找到的赛道:", selectedTrack);
    console.log("账号的赛道枚举:", accountData.trackTypeEnum);

    // 设置表单数据
    const formData = {
      selectedTrackType: selectedTrack || null,
      phoneNumber: accountData.phoneNumber || "",
      accountNickname: accountData.accountName || "",
      isViolation: accountData.isViolation || false,
      screenshotUrl: accountData.screenshotUrl || "",
    };

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
      "errors.trackType": "",
    });

    console.log("选择的赛道:", selectedTrack);
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

  // 上传截图
  uploadScreenshot: function () {
    const that = this;

    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: function (res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;

        that.setData({
          isUploading: true,
        });

        // 显示上传进度
        wx.showLoading({
          title: "上传中...",
          mask: true,
        });

        // 模拟上传到云存储
        setTimeout(() => {
          wx.hideLoading();
          that.setData({
            screenshotUrl: tempFilePath,
            isUploading: false,
          });

          wx.showToast({
            title: "上传成功",
            icon: "success",
            duration: 2000,
          });
        }, 1500);
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
    this.setData({
      screenshotUrl: "",
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

  // 图片加载错误处理
  onImageError: function (e) {
    console.error("图片加载失败:", e);
    wx.showToast({
      title: "图片加载失败",
      icon: "none",
      duration: 2000,
    });
    // 清除无效的图片URL
    this.setData({
      screenshotUrl: "",
    });
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
  submitAudit: function () {
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

    // 模拟提交数据到服务器
    setTimeout(() => {
      wx.hideLoading();

      // 提交成功
      wx.showToast({
        title: "提交成功",
        icon: "success",
        duration: 2000,
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
        });
      }, 2000);
    }, 1500);

    // 实际项目中，这里应该调用API提交数据
    console.log("提交审核信息:", {
      accountInfo: this.data.accountInfo,
      selectedTrackType: this.data.selectedTrackType,
      phoneNumber: this.data.phoneNumber,
      accountNickname: this.data.accountNickname,
      isViolation: this.data.isViolation,
      screenshotUrl: this.data.screenshotUrl,
    });
  },
});
