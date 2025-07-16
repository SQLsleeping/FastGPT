import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import { pushTrack } from '@fastgpt/service/common/middle/tracks/utils';
import requestIp from 'request-ip';

/**
 * 增强版注册API，使用我们的用户管理服务
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required',
      code: 'INVALID_PARAMS'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'Passwords do not match',
      code: 'PASSWORD_MISMATCH'
    });
  }

  try {
    // 调用我们的用户管理服务进行注册
    const userManagementServiceUrl = process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3001';
    const registerUrl = `${userManagementServiceUrl}/api/v1/auth/register`;

    const registerResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': requestIp.getClientIp(req) || '',
        'User-Agent': req.headers['user-agent'] || '',
      },
      body: JSON.stringify({
        username,
        email,
        password,
        confirmPassword,
      }),
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok || !registerData.success) {
      return res.status(registerResponse.status).json(registerData);
    }

    const { user } = registerData.data;

    // 记录注册追踪（兼容FastGPT现有的追踪系统）
    pushTrack.register({
      uid: user.id,
      teamId: user.id, // 暂时使用用户ID作为团队ID
      tmbId: user.id,  // 暂时使用用户ID作为成员ID
    });

    // 返回注册成功信息
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
        },
        message: registerData.message || 'Registration successful',
      },
    });

  } catch (error) {
    console.error('Enhanced registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during registration',
      code: 'INTERNAL_ERROR'
    });
  }
}

const lockTime = Number(process.env.REGISTER_LOCK_SECONDS || 60);
export default NextAPI(
  useIPFrequencyLimit({ id: 'register-enhanced', seconds: lockTime, limit: 5, force: true }),
  handler
);
