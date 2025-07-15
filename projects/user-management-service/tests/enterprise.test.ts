import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { db } from '../src/config/database';
import { createTestUser, createTestEnterprise, createTestJWTPayload } from './setup';
import { JWTUtils } from '../src/utils';

describe('Enterprise Endpoints', () => {
  let adminToken: string;
  let testEnterprise: any;

  beforeAll(async () => {
    // 初始化数据库连接
    await db.connect();
    
    // 创建测试管理员令牌
    const adminPayload = {
      ...createTestJWTPayload(),
      roles: ['Super Admin'],
    };
    adminToken = JWTUtils.generateToken(adminPayload);
  });

  afterAll(async () => {
    // 清理测试数据
    if (testEnterprise) {
      // TODO: 清理测试企业数据
    }
    
    // 关闭数据库连接
    await db.disconnect();
  });

  beforeEach(() => {
    testEnterprise = null;
  });

  describe('POST /api/v1/enterprises', () => {
    it('should create a new enterprise', async () => {
      const enterpriseData = {
        name: 'Test Enterprise',
        domain: 'test.example.com',
        adminEmail: 'admin@test.example.com',
        adminName: 'Test Admin',
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(enterpriseData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          name: enterpriseData.name,
          domain: enterpriseData.domain,
          status: 'active',
          settings: expect.any(Object),
          subscriptionInfo: expect.any(Object),
        },
        message: 'Enterprise created successfully',
      });

      testEnterprise = response.body.data;
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/enterprises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Enterprise',
          // Missing adminEmail and adminName
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Missing required fields'),
        code: 'VALIDATION_ERROR',
      });
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/enterprises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Enterprise',
          adminEmail: 'invalid-email',
          adminName: 'Test Admin',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email format',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .post('/api/v1/enterprises')
        .send({
          name: 'Test Enterprise',
          adminEmail: 'admin@test.example.com',
          adminName: 'Test Admin',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'No authorization header provided',
        code: 'NO_AUTH_HEADER',
      });
    });
  });

  describe('GET /api/v1/enterprises', () => {
    it('should return list of enterprises', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          data: expect.any(Array),
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
            hasNext: expect.any(Boolean),
            hasPrev: expect.any(Boolean),
          },
        },
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5,
      });
    });
  });

  describe('GET /api/v1/enterprises/:id', () => {
    it('should return enterprise details', async () => {
      // 首先创建一个企业
      const createResponse = await request(app)
        .post('/api/v1/enterprises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Enterprise',
          adminEmail: 'admin@test.example.com',
          adminName: 'Test Admin',
        });

      const enterpriseId = createResponse.body.data.id;
      testEnterprise = createResponse.body.data;

      const response = await request(app)
        .get(`/api/v1/enterprises/${enterpriseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: enterpriseId,
          name: 'Test Enterprise',
          status: 'active',
        },
      });
    });

    it('should return 404 for non-existent enterprise', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Enterprise not found',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('GET /api/v1/enterprises/domain/:domain/check', () => {
    it('should check domain availability', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises/domain/available.example.com/check')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          domain: 'available.example.com',
          available: expect.any(Boolean),
        },
      });
    });

    it('should return validation error for invalid domain', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises/domain/invalid-domain/check')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid domain format',
        code: 'VALIDATION_ERROR',
      });
    });
  });
});
