import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser, LoginRequest } from '../types'
import { authApi } from '../services/api'

interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<boolean>
  logout: () => void
  getCurrentUser: () => Promise<void>
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.login(credentials)
          
          if (response.success && response.data) {
            const { user, token } = response.data
            
            // 保存到localStorage
            localStorage.setItem('admin_token', token)
            localStorage.setItem('admin_user', JSON.stringify(user))
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            
            return true
          } else {
            set({
              isLoading: false,
              error: response.error || '登录失败',
            })
            return false
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || '登录失败，请检查网络连接',
          })
          return false
        }
      },

      // 登出
      logout: () => {
        // 调用登出API（可选）
        authApi.logout().catch(() => {
          // 忽略登出API错误
        })
        
        // 清除本地存储
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      // 获取当前用户信息
      getCurrentUser: async () => {
        const token = localStorage.getItem('admin_token')
        if (!token) {
          return
        }

        set({ isLoading: true })
        
        try {
          const response = await authApi.getCurrentUser()
          
          if (response.success && response.data) {
            set({
              user: response.data as AdminUser,
              token,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            // Token无效，清除认证状态
            get().logout()
          }
        } catch (error) {
          // Token无效或网络错误，清除认证状态
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// 初始化认证状态
export const initializeAuth = () => {
  const token = localStorage.getItem('admin_token')
  const userStr = localStorage.getItem('admin_user')
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr)
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
      })
      
      // 验证token是否仍然有效
      useAuthStore.getState().getCurrentUser()
    } catch (error) {
      // 解析失败，清除无效数据
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }
}
