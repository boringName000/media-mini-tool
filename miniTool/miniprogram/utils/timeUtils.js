// 时间工具函数
const timeUtils = {
  /**
   * 通用时间格式化函数
   * @param {any} timeInput - 时间输入（支持多种格式）
   * @param {string} format - 输出格式，默认 'YYYY-MM-DD'
   * @param {object} options - 配置选项
   * @returns {string} 格式化后的时间字符串
   */
  formatTime: function (timeInput, format = "YYYY-MM-DD", options = {}) {
    if (!timeInput) {
      return options.defaultValue || "";
    }

    try {
      let date;

      // 处理不同类型的输入
      if (timeInput instanceof Date) {
        date = timeInput;
      } else if (typeof timeInput === "number") {
        // 时间戳
        date = new Date(timeInput);
      } else if (typeof timeInput === "string") {
        // 字符串格式
        if (/^\d+$/.test(timeInput)) {
          // 纯数字字符串，当作时间戳处理
          date = new Date(parseInt(timeInput, 10));
        } else if (timeInput.includes("T")) {
          // ISO 格式
          date = new Date(timeInput);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(timeInput)) {
          // YYYY-MM-DD 格式
          date = new Date(timeInput + "T00:00:00.000Z");
        } else {
          // 其他字符串格式
          date = new Date(timeInput);
        }
      } else {
        // 其他类型，尝试直接转换
        date = new Date(timeInput);
      }

      // 验证日期是否有效
      if (isNaN(date.getTime())) {
        console.warn("无效的时间输入:", timeInput);
        return options.defaultValue || "";
      }

      // 格式化输出
      return this.formatDateByPattern(date, format, options);
    } catch (error) {
      console.error("时间格式化失败:", error, timeInput);
      return options.defaultValue || "";
    }
  },

  /**
   * 根据模式格式化日期
   * @param {Date} date - 日期对象
   * @param {string} format - 格式模式
   * @param {object} options - 配置选项
   * @returns {string} 格式化后的字符串
   */
  formatDateByPattern: function (date, format, options = {}) {
    const locale = options.locale || "zh-CN";

    // 预定义格式
    const predefinedFormats = {
      "YYYY-MM-DD": () => {
        const Y = date.getFullYear();
        const M = this.pad2(date.getMonth() + 1);
        const D = this.pad2(date.getDate());
        return `${Y}-${M}-${D}`;
      },
      "YYYY-MM-DD HH:mm": () => {
        const Y = date.getFullYear();
        const M = this.pad2(date.getMonth() + 1);
        const D = this.pad2(date.getDate());
        const H = this.pad2(date.getHours());
        const m = this.pad2(date.getMinutes());
        return `${Y}-${M}-${D} ${H}:${m}`;
      },
      "YYYY-MM-DD HH:mm:ss": () => {
        const Y = date.getFullYear();
        const M = this.pad2(date.getMonth() + 1);
        const D = this.pad2(date.getDate());
        const H = this.pad2(date.getHours());
        const m = this.pad2(date.getMinutes());
        const s = this.pad2(date.getSeconds());
        return `${Y}-${M}-${D} ${H}:${m}:${s}`;
      },
      "MM-DD": () => {
        const M = this.pad2(date.getMonth() + 1);
        const D = this.pad2(date.getDate());
        return `${M}-${D}`;
      },
      "HH:mm": () => {
        const H = this.pad2(date.getHours());
        const m = this.pad2(date.getMinutes());
        return `${H}:${m}`;
      },
      "HH:mm:ss": () => {
        const H = this.pad2(date.getHours());
        const m = this.pad2(date.getMinutes());
        const s = this.pad2(date.getSeconds());
        return `${H}:${m}:${s}`;
      },
      chinese: () => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
      },
      relative: () => {
        return this.getRelativeTime(date);
      },
    };

    // 检查是否是预定义格式
    if (predefinedFormats[format]) {
      return predefinedFormats[format]();
    }

    // 自定义格式处理
    const Y = date.getFullYear();
    const M = this.pad2(date.getMonth() + 1);
    const D = this.pad2(date.getDate());
    const H = this.pad2(date.getHours());
    const m = this.pad2(date.getMinutes());
    const s = this.pad2(date.getSeconds());

    return format
      .replace(/YYYY/g, String(Y))
      .replace(/MM/g, String(M))
      .replace(/DD/g, String(D))
      .replace(/HH/g, String(H))
      .replace(/mm/g, String(m))
      .replace(/ss/g, String(s));
  },

  /**
   * 获取相对时间（如：刚刚、5分钟前、1小时前等）
   * @param {Date} date - 日期对象
   * @returns {string} 相对时间字符串
   */
  getRelativeTime: function (date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "刚刚";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return this.formatTime(date, "YYYY-MM-DD");
    }
  },

  /**
   * 补零函数
   * @param {number} n - 数字
   * @returns {string} 补零后的字符串
   */
  pad2: function (n) {
    return n < 10 ? "0" + n : String(n);
  },

  /**
   * 获取当前日期字符串
   * @returns {string} 当前日期字符串 YYYY-MM-DD
   */
  getCurrentDateString: function () {
    return this.formatTime(new Date(), "YYYY-MM-DD");
  },

  /**
   * 获取当前时间字符串
   * @param {string} format - 格式，默认 'YYYY-MM-DD HH:mm:ss'
   * @returns {string} 当前时间字符串
   */
  getCurrentTimeString: function (format = "YYYY-MM-DD HH:mm:ss") {
    return this.formatTime(new Date(), format);
  },

  /**
   * 验证日期是否有效
   * @param {any} dateInput - 日期输入
   * @returns {boolean} 是否有效
   */
  isValidDate: function (dateInput) {
    if (!dateInput) {
      return false;
    }

    try {
      const date = new Date(dateInput);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  },

  /**
   * 比较两个日期
   * @param {any} date1 - 日期1
   * @param {any} date2 - 日期2
   * @returns {number} -1: date1 < date2, 0: date1 = date2, 1: date1 > date2
   */
  compareDates: function (date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  },
};

module.exports = timeUtils;
