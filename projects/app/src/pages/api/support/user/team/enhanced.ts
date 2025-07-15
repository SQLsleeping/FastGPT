import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { TeamManagementProxy } from '@/service/support/user/userManagementProxy';

/**
 * 增强版团队管理API
 * 使用我们的用户管理服务进行团队管理
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { action, teamId, memberId } = req.query;

  try {
    switch (method) {
      case 'GET':
        if (teamId && typeof teamId === 'string') {
          if (action === 'members') {
            // 获取团队成员
            return await TeamManagementProxy.getTeamMembers(req, res, teamId);
          } else {
            // 获取团队信息
            return await TeamManagementProxy.getTeam(req, res, teamId);
          }
        } else {
          // 获取用户团队列表
          return await TeamManagementProxy.getUserTeams(req, res);
        }

      case 'POST':
        if (teamId && typeof teamId === 'string') {
          if (action === 'invite') {
            // 邀请用户加入团队
            return await TeamManagementProxy.inviteUser(req, res, teamId);
          } else if (action === 'leave') {
            // 离开团队
            return await TeamManagementProxy.leaveTeam(req, res, teamId);
          }
        } else {
          // 创建团队
          return await TeamManagementProxy.createTeam(req, res);
        }
        break;

      case 'PUT':
        if (teamId && typeof teamId === 'string') {
          if (memberId && typeof memberId === 'string' && action === 'role') {
            // 更新成员角色
            return await TeamManagementProxy.updateMemberRole(req, res, teamId, memberId);
          } else {
            // 更新团队信息
            return await TeamManagementProxy.updateTeam(req, res, teamId);
          }
        }
        break;

      case 'DELETE':
        if (teamId && typeof teamId === 'string') {
          if (memberId && typeof memberId === 'string') {
            // 移除团队成员
            return await TeamManagementProxy.removeMember(req, res, teamId, memberId);
          } else {
            // 删除团队
            return await TeamManagementProxy.deleteTeam(req, res, teamId);
          }
        }
        break;

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }

    // 如果没有匹配的路由
    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      code: 'INVALID_REQUEST'
    });

  } catch (error) {
    console.error('Enhanced team management error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing the team management request',
      code: 'INTERNAL_ERROR'
    });
  }
}

export default NextAPI(handler);
