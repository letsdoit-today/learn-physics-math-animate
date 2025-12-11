# 物理演示网站框架

基于EJS模板引擎的物理演示网站框架，用于快速开发物理演示网站。

## 功能特点

- 提供基础的页面布局结构，包括左侧导航栏、右上面包屑导航、右中主要内容区域和右下页脚
- 支持动态加载导航内容，通过JSON配置文件管理导航项
- 实现响应式设计，适配不同设备屏幕尺寸
- 基于EJS模板引擎生成静态页面

## 项目结构

```
├── templates/          # EJS模板文件
│   ├── layout.ejs      # 主布局模板
│   ├── navigation.ejs  # 导航栏模板
│   ├── breadcrumb.ejs  # 面包屑导航模板
│   ├── footer.ejs      # 页脚模板
│   └── demo.ejs        # 演示内容模板
├── data/               # 数据文件
│   └── navigation.json # 导航配置
├── public/             # 静态资源
│   └── css/
│       └── style.css   # 基础样式
├── demos/              # 演示配置文件
├── build.js            # 构建脚本
└── package.json        # 项目配置
```

## 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 配置导航

编辑 `data/navigation.json` 文件，修改导航项：

```json
{
  "items": [
    {
      "title": "分类名称",
      "url": "/category-url",
      "active": false,
      "subitems": [
        {
          "title": "演示名称",
          "url": "/category-url/demo-url",
          "active": false
        }
      ]
    }
  ]
}
```

### 3. 创建演示

在 `demos/` 目录下创建演示配置文件，例如 `buoyancy.json`：

```json
{
  "title": "浮力演示",
  "url": "/mechanics/buoyancy",
  "description": "演示物体在液体中的浮力现象",
  "explanation": "浮力是物体在流体中所受到的向上的力，大小等于物体排开的流体的重量。",
}
```

### 4. 构建网站

```bash
npm run build
```

### 5. 启动开发服务器

```bash
npm run dev
```

## 自定义样式和脚本

可以在 `public/css/` 和 `public/js/` 目录下添加自定义的CSS和JavaScript文件，并在演示配置中引用它们。

## 添加新演示

1. 在 `demos/` 目录下创建新的JSON配置文件
2. 在 `data/navigation.json` 中添加对应的导航项
3. 在 `public/css/` 和 `public/js/` 目录下添加演示所需的样式和脚本
4. 运行 `npm run build` 生成静态页面

## 许可证

MIT