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

      // 直接使用传递的长期下载URL，不再调用云存储API
      this.buildWebViewUrl();
    } else {
      this.setData({
        errorMessage: "缺少必要参数：文章标题或下载URL",
      });
      console.error("❌ 缺少必要参数:", options);
    }
  },

  // 构建web-view的URL
  buildWebViewUrl: function () {
    const { defaultDomain, downloadUrl, articleTitle } = this.data;

    // 构建完整的web-view URL，直接使用传递的长期下载URL
    const webViewUrl = `https://${defaultDomain}/miniWeb/index.html?tempUrl=${encodeURIComponent(
      downloadUrl
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
      webViewUrl: "",
      isPreparing: true, // 重新显示准备界面
    });

    console.log("🔄 用户点击重试，重新构建web-view URL");

    // 重新构建web-view URL
    this.buildWebViewUrl();
  },
});
