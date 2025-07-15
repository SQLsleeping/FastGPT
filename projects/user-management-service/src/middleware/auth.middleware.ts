import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils';
import { AppError } from '../types';
import { db } from '../config/database';

/**
 * JWT认证中间件
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('No authorization header provided', 401, 'NO_AUTH_HEADER');
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    // 验证JWT令牌
    const payload = JWTUtils.verifyToken(token);

    // TODO: 检查令牌是否在黑名单中
    // const redis = db.getRedis();
    // const isBlacklisted = await redis.exists(`blacklist:${token}`);
    // if (isBlacklisted) {
    //   throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    // }

    // 将用户信息添加到请求对象
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }
  }
};

/**
 * 可选的JWT认证中间件（不强制要求认证）
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

      if (token) {
        try {
          const payload = JWTUtils.verifyToken(token);

          // 检查令牌是否在黑名单中
          const redis = db.getRedis();
          const isBlacklisted = await redis.exists(`blacklist:${token}`);

          if (!isBlacklisted) {
            req.user = payload;
          }
        } catch {
          // 忽略认证错误，继续处理请求
        }
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不阻止请求
    next();
  }
};

/**
 * 企业上下文中间件
 * 根据用户的企业ID设置企业上下文
 */
export const enterpriseContext = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.enterpriseId) {
      return next();
    }

    // TODO: 从数据库获取企业信息
    // const enterprise = await EnterpriseDAO.findById(req.user.enterpriseId);
    // req.enterprise = enterprise;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const hasAdminRole = req.user.roles.some(role => ['Super Admin', 'Enterprise Admin'].includes(role));

  if (!hasAdminRole) {
    res.status(403).json({
      success: false,
      error: 'Admin privileges required',
      code: 'ADMIN_REQUIRED',
    });
    return;
  }

  next();
};

/**
 * 企业管理员权限检查中间件
 */
export const requireEnterpriseAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!req.user.enterpriseId) {
    res.status(403).json({
      success: false,
      error: 'Enterprise context required',
      code: 'ENTERPRISE_REQUIRED',
    });
    return;
  }

  const hasEnterpriseAdminRole = req.user.roles.some(role => ['Super Admin', 'Enterprise Admin'].includes(role));

  if (!hasEnterpriseAdminRole) {
    res.status(403).json({
      success: false,
      error: 'Enterprise admin privileges required',
      code: 'ENTERPRISE_ADMIN_REQUIRED',
    });
    return;
  }

  next();
};

/**
 * 角色检查中间件工厂
 */
export const requireRole = (requiredRoles: string | string[]) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const hasRequiredRole = req.user.roles.some(userRole => roles.includes(userRole));

    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        error: `Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE',
      });
      return;
    }

    next();
  };
};

/**
 * 权限检查中间件工厂
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const hasPermission = req.user.permissions.includes(permission);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `Required permission: ${permission}`,
        code: 'INSUFFICIENT_PERMISSION',
      });
      return;
    }

    next();
  };
};

/**
 * 用户自身或管理员权限检查中间件
 */
export const requireSelfOrAdmin = (userIdParam = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const targetUserId = req.params[userIdParam];
    const isOwner = req.user.userId === targetUserId;
    const isAdmin = req.user.roles.some(role => ['Super Admin', 'Enterprise Admin'].includes(role));

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied: can only access own resources or admin required',
        code: 'ACCESS_DENIED',
      });
      return;
    }

    next();
  };
};
