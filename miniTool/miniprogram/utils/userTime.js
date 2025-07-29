/**
 * 用户时间管理工具
 * 统一管理用户注册时间等时间相关功能
 */

// 用户注册时间存储键名
const USER_REGISTER_TIME_KEY = "userRegisterTime";

/**
 * 初始化用户注册时间
 * 如果本地存储中没有，则设置默认值
 */
function initUserRegisterTime() {
  const registerTime = wx.getStorageSync(USER_REGISTER_TIME_KEY);
  if (!registerTime) {
    // 设置默认注册时间为2025年1月1日的时间戳
    const defaultTimestamp = new Date("2025-01-01").getTime();
    wx.setStorageSync(USER_REGISTER_TIME_KEY, defaultTimestamp);
    console.log(
      "初始化用户注册时间：",
      new Date(defaultTimestamp).toISOString()
    );
  }
}

/**
 * 获取用户注册时间（返回时间戳）
 * @returns {number} 时间戳（毫秒）
 */
function getUserRegisterTime() {
  return (
    wx.getStorageSync(USER_REGISTER_TIME_KEY) ||
    new Date("2025-01-01").getTime()
  );
}

/**
 * 获取用户注册时间字符串（用于显示）
 * @returns {string} 格式化的日期字符串 YYYY-MM-DD
 */
function getUserRegisterTimeString() {
  const timestamp = getUserRegisterTime();
  return new Date(timestamp).toISOString().split("T")[0];
}

/**
 * 设置用户注册时间
 * @param {number} timestamp 时间戳（毫秒）
 */
function setUserRegisterTime(timestamp) {
  wx.setStorageSync(USER_REGISTER_TIME_KEY, timestamp);
  console.log("更新用户注册时间：", new Date(timestamp).toISOString());
}

/**
 * 设置用户注册时间（通过日期字符串）
 * @param {string} dateStr 日期字符串，格式：YYYY-MM-DD
 */
function setUserRegisterTimeByString(dateStr) {
  const timestamp = new Date(dateStr).getTime();
  setUserRegisterTime(timestamp);
}

/**
 * 清除用户注册时间
 */
function clearUserRegisterTime() {
  wx.removeStorageSync(USER_REGISTER_TIME_KEY);
  console.log("清除用户注册时间");
}

/**
 * 获取用户注册时间对象
 * @returns {Date} Date对象
 */
function getUserRegisterDate() {
  const timestamp = getUserRegisterTime();
  return new Date(timestamp);
}

/**
 * 检查用户注册时间是否有效
 * @returns {boolean} 是否有效
 */
function isValidUserRegisterTime() {
  const timestamp = getUserRegisterTime();
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

// 微信小程序模块导出方式 - 使用CommonJS规范
module.exports = {
  initUserRegisterTime: initUserRegisterTime,
  getUserRegisterTime: getUserRegisterTime,
  getUserRegisterTimeString: getUserRegisterTimeString,
  setUserRegisterTime: setUserRegisterTime,
  setUserRegisterTimeByString: setUserRegisterTimeByString,
  clearUserRegisterTime: clearUserRegisterTime,
  getUserRegisterDate: getUserRegisterDate,
  isValidUserRegisterTime: isValidUserRegisterTime,
};
