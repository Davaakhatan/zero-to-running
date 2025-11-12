// Unit tests for useProjectMembers hook
// Tests for team member management functionality

import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectMembers } from './useProjectMembers';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from './useProjects';
import { Project, ProjectMember, ProjectRole, ProjectInvitation } from '../types';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('./useProjects');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;

// Test data
const mockUser = {
  uid: 'user1',
  email: 'user1@example.com',
  displayName: 'User One'
};

const mockProject: Project = {
  id: 'project1',
  name: 'Test Project',
  description: 'A test project',
  ownerId: 'user1',
  members: [
    {
      id: 'member1',
      userId: 'user1',
      email: 'user1@example.com',
      name: 'User One',
      role: 'owner',
      status: 'active',
      joinedAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000
    },
    {
      id: 'member2',
      userId: 'user2',
      email: 'user2@example.com',
      name: 'User Two',
      role: 'editor',
      status: 'active',
      joinedAt: Date.now() - 43200000,
      updatedAt: Date.now() - 43200000
    }
  ],
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

const mockInvitations: ProjectInvitation[] = [
  {
    id: 'invitation1',
    projectId: 'project1',
    email: 'user3@example.com',
    role: 'viewer',
    message: 'Join our project!',
    inviterId: 'user1',
    inviterName: 'User One',
    status: 'pending',
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 604800000, // 7 days
    updatedAt: Date.now() - 3600000
  }
];

describe('useProjectMembers', () => {
  const mockGetProject = jest.fn();
  const mockUpdateProject = jest.fn();

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

    mockUseProjects.mockReturnValue({
      projects: [],
      currentProject: mockProject,
      currentProjectMembers: mockProject.members || [],
      currentProjectCanvases: [],
      userRole: 'owner',
      isLoading: false,
      error: null,
      createProject: jest.fn(),
      updateProject: mockUpdateProject,
      deleteProject: jest.fn(),
      setCurrentProject: jest.fn(),
      clearCurrentProject: jest.fn(),
      canEditProject: jest.fn().mockReturnValue(true),
      canDeleteProject: jest.fn().mockReturnValue(true),
      canManageMembers: jest.fn().mockReturnValue(true)
    });

    mockGetProject.mockResolvedValue(mockProject);
    mockUpdateProject.mockResolvedValue(mockProject);
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      expect(result.current.members).toEqual([]);
      expect(result.current.invitations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load members when projectId is provided', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });
    });

    it('should not load data when disabled', () => {
      const { result } = renderHook(() => 
        useProjectMembers({ projectId: 'project1', enabled: false })
      );

      expect(result.current.members).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('User Role Detection', () => {
    it('should detect owner role correctly', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUserRole).toBe('owner');
        expect(result.current.isOwner).toBe(true);
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isEditor).toBe(false);
        expect(result.current.isViewer).toBe(false);
      });
    });

    it('should detect admin role correctly', async () => {
      const adminUser = { ...mockUser, uid: 'user2' };
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      const adminProject = {
        ...mockProject,
        members: [
          {
            id: 'member2',
            userId: 'user2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'admin' as ProjectRole,
            status: 'active',
            joinedAt: Date.now() - 43200000,
            updatedAt: Date.now() - 43200000
          }
        ]
      };

      mockGetProject.mockResolvedValue(adminProject);

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUserRole).toBe('admin');
        expect(result.current.isOwner).toBe(false);
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isEditor).toBe(false);
        expect(result.current.isViewer).toBe(false);
      });
    });

    it('should return null role for non-members', async () => {
      const nonMemberUser = { ...mockUser, uid: 'user3' };
      mockUseAuth.mockReturnValue({
        user: nonMemberUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUserRole).toBeNull();
        expect(result.current.isOwner).toBe(false);
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isEditor).toBe(false);
        expect(result.current.isViewer).toBe(false);
      });
    });
  });

  describe('Permission Checks', () => {
    it('should allow owners to invite members', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.canInviteMembers).toBe(true);
        expect(result.current.canManageInvitations).toBe(true);
        expect(result.current.canTransferOwnership).toBe(true);
      });
    });

    it('should allow admins to invite members', async () => {
      const adminUser = { ...mockUser, uid: 'user2' };
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      const adminProject = {
        ...mockProject,
        members: [
          {
            id: 'member2',
            userId: 'user2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'admin' as ProjectRole,
            status: 'active',
            joinedAt: Date.now() - 43200000,
            updatedAt: Date.now() - 43200000
          }
        ]
      };

      mockGetProject.mockResolvedValue(adminProject);

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.canInviteMembers).toBe(true);
        expect(result.current.canManageInvitations).toBe(true);
        expect(result.current.canTransferOwnership).toBe(false);
      });
    });

    it('should not allow editors to invite members', async () => {
      const editorUser = { ...mockUser, uid: 'user2' };
      mockUseAuth.mockReturnValue({
        user: editorUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      const editorProject = {
        ...mockProject,
        members: [
          {
            id: 'member2',
            userId: 'user2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'editor' as ProjectRole,
            status: 'active',
            joinedAt: Date.now() - 43200000,
            updatedAt: Date.now() - 43200000
          }
        ]
      };

      mockGetProject.mockResolvedValue(editorProject);

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.canInviteMembers).toBe(false);
        expect(result.current.canManageInvitations).toBe(false);
        expect(result.current.canTransferOwnership).toBe(false);
      });
    });

    it('should check member update permissions correctly', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        // Owner can update other members
        expect(result.current.canUpdateMemberRole('member2')).toBe(true);
        // Owner cannot update themselves
        expect(result.current.canUpdateMemberRole('member1')).toBe(false);
        // Cannot update non-existent member
        expect(result.current.canUpdateMemberRole('nonexistent')).toBe(false);
      });
    });

    it('should check member removal permissions correctly', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        // Owner can remove other members
        expect(result.current.canRemoveMember('member2')).toBe(true);
        // Owner cannot remove themselves
        expect(result.current.canRemoveMember('member1')).toBe(false);
        // Cannot remove non-existent member
        expect(result.current.canRemoveMember('nonexistent')).toBe(false);
      });
    });
  });

  describe('Member Management', () => {
    it('should invite a new member successfully', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await act(async () => {
        await result.current.inviteMember('newuser@example.com', 'viewer', 'Welcome!');
      });

      expect(result.current.invitations).toHaveLength(1);
      expect(result.current.invitations[0].email).toBe('newuser@example.com');
      expect(result.current.invitations[0].role).toBe('viewer');
    });

    it('should validate email format when inviting', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await expect(
        act(async () => {
          await result.current.inviteMember('invalid-email', 'viewer');
        })
      ).rejects.toThrow('Please enter a valid email address');
    });

    it('should prevent inviting existing members', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await expect(
        act(async () => {
          await result.current.inviteMember('user2@example.com', 'viewer');
        })
      ).rejects.toThrow('User is already a member of this project');
    });

    it('should update member role successfully', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await act(async () => {
        await result.current.updateMemberRole('member2', 'admin');
      });

      expect(mockUpdateProject).toHaveBeenCalledWith('project1', {
        members: expect.arrayContaining([
          expect.objectContaining({
            id: 'member2',
            role: 'admin'
          })
        ])
      });
    });

    it('should remove member successfully', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await act(async () => {
        await result.current.removeMember('member2');
      });

      expect(mockUpdateProject).toHaveBeenCalledWith('project1', {
        members: expect.not.arrayContaining([
          expect.objectContaining({ id: 'member2' })
        ])
      });
    });

    it('should prevent owners from removing themselves', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await expect(
        act(async () => {
          await result.current.removeMember('member1');
        })
      ).rejects.toThrow('You do not have permission to remove this member');
    });
  });

  describe('Utility Functions', () => {
    it('should get member by ID', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      const member = result.current.getMemberById('member1');
      expect(member).toEqual(mockProject.members[0]);
    });

    it('should get member by user ID', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      const member = result.current.getMemberByUserId('user1');
      expect(member).toEqual(mockProject.members[0]);
    });

    it('should get members by role', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      const owners = result.current.getMembersByRole('owner');
      expect(owners).toHaveLength(1);
      expect(owners[0].role).toBe('owner');

      const editors = result.current.getMembersByRole('editor');
      expect(editors).toHaveLength(1);
      expect(editors[0].role).toBe('editor');
    });

    it('should get active members', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      const activeMembers = result.current.getActiveMembers();
      expect(activeMembers).toHaveLength(2);
      expect(activeMembers.every(member => member.status === 'active')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should calculate member statistics correctly', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      expect(result.current.memberCount).toBe(2);
      expect(result.current.activeMemberCount).toBe(2);
      expect(result.current.pendingInvitationCount).toBe(0);
      expect(result.current.roleDistribution).toEqual({
        owner: 1,
        admin: 0,
        editor: 1,
        viewer: 0
      });
    });
  });

  describe('Ownership Transfer', () => {
    it('should transfer ownership successfully', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await act(async () => {
        await result.current.transferOwnership('user2');
      });

      expect(mockUpdateProject).toHaveBeenCalledWith('project1', {
        members: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user2',
            role: 'owner'
          }),
          expect.objectContaining({
            userId: 'user1',
            role: 'admin'
          })
        ]),
        ownerId: 'user2'
      });
    });

    it('should prevent non-owners from transferring ownership', async () => {
      const adminUser = { ...mockUser, uid: 'user2' };
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      const adminProject = {
        ...mockProject,
        members: [
          {
            id: 'member2',
            userId: 'user2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'admin' as ProjectRole,
            status: 'active',
            joinedAt: Date.now() - 43200000,
            updatedAt: Date.now() - 43200000
          }
        ]
      };

      mockGetProject.mockResolvedValue(adminProject);

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(adminProject.members);
      });

      await expect(
        act(async () => {
          await result.current.transferOwnership('user1');
        })
      ).rejects.toThrow('You do not have permission to update this member\'s role');
    });
  });

  describe('Leave Project', () => {
    it('should allow non-owners to leave project', async () => {
      const editorUser = { ...mockUser, uid: 'user2' };
      mockUseAuth.mockReturnValue({
        user: editorUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      const editorProject = {
        ...mockProject,
        members: [
          {
            id: 'member2',
            userId: 'user2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'editor' as ProjectRole,
            status: 'active',
            joinedAt: Date.now() - 43200000,
            updatedAt: Date.now() - 43200000
          }
        ]
      };

      mockGetProject.mockResolvedValue(editorProject);

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(editorProject.members);
      });

      await act(async () => {
        await result.current.leaveProject();
      });

      expect(mockUpdateProject).toHaveBeenCalledWith('project1', {
        members: []
      });
    });

    it('should prevent owners from leaving project', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await expect(
        act(async () => {
          await result.current.leaveProject();
        })
      ).rejects.toThrow('Project owners cannot leave the project. Transfer ownership first.');
    });
  });

  describe('Error Handling', () => {
    it('should handle member loading errors', async () => {
      mockGetProject.mockRejectedValue(new Error('Failed to load project'));

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load project');
      });
    });

    it('should handle invitation errors', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await act(async () => {
        try {
          await result.current.inviteMember('invalid-email', 'viewer');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.inviteError).toBe('Please enter a valid email address');
    });

    it('should handle update errors', async () => {
      mockUpdateProject.mockRejectedValue(new Error('Failed to update project'));

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await act(async () => {
        try {
          await result.current.updateMemberRole('member2', 'admin');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.updateError).toBe('Failed to update project');
    });

    it('should handle deletion errors', async () => {
      mockUpdateProject.mockRejectedValue(new Error('Failed to update project'));

      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      await act(async () => {
        try {
          await result.current.removeMember('member2');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.deleteError).toBe('Failed to update project');
    });
  });

  describe('Loading States', () => {
    it('should manage loading states correctly', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInviting).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
    });

    it('should set inviting state during invitation', async () => {
      const { result } = renderHook(() => useProjectMembers({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.members).toEqual(mockProject.members);
      });

      const invitePromise = act(async () => {
        await result.current.inviteMember('newuser@example.com', 'viewer');
      });

      // Check that inviting state is set during the operation
      expect(result.current.isInviting).toBe(true);

      await invitePromise;

      expect(result.current.isInviting).toBe(false);
    });
  });
});

