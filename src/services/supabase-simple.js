import { createClient } from '@supabase/supabase-js'

// 使用默认值作为备用
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://talufbfkwrdrpwbzurcu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbHVmYmZrd3JkcnB3Ynp1cmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNjMxODUsImV4cCI6MjA3ODkzOTE4NX0.tpBu2CSiKJo0Z-YjPcF2Oey8qyhPlinuzJA6Ld8CTo0'

console.log('🔧 Supabase客户端初始化:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyStart: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'null'
})

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 简化版API服务
export const apiServiceSimple = {
  // 获取文章
  async getArticles(page = 1, pageSize = 10) {
    console.log('🔄 开始获取文章...', { page, pageSize })
    
    try {
      // 先测试连接
      console.log('🔍 测试数据库连接...')
      
      // 使用更简单的查询方式
      const { data, error, count } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)
      
      if (error) {
        console.error('❌ 查询文章失败:', error)
        throw new Error(`文章查询失败: ${error.message}`)
      }
      
      console.log('✅ 文章查询成功:', {
        数量: data?.length || 0,
        总数: count,
        第一篇: data?.[0]?.title
      })
      
      // 如果有文章，再查询分类
      if (data && data.length > 0) {
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
        
        // 为每篇文章添加分类信息
        const articlesWithCategories = data.map(article => {
          const category = categories?.find(cat => cat.id === article.category_id)
          return {
            ...article,
            categories: category ? { name: category.name } : { name: '未分类' }
          }
        })
        
        console.log('✅ 分类信息已添加')
        
        return {
          list: articlesWithCategories,
          pagination: {
            total: count || 0,
            pageNum: page,
            pageSize: pageSize,
            pages: Math.ceil((count || 0) / pageSize)
          }
        }
      }
      
      return {
        list: data || [],
        pagination: {
          total: count || 0,
          pageNum: page,
          pageSize: pageSize,
          pages: Math.ceil((count || 0) / pageSize)
        }
      }
      
    } catch (err) {
      console.error('💥 获取文章异常:', err)
      throw err
    }
  },

  // 获取分类
  async getCategories() {
    console.log('🔄 开始获取分类...')
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('❌ 查询分类失败:', error)
        throw new Error(`分类查询失败: ${error.message}`)
      }
      
      console.log('✅ 分类查询成功:', {
        数量: data?.length || 0,
        分类: data?.map(c => c.name)
      })
      
      return data || []
      
    } catch (err) {
      console.error('💥 获取分类异常:', err)
      throw err
    }
  },

  // 根据分类获取文章
  async getArticlesByCategory(categoryId, page = 1, pageSize = 10) {
    console.log('🔄 开始获取分类文章...', { categoryId, page })
    
    try {
      const { data, error, count } = await supabase
        .from('articles')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)
      
      if (error) {
        console.error('❌ 查询分类文章失败:', error)
        throw new Error(`分类文章查询失败: ${error.message}`)
      }
      
      // 获取分类信息
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()
      
      // 为文章添加分类信息
      const articlesWithCategory = (data || []).map(article => ({
        ...article,
        categories: categories ? { name: categories.name } : { name: '未分类' }
      }))
      
      console.log('✅ 分类文章查询成功:', {
        分类ID: categoryId,
        分类名: categories?.name,
        文章数量: articlesWithCategory.length,
        总数: count
      })
      
      return {
        list: articlesWithCategory,
        pagination: {
          total: count || 0,
          pageNum: page,
          pageSize: pageSize,
          pages: Math.ceil((count || 0) / pageSize)
        }
      }
      
    } catch (err) {
      console.error('💥 获取分类文章异常:', err)
      throw err
    }
  },

  // 获取单个文章
  async getArticle(id) {
    console.log('🔄 开始获取文章详情...', { id })
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('❌ 查询文章详情失败:', error)
        throw new Error(`文章详情查询失败: ${error.message}`)
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
      
      console.log('✅ 文章详情查询成功:', data?.title)
      
      // 更新阅读量
      await supabase
        .from('articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)
      
      return data
      
    } catch (err) {
      console.error('💥 获取文章详情异常:', err)
      throw err
    }
  }
}

export default apiServiceSimple