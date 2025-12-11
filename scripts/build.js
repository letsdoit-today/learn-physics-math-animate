const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const htmlmin = require('html-minifier');
const csso = require('csso');
const uglifyJS = require('uglify-js');
const SitemapGenerator = require('sitemap-generator');

const rootDir = path.join(__dirname, '..');
// 配置
const config = {
    templatesDir: path.join(rootDir, 'templates'),
    publicDir: path.join(rootDir, 'public'),
    dataDir: path.join(rootDir, 'data'),
    demosDir: path.join(rootDir, 'demos'),
    siteUrl: 'https://physics-demos.com' // 网站域名，请根据实际情况修改
};

// 生成默认结构化数据
function getDefaultStructuredData(title, description, url) {
    const fullUrl = url ? `${config.siteUrl}${url}` : config.siteUrl;
    
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": fullUrl,
        "inLanguage": "zh-CN",
        "isPartOf": {
            "@type": "WebSite",
            "name": "物理演示网站",
            "url": config.siteUrl,
            "description": "专业的物理现象交互式演示网站",
            "publisher": {
                "@type": "Organization",
                "name": "物理演示网站",
                "url": config.siteUrl
            }
        },
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": []
        }
    };
}

// 生成演示页面的结构化数据
function getDemoStructuredData(demoData, breadcrumb) {
    const fullUrl = `${config.siteUrl}${demoData.url}`;
    
    // 生成面包屑结构化数据
    const breadcrumbItems = breadcrumb.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.title,
        "item": `${config.siteUrl}${item.url}`
    }));
    
    return {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": demoData.title,
        "description": demoData.description,
        "url": fullUrl,
        "inLanguage": "zh-CN",
        "educationalLevel": "初中|高中|大学",
        "learningResourceType": "Interactive Simulation",
        "about": {
            "@type": "Thing",
            "name": "物理学"
        },
        "isPartOf": {
            "@type": "WebSite",
            "name": "物理演示网站",
            "url": config.siteUrl
        },
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbItems
        }
    };
}

// 确保目录存在
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 读取导航数据
function loadNavigation() {
    const navigationPath = path.join(config.dataDir, 'navigation.json');
    if (fs.existsSync(navigationPath)) {
        const navigationData = fs.readFileSync(navigationPath, 'utf8');
        return JSON.parse(navigationData);
    }
    return { items: [] };
}

// 设置活动导航项
function setActiveNavigation(navigation, currentPath) {
    // 重置所有活动状态
    function resetActive(items) {
        items.forEach(item => {
            item.active = false;
            if (item.subitems && item.subitems.length > 0) {
                resetActive(item.subitems);
            }
        });
    }

    // 设置当前路径的活动状态
    function setActive(items, path) {
        for (const item of items) {
            if (item.url === path) {
                item.active = true;
                return true;
            }
            if (item.subitems && item.subitems.length > 0) {
                if (setActive(item.subitems, path)) {
                    item.active = true;
                    return true;
                }
            }
        }
        return false;
    }

    resetActive(navigation.items);
    setActive(navigation.items, currentPath);

    return navigation;
}

// 生成面包屑
function generateBreadcrumb(navigation, currentPath) {
    const breadcrumb = [{ title: '首页', url: '/' }];

    function findBreadcrumb(items, path, crumbs = []) {
        for (const item of items) {
            if (item.url === path) {
                return [...crumbs, { title: item.title, url: item.url }];
            }
            if (item.subitems && item.subitems.length > 0) {
                const result = findBreadcrumb(item.subitems, path, [...crumbs, { title: item.title, url: item.url }]);
                if (result) return result;
            }
        }
        return null;
    }

    const navBreadcrumb = findBreadcrumb(navigation.items, currentPath);
    if (navBreadcrumb) {
        breadcrumb.push(...navBreadcrumb);
    } else if (currentPath !== '/') {
        // 如果路径不在导航中，添加为当前页面
        const pathParts = currentPath.split('/').filter(part => part);
        if (pathParts.length > 0) {
            breadcrumb.push({ title: pathParts[pathParts.length - 1], url: currentPath });
        }
    }

    return breadcrumb;
}

// 渲染页面
function renderPage(templatePath, outputPath, data) {
    const template = fs.readFileSync(templatePath, 'utf8');
    const html = ejs.render(template, data, {
        filename: templatePath, // 设置模板文件名，用于解析include路径
        root: config.templatesDir // 设置模板根目录
    });

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    ensureDir(outputDir);

    // 写入文件
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${outputPath}`);
}

// 生成首页
function generateIndex() {
    const navigation = loadNavigation();
    const templatePath = path.join(config.templatesDir, 'layout.ejs');
    const outputPath = path.join(config.publicDir, 'index.html');

    const data = {
        title: '物理演示网站',
        description: '专业的物理现象交互式演示网站，提供力学、光学、电磁学等物理现象的直观展示和原理讲解。',
        keywords: '物理演示,物理实验,交互式学习,物理教学,科学教育,力学演示,光学演示,电磁学演示',
        canonicalUrl: config.siteUrl,
        ogImage: '/images/og-image.jpg',
        navigation: navigation,
        breadcrumb: [{ title: '首页', url: '/' }],
        body: `
      <div class="welcome-container">
        <h1>欢迎来到物理演示网站</h1>
        <p>这里提供了各种物理现象的交互式演示，帮助您更好地理解物理原理。</p>
        <div class="demo-categories">
          <h2>演示分类</h2>
          <div class="category-grid">
            ${navigation.items.map(item => `
              <div class="category-card">
                <h3>${item.title}</h3>
                <p>探索${item.title}相关的物理演示</p>
                <a href="${item.url}" class="btn">查看演示</a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `,
        structuredData: getDefaultStructuredData('物理演示网站', '专业的物理现象交互式演示网站', '/')
    };

    renderPage(templatePath, outputPath, data);
}

// 生成演示页面
function generateDemos() {
    const navigation = loadNavigation();
    const layoutTemplatePath = path.join(config.templatesDir, 'layout.ejs');

    // 检查演示目录是否存在
    if (!fs.existsSync(config.demosDir)) {
        console.log('Demos directory not found, skipping demo generation');
        return;
    }

    // 读取所有演示配置
    const demoFolders = fs.readdirSync(config.demosDir, { withFileTypes: true })
        .filter(file => file.isDirectory())
        .map(file => file.name);

    demoFolders.forEach(folder => {
        const demoPath = path.join(config.demosDir, folder, 'demo.json');
        const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
        const demoTemplatePath = path.join(config.demosDir, folder, 'demo.ejs');

        // 设置导航和面包屑
        const activeNavigation = setActiveNavigation(navigation, demoData.url);
        const breadcrumb = generateBreadcrumb(activeNavigation, demoData.url);

        // 渲染演示内容
        const demoContent = ejs.render(fs.readFileSync(demoTemplatePath, 'utf8'), demoData);

        // 渲染完整页面
        const pageData = {
            title: demoData.title,
            description: demoData.description,
            keywords: `物理演示,${demoData.title},交互式学习,物理教学`,
            canonicalUrl: `${config.siteUrl}${demoData.url}`,
            ogImage: '/images/demo-og-image.jpg',
            navigation: activeNavigation,
            breadcrumb: breadcrumb,
            body: demoContent,
            structuredData: getDemoStructuredData(demoData, breadcrumb)
        };

        const outputPath = path.join(config.publicDir, demoData.url, 'index.html');
        renderPage(layoutTemplatePath, outputPath, pageData);
        // 复制静态资源
        copyDirectory(path.join(config.demosDir, folder), path.join(config.publicDir, demoData.url));
    });
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 生成分类页面
function generateCategories() {
    const navigation = loadNavigation();
    const layoutTemplatePath = path.join(config.templatesDir, 'layout.ejs');

    navigation.items.forEach(category => {
        // 设置导航和面包屑
        const activeNavigation = setActiveNavigation(navigation, category.url);
        const breadcrumb = generateBreadcrumb(activeNavigation, category.url);

        // 渲染分类页面内容
        const categoryContent = `
      <div class="category-container">
        <h1>${category.title}</h1>
        <p>探索${category.title}相关的物理演示</p>
        <div class="demo-grid">
          ${category.subitems.map(item => `
            <div class="demo-card">
              <h3>${item.title}</h3>
              <p>查看${item.title}演示</p>
              <a href="${item.url}" class="btn">开始演示</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;

        // 渲染完整页面
        const pageData = {
            title: category.title,
            description: `探索${category.title}相关的物理演示，包括${category.subitems.map(item => item.title).join('、')}等交互式演示`,
            keywords: `物理演示,${category.title},交互式学习,物理教学`,
            canonicalUrl: `${config.siteUrl}${category.url}`,
            ogImage: '/images/category-og-image.jpg',
            navigation: activeNavigation,
            breadcrumb: breadcrumb,
            body: categoryContent,
            structuredData: getDefaultStructuredData(category.title, `探索${category.title}相关的物理演示`, category.url)
        };

        const outputPath = path.join(config.publicDir, category.url, 'index.html');
        renderPage(layoutTemplatePath, outputPath, pageData);
    });
}

// 复制静态资源
function copyStaticAssets() {
    const sourceDir = path.join(rootDir, 'public');
    const targetDir = path.join(rootDir, 'dist');

    // 如果目标目录不存在，创建它
    ensureDir(targetDir);

    // 复制整个public目录到dist
    copyDirectory(sourceDir, targetDir);
    console.log('Static assets copied to dist directory');
}

// 主函数
function build() {
    console.log('Building physics demonstration website...');

    // 确保输出目录存在
    ensureDir(config.publicDir);

    // 生成页面
    generateIndex();
    generateCategories();
    generateDemos();

    // 复制静态资源
    copyStaticAssets();

    // minify html, css, js files in dist directory
    minifyFilesInDir(path.join(rootDir, 'dist'));

    // 生成 sitemap.xml
    generateSitemap();

    console.log('Build completed successfully!');
}

function generateSitemap() { 
    const sitemap = new SitemapGenerator(config.siteUrl, {
        stripQuerystring: true,
        lastMod: true,
        priority: true,
        changeFreq: true,
        ignoreLastMod: true,
        ignoreImages: true,
        ignoreVideos: true,
        ignoreAudio: true,
        ignoreOther: true,
        ignoreCanonical: true,
        ignoreSitemap: true,
        ignoreRobots: true,
    });
    sitemap.start();
    sitemap.on('done', () => {
        fs.writeFileSync(path.join(rootDir, 'dist', 'sitemap.xml'), sitemap.toString());
        console.log('Sitemap generated: dist/sitemap.xml');
    });
}


function minifyFilesInDir(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            if (file.endsWith('.html')) {
                minifyHTMLFile(filePath);
            } else if (file.endsWith('.css')) {
                minifyCSSFile(filePath);
            } else if (file.endsWith('.js')) {
                minifyJSFile(filePath);
            }
        }
        else if (stats.isDirectory()) {
            minifyFilesInDir(filePath);
        }
    })
}

function minifyHTMLFile(filePath) {
    const html = fs.readFileSync(filePath, 'utf8');
    const minifiedHTML = htmlmin.minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true
    });

    fs.writeFileSync(filePath, minifiedHTML);
    console.log(`Minified HTML file: ${filePath}`);
}

function minifyCSSFile(filePath) {
    const css = fs.readFileSync(filePath, 'utf8');
    const minifiedCSS = csso.minify(css).css;

    fs.writeFileSync(filePath, minifiedCSS);
    console.log(`Minified CSS file: ${filePath}`);
}

function minifyJSFile(filePath) {
    const js = fs.readFileSync(filePath, 'utf8');
    const minifiedJS = uglifyJS.minify(js).code;

    fs.writeFileSync(filePath, minifiedJS);
    console.log(`Minified JS file: ${filePath}`);
}

// 如果直接运行此脚本，执行构建
if (require.main === module) {
    build();
}

module.exports = { build };