import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { teamService } from '../services/team.service';
import { CreateTeamData, UpdateTeamData, TeamMemberRole } from '../types';
import { logger } from '../utils';

/**
 * 团队管理控制器
 * 处理团队相关的HTTP请求
 */
export class TeamController extends BaseController {
  /**
   * 创建团队
   */
  public createTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const teamData: CreateTeamData = req.body;

      // 验证请求数据
      const validation = this.validateCreateTeamRequest(teamData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      const team = await teamService.createTeam(teamData, userId);

      logger.info('Team created via API', {
        teamId: team.id,
        createdBy: userId,
        ip: req.ip,
      });

      this.success(
        res,
        {
          team,
          message: 'Team created successfully',
        },
        201,
      );
    } catch (error) {
      logger.error('Team creation failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 获取团队信息
   */
  public getTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId } = req.params;
      if (!teamId) {
        this.error(res, 'Team ID is required', 400);
        return;
      }

      const team = await teamService.getTeam(teamId, userId);

      this.success(res, { team });
    } catch (error) {
      logger.error('Get team failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 更新团队信息
   */
  public updateTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId } = req.params;
      if (!teamId) {
        this.error(res, 'Team ID is required', 400);
        return;
      }

      const updateData: UpdateTeamData = req.body;

      // 验证请求数据
      const validation = this.validateUpdateTeamRequest(updateData);
      if (!validation.isValid) {
        this.error(res, validation.message, 400);
        return;
      }

      const team = await teamService.updateTeam(teamId, updateData, userId);

      logger.info('Team updated via API', {
        teamId,
        updatedBy: userId,
        ip: req.ip,
      });

      this.success(res, {
        team,
        message: 'Team updated successfully',
      });
    } catch (error) {
      logger.error('Team update failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 删除团队
   */
  public deleteTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId } = req.params;
      if (!teamId) {
        this.error(res, 'Team ID is required', 400);
        return;
      }

      await teamService.deleteTeam(teamId, userId);

      logger.info('Team deleted via API', {
        teamId,
        deletedBy: userId,
        ip: req.ip,
      });

      this.success(res, {
        message: 'Team deleted successfully',
      });
    } catch (error) {
      logger.error('Team deletion failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 获取用户的团队列表
   */
  public getUserTeams = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const teams = await teamService.getUserTeams(userId);

      this.success(res, { teams });
    } catch (error) {
      logger.error('Get user teams failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 邀请用户加入团队
   */
  public inviteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId } = req.params;
      const { email, role } = req.body;

      if (!teamId) {
        this.error(res, 'Team ID is required', 400);
        return;
      }

      if (!email) {
        this.error(res, 'Email is required', 400);
        return;
      }

      if (!role || !Object.values(TeamMemberRole).includes(role)) {
        this.error(res, 'Valid role is required', 400);
        return;
      }

      await teamService.inviteUser(teamId, email, role, userId);

      logger.info('User invited to team via API', {
        teamId,
        inviteeEmail: email,
        role,
        invitedBy: userId,
        ip: req.ip,
      });

      this.success(res, {
        message: 'User invited successfully',
      });
    } catch (error) {
      logger.error('User invitation failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 获取团队成员列表
   */
  public getTeamMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId } = req.params;
      if (!teamId) {
        this.error(res, 'Team ID is required', 400);
        return;
      }

      const members = await teamService.getTeamMembers(teamId, userId);

      this.success(res, { members });
    } catch (error) {
      logger.error('Get team members failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 更新团队成员角色
   */
  public updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId, memberId } = req.params;
      const { role } = req.body;

      if (!teamId || !memberId) {
        this.error(res, 'Team ID and Member ID are required', 400);
        return;
      }

      if (!role || !Object.values(TeamMemberRole).includes(role)) {
        this.error(res, 'Valid role is required', 400);
        return;
      }

      const member = await teamService.updateMemberRole(teamId, memberId, role, userId);

      logger.info('Member role updated via API', {
        teamId,
        memberId,
        newRole: role,
        updatedBy: userId,
        ip: req.ip,
      });

      this.success(res, {
        member,
        message: 'Member role updated successfully',
      });
    } catch (error) {
      logger.error('Member role update failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 移除团队成员
   */
  public removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId, memberId } = req.params;

      if (!teamId || !memberId) {
        this.error(res, 'Team ID and Member ID are required', 400);
        return;
      }

      await teamService.removeMember(teamId, memberId, userId);

      logger.info('Member removed from team via API', {
        teamId,
        memberId,
        removedBy: userId,
        ip: req.ip,
      });

      this.success(res, {
        message: 'Member removed successfully',
      });
    } catch (error) {
      logger.error('Member removal failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 离开团队
   */
  public leaveTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.error(res, 'Authentication required', 401);
        return;
      }

      const { teamId } = req.params;
      if (!teamId) {
        this.error(res, 'Team ID is required', 400);
        return;
      }

      await teamService.leaveTeam(teamId, userId);

      logger.info('User left team via API', {
        teamId,
        userId,
        ip: req.ip,
      });

      this.success(res, {
        message: 'Left team successfully',
      });
    } catch (error) {
      logger.error('Leave team failed:', error);
      this.handleError(res, error);
    }
  };

  /**
   * 验证创建团队请求
   */
  private validateCreateTeamRequest(data: CreateTeamData): { isValid: boolean; message: string } {
    if (!data.name || data.name.trim().length === 0) {
      return { isValid: false, message: 'Team name is required' };
    }

    if (data.name.length > 255) {
      return { isValid: false, message: 'Team name is too long' };
    }

    if (data.description && data.description.length > 1000) {
      return { isValid: false, message: 'Description is too long' };
    }

    if (data.maxMembers && (data.maxMembers < 1 || data.maxMembers > 1000)) {
      return { isValid: false, message: 'Max members must be between 1 and 1000' };
    }

    return { isValid: true, message: '' };
  }

  /**
   * 验证更新团队请求
   */
  private validateUpdateTeamRequest(data: UpdateTeamData): { isValid: boolean; message: string } {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        return { isValid: false, message: 'Team name cannot be empty' };
      }
      if (data.name.length > 255) {
        return { isValid: false, message: 'Team name is too long' };
      }
    }

    if (data.description !== undefined && data.description.length > 1000) {
      return { isValid: false, message: 'Description is too long' };
    }

    if (data.maxMembers !== undefined && (data.maxMembers < 1 || data.maxMembers > 1000)) {
      return { isValid: false, message: 'Max members must be between 1 and 1000' };
    }

    return { isValid: true, message: '' };
  }
}
