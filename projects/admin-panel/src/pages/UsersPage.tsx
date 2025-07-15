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
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Dropdown,
  Modal,
  message,
} from 'antd'
import {
  PlusOutlined,
  UserOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { userApi } from '../services/api'
import UserModal from '../components/UserModal'
import type { User, UserQueryParams } from '../types'

const { Search } = Input
const { Option } = Select
const { Title } = Typography

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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const queryClient = useQueryClient()

  // 删除用户
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      message.success('用户删除成功')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除用户失败')
    },
  })

  // 获取用户列表
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users', searchParams],
    queryFn: () => userApi.getUsers(searchParams),
  })

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }))
  }

  // 处理筛选
  const handleFilter = (key: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  // 处理分页
  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
    }))
  }

  // 处理函数
  const handleCreateUser = () => {
    setModalMode('create')
    setSelectedUser(null)
    setModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setModalMode('edit')
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteMutation.mutate(user.id)
      },
    })
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedUser(null)
  }

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
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: User) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => handleEditUser(record),
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDeleteUser(record),
              },
            ],
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

  // 模拟数据（当API不可用时）
  const mockUsers = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@fastgpt.com',
      role: 'super_admin',
      status: 'active',
      lastLoginAt: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      username: 'user1',
      email: 'user1@example.com',
      role: 'user',
      status: 'active',
      lastLoginAt: '2024-01-14T15:20:00Z',
      createdAt: '2024-01-10T08:00:00Z',
    },
  ]

  const displayUsers = error ? mockUsers : users
  const displayTotal = error ? mockUsers.length : total

  return (
    <div className="page-container">
      {/* 错误提示 */}
      {error && (
        <Alert
          message="数据加载失败"
          description="无法获取用户数据，显示模拟数据。请检查用户管理服务是否正常运行。"
          type="warning"
          showIcon
          className="mb-6"
        />
      )}

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
                value={displayTotal}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={displayUsers.filter(u => u.status === 'active').length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={displayUsers.filter(u => dayjs(u.createdAt).isAfter(dayjs().startOf('day'))).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="管理员"
                value={displayUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
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
                onClick={() => refetch()}
                loading={isLoading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateUser}
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
          dataSource={displayUsers}
          rowKey="id"
          loading={isLoading}
          scroll={{
            x: 'max-content', // 水平滚动，根据内容自动调整
            y: 'calc(100vh - 400px)' // 垂直滚动，动态计算高度
          }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: displayTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 用户编辑/新建模态框 */}
      <UserModal
        open={modalOpen}
        onCancel={handleModalClose}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  )
}

export default UsersPage
