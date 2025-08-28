// 文件下载测试页面
Page({
  data: {
    // 文件下载相关
    downloadStatus: "",
    downloadedFiles: [],
    // 测试文件地址
    testFileUrl:
      "cloud://cloud1-5g6ik91va74262bb.636c-cloud1-5g6ik91va74262bb-1367027189/article/1/1/前_1-1756294175589.txt",
    // 文件预览相关
    currentFile: null,
    fileContent: "",
  },

  onLoad: function (options) {
    console.log("文件下载测试页面加载");
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

        // 保存成功后，询问用户是否打开文件
        setTimeout(() => {
          wx.showModal({
            title: "文件下载成功",
            content: "文件已下载到本地，是否立即打开查看？",
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.openSavedFile(savedFilePath, fileName);
              }
            },
          });
        }, 1000);
      },
      fail: (err) => {
        console.error("保存文件失败:", err);

        this.setData({
          downloadStatus: "保存失败: " + err.errMsg,
        });

        // 如果保存失败，尝试直接打开临时文件
        wx.showModal({
          title: "下载失败",
          content: "无法保存到本地，是否直接打开文件？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.openTempFile(tempFilePath, fileName);
            }
          },
        });
      },
    });
  },

  // 打开已保存的文件
  openSavedFile: function (savedFilePath, fileName) {
    wx.openDocument({
      filePath: savedFilePath,
      fileType: "txt",
      success: () => {
        console.log("文件打开成功");
      },
      fail: (err) => {
        console.error("打开保存的文件失败:", err);
        wx.showToast({
          title: "文件已保存，但无法打开",
          icon: "none",
        });
      },
    });
  },

  // 打开临时文件
  openTempFile: function (tempFilePath, fileName) {
    wx.openDocument({
      filePath: tempFilePath,
      fileType: "txt",
      success: () => {
        console.log("临时文件打开成功");
      },
      fail: (err) => {
        console.error("打开临时文件失败:", err);
        wx.showToast({
          title: "无法打开文件",
          icon: "none",
        });
      },
    });
  },

  // 查看下载的文件列表
  viewDownloadedFiles: function () {
    console.log("=== 查看下载的文件列表 ===");

    this.setData({
      downloadStatus: "正在获取文件列表...",
    });

    const fs = wx.getFileSystemManager();
    const downloadsPath = `${wx.env.USER_DATA_PATH}/downloads`;

    try {
      // 读取 downloads 目录
      const files = fs.readdirSync(downloadsPath);
      console.log("downloads 目录文件列表:", files);

      const fileList = [];

      // 获取每个文件的详细信息
      files.forEach((fileName) => {
        try {
          const filePath = `${downloadsPath}/${fileName}`;
          const stats = fs.statSync(filePath);

          fileList.push({
            name: fileName,
            size: this.formatFileSize(stats.size),
            time: this.formatTime(stats.lastAccessedTime),
            path: filePath,
          });
        } catch (e) {
          console.error("获取文件信息失败:", fileName, e);
        }
      });

      // 按时间倒序排列
      fileList.sort((a, b) => new Date(b.time) - new Date(a.time));

      this.setData({
        downloadedFiles: fileList,
        downloadStatus: `找到 ${fileList.length} 个文件`,
      });

      console.log("文件列表:", fileList);
    } catch (err) {
      console.error("读取文件列表失败:", err);

      this.setData({
        downloadStatus: "读取文件列表失败: " + err.errMsg,
        downloadedFiles: [],
      });

      wx.showToast({
        title: "读取文件列表失败",
        icon: "none",
      });
    }
  },

  // 格式化文件大小
  formatFileSize: function (bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // 格式化时间
  formatTime: function (timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  },

  // 读取文件内容
  readFileContent: function (e) {
    const file = e.currentTarget.dataset.file;
    console.log("=== 读取文件内容 ===", file);

    if (!file || !file.path) {
      wx.showToast({
        title: "文件路径无效",
        icon: "none",
      });
      return;
    }

    // 显示加载状态
    wx.showLoading({
      title: "读取文件中...",
    });

    const fs = wx.getFileSystemManager();

    // 读取文件内容
    fs.readFile({
      filePath: file.path,
      encoding: "utf8",
      success: (res) => {
        console.log("文件读取成功:", res);
        wx.hideLoading();

        // 显示全部内容，不进行截断
        const content = res.data;

        this.setData({
          currentFile: file,
          fileContent: content,
        });

        wx.showToast({
          title: "文件读取成功",
          icon: "success",
          duration: 1500,
        });
      },
      fail: (err) => {
        console.error("文件读取失败:", err);
        wx.hideLoading();

        // 尝试使用其他编码方式读取
        this.tryReadFileWithDifferentEncoding(file.path, file);
      },
    });
  },

  // 尝试使用不同编码方式读取文件
  tryReadFileWithDifferentEncoding: function (filePath, file) {
    console.log("尝试使用不同编码方式读取文件");

    const fs = wx.getFileSystemManager();

    // 尝试使用 base64 编码读取
    fs.readFile({
      filePath: filePath,
      encoding: "base64",
      success: (res) => {
        console.log("base64 读取成功");

        // 将 base64 转换为文本
        try {
          const content = wx.arrayBufferToBase64(res.data);
          const textContent = this.base64ToText(content);

          // 显示全部内容，不进行截断
          const displayContent = textContent;

          this.setData({
            currentFile: file,
            fileContent: displayContent,
          });

          wx.showToast({
            title: "文件读取成功",
            icon: "success",
            duration: 1500,
          });
        } catch (e) {
          console.error("base64 转换失败:", e);
          this.showReadError(file);
        }
      },
      fail: (err) => {
        console.error("base64 读取也失败:", err);
        this.showReadError(file);
      },
    });
  },

  // base64 转文本
  base64ToText: function (base64String) {
    try {
      // 简单的 base64 解码
      const binaryString = atob(base64String);
      let result = "";
      for (let i = 0; i < binaryString.length; i++) {
        result += String.fromCharCode(binaryString.charCodeAt(i));
      }
      return result;
    } catch (e) {
      console.error("base64 解码失败:", e);
      return "无法解码文件内容";
    }
  },

  // 显示读取错误
  showReadError: function (file) {
    this.setData({
      currentFile: file,
      fileContent: "无法读取文件内容，可能是文件格式不支持或文件损坏。",
    });

    wx.showToast({
      title: "文件读取失败",
      icon: "none",
      duration: 2000,
    });
  },

  // 跳转到文章预览页面
  goToArticlePreview: function () {
    if (!this.data.fileContent) {
      wx.showToast({
        title: "文件内容为空",
        icon: "none",
      });
      return;
    }

    try {
      // 对内容进行URL编码，避免参数过长或特殊字符问题
      const encodedContent = encodeURIComponent(this.data.fileContent);

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
});
