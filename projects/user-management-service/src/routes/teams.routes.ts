import { Router } from 'express';

/**
 * 团队管理路由配置
 * 处理团队的CRUD操作
 */
const router = Router();

// 模拟团队数据
const mockTeams = [
  {
    id: 'team-001',
    name: '开发团队',
    description: '负责产品开发的核心团队',
    status: 'active',
    ownerId: 'user-004',
    memberCount: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'team-002',
    name: '测试团队',
    description: '负责产品测试和质量保证',
    status: 'active',
    ownerId: 'user-004',
    memberCount: 5,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T15:00:00Z',
  },
  {
    id: 'team-003',
    name: '设计团队',
    description: '负责产品设计和用户体验',
    status: 'active',
    ownerId: 'user-001',
    memberCount: 3,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z',
  },
  {
    id: 'team-004',
    name: '临时项目组',
    description: '临时成立的项目团队',
    status: 'inactive',
    ownerId: 'user-002',
    memberCount: 2,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
  },
];

// 模拟团队成员数据
const mockTeamMembers = [
  { id: 'member-001', teamId: 'team-001', userId: 'user-001', role: 'admin', status: 'active', joinedAt: '2024-01-01T00:00:00Z' },
  { id: 'member-002', teamId: 'team-001', userId: 'user-002', role: 'member', status: 'active', joinedAt: '2024-01-02T00:00:00Z' },
  { id: 'member-003', teamId: 'team-001', userId: 'user-003', role: 'member', status: 'active', joinedAt: '2024-01-03T00:00:00Z' },
  { id: 'member-004', teamId: 'team-002', userId: 'user-001', role: 'admin', status: 'active', joinedAt: '2024-01-05T00:00:00Z' },
  { id: 'member-005', teamId: 'team-002', userId: 'user-004', role: 'member', status: 'active', joinedAt: '2024-01-06T00:00:00Z' },
];

/**
 * @route GET /teams
 * @desc 获取团队列表
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      status = '',
      ownerId = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let filteredTeams = [...mockTeams];

    // 搜索过滤
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredTeams = filteredTeams.filter(
        team =>
          team.name.toLowerCase().includes(searchLower) ||
          (team.description && team.description.toLowerCase().includes(searchLower))
      );
    }

    // 状态过滤
    if (status) {
      filteredTeams = filteredTeams.filter(team => team.status === status);
    }

    // 所有者过滤
    if (ownerId) {
      filteredTeams = filteredTeams.filter(team => team.ownerId === ownerId);
    }

    // 排序
    filteredTeams.sort((a, b) => {
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
    const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedTeams,
        total: filteredTeams.length,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(filteredTeams.length / pageSizeNum),
      },
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: '获取团队列表失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route GET /teams/:id
 * @desc 获取单个团队信息
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const team = mockTeams.find(t => t.id === id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: '团队不存在',
        error: 'TEAM_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: '获取团队信息失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route POST /teams
 * @desc 创建新团队
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, ownerId } = req.body;

    // 简单验证
    if (!name || !ownerId) {
      return res.status(400).json({
        success: false,
        message: '团队名称和所有者不能为空',
        error: 'VALIDATION_ERROR',
      });
    }

    // 检查团队名称是否已存在
    const existingTeam = mockTeams.find(t => t.name === name);
    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: '团队名称已存在',
        error: 'TEAM_EXISTS',
      });
    }

    const newTeam = {
      id: `team-${Date.now()}`,
      name,
      description: description || '',
      status: 'active',
      ownerId,
      memberCount: 1, // 创建者自动成为成员
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTeams.push(newTeam);

    res.status(201).json({
      success: true,
      message: '团队创建成功',
      data: newTeam,
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: '创建团队失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route PUT /teams/:id
 * @desc 更新团队信息
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const teamIndex = mockTeams.findIndex(t => t.id === id);
    if (teamIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '团队不存在',
        error: 'TEAM_NOT_FOUND',
      });
    }

    // 更新团队信息
    mockTeams[teamIndex] = {
      ...mockTeams[teamIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: '团队信息更新成功',
      data: mockTeams[teamIndex],
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: '更新团队信息失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route DELETE /teams/:id
 * @desc 删除团队
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const teamIndex = mockTeams.findIndex(t => t.id === id);
    if (teamIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '团队不存在',
        error: 'TEAM_NOT_FOUND',
      });
    }

    mockTeams.splice(teamIndex, 1);

    res.json({
      success: true,
      message: '团队删除成功',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: '删除团队失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route GET /teams/:id/members
 * @desc 获取团队成员列表
 * @access Private
 */
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;

    const team = mockTeams.find(t => t.id === id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '团队不存在',
        error: 'TEAM_NOT_FOUND',
      });
    }

    const teamMembers = mockTeamMembers.filter(m => m.teamId === id);

    // 模拟返回成员详细信息
    const membersWithUserInfo = teamMembers.map(member => ({
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      username: `user-${member.userId.split('-')[1]}`,
      email: `user${member.userId.split('-')[1]}@example.com`,
    }));

    res.json({
      success: true,
      data: membersWithUserInfo,
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: '获取团队成员失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

export { router as teamsRoutes };
