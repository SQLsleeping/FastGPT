import React from 'react'
import { Result, Button } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { usePermissions } from '../hooks/usePermissions'

interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * 权限保护组件
 * 根据用户权限决定是否渲染子组件
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // 检查权限
  const hasAccess = () => {
    if (permission) {
      return hasPermission(permission)
    }

    if (permissions.length > 0) {
      return requireAll 
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions)
    }

    // 如果没有指定权限要求，默认允许访问
    return true
  }

  if (!hasAccess()) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面。"
        icon={<LockOutlined />}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}

export default PermissionGuard
