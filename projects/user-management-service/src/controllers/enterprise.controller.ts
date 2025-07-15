import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { EnterpriseDAO, CreateEnterpriseData, UpdateEnterpriseData } from '@/models/enterprise.model';
import { ValidationUtils } from '@/utils';

/**
 * 企业管理控制器
 */
export class EnterpriseController extends BaseController {
  /**
   * 创建企业
   */
  public create = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data: CreateEnterpriseData = req.body;

    // 验证必需字段
    const requiredFields = ['name', 'adminEmail', 'adminName'];
    const missing = this.validateRequired(data as unknown as Record<string, unknown>, requiredFields);

    if (missing.length > 0) {
      this.validationError(res, `Missing required fields: ${missing.join(', ')}`);
      return;
    }

    // 验证邮箱格式
    if (!ValidationUtils.isValidEmail(data.adminEmail)) {
      this.validationError(res, 'Invalid email format');
      return;
    }

    // 验证域名格式（如果提供）
    if (data.domain && !ValidationUtils.isValidDomain(data.domain)) {
      this.validationError(res, 'Invalid domain format');
      return;
    }

    try {
      // 检查域名是否已被使用
      if (data.domain) {
        const existingEnterprise = await EnterpriseDAO.findByDomain(data.domain);
        if (existingEnterprise) {
          this.conflict(res, 'Domain already in use');
          return;
        }
      }

      // 创建企业
      const enterprise = await EnterpriseDAO.create(data);

      // 缓存企业信息
      await this.cacheResponse(`enterprise:${enterprise.id}`, enterprise, 3600);

      this.created(res, enterprise, 'Enterprise created successfully');
    } catch (error) {
      console.error('Create enterprise error:', error);
      this.serverError(res, 'Failed to create enterprise');
    }
  });

  /**
   * 获取企业列表
   */
  public list = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pagination = this.parsePagination(req);
    const allowedQueryFields = ['name', 'domain', 'status', 'createdAfter', 'createdBefore'];
    const query = this.parseQuery(req, allowedQueryFields);

    // 构建缓存键
    const cacheKey = `enterprises:list:${JSON.stringify({ ...pagination, ...query })}`;

    try {
      // 尝试从缓存获取
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        this.success(res, cached);
        return;
      }

      // 从数据库查询
      const result = await EnterpriseDAO.findMany(query, pagination.page, pagination.limit);

      // 缓存结果
      await this.cacheResponse(cacheKey, result, 300);

      this.paginated(res, result.data, result.total, result.page, result.limit, 'Enterprises retrieved successfully');
    } catch (error) {
      console.error('List enterprises error:', error);
      this.serverError(res, 'Failed to retrieve enterprises');
    }
  });

  /**
   * 获取企业详情
   */
  public getById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      this.validationError(res, 'Enterprise ID is required');
      return;
    }

    try {
      // 尝试从缓存获取
      const cached = await this.getCachedResponse(`enterprise:${id}`);
      if (cached) {
        this.success(res, cached);
        return;
      }

      // 从数据库查询
      const enterprise = await EnterpriseDAO.findById(id);

      if (!enterprise) {
        this.notFound(res, 'Enterprise not found');
        return;
      }

      // 缓存结果
      await this.cacheResponse(`enterprise:${id}`, enterprise, 3600);

      this.success(res, enterprise, 'Enterprise retrieved successfully');
    } catch (error) {
      console.error('Get enterprise error:', error);
      this.serverError(res, 'Failed to retrieve enterprise');
    }
  });

  /**
   * 更新企业信息
   */
  public update = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const data: UpdateEnterpriseData = req.body;

    if (!id) {
      this.validationError(res, 'Enterprise ID is required');
      return;
    }

    // 验证域名格式（如果提供）
    if (data.domain && !ValidationUtils.isValidDomain(data.domain)) {
      this.validationError(res, 'Invalid domain format');
      return;
    }

    try {
      // 检查企业是否存在
      const existingEnterprise = await EnterpriseDAO.findById(id);
      if (!existingEnterprise) {
        this.notFound(res, 'Enterprise not found');
        return;
      }

      // 检查域名是否已被其他企业使用
      if (data.domain && data.domain !== existingEnterprise.domain) {
        const domainInUse = await EnterpriseDAO.findByDomain(data.domain);
        if (domainInUse && domainInUse.id !== id) {
          this.conflict(res, 'Domain already in use');
          return;
        }
      }

      // 更新企业
      const updatedEnterprise = await EnterpriseDAO.update(id, data);

      if (!updatedEnterprise) {
        this.serverError(res, 'Failed to update enterprise');
        return;
      }

      // 清除相关缓存
      await this.clearCache(`enterprise:${id}`);
      await this.clearCache(`enterprises:list:*`);

      this.success(res, updatedEnterprise, 'Enterprise updated successfully');
    } catch (error) {
      console.error('Update enterprise error:', error);
      this.serverError(res, 'Failed to update enterprise');
    }
  });

  /**
   * 删除企业
   */
  public delete = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      this.validationError(res, 'Enterprise ID is required');
      return;
    }

    try {
      // 检查企业是否存在
      const enterprise = await EnterpriseDAO.findById(id);
      if (!enterprise) {
        this.notFound(res, 'Enterprise not found');
        return;
      }

      // 删除企业
      const deleted = await EnterpriseDAO.delete(id);

      if (!deleted) {
        this.serverError(res, 'Failed to delete enterprise');
        return;
      }

      // 清除相关缓存
      await this.clearCache(`enterprise:${id}`);
      await this.clearCache(`enterprises:list:*`);

      this.noContent(res);
    } catch (error) {
      console.error('Delete enterprise error:', error);
      this.serverError(res, 'Failed to delete enterprise');
    }
  });

  /**
   * 获取企业统计信息
   */
  public getStats = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      this.validationError(res, 'Enterprise ID is required');
      return;
    }

    try {
      // 检查企业是否存在
      const enterprise = await EnterpriseDAO.findById(id);
      if (!enterprise) {
        this.notFound(res, 'Enterprise not found');
        return;
      }

      // 尝试从缓存获取统计信息
      const cacheKey = `enterprise:${id}:stats`;
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        this.success(res, cached);
        return;
      }

      // 获取统计信息
      const stats = await EnterpriseDAO.getStats(id);

      // 缓存统计信息（较短的缓存时间）
      await this.cacheResponse(cacheKey, stats, 300);

      this.success(res, stats, 'Enterprise statistics retrieved successfully');
    } catch (error) {
      console.error('Get enterprise stats error:', error);
      this.serverError(res, 'Failed to retrieve enterprise statistics');
    }
  });

  /**
   * 检查域名可用性
   */
  public checkDomain = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { domain } = req.params;

    if (!domain) {
      this.validationError(res, 'Domain is required');
      return;
    }

    // 验证域名格式
    if (!ValidationUtils.isValidDomain(domain)) {
      this.validationError(res, 'Invalid domain format');
      return;
    }

    try {
      const isAvailable = await EnterpriseDAO.isDomainAvailable(domain);

      this.success(
        res,
        {
          domain,
          available: isAvailable,
        },
        isAvailable ? 'Domain is available' : 'Domain is not available',
      );
    } catch (error) {
      console.error('Check domain error:', error);
      this.serverError(res, 'Failed to check domain availability');
    }
  });
}

// 导出控制器实例
export const enterpriseController = new EnterpriseController();
