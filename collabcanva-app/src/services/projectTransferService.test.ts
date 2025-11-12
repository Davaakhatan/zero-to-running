// Unit tests for ProjectTransferService
// Tests for project ownership transfer functionality

import { 
  ProjectTransferService, 
  projectTransferService,
  ProjectTransferError,
  formatTransferStatus,
  getTransferStatusColor,
  formatTransferExpiry,
  isTransferExpired,
  canUserAcceptTransfer,
  canUserCancelTransfer
} from './projectTransferService';
import { TransferRequest } from '../types';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ toMillis: () => Date.now() }))
}));

// Mock Firebase database
jest.mock('./firebase', () => ({
  db: {}
}));

// Mock email service
jest.mock('./emailService', () => ({
  emailService: {
    sendTransferRequestEmail: jest.fn(),
    sendTransferStatusEmail: jest.fn()
  }
}));

describe('ProjectTransferService', () => {
  let transferService: ProjectTransferService;
  let mockProject: any;
  let mockUser: any;
  let mockTransfer: TransferRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    transferService = ProjectTransferService.getInstance();
    
    mockProject = {
      id: 'project1',
      name: 'Test Project',
      description: 'A test project',
      ownerId: 'user1',
      members: [
        {
          userId: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          role: 'owner'
        },
        {
          userId: 'user2',
          displayName: 'User Two',
          email: 'user2@example.com',
          role: 'admin'
        },
        {
          userId: 'user3',
          displayName: 'User Three',
          email: 'user3@example.com',
          role: 'editor'
        }
      ],
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now() - 3600000
    };

    mockUser = {
      uid: 'user1',
      email: 'user1@example.com',
      displayName: 'User One'
    };

    mockTransfer = {
      id: 'transfer1',
      projectId: 'project1',
      fromUserId: 'user1',
      fromUserEmail: 'user1@example.com',
      fromUserName: 'User One',
      toUserId: 'user2',
      toUserEmail: 'user2@example.com',
      toUserName: 'User Two',
      status: 'pending',
      message: 'Transferring ownership',
      createdAt: Date.now() - 3600000,
      expiresAt: Date.now() + 604800000, // 7 days
      updatedAt: Date.now() - 3600000,
      metadata: {
        projectName: 'Test Project',
        projectDescription: 'A test project',
        previousOwnerRole: 'owner',
        newOwnerRole: 'owner'
      }
    };
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ProjectTransferService.getInstance();
      const instance2 = ProjectTransferService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Transfer Validation', () => {
    it('should validate transfer request successfully', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      const validation = await transferService.validateTransferRequest(
        'project1',
        'user1',
        'user2',
        'Transfer message'
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject transfer from non-owner', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      const validation = await transferService.validateTransferRequest(
        'project1',
        'user2', // Not the owner
        'user3',
        'Transfer message'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Only the project owner can initiate a transfer');
    });

    it('should reject self-transfer', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      const validation = await transferService.validateTransferRequest(
        'project1',
        'user1',
        'user1', // Same user
        'Transfer message'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Cannot transfer ownership to yourself');
    });

    it('should reject transfer to non-member', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      const validation = await transferService.validateTransferRequest(
        'project1',
        'user1',
        'user4', // Not a member
        'Transfer message'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Target user must be a project member');
    });

    it('should reject transfer to viewer', async () => {
      const projectWithViewer = {
        ...mockProject,
        members: [
          ...mockProject.members,
          {
            userId: 'user4',
            displayName: 'User Four',
            email: 'user4@example.com',
            role: 'viewer'
          }
        ]
      };

      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => projectWithViewer
      });

      const validation = await transferService.validateTransferRequest(
        'project1',
        'user1',
        'user4', // Viewer role
        'Transfer message'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Target user must be an admin or editor to receive ownership');
    });

    it('should warn about short ownership duration', async () => {
      const newProject = {
        ...mockProject,
        createdAt: Date.now() - 3600000 // 1 hour ago
      };

      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => newProject
      });

      const validation = await transferService.validateTransferRequest(
        'project1',
        'user1',
        'user2',
        'Transfer message'
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Project has been owned for less than 24 hours');
    });

    it('should validate message length', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      const longMessage = 'a'.repeat(501);
      const validation = await transferService.validateTransferRequest(
        'project1',
        'user1',
        'user2',
        longMessage
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Transfer message must be less than 500 characters');
    });
  });

  describe('Transfer Request Creation', () => {
    it('should create transfer request successfully', async () => {
      const { getDoc, addDoc } = require('firebase/firestore');
      
      getDoc.mockImplementation((ref) => {
        if (ref.path.includes('projects/project1')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockProject
          });
        }
        if (ref.path.includes('users/user1')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ email: 'user1@example.com', displayName: 'User One' })
          });
        }
        if (ref.path.includes('users/user2')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ email: 'user2@example.com', displayName: 'User Two' })
          });
        }
        return Promise.resolve({ exists: () => false });
      });

      addDoc.mockResolvedValue({ id: 'transfer1' });

      const transfer = await transferService.createTransferRequest(
        'project1',
        'user1',
        'user2',
        'Transfer message'
      );

      expect(transfer.id).toBe('transfer1');
      expect(transfer.projectId).toBe('project1');
      expect(transfer.fromUserId).toBe('user1');
      expect(transfer.toUserId).toBe('user2');
      expect(transfer.status).toBe('pending');
      expect(transfer.message).toBe('Transfer message');
    });

    it('should handle validation failure', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      await expect(
        transferService.createTransferRequest(
          'project1',
          'user2', // Not the owner
          'user3',
          'Transfer message'
        )
      ).rejects.toThrow('Transfer validation failed');
    });
  });

  describe('Transfer Request Acceptance', () => {
    it('should accept transfer request successfully', async () => {
      const { getDoc, runTransaction } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTransfer
      });

      runTransaction.mockImplementation(async (db, updateFunction) => {
        const transaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => mockProject
          }),
          update: jest.fn()
        };
        
        await updateFunction(transaction);
        return Promise.resolve();
      });

      await transferService.acceptTransferRequest('transfer1', 'user2');

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should reject acceptance by wrong user', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTransfer
      });

      await expect(
        transferService.acceptTransferRequest('transfer1', 'user3') // Wrong user
      ).rejects.toThrow('Only the target user can accept the transfer');
    });

    it('should reject acceptance of non-pending transfer', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTransfer, status: 'accepted' })
      });

      await expect(
        transferService.acceptTransferRequest('transfer1', 'user2')
      ).rejects.toThrow('Transfer request is not pending');
    });

    it('should reject acceptance of expired transfer', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTransfer, expiresAt: Date.now() - 3600000 })
      });

      await expect(
        transferService.acceptTransferRequest('transfer1', 'user2')
      ).rejects.toThrow('Transfer request has expired');
    });
  });

  describe('Transfer Request Decline', () => {
    it('should decline transfer request successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTransfer
      });

      updateDoc.mockResolvedValue({});

      await transferService.declineTransferRequest('transfer1', 'user2', 'Not interested');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'declined',
          declinedAt: expect.any(Number)
        })
      );
    });

    it('should reject decline by wrong user', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTransfer
      });

      await expect(
        transferService.declineTransferRequest('transfer1', 'user3') // Wrong user
      ).rejects.toThrow('Only the target user can decline the transfer');
    });
  });

  describe('Transfer Request Cancellation', () => {
    it('should cancel transfer request successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTransfer
      });

      updateDoc.mockResolvedValue({});

      await transferService.cancelTransferRequest('transfer1', 'user1', 'Changed mind');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'cancelled',
          cancelledAt: expect.any(Number)
        })
      );
    });

    it('should reject cancellation by wrong user', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTransfer
      });

      await expect(
        transferService.cancelTransferRequest('transfer1', 'user2') // Wrong user
      ).rejects.toThrow('Only the initiator can cancel the transfer');
    });
  });

  describe('Transfer Retrieval', () => {
    it('should get project transfers', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'transfer1',
            data: () => mockTransfer
          }
        ]
      });

      const transfers = await transferService.getProjectTransfers('project1');

      expect(transfers).toHaveLength(1);
      expect(transfers[0].id).toBe('transfer1');
    });

    it('should get pending transfers', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'transfer1',
            data: () => mockTransfer
          },
          {
            id: 'transfer2',
            data: () => ({ ...mockTransfer, id: 'transfer2', status: 'accepted' })
          }
        ]
      });

      const transfers = await transferService.getPendingTransfers('project1');

      expect(transfers).toHaveLength(1);
      expect(transfers[0].status).toBe('pending');
    });

    it('should get user transfers', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'transfer1',
            data: () => mockTransfer
          }
        ]
      });

      const transfers = await transferService.getUserTransfers('user2');

      expect(transfers).toHaveLength(1);
      expect(transfers[0].toUserId).toBe('user2');
    });
  });

  describe('Transfer Cleanup', () => {
    it('should cleanup expired transfers', async () => {
      const { getDocs, writeBatch } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'transfer1',
            ref: { update: jest.fn() },
            data: () => ({ ...mockTransfer, expiresAt: Date.now() - 3600000 })
          }
        ]
      });

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue({})
      };
      writeBatch.mockReturnValue(mockBatch);

      const cleanedCount = await transferService.cleanupExpiredTransfers();

      expect(cleanedCount).toBe(1);
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('Transfer Statistics', () => {
    it('should get transfer statistics', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'transfer1',
            data: () => ({ ...mockTransfer, status: 'pending' })
          },
          {
            id: 'transfer2',
            data: () => ({ ...mockTransfer, id: 'transfer2', status: 'accepted' })
          },
          {
            id: 'transfer3',
            data: () => ({ ...mockTransfer, id: 'transfer3', status: 'declined' })
          }
        ]
      });

      const stats = await transferService.getTransferStats('project1');

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.accepted).toBe(1);
      expect(stats.declined).toBe(1);
      expect(stats.cancelled).toBe(0);
      expect(stats.expired).toBe(0);
    });
  });
});

describe('Transfer Utility Functions', () => {
  describe('formatTransferStatus', () => {
    it('should format transfer status correctly', () => {
      expect(formatTransferStatus('pending')).toBe('Pending');
      expect(formatTransferStatus('accepted')).toBe('Accepted');
      expect(formatTransferStatus('declined')).toBe('Declined');
      expect(formatTransferStatus('cancelled')).toBe('Cancelled');
      expect(formatTransferStatus('expired')).toBe('Expired');
    });
  });

  describe('getTransferStatusColor', () => {
    it('should return correct colors for transfer statuses', () => {
      expect(getTransferStatusColor('pending')).toBe('yellow');
      expect(getTransferStatusColor('accepted')).toBe('green');
      expect(getTransferStatusColor('declined')).toBe('red');
      expect(getTransferStatusColor('cancelled')).toBe('gray');
      expect(getTransferStatusColor('expired')).toBe('gray');
    });
  });

  describe('formatTransferExpiry', () => {
    it('should format transfer expiry correctly', () => {
      const now = Date.now();
      
      expect(formatTransferExpiry(now + 3600000)).toBe('1 hour left');
      expect(formatTransferExpiry(now + 7200000)).toBe('2 hours left');
      expect(formatTransferExpiry(now + 86400000)).toBe('1 day left');
      expect(formatTransferExpiry(now + 172800000)).toBe('2 days left');
      expect(formatTransferExpiry(now - 3600000)).toBe('Expired');
    });
  });

  describe('isTransferExpired', () => {
    it('should correctly identify expired transfers', () => {
      const now = Date.now();
      
      expect(isTransferExpired(now - 3600000)).toBe(true);
      expect(isTransferExpired(now + 3600000)).toBe(false);
    });
  });

  describe('canUserAcceptTransfer', () => {
    it('should correctly determine if user can accept transfer', () => {
      const transfer = {
        ...mockTransfer,
        toUserId: 'user2',
        status: 'pending',
        expiresAt: Date.now() + 3600000
      };

      expect(canUserAcceptTransfer(transfer, 'user2')).toBe(true);
      expect(canUserAcceptTransfer(transfer, 'user3')).toBe(false);
      expect(canUserAcceptTransfer({ ...transfer, status: 'accepted' }, 'user2')).toBe(false);
      expect(canUserAcceptTransfer({ ...transfer, expiresAt: Date.now() - 3600000 }, 'user2')).toBe(false);
    });
  });

  describe('canUserCancelTransfer', () => {
    it('should correctly determine if user can cancel transfer', () => {
      const transfer = {
        ...mockTransfer,
        fromUserId: 'user1',
        status: 'pending'
      };

      expect(canUserCancelTransfer(transfer, 'user1')).toBe(true);
      expect(canUserCancelTransfer(transfer, 'user2')).toBe(false);
      expect(canUserCancelTransfer({ ...transfer, status: 'accepted' }, 'user1')).toBe(false);
    });
  });
});

describe('ProjectTransferService Integration', () => {
  let transferService: ProjectTransferService;

  beforeEach(() => {
    jest.clearAllMocks();
    transferService = ProjectTransferService.getInstance();
  });

  it('should handle complete transfer lifecycle', async () => {
    const { getDoc, addDoc, runTransaction, updateDoc } = require('firebase/firestore');
    
    // Mock project and user data
    getDoc.mockImplementation((ref) => {
      if (ref.path.includes('projects/project1')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockProject
        });
      }
      if (ref.path.includes('users/user1')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ email: 'user1@example.com', displayName: 'User One' })
        });
      }
      if (ref.path.includes('users/user2')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ email: 'user2@example.com', displayName: 'User Two' })
        });
      }
      if (ref.path.includes('projectTransfers/transfer1')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockTransfer
        });
      }
      return Promise.resolve({ exists: () => false });
    });

    addDoc.mockResolvedValue({ id: 'transfer1' });
    updateDoc.mockResolvedValue({});

    runTransaction.mockImplementation(async (db, updateFunction) => {
      const transaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockProject
        }),
        update: jest.fn()
      };
      
      await updateFunction(transaction);
      return Promise.resolve();
    });

    // Create transfer request
    const transfer = await transferService.createTransferRequest(
      'project1',
      'user1',
      'user2',
      'Transfer message'
    );

    expect(transfer.id).toBe('transfer1');
    expect(transfer.status).toBe('pending');

    // Accept transfer request
    await transferService.acceptTransferRequest('transfer1', 'user2');

    expect(runTransaction).toHaveBeenCalled();
  });

  it('should handle error scenarios gracefully', async () => {
    const { getDoc } = require('firebase/firestore');
    
    getDoc.mockRejectedValue(new Error('Firebase error'));

    // Should not throw error for validation
    const validation = await transferService.validateTransferRequest(
      'project1',
      'user1',
      'user2'
    );

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Failed to validate transfer request');
  });
});
