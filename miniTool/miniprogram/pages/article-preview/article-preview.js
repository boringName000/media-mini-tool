// pages/article-preview/article-preview.js
Page({
  data: {
    articleContent: "",
    isLoading: true,
    errorMessage: "",
    fileName: "",
    tagStyle: {
      // 基础样式配置，不覆盖原始 HTML 样式
      h1: "color: #ffffff; background-color: #ff595e; padding: 20rpx; margin: 30rpx 0 20rpx; border-radius: 8rpx; font-size: 48rpx; font-weight: bold;",
      h2: "color: #ffffff; background-color: #ff595e; padding: 16rpx; margin: 24rpx 0 16rpx; border-radius: 6rpx; font-size: 40rpx; font-weight: bold;",
      h3: "color: #ff595e; font-size: 36rpx; margin: 20rpx 0; font-weight: bold;",
      h4: "color: #ff595e; font-size: 32rpx; margin: 16rpx 0; font-weight: bold;",
      strong: "font-weight: bold; padding: 0 4rpx;",
      em: "color: #1982c4; font-style: italic;",
      code: "color: #6a4c93; background-color: #fdf9ff; padding: 4rpx 8rpx; border-radius: 6rpx; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 0.9em;",
      blockquote:
        "color: #333333; background-color: #fff5f5; border-left: 8rpx solid #ffcccf; padding: 20rpx 30rpx; margin: 20rpx 0; border-radius: 0 8rpx 8rpx 0;",
      a: "color: #1982c4; text-decoration: none; border-bottom: 2rpx solid #1982c4;",
      img: "max-width: 100%; height: auto; display: block; margin: 20rpx auto; border-radius: 10rpx;",
      p: "font-size: 32rpx; margin: 24rpx 0; color: #333333; line-height: 1.8;",
    },
  },

  onLoad: function (options) {
    console.log("文章预览页面参数:", options);

    // 检查文件路径参数
    if (options.filePath) {
      this.loadFileFromPath(options);
    } else {
      this.setData({
        isLoading: false,
        errorMessage: "未找到文件路径",
      });
    }
  },

  // 从文件路径加载内容
  loadFileFromPath: function (options) {
    try {
      const filePath = decodeURIComponent(options.filePath);
      const fileName = decodeURIComponent(options.fileName || "未知文件");

      console.log("=== 从文件路径加载 ===");
      console.log("文件路径:", filePath);
      console.log("文件名称:", fileName);

      this.setData({
        fileName: fileName,
      });

      // 设置页面标题
      wx.setNavigationBarTitle({
        title: `预览 - ${fileName}`,
      });

      // 读取文件内容
      this.readFileContent(filePath);
    } catch (error) {
      console.error("解析文件路径失败:", error);
      this.setData({
        isLoading: false,
        errorMessage: "文件路径解析失败",
      });
    }
  },

  // 读取文件内容
  readFileContent: function (filePath) {
    wx.showLoading({
      title: "正在读取文件...",
    });

    const fs = wx.getFileSystemManager();

    fs.readFile({
      filePath: filePath,
      encoding: "utf8",
      success: (res) => {
        console.log("文件读取成功，内容长度:", res.data.length);
        wx.hideLoading();
        this.renderArticle(res.data);
      },
      fail: (err) => {
        console.error("文件读取失败:", err);
        wx.hideLoading();
        this.setData({
          isLoading: false,
          errorMessage: "文件读取失败: " + (err.errMsg || "未知错误"),
        });
      },
    });
  },

  // 渲染文章内容
  renderArticle: function (htmlContent) {
    if (!htmlContent) {
      this.setData({
        isLoading: false,
        errorMessage: "文件内容为空",
      });
      return;
    }

    try {
      wx.showLoading({
        title: "正在解析...",
      });

      console.log("=== HTML 内容信息 ===");
      console.log("内容长度:", htmlContent.length);
      console.log("内容预览:", htmlContent.substring(0, 500));

      // 预处理 HTML 内容，处理颜色样式
      const processedContent = this.preprocessHtml(htmlContent);

      // 使用处理后的 HTML 内容
      this.setData({
        articleContent: processedContent,
        isLoading: false,
      });

      wx.hideLoading();
    } catch (error) {
      console.error("文章解析失败:", error);
      wx.hideLoading();
      this.setData({
        isLoading: false,
        errorMessage: "文章解析失败: " + error.message,
      });
    }
  },

  // 预处理 HTML 内容，处理不支持的选择器
  preprocessHtml: function (htmlContent) {
    let processed = htmlContent;

    // 处理 nth-of-type 选择器，将其转换为内联样式
    // 例如：nth-of-type(5n+1) 表示每5个元素中的第1个
    processed = this.processNthOfType(processed);

    console.log("预处理后的HTML长度:", processed.length);
    console.log("预处理后的HTML预览:", processed.substring(0, 500));
    return processed;
  },

  // 处理 nth-of-type 选择器
  processNthOfType: function (htmlContent) {
    let processed = htmlContent;

    // 常见的 nth-of-type 模式
    const nthPatterns = [
      // 每5个元素循环颜色
      {
        selector: /nth-of-type\(5n\+1\)/gi,
        colors: ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"],
        description: "每5个元素循环颜色",
      },
      // 每3个元素循环颜色
      {
        selector: /nth-of-type\(3n\+1\)/gi,
        colors: ["#ff595e", "#ffca3a", "#8ac926"],
        description: "每3个元素循环颜色",
      },
      // 每4个元素循环颜色
      {
        selector: /nth-of-type\(4n\+1\)/gi,
        colors: ["#ff595e", "#ffca3a", "#8ac926", "#1982c4"],
        description: "每4个元素循环颜色",
      },
    ];

    // 为每种 nth-of-type 模式处理对应的元素
    nthPatterns.forEach((pattern, patternIndex) => {
      const tagName = this.getTagNameFromContext(processed, pattern.selector);
      if (tagName) {
        processed = this.applyNthOfTypeColors(
          processed,
          tagName,
          pattern.colors,
          pattern.description
        );
      }
    });

    return processed;
  },

  // 从上下文中获取标签名
  getTagNameFromContext: function (htmlContent, selector) {
    // 这里可以根据实际需要扩展，目前返回常见的标签
    const commonTags = [
      "strong",
      "p",
      "div",
      "span",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ];

    // 检查哪个标签在内容中出现
    for (let tag of commonTags) {
      if (htmlContent.includes(`<${tag}`)) {
        return tag;
      }
    }

    return "strong"; // 默认返回 strong
  },

  // 应用 nth-of-type 颜色循环
  applyNthOfTypeColors: function (htmlContent, tagName, colors, description) {
    let processed = htmlContent;
    let count = 0;

    // 匹配指定标签
    const tagRegex = new RegExp(`<${tagName}([^>]*)>`, "gi");

    processed = processed.replace(tagRegex, (match, attributes) => {
      count++;
      const colorIndex = (count - 1) % colors.length;
      const color = colors[colorIndex];

      console.log(
        `${description}: 第${count}个${tagName}标签使用颜色 ${color}`
      );

      // 如果已经有 style 属性，添加颜色
      if (attributes.includes("style=")) {
        return match.replace(/style="([^"]*)"/, `style="$1; color: ${color};"`);
      } else {
        // 如果没有 style 属性，添加颜色样式
        return `<${tagName}${attributes} style="color: ${color};">`;
      }
    });

    return processed;
  },

  // mp-html 加载完成事件
  onHtmlLoad: function (e) {
    console.log("mp-html 加载完成:", e);
  },

  // mp-html 渲染完成事件
  onHtmlReady: function (e) {
    console.log("mp-html 渲染完成:", e);
  },

  // 复制内容
  copyContent: function () {
    // 获取原始内容用于复制
    const originalContent = this.getOriginalContent();

    wx.setClipboardData({
      data: originalContent,
      success: () => {
        wx.showToast({
          title: "内容已复制",
          icon: "success",
          duration: 2000,
        });
      },
      fail: () => {
        wx.showToast({
          title: "复制失败",
          icon: "error",
          duration: 2000,
        });
      },
    });
  },

  // 获取原始内容（用于复制功能）
  getOriginalContent: function () {
    // 使用当前渲染的内容
    return this.data.articleContent || "";
  },

  // 返回按钮
  onBackTap: function () {
    wx.navigateBack({
      delta: 1,
    });
  },
});
