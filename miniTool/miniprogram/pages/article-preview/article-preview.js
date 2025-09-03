// pages/article-preview/article-preview.js
// 文章预览页面 - 重构版本

Page({
  data: {
    // 页面数据
    articleTitle: "", // 文章标题
    downloadUrl: "", // 云存储文章ID
    tempDownloadUrl: "", // 临时下载URL
    errorMessage: "", // 错误信息
    isPreparing: false, // 准备状态

    // web-view 配置
    webViewUrl: "", // web-view 要打开的URL
    defaultDomain: "cloud1-5g6ik91va74262bb-1367027189.tcloudbaseapp.com", // 默认域名
  },

  onLoad: function (options) {
    console.log("文章预览页面加载，接收参数:", options);

    // 解析传递的参数
    if (options.articleTitle && options.downloadUrl) {
      const articleTitle = decodeURIComponent(options.articleTitle);
      const downloadUrl = decodeURIComponent(options.downloadUrl);

      this.setData({
        articleTitle: articleTitle,
        downloadUrl: downloadUrl,
        isPreparing: true, // 直接显示准备界面
      });

      console.log("✅ 参数解析成功:", {
        articleTitle: articleTitle,
        downloadUrl: downloadUrl,
      });

      // 在准备界面显示期间，后台开始处理
      this.startBackgroundProcess();
    } else {
      this.setData({
        errorMessage: "缺少必要参数：文章标题或云存储文章ID",
      });
      console.error("❌ 缺少必要参数:", options);
    }
  },

  // 获取临时下载URL
  getTempDownloadUrl: function () {
    const { downloadUrl } = this.data;

    if (!downloadUrl) {
      this.setData({
        errorMessage: "云存储文章ID无效",
      });
      return;
    }

    console.log("🔄 开始获取临时下载URL...");
    console.log("📥 云存储文章ID:", downloadUrl);

    try {
      // 直接使用传递来的云存储文章ID
      const fileId = downloadUrl;

      if (!fileId || fileId.trim() === "") {
        throw new Error("云存储文章ID无效");
      }

      console.log("📁 云存储文章ID:", fileId);

      // 调用云存储API获取临时下载URL
      this.callCloudStorageAPI(fileId);
    } catch (error) {
      console.error("❌ 获取临时下载URL失败:", error);
      wx.hideLoading();
      this.setData({
        errorMessage: "获取下载链接失败: " + error.message,
      });
    }
  },

  // 调用云存储API获取临时下载URL
  callCloudStorageAPI: function (fileId) {
    console.log("☁️ 调用云存储API，文件ID:", fileId);

    // 使用微信小程序的云存储API获取临时下载URL
    wx.cloud.getTempFileURL({
      fileList: [fileId],
      success: (res) => {
        console.log("✅ 云存储API调用成功:", res);

        if (res.fileList && res.fileList.length > 0) {
          const fileInfo = res.fileList[0];

          if (fileInfo.status === 0 && fileInfo.tempFileURL) {
            // 成功获取临时下载URL
            const tempUrl = fileInfo.tempFileURL;
            console.log("✅ 成功获取临时下载URL:", tempUrl);

            this.setData({
              tempDownloadUrl: tempUrl,
              isPreparing: true, // 进入准备状态
            });

            console.log("🎨 进入准备状态，显示友好等待界面");

            // 构建web-view的URL
            this.buildWebViewUrl();
          } else {
            // 获取临时URL失败
            const errorMsg = fileInfo.errMsg || "获取临时下载URL失败";
            console.error("❌ 获取临时下载URL失败:", errorMsg);
            this.setData({
              isLoading: false,
              errorMessage: errorMsg,
            });
          }
        } else {
          console.error("❌ 云存储API返回数据异常");
          this.setData({
            errorMessage: "云存储API返回数据异常",
          });
        }

        wx.hideLoading();
      },
      fail: (error) => {
        console.error("❌ 云存储API调用失败:", error);
        wx.hideLoading();
        this.setData({
          errorMessage: "云存储API调用失败: " + (error.errMsg || "未知错误"),
        });
      },
    });
  },

  // 后台处理函数
  startBackgroundProcess: function () {
    console.log("🔄 开始后台处理：获取临时下载URL");

    // 获取临时下载URL
    this.getTempDownloadUrl();
  },

  // 构建web-view的URL
  buildWebViewUrl: function () {
    const { defaultDomain, tempDownloadUrl, articleTitle } = this.data;

    // 构建完整的web-view URL，包含必要的参数
    const webViewUrl = `https://${defaultDomain}/miniWeb/index.html?tempUrl=${encodeURIComponent(
      tempDownloadUrl
    )}&fileName=${encodeURIComponent(articleTitle)}`;

    console.log("🌐 构建web-view URL:", webViewUrl);

    // 设置web-view URL并退出准备状态
    this.setData({
      webViewUrl: webViewUrl,
      isPreparing: false, // 直接退出准备状态
    });

    console.log("✅ web-view URL构建完成，页面准备就绪");
    console.log("🎨 准备状态结束，显示web-view内容");
  },

  // web-view 加载开始
  onWebViewLoad: function (e) {
    console.log("🌐 web-view 开始加载:", e.detail.url);
  },

  // web-view 加载完成
  onWebViewLoadFinish: function (e) {
    console.log("✅ web-view 加载完成:", e.detail.url);
  },

  // web-view 加载失败
  onWebViewLoadError: function (e) {
    console.error("❌ web-view 加载失败:", e.detail);
    this.setData({
      errorMessage: "页面加载失败: " + (e.detail.errMsg || "未知错误"),
    });
  },

  // 重试按钮
  onRetryTap: function () {
    this.setData({
      errorMessage: "",
      tempDownloadUrl: "",
      webViewUrl: "",
      isPreparing: true, // 重新显示准备界面
    });

    console.log("🔄 用户点击重试，重新开始后台处理");

    // 重新开始后台处理
    this.startBackgroundProcess();
  },
});
