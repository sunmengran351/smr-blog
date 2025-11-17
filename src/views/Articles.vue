<template>
  <div class="articles">
    <!-- 页面标题和筛选 -->
    <div class="page-header">
      <h1>文章列表</h1>
      <p>探索所有技术文章、学习笔记和生活感悟</p>
      
      <!-- 分类筛选 -->
      <div class="filter-section">
        <button 
          v-for="category in categories" 
          :key="category.id"
          :class="['filter-btn', { active: selectedCategory === category.id }]"
          @click="toggleCategory(category.id)"
        >
          {{ category.name }}
        </button>
        <button 
          :class="['filter-btn', { active: selectedCategory === null }]"
          @click="clearFilter"
        >
          全部
        </button>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="articles-grid" v-if="articles.length > 0">
      <article 
        v-for="article in articles" 
        :key="article.id" 
        class="article-card"
        @click="$router.push(`/article/${article.id}`)"
      >
        <div class="article-image">
          <img v-if="article.cover_image" :src="article.cover_image" :alt="article.title" />
          <div v-else class="image-placeholder">📝</div>
        </div>
        <div class="article-content">
          <div class="article-meta">
            <span class="category">{{ article.categories.name }}</span>
            <span class="date">{{ formatDate(article.created_at) }}</span>
          </div>
          <h2 class="article-title">{{ article.title }}</h2>
          <p class="article-summary">{{ article.summary || article.content.substring(0, 150) + '...' }}</p>
          <div class="article-footer">
            <span class="views">👁️ {{ article.view_count || 0 }} 阅读</span>
            <button class="read-more" @click.stop="$router.push(`/article/${article.id}`)">
              阅读全文
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>暂无文章</p>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination && pagination.pages > 1">
      <button 
        :disabled="pagination.pageNum <= 1"
        @click="changePage(pagination.pageNum - 1)"
        class="pagination-btn"
      >
        上一页
      </button>
      
      <span class="page-info">
        第 {{ pagination.pageNum }} 页，共 {{ pagination.pages }} 页
      </span>
      
      <button 
        :disabled="pagination.pageNum >= pagination.pages"
        @click="changePage(pagination.pageNum + 1)"
        class="pagination-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { apiService } from '../services/supabase'

export default {
  name: 'Articles',
  data() {
    return {
      articles: [],
      categories: [],
      selectedCategory: null,
      loading: false,
      pagination: null
    }
  },
  async mounted() {
    await this.loadCategories()
    await this.loadArticles()
  },
  methods: {
    async loadCategories() {
      try {
        this.categories = await apiService.getCategories()
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    },

    async loadArticles(page = 1) {
      this.loading = true
      try {
        let articlesData
        
        if (this.selectedCategory) {
          articlesData = await apiService.getArticlesByCategory(this.selectedCategory, page)
        } else {
          articlesData = await apiService.getArticles(page)
        }
        
        this.articles = articlesData.list
        this.pagination = articlesData.pagination
      } catch (error) {
        console.error('加载文章失败:', error)
      } finally {
        this.loading = false
      }
    },

    toggleCategory(categoryId) {
      if (this.selectedCategory === categoryId) {
        this.selectedCategory = null
      } else {
        this.selectedCategory = categoryId
      }
      this.loadArticles(1)
    },

    clearFilter() {
      this.selectedCategory = null
      this.loadArticles(1)
    },

    changePage(page) {
      this.loadArticles(page)
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.articles {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.page-header p {
  font-size: 1.1rem;
  color: #64748b;
  margin-bottom: 2rem;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.filter-btn {
  background: #f1f5f9;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.filter-btn:hover {
  background: #e2e8f0;
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 文章网格 */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.article-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.article-image {
  height: 200px;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-card:hover .article-image img {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.article-content {
  padding: 1.5rem;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.date {
  color: #94a3b8;
  font-size: 0.875rem;
}

.article-title {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.article-summary {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.views {
  color: #94a3b8;
  font-size: 0.875rem;
}

.read-more {
  background: transparent;
  border: 2px solid #667eea;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.read-more:hover {
  background: #667eea;
  color: white;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 3rem;
  padding: 2rem 0;
}

.pagination-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.pagination-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination-btn:not(:disabled):hover {
  opacity: 0.8;
}

.page-info {
  color: #64748b;
  font-weight: 500;
}

/* 加载状态 */
.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 1.1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .filter-section {
    gap: 0.5rem;
  }
  
  .filter-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
  
  .article-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .read-more {
    align-self: flex-end;
  }
}
</style>