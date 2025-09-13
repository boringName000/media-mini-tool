// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 权限等级枚举
const PERMISSION_LEVELS = {
  ARTICLE_ONLY: 1,    // 只能看和操作文章
  VIEW_ALL: 2,        // 能看全部信息
  FULL_ACCESS: 3      // 能看全部信息和操作全部信息
};

// 管理员账号配置（写死在云函数中）
const ADMIN_ACCOUNTS = {
  'admin': {
    username: 'admin',
    password: 'dzht888..',
    permissionLevel: PERMISSION_LEVELS.FULL_ACCESS,
    name: '系统管理员',
    description: '拥有系统全部权限'
  }
};

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    // 获取入参
    const { username, password } = event;

    // 参数验证
    if (!username || !password) {
      return {
        success: false,
        error: "用户名和密码不能为空",
        code: "INVALID_PARAMS",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证用户名格式（简单验证）
    if (typeof username !== 'string' || username.trim().length === 0) {
      return {
        success: false,
        error: "用户名格式不正确",
        code: "INVALID_USERNAME",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证密码格式（简单验证）
    if (typeof password !== 'string' || password.length === 0) {
      return {
        success: false,
        error: "密码格式不正确",
        code: "INVALID_PASSWORD",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 查找管理员账号
    const adminAccount = ADMIN_ACCOUNTS[username.trim()];
    
    if (!adminAccount) {
      return {
        success: false,
        error: "用户名不存在",
        code: "USER_NOT_FOUND",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证密码
    if (adminAccount.password !== password) {
      return {
        success: false,
        error: "密码错误",
        code: "INVALID_PASSWORD",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 登录成功，返回账号信息
    const loginTime = new Date();
    
    return {
      success: true,
      message: "登录成功",
      code: "LOGIN_SUCCESS",
      data: {
        username: adminAccount.username,
        name: adminAccount.name,
        description: adminAccount.description,
        permissionLevel: adminAccount.permissionLevel,
        permissionLevelName: getPermissionLevelName(adminAccount.permissionLevel),

        loginTime: loginTime.toISOString(),
        loginTimestamp: loginTime.getTime()
      },
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };

  } catch (error) {
    console.error("管理员登录失败：", error);
    return {
      success: false,
      error: "系统错误，请稍后重试",
      code: "SYSTEM_ERROR",
      details: error.message,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};

// 获取权限等级名称
function getPermissionLevelName(level) {
  switch (level) {
    case PERMISSION_LEVELS.ARTICLE_ONLY:
      return "文章管理员";
    case PERMISSION_LEVELS.VIEW_ALL:
      return "查看管理员";
    case PERMISSION_LEVELS.FULL_ACCESS:
      return "超级管理员";
    default:
      return "未知权限";
  }
}

