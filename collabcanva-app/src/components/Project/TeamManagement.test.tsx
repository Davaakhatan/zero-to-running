// Unit tests for TeamManagement component
// Tests for team member management UI and interactions

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamManagement } from './TeamManagement';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectMember, ProjectRole, ProjectInvitation } from "../../types"

// Mock dependencies
jest.mock('../../hooks/useProjectMembers');
jest.mock('../../contexts/AuthContext');

const mockUseProjectMembers = useProjectMembers as jest.MockedFunction<typeof useProjectMembers>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test data
const mockUser = {
  uid: 'user1',
  email: 'user1@example.com',
  displayName: 'User One'
};

const mockMembers: ProjectMember[] = [
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
  },
  {
    id: 'member3',
    userId: 'user3',
    email: 'user3@example.com',
    name: 'User Three',
    role: 'viewer',
    status: 'active',
    joinedAt: Date.now() - 21600000,
    updatedAt: Date.now() - 21600000
  }
];

const mockInvitations: ProjectInvitation[] = [
  {
    id: 'invitation1',
    projectId: 'project1',
    email: 'user4@example.com',
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
    email: 'user5@example.com',
    role: 'viewer',
    message: '',
    inviterId: 'user1',
    inviterName: 'User One',
    status: 'pending',
    createdAt: Date.now() - 86400000,
    expiresAt: Date.now() - 3600000, // Expired
    updatedAt: Date.now() - 86400000
  }
];

describe('TeamManagement', () => {
  const mockInviteMember = jest.fn();
  const mockUpdateMemberRole = jest.fn();
  const mockRemoveMember = jest.fn();
  const mockResendInvitation = jest.fn();
  const mockCancelInvitation = jest.fn();
  const mockTransferOwnership = jest.fn();
  const mockLeaveProject = jest.fn();
  const mockRefreshMembers = jest.fn();
  const mockRefreshInvitations = jest.fn();

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
      members: mockMembers,
      invitations: mockInvitations,
      currentUserRole: 'owner',
      isOwner: true,
      isAdmin: false,
      isEditor: false,
      isViewer: false,
      isLoading: false,
      isInviting: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      inviteError: null,
      updateError: null,
      deleteError: null,
      inviteMember: mockInviteMember,
      updateMemberRole: mockUpdateMemberRole,
      removeMember: mockRemoveMember,
      resendInvitation: mockResendInvitation,
      cancelInvitation: mockCancelInvitation,
      canInviteMembers: true,
      canUpdateMemberRole: jest.fn().mockReturnValue(true),
      canRemoveMember: jest.fn().mockReturnValue(true),
      canManageInvitations: true,
      canTransferOwnership: true,
      getMemberById: jest.fn(),
      getMemberByUserId: jest.fn(),
      getMembersByRole: jest.fn(),
      getActiveMembers: jest.fn().mockReturnValue(mockMembers),
      getPendingInvitations: jest.fn().mockReturnValue([mockInvitations[0]]),
      getExpiredInvitations: jest.fn().mockReturnValue([mockInvitations[1]]),
      memberCount: mockMembers.length,
      activeMemberCount: mockMembers.length,
      pendingInvitationCount: 1,
      roleDistribution: {
        owner: 1,
        admin: 0,
        editor: 1,
        viewer: 1
      },
      transferOwnership: mockTransferOwnership,
      leaveProject: mockLeaveProject,
      refreshMembers: mockRefreshMembers,
      refreshInvitations: mockRefreshInvitations
    });

    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render team management interface', () => {
      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Team Management')).toBeInTheDocument();
      expect(screen.getByText('3 members • 1 pending invitations')).toBeInTheDocument();
      expect(screen.getByText('Invite Member')).toBeInTheDocument();
      expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
    });

    it('should render member cards', () => {
      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
      expect(screen.getByText('User Three')).toBeInTheDocument();
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    it('should render invitation cards', () => {
      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('user4@example.com')).toBeInTheDocument();
      expect(screen.getByText('user5@example.com')).toBeInTheDocument();
      expect(screen.getByText('Invited by User One')).toBeInTheDocument();
    });

    it('should render role badges correctly', () => {
      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('should render status badges correctly', () => {
      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isLoading: true
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Team Management')).toBeInTheDocument();
      // Loading skeleton should be visible
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        error: 'Failed to load team members'
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Failed to Load Team')).toBeInTheDocument();
      expect(screen.getByText('Failed to load team members')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle refresh on error', async () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        error: 'Failed to load team members'
      });

      render(<TeamManagement projectId="project1" />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockRefreshMembers).toHaveBeenCalled();
    });
  });

  describe('Search and Filtering', () => {
    it('should filter members by search query', async () => {
      render(<TeamManagement projectId="project1" />);

      const searchInput = screen.getByPlaceholderText('Search members...');
      fireEvent.change(searchInput, { target: { value: 'User Two' } });

      await waitFor(() => {
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
        expect(screen.queryByText('User Three')).not.toBeInTheDocument();
      });
    });

    it('should filter members by role', async () => {
      render(<TeamManagement projectId="project1" />);

      const roleFilter = screen.getByDisplayValue('All Roles');
      fireEvent.change(roleFilter, { target: { value: 'editor' } });

      await waitFor(() => {
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
        expect(screen.queryByText('User Three')).not.toBeInTheDocument();
      });
    });

    it('should filter by status', async () => {
      render(<TeamManagement projectId="project1" />);

      const statusFilter = screen.getByDisplayValue('All Status');
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(screen.getByText('user4@example.com')).toBeInTheDocument();
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
      });
    });
  });

  describe('Invite Member', () => {
    it('should open invite modal when invite button is clicked', async () => {
      render(<TeamManagement projectId="project1" />);

      const inviteButton = screen.getByText('Invite Member');
      fireEvent.click(inviteButton);

      await waitFor(() => {
        expect(screen.getByText('Invite Member')).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Role')).toBeInTheDocument();
        expect(screen.getByLabelText('Message (Optional)')).toBeInTheDocument();
      });
    });

    it('should submit invitation form', async () => {
      render(<TeamManagement projectId="project1" />);

      const inviteButton = screen.getByText('Invite Member');
      fireEvent.click(inviteButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText('Email Address');
      const roleSelect = screen.getByLabelText('Role');
      const messageInput = screen.getByLabelText('Message (Optional)');
      const submitButton = screen.getByText('Send Invitation');

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(roleSelect, { target: { value: 'viewer' } });
      fireEvent.change(messageInput, { target: { value: 'Welcome!' } });

      fireEvent.click(submitButton);

      expect(mockInviteMember).toHaveBeenCalledWith('newuser@example.com', 'viewer', 'Welcome!');
    });

    it('should show loading state during invitation', async () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isInviting: true
      });

      render(<TeamManagement projectId="project1" />);

      const inviteButton = screen.getByText('Invite Member');
      fireEvent.click(inviteButton);

      await waitFor(() => {
        expect(screen.getByText('Inviting...')).toBeInTheDocument();
      });
    });

    it('should show invitation error', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        inviteError: 'Email already exists'
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  describe('Role Management', () => {
    it('should open role modal when edit button is clicked', async () => {
      render(<TeamManagement projectId="project1" />);

      const editButtons = screen.getAllByTitle('Update role');
      fireEvent.click(editButtons[0]); // Click on User Two's edit button

      await waitFor(() => {
        expect(screen.getByText('Update Role')).toBeInTheDocument();
        expect(screen.getByText('Update the role for User Two')).toBeInTheDocument();
      });
    });

    it('should update member role', async () => {
      render(<TeamManagement projectId="project1" />);

      const editButtons = screen.getAllByTitle('Update role');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Update Role')).toBeInTheDocument();
      });

      const adminRoleButton = screen.getByText('Admin');
      fireEvent.click(adminRoleButton);

      expect(mockUpdateMemberRole).toHaveBeenCalledWith('member2', 'admin');
    });

    it('should show current role as selected', async () => {
      render(<TeamManagement projectId="project1" />);

      const editButtons = screen.getAllByTitle('Update role');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Update Role')).toBeInTheDocument();
      });

      // Editor role should be selected (current role for User Two)
      const editorButton = screen.getByText('Editor').closest('button');
      expect(editorButton).toHaveClass('border-blue-500');
    });

    it('should show loading state during role update', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isUpdating: true
      });

      render(<TeamManagement projectId="project1" />);

      // Should show loading state in UI
      expect(screen.getByText('Team Management')).toBeInTheDocument();
    });

    it('should show role update error', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        updateError: 'Failed to update role'
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Failed to update role')).toBeInTheDocument();
    });
  });

  describe('Member Removal', () => {
    it('should remove member when delete button is clicked', async () => {
      render(<TeamManagement projectId="project1" />);

      const deleteButtons = screen.getAllByTitle('Remove member');
      fireEvent.click(deleteButtons[0]); // Click on User Two's delete button

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to remove this member from the project?');
      expect(mockRemoveMember).toHaveBeenCalledWith('member2');
    });

    it('should not remove member if confirmation is cancelled', async () => {
      window.confirm = jest.fn().mockReturnValue(false);

      render(<TeamManagement projectId="project1" />);

      const deleteButtons = screen.getAllByTitle('Remove member');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockRemoveMember).not.toHaveBeenCalled();
    });

    it('should show removal error', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        deleteError: 'Failed to remove member'
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Failed to remove member')).toBeInTheDocument();
    });
  });

  describe('Ownership Transfer', () => {
    it('should open transfer modal when transfer button is clicked', async () => {
      render(<TeamManagement projectId="project1" />);

      const transferButton = screen.getByText('Transfer Ownership');
      fireEvent.click(transferButton);

      await waitFor(() => {
        expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
        expect(screen.getByText('Select a member to transfer project ownership to. This action cannot be undone.')).toBeInTheDocument();
      });
    });

    it('should transfer ownership to selected member', async () => {
      render(<TeamManagement projectId="project1" />);

      const transferButton = screen.getByText('Transfer Ownership');
      fireEvent.click(transferButton);

      await waitFor(() => {
        expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
      });

      const memberButton = screen.getByText('User Two');
      fireEvent.click(memberButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to transfer ownership? This action cannot be undone.');
      expect(mockTransferOwnership).toHaveBeenCalledWith('user2');
    });

    it('should not show transfer button for non-owners', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isOwner: false,
        canTransferOwnership: false
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.queryByText('Transfer Ownership')).not.toBeInTheDocument();
    });
  });

  describe('Leave Project', () => {
    it('should show leave button for non-owners', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isOwner: false,
        currentUserRole: 'editor'
      });

      render(<TeamManagement projectId="project1" />);

      const leaveButtons = screen.getAllByTitle('Leave project');
      expect(leaveButtons.length).toBeGreaterThan(0);
    });

    it('should open leave modal when leave button is clicked', async () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isOwner: false,
        currentUserRole: 'editor'
      });

      render(<TeamManagement projectId="project1" />);

      const leaveButtons = screen.getAllByTitle('Leave project');
      fireEvent.click(leaveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Leave Project')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to leave this project? You will lose access to all project content and will need to be re-invited to regain access.')).toBeInTheDocument();
      });
    });

    it('should leave project when confirmed', async () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        isOwner: false,
        currentUserRole: 'editor'
      });

      render(<TeamManagement projectId="project1" />);

      const leaveButtons = screen.getAllByTitle('Leave project');
      fireEvent.click(leaveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Leave Project')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Leave Project');
      fireEvent.click(confirmButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to leave this project?');
      expect(mockLeaveProject).toHaveBeenCalled();
    });
  });

  describe('Invitation Management', () => {
    it('should resend invitation when resend button is clicked', async () => {
      render(<TeamManagement projectId="project1" />);

      const resendButtons = screen.getAllByTitle('Resend invitation');
      fireEvent.click(resendButtons[0]);

      expect(mockResendInvitation).toHaveBeenCalledWith('invitation1');
    });

    it('should cancel invitation when cancel button is clicked', async () => {
      render(<TeamManagement projectId="project1" />);

      const cancelButtons = screen.getAllByTitle('Cancel invitation');
      fireEvent.click(cancelButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel this invitation?');
      expect(mockCancelInvitation).toHaveBeenCalledWith('invitation1');
    });

    it('should not show invitation actions for non-managers', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        canManageInvitations: false
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.queryByTitle('Resend invitation')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Cancel invitation')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no members found', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        members: [],
        invitations: [],
        memberCount: 0,
        pendingInvitationCount: 0
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('No members found')).toBeInTheDocument();
      expect(screen.getByText('Start by inviting team members to your project')).toBeInTheDocument();
      expect(screen.getByText('Invite First Member')).toBeInTheDocument();
    });

    it('should show filtered empty state', async () => {
      render(<TeamManagement projectId="project1" />);

      const searchInput = screen.getByPlaceholderText('Search members...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
      });
    });
  });

  describe('Permission Checks', () => {
    it('should not show invite button for non-inviters', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        canInviteMembers: false
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.queryByText('Invite Member')).not.toBeInTheDocument();
    });

    it('should not show edit buttons for non-updaters', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        canUpdateMemberRole: jest.fn().mockReturnValue(false)
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.queryByTitle('Update role')).not.toBeInTheDocument();
    });

    it('should not show delete buttons for non-removers', () => {
      mockUseProjectMembers.mockReturnValue({
        ...mockUseProjectMembers(),
        canRemoveMember: jest.fn().mockReturnValue(false)
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.queryByTitle('Remove member')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TeamManagement projectId="project1" />);

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Message (Optional)')).toBeInTheDocument();
    });

    it('should have proper button titles', () => {
      render(<TeamManagement projectId="project1" />);

      expect(screen.getAllByTitle('Update role')).toHaveLength(2); // User Two and User Three
      expect(screen.getAllByTitle('Remove member')).toHaveLength(2); // User Two and User Three
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TeamManagement projectId="project1" />);

      const inviteButton = screen.getByText('Invite Member');
      await user.tab();
      await user.tab();
      await user.tab();
      
      expect(inviteButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<TeamManagement projectId="project1" />);

      expect(screen.getByText('Team Management')).toBeInTheDocument();
      expect(screen.getByText('Invite Member')).toBeInTheDocument();
    });
  });
});
