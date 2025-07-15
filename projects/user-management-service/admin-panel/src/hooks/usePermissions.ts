import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'

/**
 * 权限管理Hook
 */
export const usePermissions = () => {
  const { user } = useAuthStore()

  const permissions = useMemo(() => {
    if (!user) return []
    return user.permissions || []
  }, [user])

  const hasPermission = (permission: string) => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    return permissions.includes(permission) || permissions.includes('*')
  }

  const hasAnyPermission = (permissionList: string[]) => {
    return permissionList.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissionList: string[]) => {
    return permissionList.every(permission => hasPermission(permission))
  }

  const canManageUsers = () => {
    return hasPermission('users:manage') || user?.role === 'super_admin'
  }

  const canManageTeams = () => {
    return hasPermission('teams:manage') || user?.role === 'super_admin'
  }

  const canManageSystem = () => {
    return hasPermission('system:manage') || user?.role === 'super_admin'
  }

  const canViewStats = () => {
    return hasPermission('stats:view') || user?.role === 'admin' || user?.role === 'super_admin'
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUsers,
    canManageTeams,
    canManageSystem,
    canViewStats,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
  }
}
