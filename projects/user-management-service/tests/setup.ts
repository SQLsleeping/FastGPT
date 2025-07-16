import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// 全局测试设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_user_management';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  
  // TODO: 初始化测试数据库连接
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // TODO: 清理测试数据库连接
  console.log('Cleaning up test environment...');
});

beforeEach(async () => {
  // TODO: 每个测试前的设置
});

afterEach(async () => {
  // TODO: 每个测试后的清理
});

// 全局测试工具函数
export const createTestUser = () => {
  return {
    id: 'test-user-id',
    username: 'testuser@example.com',
    email: 'testuser@example.com',
    password: 'hashedpassword',
    status: 'active',
    timezone: 'UTC',
    promotionRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createTestEnterprise = () => {
  return {
    id: 'test-enterprise-id',
    name: 'Test Enterprise',
    domain: 'test.example.com',
    settings: {
      allowSelfRegistration: true,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        maxAge: 90,
      },
      branding: {
        primaryColor: '#007bff',
      },
      features: {},
    },
    subscriptionInfo: {
      plan: 'basic',
      status: 'active',
      maxUsers: 100,
      maxStorage: 1000000000,
      maxApiCalls: 10000,
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createTestJWTPayload = () => {
  return {
    userId: 'test-user-id',
    enterpriseId: 'test-enterprise-id',
    roles: ['user'],
    permissions: ['read', 'write'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
};
