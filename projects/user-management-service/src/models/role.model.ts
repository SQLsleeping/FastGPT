import { BaseEntity, PermissionRule, ResourceType, PermissionAction } from '@/types';

/**
 * 角色数据模型
 */
export interface RoleModel extends BaseEntity {
  _name: string;
  description: string;
  permissions: PermissionRule[];
  isSystem: boolean;
  enterpriseId?: string;
  inheritFrom?: string[];
}

/**
 * 角色创建数据
 */
export interface CreateRoleData {
  _name: string;
  description: string;
  permissions?: PermissionRule[];
  isSystem?: boolean;
  enterpriseId?: string;
  inheritFrom?: string[];
}

/**
 * 角色更新数据
 */
export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: PermissionRule[];
  inheritFrom?: string[];
}

/**
 * 角色查询条件
 */
export interface RoleQuery {
  name?: string;
  isSystem?: boolean;
  enterpriseId?: string;
  hasPermission?: {
    _resourceType: ResourceType;
    _action: PermissionAction;
  };
}

/**
 * 角色数据访问对象
 */
export class RoleDAO {
  /**
   * 创建角色
   */
  static async create(_data: CreateRoleData): Promise<RoleModel> {
    // TODO: 实现数据库创建逻辑
    // 1. 验证角色名称唯一性
    // 2. 验证继承角色存在
    // 3. 创建角色记录
    throw new Error('Not implemented');
  }

  /**
   * 根据ID查找角色
   */
  static async findById(_id: string): Promise<RoleModel | null> {
    // TODO: 实现数据库查询逻辑
    throw new Error('Not implemented');
  }

  /**
   * 根据名称查找角色
   */
  static async findByName(_name: string, _enterpriseId?: string): Promise<RoleModel | null> {
    // TODO: 实现数据库查询逻辑
    throw new Error('Not implemented');
  }

  /**
   * 获取系统角色列表
   */
  static async getSystemRoles(): Promise<RoleModel[]> {
    // TODO: 实现系统角色查询逻辑
    throw new Error('Not implemented');
  }

  /**
   * 获取企业角色列表
   */
  static async getEnterpriseRoles(_enterpriseId: string): Promise<RoleModel[]> {
    // TODO: 实现企业角色查询逻辑
    throw new Error('Not implemented');
  }

  /**
   * 更新角色信息
   */
  static async update(_id: string, _data: UpdateRoleData): Promise<RoleModel | null> {
    // TODO: 实现数据库更新逻辑
    // 1. 验证角色存在
    // 2. 如果更新名称，检查唯一性
    // 3. 如果更新继承，检查循环引用
    // 4. 更新角色记录
    throw new Error('Not implemented');
  }

  /**
   * 删除角色
   */
  static async delete(_id: string): Promise<boolean> {
    // TODO: 实现数据库删除逻辑
    // 1. 检查是否为系统角色
    // 2. 检查是否有用户使用此角色
    // 3. 检查是否有其他角色继承此角色
    // 4. 删除角色记录
    throw new Error('Not implemented');
  }

  /**
   * 添加权限到角色
   */
  static async addPermission(_roleId: string, _permission: PermissionRule): Promise<boolean> {
    // TODO: 实现权限添加逻辑
    throw new Error('Not implemented');
  }

  /**
   * 从角色移除权限
   */
  static async removePermission(_roleId: string, _permissionId: string): Promise<boolean> {
    // TODO: 实现权限移除逻辑
    throw new Error('Not implemented');
  }

  /**
   * 获取角色的所有权限（包括继承的权限）
   */
  static async getAllPermissions(_roleId: string): Promise<PermissionRule[]> {
    // TODO: 实现权限聚合逻辑
    // 1. 获取角色直接权限
    // 2. 递归获取继承角色的权限
    // 3. 合并并去重权限
    throw new Error('Not implemented');
  }

  /**
   * 检查角色是否有特定权限
   */
  static async hasPermission(
    _roleId: string,
    _resourceType: ResourceType,
    _action: PermissionAction,
    _resourceId?: string,
  ): Promise<boolean> {
    // TODO: 实现权限检查逻辑
    throw new Error('Not implemented');
  }

  /**
   * 查询角色列表
   */
  static async findMany(
    _query: RoleQuery,
    _page = 1,
    _limit = 20,
  ): Promise<{
    data: RoleModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    // TODO: 实现数据库查询逻辑
    throw new Error('Not implemented');
  }

  /**
   * 检查角色名称是否唯一
   */
  static async isNameUnique(_name: string, _enterpriseId?: string, _excludeId?: string): Promise<boolean> {
    // TODO: 实现名称唯一性检查逻辑
    throw new Error('Not implemented');
  }

  /**
   * 检查角色继承是否会形成循环
   */
  static async wouldCreateInheritanceCycle(_roleId: string, _inheritFromIds: string[]): Promise<boolean> {
    // TODO: 实现循环继承检查逻辑
    throw new Error('Not implemented');
  }
}

/**
 * 系统预定义角色
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: '系统超级管理员，拥有所有权限',
    permissions: [
      {
        id: 'system-admin-all',
        _resourceType: ResourceType.API,
        _action: PermissionAction.MANAGE,
        effect: 'allow' as const,
      },
    ],
    isSystem: true,
  },
  ENTERPRISE_ADMIN: {
    name: 'Enterprise Admin',
    description: '企业管理员，拥有企业内所有权限',
    permissions: [
      {
        id: 'enterprise-admin-all',
        _resourceType: ResourceType.ENTERPRISE,
        _action: PermissionAction.MANAGE,
        effect: 'allow' as const,
      },
    ],
    isSystem: true,
  },
  DEPARTMENT_MANAGER: {
    name: 'Department Manager',
    description: '部门管理员，可以管理部门成员和资源',
    permissions: [
      {
        id: 'dept-manager-users',
        _resourceType: ResourceType.USER,
        _action: PermissionAction.MANAGE,
        effect: 'allow' as const,
      },
      {
        id: 'dept-manager-teams',
        _resourceType: ResourceType.TEAM,
        _action: PermissionAction.MANAGE,
        effect: 'allow' as const,
      },
    ],
    isSystem: true,
  },
  TEAM_LEADER: {
    name: 'Team Leader',
    description: '团队负责人，可以管理团队成员和项目',
    permissions: [
      {
        id: 'team-leader-team',
        _resourceType: ResourceType.TEAM,
        _action: PermissionAction.UPDATE,
        effect: 'allow' as const,
      },
      {
        id: 'team-leader-project',
        _resourceType: ResourceType.PROJECT,
        _action: PermissionAction.MANAGE,
        effect: 'allow' as const,
      },
    ],
    isSystem: true,
  },
  USER: {
    name: 'User',
    description: '普通用户，基础权限',
    permissions: [
      {
        id: 'user-read',
        _resourceType: ResourceType.USER,
        _action: PermissionAction.READ,
        effect: 'allow' as const,
      },
      {
        id: 'user-dataset-read',
        _resourceType: ResourceType.DATASET,
        _action: PermissionAction.READ,
        effect: 'allow' as const,
      },
    ],
    isSystem: true,
  },
} as const;

/**
 * 角色工具函数
 */
export class RoleUtils {
  /**
   * 合并权限规则
   */
  static mergePermissions(permissions: PermissionRule[][]): PermissionRule[] {
    const merged = new Map<string, PermissionRule>();

    permissions.flat().forEach(permission => {
      const key = `${permission.resourceType}:${permission.action}:${permission.resourceId || '*'}`;

      // 如果已存在相同的权限规则，优先使用 deny 效果
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        if (permission.effect === 'deny' || existing.effect === 'deny') {
          merged.set(key, { ...permission, effect: 'deny' });
        }
      } else {
        merged.set(key, permission);
      }
    });

    return Array.from(merged.values());
  }

  /**
   * 检查权限规则是否匹配
   */
  static matchesPermission(
    rule: PermissionRule,
    _resourceType: ResourceType,
    _action: PermissionAction,
    _resourceId?: string,
  ): boolean {
    // 检查资源类型
    if (rule.resourceType !== _resourceType) {
      return false;
    }

    // 检查操作
    if (rule.action !== _action) {
      return false;
    }

    // 检查资源ID
    if (rule.resourceId && _resourceId && rule.resourceId !== _resourceId) {
      return false;
    }

    return true;
  }

  /**
   * 评估权限
   */
  static evaluatePermissions(
    permissions: PermissionRule[],
    _resourceType: ResourceType,
    _action: PermissionAction,
    _resourceId?: string,
  ): boolean {
    let hasAllow = false;

    for (const permission of permissions) {
      if (this.matchesPermission(permission, _resourceType, _action, _resourceId)) {
        if (permission.effect === 'deny') {
          return false; // 明确拒绝
        }
        if (permission.effect === 'allow') {
          hasAllow = true;
        }
      }
    }

    return hasAllow;
  }
}
