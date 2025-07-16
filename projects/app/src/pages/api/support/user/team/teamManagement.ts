import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

/**
 * 团队管理API代理
 * 将团队管理请求转发到我们的用户管理服务
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 验证用户认证
    const { tmbId, teamId } = await authCert({ req, authToken: true });

    // 获取操作类型和参数
    const { action, ...params } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
        code: 'INVALID_PARAMS'
      });
    }

    // 构建目标URL
    const userManagementServiceUrl = process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3001';
    let targetUrl = '';
    let method = req.method || 'GET';

    // 根据action确定目标URL和方法
    switch (action) {
      case 'createTeam':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams`;
        method = 'POST';
        break;
      case 'getTeams':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams`;
        method = 'GET';
        break;
      case 'getTeam':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}`;
        method = 'GET';
        break;
      case 'updateTeam':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}`;
        method = 'PUT';
        break;
      case 'deleteTeam':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}`;
        method = 'DELETE';
        break;
      case 'getMembers':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}/members`;
        method = 'GET';
        break;
      case 'inviteUser':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}/invite`;
        method = 'POST';
        break;
      case 'updateMemberRole':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}/members/${params.memberId}/role`;
        method = 'PUT';
        break;
      case 'removeMember':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}/members/${params.memberId}`;
        method = 'DELETE';
        break;
      case 'leaveTeam':
        targetUrl = `${userManagementServiceUrl}/api/v1/teams/${params.teamId}/leave`;
        method = 'POST';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          code: 'INVALID_ACTION'
        });
    }

    // 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 转发Authorization头
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // 构建fetch选项
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // 对于POST、PUT、PATCH请求，添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      // 移除action字段，只发送实际的参数
      const { action: _, ...requestBody } = params;
      fetchOptions.body = JSON.stringify(requestBody);
    }

    // 发送请求到用户管理服务
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    // 转发响应
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Team management proxy error:', error);
    
    if (error instanceof Error && error.message.includes('auth')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing the team management request',
      code: 'INTERNAL_ERROR'
    });
  }
}

export default NextAPI(handler);
