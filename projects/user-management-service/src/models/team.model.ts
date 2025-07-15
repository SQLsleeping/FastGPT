import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/database';
import { AppError } from '@/types';

/**
 * 团队类型枚举
 */
export enum TeamType {
  PROJECT = 'project',
  DEPARTMENT = 'department',
  ENTERPRISE = 'enterprise',
}

/**
 * 团队状态枚举
 */
export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

/**
 * 团队成员状态枚举
 */
export enum TeamMemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

/**
 * 团队成员角色枚举
 */
export enum TeamMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * 团队接口
 */
export interface Team {
  id: string;
  name: string;
  ownerId: string;
  avatar?: string;
  balance: number;
  teamDomain?: string;
  enterpriseId?: string;
  departmentId?: string;
  teamType: TeamType;
  status: TeamStatus;
  description?: string;
  teamSettings: Record<string, any>;
  maxMembers?: number;
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 团队成员接口
 */
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  status: TeamMemberStatus;
  role: TeamMemberRole;
  permissions: string[];
  invitedBy?: string;
  invitedAt?: Date;
  joinedAt: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建团队数据类型
 */
export interface CreateTeamData {
  name: string;
  ownerId: string;
  avatar?: string;
  teamDomain?: string;
  enterpriseId?: string;
  departmentId?: string;
  teamType?: TeamType;
  description?: string;
  teamSettings?: Record<string, any>;
  maxMembers?: number;
  tags?: string[];
  isPrivate?: boolean;
}

/**
 * 更新团队数据类型
 */
export interface UpdateTeamData {
  name?: string;
  avatar?: string;
  teamDomain?: string;
  description?: string;
  teamSettings?: Record<string, any>;
  maxMembers?: number;
  tags?: string[];
  isPrivate?: boolean;
  status?: TeamStatus;
}

/**
 * 团队数据访问对象
 */
export class TeamDAO {
  private pool: Pool;

  constructor() {
    this.pool = db.getPostgreSQL().getPool();
  }

  /**
   * 创建团队
   */
  async create(teamData: CreateTeamData): Promise<Team> {
    const id = uuidv4().replace(/-/g, '').substring(0, 24);

    const query = `
      INSERT INTO teams (
        id, name, owner_id, avatar, team_domain, enterprise_id, 
        department_id, team_type, description, team_settings, 
        max_members, tags, is_private
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *
    `;

    const values = [
      id,
      teamData.name,
      teamData.ownerId,
      teamData.avatar || null,
      teamData.teamDomain || null,
      teamData.enterpriseId || null,
      teamData.departmentId || null,
      teamData.teamType || TeamType.PROJECT,
      teamData.description || null,
      JSON.stringify(teamData.teamSettings || {}),
      teamData.maxMembers || 50,
      JSON.stringify(teamData.tags || []),
      teamData.isPrivate || false,
    ];

    try {
      const result = await this.pool.query(query, values);
      const team = this.mapRowToTeam(result.rows[0]);

      // 自动添加创建者为团队所有者
      await this.addMember({
        teamId: team.id,
        userId: teamData.ownerId,
        name: 'Owner', // 这里应该从用户表获取真实姓名
        role: TeamMemberRole.OWNER,
        status: TeamMemberStatus.ACTIVE,
      });

      return team;
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new AppError('Team name already exists', 409, 'DUPLICATE_TEAM');
      }
      throw new AppError(`Failed to create team: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据ID查找团队
   */
  async findById(id: string): Promise<Team | null> {
    const query = `SELECT * FROM teams WHERE id = $1 AND status != 'deleted'`;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? this.mapRowToTeam(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to find team: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据所有者ID查找团队
   */
  async findByOwnerId(ownerId: string): Promise<Team[]> {
    const query = `
      SELECT * FROM teams 
      WHERE owner_id = $1 AND status != 'deleted'
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.pool.query(query, [ownerId]);
      return result.rows.map(row => this.mapRowToTeam(row));
    } catch (error) {
      throw new AppError(`Failed to find teams by owner: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据用户ID查找用户参与的团队
   */
  async findByUserId(userId: string): Promise<Team[]> {
    const query = `
      SELECT t.* FROM teams t
      INNER JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1 
        AND t.status != 'deleted' 
        AND tm.status = 'active'
      ORDER BY tm.joined_at DESC
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows.map(row => this.mapRowToTeam(row));
    } catch (error) {
      throw new AppError(`Failed to find teams by user: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 更新团队信息
   */
  async update(id: string, updateData: UpdateTeamData): Promise<Team | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 动态构建更新字段
    if (updateData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }
    if (updateData.avatar !== undefined) {
      fields.push(`avatar = $${paramIndex++}`);
      values.push(updateData.avatar);
    }
    if (updateData.teamDomain !== undefined) {
      fields.push(`team_domain = $${paramIndex++}`);
      values.push(updateData.teamDomain);
    }
    if (updateData.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }
    if (updateData.teamSettings !== undefined) {
      fields.push(`team_settings = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.teamSettings));
    }
    if (updateData.maxMembers !== undefined) {
      fields.push(`max_members = $${paramIndex++}`);
      values.push(updateData.maxMembers);
    }
    if (updateData.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.tags));
    }
    if (updateData.isPrivate !== undefined) {
      fields.push(`is_private = $${paramIndex++}`);
      values.push(updateData.isPrivate);
    }
    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400, 'INVALID_UPDATE');
    }

    // 总是更新 updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE teams 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND status != 'deleted'
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length > 0 ? this.mapRowToTeam(result.rows[0]) : null;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError('Team name already exists', 409, 'DUPLICATE_TEAM');
      }
      throw new AppError(`Failed to update team: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 删除团队（软删除）
   */
  async delete(id: string): Promise<boolean> {
    const query = `
      UPDATE teams 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status != 'deleted'
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      throw new AppError(`Failed to delete team: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 添加团队成员
   */
  async addMember(memberData: {
    teamId: string;
    userId: string;
    name: string;
    role?: TeamMemberRole;
    status?: TeamMemberStatus;
    permissions?: string[];
    invitedBy?: string;
  }): Promise<TeamMember> {
    const id = uuidv4().replace(/-/g, '').substring(0, 24);

    const query = `
      INSERT INTO team_members (
        id, team_id, user_id, name, role, status, permissions, invited_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `;

    const values = [
      id,
      memberData.teamId,
      memberData.userId,
      memberData.name,
      memberData.role || TeamMemberRole.MEMBER,
      memberData.status || TeamMemberStatus.ACTIVE,
      JSON.stringify(memberData.permissions || []),
      memberData.invitedBy || null,
    ];

    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToTeamMember(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new AppError('User is already a member of this team', 409, 'DUPLICATE_MEMBER');
      }
      throw new AppError(`Failed to add team member: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 获取团队成员列表
   */
  async getMembers(teamId: string): Promise<TeamMember[]> {
    const query = `
      SELECT * FROM team_members
      WHERE team_id = $1 AND status != 'inactive'
      ORDER BY
        CASE role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 3
          WHEN 'viewer' THEN 4
        END,
        joined_at ASC
    `;

    try {
      const result = await this.pool.query(query, [teamId]);
      return result.rows.map(row => this.mapRowToTeamMember(row));
    } catch (error) {
      throw new AppError(`Failed to get team members: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 获取团队成员信息
   */
  async getMember(teamId: string, userId: string): Promise<TeamMember | null> {
    const query = `
      SELECT * FROM team_members
      WHERE team_id = $1 AND user_id = $2 AND status != 'inactive'
    `;

    try {
      const result = await this.pool.query(query, [teamId, userId]);
      return result.rows.length > 0 ? this.mapRowToTeamMember(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to get team member: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 更新团队成员信息
   */
  async updateMember(
    teamId: string,
    userId: string,
    updateData: {
      role?: TeamMemberRole;
      status?: TeamMemberStatus;
      permissions?: string[];
    },
  ): Promise<TeamMember | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(updateData.role);
    }
    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }
    if (updateData.permissions !== undefined) {
      fields.push(`permissions = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.permissions));
    }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400, 'INVALID_UPDATE');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(teamId, userId);

    const query = `
      UPDATE team_members
      SET ${fields.join(', ')}
      WHERE team_id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length > 0 ? this.mapRowToTeamMember(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to update team member: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 移除团队成员
   */
  async removeMember(teamId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE team_members
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE team_id = $1 AND user_id = $2
    `;

    try {
      const result = await this.pool.query(query, [teamId, userId]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      throw new AppError(`Failed to remove team member: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 检查用户是否为团队成员
   */
  async isMember(teamId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM team_members
      WHERE team_id = $1 AND user_id = $2 AND status = 'active'
    `;

    try {
      const result = await this.pool.query(query, [teamId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new AppError(`Failed to check team membership: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 检查用户是否为团队所有者或管理员
   */
  async isAdminOrOwner(teamId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM team_members
      WHERE team_id = $1 AND user_id = $2 AND status = 'active'
        AND role IN ('owner', 'admin')
    `;

    try {
      const result = await this.pool.query(query, [teamId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new AppError(`Failed to check admin status: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 将数据库行映射为Team对象
   */
  private mapRowToTeam(row: any): Team {
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      avatar: row.avatar,
      balance: parseFloat(row.balance),
      teamDomain: row.team_domain,
      enterpriseId: row.enterprise_id,
      departmentId: row.department_id,
      teamType: row.team_type as TeamType,
      status: row.status as TeamStatus,
      description: row.description,
      teamSettings: row.team_settings || {},
      maxMembers: row.max_members,
      tags: row.tags || [],
      isPrivate: row.is_private,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 将数据库行映射为TeamMember对象
   */
  private mapRowToTeamMember(row: any): TeamMember {
    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      name: row.name,
      status: row.status as TeamMemberStatus,
      role: row.role as TeamMemberRole,
      permissions: row.permissions || [],
      invitedBy: row.invited_by,
      invitedAt: row.invited_at,
      joinedAt: row.joined_at,
      lastActivityAt: row.last_activity_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// 导出单例实例
export const teamDAO = new TeamDAO();
