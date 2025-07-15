import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Avatar,
  Dropdown,
  Modal,
  Form,
  message,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import dayjs from 'dayjs'
import { userApi } from '../services/api'
import type { User, CreateUserRequest, UpdateUserRequest, UserQueryParams } from '../types'

const { Search } = Input
const { Option } = Select
const { Title, Text } = Typography
const { confirm } = Modal

const UsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<UserQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    role: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const queryClient = useQueryClient()

  // 获取用户列表
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery(['users', searchParams], () => userApi.getUsers(searchParams), {
    keepPreviousData: true,
  })

  // 创建用户
  const createUserMutation = useMutation(userApi.createUser, {
    onSuccess: () => {
      message.success('用户创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      queryClient.invalidateQueries('users')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建用户失败')
    },
  })

  // 更新用户
  const updateUserMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userApi.updateUser(id, data),
    {
      onSuccess: () => {
        message.success('用户更新成功')
        setEditModalVisible(false)
        setEditingUser(null)
        editForm.resetFields()
        queryClient.invalidateQueries('users')
      },
      onError: (error: any) => {
        message.error(error.response?.data?.message || '更新用户失败')
      },
    }
  )

  // 删除用户
  const deleteUserMutation = useMutation(userApi.deleteUser, {
    onSuccess: () => {
      message.success('用户删除成功')
      queryClient.invalidateQueries('users')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除用户失败')
    },
  })

  // 切换用户状态
  const toggleStatusMutation = useMutation(
    ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) =>
      userApi.toggleUserStatus(id, status),
    {
      onSuccess: () => {
        message.success('用户状态更新成功')
        queryClient.invalidateQueries('users')
      },
      onError: (error: any) => {
        message.error(error.response?.data?.message || '状态更新失败')
      },
    }
  )

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }))
  }

  // 处理筛选
  const handleFilter = (key: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  // 处理分页
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortBy: sorter.field || 'createdAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
    }))
  }

  // 处理创建用户
  const handleCreateUser = async (values: CreateUserRequest) => {
    createUserMutation.mutate(values)
  }

  // 处理编辑用户
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      status: user.status,
      role: user.role,
    })
    setEditModalVisible(true)
  }

  // 处理更新用户
  const handleUpdateUser = async (values: UpdateUserRequest) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: values })
    }
  }

  // 处理删除用户
  const handleDeleteUser = (user: User) => {
    confirm({
      title: '确认删除用户',
      content: `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteUserMutation.mutate(user.id)
      },
    })
  }

  // 处理状态切换
  const handleToggleStatus = (user: User, status: 'active' | 'inactive' | 'suspended') => {
    toggleStatusMutation.mutate({ id: user.id, status })
  }

  // 用户操作菜单
  const getUserActionMenu = (user: User) => [
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: () => handleEditUser(user),
    },
    {
      key: 'toggle-status',
      label: user.status === 'active' ? '停用' : '启用',
      icon: <LockOutlined />,
      onClick: () =>
        handleToggleStatus(
          user,
          user.status === 'active' ? 'inactive' : 'active'
        ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteUser(user),
    },
  ]

  // 表格列配置
  const columns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{username}</div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap = {
          user: { color: 'blue', text: '普通用户' },
          admin: { color: 'orange', text: '管理员' },
          super_admin: { color: 'red', text: '超级管理员' },
        }
        const config = roleMap[role as keyof typeof roleMap] || { color: 'default', text: role }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'success', text: '正常' },
          inactive: { color: 'default', text: '未激活' },
          suspended: { color: 'error', text: '已停用' },
        }
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '从未登录',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: User) => (
        <Dropdown
          menu={{
            items: getUserActionMenu(record),
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const users = usersData?.data?.items || []
  const total = usersData?.data?.total || 0

  return (
    <div className="page-container">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <Title level={2} className="mb-4">
          用户管理
        </Title>
        
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={users.filter(u => u.status === 'active').length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={users.filter(u => dayjs(u.createdAt).isAfter(dayjs().startOf('day'))).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="管理员"
                value={users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 操作栏 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Search
                placeholder="搜索用户名或邮箱"
                allowClear
                style={{ width: 300 }}
                onSearch={handleSearch}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('status', value || '')}
              >
                <Option value="active">正常</Option>
                <Option value="inactive">未激活</Option>
                <Option value="suspended">已停用</Option>
              </Select>
              <Select
                placeholder="角色筛选"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('role', value || '')}
              >
                <Option value="user">普通用户</Option>
                <Option value="admin">管理员</Option>
                <Option value="super_admin">超级管理员</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => queryClient.invalidateQueries('users')}
              >
                刷新
              </Button>
              <Button icon={<ExportOutlined />}>
                导出
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                新建用户
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 创建用户模态框 */}
      <Modal
        title="新建用户"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          createForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                initialValue="user"
              >
                <Select>
                  <Option value="user">普通用户</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                initialValue="active"
              >
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="inactive">未激活</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button
                onClick={() => {
                  setCreateModalVisible(false)
                  createForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createUserMutation.isLoading}
              >
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingUser(null)
          editForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
              >
                <Select>
                  <Option value="user">普通用户</Option>
                  <Option value="admin">管理员</Option>
                  <Option value="super_admin">超级管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="inactive">未激活</Option>
                  <Option value="suspended">已停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false)
                  setEditingUser(null)
                  editForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateUserMutation.isLoading}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UsersPage
