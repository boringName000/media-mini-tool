// 用户信息工具函数
const userInfoUtils = {
  // 获取当前用户信息
  getCurrentUserInfo: async function () {
    try {
      const res = await wx.cloud.callFunction({
        name: "get-user-info",
        data: {}, // 不传 openid，默认获取当前用户信息
      });

      if (res && res.result && res.result.success) {
        return {
          success: true,
          userInfo: res.result.userInfo,
          queryContext: res.result.queryContext,
        };
      } else {
        return {
          success: false,
          error: res.result.error || "获取用户信息失败",
        };
      }
    } catch (error) {
      console.error("调用获取用户信息云函数失败：", error);
      return {
        success: false,
        error: error.message || "网络错误",
      };
    }
  },

  // 根据 openid 获取指定用户信息
  getUserInfoByOpenId: async function (openid) {
    try {
      const res = await wx.cloud.callFunction({
        name: "get-user-info",
        data: { openid: openid },
      });

      if (res && res.result && res.result.success) {
        return {
          success: true,
          userInfo: res.result.userInfo,
          queryContext: res.result.queryContext,
        };
      } else {
        return {
          success: false,
          error: res.result.error || "获取用户信息失败",
        };
      }
    } catch (error) {
      console.error("调用获取用户信息云函数失败：", error);
      return {
        success: false,
        error: error.message || "网络错误",
      };
    }
  },

  // 获取用户信息并更新本地状态
  refreshUserInfo: async function () {
    try {
      const result = await this.getCurrentUserInfo();

      if (result.success) {
        // 更新全局状态
        const app = getApp();
        app.globalData.loginResult = {
          success: true,
          ...result.userInfo,
        };

        // 更新本地存储
        try {
          wx.setStorageSync("loginResult", app.globalData.loginResult);
        } catch (e) {
          console.error("更新本地存储失败：", e);
        }

        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error("刷新用户信息失败：", error);
      return {
        success: false,
        error: error.message || "刷新用户信息失败",
      };
    }
  },
};

module.exports = userInfoUtils;
