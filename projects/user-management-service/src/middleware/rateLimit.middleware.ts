import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils';

/**
 * 速率限制中间件配置接口
 */
interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  max: number; // 最大请求数
  message?: string; // 超限时的错误消息
  skipSuccessfulRequests?: boolean; // 是否跳过成功的请求
  skipFailedRequests?: boolean; // 是否跳过失败的请求
  keyGenerator?: (req: Request) => string; // 自定义键生成器
}

/**
 * 创建速率限制中间件
 */
export const rateLimitMiddleware = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator:
      keyGenerator ||
      ((req: Request) => {
        // 优先使用用户ID，其次使用IP地址
        return req.user?.userId || req.ip;
      }),
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.userId,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });

      res.status(429).json({
        success: false,
        message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
    onLimitReached: (req: Request) => {
      logger.warn('Rate limit reached', {
        ip: req.ip,
        userId: req.user?.userId,
        path: req.path,
        method: req.method,
      });
    },
  });
};

/**
 * 预定义的速率限制配置
 */
export const rateLimitConfigs = {
  // 严格限制（登录、注册等敏感操作）
  strict: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次请求
    message: 'Too many attempts, please try again in 15 minutes',
  },

  // 中等限制（密码重置等）
  moderate: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 10, // 最多10次请求
    message: 'Too many requests, please try again in 1 hour',
  },

  // 宽松限制（一般API调用）
  lenient: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 最多100次请求
    message: 'Too many requests, please try again later',
  },

  // 邮件发送限制
  email: {
    windowMs: 10 * 60 * 1000, // 10分钟
    max: 3, // 最多3次请求
    message: 'Too many email requests, please try again in 10 minutes',
  },
};

/**
 * 基于用户的速率限制中间件
 */
export const userRateLimitMiddleware = (options: RateLimitOptions) => {
  return rateLimitMiddleware({
    ...options,
    keyGenerator: (req: Request) => {
      // 如果用户已登录，使用用户ID；否则使用IP地址
      return req.user?.userId || `ip:${req.ip}`;
    },
  });
};

/**
 * 基于IP的速率限制中间件
 */
export const ipRateLimitMiddleware = (options: RateLimitOptions) => {
  return rateLimitMiddleware({
    ...options,
    keyGenerator: (req: Request) => req.ip,
  });
};

/**
 * 基于企业的速率限制中间件
 */
export const enterpriseRateLimitMiddleware = (options: RateLimitOptions) => {
  return rateLimitMiddleware({
    ...options,
    keyGenerator: (req: Request) => {
      // 如果有企业信息，使用企业ID；否则使用用户ID或IP
      return req.user?.enterpriseId || req.user?.userId || `ip:${req.ip}`;
    },
  });
};

/**
 * 动态速率限制中间件
 * 根据用户类型或企业等级应用不同的限制
 */
export const dynamicRateLimitMiddleware = () => {
  return (req: Request, res: Response, next: Function) => {
    let limitConfig = rateLimitConfigs.lenient;

    // 根据用户角色或企业等级调整限制
    if (req.user?.roles?.includes('admin')) {
      // 管理员用户更宽松的限制
      limitConfig = {
        windowMs: 15 * 60 * 1000,
        max: 200,
        message: 'Admin rate limit exceeded',
      };
    } else if (req.user?.enterpriseId) {
      // 企业用户中等限制
      limitConfig = rateLimitConfigs.moderate;
    } else {
      // 普通用户或未登录用户严格限制
      limitConfig = rateLimitConfigs.strict;
    }

    const middleware = rateLimitMiddleware(limitConfig);
    middleware(req, res, next);
  };
};

/**
 * 全局速率限制中间件
 * 应用于所有API端点的基础限制
 */
export const globalRateLimitMiddleware = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: 'Global rate limit exceeded, please try again later',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * API密钥速率限制中间件
 * 用于API密钥认证的端点
 */
export const apiKeyRateLimitMiddleware = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10000, // 每个API密钥最多10000次请求
  message: 'API key rate limit exceeded',
  keyGenerator: (req: Request) => {
    // 从请求头中获取API密钥
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey || req.ip;
  },
});
