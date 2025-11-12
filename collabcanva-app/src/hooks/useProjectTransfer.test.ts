// Unit tests for useProjectTransfer hook
// Tests for React hook integration with project transfer functionality

import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectTransfer, useTransferCheck } from './useProjectTransfer';
import { projectTransferService } from '../services/projectTransferService';
import { useAuth } from '../contexts/AuthContext';

// Mock dependencies
jest.mock('../services/projectTransferService');
jest.mock('../contexts/AuthContext');

const mockProjectTransferService = projectTransferService as jest.Mocked<typeof projectTransferService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useProjectTransfer', () => {
  const mockUser = {
    uid: 'user1',
    email: 'user1@example.com',
    displayName: 'User One'
  };

  const mockTransfer = {
    id: 'transfer1',
    projectId: 'project1',
    fromUserId: 'user1',
    fromUserEmail: 'user1@example.com',
    fromUserName: 'User One',
    toUserId: 'user2',
    toUserEmail: 'user2@example.com',
    toUserName: 'User Two',
    status: 'pending',
    message: 'Transfer message',
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 604800000,
    updatedAt: Date.now() - 3600000,
    metadata: {
      projectName: 'Test Project',
      projectDescription: 'A test project',
      previousOwnerRole: 'owner',
      newOwnerRole: 'owner'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });

    // Default mock implementations
    mockProjectTransferService.getProjectTransfers.mockResolvedValue([mockTransfer]);
    mockProjectTransferService.getUserTransfers.mockResolvedValue([mockTransfer]);
    mockProjectTransferService.createTransferRequest.mockResolvedValue(mockTransfer);
    mockProjectTransferService.acceptTransferRequest.mockResolvedValue();
    mockProjectTransferService.declineTransferRequest.mockResolvedValue();
    mockProjectTransferService.cancelTransferRequest.mockResolvedValue();
    mockProjectTransferService.validateTransferRequest.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    mockProjectTransferService.cleanupExpiredTransfers.mockResolvedValue(0);
    mockProjectTransferService.getTransferStats.mockResolvedValue({
      total: 1,
      pending: 1,
      accepted: 0,
      declined: 0,
      cancelled: 0,
      expired: 0
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      expect(result.current.transfers).toEqual([]);
      expect(result.current.pendingTransfers).toEqual([]);
      expect(result.current.userTransfers).toEqual([]);
      expect(result.current.currentTransfer).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load transfers on mount when enabled', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockProjectTransferService.getProjectTransfers).toHaveBeenCalledWith('project1');
      expect(result.current.transfers).toEqual([mockTransfer]);
    });

    it('should not load transfers when disabled', () => {
      renderHook(() => useProjectTransfer({ projectId: 'project1', enabled: false }));

      expect(mockProjectTransferService.getProjectTransfers).not.toHaveBeenCalled();
    });

    it('should load user transfers when userId is provided', async () => {
      const { result } = renderHook(() => useProjectTransfer({ userId: 'user1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockProjectTransferService.getUserTransfers).toHaveBeenCalledWith('user1');
      expect(result.current.transfers).toEqual([mockTransfer]);
    });
  });

  describe('Transfer Creation', () => {
    it('should create transfer request successfully', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await act(async () => {
        await result.current.createTransferRequest('user2', 'Transfer message');
      });

      expect(mockProjectTransferService.createTransferRequest).toHaveBeenCalledWith(
        'project1',
        'user1',
        'user2',
        'Transfer message'
      );
      expect(result.current.transfers).toContain(mockTransfer);
      expect(result.current.pendingTransfers).toContain(mockTransfer);
    });

    it('should handle transfer creation error', async () => {
      const error = new Error('Transfer creation failed');
      mockProjectTransferService.createTransferRequest.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await act(async () => {
        try {
          await result.current.createTransferRequest('user2', 'Transfer message');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.createError).toBe('Transfer creation failed');
    });

    it('should set loading state during creation', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockProjectTransferService.createTransferRequest.mockReturnValue(promise);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      act(() => {
        result.current.createTransferRequest('user2', 'Transfer message');
      });

      expect(result.current.isCreating).toBe(true);

      await act(async () => {
        resolvePromise!(mockTransfer);
      });

      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('Transfer Acceptance', () => {
    it('should accept transfer request successfully', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      // First load transfers
      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      await act(async () => {
        await result.current.acceptTransferRequest('transfer1');
      });

      expect(mockProjectTransferService.acceptTransferRequest).toHaveBeenCalledWith(
        'transfer1',
        'user1'
      );

      // Check that transfer status is updated in local state
      const updatedTransfer = result.current.transfers.find(t => t.id === 'transfer1');
      expect(updatedTransfer?.status).toBe('accepted');
    });

    it('should handle transfer acceptance error', async () => {
      const error = new Error('Transfer acceptance failed');
      mockProjectTransferService.acceptTransferRequest.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await act(async () => {
        try {
          await result.current.acceptTransferRequest('transfer1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.acceptError).toBe('Transfer acceptance failed');
    });
  });

  describe('Transfer Decline', () => {
    it('should decline transfer request successfully', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      await act(async () => {
        await result.current.declineTransferRequest('transfer1', 'Not interested');
      });

      expect(mockProjectTransferService.declineTransferRequest).toHaveBeenCalledWith(
        'transfer1',
        'user1',
        'Not interested'
      );
    });

    it('should handle transfer decline error', async () => {
      const error = new Error('Transfer decline failed');
      mockProjectTransferService.declineTransferRequest.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await act(async () => {
        try {
          await result.current.declineTransferRequest('transfer1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.declineError).toBe('Transfer decline failed');
    });
  });

  describe('Transfer Cancellation', () => {
    it('should cancel transfer request successfully', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      await act(async () => {
        await result.current.cancelTransferRequest('transfer1', 'Changed mind');
      });

      expect(mockProjectTransferService.cancelTransferRequest).toHaveBeenCalledWith(
        'transfer1',
        'user1',
        'Changed mind'
      );
    });

    it('should handle transfer cancellation error', async () => {
      const error = new Error('Transfer cancellation failed');
      mockProjectTransferService.cancelTransferRequest.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await act(async () => {
        try {
          await result.current.cancelTransferRequest('transfer1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.cancelError).toBe('Transfer cancellation failed');
    });
  });

  describe('Transfer Validation', () => {
    it('should validate transfer request', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      const validation = await act(async () => {
        return await result.current.validateTransfer('user2', 'Transfer message');
      });

      expect(mockProjectTransferService.validateTransferRequest).toHaveBeenCalledWith(
        'project1',
        'user1',
        'user2',
        'Transfer message'
      );
      expect(validation.isValid).toBe(true);
    });

    it('should handle validation error', async () => {
      const error = new Error('Validation failed');
      mockProjectTransferService.validateTransferRequest.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      const validation = await act(async () => {
        return await result.current.validateTransfer('user2');
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Validation failed');
    });
  });

  describe('Utility Functions', () => {
    it('should get transfer by ID', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      const transfer = result.current.getTransferById('transfer1');
      expect(transfer).toEqual(mockTransfer);

      const nonExistentTransfer = result.current.getTransferById('nonexistent');
      expect(nonExistentTransfer).toBeUndefined();
    });

    it('should get transfers by status', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      const pendingTransfers = result.current.getTransfersByStatus('pending');
      expect(pendingTransfers).toEqual([mockTransfer]);

      const acceptedTransfers = result.current.getTransfersByStatus('accepted');
      expect(acceptedTransfers).toEqual([]);
    });

    it('should get transfers for user', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      const userTransfers = result.current.getTransfersForUser('user2');
      expect(userTransfers).toEqual([mockTransfer]);

      const otherUserTransfers = result.current.getTransfersForUser('user3');
      expect(otherUserTransfers).toEqual([]);
    });

    it('should get pending transfers for user', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      const pendingTransfers = result.current.getPendingTransfersForUser('user2');
      expect(pendingTransfers).toEqual([mockTransfer]);
    });
  });

  describe('Permission Checks', () => {
    it('should check if user can create transfer', () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      expect(result.current.canCreateTransfer).toBe(true);
    });

    it('should check if user can accept transfer', () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      const canAccept = result.current.canAcceptTransfer(mockTransfer);
      expect(canAccept).toBe(false); // user1 cannot accept transfer to user2
    });

    it('should check if user can cancel transfer', () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      const canCancel = result.current.canCancelTransfer(mockTransfer);
      expect(canCancel).toBe(true); // user1 can cancel their own transfer
    });

    it('should check if user can decline transfer', () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      const canDecline = result.current.canDeclineTransfer(mockTransfer);
      expect(canDecline).toBe(false); // user1 cannot decline transfer to user2
    });
  });

  describe('Statistics', () => {
    it('should calculate transfer statistics', async () => {
      const multipleTransfers = [
        mockTransfer,
        { ...mockTransfer, id: 'transfer2', status: 'accepted' },
        { ...mockTransfer, id: 'transfer3', status: 'declined' }
      ];

      mockProjectTransferService.getProjectTransfers.mockResolvedValue(multipleTransfers);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual(multipleTransfers);
      });

      expect(result.current.totalTransfers).toBe(3);
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.acceptedCount).toBe(1);
      expect(result.current.declinedCount).toBe(1);
      expect(result.current.cancelledCount).toBe(0);
      expect(result.current.expiredCount).toBe(0);
    });
  });

  describe('Actions', () => {
    it('should refresh transfers', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.transfers).toEqual([mockTransfer]);
      });

      // Clear the mock to verify it's called again
      mockProjectTransferService.getProjectTransfers.mockClear();

      await act(async () => {
        await result.current.refreshTransfers();
      });

      expect(mockProjectTransferService.getProjectTransfers).toHaveBeenCalledWith('project1');
    });

    it('should cleanup expired transfers', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      mockProjectTransferService.cleanupExpiredTransfers.mockResolvedValue(2);

      const cleanedCount = await act(async () => {
        return await result.current.cleanupExpiredTransfers();
      });

      expect(cleanedCount).toBe(2);
      expect(mockProjectTransferService.cleanupExpiredTransfers).toHaveBeenCalled();
    });

    it('should get transfer statistics', async () => {
      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      const stats = await act(async () => {
        return await result.current.getTransferStats();
      });

      expect(stats).toEqual({
        total: 1,
        pending: 1,
        accepted: 0,
        declined: 0,
        cancelled: 0,
        expired: 0
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors', async () => {
      const error = new Error('Loading failed');
      mockProjectTransferService.getProjectTransfers.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Loading failed');
    });

    it('should handle missing user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      const { result } = renderHook(() => useProjectTransfer({ projectId: 'project1' }));

      await act(async () => {
        try {
          await result.current.createTransferRequest('user2');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.createError).toBe('User not authenticated or project not found');
    });
  });
});

describe('useTransferCheck', () => {
  const mockUser = {
    uid: 'user1',
    email: 'user1@example.com',
    displayName: 'User One'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });

    mockProjectTransferService.getProjectTransfers.mockResolvedValue([]);
    mockProjectTransferService.getUserTransfers.mockResolvedValue([]);
  });

  it('should provide transfer check functionality', async () => {
    const { result } = renderHook(() => useTransferCheck('project1'));

    await waitFor(() => {
      expect(result.current.isTransferLoading).toBe(false);
    });

    expect(result.current.hasPendingTransfers).toBe(false);
    expect(result.current.hasUserTransfers).toBe(false);
    expect(result.current.canCreateTransfer).toBe(true);
    expect(result.current.pendingTransferCount).toBe(0);
    expect(result.current.userTransferCount).toBe(0);
  });

  it('should get recent transfers', async () => {
    const mockTransfers = [
      { ...mockTransfer, id: 'transfer1', createdAt: Date.now() - 3600000 },
      { ...mockTransfer, id: 'transfer2', createdAt: Date.now() - 7200000 },
      { ...mockTransfer, id: 'transfer3', createdAt: Date.now() - 10800000 }
    ];

    mockProjectTransferService.getUserTransfers.mockResolvedValue(mockTransfers);

    const { result } = renderHook(() => useTransferCheck('project1'));

    await waitFor(() => {
      expect(result.current.userTransferCount).toBe(3);
    });

    const recentTransfers = result.current.getRecentTransfers();
    expect(recentTransfers).toHaveLength(3);
    expect(recentTransfers[0].id).toBe('transfer1'); // Most recent first
  });

  it('should get expiring transfers', async () => {
    const now = Date.now();
    const mockTransfers = [
      { ...mockTransfer, id: 'transfer1', expiresAt: now + 3600000 }, // 1 hour
      { ...mockTransfer, id: 'transfer2', expiresAt: now + 7200000 }, // 2 hours
      { ...mockTransfer, id: 'transfer3', expiresAt: now + 172800000 } // 2 days
    ];

    mockProjectTransferService.getProjectTransfers.mockResolvedValue(mockTransfers);

    const { result } = renderHook(() => useTransferCheck('project1'));

    await waitFor(() => {
      expect(result.current.pendingTransferCount).toBe(3);
    });

    const expiringTransfers = result.current.getExpiringTransfers();
    expect(expiringTransfers).toHaveLength(2); // Only transfers expiring within 24 hours
  });
});
