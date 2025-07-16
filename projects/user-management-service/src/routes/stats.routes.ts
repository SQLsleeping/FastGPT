import { Router } from 'express';

/**
 * 统计数据路由配置
 * 提供系统统计和分析数据
 */
const router = Router();

/**
 * @route GET /stats/system
 * @desc 获取系统统计数据
 * @access Private
 */
router.get('/system', async (_req, res) => {
  try {
    // 模拟系统统计数据
    const systemStats = {
      totalUsers: 1247,
      activeUsers: 892,
      totalTeams: 156,
      activeTeams: 134,
      newUsersToday: 23,
      newTeamsToday: 5,
      userGrowthRate: 12.5,
      teamGrowthRate: 8.3,
    };

    res.json({
      success: true,
      data: systemStats,
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取系统统计数据失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route GET /stats/user-activity
 * @desc 获取用户活动统计数据
 * @access Private
 */
router.get('/user-activity', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days as string);

    // 模拟用户活动数据
    const userActivityData = [];
    const now = new Date();

    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      userActivityData.push({
        date: date.toISOString().split('T')[0],
        logins: Math.floor(Math.random() * 200) + 50,
        registrations: Math.floor(Math.random() * 30) + 5,
        activeUsers: Math.floor(Math.random() * 150) + 50,
      });
    }

    res.json({
      success: true,
      data: userActivityData,
    });
  } catch (error) {
    console.error('Get user activity stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户活动统计失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route GET /stats/teams
 * @desc 获取团队统计数据
 * @access Private
 */
router.get('/teams', async (_req, res) => {
  try {
    // 模拟团队统计数据
    const teamStats = {
      totalTeams: 156,
      activeTeams: 134,
      averageMembersPerTeam: 6.8,
      teamsBySize: [
        { size: '1-5人', count: 45, percentage: 28.8 },
        { size: '6-10人', count: 67, percentage: 43.0 },
        { size: '11-20人', count: 32, percentage: 20.5 },
        { size: '20+人', count: 12, percentage: 7.7 },
      ],
      teamGrowthTrend: [
        { month: '2024-01', count: 120 },
        { month: '2024-02', count: 135 },
        { month: '2024-03', count: 142 },
        { month: '2024-04', count: 156 },
      ],
    };

    res.json({
      success: true,
      data: teamStats,
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取团队统计数据失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * @route GET /stats/overview
 * @desc 获取概览统计数据
 * @access Private
 */
router.get('/overview', async (_req, res) => {
  try {
    // 模拟概览数据
    const overviewStats = {
      users: {
        total: 1247,
        active: 892,
        growth: 12.5,
        newToday: 23,
      },
      teams: {
        total: 156,
        active: 134,
        growth: 8.3,
        newToday: 5,
      },
      activity: {
        loginsToday: 456,
        activeSessionsNow: 89,
        peakConcurrentUsers: 234,
        averageSessionDuration: '24分钟',
      },
      performance: {
        systemUptime: '99.9%',
        averageResponseTime: '120ms',
        errorRate: '0.1%',
        lastIncident: '7天前',
      },
    };

    res.json({
      success: true,
      data: overviewStats,
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取概览统计失败',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
});

export { router as statsRoutes };
