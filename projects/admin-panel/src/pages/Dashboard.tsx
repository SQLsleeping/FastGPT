import React from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Alert,
} from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../services/api'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  // 获取系统统计数据
  const {
    data: systemStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['systemStats'],
    queryFn: statsApi.getSystemStats,
    refetchInterval: 30000, // 30秒刷新一次
  })

  // 模拟数据（当API不可用时）
  const mockStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalTeams: 156,
    activeTeams: 134,
    newUsersToday: 23,
    newTeamsToday: 5,
    userGrowthRate: 12.5,
    teamGrowthRate: 8.3,
  }

  const stats = systemStats?.data || mockStats

  if (statsError) {
    return (
      <div className="page-container">
        <Alert
          message="数据加载失败"
          description="无法获取系统统计数据，显示模拟数据。请检查用户管理服务是否正常运行。"
          type="warning"
          showIcon
          className="mb-6"
        />
        <div className="mb-6">
          <Title level={2} className="mb-2">
            系统概览
          </Title>
          <Text type="secondary">
            实时监控用户活动和系统状态
          </Text>
        </div>
        {renderStatCards(stats, statsLoading)}
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          系统概览
        </Title>
        <Text type="secondary">
          实时监控用户活动和系统状态
        </Text>
      </div>

      {renderStatCards(stats, statsLoading)}
    </div>
  )
}

// 渲染统计卡片
const renderStatCards = (stats: any, loading: boolean) => (
  <Row gutter={[16, 16]} className="mb-6">
    <Col xs={24} sm={12} lg={6}>
      <Card loading={loading}>
        <Statistic
          title="总用户数"
          value={stats.totalUsers}
          prefix={<UserOutlined />}
          suffix={
            <Text type="success" className="text-sm">
              <RiseOutlined /> {stats.userGrowthRate}%
            </Text>
          }
        />
        <div className="mt-2">
          <Text type="secondary" className="text-sm">
            今日新增: {stats.newUsersToday}
          </Text>
        </div>
      </Card>
    </Col>

    <Col xs={24} sm={12} lg={6}>
      <Card loading={loading}>
        <Statistic
          title="活跃用户"
          value={stats.activeUsers}
          prefix={<TrophyOutlined />}
        />
        <div className="mt-2">
          <Text type="secondary" className="text-sm">
            活跃率: {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
          </Text>
        </div>
      </Card>
    </Col>

    <Col xs={24} sm={12} lg={6}>
      <Card loading={loading}>
        <Statistic
          title="总团队数"
          value={stats.totalTeams}
          prefix={<TeamOutlined />}
          suffix={
            <Text type="success" className="text-sm">
              <RiseOutlined /> {stats.teamGrowthRate}%
            </Text>
          }
        />
        <div className="mt-2">
          <Text type="secondary" className="text-sm">
            今日新增: {stats.newTeamsToday}
          </Text>
        </div>
      </Card>
    </Col>

    <Col xs={24} sm={12} lg={6}>
      <Card loading={loading}>
        <Statistic
          title="活跃团队"
          value={stats.activeTeams}
          prefix={<TeamOutlined />}
        />
        <div className="mt-2">
          <Text type="secondary" className="text-sm">
            活跃率: {Math.round((stats.activeTeams / stats.totalTeams) * 100)}%
          </Text>
        </div>
      </Card>
    </Col>
  </Row>
)

export default Dashboard
