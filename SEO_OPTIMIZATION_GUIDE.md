# SEO优化指南

## 概述
本指南总结了为物理演示网站实施的SEO优化措施，包括元标签优化、结构化数据、社交分享优化等方面。

## 已实施的优化措施

### 1. 基础SEO元标签
- **标题优化**：页面标题格式改为"页面标题 - 物理演示网站"
- **描述标签**：每个页面都有独特的描述内容
- **关键词标签**：针对不同页面类型设置相关关键词
- **规范URL**：设置canonical URL避免重复内容
- **视口设置**：确保移动端友好

### 2. Open Graph社交分享标签
```html
<meta property="og:title" content="<%= title %> - 物理演示网站">
<meta property="og:description" content="<%= description %>">
<meta property="og:image" content="<%= ogImage || '/images/og-image.jpg' %>">
<meta property="og:url" content="<%= canonicalUrl || config.siteUrl %>">
<meta property="og:type" content="website">
```

### 3. Twitter Card标签
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<%= title %> - 物理演示网站">
<meta name="twitter:description" content="<%= description %>">
<meta name="twitter:image" content="<%= ogImage || '/images/twitter-image.jpg' %>">
```

### 4. 结构化数据（Schema.org）

#### 首页结构化数据
- **WebPage**：描述网站的基本信息
- **BreadcrumbList**：面包屑导航结构
- **Organization**：网站所有者信息

#### 演示页面结构化数据
- **LearningResource**：学习资源类型
- **WebPage**：页面基本信息
- **BreadcrumbList**：面包屑导航

### 5. 页面类型优化

#### 首页
- 标题："物理演示网站 - 交互式物理学习平台"
- 描述："探索物理世界的奇妙现象，通过交互式演示学习力学、光学、电磁学和热学等物理知识"
- 关键词：物理演示,交互式学习,物理教学,力学,光学,电磁学,热学

#### 分类页面
- 标题："分类名称 - 物理演示网站"
- 描述："探索分类名称相关的物理演示，包括子项目列表等交互式演示"
- 关键词：物理演示,分类名称,交互式学习,物理教学

#### 演示页面
- 标题："演示标题 - 物理演示网站"
- 描述：演示配置中的描述字段
- 关键词：物理演示,演示标题,交互式学习,物理教学

## 技术实现

### 构建脚本优化
在`scripts/build.js`中添加了：
- `getDefaultStructuredData()`：生成默认结构化数据
- `getDemoStructuredData()`：生成演示页面结构化数据
- 为每个页面类型添加SEO相关数据字段

### 模板优化
在`templates/layout.ejs`中添加了：
- 完整的SEO元标签
- 条件加载结构化数据
- 优化的资源加载方式

## 推荐的进一步优化

### 1. 图片优化
- 为每个页面创建独特的OG图片
- 压缩和优化所有图片资源
- 添加alt标签到所有图片

### 2. 内容优化
- 确保每个演示都有详细、独特的内容描述
- 添加更多相关关键词到演示内容中
- 创建内部链接结构

### 3. 性能优化
- 启用Gzip压缩
- 优化CSS和JavaScript文件
- 实现懒加载

### 4. 技术SEO
- 创建sitemap.xml
- 设置robots.txt
- 添加Google Analytics跟踪代码

## 验证工具

使用以下工具验证SEO优化效果：
- Google Rich Results Test
- Google Search Console
- Facebook Sharing Debugger
- Twitter Card Validator

## 维护建议

1. **定期更新**：保持内容新鲜度
2. **监控排名**：使用SEO工具监控关键词排名
3. **用户反馈**：收集用户反馈优化内容
4. **技术维护**：定期检查结构化数据有效性

通过以上优化措施，网站将获得更好的搜索引擎可见性和社交分享效果。