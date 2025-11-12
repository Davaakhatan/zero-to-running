// useProjectTransfer hook for managing project ownership transfers
// React hook for transfer request management and validation

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  projectTransferService, 
  ProjectTransferError,
  formatTransferStatus,
  getTransferStatusColor,
  formatTransferExpiry,
  isTransferExpired,
  canUserAcceptTransfer,
  canUserCancelTransfer
} from '../services/projectTransferService';
import type { TransferRequest, TransferValidation } from '../services/projectTransferService';

// Hook props
interface UseProjectTransferProps {
  projectId?: string;
  userId?: string;
  enabled?: boolean;
}

// Transfer management functions
interface UseProjectTransferReturn {
  // Data
  transfers: TransferRequest[];
  pendingTransfers: TransferRequest[];
  userTransfers: TransferRequest[];
  currentTransfer: TransferRequest | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isAccepting: boolean;
  isDeclining: boolean;
  isCancelling: boolean;
  
  // Error states
  error: string | null;
  createError: string | null;
  acceptError: string | null;
  declineError: string | null;
  cancelError: string | null;
  
  // Transfer management
  createTransferRequest: (toUserId: string, message?: string) => Promise<TransferRequest>;
  acceptTransferRequest: (transferId: string) => Promise<void>;
  declineTransferRequest: (transferId: string, reason?: string) => Promise<void>;
  cancelTransferRequest: (transferId: string, reason?: string) => Promise<void>;
  
  // Validation
  validateTransfer: (toUserId: string, message?: string) => Promise<TransferValidation>;
  
  // Utility functions
  getTransferById: (transferId: string) => TransferRequest | undefined;
  getTransfersByStatus: (status: string) => TransferRequest[];
  getTransfersForUser: (userId: string) => TransferRequest[];
  getPendingTransfersForUser: (userId: string) => TransferRequest[];
  
  // Permission checks
  canCreateTransfer: boolean;
  canAcceptTransfer: (transfer: TransferRequest) => boolean;
  canCancelTransfer: (transfer: TransferRequest) => boolean;
  canDeclineTransfer: (transfer: TransferRequest) => boolean;
  
  // Statistics
  totalTransfers: number;
  pendingCount: number;
  acceptedCount: number;
  declinedCount: number;
  cancelledCount: number;
  expiredCount: number;
  
  // Actions
  refreshTransfers: () => Promise<void>;
  cleanupExpiredTransfers: () => Promise<number>;
  getTransferStats: () => Promise<{
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    cancelled: number;
    expired: number;
  }>;
  
  // Utility functions
  formatTransferStatus: (status: string) => string;
  getTransferStatusColor: (status: string) => string;
  formatTransferExpiry: (expiresAt: number) => string;
  isTransferExpired: (expiresAt: number) => boolean;
}

// Main useProjectTransfer hook
export const useProjectTransfer = ({ 
  projectId, 
  userId, 
  enabled = true 
}: UseProjectTransferProps): UseProjectTransferReturn => {
  const { user } = useAuth();
  
  // State
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<TransferRequest[]>([]);
  const [userTransfers, setUserTransfers] = useState<TransferRequest[]>([]);
  const [currentTransfer] = useState<TransferRequest | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Load transfers
  const loadTransfers = useCallback(async () => {
    if (!enabled || (!projectId && !userId)) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let loadedTransfers: TransferRequest[] = [];
      
      if (projectId) {
        loadedTransfers = await projectTransferService.getProjectTransfers(projectId);
      } else if (userId) {
        loadedTransfers = await projectTransferService.getUserTransfers(userId);
      }
      
      setTransfers(loadedTransfers);
      
      // Filter pending transfers
      const pending = loadedTransfers.filter(t => 
        t.status === 'pending' && !isTransferExpired(t.expiresAt)
      );
      setPendingTransfers(pending);
      
      // Filter user transfers
      if (user) {
        const userTransfers = loadedTransfers.filter(t => 
          t.toUserId === user.uid || t.fromUserId === user.uid
        );
        setUserTransfers(userTransfers);
      }
      
    } catch (err) {
      console.error('Failed to load transfers:', err);
      setError(err instanceof ProjectTransferError ? err.message : 'Failed to load transfers');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId, userId, user]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (enabled && (projectId || userId)) {
      loadTransfers();
    }
  }, [enabled, projectId, userId, loadTransfers]);

  // Create transfer request
  const createTransferRequest = useCallback(async (
    toUserId: string, 
    message?: string
  ): Promise<TransferRequest> => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not found');
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const transfer = await projectTransferService.createTransferRequest(
        projectId,
        user.uid,
        toUserId,
        message
      );

      // Add to local state
      setTransfers(prev => [transfer, ...prev]);
      setPendingTransfers(prev => [transfer, ...prev]);
      setUserTransfers(prev => [transfer, ...prev]);

      return transfer;

    } catch (err) {
      console.error('Failed to create transfer request:', err);
      const errorMessage = err instanceof ProjectTransferError ? err.message : 'Failed to create transfer request';
      setCreateError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [user, projectId]);

  // Accept transfer request
  const acceptTransferRequest = useCallback(async (transferId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsAccepting(true);
      setAcceptError(null);

      await projectTransferService.acceptTransferRequest(transferId, user.uid);

      // Update local state
      setTransfers(prev => 
        prev.map(transfer =>
          transfer.id === transferId
            ? { ...transfer, status: 'accepted', acceptedAt: Date.now(), updatedAt: Date.now() }
            : transfer
        )
      );

      setPendingTransfers(prev => 
        prev.filter(transfer => transfer.id !== transferId)
      );

      setUserTransfers(prev => 
        prev.map(transfer =>
          transfer.id === transferId
            ? { ...transfer, status: 'accepted', acceptedAt: Date.now(), updatedAt: Date.now() }
            : transfer
        )
      );

    } catch (err) {
      console.error('Failed to accept transfer request:', err);
      const errorMessage = err instanceof ProjectTransferError ? err.message : 'Failed to accept transfer request';
      setAcceptError(errorMessage);
      throw err;
    } finally {
      setIsAccepting(false);
    }
  }, [user]);

  // Decline transfer request
  const declineTransferRequest = useCallback(async (transferId: string, reason?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsDeclining(true);
      setDeclineError(null);

      await projectTransferService.declineTransferRequest(transferId, user.uid, reason);

      // Update local state
      setTransfers(prev => 
        prev.map(transfer =>
          transfer.id === transferId
            ? { ...transfer, status: 'declined', declinedAt: Date.now(), updatedAt: Date.now() }
            : transfer
        )
      );

      setPendingTransfers(prev => 
        prev.filter(transfer => transfer.id !== transferId)
      );

      setUserTransfers(prev => 
        prev.map(transfer =>
          transfer.id === transferId
            ? { ...transfer, status: 'declined', declinedAt: Date.now(), updatedAt: Date.now() }
            : transfer
        )
      );

    } catch (err) {
      console.error('Failed to decline transfer request:', err);
      const errorMessage = err instanceof ProjectTransferError ? err.message : 'Failed to decline transfer request';
      setDeclineError(errorMessage);
      throw err;
    } finally {
      setIsDeclining(false);
    }
  }, [user]);

  // Cancel transfer request
  const cancelTransferRequest = useCallback(async (transferId: string, reason?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsCancelling(true);
      setCancelError(null);

      await projectTransferService.cancelTransferRequest(transferId, user.uid, reason);

      // Update local state
      setTransfers(prev => 
        prev.map(transfer =>
          transfer.id === transferId
            ? { ...transfer, status: 'cancelled', cancelledAt: Date.now(), updatedAt: Date.now() }
            : transfer
        )
      );

      setPendingTransfers(prev => 
        prev.filter(transfer => transfer.id !== transferId)
      );

      setUserTransfers(prev => 
        prev.map(transfer =>
          transfer.id === transferId
            ? { ...transfer, status: 'cancelled', cancelledAt: Date.now(), updatedAt: Date.now() }
            : transfer
        )
      );

    } catch (err) {
      console.error('Failed to cancel transfer request:', err);
      const errorMessage = err instanceof ProjectTransferError ? err.message : 'Failed to cancel transfer request';
      setCancelError(errorMessage);
      throw err;
    } finally {
      setIsCancelling(false);
    }
  }, [user]);

  // Validate transfer
  const validateTransfer = useCallback(async (
    toUserId: string, 
    message?: string
  ): Promise<TransferValidation> => {
    if (!user || !projectId) {
      return {
        isValid: false,
        errors: ['User not authenticated or project not found'],
        warnings: []
      };
    }

    try {
      return await projectTransferService.validateTransferRequest(
        projectId,
        user.uid,
        toUserId,
        message
      );
    } catch (err) {
      console.error('Failed to validate transfer:', err);
      return {
        isValid: false,
        errors: [err instanceof ProjectTransferError ? err.message : 'Failed to validate transfer'],
        warnings: []
      };
    }
  }, [user, projectId]);

  // Utility functions
  const getTransferById = useCallback((transferId: string) => {
    return transfers.find(transfer => transfer.id === transferId);
  }, [transfers]);

  const getTransfersByStatus = useCallback((status: string) => {
    return transfers.filter(transfer => transfer.status === status);
  }, [transfers]);

  const getTransfersForUser = useCallback((userId: string) => {
    return transfers.filter(transfer => 
      transfer.toUserId === userId || transfer.fromUserId === userId
    );
  }, [transfers]);

  const getPendingTransfersForUser = useCallback((userId: string) => {
    return transfers.filter(transfer => 
      transfer.toUserId === userId && 
      transfer.status === 'pending' && 
      !isTransferExpired(transfer.expiresAt)
    );
  }, [transfers]);

  // Permission checks
  const canCreateTransfer = useMemo(() => {
    // This would need to be integrated with project permissions
    // For now, we'll assume the user can create transfers if they're authenticated
    return !!user && !!projectId;
  }, [user, projectId]);

  const canAcceptTransfer = useCallback((transfer: TransferRequest) => {
    return canUserAcceptTransfer(transfer, user?.uid || '');
  }, [user]);

  const canCancelTransfer = useCallback((transfer: TransferRequest) => {
    return canUserCancelTransfer(transfer, user?.uid || '');
  }, [user]);

  const canDeclineTransfer = useCallback((transfer: TransferRequest) => {
    return transfer.toUserId === user?.uid && 
           transfer.status === 'pending' && 
           !isTransferExpired(transfer.expiresAt);
  }, [user]);

  // Computed values
  const totalTransfers = transfers.length;
  const pendingCount = pendingTransfers.length;
  const acceptedCount = getTransfersByStatus('accepted').length;
  const declinedCount = getTransfersByStatus('declined').length;
  const cancelledCount = getTransfersByStatus('cancelled').length;
  const expiredCount = getTransfersByStatus('expired').length;

  // Actions
  const refreshTransfers = useCallback(async () => {
    await loadTransfers();
  }, [loadTransfers]);

  const cleanupExpiredTransfers = useCallback(async (): Promise<number> => {
    try {
      const cleanedCount = await projectTransferService.cleanupExpiredTransfers();
      
      // Refresh transfers after cleanup
      await loadTransfers();
      
      return cleanedCount;
    } catch (err) {
      console.error('Failed to cleanup expired transfers:', err);
      throw err;
    }
  }, [loadTransfers]);

  const getTransferStats = useCallback(async () => {
    if (!projectId) {
      throw new Error('Project ID is required for statistics');
    }

    try {
      return await projectTransferService.getTransferStats(projectId);
    } catch (err) {
      console.error('Failed to get transfer stats:', err);
      throw err;
    }
  }, [projectId]);

  return {
    // Data
    transfers,
    pendingTransfers,
    userTransfers,
    currentTransfer,
    
    // Loading states
    isLoading,
    isCreating,
    isAccepting,
    isDeclining,
    isCancelling,
    
    // Error states
    error,
    createError,
    acceptError,
    declineError,
    cancelError,
    
    // Transfer management
    createTransferRequest,
    acceptTransferRequest,
    declineTransferRequest,
    cancelTransferRequest,
    
    // Validation
    validateTransfer,
    
    // Utility functions
    getTransferById,
    getTransfersByStatus,
    getTransfersForUser,
    getPendingTransfersForUser,
    
    // Permission checks
    canCreateTransfer,
    canAcceptTransfer,
    canCancelTransfer,
    canDeclineTransfer,
    
    // Statistics
    totalTransfers,
    pendingCount,
    acceptedCount,
    declinedCount,
    cancelledCount,
    expiredCount,
    
    // Actions
    refreshTransfers,
    cleanupExpiredTransfers,
    getTransferStats,
    
    // Utility functions
    formatTransferStatus,
    getTransferStatusColor,
    formatTransferExpiry,
    isTransferExpired
  };
};

// Hook for specific transfer operations
export const useTransferCheck = (projectId?: string) => {
  const { user } = useAuth();
  const { 
    pendingTransfers, 
    userTransfers, 
    canCreateTransfer,
    isLoading 
  } = useProjectTransfer({ projectId, userId: user?.uid });
  
  return {
    // Quick transfer checks
    hasPendingTransfers: pendingTransfers.length > 0,
    hasUserTransfers: userTransfers.length > 0,
    canCreateTransfer,
    isTransferLoading: isLoading,
    
    // Counts
    pendingTransferCount: pendingTransfers.length,
    userTransferCount: userTransfers.length,
    
    // Recent transfers
    getRecentTransfers: () => {
      return userTransfers
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
    },
    
    // Expiring transfers
    getExpiringTransfers: () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      return pendingTransfers.filter(transfer => 
        transfer.expiresAt - now < oneDay
      );
    }
  };
};

export default useProjectTransfer;
