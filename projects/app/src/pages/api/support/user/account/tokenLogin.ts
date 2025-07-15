import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { type UserType } from '@fastgpt/global/support/user/type';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import requestIp from 'request-ip';

export type TokenLoginQuery = {};
export type TokenLoginBody = {};
export type TokenLoginResponse = UserType;

async function handler(
  req: ApiRequestProps<TokenLoginBody, TokenLoginQuery>,
  _res: ApiResponseType<any>
): Promise<TokenLoginResponse> {
  const { tmbId, userId } = await authCert({ req, authToken: true });

  // 首先尝试从用户管理服务获取用户信息
  try {
    const userManagementServiceUrl = process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3001';
    const userInfoUrl = `${userManagementServiceUrl}/api/v1/users/${userId}`;

    const userResponse = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': requestIp.getClientIp(req) || '',
        'User-Agent': req.headers['user-agent'] || '',
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();

      if (userData.success) {
        const user = userData.data;

        // 创建权限对象（给予管理员权限）
        const permission = new TeamPermission({ per: TeamManagePermissionVal });

        // 返回用户信息（格式化为FastGPT期望的格式）
        return {
          _id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          timezone: user.timezone,
          createTime: user.createdAt,
          avatar: '/icon/logo.svg',
          promotionRate: 0,
          team: {
            teamId: user.id,
            tmbId: user.id,
            teamName: `${user.username}'s Team`,
            role: 'owner',
            status: 'active',
            canWrite: true,
            permission: permission,
            // 添加默认的团队配置
            openaiAccount: {
              key: '',
              baseUrl: ''
            },
            externalWorkflowVariables: {},
          },
          permission: permission,
        };
      }
    }
  } catch (error) {
    console.log('User management service failed, trying MongoDB...', error);
  }

  // 如果用户管理服务失败，回退到原始的MongoDB逻辑
  const user = await getUserDetail({ tmbId });

  // Remove sensitive information
  if (user.team.openaiAccount) {
    user.team.openaiAccount = {
      key: '',
      baseUrl: user.team.openaiAccount.baseUrl
    };
  }
  if (user.team.externalWorkflowVariables) {
    user.team.externalWorkflowVariables = Object.fromEntries(
      Object.entries(user.team.externalWorkflowVariables).map(([key, value]) => [key, ''])
    );
  }

  return user;
}
export default NextAPI(handler);
