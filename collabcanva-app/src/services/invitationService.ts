// InvitationService for project invitation management
// Handles invitation creation, email notifications, and invitation tracking

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { ProjectInvitation, ProjectRole, Project } from '../types';

// Service configuration
const INVITATION_CONFIG = {
  EXPIRY_DAYS: 7,
  MAX_INVITATIONS_PER_PROJECT: 50,
  MAX_INVITATIONS_PER_USER: 100,
  EMAIL_TEMPLATES: {
    INVITATION: 'project_invitation',
    REMINDER: 'invitation_reminder',
    EXPIRED: 'invitation_expired'
  }
};

// Email notification service interface
interface EmailService {
  sendInvitationEmail: (invitation: ProjectInvitation, project: Project) => Promise<void>;
  sendReminderEmail: (invitation: ProjectInvitation, project: Project) => Promise<void>;
  sendExpiredEmail: (invitation: ProjectInvitation, project: Project) => Promise<void>;
}

// Custom error classes
export class InvitationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'InvitationError';
  }
}

export class EmailServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

// Main InvitationService class
export class InvitationService {
  private emailService: EmailService;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  // Create a new project invitation
  async createInvitation(
    projectId: string,
    email: string,
    role: ProjectRole,
    inviterId: string,
    inviterName: string,
    message?: string
  ): Promise<ProjectInvitation> {
    try {
      // Validate inputs
      this.validateInvitationInputs(projectId, email, role, inviterId);

      // Check if user is already a member
      await this.checkExistingMembership(projectId, email);

      // Check if invitation already exists
      await this.checkExistingInvitation(projectId, email);

      // Check invitation limits
      await this.checkInvitationLimits(projectId, email);

      // Get project details
      const project = await this.getProject(projectId);
      if (!project) {
        throw new InvitationError('Project not found', 'PROJECT_NOT_FOUND');
      }

      // Create invitation
      const invitationData = {
        projectId,
        email: email.toLowerCase().trim(),
        role,
        message: message || '',
        inviterId,
        inviterName,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + (INVITATION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000)),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'invitations'), invitationData);

      // Create invitation object
      const invitation: ProjectInvitation = {
        id: docRef.id,
        projectId,
        projectName: project?.name || 'Unknown Project',
        email: email.toLowerCase().trim(),
        inviteeEmail: email.toLowerCase().trim(),
        role,
        message: message || '',
        inviterId,
        inviterName,
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + (INVITATION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      };

      // Send email notification
      try {
        await this.emailService.sendInvitationEmail(invitation, project);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }

      return invitation;

    } catch (error) {
      console.error('Failed to create invitation:', error);
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError('Failed to create invitation', 'CREATE_FAILED');
    }
  }

  // Get invitation by ID
  async getInvitation(invitationId: string): Promise<ProjectInvitation | null> {
    try {
      const docRef = doc(db, 'invitations', invitationId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreInvitation(data, invitationId);

    } catch (error) {
      console.error('Failed to get invitation:', error);
      throw new InvitationError('Failed to get invitation', 'GET_FAILED');
    }
  }

  // Get invitations by project
  async getProjectInvitations(
    projectId: string,
    status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
  ): Promise<ProjectInvitation[]> {
    try {
      let q = query(
        collection(db, 'invitations'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const querySnapshot = await getDocs(q);
      const invitations: ProjectInvitation[] = [];

      querySnapshot.forEach((doc) => {
        const invitation = this.convertFirestoreInvitation(doc.data(), doc.id);
        if (invitation) {
          invitations.push(invitation);
        }
      });

      return invitations;

    } catch (error) {
      console.error('Failed to get project invitations:', error);
      throw new InvitationError('Failed to get project invitations', 'GET_FAILED');
    }
  }

  // Get invitations by email
  async getUserInvitations(email: string): Promise<ProjectInvitation[]> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('email', '==', email.toLowerCase().trim()),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const invitations: ProjectInvitation[] = [];

      querySnapshot.forEach((doc) => {
        const invitation = this.convertFirestoreInvitation(doc.data(), doc.id);
        if (invitation) {
          invitations.push(invitation);
        }
      });

      return invitations;

    } catch (error) {
      console.error('Failed to get user invitations:', error);
      throw new InvitationError('Failed to get user invitations', 'GET_FAILED');
    }
  }

  // Accept invitation
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new InvitationError('Invitation not found', 'INVITATION_NOT_FOUND');
      }

      if (invitation.status !== 'pending') {
        throw new InvitationError('Invitation is not pending', 'INVALID_STATUS');
      }

      if (invitation.expiresAt <= Date.now()) {
        throw new InvitationError('Invitation has expired', 'INVITATION_EXPIRED');
      }

      // Update invitation status
      await this.updateInvitationStatus(invitationId, 'accepted');

      // Add user to project members
      await this.addUserToProject(invitation.projectId, userId, invitation.email, invitation.role);

    } catch (error) {
      console.error('Failed to accept invitation:', error);
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError('Failed to accept invitation', 'ACCEPT_FAILED');
    }
  }

  // Decline invitation
  async declineInvitation(invitationId: string): Promise<void> {
    try {
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new InvitationError('Invitation not found', 'INVITATION_NOT_FOUND');
      }

      if (invitation.status !== 'pending') {
        throw new InvitationError('Invitation is not pending', 'INVALID_STATUS');
      }

      await this.updateInvitationStatus(invitationId, 'cancelled');

    } catch (error) {
      console.error('Failed to decline invitation:', error);
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError('Failed to decline invitation', 'DECLINE_FAILED');
    }
  }

  // Cancel invitation
  async cancelInvitation(invitationId: string, cancellerId: string): Promise<void> {
    try {
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new InvitationError('Invitation not found', 'INVITATION_NOT_FOUND');
      }

      // Check if user has permission to cancel
      await this.checkCancelPermission(invitation.projectId, cancellerId);

      await this.updateInvitationStatus(invitationId, 'cancelled');

    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError('Failed to cancel invitation', 'CANCEL_FAILED');
    }
  }

  // Resend invitation
  async resendInvitation(invitationId: string, resenderId: string): Promise<void> {
    try {
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new InvitationError('Invitation not found', 'INVITATION_NOT_FOUND');
      }

      // Check if user has permission to resend
      await this.checkResendPermission(invitation.projectId, resenderId);

      if (invitation.status !== 'pending') {
        throw new InvitationError('Can only resend pending invitations', 'INVALID_STATUS');
      }

      // Extend expiry date
      const newExpiryDate = new Date(Date.now() + (INVITATION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000));
      
      const docRef = doc(db, 'invitations', invitationId);
      await updateDoc(docRef, {
        expiresAt: newExpiryDate,
        updatedAt: serverTimestamp()
      });

      // Get project details
      const project = await this.getProject(invitation.projectId);
      if (!project) {
        throw new InvitationError('Project not found', 'PROJECT_NOT_FOUND');
      }

      // Send reminder email
      try {
        await this.emailService.sendReminderEmail(invitation, project);
      } catch (emailError) {
        console.error('Failed to send reminder email:', emailError);
        // Don't fail the resend if email fails
      }

    } catch (error) {
      console.error('Failed to resend invitation:', error);
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError('Failed to resend invitation', 'RESEND_FAILED');
    }
  }

  // Clean up expired invitations
  async cleanupExpiredInvitations(): Promise<number> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('status', '==', 'pending'),
        where('expiresAt', '<=', new Date())
      );

      const querySnapshot = await getDocs(q);
      let cleanedCount = 0;

      for (const docSnap of querySnapshot.docs) {
        const invitation = this.convertFirestoreInvitation(docSnap.data(), docSnap.id);
        if (invitation) {
          // Update status to expired
          await this.updateInvitationStatus(docSnap.id, 'expired');

          // Send expired email notification
          try {
            const project = await this.getProject(invitation.projectId);
            if (project) {
              await this.emailService.sendExpiredEmail(invitation, project);
            }
          } catch (emailError) {
            console.error('Failed to send expired email:', emailError);
          }

          cleanedCount++;
        }
      }

      return cleanedCount;

    } catch (error) {
      console.error('Failed to cleanup expired invitations:', error);
      throw new InvitationError('Failed to cleanup expired invitations', 'CLEANUP_FAILED');
    }
  }

  // Get invitation statistics
  async getInvitationStats(projectId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
  }> {
    try {
      const invitations = await this.getProjectInvitations(projectId);
      
      const stats = {
        total: invitations.length,
        pending: 0,
        accepted: 0,
        expired: 0,
        cancelled: 0
      };

      invitations.forEach(invitation => {
        if (invitation.status === 'pending' && invitation.expiresAt <= Date.now()) {
          stats.expired++;
        } else {
          stats[invitation.status]++;
        }
      });

      return stats;

    } catch (error) {
      console.error('Failed to get invitation stats:', error);
      throw new InvitationError('Failed to get invitation stats', 'STATS_FAILED');
    }
  }

  // Private helper methods
  private validateInvitationInputs(
    projectId: string,
    email: string,
    role: ProjectRole,
    inviterId: string
  ): void {
    if (!projectId || !email || !role || !inviterId) {
      throw new InvitationError('Missing required fields', 'MISSING_FIELDS');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvitationError('Invalid email format', 'INVALID_EMAIL');
    }

    const validRoles: ProjectRole[] = ['owner', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new InvitationError('Invalid role', 'INVALID_ROLE');
    }
  }

  private async checkExistingMembership(projectId: string, email: string): Promise<void> {
    // This would check if the user is already a member of the project
    // Implementation depends on your project structure
    // For now, we'll assume this check is handled elsewhere
  }

  private async checkExistingInvitation(projectId: string, email: string): Promise<void> {
    const q = query(
      collection(db, 'invitations'),
      where('projectId', '==', projectId),
      where('email', '==', email.toLowerCase().trim()),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new InvitationError('Invitation already exists', 'INVITATION_EXISTS');
    }
  }

  private async checkInvitationLimits(projectId: string, email: string): Promise<void> {
    // Check project invitation limit
    const projectInvitations = await this.getProjectInvitations(projectId, 'pending');
    if (projectInvitations.length >= INVITATION_CONFIG.MAX_INVITATIONS_PER_PROJECT) {
      throw new InvitationError('Project invitation limit reached', 'PROJECT_LIMIT_REACHED');
    }

    // Check user invitation limit
    const userInvitations = await this.getUserInvitations(email);
    const pendingUserInvitations = userInvitations.filter(inv => inv.status === 'pending');
    if (pendingUserInvitations.length >= INVITATION_CONFIG.MAX_INVITATIONS_PER_USER) {
      throw new InvitationError('User invitation limit reached', 'USER_LIMIT_REACHED');
    }
  }

  private async getProject(projectId: string): Promise<Project | null> {
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data
      } as Project;

    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  private async updateInvitationStatus(invitationId: string, status: string): Promise<void> {
    const docRef = doc(db, 'invitations', invitationId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  }

  private async addUserToProject(
    projectId: string,
    userId: string,
    email: string,
    role: ProjectRole
  ): Promise<void> {
    // This would add the user to the project members
    // Implementation depends on your project structure
    // For now, we'll assume this is handled elsewhere
  }

  private async checkCancelPermission(projectId: string, userId: string): Promise<void> {
    // This would check if the user has permission to cancel invitations
    // Implementation depends on your project structure
    // For now, we'll assume this is handled elsewhere
  }

  private async checkResendPermission(projectId: string, userId: string): Promise<void> {
    // This would check if the user has permission to resend invitations
    // Implementation depends on your project structure
    // For now, we'll assume this is handled elsewhere
  }

  private convertFirestoreInvitation(data: any, id: string): ProjectInvitation | null {
    try {
      return {
        id,
        projectId: data.projectId,
        projectName: data.projectName || 'Unknown Project',
        email: data.email,
        inviteeEmail: data.email,
        role: data.role,
        message: data.message || '',
        inviterId: data.inviterId,
        inviterName: data.inviterName,
        status: data.status,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        expiresAt: data.expiresAt?.toMillis() || Date.now()
      };
    } catch (error) {
      console.error('Failed to convert Firestore invitation:', error);
      return null;
    }
  }
}

// Email service implementation (placeholder)
export class MockEmailService implements EmailService {
  async sendInvitationEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    console.log('Sending invitation email:', {
      to: invitation.email,
      project: project.name,
      role: invitation.role,
      inviter: invitation.inviterName
    });
    
    // In a real implementation, this would send an actual email
    // For now, we'll just log the details
  }

  async sendReminderEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    console.log('Sending reminder email:', {
      to: invitation.email,
      project: project.name,
      role: invitation.role
    });
  }

  async sendExpiredEmail(invitation: ProjectInvitation, project: Project): Promise<void> {
    console.log('Sending expired email:', {
      to: invitation.email,
      project: project.name
    });
  }
}

// Export singleton instance
export const invitationService = new InvitationService(new MockEmailService());
