// 添加账号页面
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
    // 表单数据
    selectedTrackType: null,
    selectedPlatform: null,
    phoneNumber: "",
    accountNickname: "",
    accountId: "",
    registerDate: "",
    isViolation: false,
    screenshotUrl: "",

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
    this.initData();
  },

  onShow: function () {
    // 页面显示时的逻辑
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

    // 初始化平台列表
    const platformList = [
      {
        type: PlatformEnum.XIAOHONGSHU,
        name: getPlatformName(PlatformEnum.XIAOHONGSHU),
        icon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
      },
      {
        type: PlatformEnum.WECHAT_MP,
        name: getPlatformName(PlatformEnum.WECHAT_MP),
        icon: getPlatformIcon(PlatformEnum.WECHAT_MP),
      },
      {
        type: PlatformEnum.DOUYIN,
        name: getPlatformName(PlatformEnum.DOUYIN),
        icon: getPlatformIcon(PlatformEnum.DOUYIN),
      },
      {
        type: PlatformEnum.KUAISHOU,
        name: getPlatformName(PlatformEnum.KUAISHOU),
        icon: getPlatformIcon(PlatformEnum.KUAISHOU),
      },
      {
        type: PlatformEnum.BILIBILI,
        name: getPlatformName(PlatformEnum.BILIBILI),
        icon: getPlatformIcon(PlatformEnum.BILIBILI),
      },
      {
        type: PlatformEnum.WEIBO,
        name: getPlatformName(PlatformEnum.WEIBO),
        icon: getPlatformIcon(PlatformEnum.WEIBO),
      },
      {
        type: PlatformEnum.ZHIHU,
        name: getPlatformName(PlatformEnum.ZHIHU),
        icon: getPlatformIcon(PlatformEnum.ZHIHU),
      },
      {
        type: PlatformEnum.TIKTOK,
        name: getPlatformName(PlatformEnum.TIKTOK),
        icon: getPlatformIcon(PlatformEnum.TIKTOK),
      },
    ];

    // 设置当前日期
    const today = new Date();
    const registerDate = today.toISOString().split("T")[0];

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

  // 验证表单
  validateForm: function () {
    const errors = {};
    let isValid = true;

    // 验证赛道选择
    if (!this.data.selectedTrackType) {
      errors.trackType = "请选择赛道";
      isValid = false;
    }

    // 验证平台选择
    if (!this.data.selectedPlatform) {
      errors.platform = "请选择平台";
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

    // 验证账号ID
    if (!this.data.accountId) {
      errors.accountId = "请输入账号ID";
      isValid = false;
    }

    this.setData({
      errors,
    });

    return isValid;
  },

  // 提交表单
  submitForm: function () {
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
        title: "添加成功",
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
    console.log("提交账号信息:", {
      trackType: this.data.selectedTrackType,
      platform: this.data.selectedPlatform,
      phoneNumber: this.data.phoneNumber,
      accountNickname: this.data.accountNickname,
      accountId: this.data.accountId,
      registerDate: this.data.registerDate,
      isViolation: this.data.isViolation,
      screenshotUrl: this.data.screenshotUrl,
    });
  },
});
