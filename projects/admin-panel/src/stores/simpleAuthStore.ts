import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  setLoading: (loading: boolean) => void
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
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          // 调用真实的管理员登录API
          const response = await fetch('/api/v1/auth/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            const { user, token } = data.data

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
              error: data.message || '登录失败',
            })
            return false
          }
        } catch (error: any) {
          console.error('登录错误:', error)
          set({
            isLoading: false,
            error: '网络错误，请稍后重试',
          })
          return false
        }
      },

      // 登出
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'simple-auth-storage',
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
  const token = localStorage.getItem('simple-auth-storage')
  if (token) {
    try {
      const data = JSON.parse(token)
      if (data.state?.token && data.state?.user) {
        useAuthStore.setState({
          user: data.state.user,
          token: data.state.token,
          isAuthenticated: data.state.isAuthenticated,
        })
      }
    } catch (error) {
      console.error('认证初始化失败:', error)
      useAuthStore.getState().logout()
    }
  }
}
