// 用户相关类型
export interface User {
  id: string
  username: string
  email: string
  status: 'active' | 'inactive' | 'suspended'
  role: 'user' | 'admin' | 'super_admin'
  timezone: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  profile?: UserProfile
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
  company?: string
  department?: string
  position?: string
}

// 团队相关类型
export interface Team {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  ownerId: string
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'suspended'
  joinedAt: string
  username: string
  email: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 查询参数类型
export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserQueryParams extends QueryParams {
  role?: string
}

export interface TeamQueryParams extends QueryParams {
  ownerId?: string
}

// 统计数据类型
export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalTeams: number
  activeTeams: number
  newUsersToday: number
  newTeamsToday: number
  userGrowthRate: number
  teamGrowthRate: number
}

// 管理员认证类型
export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'super_admin'
  permissions: string[]
  lastLoginAt?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: AdminUser
  token: string
  expiresAt: string
}

// 表单类型
export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role?: 'user' | 'admin'
  status?: 'active' | 'inactive'
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  status?: 'active' | 'inactive' | 'suspended'
  role?: 'user' | 'admin' | 'super_admin'
}

export interface CreateTeamRequest {
  name: string
  description?: string
  ownerId: string
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive'
}
