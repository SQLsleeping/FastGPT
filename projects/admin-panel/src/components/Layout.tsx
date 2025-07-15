import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Layout as AntLayout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Space,
  Typography,
  theme,
} from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'

const { Header, Sider, Content } = AntLayout
const { Text } = Typography

// 菜单配置
const menuItems = [
  {
    key: '/dashboard',
    label: '仪表板',
    icon: <DashboardOutlined />,
  },
  {
    key: '/users',
    label: '用户管理',
    icon: <UserOutlined />,
  },
  {
    key: '/teams',
    label: '团队管理',
    icon: <TeamOutlined />,
  },
]

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { token } = theme.useToken()

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
        width={240}
      >
        {/* Logo区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 24px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <UserOutlined className="text-white text-lg" />
              </div>
              <Text strong className="text-lg">
                管理面板
              </Text>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <UserOutlined className="text-white text-lg" />
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
          }}
        />
      </Sider>

      {/* 主内容区域 */}
      <AntLayout>
        {/* 顶部导航栏 */}
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* 左侧：折叠按钮 */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          {/* 右侧：用户信息 */}
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
            arrow
          >
            <Space className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: token.colorPrimary }}
              />
              <div className="flex flex-col items-start">
                <Text strong style={{ fontSize: '14px' }}>
                  {user?.username || '管理员'}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {user?.role === 'super_admin' ? '超级管理员' : '管理员'}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            background: token.colorBgLayout,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
