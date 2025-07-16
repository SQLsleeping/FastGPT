import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import { pushTrack } from '@fastgpt/service/common/middle/tracks/utils';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import requestIp from 'request-ip';

/**
 * 新的登录API，使用我们的用户管理服务
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required',
      code: 'INVALID_PARAMS'
    });
  }

  try {
    // 调用我们的用户管理服务进行登录
    const userManagementServiceUrl = process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3001';
    const loginUrl = `${userManagementServiceUrl}/api/v1/auth/login`;

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': requestIp.getClientIp(req) || '',
        'User-Agent': req.headers['user-agent'] || '',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok || !loginData.success) {
      return res.status(loginResponse.status).json(loginData);
    }

    const { user, token } = loginData.data;

    // 设置cookie（兼容FastGPT现有的cookie机制）
    res.setHeader('Set-Cookie', [
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`, // 7天过期
    ]);

    // 记录登录追踪（兼容FastGPT现有的追踪系统）
    pushTrack.login({
      type: 'password',
      uid: user.id,
      teamId: user.id, // 暂时使用用户ID作为团队ID
      tmbId: user.id,  // 暂时使用用户ID作为成员ID
    });

    // 添加审计日志（兼容FastGPT现有的审计系统）
    addAuditLog({
      tmbId: user.id,
      teamId: user.id,
      event: AuditEventEnum.LOGIN,
    });

    // 返回用户信息（格式化为FastGPT期望的格式）
    return res.json({
      success: true,
      data: {
        user: {
          _id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          timezone: user.timezone,
          createTime: user.createdAt,
          team: {
            teamId: user.id, // 暂时使用用户ID作为团队ID
            tmbId: user.id,  // 暂时使用用户ID作为成员ID
            teamName: `${user.username}'s Team`,
            role: 'owner',
            status: 'active',
            canWrite: true,
          },
        },
        token,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login',
      code: 'INTERNAL_ERROR'
    });
  }
}

const lockTime = Number(process.env.PASSWORD_LOGIN_LOCK_SECONDS || 120);
export default NextAPI(
  useIPFrequencyLimit({ id: 'login-by-password-new', seconds: lockTime, limit: 10, force: true }),
  handler
);
