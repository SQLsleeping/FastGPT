// 基础类型定义
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 错误处理类型
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 用户相关类型
export interface User extends BaseEntity {
  username: string;
  email: string;
  password: string;
  status: UserStatus;
  role?: string;
  timezone?: string;
  lastLoginTmbId?: string;
  inviterId?: string;
  promotionRate?: number;
  enterpriseId?: string;
  departmentId?: string;
  employeeId?: string;
  hireDate?: Date;
  lastActivityAt?: Date;
  userConfig?: Record<string, any>;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  passwordChangedAt?: Date;
  passwordHistory?: string[];
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

// 用户创建数据类型
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  status?: UserStatus;
  timezone?: string;
  enterpriseId?: string;
  departmentId?: string;
  employeeId?: string;
  hireDate?: Date;
  userConfig?: Record<string, any>;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}

// 用户更新数据类型
export interface UpdateUserData {
  username?: string;
  email?: string;
  status?: UserStatus;
  timezone?: string;
  enterpriseId?: string;
  departmentId?: string;
  employeeId?: string;
  hireDate?: Date;
  userConfig?: Record<string, any>;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
}

// 用户会话类型
export interface UserSession extends BaseEntity {
  userId: string;
  sessionToken: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

// 密码重置令牌类型
export interface PasswordResetToken extends BaseEntity {
  userId: string;
  resetToken: string;
  expiresAt: Date;
  usedAt?: Date;
}

// 团队相关类型
export {
  Team,
  TeamMember,
  CreateTeamData,
  UpdateTeamData,
  TeamType,
  TeamStatus,
  TeamMemberStatus,
  TeamMemberRole,
} from '../models/team.model';

// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  ip?: string;
  userAgent?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: Partial<User>;
  token?: string;
  refreshToken?: string;
  expiresIn?: string;
  userId?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
  name?: string;
  avatar?: string;
  timezone?: string;
  enterpriseId?: string;
  departmentId?: string;
}

export interface ResetPasswordRequest {
  email?: string;
  token?: string;
  newPassword?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  enterpriseId?: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

// 企业相关类型
export interface Enterprise extends BaseEntity {
  name: string;
  displayName?: string;
  domain?: string;
  logoUrl?: string;
  settings: EnterpriseSettings;
  subscriptionInfo: SubscriptionInfo;
  status: EnterpriseStatus;
  contactEmail: string;
  contactPhone: string;
  adminEmail: string;
  verificationToken?: string;
  verifiedAt?: Date;
}

export enum EnterpriseStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export interface EnterpriseSettings {
  allowSelfRegistration: boolean;
  passwordPolicy: PasswordPolicy;
  ssoConfig?: SSOConfig;
  branding?: BrandingConfig;
  features?: FeatureFlags;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge?: number;
  preventReuse?: number;
}

export interface SSOConfig {
  enabled: boolean;
  provider: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
  expiresAt?: Date;
  maxUsers: number;
  maxStorage: number;
}

// 企业注册相关类型
export interface EnterpriseRegistrationRequest {
  name: string;
  displayName?: string;
  contactEmail: string;
  contactPhone: string;
  adminEmail: string;
  adminPassword: string;
  industry?: string;
  companySize?: string;
  country?: string;
  timezone?: string;
  settings?: Partial<EnterpriseSettings>;
}

export interface EnterpriseVerificationRequest {
  token: string;
}

export interface DomainBindingRequest {
  domain: string;
  verificationMethod: 'dns' | 'file';
}

export interface DomainVerificationRequest {
  domainId: string;
  verificationCode?: string;
}

export interface UserImportRequest {
  users: UserImportData[];
  sendWelcomeEmail: boolean;
  generatePasswords: boolean;
}

export interface UserImportData {
  email: string;
  name: string;
  department?: string;
  role?: string;
  employeeId?: string;
  password?: string;
}

export interface EnterpriseStats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  totalTeams: number;
  storageUsed: number;
  apiCallsThisMonth: number;
  lastActivityAt: Date;
}

export interface EnterpriseReport {
  period: string;
  userActivity: UserActivityReport[];
  departmentStats: DepartmentStats[];
  systemUsage: SystemUsageReport;
  securityEvents: SecurityEvent[];
}

export interface UserActivityReport {
  userId: string;
  username: string;
  loginCount: number;
  lastLoginAt: Date;
  actionsPerformed: number;
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  userCount: number;
  activeUserCount: number;
  avgActivityScore: number;
}

export interface SystemUsageReport {
  totalApiCalls: number;
  storageUsed: number;
  bandwidthUsed: number;
  errorRate: number;
}

export interface SecurityEvent {
  type: string;
  timestamp: Date;
  userId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 权限相关类型
export enum ResourceType {
  USER = 'user',
  TEAM = 'team',
  PROJECT = 'project',
  DATASET = 'dataset',
  WORKFLOW = 'workflow',
  API = 'api',
  ENTERPRISE = 'enterprise',
  DEPARTMENT = 'department',
  ROLE = 'role',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  SHARE = 'share',
  MANAGE = 'manage',
}

export interface PermissionRule {
  id: string;
  resourceType: ResourceType;
  resourceId?: string;
  action: PermissionAction;
  effect: 'allow' | 'deny';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

// 审计日志相关类型
export interface AuditLogDetails {
  method: string;
  endpoint: string;
  userAgent: string;
  ipAddress: string;
  changes?: DataChange[];
  metadata?: Record<string, any>;
}

export interface DataChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'create' | 'update' | 'delete';
}

// Express Request 扩展
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
