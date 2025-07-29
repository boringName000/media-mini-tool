/**
 * 任务状态工具函数
 * 用于枚举值、显示名称和样式的转换
 */

const { TaskStatusEnum } = require("../type/type");

/**
 * 根据枚举值获取任务状态显示名称
 * @param {number} taskStatusEnum 任务状态枚举值
 * @returns {string} 任务状态显示名称
 */
function getTaskStatusName(taskStatusEnum) {
  const taskStatusMap = {
    [TaskStatusEnum.PENDING]: "待发表",
    [TaskStatusEnum.COMPLETED]: "已完成",
    [TaskStatusEnum.REJECTED]: "已拒绝",
  };

  return taskStatusMap[taskStatusEnum] || "未知状态";
}

/**
 * 根据枚举值获取任务状态样式类名
 * @param {number} taskStatusEnum 任务状态枚举值
 * @returns {string} 任务状态样式类名
 */
function getTaskStatusClass(taskStatusEnum) {
  const taskStatusClassMap = {
    [TaskStatusEnum.PENDING]: "pending",
    [TaskStatusEnum.COMPLETED]: "completed",
    [TaskStatusEnum.REJECTED]: "rejected",
  };

  return taskStatusClassMap[taskStatusEnum] || "pending";
}

/**
 * 根据枚举值获取任务状态颜色
 * @param {number} taskStatusEnum 任务状态枚举值
 * @returns {string} 任务状态颜色
 */
function getTaskStatusColor(taskStatusEnum) {
  const taskStatusColorMap = {
    [TaskStatusEnum.PENDING]: "#ffc107",
    [TaskStatusEnum.COMPLETED]: "#28a745",
    [TaskStatusEnum.REJECTED]: "#dc3545",
  };

  return taskStatusColorMap[taskStatusEnum] || "#ffc107";
}

/**
 * 根据显示名称获取任务状态枚举值
 * @param {string} taskStatusName 任务状态显示名称
 * @returns {number} 任务状态枚举值
 */
function getTaskStatusEnum(taskStatusName) {
  const reverseMap = {
    待发表: TaskStatusEnum.PENDING,
    已完成: TaskStatusEnum.COMPLETED,
    已拒绝: TaskStatusEnum.REJECTED,
  };

  return reverseMap[taskStatusName] || TaskStatusEnum.PENDING;
}

/**
 * 获取所有任务状态的映射关系
 * @returns {Object} 枚举值到显示名称的映射
 */
function getAllTaskStatuses() {
  return {
    [TaskStatusEnum.PENDING]: "待发表",
    [TaskStatusEnum.COMPLETED]: "已完成",
    [TaskStatusEnum.REJECTED]: "已拒绝",
  };
}

module.exports = {
  getTaskStatusName,
  getTaskStatusClass,
  getTaskStatusColor,
  getTaskStatusEnum,
  getAllTaskStatuses,
  TaskStatusEnum,
};
