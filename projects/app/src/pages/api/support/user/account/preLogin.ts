import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { addSeconds } from 'date-fns';
import { addAuthCode } from '@fastgpt/service/support/user/auth/controller';

export type preLoginQuery = {
  username: string;
};

export type preLoginBody = {};

export type preLoginResponse = { code: string };

async function handler(
  req: ApiRequestProps<preLoginBody, preLoginQuery>,
  res: ApiResponseType<any>
): Promise<preLoginResponse> {
  const { username } = req.query;

  if (!username) {
    return Promise.reject('username is required');
  }

  // 检查用户是否存在于我们的用户管理服务中
  try {
    const userManagementServiceUrl = process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3001';
    const checkUserUrl = `${userManagementServiceUrl}/api/v1/auth/check-user`;

    const checkResponse = await fetch(checkUserUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      if (checkData.success && checkData.data.exists) {
        // 用户存在于我们的服务中，返回特殊标识码
        const code = 'UMS_USER'; // 特殊标识，表示这是用户管理服务的用户

        await addAuthCode({
          type: UserAuthTypeEnum.login,
          key: username,
          code,
          expiredTime: addSeconds(new Date(), 300) // 5分钟有效期
        });

        return { code };
      }
    }
  } catch (error) {
    console.log('User management service check failed, using normal flow...', error);
  }

  // 如果用户不在我们的服务中，使用原始逻辑
  const code = getNanoid(6);

  await addAuthCode({
    type: UserAuthTypeEnum.login,
    key: username,
    code,
    expiredTime: addSeconds(new Date(), 30)
  });

  return {
    code
  };
}

export default NextAPI(handler);
