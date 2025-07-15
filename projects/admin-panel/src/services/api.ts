import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { message } from 'antd'
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Team,
  CreateUserRequest,
  UpdateUserRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  UserQueryParams,
  TeamQueryParams,
  SystemStats,
  LoginRequest,
  LoginResponse,
} from '../types'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从Zustand持久化存储中获取token
    try {
      const authStorage = localStorage.getItem('simple-auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        const token = authData.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (error) {
      console.error('获取认证token失败:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 清理认证状态
      localStorage.removeItem('simple-auth-storage')
      window.location.href = '/login'
      message.error('登录已过期，请重新登录')
    } else if (error.response?.status >= 500) {
      message.error('服务器错误，请稍后重试')
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message)
    } else {
      message.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 通用API调用函数
const apiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  params?: any
): Promise<T> => {
  const response = await api.request({
    method,
    url,
    data,
    params,
  })
  return response.data
}

// 认证API
export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    apiCall('POST', '/auth/admin/login', data),
  
  logout: (): Promise<ApiResponse> =>
    apiCall('POST', '/auth/admin/logout'),
  
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    apiCall('GET', '/auth/admin/me'),
}

// 用户管理API
export const userApi = {
  getUsers: (params: UserQueryParams): Promise<ApiResponse<PaginatedResponse<User>>> =>
    apiCall('GET', '/users', undefined, params),
  
  getUser: (id: string): Promise<ApiResponse<User>> =>
    apiCall('GET', `/users/${id}`),
  
  createUser: (data: CreateUserRequest): Promise<ApiResponse<User>> =>
    apiCall('POST', '/users', data),
  
  updateUser: (id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> =>
    apiCall('PUT', `/users/${id}`, data),
  
  deleteUser: (id: string): Promise<ApiResponse> =>
    apiCall('DELETE', `/users/${id}`),
  
  toggleUserStatus: (id: string, status: 'active' | 'inactive' | 'suspended'): Promise<ApiResponse> =>
    apiCall('PUT', `/users/${id}/status`, { status }),
}

// 团队管理API
export const teamApi = {
  getTeams: (params: TeamQueryParams): Promise<ApiResponse<PaginatedResponse<Team>>> =>
    apiCall('GET', '/teams', undefined, params),
  
  getTeam: (id: string): Promise<ApiResponse<Team>> =>
    apiCall('GET', `/teams/${id}`),
  
  createTeam: (data: CreateTeamRequest): Promise<ApiResponse<Team>> =>
    apiCall('POST', '/teams', data),
  
  updateTeam: (id: string, data: UpdateTeamRequest): Promise<ApiResponse<Team>> =>
    apiCall('PUT', `/teams/${id}`, data),
  
  deleteTeam: (id: string): Promise<ApiResponse> =>
    apiCall('DELETE', `/teams/${id}`),
  
  getTeamMembers: (teamId: string): Promise<ApiResponse<any[]>> =>
    apiCall('GET', `/teams/${teamId}/members`),

  addTeamMember: (teamId: string, data: { userId: string; role: string }): Promise<ApiResponse> =>
    apiCall('POST', `/teams/${teamId}/invite`, data),

  updateMemberRole: (teamId: string, memberId: string, data: { role: string }): Promise<ApiResponse> =>
    apiCall('PUT', `/teams/${teamId}/members/${memberId}/role`, data),

  removeTeamMember: (teamId: string, memberId: string): Promise<ApiResponse> =>
    apiCall('DELETE', `/teams/${teamId}/members/${memberId}`),
}

// 统计数据API
export const statsApi = {
  getSystemStats: (): Promise<ApiResponse<SystemStats>> =>
    apiCall('GET', '/stats/system'),
  
  getUserActivityStats: (days: number = 30): Promise<ApiResponse<any[]>> =>
    apiCall('GET', '/stats/user-activity', undefined, { days }),
}

export default api
