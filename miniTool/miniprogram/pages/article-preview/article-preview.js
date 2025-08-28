// pages/article-preview/article-preview.js
Page({
  data: {
    articleContent: "",
    isLoading: true,
    errorMessage: "",
  },

  onLoad: function (options) {
    console.log("文章预览页面参数:", options);

    // 从页面参数中获取文章内容
    if (options.content) {
      try {
        const decodedContent = decodeURIComponent(options.content);
        this.renderArticle(decodedContent);
      } catch (error) {
        console.error("解码文章内容失败:", error);
        this.setData({
          isLoading: false,
          errorMessage: "文章内容解码失败",
        });
      }
    } else {
      this.setData({
        isLoading: false,
        errorMessage: "未找到文章内容",
      });
    }
  },

  // 渲染文章内容
  renderArticle: function (htmlContent) {
    if (!htmlContent) {
      this.setData({
        isLoading: false,
        errorMessage: "文章内容为空",
      });
      return;
    }

    try {
      wx.showLoading({
        title: "正在解析...",
      });

      // 解析HTML内容
      const renderedContent = this.parseHtmlForRichText(htmlContent);

      this.setData({
        articleContent: renderedContent,
        isLoading: false,
      });

      wx.hideLoading();
    } catch (error) {
      console.error("文章解析失败:", error);
      wx.hideLoading();
      this.setData({
        isLoading: false,
        errorMessage: "文章解析失败",
      });
    }
  },

  // 解析HTML为rich-text支持的格式
  parseHtmlForRichText: function (content) {
    if (!content) return "";

    try {
      console.log("原始内容长度:", content.length);
      console.log("原始内容预览:", content.substring(0, 500));

      // 提取CSS样式定义
      let cssStyles = {};
      const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (styleMatch) {
        const styleContent = styleMatch[1];
        console.log("提取到CSS样式");

        // 解析CSS规则
        const cssRules = styleContent.match(/[^{}]+{[^}]+}/g);
        if (cssRules) {
          cssRules.forEach((rule) => {
            const selectorMatch = rule.match(/^([^{]+){/);
            const propertiesMatch = rule.match(/{([^}]+)}/);

            if (selectorMatch && propertiesMatch) {
              const selector = selectorMatch[1].trim();
              const properties = propertiesMatch[1].trim();

              // 处理嵌套选择器，如 .article-content p
              if (selector.includes(" ")) {
                const parts = selector.split(" ").map((s) => s.trim());
                if (parts.length === 2) {
                  // 提取标签名，如 .article-content p -> p
                  const tagName = parts[1].replace(/\./g, "");
                  cssStyles[tagName] = properties;
                }
              } else {
                // 简化选择器，只处理基本的选择器
                const simpleSelector = selector
                  .replace(/\./g, "")
                  .replace(/\s+/g, "");
                cssStyles[simpleSelector] = properties;
              }
            }
          });
        }
        console.log("解析的CSS样式:", cssStyles);
        console.log("可用的标签样式:", Object.keys(cssStyles));
      }

      // 提取body中的主要内容，去除HTML文档结构
      let bodyContent = content;

      // 如果是完整的HTML文档，提取body内容
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
        console.log("提取到body内容");
      }

      // 进一步提取article-content内容
      const articleMatch = bodyContent.match(
        /<div[^>]*class="article-content"[^>]*>([\s\S]*?)<\/div>/i
      );
      if (articleMatch) {
        bodyContent = articleMatch[1];
        console.log("提取到article-content内容");
      }

      // 清理多余的空白字符
      bodyContent = bodyContent.replace(/^\s+|\s+$/g, "");

      // 改进的HTML解析，应用CSS样式
      let parsedContent = bodyContent
        // 处理换行符
        .replace(/\n/g, "<br/>")
        // 处理标题标签 - 应用CSS样式
        .replace(
          /<h1([^>]*)>(.*?)<\/h1>/gi,
          function (match, attributes, content) {
            const baseStyle =
              "font-size: 32rpx; font-weight: bold; margin: 20rpx 0;";
            const cssStyle = cssStyles["h1"] || "";
            return `<div${attributes} style="${baseStyle} ${cssStyle}">${content}</div>`;
          }
        )
        .replace(
          /<h2([^>]*)>(.*?)<\/h2>/gi,
          function (match, attributes, content) {
            const baseStyle =
              "font-size: 28rpx; font-weight: bold; margin: 16rpx 0;";
            const cssStyle = cssStyles["h2"] || "";
            return `<div${attributes} style="${baseStyle} ${cssStyle}">${content}</div>`;
          }
        )
        .replace(
          /<h3([^>]*)>(.*?)<\/h3>/gi,
          function (match, attributes, content) {
            const baseStyle =
              "font-size: 26rpx; font-weight: bold; margin: 12rpx 0;";
            const cssStyle = cssStyles["h3"] || "";
            return `<div${attributes} style="${baseStyle} ${cssStyle}">${content}</div>`;
          }
        )
        // 处理段落标签 - 应用CSS样式
        .replace(
          /<p([^>]*)>(.*?)<\/p>/gi,
          function (match, attributes, content) {
            const baseStyle = "margin: 12rpx 0; line-height: 1.6;";
            const cssStyle = cssStyles["p"] || "";
            const finalStyle = `${baseStyle} ${cssStyle}`.trim();
            console.log("段落样式应用:", { baseStyle, cssStyle, finalStyle });
            return `<div${attributes} style="${finalStyle}">${content}</div>`;
          }
        )
        // 处理粗体标签 - 应用CSS样式
        .replace(
          /<strong([^>]*)>(.*?)<\/strong>/gi,
          function (match, attributes, content) {
            const baseStyle = "font-weight: bold;";
            const cssStyle = cssStyles["strong"] || "";
            const finalStyle = `${baseStyle} ${cssStyle}`.trim();
            console.log("粗体样式应用:", { baseStyle, cssStyle, finalStyle });
            return `<strong${attributes} style="${finalStyle}">${content}</strong>`;
          }
        )
        .replace(
          /<b([^>]*)>(.*?)<\/b>/gi,
          function (match, attributes, content) {
            const baseStyle = "font-weight: bold;";
            const cssStyle = cssStyles["b"] || "";
            return `<strong${attributes} style="${baseStyle} ${cssStyle}">${content}</strong>`;
          }
        )
        // 处理斜体标签 - 应用CSS样式
        .replace(
          /<em([^>]*)>(.*?)<\/em>/gi,
          function (match, attributes, content) {
            const baseStyle = "font-style: italic;";
            const cssStyle = cssStyles["em"] || "";
            return `<em${attributes} style="${baseStyle} ${cssStyle}">${content}</em>`;
          }
        )
        .replace(
          /<i([^>]*)>(.*?)<\/i>/gi,
          function (match, attributes, content) {
            const baseStyle = "font-style: italic;";
            const cssStyle = cssStyles["i"] || "";
            return `<em${attributes} style="${baseStyle} ${cssStyle}">${content}</em>`;
          }
        )
        // 处理图片标签 - 应用CSS样式
        .replace(/<img([^>]*)>/gi, function (match, attributes) {
          const baseStyle =
            "max-width: 100%; height: auto; margin: 12rpx 0; display: block;";
          const cssStyle = cssStyles["img"] || "";
          return `<img${attributes} style="${baseStyle} ${cssStyle}">`;
        })
        // 处理section标签 - 应用CSS样式
        .replace(
          /<section([^>]*)>(.*?)<\/section>/gi,
          function (match, attributes, content) {
            const baseStyle = "margin: 12rpx 0;";
            const cssStyle = cssStyles["section"] || "";
            return `<div${attributes} style="${baseStyle} ${cssStyle}">${content}</div>`;
          }
        )
        // 处理span标签 - 应用CSS样式
        .replace(
          /<span([^>]*)>(.*?)<\/span>/gi,
          function (match, attributes, content) {
            const cssStyle = cssStyles["span"] || "";
            if (cssStyle) {
              return `<span${attributes} style="${cssStyle}">${content}</span>`;
            }
            return match;
          }
        )
        // 处理div标签 - 应用CSS样式
        .replace(
          /<div([^>]*)>(.*?)<\/div>/gi,
          function (match, attributes, content) {
            const baseStyle = "margin: 8rpx 0;";
            const cssStyle = cssStyles["div"] || "";

            // 检查是否有class属性，应用对应的CSS样式
            const classMatch = attributes.match(/class="([^"]*)"/);
            if (classMatch) {
              const className = classMatch[1].replace(/\s+/g, "");
              const classStyle = cssStyles[className] || "";
              if (classStyle) {
                return `<div${attributes} style="${baseStyle} ${cssStyle} ${classStyle}">${content}</div>`;
              }
            }

            // 如果div没有style属性，添加基础样式
            if (!attributes.includes("style=")) {
              return `<div${attributes} style="${baseStyle} ${cssStyle}">${content}</div>`;
            }
            return match; // 保持原有样式
          }
        );

      // 如果内容为空或太短，返回提示
      if (!parsedContent || parsedContent.trim().length < 10) {
        return '<div style="color: #666; text-align: center; padding: 40rpx;">内容为空或格式不支持</div>';
      }

      console.log("解析后内容长度:", parsedContent.length);
      console.log("解析后内容预览:", parsedContent.substring(0, 500));
      return parsedContent;
    } catch (error) {
      console.error("HTML解析失败:", error);
      return '<div style="color: #666; text-align: center; padding: 40rpx;">解析失败，请查看原始内容</div>';
    }
  },

  // 返回处理
  onBackTap: function () {
    wx.navigateBack({
      delta: 1,
    });
  },

  // 复制内容
  copyContent: function () {
    if (!this.data.articleContent) {
      wx.showToast({
        title: "没有内容可复制",
        icon: "none",
      });
      return;
    }

    // 获取原始HTML内容（从页面参数中）
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options;

    if (options && options.content) {
      try {
        const originalContent = decodeURIComponent(options.content);

        wx.setClipboardData({
          data: originalContent,
          success: () => {
            wx.showToast({
              title: "内容已复制到剪贴板",
              icon: "success",
            });
          },
          fail: () => {
            wx.showToast({
              title: "复制失败",
              icon: "none",
            });
          },
        });
      } catch (error) {
        console.error("解码内容失败:", error);
        wx.showToast({
          title: "复制失败",
          icon: "none",
        });
      }
    } else {
      wx.showToast({
        title: "没有原始内容可复制",
        icon: "none",
      });
    }
  },

  // 分享功能
  onShareAppMessage: function () {
    return {
      title: "文章预览",
      path: "/pages/article-preview/article-preview",
    };
  },
});
