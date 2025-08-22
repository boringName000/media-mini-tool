// 提交结算页面
const authUtils = require("../../utils/authUtils");
Page({
  data: {
    // 页面数据
    accountId: "",
    accountName: "",
    settlementPeriod: "",
    // 云函数需要的参数
    userId: "",
    startTime: "",
    endTime: "",
    year: null,
    month: null,
    periodType: "",
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
    settlementDocFile: null, // 结算单文件信息，用于后续上传
    transferScreenshotFile: null, // 转账截图文件信息，用于后续上传
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

    // 处理云函数需要的参数
    if (options.userId) {
      this.setData({
        userId: options.userId,
      });
    }

    if (options.startTime) {
      this.setData({
        startTime: decodeURIComponent(options.startTime),
      });
    }

    if (options.endTime) {
      this.setData({
        endTime: decodeURIComponent(options.endTime),
      });
    }

    if (options.year) {
      this.setData({
        year: parseInt(options.year),
      });
    }

    if (options.month) {
      this.setData({
        month: parseInt(options.month),
      });
    }

    if (options.periodType) {
      this.setData({
        periodType: options.periodType,
      });
    }

    console.log("处理后的参数:", {
      accountId: this.data.accountId,
      accountName: this.data.accountName,
      settlementPeriod: this.data.settlementPeriod,
      userId: this.data.userId,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      year: this.data.year,
      month: this.data.month,
      periodType: this.data.periodType,
    });
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
    // 调用云函数提交结算数据
    this.submitSettlementToCloud();
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

  // 上传结算单图片
  uploadSettlementDoc: function () {
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
          settlementDocImage: tempFilePath,
          settlementDocFile: res.tempFiles[0], // 保存文件信息用于后续上传
        });

        wx.showToast({
          title: "结算单已选择",
          icon: "success",
          duration: 1500,
        });
      },
      fail: function (err) {
        console.error("选择结算单失败:", err);
        wx.showToast({
          title: "选择图片失败",
          icon: "none",
          duration: 2000,
        });
      },
    });
  },

  // 删除结算单图片
  deleteSettlementDoc: function () {
    const currentImageUrl = this.data.settlementDocImage;

    if (!currentImageUrl) {
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: "确定要删除这张结算单吗？",
      success: (res) => {
        if (res.confirm) {
          // 直接清除本地临时文件
          this.setData({
            settlementDocImage: "",
            settlementDocFile: null,
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

  // 预览结算单图片
  previewSettlementDoc: function () {
    const imageUrl = this.data.settlementDocImage;
    if (imageUrl) {
      // 直接预览临时文件
      wx.previewImage({
        urls: [imageUrl],
        current: imageUrl,
      });
    }
  },

  // 上传转账截图
  uploadTransferScreenshot: function () {
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
          transferScreenshotImage: tempFilePath,
          transferScreenshotFile: res.tempFiles[0], // 保存文件信息用于后续上传
        });

        wx.showToast({
          title: "转账截图已选择",
          icon: "success",
          duration: 1500,
        });
      },
      fail: function (err) {
        console.error("选择转账截图失败:", err);
        wx.showToast({
          title: "选择图片失败",
          icon: "none",
          duration: 2000,
        });
      },
    });
  },

  // 删除转账截图
  deleteTransferScreenshot: function () {
    const currentImageUrl = this.data.transferScreenshotImage;

    if (!currentImageUrl) {
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: "确定要删除这张转账截图吗？",
      success: (res) => {
        if (res.confirm) {
          // 直接清除本地临时文件
          this.setData({
            transferScreenshotImage: "",
            transferScreenshotFile: null,
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

  // 预览转账截图
  previewTransferScreenshot: function () {
    const imageUrl = this.data.transferScreenshotImage;
    if (imageUrl) {
      // 直接预览临时文件
      wx.previewImage({
        urls: [imageUrl],
        current: imageUrl,
      });
    }
  },

  // 提交结算数据到云函数
  submitSettlementToCloud: async function () {
    if (!this.validateForm()) {
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: "提交中...",
      mask: true,
    });

    try {
      let finalSettlementDocUrl = this.data.settlementDocImage;
      let finalTransferScreenshotUrl = this.data.transferScreenshotImage;

      // 如果有结算单图片，先上传到云存储
      if (this.data.settlementDocFile) {
        try {
          // 生成文件名
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `settlement_doc_${timestamp}_${randomStr}.jpg`;

          // 上传到云存储
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `userSettlementScreenshot/${fileName}`,
            filePath: this.data.settlementDocFile.tempFilePath,
          });

          console.log("结算单上传成功:", uploadResult);
          finalSettlementDocUrl = uploadResult.fileID;
        } catch (uploadError) {
          console.error("结算单上传失败:", uploadError);
          wx.hideLoading();
          wx.showToast({
            title: "结算单上传失败，请重试",
            icon: "none",
            duration: 2000,
          });
          return;
        }
      }

      // 如果有转账截图，先上传到云存储
      if (this.data.transferScreenshotFile) {
        try {
          // 生成文件名
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `transfer_screenshot_${timestamp}_${randomStr}.jpg`;

          // 上传到云存储
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `userTransferScreenshot/${fileName}`,
            filePath: this.data.transferScreenshotFile.tempFilePath,
          });

          console.log("转账截图上传成功:", uploadResult);
          finalTransferScreenshotUrl = uploadResult.fileID;
        } catch (uploadError) {
          console.error("转账截图上传失败:", uploadError);
          wx.hideLoading();
          wx.showToast({
            title: "转账截图上传失败，请重试",
            icon: "none",
            duration: 2000,
          });
          return;
        }
      }

      // 准备更新字段
      const updateFields = {
        settlementStatus: 2, // 已结算
        settlementTime: new Date().toISOString(),
        settlementMethod: this.getSettlementMethodValue(
          this.data.selectedMethod
        ),
        transferOrderNo: this.data.orderNumber,
        accountEarnings: parseFloat(this.data.accountEarnings),
        settlementEarnings: parseFloat(this.data.settlementEarnings),
        settlementImageUrl: finalSettlementDocUrl,
        transferImageUrl: finalTransferScreenshotUrl,
      };

      // 调用云函数更新账号收益信息
      const result = await wx.cloud.callFunction({
        name: "update-account-earnings",
        data: {
          userId: this.data.userId,
          accountId: this.data.accountId,
          startTime: this.data.startTime,
          endTime: this.data.endTime,
          updateFields: updateFields,
        },
      });

      wx.hideLoading();

      if (result.result.success) {
        // 提交成功
        wx.showToast({
          title: "结算提交成功",
          icon: "success",
          duration: 2000,
        });

        console.log("结算数据更新成功:", result.result.updatedEarning);

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
          });
        }, 2000);
      } else {
        // 提交失败
        wx.showToast({
          title: result.result.message || "提交失败",
          icon: "none",
          duration: 2500,
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error("提交结算失败:", error);
      wx.showToast({
        title: "提交失败，请重试",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 获取结算方式数值
  getSettlementMethodValue: function (method) {
    const methodMap = {
      wechat: 1,
      alipay: 2,
      other: 3,
      none: 0,
    };
    return methodMap[method] || 0;
  },
});
