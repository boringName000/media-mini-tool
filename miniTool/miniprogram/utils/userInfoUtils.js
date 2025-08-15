// 用户信息工具函数
const userInfoUtils = {
  // 获取当前用户信息
  getCurrentUserInfo: async function () {
    try {
      // 从全局登录信息中获取用户ID
      const app = getApp();
      const loginResult = app.globalData.loginResult;

      if (!loginResult || !loginResult.success) {
        return {
          success: false,
          error: "用户未登录",
        };
      }

      const userId = loginResult.userId;
      console.log("登录信息中的 userId:", userId);

      let res;
      if (userId) {
        // 如果有 userId，传递给云函数
        console.log("使用指定的用户ID:", userId);
        res = await wx.cloud.callFunction({
          name: "get-user-info",
          data: { openid: userId },
        });
      } else {
        // 如果没有 userId，不传递 data，让云函数使用默认的微信 openid
        console.log("使用默认微信 openid");
        res = await wx.cloud.callFunction({
          name: "get-user-info",
          data: {},
        });
      }

      if (res && res.result && res.result.success) {
        // 更新全局状态
        const app = getApp();
        app.globalData.loginResult = {
          success: true,
          ...res.result.userInfo,
        };

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
      if (!openid) {
        return {
          success: false,
          error: "openid 不能为空",
        };
      }

      console.log("根据 openid 获取用户信息:", openid);

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
