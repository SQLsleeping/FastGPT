import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { enterpriseRoutes } from './enterprise.routes';

// 创建主路由器
export const apiRoutes = Router();

// 健康检查路由 - 无需认证
apiRoutes.use('/health', healthRoutes);

// 认证相关路由
apiRoutes.use('/auth', authRoutes);

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
      auth: '/api/v1/auth (not implemented)',
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
