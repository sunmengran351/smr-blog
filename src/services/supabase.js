import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const apiService = {
  // 获取所有文章（分页）
  async getArticles(page = 1, pageSize = 10) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    console.log('正在获取文章...', { supabaseUrl, from, to })
    console.log('环境变量检查:', {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置'
    })
    
    try {
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
        console.error('Supabase查询错误:', error)
        throw error
      }
      
      console.log('获取文章成功:', { 
        dataLength: data?.length || 0, 
        count,
        firstArticle: data?.[0] 
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
      console.error('获取文章异常:', err)
      throw err
    }
  },

  // 获取单个文章详情
  async getArticle(id) {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        categories(name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // 更新阅读量
    await supabase
      .from('articles')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)
    
    return data
  },

  // 获取所有分类
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // 根据分类获取文章
  async getArticlesByCategory(categoryId, page = 1, pageSize = 10) {
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
    
    if (error) throw error
    
    return {
      list: data,
      pagination: {
        total: count,
        pageNum: page,
        pageSize: pageSize,
        pages: Math.ceil(count / pageSize)
      }
    }
  },

  // 获取文章评论
  async getComments(articleId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // 添加评论
  async addComment(comment) {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
    
    if (error) throw error
    return data
  }
}