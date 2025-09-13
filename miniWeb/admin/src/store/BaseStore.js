/**
 * 通用轻量级数据缓存Store基类
 * 提供统一的数据缓存、过期检查、loading状态管理
 */
class BaseStore {
  constructor(name, options = {}) {
    this.name = name
    this.data = null
    this.timestamp = null
    this.loading = false
    
    // 配置选项
    this.options = {
      // 缓存过期时间（毫秒），默认1天
      expireTime: options.expireTime || 24 * 60 * 60 * 1000,
      // 是否启用localStorage持久化
      enablePersist: options.enablePersist || false,
      // localStorage的key前缀
      persistKey: options.persistKey || `store_${name}`,
      // 是否只检查日期（忽略具体时间）
      dayOnly: options.dayOnly || false,
      // 调试模式
      debug: options.debug || false
    }

    // 如果启用持久化，尝试从localStorage恢复数据
    if (this.options.enablePersist) {
      this.loadFromPersist()
    }

    if (this.options.debug) {
      console.log(`[BaseStore] ${this.name} 初始化完成`, this.options)
    }
  }

  /**
   * 检查数据是否有效（未过期）
   */
  isDataValid() {
    if (!this.data || !this.timestamp) {
      return false
    }

    const now = Date.now()
    const dataTime = this.timestamp

    if (this.options.dayOnly) {
      // 只检查日期，忽略具体时间（适用于按天更新的数据）
      const today = new Date(now)
      const dataDate = new Date(dataTime)
      
      return (
        today.getFullYear() === dataDate.getFullYear() &&
        today.getMonth() === dataDate.getMonth() &&
        today.getDate() === dataDate.getDate()
      )
    } else {
      // 检查具体的过期时间
      return (now - dataTime) < this.options.expireTime
    }
  }

  /**
   * 获取缓存的数据
   */
  getData() {
    if (this.isDataValid()) {
      if (this.options.debug) {
        console.log(`[BaseStore] ${this.name} 返回缓存数据`)
      }
      return this.data
    }
    
    if (this.options.debug) {
      console.log(`[BaseStore] ${this.name} 缓存数据已过期或不存在`)
    }
    return null
  }

  /**
   * 设置数据并更新时间戳
   */
  setData(data) {
    this.data = data
    this.timestamp = Date.now()
    
    // 如果启用持久化，保存到localStorage
    if (this.options.enablePersist) {
      this.saveToPersist()
    }

    if (this.options.debug) {
      console.log(`[BaseStore] ${this.name} 数据已更新`, { 
        dataSize: JSON.stringify(data).length,
        timestamp: new Date(this.timestamp)
      })
    }
  }

  /**
   * 清除数据
   */
  clearData() {
    this.data = null
    this.timestamp = null
    
    // 清除持久化数据
    if (this.options.enablePersist) {
      this.clearPersist()
    }

    if (this.options.debug) {
      console.log(`[BaseStore] ${this.name} 数据已清除`)
    }
  }

  /**
   * 设置加载状态
   */
  setLoading(loading) {
    this.loading = loading
    
    if (this.options.debug) {
      console.log(`[BaseStore] ${this.name} loading状态: ${loading}`)
    }
  }

  /**
   * 获取加载状态
   */
  isLoading() {
    return this.loading
  }

  /**
   * 获取数据更新时间
   */
  getUpdateTime() {
    return this.timestamp ? new Date(this.timestamp) : null
  }

  /**
   * 获取数据年龄（毫秒）
   */
  getDataAge() {
    return this.timestamp ? Date.now() - this.timestamp : null
  }

  /**
   * 检查数据是否存在（不检查过期）
   */
  hasData() {
    return this.data !== null && this.data !== undefined
  }

  /**
   * 获取Store状态信息
   */
  getStatus() {
    return {
      name: this.name,
      hasData: this.hasData(),
      isValid: this.isDataValid(),
      isLoading: this.isLoading(),
      updateTime: this.getUpdateTime(),
      dataAge: this.getDataAge(),
      options: this.options
    }
  }

  /**
   * 保存数据到localStorage
   */
  saveToPersist() {
    try {
      const persistData = {
        data: this.data,
        timestamp: this.timestamp,
        version: '1.0'
      }
      localStorage.setItem(this.options.persistKey, JSON.stringify(persistData))
    } catch (error) {
      console.error(`[BaseStore] ${this.name} 保存到localStorage失败:`, error)
    }
  }

  /**
   * 从localStorage加载数据
   */
  loadFromPersist() {
    try {
      const persistData = localStorage.getItem(this.options.persistKey)
      if (persistData) {
        const parsed = JSON.parse(persistData)
        this.data = parsed.data
        this.timestamp = parsed.timestamp
        
        if (this.options.debug) {
          console.log(`[BaseStore] ${this.name} 从localStorage恢复数据`, {
            timestamp: new Date(this.timestamp),
            isValid: this.isDataValid()
          })
        }
      }
    } catch (error) {
      console.error(`[BaseStore] ${this.name} 从localStorage加载失败:`, error)
      this.clearPersist()
    }
  }

  /**
   * 清除localStorage中的持久化数据
   */
  clearPersist() {
    try {
      localStorage.removeItem(this.options.persistKey)
    } catch (error) {
      console.error(`[BaseStore] ${this.name} 清除localStorage失败:`, error)
    }
  }

  /**
   * 重置Store到初始状态
   */
  reset() {
    this.clearData()
    this.setLoading(false)
    
    if (this.options.debug) {
      console.log(`[BaseStore] ${this.name} 已重置`)
    }
  }
}

export default BaseStore