// 提交结算页面
const authUtils = require("../../utils/authUtils");
Page({
  data: {
    // 页面数据
    accountId: "",
    accountName: "",
    settlementPeriod: "",
    // 结算方式选项
    settlementMethods: [
      { value: "wechat", label: "微信" },
      { value: "alipay", label: "支付宝" },
      { value: "other", label: "其他" },
      { value: "none", label: "无需结算" },
    ],
    selectedMethod: "", // 选中的结算方式
    orderNumber: "", // 订单号
    settlementEarnings: "0.00", // 本期结算收益
    accountEarnings: "0.00", // 本期账号收益
    settlementEarningsError: "", // 本期结算收益错误提示
    accountEarningsError: "", // 本期账号收益错误提示
    settlementDocImage: "", // 结算单图片
    transferScreenshotImage: "", // 转账截图
  },

  onLoad: function (options) {
    console.log("提交结算页面接收到的参数:", options);

    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }

    // 处理传递过来的参数
    if (options.accountId) {
      this.setData({
        accountId: options.accountId,
      });
    }

    if (options.accountName) {
      this.setData({
        accountName: decodeURIComponent(options.accountName),
      });
    }

    if (options.period) {
      this.setData({
        settlementPeriod: decodeURIComponent(options.period),
      });
    }
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 选择结算方式
  selectMethod: function (e) {
    const selectedValue = e.currentTarget.dataset.value;
    this.setData({
      selectedMethod: selectedValue,
    });
    console.log("选择的结算方式:", selectedValue);
  },

  // 订单号输入处理
  onOrderInput: function (e) {
    const orderNumber = e.detail.value;
    this.setData({
      orderNumber: orderNumber,
    });
    console.log("输入的订单号:", orderNumber);
  },

  // 本期结算收益输入处理
  onSettlementEarningsInput: function (e) {
    const inputValue = e.detail.value;

    // 数字校验
    if (inputValue && !this.isValidNumber(inputValue)) {
      this.setData({
        settlementEarningsError: "请输入有效的数字金额",
      });
      return;
    } else {
      this.setData({
        settlementEarningsError: "",
      });
    }

    this.setData({
      settlementEarnings: inputValue,
    });
    console.log("本期结算收益:", inputValue);
  },

  // 本期账号收益输入处理
  onAccountEarningsInput: function (e) {
    const inputValue = e.detail.value;

    // 数字校验
    if (inputValue && !this.isValidNumber(inputValue)) {
      this.setData({
        accountEarningsError: "请输入有效的数字金额",
      });
      return;
    } else {
      this.setData({
        accountEarningsError: "",
      });
    }

    this.setData({
      accountEarnings: inputValue,
    });
    console.log("本期账号收益:", inputValue);
  },

  // 数字校验方法
  isValidNumber: function (value) {
    // 允许空值
    if (!value || value.trim() === "") {
      return true;
    }

    // 检查是否为有效数字格式（支持小数点和最多两位小数）
    const numberRegex = /^\d+(\.\d{0,2})?$/;
    return numberRegex.test(value);
  },

  // 本期结算收益输入框聚焦
  onSettlementEarningsFocus: function (e) {
    if (this.data.settlementEarnings === "0.00") {
      this.setData({
        settlementEarnings: "",
      });
    }
  },

  // 本期账号收益输入框聚焦
  onAccountEarningsFocus: function (e) {
    if (this.data.accountEarnings === "0.00") {
      this.setData({
        accountEarnings: "",
      });
    }
  },

  // 上传结算单
  uploadSettlementDoc: function () {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: function (res) {
        const tempFilePath = res.tempFilePaths[0];
        that.setData({
          settlementDocImage: tempFilePath,
        });
        console.log("结算单上传成功:", tempFilePath);

        // 显示上传成功提示
        wx.showToast({
          title: "结算单上传成功",
          icon: "success",
          duration: 2000,
        });
      },
      fail: function (err) {
        console.error("选择图片失败:", err);
        wx.showToast({
          title: "选择图片失败",
          icon: "error",
          duration: 2000,
        });
      },
    });
  },

  // 上传转账截图
  uploadTransferScreenshot: function () {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: function (res) {
        const tempFilePath = res.tempFilePaths[0];
        that.setData({
          transferScreenshotImage: tempFilePath,
        });
        console.log("转账截图上传成功:", tempFilePath);

        // 显示上传成功提示
        wx.showToast({
          title: "转账截图上传成功",
          icon: "success",
          duration: 2000,
        });
      },
      fail: function (err) {
        console.error("选择图片失败:", err);
        wx.showToast({
          title: "选择图片失败",
          icon: "error",
          duration: 2000,
        });
      },
    });
  },

  // 预览结算单
  previewSettlementDoc: function () {
    if (this.data.settlementDocImage) {
      wx.previewImage({
        urls: [this.data.settlementDocImage],
        current: this.data.settlementDocImage,
      });
    }
  },

  // 预览转账截图
  previewTransferScreenshot: function () {
    if (this.data.transferScreenshotImage) {
      wx.previewImage({
        urls: [this.data.transferScreenshotImage],
        current: this.data.transferScreenshotImage,
      });
    }
  },

  // 提交结算数据
  submitSettlementData: function () {
    const that = this;

    // 数据验证
    if (!this.validateFormData()) {
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: "提交中...",
      mask: true,
    });

    // 准备提交数据
    const submitData = this.prepareSubmitData();

    console.log("准备提交的数据:", submitData);

    // 模拟提交到后台
    setTimeout(() => {
      wx.hideLoading();

      // 模拟提交成功
      wx.showModal({
        title: "提交成功",
        content: "结算数据已成功提交，请等待审核",
        showCancel: false,
        confirmText: "确定",
        success: function (res) {
          if (res.confirm) {
            // 返回上一页
            wx.navigateBack({
              delta: 1,
            });
          }
        },
      });
    }, 2000);

    // 实际项目中，这里应该调用真实的API
    // this.callSubmitAPI(submitData);
  },

  // 验证表单数据
  validateFormData: function () {
    // 验证结算方式
    if (!this.data.selectedMethod) {
      wx.showToast({
        title: "请选择结算方式",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    // 验证订单号
    if (!this.data.orderNumber.trim()) {
      wx.showToast({
        title: "请输入订单号",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    // 验证结算收益
    if (
      !this.data.settlementEarnings ||
      this.data.settlementEarnings === "0.00"
    ) {
      wx.showToast({
        title: "请输入本期结算收益",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    // 验证结算收益格式
    if (this.data.settlementEarningsError) {
      wx.showToast({
        title: "请修正本期结算收益格式",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    // 验证账号收益
    if (!this.data.accountEarnings || this.data.accountEarnings === "0.00") {
      wx.showToast({
        title: "请输入本期账号收益",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    // 验证账号收益格式
    if (this.data.accountEarningsError) {
      wx.showToast({
        title: "请修正本期账号收益格式",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    // 验证结算单图片
    if (!this.data.settlementDocImage) {
      wx.showToast({
        title: "请上传结算单",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    // 验证转账截图
    if (!this.data.transferScreenshotImage) {
      wx.showToast({
        title: "请上传转账截图",
        icon: "error",
        duration: 2000,
      });
      return false;
    }

    return true;
  },

  // 准备提交数据
  prepareSubmitData: function () {
    return {
      accountId: this.data.accountId,
      accountName: this.data.accountName,
      settlementPeriod: this.data.settlementPeriod,
      settlementMethod: this.data.selectedMethod,
      orderNumber: this.data.orderNumber,
      settlementEarnings: this.data.settlementEarnings,
      accountEarnings: this.data.accountEarnings,
      settlementDocImage: this.data.settlementDocImage,
      transferScreenshotImage: this.data.transferScreenshotImage,
      submitTime: new Date().toISOString(),
    };
  },

  // 调用提交API（实际项目中使用）
  callSubmitAPI: function (data) {
    wx.request({
      url: "https://your-api-endpoint/submit-settlement",
      method: "POST",
      data: data,
      header: {
        "content-type": "application/json",
      },
      success: function (res) {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showModal({
            title: "提交成功",
            content: "结算数据已成功提交，请等待审核",
            showCancel: false,
            confirmText: "确定",
            success: function (modalRes) {
              if (modalRes.confirm) {
                wx.navigateBack({
                  delta: 1,
                });
              }
            },
          });
        } else {
          wx.showToast({
            title: "提交失败，请重试",
            icon: "error",
            duration: 2000,
          });
        }
      },
      fail: function (err) {
        wx.hideLoading();
        console.error("提交失败:", err);
        wx.showToast({
          title: "网络错误，请重试",
          icon: "error",
          duration: 2000,
        });
      },
    });
  },
});
