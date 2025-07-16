import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Spin,
  Alert,
  Progress,
} from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useQuery } from 'react-query'
import { statsApi } from '../services/api'
import type { SystemStats } from '../types'

const { Title, Text } = Typography

// 模拟数据（实际应用中从API获取）
const mockUserActivityData = [
  { date: '2024-01-01', logins: 120, registrations: 15, activeUsers: 89 },
  { date: '2024-01-02', logins: 132, registrations: 18, activeUsers: 95 },
  { date: '2024-01-03', logins: 101, registrations: 12, activeUsers: 78 },
  { date: '2024-01-04', logins: 134, registrations: 22, activeUsers: 102 },
  { date: '2024-01-05', logins: 90, registrations: 8, activeUsers: 67 },
  { date: '2024-01-06', logins: 230, registrations: 35, activeUsers: 156 },
  { date: '2024-01-07', logins: 210, registrations: 28, activeUsers: 142 },
]

const mockTeamDistribution = [
  { name: '小型团队 (1-5人)', value: 45, color: '#0ea5e9' },
  { name: '中型团队 (6-15人)', value: 30, color: '#10b981' },
  { name: '大型团队 (16+人)', value: 25, color: '#f59e0b' },
]

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d')

  // 获取系统统计数据
  const {
    data: systemStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<any>('systemStats', statsApi.getSystemStats, {
    refetchInterval: 30000, // 30秒刷新一次
  })

  // 获取用户活动数据
  const {
    data: userActivityData,
    isLoading: activityLoading,
  } = useQuery('userActivity', () => statsApi.getUserActivityStats(7), {
    refetchInterval: 60000, // 1分钟刷新一次
  })

  // 模拟系统统计数据
  const mockStats: SystemStats = {
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
          description="无法获取系统统计数据，请检查网络连接或稍后重试。"
          type="error"
          showIcon
        />
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

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              suffix={
                <Space>
                  <Text type="success">
                    <RiseOutlined /> {stats.userGrowthRate}%
                  </Text>
                </Space>
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
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<TrophyOutlined />}
              suffix={
                <Progress
                  type="circle"
                  size={40}
                  percent={Math.round((stats.activeUsers / stats.totalUsers) * 100)}
                  showInfo={false}
                />
              }
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                活跃率: {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总团队数"
              value={stats.totalTeams}
              prefix={<TeamOutlined />}
              suffix={
                <Space>
                  <Text type="success">
                    <RiseOutlined /> {stats.teamGrowthRate}%
                  </Text>
                </Space>
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
          <Card>
            <Statistic
              title="活跃团队"
              value={stats.activeTeams}
              prefix={<ClockCircleOutlined />}
              suffix={
                <Progress
                  type="circle"
                  size={40}
                  percent={Math.round((stats.activeTeams / stats.totalTeams) * 100)}
                  showInfo={false}
                />
              }
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                活跃率: {Math.round((stats.activeTeams / stats.totalTeams) * 100)}%
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 用户活动趋势 */}
        <Col xs={24} lg={16}>
          <Card title="用户活动趋势" className="h-96">
            {activityLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockUserActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    name="登录次数"
                  />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="新注册"
                  />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="活跃用户"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* 团队规模分布 */}
        <Col xs={24} lg={8}>
          <Card title="团队规模分布" className="h-96">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockTeamDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockTeamDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
