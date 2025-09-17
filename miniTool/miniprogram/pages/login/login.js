// 登录页面
const authUtils = require("../../utils/authUtils");
const { checkLoginPermission, ADMIN_CONTACT } = require('../../utils/permissionUtils.js');
Page({
  data: {
    statusBarHeight: 0, // 状态栏高度
    navbarStyle: '', // 导航栏样式
    // 页面状态
    isLoginMode: true, // true: 登录模式, false: 注册模式

    // 登录表单数据
    loginPhone: "",
    loginPassword: "",

    // 注册表单数据
    registerNickname: "",
    registerPhone: "",
    registerPassword: "",
    confirmPassword: "",
    inviteCode: "",

    // 协议确认
    agreedToTerms: false,
    agreedToPrivacy: false,

    // 表单验证状态
    loginPhoneError: "",
    loginPasswordError: "",
    registerNicknameError: "",
    registerPhoneError: "",
    registerPasswordError: "",
    confirmPasswordError: "",
    inviteCodeError: "",
  },

  onLoad: function (options) {
    console.log("登录页面加载");
    
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      navbarStyle: `--status-bar-height: ${systemInfo.statusBarHeight}px;`
    });
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 免密码微信直接登录
  handleWeChatLogin: async function () {
    await this.performLogin({}, "登录中...");
  },

  // 切换登录/注册模式
  switchMode: function (e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      isLoginMode: mode === "login",
      // 清空表单数据
      loginPhone: "",
      loginPassword: "",
      registerNickname: "",
      registerPhone: "",
      registerPassword: "",
      confirmPassword: "",
      inviteCode: "",
      // 清空错误信息
      loginPhoneError: "",
      loginPasswordError: "",
      registerNicknameError: "",
      registerPhoneError: "",
      registerPasswordError: "",
      confirmPasswordError: "",
      inviteCodeError: "",
    });
  },

  // 登录表单输入处理
  onLoginPhoneInput: function (e) {
    this.setData({
      loginPhone: e.detail.value,
      loginPhoneError: "",
    });
  },

  onLoginPasswordInput: function (e) {
    this.setData({
      loginPassword: e.detail.value,
      loginPasswordError: "",
    });
  },

  // 注册表单输入处理
  onRegisterNicknameInput: function (e) {
    this.setData({
      registerNickname: e.detail.value,
      registerNicknameError: "",
    });
  },

  onRegisterPhoneInput: function (e) {
    this.setData({
      registerPhone: e.detail.value,
      registerPhoneError: "",
    });
  },

  onRegisterPasswordInput: function (e) {
    this.setData({
      registerPassword: e.detail.value,
      registerPasswordError: "",
    });
  },

  onConfirmPasswordInput: function (e) {
    this.setData({
      confirmPassword: e.detail.value,
      confirmPasswordError: "",
    });
  },

  onInviteCodeInput: function (e) {
    this.setData({
      inviteCode: e.detail.value,
      inviteCodeError: "",
    });
  },

  // 协议确认切换
  onTermsToggle: function () {
    this.setData({
      agreedToTerms: !this.data.agreedToTerms,
    });
  },

  onPrivacyToggle: function () {
    this.setData({
      agreedToPrivacy: !this.data.agreedToPrivacy,
    });
  },

  // 查看协议
  viewTerms: function () {
    wx.navigateTo({
      url: "/pages/agreement/agreement",
    });
  },

  viewPrivacy: function () {
    wx.navigateTo({
      url: "/pages/agreement/agreement?from=login&showButtons=false",
    });
  },

  // 表单验证
  validateLoginForm: function () {
    let isValid = true;
    const errors = {};

    // 验证手机号
    if (!this.data.loginPhone) {
      errors.loginPhoneError = "请输入手机号";
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(this.data.loginPhone)) {
      errors.loginPhoneError = "请输入正确的手机号";
      isValid = false;
    }

    // 验证密码
    if (!this.data.loginPassword) {
      errors.loginPasswordError = "请输入密码";
      isValid = false;
    } else if (this.data.loginPassword.length < 6) {
      errors.loginPasswordError = "密码长度不能少于6位";
      isValid = false;
    }

    this.setData(errors);
    return isValid;
  },

  validateRegisterForm: function () {
    let isValid = true;
    const errors = {};

    // 验证昵称
    if (!this.data.registerNickname) {
      errors.registerNicknameError = "请输入昵称";
      isValid = false;
    } else if (this.data.registerNickname.length < 2) {
      errors.registerNicknameError = "昵称长度不能少于2位";
      isValid = false;
    }

    // 验证手机号
    if (!this.data.registerPhone) {
      errors.registerPhoneError = "请输入手机号";
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(this.data.registerPhone)) {
      errors.registerPhoneError = "请输入正确的手机号";
      isValid = false;
    }

    // 验证密码
    if (!this.data.registerPassword) {
      errors.registerPasswordError = "请输入密码";
      isValid = false;
    } else if (this.data.registerPassword.length < 6) {
      errors.registerPasswordError = "密码长度不能少于6位";
      isValid = false;
    }

    // 验证确认密码
    if (!this.data.confirmPassword) {
      errors.confirmPasswordError = "请确认密码";
      isValid = false;
    } else if (this.data.registerPassword !== this.data.confirmPassword) {
      errors.confirmPasswordError = "两次输入的密码不一致";
      isValid = false;
    }

    // 验证邀请码
    if (!this.data.inviteCode) {
      errors.inviteCodeError = "请输入邀请码";
      isValid = false;
    }

    // 验证协议确认
    if (!this.data.agreedToTerms) {
      wx.showToast({
        title: "请先同意用户服务协议",
        icon: "none",
      });
      isValid = false;
    }

    if (!this.data.agreedToPrivacy) {
      wx.showToast({
        title: "请先同意隐私权政策",
        icon: "none",
      });
      isValid = false;
    }

    this.setData(errors);
    return isValid;
  },

  // 提交表单
  submitForm: function () {
    if (this.data.isLoginMode) {
      this.handleLogin();
    } else {
      this.handleRegister();
    }
  },

  // 处理登录
  handleLogin: async function () {
    if (!this.validateLoginForm()) {
      return;
    }
    await this.performLogin(
      {
        phone: this.data.loginPhone,
        password: this.data.loginPassword,
      },
      "登录中..."
    );
  },

  // 处理注册
  handleRegister: async function () {
    if (!this.validateRegisterForm()) {
      return;
    }

    wx.showLoading({
      title: "注册中...",
      mask: true,
    });

    try {
      const res = await wx.cloud.callFunction({
        name: "user-register",
        data: {
          nickname: this.data.registerNickname,
          phone: this.data.registerPhone,
          password: this.data.registerPassword,
          inviteCode: this.data.inviteCode,
        },
      });

      wx.hideLoading();

      if (res && res.result && res.result.success) {
        wx.showToast({
          title: "注册成功",
          icon: "success",
          duration: 2000,
        });

        // 注册成功后切换到登录模式并预填手机号和密码
        this.setData({
          isLoginMode: true,
          loginPhone: this.data.registerPhone,
          loginPassword: this.data.registerPassword,
        });
      } else {
        const errMsg =
          (res && res.result && res.result.error) || "注册失败，请稍后重试";
        wx.showToast({
          title: errMsg,
          icon: "none",
          duration: 2500,
        });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({
        title: e.message || "注册失败，请检查网络",
        icon: "none",
        duration: 2500,
      });
      console.error("调用用户注册云函数失败：", e);
    }
  },

  // 通用登录流程
  performLogin: async function (payload, loadingTitle) {
    wx.showLoading({ title: loadingTitle || "登录中...", mask: true });
    try {
      const res = await wx.cloud.callFunction({
        name: "user-login",
        data: payload || {},
      });

      wx.hideLoading();

      if (res && res.result && res.result.success) {
        this.onLoginSuccess(res.result);
      } else {
        const errMsg =
          (res && res.result && res.result.error) || "登录失败，请稍后重试";
        
        // 检查是否是用户被禁用的错误，如果是则显示统一的提示
        if (errMsg.includes('用户账号已被禁用') || errMsg.includes('用户已被禁用') || 
            (res.result && res.result.status === 0)) {
          wx.showModal({
            title: '登录失败',
            content: `用户已被禁止使用，请联系管理员 ${ADMIN_CONTACT}`,
            showCancel: false,
            confirmText: '确定'
          });
        } else {
          wx.showToast({ title: errMsg, icon: "none", duration: 2500 });
        }
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({
        title: e.message || "登录失败，请检查网络",
        icon: "none",
        duration: 2500,
      });
      console.error("调用用户登录云函数失败：", e);
    }
  },

  // 登录成功统一处理
  onLoginSuccess: function (result) {
    // 检查登录权限
    if (!checkLoginPermission(result)) {
      return; // 权限检查失败，已显示提示
    }

    wx.showToast({ title: "登录成功", icon: "success", duration: 1200 });

    // 使用工具函数处理登录成功
    authUtils.handleLoginSuccess(result);
  },
});
