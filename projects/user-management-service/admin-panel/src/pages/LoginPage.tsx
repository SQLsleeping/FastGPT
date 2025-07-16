import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  Divider,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import type { LoginRequest } from '../types'

const { Title, Text } = Typography

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, error, clearError } = useAuthStore()

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true)
    clearError()

    try {
      const success = await login(values)
      if (success) {
        navigate('/dashboard')
      }
    } catch (error) {
      // 错误已在store中处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
            <UserOutlined className="text-white text-2xl" />
          </div>
          <Title level={2} className="mb-2">
            FastGPT 管理员面板
          </Title>
          <Text type="secondary" className="text-base">
            用户管理系统管理员登录
          </Text>
        </div>

        {/* 登录表单 */}
        <Card
          className="shadow-lg border-0"
          style={{
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            {/* 错误提示 */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={clearError}
                className="mb-6"
              />
            )}

            {/* 用户名输入 */}
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入管理员用户名"
                autoComplete="username"
              />
            </Form.Item>

            {/* 密码输入 */}
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入管理员密码"
                autoComplete="current-password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            {/* 登录按钮 */}
            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-12 text-base font-medium"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>

            <Divider className="my-6">
              <Text type="secondary" className="text-sm">
                管理员登录
              </Text>
            </Divider>

            {/* 帮助信息 */}
            <div className="text-center">
              <Space direction="vertical" size="small">
                <Text type="secondary" className="text-sm">
                  默认管理员账号：admin
                </Text>
                <Text type="secondary" className="text-sm">
                  默认密码：admin123
                </Text>
                <Text type="secondary" className="text-xs">
                  首次登录后请及时修改密码
                </Text>
              </Space>
            </div>
          </Form>
        </Card>

        {/* 版权信息 */}
        <div className="text-center mt-8">
          <Text type="secondary" className="text-sm">
            © 2024 FastGPT 用户管理系统. All rights reserved.
          </Text>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
