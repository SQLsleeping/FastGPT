import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/database';
import { User, UserStatus, CreateUserData, UpdateUserData, UserSession, PasswordResetToken } from '@/types';
import { AppError } from '@/types';

/**
 * 用户数据访问对象
 * 处理用户相关的所有数据库操作
 */
export class UserDAO {
  private pool: Pool;

  constructor() {
    this.pool = db.getPostgreSQL().getPool();
  }

  /**
   * 根据用户名或邮箱查找用户
   */
  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE username = $1 OR email = $1
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [usernameOrEmail]);
      return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to find user: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [email]);
      return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to find user by email: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE id = $1
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to find user by ID: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 创建新用户
   */
  async create(userData: CreateUserData): Promise<User> {
    const id = uuidv4().replace(/-/g, '').substring(0, 24);
    // 注意：假设传入的密码已经被加密，如果没有加密则需要在调用方加密
    const hashedPassword = userData.password;

    const query = `
      INSERT INTO users (
        id, username, email, password, status, timezone, 
        enterprise_id, department_id, employee_id, hire_date,
        user_config, email_verified, email_verification_token, 
        email_verification_expires, password_changed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *
    `;

    const values = [
      id,
      userData.username,
      userData.email,
      hashedPassword,
      userData.status || UserStatus.ACTIVE,
      userData.timezone || 'UTC',
      userData.enterpriseId || null,
      userData.departmentId || null,
      userData.employeeId || null,
      userData.hireDate || null,
      JSON.stringify(userData.userConfig || {}),
      userData.emailVerified || false,
      userData.emailVerificationToken || null,
      userData.emailVerificationExpires || null,
      new Date(),
    ];

    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToUser(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new AppError('Username or email already exists', 409, 'DUPLICATE_USER');
      }
      throw new AppError(`Failed to create user: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 更新用户信息
   */
  async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 动态构建更新字段
    if (updateData.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updateData.username);
    }
    if (updateData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updateData.email);
    }
    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }
    if (updateData.timezone !== undefined) {
      fields.push(`timezone = $${paramIndex++}`);
      values.push(updateData.timezone);
    }
    if (updateData.enterpriseId !== undefined) {
      fields.push(`enterprise_id = $${paramIndex++}`);
      values.push(updateData.enterpriseId);
    }
    if (updateData.departmentId !== undefined) {
      fields.push(`department_id = $${paramIndex++}`);
      values.push(updateData.departmentId);
    }
    if (updateData.employeeId !== undefined) {
      fields.push(`employee_id = $${paramIndex++}`);
      values.push(updateData.employeeId);
    }
    if (updateData.userConfig !== undefined) {
      fields.push(`user_config = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.userConfig));
    }
    if (updateData.emailVerified !== undefined) {
      fields.push(`email_verified = $${paramIndex++}`);
      values.push(updateData.emailVerified);
    }
    if (updateData.mfaEnabled !== undefined) {
      fields.push(`mfa_enabled = $${paramIndex++}`);
      values.push(updateData.mfaEnabled);
    }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400, 'INVALID_UPDATE');
    }

    // 总是更新 updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError('Username or email already exists', 409, 'DUPLICATE_USER');
      }
      throw new AppError(`Failed to update user: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 更新用户密码
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const query = `
      UPDATE users 
      SET password = $1, 
          password_changed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [hashedPassword, id]);
    } catch (error) {
      throw new AppError(`Failed to update password: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_activity_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await this.pool.query(query, [id]);
    } catch (error) {
      throw new AppError(`Failed to update last login: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 记录失败的登录尝试
   */
  async recordFailedLogin(id: string): Promise<void> {
    const query = `
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await this.pool.query(query, [id]);
    } catch (error) {
      throw new AppError(`Failed to record failed login: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 重置失败登录尝试计数
   */
  async resetFailedLoginAttempts(id: string): Promise<void> {
    const query = `
      UPDATE users 
      SET failed_login_attempts = 0,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await this.pool.query(query, [id]);
    } catch (error) {
      throw new AppError(`Failed to reset failed login attempts: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 锁定用户账户
   */
  async lockAccount(id: string, lockDuration: number): Promise<void> {
    const lockUntil = new Date(Date.now() + lockDuration);

    const query = `
      UPDATE users 
      SET locked_until = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [lockUntil, id]);
    } catch (error) {
      throw new AppError(`Failed to lock account: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 删除用户（软删除）
   */
  async delete(id: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET status = 'deleted',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      throw new AppError(`Failed to delete user: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 将数据库行映射为User对象
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      status: row.status as UserStatus,
      timezone: row.timezone,
      lastLoginTmbId: row.last_login_tmb_id,
      inviterId: row.inviter_id,
      promotionRate: parseFloat(row.promotion_rate),
      enterpriseId: row.enterprise_id,
      departmentId: row.department_id,
      employeeId: row.employee_id,
      hireDate: row.hire_date,
      lastActivityAt: row.last_activity_at,
      userConfig: row.user_config || {},
      mfaEnabled: row.mfa_enabled,
      mfaSecret: row.mfa_secret,
      mfaBackupCodes: row.mfa_backup_codes || [],
      passwordChangedAt: row.password_changed_at,
      passwordHistory: row.password_history || [],
      failedLoginAttempts: row.failed_login_attempts,
      lockedUntil: row.locked_until,
      emailVerified: row.email_verified,
      emailVerificationToken: row.email_verification_token,
      emailVerificationExpires: row.email_verification_expires,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 创建用户会话
   */
  async createSession(
    userId: string,
    sessionToken: string,
    refreshToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserSession> {
    const sessionId = uuidv4().replace(/-/g, '').substring(0, 24);

    const query = `
      INSERT INTO user_sessions (
        id, user_id, session_token, refresh_token,
        ip_address, user_agent, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [sessionId, userId, sessionToken, refreshToken, ipAddress, userAgent, expiresAt];

    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToSession(result.rows[0]);
    } catch (error) {
      throw new AppError(`Failed to create session: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据会话令牌查找会话
   */
  async findSessionByToken(sessionToken: string): Promise<UserSession | null> {
    const query = `
      SELECT * FROM user_sessions
      WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [sessionToken]);
      return result.rows.length > 0 ? this.mapRowToSession(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to find session: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据刷新令牌查找会话
   */
  async findSessionByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    const query = `
      SELECT * FROM user_sessions
      WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [refreshToken]);
      return result.rows.length > 0 ? this.mapRowToSession(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to find session by refresh token: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 删除用户会话
   */
  async deleteSession(sessionToken: string): Promise<void> {
    const query = `DELETE FROM user_sessions WHERE session_token = $1`;

    try {
      await this.pool.query(query, [sessionToken]);
    } catch (error) {
      throw new AppError(`Failed to delete session: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 删除用户的所有会话
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const query = `DELETE FROM user_sessions WHERE user_id = $1`;

    try {
      await this.pool.query(query, [userId]);
    } catch (error) {
      throw new AppError(`Failed to delete user sessions: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    const query = `DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP`;

    try {
      const result = await this.pool.query(query);
      return result.rowCount || 0;
    } catch (error) {
      throw new AppError(`Failed to cleanup expired sessions: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 创建密码重置令牌
   */
  async createPasswordResetToken(userId: string, resetToken: string, expiresAt: Date): Promise<PasswordResetToken> {
    const tokenId = uuidv4().replace(/-/g, '').substring(0, 24);

    const query = `
      INSERT INTO user_password_resets (
        id, user_id, reset_token, expires_at
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [tokenId, userId, resetToken, expiresAt];

    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToPasswordResetToken(result.rows[0]);
    } catch (error) {
      throw new AppError(`Failed to create password reset token: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 根据重置令牌查找密码重置记录
   */
  async findPasswordResetToken(resetToken: string): Promise<PasswordResetToken | null> {
    const query = `
      SELECT * FROM user_password_resets
      WHERE reset_token = $1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [resetToken]);
      return result.rows.length > 0 ? this.mapRowToPasswordResetToken(result.rows[0]) : null;
    } catch (error) {
      throw new AppError(`Failed to find password reset token: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 标记密码重置令牌为已使用
   */
  async markPasswordResetTokenAsUsed(resetToken: string): Promise<void> {
    const query = `
      UPDATE user_password_resets
      SET used_at = CURRENT_TIMESTAMP
      WHERE reset_token = $1
    `;

    try {
      await this.pool.query(query, [resetToken]);
    } catch (error) {
      throw new AppError(`Failed to mark password reset token as used: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 删除密码重置令牌
   */
  async deletePasswordResetToken(resetToken: string): Promise<void> {
    const query = `DELETE FROM user_password_resets WHERE reset_token = $1`;

    try {
      await this.pool.query(query, [resetToken]);
    } catch (error) {
      throw new AppError(`Failed to delete password reset token: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 清理过期的密码重置令牌
   */
  async cleanupExpiredPasswordResetTokens(): Promise<number> {
    const query = `DELETE FROM user_password_resets WHERE expires_at < CURRENT_TIMESTAMP`;

    try {
      const result = await this.pool.query(query);
      return result.rowCount || 0;
    } catch (error) {
      throw new AppError(`Failed to cleanup expired password reset tokens: ${error}`, 500, 'DATABASE_ERROR');
    }
  }

  /**
   * 将数据库行映射为UserSession对象
   */
  private mapRowToSession(row: any): UserSession {
    return {
      id: row.id,
      userId: row.user_id,
      sessionToken: row.session_token,
      refreshToken: row.refresh_token,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 将数据库行映射为PasswordResetToken对象
   */
  private mapRowToPasswordResetToken(row: any): PasswordResetToken {
    return {
      id: row.id,
      userId: row.user_id,
      resetToken: row.reset_token,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    };
  }
}

// 导出单例实例
export const userDAO = new UserDAO();
