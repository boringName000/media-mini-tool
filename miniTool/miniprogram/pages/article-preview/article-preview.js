// pages/article-preview/article-preview.js
const { getArticleTitle } = require("../../utils/articleDownloadUtils.js");

Page({
  data: {
    articleContent: "",
    isLoading: true,
    errorMessage: "",
    fileName: "",
    articleTitle: "", // 新增：文章标题（从元数据读取）
    tagStyle: {
      // 最小化的基础样式，只在HTML没有定义时作为兜底
      // 这些样式会被HTML文件中的样式覆盖
      img: "max-width: 100%; height: auto; display: block; margin: 20rpx auto; border-radius: 10rpx;",
      a: "text-decoration: none;",
    },
  },

  onLoad: function (options) {
    // 参数解析
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

      this.setData({
        fileName: fileName,
      });

      // 获取文章标题（优先从元数据，回退到文件名）
      const articleTitle = getArticleTitle(filePath);
      this.setData({ articleTitle });

      // 设置页面标题
      wx.setNavigationBarTitle({
        title: articleTitle,
      });

      // 检查是否是HTTP URL
      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        this.downloadAndReadFile(filePath, fileName);
      } else {
        // 读取文件内容
        this.readFileContent(filePath);
      }
    } catch (error) {
      this.setData({
        isLoading: false,
        errorMessage: "文件路径解析失败",
      });
    }
  },

  // 下载并读取文件
  downloadAndReadFile: function (url, fileName) {
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          console.log("✅ 文件下载成功");
          // 下载成功后读取临时文件
          this.readFileContent(res.tempFilePath);
        } else {
          console.error("❌ 文件下载失败，状态码:", res.statusCode);
          this.setData({
            isLoading: false,
            errorMessage: "文件下载失败",
          });
        }
      },
      fail: (err) => {
        console.error("❌ 文件下载失败:", err);
        this.setData({
          isLoading: false,
          errorMessage: "文件下载失败: " + (err.errMsg || "未知错误"),
        });
      },
    });
  },

  // 读取文件内容
  readFileContent: function (filePath) {
    // 先检查文件是否存在和获取文件信息
    const fs = wx.getFileSystemManager();

    try {
      // 获取文件统计信息
      const stats = fs.statSync(filePath);

      // 检查文件大小
      if (stats.size === 0) {
        this.setData({
          isLoading: false,
          errorMessage: "文件大小为0字节，无法读取内容",
        });
        return;
      }

      if (!stats.isFile()) {
        this.setData({
          isLoading: false,
          errorMessage: "指定路径不是文件",
        });
        return;
      }
    } catch (statError) {
      this.setData({
        isLoading: false,
        errorMessage: "无法获取文件信息: " + statError.message,
      });
      return;
    }

    wx.showLoading({
      title: "正在读取文件...",
    });

    // 首先尝试UTF-8编码
    this.tryReadFileWithEncoding(
      fs,
      filePath,
      "utf8",
      (success, data, encoding) => {
        if (success) {
          wx.hideLoading();
          this.renderArticle(data);
        } else {
          // 如果UTF-8失败，尝试其他编码
          this.tryReadFileWithEncoding(
            fs,
            filePath,
            "gbk",
            (success2, data2, encoding2) => {
              if (success2) {
                wx.hideLoading();
                this.renderArticle(data2);
              } else {
                wx.hideLoading();
                this.setData({
                  isLoading: false,
                  errorMessage: "文件编码不支持，请检查文件格式",
                });
              }
            }
          );
        }
      }
    );
  },

  // 尝试使用指定编码读取文件
  tryReadFileWithEncoding: function (fs, filePath, encoding, callback) {
    fs.readFile({
      filePath: filePath,
      encoding: encoding,
      success: (res) => {
        console.log(`✅ 使用${encoding}编码读取成功`);
        callback(true, res.data, encoding);
      },
      fail: (err) => {
        console.log(`❌ 使用${encoding}编码读取失败:`, err.errMsg);
        callback(false, null, encoding);
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

      // 预处理 HTML 内容，智能转换不支持的CSS样式
      const processedContent = this.preprocessHtml(htmlContent);

      // 使用处理后的 HTML 内容
      this.setData({
        articleContent: processedContent,
        isLoading: false,
      });

      console.log("✅ 文章解析成功");
      wx.hideLoading();
    } catch (error) {
      console.error("❌ 文章解析失败:", error);
      wx.hideLoading();
      this.setData({
        isLoading: false,
        errorMessage: "文章解析失败: " + error.message,
      });
    }
  },

  // 预处理 HTML 内容，主要依赖 mp-html 组件的内置功能
  preprocessHtml: function (htmlContent) {
    // 只做最基本的处理：提取CSS样式到tagStyle配置中
    const extractedStyles = this.extractStylesForTagStyle(htmlContent);

    // 更新tagStyle配置，HTML文件中的样式优先级最高
    // 兜底样式只在HTML没有定义时生效
    this.setData({
      tagStyle: {
        ...this.data.tagStyle, // 兜底样式（低优先级）
        ...extractedStyles, // HTML文件样式（高优先级）
      },
    });

    // 处理图片路径问题（可选，保持HTML内容完整性）
    const processedContent = this.handleImagePaths(htmlContent);

    // 验证HTML内容完整性
    this.validateHtmlIntegrity(htmlContent, processedContent);

    return processedContent;
  },

  // 处理图片路径问题
  handleImagePaths: function (htmlContent) {
    // 如果HTML中没有图片，直接返回
    if (!htmlContent.includes("<img")) {
      return htmlContent;
    }

    // 处理相对路径的图片，避免加载错误
    let processedContent = htmlContent.replace(
      /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
      (match, beforeSrc, src, afterSrc) => {
        if (src && !src.startsWith("http") && !src.startsWith("data:")) {
          return `<img${beforeSrc}src="${src}"${afterSrc} onerror="this.style.display='none';" alt="图片加载失败">`;
        }
        return match;
      }
    );

    return processedContent;
  },

  // 提取CSS样式，转换为mp-html的tagStyle格式
  extractStylesForTagStyle: function (htmlContent) {
    const extractedStyles = {};
    const allRules = [];

    // 匹配<style>标签中的CSS规则
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;

    while ((styleMatch = styleRegex.exec(htmlContent)) !== null) {
      const cssContent = styleMatch[1];

      // 解析CSS规则
      const ruleRegex = /([^{}]+)\s*\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/gi;
      let ruleMatch;

      while ((ruleMatch = ruleRegex.exec(cssContent)) !== null) {
        const selector = ruleMatch[1].trim();
        const styles = ruleMatch[2].trim();

        // 收集所有规则，稍后按优先级处理
        allRules.push({
          selector: selector,
          styles: styles,
          priority: this.calculateSelectorPriority(selector),
        });
      }
    }

    // 按优先级排序，优先级高的在后面（会覆盖前面的）
    allRules.sort((a, b) => a.priority - b.priority);

    // 处理排序后的规则
    allRules.forEach((rule) => {
      const { selector, styles } = rule;

      // 处理复合选择器（如 .article-content h1）
      if (selector.includes(" ") && !selector.includes(":")) {
        const parts = selector.split(" ").filter((part) => part.trim());
        if (parts.length === 2) {
          const parentSelector = parts[0].trim();
          const childSelector = parts[1].trim();

          // 如果父选择器是类选择器，子选择器是标签
          if (
            parentSelector.startsWith(".") &&
            !childSelector.includes(".") &&
            !childSelector.includes(":")
          ) {
            const tagName = childSelector.trim();
            if (tagName) {
              extractedStyles[tagName] = styles;
            }
          }
        }
      }
      // 处理简单标签选择器
      else if (
        !selector.includes(" ") &&
        !selector.includes(":") &&
        !selector.includes(".")
      ) {
        const tagName = selector.trim();
        if (tagName && !extractedStyles[tagName]) {
          extractedStyles[tagName] = styles;
        }
      }
    });

    return extractedStyles;
  },

  // 计算选择器优先级
  calculateSelectorPriority: function (selector) {
    let priority = 0;

    // 类选择器优先级更高
    if (selector.includes(".")) {
      priority += 10;
    }

    // 复合选择器优先级更高
    if (selector.includes(" ")) {
      priority += 5;
    }

    // 标签选择器优先级最低
    if (
      !selector.includes(".") &&
      !selector.includes("#") &&
      !selector.includes(":")
    ) {
      priority += 1;
    }

    return priority;
  },

  // mp-html 加载完成事件
  onHtmlLoad: function (e) {},

  // mp-html 渲染完成事件
  onHtmlReady: function (e) {},

  // 图片点击事件
  onImgTap: function (e) {},

  // 图片加载错误事件
  onImgError: function (e) {
    // 静默处理图片加载错误，不影响整体渲染
  },

  // 复制标题
  copyTitle: function () {
    const articleTitle = this.data.articleTitle || "未知标题";

    wx.setClipboardData({
      data: articleTitle,
      success: () => {
        wx.showToast({
          title: "标题已复制",
          icon: "success",
          duration: 2000,
        });
        console.log("✅ 文章标题已复制到剪贴板:", articleTitle);
      },
      fail: () => {
        wx.showToast({
          title: "复制失败",
          icon: "error",
          duration: 2000,
        });
        console.error("❌ 复制标题失败");
      },
    });
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
        console.log("✅ 文章内容已复制到剪贴板，长度:", originalContent.length);
      },
      fail: () => {
        wx.showToast({
          title: "复制失败",
          icon: "error",
          duration: 2000,
        });
        console.error("❌ 复制内容失败");
      },
    });
  },

  // 获取原始内容（用于复制功能）
  getOriginalContent: function () {
    // 使用当前渲染的内容
    return this.data.articleContent || "";
  },

  // 验证HTML内容完整性（调试用）
  validateHtmlIntegrity: function (originalContent, processedContent) {
    return originalContent === processedContent;
  },

  // 查找内容差异（调试用）
  findContentDifference: function (original, processed) {
    return "";
  },

  // 返回按钮
  onBackTap: function () {
    wx.navigateBack({
      delta: 1,
    });
  },
});
