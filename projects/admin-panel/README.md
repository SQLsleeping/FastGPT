# FastGPT 管理员面板

现代化的用户和团队管理界面，为 FastGPT 用户管理服务提供完整的管理功能。

## 🚀 快速开始

### 安装依赖
```bash
# 在 FastGPT 根目录下
npm run admin:install

# 或者直接在 admin-panel 目录下
cd projects/admin-panel
npm install
```

### 开发模式
```bash
# 在 FastGPT 根目录下
npm run admin:dev

# 或者直接在 admin-panel 目录下
cd projects/admin-panel
npm run dev
```

访问 http://localhost:3002 查看管理员面板

### 生产构建
```bash
# 在 FastGPT 根目录下
npm run admin:build
```

## 🔐 默认登录信息

- **用户名**：admin
- **密码**：admin123

> ⚠️ **重要**：这是演示用的默认账号，实际部署时需要连接到用户管理服务的认证系统

## 📱 功能模块

### 1. 仪表板 (Dashboard)
- 系统概览统计
- 用户和团队数据展示
- 实时数据监控（需要后端服务支持）

### 2. 用户管理 (Users)
- 用户列表查看和搜索
- 用户状态和角色管理
- 支持筛选和分页

### 3. 团队管理 (Teams)
- 团队列表查看和搜索
- 团队信息管理
- 成员数量统计

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5.x
- **UI组件库**：Ant Design 5.x
- **状态管理**：Zustand
- **数据获取**：TanStack Query (React Query v5)
- **路由管理**：React Router 6
- **样式方案**：Tailwind CSS + Ant Design

## 🔧 配置说明

### API 代理配置
管理员面板通过 Vite 代理连接到用户管理服务：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api/v1/user-management': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- 用户管理服务运行在 http://localhost:3001

## 📊 项目结构

```
projects/admin-panel/
├── src/
│   ├── components/     # 通用组件
│   ├── pages/         # 页面组件
│   ├── services/      # API服务
│   ├── stores/        # 状态管理
│   ├── types/         # TypeScript类型
│   ├── styles/        # 样式文件
│   └── main.tsx       # 应用入口
├── public/            # 静态资源
├── index.html         # HTML模板
├── package.json       # 项目配置
├── vite.config.ts     # Vite配置
└── README.md          # 项目文档
```

## 🔄 与用户管理服务集成

管理员面板设计为与用户管理服务配合使用：

1. **认证系统**：通过 `/api/v1/user-management/auth` 进行管理员登录
2. **用户管理**：通过 `/api/v1/user-management/users` 管理用户
3. **团队管理**：通过 `/api/v1/user-management/teams` 管理团队
4. **统计数据**：通过 `/api/v1/user-management/stats` 获取统计信息

## 🚀 部署指南

### 独立部署
```bash
# 构建
npm run build

# 使用静态文件服务器
npx serve dist -p 3002
```

### 与 FastGPT 集成部署
管理员面板可以作为 FastGPT 的子应用部署，通过反向代理访问。

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3002
CMD ["npx", "serve", "dist", "-p", "3002"]
```

## 🔍 开发指南

### 添加新页面
1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 中添加路由
3. 在 `src/components/Layout.tsx` 中添加菜单项

### 添加新API
1. 在 `src/types/` 中定义类型
2. 在 `src/services/api.ts` 中添加API调用
3. 在组件中使用 TanStack Query 调用

### 状态管理
使用 Zustand 进行状态管理，主要状态包括：
- 认证状态 (`authStore`)
- 用户偏好设置
- 临时UI状态

## 🐛 故障排除

### 常见问题

**1. 无法连接到用户管理服务**
- 确保用户管理服务运行在 http://localhost:3001
- 检查 Vite 代理配置
- 查看浏览器网络面板的错误信息

**2. 登录失败**
- 检查用户管理服务的认证端点
- 确认默认管理员账号是否已创建
- 查看浏览器控制台错误

**3. 数据显示异常**
- 管理员面板在API不可用时会显示模拟数据
- 检查用户管理服务的API端点是否正常
- 确认数据格式是否匹配类型定义

## 📝 更新日志

### v1.0.0 (2024-01-15)
- 🎉 初始版本发布
- ✨ 基础的用户和团队管理功能
- 🔒 管理员认证系统
- 📊 系统统计面板
- 📱 响应式设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进管理员面板！

---

**FastGPT 管理员面板** - 让用户和团队管理变得简单高效 🚀
