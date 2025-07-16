import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { db } from '../src/config/database';

describe('Health Endpoints', () => {
  beforeAll(async () => {
    // 初始化数据库连接
    await db.connect();
  });

  afterAll(async () => {
    // 关闭数据库连接
    await db.disconnect();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: expect.any(String),
          version: expect.any(String),
          uptime: expect.any(Number),
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            external: expect.any(Number),
          },
        },
      });
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'ready',
          services: {
            postgresql: {
              status: 'connected',
              responseTime: expect.any(Number),
            },
            redis: {
              status: 'connected',
              responseTime: expect.any(Number),
            },
          },
          checks: {
            database: true,
            cache: true,
          },
        },
      });
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/live')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'alive',
          pid: expect.any(Number),
        },
      });
    });
  });

  describe('GET /info', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/info')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          service: {
            name: 'FastGPT User Management Service',
            version: expect.any(String),
            environment: expect.any(String),
            port: expect.any(Number),
            apiPrefix: expect.any(String),
          },
          system: {
            platform: expect.any(String),
            arch: expect.any(String),
            nodeVersion: expect.any(String),
            uptime: expect.any(Number),
            pid: expect.any(Number),
          },
          features: {
            enterpriseEnabled: expect.any(Boolean),
            metricsEnabled: expect.any(Boolean),
            healthCheckEnabled: expect.any(Boolean),
          },
        },
      });
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('nodejs_memory_heap_used_bytes');
      expect(response.text).toContain('process_uptime_seconds');
    });
  });
});
