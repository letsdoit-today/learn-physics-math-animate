# 开发指南

## 快速开始

### 环境要求
- Node.js 14.0+
- npm 6.0+

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
# 访问 http://localhost:8080
```

### 构建生产版本
```bash
npm run build
```

## 创建新的演示模块

### 1. 创建演示目录
在 `demos/` 目录下创建新的演示文件夹：
```bash
mkdir demos/your-demo-name
```

### 2. 创建演示配置文件 (`demo.json`)
```json
{
  "title": "演示标题",
  "description": "演示描述",
  "url": "/category/subcategory/demo-name",
  "category": "物理分类",
  "difficulty": "beginner|intermediate|advanced",
}
```

### 3. 创建演示模板 (`demo.ejs`)
```ejs
<div class="demo-container">
  <h2><%= title %></h2>
  <p><%= description %></p>
  
  <!-- 演示内容 -->
  <div class="demo-content">
    <!-- 交互式演示区域 -->
  </div>
  
  <!-- 说明区域 -->
  <div class="explanation">
    <h3>物理原理</h3>
    <p>详细说明...</p>
  </div>
</div>
```

### 4. 更新导航配置
在 `data/navigation.json` 中添加新的演示链接：
```json
{
  "items": [
    {
      "title": "力学",
      "url": "/mechanics",
      "subitems": [
        {
          "title": "新演示",
          "url": "/mechanics/new-demo"
        }
      ]
    }
  ]
}
```

## 模板开发指南

### 布局模板结构
```ejs
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title><%= title %></title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="demo.css">
</head>
<body>
  <!-- 导航栏 -->
  <%- include('navigation', { navigation: navigation }) %>
  
  <!-- 面包屑导航 -->
  <%- include('breadcrumb', { breadcrumb: breadcrumb }) %>
  
  <!-- 主要内容 -->
  <main>
    <%- body %>
  </main>
  
  <!-- 页脚 -->
  <%- include('footer') %>
  
  <!-- 脚本 -->
  <script src="/js/main.js"></script>
  <script src="demo.js"></script>
</body>
</html>
```

### 可用的模板变量
- `title`: 页面标题
- `navigation`: 导航数据
- `breadcrumb`: 面包屑数据
- `body`: 页面主要内容

## CSS开发规范

### 命名规范
使用BEM命名方法：
```css
.demo-container {}
.demo-container__title {}
.demo-container--active {}
```

### 响应式断点
```css
/* 移动端优先 */
.demo {
  /* 移动端样式 */
}

@media (min-width: 768px) {
  .demo {
    /* 平板样式 */
  }
}

@media (min-width: 1024px) {
  .demo {
    /* 桌面样式 */
  }
}
```

## JavaScript开发规范

### 模块化组织
```javascript
// demo.js
class Demo {
  constructor(options) {
    this.options = options;
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.render();
  }
  
  setupEventListeners() {
    // 事件监听器设置
  }
  
  render() {
    // 渲染逻辑
  }
}

// 初始化演示
const demo = new Demo({
  container: '.demo-container'
});
```

### 错误处理
```javascript
try {
  // 可能出错的代码
} catch (error) {
  console.error('演示错误:', error);
  // 显示用户友好的错误信息
}
```

## 性能优化建议

### 1. 资源优化
- 压缩图片资源
- 使用CSS雪碧图
- 懒加载非关键资源

### 2. 代码优化
- 减少DOM操作
- 使用事件委托
- 避免重绘和重排

### 3. 缓存策略
- 设置适当的缓存头
- 使用CDN加速
- 压缩静态资源

## 调试和测试

### 调试工具
- 浏览器开发者工具
- console.log调试
- 断点调试

### 测试方法
- 手动功能测试
- 跨浏览器测试
- 移动端测试

## 部署指南

### 生产环境构建
```bash
npm run build
```

### 部署到静态托管
- 将 `dist/` 目录上传到静态托管服务
- 配置正确的MIME类型
- 设置重定向规则

## 常见问题

### Q: 演示页面无法正常显示？
A: 检查导航配置和URL路径是否正确

### Q: CSS样式不生效？
A: 检查文件路径和CSS语法

### Q: JavaScript交互无效？
A: 检查控制台错误信息和事件绑定

---

*更多问题请查看项目文档或提交Issue*