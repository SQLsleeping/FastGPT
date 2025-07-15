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
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import dayjs from 'dayjs'
import { teamApi, userApi } from '../services/api'
import type { Team, CreateTeamRequest, UpdateTeamRequest, TeamQueryParams, User } from '../types'

const { Search } = Input
const { Option } = Select
const { Title, Text } = Typography
const { confirm } = Modal

const TeamsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<TeamQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [membersModalVisible, setMembersModalVisible] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const queryClient = useQueryClient()

  // 获取团队列表
  const {
    data: teamsData,
    isLoading,
    error,
  } = useQuery(['teams', searchParams], () => teamApi.getTeams(searchParams), {
    keepPreviousData: true,
  })

  // 获取用户列表（用于创建团队时选择所有者）
  const { data: usersData } = useQuery('allUsers', () => 
    userApi.getUsers({ page: 1, pageSize: 1000 })
  )

  // 获取团队成员
  const { data: teamMembersData, isLoading: membersLoading } = useQuery(
    ['teamMembers', viewingTeam?.id],
    () => viewingTeam ? teamApi.getTeamMembers(viewingTeam.id) : Promise.resolve(null),
    {
      enabled: !!viewingTeam,
    }
  )

  // 创建团队
  const createTeamMutation = useMutation(teamApi.createTeam, {
    onSuccess: () => {
      message.success('团队创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      queryClient.invalidateQueries('teams')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建团队失败')
    },
  })

  // 更新团队
  const updateTeamMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateTeamRequest }) =>
      teamApi.updateTeam(id, data),
    {
      onSuccess: () => {
        message.success('团队更新成功')
        setEditModalVisible(false)
        setEditingTeam(null)
        editForm.resetFields()
        queryClient.invalidateQueries('teams')
      },
      onError: (error: any) => {
        message.error(error.response?.data?.message || '更新团队失败')
      },
    }
  )

  // 删除团队
  const deleteTeamMutation = useMutation(teamApi.deleteTeam, {
    onSuccess: () => {
      message.success('团队删除成功')
      queryClient.invalidateQueries('teams')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除团队失败')
    },
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
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortBy: sorter.field || 'createdAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
    }))
  }

  // 处理创建团队
  const handleCreateTeam = async (values: CreateTeamRequest) => {
    createTeamMutation.mutate(values)
  }

  // 处理编辑团队
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    editForm.setFieldsValue({
      name: team.name,
      description: team.description,
      status: team.status,
      ownerId: team.ownerId,
    })
    setEditModalVisible(true)
  }

  // 处理更新团队
  const handleUpdateTeam = async (values: UpdateTeamRequest) => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data: values })
    }
  }

  // 处理删除团队
  const handleDeleteTeam = (team: Team) => {
    confirm({
      title: '确认删除团队',
      content: `确定要删除团队 "${team.name}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteTeamMutation.mutate(team.id)
      },
    })
  }

  // 查看团队成员
  const handleViewMembers = (team: Team) => {
    setViewingTeam(team)
    setMembersModalVisible(true)
  }

  // 团队操作菜单
  const getTeamActionMenu = (team: Team) => [
    {
      key: 'view',
      label: '查看成员',
      icon: <EyeOutlined />,
      onClick: () => handleViewMembers(team),
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: () => handleEditTeam(team),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteTeam(team),
    },
  ]

  // 表格列配置
  const columns = [
    {
      title: '团队',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Team) => (
        <Space>
          <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div className="font-medium">{name}</div>
            {record.description && (
              <div className="text-gray-500 text-sm">{record.description}</div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: '所有者',
      dataIndex: 'ownerId',
      key: 'ownerId',
      render: (ownerId: string) => {
        const owner = usersData?.data?.items?.find((u: User) => u.id === ownerId)
        return owner ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>{owner.username}</span>
          </Space>
        ) : (
          <Text type="secondary">未知用户</Text>
        )
      },
    },
    {
      title: '成员数量',
      dataIndex: 'memberCount',
      key: 'memberCount',
      render: (count: number) => (
        <Tooltip title="点击查看成员详情">
          <Button type="link" size="small">
            {count} 人
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'success', text: '活跃' },
          inactive: { color: 'default', text: '未激活' },
        }
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
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
      render: (_: any, record: Team) => (
        <Dropdown
          menu={{
            items: getTeamActionMenu(record),
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const teams = teamsData?.data?.items || []
  const total = teamsData?.data?.total || 0
  const users = usersData?.data?.items || []
  const teamMembers = teamMembersData?.data || []

  return (
    <div className="page-container">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <Title level={2} className="mb-4">
          团队管理
        </Title>
        
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <Statistic
                title="总团队数"
                value={total}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃团队"
                value={teams.filter(t => t.status === 'active').length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={teams.filter(t => dayjs(t.createdAt).isAfter(dayjs().startOf('day'))).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均成员数"
                value={teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + t.memberCount, 0) / teams.length) : 0}
                valueStyle={{ color: '#722ed1' }}
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
                placeholder="搜索团队名称或描述"
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
                <Option value="active">活跃</Option>
                <Option value="inactive">未激活</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => queryClient.invalidateQueries('teams')}
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
                新建团队
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 团队表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={teams}
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

      {/* 创建团队模态框 */}
      <Modal
        title="新建团队"
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
          onFinish={handleCreateTeam}
        >
          <Form.Item
            name="name"
            label="团队名称"
            rules={[
              { required: true, message: '请输入团队名称' },
              { min: 2, message: '团队名称至少2个字符' },
            ]}
          >
            <Input placeholder="请输入团队名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="团队描述"
          >
            <Input.TextArea
              placeholder="请输入团队描述（可选）"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="ownerId"
            label="团队所有者"
            rules={[{ required: true, message: '请选择团队所有者' }]}
          >
            <Select
              placeholder="请选择团队所有者"
              showSearch
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user: User) => (
                <Option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

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
                loading={createTeamMutation.isLoading}
              >
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑团队模态框 */}
      <Modal
        title="编辑团队"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingTeam(null)
          editForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateTeam}
        >
          <Form.Item
            name="name"
            label="团队名称"
            rules={[
              { required: true, message: '请输入团队名称' },
              { min: 2, message: '团队名称至少2个字符' },
            ]}
          >
            <Input placeholder="请输入团队名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="团队描述"
          >
            <Input.TextArea
              placeholder="请输入团队描述（可选）"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ownerId"
                label="团队所有者"
                rules={[{ required: true, message: '请选择团队所有者' }]}
              >
                <Select
                  placeholder="请选择团队所有者"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map((user: User) => (
                    <Option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  <Option value="active">活跃</Option>
                  <Option value="inactive">未激活</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false)
                  setEditingTeam(null)
                  editForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateTeamMutation.isLoading}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 团队成员模态框 */}
      <Modal
        title={`团队成员 - ${viewingTeam?.name}`}
        open={membersModalVisible}
        onCancel={() => {
          setMembersModalVisible(false)
          setViewingTeam(null)
        }}
        footer={null}
        width={800}
      >
        <Table
          dataSource={teamMembers}
          rowKey="id"
          loading={membersLoading}
          pagination={false}
          columns={[
            {
              title: '用户',
              dataIndex: 'username',
              key: 'username',
              render: (username: string, record: any) => (
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
                  owner: { color: 'red', text: '所有者' },
                  admin: { color: 'orange', text: '管理员' },
                  member: { color: 'blue', text: '成员' },
                }
                const config = roleMap[role as keyof typeof roleMap] || { color: 'default', text: role }
                return <Tag color={config.color}>{config.text}</Tag>
              },
            },
            {
              title: '加入时间',
              dataIndex: 'joinedAt',
              key: 'joinedAt',
              render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
            },
          ]}
        />
      </Modal>
    </div>
  )
}

export default TeamsPage
