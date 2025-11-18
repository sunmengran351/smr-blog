import { createClient } from '@supabase/supabase-js'

// 硬编码配置确保连接成功
const SUPABASE_URL = 'https://talufbfkwrdrpwbzurcu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbHVmYmZrd3JkcnB3Ynp1cmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNjMxODUsImV4cCI6MjA3ODkzOTE4NX0.tpBu2CSiKJo0Z-YjPcF2Oey8qyhPlinuzJA6Ld8CTo0'

console.log('🚀 初始化Supabase客户端...')
console.log('📍 URL:', SUPABASE_URL)
console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...')

// 创建客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 测试连接
supabase.from('articles').select('count').then(({ error }) => {
  if (error) {
    console.error('❌ Supabase连接失败:', error)
  } else {
    console.log('✅ Supabase连接成功!')
  }
})

// 最终版API服务
export const apiService = {
  // 获取文章
  async getArticles(page = 1, pageSize = 10) {
    console.log('🔄 apiService.getArticles 调用:', { page, pageSize })
    
    try {
      // 最简单的查询方式
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      console.log('📡 查询参数:', { from, to })
      
      const { data, error, count } = await supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (error) {
        console.error('❌ 文章查询失败:', error)
        throw error
      }
      
      console.log('✅ 文章查询成功:', {
        数量: data?.length || 0,
        总数: count,
        数据: data?.slice(0, 1)
      })
      
      // 获取分类信息
      const categoriesResult = await supabase
        .from('categories')
        .select('*')
      
      if (categoriesResult.error) {
        console.error('❌ 分类查询失败:', categoriesResult.error)
      } else {
        console.log('✅ 分类查询成功:', categoriesResult.data?.length, '个分类')
      }
      
      // 组合数据
      const articles = (data || []).map(article => {
        const category = categoriesResult.data?.find(cat => cat.id === article.category_id)
        return {
          ...article,
          categories: category ? { name: category.name } : { name: '未分类' }
        }
      })
      
      console.log('✅ 数据组合完成:', articles.map(a => ({ title: a.title, category: a.categories.name })))
      
      return {
        list: articles,
        pagination: {
          total: count || 0,
          pageNum: page,
          pageSize: pageSize,
          pages: Math.ceil((count || 0) / pageSize)
        }
      }
      
    } catch (err) {
      console.error('💥 getArticles 异常:', err)
      throw new Error(`获取文章失败: ${err.message}`)
    }
  },

  // 获取分类
  async getCategories() {
    console.log('🔄 apiService.getCategories 调用')
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('❌ 分类查询失败:', error)
        throw error
      }
      
      console.log('✅ getCategories 成功:', data?.length || 0, '个分类')
      console.log('📋 分类列表:', data?.map(c => c.name))
      
      return data || []
      
    } catch (err) {
      console.error('💥 getCategories 异常:', err)
      throw new Error(`获取分类失败: ${err.message}`)
    }
  },

  // 根据分类获取文章
  async getArticlesByCategory(categoryId, page = 1, pageSize = 10) {
    console.log('🔄 apiService.getArticlesByCategory 调用:', { categoryId, page })
    
    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, error, count } = await supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (error) {
        console.error('❌ 分类文章查询失败:', error)
        throw error
      }
      
      // 获取分类信息
      const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()
      
      // 组合数据
      const articles = (data || []).map(article => ({
        ...article,
        categories: category ? { name: category.name } : { name: '未分类' }
      }))
      
      console.log('✅ getArticlesByCategory 成功:', {
        分类ID: categoryId,
        分类名: category?.name,
        文章数: articles.length,
        总数: count
      })
      
      return {
        list: articles,
        pagination: {
          total: count || 0,
          pageNum: page,
          pageSize: pageSize,
          pages: Math.ceil((count || 0) / pageSize)
        }
      }
      
    } catch (err) {
      console.error('💥 getArticlesByCategory 异常:', err)
      throw new Error(`获取分类文章失败: ${err.message}`)
    }
  },

  // 获取单个文章
  async getArticle(id) {
    console.log('🔄 apiService.getArticle 调用:', { id })
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('❌ 文章详情查询失败:', error)
        throw error
      }
      
      // 获取分类信息
      if (data && data.category_id) {
        const { data: category } = await supabase
          .from('categories')
          .select('*')
          .eq('id', data.category_id)
          .single()
        
        data.categories = category ? { name: category.name } : { name: '未分类' }
      }
      
      // 更新阅读量
      await supabase
        .from('articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)
      
      console.log('✅ getArticle 成功:', data?.title)
      
      return data
      
    } catch (err) {
      console.error('💥 getArticle 异常:', err)
      throw new Error(`获取文章详情失败: ${err.message}`)
    }
  }
}

export default apiService