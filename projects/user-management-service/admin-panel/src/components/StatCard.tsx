import React from 'react'
import { Card, Statistic, Progress, Space, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import classNames from 'classnames'

const { Text } = Typography

interface StatCardProps {
  title: string
  value: number | string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  precision?: number
  loading?: boolean
  trend?: {
    value: number
    isPositive?: boolean
    label?: string
  }
  progress?: {
    percent: number
    strokeColor?: string
    showInfo?: boolean
  }
  extra?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  loading = false,
  trend,
  progress,
  extra,
  className,
  style,
  onClick,
}) => {
  const cardClassName = classNames(
    'stat-card',
    {
      'cursor-pointer hover:shadow-md transition-shadow': onClick,
    },
    className
  )

  const renderTrend = () => {
    if (!trend) return null

    const { value: trendValue, isPositive = trendValue > 0, label } = trend
    const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />
    const color = isPositive ? '#52c41a' : '#ff4d4f'

    return (
      <Space size="small">
        <Text style={{ color, fontSize: '12px' }}>
          {icon} {Math.abs(trendValue)}%
        </Text>
        {label && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {label}
          </Text>
        )}
      </Space>
    )
  }

  const renderProgress = () => {
    if (!progress) return null

    return (
      <Progress
        percent={progress.percent}
        strokeColor={progress.strokeColor}
        showInfo={progress.showInfo}
        size="small"
        className="mt-2"
      />
    )
  }

  return (
    <Card
      className={cardClassName}
      style={style}
      loading={loading}
      onClick={onClick}
      bodyStyle={{ padding: '20px' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Statistic
            title={title}
            value={value}
            prefix={prefix}
            suffix={suffix}
            precision={precision}
            valueStyle={{
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
            titleStyle={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px',
            }}
          />
          
          {renderTrend()}
          {renderProgress()}
        </div>
        
        {extra && (
          <div className="ml-4">
            {extra}
          </div>
        )}
      </div>
    </Card>
  )
}

export default StatCard
