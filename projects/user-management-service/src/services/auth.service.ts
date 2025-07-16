import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { BaseService } from './base.service';
import {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthResult,
  User,
  CreateUserData,
  UserStatus,
} from '../types';
import { logger } from '../utils';
import { config } from '../config';
import { userDAO } from '../models/user.model';
import { emailService } from './email.service';

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
      logger.info('Login attempt', { username: loginData.username });

      // 查找用户（支持邮箱或用户名登录）
      const user = await this.findUserByUsernameOrEmail(loginData.username);

      if (!user) {
        logger.warn('User not found', { username: loginData.username });
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      logger.info('User found', { userId: user.id, status: user.status });

      // 检查用户状态
      if (user.status !== UserStatus.ACTIVE) {
        return {
          success: false,
          message: 'Account is not active',
        };
      }

      // 验证密码
      logger.info('Verifying password', {
        userId: user.id,
        passwordLength: loginData.password.length,
        passwordFirst3: loginData.password.substring(0, 3),
        storedPasswordLength: user.password.length,
        storedPasswordFirst10: user.password.substring(0, 10)
      });

      // 检查密码是否是SHA256哈希（64个字符的十六进制字符串）
      const isSHA256Hash = /^[a-f0-9]{64}$/i.test(loginData.password);
      let isPasswordValid = false;

      if (isSHA256Hash) {
        // 如果是SHA256哈希，直接与存储的哈希比较（用于FastGPT兼容性）
        logger.info('Detected SHA256 hash password from FastGPT');
        isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      } else {
        // 如果是原始密码，正常验证
        logger.info('Detected plain text password');
        isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      }

      logger.info('Password verification result', { userId: user.id, isValid: isPasswordValid });

      if (!isPasswordValid) {
        // 记录失败的登录尝试
        await this.recordFailedLogin(user.id, loginData.ip);
        logger.warn('Invalid password', { userId: user.id });
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
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
      await this.storeRefreshToken(user.id, token, refreshToken, expiresAt, loginData.ip, loginData.userAgent);

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
      const userData: CreateUserData = {
        username: registerData.username,
        email: registerData.email,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        enterpriseId: registerData.enterpriseId,
        departmentId: registerData.departmentId,
        userConfig: {
          name: registerData.name || registerData.username,
          avatar: registerData.avatar,
          timezone: registerData.timezone || 'UTC',
        },
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
      const storedToken = await this.getStoredRefreshToken(refreshToken);
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
        userId: user.id,
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

  // 数据库操作方法
  private async findUserByUsernameOrEmail(username: string): Promise<User | null> {
    return await userDAO.findByUsernameOrEmail(username);
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    return await userDAO.findByEmail(email);
  }

  private async findUserById(id: string): Promise<User | null> {
    return await userDAO.findById(id);
  }

  private async createUser(userData: CreateUserData): Promise<User> {
    return await userDAO.create(userData);
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await userDAO.updateLastLogin(userId);
  }

  private async recordFailedLogin(userId: string, ip?: string): Promise<void> {
    await userDAO.recordFailedLogin(userId);
  }

  private async clearFailedLogins(userId: string): Promise<void> {
    await userDAO.resetFailedLoginAttempts(userId);
  }

  private async isAccountLocked(userId: string): Promise<boolean> {
    const user = await userDAO.findById(userId);
    return user?.lockedUntil ? new Date() < user.lockedUntil : false;
  }

  private async storeRefreshToken(
    userId: string,
    sessionToken: string,
    refreshToken: string,
    expiresAt: Date,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await userDAO.createSession(userId, sessionToken, refreshToken, expiresAt, ip, userAgent);
  }

  private async getStoredRefreshToken(refreshToken: string): Promise<any> {
    return await userDAO.findSessionByRefreshToken(refreshToken);
  }

  private async updateRefreshToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    // 删除旧的会话，创建新的会话
    await userDAO.deleteSession(oldToken);
    // 注意：这里需要重新创建会话，但需要更多参数
  }

  private async deleteUserRefreshTokens(userId: string): Promise<void> {
    await userDAO.deleteUserSessions(userId);
  }

  private async blacklistToken(token: string): Promise<void> {
    await userDAO.deleteSession(token);
  }

  private async storePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await userDAO.createPasswordResetToken(userId, token, expiresAt);
  }

  private async getPasswordResetToken(token: string): Promise<any> {
    return await userDAO.findPasswordResetToken(token);
  }

  private async deletePasswordResetToken(token: string): Promise<void> {
    await userDAO.deletePasswordResetToken(token);
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await userDAO.updatePassword(userId, hashedPassword);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    if (user.emailVerificationToken) {
      await emailService.sendVerificationEmail(user, user.emailVerificationToken);
    }
  }

  private async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    await emailService.sendPasswordResetEmail(user, resetToken);
  }

  /**
   * 检查用户是否存在
   */
  async checkUserExists(username?: string, email?: string): Promise<boolean> {
    try {
      if (username) {
        const user = await this.findUserByUsernameOrEmail(username);
        if (user) return true;
      }

      if (email) {
        const user = await this.findUserByEmail(email);
        if (user) return true;
      }

      return false;
    } catch (error) {
      logger.error('Check user exists error:', error);
      return false;
    }
  }

  /**
   * 根据ID查找用户
   */
  async findUserById(id: string): Promise<User | null> {
    try {
      return await userDAO.findById(id);
    } catch (error) {
      logger.error('Find user by ID error:', error);
      return null;
    }
  }
}
