# FastGPT 多用户与团队管理功能二次开发笔记

## 📝 更新日志

### 2025-07-15 - 企业认证服务扩展完成
**重要里程碑**: 完成企业级认证功能的完整实现

**新增功能**:
- ✅ 企业注册与认证流程完整实现
- ✅ 企业域名绑定和验证功能
- ✅ 批量用户导入功能
- ✅ 企业统计信息和报告生成
- ✅ 企业设置管理功能

**技术实现**:
- 新增 `EnterpriseAuthController` 控制器
- 新增 `EnterpriseAuthService` 服务层
- 完整的企业认证API端点 (9个接口)
- 扩展类型定义系统
- 完善的错误处理和验证机制

**API端点**:
```
POST /api/v1/enterprise-auth/register      - 企业注册
POST /api/v1/enterprise-auth/verify        - 企业验证
POST /api/v1/enterprise-auth/bind-domain   - 域名绑定
POST /api/v1/enterprise-auth/verify-domain - 域名验证
POST /api/v1/enterprise-auth/import-users  - 批量导入用户
GET  /api/v1/enterprise-auth/stats         - 企业统计
GET  /api/v1/enterprise-auth/report        - 企业报告
GET  /api/v1/enterprise-auth/domains       - 域名管理
GET  /api/v1/enterprise-auth/settings      - 企业设置
```

### 2025-07-14 - 用户管理服务基础架构完成
- ✅ 独立用户管理服务搭建完成
- ✅ 多数据库集成 (PostgreSQL + MongoDB + Redis)
- ✅ 基础认证和权限系统
- ✅ 企业管理CRUD接口

---

## 项目概述

FastGPT是一个基于LLMs的知识库平台，提供数据处理、RAG检索和可视化AI工作流编排等功能。本项目旨在为FastGPT增加完善的多用户与团队组建管理功能。

## 🎯 当前项目状态 (2025-07-15 更新)

### ✅ 已完成里程碑
- **独立用户管理服务** - 完全可用 🟢
  - 服务地址: `http://localhost:3001`
  - API前缀: `/api/v1`
  - 状态: 所有TypeScript错误已修正，服务正常运行
  - 数据库: PostgreSQL + MongoDB + Redis 全部连接正常

- **企业认证服务扩展** - 新增完成 🟢
  - 企业注册与认证流程完整实现
  - 域名绑定和验证功能
  - 批量用户导入功能
  - 企业统计和报告生成
  - 完整的API端点和类型定义

### 🔧 核心功能状态
- ✅ **基础架构**: 完整的TypeScript项目结构
- ✅ **数据库连接**: 多数据库支持和连接管理
- ✅ **安全中间件**: JWT认证、权限验证、审计日志
- ✅ **企业管理API**: 完整的CRUD接口
- ✅ **企业认证API**: 完整的企业级功能实现
- ✅ **监控系统**: 健康检查、就绪检查、指标监控
- ✅ **API文档**: 详细的接口说明和使用示例

### 📊 技术验证
- ✅ Express.js + TypeScript 架构
- ✅ 多数据库集成 (PostgreSQL + MongoDB + Redis)
- ✅ JWT认证机制
- ✅ 中间件系统 (认证、权限、审计、安全)
- ✅ 统一错误处理和响应格式
- ✅ 类型安全和编译检查

### 🎯 下一步计划
1. **用户认证服务** - 登录/注册/密码重置
2. **部门管理服务** - 部门CRUD和层级管理
3. **角色权限系统** - RBAC完整实现
4. **前端集成测试** - 与现有FastGPT前端集成

## 项目结构分析

### 1. 整体架构
- **技术栈**: NextJS + TypeScript + ChakraUI + MongoDB + PostgreSQL
- **架构模式**: Monorepo (pnpm workspace) + DDD领域驱动设计
- **主要目录**:
  - `projects/app`: FastGPT核心应用
  - `packages/`: 共用代码模块
    - `global`: 前后端通用代码
    - `service`: 后端专用代码  
    - `web`: 前端专用代码
  - `plugins/`: 工作流自定义插件

### 2. 现有用户系统分析

#### 用户模型 (`packages/service/support/user/schema.ts`)
```typescript
- username: 用户名(手机/邮箱)
- password: 密码(加密存储)
- status: 用户状态
- timezone: 时区
- lastLoginTmbId: 最后登录的团队成员ID
- inviterId: 邀请人ID
- promotionRate: 推广费率
```

#### 团队模型 (`packages/service/support/user/team/teamSchema.ts`)
```typescript
- name: 团队名称
- ownerId: 团队所有者ID
- avatar: 团队头像
- balance: 团队余额
- teamDomain: 团队域名
- openaiAccount: OpenAI账户配置
- notificationAccount: 通知账户
```

#### 团队成员模型 (`packages/service/support/user/team/teamMemberSchema.ts`)
```typescript
- teamId: 团队ID
- userId: 用户ID
- name: 成员名称
- status: 成员状态
- role: 成员角色(已废弃，使用权限系统)
```

### 3. 权限系统分析

#### 权限架构
- **基于位运算的权限系统**: 使用数字位字段表示权限
- **多层级权限**: 团队 -> 成员组 -> 个人
- **资源权限**: 针对不同资源类型的细粒度权限控制

#### 核心权限类
- `TeamPermission`: 团队权限控制器
- `ResourcePermissionType`: 资源权限类型
- 权限值常量: 读取、写入、管理等基础权限

### 4. 前端团队管理界面

#### 主要页面结构 (`projects/app/src/pages/account/team/index.tsx`)
- **成员管理**: 团队成员列表、邀请、权限设置
- **组织管理**: 组织架构管理
- **群组管理**: 成员群组管理
- **权限管理**: 细粒度权限配置
- **审计日志**: 操作记录追踪

#### 关键组件
- `TeamSelector`: 团队切换选择器
- `InviteModal`: 成员邀请弹窗
- `PermissionManage`: 权限管理界面
- `GroupManage`: 群组管理界面

## 二次开发详细计划

### 阶段一：需求分析与架构设计 (1-2周)

#### 1.1 功能需求详细分析

##### 1.1.1 多租户隔离机制设计
**业务需求**:
- [ ] **数据隔离**: 不同企业间的数据完全隔离，确保数据安全
- [ ] **资源隔离**: CPU、内存、存储资源的合理分配和隔离
- [ ] **配置隔离**: 每个企业可以有独立的系统配置和品牌定制
- [ ] **域名隔离**: 支持企业自定义域名访问

**技术实现方案**:
```typescript
// 多租户数据隔离策略
enum TenantIsolationStrategy {
  DATABASE_PER_TENANT = 'database_per_tenant',    // 每个租户独立数据库
  SCHEMA_PER_TENANT = 'schema_per_tenant',         // 每个租户独立Schema
  ROW_LEVEL_SECURITY = 'row_level_security'       // 行级安全策略
}

interface TenantConfig {
  tenantId: string;
  isolationStrategy: TenantIsolationStrategy;
  databaseConfig: {
    host: string;
    database: string;
    schema?: string;
  };
  resourceLimits: {
    maxUsers: number;
    maxStorage: number;
    maxApiCalls: number;
  };
  customization: {
    domain?: string;
    branding: BrandingConfig;
    features: FeatureFlags;
  };
}
```

##### 1.1.2 企业级用户管理功能
**核心功能需求**:
- [ ] **用户生命周期管理**: 注册、激活、停用、删除的完整流程
- [ ] **批量用户操作**: 支持CSV导入、批量邀请、批量权限配置
- [ ] **用户分组管理**: 按部门、项目、角色等维度进行用户分组
- [ ] **用户行为分析**: 登录记录、操作日志、使用统计

**详细功能规格**:
```typescript
interface EnterpriseUserManagement {
  // 用户导入功能
  batchImport: {
    supportedFormats: ['CSV', 'Excel', 'JSON'];
    validationRules: UserValidationRule[];
    importStrategies: ['create_only', 'update_existing', 'upsert'];
    maxBatchSize: number;
  };

  // 用户生命周期
  lifecycle: {
    registration: RegistrationConfig;
    activation: ActivationConfig;
    deactivation: DeactivationConfig;
    deletion: DeletionConfig;
  };

  // 用户分析
  analytics: {
    loginAnalytics: boolean;
    usageAnalytics: boolean;
    behaviorTracking: boolean;
    reportGeneration: boolean;
  };
}
```

##### 1.1.3 高级团队协作功能
**协作功能需求**:
- [ ] **多级组织架构**: 支持企业-部门-团队-项目的层级结构
- [ ] **跨团队协作**: 不同团队间的资源共享和协作机制
- [ ] **实时协作**: 实时通知、在线状态、协作编辑
- [ ] **工作流集成**: 与现有FastGPT工作流的深度集成

**组织架构模型**:
```typescript
interface OrganizationHierarchy {
  enterprise: {
    id: string;
    name: string;
    settings: EnterpriseSettings;
  };
  departments: Department[];
  teams: Team[];
  projects: Project[];

  // 层级关系
  relationships: {
    departmentTeams: Map<string, string[]>;
    teamProjects: Map<string, string[]>;
    crossTeamCollaborations: CollaborationRule[];
  };
}

interface CollaborationRule {
  sourceTeamId: string;
  targetTeamId: string;
  permissions: CollaborationPermission[];
  resources: SharedResource[];
  expiresAt?: Date;
}
```

##### 1.1.4 细粒度权限控制系统
**权限系统需求**:
- [ ] **基于RBAC的权限模型**: 角色-权限-资源的三层权限模型
- [ ] **动态权限配置**: 支持运行时权限配置和调整
- [ ] **权限继承机制**: 组织层级间的权限继承和覆盖
- [ ] **API级权限控制**: 每个API接口的细粒度权限控制

**权限模型设计**:
```typescript
// 权限资源类型
enum ResourceType {
  USER = 'user',
  TEAM = 'team',
  PROJECT = 'project',
  DATASET = 'dataset',
  WORKFLOW = 'workflow',
  API = 'api'
}

// 权限操作类型
enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  SHARE = 'share',
  MANAGE = 'manage'
}

interface PermissionRule {
  id: string;
  resourceType: ResourceType;
  resourceId?: string;  // 具体资源ID，为空表示所有该类型资源
  action: PermissionAction;
  effect: 'allow' | 'deny';
  conditions?: PermissionCondition[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionRule[];
  isSystem: boolean;
  enterpriseId?: string;
  inheritFrom?: string[];  // 权限继承
}
```

##### 1.1.5 审计与合规功能
**审计需求**:
- [ ] **操作日志记录**: 所有用户操作的详细记录
- [ ] **数据变更追踪**: 敏感数据的变更历史追踪
- [ ] **合规报告生成**: 符合GDPR、SOX等法规的报告
- [ ] **异常行为检测**: 基于AI的异常行为识别和告警

**审计数据模型**:
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  enterpriseId: string;
  action: string;
  resourceType: ResourceType;
  resourceId: string;
  details: {
    method: string;
    endpoint: string;
    userAgent: string;
    ipAddress: string;
    changes?: DataChange[];
  };
  result: 'success' | 'failure';
  riskLevel: 'low' | 'medium' | 'high';
}

interface DataChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'create' | 'update' | 'delete';
}
```

#### 1.2 技术栈选择与架构设计

##### 1.2.1 后端技术栈选择

**核心框架选择**:
```typescript
// 主要技术栈配置
const TechStack = {
  // 后端框架
  backend: {
    framework: 'Express.js',           // 轻量级、成熟稳定
    language: 'TypeScript',           // 类型安全、开发效率高
    runtime: 'Node.js 18+',           // 与现有FastGPT保持一致

    // 数据库
    databases: {
      primary: 'PostgreSQL 15+',      // 主数据库，支持复杂查询
      cache: 'Redis 7+',              // 缓存和会话存储
      search: 'Elasticsearch 8+',     // 全文搜索和日志分析
      timeSeries: 'InfluxDB 2+',      // 监控数据和指标存储
    },

    // 消息队列
    messageQueue: 'Redis + Bull',     // 异步任务处理

    // 认证授权
    auth: {
      jwt: 'jsonwebtoken',           // JWT令牌管理
      oauth: 'passport.js',          // OAuth集成
      mfa: 'speakeasy',              // 多因素认证
    }
  },

  // 前端框架
  frontend: {
    framework: 'Next.js 14+',         // 与现有FastGPT保持一致
    language: 'TypeScript',           // 类型安全
    ui: 'Chakra UI',                  // 与现有UI库保持一致
    stateManagement: 'Zustand',       // 轻量级状态管理

    // 数据获取
    dataFetching: 'SWR',             // 数据缓存和同步

    // 图表和可视化
    charts: 'Recharts',              // React图表库

    // 表单处理
    forms: 'React Hook Form',        // 高性能表单库
  }
};
```

**依赖包选择理由**:
- **Express.js**: 轻量级、生态丰富、与现有系统兼容性好
- **PostgreSQL**: 支持复杂查询、事务完整性、JSON支持
- **Redis**: 高性能缓存、支持多种数据结构
- **TypeScript**: 类型安全、开发效率高、维护性好

##### 1.2.2 微服务架构设计

**服务拆分策略**:
```typescript
// 微服务架构定义
interface MicroserviceArchitecture {
  services: {
    // 用户管理服务
    userManagementService: {
      port: 3001;
      responsibilities: [
        'user_authentication',
        'user_profile_management',
        'password_management',
        'user_lifecycle'
      ];
      dependencies: ['database', 'redis', 'email_service'];
    };

    // 企业管理服务
    enterpriseService: {
      port: 3002;
      responsibilities: [
        'enterprise_registration',
        'enterprise_configuration',
        'tenant_management',
        'billing_integration'
      ];
      dependencies: ['database', 'redis', 'payment_service'];
    };

    // 权限管理服务
    permissionService: {
      port: 3003;
      responsibilities: [
        'role_management',
        'permission_evaluation',
        'access_control',
        'policy_engine'
      ];
      dependencies: ['database', 'redis'];
    };

    // 审计服务
    auditService: {
      port: 3004;
      responsibilities: [
        'audit_logging',
        'compliance_reporting',
        'anomaly_detection',
        'data_retention'
      ];
      dependencies: ['elasticsearch', 'database'];
    };

    // 通知服务
    notificationService: {
      port: 3005;
      responsibilities: [
        'email_notifications',
        'real_time_notifications',
        'notification_templates',
        'delivery_tracking'
      ];
      dependencies: ['redis', 'email_service', 'websocket'];
    };
  };

  // API网关配置
  apiGateway: {
    port: 3000;
    responsibilities: [
      'request_routing',
      'authentication',
      'rate_limiting',
      'request_logging'
    ];
    middleware: [
      'cors',
      'helmet',
      'compression',
      'rate_limiter'
    ];
  };
}
```

##### 1.2.3 数据库架构设计

**数据库隔离策略**:
```sql
-- 多租户数据库架构
-- 方案1: 每个企业独立数据库
CREATE DATABASE enterprise_001;
CREATE DATABASE enterprise_002;

-- 方案2: 共享数据库，独立Schema
CREATE SCHEMA enterprise_001;
CREATE SCHEMA enterprise_002;

-- 方案3: 行级安全策略 (推荐)
-- 在所有表中添加enterprise_id字段
ALTER TABLE users ADD COLUMN enterprise_id UUID;
ALTER TABLE teams ADD COLUMN enterprise_id UUID;

-- 创建行级安全策略
CREATE POLICY enterprise_isolation ON users
  FOR ALL TO application_role
  USING (enterprise_id = current_setting('app.current_enterprise_id')::UUID);

-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

**数据库连接池配置**:
```typescript
// 数据库连接配置
interface DatabaseConfig {
  primary: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    pool: {
      min: 5;
      max: 20;
      acquireTimeoutMillis: 30000;
      idleTimeoutMillis: 600000;
    };
    ssl: boolean;
  };

  // 读写分离
  replica: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    pool: {
      min: 2;
      max: 10;
    };
  };

  // 缓存配置
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    ttl: {
      session: 3600;      // 1小时
      userProfile: 1800;  // 30分钟
      permissions: 900;   // 15分钟
    };
  };
}
```

##### 1.2.4 API网关架构设计

**API网关核心功能**:
```typescript
// API网关配置
interface ApiGatewayConfig {
  // 路由配置
  routes: {
    '/api/v1/auth/*': {
      target: 'http://user-management-service:3001';
      timeout: 5000;
      retries: 3;
      circuitBreaker: {
        threshold: 5;
        timeout: 60000;
        resetTimeout: 30000;
      };
    };

    '/api/v1/enterprises/*': {
      target: 'http://enterprise-service:3002';
      timeout: 10000;
      retries: 2;
      auth: 'required';
      rateLimit: {
        windowMs: 60000;
        max: 100;
      };
    };

    '/api/v1/permissions/*': {
      target: 'http://permission-service:3003';
      timeout: 3000;
      retries: 3;
      auth: 'required';
      cache: {
        ttl: 300;  // 5分钟缓存
        key: 'user_permissions';
      };
    };
  };

  // 中间件配置
  middleware: {
    // 安全中间件
    security: {
      helmet: true;
      cors: {
        origin: ['http://localhost:3000', 'https://*.fastgpt.io'];
        credentials: true;
      };
      rateLimiting: {
        windowMs: 15 * 60 * 1000;  // 15分钟
        max: 1000;  // 每个IP最多1000请求
      };
    };

    // 认证中间件
    authentication: {
      jwt: {
        secret: string;
        algorithms: ['HS256'];
        expiresIn: '1h';
      };
      apiKey: {
        header: 'X-API-Key';
        validation: 'database';
      };
    };

    // 日志中间件
    logging: {
      format: 'combined';
      destination: 'elasticsearch';
      fields: ['timestamp', 'method', 'url', 'status', 'responseTime', 'userId'];
    };
  };
}

// API网关实现
class ApiGateway {
  private routes: Map<string, RouteConfig>;
  private circuitBreakers: Map<string, CircuitBreaker>;

  constructor(config: ApiGatewayConfig) {
    this.setupRoutes(config.routes);
    this.setupMiddleware(config.middleware);
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    const route = this.matchRoute(req.path);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // 应用中间件
    await this.applyMiddleware(req, res, route);

    // 代理请求
    await this.proxyRequest(req, res, route);
  }

  private async proxyRequest(req: Request, res: Response, route: RouteConfig): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(route.target);

    try {
      const response = await circuitBreaker.execute(() =>
        this.makeRequest(route.target, req)
      );

      res.status(response.status).json(response.data);
    } catch (error) {
      this.handleProxyError(error, res);
    }
  }
}
```

##### 1.2.5 缓存策略设计

**多层缓存架构**:
```typescript
// 缓存策略配置
interface CacheStrategy {
  // L1缓存 - 应用内存缓存
  l1Cache: {
    type: 'memory';
    maxSize: '100MB';
    ttl: 300;  // 5分钟
    items: [
      'user_permissions',
      'role_definitions',
      'enterprise_settings'
    ];
  };

  // L2缓存 - Redis分布式缓存
  l2Cache: {
    type: 'redis';
    cluster: boolean;
    nodes: string[];
    strategies: {
      // 用户会话缓存
      userSessions: {
        keyPattern: 'session:{userId}';
        ttl: 3600;  // 1小时
        serialization: 'json';
      };

      // 权限缓存
      permissions: {
        keyPattern: 'permissions:{userId}:{resourceType}';
        ttl: 900;   // 15分钟
        invalidation: 'tag-based';
        tags: ['user', 'role', 'permission'];
      };

      // 企业配置缓存
      enterpriseConfig: {
        keyPattern: 'enterprise:{enterpriseId}:config';
        ttl: 1800;  // 30分钟
        compression: true;
      };

      // API响应缓存
      apiResponse: {
        keyPattern: 'api:{method}:{path}:{hash}';
        ttl: 300;   // 5分钟
        conditions: ['GET', 'HEAD'];
        excludePaths: ['/api/v1/auth/*'];
      };
    };
  };

  // L3缓存 - 数据库查询缓存
  l3Cache: {
    type: 'database';
    strategies: {
      queryCache: {
        enabled: true;
        ttl: 600;  // 10分钟
        maxSize: '500MB';
      };

      resultSetCache: {
        enabled: true;
        ttl: 1800;  // 30分钟
        tables: ['users', 'roles', 'permissions'];
      };
    };
  };
}

// 缓存管理器实现
class CacheManager {
  private l1Cache: MemoryCache;
  private l2Cache: RedisCache;

  constructor(strategy: CacheStrategy) {
    this.l1Cache = new MemoryCache(strategy.l1Cache);
    this.l2Cache = new RedisCache(strategy.l2Cache);
  }

  async get<T>(key: string): Promise<T | null> {
    // L1缓存查找
    let value = await this.l1Cache.get<T>(key);
    if (value) return value;

    // L2缓存查找
    value = await this.l2Cache.get<T>(key);
    if (value) {
      // 回填L1缓存
      await this.l1Cache.set(key, value);
      return value;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // 同时写入L1和L2缓存
    await Promise.all([
      this.l1Cache.set(key, value, ttl),
      this.l2Cache.set(key, value, ttl)
    ]);
  }

  async invalidate(pattern: string): Promise<void> {
    await Promise.all([
      this.l1Cache.invalidate(pattern),
      this.l2Cache.invalidate(pattern)
    ]);
  }

  // 基于标签的缓存失效
  async invalidateByTags(tags: string[]): Promise<void> {
    await this.l2Cache.invalidateByTags(tags);
  }
}
```

##### 1.2.6 安全架构设计

**安全防护体系**:
```typescript
// 安全配置
interface SecurityConfig {
  // 认证安全
  authentication: {
    // JWT配置
    jwt: {
      algorithm: 'RS256';  // 使用RSA非对称加密
      publicKey: string;
      privateKey: string;
      issuer: 'fastgpt-user-management';
      audience: 'fastgpt-services';
      expiresIn: '1h';
      refreshTokenExpiry: '7d';
    };

    // 密码策略
    passwordPolicy: {
      minLength: 8;
      requireUppercase: true;
      requireLowercase: true;
      requireNumbers: true;
      requireSpecialChars: true;
      preventReuse: 5;  // 防止重复使用最近5个密码
      maxAge: 90;       // 密码最长90天
    };

    // 多因素认证
    mfa: {
      enabled: boolean;
      methods: ['totp', 'sms', 'email'];
      backupCodes: {
        count: 10;
        length: 8;
      };
    };
  };

  // 授权安全
  authorization: {
    // 权限检查
    permissionCheck: {
      cacheEnabled: true;
      cacheTtl: 300;
      strictMode: true;  // 严格模式，权限不足直接拒绝
    };

    // 会话管理
    session: {
      maxConcurrent: 5;     // 最多5个并发会话
      idleTimeout: 1800;    // 30分钟无操作超时
      absoluteTimeout: 28800; // 8小时绝对超时
      ipBinding: true;      // 绑定IP地址
    };
  };

  // 数据安全
  dataSecurity: {
    // 数据加密
    encryption: {
      algorithm: 'AES-256-GCM';
      keyRotation: {
        enabled: true;
        interval: '30d';  // 30天轮换一次
      };
      fields: [
        'users.password',
        'users.email',
        'audit_logs.details'
      ];
    };

    // 数据脱敏
    dataMasking: {
      enabled: true;
      rules: {
        email: 'partial',     // 部分脱敏
        phone: 'partial',
        idCard: 'full',       // 完全脱敏
        bankAccount: 'full'
      };
    };
  };

  // 网络安全
  networkSecurity: {
    // IP白名单
    ipWhitelist: {
      enabled: boolean;
      adminIps: string[];
      apiIps: string[];
    };

    // DDoS防护
    ddosProtection: {
      enabled: true;
      threshold: 1000;      // 每秒1000请求
      blockDuration: 3600;  // 封禁1小时
    };

    // SSL/TLS配置
    tls: {
      minVersion: '1.2';
      cipherSuites: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256'
      ];
      hsts: {
        enabled: true;
        maxAge: 31536000;  // 1年
        includeSubDomains: true;
      };
    };
  };
}

// 安全中间件实现
class SecurityMiddleware {
  constructor(private config: SecurityConfig) {}

  // JWT验证中间件
  jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = this.extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const payload = jwt.verify(token, this.config.authentication.jwt.publicKey, {
        algorithms: [this.config.authentication.jwt.algorithm],
        issuer: this.config.authentication.jwt.issuer,
        audience: this.config.authentication.jwt.audience
      });

      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // 权限检查中间件
  checkPermission = (resource: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      const hasPermission = await this.permissionService.checkPermission(
        userId, resource, action
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  };

  // 速率限制中间件
  rateLimit = (options: RateLimitOptions) => {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: 'Too many requests',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.user?.id || req.ip;  // 基于用户ID或IP限制
      }
    });
  };
}
```

### 阶段二：后端服务开发 (3-4周)

#### 2.1 独立用户管理服务 ✅ 已完成并运行
**目录**: `projects/user-management-service/`
**服务地址**: `http://localhost:3001`
**API前缀**: `/api/v1`

##### 🎉 最新状态 (2025-07-14):
- ✅ **所有TypeScript编译错误已修正**
- ✅ **服务成功启动并运行**
- ✅ **数据库连接正常** (PostgreSQL + MongoDB + Redis)
- ✅ **API端点正常响应**
- ✅ **健康检查通过**

##### 已完成的基础架构:
- [x] **项目结构创建和环境配置**
  - 完整的TypeScript项目结构
  - 开发环境配置（ESLint、Prettier、Vitest）
  - Docker容器化支持
  - 环境变量管理

- [x] **数据库设计和迁移脚本**
  - 企业、部门、角色、审计日志等核心数据表设计
  - 6个数据库迁移脚本
  - 数据库迁移管理工具
  - PostgreSQL + MongoDB + Redis 支持

- [x] **基础服务框架搭建**
  - 数据库连接管理
  - 认证和权限中间件
  - 审计日志中间件
  - Express.js服务器配置

- [x] **基础API接口实现**
  - 健康检查和监控端点
  - 企业管理CRUD接口
  - 基础控制器和服务层
  - 基础测试用例

##### 待实现的核心功能模块:
- [x] **用户认证服务** ✅ **已完成基础架构**
  - [x] 基础登录注册接口 (邮箱登录)
  - [x] JWT令牌管理基础架构
  - [x] 密码策略配置类型定义
  - [ ] 多种登录方式支持(手机、SSO)
  - [ ] 多因素认证(MFA)

- [x] **企业管理服务扩展** ✅ **已完成核心功能**
  - [x] 企业注册与认证流程
  - [x] 企业级用户导入
  - [x] 企业域名绑定
  - [x] 企业统计和报告
  - [x] 企业设置管理
  - [x] 完整的API端点实现

- [ ] **高级团队管理** 🔄 **部分完成**
  - [x] 基础部门管理架构
  - [x] 角色系统基础架构
  - [ ] 多级组织架构完整实现
  - [ ] 角色模板系统
  - [ ] 团队协作工具集成

- [ ] **权限管理服务** 🔄 **部分完成**
  - [x] 基于RBAC的权限模型基础
  - [x] JWT权限验证中间件
  - [ ] 动态权限配置
  - [ ] 权限继承机制
  - [ ] API级别权限控制完整实现

#### 2.1.1 当前实现状态总结 (2025-07-15更新)

##### ✅ 已完成的核心组件:

**1. 用户管理服务基础架构**
- 完整的Express.js服务器搭建
- MongoDB + Redis数据库连接
- 统一的日志系统和错误处理
- 健康检查和监控端点

**2. 企业认证服务完整实现**
- `EnterpriseAuthController` - 企业认证控制器
- `EnterpriseAuthService` - 企业认证服务逻辑
- 完整的企业注册流程 (注册→邮箱验证→激活)
- 企业域名绑定和验证功能
- 批量用户导入功能
- 企业统计信息和报告生成

**3. API端点实现**
```
POST /api/v1/enterprise-auth/register      - 企业注册
POST /api/v1/enterprise-auth/verify        - 企业验证
POST /api/v1/enterprise-auth/bind-domain   - 域名绑定
POST /api/v1/enterprise-auth/verify-domain - 域名验证
POST /api/v1/enterprise-auth/import-users  - 批量导入用户
GET  /api/v1/enterprise-auth/stats         - 企业统计
GET  /api/v1/enterprise-auth/report        - 企业报告
GET  /api/v1/enterprise-auth/domains       - 域名管理
GET  /api/v1/enterprise-auth/settings      - 企业设置
```

**4. 类型系统完善**
- 企业注册相关类型定义
- 域名绑定和验证类型
- 用户导入类型定义
- 企业统计和报告类型
- 密码策略配置类型

##### 🔄 下一步开发计划:

**优先级1 - 数据库集成**
- 实现MongoDB数据模型
- 完善数据库操作逻辑
- 添加数据验证和约束

**优先级2 - 高级团队管理**
- 多用户间协作
- 个人/团队工作空间
- 团队角色管理

**优先级3 - 测试完善**
- 单元测试编写
- 集成测试实现
- API端点测试

#### 2.2 数据模型扩展

##### 新增数据模型:

**✅ 已实现的类型定义** (位于 `src/types/index.ts`):
```typescript
// ✅ 企业模型 - 已完成
interface Enterprise {
  id: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  settings: EnterpriseSettings;
  subscriptionInfo: SubscriptionInfo;
  status: EnterpriseStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ 企业认证相关类型 - 已完成
interface EnterpriseRegistrationRequest {
  name: string;
  displayName?: string;
  contactEmail: string;
  contactPhone: string;
  adminEmail: string;
  adminPassword: string;
  // ... 更多字段
}

// ✅ 密码策略 - 已完成
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge?: number;
  preventReuse?: number;
}
```

**🔄 待完善的数据模型**:
```typescript
// 部门模型 - 需要完善
interface Department {
  id: string;
  enterpriseId: string;
  name: string;
  parentId?: string;
  managerId: string;
  members: string[];
  createdAt: Date;
}

// 角色模板 - 需要实现
interface RoleTemplate {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem: boolean;
  enterpriseId?: string;
}
```

#### 2.3 API接口设计

**✅ 已实现的API接口**:
- [x] RESTful API基础架构
- [x] 企业认证API完整实现
- [x] 统一响应格式
- [x] 错误处理机制
- [x] JWT认证中间件

**🔄 待实现的API功能**:
- [ ] GraphQL查询接口
- [ ] WebSocket实时通信
- [ ] API文档生成 (Swagger/OpenAPI)
- [ ] API版本控制
- [ ] 速率限制完善

### 阶段三：前端界面开发 (2-3周)

#### 3.1 管理后台界面
**目录**: `projects/admin-dashboard/`

- [ ] **企业管理面板**
  - 企业信息配置
  - 用户统计仪表板
  - 使用量监控
  - 计费管理

- [ ] **高级用户管理**
  - 批量用户操作
  - 用户生命周期管理
  - 用户行为分析
  - 访问控制配置

#### 3.2 用户界面增强
- [ ] **团队协作增强**
  - 实时协作功能
  - 团队日历
  - 任务分配系统
  - 团队知识库共享

- [ ] **个人工作台**
  - 个性化仪表板
  - 工作流程管理
  - 通知中心
  - 个人设置中心

### 阶段四：集成与测试 (1-2周)

#### 4.1 系统集成
- [ ] 与现有FastGPT系统集成
- [ ] 数据迁移脚本
- [ ] API网关配置
- [ ] 负载均衡配置

#### 4.2 测试验证
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 安全测试

### 阶段五：部署与优化 (1周)

#### 5.1 部署配置
- [ ] Docker容器化
- [ ] Kubernetes部署配置
- [ ] CI/CD流水线
- [ ] 监控告警配置

#### 5.2 性能优化
- [ ] 数据库查询优化
- [ ] 缓存策略优化
- [ ] 前端性能优化
- [ ] API响应优化

## 技术实现要点

### 1. 服务隔离策略
- 使用独立的数据库实例
- 通过API网关进行服务通信
- 实现服务间的松耦合

### 2. 数据安全
- 数据加密存储
- API访问控制
- 审计日志记录
- 合规性检查

### 3. 扩展性设计
- 微服务架构
- 水平扩展支持
- 插件化架构
- 配置化管理

## 详细开发时间表

### 第1周 (2025-01-14 ~ 2025-01-20) - 需求分析与架构设计
**目标**: 完成详细需求分析和技术架构设计

#### 具体任务:

##### Day 1 (2025-01-14): 项目结构分析和现有功能梳理
- [x] **上午**: FastGPT项目结构深度分析
  - [x] 分析现有用户系统架构
  - [x] 梳理团队管理功能
  - [x] 研究权限系统实现
- [x] **下午**: 编写项目分析报告
  - [x] 创建Notes.md文档
  - [x] 记录现有功能特性
  - [x] 识别扩展点和改进机会

##### Day 2 (2025-01-15): 多租户架构需求分析
- [ ] **上午**: 多租户隔离机制设计
  - [ ] 研究数据隔离策略 (Database/Schema/Row-level)
  - [ ] 设计租户配置模型
  - [ ] 分析资源隔离需求
- [ ] **下午**: 企业级用户管理需求
  - [ ] 用户生命周期管理流程设计
  - [ ] 批量用户操作需求分析
  - [ ] 用户分组和标签系统设计

**交付物**:
- [ ] 多租户架构设计文档
- [ ] 用户管理需求规格书

##### Day 3 (2025-01-16): 高级团队协作功能分析
- [ ] **上午**: 组织架构需求分析
  - [ ] 多级组织结构设计
  - [ ] 部门管理功能规格
  - [ ] 跨部门协作机制
- [ ] **下午**: 团队协作功能设计
  - [ ] 实时协作需求分析
  - [ ] 工作流集成方案
  - [ ] 团队资源共享机制

**交付物**:
- [ ] 组织架构设计文档
- [ ] 团队协作功能规格书

##### Day 4 (2025-01-17): 权限系统架构设计
- [ ] **上午**: RBAC权限模型设计
  - [ ] 角色-权限-资源三层模型
  - [ ] 权限继承机制设计
  - [ ] 动态权限配置方案
- [ ] **下午**: 权限检查和执行机制
  - [ ] API级权限控制设计
  - [ ] 权限缓存策略
  - [ ] 权限审计机制

**交付物**:
- [ ] 权限系统架构文档
- [ ] 权限模型设计图

##### Day 5 (2025-01-18): 技术栈选择和微服务架构
- [ ] **上午**: 技术栈评估和选择
  - [ ] 后端框架选择 (Express.js + TypeScript)
  - [ ] 数据库选择 (PostgreSQL + Redis)
  - [ ] 消息队列选择 (Redis + Bull)
- [ ] **下午**: 微服务架构设计
  - [ ] 服务拆分策略
  - [ ] 服务间通信方案
  - [ ] API网关设计

**交付物**:
- [ ] 技术栈选择报告
- [ ] 微服务架构设计文档

##### Day 6 (2025-01-19): 数据库和API设计
- [ ] **上午**: 数据库架构设计
  - [ ] 数据模型设计
  - [ ] 数据库隔离方案
  - [ ] 数据迁移策略
- [ ] **下午**: API接口设计
  - [ ] RESTful API规范
  - [ ] API版本控制策略
  - [ ] API文档规范

**交付物**:
- [ ] 数据库设计文档
- [ ] API接口设计文档

##### Day 7 (2025-01-20): 安全架构和部署方案
- [ ] **上午**: 安全架构设计
  - [ ] 认证授权机制
  - [ ] 数据加密方案
  - [ ] 安全防护策略
- [ ] **下午**: 部署和监控方案
  - [ ] Docker容器化方案
  - [ ] Kubernetes部署配置
  - [ ] 监控告警系统设计

**交付物**:
- [ ] 安全架构设计文档
- [ ] 部署方案设计文档

#### 第1周总交付物清单:

##### 1. 需求分析文档
- [ ] **多租户需求规格书** (`docs/requirements/multi-tenant-requirements.md`)
  - 租户隔离策略
  - 资源配额管理
  - 企业级配置需求

- [ ] **用户管理需求规格书** (`docs/requirements/user-management-requirements.md`)
  - 用户生命周期管理
  - 批量操作需求
  - 用户分析需求

- [ ] **团队协作需求规格书** (`docs/requirements/team-collaboration-requirements.md`)
  - 组织架构需求
  - 协作功能需求
  - 工作流集成需求

##### 2. 架构设计文档
- [ ] **系统架构设计文档** (`docs/architecture/system-architecture.md`)
  - 整体架构图
  - 微服务拆分方案
  - 服务间通信设计

- [ ] **数据库设计文档** (`docs/architecture/database-design.md`)
  - 数据模型ER图
  - 数据库隔离方案
  - 索引和性能优化

- [ ] **API设计文档** (`docs/architecture/api-design.md`)
  - API接口规范
  - 请求响应格式
  - 错误处理机制

##### 3. 技术选型文档
- [ ] **技术栈选择报告** (`docs/technical/tech-stack-selection.md`)
  - 技术选型对比
  - 选择理由说明
  - 风险评估

- [ ] **安全架构文档** (`docs/security/security-architecture.md`)
  - 安全威胁分析
  - 安全防护措施
  - 合规性要求

##### 4. 项目管理文档
- [ ] **项目计划书** (`docs/project/project-plan.md`)
  - 详细开发计划
  - 里程碑定义
  - 风险管理计划

- [ ] **开发规范文档** (`docs/development/coding-standards.md`)
  - 代码规范
  - Git工作流
  - 测试规范

#### 第1周验收标准:
- [ ] 所有需求分析文档完成并通过评审
- [ ] 技术架构设计获得技术团队认可
- [ ] 数据库设计通过DBA评审
- [ ] API设计符合RESTful规范
- [ ] 安全架构通过安全评审
- [ ] 项目计划获得项目组确认

#### 第1周风险控制:
- **需求变更风险**: 及时与业务方确认需求，避免后期大幅调整
- **技术选型风险**: 充分调研技术方案，考虑与现有系统的兼容性
- **时间风险**: 合理安排任务优先级，确保核心文档按时完成

### 第2周 (2025-01-21 ~ 2025-01-27) - 基础架构搭建
**目标**: 搭建独立用户管理服务的基础架构

#### 具体任务:
- [ ] **Day 1-2**: 项目结构创建
  - 创建用户管理服务项目
  - 配置开发环境
  - 设置代码规范和工具
- [ ] **Day 3-4**: 数据库设计实现
  - 创建新增数据表
  - 扩展现有数据表
  - 数据迁移脚本编写
- [ ] **Day 5-6**: 基础服务框架搭建
  - Express.js服务器配置
  - 数据库连接配置
  - 基础中间件配置
- [ ] **Day 7**: 基础API接口实现
  - 健康检查接口
  - 基础CRUD接口

#### 交付物:
- [ ] 用户管理服务基础项目
- [ ] 数据库迁移脚本
- [ ] 基础API接口

### 第3周 (2025-01-28 ~ 2025-02-03) - 企业管理功能开发
**目标**: 实现企业注册、配置和基础管理功能

#### 具体任务:
- [ ] **Day 1-2**: 企业注册功能
  - 企业注册API
  - 企业信息验证
  - 企业域名绑定
- [ ] **Day 3-4**: 企业配置管理
  - 企业设置API
  - 企业级配置管理
  - 企业品牌定制
- [ ] **Day 5-6**: 企业用户管理
  - 批量用户导入
  - 用户生命周期管理
  - 用户状态管理
- [ ] **Day 7**: 企业仪表板数据
  - 用户统计API
  - 使用量统计API
  - 活跃度分析API

#### 交付物:
- [ ] 企业管理API接口
- [ ] 企业配置管理功能
- [ ] 批量用户管理功能

### 第4周 (2025-02-04 ~ 2025-02-10) - 高级团队管理功能
**目标**: 实现部门管理、角色模板和高级权限功能

#### 具体任务:
- [ ] **Day 1-2**: 部门管理功能
  - 部门CRUD操作
  - 部门层级管理
  - 部门成员管理
- [ ] **Day 3-4**: 角色模板系统
  - 角色模板CRUD
  - 权限模板配置
  - 角色继承机制
- [ ] **Day 5-6**: 高级权限系统
  - 基于RBAC的权限控制
  - 动态权限配置
  - 权限检查中间件
- [ ] **Day 7**: 权限管理API
  - 权限分配API
  - 权限查询API
  - 权限审计API

#### 交付物:
- [ ] 部门管理功能
- [ ] 角色模板系统
- [ ] 高级权限管理系统

### 第5周 (2025-02-11 ~ 2025-02-17) - 前端管理界面开发
**目标**: 开发企业管理后台界面

#### 具体任务:
- [ ] **Day 1-2**: 管理后台项目搭建
  - Next.js项目创建
  - UI组件库配置
  - 路由配置
- [ ] **Day 3-4**: 企业管理界面
  - 企业仪表板
  - 企业设置页面
  - 用户管理界面
- [ ] **Day 5-6**: 部门和权限管理界面
  - 部门管理页面
  - 角色管理页面
  - 权限配置界面
- [ ] **Day 7**: 数据可视化组件
  - 用户统计图表
  - 使用量监控
  - 活跃度热力图

#### 交付物:
- [ ] 企业管理后台界面
- [ ] 用户管理界面
- [ ] 权限管理界面

### 第6周 (2025-02-18 ~ 2025-02-24) - 前端功能完善
**目标**: 完善前端功能和用户体验

#### 具体任务:
- [ ] **Day 1-2**: 批量操作功能
  - 批量用户导入界面
  - 批量权限配置
  - 批量操作确认
- [ ] **Day 3-4**: 搜索和过滤功能
  - 高级搜索组件
  - 多维度过滤
  - 搜索结果导出
- [ ] **Day 5-6**: 实时功能
  - WebSocket连接
  - 实时通知
  - 实时状态更新
- [ ] **Day 7**: 移动端适配
  - 响应式设计优化
  - 移动端交互优化

#### 交付物:
- [ ] 完善的前端管理界面
- [ ] 批量操作功能
- [ ] 实时通知系统

### 第7周 (2025-02-25 ~ 2025-03-03) - 系统集成与测试
**目标**: 与现有FastGPT系统集成并进行全面测试

#### 具体任务:
- [ ] **Day 1-2**: 系统集成
  - API网关配置
  - 服务间通信
  - 数据同步机制
- [ ] **Day 3-4**: 单元测试
  - 后端API测试
  - 前端组件测试
  - 数据库操作测试
- [ ] **Day 5-6**: 集成测试
  - 端到端测试
  - 性能测试
  - 安全测试
- [ ] **Day 7**: 用户验收测试
  - 功能验收
  - 用户体验测试
  - 问题修复

#### 交付物:
- [ ] 集成的完整系统
- [ ] 测试报告
- [ ] 问题修复记录

### 第8周 (2025-03-04 ~ 2025-03-10) - 部署与优化
**目标**: 系统部署上线和性能优化

#### 具体任务:
- [ ] **Day 1-2**: 部署配置
  - Docker容器化
  - Kubernetes配置
  - CI/CD流水线
- [ ] **Day 3-4**: 监控配置
  - 应用监控
  - 日志聚合
  - 告警配置
- [ ] **Day 5-6**: 性能优化
  - 数据库查询优化
  - API响应优化
  - 前端性能优化
- [ ] **Day 7**: 上线部署
  - 生产环境部署
  - 数据迁移
  - 系统验证

#### 交付物:
- [ ] 生产环境部署
- [ ] 监控告警系统
- [ ] 性能优化报告

## 开发日志

### 2025-01-14 ✅ Day 1 完成
- [x] **项目结构深度分析** (上午 9:00-12:00)
  - [x] 分析FastGPT现有用户系统架构 (`packages/service/support/user/`)
  - [x] 梳理团队管理功能实现 (`packages/service/support/user/team/`)
  - [x] 研究权限系统设计 (`packages/service/support/permission/`)
  - [x] 分析前端团队管理界面 (`projects/app/src/pageComponents/account/team/`)

- [x] **详细开发计划制定** (下午 13:00-18:00)
  - [x] 编写完整的Notes.md文档 (1391行)
  - [x] 制定8周详细开发时间表
  - [x] 设计技术实现方案
  - [x] 细化阶段一需求分析与架构设计内容

- [x] **架构设计可视化** (晚上 19:00-21:00)
  - [x] 创建系统架构图 (Mermaid图表)
  - [x] 设计数据库ER图
  - [x] 制定技术栈选择方案
  - [x] 设计微服务架构

- [x] **项目管理工具配置**
  - [x] 创建任务管理系统
  - [x] 设置阶段一详细任务清单
  - [x] 配置进度跟踪机制

**今日成果**:
- ✅ 完成1391行详细的Notes.md文档
- ✅ 创建系统架构图和数据库ER图
- ✅ 制定完整的8周开发计划
- ✅ 设置项目任务管理系统
- ✅ 完成Day 1所有计划任务

**明日计划** (2025-01-15 - Day 2):
- [ ] 多租户隔离机制详细设计
- [ ] 企业级用户管理需求分析
- [ ] 完成多租户架构设计文档
- [ ] 编写用户管理需求规格书

## 技术选型对比分析

### 后端框架对比

| 框架 | Express.js | Fastify | Koa.js | NestJS |
|------|------------|---------|--------|---------|
| **性能** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **生态系统** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **学习曲线** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **TypeScript支持** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **与FastGPT兼容性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **选择理由** | 成熟稳定，生态丰富，与现有系统兼容 | 高性能，但生态相对较小 | 现代化，但学习成本高 | 企业级，但可能过于复杂 |

**推荐**: Express.js - 平衡了性能、生态和兼容性

### 数据库选型对比

| 数据库 | PostgreSQL | MySQL | MongoDB | 混合方案 |
|--------|------------|-------|---------|----------|
| **ACID支持** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **JSON支持** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **复杂查询** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **扩展性** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **运维成本** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **与FastGPT兼容** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**推荐**: PostgreSQL + MongoDB混合方案
- PostgreSQL: 用户、权限、企业等结构化数据
- MongoDB: 保持与现有FastGPT的兼容性

### 缓存方案对比

| 方案 | Redis单机 | Redis集群 | Memcached | 内存缓存 |
|------|-----------|-----------|-----------|----------|
| **性能** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **可靠性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **功能丰富度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **运维复杂度** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **成本** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**推荐**: Redis单机 + 多层缓存策略
- 开发阶段使用单机版本
- 生产环境可升级为集群

### 消息队列对比

| 方案 | Redis + Bull | RabbitMQ | Apache Kafka | AWS SQS |
|------|--------------|----------|--------------|---------|
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **性能** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **可靠性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **运维成本** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **与现有系统集成** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

**推荐**: Redis + Bull
- 复用Redis基础设施
- 简单易用，满足当前需求

## 关键决策记录

### 决策1: 多租户隔离策略
**选择**: 行级安全策略 (Row Level Security)
**理由**:
- 平衡了数据隔离和资源利用
- PostgreSQL原生支持
- 便于数据分析和报告

### 决策2: 微服务拆分粒度
**选择**: 按业务领域拆分 (用户、企业、权限、审计、通知)
**理由**:
- 符合DDD设计原则
- 便于团队分工开发
- 降低服务间耦合

### 决策3: API设计风格
**选择**: RESTful API + GraphQL查询
**理由**:
- RESTful适合CRUD操作
- GraphQL适合复杂查询
- 提供灵活的数据获取方式

### 决策4: 认证授权方案
**选择**: JWT + RBAC权限模型
**理由**:
- JWT无状态，便于扩展
- RBAC模型成熟稳定
- 支持细粒度权限控制

### 待办事项 (按优先级排序)
1. [ ] **高优先级**
   - [ ] 创建独立的用户管理服务项目结构
   - [ ] 设计数据库迁移方案
   - [ ] 实现企业注册和基础管理功能

2. [ ] **中优先级**
   - [ ] 开发高级权限管理系统
   - [ ] 实现部门管理功能
   - [ ] 开发批量用户操作功能

3. [ ] **低优先级**
   - [ ] 实现高级数据分析功能
   - [ ] 开发移动端管理界面
   - [ ] 集成第三方SSO系统

### 风险评估与应对措施

#### 技术风险
1. **数据迁移风险**
   - 风险: 现有数据迁移可能导致数据丢失
   - 应对: 制定详细的数据备份和回滚方案

2. **性能风险**
   - 风险: 大规模用户场景下的性能问题
   - 应对: 提前进行性能测试和优化

3. **兼容性风险**
   - 风险: 新功能可能影响现有FastGPT功能
   - 应对: 充分的集成测试和渐进式部署

#### 项目风险
1. **时间风险**
   - 风险: 开发时间可能超出预期
   - 应对: 采用敏捷开发方法，定期评估进度

2. **资源风险**
   - 风险: 开发资源不足
   - 应对: 合理分配任务，必要时调整优先级

### 成功标准

#### 功能标准
- [ ] 支持企业级多租户管理
- [ ] 实现完善的权限控制系统
- [ ] 提供直观的管理界面
- [ ] 保证系统安全性和稳定性

#### 性能标准
- [ ] 支持10,000+并发用户
- [ ] API响应时间<200ms
- [ ] 系统可用性>99.9%
- [ ] 数据库查询优化率>50%

#### 质量标准
- [ ] 代码测试覆盖率>80%
- [ ] 安全漏洞扫描通过
- [ ] 用户体验评分>4.5/5
- [ ] 文档完整性>90%

## 注意事项

1. **保持兼容性**: 确保新功能不影响现有FastGPT功能
2. **性能考虑**: 大规模用户场景下的性能优化
3. **安全第一**: 严格的权限控制和数据保护
4. **可维护性**: 清晰的代码结构和完善的文档
5. **测试覆盖**: 全面的测试用例和自动化测试

## 详细技术实现方案

### 1. 独立用户管理服务架构

#### 1.1 服务目录结构
```
projects/user-management-service/
├── src/
│   ├── controllers/          # 控制器层
│   │   ├── auth.controller.ts
│   │   ├── enterprise.controller.ts
│   │   ├── user.controller.ts
│   │   └── team.controller.ts
│   ├── services/            # 业务逻辑层
│   │   ├── auth.service.ts
│   │   ├── enterprise.service.ts
│   │   ├── permission.service.ts
│   │   └── notification.service.ts
│   ├── models/              # 数据模型
│   │   ├── enterprise.model.ts
│   │   ├── department.model.ts
│   │   ├── role.model.ts
│   │   └── audit.model.ts
│   ├── middleware/          # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── permission.middleware.ts
│   │   └── audit.middleware.ts
│   ├── utils/               # 工具函数
│   ├── config/              # 配置文件
│   └── types/               # 类型定义
├── tests/                   # 测试文件
├── docker/                  # Docker配置
├── docs/                    # API文档
└── package.json
```

#### 1.2 核心API接口设计

##### 企业管理API
```typescript
// 企业注册
POST /api/v1/enterprises
{
  "name": "企业名称",
  "domain": "company.com",
  "adminEmail": "admin@company.com",
  "settings": {
    "allowSelfRegistration": true,
    "passwordPolicy": {...},
    "ssoConfig": {...}
  }
}

// 企业配置更新
PUT /api/v1/enterprises/:id
PATCH /api/v1/enterprises/:id/settings

// 企业用户管理
GET /api/v1/enterprises/:id/users
POST /api/v1/enterprises/:id/users/batch-import
DELETE /api/v1/enterprises/:id/users/:userId
```

##### 高级团队管理API
```typescript
// 部门管理
GET /api/v1/enterprises/:id/departments
POST /api/v1/enterprises/:id/departments
PUT /api/v1/departments/:id
DELETE /api/v1/departments/:id

// 角色模板管理
GET /api/v1/enterprises/:id/role-templates
POST /api/v1/enterprises/:id/role-templates
PUT /api/v1/role-templates/:id
```

### 2. 数据库设计扩展

#### 2.1 新增数据表结构

##### 企业表 (enterprises)
```sql
CREATE TABLE enterprises (
  id VARCHAR(24) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url VARCHAR(500),
  settings JSONB,
  subscription_info JSONB,
  status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_domain (domain),
  INDEX idx_status (status)
);
```

##### 部门表 (departments)
```sql
CREATE TABLE departments (
  id VARCHAR(24) PRIMARY KEY,
  enterprise_id VARCHAR(24) NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(24),
  manager_id VARCHAR(24),
  description TEXT,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
  FOREIGN KEY (parent_id) REFERENCES departments(id),
  INDEX idx_enterprise (enterprise_id),
  INDEX idx_parent (parent_id)
);
```

##### 角色模板表 (role_templates)
```sql
CREATE TABLE role_templates (
  id VARCHAR(24) PRIMARY KEY,
  enterprise_id VARCHAR(24),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
  INDEX idx_enterprise (enterprise_id),
  INDEX idx_system (is_system)
);
```

#### 2.2 现有表结构扩展

##### 用户表扩展
```sql
ALTER TABLE users ADD COLUMN enterprise_id VARCHAR(24);
ALTER TABLE users ADD COLUMN department_id VARCHAR(24);
ALTER TABLE users ADD COLUMN employee_id VARCHAR(50);
ALTER TABLE users ADD COLUMN hire_date DATE;
ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP;
ALTER TABLE users ADD FOREIGN KEY (enterprise_id) REFERENCES enterprises(id);
ALTER TABLE users ADD FOREIGN KEY (department_id) REFERENCES departments(id);
```

##### 团队表扩展
```sql
ALTER TABLE teams ADD COLUMN enterprise_id VARCHAR(24);
ALTER TABLE teams ADD COLUMN department_id VARCHAR(24);
ALTER TABLE teams ADD COLUMN team_type ENUM('project', 'department', 'cross_functional') DEFAULT 'project';
ALTER TABLE teams ADD FOREIGN KEY (enterprise_id) REFERENCES enterprises(id);
ALTER TABLE teams ADD FOREIGN KEY (department_id) REFERENCES departments(id);
```

### 3. 前端管理界面详细设计

#### 3.1 企业管理面板组件结构
```
projects/admin-dashboard/src/
├── pages/
│   ├── enterprise/
│   │   ├── dashboard.tsx        # 企业仪表板
│   │   ├── settings.tsx         # 企业设置
│   │   ├── users.tsx           # 用户管理
│   │   ├── departments.tsx     # 部门管理
│   │   ├── roles.tsx           # 角色管理
│   │   └── billing.tsx         # 计费管理
│   ├── analytics/
│   │   ├── usage.tsx           # 使用量分析
│   │   ├── performance.tsx     # 性能监控
│   │   └── audit.tsx           # 审计日志
│   └── system/
│       ├── maintenance.tsx     # 系统维护
│       └── monitoring.tsx      # 系统监控
├── components/
│   ├── enterprise/
│   │   ├── EnterpriseSelector.tsx
│   │   ├── UserBatchImport.tsx
│   │   ├── DepartmentTree.tsx
│   │   └── RolePermissionMatrix.tsx
│   ├── analytics/
│   │   ├── UsageChart.tsx
│   │   ├── UserActivityHeatmap.tsx
│   │   └── PerformanceMetrics.tsx
│   └── common/
│       ├── DataTable.tsx
│       ├── FilterPanel.tsx
│       └── ExportButton.tsx
└── hooks/
    ├── useEnterpriseData.ts
    ├── useUserManagement.ts
    └── usePermissionMatrix.ts
```

#### 3.2 关键前端功能实现

##### 企业用户批量导入组件
```typescript
// components/enterprise/UserBatchImport.tsx
interface UserImportData {
  email: string;
  name: string;
  department: string;
  role: string;
  employeeId?: string;
}

const UserBatchImport: React.FC = () => {
  const [importData, setImportData] = useState<UserImportData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileUpload = (file: File) => {
    // CSV/Excel文件解析逻辑
  };

  const validateImportData = (data: UserImportData[]) => {
    // 数据验证逻辑
  };

  const handleBatchImport = async () => {
    // 批量导入API调用
  };

  return (
    // 组件UI实现
  );
};
```

##### 部门树形结构组件
```typescript
// components/enterprise/DepartmentTree.tsx
interface Department {
  id: string;
  name: string;
  parentId?: string;
  children?: Department[];
  memberCount: number;
}

const DepartmentTree: React.FC<{
  departments: Department[];
  onSelect: (dept: Department) => void;
  onEdit: (dept: Department) => void;
  onDelete: (deptId: string) => void;
}> = ({ departments, onSelect, onEdit, onDelete }) => {
  // 树形结构渲染逻辑
};
```

### 4. 权限系统增强

#### 4.1 基于RBAC的权限模型
```typescript
// 权限定义
enum Permission {
  // 基础权限
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',

  // 用户管理权限
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',

  // 团队管理权限
  TEAM_CREATE = 'team:create',
  TEAM_MANAGE = 'team:manage',
  TEAM_DELETE = 'team:delete',

  // 企业管理权限
  ENTERPRISE_SETTINGS = 'enterprise:settings',
  ENTERPRISE_BILLING = 'enterprise:billing',
  ENTERPRISE_AUDIT = 'enterprise:audit',

  // 系统管理权限
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_MONITOR = 'system:monitor'
}

// 角色定义
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem: boolean;
  enterpriseId?: string;
}

// 权限检查服务
class PermissionService {
  async checkPermission(
    userId: string,
    permission: Permission,
    resourceId?: string
  ): Promise<boolean> {
    // 权限检查逻辑
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    // 获取用户权限列表
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    // 分配角色
  }
}
```

#### 4.2 动态权限配置
```typescript
// 权限配置界面
const PermissionMatrix: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const handlePermissionToggle = (roleId: string, permission: Permission) => {
    // 权限开关逻辑
  };

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>角色</Th>
          {permissions.map(perm => (
            <Th key={perm}>{perm}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {roles.map(role => (
          <Tr key={role.id}>
            <Td>{role.name}</Td>
            {permissions.map(perm => (
              <Td key={perm}>
                <Switch
                  isChecked={role.permissions.includes(perm)}
                  onChange={() => handlePermissionToggle(role.id, perm)}
                />
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
```

### 5. 部署与运维方案

#### 5.1 Docker容器化配置

##### 用户管理服务Dockerfile
```dockerfile
# projects/user-management-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

##### Docker Compose配置
```yaml
# docker-compose.user-management.yml
version: '3.8'

services:
  user-management-service:
    build:
      context: ./projects/user-management-service
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${USER_MGMT_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - user-mgmt-db
      - redis
    networks:
      - fastgpt-network

  user-mgmt-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=user_management
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - user_mgmt_data:/var/lib/postgresql/data
    networks:
      - fastgpt-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - fastgpt-network

  admin-dashboard:
    build:
      context: ./projects/admin-dashboard
      dockerfile: Dockerfile
    ports:
      - "3002:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://user-management-service:3001
    depends_on:
      - user-management-service
    networks:
      - fastgpt-network

volumes:
  user_mgmt_data:
  redis_data:

networks:
  fastgpt-network:
    external: true
```

#### 5.2 Kubernetes部署配置

##### 用户管理服务部署配置
```yaml
# k8s/user-management-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-management-service
  namespace: fastgpt
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-management-service
  template:
    metadata:
      labels:
        app: user-management-service
    spec:
      containers:
      - name: user-management-service
        image: fastgpt/user-management-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: user-mgmt-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: user-mgmt-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: user-management-service
  namespace: fastgpt
spec:
  selector:
    app: user-management-service
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: user-management-ingress
  namespace: fastgpt
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: user-mgmt.fastgpt.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: user-management-service
            port:
              number: 3001
```

#### 5.3 CI/CD流水线配置

##### GitHub Actions工作流
```yaml
# .github/workflows/user-management-deploy.yml
name: Deploy User Management Service

on:
  push:
    branches: [main]
    paths: ['projects/user-management-service/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: projects/user-management-service/package-lock.json

    - name: Install dependencies
      run: |
        cd projects/user-management-service
        npm ci

    - name: Run tests
      run: |
        cd projects/user-management-service
        npm run test:coverage

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Build Docker image
      run: |
        docker build -t fastgpt/user-management-service:${{ github.sha }} \
          -f projects/user-management-service/Dockerfile .

    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push fastgpt/user-management-service:${{ github.sha }}
        docker tag fastgpt/user-management-service:${{ github.sha }} fastgpt/user-management-service:latest
        docker push fastgpt/user-management-service:latest

    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/user-management-service \
          user-management-service=fastgpt/user-management-service:${{ github.sha }} \
          -n fastgpt
```

### 6. 监控与告警系统

#### 6.1 应用监控配置

##### Prometheus监控配置
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'user-management-service'
    static_configs:
      - targets: ['user-management-service:3001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'admin-dashboard'
    static_configs:
      - targets: ['admin-dashboard:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

##### 告警规则配置
```yaml
# monitoring/alert_rules.yml
groups:
- name: user-management-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }} seconds"

  - alert: DatabaseConnectionFailure
    expr: up{job="user-mgmt-db"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failure"
      description: "User management database is down"
```

#### 6.2 日志聚合配置

##### ELK Stack配置
```yaml
# logging/elasticsearch.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

##### Logstash配置
```ruby
# logging/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "user-management" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }

    date {
      match => [ "timestamp", "ISO8601" ]
    }

    if [level] == "ERROR" {
      mutate {
        add_tag => [ "error" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "fastgpt-user-management-%{+YYYY.MM.dd}"
  }
}
```

### 7. 安全加固方案

#### 7.1 API安全配置

##### API网关安全中间件
```typescript
// middleware/security.middleware.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  // 安全头设置
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),

  // CORS配置
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),

  // 速率限制
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  }),
];

// JWT验证中间件
export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### 7.2 数据加密配置

##### 敏感数据加密服务
```typescript
// services/encryption.service.ts
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;

  private getKey(): Buffer {
    return crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', this.keyLength);
  }

  encrypt(text: string): string {
    const key = this.getKey();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const key = this.getKey();
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

## 开发状态和后续指南

### 已完成工作（2.1 独立用户管理服务基础架构）

#### 项目结构
```
projects/user-management-service/
├── src/
│   ├── config/           # 配置文件
│   │   ├── index.ts      # 主配置
│   │   └── database.ts   # 数据库连接管理
│   ├── controllers/      # 控制器层
│   │   ├── base.controller.ts
│   │   ├── health.controller.ts
│   │   └── enterprise.controller.ts
│   ├── middleware/       # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── permission.middleware.ts
│   │   └── audit.middleware.ts
│   ├── models/          # 数据模型
│   │   ├── enterprise.model.ts
│   │   ├── department.model.ts
│   │   ├── role.model.ts
│   │   └── audit.model.ts
│   ├── routes/          # 路由配置
│   │   ├── index.ts
│   │   ├── health.routes.ts
│   │   └── enterprise.routes.ts
│   ├── services/        # 业务逻辑层
│   │   ├── base.service.ts
│   │   └── enterprise.service.ts
│   ├── types/           # 类型定义
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   └── index.ts
│   └── index.ts         # 入口文件
├── migrations/          # 数据库迁移
│   ├── 001_create_enterprises_table.sql
│   ├── 002_create_departments_table.sql
│   ├── 003_create_roles_table.sql
│   ├── 004_create_audit_logs_table.sql
│   ├── 005_extend_users_table.sql
│   ├── 006_extend_teams_table.sql
│   └── migrate.js       # 迁移管理工具
├── tests/               # 测试文件
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

#### 核心功能
1. **数据库支持**: PostgreSQL主库 + MongoDB兼容 + Redis缓存
2. **认证授权**: JWT认证 + RBAC权限模型
3. **审计日志**: 完整的操作审计和异常检测
4. **健康监控**: 健康检查、就绪检查、指标监控
5. **企业管理**: 企业CRUD、域名管理、统计信息

## 📚 API接口详细说明

### 🔍 系统监控端点

#### 健康检查
```http
GET /health
```
**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-14T19:21:58.270Z",
  "uptime": 32.773741584,
  "environment": "development",
  "version": "1.0.0"
}
```

#### 就绪检查
```http
GET /ready
```
**响应示例**:
```json
{
  "status": "ready",
  "timestamp": "2025-07-14T19:21:58.270Z",
  "services": {
    "postgresql": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

#### 系统信息
```http
GET /api/v1
```
**响应示例**:
```json
{
  "service": "FastGPT User Management Service",
  "version": "1.0.0",
  "timestamp": "2025-07-14T19:22:13.986Z",
  "endpoints": {
    "health": "/health",
    "ready": "/ready",
    "metrics": "/metrics",
    "enterprises": "/enterprises",
    "users": "/users",
    "departments": "/departments",
    "roles": "/roles",
    "audit": "/audit"
  },
  "documentation": "/docs"
}
```

### 🏢 企业管理API

#### 创建企业
```http
POST /api/v1/enterprises
Content-Type: application/json

{
  "name": "示例企业",
  "domain": "example.com",
  "adminEmail": "admin@example.com",
  "adminName": "管理员",
  "logoUrl": "https://example.com/logo.png",
  "settings": {
    "allowSelfRegistration": true,
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSymbols": false
    }
  }
}
```

#### 获取企业列表
```http
GET /api/v1/enterprises?page=1&limit=20&status=active&search=关键词
```
**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `status`: 状态筛选 (`active`, `inactive`, `suspended`)
- `search`: 搜索关键词
- `sortBy`: 排序字段 (默认: `createdAt`)
- `sortOrder`: 排序方向 (`asc`, `desc`)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "ent_123456",
        "name": "示例企业",
        "domain": "example.com",
        "status": "active",
        "createdAt": "2025-07-14T10:00:00.000Z",
        "updatedAt": "2025-07-14T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### 获取企业详情
```http
GET /api/v1/enterprises/:id
```

#### 更新企业
```http
PUT /api/v1/enterprises/:id
Content-Type: application/json

{
  "name": "更新后的企业名称",
  "settings": {
    "allowSelfRegistration": false
  }
}
```

#### 删除企业
```http
DELETE /api/v1/enterprises/:id
```

#### 检查域名可用性
```http
GET /api/v1/enterprises/domain/:domain/check
```

### 📊 统一响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {}, // 响应数据
  "message": "操作成功" // 可选消息
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE", // 错误代码
  "details": {} // 详细错误信息（可选）
}
```

#### 分页响应
```json
{
  "success": true,
  "data": {
    "data": [], // 数据数组
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 🔐 认证和权限

#### JWT Token格式
```http
Authorization: Bearer <jwt_token>
```

#### 权限检查
所有API端点都会进行相应的权限检查：
- 企业管理：需要企业管理员权限
- 用户管理：需要用户管理权限
- 系统监控：需要系统管理员权限

### 📝 审计日志

所有重要操作都会自动记录审计日志，包括：
- 操作用户
- 操作时间
- 操作类型
- 资源信息
- 操作结果
- IP地址和用户代理

### ⚠️ 错误代码

常见错误代码：
- `VALIDATION_ERROR`: 数据验证失败
- `UNAUTHORIZED`: 未授权访问
- `FORBIDDEN`: 权限不足
- `NOT_FOUND`: 资源不存在
- `CONFLICT`: 资源冲突
- `RATE_LIMIT_EXCEEDED`: 请求频率超限
- `DATABASE_ERROR`: 数据库错误
- `INTERNAL_ERROR`: 内部服务器错误

## 🚀 快速启动指南

### 环境要求
- Node.js 18+
- PostgreSQL 13+
- MongoDB 5.0+
- Redis 6.0+

### 1. 项目安装
```bash
cd projects/user-management-service
pnpm install  # 或 npm install
```

### 2. 环境配置
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：
```env
# PostgreSQL配置
DATABASE_URL=postgresql://fastgpt:fastgpt@localhost:5432/fastgpt
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fastgpt
DB_USER=fastgpt
DB_PASSWORD=fastgpt

# MongoDB配置
MONGODB_URI=mongodb://fastgpt:fastgpt123@127.0.0.1:27017/fastgpt?authSource=admin&replicaSet=rs0&directConnection=true

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production-must-be-32-chars-long
```

### 3. 数据库初始化
```bash
# 如果有迁移脚本
pnpm run migrate
```

### 4. 启动开发服务器
```bash
pnpm dev
```

服务启动后访问：
- 健康检查: http://localhost:3001/health
- API根端点: http://localhost:3001/api/v1
- 服务信息: http://localhost:3001/api/v1

### 5. 验证服务状态
```bash
# 检查健康状态
curl http://localhost:3001/health

# 检查就绪状态
curl http://localhost:3001/ready

# 获取API信息
curl http://localhost:3001/api/v1
```

### 6. 运行测试
```bash
# 类型检查
pnpm run type-check

# 运行测试（如果有）
pnpm test

# 代码格式检查
pnpm run lint
```

### 7. 生产环境部署
```bash
# 构建项目
pnpm run build

# 启动生产服务器
pnpm start
```

### 后续开发优先级

#### 立即需要完成的任务（2.2-2.4）
1. **用户认证服务完整实现**
   - 登录/注册接口
   - 密码重置流程
   - MFA支持
   - 会话管理

2. **部门管理服务**
   - 部门CRUD接口
   - 部门层级管理
   - 部门成员管理

3. **角色权限系统**
   - 角色CRUD接口
   - 权限规则引擎
   - 权限检查优化

4. **用户管理扩展**
   - 用户CRUD接口
   - 用户导入/导出
   - 用户状态管理

#### 中期任务（第3-4周）
1. **团队管理增强**
2. **审计日志完善**
3. **通知系统**
4. **API文档生成**
5. **性能优化**

#### 技术债务和改进
1. 实现数据模型中的TODO项
2. 完善错误处理和日志记录
3. 添加更多测试用例
4. 优化数据库查询性能
5. 实现缓存策略

### 开发注意事项
1. 所有新功能都需要添加相应的测试用例
2. 遵循现有的代码规范和架构模式
3. 重要操作必须记录审计日志
4. API接口需要适当的权限检查
5. 数据库操作使用事务确保一致性

## 📈 项目当前状态总结

### ✅ 已完成 (2025-07-14)
**2.1 独立用户管理服务** - 完全可用状态
- ✅ 完整的TypeScript项目架构
- ✅ 多数据库连接管理 (PostgreSQL + MongoDB + Redis)
- ✅ 完整的中间件系统 (认证、权限、审计、安全)
- ✅ 企业管理完整API
- ✅ 健康检查和监控系统
- ✅ 统一的错误处理和响应格式
- ✅ 完整的类型定义和验证
- ✅ 服务成功启动并运行

**技术栈验证**:
- ✅ Express.js + TypeScript
- ✅ PostgreSQL 数据持久化
- ✅ MongoDB 兼容性支持
- ✅ Redis 缓存和会话
- ✅ JWT 认证机制
- ✅ 审计日志系统

### 🔄 进行中
**当前可以开始的工作**:
1. 前端集成测试
2. API功能测试
3. 企业管理功能验证

### 📋 下一阶段优先级 (2.2-2.4)
1. **用户认证服务** - 登录/注册/密码重置
2. **部门管理服务** - 部门CRUD和层级管理
3. **角色权限系统** - RBAC完整实现
4. **用户管理扩展** - 用户CRUD和状态管理

### 🎯 里程碑达成
- [x] **里程碑1**: 基础架构搭建 ✅
- [x] **里程碑2**: 数据库设计和连接 ✅
- [x] **里程碑3**: 核心服务框架 ✅
- [x] **里程碑4**: API接口实现 ✅
- [x] **里程碑5**: 服务部署就绪 ✅
- [ ] **里程碑6**: 用户认证完成 (下一个目标)

**项目健康度**: 🟢 优秀 - 所有核心功能正常，可进入下一开发阶段

## 参考资料

- [FastGPT官方文档](https://doc.fastgpt.io)
- [FastGPT开发指南](https://doc.fastgpt.io/docs/development/intro)
- [MongoDB最佳实践](https://docs.mongodb.com/manual/administration/production-notes/)
- [NextJS官方文档](https://nextjs.org/docs)
- [RBAC权限模型设计](https://en.wikipedia.org/wiki/Role-based_access_control)
- [企业级应用架构模式](https://martinfowler.com/eaaCatalog/)
- [Kubernetes部署最佳实践](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker安全指南](https://docs.docker.com/engine/security/)
- [API安全最佳实践](https://owasp.org/www-project-api-security/)
