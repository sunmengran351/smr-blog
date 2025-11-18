import { createClient } from '@supabase/supabase-js'

// 确保环境变量正确加载
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://talufbfkwrdrpwbzurcu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbHVmYmZrd3JkcnB3Ynp1cmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNjMxODUsImV4cCI6MjA3ODkzOTE4NX0.tpBu2CSiKJo0Z-YjPcF2Oey8qyhPlinuzJA6Ld8CTo0'

console.log('🔧 Supabase配置:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'null'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const apiServiceFixed = {
  // 获取所有文章（分页）- 修复版本
  async getArticles(page = 1, pageSize = 10) {
    try {
      console.log('🔄 开始获取文章...', { page, pageSize })
      
      // 确保环境变量正确
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL或API密钥未设置')
      }
      
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      console.log('📡 发起Supabase查询...', { from, to })
      
      const { data, error, count } = await supabase
        .from('articles')
        .select(`
          *,
          categories(name)
        `, { count: 'exact' })
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (error) {
        console.error('❌ Supabase查询错误:', error)
        throw new Error(`数据库查询失败: ${error.message}`)
      }
      
      console.log('✅ 文章查询成功:', {
        文章数量: data?.length || 0,
        总数: count,
        第一篇文章: data?.[0] ? {
          id: data[0].id,
          标题: data[0].title,
          分类: data[0].categories?.name
        } : null
      })
      
      // 确保返回正确格式的数据
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
      throw new Error(`文章加载失败: ${err.message}`)
    }
  },

  // 获取所有分类 - 修复版本
  async getCategories() {
    try {
      console.log('🔄 开始获取分类...')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('❌ 分类查询错误:', error)
        throw new Error(`分类查询失败: ${error.message}`)
      }
      
      console.log('✅ 分类查询成功:', {
        数量: data?.length || 0,
        分类列表: data?.map(c => c.name) || []
      })
      
      return data || []
      
    } catch (err) {
      console.error('💥 获取分类异常:', err)
      throw new Error(`分类加载失败: ${err.message}`)
    }
  },

  // 根据分类获取文章 - 修复版本
  async getArticlesByCategory(categoryId, page = 1, pageSize = 10) {
    try {
      console.log('🔄 开始获取分类文章...', { categoryId, page })
      
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, error, count } = await supabase
        .from('articles')
        .select(`
          *,
          categories(name)
        `, { count: 'exact' })
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (error) {
        console.error('❌ 分类文章查询错误:', error)
        throw new Error(`分类文章查询失败: ${error.message}`)
      }
      
      console.log('✅ 分类文章查询成功:', {
        分类ID: categoryId,
        文章数量: data?.length || 0,
        总数: count
      })
      
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
      console.error('💥 获取分类文章异常:', err)
      throw new Error(`分类文章加载失败: ${err.message}`)
    }
  },

  // 获取单个文章详情 - 修复版本
  async getArticle(id) {
    try {
      console.log('🔄 开始获取文章详情...', { id })
      
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          categories(name)
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('❌ 文章详情查询错误:', error)
        throw new Error(`文章详情查询失败: ${error.message}`)
      }
      
      console.log('✅ 文章详情查询成功:', {
        标题: data?.title,
        分类: data?.categories?.name
      })
      
      // 更新阅读量
      await supabase
        .from('articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)
      
      return data
      
    } catch (err) {
      console.error('💥 获取文章详情异常:', err)
      throw new Error(`文章详情加载失败: ${err.message}`)
    }
  },

  // 获取文章评论 - 修复版本
  async getComments(articleId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('获取评论失败:', err)
      throw new Error(`评论加载失败: ${err.message}`)
    }
  },

  // 添加评论 - 修复版本
  async addComment(comment) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([comment])
        .select()
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('添加评论失败:', err)
      throw new Error(`评论添加失败: ${err.message}`)
    }
  }
}

// 默认导出修复版本的服务
export default apiServiceFixed