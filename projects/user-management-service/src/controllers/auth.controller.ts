import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { BaseController } from './base.controller';
import { LoginRequest, RegisterRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types';
import { logger } from '../utils';

/**
 * 用户认证控制器
 * 处理用户登录、注册、密码管理等认证相关操作
 */
export class AuthController extends BaseController {
  private authService: AuthService;

  constructor() {
    super();
    this.authService = new AuthService();
  }

  /**
   * 用户登录
   * 支持邮箱、手机号登录
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;

      // 验证请求数据
      const validation = this.validateLoginRequest(loginData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      // 执行登录
      const result = await this.authService.login(loginData);

      if (!result.success) {
        this.error(res, result.message || 'Login failed', 401);
        return;
      }

      // 记录登录日志
      logger.info('User login successful', {
        userId: result.user?.id,
        username: loginData.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      this.success(
        res,
        {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        'Login successful',
      );
    } catch (error) {
      logger.error('Login error:', error);
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 用户注册
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterRequest = req.body;

      // 验证请求数据
      const validation = this.validateRegisterRequest(registerData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      // 执行注册
      const result = await this.authService.register(registerData);

      if (!result.success) {
        this.error(res, result.message || 'Registration failed', 400);
        return;
      }

      // 记录注册日志
      logger.info('User registration successful', {
        userId: result.user?.id,
        username: registerData.username,
        email: registerData.email,
        ip: req.ip,
      });

      this.success(
        res,
        {
          user: result.user,
          message: 'Registration successful. Please check your email for verification.',
        },
        'Registration successful',
      );
    } catch (error) {
      logger.error('Registration error:', error);
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 刷新令牌
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        this.error(res, 'Refresh token is required', 400);
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      if (!result.success) {
        this.error(res, result.message || 'Token refresh failed', 401);
        return;
      }

      this.success(
        res,
        {
          token: result.token,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        'Token refreshed successfully',
      );
    } catch (error) {
      logger.error('Token refresh error:', error);
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 用户登出
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!userId || !token) {
        this.error(res, 'Invalid request', 400);
        return;
      }

      await this.authService.logout(userId, token);

      logger.info('User logout successful', {
        userId,
        ip: req.ip,
      });

      this.success(res, null, 'Logout successful');
    } catch (error) {
      logger.error('Logout error:', error);
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 请求密码重置
   */
  public requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        this.error(res, 'Email is required', 400);
        return;
      }

      await this.authService.requestPasswordReset(email);

      // 无论邮箱是否存在，都返回成功消息（安全考虑）
      this.success(res, null, 'If the email exists, a password reset link has been sent');
    } catch (error) {
      logger.error('Password reset request error:', error);
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 重置密码
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const resetData: ResetPasswordRequest = req.body;

      const validation = this.validateResetPasswordRequest(resetData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      const result = await this.authService.resetPassword(resetData);

      if (!result.success) {
        this.error(res, result.message || 'Password reset failed', 400);
        return;
      }

      logger.info('Password reset successful', {
        userId: result.userId,
        ip: req.ip,
      });

      this.success(res, null, 'Password reset successful');
    } catch (error) {
      logger.error('Password reset error:', error);
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 修改密码
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const changeData: ChangePasswordRequest = req.body;

      if (!userId) {
        this.unauthorized(res, 'Unauthorized');
        return;
      }

      const validation = this.validateChangePasswordRequest(changeData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      const result = await this.authService.changePassword(userId, changeData);

      if (!result.success) {
        this.error(res, result.message || 'Password change failed', 400);
        return;
      }

      logger.info('Password change successful', {
        userId,
        ip: req.ip,
      });

      this.success(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error('Password change error:', error);
      this.serverError(res, 'Internal server error');
    }
  };

  // 验证方法
  private validateLoginRequest(data: LoginRequest): { isValid: boolean; message: string } {
    if (!data.username || !data.password) {
      return { isValid: false, message: 'Username and password are required' };
    }

    if (data.password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }

    return { isValid: true, message: '' };
  }

  private validateRegisterRequest(data: RegisterRequest): { isValid: boolean; message: string } {
    if (!data.username || !data.email || !data.password) {
      return { isValid: false, message: 'Username, email, and password are required' };
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    // 密码强度验证
    if (data.password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    return { isValid: true, message: '' };
  }

  private validateResetPasswordRequest(data: ResetPasswordRequest): { isValid: boolean; message: string } {
    if (!data.token || !data.newPassword) {
      return { isValid: false, message: 'Token and new password are required' };
    }

    if (data.newPassword.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    return { isValid: true, message: '' };
  }

  private validateChangePasswordRequest(data: ChangePasswordRequest): { isValid: boolean; message: string } {
    if (!data.currentPassword || !data.newPassword) {
      return { isValid: false, message: 'Current password and new password are required' };
    }

    if (data.newPassword.length < 8) {
      return { isValid: false, message: 'New password must be at least 8 characters long' };
    }

    if (data.currentPassword === data.newPassword) {
      return { isValid: false, message: 'New password must be different from current password' };
    }

    return { isValid: true, message: '' };
  }

  /**
   * 检查用户是否存在
   */
  async checkUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, email } = req.body;

      if (!username && !email) {
        res.status(400).json({
          success: false,
          error: 'Username or email is required',
          code: 'INVALID_PARAMS'
        });
        return;
      }

      const exists = await this.authService.checkUserExists(username, email);

      res.json({
        success: true,
        data: {
          exists,
          username,
          email
        }
      });

    } catch (error) {
      logger.error('Check user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 根据ID获取用户信息
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'INVALID_PARAMS'
        });
        return;
      }

      const user = await this.authService.findUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: this.authService.sanitizeUser(user)
      });

    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}
