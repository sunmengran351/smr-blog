<template>
  <div class="article-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <h2>文章不存在</h2>
      <p>抱歉，您访问的文章不存在或已被删除。</p>
      <router-link to="/articles" class="back-link">返回文章列表</router-link>
    </div>

    <!-- 文章内容 -->
    <div v-else-if="article" class="article-content">
      <!-- 返回按钮 -->
      <div class="back-nav">
        <button @click="$router.go(-1)" class="back-btn">
          ← 返回
        </button>
      </div>

      <!-- 文章头部 -->
      <header class="article-header">
        <div class="article-meta">
          <span class="category">{{ article.categories?.name }}</span>
          <span class="date">{{ formatDate(article.created_at) }}</span>
          <span class="views">👁️ {{ article.view_count || 0 }} 阅读</span>
        </div>
        <h1 class="article-title">{{ article.title }}</h1>
        <p class="article-summary" v-if="article.summary">{{ article.summary }}</p>
      </header>

      <!-- 封面图片 -->
      <div class="cover-image" v-if="article.cover_image">
        <img :src="article.cover_image" :alt="article.title" />
      </div>

      <!-- 文章正文 -->
      <div class="article-body">
        <div class="content" v-html="formatContent(article.content)"></div>
      </div>

      <!-- 评论区域 -->
      <section class="comments-section">
        <h2>评论</h2>
        
        <!-- 评论表单 -->
        <div class="comment-form">
          <h3>发表评论</h3>
          <form @submit.prevent="submitComment">
            <div class="form-group">
              <label for="authorName">姓名 *</label>
              <input 
                type="text" 
                id="authorName" 
                v-model="commentForm.authorName" 
                required 
                placeholder="请输入您的姓名"
              />
            </div>
            <div class="form-group">
              <label for="authorEmail">邮箱</label>
              <input 
                type="email" 
                id="authorEmail" 
                v-model="commentForm.authorEmail" 
                placeholder="请输入您的邮箱"
              />
            </div>
            <div class="form-group">
              <label for="commentContent">评论内容 *</label>
              <textarea 
                id="commentContent" 
                v-model="commentForm.content" 
                required 
                rows="4" 
                placeholder="请输入您的评论..."
              ></textarea>
            </div>
            <button type="submit" :disabled="submitting" class="submit-btn">
              {{ submitting ? '提交中...' : '发表评论' }}
            </button>
          </form>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list" v-if="comments.length > 0">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author_name }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            </div>
            <div class="comment-content">
              {{ comment.content }}
            </div>
          </div>
        </div>

        <!-- 空评论状态 -->
        <div v-else class="no-comments">
          <p>暂无评论，快来发表第一条评论吧！</p>
        </div>
      </section>

      <!-- 相关文章 -->
      <section class="related-articles" v-if="relatedArticles.length > 0">
        <h2>相关文章</h2>
        <div class="related-grid">
          <div 
            v-for="related in relatedArticles" 
            :key="related.id" 
            class="related-card"
            @click="$router.push(`/article/${related.id}`)"
          >
            <h3>{{ related.title }}</h3>
            <p>{{ related.summary || related.content.substring(0, 80) + '...' }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { apiService } from '../services/supabase'

export default {
  name: 'ArticleDetail',
  data() {
    return {
      article: null,
      comments: [],
      relatedArticles: [],
      loading: true,
      error: false,
      submitting: false,
      commentForm: {
        authorName: '',
        authorEmail: '',
        content: ''
    }
    }
  },
  async mounted() {
    await this.loadArticle()
  },
  watch: {
    '$route.params.id': {
      handler: 'loadArticle',
      immediate: true
    }
  },
  methods: {
    async loadArticle() {
      this.loading = true
      this.error = false
      
      try {
        const articleId = this.$route.params.id
        this.article = await apiService.getArticle(articleId)
        
        // 加载评论
        this.comments = await apiService.getComments(articleId)
        
        // 加载相关文章（同一分类的文章）
        if (this.article.category_id) {
          const relatedData = await apiService.getArticlesByCategory(this.article.category_id, 1, 3)
          this.relatedArticles = relatedData.list.filter(article => article.id !== articleId)
        }
      } catch (error) {
        console.error('加载文章失败:', error)
        this.error = true
      } finally {
        this.loading = false
      }
    },

    async submitComment() {
      if (!this.commentForm.authorName || !this.commentForm.content) {
        alert('请填写姓名和评论内容')
        return
      }

      this.submitting = true
      
      try {
        const comment = {
          article_id: this.article.id,
          author_name: this.commentForm.authorName,
          author_email: this.commentForm.authorEmail || null,
          content: this.commentForm.content
        }

        await apiService.addComment(comment)
        
        // 清空表单
        this.commentForm = {
          authorName: '',
          authorEmail: '',
          content: ''
        }
        
        // 重新加载评论
        this.comments = await apiService.getComments(this.article.id)
        
        alert('评论发表成功！')
      } catch (error) {
        console.error('发表评论失败:', error)
        alert('发表评论失败，请稍后重试')
      } finally {
        this.submitting = false
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatContent(content) {
      // 简单的文本格式化，将换行转换为段落
      if (!content) return ''
      return content.replace(/\n/g, '<br>')
    }
  }
}
</script>

<style scoped>
.article-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 加载和错误状态 */
.loading, .error {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.error h2 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

/* 返回导航 */
.back-nav {
  margin-bottom: 2rem;
}

.back-btn {
  background: #f1f5f9;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background: #e2e8f0;
}

/* 文章头部 */
.article-header {
  margin-bottom: 2rem;
}

.article-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.category {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.date, .views {
  color: #94a3b8;
  font-size: 0.875rem;
}

.article-title {
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.article-summary {
  font-size: 1.2rem;
  color: #64748b;
  line-height: 1.6;
}

/* 封面图片 */
.cover-image {
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
}

.cover-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

/* 文章正文 */
.article-body {
  margin-bottom: 3rem;
}

.content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #374151;
}

.content p {
  margin-bottom: 1.5rem;
}

.content br {
  margin-bottom: 1.5rem;
  display: block;
  content: '';
}

/* 评论区域 */
.comments-section {
  border-top: 2px solid #e2e8f0;
  padding-top: 3rem;
  margin-bottom: 3rem;
}

.comments-section h2 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 2rem;
}

/* 评论表单 */
.comment-form {
  background: #f8fafc;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.comment-form h3 {
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.3s ease;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  opacity: 0.9;
}

/* 评论列表 */
.comment-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: 600;
  color: #1e293b;
}

.comment-date {
  color: #94a3b8;
  font-size: 0.875rem;
}

.comment-content {
  color: #374151;
  line-height: 1.6;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

/* 相关文章 */
.related-articles {
  border-top: 2px solid #e2e8f0;
  padding-top: 3rem;
}

.related-articles h2 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 2rem;
}

.related-grid {
  display: grid;
  gap: 1rem;
}

.related-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.related-card:hover {
  background: #e2e8f0;
}

.related-card h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.related-card p {
  color: #64748b;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .article-title {
    font-size: 2rem;
  }

  .cover-image img {
    height: 250px;
  }

  .article-meta {
    gap: 0.5rem;
  }

  .comment-form {
    padding: 1.5rem;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>