import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';

/**
 * 用户管理服务代理
 * 将请求转发到我们的用户管理服务
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  
  // 构建目标URL
  const userManagementServiceUrl = process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3001';
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `${userManagementServiceUrl}/api/v1/${targetPath}`;

  try {
    // 转发请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 转发Authorization头
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // 转发User-Agent
    if (req.headers['user-agent']) {
      headers['User-Agent'] = req.headers['user-agent'];
    }

    // 转发X-Forwarded-For
    if (req.headers['x-forwarded-for']) {
      headers['X-Forwarded-For'] = req.headers['x-forwarded-for'] as string;
    } else if (req.connection.remoteAddress) {
      headers['X-Forwarded-For'] = req.connection.remoteAddress;
    }

    // 构建fetch选项
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // 对于POST、PUT、PATCH请求，添加请求体
    if (req.method && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // 发送请求到用户管理服务
    const response = await fetch(targetUrl, fetchOptions);
    
    // 获取响应数据
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

export default NextAPI(handler);
