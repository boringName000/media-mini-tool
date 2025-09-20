const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 管理端获取所有用户信息 - 支持分页查询
 * 
 * 技术方案：使用游标分页，按 lastUpdateTimestamp 降序排列
 * 性能优化：
 * 1. 使用游标分页避免深分页性能问题
 * 2. 按 lastUpdateTimestamp 排序，需要建立索引
 * 3. 支持灵活的页面大小配置
 * 
 * @param {Object} event 请求参数
 * @param {number} event.pageSize 每页数量，默认20，最大100
 * @param {string} event.cursor 游标，用于分页（首次查询不传）
 * @param {string} event.direction 分页方向：'next'下一页，'prev'上一页，默认'next'
 * @param {Object} event.filters 筛选条件（可选）
 * @param {number} event.filters.status 用户状态筛选：1-正常，0-禁用
 * @param {boolean} event.filters.hasAccounts 账号筛选：true-有账号，false-无账号
 * @param {string} event.filters.keyword 关键词搜索（昵称、手机号）
 * 
 * @returns {Object} 返回结果
 * @returns {boolean} success 是否成功
 * @returns {string} message 消息
 * @returns {Array} data 用户数据列表
 * @returns {Object} pagination 分页信息
 * @returns {string} pagination.nextCursor 下一页游标
 * @returns {string} pagination.prevCursor 上一页游标
 * @returns {boolean} pagination.hasNext 是否有下一页
 * @returns {boolean} pagination.hasPrev 是否有上一页
 * @returns {number} pagination.pageSize 当前页面大小
 * @returns {number} pagination.total 总数据量（估算）
 * @returns {Object|null} globalStats 全库统计数据（仅首次查询返回）
 * @returns {number} globalStats.totalUsers 总用户数
 * @returns {number} globalStats.usersWithAccounts 有账号用户数
 * @returns {number} globalStats.disabledUsers 禁用用户数
 */
exports.main = async (event, context) => {
  console.log('admin-get-all-user-info 云函数开始执行', event)
  
  try {
    // 参数验证和默认值设置
    const {
      pageSize = 20,
      cursor = null,
      direction = 'next',
      filters = {}
    } = event
    
    // 验证页面大小
    const validPageSize = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    
    // 验证分页方向
    const validDirection = ['next', 'prev'].includes(direction) ? direction : 'next'
    
    console.log('处理后的参数:', {
      pageSize: validPageSize,
      cursor,
      direction: validDirection,
      filters
    })
    
    // 构建查询条件
    let whereCondition = {}
    
    // 用户状态筛选
    if (filters.status !== undefined && [0, 1].includes(parseInt(filters.status))) {
      whereCondition.status = parseInt(filters.status)
    }
    
    // 账号筛选（有无账号）
    if (filters.hasAccounts !== undefined) {
      if (filters.hasAccounts === true || filters.hasAccounts === 'true') {
        // 筛选有账号的用户
        whereCondition['accounts.0'] = _.exists(true)
      } else if (filters.hasAccounts === false || filters.hasAccounts === 'false') {
        // 筛选无账号的用户
        whereCondition = _.and([
          whereCondition,
          _.or([
            { accounts: _.exists(false) },
            { accounts: _.eq([]) },
            { accounts: _.size(0) }
          ])
        ])
      }
    }
    
    // 关键词搜索（昵称或手机号）
    if (filters.keyword && filters.keyword.trim()) {
      const keyword = filters.keyword.trim()
      whereCondition = _.and([
        whereCondition,
        _.or([
          { nickname: db.RegExp({ regexp: keyword, options: 'i' }) },
          { phone: db.RegExp({ regexp: keyword, options: 'i' }) }
        ])
      ])
    }
    
    console.log('查询条件:', whereCondition)
    
    // 构建基础查询
    let query = db.collection('user-info').where(whereCondition)
    
    // 排序：按 lastUpdateTimestamp 降序，_id 降序（保证稳定排序）
    // 注意：排序必须在游标筛选之前进行，确保分页一致性
    const sortOrder = validDirection === 'prev' ? 'asc' : 'desc'
    query = query.orderBy('lastUpdateTimestamp', sortOrder).orderBy('_id', sortOrder)
    
    // 游标分页逻辑
    if (cursor) {
      try {
        const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString())
        const { lastUpdateTimestamp, _id } = cursorData
        
        // 构建游标筛选条件，必须与排序顺序一致
        let cursorCondition
        if (validDirection === 'next') {
          // 下一页：查找更早的记录（降序排列中的后续记录）
          cursorCondition = _.or([
            { lastUpdateTimestamp: _.lt(new Date(lastUpdateTimestamp)) },
            _.and([
              { lastUpdateTimestamp: _.eq(new Date(lastUpdateTimestamp)) },
              { _id: _.lt(_id) }
            ])
          ])
        } else {
          // 上一页：查找更新的记录（降序排列中的前面记录）
          cursorCondition = _.or([
            { lastUpdateTimestamp: _.gt(new Date(lastUpdateTimestamp)) },
            _.and([
              { lastUpdateTimestamp: _.eq(new Date(lastUpdateTimestamp)) },
              { _id: _.gt(_id) }
            ])
          ])
        }
        
        // 将游标条件与现有筛选条件合并
        if (Object.keys(whereCondition).length > 0) {
          whereCondition = _.and([whereCondition, cursorCondition])
        } else {
          whereCondition = cursorCondition
        }
        
        // 重新应用合并后的筛选条件
        query = db.collection('user-info').where(whereCondition).orderBy('lastUpdateTimestamp', sortOrder).orderBy('_id', sortOrder)
        
      } catch (error) {
        console.error('游标解析失败:', error)
        return {
          success: false,
          message: '无效的分页游标',
          data: [],
          pagination: {
            nextCursor: null,
            prevCursor: null,
            hasNext: false,
            hasPrev: false,
            pageSize: validPageSize,
            total: 0
          }
        }
      }
    }
    
    // 查询数据（多查询一条用于判断是否有下一页）
    const queryLimit = validPageSize + 1
    const result = await query.limit(queryLimit).get()
    
    console.log('数据库查询结果:', {
      total: result.data.length,
      limit: queryLimit
    })
    
    if (!result.data) {
      return {
        success: false,
        message: '查询用户数据失败',
        data: [],
        pagination: {
          nextCursor: null,
          prevCursor: null,
          hasNext: false,
          hasPrev: false,
          pageSize: validPageSize,
          total: 0
        }
      }
    }
    
    // 处理分页数据
    let userData = result.data
    let hasNext = false
    let hasPrev = !!cursor
    
    // 如果查询到的数据超过页面大小，说明有下一页
    if (userData.length > validPageSize) {
      hasNext = true
      userData = userData.slice(0, validPageSize) // 移除多查询的那一条
    }
    
    // 如果是上一页查询，需要反转数据顺序
    if (validDirection === 'prev') {
      userData.reverse()
      // 交换 hasNext 和 hasPrev
      [hasNext, hasPrev] = [hasPrev, hasNext]
    }
    
    // 生成游标
    let nextCursor = null
    let prevCursor = null
    
    if (userData.length > 0) {
      // 下一页游标：使用最后一条记录
      if (hasNext) {
        const lastRecord = userData[userData.length - 1]
        nextCursor = Buffer.from(JSON.stringify({
          lastUpdateTimestamp: lastRecord.lastUpdateTimestamp || lastRecord.registerTimestamp,
          _id: lastRecord._id
        })).toString('base64')
      }
      
      // 上一页游标：使用第一条记录
      if (hasPrev) {
        const firstRecord = userData[0]
        prevCursor = Buffer.from(JSON.stringify({
          lastUpdateTimestamp: firstRecord.lastUpdateTimestamp || firstRecord.registerTimestamp,
          _id: firstRecord._id
        })).toString('base64')
      }
    }
    
    // 数据处理：计算统计信息
    const processedData = userData.map(user => {
      const accounts = user.accounts || []
      
      // 统计各种账号状态
      const totalAccounts = accounts.length
      const activeAccounts = accounts.filter(acc => acc.status === 1).length
      const disabledAccounts = accounts.filter(acc => acc.status === 0).length
      const pendingAuditAccounts = accounts.filter(acc => acc.auditStatus === 0).length
      const approvedAccounts = accounts.filter(acc => acc.auditStatus === 1).length
      const rejectedAccounts = accounts.filter(acc => acc.auditStatus === 2).length
      
      // 统计文章数据
      let totalPosts = 0
      let totalRejectPosts = 0
      
      accounts.forEach(account => {
        totalPosts += (account.posts || []).length
        totalRejectPosts += (account.rejectPosts || []).length
      })
      
      return {
        ...user,
        // 添加统计信息
        totalAccounts,
        activeAccounts,
        disabledAccounts,
        pendingAuditAccounts,
        approvedAccounts,
        rejectedAccounts,
        totalPosts,
        totalRejectPosts,
        // 格式化时间
        registerTimestamp: user.registerTimestamp,
        lastLoginTimestamp: user.lastLoginTimestamp,
        lastUpdateTimestamp: user.lastUpdateTimestamp
      }
    })
    
    // 获取总数据量（估算，用于前端显示）
    let totalEstimate = 0
    try {
      const countResult = await db.collection('user-info').where(whereCondition).count()
      totalEstimate = countResult.total || 0
    } catch (error) {
      console.warn('获取总数失败:', error)
      totalEstimate = userData.length
    }
    
    // 获取全库统计数据（用于数据纵览）- 优化性能，减少数据库查询
    let globalStats = {
      totalUsers: 0,
      usersWithAccounts: 0,
      disabledUsers: 0
    }
    
    try {
      // 只在首次查询（无游标）时计算全库统计，避免重复计算
      if (!cursor) {
        // 使用聚合查询一次性获取所有统计数据，提高性能
        const aggregateResult = await db.collection('user-info').aggregate()
          .group({
            _id: null,
            totalUsers: db.command.aggregate.sum(1),
            disabledUsers: db.command.aggregate.sum(
              db.command.aggregate.cond({
                if: db.command.aggregate.eq(['$status', 0]),
                then: 1,
                else: 0
              })
            ),
            usersWithAccounts: db.command.aggregate.sum(
              db.command.aggregate.cond({
                if: db.command.aggregate.gt([db.command.aggregate.size({ $ifNull: ['$accounts', []] }), 0]),
                then: 1,
                else: 0
              })
            )
          })
          .end()
        
        if (aggregateResult.list && aggregateResult.list.length > 0) {
          const stats = aggregateResult.list[0]
          globalStats.totalUsers = stats.totalUsers || 0
          globalStats.disabledUsers = stats.disabledUsers || 0
          globalStats.usersWithAccounts = stats.usersWithAccounts || 0
        }
      }
    } catch (error) {
      console.warn('获取全库统计失败，使用默认值:', error)
      // 获取失败时保持默认值 0
    }
    
    console.log('查询成功:', {
      dataCount: processedData.length,
      hasNext,
      hasPrev,
      totalEstimate,
      globalStats
    })
    
    return {
      success: true,
      message: '获取用户数据成功',
      data: processedData,
      pagination: {
        nextCursor,
        prevCursor,
        hasNext,
        hasPrev,
        pageSize: validPageSize,
        total: totalEstimate
      },
      globalStats: cursor ? null : globalStats // 只在首次查询时返回全库统计
    }
    
  } catch (error) {
    console.error('admin-get-all-user-info 执行失败:', error)
    return {
      success: false,
      message: '获取用户数据失败: ' + error.message,
      data: [],
      pagination: {
        nextCursor: null,
        prevCursor: null,
        hasNext: false,
        hasPrev: false,
        pageSize: 20,
        total: 0
      }
    }
  }
}