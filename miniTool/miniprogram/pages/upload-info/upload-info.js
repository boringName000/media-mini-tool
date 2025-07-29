// 回传信息页面
Page({
  data: {
    // 页面数据
    taskId: "",
    taskTitle: "",
    accountName: "",
    publishedLink: "", // 发表后的链接
    linkError: "", // 链接错误提示
  },

  onLoad: function (options) {
    console.log("回传信息页面接收到的参数:", options);

    // 处理传递过来的参数
    if (options.taskId) {
      this.setData({
        taskId: options.taskId,
      });
    }

    if (options.taskTitle) {
      this.setData({
        taskTitle: decodeURIComponent(options.taskTitle),
      });
    }

    if (options.accountName) {
      this.setData({
        accountName: decodeURIComponent(options.accountName),
      });
    }
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 链接输入处理
  onLinkInput: function (e) {
    const link = e.detail.value;
    this.setData({
      publishedLink: link,
      linkError: "", // 清除错误提示
    });
    console.log("输入的链接:", link);
  },

  // 链接输入框失去焦点时的验证
  onLinkBlur: function (e) {
    const link = e.detail.value;
    this.validateLink(link);
  },

  // 验证链接格式
  validateLink: function (link) {
    if (!link) {
      this.setData({
        linkError: "请填写发表后的链接",
      });
      return false;
    }

    // 简单的链接格式验证
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(link)) {
      this.setData({
        linkError: "请输入有效的链接地址",
      });
      return false;
    }

    this.setData({
      linkError: "",
    });
    return true;
  },

  // 提交回传信息
  submitUploadInfo: function () {
    const { publishedLink, taskId, taskTitle, accountName } = this.data;

    // 验证链接
    if (!this.validateLink(publishedLink)) {
      wx.showToast({
        title: "请填写有效的链接",
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
        title: "回传成功",
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
    console.log("提交回传信息:", {
      taskId,
      taskTitle,
      accountName,
      publishedLink,
    });
  },
});
