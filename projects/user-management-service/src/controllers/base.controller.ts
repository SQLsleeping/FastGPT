import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationQuery } from '../types';
import { db } from '../config/database';

/**
 * 基础控制器类
 * 提供通用的响应方法和分页处理
 */
export abstract class BaseController {
  /**
   * 成功响应
   */
  protected success<T>(res: Response, data?: T, message?: string): void {
    const response: ApiResponse<T> = {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
    };
    res.status(200).json(response);
  }

  /**
   * 创建成功响应
   */
  protected created<T>(res: Response, data?: T, message?: string): void {
    const response: ApiResponse<T> = {
      success: true,
      ...(data !== undefined && { data }),
      message: message || 'Resource created successfully',
    };
    res.status(201).json(response);
  }

  /**
   * 无内容响应
   */
  protected noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * 错误响应
   */
  protected error(res: Response, message: string, statusCode = 400, code?: string): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      ...(code && { code }),
    };
    res.status(statusCode).json(response);
  }

  /**
   * 验证错误响应
   */
  protected validationError(res: Response, message: string, details?: unknown): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      data: details,
    };
    res.status(400).json(response);
  }

  /**
   * 未找到响应
   */
  protected notFound(res: Response, message = 'Resource not found'): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'NOT_FOUND',
    };
    res.status(404).json(response);
  }

  /**
   * 未授权响应
   */
  protected unauthorized(res: Response, message = 'Unauthorized'): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
    };
    res.status(401).json(response);
  }

  /**
   * 禁止访问响应
   */
  protected forbidden(res: Response, message = 'Forbidden'): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'FORBIDDEN',
    };
    res.status(403).json(response);
  }

  /**
   * 冲突响应
   */
  protected conflict(res: Response, message = 'Resource conflict'): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'CONFLICT',
    };
    res.status(409).json(response);
  }

  /**
   * 服务器错误响应
   */
  protected serverError(res: Response, message = 'Internal server error'): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }

  /**
   * 分页响应
   */
  protected paginated<T>(res: Response, data: T[], total: number, page: number, limit: number, message?: string): void {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      data: {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
      ...(message && { message }),
    };

    res.status(200).json(response);
  }

  /**
   * 解析分页参数
   */
  protected parsePagination(req: Request): PaginationQuery {
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
    const sortBy = (req.query['sortBy'] as string) || 'createdAt';
    const sortOrder = (req.query['sortOrder'] as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  /**
   * 解析查询参数
   */
  protected parseQuery(req: Request, allowedFields: string[]): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.query[field] !== undefined) {
        query[field] = req.query[field];
      }
    }

    return query;
  }

  /**
   * 验证必需参数
   */
  protected validateRequired(data: Record<string, unknown>, requiredFields: string[]): string[] {
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missing.push(field);
      }
    }

    return missing;
  }

  /**
   * 异步错误处理包装器
   */
  protected asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return (req: Request, res: Response): void => {
      Promise.resolve(fn(req, res)).catch(error => {
        console.error('Controller error:', error);
        this.serverError(res, error.message);
      });
    };
  }

  /**
   * 获取当前用户ID
   */
  protected getCurrentUserId(req: Request): string | null {
    return req.user?.userId || null;
  }

  /**
   * 获取当前企业ID
   */
  protected getCurrentEnterpriseId(req: Request): string | null {
    return req.user?.enterpriseId || null;
  }

  /**
   * 检查用户是否为管理员
   */
  protected isAdmin(req: Request): boolean {
    return req.user?.roles.some(role => ['Super Admin', 'Enterprise Admin'].includes(role)) || false;
  }

  /**
   * 检查用户是否为企业管理员
   */
  protected isEnterpriseAdmin(req: Request): boolean {
    return req.user?.roles.some(role => ['Super Admin', 'Enterprise Admin'].includes(role)) || false;
  }

  /**
   * 获取数据库连接
   */
  protected getDB() {
    return db;
  }

  /**
   * 执行数据库事务
   */
  protected async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const postgresql = db.getPostgreSQL();
    return await postgresql.transaction(async () => {
      return await callback();
    });
  }

  /**
   * 缓存响应
   */
  protected async cacheResponse(key: string, data: unknown, ttl = 300): Promise<void> {
    try {
      const redis = db.getRedis();
      await redis.set(key, JSON.stringify(data), ttl);
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  /**
   * 获取缓存响应
   */
  protected async getCachedResponse<T>(key: string): Promise<T | null> {
    try {
      const redis = db.getRedis();
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to get cached response:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  protected async clearCache(key: string): Promise<void> {
    try {
      const redis = db.getRedis();
      await redis.del(key);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}
