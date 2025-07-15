import { Router } from 'express';

/**
 * 用户管理路由配置
 * 处理用户的CRUD操作
 */
const router = Router();

// 模拟用户数据
const mockUsers = [
  {
    id: 'user-001',
    username: 'admin',
    email: 'admin@fastgpt.com',
    status: 'active',
    role: 'super_admin',
    timezone: 'Asia/Shanghai',
    lastLoginAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'user-002',
    username: 'user1',
    email: 'user1@example.com',
    status: 'active',
    role: 'user',
    timezone: 'Asia/Shanghai',
    lastLoginAt: '2024-01-14T15:20:00Z',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
  },
  {
    id: 'user-003',
    username: 'user2',
    email: 'user2@example.com',
    status: 'inactive',
    role: 'user',
    timezone: 'Asia/Shanghai',
    lastLoginAt: null,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
  },
  {
    id: 'user-004',
    username: 'manager1',
    email: 'manager1@example.com',
    status: 'active',
    role: 'admin',
    timezone: 'Asia/Shanghai',
    lastLoginAt: '2024-01-15T09:00:00Z',
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
];

/**
 * @route GET /users
 * @desc 获取用户列表
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      status = '',
      role = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let filteredUsers = [...mockUsers];

    // 搜索过滤
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredUsers = filteredUsers.filter(
        user =>
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // 状态过滤
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // 角色过滤
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // 排序
    filteredUsers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 分页
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedUsers,
        total: filteredUsers.length,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(filteredUsers.length / pageSizeNum),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route GET /users/:id
 * @desc 获取单个用户信息
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        error: 'USER_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route POST /users
 * @desc 创建新用户
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role = 'user', status = 'active' } = req.body;

    // 简单验证
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码不能为空',
        error: 'VALIDATION_ERROR',
      });
    }

    // 检查用户名和邮箱是否已存在
    const existingUser = mockUsers.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名或邮箱已存在',
        error: 'USER_EXISTS',
      });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username,
      email,
      status,
      role,
      timezone: 'Asia/Shanghai',
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: newUser,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route PUT /users/:id
 * @desc 更新用户信息
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        error: 'USER_NOT_FOUND',
      });
    }

    // 更新用户信息
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: mockUsers[userIndex],
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route DELETE /users/:id
 * @desc 删除用户
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        error: 'USER_NOT_FOUND',
      });
    }

    mockUsers.splice(userIndex, 1);

    res.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route PUT /users/:id/status
 * @desc 更新用户状态
 * @access Private
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        error: 'USER_NOT_FOUND',
      });
    }

    mockUsers[userIndex].status = status;
    mockUsers[userIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: '用户状态更新成功',
      data: mockUsers[userIndex],
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

export { router as usersRoutes };
