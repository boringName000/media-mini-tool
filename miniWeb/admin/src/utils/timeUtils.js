/**
 * 时间格式化工具函数
 * 兼容多种时间格式，统一处理项目中的时间显示需求
 */

/**
 * 格式化时间为本地化字符串
 * @param {*} time - 时间数据，支持多种格式
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (time, options = {}) => {
  try {
    // 安全处理：检查输入参数
    if (time === null || time === undefined) {
      return options.fallback || '未知时间'
    }

    // 安全处理：检查空字符串
    if (typeof time === 'string' && time.trim() === '') {
      return options.fallback || '未知时间'
    }

    let date
    
    // 处理不同的时间格式
    if (time && typeof time === 'object' && time._seconds !== undefined) {
      // 微信云开发 db.serverDate() 格式 { _seconds: number, _nanoseconds: number }
      const seconds = Number(time._seconds)
      if (isNaN(seconds)) {
        console.warn('formatTime: 无效的_seconds值:', time._seconds)
        return options.fallback || '时间格式错误'
      }
      date = new Date(seconds * 1000)
    } else if (time && typeof time === 'object' && time.toDate && typeof time.toDate === 'function') {
      // Firestore Timestamp 格式
      try {
        date = time.toDate()
      } catch (err) {
        console.warn('formatTime: toDate()调用失败:', err)
        return options.fallback || '时间格式错误'
      }
    } else if (time && typeof time === 'object' && time.seconds !== undefined) {
      // 另一种 Timestamp 格式 { seconds: number, nanoseconds: number }
      const seconds = Number(time.seconds)
      if (isNaN(seconds)) {
        console.warn('formatTime: 无效的seconds值:', time.seconds)
        return options.fallback || '时间格式错误'
      }
      date = new Date(seconds * 1000)
    } else if (typeof time === 'number') {
      // Unix 时间戳（毫秒或秒）
      if (isNaN(time) || !isFinite(time)) {
        console.warn('formatTime: 无效的数字时间戳:', time)
        return options.fallback || '时间格式错误'
      }
      // 判断是否为秒级时间戳（小于 10^10）
      const timestamp = time < 10000000000 ? time * 1000 : time
      date = new Date(timestamp)
    } else if (typeof time === 'string') {
      // ISO 字符串或其他字符串格式
      const trimmedTime = time.trim()
      if (!trimmedTime) {
        return options.fallback || '未知时间'
      }
      date = new Date(trimmedTime)
    } else if (time instanceof Date) {
      // 原生 Date 对象
      date = time
    } else {
      // 尝试直接转换
      try {
        date = new Date(time)
      } catch (err) {
        console.warn('formatTime: 无法转换时间格式:', time, err)
        return options.fallback || '时间格式错误'
      }
    }
    
    // 检查日期是否有效
    if (!date || isNaN(date.getTime())) {
      console.warn('formatTime: 无效的时间格式:', time)
      return options.fallback || '时间格式错误'
    }

    // 检查日期是否在合理范围内（1970-2100年）
    const timestamp = date.getTime()
    if (timestamp < 0 || timestamp > 4102444800000) { // 2100年1月1日
      console.warn('formatTime: 时间超出合理范围:', time, date)
      return options.fallback || '时间超出范围'
    }
    
    // 根据选项返回不同格式
    if (options.format === 'date') {
      // 只返回日期部分
      return date.toLocaleDateString('zh-CN')
    } else if (options.format === 'time') {
      // 只返回时间部分
      return date.toLocaleTimeString('zh-CN')
    } else if (options.format === 'datetime') {
      // 返回完整的日期时间
      return date.toLocaleString('zh-CN')
    } else if (options.format === 'relative') {
      // 返回相对时间
      return getRelativeTime(date)
    } else if (options.format === 'custom' && options.customFormat) {
      // 自定义格式
      return formatCustomTime(date, options.customFormat)
    } else {
      // 默认格式：本地化字符串
      return date.toLocaleString('zh-CN')
    }
  } catch (error) {
    console.error('formatTime: 格式化时间失败:', error, '原始时间:', time)
    return options.fallback || '时间格式错误'
  }
}

/**
 * 获取相对时间描述（如：刚刚、5分钟前、2小时前等）
 * @param {Date} date - 日期对象
 * @returns {string} 相对时间描述
 */
export const getRelativeTime = (date) => {
  try {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 转换为秒
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) {
      return '刚刚'
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}分钟前`
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600)
      return `${hours}小时前`
    } else if (seconds < 2592000) {
      const days = Math.floor(seconds / 86400)
      return `${days}天前`
    } else if (seconds < 31536000) {
      const months = Math.floor(seconds / 2592000)
      return `${months}个月前`
    } else {
      const years = Math.floor(seconds / 31536000)
      return `${years}年前`
    }
  } catch (error) {
    console.error('计算相对时间失败:', error)
    return '时间未知'
  }
}

/**
 * 自定义格式化时间
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的时间
 */
export const formatCustomTime = (date, format) => {
  try {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  } catch (error) {
    console.error('自定义格式化时间失败:', error)
    return date.toLocaleString('zh-CN')
  }
}

/**
 * 格式化时间范围
 * @param {*} startTime - 开始时间
 * @param {*} endTime - 结束时间
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的时间范围
 */
export const formatTimeRange = (startTime, endTime, options = {}) => {
  try {
    const start = formatTime(startTime, options)
    const end = formatTime(endTime, options)
    const separator = options.separator || ' - '
    
    return `${start}${separator}${end}`
  } catch (error) {
    console.error('格式化时间范围失败:', error)
    return '时间范围错误'
  }
}

/**
 * 检查时间是否为今天
 * @param {*} time - 时间数据
 * @returns {boolean} 是否为今天
 */
export const isToday = (time) => {
  try {
    const date = new Date(formatTime(time, { format: 'datetime' }))
    const today = new Date()
    
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate()
  } catch (error) {
    console.error('检查是否为今天失败:', error)
    return false
  }
}

/**
 * 检查时间是否为本周
 * @param {*} time - 时间数据
 * @returns {boolean} 是否为本周
 */
export const isThisWeek = (time) => {
  try {
    const date = new Date(formatTime(time, { format: 'datetime' }))
    const today = new Date()
    
    // 获取本周的开始时间（周一）
    const startOfWeek = new Date(today)
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)
    
    // 获取本周的结束时间（周日）
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    return date >= startOfWeek && date <= endOfWeek
  } catch (error) {
    console.error('检查是否为本周失败:', error)
    return false
  }
}

/**
 * 获取时间戳
 * @param {*} time - 时间数据
 * @returns {number|null} 时间戳（毫秒），失败时返回null
 */
export const getTimestamp = (time) => {
  try {
    // 安全处理：检查输入参数
    if (time === null || time === undefined) {
      return null
    }

    // 安全处理：检查空字符串
    if (typeof time === 'string' && time.trim() === '') {
      return null
    }
    
    let timestamp
    
    if (time && typeof time === 'object' && time._seconds !== undefined) {
      // 微信云开发格式
      const seconds = Number(time._seconds)
      if (isNaN(seconds)) {
        console.warn('getTimestamp: 无效的_seconds值:', time._seconds)
        return null
      }
      timestamp = seconds * 1000
    } else if (time && typeof time === 'object' && time.toDate && typeof time.toDate === 'function') {
      // Firestore Timestamp格式
      try {
        const date = time.toDate()
        timestamp = date.getTime()
      } catch (err) {
        console.warn('getTimestamp: toDate()调用失败:', err)
        return null
      }
    } else if (time && typeof time === 'object' && time.seconds !== undefined) {
      // 另一种Timestamp格式
      const seconds = Number(time.seconds)
      if (isNaN(seconds)) {
        console.warn('getTimestamp: 无效的seconds值:', time.seconds)
        return null
      }
      timestamp = seconds * 1000
    } else if (typeof time === 'number') {
      // 数字时间戳
      if (isNaN(time) || !isFinite(time)) {
        console.warn('getTimestamp: 无效的数字时间戳:', time)
        return null
      }
      timestamp = time < 10000000000 ? time * 1000 : time
    } else {
      // 其他格式，尝试转换为Date
      try {
        const date = new Date(time)
        if (isNaN(date.getTime())) {
          console.warn('getTimestamp: 无法解析的时间格式:', time)
          return null
        }
        timestamp = date.getTime()
      } catch (err) {
        console.warn('getTimestamp: 时间转换失败:', time, err)
        return null
      }
    }

    // 检查时间戳是否在合理范围内
    if (timestamp < 0 || timestamp > 4102444800000) { // 2100年1月1日
      console.warn('getTimestamp: 时间戳超出合理范围:', timestamp)
      return null
    }

    return timestamp
  } catch (error) {
    console.error('getTimestamp: 获取时间戳失败:', error, '输入时间:', time)
    return null
  }
}

// 导出常用的格式化选项
export const TIME_FORMATS = {
  // 完整日期时间
  FULL: { format: 'datetime' },
  // 只显示日期
  DATE_ONLY: { format: 'date' },
  // 只显示时间
  TIME_ONLY: { format: 'time' },
  // 相对时间
  RELATIVE: { format: 'relative' },
  // 自定义格式：YYYY-MM-DD HH:mm:ss
  CUSTOM_FULL: { format: 'custom', customFormat: 'YYYY-MM-DD HH:mm:ss' },
  // 自定义格式：YYYY-MM-DD
  CUSTOM_DATE: { format: 'custom', customFormat: 'YYYY-MM-DD' },
  // 自定义格式：HH:mm
  CUSTOM_TIME: { format: 'custom', customFormat: 'HH:mm' }
}

/**
 * 获取当前时间的标准格式字符串
 * @returns {string} 格式化的当前时间 YYYY/MM/DD HH:mm:ss
 */
export const getCurrentTimeString = () => {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 格式化缓存时间为显示格式
 * @param {Date} cacheTime - 缓存时间对象
 * @returns {string} 格式化的时间字符串
 */
export const formatCachedTime = (cacheTime) => {
  if (!cacheTime) return getCurrentTimeString()
  
  try {
    return cacheTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.warn('格式化缓存时间失败:', error)
    return getCurrentTimeString()
  }
}

/**
 * 更新页面的最后更新时间
 * @param {Object} refs - Vue refs对象 {lastUpdateTime}
 * @param {Object} store - store实例（可选，用于获取准确的更新时间）
 */
export const updatePageTime = (refs, store = null) => {
  const { lastUpdateTime } = refs
  
  if (store && store.getUpdateTime) {
    // 优先使用store中的更新时间（数据实际更新时间）
    const storeTime = store.getUpdateTime()
    if (storeTime) {
      lastUpdateTime.value = formatCachedTime(storeTime)
      return
    }
  }
  
  // 如果没有store时间，使用当前时间
  lastUpdateTime.value = getCurrentTimeString()
}

// 默认导出
export default {
  formatTime,
  getRelativeTime,
  formatCustomTime,
  formatTimeRange,
  isToday,
  isThisWeek,
  getTimestamp,
  getCurrentTimeString,
  formatCachedTime,
  updatePageTime,
  TIME_FORMATS
}