// WebView测试页面 - 文件预览功能
const timeUtils = require("../../utils/timeUtils.js");
const {
  cleanupOrphanedFiles,
  readArticleMetadata,
  deleteArticleFilePair,
  deleteArticleFilePairs,
} = require("../../utils/articleDownloadUtils.js");

Page({
  data: {
    // 默认域名
    defaultDomain: "cloud1-5g6ik91va74262bb-1367027189.tcloudbaseapp.com",
    // 控制WebView显示
    showWebView: false,
    // WebView的URL
    webViewUrl: "",
    // 当前预览的文件名
    currentFileName: "",
    // 文件管理相关
    downloadedFiles: [],
  },

  onLoad: function (options) {
    console.log("WebView测试页面加载");
    // 页面加载时自动获取已下载的文件列表
    this.loadDownloadedFiles();
  },

  onShow: function () {
    // 页面显示时刷新文件列表
    this.loadDownloadedFiles();
  },

  // 加载已下载的文件列表
  loadDownloadedFiles: function () {
    console.log("加载本地文件列表");

    const fs = wx.getFileSystemManager();
    const downloadsPath = `${wx.env.USER_DATA_PATH}/downloads`;

    try {
      // 检查 downloads 目录是否存在
      fs.accessSync(downloadsPath);
    } catch (e) {
      try {
        fs.mkdirSync(downloadsPath, true);
      } catch (mkdirErr) {
        console.error("创建 downloads 目录失败:", mkdirErr);
        this.setData({
          downloadedFiles: [],
        });
        return;
      }
    }

    // 读取 downloads 目录下的所有文件
    fs.readdir({
      dirPath: downloadsPath,
      success: (res) => {
        const files = res.files
          .filter((file) => {
            // 只显示主文件，排除元数据文件
            return (
              (file.endsWith(".txt") || file.endsWith(".html")) &&
              !file.endsWith(".meta.json")
            );
          })
          .map((file) => {
            const filePath = `${downloadsPath}/${file}`;

            const stats = fs.statSync(filePath);
            // 使用更可靠的时间属性，优先使用修改时间
            const fileTime =
              stats.lastModifiedTime || stats.lastAccessedTime || Date.now();

            // 尝试从元数据文件获取文章标题与下载时间
            let displayName = file;
            let articleTitle = "未知文章";
            let metadata = null;
            let effectiveTimestamp = fileTime;

            try {
              if (stats.size > 0) {
                // 使用工具函数读取元数据
                const metadata = readArticleMetadata(filePath);

                if (metadata) {
                  if (metadata.originalTitle) {
                    articleTitle = metadata.originalTitle;
                    displayName = metadata.originalTitle;
                  }
                  if (
                    metadata.downloadTime &&
                    typeof metadata.downloadTime === "number"
                  ) {
                    effectiveTimestamp = metadata.downloadTime;
                  }
                }
              }
            } catch (metaError) {
              console.error(`处理元数据时发生错误: ${file}`, metaError);
            }

            // 添加详细的文件信息
            const fileInfo = {
              name: file, // 实际文件名（唯一ID）
              displayName: displayName, // UI显示名称（文章标题）
              path: filePath,
              size: this.formatFileSize(stats.size),
              rawSize: stats.size, // 原始字节数
              // 排序使用下载时间戳（若有），否则文件修改时间
              timestamp: effectiveTimestamp,
              time: timeUtils.formatTime(
                effectiveTimestamp,
                "YYYY-MM-DD HH:mm",
                {
                  defaultValue: "未知时间",
                }
              ),
              lastModified: stats.lastModifiedTime,
              lastAccessed: stats.lastAccessedTime,
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
              isEmpty: stats.size === 0, // 标记是否为空文件
            };

            return fileInfo;
          })
          .sort((a, b) => b.timestamp - a.timestamp); // 按时间戳倒序排列

        this.setData({
          downloadedFiles: files,
        });
      },
      fail: (err) => {
        console.error("读取目录失败:", err);
        this.setData({
          downloadedFiles: [],
        });
      },
    });
  },

  // 在WebView中预览文件
  previewFileInWebView: function (e) {
    const file = e.currentTarget.dataset.file;

    if (!file || !file.path) {
      wx.showToast({
        title: "文件信息无效",
        icon: "none",
      });
      return;
    }

    // 检查是否为空文件
    if (file.isEmpty) {
      wx.showModal({
        title: "文件为空",
        content: `文件 "${file.name}" 大小为0字节，无法预览。\n\n可能的原因：\n• 文件下载不完整\n• 文件保存时出错\n• 文件被损坏`,
        showCancel: false,
        confirmText: "知道了",
      });
      return;
    }

    wx.showLoading({
      title: "获取下载地址...",
    });

    // 尝试从元数据获取原始文件ID
    try {
      const metadata = readArticleMetadata(file.path);
      if (metadata && metadata.originalFileId) {
        console.log("✅ 找到原始文件ID:", metadata.originalFileId);

        // 获取临时下载URL
        wx.cloud.getTempFileURL({
          fileList: [metadata.originalFileId],
          success: (res) => {
            wx.hideLoading();

            if (res.fileList && res.fileList.length > 0) {
              const fileInfo = res.fileList[0];
              if (fileInfo.status === 0 && fileInfo.tempFileURL) {
                console.log("✅ 获取到临时下载URL:", fileInfo.tempFileURL);

                // 打开WebView并传递临时URL
                this.openWebViewWithTempUrl(file, fileInfo.tempFileURL);
              } else {
                console.error(
                  "❌ 获取临时URL失败:",
                  fileInfo.status,
                  fileInfo.errMsg
                );
                wx.showToast({
                  title: "获取下载地址失败",
                  icon: "none",
                });
              }
            } else {
              wx.showToast({
                title: "获取下载地址失败",
                icon: "none",
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error("获取临时URL失败:", err);
            wx.showToast({
              title: "获取下载地址失败",
              icon: "none",
            });
          },
        });
      } else {
        wx.hideLoading();
        console.log("❌ 未找到原始文件ID，无法预览");
        wx.showToast({
          title: "无法预览：缺少文件信息",
          icon: "none",
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error("处理文件预览失败:", error);
      wx.showToast({
        title: "处理失败",
        icon: "none",
      });
    }
  },

  // 打开WebView并传递临时下载URL
  openWebViewWithTempUrl: function (file, tempFileURL) {
    try {
      // 构建WebView URL，包含临时下载URL作为参数
      const url = `https://${
        this.data.defaultDomain
      }/miniWeb/index.html?tempUrl=${encodeURIComponent(
        tempFileURL
      )}&fileName=${encodeURIComponent(file.displayName || file.name)}`;

      this.setData({
        webViewUrl: url,
        showWebView: true,
        currentFileName: file.displayName || file.name,
      });

      console.log("✅ WebView已打开，临时下载URL已通过URL参数传递");
      console.log("📝 WebView页面将自动下载并显示文件内容");
      console.log("🔗 临时URL:", tempFileURL);
    } catch (error) {
      console.error("打开WebView失败:", error);
      wx.showToast({
        title: "打开WebView失败",
        icon: "none",
      });
    }
  },

  // 打开WebView（普通模式）
  openWebView: function () {
    console.log("=== 打开WebView ===");

    const url = `https://${this.data.defaultDomain}/miniWeb/index.html#converter`;

    this.setData({
      webViewUrl: url,
      showWebView: true,
      currentFileName: "WebView测试",
    });
  },

  // 关闭WebView
  closeWebView: function () {
    this.setData({
      showWebView: false,
      webViewUrl: "",
      currentFileName: "",
    });
  },

  // 删除文件
  deleteFile: function (e) {
    const file = e.currentTarget.dataset.file;

    if (!file || !file.path) {
      wx.showToast({
        title: "文件信息无效",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: `确定要删除文章 "${file.displayName || file.name}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          const fs = wx.getFileSystemManager();

          // 使用工具函数删除文件对
          const result = deleteArticleFilePair(file.path);

          if (result.articleDeleted) {
            console.log("✅ 文件删除成功");

            // 静默清理可能产生的孤立文件
            const downloadsPath = `${wx.env.USER_DATA_PATH}/downloads`;
            const orphanedCount = cleanupOrphanedFiles(downloadsPath);
            if (orphanedCount > 0) {
              console.log(
                `🔧 删除文件后自动清理了 ${orphanedCount} 个孤立文件`
              );
            }

            wx.showToast({
              title: "文件已删除",
              icon: "success",
            });

            // 刷新文件列表
            this.loadDownloadedFiles();
          } else {
            wx.showToast({
              title: "删除失败",
              icon: "none",
            });
          }
        }
      },
    });
  },

  // 清空所有文件
  clearAllFiles: function () {
    wx.showModal({
      title: "确认清空",
      content: "确定要删除所有下载的文件吗？此操作不可恢复。",
      success: (res) => {
        if (res.confirm) {
          const fs = wx.getFileSystemManager();
          const downloadsPath = `${wx.env.USER_DATA_PATH}/downloads`;

          try {
            console.log("🧹 开始清空所有文件操作");

            // 静默清理孤立文件
            const orphanedCount = cleanupOrphanedFiles(downloadsPath);
            if (orphanedCount > 0) {
              console.log(`🔧 清空前自动清理了 ${orphanedCount} 个孤立文件`);
            }

            // 读取目录下的所有文件
            const files = fs.readdirSync(downloadsPath);
            let deletedCount = 0;
            let deletedMetaCount = 0;

            // 收集需要删除的文章文件路径
            const articleFiles = files.filter(
              (file) => file.endsWith(".txt") || file.endsWith(".html")
            );
            const articlePaths = articleFiles.map(
              (file) => `${downloadsPath}/${file}`
            );

            console.log(`📂 发现 ${articleFiles.length} 个文章文件，开始删除`);

            // 使用工具函数批量删除文章文件对
            const deleteStats = deleteArticleFilePairs(articlePaths, {
              silent: false,
            });
            deletedCount = deleteStats.success;
            deletedMetaCount = deleteStats.total; // 每个文章文件对应一个元数据文件

            // 刷新文件列表
            this.loadDownloadedFiles();

            const totalDeleted = deletedCount + deletedMetaCount;
            console.log(
              `✅ 清空文件操作完成！共删除 ${deletedCount} 个主文件和 ${deletedMetaCount} 个元数据文件，总计 ${totalDeleted} 个文件`
            );
            wx.showToast({
              title: `已删除 ${totalDeleted} 个文件`,
              icon: "success",
            });
          } catch (err) {
            console.error("❌ 清空文件失败:", err);
            wx.showToast({
              title: "清空失败",
              icon: "none",
            });
          }
        }
      },
    });
  },

  // 格式化文件大小
  formatFileSize: function (bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
});
