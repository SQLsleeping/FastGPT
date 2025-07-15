import { BaseService } from './base.service';
import {
  teamDAO,
  Team,
  TeamMember,
  CreateTeamData,
  UpdateTeamData,
  TeamMemberRole,
  TeamMemberStatus,
} from '../models/team.model';
import { userDAO } from '../models/user.model';
import { logger } from '../utils';
import { AppError } from '../types';

/**
 * 团队管理服务
 * 处理团队创建、成员管理、权限控制等业务逻辑
 */
export class TeamService extends BaseService {
  /**
   * 创建团队
   */
  public async createTeam(teamData: CreateTeamData, creatorId: string): Promise<Team> {
    try {
      // 验证创建者是否存在
      const creator = await userDAO.findById(creatorId);
      if (!creator) {
        throw new AppError('Creator not found', 404, 'USER_NOT_FOUND');
      }

      // 设置创建者为团队所有者
      const createData: CreateTeamData = {
        ...teamData,
        ownerId: creatorId,
      };

      logger.info('Creating team', {
        teamName: teamData.name,
        creatorId,
        teamType: teamData.teamType,
      });

      const team = await teamDAO.create(createData);

      logger.info('Team created successfully', {
        teamId: team.id,
        teamName: team.name,
        ownerId: team.ownerId,
      });

      return team;
    } catch (error) {
      logger.error('Failed to create team:', error);
      throw error;
    }
  }

  /**
   * 获取团队信息
   */
  public async getTeam(teamId: string, userId: string): Promise<Team> {
    try {
      const team = await teamDAO.findById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
      }

      // 检查用户是否有权限查看团队信息
      if (team.isPrivate) {
        const isMember = await teamDAO.isMember(teamId, userId);
        if (!isMember) {
          throw new AppError('Access denied', 403, 'ACCESS_DENIED');
        }
      }

      return team;
    } catch (error) {
      logger.error('Failed to get team:', error);
      throw error;
    }
  }

  /**
   * 更新团队信息
   */
  public async updateTeam(teamId: string, updateData: UpdateTeamData, userId: string): Promise<Team> {
    try {
      // 检查用户是否有权限更新团队
      const isAdmin = await teamDAO.isAdminOrOwner(teamId, userId);
      if (!isAdmin) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      const updatedTeam = await teamDAO.update(teamId, updateData);
      if (!updatedTeam) {
        throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
      }

      logger.info('Team updated successfully', {
        teamId,
        updatedBy: userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedTeam;
    } catch (error) {
      logger.error('Failed to update team:', error);
      throw error;
    }
  }

  /**
   * 删除团队
   */
  public async deleteTeam(teamId: string, userId: string): Promise<void> {
    try {
      const team = await teamDAO.findById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
      }

      // 只有团队所有者可以删除团队
      if (team.ownerId !== userId) {
        throw new AppError('Only team owner can delete the team', 403, 'ACCESS_DENIED');
      }

      const deleted = await teamDAO.delete(teamId);
      if (!deleted) {
        throw new AppError('Failed to delete team', 500, 'DELETE_FAILED');
      }

      logger.info('Team deleted successfully', {
        teamId,
        deletedBy: userId,
      });
    } catch (error) {
      logger.error('Failed to delete team:', error);
      throw error;
    }
  }

  /**
   * 获取用户的团队列表
   */
  public async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const teams = await teamDAO.findByUserId(userId);

      logger.info('Retrieved user teams', {
        userId,
        teamCount: teams.length,
      });

      return teams;
    } catch (error) {
      logger.error('Failed to get user teams:', error);
      throw error;
    }
  }

  /**
   * 邀请用户加入团队
   */
  public async inviteUser(
    teamId: string,
    inviteeEmail: string,
    role: TeamMemberRole,
    inviterId: string,
  ): Promise<void> {
    try {
      // 检查邀请者是否有权限邀请用户
      const isAdmin = await teamDAO.isAdminOrOwner(teamId, inviterId);
      if (!isAdmin) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      // 查找被邀请的用户
      const invitee = await userDAO.findByEmail(inviteeEmail);
      if (!invitee) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // 检查用户是否已经是团队成员
      const isMember = await teamDAO.isMember(teamId, invitee.id);
      if (isMember) {
        throw new AppError('User is already a team member', 409, 'ALREADY_MEMBER');
      }

      // 添加用户到团队
      await teamDAO.addMember({
        teamId,
        userId: invitee.id,
        name: invitee.username, // 或者从用户配置中获取真实姓名
        role,
        status: TeamMemberStatus.ACTIVE,
        invitedBy: inviterId,
      });

      logger.info('User invited to team successfully', {
        teamId,
        inviteeId: invitee.id,
        inviteeEmail,
        role,
        inviterId,
      });

      // TODO: 发送邀请邮件
      // await emailService.sendTeamInvitationEmail(invitee, team, inviter);
    } catch (error) {
      logger.error('Failed to invite user to team:', error);
      throw error;
    }
  }

  /**
   * 获取团队成员列表
   */
  public async getTeamMembers(teamId: string, userId: string): Promise<TeamMember[]> {
    try {
      // 检查用户是否有权限查看成员列表
      const isMember = await teamDAO.isMember(teamId, userId);
      if (!isMember) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      const members = await teamDAO.getMembers(teamId);

      logger.info('Retrieved team members', {
        teamId,
        memberCount: members.length,
        requestedBy: userId,
      });

      return members;
    } catch (error) {
      logger.error('Failed to get team members:', error);
      throw error;
    }
  }

  /**
   * 更新团队成员角色
   */
  public async updateMemberRole(
    teamId: string,
    memberId: string,
    newRole: TeamMemberRole,
    updaterId: string,
  ): Promise<TeamMember> {
    try {
      // 检查更新者是否有权限
      const isAdmin = await teamDAO.isAdminOrOwner(teamId, updaterId);
      if (!isAdmin) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      // 获取当前成员信息
      const currentMember = await teamDAO.getMember(teamId, memberId);
      if (!currentMember) {
        throw new AppError('Team member not found', 404, 'MEMBER_NOT_FOUND');
      }

      // 不能修改团队所有者的角色
      if (currentMember.role === TeamMemberRole.OWNER) {
        throw new AppError('Cannot change owner role', 400, 'INVALID_OPERATION');
      }

      // 只有所有者可以设置管理员
      if (newRole === TeamMemberRole.ADMIN) {
        const team = await teamDAO.findById(teamId);
        if (team?.ownerId !== updaterId) {
          throw new AppError('Only owner can assign admin role', 403, 'ACCESS_DENIED');
        }
      }

      const updatedMember = await teamDAO.updateMember(teamId, memberId, { role: newRole });
      if (!updatedMember) {
        throw new AppError('Failed to update member role', 500, 'UPDATE_FAILED');
      }

      logger.info('Member role updated successfully', {
        teamId,
        memberId,
        oldRole: currentMember.role,
        newRole,
        updatedBy: updaterId,
      });

      return updatedMember;
    } catch (error) {
      logger.error('Failed to update member role:', error);
      throw error;
    }
  }

  /**
   * 移除团队成员
   */
  public async removeMember(teamId: string, memberId: string, removerId: string): Promise<void> {
    try {
      // 检查移除者是否有权限
      const isAdmin = await teamDAO.isAdminOrOwner(teamId, removerId);
      if (!isAdmin && removerId !== memberId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      // 获取被移除成员信息
      const member = await teamDAO.getMember(teamId, memberId);
      if (!member) {
        throw new AppError('Team member not found', 404, 'MEMBER_NOT_FOUND');
      }

      // 不能移除团队所有者
      if (member.role === TeamMemberRole.OWNER) {
        throw new AppError('Cannot remove team owner', 400, 'INVALID_OPERATION');
      }

      const removed = await teamDAO.removeMember(teamId, memberId);
      if (!removed) {
        throw new AppError('Failed to remove member', 500, 'REMOVE_FAILED');
      }

      logger.info('Member removed from team successfully', {
        teamId,
        memberId,
        memberRole: member.role,
        removedBy: removerId,
      });
    } catch (error) {
      logger.error('Failed to remove team member:', error);
      throw error;
    }
  }

  /**
   * 离开团队
   */
  public async leaveTeam(teamId: string, userId: string): Promise<void> {
    try {
      const member = await teamDAO.getMember(teamId, userId);
      if (!member) {
        throw new AppError('You are not a member of this team', 404, 'NOT_MEMBER');
      }

      // 团队所有者不能直接离开团队，需要先转移所有权
      if (member.role === TeamMemberRole.OWNER) {
        throw new AppError('Team owner cannot leave. Transfer ownership first.', 400, 'INVALID_OPERATION');
      }

      await this.removeMember(teamId, userId, userId);

      logger.info('User left team successfully', {
        teamId,
        userId,
      });
    } catch (error) {
      logger.error('Failed to leave team:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const teamService = new TeamService();
