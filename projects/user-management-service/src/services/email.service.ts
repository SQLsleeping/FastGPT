import nodemailer from 'nodemailer';
import { BaseService } from './base.service';
import { config } from '../config';
import { logger } from '../utils';
import { User } from '../types';

/**
 * 邮件服务
 * 处理邮件发送、模板渲染等功能
 */
export class EmailService extends BaseService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    super();
    this.initializeTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.password,
        },
        tls: {
          rejectUnauthorized: false, // 开发环境可以设置为false
        },
      });

      // 验证连接
      this.transporter.verify((error, _success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
        } else {
          logger.info('Email transporter is ready to send emails');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  /**
   * 发送邮箱验证邮件
   */
  public async sendVerificationEmail(user: User, verificationToken: string): Promise<void> {
    try {
      const verificationUrl = `${config.app.baseUrl}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: '验证您的邮箱地址 - FastGPT',
        html: this.generateVerificationEmailTemplate(user, verificationUrl),
        text: this.generateVerificationEmailText(user, verificationUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${user.email}:`, result.messageId);
    } catch (error) {
      logger.error(`Failed to send verification email to ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * 发送密码重置邮件
   */
  public async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${config.app.baseUrl}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: '重置您的密码 - FastGPT',
        html: this.generatePasswordResetEmailTemplate(user, resetUrl),
        text: this.generatePasswordResetEmailText(user, resetUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${user.email}:`, result.messageId);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * 发送欢迎邮件
   */
  public async sendWelcomeEmail(user: User, temporaryPassword?: string): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: '欢迎加入 FastGPT！',
        html: this.generateWelcomeEmailTemplate(user, temporaryPassword),
        text: this.generateWelcomeEmailText(user, temporaryPassword),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${user.email}:`, result.messageId);
    } catch (error) {
      logger.error(`Failed to send welcome email to ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * 发送企业验证邮件
   */
  public async sendEnterpriseVerificationEmail(
    email: string,
    enterpriseName: string,
    verificationToken: string,
  ): Promise<void> {
    try {
      const verificationUrl = `${config.app.baseUrl}/enterprise/verify?token=${verificationToken}`;

      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: `企业账户验证 - ${enterpriseName}`,
        html: this.generateEnterpriseVerificationEmailTemplate(enterpriseName, verificationUrl),
        text: this.generateEnterpriseVerificationEmailText(enterpriseName, verificationUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Enterprise verification email sent to ${email}:`, result.messageId);
    } catch (error) {
      logger.error(`Failed to send enterprise verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * 生成邮箱验证邮件HTML模板
   */
  private generateVerificationEmailTemplate(user: User, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>验证您的邮箱地址</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FastGPT</h1>
          </div>
          <div class="content">
            <h2>验证您的邮箱地址</h2>
            <p>您好 ${user.username}，</p>
            <p>感谢您注册 FastGPT！请点击下面的按钮验证您的邮箱地址：</p>
            <a href="${verificationUrl}" class="button">验证邮箱</a>
            <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>此链接将在24小时后过期。</p>
            <p>如果您没有注册 FastGPT 账户，请忽略此邮件。</p>
          </div>
          <div class="footer">
            <p>© 2024 FastGPT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成邮箱验证邮件纯文本版本
   */
  private generateVerificationEmailText(user: User, verificationUrl: string): string {
    return `
验证您的邮箱地址

您好 ${user.username}，

感谢您注册 FastGPT！请访问以下链接验证您的邮箱地址：

${verificationUrl}

此链接将在24小时后过期。

如果您没有注册 FastGPT 账户，请忽略此邮件。

© 2024 FastGPT. All rights reserved.
    `;
  }

  /**
   * 生成密码重置邮件HTML模板
   */
  private generatePasswordResetEmailTemplate(user: User, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>重置您的密码</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FastGPT</h1>
          </div>
          <div class="content">
            <h2>重置您的密码</h2>
            <p>您好 ${user.username}，</p>
            <p>我们收到了重置您账户密码的请求。请点击下面的按钮重置密码：</p>
            <a href="${resetUrl}" class="button">重置密码</a>
            <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <strong>安全提醒：</strong>
              <ul>
                <li>此链接将在1小时后过期</li>
                <li>如果您没有请求重置密码，请忽略此邮件</li>
                <li>请不要将此链接分享给他人</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 FastGPT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成密码重置邮件纯文本版本
   */
  private generatePasswordResetEmailText(user: User, resetUrl: string): string {
    return `
重置您的密码

您好 ${user.username}，

我们收到了重置您账户密码的请求。请访问以下链接重置密码：

${resetUrl}

安全提醒：
- 此链接将在1小时后过期
- 如果您没有请求重置密码，请忽略此邮件
- 请不要将此链接分享给他人

© 2024 FastGPT. All rights reserved.
    `;
  }

  /**
   * 生成欢迎邮件HTML模板
   */
  private generateWelcomeEmailTemplate(user: User, temporaryPassword?: string): string {
    const passwordSection = temporaryPassword
      ? `
      <div class="warning">
        <strong>临时密码：</strong> ${temporaryPassword}
        <br>
        <small>请在首次登录后立即更改密码</small>
      </div>
    `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>欢迎加入 FastGPT</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>欢迎加入 FastGPT！</h1>
          </div>
          <div class="content">
            <h2>您好 ${user.username}，</h2>
            <p>欢迎加入 FastGPT 大家庭！我们很高兴您选择了我们的平台。</p>
            ${passwordSection}
            <p>您现在可以开始使用 FastGPT 的强大功能：</p>
            <ul>
              <li>智能对话助手</li>
              <li>知识库管理</li>
              <li>工作流自动化</li>
              <li>团队协作功能</li>
            </ul>
            <a href="${config.app.baseUrl}/login" class="button">立即开始</a>
            <p>如果您有任何问题，请随时联系我们的支持团队。</p>
          </div>
          <div class="footer">
            <p>© 2024 FastGPT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成欢迎邮件纯文本版本
   */
  private generateWelcomeEmailText(user: User, temporaryPassword?: string): string {
    const passwordSection = temporaryPassword
      ? `
临时密码：${temporaryPassword}
请在首次登录后立即更改密码

`
      : '';

    return `
欢迎加入 FastGPT！

您好 ${user.username}，

欢迎加入 FastGPT 大家庭！我们很高兴您选择了我们的平台。

${passwordSection}您现在可以开始使用 FastGPT 的强大功能：
- 智能对话助手
- 知识库管理
- 工作流自动化
- 团队协作功能

立即开始：${config.app.baseUrl}/login

如果您有任何问题，请随时联系我们的支持团队。

© 2024 FastGPT. All rights reserved.
    `;
  }

  /**
   * 生成企业验证邮件HTML模板
   */
  private generateEnterpriseVerificationEmailTemplate(enterpriseName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>企业账户验证</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FastGPT 企业版</h1>
          </div>
          <div class="content">
            <h2>企业账户验证</h2>
            <p>您好，</p>
            <p>感谢您为 <strong>${enterpriseName}</strong> 注册 FastGPT 企业账户！</p>
            <p>请点击下面的按钮验证您的企业账户：</p>
            <a href="${verificationUrl}" class="button">验证企业账户</a>
            <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>验证完成后，您将能够：</p>
            <ul>
              <li>管理企业用户和权限</li>
              <li>配置企业级安全设置</li>
              <li>访问高级分析和报告</li>
              <li>享受优先技术支持</li>
            </ul>
            <p>此链接将在48小时后过期。</p>
          </div>
          <div class="footer">
            <p>© 2024 FastGPT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成企业验证邮件纯文本版本
   */
  private generateEnterpriseVerificationEmailText(enterpriseName: string, verificationUrl: string): string {
    return `
企业账户验证

您好，

感谢您为 ${enterpriseName} 注册 FastGPT 企业账户！

请访问以下链接验证您的企业账户：

${verificationUrl}

验证完成后，您将能够：
- 管理企业用户和权限
- 配置企业级安全设置
- 访问高级分析和报告
- 享受优先技术支持

此链接将在48小时后过期。

© 2024 FastGPT. All rights reserved.
    `;
  }

  /**
   * 测试邮件连接
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection test successful');
      return true;
    } catch (error) {
      logger.error('Email service connection test failed:', error);
      return false;
    }
  }

  /**
   * 发送测试邮件
   */
  public async sendTestEmail(to: string): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject: 'FastGPT 邮件服务测试',
        html: `
          <h2>邮件服务测试</h2>
          <p>如果您收到这封邮件，说明 FastGPT 邮件服务配置正确。</p>
          <p>发送时间：${new Date().toLocaleString()}</p>
        `,
        text: `
邮件服务测试

如果您收到这封邮件，说明 FastGPT 邮件服务配置正确。

发送时间：${new Date().toLocaleString()}
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Test email sent to ${to}:`, result.messageId);
    } catch (error) {
      logger.error(`Failed to send test email to ${to}:`, error);
      throw error;
    }
  }
}

// 导出单例实例
export const emailService = new EmailService();
