import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

// 导入原始组件，但添加错误边界
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import TeamsPage from './pages/TeamsPage'
import Layout from './components/Layout'

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('管理员面板错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h1>出现错误</h1>
          <p>管理员面板遇到了一个错误。</p>
          <p>错误信息: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            重新加载页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 导入简化的认证store
import { useAuthStore, initializeAuth } from './stores/simpleAuthStore'

// 简单的登录页面
const SimpleLoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuthStore()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')

  const handleLogin = async () => {
    await login(username, password)
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1>FastGPT 管理员面板</h1>
        <h3>请登录</h3>

        {error && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'red', padding: '10px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
              {error}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>用户名:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>密码:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '登录中...' : '登录'}
        </button>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>测试账号: admin / admin123</p>
        </div>
      </div>
    </div>
  )
}



// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()

  React.useEffect(() => {
    initializeAuth()
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<SimpleLoginPage />} />

        {/* 受保护的路由 */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/teams" element={<TeamsPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
