/**
 * 结算状态工具函数
 */

const { SettlementStatusEnum } = require("../type/type");

/**
 * 获取结算状态显示名称
 * @param {number} statusEnum - 结算状态枚举值
 * @returns {string} 显示名称
 */
function getSettlementStatusName(statusEnum) {
  switch (statusEnum) {
    case SettlementStatusEnum.PENDING:
      return "待结算";
    case SettlementStatusEnum.SETTLED:
      return "已结算";
    default:
      return "未知状态";
  }
}

/**
 * 根据显示名称获取结算状态枚举值
 * @param {string} statusName - 结算状态显示名称
 * @returns {number} 结算状态枚举值
 */
function getSettlementStatusEnum(statusName) {
  switch (statusName) {
    case "待结算":
      return SettlementStatusEnum.PENDING;
    case "已结算":
      return SettlementStatusEnum.SETTLED;
    default:
      return SettlementStatusEnum.PENDING;
  }
}

/**
 * 判断是否为待结算状态
 * @param {number} statusEnum - 结算状态枚举值
 * @returns {boolean} 是否为待结算
 */
function isPending(statusEnum) {
  return statusEnum === SettlementStatusEnum.PENDING;
}

/**
 * 判断是否为已结算状态
 * @param {number} statusEnum - 结算状态枚举值
 * @returns {boolean} 是否为已结算
 */
function isSettled(statusEnum) {
  return statusEnum === SettlementStatusEnum.SETTLED;
}

module.exports = {
  SettlementStatusEnum,
  getSettlementStatusName,
  getSettlementStatusEnum,
  isPending,
  isSettled,
};
