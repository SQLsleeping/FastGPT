import { Request, Response, NextFunction } from 'express';
import { ResourceType, PermissionAction } from '@/types';
// import { db } from '@/config/database';

/**
 * 权限检查中间件
 */
export class PermissionMiddleware {
  /**
   * 检查用户是否有特定资源的权限
   */
  static checkPermission(resourceType: ResourceType, action: PermissionAction, _resourceIdParam?: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
          });
          return;
        }

        // const resourceId = resourceIdParam ? req.params[resourceIdParam] : undefined;

        // TODO: 实现权限检查逻辑
        // const hasPermission = await PermissionService.checkUserPermission(
        //   req.user.userId,
        //   resourceType,
        //   action,
        //   resourceId
        // );

        // 临时实现：基于角色的简单权限检查
        const hasPermission = await this.checkRoleBasedPermission(req.user.roles, resourceType, action);

        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: `Insufficient permissions for ${action} on ${resourceType}`,
            code: 'INSUFFICIENT_PERMISSION',
          });
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 检查企业级权限
   */
  static checkEnterprisePermission(resourceType: ResourceType, action: PermissionAction, _resourceIdParam?: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
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

        // const resourceId = resourceIdParam ? req.params[resourceIdParam] : undefined;

        // TODO: 实现企业级权限检查
        // const hasPermission = await PermissionService.checkEnterprisePermission(
        //   req.user.userId,
        //   req.user.enterpriseId,
        //   resourceType,
        //   action,
        //   resourceId
        // );

        // 临时实现
        const hasPermission = await this.checkRoleBasedPermission(req.user.roles, resourceType, action);

        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: `Insufficient enterprise permissions for ${action} on ${resourceType}`,
            code: 'INSUFFICIENT_ENTERPRISE_PERMISSION',
          });
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 检查资源所有权
   */
  static checkResourceOwnership(_resourceType: ResourceType, resourceIdParam: string, _ownerIdField = 'ownerId') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
          });
          return;
        }

        const resourceId = req.params[resourceIdParam];

        if (!resourceId) {
          res.status(400).json({
            success: false,
            error: 'Resource ID is required',
            code: 'RESOURCE_ID_REQUIRED',
          });
          return;
        }

        // TODO: 实现资源所有权检查
        // const resource = await ResourceService.getResource(resourceType, resourceId);
        // const isOwner = resource[ownerIdField] === req.user.userId;

        // 临时实现：管理员可以访问所有资源
        const isAdmin = req.user.roles.some(role => ['Super Admin', 'Enterprise Admin'].includes(role));

        if (!isAdmin) {
          res.status(403).json({
            success: false,
            error: 'Resource access denied',
            code: 'RESOURCE_ACCESS_DENIED',
          });
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 检查部门权限
   */
  static checkDepartmentPermission(_action: PermissionAction, _departmentIdParam = 'departmentId') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
          });
          return;
        }

        // const departmentId = req.params[departmentIdParam];

        // TODO: 实现部门权限检查
        // 1. 检查用户是否属于该部门
        // 2. 检查用户是否是部门管理员
        // 3. 检查用户是否有跨部门权限

        // 临时实现：企业管理员可以访问所有部门
        const isEnterpriseAdmin = req.user.roles.some(role => ['Super Admin', 'Enterprise Admin'].includes(role));

        if (!isEnterpriseAdmin) {
          res.status(403).json({
            success: false,
            error: 'Department access denied',
            code: 'DEPARTMENT_ACCESS_DENIED',
          });
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 检查团队权限
   */
  static checkTeamPermission(_action: PermissionAction, _teamIdParam = 'teamId') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
          });
          return;
        }

        // const teamId = req.params[teamIdParam];

        // TODO: 实现团队权限检查
        // 1. 检查用户是否是团队成员
        // 2. 检查用户在团队中的角色
        // 3. 检查具体的操作权限

        // 临时实现：管理员和团队成员可以访问
        const isAdmin = req.user.roles.some(role => ['Super Admin', 'Enterprise Admin', 'Team Leader'].includes(role));

        if (!isAdmin) {
          res.status(403).json({
            success: false,
            error: 'Team access denied',
            code: 'TEAM_ACCESS_DENIED',
          });
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 基于角色的权限检查（临时实现）
   */
  private static async checkRoleBasedPermission(
    userRoles: string[],
    resourceType: ResourceType,
    action: PermissionAction,
  ): Promise<boolean> {
    // 超级管理员拥有所有权限
    if (userRoles.includes('Super Admin')) {
      return true;
    }

    // 企业管理员权限
    if (userRoles.includes('Enterprise Admin')) {
      return [ResourceType.ENTERPRISE, ResourceType.USER, ResourceType.TEAM, ResourceType.DEPARTMENT].includes(
        resourceType,
      );
    }

    // 部门管理员权限
    if (userRoles.includes('Department Manager')) {
      return (
        [ResourceType.USER, ResourceType.TEAM].includes(resourceType) &&
        [PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.MANAGE].includes(action)
      );
    }

    // 团队负责人权限
    if (userRoles.includes('Team Leader')) {
      return (
        [ResourceType.TEAM, ResourceType.PROJECT].includes(resourceType) &&
        [PermissionAction.READ, PermissionAction.UPDATE].includes(action)
      );
    }

    // 普通用户权限
    if (userRoles.includes('User')) {
      return (
        [ResourceType.USER, ResourceType.DATASET, ResourceType.WORKFLOW].includes(resourceType) &&
        action === PermissionAction.READ
      );
    }

    return false;
  }

  // TODO: 实现权限缓存功能
}
