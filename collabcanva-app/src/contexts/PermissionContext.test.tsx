// Unit tests for PermissionContext
// Tests for permission context provider and components

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionProvider, usePermissionContext, PermissionGuard, RoleGuard, PermissionButton, PermissionLink } from './PermissionContext';
import { useAuth } from './AuthContext';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { ProjectRole, Permission } from '../types';

// Mock dependencies
jest.mock('./AuthContext');
jest.mock('../hooks/useProjectMembers');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjectMembers = useProjectMembers as jest.MockedFunction<typeof useProjectMembers>;

// Test data
const mockUser = {
  uid: 'user1',
  email: 'user1@example.com',
  displayName: 'User One'
};

// Test component that uses permission context
const TestComponent: React.FC = () => {
  const { hasPermission, currentUserRole, canEdit } = usePermissionContext();
  
  return (
    <div>
      <div data-testid="user-role">{currentUserRole}</div>
      <div data-testid="can-edit">{canEdit ? 'true' : 'false'}</div>
      <div data-testid="can-edit-canvas">{hasPermission('canvas.edit') ? 'true' : 'false'}</div>
    </div>
  );
};

// Test wrapper component
const TestWrapper: React.FC<{ projectId: string; enabled?: boolean }> = ({ projectId, enabled = true }) => (
  <PermissionProvider projectId={projectId} enabled={enabled}>
    <TestComponent />
  </PermissionProvider>
);

describe('PermissionContext', () => {
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

  describe('PermissionProvider', () => {
    it('should provide permission context to children', () => {
      render(<TestWrapper projectId="project1" />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('editor');
      expect(screen.getByTestId('can-edit')).toHaveTextContent('true');
      expect(screen.getByTestId('can-edit-canvas')).toHaveTextContent('true');
    });

    it('should handle loading state', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isLoading: true
      });

      render(<TestWrapper projectId="project1" />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('editor');
      expect(screen.getByTestId('can-edit')).toHaveTextContent('true');
    });

    it('should handle error state', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        error: 'Failed to load members'
      });

      render(<TestWrapper projectId="project1" />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('editor');
      expect(screen.getByTestId('can-edit')).toHaveTextContent('true');
    });

    it('should handle disabled state', () => {
      render(<TestWrapper projectId="project1" enabled={false} />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('editor');
      expect(screen.getByTestId('can-edit')).toHaveTextContent('true');
    });
  });

  describe('usePermissionContext', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentWithoutProvider: React.FC = () => {
        usePermissionContext();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('usePermissionContext must be used within a PermissionProvider');

      consoleSpy.mockRestore();
    });

    it('should provide correct permission context values', () => {
      const TestContextValues: React.FC = () => {
        const context = usePermissionContext();
        
        return (
          <div>
            <div data-testid="current-user-role">{context.currentUserRole}</div>
            <div data-testid="is-owner">{context.isOwner ? 'true' : 'false'}</div>
            <div data-testid="is-admin">{context.isAdmin ? 'true' : 'false'}</div>
            <div data-testid="is-editor">{context.isEditor ? 'true' : 'false'}</div>
            <div data-testid="is-viewer">{context.isViewer ? 'true' : 'false'}</div>
            <div data-testid="can-edit">{context.canEdit ? 'true' : 'false'}</div>
            <div data-testid="can-delete">{context.canDelete ? 'true' : 'false'}</div>
            <div data-testid="can-invite">{context.canInvite ? 'true' : 'false'}</div>
            <div data-testid="can-manage">{context.canManage ? 'true' : 'false'}</div>
            <div data-testid="can-transfer">{context.canTransfer ? 'true' : 'false'}</div>
            <div data-testid="can-use-ai">{context.canUseAI ? 'true' : 'false'}</div>
            <div data-testid="can-export">{context.canExport ? 'true' : 'false'}</div>
            <div data-testid="is-loading">{context.isLoading ? 'true' : 'false'}</div>
            <div data-testid="error">{context.error || 'none'}</div>
          </div>
        );
      };

      render(
        <PermissionProvider projectId="project1">
          <TestContextValues />
        </PermissionProvider>
      );

      expect(screen.getByTestId('current-user-role')).toHaveTextContent('editor');
      expect(screen.getByTestId('is-owner')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('is-editor')).toHaveTextContent('true');
      expect(screen.getByTestId('is-viewer')).toHaveTextContent('false');
      expect(screen.getByTestId('can-edit')).toHaveTextContent('true');
      expect(screen.getByTestId('can-delete')).toHaveTextContent('false');
      expect(screen.getByTestId('can-invite')).toHaveTextContent('false');
      expect(screen.getByTestId('can-manage')).toHaveTextContent('false');
      expect(screen.getByTestId('can-transfer')).toHaveTextContent('false');
      expect(screen.getByTestId('can-use-ai')).toHaveTextContent('true');
      expect(screen.getByTestId('can-export')).toHaveTextContent('true');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });

  describe('PermissionGuard', () => {
    it('should render children when user has permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="canvas.edit">
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user lacks permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="project.delete">
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard 
            permission="project.delete" 
            fallback={<div data-testid="fallback">Access Denied</div>}
          >
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('should handle multiple permissions with any logic', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permissions={['canvas.edit', 'project.delete']}>
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle multiple permissions with all logic', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard 
            permissions={['canvas.edit', 'project.delete']} 
            requireAll={true}
          >
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('RoleGuard', () => {
    it('should render children when user has role', () => {
      render(
        <PermissionProvider projectId="project1">
          <RoleGuard role="editor">
            <div data-testid="protected-content">Protected Content</div>
          </RoleGuard>
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user lacks role', () => {
      render(
        <PermissionProvider projectId="project1">
          <RoleGuard role="owner">
            <div data-testid="protected-content">Protected Content</div>
          </RoleGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks role', () => {
      render(
        <PermissionProvider projectId="project1">
          <RoleGuard 
            role="owner" 
            fallback={<div data-testid="fallback">Access Denied</div>}
          >
            <div data-testid="protected-content">Protected Content</div>
          </RoleGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('should handle multiple roles with any logic', () => {
      render(
        <PermissionProvider projectId="project1">
          <RoleGuard roles={['editor', 'admin']}>
            <div data-testid="protected-content">Protected Content</div>
          </RoleGuard>
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle multiple roles with all logic', () => {
      render(
        <PermissionProvider projectId="project1">
          <RoleGuard 
            roles={['editor', 'admin']} 
            requireAll={true}
          >
            <div data-testid="protected-content">Protected Content</div>
          </RoleGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('PermissionButton', () => {
    it('should render button when user has permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionButton permission="canvas.edit" onClick={() => {}}>
            Edit Canvas
          </PermissionButton>
        </PermissionProvider>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Edit Canvas');
    });

    it('should not render button when user lacks permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionButton permission="project.delete" onClick={() => {}}>
            Delete Project
          </PermissionButton>
        </PermissionProvider>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionButton 
            permission="project.delete" 
            onClick={() => {}}
            fallback={<div data-testid="fallback">Access Denied</div>}
          >
            Delete Project
          </PermissionButton>
        </PermissionProvider>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('should handle button click when user has permission', () => {
      const handleClick = jest.fn();

      render(
        <PermissionProvider projectId="project1">
          <PermissionButton permission="canvas.edit" onClick={handleClick}>
            Edit Canvas
          </PermissionButton>
        </PermissionProvider>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('PermissionLink', () => {
    it('should render link when user has permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionLink permission="canvas.edit" href="/canvas/edit">
            Edit Canvas
          </PermissionLink>
        </PermissionProvider>
      );

      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveTextContent('Edit Canvas');
      expect(screen.getByRole('link')).toHaveAttribute('href', '/canvas/edit');
    });

    it('should not render link when user lacks permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionLink permission="project.delete" href="/project/delete">
            Delete Project
          </PermissionLink>
        </PermissionProvider>
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionLink 
            permission="project.delete" 
            href="/project/delete"
            fallback={<div data-testid="fallback">Access Denied</div>}
          >
            Delete Project
          </PermissionLink>
        </PermissionProvider>
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
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

      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="project.delete">
            <div data-testid="owner-content">Owner Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.getByTestId('owner-content')).toBeInTheDocument();
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

      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="members.invite">
            <div data-testid="admin-content">Admin Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
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

      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="canvas.view">
            <div data-testid="viewer-content">Viewer Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.getByTestId('viewer-content')).toBeInTheDocument();
    });

    it('should handle viewer restrictions', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        currentUserRole: 'viewer',
        isOwner: false,
        isAdmin: false,
        isEditor: false,
        isViewer: true
      });

      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="canvas.edit">
            <div data-testid="viewer-content">Viewer Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('viewer-content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user role', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        currentUserRole: null
      });

      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="canvas.edit">
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should handle empty permission arrays', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permissions={[]}>
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should handle non-existent permissions', () => {
      render(
        <PermissionProvider projectId="project1">
          <PermissionGuard permission="non.existent" as Permission>
            <div data-testid="protected-content">Protected Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
