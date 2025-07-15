import { BaseService } from './base.service';
import {
  EnterpriseModel,
  CreateEnterpriseData,
  UpdateEnterpriseData,
  EnterpriseQuery,
  DEFAULT_ENTERPRISE_SETTINGS,
  DEFAULT_SUBSCRIPTION_INFO,
} from '@/models/enterprise.model';
import { ValidationUtils, IDUtils } from '@/utils';
import { AppError, EnterpriseStatus } from '@/types';

/**
 * 企业服务
 */
export class EnterpriseService extends BaseService {
  /**
   * 创建企业
   */
  async create(data: CreateEnterpriseData): Promise<EnterpriseModel> {
    // 验证必需字段
    this.validateRequired(data as unknown as Record<string, unknown>, ['name', 'adminEmail', 'adminName']);

    // 验证数据格式
    this.validateFormat(data as unknown as Record<string, unknown>, {
      adminEmail: (value: unknown) => ValidationUtils.isValidEmail(value as string),
      domain: value => !value || ValidationUtils.isValidDomain(value as string),
    });

    try {
      return await this.withTransaction(async () => {
        // 检查域名是否已被使用
        if (data.domain) {
          const existingEnterprise = await this.findByDomain(data.domain);
          if (existingEnterprise) {
            throw new AppError('Domain already in use', 409, 'DOMAIN_IN_USE');
          }
        }

        // 准备企业数据
        const enterpriseData: EnterpriseModel = {
          id: IDUtils.generateUUID(),
          name: data.name,
          domain: data.domain || '',
          logoUrl: data.logoUrl || '',
          settings: {
            ...DEFAULT_ENTERPRISE_SETTINGS,
            ...data.settings,
          },
          subscriptionInfo: {
            ...DEFAULT_SUBSCRIPTION_INFO,
            ...data.subscriptionInfo,
          },
          status: 'active' as EnterpriseStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 插入企业记录
        const postgresql = this.getDB().getPostgreSQL();
        const insertQuery = `
          INSERT INTO enterprises (
            id, name, domain, logo_url, settings, subscription_info, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const result = (await postgresql.query(insertQuery, [
          enterpriseData.id,
          enterpriseData.name,
          enterpriseData.domain,
          enterpriseData.logoUrl,
          JSON.stringify(enterpriseData.settings),
          JSON.stringify(enterpriseData.subscriptionInfo),
          enterpriseData.status,
          enterpriseData.createdAt,
          enterpriseData.updatedAt,
        ])) as any;

        const createdEnterprise = this.mapDatabaseResult(result.rows[0]);

        // TODO: 创建默认管理员用户
        // await this.createDefaultAdmin(createdEnterprise.id, data.adminEmail, data.adminName);

        // 缓存企业信息
        await this.cache(`enterprise:${createdEnterprise.id}`, createdEnterprise, 3600);

        // 记录操作日志
        await this.logOperation('create_enterprise', 'enterprise', createdEnterprise.id);

        return createdEnterprise;
      });
    } catch (error) {
      this.handleDatabaseError(error, 'create enterprise');
    }
  }

  /**
   * 根据ID查找企业
   */
  async findById(id: string): Promise<EnterpriseModel | null> {
    try {
      // 尝试从缓存获取
      const cached = await this.getCache<EnterpriseModel>(`enterprise:${id}`);
      if (cached) {
        return cached;
      }

      // 从数据库查询
      const postgresql = this.getDB().getPostgreSQL();
      const query = 'SELECT * FROM enterprises WHERE id = $1 AND status != $2';
      const result = (await postgresql.query(query, [id, 'deleted'])) as any;

      if (result.rows.length === 0) {
        return null;
      }

      const enterprise = this.mapDatabaseResult(result.rows[0]);

      // 缓存结果
      await this.cache(`enterprise:${id}`, enterprise, 3600);

      return enterprise;
    } catch (error) {
      this.handleDatabaseError(error, 'find enterprise by id');
    }
  }

  /**
   * 根据域名查找企业
   */
  async findByDomain(domain: string): Promise<EnterpriseModel | null> {
    try {
      const postgresql = this.getDB().getPostgreSQL();
      const query = 'SELECT * FROM enterprises WHERE domain = $1 AND status != $2';
      const result = (await postgresql.query(query, [domain, 'deleted'])) as any;

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDatabaseResult(result.rows[0]);
    } catch (error) {
      this.handleDatabaseError(error, 'find enterprise by domain');
    }
  }

  /**
   * 查询企业列表
   */
  async findMany(
    query: EnterpriseQuery,
    page = 1,
    limit = 20,
  ): Promise<{
    data: EnterpriseModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const postgresql = this.getDB().getPostgreSQL();
      const { offset } = this.buildPaginationQuery(page, limit);

      // 构建查询条件
      const conditions: Record<string, unknown> = { ...query };
      if (conditions['createdAfter']) {
        conditions['created_at'] = `>= ${conditions['createdAfter']}`;
        delete conditions['createdAfter'];
      }
      if (conditions['createdBefore']) {
        conditions['created_at'] = `<= ${conditions['createdBefore']}`;
        delete conditions['createdBefore'];
      }

      const allowedFields = ['name', 'domain', 'status', 'created_at'];
      const { whereClause, values } = this.buildWhereConditions(conditions, allowedFields);

      // 查询总数
      const countQuery = `SELECT COUNT(*) FROM enterprises ${whereClause}`;
      const countResult = (await postgresql.query(countQuery, values)) as any;
      const total = parseInt(countResult.rows[0].count);

      // 查询数据
      const dataQuery = `
        SELECT * FROM enterprises
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      const dataResult = (await postgresql.query(dataQuery, [...values, limit, offset])) as any;

      const data = dataResult.rows.map((row: any) => this.mapDatabaseResult(row));

      return { data, total, page, limit };
    } catch (error) {
      this.handleDatabaseError(error, 'find enterprises');
    }
  }

  /**
   * 更新企业信息
   */
  async update(id: string, data: UpdateEnterpriseData): Promise<EnterpriseModel | null> {
    // 验证数据格式
    this.validateFormat(data as unknown as Record<string, unknown>, {
      domain: value => !value || ValidationUtils.isValidDomain(value as string),
    });

    try {
      return await this.withTransaction(async () => {
        // 检查企业是否存在
        const existingEnterprise = await this.findById(id);
        if (!existingEnterprise) {
          return null;
        }

        // 检查域名是否已被其他企业使用
        if (data.domain && data.domain !== existingEnterprise.domain) {
          const domainInUse = await this.findByDomain(data.domain);
          if (domainInUse && domainInUse.id !== id) {
            throw new AppError('Domain already in use', 409, 'DOMAIN_IN_USE');
          }
        }

        // 构建更新字段
        const updateFields: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) {
          updateFields.push(`name = $${paramIndex++}`);
          values.push(data.name);
        }
        if (data.domain !== undefined) {
          updateFields.push(`domain = $${paramIndex++}`);
          values.push(data.domain);
        }
        if (data.logoUrl !== undefined) {
          updateFields.push(`logo_url = $${paramIndex++}`);
          values.push(data.logoUrl);
        }
        if (data.settings !== undefined) {
          const mergedSettings = { ...existingEnterprise.settings, ...data.settings };
          updateFields.push(`settings = $${paramIndex++}`);
          values.push(JSON.stringify(mergedSettings));
        }
        if (data.subscriptionInfo !== undefined) {
          const mergedSubscription = { ...existingEnterprise.subscriptionInfo, ...data.subscriptionInfo };
          updateFields.push(`subscription_info = $${paramIndex++}`);
          values.push(JSON.stringify(mergedSubscription));
        }
        if (data.status !== undefined) {
          updateFields.push(`status = $${paramIndex++}`);
          values.push(data.status);
        }

        updateFields.push(`updated_at = $${paramIndex++}`);
        values.push(new Date());

        values.push(id); // WHERE 条件的参数

        const postgresql = this.getDB().getPostgreSQL();
        const updateQuery = `
          UPDATE enterprises 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = (await postgresql.query(updateQuery, values)) as any;
        const updatedEnterprise = this.mapDatabaseResult(result.rows[0]);

        // 清除缓存
        await this.clearCache(`enterprise:${id}`);

        // 记录操作日志
        await this.logOperation('update_enterprise', 'enterprise', id);

        return updatedEnterprise;
      });
    } catch (error) {
      this.handleDatabaseError(error, 'update enterprise');
    }
  }

  /**
   * 删除企业（软删除）
   */
  async delete(id: string): Promise<boolean> {
    try {
      return await this.withTransaction(async () => {
        const postgresql = this.getDB().getPostgreSQL();
        const updateQuery = `
          UPDATE enterprises 
          SET status = 'deleted', updated_at = $1
          WHERE id = $2 AND status != 'deleted'
        `;

        const result = (await postgresql.query(updateQuery, [new Date(), id])) as any;

        if (result.rowCount === 0) {
          return false;
        }

        // 清除缓存
        await this.clearCache(`enterprise:${id}`);

        // 记录操作日志
        await this.logOperation('delete_enterprise', 'enterprise', id);

        return true;
      });
    } catch (error) {
      this.handleDatabaseError(error, 'delete enterprise');
    }
  }

  /**
   * 检查域名可用性
   */
  async isDomainAvailable(domain: string, excludeId?: string): Promise<boolean> {
    try {
      const postgresql = this.getDB().getPostgreSQL();
      let query = 'SELECT id FROM enterprises WHERE domain = $1 AND status != $2';
      const values: unknown[] = [domain, 'deleted'];

      if (excludeId) {
        query += ' AND id != $3';
        values.push(excludeId);
      }

      const result = (await postgresql.query(query, values)) as any;
      return result.rows.length === 0;
    } catch (error) {
      this.handleDatabaseError(error, 'check domain availability');
    }
  }

  /**
   * 映射数据库结果到模型
   */
  private mapDatabaseResult(row: any): EnterpriseModel {
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      logoUrl: row.logo_url,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      subscriptionInfo:
        typeof row.subscription_info === 'string' ? JSON.parse(row.subscription_info) : row.subscription_info,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// 导出服务实例
export const enterpriseService = new EnterpriseService();
