import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config, validateConfig, isDevelopment } from '@/config';
import { db } from '@/config/database';
import { apiRoutes } from '@/routes';
import { AppError } from '@/types';

// 验证配置
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

const app: express.Application = express();

// 信任代理设置
if (config.app.trustProxy) {
  app.set('trust proxy', 1);
}

// 安全中间件
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

// CORS配置
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// 压缩中间件
app.use(compression());

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: config.rateLimit.skipSuccessfulRequests,
});

app.use(limiter as any);

// 健康检查端点
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.env,
    version: process.env['npm_package_version'] || '1.0.0',
  });
});

// 就绪检查端点
app.get('/ready', async (_req, res) => {
  try {
    const healthStatus = await db.healthCheck();

    if (!healthStatus.overall) {
      return res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        services: {
          postgresql: healthStatus.postgresql ? 'connected' : 'disconnected',
          mongodb: healthStatus.mongodb ? 'connected' : 'disconnected',
          redis: healthStatus.redis ? 'connected' : 'disconnected',
        },
      });
    }

    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        postgresql: 'connected',
        mongodb: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// API路由
app.use(config.app.apiPrefix, apiRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
  });
});

// 全局错误处理中间件
app.use((error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 如果响应已经发送，交给默认错误处理器
  if (res.headersSent) {
    return next(error);
  }

  // 处理应用错误
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(isDevelopment() && { stack: error.stack }),
    });
  }

  // 处理JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // 处理验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.message,
    });
  }

  // 处理数据库错误
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: 'DATABASE_ERROR',
      ...(isDevelopment() && { details: error.message }),
    });
  }

  // 默认服务器错误
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment() && { stack: error.stack }),
  });
});

// 优雅关闭处理函数
const gracefulShutdown = async (server: any): Promise<void> => {
  console.log('Starting graceful shutdown...');

  return new Promise(resolve => {
    server.close(async (err: any) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }

      console.log('Server closed successfully');

      // 关闭数据库连接
      try {
        await db.disconnect();
        console.log('Database connections closed');
      } catch (error) {
        console.error('Error closing database connections:', error);
      }

      resolve();
    });

    // 强制关闭超时
    setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  });
};

// 启动服务器
if (require.main === module) {
  // 初始化数据库连接
  db.connect()
    .then(() => {
      const server = app.listen(config.app.port, () => {
        console.log(`🚀 User Management Service is running on port ${config.app.port}`);
        console.log(`📊 Environment: ${config.app.env}`);
        console.log(`🔗 API Prefix: ${config.app.apiPrefix}`);

        if (isDevelopment()) {
          console.log(`💚 Health check: http://localhost:${config.app.port}/health`);
          console.log(`📡 API endpoint: http://localhost:${config.app.port}${config.app.apiPrefix}`);
        }
      });

      // 处理未捕获的异常
      process.on('uncaughtException', error => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
      });

      process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
      });

      // 优雅关闭
      process.on('SIGTERM', () => {
        gracefulShutdown(server).then(() => process.exit(0));
      });
      process.on('SIGINT', () => {
        gracefulShutdown(server).then(() => process.exit(0));
      });
    })
    .catch(error => {
      console.error('❌ Failed to initialize database connections:', error);
      process.exit(1);
    });
}

export default app;
