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

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role?: 'user' | 'admin'
  status?: 'active' | 'inactive'
  profile?: Partial<UserProfile>
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  status?: 'active' | 'inactive' | 'suspended'
  role?: 'user' | 'admin' | 'super_admin'
  profile?: Partial<UserProfile>
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
  settings?: TeamSettings
}

export interface TeamSettings {
  maxMembers?: number
  allowInvites?: boolean
  requireApproval?: boolean
  defaultRole?: 'member' | 'admin'
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'suspended'
  joinedAt: string
  user: User
}

export interface CreateTeamRequest {
  name: string
  description?: string
  ownerId: string
  settings?: TeamSettings
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive'
  settings?: TeamSettings
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
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
export interface UserQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  role?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface TeamQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  ownerId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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

export interface UserActivityStats {
  date: string
  logins: number
  registrations: number
  activeUsers: number
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

// 表格列配置类型
export interface TableColumn {
  key: string
  title: string
  dataIndex?: string
  width?: number
  fixed?: 'left' | 'right'
  sorter?: boolean
  filterable?: boolean
  render?: (value: any, record: any) => React.ReactNode
}

// 表单配置类型
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'switch' | 'date'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: any }[]
  rules?: any[]
}

// 菜单项类型
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  permission?: string
}
