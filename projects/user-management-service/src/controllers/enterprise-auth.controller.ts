import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { EnterpriseAuthService } from '../services/enterprise-auth.service';
import {
  EnterpriseRegistrationRequest,
  EnterpriseVerificationRequest,
  EnterpriseDomainBindingRequest,
  EnterpriseUserImportRequest,
} from '../types';

/**
 * 企业认证控制器
 * 处理企业注册、认证、域名绑定等企业级功能
 */
export class EnterpriseAuthController extends BaseController {
  private enterpriseAuthService: EnterpriseAuthService;

  constructor() {
    super();
    this.enterpriseAuthService = new EnterpriseAuthService();
  }

  /**
   * 企业注册
   */
  public registerEnterprise = async (req: Request, res: Response): Promise<void> => {
    try {
      const registrationData: EnterpriseRegistrationRequest = req.body;

      // 验证请求数据
      const validation = this.validateEnterpriseRegistration(registrationData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      // 执行企业注册
      const result = await this.enterpriseAuthService.registerEnterprise(registrationData);

      if (!result.success) {
        this.error(res, result.message || 'Enterprise registration failed', 400);
        return;
      }

      this.success(
        res,
        {
          enterprise: result.enterprise,
          adminUser: result.adminUser,
          verificationRequired: result.verificationRequired,
        },
        'Enterprise registered successfully',
      );
    } catch (error) {
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 企业认证验证
   */
  public verifyEnterprise = async (req: Request, res: Response): Promise<void> => {
    try {
      const verificationData: EnterpriseVerificationRequest = req.body;

      if (!verificationData.token) {
        this.error(res, 'Verification token is required', 400);
        return;
      }

      const result = await this.enterpriseAuthService.verifyEnterprise(verificationData.token);

      if (!result.success) {
        this.error(res, result.message || 'Enterprise verification failed', 400);
        return;
      }

      this.success(
        res,
        {
          enterprise: result.enterprise,
          status: result.status,
        },
        'Enterprise verified successfully',
      );
    } catch (error) {
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 企业域名绑定
   */
  public bindDomain = async (req: Request, res: Response): Promise<void> => {
    try {
      const enterpriseId = req.user?.enterpriseId;
      const domainData: EnterpriseDomainBindingRequest = req.body;

      if (!enterpriseId) {
        this.unauthorized(res, 'Enterprise access required');
        return;
      }

      const validation = this.validateDomainBinding(domainData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      const result = await this.enterpriseAuthService.bindDomain(enterpriseId, domainData);

      if (!result.success) {
        this.error(res, result.message || 'Domain binding failed', 400);
        return;
      }

      this.success(
        res,
        {
          domain: result.domain,
          verificationRequired: result.verificationRequired,
        },
        'Domain bound successfully',
      );
    } catch (error) {
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 验证域名所有权
   */
  public verifyDomain = async (req: Request, res: Response): Promise<void> => {
    try {
      const { domainId, verificationCode } = req.body;
      const enterpriseId = req.user?.enterpriseId;

      if (!enterpriseId) {
        this.unauthorized(res, 'Enterprise access required');
        return;
      }

      if (!domainId || !verificationCode) {
        this.error(res, 'Domain ID and verification code are required', 400);
        return;
      }

      const result = await this.enterpriseAuthService.verifyDomain(enterpriseId, domainId, verificationCode);

      if (!result.success) {
        this.error(res, result.message || 'Domain verification failed', 400);
        return;
      }

      this.success(
        res,
        {
          domain: result.domain,
          status: result.status,
        },
        'Domain verified successfully',
      );
    } catch (error) {
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 批量导入企业用户
   */
  public importUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const enterpriseId = req.user?.enterpriseId;
      const importData: EnterpriseUserImportRequest = req.body;

      if (!enterpriseId) {
        this.unauthorized(res, 'Enterprise access required');
        return;
      }

      const validation = this.validateUserImport(importData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      const result = await this.enterpriseAuthService.importUsers(enterpriseId, importData);

      if (!result.success) {
        this.error(res, result.message || 'User import failed', 400);
        return;
      }

      this.success(
        res,
        {
          imported: result.imported,
          failed: result.failed,
          total: result.total,
        },
        'Users imported successfully',
      );
    } catch (error) {
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 获取企业统计信息
   */
  public getEnterpriseStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const enterpriseId = req.user?.enterpriseId;

      if (!enterpriseId) {
        this.unauthorized(res, 'Enterprise access required');
        return;
      }

      const stats = await this.enterpriseAuthService.getEnterpriseStats(enterpriseId);

      this.success(res, stats, 'Enterprise statistics retrieved successfully');
    } catch (error) {
      this.serverError(res, 'Internal server error');
    }
  };

  /**
   * 获取企业报告
   */
  public getEnterpriseReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const enterpriseId = req.user?.enterpriseId;
      const { startDate, endDate, reportType } = req.query;

      if (!enterpriseId) {
        this.unauthorized(res, 'Enterprise access required');
        return;
      }

      const report = await this.enterpriseAuthService.generateReport(enterpriseId, {
        startDate: startDate as string,
        endDate: endDate as string,
        reportType: reportType as string,
      });

      this.success(res, report, 'Enterprise report generated successfully');
    } catch (error) {
      this.serverError(res, 'Internal server error');
    }
  };

  // 验证方法
  private validateEnterpriseRegistration(data: EnterpriseRegistrationRequest): { isValid: boolean; message: string } {
    if (!data.name || !data.adminEmail || !data.adminPassword) {
      return { isValid: false, message: 'Enterprise name, admin email, and admin password are required' };
    }

    if (!data.contactEmail || !data.contactPhone) {
      return { isValid: false, message: 'Contact email and phone are required' };
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.adminEmail) || !emailRegex.test(data.contactEmail)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    // 密码强度验证
    if (data.adminPassword.length < 8) {
      return { isValid: false, message: 'Admin password must be at least 8 characters long' };
    }

    return { isValid: true, message: '' };
  }

  private validateDomainBinding(data: EnterpriseDomainBindingRequest): { isValid: boolean; message: string } {
    if (!data.domain) {
      return { isValid: false, message: 'Domain is required' };
    }

    // 域名格式验证
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(data.domain)) {
      return { isValid: false, message: 'Invalid domain format' };
    }

    return { isValid: true, message: '' };
  }

  private validateUserImport(data: EnterpriseUserImportRequest): { isValid: boolean; message: string } {
    if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
      return { isValid: false, message: 'Users array is required and cannot be empty' };
    }

    if (data.users.length > 1000) {
      return { isValid: false, message: 'Cannot import more than 1000 users at once' };
    }

    // 验证每个用户数据
    for (const user of data.users) {
      if (!user.email || !user.username) {
        return { isValid: false, message: 'Each user must have email and username' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        return { isValid: false, message: `Invalid email format: ${user.email}` };
      }
    }

    return { isValid: true, message: '' };
  }
}
