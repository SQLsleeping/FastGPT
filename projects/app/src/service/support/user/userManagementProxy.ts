/**
 * 用户管理服务代理
 * 将用户管理相关的请求转发到独立的用户管理服务
 */

import { NextApiRequest, NextApiResponse } from 'next';

const USER_MANAGEMENT_SERVICE_URL = process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3001';

export interface UserManagementProxyOptions {
  path: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * 代理请求到用户管理服务
 */
export async function proxyToUserManagementService(
  req: NextApiRequest,
  res: NextApiResponse,
  options: UserManagementProxyOptions
): Promise<void> {
  const { path, method = req.method, body = req.body, headers = {} } = options;

  try {
    const targetUrl = `${USER_MANAGEMENT_SERVICE_URL}/api/v1/${path}`;

    // 准备请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // 转发Authorization头
    if (req.headers.authorization) {
      requestHeaders.Authorization = req.headers.authorization;
    }

    // 转发User-Agent
    if (req.headers['user-agent']) {
      requestHeaders['User-Agent'] = req.headers['user-agent'];
    }

    // 转发X-Forwarded-For
    if (req.headers['x-forwarded-for']) {
      requestHeaders['X-Forwarded-For'] = req.headers['x-forwarded-for'] as string;
    } else if (req.socket.remoteAddress) {
      requestHeaders['X-Forwarded-For'] = req.socket.remoteAddress;
    }

    // 构建fetch选项
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // 对于POST、PUT、PATCH请求，添加请求体
    if (method && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(body);
    }

    // 发送请求到用户管理服务
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    // 转发响应状态码和数据
    res.status(response.status).json(data);

  } catch (error) {
    console.error('User management service proxy error:', error);
    
    // 如果用户管理服务不可用，返回错误
    res.status(503).json({
      success: false,
      error: 'User management service unavailable',
      message: 'The user management service is currently unavailable. Please try again later.',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}

/**
 * 用户认证相关的代理方法
 */
export class UserAuthProxy {
  /**
   * 用户登录
   */
  static async login(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'auth/login',
      method: 'POST',
    });
  }

  /**
   * 用户注册
   */
  static async register(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'auth/register',
      method: 'POST',
    });
  }

  /**
   * 刷新令牌
   */
  static async refreshToken(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'auth/refresh',
      method: 'POST',
    });
  }

  /**
   * 用户登出
   */
  static async logout(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'auth/logout',
      method: 'POST',
    });
  }

  /**
   * 修改密码
   */
  static async changePassword(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'auth/change-password',
      method: 'POST',
    });
  }

  /**
   * 忘记密码
   */
  static async forgotPassword(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'auth/forgot-password',
      method: 'POST',
    });
  }

  /**
   * 重置密码
   */
  static async resetPassword(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'auth/reset-password',
      method: 'POST',
    });
  }
}

/**
 * 团队管理相关的代理方法
 */
export class TeamManagementProxy {
  /**
   * 创建团队
   */
  static async createTeam(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'teams',
      method: 'POST',
    });
  }

  /**
   * 获取用户团队列表
   */
  static async getUserTeams(req: NextApiRequest, res: NextApiResponse) {
    return proxyToUserManagementService(req, res, {
      path: 'teams',
      method: 'GET',
    });
  }

  /**
   * 获取团队信息
   */
  static async getTeam(req: NextApiRequest, res: NextApiResponse, teamId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}`,
      method: 'GET',
    });
  }

  /**
   * 更新团队信息
   */
  static async updateTeam(req: NextApiRequest, res: NextApiResponse, teamId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}`,
      method: 'PUT',
    });
  }

  /**
   * 删除团队
   */
  static async deleteTeam(req: NextApiRequest, res: NextApiResponse, teamId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}`,
      method: 'DELETE',
    });
  }

  /**
   * 获取团队成员
   */
  static async getTeamMembers(req: NextApiRequest, res: NextApiResponse, teamId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}/members`,
      method: 'GET',
    });
  }

  /**
   * 邀请用户加入团队
   */
  static async inviteUser(req: NextApiRequest, res: NextApiResponse, teamId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}/invite`,
      method: 'POST',
    });
  }

  /**
   * 更新成员角色
   */
  static async updateMemberRole(req: NextApiRequest, res: NextApiResponse, teamId: string, memberId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}/members/${memberId}/role`,
      method: 'PUT',
    });
  }

  /**
   * 移除团队成员
   */
  static async removeMember(req: NextApiRequest, res: NextApiResponse, teamId: string, memberId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}/members/${memberId}`,
      method: 'DELETE',
    });
  }

  /**
   * 离开团队
   */
  static async leaveTeam(req: NextApiRequest, res: NextApiResponse, teamId: string) {
    return proxyToUserManagementService(req, res, {
      path: `teams/${teamId}/leave`,
      method: 'POST',
    });
  }
}
