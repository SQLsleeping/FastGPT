import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 验证必需的环境变量
const requiredEnvVars = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // 服务配置
  app: {
    env: process.env['NODE_ENV'] || 'development',
    port: parseInt(process.env['PORT'] || '3001', 10),
    apiPrefix: process.env['API_PREFIX'] || '/api/v1',
    trustProxy: process.env['TRUST_PROXY'] === 'true',
  },

  // 数据库配置
  database: {
    url: process.env['DATABASE_URL']!,
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432', 10),
    name: process.env['DB_NAME'] || 'user_management',
    user: process.env['DB_USER'] || 'username',
    password: process.env['DB_PASSWORD'] || 'password',
    ssl: process.env['DB_SSL'] === 'true',
    pool: {
      min: parseInt(process.env['DB_POOL_MIN'] || '5', 10),
      max: parseInt(process.env['DB_POOL_MAX'] || '20', 10),
    },
  },

  // MongoDB配置 (兼容现有FastGPT)
  mongodb: {
    uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/fastgpt',
    name: process.env['MONGODB_NAME'] || 'fastgpt',
  },

  // Redis配置
  redis: {
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0', 10),
    keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'fastgpt:user-mgmt:',
  },

  // JWT配置
  jwt: {
    secret: process.env['JWT_SECRET']!,
    expiresIn: process.env['JWT_EXPIRES_IN'] || '1h',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    algorithm: process.env['JWT_ALGORITHM'] || 'HS256',
  },

  // 加密配置
  encryption: {
    key: process.env['ENCRYPTION_KEY']!,
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
  },

  // 邮件配置
  email: {
    smtp: {
      host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
      port: parseInt(process.env['SMTP_PORT'] || '587', 10),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'] || '',
        pass: process.env['SMTP_PASSWORD'] || '',
      },
    },
    from: process.env['EMAIL_FROM'] || 'noreply@fastgpt.io',
  },

  // 多因素认证配置
  mfa: {
    issuer: process.env['MFA_ISSUER'] || 'FastGPT User Management',
    window: parseInt(process.env['MFA_WINDOW'] || '2', 10),
  },

  // 文件上传配置
  upload: {
    maxSize: parseInt(process.env['UPLOAD_MAX_SIZE'] || '10485760', 10), // 10MB
    allowedTypes: (
      process.env['UPLOAD_ALLOWED_TYPES'] || 'image/jpeg,image/png,image/gif,text/csv,application/vnd.ms-excel'
    ).split(','),
  },

  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15分钟
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
    skipSuccessfulRequests: process.env['RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS'] === 'true',
  },

  // 日志配置
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    format: process.env['LOG_FORMAT'] || 'combined',
    filePath: process.env['LOG_FILE_PATH'] || 'logs/app.log',
    maxSize: process.env['LOG_MAX_SIZE'] || '10m',
    maxFiles: parseInt(process.env['LOG_MAX_FILES'] || '5', 10),
  },

  // 安全配置
  security: {
    corsOrigin: (process.env['CORS_ORIGIN'] || 'http://localhost:3000,http://localhost:3002').split(','),
    allowedHosts: (process.env['ALLOWED_HOSTS'] || 'localhost,127.0.0.1').split(','),
  },

  // 监控配置
  monitoring: {
    metricsEnabled: process.env['METRICS_ENABLED'] === 'true',
    healthCheckEnabled: process.env['HEALTH_CHECK_ENABLED'] === 'true',
  },

  // 企业功能配置
  enterprise: {
    featuresEnabled: process.env['ENTERPRISE_FEATURES_ENABLED'] === 'true',
    maxEnterprises: parseInt(process.env['MAX_ENTERPRISES'] || '1000', 10),
    maxUsersPerEnterprise: parseInt(process.env['MAX_USERS_PER_ENTERPRISE'] || '10000', 10),
  },

  // 外部服务配置
  external: {
    fastgptApiUrl: process.env['FASTGPT_API_URL'] || 'http://localhost:3000/api',
    fastgptApiKey: process.env['FASTGPT_API_KEY'] || '',
  },

  // 开发配置
  development: {
    debug: process.env['DEBUG'] || '',
    swaggerEnabled: process.env['SWAGGER_ENABLED'] === 'true',
    apiDocsPath: process.env['API_DOCS_PATH'] || '/docs',
  },
};

// 配置验证
export const validateConfig = (): void => {
  const errors: string[] = [];

  // 验证端口范围
  if (config.app.port < 1 || config.app.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // 验证JWT密钥长度
  if (config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // 验证加密密钥长度
  if (config.encryption.key.length !== 32) {
    errors.push('ENCRYPTION_KEY must be exactly 32 characters long');
  }

  // 验证bcrypt轮数
  if (config.encryption.bcryptRounds < 10 || config.encryption.bcryptRounds > 15) {
    errors.push('BCRYPT_ROUNDS must be between 10 and 15');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// 导出环境检查函数
export const isDevelopment = (): boolean => config.app.env === 'development';
export const isProduction = (): boolean => config.app.env === 'production';
export const isTest = (): boolean => config.app.env === 'test';
