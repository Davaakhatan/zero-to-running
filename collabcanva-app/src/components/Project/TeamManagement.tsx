// TeamManagement component for project team member management
// Comprehensive UI for managing project members, roles, and invitations

import React, { useState, useCallback, useMemo } from 'react';
import { 
  UserGroupIcon, 
  PlusIcon, 
  EllipsisVerticalIcon,
  UserIcon,
  ShieldCheckIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectMember, ProjectRole, ProjectInvitation } from "../../types"
import { projectHelpers } from '../../utils/projectHelpers';

// Component props
interface TeamManagementProps {
  projectId: string;
  className?: string;
}

// Member role display configuration
const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    description: 'Full project control',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: ShieldCheckIcon
  },
  admin: {
    label: 'Admin',
    description: 'Manage members and settings',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: ShieldCheckIcon
  },
  editor: {
    label: 'Editor',
    description: 'Edit project content',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: PencilIcon
  },
  viewer: {
    label: 'Viewer',
    description: 'View project only',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    icon: EyeIcon
  }
};

// Invitation status display configuration
const INVITATION_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: ClockIcon
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckIcon
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: XMarkIcon
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    icon: XMarkIcon
  }
};

// Main TeamManagement component
export const TeamManagement: React.FC<TeamManagementProps> = ({
  projectId,
  className = ''
}) => {
  const { user } = useAuth();
  const {
    members,
    invitations,
    currentUserRole,
    isOwner,
    isAdmin,
    isLoading,
    isInviting,
    isUpdating,
    isDeleting,
    error,
    inviteError,
    updateError,
    deleteError,
    inviteMember,
    updateMemberRole,
    removeMember,
    resendInvitation,
    cancelInvitation,
    canInviteMembers,
    canUpdateMemberRole,
    canRemoveMember,
    canManageInvitations,
    canTransferOwnership,
    getMembersByRole,
    getActiveMembers,
    getPendingInvitations,
    getExpiredInvitations,
    memberCount,
    activeMemberCount,
    pendingInvitationCount,
    roleDistribution,
    transferOwnership,
    leaveProject,
    refreshMembers,
    refreshInvitations
  } = useProjectMembers({ projectId });

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<ProjectRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(member => member.status === 'active');
    }

    return filtered;
  }, [members, searchQuery, roleFilter, statusFilter]);

  // Filtered invitations
  const filteredInvitations = useMemo(() => {
    let filtered = invitations;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invitation =>
        invitation.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter(invitation => invitation.status === 'pending');
    } else if (statusFilter === 'expired') {
      filtered = filtered.filter(invitation => 
        invitation.status === 'pending' && invitation.expiresAt <= Date.now()
      );
    }

    return filtered;
  }, [invitations, searchQuery, statusFilter]);

  // Handle invite member
  const handleInviteMember = useCallback(async (email: string, role: ProjectRole, message?: string) => {
    try {
      await inviteMember(email, role, message);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  }, [inviteMember]);

  // Handle role update
  const handleUpdateRole = useCallback(async (memberId: string, newRole: ProjectRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  }, [updateMemberRole]);

  // Handle member removal
  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member from the project?')) {
      try {
        await removeMember(memberId);
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  }, [removeMember]);

  // Handle ownership transfer
  const handleTransferOwnership = useCallback(async (newOwnerId: string) => {
    if (window.confirm('Are you sure you want to transfer ownership? This action cannot be undone.')) {
      try {
        await transferOwnership(newOwnerId);
        setShowTransferModal(false);
      } catch (error) {
        console.error('Failed to transfer ownership:', error);
      }
    }
  }, [transferOwnership]);

  // Handle leave project
  const handleLeaveProject = useCallback(async () => {
    if (window.confirm('Are you sure you want to leave this project?')) {
      try {
        await leaveProject();
        setShowLeaveModal(false);
      } catch (error) {
        console.error('Failed to leave project:', error);
      }
    }
  }, [leaveProject]);

  // Handle invitation actions
  const handleResendInvitation = useCallback(async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  }, [resendInvitation]);

  const handleCancelInvitation = useCallback(async (invitationId: string) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await cancelInvitation(invitationId);
      } catch (error) {
        console.error('Failed to cancel invitation:', error);
      }
    }
  }, [cancelInvitation]);

  // Render member card
  const renderMemberCard = (member: ProjectMember) => {
    const roleConfig = ROLE_CONFIG[member.role];
    const RoleIcon = roleConfig.icon;
    const isCurrentUser = member.userId === user?.uid;
    const canUpdate = canUpdateMemberRole(member.id);
    const canRemove = canRemoveMember(member.id);

    return (
      <div
        key={member.id}
        className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {member.name ? member.name.charAt(0).toUpperCase() : member.email?.charAt(0).toUpperCase()}
            </div>
            
            {/* Member info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {member.name || member.email}
                </h3>
                {isCurrentUser && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {member.email}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {roleConfig.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {projectHelpers.dateHelpers.formatRelativeTime(member.joinedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {canUpdate && (
              <button
                onClick={() => {
                  setSelectedMember(member);
                  setShowRoleModal(true);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Update role"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            
            {canRemove && (
              <button
                onClick={() => handleRemoveMember(member.id)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Remove member"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}

            {isCurrentUser && !isOwner && (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Leave project"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render invitation card
  const renderInvitationCard = (invitation: ProjectInvitation) => {
    const statusConfig = INVITATION_STATUS_CONFIG[invitation.status];
    const StatusIcon = statusConfig.icon;
    const roleConfig = ROLE_CONFIG[invitation.role];
    const RoleIcon = roleConfig.icon;
    const isExpired = invitation.status === 'pending' && invitation.expiresAt <= Date.now();

    return (
      <div
        key={invitation.id}
        className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
              <EnvelopeIcon className="w-5 h-5" />
            </div>
            
            {/* Invitation info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {invitation.email}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Invited by {invitation.inviterName}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {roleConfig.label}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {isExpired ? 'Expired' : statusConfig.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {projectHelpers.dateHelpers.formatRelativeTime(invitation.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canManageInvitations && invitation.status === 'pending' && !isExpired && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleResendInvitation(invitation.id)}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Resend invitation"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCancelInvitation(invitation.id)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Cancel invitation"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render role update modal
  const renderRoleModal = () => {
    if (!showRoleModal || !selectedMember) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Update Role
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Update the role for {selectedMember.name || selectedMember.email}
          </p>
          
          <div className="space-y-3">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => {
              const RoleIcon = config.icon;
              const isCurrentRole = selectedMember.role === role;
              const isDisabled = role === 'owner' && !canTransferOwnership;
              
              return (
                <button
                  key={role}
                  onClick={() => !isDisabled && handleUpdateRole(selectedMember.id, role as ProjectRole)}
                  disabled={isDisabled}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    isCurrentRole
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : isDisabled
                      ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <RoleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {config.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {config.description}
                    </div>
                  </div>
                  {isCurrentRole && (
                    <CheckIcon className="w-5 h-5 text-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowRoleModal(false);
                setSelectedMember(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render invite modal
  const renderInviteModal = () => {
    if (!showInviteModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Invite Member
          </h3>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email') as string;
            const role = formData.get('role') as ProjectRole;
            const message = formData.get('message') as string;
            handleInviteMember(email, role, message);
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  {isOwner && <option value="admin">Admin</option>}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="Welcome to our project!"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isInviting ? 'Inviting...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render transfer ownership modal
  const renderTransferModal = () => {
    if (!showTransferModal) return null;

    const eligibleMembers = members.filter(member => 
      member.userId !== user?.uid && member.role !== 'owner'
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transfer Ownership
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select a member to transfer project ownership to. This action cannot be undone.
          </p>
          
          <div className="space-y-3">
            {eligibleMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleTransferOwnership(member.userId)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {member.name ? member.name.charAt(0).toUpperCase() : member.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {member.name || member.email}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {member.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render leave project modal
  const renderLeaveModal = () => {
    if (!showLeaveModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Leave Project
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to leave this project? You will lose access to all project content and will need to be re-invited to regain access.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLeaveProject}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isDeleting ? 'Leaving...' : 'Leave Project'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Team
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={refreshMembers}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon className="w-6 h-6 mr-2" />
              Team Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {memberCount} members • {pendingInvitationCount} pending invitations
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {canInviteMembers && (
              <button
                onClick={() => setShowInviteModal(true)}
                disabled={isInviting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Invite Member
              </button>
            )}
            
            {canTransferOwnership && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-lg transition-colors"
              >
                Transfer Ownership
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
          
          {/* Role filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as ProjectRole | 'all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                <option key={role} value={role}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'pending' | 'expired')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error messages */}
        {inviteError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>
          </div>
        )}
        
        {updateError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{updateError}</p>
          </div>
        )}
        
        {deleteError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
          </div>
        )}

        {/* Members */}
        {filteredMembers.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Members ({filteredMembers.length})
            </h3>
            <div className="space-y-3">
              {filteredMembers.map(renderMemberCard)}
            </div>
          </div>
        )}

        {/* Invitations */}
        {filteredInvitations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invitations ({filteredInvitations.length})
            </h3>
            <div className="space-y-3">
              {filteredInvitations.map(renderInvitationCard)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredMembers.length === 0 && filteredInvitations.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No members found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by inviting team members to your project'
              }
            </p>
            {canInviteMembers && !searchQuery && roleFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Invite First Member
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {renderInviteModal()}
      {renderRoleModal()}
      {renderTransferModal()}
      {renderLeaveModal()}
    </div>
  );
};

export default TeamManagement;
