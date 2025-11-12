// Unit tests for InvitationService
// Tests for project invitation management and email notifications

import { 
  InvitationService, 
  MockEmailService, 
  InvitationError,
  EmailServiceError 
} from './invitationService';
import { ProjectInvitation, ProjectRole, Project } from '../types';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => ({ toMillis: () => Date.now() })),
  Timestamp: {
    fromDate: jest.fn()
  }
}));

// Mock Firebase database
jest.mock('./firebase', () => ({
  db: {}
}));

describe('InvitationService', () => {
  let invitationService: InvitationService;
  let mockEmailService: MockEmailService;

  const mockProject: Project = {
    id: 'project1',
    name: 'Test Project',
    description: 'A test project',
    ownerId: 'user1',
    members: [],
    settings: {
      isPublic: false,
      allowComments: true,
      allowDownloads: false
    },
    metadata: {
      tags: ['test'],
      category: 'design'
    },
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000
  };

  const mockInvitation: ProjectInvitation = {
    id: 'invitation1',
    projectId: 'project1',
    email: 'user@example.com',
    role: 'editor',
    message: 'Join our project!',
    inviterId: 'user1',
    inviterName: 'User One',
    status: 'pending',
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 604800000, // 7 days
    updatedAt: Date.now() - 3600000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmailService = new MockEmailService();
    invitationService = new InvitationService(mockEmailService);
  });

  describe('createInvitation', () => {
    it('should create invitation successfully', async () => {
      const { addDoc, getDoc } = require('firebase/firestore');
      
      // Mock successful project fetch
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      // Mock successful invitation creation
      addDoc.mockResolvedValue({
        id: 'invitation1'
      });

      // Mock email service
      jest.spyOn(mockEmailService, 'sendInvitationEmail').mockResolvedValue();

      const result = await invitationService.createInvitation(
        'project1',
        'user@example.com',
        'editor',
        'user1',
        'User One',
        'Join our project!'
      );

      expect(result).toEqual({
        id: 'invitation1',
        projectId: 'project1',
        email: 'user@example.com',
        role: 'editor',
        message: 'Join our project!',
        inviterId: 'user1',
        inviterName: 'User One',
        status: 'pending',
        createdAt: expect.any(Number),
        expiresAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });

      expect(addDoc).toHaveBeenCalled();
      expect(mockEmailService.sendInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          role: 'editor'
        }),
        mockProject
      );
    });

    it('should validate email format', async () => {
      await expect(
        invitationService.createInvitation(
          'project1',
          'invalid-email',
          'editor',
          'user1',
          'User One'
        )
      ).rejects.toThrow('Invalid email format');
    });

    it('should validate required fields', async () => {
      await expect(
        invitationService.createInvitation(
          '',
          'user@example.com',
          'editor',
          'user1',
          'User One'
        )
      ).rejects.toThrow('Missing required fields');
    });

    it('should validate role', async () => {
      await expect(
        invitationService.createInvitation(
          'project1',
          'user@example.com',
          'invalid-role' as ProjectRole,
          'user1',
          'User One'
        )
      ).rejects.toThrow('Invalid role');
    });

    it('should handle project not found', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(
        invitationService.createInvitation(
          'nonexistent',
          'user@example.com',
          'editor',
          'user1',
          'User One'
        )
      ).rejects.toThrow('Project not found');
    });

    it('should handle email service failure gracefully', async () => {
      const { addDoc, getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      addDoc.mockResolvedValue({
        id: 'invitation1'
      });

      // Mock email service failure
      jest.spyOn(mockEmailService, 'sendInvitationEmail').mockRejectedValue(
        new Error('Email service unavailable')
      );

      // Should not throw error even if email fails
      const result = await invitationService.createInvitation(
        'project1',
        'user@example.com',
        'editor',
        'user1',
        'User One'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('invitation1');
    });
  });

  describe('getInvitation', () => {
    it('should get invitation by ID', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          projectId: 'project1',
          email: 'user@example.com',
          role: 'editor',
          message: 'Join our project!',
          inviterId: 'user1',
          inviterName: 'User One',
          status: 'pending',
          createdAt: { toMillis: () => Date.now() - 3600000 },
          expiresAt: { toMillis: () => Date.now() + 604800000 },
          updatedAt: { toMillis: () => Date.now() - 3600000 }
        })
      });

      const result = await invitationService.getInvitation('invitation1');

      expect(result).toEqual({
        id: 'invitation1',
        projectId: 'project1',
        email: 'user@example.com',
        role: 'editor',
        message: 'Join our project!',
        inviterId: 'user1',
        inviterName: 'User One',
        status: 'pending',
        createdAt: expect.any(Number),
        expiresAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });
    });

    it('should return null for non-existent invitation', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await invitationService.getInvitation('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getProjectInvitations', () => {
    it('should get project invitations', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            id: 'invitation1',
            data: () => ({
              projectId: 'project1',
              email: 'user@example.com',
              role: 'editor',
              message: 'Join our project!',
              inviterId: 'user1',
              inviterName: 'User One',
              status: 'pending',
              createdAt: { toMillis: () => Date.now() - 3600000 },
              expiresAt: { toMillis: () => Date.now() + 604800000 },
              updatedAt: { toMillis: () => Date.now() - 3600000 }
            })
          });
        }
      });

      const result = await invitationService.getProjectInvitations('project1');

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project1');
    });

    it('should filter by status', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            id: 'invitation1',
            data: () => ({
              projectId: 'project1',
              email: 'user@example.com',
              role: 'editor',
              message: 'Join our project!',
              inviterId: 'user1',
              inviterName: 'User One',
              status: 'pending',
              createdAt: { toMillis: () => Date.now() - 3600000 },
              expiresAt: { toMillis: () => Date.now() + 604800000 },
              updatedAt: { toMillis: () => Date.now() - 3600000 }
            })
          });
        }
      });

      const result = await invitationService.getProjectInvitations('project1', 'pending');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      
      // Mock invitation fetch
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          projectId: 'project1',
          email: 'user@example.com',
          role: 'editor',
          message: 'Join our project!',
          inviterId: 'user1',
          inviterName: 'User One',
          status: 'pending',
          createdAt: { toMillis: () => Date.now() - 3600000 },
          expiresAt: { toMillis: () => Date.now() + 604800000 },
          updatedAt: { toMillis: () => Date.now() - 3600000 }
        })
      });

      updateDoc.mockResolvedValue({});

      await invitationService.acceptInvitation('invitation1', 'user2');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'accepted'
        })
      );
    });

    it('should reject expired invitation', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          projectId: 'project1',
          email: 'user@example.com',
          role: 'editor',
          message: 'Join our project!',
          inviterId: 'user1',
          inviterName: 'User One',
          status: 'pending',
          createdAt: { toMillis: () => Date.now() - 3600000 },
          expiresAt: { toMillis: () => Date.now() - 3600000 }, // Expired
          updatedAt: { toMillis: () => Date.now() - 3600000 }
        })
      });

      await expect(
        invitationService.acceptInvitation('invitation1', 'user2')
      ).rejects.toThrow('Invitation has expired');
    });

    it('should reject non-pending invitation', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          projectId: 'project1',
          email: 'user@example.com',
          role: 'editor',
          message: 'Join our project!',
          inviterId: 'user1',
          inviterName: 'User One',
          status: 'accepted', // Already accepted
          createdAt: { toMillis: () => Date.now() - 3600000 },
          expiresAt: { toMillis: () => Date.now() + 604800000 },
          updatedAt: { toMillis: () => Date.now() - 3600000 }
        })
      });

      await expect(
        invitationService.acceptInvitation('invitation1', 'user2')
      ).rejects.toThrow('Invitation is not pending');
    });
  });

  describe('declineInvitation', () => {
    it('should decline invitation successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          projectId: 'project1',
          email: 'user@example.com',
          role: 'editor',
          message: 'Join our project!',
          inviterId: 'user1',
          inviterName: 'User One',
          status: 'pending',
          createdAt: { toMillis: () => Date.now() - 3600000 },
          expiresAt: { toMillis: () => Date.now() + 604800000 },
          updatedAt: { toMillis: () => Date.now() - 3600000 }
        })
      });

      updateDoc.mockResolvedValue({});

      await invitationService.declineInvitation('invitation1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'cancelled'
        })
      );
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel invitation successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          projectId: 'project1',
          email: 'user@example.com',
          role: 'editor',
          message: 'Join our project!',
          inviterId: 'user1',
          inviterName: 'User One',
          status: 'pending',
          createdAt: { toMillis: () => Date.now() - 3600000 },
          expiresAt: { toMillis: () => Date.now() + 604800000 },
          updatedAt: { toMillis: () => Date.now() - 3600000 }
        })
      });

      updateDoc.mockResolvedValue({});

      await invitationService.cancelInvitation('invitation1', 'user1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'cancelled'
        })
      );
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          projectId: 'project1',
          email: 'user@example.com',
          role: 'editor',
          message: 'Join our project!',
          inviterId: 'user1',
          inviterName: 'User One',
          status: 'pending',
          createdAt: { toMillis: () => Date.now() - 3600000 },
          expiresAt: { toMillis: () => Date.now() + 604800000 },
          updatedAt: { toMillis: () => Date.now() - 3600000 }
        })
      });

      updateDoc.mockResolvedValue({});

      // Mock email service
      jest.spyOn(mockEmailService, 'sendReminderEmail').mockResolvedValue();

      await invitationService.resendInvitation('invitation1', 'user1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expiresAt: expect.any(Date)
        })
      );

      expect(mockEmailService.sendReminderEmail).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredInvitations', () => {
    it('should cleanup expired invitations', async () => {
      const { getDocs, updateDoc } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            id: 'invitation1',
            data: () => ({
              projectId: 'project1',
              email: 'user@example.com',
              role: 'editor',
              message: 'Join our project!',
              inviterId: 'user1',
              inviterName: 'User One',
              status: 'pending',
              createdAt: { toMillis: () => Date.now() - 3600000 },
              expiresAt: { toMillis: () => Date.now() - 3600000 }, // Expired
              updatedAt: { toMillis: () => Date.now() - 3600000 }
            })
          });
        }
      });

      updateDoc.mockResolvedValue({});

      // Mock email service
      jest.spyOn(mockEmailService, 'sendExpiredEmail').mockResolvedValue();

      const result = await invitationService.cleanupExpiredInvitations();

      expect(result).toBe(1);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'expired'
        })
      );
      expect(mockEmailService.sendExpiredEmail).toHaveBeenCalled();
    });
  });

  describe('getInvitationStats', () => {
    it('should get invitation statistics', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          // Mock multiple invitations with different statuses
          const invitations = [
            {
              id: 'invitation1',
              data: () => ({
                projectId: 'project1',
                email: 'user1@example.com',
                role: 'editor',
                message: 'Join our project!',
                inviterId: 'user1',
                inviterName: 'User One',
                status: 'pending',
                createdAt: { toMillis: () => Date.now() - 3600000 },
                expiresAt: { toMillis: () => Date.now() + 604800000 },
                updatedAt: { toMillis: () => Date.now() - 3600000 }
              })
            },
            {
              id: 'invitation2',
              data: () => ({
                projectId: 'project1',
                email: 'user2@example.com',
                role: 'viewer',
                message: '',
                inviterId: 'user1',
                inviterName: 'User One',
                status: 'accepted',
                createdAt: { toMillis: () => Date.now() - 7200000 },
                expiresAt: { toMillis: () => Date.now() + 604800000 },
                updatedAt: { toMillis: () => Date.now() - 7200000 }
              })
            },
            {
              id: 'invitation3',
              data: () => ({
                projectId: 'project1',
                email: 'user3@example.com',
                role: 'editor',
                message: '',
                inviterId: 'user1',
                inviterName: 'User One',
                status: 'pending',
                createdAt: { toMillis: () => Date.now() - 86400000 },
                expiresAt: { toMillis: () => Date.now() - 3600000 }, // Expired
                updatedAt: { toMillis: () => Date.now() - 86400000 }
              })
            }
          ];

          invitations.forEach(callback);
        }
      });

      const result = await invitationService.getInvitationStats('project1');

      expect(result).toEqual({
        total: 3,
        pending: 1,
        accepted: 1,
        expired: 1,
        cancelled: 0
      });
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors', async () => {
      const { addDoc } = require('firebase/firestore');
      
      addDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(
        invitationService.createInvitation(
          'project1',
          'user@example.com',
          'editor',
          'user1',
          'User One'
        )
      ).rejects.toThrow('Failed to create invitation');
    });

    it('should handle email service errors', async () => {
      const { addDoc, getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      addDoc.mockResolvedValue({
        id: 'invitation1'
      });

      // Mock email service error
      jest.spyOn(mockEmailService, 'sendInvitationEmail').mockRejectedValue(
        new EmailServiceError('Email service unavailable', 'SERVICE_UNAVAILABLE')
      );

      // Should not throw error even if email fails
      const result = await invitationService.createInvitation(
        'project1',
        'user@example.com',
        'editor',
        'user1',
        'User One'
      );

      expect(result).toBeDefined();
    });
  });
});

describe('MockEmailService', () => {
  let emailService: MockEmailService;

  beforeEach(() => {
    emailService = new MockEmailService();
  });

  it('should send invitation email', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await emailService.sendInvitationEmail(mockInvitation, mockProject);

    expect(consoleSpy).toHaveBeenCalledWith(
      '📧 Sending invitation email:',
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('invited to collaborate'),
        project: 'Test Project',
        role: 'editor',
        inviter: 'User One'
      })
    );

    consoleSpy.mockRestore();
  });

  it('should send reminder email', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await emailService.sendReminderEmail(mockInvitation, mockProject);

    expect(consoleSpy).toHaveBeenCalledWith(
      '📧 Sending reminder email:',
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Reminder'),
        project: 'Test Project'
      })
    );

    consoleSpy.mockRestore();
  });

  it('should send expired email', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await emailService.sendExpiredEmail(mockInvitation, mockProject);

    expect(consoleSpy).toHaveBeenCalledWith(
      '📧 Sending expired email:',
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('expired'),
        project: 'Test Project'
      })
    );

    consoleSpy.mockRestore();
  });

  it('should send welcome email', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await emailService.sendWelcomeEmail('user@example.com', mockProject, 'editor');

    expect(consoleSpy).toHaveBeenCalledWith(
      '📧 Sending welcome email:',
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Welcome'),
        project: 'Test Project',
        role: 'editor'
      })
    );

    consoleSpy.mockRestore();
  });
});
