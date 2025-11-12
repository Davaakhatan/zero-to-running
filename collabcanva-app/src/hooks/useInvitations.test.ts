// Unit tests for useInvitations hook
// Tests for invitation management functionality

import { renderHook, act, waitFor } from '@testing-library/react';
import { useInvitations } from './useInvitations';
import { useAuth } from '../contexts/AuthContext';
import { invitationService, InvitationError } from '../services/invitationService';
import { ProjectInvitation, ProjectRole } from '../types';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../services/invitationService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockInvitationService = invitationService as jest.Mocked<typeof invitationService>;

// Test data
const mockUser = {
  uid: 'user1',
  email: 'user1@example.com',
  displayName: 'User One'
};

const mockInvitations: ProjectInvitation[] = [
  {
    id: 'invitation1',
    projectId: 'project1',
    email: 'user2@example.com',
    role: 'editor',
    message: 'Join our project!',
    inviterId: 'user1',
    inviterName: 'User One',
    status: 'pending',
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 604800000, // 7 days
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'invitation2',
    projectId: 'project1',
    email: 'user3@example.com',
    role: 'viewer',
    message: '',
    inviterId: 'user1',
    inviterName: 'User One',
    status: 'accepted',
    createdAt: Date.now() - 7200000,
    expiresAt: Date.now() + 604800000,
    updatedAt: Date.now() - 7200000
  },
  {
    id: 'invitation3',
    projectId: 'project1',
    email: 'user4@example.com',
    role: 'editor',
    message: '',
    inviterId: 'user1',
    inviterName: 'User One',
    status: 'pending',
    createdAt: Date.now() - 86400000,
    expiresAt: Date.now() - 3600000, // Expired
    updatedAt: Date.now() - 86400000
  }
];

describe('useInvitations', () => {
  const mockCreateInvitation = jest.fn();
  const mockAcceptInvitation = jest.fn();
  const mockDeclineInvitation = jest.fn();
  const mockCancelInvitation = jest.fn();
  const mockResendInvitation = jest.fn();
  const mockGetProjectInvitations = jest.fn();
  const mockGetUserInvitations = jest.fn();
  const mockCleanupExpiredInvitations = jest.fn();
  const mockGetInvitationStats = jest.fn();

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

    // Mock invitation service methods
    mockInvitationService.createInvitation = mockCreateInvitation;
    mockInvitationService.acceptInvitation = mockAcceptInvitation;
    mockInvitationService.declineInvitation = mockDeclineInvitation;
    mockInvitationService.cancelInvitation = mockCancelInvitation;
    mockInvitationService.resendInvitation = mockResendInvitation;
    mockInvitationService.getProjectInvitations = mockGetProjectInvitations;
    mockInvitationService.getUserInvitations = mockGetUserInvitations;
    mockInvitationService.cleanupExpiredInvitations = mockCleanupExpiredInvitations;
    mockInvitationService.getInvitationStats = mockGetInvitationStats;
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      expect(result.current.invitations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load project invitations when projectId is provided', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      expect(mockGetProjectInvitations).toHaveBeenCalledWith('project1');
    });

    it('should load user invitations when userEmail is provided', async () => {
      mockGetUserInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ userEmail: 'user@example.com' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      expect(mockGetUserInvitations).toHaveBeenCalledWith('user@example.com');
    });

    it('should not load data when disabled', () => {
      const { result } = renderHook(() => 
        useInvitations({ projectId: 'project1', enabled: false })
      );

      expect(result.current.invitations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Invitation Management', () => {
    it('should create invitation successfully', async () => {
      const newInvitation: ProjectInvitation = {
        id: 'invitation4',
        projectId: 'project1',
        email: 'user5@example.com',
        role: 'viewer',
        message: 'Welcome!',
        inviterId: 'user1',
        inviterName: 'User One',
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + 604800000,
        updatedAt: Date.now()
      };

      mockCreateInvitation.mockResolvedValue(newInvitation);
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        await result.current.createInvitation('user5@example.com', 'viewer', 'Welcome!');
      });

      expect(mockCreateInvitation).toHaveBeenCalledWith(
        'project1',
        'user5@example.com',
        'viewer',
        'user1',
        'User One',
        'Welcome!'
      );

      // Should add to local state
      expect(result.current.invitations).toContainEqual(newInvitation);
    });

    it('should handle invitation creation error', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockCreateInvitation.mockRejectedValue(new InvitationError('Email already exists', 'EMAIL_EXISTS'));

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        try {
          await result.current.createInvitation('user5@example.com', 'viewer');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.createError).toBe('Email already exists');
    });

    it('should accept invitation successfully', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockAcceptInvitation.mockResolvedValue();

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        await result.current.acceptInvitation('invitation1');
      });

      expect(mockAcceptInvitation).toHaveBeenCalledWith('invitation1', 'user1');

      // Should update local state
      const updatedInvitation = result.current.invitations.find(inv => inv.id === 'invitation1');
      expect(updatedInvitation?.status).toBe('accepted');
    });

    it('should decline invitation successfully', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockDeclineInvitation.mockResolvedValue();

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        await result.current.declineInvitation('invitation1');
      });

      expect(mockDeclineInvitation).toHaveBeenCalledWith('invitation1');

      // Should update local state
      const updatedInvitation = result.current.invitations.find(inv => inv.id === 'invitation1');
      expect(updatedInvitation?.status).toBe('cancelled');
    });

    it('should cancel invitation successfully', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockCancelInvitation.mockResolvedValue();

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        await result.current.cancelInvitation('invitation1');
      });

      expect(mockCancelInvitation).toHaveBeenCalledWith('invitation1', 'user1');

      // Should update local state
      const updatedInvitation = result.current.invitations.find(inv => inv.id === 'invitation1');
      expect(updatedInvitation?.status).toBe('cancelled');
    });

    it('should resend invitation successfully', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockResendInvitation.mockResolvedValue();

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        await result.current.resendInvitation('invitation1');
      });

      expect(mockResendInvitation).toHaveBeenCalledWith('invitation1', 'user1');

      // Should update local state with new expiry date
      const updatedInvitation = result.current.invitations.find(inv => inv.id === 'invitation1');
      expect(updatedInvitation?.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('Utility Functions', () => {
    it('should get invitation by ID', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const invitation = result.current.getInvitationById('invitation1');
      expect(invitation).toEqual(mockInvitations[0]);
    });

    it('should get invitations by status', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const pendingInvitations = result.current.getInvitationsByStatus('pending');
      expect(pendingInvitations).toHaveLength(2);
      expect(pendingInvitations.every(inv => inv.status === 'pending')).toBe(true);

      const acceptedInvitations = result.current.getInvitationsByStatus('accepted');
      expect(acceptedInvitations).toHaveLength(1);
      expect(acceptedInvitations[0].status).toBe('accepted');
    });

    it('should get invitations by role', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const editorInvitations = result.current.getInvitationsByRole('editor');
      expect(editorInvitations).toHaveLength(2);
      expect(editorInvitations.every(inv => inv.role === 'editor')).toBe(true);

      const viewerInvitations = result.current.getInvitationsByRole('viewer');
      expect(viewerInvitations).toHaveLength(1);
      expect(viewerInvitations[0].role).toBe('viewer');
    });

    it('should get expired invitations', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const expiredInvitations = result.current.getExpiredInvitations();
      expect(expiredInvitations).toHaveLength(1);
      expect(expiredInvitations[0].id).toBe('invitation3');
      expect(expiredInvitations[0].expiresAt).toBeLessThanOrEqual(Date.now());
    });

    it('should get pending invitations', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const pendingInvitations = result.current.getPendingInvitations();
      expect(pendingInvitations).toHaveLength(1);
      expect(pendingInvitations[0].id).toBe('invitation1');
      expect(pendingInvitations[0].expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('Computed Values', () => {
    it('should compute invitation categories correctly', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      expect(result.current.pendingInvitations).toHaveLength(1);
      expect(result.current.acceptedInvitations).toHaveLength(1);
      expect(result.current.expiredInvitations).toHaveLength(1);
      expect(result.current.cancelledInvitations).toHaveLength(0);
    });

    it('should compute statistics correctly', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      expect(result.current.totalInvitations).toBe(3);
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.acceptedCount).toBe(1);
      expect(result.current.expiredCount).toBe(1);
      expect(result.current.cancelledCount).toBe(0);
    });
  });

  describe('Actions', () => {
    it('should refresh invitations', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      // Clear the mock to test refresh
      mockGetProjectInvitations.mockClear();
      mockGetProjectInvitations.mockResolvedValue([...mockInvitations, {
        id: 'invitation4',
        projectId: 'project1',
        email: 'user5@example.com',
        role: 'viewer',
        message: '',
        inviterId: 'user1',
        inviterName: 'User One',
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + 604800000,
        updatedAt: Date.now()
      }]);

      await act(async () => {
        await result.current.refreshInvitations();
      });

      expect(mockGetProjectInvitations).toHaveBeenCalledWith('project1');
      expect(result.current.invitations).toHaveLength(4);
    });

    it('should cleanup expired invitations', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockCleanupExpiredInvitations.mockResolvedValue(1);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const cleanedCount = await act(async () => {
        return await result.current.cleanupExpiredInvitations();
      });

      expect(mockCleanupExpiredInvitations).toHaveBeenCalled();
      expect(cleanedCount).toBe(1);
    });

    it('should get invitation statistics', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockGetInvitationStats.mockResolvedValue({
        total: 3,
        pending: 1,
        accepted: 1,
        expired: 1,
        cancelled: 0
      });

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const stats = await act(async () => {
        return await result.current.getInvitationStats();
      });

      expect(mockGetInvitationStats).toHaveBeenCalledWith('project1');
      expect(stats).toEqual({
        total: 3,
        pending: 1,
        accepted: 1,
        expired: 1,
        cancelled: 0
      });
    });

    it('should require project ID for statistics', async () => {
      mockGetUserInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ userEmail: 'user@example.com' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await expect(
        act(async () => {
          await result.current.getInvitationStats();
        })
      ).rejects.toThrow('Project ID is required for statistics');
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors', async () => {
      mockGetProjectInvitations.mockRejectedValue(new Error('Failed to load invitations'));

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load invitations');
      });
    });

    it('should handle invitation service errors', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockAcceptInvitation.mockRejectedValue(new InvitationError('Invitation not found', 'NOT_FOUND'));

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        try {
          await result.current.acceptInvitation('nonexistent');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.updateError).toBe('Invitation not found');
    });

    it('should handle generic errors', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockCreateInvitation.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      await act(async () => {
        try {
          await result.current.createInvitation('user@example.com', 'viewer');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.createError).toBe('Failed to create invitation');
    });
  });

  describe('Loading States', () => {
    it('should manage loading states correctly', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
    });

    it('should set creating state during invitation creation', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockCreateInvitation.mockResolvedValue(mockInvitations[0]);

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const createPromise = act(async () => {
        await result.current.createInvitation('user@example.com', 'viewer');
      });

      // Check that creating state is set during the operation
      expect(result.current.isCreating).toBe(true);

      await createPromise;

      expect(result.current.isCreating).toBe(false);
    });

    it('should set updating state during invitation updates', async () => {
      mockGetProjectInvitations.mockResolvedValue(mockInvitations);
      mockAcceptInvitation.mockResolvedValue();

      const { result } = renderHook(() => useInvitations({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });

      const updatePromise = act(async () => {
        await result.current.acceptInvitation('invitation1');
      });

      // Check that updating state is set during the operation
      expect(result.current.isUpdating).toBe(true);

      await updatePromise;

      expect(result.current.isUpdating).toBe(false);
    });
  });
});
