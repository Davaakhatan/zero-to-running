// Unit tests for usePermissions hook
// Tests for permission checking and role-based access control

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { useProjectMembers } from './useProjectMembers';
import { ProjectRole, Permission } from '../types';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('./useProjectMembers');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjectMembers = useProjectMembers as jest.MockedFunction<typeof useProjectMembers>;

// Test data
const mockUser = {
  uid: 'user1',
  email: 'user1@example.com',
  displayName: 'User One'
};

describe('usePermissions', () => {
  const mockHasPermission = jest.fn();
  const mockHasAnyPermission = jest.fn();
  const mockHasAllPermissions = jest.fn();
  const mockHasRole = jest.fn();
  const mockHasAnyRole = jest.fn();
  const mockGetPermissionsForRole = jest.fn();
  const mockGetRolesForPermission = jest.fn();
  const mockGetPermissionInfo = jest.fn();
  const mockGetPermissionsByCategory = jest.fn();
  const mockGetAllCategories = jest.fn();

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

    mockUseProjectMembers.mockReturnValue({
      members: [],
      invitations: [],
      currentUserRole: 'editor',
      isOwner: false,
      isAdmin: false,
      isEditor: true,
      isViewer: false,
      inviteMember: jest.fn(),
      updateMemberRole: jest.fn(),
      removeMember: jest.fn(),
      resendInvitation: jest.fn(),
      cancelInvitation: jest.fn(),
      transferOwnership: jest.fn(),
      leaveProject: jest.fn(),
      canInviteMembers: false,
      canUpdateMemberRole: false,
      canRemoveMember: false,
      canTransferOwnership: false,
      canLeaveProject: false,
      getMemberById: jest.fn(),
      getMemberByUserId: jest.fn(),
      getMembersByRole: jest.fn(),
      getActiveMembers: jest.fn(),
      getPendingInvitations: jest.fn(),
      getExpiredInvitations: jest.fn(),
      memberCount: 0,
      activeMemberCount: 0,
      pendingInvitationCount: 0,
      roleDistribution: {},
      isLoading: false,
      isInviting: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      inviteError: null,
      updateError: null,
      deleteError: null
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct user role', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.currentUserRole).toBe('editor');
      expect(result.current.isOwner).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isEditor).toBe(true);
      expect(result.current.isViewer).toBe(false);
    });

    it('should handle no user role', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        currentUserRole: null
      });

      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.currentUserRole).toBeNull();
      expect(result.current.isOwner).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isEditor).toBe(false);
      expect(result.current.isViewer).toBe(false);
    });

    it('should handle loading state', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isLoading: true
      });

      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        error: 'Failed to load members'
      });

      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.error).toBe('Failed to load members');
    });
  });

  describe('Permission Checking', () => {
    it('should check single permission correctly', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor should have canvas.edit permission
      expect(result.current.hasPermission('canvas.edit')).toBe(true);
      
      // Editor should not have project.delete permission
      expect(result.current.hasPermission('project.delete')).toBe(false);
    });

    it('should check multiple permissions with any logic', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor should have at least one of these permissions
      expect(result.current.hasAnyPermission(['canvas.edit', 'project.delete'])).toBe(true);
      
      // Editor should not have any of these permissions
      expect(result.current.hasAnyPermission(['project.delete', 'members.transfer_ownership'])).toBe(false);
    });

    it('should check multiple permissions with all logic', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor should have all of these permissions
      expect(result.current.hasAllPermissions(['canvas.edit', 'shapes.create'])).toBe(true);
      
      // Editor should not have all of these permissions
      expect(result.current.hasAllPermissions(['canvas.edit', 'project.delete'])).toBe(false);
    });

    it('should return false for non-existent permission', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasPermission('non.existent' as Permission)).toBe(false);
    });
  });

  describe('Role Checking', () => {
    it('should check single role correctly', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasRole('editor')).toBe(true);
      expect(result.current.hasRole('owner')).toBe(false);
    });

    it('should check multiple roles with any logic', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasAnyRole(['editor', 'admin'])).toBe(true);
      expect(result.current.hasAnyRole(['owner', 'admin'])).toBe(false);
    });

    it('should check multiple roles with all logic', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // This should always be false for a single user
      expect(result.current.hasAllRoles(['editor', 'admin'])).toBe(false);
    });
  });

  describe('Permission Utilities', () => {
    it('should get permissions for a role', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      const editorPermissions = result.current.getPermissionsForRole('editor');
      
      expect(editorPermissions).toContain('canvas.edit');
      expect(editorPermissions).toContain('shapes.create');
      expect(editorPermissions).not.toContain('project.delete');
    });

    it('should get roles for a permission', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      const canvasEditRoles = result.current.getRolesForPermission('canvas.edit');
      
      expect(canvasEditRoles).toContain('owner');
      expect(canvasEditRoles).toContain('admin');
      expect(canvasEditRoles).toContain('editor');
      expect(canvasEditRoles).not.toContain('viewer');
    });

    it('should get permission info', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      const info = result.current.getPermissionInfo('canvas.edit');
      
      expect(info).toEqual({
        roles: ['owner', 'admin', 'editor'],
        description: 'Modify canvas properties and settings',
        category: 'Canvas'
      });
    });

    it('should return null for non-existent permission info', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      const info = result.current.getPermissionInfo('non.existent' as Permission);
      
      expect(info).toBeNull();
    });

    it('should get permissions by category', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      const canvasPermissions = result.current.getPermissionsByCategory('Canvas');
      
      expect(canvasPermissions).toContain('canvas.view');
      expect(canvasPermissions).toContain('canvas.edit');
      expect(canvasPermissions).toContain('canvas.create');
      expect(canvasPermissions).toContain('canvas.delete');
      expect(canvasPermissions).toContain('canvas.duplicate');
    });

    it('should get all categories', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      const categories = result.current.getAllCategories();
      
      expect(categories).toContain('Project');
      expect(categories).toContain('Members');
      expect(categories).toContain('Canvas');
      expect(categories).toContain('Shapes');
      expect(categories).toContain('Collaboration');
      expect(categories).toContain('Export');
      expect(categories).toContain('AI');
    });
  });

  describe('UI Helpers', () => {
    it('should provide view permission check', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.canView('canvas.view')).toBe(true);
      expect(result.current.canView('project.delete')).toBe(false);
    });

    it('should provide edit permission check', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.canEdit('canvas.edit')).toBe(true);
      expect(result.current.canEdit('project.delete')).toBe(false);
    });

    it('should provide delete permission check', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.canDelete('shapes.delete')).toBe(true);
      expect(result.current.canDelete('project.delete')).toBe(false);
    });

    it('should provide create permission check', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.canCreate('shapes.create')).toBe(true);
      expect(result.current.canCreate('project.delete')).toBe(false);
    });
  });

  describe('Specific Permission Checks', () => {
    it('should check project management permissions', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor can edit but not delete
      expect(result.current.canManageProject).toBe(true);
    });

    it('should check member management permissions', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor cannot manage members
      expect(result.current.canManageMembers).toBe(false);
    });

    it('should check canvas editing permissions', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor can edit canvas
      expect(result.current.canEditCanvas).toBe(true);
    });

    it('should check shape creation permissions', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor can create shapes
      expect(result.current.canCreateShapes).toBe(true);
    });

    it('should check AI usage permissions', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor can use AI
      expect(result.current.canUseAI).toBe(true);
    });

    it('should check export permissions', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Editor can export canvas
      expect(result.current.canExport).toBe(true);
    });
  });

  describe('Role-based Permission Checks', () => {
    it('should handle owner permissions', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        currentUserRole: 'owner',
        isOwner: true,
        isAdmin: false,
        isEditor: false,
        isViewer: false
      });

      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasPermission('project.delete')).toBe(true);
      expect(result.current.hasPermission('members.transfer_ownership')).toBe(true);
      expect(result.current.canManageProject).toBe(true);
      expect(result.current.canManageMembers).toBe(true);
    });

    it('should handle admin permissions', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        currentUserRole: 'admin',
        isOwner: false,
        isAdmin: true,
        isEditor: false,
        isViewer: false
      });

      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasPermission('project.delete')).toBe(false);
      expect(result.current.hasPermission('members.invite')).toBe(true);
      expect(result.current.canManageProject).toBe(true);
      expect(result.current.canManageMembers).toBe(true);
    });

    it('should handle viewer permissions', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        currentUserRole: 'viewer',
        isOwner: false,
        isAdmin: false,
        isEditor: false,
        isViewer: true
      });

      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasPermission('canvas.view')).toBe(true);
      expect(result.current.hasPermission('canvas.edit')).toBe(false);
      expect(result.current.hasPermission('shapes.create')).toBe(false);
      expect(result.current.canManageProject).toBe(false);
      expect(result.current.canManageMembers).toBe(false);
      expect(result.current.canEditCanvas).toBe(false);
      expect(result.current.canCreateShapes).toBe(false);
    });
  });

  describe('Permission Categories', () => {
    it('should correctly categorize permissions', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      const projectPermissions = result.current.getPermissionsByCategory('Project');
      expect(projectPermissions).toContain('project.view');
      expect(projectPermissions).toContain('project.edit');
      expect(projectPermissions).toContain('project.delete');
      expect(projectPermissions).toContain('project.archive');
      expect(projectPermissions).toContain('project.settings');

      const memberPermissions = result.current.getPermissionsByCategory('Members');
      expect(memberPermissions).toContain('members.view');
      expect(memberPermissions).toContain('members.invite');
      expect(memberPermissions).toContain('members.edit');
      expect(memberPermissions).toContain('members.remove');
      expect(memberPermissions).toContain('members.transfer_ownership');

      const canvasPermissions = result.current.getPermissionsByCategory('Canvas');
      expect(canvasPermissions).toContain('canvas.view');
      expect(canvasPermissions).toContain('canvas.edit');
      expect(canvasPermissions).toContain('canvas.create');
      expect(canvasPermissions).toContain('canvas.delete');
      expect(canvasPermissions).toContain('canvas.duplicate');

      const shapePermissions = result.current.getPermissionsByCategory('Shapes');
      expect(shapePermissions).toContain('shapes.view');
      expect(shapePermissions).toContain('shapes.create');
      expect(shapePermissions).toContain('shapes.edit');
      expect(shapePermissions).toContain('shapes.delete');
      expect(shapePermissions).toContain('shapes.lock');
      expect(shapePermissions).toContain('shapes.unlock');

      const collaborationPermissions = result.current.getPermissionsByCategory('Collaboration');
      expect(collaborationPermissions).toContain('collaboration.view_cursors');
      expect(collaborationPermissions).toContain('collaboration.view_presence');
      expect(collaborationPermissions).toContain('collaboration.chat');
      expect(collaborationPermissions).toContain('collaboration.comments');

      const exportPermissions = result.current.getPermissionsByCategory('Export');
      expect(exportPermissions).toContain('export.canvas');
      expect(exportPermissions).toContain('export.shapes');
      expect(exportPermissions).toContain('export.project');

      const aiPermissions = result.current.getPermissionsByCategory('AI');
      expect(aiPermissions).toContain('ai.assistant');
      expect(aiPermissions).toContain('ai.commands');
      expect(aiPermissions).toContain('ai.generate');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permission arrays', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasAnyPermission([])).toBe(false);
      expect(result.current.hasAllPermissions([])).toBe(true);
      expect(result.current.hasAnyRole([])).toBe(false);
    });

    it('should handle null user role', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        currentUserRole: null
      });

      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      expect(result.current.hasPermission('canvas.view')).toBe(false);
      expect(result.current.hasRole('editor')).toBe(false);
      expect(result.current.canManageProject).toBe(false);
    });

    it('should handle disabled hook', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1', enabled: false }));

      expect(result.current.currentUserRole).toBe('editor');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Permission Configuration', () => {
    it('should have correct permission mappings', () => {
      const { result } = renderHook(() => usePermissions({ projectId: 'project1' }));

      // Test specific permission mappings
      expect(result.current.getRolesForPermission('project.view')).toEqual(['owner', 'admin', 'editor', 'viewer']);
      expect(result.current.getRolesForPermission('project.edit')).toEqual(['owner', 'admin', 'editor']);
      expect(result.current.getRolesForPermission('project.delete')).toEqual(['owner']);
      expect(result.current.getRolesForPermission('members.invite')).toEqual(['owner', 'admin']);
      expect(result.current.getRolesForPermission('members.transfer_ownership')).toEqual(['owner']);
      expect(result.current.getRolesForPermission('canvas.view')).toEqual(['owner', 'admin', 'editor', 'viewer']);
      expect(result.current.getRolesForPermission('canvas.edit')).toEqual(['owner', 'admin', 'editor']);
      expect(result.current.getRolesForPermission('shapes.create')).toEqual(['owner', 'admin', 'editor']);
      expect(result.current.getRolesForPermission('ai.assistant')).toEqual(['owner', 'admin', 'editor']);
      expect(result.current.getRolesForPermission('export.canvas')).toEqual(['owner', 'admin', 'editor', 'viewer']);
    });
  });
});
