import { Request, Response, NextFunction } from 'express';
import { ResourceType, AuditLogDetails, DataChange } from '../types';
import { IDUtils } from '../utils';

/**
 * 审计日志中间件
 */
export class AuditMiddleware {
  /**
   * 记录API调用审计日志
   */
  static auditApiCall(action: string, resourceType: ResourceType) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const auditId = IDUtils.generateUUID();

      // 保存原始的 res.json 方法
      const originalJson = res.json;

      // 重写 res.json 方法以捕获响应
      res.json = function (body: unknown) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // 确定操作结果
        const result = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure';

        // 创建审计日志
        const auditLog = {
          id: auditId,
          userId: req.user?.userId || 'anonymous',
          enterpriseId: req.user?.enterpriseId,
          action,
          resourceType,
          resourceId: AuditMiddleware.extractResourceId(req, resourceType),
          details: AuditMiddleware.createAuditDetails(req, responseTime),
          result,
          riskLevel: AuditMiddleware.calculateRiskLevel(action, result),
          createdAt: new Date(),
        };

        // 异步记录审计日志（不阻塞响应）
        AuditMiddleware.recordAuditLog(auditLog).catch(error => {
          console.error('Failed to record audit log:', error);
        });

        // 调用原始的 json 方法
        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * 记录数据变更审计日志
   */
  static auditDataChange(action: string, resourceType: ResourceType, resourceIdParam?: string) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const auditId = IDUtils.generateUUID();

      // 保存原始数据（用于对比变更）
      const resourceId = resourceIdParam ? req.params[resourceIdParam] : undefined;
      req.auditContext = {
        auditId,
        action,
        resourceType,
        ...(resourceId && { resourceId }),
        originalData: null as unknown,
        startTime: Date.now(),
      };

      // 如果是更新操作，尝试获取原始数据
      if (['update', 'delete'].includes(action.toLowerCase())) {
        // TODO: 根据资源类型获取原始数据
        // req.auditContext.originalData = await getOriginalData(resourceType, resourceId);
      }

      next();
    };
  }

  /**
   * 完成数据变更审计日志记录
   */
  static completeDataChangeAudit() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.auditContext) {
        return next();
      }

      const originalJson = res.json;

      res.json = function (body: unknown) {
        const { auditContext } = req;
        if (!auditContext) {
          return originalJson.call(this, body);
        }

        const endTime = Date.now();
        const responseTime = endTime - auditContext.startTime;
        const result = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure';

        // 计算数据变更
        const changes = AuditMiddleware.calculateDataChanges(auditContext.originalData, body, auditContext.action);

        // 创建审计日志
        const auditLog = {
          id: auditContext.auditId,
          userId: req.user?.userId || 'anonymous',
          enterpriseId: req.user?.enterpriseId,
          action: auditContext.action,
          resourceType: auditContext.resourceType,
          resourceId: auditContext.resourceId || AuditMiddleware.extractResourceId(req, auditContext.resourceType),
          details: {
            ...AuditMiddleware.createAuditDetails(req, responseTime),
            changes,
          },
          result,
          riskLevel: AuditMiddleware.calculateRiskLevel(auditContext.action, result),
          createdAt: new Date(),
        };

        // 异步记录审计日志
        AuditMiddleware.recordAuditLog(auditLog).catch(error => {
          console.error('Failed to record audit log:', error);
        });

        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * 记录登录审计日志
   */
  static auditLogin() {
    return AuditMiddleware.auditApiCall('login', ResourceType.USER);
  }

  /**
   * 记录登出审计日志
   */
  static auditLogout() {
    return AuditMiddleware.auditApiCall('logout', ResourceType.USER);
  }

  /**
   * 记录权限变更审计日志
   */
  static auditPermissionChange() {
    return AuditMiddleware.auditDataChange('change_permission', ResourceType.USER);
  }

  /**
   * 提取资源ID
   */
  private static extractResourceId(req: Request, resourceType: ResourceType): string {
    const paramMap: Record<ResourceType, string[]> = {
      [ResourceType.USER]: ['userId', 'id'],
      [ResourceType.TEAM]: ['teamId', 'id'],
      [ResourceType.PROJECT]: ['projectId', 'id'],
      [ResourceType.DATASET]: ['datasetId', 'id'],
      [ResourceType.WORKFLOW]: ['workflowId', 'id'],
      [ResourceType.API]: ['apiId', 'id'],
      [ResourceType.ENTERPRISE]: ['enterpriseId', 'id'],
      [ResourceType.DEPARTMENT]: ['departmentId', 'id'],
    };

    const possibleParams = paramMap[resourceType] || ['id'];

    for (const param of possibleParams) {
      if (req.params[param]) {
        return req.params[param];
      }
    }

    return 'unknown';
  }

  /**
   * 创建审计详情
   */
  private static createAuditDetails(req: Request, responseTime: number): AuditLogDetails {
    return {
      method: req.method,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent') || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      responseTime,
      requestBody: AuditMiddleware.sanitizeRequestBody(req.body),
      queryParams: req.query,
    };
  }

  /**
   * 清理请求体中的敏感信息
   */
  private static sanitizeRequestBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...(body as Record<string, unknown>) };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * 计算风险等级
   */
  private static calculateRiskLevel(action: string, result: 'success' | 'failure'): 'low' | 'medium' | 'high' {
    const highRiskActions = [
      'delete_user',
      'delete_enterprise',
      'change_user_role',
      'grant_admin_permission',
      'delete_department',
      'export_user_data',
      'change_enterprise_settings',
      'disable_user',
      'reset_user_password',
    ];

    const mediumRiskActions = [
      'create_user',
      'update_user',
      'create_department',
      'update_department',
      'create_role',
      'update_role',
      'assign_role',
      'revoke_role',
      'login',
      'logout',
    ];

    // 失败操作风险等级更高
    if (result === 'failure') {
      if (highRiskActions.includes(action)) return 'high';
      if (mediumRiskActions.includes(action)) return 'high';
      return 'medium';
    }

    // 成功操作根据操作类型判断
    if (highRiskActions.includes(action)) return 'high';
    if (mediumRiskActions.includes(action)) return 'medium';
    return 'low';
  }

  /**
   * 计算数据变更
   */
  private static calculateDataChanges(originalData: unknown, newData: unknown, action: string): DataChange[] {
    const changes: DataChange[] = [];

    if (action.toLowerCase() === 'create') {
      // 创建操作：所有字段都是新增
      if (newData && typeof newData === 'object') {
        const data = newData as Record<string, unknown>;
        for (const [field, value] of Object.entries(data)) {
          if (!AuditMiddleware.isSensitiveField(field)) {
            changes.push({
              field,
              oldValue: null,
              newValue: value,
              changeType: 'create',
            });
          }
        }
      }
    } else if (action.toLowerCase() === 'delete') {
      // 删除操作：所有字段都被删除
      if (originalData && typeof originalData === 'object') {
        const data = originalData as Record<string, unknown>;
        for (const [field, value] of Object.entries(data)) {
          if (!AuditMiddleware.isSensitiveField(field)) {
            changes.push({
              field,
              oldValue: value,
              newValue: null,
              changeType: 'delete',
            });
          }
        }
      }
    } else if (action.toLowerCase() === 'update') {
      // 更新操作：比较字段变更
      if (originalData && newData && typeof originalData === 'object' && typeof newData === 'object') {
        const oldData = originalData as Record<string, unknown>;
        const newDataObj = newData as Record<string, unknown>;

        const allFields = new Set([...Object.keys(oldData), ...Object.keys(newDataObj)]);

        for (const field of allFields) {
          if (AuditMiddleware.isSensitiveField(field)) continue;

          const oldValue = oldData[field];
          const newValue = newDataObj[field];

          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
              field,
              oldValue,
              newValue,
              changeType: 'update',
            });
          }
        }
      }
    }

    return changes;
  }

  /**
   * 检查是否为敏感字段
   */
  private static isSensitiveField(field: string): boolean {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'mfa_secret'];
    return sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive.toLowerCase()));
  }

  /**
   * 记录审计日志到数据库
   */
  private static async recordAuditLog(auditLog: unknown): Promise<void> {
    try {
      // TODO: 实现审计日志存储
      // await AuditLogDAO.create(auditLog);
      console.log('Audit log recorded:', auditLog);
    } catch (error) {
      console.error('Failed to record audit log:', error);
      // 可以考虑将失败的审计日志写入文件或发送到外部系统
    }
  }
}

// 扩展 Request 接口以支持审计上下文
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        auditId: string;
        action: string;
        resourceType: ResourceType;
        resourceId?: string;
        originalData: unknown;
        startTime: number;
      };
    }
  }
}
