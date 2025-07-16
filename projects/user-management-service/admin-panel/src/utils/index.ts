import dayjs from 'dayjs'
import type { User, Team } from '../types'

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format)
}

/**
 * 格式化相对时间
 */
export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow()
}

/**
 * 获取用户状态标签配置
 */
export const getUserStatusConfig = (status: string) => {
  const statusMap = {
    active: { color: 'success', text: '正常', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
    inactive: { color: 'default', text: '未激活', bgColor: '#fafafa', borderColor: '#d9d9d9' },
    suspended: { color: 'error', text: '已停用', bgColor: '#fff2f0', borderColor: '#ffccc7' },
  }
  return statusMap[status as keyof typeof statusMap] || { color: 'default', text: status, bgColor: '#fafafa', borderColor: '#d9d9d9' }
}

/**
 * 获取用户角色标签配置
 */
export const getUserRoleConfig = (role: string) => {
  const roleMap = {
    user: { color: 'blue', text: '普通用户', bgColor: '#f0f5ff', borderColor: '#adc6ff' },
    admin: { color: 'orange', text: '管理员', bgColor: '#fff7e6', borderColor: '#ffd591' },
    super_admin: { color: 'red', text: '超级管理员', bgColor: '#fff1f0', borderColor: '#ffa39e' },
  }
  return roleMap[role as keyof typeof roleMap] || { color: 'default', text: role, bgColor: '#fafafa', borderColor: '#d9d9d9' }
}

/**
 * 获取团队状态标签配置
 */
export const getTeamStatusConfig = (status: string) => {
  const statusMap = {
    active: { color: 'success', text: '活跃', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
    inactive: { color: 'default', text: '未激活', bgColor: '#fafafa', borderColor: '#d9d9d9' },
  }
  return statusMap[status as keyof typeof statusMap] || { color: 'default', text: status, bgColor: '#fafafa', borderColor: '#d9d9d9' }
}

/**
 * 生成随机颜色
 */
export const generateRandomColor = () => {
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa541c', '#a0d911', '#2f54eb'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * 获取用户头像背景色
 */
export const getUserAvatarColor = (username: string) => {
  const colors = [
    '#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068',
    '#108ee9', '#f50', '#2db7f5', '#52c41a', '#faad14'
  ]
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * 验证邮箱格式
 */
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度
 */
export const validatePassword = (password: string) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    strength: {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      numbers: hasNumbers,
      specialChar: hasSpecialChar,
    },
    score: [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length,
  }
}

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * 生成UUID
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 获取查询参数
 */
export const getQueryParams = (search: string) => {
  const params = new URLSearchParams(search)
  const result: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    result[key] = value
  }
  return result
}

/**
 * 设置查询参数
 */
export const setQueryParams = (params: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

/**
 * 下载文件
 */
export const downloadFile = (data: Blob | string, filename: string, type?: string) => {
  const blob = typeof data === 'string' ? new Blob([data], { type: type || 'text/plain' }) : data
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 复制到剪贴板
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  }
}

/**
 * 获取用户显示名称
 */
export const getUserDisplayName = (user: User) => {
  if (user.profile?.firstName && user.profile?.lastName) {
    return `${user.profile.firstName} ${user.profile.lastName}`
  }
  return user.username
}

/**
 * 获取团队显示信息
 */
export const getTeamDisplayInfo = (team: Team) => {
  return {
    name: team.name,
    description: team.description || '暂无描述',
    memberText: `${team.memberCount} 名成员`,
    statusText: getTeamStatusConfig(team.status).text,
  }
}

/**
 * 格式化数字
 */
export const formatNumber = (num: number, precision = 0) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(precision) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(precision) + 'K'
  }
  return num.toString()
}

/**
 * 计算百分比
 */
export const calculatePercentage = (value: number, total: number, precision = 1) => {
  if (total === 0) return 0
  return Number(((value / total) * 100).toFixed(precision))
}

/**
 * 检查权限
 */
export const hasPermission = (userPermissions: string[], requiredPermission: string) => {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*')
}

/**
 * 获取错误消息
 */
export const getErrorMessage = (error: any) => {
  if (typeof error === 'string') return error
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return '发生未知错误'
}
