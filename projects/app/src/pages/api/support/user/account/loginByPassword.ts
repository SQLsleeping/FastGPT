import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import type { PostLoginProps } from '@fastgpt/global/support/user/api.d';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { NextAPI } from '@/service/middleware/entry';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import { pushTrack } from '@fastgpt/service/common/middle/tracks/utils';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { createUserSession } from '@fastgpt/service/support/user/session';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import requestIp from 'request-ip';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password, code } = req.body as PostLoginProps;

  if (!username || !password) {
    return Promise.reject(CommonErrEnum.invalidParams);
  }

  // 检查是否是用户管理服务的用户
  const isUMSUser = code === 'UMS_USER';

  // UMS用户不需要验证码验证，直接跳过

  // 首先尝试我们的用户管理服务
  let userManagementServiceSuccess = false;

  try {
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
        password, // 这里的password已经是前端发送的SHA256哈希
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();

      if (loginData.success) {
        const { user, token } = loginData.data;

        // 设置cookie（兼容FastGPT现有的cookie机制）
        setCookie(res, token);

        // 记录登录追踪（兼容FastGPT现有的追踪系统）
        pushTrack.login({
          type: 'password',
          uid: user.id,
          teamId: user.id, // 暂时使用用户ID作为团队ID
          tmbId: user.id,  // 暂时使用用户ID作为成员ID
        });

        // 确保用户在FastGPT MongoDB中存在
        let mongoUser = await MongoUser.findOne({ username: user.username });
        console.log('MongoDB user lookup result:', mongoUser ? 'found' : 'not found');

        if (!mongoUser) {
          console.log('Creating new MongoDB user for:', user.username);
          // 创建MongoDB用户记录
          mongoUser = await MongoUser.create({
            username: user.username,
            email: user.email,
            password: 'managed_by_external_service', // 占位符，实际密码由用户管理服务管理
            createTime: new Date(),
            timezone: user.timezone || 'Asia/Shanghai',
            avatar: '/icon/logo.svg'
          });
          console.log('Created MongoDB user with ID:', mongoUser._id);
        }

        // 确保用户有默认团队
        let teamMember;
        try {
          console.log('Attempting to get user details for:', mongoUser._id);
          teamMember = await getUserDetail({ userId: mongoUser._id });
          console.log('Found existing team member:', teamMember.team.tmbId);
        } catch (error) {
          console.log('User has no team, creating default team. Error:', error.message);
          // 用户没有团队，创建默认团队
          await mongoSessionRun(async (session) => {
            console.log('Creating default team for user:', mongoUser._id);
            teamMember = await createDefaultTeam({
              userId: String(mongoUser._id),
              teamName: `${user.username}'s Team`,
              avatar: '/icon/logo.svg',
              session
            });
            console.log('Created team member:', teamMember);
          });

          // 重新获取用户详情
          console.log('Re-fetching user details after team creation');
          teamMember = await getUserDetail({ userId: mongoUser._id });
          console.log('Final team member details:', teamMember.team.tmbId);
        }

        // 创建FastGPT会话令牌
        const fastgptToken = await createUserSession({
          userId: String(mongoUser._id),
          teamId: teamMember.team.teamId,
          tmbId: teamMember.team.tmbId,
          isRoot: false,
          ip: requestIp.getClientIp(req)
        });

        // 设置cookie（使用FastGPT的会话令牌）
        setCookie(res, fastgptToken);

        // 记录登录追踪（兼容FastGPT现有的追踪系统）
        pushTrack.login({
          type: 'password',
          uid: String(mongoUser._id),
          teamId: teamMember.team.teamId,
          tmbId: teamMember.team.tmbId,
        });

        // 添加审计日志（兼容FastGPT现有的审计系统）
        addAuditLog({
          tmbId: teamMember.team.tmbId,
          teamId: teamMember.team.teamId,
          event: AuditEventEnum.LOGIN,
        });

        // 标记用户管理服务登录成功
        userManagementServiceSuccess = true;

        // 创建权限对象（给予管理员权限）
        const permission = new TeamPermission({ per: TeamManagePermissionVal });

        // 返回用户信息（使用FastGPT的用户详情）
        return {
          user: teamMember,
          token: fastgptToken, // 使用FastGPT的会话令牌
        };
      }
    }
  } catch (error) {
    console.log('User management service failed, trying MongoDB...', error);
  }

  // 如果用户管理服务成功，但没有返回，说明有其他问题
  if (userManagementServiceSuccess) {
    return Promise.reject(UserErrEnum.account_psw_error);
  }

  // 如果是UMS用户但登录失败，不要回退到MongoDB
  if (isUMSUser) {
    return Promise.reject(UserErrEnum.account_psw_error);
  }

  // 如果用户管理服务失败，回退到原始的MongoDB逻辑
  if (!code) {
    return Promise.reject(CommonErrEnum.invalidParams);
  }

  // Auth prelogin code
  try {
    await authCode({
      key: username,
      code,
      type: UserAuthTypeEnum.login
    });
  } catch (error) {
    console.log('Auth code verification failed:', error);
    return Promise.reject(CommonErrEnum.invalidParams);
  }

  // 检测用户是否存在
  const authCert = await MongoUser.findOne(
    {
      username
    },
    'status'
  );
  if (!authCert) {
    return Promise.reject(UserErrEnum.account_psw_error);
  }

  if (authCert.status === UserStatusEnum.forbidden) {
    return Promise.reject('Invalid account!');
  }

  const user = await MongoUser.findOne({
    username,
    password
  });

  if (!user) {
    return Promise.reject(UserErrEnum.account_psw_error);
  }

  const userDetail = await getUserDetail({
    tmbId: user?.lastLoginTmbId,
    userId: user._id
  });

  MongoUser.findByIdAndUpdate(user._id, {
    lastLoginTmbId: userDetail.team.tmbId
  });

  const token = await createUserSession({
    userId: user._id,
    teamId: userDetail.team.teamId,
    tmbId: userDetail.team.tmbId,
    isRoot: username === 'root',
    ip: requestIp.getClientIp(req)
  });

  setCookie(res, token);

  pushTrack.login({
    type: 'password',
    uid: user._id,
    teamId: userDetail.team.teamId,
    tmbId: userDetail.team.tmbId
  });
  addAuditLog({
    tmbId: userDetail.team.tmbId,
    teamId: userDetail.team.teamId,
    event: AuditEventEnum.LOGIN
  });

  return {
    user: userDetail,
    token
  };
}

const lockTime = Number(process.env.PASSWORD_LOGIN_LOCK_SECONDS || 120);
export default NextAPI(
  useIPFrequencyLimit({ id: 'login-by-password', seconds: lockTime, limit: 10, force: true }),
  handler
);
