// pages/test-db/test-db.js
Page({
  data: {
    userName: "",
    verifyCode: "",
    deleteCode: "",
    result: null,
    invitationResult: null,
    verifyResult: null,
    deleteResult: null,
  },

  // 输入用户名
  onNameInput(e) {
    this.setData({
      userName: e.detail.value,
    });
  },

  // 输入验证邀请码
  onVerifyCodeInput(e) {
    this.setData({
      verifyCode: e.detail.value,
    });
  },

  // 输入删除邀请码
  onDeleteCodeInput(e) {
    this.setData({
      deleteCode: e.detail.value,
    });
  },

  // 调用云函数添加数据
  async addUserData() {
    if (!this.data.userName.trim()) {
      wx.showToast({
        title: "请输入用户名",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "添加数据中...",
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "test",
        data: {
          name: this.data.userName,
        },
      });

      console.log("云函数调用结果：", result);

      if (result.result.success) {
        wx.showToast({
          title: "数据添加成功",
          icon: "success",
        });

        this.setData({
          result: result.result,
        });
      } else {
        wx.showToast({
          title: "数据添加失败",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("调用云函数失败：", error);
      wx.showToast({
        title: "调用失败",
        icon: "error",
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 创建邀请码
  async createInvitationCode() {
    wx.showLoading({
      title: "创建邀请码中...",
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "create-invitation-code",
        data: {},
      });

      console.log("邀请码创建结果：", result);

      if (result.result.success) {
        wx.showToast({
          title: "邀请码创建成功",
          icon: "success",
        });

        this.setData({
          invitationResult: result.result,
        });
      } else {
        wx.showToast({
          title: result.result.error || "邀请码创建失败",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("调用邀请码创建云函数失败：", error);
      wx.showToast({
        title: "调用失败",
        icon: "error",
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 验证邀请码
  async verifyInvitationCode() {
    if (!this.data.verifyCode.trim()) {
      wx.showToast({
        title: "请输入邀请码",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "验证邀请码中...",
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "verify-invitation-code",
        data: {
          invitationCode: this.data.verifyCode,
        },
      });

      console.log("邀请码验证结果：", result);

      if (result.result.success) {
        wx.showToast({
          title: "邀请码有效",
          icon: "success",
        });

        this.setData({
          verifyResult: result.result,
        });
      } else {
        wx.showToast({
          title: result.result.error || "邀请码验证失败",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("调用邀请码验证云函数失败：", error);
      wx.showToast({
        title: "调用失败",
        icon: "error",
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 删除邀请码
  async deleteInvitationCode() {
    if (!this.data.deleteCode.trim()) {
      wx.showToast({
        title: "请输入邀请码",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: `确定要删除邀请码 "${this.data.deleteCode}" 吗？`,
      confirmText: "确认删除",
      cancelText: "取消",
      confirmColor: "#ff4d4f",
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: "删除邀请码中...",
          });

          try {
            const result = await wx.cloud.callFunction({
              name: "delete-invitation-code",
              data: {
                invitationCode: this.data.deleteCode,
              },
            });

            console.log("邀请码删除结果：", result);

            if (result.result.success) {
              wx.showToast({
                title: "邀请码删除成功",
                icon: "success",
              });

              this.setData({
                deleteResult: result.result,
              });
            } else {
              wx.showToast({
                title: result.result.error || "邀请码删除失败",
                icon: "error",
              });
            }
          } catch (error) {
            console.error("调用邀请码删除云函数失败：", error);
            wx.showToast({
              title: "调用失败",
              icon: "error",
            });
          } finally {
            wx.hideLoading();
          }
        }
      },
    });
  },

  // 清空结果
  clearResult() {
    this.setData({
      result: null,
      invitationResult: null,
      verifyResult: null,
      deleteResult: null,
      userName: "",
      verifyCode: "",
      deleteCode: "",
    });
  },
});
