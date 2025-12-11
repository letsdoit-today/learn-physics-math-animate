#!/usr/bin/env node

/**
 * 项目质量检查脚本
 * 用于检查项目结构和代码规范
 */

const fs = require('fs');
const path = require('path');

class ProjectChecker {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
  }

  // 检查目录结构
  checkDirectoryStructure() {
    const requiredDirs = [
      'data',
      'demos',
      'templates',
      'public',
      'dist'
    ];

    requiredDirs.forEach(dir => {
      const dirPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(dirPath)) {
        this.warnings.push(`目录缺失: ${dir}`);
      }
    });
  }

  // 检查必需文件
  checkRequiredFiles() {
    const requiredFiles = [
      'package.json',
      'scripts/build.js',
      'data/navigation.json',
      'templates/layout.ejs',
      'templates/navigation.ejs',
      'templates/breadcrumb.ejs',
      'templates/footer.ejs'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`必需文件缺失: ${file}`);
      }
    });
  }

  // 检查演示模块
  checkDemoModules() {
    const demosDir = path.join(this.rootDir, 'demos');
    
    if (!fs.existsSync(demosDir)) {
      this.warnings.push('demos目录不存在');
      return;
    }

    const demoFolders = fs.readdirSync(demosDir, { withFileTypes: true })
      .filter(file => file.isDirectory())
      .map(file => file.name);

    demoFolders.forEach(demo => {
      const demoPath = path.join(demosDir, demo);
      const requiredDemoFiles = [
        'demo.json',
        'demo.ejs',
        'demo.css',
        'demo.js'
      ];

      requiredDemoFiles.forEach(file => {
        const filePath = path.join(demoPath, file);
        if (!fs.existsSync(filePath)) {
          this.warnings.push(`演示模块文件缺失: demos/${demo}/${file}`);
        }
      });

      // 检查demo.json格式
      this.checkDemoConfig(demo, demoPath);
    });
  }

  // 检查演示配置
  checkDemoConfig(demoName, demoPath) {
    const configPath = path.join(demoPath, 'demo.json');
    
    if (!fs.existsSync(configPath)) return;

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const requiredFields = ['title', 'description', 'url'];
      
      requiredFields.forEach(field => {
        if (!config[field]) {
          this.warnings.push(`演示配置字段缺失: demos/${demoName}/demo.json -> ${field}`);
        }
      });

      // 检查URL格式
      if (config.url && !config.url.startsWith('/')) {
        this.errors.push(`演示URL格式错误: demos/${demoName}/demo.json -> URL必须以/开头`);
      }

    } catch (error) {
      this.errors.push(`演示配置文件格式错误: demos/${demoName}/demo.json -> ${error.message}`);
    }
  }

  // 检查代码规范
  checkCodeStyle() {
    this.checkEjsTemplates();
    this.checkCSSFiles();
    this.checkJSFiles();
  }

  // 检查EJS模板
  checkEjsTemplates() {
    const templatesDir = path.join(this.rootDir, 'templates');
    
    if (!fs.existsSync(templatesDir)) return;

    const templateFiles = fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.ejs'));

    templateFiles.forEach(file => {
      const filePath = path.join(templatesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查缩进
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.startsWith('  ') && !line.startsWith('    ')) {
          // 检查是否使用2空格缩进
          if (line.match(/^ {2}[^ ]/) && !line.match(/^ {4}/)) {
            // 正确的2空格缩进
          } else {
            this.warnings.push(`模板缩进不一致: templates/${file}:${index + 1}`);
          }
        }
      });
    });
  }

  // 检查CSS文件
  checkCSSFiles() {
    const checkDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          checkDir(filePath);
        } else if (file.name.endsWith('.css')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // 检查!important使用
          if (content.includes('!important')) {
            this.warnings.push(`CSS中使用!important: ${path.relative(this.rootDir, filePath)}`);
          }
        }
      });
    };

    checkDir(path.join(this.rootDir, 'demos'));
  }

  // 检查JS文件
  checkJSFiles() {
    const checkDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          checkDir(filePath);
        } else if (file.name.endsWith('.js') && !file.name.includes('node_modules')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // 检查全局变量
          if (content.match(/var\s+\w+\s*=/g)) {
            this.warnings.push(`JS中使用var声明: ${path.relative(this.rootDir, filePath)}`);
          }
        }
      });
    };

    checkDir(this.rootDir);
  }

  // 运行所有检查
  runAllChecks() {
    console.log('🚀 开始项目质量检查...\n');
    
    this.checkDirectoryStructure();
    this.checkRequiredFiles();
    this.checkDemoModules();
    this.checkCodeStyle();

    // 输出结果
    if (this.errors.length > 0) {
      console.log('❌ 错误:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ 项目检查通过，没有发现问题！');
    }

    console.log(`\n📊 检查结果: ${this.errors.length}个错误, ${this.warnings.length}个警告`);
    
    return this.errors.length === 0;
  }
}

// 运行检查
if (require.main === module) {
  const checker = new ProjectChecker();
  const success = checker.runAllChecks();
  process.exit(success ? 0 : 1);
}

module.exports = ProjectChecker;