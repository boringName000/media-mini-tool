// pages/layout-tool/layout-tool.js
const timeUtils = require("../../utils/timeUtils.js");

Page({
  data: {
    // 文件管理相关
    downloadedFiles: [],
  },

  onLoad: function (options) {
    console.log("排版工具页面加载");
    // 页面加载时自动获取已下载的文件列表
    this.loadDownloadedFiles();
  },

  onShow: function () {
    // 页面显示时刷新文件列表
    this.loadDownloadedFiles();
  },

  // 加载已下载的文件列表
  loadDownloadedFiles: function () {
    console.log("=== 加载已下载的文件列表 ===");

    const fs = wx.getFileSystemManager();
    const downloadsPath = `${wx.env.USER_DATA_PATH}/downloads`;

    try {
      // 检查 downloads 目录是否存在
      fs.accessSync(downloadsPath);
    } catch (e) {
      console.log("downloads 目录不存在，创建目录");
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
        console.log("读取目录成功:", res.files);

        const files = res.files
          .filter((file) => file.endsWith(".txt") || file.endsWith(".html"))
          .map((file) => {
            const filePath = `${downloadsPath}/${file}`;
            const stats = fs.statSync(filePath);
            // 使用更可靠的时间属性，优先使用修改时间
            const fileTime =
              stats.lastModifiedTime || stats.lastAccessedTime || Date.now();
            return {
              name: file,
              path: filePath,
              size: this.formatFileSize(stats.size),
              time: timeUtils.formatTime(fileTime, "YYYY-MM-DD HH:mm", {
                defaultValue: "未知时间",
              }),
            };
          })
          .sort((a, b) => new Date(b.time) - new Date(a.time)); // 按时间倒序排列

        this.setData({
          downloadedFiles: files,
        });

        console.log("文件列表已更新:", files);
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
    console.log("=== 读取文件内容并跳转预览 ===", file);

    if (!file || !file.path) {
      wx.showToast({
        title: "文件信息无效",
        icon: "none",
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
        console.log("文件读取成功，内容长度:", res.data.length);
        wx.hideLoading();

        // 跳转到文章预览页面，传递文件路径
        this.goToArticlePreviewWithFile(file);
      },
      fail: (err) => {
        console.error("文件读取失败:", err);
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
        success: () => {
          console.log("跳转到文章预览页面成功");
        },
        fail: (error) => {
          console.error("跳转到文章预览页面失败:", error);
          wx.showToast({
            title: "页面跳转失败",
            icon: "none",
          });
        },
      });
    } catch (error) {
      console.error("准备跳转参数失败:", error);
      wx.showToast({
        title: "参数准备失败",
        icon: "none",
      });
    }
  },

  // 删除文件
  deleteFile: function (e) {
    const file = e.currentTarget.dataset.file;
    console.log("=== 删除文件 ===", file);

    if (!file || !file.path) {
      wx.showToast({
        title: "文件信息无效",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: `确定要删除文件 "${file.name}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          const fs = wx.getFileSystemManager();

          fs.unlink({
            filePath: file.path,
            success: () => {
              console.log("文件删除成功");
              wx.showToast({
                title: "文件已删除",
                icon: "success",
              });

              // 刷新文件列表
              this.loadDownloadedFiles();
            },
            fail: (err) => {
              console.error("文件删除失败:", err);
              wx.showToast({
                title: "删除失败",
                icon: "none",
              });
            },
          });
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
            // 读取目录下的所有文件
            const files = fs.readdirSync(downloadsPath);
            let deletedCount = 0;

            files.forEach((file) => {
              if (file.endsWith(".txt") || file.endsWith(".html")) {
                try {
                  fs.unlinkSync(`${downloadsPath}/${file}`);
                  deletedCount++;
                } catch (err) {
                  console.error(`删除文件 ${file} 失败:`, err);
                }
              }
            });

            // 刷新文件列表
            this.loadDownloadedFiles();

            wx.showToast({
              title: `已删除 ${deletedCount} 个文件`,
              icon: "success",
            });
          } catch (err) {
            console.error("清空文件失败:", err);
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
