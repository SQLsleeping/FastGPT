import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { BaseService } from './base.service';
import { LoginRequest, RegisterRequest, ResetPasswordRequest, ChangePasswordRequest, AuthResult, User } from '../types';
import { logger } from '../utils';
import { config } from '../config';

/**
 * 认证服务
 * 处理用户认证、令牌管理、密码管理等核心功能
 */
export class AuthService extends BaseService {
  private readonly JWT_SECRET = config.jwt.secret;
  private readonly JWT_EXPIRES_IN = config.jwt.expiresIn;
  private readonly REFRESH_TOKEN_EXPIRES_IN = config.jwt.refreshExpiresIn;

  /**
   * 用户登录
   */
  public async login(loginData: LoginRequest): Promise<AuthResult> {
    try {
      // 查找用户（支持邮箱或用户名登录）
      const user = await this.findUserByUsernameOrEmail(loginData.username);

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return {
          success: false,
          message: 'Account is not active',
        };
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        // 记录失败的登录尝试
        await this.recordFailedLogin(user.id, loginData.ip);
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // 检查账户是否被锁定
      if (await this.isAccountLocked(user.id)) {
        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts',
        };
      }

      // 生成令牌
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // 更新最后登录时间
      await this.updateLastLogin(user.id);

      // 清除失败登录记录
      await this.clearFailedLogins(user.id);

      // 存储刷新令牌
      await this.storeRefreshToken(user.id, refreshToken);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        refreshToken,
        expiresIn: this.JWT_EXPIRES_IN,
      };
    } catch (error) {
      logger.error('Login service error:', error);
      return {
        success: false,
        message: 'Login failed',
      };
    }
  }

  /**
   * 用户注册
   */
  public async register(registerData: RegisterRequest): Promise<AuthResult> {
    try {
      // 检查用户名是否已存在
      const existingUser = await this.findUserByUsernameOrEmail(registerData.username);
      if (existingUser) {
        return {
          success: false,
          message: 'Username or email already exists',
        };
      }

      // 检查邮箱是否已存在
      const existingEmail = await this.findUserByEmail(registerData.email);
      if (existingEmail) {
        return {
          success: false,
          message: 'Email already exists',
        };
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(registerData.password, 12);

      // 创建用户
      const userData = {
        username: registerData.username,
        email: registerData.email,
        password: hashedPassword,
        status: 'pending_verification',
        enterpriseId: registerData.enterpriseId,
        departmentId: registerData.departmentId,
        profile: {
          name: registerData.name || registerData.username,
          avatar: registerData.avatar,
          timezone: registerData.timezone || 'UTC',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user = await this.createUser(userData);

      // 发送验证邮件
      await this.sendVerificationEmail(user);

      return {
        success: true,
        user: this.sanitizeUser(user),
        message: 'Registration successful. Please check your email for verification.',
      };
    } catch (error) {
      logger.error('Registration service error:', error);
      return {
        success: false,
        message: 'Registration failed',
      };
    }
  }

  /**
   * 刷新令牌
   */
  public async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;

      // 检查令牌是否在数据库中存在
      const storedToken = await this.getStoredRefreshToken(decoded.userId, refreshToken);
      if (!storedToken) {
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      // 获取用户信息
      const user = await this.findUserById(decoded.userId);
      if (!user || user.status !== 'active') {
        return {
          success: false,
          message: 'User not found or inactive',
        };
      }

      // 生成新的令牌
      const newToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // 更新存储的刷新令牌
      await this.updateRefreshToken(decoded.userId, refreshToken, newRefreshToken);

      return {
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: this.JWT_EXPIRES_IN,
      };
    } catch (error) {
      logger.error('Token refresh service error:', error);
      return {
        success: false,
        message: 'Token refresh failed',
      };
    }
  }

  /**
   * 用户登出
   */
  public async logout(userId: string, token: string): Promise<void> {
    try {
      // 将令牌加入黑名单
      await this.blacklistToken(token);

      // 删除用户的所有刷新令牌
      await this.deleteUserRefreshTokens(userId);

      logger.info('User logged out successfully', { userId });
    } catch (error) {
      logger.error('Logout service error:', error);
      throw error;
    }
  }

  /**
   * 请求密码重置
   */
  public async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    try {
      const user = await this.findUserByEmail(email);

      if (user) {
        // 生成重置令牌
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1小时后过期

        // 存储重置令牌
        await this.storePasswordResetToken(user.id, resetToken, resetTokenExpiry);

        // 发送重置邮件
        await this.sendPasswordResetEmail(user, resetToken);
      }

      return { success: true };
    } catch (error) {
      logger.error('Password reset request service error:', error);
      return { success: false };
    }
  }

  /**
   * 重置密码
   */
  public async resetPassword(resetData: ResetPasswordRequest): Promise<AuthResult> {
    try {
      // 验证重置令牌
      const tokenData = await this.getPasswordResetToken(resetData.token);

      if (!tokenData || tokenData.expiresAt < new Date()) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(resetData.newPassword, 12);

      // 更新密码
      await this.updateUserPassword(tokenData.userId, hashedPassword);

      // 删除重置令牌
      await this.deletePasswordResetToken(resetData.token);

      // 删除用户的所有刷新令牌（强制重新登录）
      await this.deleteUserRefreshTokens(tokenData.userId);

      return {
        success: true,
        userId: tokenData.userId,
        message: 'Password reset successful',
      };
    } catch (error) {
      logger.error('Password reset service error:', error);
      return {
        success: false,
        message: 'Password reset failed',
      };
    }
  }

  /**
   * 修改密码
   */
  public async changePassword(userId: string, changeData: ChangePasswordRequest): Promise<AuthResult> {
    try {
      // 获取用户信息
      const user = await this.findUserById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(changeData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(changeData.newPassword, 12);

      // 更新密码
      await this.updateUserPassword(userId, hashedPassword);

      // 删除用户的所有刷新令牌（强制重新登录其他设备）
      await this.deleteUserRefreshTokens(userId);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      logger.error('Password change service error:', error);
      return {
        success: false,
        message: 'Password change failed',
      };
    }
  }

  // 私有辅助方法
  private generateAccessToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        enterpriseId: user.enterpriseId,
        type: 'access',
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN },
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN },
    );
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // 数据库操作方法（需要在后续实现）
  private async findUserByUsernameOrEmail(username: string): Promise<User | null> {
    // TODO: 实现数据库查询
    return null;
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    // TODO: 实现数据库查询
    return null;
  }

  private async findUserById(id: string): Promise<User | null> {
    // TODO: 实现数据库查询
    return null;
  }

  private async createUser(userData: any): Promise<User> {
    // TODO: 实现数据库插入
    return {} as User;
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // TODO: 实现数据库更新
  }

  private async recordFailedLogin(userId: string, ip?: string): Promise<void> {
    // TODO: 实现失败登录记录
  }

  private async clearFailedLogins(userId: string): Promise<void> {
    // TODO: 实现清除失败登录记录
  }

  private async isAccountLocked(userId: string): Promise<boolean> {
    // TODO: 实现账户锁定检查
    return false;
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    // TODO: 实现刷新令牌存储
  }

  private async getStoredRefreshToken(userId: string, token: string): Promise<any> {
    // TODO: 实现刷新令牌查询
    return null;
  }

  private async updateRefreshToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    // TODO: 实现刷新令牌更新
  }

  private async deleteUserRefreshTokens(userId: string): Promise<void> {
    // TODO: 实现删除用户所有刷新令牌
  }

  private async blacklistToken(token: string): Promise<void> {
    // TODO: 实现令牌黑名单
  }

  private async storePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    // TODO: 实现密码重置令牌存储
  }

  private async getPasswordResetToken(token: string): Promise<any> {
    // TODO: 实现密码重置令牌查询
    return null;
  }

  private async deletePasswordResetToken(token: string): Promise<void> {
    // TODO: 实现删除密码重置令牌
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    // TODO: 实现密码更新
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    // TODO: 实现发送验证邮件
  }

  private async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    // TODO: 实现发送密码重置邮件
  }
}
