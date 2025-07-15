import express, { Router } from 'express';
import { enterpriseController } from '@/controllers/enterprise.controller';
import { authenticateJWT, requireAdmin, requireEnterpriseAdmin } from '@/middleware/auth.middleware';
import { PermissionMiddleware } from '@/middleware/permission.middleware';
import { AuditMiddleware } from '@/middleware/audit.middleware';
import { ResourceType, PermissionAction } from '@/types';

/**
 * 企业管理路由
 */
const router: express.Router = Router();

/**
 * @route POST /enterprises
 * @desc 创建企业
 * @access Admin
 */
router.post(
  '/',
  authenticateJWT,
  requireAdmin,
  AuditMiddleware.auditDataChange('create_enterprise', ResourceType.ENTERPRISE),
  PermissionMiddleware.checkPermission(ResourceType.ENTERPRISE, PermissionAction.CREATE),
  enterpriseController.create,
  AuditMiddleware.completeDataChangeAudit(),
);

/**
 * @route GET /enterprises
 * @desc 获取企业列表
 * @access Admin
 */
router.get(
  '/',
  authenticateJWT,
  requireAdmin,
  AuditMiddleware.auditApiCall('list_enterprises', ResourceType.ENTERPRISE),
  PermissionMiddleware.checkPermission(ResourceType.ENTERPRISE, PermissionAction.READ),
  enterpriseController.list,
);

/**
 * @route GET /enterprises/:id
 * @desc 获取企业详情
 * @access Admin or Enterprise Admin
 */
router.get(
  '/:id',
  authenticateJWT,
  requireEnterpriseAdmin,
  AuditMiddleware.auditApiCall('get_enterprise', ResourceType.ENTERPRISE),
  PermissionMiddleware.checkEnterprisePermission(ResourceType.ENTERPRISE, PermissionAction.READ, 'id'),
  enterpriseController.getById,
);

/**
 * @route PUT /enterprises/:id
 * @desc 更新企业信息
 * @access Admin or Enterprise Admin
 */
router.put(
  '/:id',
  authenticateJWT,
  requireEnterpriseAdmin,
  AuditMiddleware.auditDataChange('update_enterprise', ResourceType.ENTERPRISE, 'id'),
  PermissionMiddleware.checkEnterprisePermission(ResourceType.ENTERPRISE, PermissionAction.UPDATE, 'id'),
  enterpriseController.update,
  AuditMiddleware.completeDataChangeAudit(),
);

/**
 * @route DELETE /enterprises/:id
 * @desc 删除企业
 * @access Admin
 */
router.delete(
  '/:id',
  authenticateJWT,
  requireAdmin,
  AuditMiddleware.auditDataChange('delete_enterprise', ResourceType.ENTERPRISE, 'id'),
  PermissionMiddleware.checkPermission(ResourceType.ENTERPRISE, PermissionAction.DELETE),
  enterpriseController.delete,
  AuditMiddleware.completeDataChangeAudit(),
);

/**
 * @route GET /enterprises/:id/stats
 * @desc 获取企业统计信息
 * @access Admin or Enterprise Admin
 */
router.get(
  '/:id/stats',
  authenticateJWT,
  requireEnterpriseAdmin,
  AuditMiddleware.auditApiCall('get_enterprise_stats', ResourceType.ENTERPRISE),
  PermissionMiddleware.checkEnterprisePermission(ResourceType.ENTERPRISE, PermissionAction.READ, 'id'),
  enterpriseController.getStats,
);

/**
 * @route GET /enterprises/domain/:domain/check
 * @desc 检查域名可用性
 * @access Public
 */
router.get('/domain/:domain/check', enterpriseController.checkDomain);

export { router as enterpriseRoutes };
