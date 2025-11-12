// useProjectMembers hook for team member management
// Custom hook for managing project team members with role-based permissions

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from './useProjects';
import { projectHelpers } from '../utils/projectHelpers';
import { Project, ProjectMember, ProjectRole, ProjectInvitation } from '../types';

// Hook props
interface UseProjectMembersProps {
  projectId: string;
  enabled?: boolean;
}

// Member management functions
interface UseProjectMembersReturn {
  // Data
  members: ProjectMember[];
  invitations: ProjectInvitation[];
  currentUserRole: ProjectRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  
  // Loading states
  isLoading: boolean;
  isInviting: boolean;
  isUpdating: boolean;
  loading: boolean;
  isDeleting: boolean;
  
  // Error states
  error: string | null;
  inviteError: string | null;
  updateError: string | null;
  deleteError: string | null;
  
  // Member management
  inviteMember: (email: string, role: ProjectRole, message?: string) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: ProjectRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  
  // Permission checks
  canInviteMembers: boolean;
  canUpdateMemberRole: (memberId: string) => boolean;
  canRemoveMember: (memberId: string) => boolean;
  canManageInvitations: boolean;
  canTransferOwnership: boolean;
  
  // Utility functions
  getMemberById: (memberId: string) => ProjectMember | undefined;
  getMemberByUserId: (userId: string) => ProjectMember | undefined;
  getMembersByRole: (role: ProjectRole) => ProjectMember[];
  getActiveMembers: () => ProjectMember[];
  getPendingInvitations: () => ProjectInvitation[];
  getExpiredInvitations: () => ProjectInvitation[];
  
  // Statistics
  memberCount: number;
  activeMemberCount: number;
  pendingInvitationCount: number;
  roleDistribution: Record<ProjectRole, number>;
  
  // Actions
  transferOwnership: (newOwnerId: string) => Promise<void>;
  leaveProject: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
}

// Main useProjectMembers hook
export const useProjectMembers = ({ 
  projectId, 
  enabled = true 
}: UseProjectMembersProps): UseProjectMembersReturn => {
  const { user } = useAuth();
  const { getProjectById, updateProject } = useProjects();
  
  // State
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Get current user's role in the project
  const currentUserRole = useMemo((): ProjectRole | null => {
    if (!user || !members.length) return null;
    
    const currentMember = members.find(member => member.userId === user.uid);
    return currentMember?.role || null;
  }, [user, members]);

  // Permission checks
  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin';
  const isEditor = currentUserRole === 'editor';
  const isViewer = currentUserRole === 'viewer';

  // Load project members
  const loadMembers = useCallback(async () => {
    if (!enabled || !projectId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const project = getProjectById(projectId);
      if (project) {
        setMembers(project.members || []);
      }
    } catch (err) {
      console.error('Failed to load project members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId, getProjectById]);

  // Load project invitations
  const loadInvitations = useCallback(async () => {
    if (!enabled || !projectId) return;
    
    try {
      // TODO: Implement invitation loading from Firebase
      // For now, we'll use a placeholder
      setInvitations([]);
    } catch (err) {
      console.error('Failed to load project invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    }
  }, [enabled, projectId]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (enabled && projectId) {
      loadMembers();
      loadInvitations();
    }
  }, [enabled, projectId, loadMembers, loadInvitations]);

  // Invite a new member
  const inviteMember = useCallback(async (
    email: string, 
    role: ProjectRole, 
    message?: string
  ) => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not found');
    }

    try {
      setIsInviting(true);
      setInviteError(null);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if user is already a member
      const existingMember = members.find(member => 
        member.userId === email || member.email === email
      );
      if (existingMember) {
        throw new Error('User is already a member of this project');
      }

      // Check if invitation already exists
      const existingInvitation = invitations.find(invitation => 
        invitation.email === email
      );
      if (existingInvitation) {
        throw new Error('Invitation already sent to this email');
      }

      // Create invitation
      const invitation: ProjectInvitation = {
        id: `invitation_${Date.now()}`,
        projectId,
        projectName: 'Unknown Project', // TODO: Get project name from projectId
        email,
        inviteeEmail: email,
        role,
        message: message || '',
        inviterId: user.uid,
        inviterName: user.displayName || user.email || 'Unknown',
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      // TODO: Save invitation to Firebase
      // For now, we'll add it to local state
      setInvitations(prev => [...prev, invitation]);

      // TODO: Send email notification
      console.log('Invitation created:', invitation);

    } catch (err) {
      console.error('Failed to invite member:', err);
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member');
      throw err;
    } finally {
      setIsInviting(false);
    }
  }, [user, projectId, members, invitations]);

  // Update member role
  const updateMemberRole = useCallback(async (
    memberId: string, 
    newRole: ProjectRole
  ) => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not found');
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Find the member to update
      const memberToUpdate = members.find(member => member.id === memberId);
      if (!memberToUpdate) {
        throw new Error('Member not found');
      }

      // Validate role change
      if (memberToUpdate.role === newRole) {
        throw new Error('Member already has this role');
      }

      // Check permissions
      if (!canUpdateMemberRole(memberId)) {
        throw new Error('You do not have permission to update this member\'s role');
      }

      // Update member role
      const updatedMembers = members.map(member =>
        member.id === memberId
          ? { ...member, role: newRole, updatedAt: Date.now() }
          : member
      );

      // Update project in Firebase
      await updateProject(projectId, {
        members: updatedMembers
      });

      // Update local state
      setMembers(updatedMembers);

    } catch (err) {
      console.error('Failed to update member role:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update member role');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [user, projectId, members, updateProject]);

  // Remove member from project
  const removeMember = useCallback(async (memberId: string) => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not found');
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Find the member to remove
      const memberToRemove = members.find(member => member.id === memberId);
      if (!memberToRemove) {
        throw new Error('Member not found');
      }

      // Check permissions
      if (!canRemoveMember(memberId)) {
        throw new Error('You do not have permission to remove this member');
      }

      // Remove member from project
      const updatedMembers = members.filter(member => member.id !== memberId);

      // Update project in Firebase
      await updateProject(projectId, {
        members: updatedMembers
      });

      // Update local state
      setMembers(updatedMembers);

    } catch (err) {
      console.error('Failed to remove member:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to remove member');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [user, projectId, members, updateProject]);

  // Resend invitation
  const resendInvitation = useCallback(async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // TODO: Resend email notification
      console.log('Resending invitation:', invitation);

      // Update invitation status
      const updatedInvitations = invitations.map(inv =>
        inv.id === invitationId
          ? { ...inv, status: 'pending' as const }
          : inv
      );

      setInvitations(updatedInvitations);

    } catch (err) {
      console.error('Failed to resend invitation:', err);
      setInviteError(err instanceof Error ? err.message : 'Failed to resend invitation');
      throw err;
    }
  }, [invitations]);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // TODO: Remove invitation from Firebase
      console.log('Cancelling invitation:', invitation);

      // Remove invitation from local state
      const updatedInvitations = invitations.filter(inv => inv.id !== invitationId);
      setInvitations(updatedInvitations);

    } catch (err) {
      console.error('Failed to cancel invitation:', err);
      setInviteError(err instanceof Error ? err.message : 'Failed to cancel invitation');
      throw err;
    }
  }, [invitations]);

  // Permission checks
  const canInviteMembers = useMemo(() => {
    return isOwner || isAdmin;
  }, [isOwner, isAdmin]);

  const canUpdateMemberRole = useCallback((memberId: string) => {
    if (!isOwner && !isAdmin) return false;
    
    const member = members.find(m => m.id === memberId);
    if (!member) return false;
    
    // Owners can update anyone except themselves
    if (isOwner) return member.userId !== user?.uid;
    
    // Admins can update editors and viewers, but not owners or other admins
    if (isAdmin) return member.role === 'editor' || member.role === 'viewer';
    
    return false;
  }, [isOwner, isAdmin, members, user]);

  const canRemoveMember = useCallback((memberId: string) => {
    if (!isOwner && !isAdmin) return false;
    
    const member = members.find(m => m.id === memberId);
    if (!member) return false;
    
    // Owners can remove anyone except themselves
    if (isOwner) return member.userId !== user?.uid;
    
    // Admins can remove editors and viewers, but not owners or other admins
    if (isAdmin) return member.role === 'editor' || member.role === 'viewer';
    
    return false;
  }, [isOwner, isAdmin, members, user]);

  const canManageInvitations = useMemo(() => {
    return isOwner || isAdmin;
  }, [isOwner, isAdmin]);

  const canTransferOwnership = useMemo(() => {
    return isOwner;
  }, [isOwner]);

  // Utility functions
  const getMemberById = useCallback((memberId: string) => {
    return members.find(member => member.id === memberId);
  }, [members]);

  const getMemberByUserId = useCallback((userId: string) => {
    return members.find(member => member.userId === userId);
  }, [members]);

  const getMembersByRole = useCallback((role: ProjectRole) => {
    return members.filter(member => member.role === role);
  }, [members]);

  const getActiveMembers = useCallback(() => {
    return members.filter(member => member.status === 'active');
  }, [members]);

  const getPendingInvitations = useCallback(() => {
    return invitations.filter(invitation => 
      invitation.status === 'pending' && invitation.expiresAt > Date.now()
    );
  }, [invitations]);

  const getExpiredInvitations = useCallback(() => {
    return invitations.filter(invitation => 
      invitation.status === 'pending' && invitation.expiresAt <= Date.now()
    );
  }, [invitations]);

  // Statistics
  const memberCount = members.length;
  const activeMemberCount = getActiveMembers().length;
  const pendingInvitationCount = getPendingInvitations().length;
  
  const roleDistribution = useMemo(() => {
    const distribution: Record<ProjectRole, number> = {
      owner: 0,
      admin: 0,
      editor: 0,
      viewer: 0
    };
    
    members.forEach(member => {
      distribution[member.role]++;
    });
    
    return distribution;
  }, [members]);

  // Actions
  const transferOwnership = useCallback(async (newOwnerId: string) => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not found');
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Find the new owner
      const newOwner = members.find(member => member.userId === newOwnerId);
      if (!newOwner) {
        throw new Error('New owner not found in project members');
      }

      // Update roles
      const updatedMembers = members.map(member => {
        if (member.userId === newOwnerId) {
          return { ...member, role: 'owner' as ProjectRole, updatedAt: Date.now() };
        } else if (member.userId === user.uid) {
          return { ...member, role: 'admin' as ProjectRole, updatedAt: Date.now() };
        }
        return member;
      });

      // Update project in Firebase
      await updateProject(projectId, {
        members: updatedMembers
      });

      // Update local state
      setMembers(updatedMembers);

    } catch (err) {
      console.error('Failed to transfer ownership:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to transfer ownership');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [user, projectId, members, updateProject]);

  const leaveProject = useCallback(async () => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not found');
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Check if user is the owner
      if (isOwner) {
        throw new Error('Project owners cannot leave the project. Transfer ownership first.');
      }

      // Remove user from project
      const updatedMembers = members.filter(member => member.userId !== user.uid);

      // Update project in Firebase
      await updateProject(projectId, {
        members: updatedMembers
      });

      // Update local state
      setMembers(updatedMembers);

    } catch (err) {
      console.error('Failed to leave project:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to leave project');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [user, projectId, members, isOwner, updateProject]);

  const refreshMembers = useCallback(async () => {
    await loadMembers();
  }, [loadMembers]);

  const refreshInvitations = useCallback(async () => {
    await loadInvitations();
  }, [loadInvitations]);

  return {
    // Data
    members,
    invitations,
    currentUserRole,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    
    // Loading states
    isLoading,
    isInviting,
    isUpdating,
    isDeleting,
    loading: isLoading,
    
    // Error states
    error,
    inviteError,
    updateError,
    deleteError,
    
    // Member management
    inviteMember,
    updateMemberRole,
    removeMember,
    resendInvitation,
    cancelInvitation,
    
    // Permission checks
    canInviteMembers,
    canUpdateMemberRole,
    canRemoveMember,
    canManageInvitations,
    canTransferOwnership,
    
    // Utility functions
    getMemberById,
    getMemberByUserId,
    getMembersByRole,
    getActiveMembers,
    getPendingInvitations,
    getExpiredInvitations,
    
    // Statistics
    memberCount,
    activeMemberCount,
    pendingInvitationCount,
    roleDistribution,
    
    // Actions
    transferOwnership,
    leaveProject,
    refreshMembers,
    refreshInvitations
  };
};

export default useProjectMembers;

