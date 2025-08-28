// pages/layout-tool/layout-tool.js
const timeUtils = require("../../utils/timeUtils.js");

Page({
  data: {
    // 文件下载相关
    downloadStatus: "",
    downloadedFiles: [],
    // 测试文件地址
    testFileUrl:
      "cloud://cloud1-5g6ik91va74262bb.636c-cloud1-5g6ik91va74262bb-1367027189/article/1/1/前_1-1756294175589.txt",
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

  // 下载测试文件
  downloadTestFile: function () {
    console.log("=== 开始下载测试文件 ===");

    this.setData({
      downloadStatus: "开始下载...",
    });

    wx.showLoading({
      title: "下载中...",
    });

    // 使用云存储下载文件
    wx.cloud.downloadFile({
      fileID: this.data.testFileUrl,
      success: (res) => {
        console.log("云存储下载成功:", res);
        wx.hideLoading();

        // 保存文件到本地
        this.saveFileToLocal(res.tempFilePath, "测试文档");
      },
      fail: (err) => {
        console.error("云存储下载失败:", err);
        wx.hideLoading();

        this.setData({
          downloadStatus: "下载失败: " + err.errMsg,
        });

        wx.showToast({
          title: "下载失败",
          icon: "none",
        });
      },
    });
  },

  // 保存文件到本地
  saveFileToLocal: function (tempFilePath, fileName) {
    console.log("=== 保存文件到本地 ===");

    this.setData({
      downloadStatus: "保存文件中...",
    });

    // 生成保存的文件名
    const savedFileName = `${fileName}_${Date.now()}.txt`;

    // 构建完整的保存路径
    const savedFilePath = `${wx.env.USER_DATA_PATH}/downloads/${savedFileName}`;

    // 使用文件系统管理器保存文件到本地
    const fs = wx.getFileSystemManager();

    // 先确保 downloads 目录存在
    try {
      fs.mkdirSync(`${wx.env.USER_DATA_PATH}/downloads`, true);
    } catch (e) {
      console.log("downloads 目录已存在或创建失败:", e);
    }

    // 使用新的文件系统 API 保存文件
    fs.saveFile({
      tempFilePath: tempFilePath,
      filePath: savedFilePath,
      success: (res) => {
        console.log("文件保存成功:", savedFilePath);

        this.setData({
          downloadStatus: "文件已保存到本地",
        });

        wx.showToast({
          title: "文件已下载到本地",
          icon: "success",
          duration: 2000,
        });

        // 保存成功后刷新文件列表
        this.loadDownloadedFiles();
      },
      fail: (err) => {
        console.error("文件保存失败:", err);
        this.setData({
          downloadStatus: "文件保存失败: " + err.errMsg,
        });

        wx.showToast({
          title: "文件保存失败",
          icon: "none",
        });
      },
    });
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

        // 直接跳转到文章预览页面
        this.goToArticlePreviewWithContent(res.data);
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

  // 跳转到文章预览页面（使用传入的内容）
  goToArticlePreviewWithContent: function (content) {
    if (!content) {
      wx.showToast({
        title: "文件内容为空",
        icon: "none",
      });
      return;
    }

    try {
      // 对内容进行URL编码，避免参数过长或特殊字符问题
      const encodedContent = encodeURIComponent(content);

      // 跳转到文章预览页面
      wx.navigateTo({
        url: `/pages/article-preview/article-preview?content=${encodedContent}`,
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
