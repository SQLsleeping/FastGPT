# FastGPT 用户管理服务

FastGPT独立用户管理服务 - 企业级多租户用户管理系统

## 功能特性

### 🏢 企业级多租户管理
- 企业注册与认证
- 企业配置管理
- 企业级用户导入
- 企业域名绑定
- 多租户数据隔离

### 👥 高级用户管理
- 多种登录方式支持（邮箱、手机、SSO）
- 用户生命周期管理
- 批量用户操作
- 用户行为分析
- 多因素认证（MFA）

### 🏗️ 组织架构管理
- 多级组织架构
- 部门管理
- 角色模板系统
- 团队协作工具集成

### 🔐 权限管理系统
- 基于RBAC的权限模型
- 动态权限配置
- 权限继承机制
- API级别权限控制

### 📊 审计与合规
- 操作日志记录
- 数据变更追踪
- 合规报告生成
- 异常行为检测

## 技术栈

- **后端框架**: Express.js + TypeScript
- **数据库**: PostgreSQL + MongoDB + Redis
- **认证授权**: JWT + RBAC
- **消息队列**: Redis + Bull
- **测试框架**: Vitest
- **代码质量**: ESLint + Prettier
- **容器化**: Docker + Kubernetes

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 15
- Redis >= 7
- MongoDB >= 6 (可选，用于兼容现有FastGPT)

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置必要的环境变量：
```bash
# 基础配置
NODE_ENV=development
PORT=3001

# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/user_management
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 数据库初始化

```bash
# TODO: 添加数据库迁移命令
npm run db:migrate
```

### 启动开发服务器

```bash
npm run dev
```

服务将在 http://localhost:3001 启动

### 健康检查

访问 http://localhost:3001/health 检查服务状态

## 开发指南

### 项目结构

```
src/
├── controllers/          # 控制器层
│   ├── auth.controller.ts
│   ├── enterprise.controller.ts
│   ├── user.controller.ts
│   └── team.controller.ts
├── services/            # 业务逻辑层
│   ├── auth.service.ts
│   ├── enterprise.service.ts
│   ├── permission.service.ts
│   └── notification.service.ts
├── models/              # 数据模型
│   ├── enterprise.model.ts
│   ├── department.model.ts
│   ├── role.model.ts
│   └── audit.model.ts
├── middleware/          # 中间件
│   ├── auth.middleware.ts
│   ├── permission.middleware.ts
│   └── audit.middleware.ts
├── utils/               # 工具函数
├── config/              # 配置文件
├── types/               # 类型定义
└── index.ts             # 入口文件
```

### 开发命令

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 启动生产服务
npm start

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

### API文档

启动服务后，访问 http://localhost:3001/docs 查看API文档（开发环境）

### 测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 部署

### Docker部署

1. 构建镜像：
```bash
npm run docker:build
```

2. 运行容器：
```bash
npm run docker:run
```

### Kubernetes部署

```bash
kubectl apply -f k8s/
```

### 环境变量

生产环境需要配置的关键环境变量：

- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL连接字符串
- `REDIS_URL` - Redis连接字符串
- `JWT_SECRET` - JWT密钥（至少32字符）
- `ENCRYPTION_KEY` - 数据加密密钥（32字符）
- `SMTP_*` - 邮件服务配置

## 监控

### 健康检查端点

- `GET /health` - 服务健康状态
- `GET /ready` - 服务就绪状态

### 指标监控

服务提供Prometheus格式的指标数据：
- `GET /metrics` - 应用指标

### 日志

日志输出到控制台和文件，支持结构化日志格式。

## 安全

### 认证授权
- JWT令牌认证
- 基于RBAC的权限控制
- 多因素认证支持

### 数据安全
- 敏感数据加密存储
- API访问控制
- 速率限制保护

### 网络安全
- HTTPS强制
- CORS配置
- 安全头设置

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写单元测试
- 添加适当的注释

## 许可证

Apache License 2.0

## 支持

如有问题或建议，请创建Issue或联系开发团队。
