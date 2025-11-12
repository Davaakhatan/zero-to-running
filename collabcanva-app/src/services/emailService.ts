// EmailService for sending project invitation notifications
// Handles email templates and delivery for invitation system

import { ProjectInvitation, Project } from '../types';

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email service configuration
const EMAIL_CONFIG = {
  FROM_EMAIL: 'noreply@collabcanvas.com',
  FROM_NAME: 'CollabCanvas',
  REPLY_TO: 'support@collabcanvas.com',
  BASE_URL: process.env.REACT_APP_BASE_URL || 'http://localhost:3000',
  INVITATION_EXPIRY_DAYS: 7
};

// Email service interface
export interface EmailService {
  sendInvitationEmail: (invitation: ProjectInvitation, project: Project) => Promise<void>;
  sendReminderEmail: (invitation: ProjectInvitation, project: Project) => Promise<void>;
  sendExpiredEmail: (invitation: ProjectInvitation, project: Project) => Promise<void>;
  sendWelcomeEmail: (userEmail: string, project: Project, role: string) => Promise<void>;
  sendTransferRequestEmail: (transfer: any, project: Project) => Promise<void>;
  sendTransferStatusEmail: (transfer: any, status: string) => Promise<void>;
}

// Custom error class
export class EmailServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

// Email template generator
class EmailTemplateGenerator {
  // Generate invitation email template
  static generateInvitationTemplate(
    invitation: ProjectInvitation, 
    project: Project
  ): EmailTemplate {
    const acceptUrl = `${EMAIL_CONFIG.BASE_URL}/invitations/${invitation.id}/accept`;
    const declineUrl = `${EMAIL_CONFIG.BASE_URL}/invitations/${invitation.id}/decline`;
    const projectUrl = `${EMAIL_CONFIG.BASE_URL}/projects/${project.id}`;
    
    const roleDisplayName = this.getRoleDisplayName(invitation.role);
    const expiryDate = new Date(invitation.expiresAt).toLocaleDateString();
    
    const subject = `You're invited to collaborate on "${project.name}"`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
            .button.accept { background: #28a745; }
            .button.decline { background: #dc3545; }
            .button:hover { opacity: 0.9; }
            .project-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .role-badge { display: inline-block; padding: 4px 12px; background: #e3f2fd; color: #1976d2; border-radius: 20px; font-size: 14px; font-weight: 600; }
            .expiry-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .divider { height: 1px; background: #e1e5e9; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎨 CollabCanvas</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Collaborative Design Platform</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">You're invited to collaborate!</h2>
              
              <p>Hi there!</p>
              
              <p><strong>${invitation.inviterName}</strong> has invited you to collaborate on a project in CollabCanvas.</p>
              
              <div class="project-info">
                <h3 style="margin-top: 0; color: #333;">📁 ${project.name}</h3>
                ${project.description ? `<p style="margin: 10px 0; color: #666;">${project.description}</p>` : ''}
                <p style="margin: 10px 0;">
                  <strong>Your role:</strong> <span class="role-badge">${roleDisplayName}</span>
                </p>
                ${invitation.message ? `<p style="margin: 10px 0; font-style: italic; color: #666;">"${invitation.message}"</p>` : ''}
              </div>
              
              <div class="expiry-notice">
                <strong>⏰ This invitation expires on ${expiryDate}</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Please respond before the expiry date to join the project.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" class="button accept">✅ Accept Invitation</a>
                <a href="${declineUrl}" class="button decline">❌ Decline</a>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 14px; color: #666;">
                <strong>What happens next?</strong><br>
                • Click "Accept" to join the project and start collaborating<br>
                • You'll be able to access the project at: <a href="${projectUrl}">${projectUrl}</a><br>
                • If you don't have an account, we'll help you create one
              </p>
              
              <p style="font-size: 14px; color: #666;">
                <strong>Need help?</strong> Reply to this email or contact our support team.
              </p>
            </div>
            
            <div class="footer">
              <p>This invitation was sent by ${invitation.inviterName} (${invitation.inviterId})</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>&copy; 2024 CollabCanvas. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
      You're invited to collaborate on "${project.name}"
      
      Hi there!
      
      ${invitation.inviterName} has invited you to collaborate on a project in CollabCanvas.
      
      Project: ${project.name}
      ${project.description ? `Description: ${project.description}` : ''}
      Your role: ${roleDisplayName}
      ${invitation.message ? `Message: "${invitation.message}"` : ''}
      
      This invitation expires on ${expiryDate}. Please respond before the expiry date to join the project.
      
      Accept invitation: ${acceptUrl}
      Decline invitation: ${declineUrl}
      
      What happens next?
      • Click "Accept" to join the project and start collaborating
      • You'll be able to access the project at: ${projectUrl}
      • If you don't have an account, we'll help you create one
      
      Need help? Reply to this email or contact our support team.
      
      This invitation was sent by ${invitation.inviterName} (${invitation.inviterId})
      If you didn't expect this invitation, you can safely ignore this email.
      
      © 2024 CollabCanvas. All rights reserved.
    `;
    
    return { subject, html, text };
  }

  // Generate reminder email template
  static generateReminderTemplate(
    invitation: ProjectInvitation, 
    project: Project
  ): EmailTemplate {
    const acceptUrl = `${EMAIL_CONFIG.BASE_URL}/invitations/${invitation.id}/accept`;
    const declineUrl = `${EMAIL_CONFIG.BASE_URL}/invitations/${invitation.id}/decline`;
    const projectUrl = `${EMAIL_CONFIG.BASE_URL}/projects/${project.id}`;
    
    const roleDisplayName = this.getRoleDisplayName(invitation.role);
    const expiryDate = new Date(invitation.expiresAt).toLocaleDateString();
    const daysLeft = Math.ceil((invitation.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    
    const subject = `Reminder: You're invited to collaborate on "${project.name}"`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
            .button.accept { background: #28a745; }
            .button.decline { background: #dc3545; }
            .button:hover { opacity: 0.9; }
            .project-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .role-badge { display: inline-block; padding: 4px 12px; background: #e3f2fd; color: #1976d2; border-radius: 20px; font-size: 14px; font-weight: 600; }
            .urgent-notice { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">⏰ Reminder</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">CollabCanvas Invitation</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Don't miss out on this collaboration!</h2>
              
              <p>Hi there!</p>
              
              <p>This is a friendly reminder that <strong>${invitation.inviterName}</strong> invited you to collaborate on a project in CollabCanvas.</p>
              
              <div class="project-info">
                <h3 style="margin-top: 0; color: #333;">📁 ${project.name}</h3>
                ${project.description ? `<p style="margin: 10px 0; color: #666;">${project.description}</p>` : ''}
                <p style="margin: 10px 0;">
                  <strong>Your role:</strong> <span class="role-badge">${roleDisplayName}</span>
                </p>
              </div>
              
              <div class="urgent-notice">
                <strong>⏰ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left!</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">This invitation expires on ${expiryDate}. Don't miss out!</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" class="button accept">✅ Accept Invitation</a>
                <a href="${declineUrl}" class="button decline">❌ Decline</a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                <strong>Ready to collaborate?</strong> Click "Accept" to join the project and start working with your team.
              </p>
            </div>
            
            <div class="footer">
              <p>This reminder was sent for an invitation from ${invitation.inviterName}</p>
              <p>If you don't want to receive reminders, you can decline the invitation.</p>
              <p>&copy; 2024 CollabCanvas. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
      Reminder: You're invited to collaborate on "${project.name}"
      
      Hi there!
      
      This is a friendly reminder that ${invitation.inviterName} invited you to collaborate on a project in CollabCanvas.
      
      Project: ${project.name}
      ${project.description ? `Description: ${project.description}` : ''}
      Your role: ${roleDisplayName}
      
      ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left! This invitation expires on ${expiryDate}. Don't miss out!
      
      Accept invitation: ${acceptUrl}
      Decline invitation: ${declineUrl}
      
      Ready to collaborate? Click "Accept" to join the project and start working with your team.
      
      This reminder was sent for an invitation from ${invitation.inviterName}
      If you don't want to receive reminders, you can decline the invitation.
      
      © 2024 CollabCanvas. All rights reserved.
    `;
    
    return { subject, html, text };
  }

  // Generate expired email template
  static generateExpiredTemplate(
    invitation: ProjectInvitation, 
    project: Project
  ): EmailTemplate {
    const projectUrl = `${EMAIL_CONFIG.BASE_URL}/projects/${project.id}`;
    const contactUrl = `${EMAIL_CONFIG.BASE_URL}/contact`;
    
    const subject = `Invitation expired: "${project.name}"`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
            .button:hover { opacity: 0.9; }
            .project-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .expired-notice { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">⏰ Invitation Expired</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">CollabCanvas</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Your invitation has expired</h2>
              
              <p>Hi there!</p>
              
              <p>We wanted to let you know that your invitation to collaborate on a project in CollabCanvas has expired.</p>
              
              <div class="project-info">
                <h3 style="margin-top: 0; color: #333;">📁 ${project.name}</h3>
                ${project.description ? `<p style="margin: 10px 0; color: #666;">${project.description}</p>` : ''}
                <p style="margin: 10px 0; color: #666;">
                  <strong>Invited by:</strong> ${invitation.inviterName}
                </p>
              </div>
              
              <div class="expired-notice">
                <strong>⏰ This invitation expired on ${new Date(invitation.expiresAt).toLocaleDateString()}</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Invitations are valid for 7 days from the date they were sent.</p>
              </div>
              
              <p>Don't worry! If you're still interested in collaborating on this project, you can:</p>
              <ul>
                <li>Contact <strong>${invitation.inviterName}</strong> directly to request a new invitation</li>
                <li>Visit the project page to learn more: <a href="${projectUrl}">${projectUrl}</a></li>
                <li>Contact our support team if you need assistance: <a href="${contactUrl}">${contactUrl}</a></li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${projectUrl}" class="button">View Project</a>
                <a href="${contactUrl}" class="button">Contact Support</a>
              </div>
            </div>
            
            <div class="footer">
              <p>This notification was sent because your invitation expired</p>
              <p>If you have any questions, please contact our support team.</p>
              <p>&copy; 2024 CollabCanvas. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
      Invitation expired: "${project.name}"
      
      Hi there!
      
      We wanted to let you know that your invitation to collaborate on a project in CollabCanvas has expired.
      
      Project: ${project.name}
      ${project.description ? `Description: ${project.description}` : ''}
      Invited by: ${invitation.inviterName}
      
      This invitation expired on ${new Date(invitation.expiresAt).toLocaleDateString()}
      Invitations are valid for 7 days from the date they were sent.
      
      Don't worry! If you're still interested in collaborating on this project, you can:
      • Contact ${invitation.inviterName} directly to request a new invitation
      • Visit the project page to learn more: ${projectUrl}
      • Contact our support team if you need assistance: ${contactUrl}
      
      This notification was sent because your invitation expired
      If you have any questions, please contact our support team.
      
      © 2024 CollabCanvas. All rights reserved.
    `;
    
    return { subject, html, text };
  }

  // Generate welcome email template
  static generateWelcomeTemplate(
    userEmail: string,
    project: Project,
    role: string
  ): EmailTemplate {
    const projectUrl = `${EMAIL_CONFIG.BASE_URL}/projects/${project.id}`;
    const dashboardUrl = `${EMAIL_CONFIG.BASE_URL}/dashboard`;
    
    const roleDisplayName = this.getRoleDisplayName(role as any);
    
    const subject = `Welcome to "${project.name}" on CollabCanvas!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
            .button:hover { opacity: 0.9; }
            .project-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .role-badge { display: inline-block; padding: 4px 12px; background: #e3f2fd; color: #1976d2; border-radius: 20px; font-size: 14px; font-weight: 600; }
            .welcome-notice { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 Welcome!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">You're now part of the team</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Welcome to CollabCanvas!</h2>
              
              <p>Hi there!</p>
              
              <p>Great news! You've successfully joined the project and are now part of the team.</p>
              
              <div class="welcome-notice">
                <strong>🎉 You're now a ${roleDisplayName} on "${project.name}"!</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">You can start collaborating right away.</p>
              </div>
              
              <div class="project-info">
                <h3 style="margin-top: 0; color: #333;">📁 ${project.name}</h3>
                ${project.description ? `<p style="margin: 10px 0; color: #666;">${project.description}</p>` : ''}
                <p style="margin: 10px 0;">
                  <strong>Your role:</strong> <span class="role-badge">${roleDisplayName}</span>
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${projectUrl}" class="button">🚀 Open Project</a>
                <a href="${dashboardUrl}" class="button">📊 View Dashboard</a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                <strong>What's next?</strong><br>
                • Explore the project and get familiar with the content<br>
                • Check out the team members and their roles<br>
                • Start collaborating based on your permissions<br>
                • Need help? Check out our documentation or contact support
              </p>
            </div>
            
            <div class="footer">
              <p>Welcome to the CollabCanvas community!</p>
              <p>If you have any questions, don't hesitate to reach out to our support team.</p>
              <p>&copy; 2024 CollabCanvas. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
      Welcome to "${project.name}" on CollabCanvas!
      
      Hi there!
      
      Great news! You've successfully joined the project and are now part of the team.
      
      You're now a ${roleDisplayName} on "${project.name}"!
      You can start collaborating right away.
      
      Project: ${project.name}
      ${project.description ? `Description: ${project.description}` : ''}
      Your role: ${roleDisplayName}
      
      Open project: ${projectUrl}
      View dashboard: ${dashboardUrl}
      
      What's next?
      • Explore the project and get familiar with the content
      • Check out the team members and their roles
      • Start collaborating based on your permissions
      • Need help? Check out our documentation or contact support
      
      Welcome to the CollabCanvas community!
      If you have any questions, don't hesitate to reach out to our support team.
      
      © 2024 CollabCanvas. All rights reserved.
    `;
    
    return { subject, html, text };
  }

  // Get role display name
  private static getRoleDisplayName(role: string): string {
    const roleMap: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      editor: 'Editor',
      viewer: 'Viewer'
    };
    return roleMap[role] || role;
  }
}

// Mock email service implementation
export class MockEmailService implements EmailService {
  async sendInvitationEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    const template = EmailTemplateGenerator.generateInvitationTemplate(invitation, project);
    
    console.log('📧 Sending invitation email:', {
      to: invitation.email,
      subject: template.subject,
      project: project.name,
      role: invitation.role,
      inviter: invitation.inviterName
    });
    
    // In a real implementation, this would send an actual email
    // For now, we'll just log the details
    console.log('Email template:', template);
  }

  async sendReminderEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    const template = EmailTemplateGenerator.generateReminderTemplate(invitation, project);
    
    console.log('📧 Sending reminder email:', {
      to: invitation.email,
      subject: template.subject,
      project: project.name
    });
    
    console.log('Email template:', template);
  }

  async sendExpiredEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    const template = EmailTemplateGenerator.generateExpiredTemplate(invitation, project);
    
    console.log('📧 Sending expired email:', {
      to: invitation.email,
      subject: template.subject,
      project: project.name
    });
    
    console.log('Email template:', template);
  }

  async sendWelcomeEmail(userEmail: string, project: Project, role: string): Promise<void> {
    const template = EmailTemplateGenerator.generateWelcomeTemplate(userEmail, project, role);
    
    console.log('📧 Sending welcome email:', {
      to: userEmail,
      subject: template.subject,
      project: project.name,
      role: role
    });
    
    console.log('Email template:', template);
  }

  async sendTransferRequestEmail(transfer: any, project: Project): Promise<void> {
    console.log('📧 Sending transfer request email:', {
      to: transfer.toUserEmail,
      subject: `Project Transfer Request: ${project.name}`,
      project: project.name,
      fromUser: transfer.fromUserName
    });
  }

  async sendTransferStatusEmail(transfer: any, status: string): Promise<void> {
    console.log('📧 Sending transfer status email:', {
      to: transfer.fromUserEmail,
      subject: `Project Transfer ${status}`,
      status: status,
      project: transfer.projectName
    });
  }
}

// Real email service implementation (placeholder for production)
export class ProductionEmailService implements EmailService {
  async sendInvitationEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    const template = EmailTemplateGenerator.generateInvitationTemplate(invitation, project);
    
    // In production, this would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Nodemailer with SMTP
    
    throw new EmailServiceError('Production email service not implemented', 'NOT_IMPLEMENTED');
  }

  async sendReminderEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    const template = EmailTemplateGenerator.generateReminderTemplate(invitation, project);
    throw new EmailServiceError('Production email service not implemented', 'NOT_IMPLEMENTED');
  }

  async sendExpiredEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    const template = EmailTemplateGenerator.generateExpiredTemplate(invitation, project);
    throw new EmailServiceError('Production email service not implemented', 'NOT_IMPLEMENTED');
  }

  async sendWelcomeEmail(userEmail: string, project: Project, role: string): Promise<void> {
    const template = EmailTemplateGenerator.generateWelcomeTemplate(userEmail, project, role);
    throw new EmailServiceError('Production email service not implemented', 'NOT_IMPLEMENTED');
  }

  async sendTransferRequestEmail(transfer: any, project: Project): Promise<void> {
    throw new EmailServiceError('Production email service not implemented', 'NOT_IMPLEMENTED');
  }

  async sendTransferStatusEmail(transfer: any, status: string): Promise<void> {
    throw new EmailServiceError('Production email service not implemented', 'NOT_IMPLEMENTED');
  }
}

// Export singleton instance
export const emailService = new MockEmailService();
