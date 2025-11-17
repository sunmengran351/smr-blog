-- 个人博客数据库设计
-- 包含3张表：文章表、分类表、评论表

-- 分类表
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文章表
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category_id UUID REFERENCES categories(id),
    cover_image VARCHAR(500),
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论表
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    author_name VARCHAR(50) NOT NULL,
    author_email VARCHAR(100),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入示例数据
INSERT INTO categories (name, description) VALUES
('技术文章', '关于编程、开发、技术的文章'),
('生活随笔', '日常生活中的思考和感悟'),
('学习笔记', '学习过程中的心得和总结');

INSERT INTO articles (title, content, summary, category_id, cover_image) VALUES
('Vue3 入门指南', 'Vue3 是一个优秀的渐进式 JavaScript 框架...', '介绍 Vue3 的基本概念和使用方法', (SELECT id FROM categories WHERE name = '技术文章'), 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400'),
('我的编程学习之路', '从零开始学习编程的历程和心得...', '分享个人学习编程的经历', (SELECT id FROM categories WHERE name = '生活随笔'), 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400'),
('JavaScript ES6 新特性', '详细讲解 ES6 中的新特性...', '深入解析 ES6 的语法特性', (SELECT id FROM categories WHERE name = '技术文章'), 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400');

INSERT INTO comments (article_id, author_name, author_email, content) VALUES
((SELECT id FROM articles WHERE title = 'Vue3 入门指南'), '张三', 'zhangsan@example.com', '这篇文章对我帮助很大！'),
((SELECT id FROM articles WHERE title = 'Vue3 入门指南'), '李四', 'lisi@example.com', '写得很好，期待更多教程');

-- 创建索引优化查询性能
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_published ON articles(is_published, created_at);
CREATE INDEX idx_comments_article ON comments(article_id);