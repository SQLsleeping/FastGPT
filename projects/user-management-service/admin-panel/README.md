# FastGPT 用户管理系统 - 管理员面板

现代化的用户和团队管理界面，为 FastGPT 用户管理服务提供完整的管理功能。

## 🚀 功能特性

### 核心功能
- **用户管理**：创建、编辑、删除用户，管理用户状态和角色
- **团队管理**：创建和管理团队，添加/移除团队成员
- **权限控制**：基于角色的访问控制，细粒度权限管理
- **数据统计**：实时系统统计和用户活动监控
- **系统设置**：配置系统参数、安全策略和通知设置

### 技术特性
- **现代化UI**：基于 Ant Design 5.x 的响应式界面
- **TypeScript**：完整的类型安全支持
- **实时数据**：React Query 驱动的数据管理
- **状态管理**：Zustand 轻量级状态管理
- **图表可视化**：Recharts 数据可视化
- **国际化**：支持中英文切换

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5.x
- **UI组件库**：Ant Design 5.x
- **状态管理**：Zustand
- **数据获取**：React Query
- **路由管理**：React Router 6
- **样式方案**：Tailwind CSS + Ant Design
- **图表库**：Recharts
- **表单处理**：React Hook Form + Zod

## 📦 安装和运行

### 前置要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- 用户管理服务后端运行在 http://localhost:3001

### 安装依赖
```bash
# 在 user-management-service 目录下
npm run admin:install

# 或者直接在 admin-panel 目录下
cd admin-panel
npm install
```

### 开发模式
```bash
# 在 user-management-service 目录下
npm run admin:dev

# 或者直接在 admin-panel 目录下
cd admin-panel
npm run dev
```

访问 http://localhost:3002 查看管理员面板

### 生产构建
```bash
# 在 user-management-service 目录下
npm run admin:build

# 或者直接在 admin-panel 目录下
cd admin-panel
npm run build
```

## 🔐 默认登录信息

- **用户名**：admin
- **密码**：admin123

> ⚠️ **安全提醒**：首次登录后请立即修改默认密码

## 📱 功能模块

### 1. 仪表板 (Dashboard)
- 系统概览统计
- 用户活动趋势图表
- 团队规模分布
- 实时数据监控

### 2. 用户管理 (Users)
- 用户列表查看和搜索
- 创建新用户
- 编辑用户信息
- 管理用户状态（激活/停用/暂停）
- 重置用户密码
- 用户角色管理

### 3. 团队管理 (Teams)
- 团队列表查看和搜索
- 创建新团队
- 编辑团队信息
- 管理团队成员
- 团队状态管理

### 4. 系统设置 (Settings)
- **系统设置**：基本信息、用户设置
- **安全设置**：密码策略、登录限制、双因素认证
- **邮件设置**：SMTP配置、邮件模板
- **通知设置**：系统通知、第三方集成
- **数据库**：数据库状态监控和操作

## 🔒 权限系统

### 角色类型
- **super_admin**：超级管理员，拥有所有权限
- **admin**：管理员，拥有大部分管理权限
- **user**：普通用户（不能访问管理面板）

### 权限控制
- 基于角色的访问控制 (RBAC)
- 细粒度权限验证
- 路由级别的权限保护
- 组件级别的权限控制

## 🎨 界面特性

### 响应式设计
- 支持桌面端、平板和移动端
- 自适应布局和组件
- 优化的移动端交互体验

### 主题定制
- 支持亮色/暗色主题切换
- 可自定义主色调
- 符合 Ant Design 设计规范

### 用户体验
- 流畅的页面切换动画
- 智能的加载状态提示
- 友好的错误处理和提示
- 键盘快捷键支持

## 🔧 配置说明

### 环境变量
创建 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_TITLE=FastGPT 用户管理系统
VITE_APP_VERSION=1.0.0
```

### API 代理配置
在 `vite.config.ts` 中配置 API 代理：
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

## 📊 数据流架构

```
用户操作 → React组件 → React Query → API服务 → 后端服务
    ↓           ↓           ↓          ↓         ↓
  UI更新 ← Zustand状态 ← 缓存更新 ← HTTP响应 ← 数据库
```

## 🚀 部署指南

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3002
CMD ["npm", "run", "preview"]
```

### Nginx 配置
```nginx
server {
    listen 80;
    server_name admin.fastgpt.com;
    
    location / {
        root /var/www/admin-panel;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 开发指南

### 项目结构
```
src/
├── components/     # 通用组件
├── pages/         # 页面组件
├── hooks/         # 自定义Hooks
├── services/      # API服务
├── stores/        # 状态管理
├── types/         # TypeScript类型定义
├── utils/         # 工具函数
└── styles/        # 样式文件
```

### 代码规范
- 使用 ESLint + Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 使用 React Query 进行数据管理

### 添加新功能
1. 在 `types/` 中定义相关类型
2. 在 `services/` 中添加 API 调用
3. 创建页面组件和相关 Hooks
4. 更新路由配置
5. 添加权限控制

## 🐛 故障排除

### 常见问题

**1. 无法连接到后端服务**
- 检查后端服务是否运行在 http://localhost:3001
- 确认 API 代理配置正确
- 检查网络连接和防火墙设置

**2. 登录失败**
- 确认使用正确的默认账号密码
- 检查后端认证服务是否正常
- 查看浏览器控制台错误信息

**3. 页面加载缓慢**
- 检查网络连接
- 清除浏览器缓存
- 确认后端服务响应正常

## 📝 更新日志

### v1.0.0 (2024-01-15)
- 🎉 初始版本发布
- ✨ 完整的用户和团队管理功能
- 🔒 基于角色的权限控制系统
- 📊 实时数据统计和监控
- ⚙️ 系统设置和配置管理

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如有问题或建议，请：
- 创建 [Issue](https://github.com/your-repo/issues)
- 发送邮件至 support@fastgpt.com
- 查看 [文档](https://docs.fastgpt.com)

---

**FastGPT 用户管理系统** - 让用户和团队管理变得简单高效 🚀
