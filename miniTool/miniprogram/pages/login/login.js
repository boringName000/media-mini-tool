// 登录页面
Page({
  data: {
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
  },

  onShow: function () {
    // 页面显示时的逻辑
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
  handleLogin: function () {
    if (!this.validateLoginForm()) {
      return;
    }

    wx.showLoading({
      title: "登录中...",
      mask: true,
    });

    // 模拟登录请求
    setTimeout(() => {
      wx.hideLoading();

      // 模拟登录成功
      wx.showToast({
        title: "登录成功",
        icon: "success",
        duration: 2000,
      });

      // 跳转到我的页面
      setTimeout(() => {
        wx.switchTab({
          url: "/pages/me/me",
        });
      }, 2000);
    }, 1500);
  },

  // 处理注册
  handleRegister: function () {
    if (!this.validateRegisterForm()) {
      return;
    }

    wx.showLoading({
      title: "注册中...",
      mask: true,
    });

    // 模拟注册请求
    setTimeout(() => {
      wx.hideLoading();

      // 模拟注册成功
      wx.showToast({
        title: "注册成功",
        icon: "success",
        duration: 2000,
      });

      // 注册成功后切换到登录模式
      setTimeout(() => {
        this.setData({
          isLoginMode: true,
          loginPhone: this.data.registerPhone,
          loginPassword: this.data.registerPassword,
        });
      }, 2000);
    }, 1500);
  },
});
