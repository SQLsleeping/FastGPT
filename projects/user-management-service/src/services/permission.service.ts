import { BaseService } from './base.service';
import { teamDAO } from '../models/team.model';
import { userDAO } from '../models/user.model';
import { logger } from '../utils';
import { AppError } from '../types';

/**
 * 权限枚举
 */
export enum Permission {
  // 团队权限
  TEAM_CREATE = 'team:create',
  TEAM_READ = 'team:read',
  TEAM_UPDATE = 'team:update',
  TEAM_DELETE = 'team:delete',
  TEAM_MANAGE_MEMBERS = 'team:manage_members',
  TEAM_INVITE_MEMBERS = 'team:invite_members',

  // 项目权限
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE = 'project:manage',

  // 系统权限
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_USER_MANAGE = 'system:user_manage',
  SYSTEM_SETTINGS = 'system:settings',
}

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS = {
  // 团队角色权限
  owner: [
    Permission.TEAM_CREATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_DELETE,
    Permission.TEAM_MANAGE_MEMBERS,
    Permission.TEAM_INVITE_MEMBERS,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE,
  ],
  admin: [
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_MANAGE_MEMBERS,
    Permission.TEAM_INVITE_MEMBERS,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE,
  ],
  member: [Permission.TEAM_READ, Permission.PROJECT_CREATE, Permission.PROJECT_READ, Permission.PROJECT_UPDATE],
  viewer: [Permission.TEAM_READ, Permission.PROJECT_READ],

  // 系统角色权限
  system_admin: [
    Permission.SYSTEM_ADMIN,
    Permission.SYSTEM_USER_MANAGE,
    Permission.SYSTEM_SETTINGS,
    ...Object.values(Permission), // 系统管理员拥有所有权限
  ],
};

/**
 * 权限管理服务
 */
export class PermissionService extends BaseService {
  /**
   * 检查用户是否有指定权限
   */
  public async hasPermission(userId: string, permission: Permission, resourceId?: string): Promise<boolean> {
    try {
      // 获取用户信息
      const user = await userDAO.findById(userId);
      if (!user) {
        return false;
      }

      // 检查系统级权限
      if (await this.hasSystemPermission(userId, permission)) {
        return true;
      }

      // 如果需要资源ID（如团队ID），检查资源级权限
      if (resourceId) {
        return await this.hasResourcePermission(userId, permission, resourceId);
      }

      // 检查用户的基础权限
      return await this.hasUserPermission(userId, permission);
    } catch (error) {
      logger.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * 检查用户在特定团队中的权限
   */
  public async hasTeamPermission(userId: string, teamId: string, permission: Permission): Promise<boolean> {
    try {
      // 获取用户在团队中的角色
      const member = await teamDAO.getMember(teamId, userId);
      if (!member) {
        return false;
      }

      // 检查角色是否有该权限
      const rolePermissions = ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS] || [];
      if (rolePermissions.includes(permission)) {
        return true;
      }

      // 检查用户的自定义权限
      if (member.permissions.includes(permission)) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Team permission check failed:', error);
      return false;
    }
  }

  /**
   * 获取用户的所有权限
   */
  public async getUserPermissions(userId: string, teamId?: string): Promise<Permission[]> {
    try {
      const permissions = new Set<Permission>();

      // 获取系统级权限
      const systemPermissions = await this.getSystemPermissions(userId);
      systemPermissions.forEach(p => permissions.add(p));

      // 如果指定了团队，获取团队权限
      if (teamId) {
        const teamPermissions = await this.getTeamPermissions(userId, teamId);
        teamPermissions.forEach(p => permissions.add(p));
      }

      return Array.from(permissions);
    } catch (error) {
      logger.error('Get user permissions failed:', error);
      return [];
    }
  }

  /**
   * 检查用户是否为团队管理员（所有者或管理员）
   */
  public async isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
    try {
      return await teamDAO.isAdminOrOwner(teamId, userId);
    } catch (error) {
      logger.error('Team admin check failed:', error);
      return false;
    }
  }

  /**
   * 检查用户是否为团队所有者
   */
  public async isTeamOwner(userId: string, teamId: string): Promise<boolean> {
    try {
      const team = await teamDAO.findById(teamId);
      return team?.ownerId === userId;
    } catch (error) {
      logger.error('Team owner check failed:', error);
      return false;
    }
  }

  /**
   * 验证权限并抛出错误（如果没有权限）
   */
  public async requirePermission(userId: string, permission: Permission, resourceId?: string): Promise<void> {
    const hasPermission = await this.hasPermission(userId, permission, resourceId);
    if (!hasPermission) {
      throw new AppError('Access denied: insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
  }

  /**
   * 验证团队权限并抛出错误（如果没有权限）
   */
  public async requireTeamPermission(userId: string, teamId: string, permission: Permission): Promise<void> {
    const hasPermission = await this.hasTeamPermission(userId, teamId, permission);
    if (!hasPermission) {
      throw new AppError('Access denied: insufficient team permissions', 403, 'INSUFFICIENT_TEAM_PERMISSIONS');
    }
  }

  // 私有辅助方法

  /**
   * 检查系统级权限
   */
  private async hasSystemPermission(userId: string, permission: Permission): Promise<boolean> {
    // TODO: 实现系统角色检查
    // 这里可以检查用户是否有系统管理员角色等
    return false;
  }

  /**
   * 检查资源级权限
   */
  private async hasResourcePermission(userId: string, permission: Permission, resourceId: string): Promise<boolean> {
    // 假设resourceId是teamId，检查团队权限
    return await this.hasTeamPermission(userId, resourceId, permission);
  }

  /**
   * 检查用户基础权限
   */
  private async hasUserPermission(userId: string, permission: Permission): Promise<boolean> {
    // TODO: 实现用户基础权限检查
    // 这里可以检查用户的全局权限设置
    return false;
  }

  /**
   * 获取系统级权限
   */
  private async getSystemPermissions(userId: string): Promise<Permission[]> {
    // TODO: 实现系统权限获取
    return [];
  }

  /**
   * 获取团队权限
   */
  private async getTeamPermissions(userId: string, teamId: string): Promise<Permission[]> {
    try {
      const member = await teamDAO.getMember(teamId, userId);
      if (!member) {
        return [];
      }

      const rolePermissions = ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS] || [];
      const customPermissions = member.permissions as Permission[];

      return [...rolePermissions, ...customPermissions];
    } catch (error) {
      logger.error('Get team permissions failed:', error);
      return [];
    }
  }
}

// 导出单例实例
export const permissionService = new PermissionService();
