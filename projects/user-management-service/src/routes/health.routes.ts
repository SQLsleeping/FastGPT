import express, { Router } from 'express';
import { healthController } from '@/controllers/health.controller';

/**
 * 健康检查路由
 */
const router: express.Router = Router();

/**
 * @route GET /health
 * @desc 基础健康检查
 * @access Public
 */
router.get('/health', healthController.health);

/**
 * @route GET /ready
 * @desc 就绪检查（包含依赖服务检查）
 * @access Public
 */
router.get('/ready', healthController.ready);

/**
 * @route GET /live
 * @desc 存活检查
 * @access Public
 */
router.get('/live', healthController.liveness);

/**
 * @route GET /metrics
 * @desc Prometheus指标端点
 * @access Public
 */
router.get('/metrics', healthController.metrics);

/**
 * @route GET /info
 * @desc 系统信息
 * @access Public
 */
router.get('/info', healthController.info);

export { router as healthRoutes };
