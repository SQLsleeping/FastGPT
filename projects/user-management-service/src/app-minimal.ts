import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils';
import { db } from './config/database';

// 只导入核心的认证控制器和团队控制器
import { AuthController } from './controllers/auth.controller';
import { TeamController } from './controllers/team.controller';
import { authenticateJWT } from './middleware/auth.middleware';
import { permissionService, Permission } from './services/permission.service';

/**
 * 最小化应用启动器
 * 只包含核心认证功能，避免企业功能的复杂依赖
 */
class MinimalApp {
  private app: express.Application;
  private authController: AuthController;
  private teamController: TeamController;

  constructor() {
    this.app = express();
    this.authController = new AuthController();
    this.teamController = new TeamController();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 基础中间件
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      }),
    );
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        version: '1.0.0',
        service: 'user-management-service',
      });
    });

    // 就绪检查
    this.app.get('/ready', async (req, res) => {
      try {
        // 检查数据库连接
        await db.getPostgreSQL().query('SELECT 1');
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'ok',
          },
        });
      } catch (error) {
        logger.error('Readiness check failed:', error);
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'error',
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // API根路径
    this.app.get('/api/v1', (req, res) => {
      res.json({
        message: 'FastGPT User Management Service API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          ready: '/ready',
          auth: '/api/v1/auth',
          teams: '/api/v1/teams',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // 认证路由
    this.app.post('/api/v1/auth/register', this.authController.register.bind(this.authController));
    this.app.post('/api/v1/auth/login', this.authController.login.bind(this.authController));
    this.app.post('/api/v1/auth/logout', this.authController.logout.bind(this.authController));
    this.app.post('/api/v1/auth/refresh', this.authController.refreshToken.bind(this.authController));
    this.app.post('/api/v1/auth/check-user', this.authController.checkUser.bind(this.authController));
    this.app.post('/api/v1/auth/forgot-password', this.authController.requestPasswordReset.bind(this.authController));
    this.app.post('/api/v1/auth/reset-password', this.authController.resetPassword.bind(this.authController));
    this.app.post('/api/v1/auth/change-password', this.authController.changePassword.bind(this.authController));

    // 用户信息路由
    this.app.get('/api/v1/users/:id', this.authController.getUserById.bind(this.authController));

    // 团队管理路由（需要认证）
    this.app.post('/api/v1/teams', authenticateJWT, this.teamController.createTeam.bind(this.teamController));
    this.app.get('/api/v1/teams', authenticateJWT, this.teamController.getUserTeams.bind(this.teamController));
    this.app.get('/api/v1/teams/:teamId', authenticateJWT, this.requireTeamMember, this.teamController.getTeam.bind(this.teamController));
    this.app.put('/api/v1/teams/:teamId', authenticateJWT, this.requireTeamAdmin, this.teamController.updateTeam.bind(this.teamController));
    this.app.delete('/api/v1/teams/:teamId', authenticateJWT, this.teamController.deleteTeam.bind(this.teamController));

    // 团队成员管理路由
    this.app.get(
      '/api/v1/teams/:teamId/members',
      authenticateJWT,
      this.requireTeamMember,
      this.teamController.getTeamMembers.bind(this.teamController),
    );
    this.app.post(
      '/api/v1/teams/:teamId/invite',
      authenticateJWT,
      this.requireTeamAdmin,
      this.teamController.inviteUser.bind(this.teamController),
    );
    this.app.put(
      '/api/v1/teams/:teamId/members/:memberId/role',
      authenticateJWT,
      this.requireTeamAdmin,
      this.teamController.updateMemberRole.bind(this.teamController),
    );
    this.app.delete(
      '/api/v1/teams/:teamId/members/:memberId',
      authenticateJWT,
      this.requireTeamAdmin,
      this.teamController.removeMember.bind(this.teamController),
    );
    this.app.post(
      '/api/v1/teams/:teamId/leave',
      authenticateJWT,
      this.requireTeamMember,
      this.teamController.leaveTeam.bind(this.teamController),
    );

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 全局错误处理
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);

      // 如果响应已经发送，交给默认错误处理器
      if (res.headersSent) {
        return next(error);
      }

      const status = error.status || error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      res.status(status).json({
        error: config.app.env === 'production' ? 'Internal Server Error' : error.name || 'Error',
        message: config.app.env === 'production' && status === 500 ? 'Something went wrong' : message,
        timestamp: new Date().toISOString(),
        ...(config.app.env !== 'production' && { stack: error.stack }),
      });
    });

    // 未捕获的异常处理
    process.on('uncaughtException', error => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // 初始化数据库连接
      await db.initialize();
      logger.info('Database connection established');

      // 启动服务器
      const server = this.app.listen(config.app.port, () => {
        logger.info(`🚀 User Management Service (Minimal) is running on port ${config.app.port}`);
        logger.info(`📊 Environment: ${config.app.env}`);
        logger.info(`💚 Health check: http://localhost:${config.app.port}/health`);
        logger.info(`📡 API endpoint: http://localhost:${config.app.port}/api/v1`);
        logger.info(`🔐 Auth endpoints: http://localhost:${config.app.port}/api/v1/auth`);
      });

      // 优雅关闭
      const gracefulShutdown = (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        server.close(async () => {
          try {
            await db.close();
            logger.info('Database connection closed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  /**
   * 简单的团队权限检查中间件
   */
  private requireTeamAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const teamId = req.params.teamId;

      if (!userId || !teamId) {
        res.status(400).json({
          success: false,
          error: 'User ID and Team ID are required',
          code: 'MISSING_PARAMETERS'
        });
        return;
      }

      const isAdmin = await permissionService.isTeamAdmin(userId, teamId);
      if (!isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Team admin privileges required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Team admin check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };

  /**
   * 简单的团队成员检查中间件
   */
  private requireTeamMember = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const teamId = req.params.teamId;

      if (!userId || !teamId) {
        res.status(400).json({
          success: false,
          error: 'User ID and Team ID are required',
          code: 'MISSING_PARAMETERS'
        });
        return;
      }

      const hasPermission = await permissionService.hasTeamPermission(userId, teamId, Permission.TEAM_READ);
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Team membership required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Team member check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

// 启动应用
if (require.main === module) {
  const app = new MinimalApp();
  app.start().catch(error => {
    logger.error('Application startup failed:', error);
    process.exit(1);
  });
}

export default MinimalApp;
