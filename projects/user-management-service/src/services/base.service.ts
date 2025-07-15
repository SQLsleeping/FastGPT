import { db } from '@/config/database';
import { AppError } from '@/types';

/**
 * 基础服务类
 * 提供通用的数据库操作和缓存功能
 */
export abstract class BaseService {
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
   * 缓存数据
   */
  protected async cache(key: string, data: unknown, ttl = 300): Promise<void> {
    try {
      const redis = db.getRedis();
      await redis.set(key, JSON.stringify(data), ttl);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * 获取缓存数据
   */
  protected async getCache<T>(key: string): Promise<T | null> {
    try {
      const redis = db.getRedis();
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
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

  /**
   * 批量清除缓存（支持通配符）
   */
  protected async clearCachePattern(pattern: string): Promise<void> {
    try {
      // const redis = db.getRedis();
      // TODO: 实现通配符缓存清除
      // 这需要使用 Redis 的 SCAN 命令
      console.log(`Clearing cache pattern: ${pattern}`);
    } catch (error) {
      console.warn('Failed to clear cache pattern:', error);
    }
  }

  /**
   * 验证必需字段
   */
  protected validateRequired(data: Record<string, unknown>, requiredFields: string[]): void {
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * 验证数据格式
   */
  protected validateFormat(
    data: Record<string, unknown>,
    validators: Record<string, (value: unknown) => boolean>,
  ): void {
    const errors: string[] = [];

    for (const [field, validator] of Object.entries(validators)) {
      if (data[field] !== undefined && !validator(data[field])) {
        errors.push(`Invalid format for field: ${field}`);
      }
    }

    if (errors.length > 0) {
      throw new AppError(errors.join('; '), 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * 分页查询辅助方法
   */
  protected buildPaginationQuery(page: number, limit: number): { offset: number; limit: number } {
    const offset = (page - 1) * limit;
    return { offset, limit };
  }

  /**
   * 构建排序查询
   */
  protected buildSortQuery(sortBy: string, sortOrder: 'asc' | 'desc', allowedFields: string[]): string {
    if (!allowedFields.includes(sortBy)) {
      sortBy = 'created_at';
    }

    return `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
  }

  /**
   * 构建WHERE条件
   */
  protected buildWhereConditions(
    conditions: Record<string, unknown>,
    allowedFields: string[],
  ): { whereClause: string; values: unknown[] } {
    const whereParts: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(conditions)) {
      if (!allowedFields.includes(field) || value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        // IN 查询
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        whereParts.push(`${field} IN (${placeholders})`);
        values.push(...value);
      } else if (typeof value === 'string' && value.includes('%')) {
        // LIKE 查询
        whereParts.push(`${field} LIKE $${paramIndex++}`);
        values.push(value);
      } else {
        // 等值查询
        whereParts.push(`${field} = $${paramIndex++}`);
        values.push(value);
      }
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    return { whereClause, values };
  }

  /**
   * 处理数据库错误
   */
  protected handleDatabaseError(error: unknown, operation: string): never {
    console.error(`Database error in ${operation}:`, error);

    if (error instanceof Error) {
      // PostgreSQL 错误处理
      if ('code' in error) {
        const pgError = error as { code: string; detail?: string };

        switch (pgError.code) {
          case '23505': // unique_violation
            throw new AppError('Resource already exists', 409, 'DUPLICATE_RESOURCE');
          case '23503': // foreign_key_violation
            throw new AppError('Referenced resource not found', 400, 'INVALID_REFERENCE');
          case '23514': // check_violation
            throw new AppError('Data validation failed', 400, 'VALIDATION_ERROR');
          default:
            throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
        }
      }

      throw new AppError(error.message, 500, 'DATABASE_ERROR');
    }

    throw new AppError('Unknown database error', 500, 'DATABASE_ERROR');
  }

  /**
   * 记录操作日志
   */
  protected async logOperation(
    operation: string,
    resourceType: string,
    resourceId: string,
    userId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      // TODO: 实现操作日志记录
      console.log('Operation log:', {
        operation,
        resourceType,
        resourceId,
        userId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to log operation:', error);
    }
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    // 使用 UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 延迟执行
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试机制
   */
  protected async retry<T>(operation: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (i === maxRetries) {
          break;
        }

        await this.delay(delayMs * Math.pow(2, i)); // 指数退避
      }
    }

    throw lastError!;
  }
}
