// 用户信息工具函数
const { checkAndHandleUserPermission, ADMIN_CONTACT } = require('./permissionUtils.js');

const userInfoUtils = {
  // 获取当前用户信息
  getCurrentUserInfo: async function () {
    try {
      // 从全局登录信息中获取用户ID
      const app = getApp();

      // 安全检查：确保 app 和 globalData 存在
      if (!app || !app.globalData) {
        console.warn("应用实例或全局数据未初始化");
        return {
          success: false,
          error: "应用未初始化",
        };
      }

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
        // 尝试更新全局状态（带安全检查）
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.loginResult = {
            success: true,
            ...res.result.userInfo,
          };
          console.log("全局数据已更新");
        } else {
          console.warn("无法更新全局数据：应用实例未初始化");
        }

        // 检查用户权限状态（会自动处理跳转和提示）
        const hasPermission = checkAndHandleUserPermission(res.result.userInfo);
        if (!hasPermission) {
          // checkAndHandleUserPermission 已经处理了跳转和提示
          return {
            success: false,
            error: "用户权限被禁用",
          };
        }

        // 返回数据供外部使用
        return {
          success: true,
          userInfo: res.result.userInfo,
          queryContext: res.result.queryContext,
        };
      } else {
        const errorMsg = res.result.error || "获取用户信息失败";
        console.error("获取用户信息失败:", res.result);
        
        // 检查是否是用户被禁用的错误
        // 云函数可能返回包含status字段的对象，或者错误信息中包含禁用文字
        const isUserDisabled = (res.result.status === 0) || 
                              (errorMsg && (errorMsg.includes('用户账号已被禁用') || errorMsg.includes('用户已被禁用')));
        
        if (isUserDisabled) {
          console.log('检测到用户被禁用，显示提示并跳转到登录页');
          
          wx.showModal({
            title: '账号状态异常',
            content: `用户已被禁止使用，请联系管理员 ${ADMIN_CONTACT}`,
            showCancel: false,
            confirmText: '确定',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 清除本地存储
                wx.removeStorageSync('userInfo');
                wx.removeStorageSync('loginResult');
                
                // 清除全局数据
                const app = getApp();
                if (app && app.globalData) {
                  app.globalData.loginResult = null;
                }
                
                // 跳转到登录页面
                wx.reLaunch({
                  url: '/pages/login/login',
                  success: () => {
                    console.log('成功跳转到登录页');
                  },
                  fail: (err) => {
                    console.error('跳转失败:', err);
                  }
                });
              }
            }
          });
        }
        
        return {
          success: false,
          error: errorMsg,
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

  // 登录获取最新用户信息（不更新任何数据）
  loginGetLatestUserInfo: async function () {
    try {
      console.log("开始获取最新用户信息...");

      // 直接调用云函数获取最新用户信息
      const res = await wx.cloud.callFunction({
        name: "get-user-info",
        data: {},
      });

      if (res && res.result && res.result.success) {
        console.log("获取最新用户信息成功:", res.result.userInfo);
        return {
          success: true,
          userInfo: res.result.userInfo,
          queryContext: res.result.queryContext,
        };
      } else {
        console.error("获取用户信息失败:", res.result);
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
        // 更新本地存储
        try {
          const updatedLoginResult = {
            success: true,
            ...result.userInfo,
          };
          wx.setStorageSync("loginResult", updatedLoginResult);
          console.log("本地存储已更新");
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
