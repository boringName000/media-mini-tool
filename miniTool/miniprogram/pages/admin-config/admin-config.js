// 引入工具函数
const { getTrackTypeList } = require("../../utils/trackTypeUtils");
const { getPlatformList } = require("../../utils/platformUtils");

Page({
  data: {
    // 赛道类型选项
    trackTypeOptions: [],
    selectedTrackType: null,
    selectedTrackTypeLabel: "请选择赛道类型",

    // 平台类型选项
    platformOptions: [],
    selectedPlatform: null,
    selectedPlatformLabel: "请选择平台类型",

    // 上传文件相关
    uploadedFiles: [],
    isUploading: false,

    // 预览信息
    previewInfo: {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: [],
    },
  },

  onLoad: function (options) {
    this.initTrackTypeOptions();
    this.initPlatformOptions();
  },

  // 初始化赛道类型选项
  initTrackTypeOptions: function () {
    const trackTypeList = getTrackTypeList();
    const options = trackTypeList.map((item) => ({
      value: item.type,
      label: item.name,
      icon: item.icon,
    }));

    this.setData({
      trackTypeOptions: options,
    });
  },

  // 初始化平台类型选项
  initPlatformOptions: function () {
    const platformList = getPlatformList();
    const options = platformList.map((item) => ({
      value: item.type,
      label: item.name,
      icon: item.icon,
    }));

    this.setData({
      platformOptions: options,
    });
  },

  // 选择赛道类型
  onTrackTypeChange: function (e) {
    const index = parseInt(e.detail.value);
    const selectedOption = this.data.trackTypeOptions[index];
    this.setData({
      selectedTrackType: selectedOption.value,
      selectedTrackTypeLabel: selectedOption.label,
    });
  },

  // 选择平台类型
  onPlatformChange: function (e) {
    const index = parseInt(e.detail.value);
    const selectedOption = this.data.platformOptions[index];
    this.setData({
      selectedPlatform: selectedOption.value,
      selectedPlatformLabel: selectedOption.label,
    });
  },

  // 上传文章文件
  onUploadFiles: function () {
    // 检查是否选择了赛道和平台
    if (!this.data.selectedTrackType) {
      wx.showToast({
        title: "请选择赛道类型",
        icon: "none",
      });
      return;
    }

    if (!this.data.selectedPlatform) {
      wx.showToast({
        title: "请选择平台类型",
        icon: "none",
      });
      return;
    }

    const that = this;
    wx.chooseMessageFile({
      count: 10, // 最多选择10个文件
      type: "file",
      success: function (res) {
        console.log("选择文件成功:", res);

        // 过滤只允许txt文件
        const txtFiles = res.tempFiles.filter((file) => {
          const fileName = file.name.toLowerCase();
          return fileName.endsWith(".txt");
        });

        if (txtFiles.length === 0) {
          wx.showToast({
            title: "请选择txt文件",
            icon: "none",
          });
          return;
        }

        if (txtFiles.length < res.tempFiles.length) {
          wx.showToast({
            title: `已过滤非txt文件，共选择${txtFiles.length}个txt文件`,
            icon: "none",
            duration: 2000,
          });
        }

        that.processSelectedFiles(txtFiles);
      },
      fail: function (err) {
        console.error("选择文件失败:", err);
        wx.showToast({
          title: "选择文件失败",
          icon: "none",
        });
      },
    });
  },

  // 处理选择的文件
  processSelectedFiles: function (tempFiles) {
    const files = tempFiles.map((file) => ({
      name: file.name,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      path: file.path,
      type: this.getFileType(file.name),
      uploadStatus: "pending", // pending, uploading, success, failed
      statusText: "待确认",
    }));

    const currentFiles = this.data.uploadedFiles;
    const newFiles = [...currentFiles, ...files];

    this.setData({
      uploadedFiles: newFiles,
      isUploading: false, // 不立即开始上传
    });

    this.updatePreviewInfo();
  },

  // 获取文件类型
  getFileType: function (fileName) {
    const extension = fileName.split(".").pop().toLowerCase();
    if (extension === "txt") {
      return "文本文件";
    }
    return "不支持的文件类型";
  },

  // 上传文件到云存储
  uploadFiles: function (files, startIndex) {
    const that = this;
    let uploadedCount = 0;
    let failedCount = 0;

    files.forEach((file, index) => {
      // 使用赛道类型枚举值（数字）
      const trackTypeValue = this.data.selectedTrackType;
      const timestamp = Date.now();

      // 分离文件名和扩展名
      const lastDotIndex = file.name.lastIndexOf(".");
      const fileName =
        lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
      const fileExtension =
        lastDotIndex > 0 ? file.name.substring(lastDotIndex) : "";

      const cloudPath = `article/${trackTypeValue}/${fileName}-${timestamp}${fileExtension}`;

      // 更新文件状态为上传中
      that.updateFileStatus(startIndex + index, "uploading");

      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: file.path,
        success: function (res) {
          console.log("文件上传成功:", res);
          that.updateFileStatus(startIndex + index, "success", res.fileID);
          uploadedCount++;
        },
        fail: function (err) {
          console.error("文件上传失败:", err);
          that.updateFileStatus(startIndex + index, "failed", null, err.errMsg);
          failedCount++;
        },
        complete: function () {
          // 检查是否所有文件都处理完成
          if (uploadedCount + failedCount === files.length) {
            that.setData({
              isUploading: false,
            });

            // 显示上传结果
            if (failedCount === 0) {
              wx.showToast({
                title: `成功上传 ${uploadedCount} 个文件`,
                icon: "success",
              });
            } else {
              wx.showToast({
                title: `上传完成，成功 ${uploadedCount} 个，失败 ${failedCount} 个`,
                icon: "none",
              });
            }
          }
        },
      });
    });
  },

  // 更新文件状态
  updateFileStatus: function (
    fileIndex,
    status,
    fileID = null,
    errorMsg = null
  ) {
    const files = this.data.uploadedFiles;
    const file = files[fileIndex];

    if (file) {
      file.uploadStatus = status;

      // 更新状态文本
      const statusTextMap = {
        pending: "待确认",
        uploading: "上传中",
        success: "上传成功",
        failed: "上传失败",
      };
      file.statusText = statusTextMap[status] || "未知状态";

      if (fileID) file.cloudFileID = fileID;
      if (errorMsg) file.errorMsg = errorMsg;

      this.setData({
        uploadedFiles: files,
      });
    }
  },

  // 更新预览信息
  updatePreviewInfo: function () {
    const files = this.data.uploadedFiles;
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileTypes = [...new Set(files.map((file) => file.type))];

    this.setData({
      previewInfo: {
        totalFiles: totalFiles,
        totalSize: totalSize,
        totalSizeFormatted: this.formatFileSize(totalSize),
        fileTypes: fileTypes,
        fileTypesText: fileTypes.join(", "),
      },
    });
  },

  // 删除文件
  onDeleteFile: function (e) {
    const index = e.currentTarget.dataset.index;
    const files = this.data.uploadedFiles;

    files.splice(index, 1);

    this.setData({
      uploadedFiles: files,
    });

    this.updatePreviewInfo();
  },

  // 清空所有文件
  onClearAllFiles: function () {
    wx.showModal({
      title: "确认清空",
      content: "确定要清空所有已选择的文件吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            uploadedFiles: [],
          });
          this.updatePreviewInfo();
        }
      },
    });
  },

  // 确认上传文件
  onConfirmUpload: function () {
    // 检查是否有待上传的文件
    const pendingFiles = this.data.uploadedFiles.filter(
      (file) => file.uploadStatus === "pending"
    );

    if (pendingFiles.length === 0) {
      wx.showToast({
        title: "没有待上传的文件",
        icon: "none",
      });
      return;
    }

    // 检查是否选择了赛道和平台
    if (!this.data.selectedTrackType) {
      wx.showToast({
        title: "请选择赛道类型",
        icon: "none",
      });
      return;
    }

    if (!this.data.selectedPlatform) {
      wx.showToast({
        title: "请选择平台类型",
        icon: "none",
      });
      return;
    }

    // 开始上传
    this.setData({
      isUploading: true,
    });

    this.uploadFiles(pendingFiles, 0);
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
