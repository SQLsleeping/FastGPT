import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils';
import { db } from './config/database';

// 只导入核心的认证控制器和团队控制器
import { AuthController } from './controllers/auth.controller';
import { TeamController } from './controllers/team.controller';
import { authenticateJWT } from './middleware/auth.middleware';
import { permissionService, Permission } from './services/permission.service';

/**
 * 最小化应用启动器
 * 只包含核心认证功能，避免企业功能的复杂依赖
 */
class MinimalApp {
  private app: express.Application;
  private authController: AuthController;
  private teamController: TeamController;
  private pool: any;

  constructor() {
    this.app = express();
    this.pool = db.getPostgreSQL().getPool(); // 正确获取数据库连接池
    this.authController = new AuthController();
    this.teamController = new TeamController();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 基础中间件
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      }),
    );
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        version: '1.0.0',
        service: 'user-management-service',
      });
    });

    // 就绪检查
    this.app.get('/ready', async (req, res) => {
      try {
        // 检查数据库连接
        await db.getPostgreSQL().query('SELECT 1');
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'ok',
          },
        });
      } catch (error) {
        logger.error('Readiness check failed:', error);
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'error',
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // API根路径
    this.app.get('/api/v1', (req, res) => {
      res.json({
        message: 'FastGPT User Management Service API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          ready: '/ready',
          auth: '/api/v1/auth',
          'admin-auth': '/api/v1/auth/admin',
          users: '/api/v1/users',
          teams: '/api/v1/teams',
          stats: '/api/v1/stats',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // 认证路由
    this.app.post('/api/v1/auth/register', this.authController.register.bind(this.authController));
    this.app.post('/api/v1/auth/login', this.authController.login.bind(this.authController));
    this.app.post('/api/v1/auth/logout', this.authController.logout.bind(this.authController));
    this.app.post('/api/v1/auth/refresh', this.authController.refreshToken.bind(this.authController));
    this.app.post('/api/v1/auth/check-user', this.authController.checkUser.bind(this.authController));
    this.app.post('/api/v1/auth/forgot-password', this.authController.requestPasswordReset.bind(this.authController));
    this.app.post('/api/v1/auth/reset-password', this.authController.resetPassword.bind(this.authController));
    this.app.post('/api/v1/auth/change-password', this.authController.changePassword.bind(this.authController));

    // 管理员认证路由
    this.app.post('/api/v1/auth/admin/login', (req, res) => {
      try {
        const { username, password } = req.body;

        if (username === 'admin' && password === 'admin123') {
          const adminUser = {
            id: 'admin-001',
            username: 'admin',
            email: 'admin@fastgpt.com',
            role: 'super_admin',
            permissions: ['*'],
            lastLoginAt: new Date().toISOString(),
          };

          // 生成真正的JWT token
          const { JWTUtils } = require('./utils');
          const token = JWTUtils.generateToken({
            userId: adminUser.id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
            permissions: adminUser.permissions,
          });

          res.json({
            success: true,
            message: '管理员登录成功',
            data: {
              user: adminUser,
              token: token,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          });
        } else {
          res.status(401).json({
            success: false,
            message: '用户名或密码错误',
            error: 'INVALID_CREDENTIALS',
          });
        }
      } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
          success: false,
          message: '服务器内部错误',
          error: 'INTERNAL_SERVER_ERROR',
        });
      }
    });

    this.app.post('/api/v1/auth/admin/logout', (req, res) => {
      res.json({
        success: true,
        message: '管理员登出成功',
      });
    });

    this.app.get('/api/v1/auth/admin/me', (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token || !token.startsWith('mock-jwt-token-')) {
          return res.status(401).json({
            success: false,
            message: '未授权访问',
            error: 'UNAUTHORIZED',
          });
        }

        const adminUser = {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@fastgpt.com',
          role: 'super_admin',
          permissions: ['*'],
          lastLoginAt: new Date().toISOString(),
        };

        res.json({
          success: true,
          data: adminUser,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '服务器内部错误',
        });
      }
    });

    // 用户信息路由
    this.app.get('/api/v1/users/:id', this.authController.getUserById.bind(this.authController));

    // 管理员面板 - 用户管理路由
    this.app.get('/api/v1/users', async (req, res) => {
      try {
        const { page = 1, pageSize = 10, search = '', status = '', role = '' } = req.query;
        const pageNum = parseInt(page as string);
        const pageSizeNum = parseInt(pageSize as string);
        const offset = (pageNum - 1) * pageSizeNum;

        // 构建查询条件
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
          whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
          queryParams.push(`%${search}%`);
          paramIndex++;
        }

        if (status) {
          whereConditions.push(`status = $${paramIndex}`);
          queryParams.push(status);
          paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // 获取数据库连接池
        const pool = db.getPostgreSQL().getPool();

        // 获取总数
        const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].count);

        // 获取用户列表
        const usersQuery = `
          SELECT
            id, username, email, status, timezone,
            last_activity_at as "lastLoginAt",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM users
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(pageSizeNum, offset);
        const usersResult = await pool.query(usersQuery, queryParams);

        // 转换数据格式，添加角色信息
        const users = usersResult.rows.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          role: user.username === 'admin' ? 'super_admin' : 'user', // 简单的角色判断
          timezone: user.timezone || 'Asia/Shanghai',
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

        res.json({
          success: true,
          data: {
            items: users,
            total,
            page: pageNum,
            pageSize: pageSizeNum,
            totalPages: Math.ceil(total / pageSizeNum),
          },
        });
      } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
          success: false,
          message: '获取用户列表失败',
          error: error.message,
        });
      }
    });

    // 创建新用户
    this.app.post('/api/v1/users', async (req, res) => {
      try {
        const { username, email, password, role = 'user', status = 'active' } = req.body;

        // 简单验证
        if (!username || !email || !password) {
          return res.status(400).json({
            success: false,
            message: '用户名、邮箱和密码不能为空',
            error: 'VALIDATION_ERROR',
          });
        }

        const pool = db.getPostgreSQL().getPool();

        // 检查用户名和邮箱是否已存在
        const existingUserQuery = `
          SELECT id FROM users
          WHERE username = $1 OR email = $2
          LIMIT 1
        `;
        const existingUserResult = await pool.query(existingUserQuery, [username, email]);

        if (existingUserResult.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: '用户名或邮箱已存在',
            error: 'USER_EXISTS',
          });
        }

        // 生成用户ID
        const userId = require('crypto').randomBytes(12).toString('hex');

        // 创建用户
        const createUserQuery = `
          INSERT INTO users (
            id, username, email, password, status, timezone, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, NOW(), NOW()
          ) RETURNING id, username, email, status, timezone, created_at, updated_at
        `;

        const newUserResult = await pool.query(createUserQuery, [
          userId,
          username,
          email,
          password, // 在实际应用中应该加密密码
          status,
          'Asia/Shanghai'
        ]);

        const newUser = newUserResult.rows[0];
        const userData = {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          status: newUser.status,
          role: role,
          timezone: newUser.timezone || 'Asia/Shanghai',
          lastLoginAt: null,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at,
        };

        res.status(201).json({
          success: true,
          message: '用户创建成功',
          data: userData,
        });
      } catch (error) {
        console.error('创建用户失败:', error);
        res.status(500).json({
          success: false,
          message: '创建用户失败',
          error: error.message,
        });
      }
    });

    // 更新用户信息
    this.app.put('/api/v1/users/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const pool = db.getPostgreSQL().getPool();

        // 检查用户是否存在
        const userExistsQuery = `SELECT id FROM users WHERE id = $1`;
        const userExistsResult = await pool.query(userExistsQuery, [id]);

        if (userExistsResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在',
            error: 'USER_NOT_FOUND',
          });
        }

        // 构建更新查询
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (updates.username) {
          updateFields.push(`username = $${paramIndex}`);
          updateValues.push(updates.username);
          paramIndex++;
        }

        if (updates.email) {
          updateFields.push(`email = $${paramIndex}`);
          updateValues.push(updates.email);
          paramIndex++;
        }

        if (updates.status) {
          updateFields.push(`status = $${paramIndex}`);
          updateValues.push(updates.status);
          paramIndex++;
        }

        updateFields.push(`updated_at = NOW()`);
        updateValues.push(id);

        const updateUserQuery = `
          UPDATE users
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id, username, email, status, timezone, created_at, updated_at
        `;

        const updatedUserResult = await pool.query(updateUserQuery, updateValues);
        const updatedUser = updatedUserResult.rows[0];

        const userData = {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          status: updatedUser.status,
          role: updates.role || 'user',
          timezone: updatedUser.timezone || 'Asia/Shanghai',
          lastLoginAt: null,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at,
        };

        res.json({
          success: true,
          message: '用户信息更新成功',
          data: userData,
        });
      } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
          success: false,
          message: '更新用户信息失败',
          error: error.message,
        });
      }
    });

    // 删除用户
    this.app.delete('/api/v1/users/:id', async (req, res) => {
      try {
        const { id } = req.params;

        const pool = db.getPostgreSQL().getPool();

        // 检查用户是否存在
        const userExistsQuery = `SELECT id FROM users WHERE id = $1`;
        const userExistsResult = await pool.query(userExistsQuery, [id]);

        if (userExistsResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在',
            error: 'USER_NOT_FOUND',
          });
        }

        // 删除用户
        const deleteUserQuery = `DELETE FROM users WHERE id = $1`;
        await pool.query(deleteUserQuery, [id]);

        res.json({
          success: true,
          message: '用户删除成功',
        });
      } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({
          success: false,
          message: '删除用户失败',
          error: error.message,
        });
      }
    });

    // 获取单个用户详细信息
    this.app.get('/api/v1/users/:id', async (req, res) => {
      try {
        const { id } = req.params;

        const pool = db.getPostgreSQL().getPool();

        const userQuery = `
          SELECT
            id, username, email, status, timezone,
            last_activity_at as "lastLoginAt",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM users
          WHERE id = $1
        `;

        const userResult = await pool.query(userQuery, [id]);

        if (userResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在',
            error: 'USER_NOT_FOUND',
          });
        }

        const user = userResult.rows[0];
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          role: user.username === 'admin' ? 'super_admin' : 'user',
          timezone: user.timezone || 'Asia/Shanghai',
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        res.json({
          success: true,
          data: userData,
        });
      } catch (error) {
        console.error('获取用户详细信息失败:', error);
        res.status(500).json({
          success: false,
          message: '获取用户详细信息失败',
          error: error.message,
        });
      }
    });

    // 管理员面板 - 团队管理路由
    this.app.get('/api/v1/teams', async (req, res) => {
      try {
        const { page = 1, pageSize = 10, search = '', status = '' } = req.query;
        const pageNum = parseInt(page as string);
        const pageSizeNum = parseInt(pageSize as string);
        const offset = (pageNum - 1) * pageSizeNum;

        // 构建查询条件
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
          whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
          queryParams.push(`%${search}%`);
          paramIndex++;
        }

        if (status) {
          whereConditions.push(`status = $${paramIndex}`);
          queryParams.push(status);
          paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // 获取数据库连接池
        const pool = db.getPostgreSQL().getPool();

        // 获取总数
        const countQuery = `SELECT COUNT(*) FROM teams ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].count);

        // 获取团队列表，包含成员数量
        const teamsQuery = `
          SELECT
            t.id, t.name, t.description, t.status, t.owner_id as "ownerId",
            t.created_at as "createdAt", t.updated_at as "updatedAt",
            COUNT(tm.id) as "memberCount"
          FROM teams t
          LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
          ${whereClause}
          GROUP BY t.id, t.name, t.description, t.status, t.owner_id, t.created_at, t.updated_at
          ORDER BY t.created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(pageSizeNum, offset);
        const teamsResult = await pool.query(teamsQuery, queryParams);

        // 转换数据格式
        const teams = teamsResult.rows.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description || '',
          status: team.status || 'active',
          ownerId: team.ownerId,
          memberCount: parseInt(team.memberCount) || 0,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        }));

        res.json({
          success: true,
          data: {
            items: teams,
            total,
            page: pageNum,
            pageSize: pageSizeNum,
            totalPages: Math.ceil(total / pageSizeNum),
          },
        });
      } catch (error) {
        console.error('获取团队列表失败:', error);
        res.status(500).json({
          success: false,
          message: '获取团队列表失败',
          error: error.message,
        });
      }
    });

    // 获取团队成员列表
    this.app.get('/api/v1/teams/:id/members', async (req, res) => {
      try {
        const { id } = req.params;

        const pool = db.getPostgreSQL().getPool();

        const membersQuery = `
          SELECT
            tm.id, tm.role, tm.status, tm.joined_at as "joinedAt",
            u.id as "userId", u.username, u.email
          FROM team_members tm
          JOIN users u ON tm.user_id = u.id
          WHERE tm.team_id = $1 AND tm.status = 'active'
          ORDER BY tm.joined_at ASC
        `;

        const membersResult = await pool.query(membersQuery, [id]);

        const members = membersResult.rows.map(member => ({
          id: member.id,
          teamId: id,
          userId: member.userId,
          role: member.role,
          status: member.status,
          joinedAt: member.joinedAt,
          username: member.username,
          email: member.email,
        }));

        res.json({
          success: true,
          data: members,
        });
      } catch (error) {
        console.error('获取团队成员失败:', error);
        res.status(500).json({
          success: false,
          message: '获取团队成员失败',
          error: error.message,
        });
      }
    });

    // 创建新团队
    this.app.post('/api/v1/teams', async (req, res) => {
      try {
        const { name, description, ownerId } = req.body;

        // 简单验证
        if (!name || !ownerId) {
          return res.status(400).json({
            success: false,
            message: '团队名称和所有者不能为空',
            error: 'VALIDATION_ERROR',
          });
        }

        const pool = db.getPostgreSQL().getPool();

        // 检查团队名称是否已存在
        const existingTeamQuery = `
          SELECT id FROM teams
          WHERE name = $1
          LIMIT 1
        `;
        const existingTeamResult = await pool.query(existingTeamQuery, [name]);

        if (existingTeamResult.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: '团队名称已存在',
            error: 'TEAM_EXISTS',
          });
        }

        // 检查所有者是否存在
        const ownerExistsQuery = `SELECT id FROM users WHERE id = $1`;
        const ownerExistsResult = await pool.query(ownerExistsQuery, [ownerId]);

        if (ownerExistsResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '指定的所有者不存在',
            error: 'OWNER_NOT_FOUND',
          });
        }

        // 生成团队ID
        const teamId = require('crypto').randomBytes(12).toString('hex');

        // 创建团队
        const createTeamQuery = `
          INSERT INTO teams (
            id, name, description, status, owner_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, NOW(), NOW()
          ) RETURNING id, name, description, status, owner_id, created_at, updated_at
        `;

        const newTeamResult = await pool.query(createTeamQuery, [
          teamId,
          name,
          description || '',
          'active',
          ownerId
        ]);

        const newTeam = newTeamResult.rows[0];

        // 获取所有者用户名
        const ownerQuery = `SELECT username FROM users WHERE id = $1`;
        const ownerResult = await pool.query(ownerQuery, [ownerId]);
        const ownerUsername = ownerResult.rows[0]?.username || 'Unknown';

        // 将所有者添加为团队成员
        const memberQuery = `
          INSERT INTO team_members (
            id, team_id, user_id, name, role, status, joined_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, NOW()
          )
        `;
        const memberId = require('crypto').randomBytes(12).toString('hex');
        await pool.query(memberQuery, [memberId, teamId, ownerId, ownerUsername, 'owner', 'active']);

        const teamData = {
          id: newTeam.id,
          name: newTeam.name,
          description: newTeam.description || '',
          status: newTeam.status,
          ownerId: newTeam.owner_id,
          memberCount: 1,
          createdAt: newTeam.created_at,
          updatedAt: newTeam.updated_at,
        };

        res.status(201).json({
          success: true,
          message: '团队创建成功',
          data: teamData,
        });
      } catch (error) {
        console.error('创建团队失败:', error);
        res.status(500).json({
          success: false,
          message: '创建团队失败',
          error: error.message,
        });
      }
    });

    // 更新团队信息
    this.app.put('/api/v1/teams/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const pool = db.getPostgreSQL().getPool();

        // 检查团队是否存在
        const teamExistsQuery = `SELECT id FROM teams WHERE id = $1`;
        const teamExistsResult = await pool.query(teamExistsQuery, [id]);

        if (teamExistsResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '团队不存在',
            error: 'TEAM_NOT_FOUND',
          });
        }

        // 构建更新查询
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (updates.name) {
          updateFields.push(`name = $${paramIndex}`);
          updateValues.push(updates.name);
          paramIndex++;
        }

        if (updates.description !== undefined) {
          updateFields.push(`description = $${paramIndex}`);
          updateValues.push(updates.description);
          paramIndex++;
        }

        if (updates.status) {
          updateFields.push(`status = $${paramIndex}`);
          updateValues.push(updates.status);
          paramIndex++;
        }

        updateFields.push(`updated_at = NOW()`);
        updateValues.push(id);

        const updateTeamQuery = `
          UPDATE teams
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id, name, description, status, owner_id, created_at, updated_at
        `;

        const updatedTeamResult = await pool.query(updateTeamQuery, updateValues);
        const updatedTeam = updatedTeamResult.rows[0];

        // 获取成员数量
        const memberCountQuery = `
          SELECT COUNT(*) as count
          FROM team_members
          WHERE team_id = $1 AND status = 'active'
        `;
        const memberCountResult = await pool.query(memberCountQuery, [id]);
        const memberCount = parseInt(memberCountResult.rows[0].count);

        const teamData = {
          id: updatedTeam.id,
          name: updatedTeam.name,
          description: updatedTeam.description || '',
          status: updatedTeam.status,
          ownerId: updatedTeam.owner_id,
          memberCount: memberCount,
          createdAt: updatedTeam.created_at,
          updatedAt: updatedTeam.updated_at,
        };

        res.json({
          success: true,
          message: '团队信息更新成功',
          data: teamData,
        });
      } catch (error) {
        console.error('更新团队信息失败:', error);
        res.status(500).json({
          success: false,
          message: '更新团队信息失败',
          error: error.message,
        });
      }
    });

    // 删除团队
    this.app.delete('/api/v1/teams/:id', async (req, res) => {
      try {
        const { id } = req.params;

        const pool = db.getPostgreSQL().getPool();

        // 检查团队是否存在
        const teamExistsQuery = `SELECT id FROM teams WHERE id = $1`;
        const teamExistsResult = await pool.query(teamExistsQuery, [id]);

        if (teamExistsResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '团队不存在',
            error: 'TEAM_NOT_FOUND',
          });
        }

        // 删除团队成员
        const deleteMembersQuery = `DELETE FROM team_members WHERE team_id = $1`;
        await pool.query(deleteMembersQuery, [id]);

        // 删除团队
        const deleteTeamQuery = `DELETE FROM teams WHERE id = $1`;
        await pool.query(deleteTeamQuery, [id]);

        res.json({
          success: true,
          message: '团队删除成功',
        });
      } catch (error) {
        console.error('删除团队失败:', error);
        res.status(500).json({
          success: false,
          message: '删除团队失败',
          error: error.message,
        });
      }
    });

    // 管理员面板 - 统计数据路由
    this.app.get('/api/v1/stats/system', async (req, res) => {
      try {
        // 获取数据库连接池
        const pool = db.getPostgreSQL().getPool();

        // 获取用户统计
        const userStatsQuery = `
          SELECT
            COUNT(*) as total_users,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
            COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_users_today,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_prev_30_days
          FROM users
        `;
        const userStatsResult = await pool.query(userStatsQuery);
        const userStats = userStatsResult.rows[0];

        // 获取团队统计
        const teamStatsQuery = `
          SELECT
            COUNT(*) as total_teams,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_teams,
            COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_teams_today,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_teams_30_days,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_teams_prev_30_days
          FROM teams
        `;
        const teamStatsResult = await pool.query(teamStatsQuery);
        const teamStats = teamStatsResult.rows[0];

        // 计算增长率
        const userGrowthRate = userStats.new_users_prev_30_days > 0
          ? ((userStats.new_users_30_days - userStats.new_users_prev_30_days) / userStats.new_users_prev_30_days * 100)
          : 0;

        const teamGrowthRate = teamStats.new_teams_prev_30_days > 0
          ? ((teamStats.new_teams_30_days - teamStats.new_teams_prev_30_days) / teamStats.new_teams_prev_30_days * 100)
          : 0;

        const systemStats = {
          totalUsers: parseInt(userStats.total_users),
          activeUsers: parseInt(userStats.active_users),
          totalTeams: parseInt(teamStats.total_teams),
          activeTeams: parseInt(teamStats.active_teams),
          newUsersToday: parseInt(userStats.new_users_today),
          newTeamsToday: parseInt(teamStats.new_teams_today),
          userGrowthRate: Math.round(userGrowthRate * 10) / 10,
          teamGrowthRate: Math.round(teamGrowthRate * 10) / 10,
        };

        res.json({
          success: true,
          data: systemStats,
        });
      } catch (error) {
        console.error('获取系统统计数据失败:', error);
        res.status(500).json({
          success: false,
          message: '获取系统统计数据失败',
          error: error.message,
        });
      }
    });

    // 用户活动统计
    this.app.get('/api/v1/stats/user-activity', async (req, res) => {
      try {
        const { days = 7 } = req.query;
        const daysNum = parseInt(days as string);

        // 获取数据库连接池
        const pool = db.getPostgreSQL().getPool();

        // 获取过去N天的用户活动数据
        const activityQuery = `
          SELECT
            DATE(created_at) as date,
            COUNT(*) as registrations
          FROM users
          WHERE created_at >= CURRENT_DATE - INTERVAL '${daysNum} days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `;

        const activityResult = await pool.query(activityQuery);

        // 生成完整的日期范围数据
        const activityData = [];
        for (let i = daysNum - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const dayData = activityResult.rows.find(row =>
            row.date.toISOString().split('T')[0] === dateStr
          );

          activityData.push({
            date: dateStr,
            registrations: dayData ? parseInt(dayData.registrations) : 0,
            logins: Math.floor(Math.random() * 100) + 20, // 模拟登录数据，实际应该从登录日志获取
            activeUsers: Math.floor(Math.random() * 80) + 30, // 模拟活跃用户数据
          });
        }

        res.json({
          success: true,
          data: activityData,
        });
      } catch (error) {
        console.error('获取用户活动统计失败:', error);
        res.status(500).json({
          success: false,
          message: '获取用户活动统计失败',
          error: error.message,
        });
      }
    });

    // 团队管理路由（需要认证）
    this.app.post('/api/v1/teams', authenticateJWT, this.teamController.createTeam.bind(this.teamController));
    this.app.get('/api/v1/teams', authenticateJWT, this.teamController.getUserTeams.bind(this.teamController));
    this.app.get('/api/v1/teams/:teamId', authenticateJWT, this.requireTeamMember, this.teamController.getTeam.bind(this.teamController));
    this.app.put('/api/v1/teams/:teamId', authenticateJWT, this.requireTeamAdmin, this.teamController.updateTeam.bind(this.teamController));
    this.app.delete('/api/v1/teams/:teamId', authenticateJWT, this.teamController.deleteTeam.bind(this.teamController));

    // 团队成员管理路由
    this.app.get(
      '/api/v1/teams/:teamId/members',
      authenticateJWT,
      this.requireTeamMember,
      this.teamController.getTeamMembers.bind(this.teamController),
    );
    this.app.post(
      '/api/v1/teams/:teamId/invite',
      authenticateJWT,
      this.requireTeamAdmin,
      this.teamController.inviteUser.bind(this.teamController),
    );
    this.app.put(
      '/api/v1/teams/:teamId/members/:memberId/role',
      authenticateJWT,
      this.requireTeamAdmin,
      this.teamController.updateMemberRole.bind(this.teamController),
    );
    this.app.delete(
      '/api/v1/teams/:teamId/members/:memberId',
      authenticateJWT,
      this.requireTeamAdmin,
      this.teamController.removeMember.bind(this.teamController),
    );
    this.app.post(
      '/api/v1/teams/:teamId/leave',
      authenticateJWT,
      this.requireTeamMember,
      this.teamController.leaveTeam.bind(this.teamController),
    );

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 全局错误处理
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);

      // 如果响应已经发送，交给默认错误处理器
      if (res.headersSent) {
        return next(error);
      }

      const status = error.status || error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      res.status(status).json({
        error: config.app.env === 'production' ? 'Internal Server Error' : error.name || 'Error',
        message: config.app.env === 'production' && status === 500 ? 'Something went wrong' : message,
        timestamp: new Date().toISOString(),
        ...(config.app.env !== 'production' && { stack: error.stack }),
      });
    });

    // 未捕获的异常处理
    process.on('uncaughtException', error => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // 初始化数据库连接
      await db.initialize();
      logger.info('Database connection established');

      // 启动服务器
      const server = this.app.listen(config.app.port, () => {
        logger.info(`🚀 User Management Service (Minimal) is running on port ${config.app.port}`);
        logger.info(`📊 Environment: ${config.app.env}`);
        logger.info(`💚 Health check: http://localhost:${config.app.port}/health`);
        logger.info(`📡 API endpoint: http://localhost:${config.app.port}/api/v1`);
        logger.info(`🔐 Auth endpoints: http://localhost:${config.app.port}/api/v1/auth`);
      });

      // 优雅关闭
      const gracefulShutdown = (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        server.close(async () => {
          try {
            await db.close();
            logger.info('Database connection closed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  /**
   * 简单的团队权限检查中间件
   */
  private requireTeamAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const teamId = req.params.teamId;

      if (!userId || !teamId) {
        res.status(400).json({
          success: false,
          error: 'User ID and Team ID are required',
          code: 'MISSING_PARAMETERS'
        });
        return;
      }

      const isAdmin = await permissionService.isTeamAdmin(userId, teamId);
      if (!isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Team admin privileges required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Team admin check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };

  /**
   * 简单的团队成员检查中间件
   */
  private requireTeamMember = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const teamId = req.params.teamId;

      if (!userId || !teamId) {
        res.status(400).json({
          success: false,
          error: 'User ID and Team ID are required',
          code: 'MISSING_PARAMETERS'
        });
        return;
      }

      const hasPermission = await permissionService.hasTeamPermission(userId, teamId, Permission.TEAM_READ);
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Team membership required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Team member check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

// 启动应用
if (require.main === module) {
  const app = new MinimalApp();
  app.start().catch(error => {
    logger.error('Application startup failed:', error);
    process.exit(1);
  });
}

export default MinimalApp;
