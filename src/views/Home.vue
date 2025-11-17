<template>
  <div class="home">
    <!-- 英雄区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1>欢迎来到我的个人博客</h1>
        <p>这里是我分享技术知识、学习心得和生活感悟的地方</p>
        <router-link to="/articles" class="hero-button">浏览文章</router-link>
      </div>
      <div class="hero-image">
        <div class="image-placeholder">
          <span>📚</span>
        </div>
      </div>
    </section>

    <!-- 特色文章 -->
    <section class="featured-section">
      <h2>最新文章</h2>
      <div class="featured-grid" v-if="articles.length > 0">
        <article 
          v-for="article in articles" 
          :key="article.id" 
          class="featured-card"
          @click="$router.push(`/article/${article.id}`)"
        >
          <div class="card-image">
            <img v-if="article.cover_image" :src="article.cover_image" :alt="article.title" />
            <div v-else class="image-placeholder">📝</div>
          </div>
          <div class="card-content">
            <span class="category-tag">{{ article.categories?.name || '未分类' }}</span>
            <h3>{{ article.title }}</h3>
            <p>{{ article.summary || article.content.substring(0, 100) + '...' }}</p>
            <div class="card-meta">
              <span>{{ formatDate(article.created_at) }}</span>
              <span>👁️ {{ article.view_count || 0 }}</span>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="loading">
        <p>加载中...</p>
      </div>
    </section>

    <!-- 统计信息 -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <h3>{{ totalArticles }}</h3>
          <p>文章总数</p>
        </div>
        <div class="stat-item">
          <h3>{{ totalViews }}</h3>
          <p>总阅读量</p>
        </div>
        <div class="stat-item">
          <h3>{{ categories.length }}</h3>
          <p>分类数量</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { apiService } from '../services/supabase'

export default {
  name: 'Home',
  data() {
    return {
      articles: [],
      categories: [],
      totalArticles: 0,
      totalViews: 0
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        console.log('开始加载数据...')
        
        // 加载最新文章
        const articlesData = await apiService.getArticles(1, 3)
        console.log('Home组件获取到的文章数据:', articlesData)
        this.articles = articlesData.list
        
        // 加载分类
        const categoriesData = await apiService.getCategories()
        console.log('Home组件获取到的分类数据:', categoriesData)
        this.categories = categoriesData
        
        // 计算统计信息
        this.totalArticles = articlesData.pagination.total
        this.totalViews = this.articles.reduce((sum, article) => sum + (article.view_count || 0), 0)
        
        console.log('Home组件数据加载完成:', {
          articlesCount: this.articles.length,
          categoriesCount: this.categories.length,
          totalArticles: this.totalArticles,
          totalViews: this.totalViews
        })
      } catch (error) {
        console.error('Home组件加载数据失败:', error)
        // 显示友好的错误信息
        this.articles = []
        this.categories = []
      }
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
.home {
  max-width: 1200px;
  margin: 0 auto;
}

/* 英雄区域 */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  padding: 4rem 0;
  margin-bottom: 3rem;
}

.hero-content h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-content p {
  font-size: 1.2rem;
  color: #64748b;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-button {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.3s ease;
}

.hero-button:hover {
  transform: translateY(-2px);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* 特色文章区域 */
.featured-section {
  margin-bottom: 4rem;
}

.featured-section h2 {
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 2rem;
  text-align: center;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.featured-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.featured-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.card-image {
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.featured-card:hover .card-image img {
  transform: scale(1.05);
}

.card-content {
  padding: 1.5rem;
}

.category-tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.card-content h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0.75rem 0;
  line-height: 1.4;
}

.card-content p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #94a3b8;
}

/* 统计区域 */
.stats-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 3rem;
  color: white;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.stat-item h3 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-item p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 2rem 0;
  }

  .hero-content h1 {
    font-size: 2rem;
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .image-placeholder {
    width: 200px;
    height: 200px;
    font-size: 4rem;
  }
}
</style>