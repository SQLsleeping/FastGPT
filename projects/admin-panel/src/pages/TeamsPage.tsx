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
  TeamOutlined,
  UserOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { teamApi } from '../services/api'
import TeamModal from '../components/TeamModal'
import type { Team, TeamQueryParams } from '../types'

const { Search } = Input
const { Option } = Select
const { Title } = Typography

const TeamsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<TeamQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const queryClient = useQueryClient()

  // 删除团队
  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.deleteTeam(id),
    onSuccess: () => {
      message.success('团队删除成功')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除团队失败')
    },
  })

  // 获取团队列表
  const {
    data: teamsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teams', searchParams],
    queryFn: () => teamApi.getTeams(searchParams),
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
  const handleCreateTeam = () => {
    setModalMode('create')
    setSelectedTeam(null)
    setModalOpen(true)
  }

  const handleEditTeam = (team: Team) => {
    setModalMode('edit')
    setSelectedTeam(team)
    setModalOpen(true)
  }

  const handleDeleteTeam = (team: Team) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除团队 "${team.name}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteMutation.mutate(team.id)
      },
    })
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedTeam(null)
  }

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
      render: (ownerId: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>用户 {ownerId}</span>
        </Space>
      ),
    },
    {
      title: '成员数量',
      dataIndex: 'memberCount',
      key: 'memberCount',
      render: (count: number) => (
        <span>{count} 人</span>
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
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: Team) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => handleEditTeam(record),
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDeleteTeam(record),
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

  const teams = teamsData?.data?.items || []
  const total = teamsData?.data?.total || 0

  // 模拟数据（当API不可用时）
  const mockTeams = [
    {
      id: '1',
      name: '开发团队',
      description: '负责产品开发的核心团队',
      ownerId: '1',
      memberCount: 8,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: '测试团队',
      description: '负责产品测试和质量保证',
      ownerId: '2',
      memberCount: 5,
      status: 'active',
      createdAt: '2024-01-05T00:00:00Z',
    },
  ]

  const displayTeams = error ? mockTeams : teams
  const displayTotal = error ? mockTeams.length : total

  return (
    <div className="page-container">
      {/* 错误提示 */}
      {error && (
        <Alert
          message="数据加载失败"
          description="无法获取团队数据，显示模拟数据。请检查用户管理服务是否正常运行。"
          type="warning"
          showIcon
          className="mb-6"
        />
      )}

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
                value={displayTotal}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃团队"
                value={displayTeams.filter(t => t.status === 'active').length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={displayTeams.filter(t => dayjs(t.createdAt).isAfter(dayjs().startOf('day'))).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均成员数"
                value={displayTeams.length > 0 ? Math.round(displayTeams.reduce((sum, t) => sum + t.memberCount, 0) / displayTeams.length) : 0}
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
                onClick={() => refetch()}
                loading={isLoading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateTeam}
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
          dataSource={displayTeams}
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

      {/* 团队编辑/新建模态框 */}
      <TeamModal
        open={modalOpen}
        onCancel={handleModalClose}
        team={selectedTeam}
        mode={modalMode}
      />
    </div>
  )
}

export default TeamsPage
