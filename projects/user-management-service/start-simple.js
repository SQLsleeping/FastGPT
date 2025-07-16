// 简单的服务启动脚本，用于快速验证基础功能
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    service: 'user-management-service'
  });
});

// 就绪检查端点
app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    services: {
      postgresql: 'not_connected', // 暂时显示未连接
      mongodb: 'not_connected',
      redis: 'not_connected',
    },
    message: 'Service is running but database connections not implemented yet'
  });
});

// API根路径
app.get('/api/v1', (req, res) => {
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
    timestamp: new Date().toISOString()
  });
});

// 企业认证API端点 (模拟)
app.get('/api/v1/enterprise-auth', (req, res) => {
  res.json({
    message: 'Enterprise Authentication API',
    endpoints: {
      'POST /api/v1/enterprise-auth/register': 'Enterprise registration',
      'POST /api/v1/enterprise-auth/verify': 'Enterprise verification',
      'POST /api/v1/enterprise-auth/bind-domain': 'Domain binding',
      'POST /api/v1/enterprise-auth/verify-domain': 'Domain verification',
      'POST /api/v1/enterprise-auth/import-users': 'Batch user import',
      'GET /api/v1/enterprise-auth/stats': 'Enterprise statistics',
      'GET /api/v1/enterprise-auth/report': 'Enterprise report',
      'GET /api/v1/enterprise-auth/domains': 'Domain management',
      'GET /api/v1/enterprise-auth/settings': 'Enterprise settings',
    },
    status: 'endpoints_defined_but_not_implemented'
  });
});

// 企业注册端点 (模拟)
app.post('/api/v1/enterprise-auth/register', (req, res) => {
  console.log('Enterprise registration request:', req.body);
  res.status(201).json({
    success: true,
    message: 'Enterprise registration request received',
    data: {
      enterpriseId: 'mock-enterprise-' + Date.now(),
      status: 'pending_verification',
      verificationToken: 'mock-token-' + Math.random().toString(36).substr(2, 9)
    },
    note: 'This is a mock response - actual implementation pending'
  });
});

// 企业统计端点 (模拟)
app.get('/api/v1/enterprise-auth/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 0,
      activeUsers: 0,
      totalDepartments: 0,
      totalTeams: 0,
      storageUsed: 0,
      apiCallsThisMonth: 0,
      lastActivityAt: new Date().toISOString()
    },
    note: 'This is mock data - actual implementation pending'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    availableEndpoints: [
      '/health',
      '/ready', 
      '/api/v1',
      '/api/v1/enterprise-auth'
    ]
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    message: error.message
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 User Management Service (Simple Mode) is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/v1`);
  console.log(`🏢 Enterprise Auth: http://localhost:${PORT}/api/v1/enterprise-auth`);
  console.log('');
  console.log('Note: This is a simplified version for testing basic functionality.');
  console.log('TypeScript compilation errors are bypassed in this mode.');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
