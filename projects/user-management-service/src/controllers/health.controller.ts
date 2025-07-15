import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { config } from '@/config';

/**
 * 健康检查控制器
 */
export class HealthController extends BaseController {
  /**
   * 基础健康检查
   */
  public health = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.env,
      version: process.env['npm_package_version'] || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    };

    this.success(res, healthData);
  });

  /**
   * 详细就绪检查
   */
  public ready = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    try {
      const db = this.getDB();
      const healthStatus = await db.healthCheck();

      const readyData = {
        status: healthStatus.overall ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        services: {
          postgresql: {
            status: healthStatus.postgresql ? 'connected' : 'disconnected',
            responseTime: await this.measureResponseTime(async () => {
              await db.getPostgreSQL().query('SELECT 1');
            }),
          },
          mongodb: {
            status: healthStatus.mongodb ? 'connected' : 'disconnected',
            responseTime: config.mongodb.uri
              ? await this.measureResponseTime(async () => {
                  await db.getMongoDB().healthCheck();
                })
              : null,
          },
          redis: {
            status: healthStatus.redis ? 'connected' : 'disconnected',
            responseTime: await this.measureResponseTime(async () => {
              await db.getRedis().getClient().ping();
            }),
          },
        },
        checks: {
          database: healthStatus.postgresql,
          cache: healthStatus.redis,
          mongodb: healthStatus.mongodb,
        },
      };

      if (!healthStatus.overall) {
        res.status(503).json({
          success: false,
          data: readyData,
          error: 'Service not ready',
        });
        return;
      }

      this.success(res, readyData);
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        data: {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  /**
   * 存活检查（简单检查）
   */
  public liveness = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    this.success(res, {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
    });
  });

  /**
   * 指标端点（Prometheus格式）
   */
  public metrics = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    if (!config.monitoring.metricsEnabled) {
      this.notFound(res, 'Metrics endpoint is disabled');
      return;
    }

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = [
      `# HELP nodejs_memory_heap_used_bytes Process heap memory used`,
      `# TYPE nodejs_memory_heap_used_bytes gauge`,
      `nodejs_memory_heap_used_bytes ${memoryUsage.heapUsed}`,
      '',
      `# HELP nodejs_memory_heap_total_bytes Process heap memory total`,
      `# TYPE nodejs_memory_heap_total_bytes gauge`,
      `nodejs_memory_heap_total_bytes ${memoryUsage.heapTotal}`,
      '',
      `# HELP nodejs_memory_external_bytes Process external memory`,
      `# TYPE nodejs_memory_external_bytes gauge`,
      `nodejs_memory_external_bytes ${memoryUsage.external}`,
      '',
      `# HELP process_cpu_user_seconds_total Total user CPU time spent`,
      `# TYPE process_cpu_user_seconds_total counter`,
      `process_cpu_user_seconds_total ${cpuUsage.user / 1000000}`,
      '',
      `# HELP process_cpu_system_seconds_total Total system CPU time spent`,
      `# TYPE process_cpu_system_seconds_total counter`,
      `process_cpu_system_seconds_total ${cpuUsage.system / 1000000}`,
      '',
      `# HELP process_uptime_seconds Process uptime in seconds`,
      `# TYPE process_uptime_seconds gauge`,
      `process_uptime_seconds ${process.uptime()}`,
      '',
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  });

  /**
   * 系统信息
   */
  public info = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const info = {
      service: {
        name: 'FastGPT User Management Service',
        version: process.env['npm_package_version'] || '1.0.0',
        environment: config.app.env,
        port: config.app.port,
        apiPrefix: config.app.apiPrefix,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        pid: process.pid,
      },
      features: {
        enterpriseEnabled: config.enterprise.featuresEnabled,
        metricsEnabled: config.monitoring.metricsEnabled,
        healthCheckEnabled: config.monitoring.healthCheckEnabled,
        swaggerEnabled: config.development.swaggerEnabled,
      },
      limits: {
        maxEnterprises: config.enterprise.maxEnterprises,
        maxUsersPerEnterprise: config.enterprise.maxUsersPerEnterprise,
      },
    };

    this.success(res, info);
  });

  /**
   * 测量响应时间的辅助方法
   */
  private async measureResponseTime(operation: () => Promise<void>): Promise<number> {
    const start = Date.now();
    try {
      await operation();
      return Date.now() - start;
    } catch (error) {
      return -1; // 表示操作失败
    }
  }
}

// 导出控制器实例
export const healthController = new HealthController();
