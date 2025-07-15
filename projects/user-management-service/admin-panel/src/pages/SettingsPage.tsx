import React, { useState } from 'react'
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Typography,
  Space,
  Divider,
  Alert,
  message,
  Row,
  Col,
} from 'antd'
import {
  SettingOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  MailOutlined,
  BellOutlined,
  SaveOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [systemForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [emailForm] = Form.useForm()
  const [notificationForm] = Form.useForm()

  // 处理保存设置
  const handleSaveSettings = async (values: any, type: string) => {
    setLoading(true)
    try {
      // 这里应该调用API保存设置
      console.log(`Saving ${type} settings:`, values)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      message.success('设置保存成功')
    } catch (error) {
      message.error('保存设置失败')
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'system',
      label: (
        <span>
          <SettingOutlined />
          系统设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={systemForm}
            layout="vertical"
            onFinish={(values) => handleSaveSettings(values, 'system')}
            initialValues={{
              siteName: 'FastGPT 用户管理系统',
              siteDescription: '企业级用户和团队管理平台',
              defaultLanguage: 'zh-CN',
              timezone: 'Asia/Shanghai',
              maxUsersPerTeam: 50,
              enableRegistration: true,
              requireEmailVerification: true,
              sessionTimeout: 24,
            }}
          >
            <Title level={4}>基本信息</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="siteName"
                  label="站点名称"
                  rules={[{ required: true, message: '请输入站点名称' }]}
                >
                  <Input placeholder="请输入站点名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="defaultLanguage"
                  label="默认语言"
                >
                  <Select>
                    <Option value="zh-CN">简体中文</Option>
                    <Option value="en-US">English</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="siteDescription"
              label="站点描述"
            >
              <TextArea rows={3} placeholder="请输入站点描述" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="timezone"
                  label="时区"
                >
                  <Select>
                    <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                    <Option value="UTC">UTC (UTC+0)</Option>
                    <Option value="America/New_York">America/New_York (UTC-5)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sessionTimeout"
                  label="会话超时时间（小时）"
                >
                  <InputNumber min={1} max={168} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={4}>用户设置</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="maxUsersPerTeam"
                  label="每个团队最大用户数"
                >
                  <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="enableRegistration"
                  label="允许用户注册"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="requireEmailVerification"
              label="要求邮箱验证"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          安全设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={securityForm}
            layout="vertical"
            onFinish={(values) => handleSaveSettings(values, 'security')}
            initialValues={{
              passwordMinLength: 8,
              passwordRequireUppercase: true,
              passwordRequireNumbers: true,
              passwordRequireSymbols: false,
              maxLoginAttempts: 5,
              lockoutDuration: 30,
              enableTwoFactor: false,
              enableIpWhitelist: false,
              sessionSecure: true,
            }}
          >
            <Title level={4}>密码策略</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="passwordMinLength"
                  label="密码最小长度"
                >
                  <InputNumber min={6} max={32} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="maxLoginAttempts"
                  label="最大登录尝试次数"
                >
                  <InputNumber min={3} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="passwordRequireUppercase"
                  label="要求大写字母"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="passwordRequireNumbers"
                  label="要求数字"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="passwordRequireSymbols"
                  label="要求特殊字符"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="lockoutDuration"
              label="账户锁定时长（分钟）"
            >
              <InputNumber min={5} max={1440} style={{ width: 200 }} />
            </Form.Item>

            <Divider />

            <Title level={4}>高级安全</Title>
            <Form.Item
              name="enableTwoFactor"
              label="启用双因素认证"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="enableIpWhitelist"
              label="启用IP白名单"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="sessionSecure"
              label="安全会话（HTTPS）"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Alert
              message="安全提醒"
              description="修改安全设置可能会影响现有用户的登录状态，请谨慎操作。"
              type="warning"
              showIcon
              className="mb-4"
            />

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined />
          邮件设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={emailForm}
            layout="vertical"
            onFinish={(values) => handleSaveSettings(values, 'email')}
            initialValues={{
              smtpHost: 'smtp.gmail.com',
              smtpPort: 587,
              smtpSecure: true,
              smtpUser: '',
              smtpPassword: '',
              fromEmail: 'noreply@fastgpt.com',
              fromName: 'FastGPT 用户管理系统',
              enableEmailNotifications: true,
            }}
          >
            <Title level={4}>SMTP 配置</Title>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="smtpHost"
                  label="SMTP 服务器"
                  rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
                >
                  <Input placeholder="smtp.gmail.com" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="smtpPort"
                  label="端口"
                  rules={[{ required: true, message: '请输入端口号' }]}
                >
                  <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="smtpUser"
                  label="用户名"
                  rules={[{ required: true, message: '请输入SMTP用户名' }]}
                >
                  <Input placeholder="your-email@gmail.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="smtpPassword"
                  label="密码"
                  rules={[{ required: true, message: '请输入SMTP密码' }]}
                >
                  <Input.Password placeholder="请输入SMTP密码" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="smtpSecure"
              label="启用SSL/TLS"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Divider />

            <Title level={4}>发件人信息</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="fromEmail"
                  label="发件人邮箱"
                  rules={[
                    { required: true, message: '请输入发件人邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input placeholder="noreply@fastgpt.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="fromName"
                  label="发件人名称"
                  rules={[{ required: true, message: '请输入发件人名称' }]}
                >
                  <Input placeholder="FastGPT 用户管理系统" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="enableEmailNotifications"
              label="启用邮件通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存设置
              </Button>
              <Button>
                发送测试邮件
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          通知设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={notificationForm}
            layout="vertical"
            onFinish={(values) => handleSaveSettings(values, 'notifications')}
            initialValues={{
              enableUserRegistration: true,
              enableUserLogin: false,
              enableTeamCreation: true,
              enableTeamMemberJoin: true,
              enableSystemErrors: true,
              enableSecurityAlerts: true,
              notificationEmail: 'admin@fastgpt.com',
              enableSlackIntegration: false,
              slackWebhookUrl: '',
            }}
          >
            <Title level={4}>通知类型</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Form.Item
                name="enableUserRegistration"
                label="用户注册通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableUserLogin"
                label="用户登录通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableTeamCreation"
                label="团队创建通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableTeamMemberJoin"
                label="团队成员加入通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableSystemErrors"
                label="系统错误通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableSecurityAlerts"
                label="安全警报通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Space>

            <Divider />

            <Title level={4}>通知接收</Title>
            <Form.Item
              name="notificationEmail"
              label="通知邮箱"
              rules={[
                { required: true, message: '请输入通知邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="admin@fastgpt.com" />
            </Form.Item>

            <Divider />

            <Title level={4}>第三方集成</Title>
            <Form.Item
              name="enableSlackIntegration"
              label="启用 Slack 集成"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="slackWebhookUrl"
              label="Slack Webhook URL"
            >
              <Input placeholder="https://hooks.slack.com/services/..." />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'database',
      label: (
        <span>
          <DatabaseOutlined />
          数据库
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>数据库状态</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="数据库连接正常"
              description="PostgreSQL 数据库运行正常，最后检查时间：2024-01-15 10:30:00"
              type="success"
              showIcon
            />

            <div>
              <Title level={5}>数据库信息</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="数据库类型" value="PostgreSQL" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="数据库版本" value="14.9" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="连接池大小" value="20" />
                  </Card>
                </Col>
              </Row>
            </div>

            <div>
              <Title level={5}>数据库操作</Title>
              <Space>
                <Button type="primary">
                  备份数据库
                </Button>
                <Button>
                  检查连接
                </Button>
                <Button>
                  优化数据库
                </Button>
                <Button danger>
                  清理日志
                </Button>
              </Space>
            </div>

            <Alert
              message="危险操作"
              description="数据库操作可能会影响系统稳定性，请在维护时间窗口内执行。"
              type="warning"
              showIcon
            />
          </Space>
        </Card>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          系统设置
        </Title>
        <Text type="secondary">
          配置系统参数、安全策略和通知设置
        </Text>
      </div>

      <Tabs
        defaultActiveKey="system"
        items={tabItems}
        size="large"
      />
    </div>
  )
}

export default SettingsPage
