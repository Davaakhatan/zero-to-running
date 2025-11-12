// useInvitations hook for project invitation management
// React hook for managing project invitations with real-time updates

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invitationService, InvitationError } from '../services/invitationService';
import { ProjectInvitation, ProjectRole, Project } from '../types';

// Hook props
interface UseInvitationsProps {
  projectId?: string;
  userEmail?: string;
  enabled?: boolean;
}

// Invitation management functions
interface UseInvitationsReturn {
  // Data
  invitations: ProjectInvitation[];
  pendingInvitations: ProjectInvitation[];
  acceptedInvitations: ProjectInvitation[];
  expiredInvitations: ProjectInvitation[];
  cancelledInvitations: ProjectInvitation[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  
  // Invitation management
  createInvitation: (email: string, role: ProjectRole, message?: string) => Promise<ProjectInvitation>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  
  // Utility functions
  getInvitationById: (invitationId: string) => ProjectInvitation | undefined;
  getInvitationsByStatus: (status: string) => ProjectInvitation[];
  getInvitationsByRole: (role: ProjectRole) => ProjectInvitation[];
  getExpiredInvitations: () => ProjectInvitation[];
  getPendingInvitations: () => ProjectInvitation[];
  
  // Statistics
  totalInvitations: number;
  pendingCount: number;
  acceptedCount: number;
  expiredCount: number;
  cancelledCount: number;
  
  // Actions
  refreshInvitations: () => Promise<void>;
  cleanupExpiredInvitations: () => Promise<number>;
  getInvitationStats: () => Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
  }>;
}

// Main useInvitations hook
export const useInvitations = ({ 
  projectId, 
  userEmail, 
  enabled = true 
}: UseInvitationsProps): UseInvitationsReturn => {
  const { user } = useAuth();
  
  // State
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load invitations
  const loadInvitations = useCallback(async () => {
    if (!enabled || (!projectId && !userEmail)) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let loadedInvitations: ProjectInvitation[] = [];
      
      if (projectId) {
        loadedInvitations = await invitationService.getProjectInvitations(projectId);
      } else if (userEmail) {
        loadedInvitations = await invitationService.getUserInvitations(userEmail);
      }
      
      setInvitations(loadedInvitations);
    } catch (err) {
      console.error('Failed to load invitations:', err);
      setError(err instanceof InvitationError ? err.message : 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId, userEmail]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (enabled && (projectId || userEmail)) {
      loadInvitations();
    }
  }, [enabled, projectId, userEmail, loadInvitations]);

  // Create invitation
  const createInvitation = useCallback(async (
    email: string, 
    role: ProjectRole, 
    message?: string
  ): Promise<ProjectInvitation> => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not found');
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const invitation = await invitationService.createInvitation(
        projectId,
        email,
        role,
        user.uid,
        user.displayName || user.email || 'Unknown',
        message
      );

      // Add to local state
      setInvitations(prev => [invitation, ...prev]);

      return invitation;

    } catch (err) {
      console.error('Failed to create invitation:', err);
      const errorMessage = err instanceof InvitationError ? err.message : 'Failed to create invitation';
      setCreateError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [user, projectId]);

  // Accept invitation
  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      await invitationService.acceptInvitation(invitationId, user.uid);

      // Update local state
      setInvitations(prev => 
        prev.map(invitation =>
          invitation.id === invitationId
            ? { ...invitation, status: 'accepted', updatedAt: Date.now() }
            : invitation
        )
      );

    } catch (err) {
      console.error('Failed to accept invitation:', err);
      const errorMessage = err instanceof InvitationError ? err.message : 'Failed to accept invitation';
      setUpdateError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [user]);

  // Decline invitation
  const declineInvitation = useCallback(async (invitationId: string) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      await invitationService.declineInvitation(invitationId);

      // Update local state
      setInvitations(prev => 
        prev.map(invitation =>
          invitation.id === invitationId
            ? { ...invitation, status: 'cancelled', updatedAt: Date.now() }
            : invitation
        )
      );

    } catch (err) {
      console.error('Failed to decline invitation:', err);
      const errorMessage = err instanceof InvitationError ? err.message : 'Failed to decline invitation';
      setUpdateError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await invitationService.cancelInvitation(invitationId, user.uid);

      // Update local state
      setInvitations(prev => 
        prev.map(invitation =>
          invitation.id === invitationId
            ? { ...invitation, status: 'cancelled', updatedAt: Date.now() }
            : invitation
        )
      );

    } catch (err) {
      console.error('Failed to cancel invitation:', err);
      const errorMessage = err instanceof InvitationError ? err.message : 'Failed to cancel invitation';
      setDeleteError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [user]);

  // Resend invitation
  const resendInvitation = useCallback(async (invitationId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      await invitationService.resendInvitation(invitationId, user.uid);

      // Update local state with new expiry date
      setInvitations(prev => 
        prev.map(invitation =>
          invitation.id === invitationId
            ? { 
                ...invitation, 
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                updatedAt: Date.now() 
              }
            : invitation
        )
      );

    } catch (err) {
      console.error('Failed to resend invitation:', err);
      const errorMessage = err instanceof InvitationError ? err.message : 'Failed to resend invitation';
      setUpdateError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [user]);

  // Utility functions
  const getInvitationById = useCallback((invitationId: string) => {
    return invitations.find(invitation => invitation.id === invitationId);
  }, [invitations]);

  const getInvitationsByStatus = useCallback((status: string) => {
    return invitations.filter(invitation => invitation.status === status);
  }, [invitations]);

  const getInvitationsByRole = useCallback((role: ProjectRole) => {
    return invitations.filter(invitation => invitation.role === role);
  }, [invitations]);

  const getExpiredInvitations = useCallback(() => {
    return invitations.filter(invitation => 
      invitation.status === 'pending' && invitation.expiresAt <= Date.now()
    );
  }, [invitations]);

  const getPendingInvitations = useCallback(() => {
    return invitations.filter(invitation => 
      invitation.status === 'pending' && invitation.expiresAt > Date.now()
    );
  }, [invitations]);

  // Computed values
  const pendingInvitations = useMemo(() => getPendingInvitations(), [getPendingInvitations]);
  const acceptedInvitations = useMemo(() => getInvitationsByStatus('accepted'), [getInvitationsByStatus]);
  const expiredInvitations = useMemo(() => getExpiredInvitations(), [getExpiredInvitations]);
  const cancelledInvitations = useMemo(() => getInvitationsByStatus('cancelled'), [getInvitationsByStatus]);

  // Statistics
  const totalInvitations = invitations.length;
  const pendingCount = pendingInvitations.length;
  const acceptedCount = acceptedInvitations.length;
  const expiredCount = expiredInvitations.length;
  const cancelledCount = cancelledInvitations.length;

  // Actions
  const refreshInvitations = useCallback(async () => {
    await loadInvitations();
  }, [loadInvitations]);

  const cleanupExpiredInvitations = useCallback(async (): Promise<number> => {
    try {
      const cleanedCount = await invitationService.cleanupExpiredInvitations();
      
      // Refresh invitations after cleanup
      await loadInvitations();
      
      return cleanedCount;
    } catch (err) {
      console.error('Failed to cleanup expired invitations:', err);
      throw err;
    }
  }, [loadInvitations]);

  const getInvitationStats = useCallback(async () => {
    if (!projectId) {
      throw new Error('Project ID is required for statistics');
    }

    try {
      return await invitationService.getInvitationStats(projectId);
    } catch (err) {
      console.error('Failed to get invitation stats:', err);
      throw err;
    }
  }, [projectId]);

  return {
    // Data
    invitations,
    pendingInvitations,
    acceptedInvitations,
    expiredInvitations,
    cancelledInvitations,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    createError,
    updateError,
    deleteError,
    
    // Invitation management
    createInvitation,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    resendInvitation,
    
    // Utility functions
    getInvitationById,
    getInvitationsByStatus,
    getInvitationsByRole,
    getExpiredInvitations,
    getPendingInvitations,
    
    // Statistics
    totalInvitations,
    pendingCount,
    acceptedCount,
    expiredCount,
    cancelledCount,
    
    // Actions
    refreshInvitations,
    cleanupExpiredInvitations,
    getInvitationStats
  };
};

export default useInvitations;
