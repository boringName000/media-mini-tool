// miniprogram/utils/timeUtils.js

/**
 * 格式化时间戳为字符串
 * @param {number|string|Date} input 时间戳(毫秒)/可被Date识别的时间/Date对象
 * @param {string} format 输出格式，默认 YYYY-MM-DD HH:mm
 * 支持的占位符：YYYY、MM、DD、HH、mm、ss
 * @returns {string} 格式化后的字符串，如 2025-08-01 12:30
 */
function formatTimestamp(input, format = "YYYY-MM-DD HH:mm") {
  if (input === null || input === undefined) return "";

  let ts = input;
  if (typeof input === "string" && /^\d+$/.test(input)) {
    ts = parseInt(input, 10);
  }

  const date = input instanceof Date ? input : new Date(ts);
  if (isNaN(date.getTime())) return "";

  const Y = date.getFullYear();
  const M = pad2(date.getMonth() + 1);
  const D = pad2(date.getDate());
  const H = pad2(date.getHours());
  const m = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());

  return format
    .replace(/YYYY/g, String(Y))
    .replace(/MM/g, String(M))
    .replace(/DD/g, String(D))
    .replace(/HH/g, String(H))
    .replace(/mm/g, String(m))
    .replace(/ss/g, String(s));
}

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

module.exports = {
  formatTimestamp,
};
