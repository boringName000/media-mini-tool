// pages/layout-tool/layout-tool.js
const timeUtils = require("../../utils/timeUtils.js");
const {
  cleanupOrphanedFiles,
  readArticleMetadata,
  deleteArticleFilePair,
  deleteArticleFilePairs,
} = require("../../utils/articleDownloadUtils.js");

Page({
  data: {
    // 文件管理相关
    downloadedFiles: [],
  },

  onLoad: function (options) {
    // 页面加载
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

  // 读取文件内容并跳转到预览页面
  readFileContent: function (e) {
    const file = e.currentTarget.dataset.file;
    // 读取文件并跳转预览

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
      title: "读取中...",
    });

    const fs = wx.getFileSystemManager();

    fs.readFile({
      filePath: file.path,
      encoding: "utf8",
      success: (res) => {
        // 检查内容是否为空
        if (res.data.length === 0) {
          console.error("⚠️ 警告：文件内容为空！");
        }

        wx.hideLoading();

        // 跳转到文章预览页面，传递文件路径
        this.goToArticlePreviewWithFile(file);
      },
      fail: (err) => {
        console.error("文件读取失败");
        console.error("错误信息:", err);
        console.error("错误详情:", err.errMsg);
        wx.hideLoading();

        wx.showToast({
          title: "文件读取失败",
          icon: "none",
        });
      },
    });
  },

  // 跳转到文章预览页面（使用文件路径）
  goToArticlePreviewWithFile: function (file) {
    if (!file || !file.path) {
      wx.showToast({
        title: "文件信息无效",
        icon: "none",
      });
      return;
    }

    try {
      // 对文件路径进行URL编码
      const encodedPath = encodeURIComponent(file.path);
      const encodedName = encodeURIComponent(file.name);

      // 跳转到文章预览页面，传递文件路径和名称
      wx.navigateTo({
        url: `/pages/article-preview/article-preview?filePath=${encodedPath}&fileName=${encodedName}`,
        success: () => {},
        fail: (error) => {
          console.error("页面跳转失败:", error);
          wx.showToast({
            title: "页面跳转失败",
            icon: "none",
          });
        },
      });
    } catch (error) {
      console.error("参数准备失败:", error);
      wx.showToast({
        title: "参数准备失败",
        icon: "none",
      });
    }
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
