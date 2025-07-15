import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { enterpriseRoutes } from './enterprise.routes';
import { usersRoutes } from './users.routes';
import { teamsRoutes } from './teams.routes';
import { statsRoutes } from './stats.routes';

// 创建主路由器
export const apiRoutes = Router();

// 健康检查路由 - 无需认证
apiRoutes.use('/health', healthRoutes);

// 认证相关路由
apiRoutes.use('/auth', authRoutes);

// 用户管理路由
apiRoutes.use('/users', usersRoutes);

// 团队管理路由
apiRoutes.use('/teams', teamsRoutes);

// 统计数据路由
apiRoutes.use('/stats', statsRoutes);

// 企业管理路由
apiRoutes.use('/enterprises', enterpriseRoutes);

// 企业认证路由 (新增的企业级功能)
// TODO: 添加企业认证路由
// apiRoutes.use('/enterprise-auth', enterpriseAuthRoutes);

// API文档路由
apiRoutes.get('/', (req, res) => {
  res.json({
    message: 'FastGPT User Management Service API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      ready: '/ready',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      teams: '/api/v1/teams',
      stats: '/api/v1/stats',
      enterprises: '/api/v1/enterprises (not implemented)',
      'enterprise-auth': '/api/v1/enterprise-auth (not implemented)',
    },
    documentation: '/docs (not implemented)',
    timestamp: new Date().toISOString(),
  });
});

// 404处理
apiRoutes.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
  });
});
