/**
 * 云开发使用示例
 * 展示如何在Vue组件中使用云开发功能
 */

import { 
  callCloudFunction, 
  collection, 
  database,
  cloudFunctions 
} from './cloudbase.js'

// 示例1: 调用云函数
export const exampleCallFunction = async () => {
  try {
    // 方式1: 直接调用
    const result1 = await callCloudFunction('get-user-info', { 
      userId: 'user123' 
    })
    console.log('用户信息:', result1.result)

    // 方式2: 使用封装好的函数
    const result2 = await cloudFunctions.getUserInfo('user123')
    console.log('用户信息:', result2.result)

    return result1
  } catch (error) {
    console.error('调用云函数失败:', error)
    throw error
  }
}

// 示例2: 数据库查询
export const exampleDatabaseQuery = async () => {
  try {
    // 查询所有文章
    const articles = await collection('article-mgr').get()
    console.log('所有文章:', articles.data)

    // 条件查询
    const foodArticles = await collection('article-mgr')
      .where({
        trackType: 1 // 美食赛道
      })
      .get()
    console.log('美食文章:', foodArticles.data)

    // 分页查询
    const pagedArticles = await collection('article-mgr')
      .limit(10)
      .skip(0)
      .get()
    console.log('分页文章:', pagedArticles.data)

    return articles.data
  } catch (error) {
    console.error('数据库查询失败:', error)
    throw error
  }
}

// 示例3: 数据库更新
export const exampleDatabaseUpdate = async () => {
  try {
    // 更新单个文档
    const updateResult = await collection('article-mgr')
      .doc('article-id-123')
      .update({
        status: 2, // 更新状态
        updateTime: new Date()
      })
    console.log('更新结果:', updateResult)

    // 批量更新
    const batchUpdateResult = await collection('article-mgr')
      .where({
        status: 1
      })
      .update({
        status: 2
      })
    console.log('批量更新结果:', batchUpdateResult)

    return updateResult
  } catch (error) {
    console.error('数据库更新失败:', error)
    throw error
  }
}

// 示例4: 数据库添加
export const exampleDatabaseAdd = async () => {
  try {
    const addResult = await collection('article-mgr').add({
      articleTitle: '新文章标题',
      trackType: 1,
      platformType: 1,
      status: 1,
      createTime: new Date()
    })
    console.log('添加结果:', addResult)
    return addResult
  } catch (error) {
    console.error('数据库添加失败:', error)
    throw error
  }
}

// 示例5: 在Vue组件中使用
export const vueComponentExample = {
  // 在Vue组件的methods中使用
  methods: {
    async loadArticles() {
      try {
        this.loading = true
        
        // 调用云函数获取文章信息
        const result = await callCloudFunction('get-article-info', {
          articleIds: ['ART001', 'ART002', 'ART003']
        })
        
        if (result.result.success) {
          this.articles = result.result.data
        } else {
          this.$message.error('获取文章失败: ' + result.result.message)
        }
      } catch (error) {
        console.error('加载文章失败:', error)
        this.$message.error('加载文章失败')
      } finally {
        this.loading = false
      }
    },

    async updateArticleStatus(articleId, status) {
      try {
        // 直接操作数据库
        await collection('article-mgr')
          .doc(articleId)
          .update({ status })
        
        this.$message.success('状态更新成功')
        
        // 刷新列表
        await this.loadArticles()
      } catch (error) {
        console.error('更新状态失败:', error)
        this.$message.error('更新状态失败')
      }
    },

    async addNewArticle(articleData) {
      try {
        // 调用云函数添加文章
        const result = await cloudFunctions.addArticleInfo(articleData)
        
        if (result.result.success) {
          this.$message.success('文章添加成功')
          await this.loadArticles()
        } else {
          this.$message.error('添加失败: ' + result.result.message)
        }
      } catch (error) {
        console.error('添加文章失败:', error)
        this.$message.error('添加文章失败')
      }
    }
  }
}