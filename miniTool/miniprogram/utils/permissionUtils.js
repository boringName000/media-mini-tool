/**
 * 权限管理工具
 * 用于检查用户状态和账号状态，处理权限相关的逻辑
 */

const { getCurrentUserInfo } = require('./userInfoUtils.js');

/**
 * 用户状态枚举
 */
const USER_STATUS = {
  NORMAL: 1,    // 正常
  DISABLED: 0   // 禁用
};

/**
 * 账号状态枚举
 */
const ACCOUNT_STATUS = {
  NORMAL: 1,    // 正常
  DISABLED: 0   // 禁用
};

/**
 * 管理员联系方式
 */
const ADMIN_CONTACT = "电话：13602633059";

/**
 * 检查用户状态是否正常
 * @param {Object} userInfo - 用户信息对象
 * @returns {Boolean} true-正常，false-禁用
 */
function checkUserStatus(userInfo) {
  if (!userInfo || typeof userInfo.status === 'undefined') {
    return false;
  }
  return userInfo.status === USER_STATUS.NORMAL;
}

/**
 * 检查指定账号状态是否正常
 * @param {Object} userInfo - 用户信息对象
 * @param {String} accountId - 账号ID
 * @returns {Boolean} true-正常，false-禁用
 */
function checkAccountStatus(userInfo, accountId) {
  if (!userInfo || !userInfo.accounts || !Array.isArray(userInfo.accounts)) {
    return false;
  }
  
  const account = userInfo.accounts.find(acc => acc.accountId === accountId);
  if (!account || typeof account.status === 'undefined') {
    return false;
  }
  
  return account.status === ACCOUNT_STATUS.NORMAL;
}

/**
 * 检查用户权限并处理禁用状态
 * 如果用户被禁用，自动跳转到登录页面并显示提示
 * @param {Object} userInfo - 用户信息对象
 * @returns {Boolean} true-权限正常，false-权限被禁用
 */
function checkAndHandleUserPermission(userInfo) {
  console.log('checkAndHandleUserPermission - 检查用户权限:', userInfo);
  
  if (!userInfo) {
    console.log('checkAndHandleUserPermission - 用户信息为空');
    return false;
  }

  // 直接检查用户状态：1-正常，0-禁用
  if (userInfo.status === 0) {
    console.log('checkAndHandleUserPermission - 用户已被禁用，显示提示并跳转');
    
    wx.showModal({
      title: '账号状态异常',
      content: `用户已被禁止使用，请联系管理员 ${ADMIN_CONTACT}`,
      showCancel: false,
      confirmText: '确定',
      success: (res) => {
        console.log('checkAndHandleUserPermission - 用户点击确定，准备跳转到登录页');
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('loginResult');
          
          // 跳转到登录页面
          wx.reLaunch({
            url: '/pages/login/login',
            success: () => {
              console.log('checkAndHandleUserPermission - 成功跳转到登录页');
            },
            fail: (err) => {
              console.error('checkAndHandleUserPermission - 跳转失败:', err);
            }
          });
        }
      },
      fail: (err) => {
        console.error('checkAndHandleUserPermission - 显示模态框失败:', err);
      }
    });
    return false;
  }
  
  console.log('checkAndHandleUserPermission - 用户权限正常');
  return true;
}

/**
 * 检查账号权限并处理禁用状态
 * 如果账号被禁用，显示提示但不跳转页面
 * @param {Object} userInfo - 用户信息对象
 * @param {String} accountId - 账号ID
 * @returns {Boolean} true-权限正常，false-权限被禁用
 */
function checkAndHandleAccountPermission(userInfo, accountId) {
  if (!checkAccountStatus(userInfo, accountId)) {
    wx.showModal({
      title: '账号状态异常',
      content: `用户绑定账号已被禁止使用，请联系管理员 ${ADMIN_CONTACT}`,
      showCancel: false,
      confirmText: '确定'
    });
    return false;
  }
  return true;
}



/**
 * 登录时的权限检查
 * 在用户登录成功后检查用户状态
 * @param {Object} loginResult - 登录结果对象
 * @returns {Boolean} true-可以继续登录流程，false-需要阻止登录
 */
function checkLoginPermission(loginResult) {
  if (!loginResult || !loginResult.success) {
    return false;
  }
  
  // 检查用户状态
  if (loginResult.status !== USER_STATUS.NORMAL) {
    wx.showModal({
      title: '登录失败',
      content: `用户已被禁止使用，请联系管理员 ${ADMIN_CONTACT}`,
      showCancel: false,
      confirmText: '确定'
    });
    return false;
  }
  
  return true;
}

/**
 * 下载权限检查（仅检查账号权限）
 * 用户权限已在 getCurrentUserInfo 中检查，这里只需检查账号权限
 * @param {Object} userInfo - 用户信息对象
 * @param {String} accountId - 要下载内容的账号ID
 * @returns {Boolean} true-可以下载，false-禁止下载
 */
function checkDownloadPermission(userInfo, accountId) {
  // 检查账号权限
  if (!checkAccountStatus(userInfo, accountId)) {
    wx.showModal({
      title: '下载失败',
      content: `用户绑定账号已被禁止使用，请联系管理员 ${ADMIN_CONTACT}`,
      showCancel: false,
      confirmText: '确定'
    });
    return false;
  }
  
  return true;
}

/**
 * 获取用户的所有正常状态账号
 * @param {Object} userInfo - 用户信息对象
 * @returns {Array} 正常状态的账号数组
 */
function getActiveAccounts(userInfo) {
  if (!userInfo || !userInfo.accounts || !Array.isArray(userInfo.accounts)) {
    return [];
  }
  
  return userInfo.accounts.filter(account => 
    account.status === ACCOUNT_STATUS.NORMAL
  );
}

/**
 * 获取用户的所有禁用状态账号
 * @param {Object} userInfo - 用户信息对象
 * @returns {Array} 禁用状态的账号数组
 */
function getDisabledAccounts(userInfo) {
  if (!userInfo || !userInfo.accounts || !Array.isArray(userInfo.accounts)) {
    return [];
  }
  
  return userInfo.accounts.filter(account => 
    account.status === ACCOUNT_STATUS.DISABLED
  );
}

module.exports = {
  USER_STATUS,
  ACCOUNT_STATUS,
  ADMIN_CONTACT,
  checkUserStatus,
  checkAccountStatus,
  checkAndHandleUserPermission,
  checkAndHandleAccountPermission,
  checkLoginPermission,
  checkDownloadPermission,
  getActiveAccounts,
  getDisabledAccounts
};