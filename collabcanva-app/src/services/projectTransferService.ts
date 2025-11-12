// ProjectTransferService for handling project ownership transfers
// Manages ownership changes with validation, notifications, and audit trails

import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction,
  writeBatch,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, ProjectMember, ProjectRole, ProjectTransfer } from '../types';
import { emailService } from './emailService';

// Transfer types
export interface TransferRequest {
  id: string;
  projectId: string;
  fromUserId: string;
  fromUserEmail: string;
  fromUserName: string;
  toUserId: string;
  toUserEmail: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  message?: string;
  createdAt: number;
  expiresAt: number;
  updatedAt: number;
  acceptedAt?: number;
  declinedAt?: number;
  cancelledAt?: number;
  metadata: {
    transferReason?: string;
    previousOwnerRole?: ProjectRole;
    newOwnerRole?: ProjectRole;
    projectName: string;
    projectDescription?: string;
  };
}

export interface TransferValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Transfer service configuration
const TRANSFER_CONFIG = {
  EXPIRY_DAYS: 7,
  MAX_PENDING_TRANSFERS: 3,
  MIN_OWNERSHIP_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  NOTIFICATION_DELAY: 1000, // 1 second
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000 // 2 seconds
};

// Custom error class
export class ProjectTransferError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ProjectTransferError';
  }
}

// Project transfer service class
export class ProjectTransferService {
  private static instance: ProjectTransferService;

  // Singleton pattern
  static getInstance(): ProjectTransferService {
    if (!ProjectTransferService.instance) {
      ProjectTransferService.instance = new ProjectTransferService();
    }
    return ProjectTransferService.instance;
  }

  private constructor() {}

  // Validate transfer request
  async validateTransferRequest(
    projectId: string,
    fromUserId: string,
    toUserId: string,
    message?: string
  ): Promise<TransferValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get project data
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        errors.push('Project not found');
        return { isValid: false, errors, warnings };
      }

      const project = projectSnap.data() as Project;

      // Check if user is the owner
      if (project.ownerId !== fromUserId) {
        errors.push('Only the project owner can initiate a transfer');
      }

      // Check if target user is different
      if (fromUserId === toUserId) {
        errors.push('Cannot transfer ownership to yourself');
      }

      // Check if target user is a member
      const targetMember = project.members.find(m => m.userId === toUserId);
      if (!targetMember) {
        errors.push('Target user must be a project member');
      }

      // Check if target user has appropriate role
      if (targetMember && !['admin', 'editor'].includes(targetMember.role)) {
        errors.push('Target user must be an admin or editor to receive ownership');
      }

      // Check ownership duration
      const ownershipDuration = Date.now() - project.createdAt;
      if (ownershipDuration < TRANSFER_CONFIG.MIN_OWNERSHIP_DURATION) {
        warnings.push('Project has been owned for less than 24 hours');
      }

      // Check for pending transfers
      const pendingTransfers = await this.getPendingTransfers(projectId);
      if (pendingTransfers.length >= TRANSFER_CONFIG.MAX_PENDING_TRANSFERS) {
        errors.push('Too many pending transfer requests');
      }

      // Check if target user already has a pending transfer
      const existingTransfer = pendingTransfers.find(t => t.toUserId === toUserId);
      if (existingTransfer) {
        errors.push('Target user already has a pending transfer request');
      }

      // Validate message length
      if (message && message.length > 500) {
        errors.push('Transfer message must be less than 500 characters');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Failed to validate transfer request:', error);
      errors.push('Failed to validate transfer request');
      return { isValid: false, errors, warnings };
    }
  }

  // Create transfer request
  async createTransferRequest(
    projectId: string,
    fromUserId: string,
    toUserId: string,
    message?: string
  ): Promise<TransferRequest> {
    try {
      // Validate request
      const validation = await this.validateTransferRequest(projectId, fromUserId, toUserId, message);
      
      if (!validation.isValid) {
        throw new ProjectTransferError(
          `Transfer validation failed: ${validation.errors.join(', ')}`,
          'VALIDATION_FAILED'
        );
      }

      // Get project and user data
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      const project = projectSnap.data() as Project;

      const fromUserRef = doc(db, 'users', fromUserId);
      const fromUserSnap = await getDoc(fromUserRef);
      const fromUser = fromUserSnap.data();

      const toUserRef = doc(db, 'users', toUserId);
      const toUserSnap = await getDoc(toUserRef);
      const toUser = toUserSnap.data();

      // Create transfer request
      const transferRequest: Omit<TransferRequest, 'id'> = {
        projectId,
        fromUserId,
        fromUserEmail: fromUser?.email || '',
        fromUserName: fromUser?.displayName || fromUser?.email || 'Unknown',
        toUserId,
        toUserEmail: toUser?.email || '',
        toUserName: toUser?.displayName || toUser?.email || 'Unknown',
        status: 'pending',
        message,
        createdAt: Date.now(),
        expiresAt: Date.now() + (TRANSFER_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        updatedAt: Date.now(),
        metadata: {
          projectName: project.name,
          projectDescription: project.description,
          previousOwnerRole: 'owner',
          newOwnerRole: 'owner'
        }
      };

      // Save transfer request
      const transferRef = await addDoc(collection(db, 'projectTransfers'), transferRequest);
      
      const transfer: TransferRequest = {
        id: transferRef.id,
        ...transferRequest
      };

      // Send notification email
      await this.sendTransferNotification(transfer, project);

      // Log transfer activity
      await this.logTransferActivity(projectId, 'transfer_requested', {
        fromUserId,
        toUserId,
        transferId: transfer.id
      });

      return transfer;

    } catch (error) {
      console.error('Failed to create transfer request:', error);
      throw new ProjectTransferError(
        error instanceof ProjectTransferError ? error.message : 'Failed to create transfer request',
        'CREATE_FAILED'
      );
    }
  }

  // Accept transfer request
  async acceptTransferRequest(transferId: string, userId: string): Promise<void> {
    try {
      // Get transfer request
      const transferRef = doc(db, 'projectTransfers', transferId);
      const transferSnap = await getDoc(transferRef);
      
      if (!transferSnap.exists()) {
        throw new ProjectTransferError('Transfer request not found', 'NOT_FOUND');
      }

      const transfer = transferSnap.data() as TransferRequest;

      // Validate acceptance
      if (transfer.toUserId !== userId) {
        throw new ProjectTransferError('Only the target user can accept the transfer', 'UNAUTHORIZED');
      }

      if (transfer.status !== 'pending') {
        throw new ProjectTransferError('Transfer request is not pending', 'INVALID_STATUS');
      }

      if (transfer.expiresAt < Date.now()) {
        throw new ProjectTransferError('Transfer request has expired', 'EXPIRED');
      }

      // Execute transfer using transaction
      await runTransaction(db, async (transaction) => {
        // Update transfer status
        transaction.update(transferRef, {
          status: 'accepted',
          acceptedAt: Date.now(),
          updatedAt: Date.now()
        });

        // Update project ownership
        const projectRef = doc(db, 'projects', transfer.projectId);
        const projectSnap = await transaction.get(projectRef);
        
        if (!projectSnap.exists()) {
          throw new ProjectTransferError('Project not found', 'PROJECT_NOT_FOUND');
        }

        const project = projectSnap.data() as Project;

        // Update project owner
        transaction.update(projectRef, {
          ownerId: transfer.toUserId,
          updatedAt: Date.now()
        });

        // Update member roles
        const updatedMembers = project.members.map(member => {
          if (member.userId === transfer.fromUserId) {
            return { ...member, role: 'admin' as ProjectRole };
          }
          if (member.userId === transfer.toUserId) {
            return { ...member, role: 'owner' as ProjectRole };
          }
          return member;
        });

        transaction.update(projectRef, {
          members: updatedMembers
        });
      });

      // Send acceptance notification
      await this.sendTransferNotification(transfer, null, 'accepted');

      // Log transfer activity
      await this.logTransferActivity(transfer.projectId, 'transfer_accepted', {
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId,
        transferId: transfer.id
      });

    } catch (error) {
      console.error('Failed to accept transfer request:', error);
      throw new ProjectTransferError(
        error instanceof ProjectTransferError ? error.message : 'Failed to accept transfer request',
        'ACCEPT_FAILED'
      );
    }
  }

  // Decline transfer request
  async declineTransferRequest(transferId: string, userId: string, reason?: string): Promise<void> {
    try {
      // Get transfer request
      const transferRef = doc(db, 'projectTransfers', transferId);
      const transferSnap = await getDoc(transferRef);
      
      if (!transferSnap.exists()) {
        throw new ProjectTransferError('Transfer request not found', 'NOT_FOUND');
      }

      const transfer = transferSnap.data() as TransferRequest;

      // Validate decline
      if (transfer.toUserId !== userId) {
        throw new ProjectTransferError('Only the target user can decline the transfer', 'UNAUTHORIZED');
      }

      if (transfer.status !== 'pending') {
        throw new ProjectTransferError('Transfer request is not pending', 'INVALID_STATUS');
      }

      // Update transfer status
      await updateDoc(transferRef, {
        status: 'declined',
        declinedAt: Date.now(),
        updatedAt: Date.now(),
        message: reason ? `${transfer.message || ''}\n\nDecline reason: ${reason}` : transfer.message
      });

      // Send decline notification
      await this.sendTransferNotification(transfer, null, 'declined');

      // Log transfer activity
      await this.logTransferActivity(transfer.projectId, 'transfer_declined', {
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId,
        transferId: transfer.id,
        reason
      });

    } catch (error) {
      console.error('Failed to decline transfer request:', error);
      throw new ProjectTransferError(
        error instanceof ProjectTransferError ? error.message : 'Failed to decline transfer request',
        'DECLINE_FAILED'
      );
    }
  }

  // Cancel transfer request
  async cancelTransferRequest(transferId: string, userId: string, reason?: string): Promise<void> {
    try {
      // Get transfer request
      const transferRef = doc(db, 'projectTransfers', transferId);
      const transferSnap = await getDoc(transferRef);
      
      if (!transferSnap.exists()) {
        throw new ProjectTransferError('Transfer request not found', 'NOT_FOUND');
      }

      const transfer = transferSnap.data() as TransferRequest;

      // Validate cancellation
      if (transfer.fromUserId !== userId) {
        throw new ProjectTransferError('Only the initiator can cancel the transfer', 'UNAUTHORIZED');
      }

      if (transfer.status !== 'pending') {
        throw new ProjectTransferError('Transfer request is not pending', 'INVALID_STATUS');
      }

      // Update transfer status
      await updateDoc(transferRef, {
        status: 'cancelled',
        cancelledAt: Date.now(),
        updatedAt: Date.now(),
        message: reason ? `${transfer.message || ''}\n\nCancel reason: ${reason}` : transfer.message
      });

      // Send cancellation notification
      await this.sendTransferNotification(transfer, null, 'cancelled');

      // Log transfer activity
      await this.logTransferActivity(transfer.projectId, 'transfer_cancelled', {
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId,
        transferId: transfer.id,
        reason
      });

    } catch (error) {
      console.error('Failed to cancel transfer request:', error);
      throw new ProjectTransferError(
        error instanceof ProjectTransferError ? error.message : 'Failed to cancel transfer request',
        'CANCEL_FAILED'
      );
    }
  }

  // Get transfer requests for a project
  async getProjectTransfers(projectId: string): Promise<TransferRequest[]> {
    try {
      const transfersRef = collection(db, 'projectTransfers');
      const q = query(transfersRef, where('projectId', '==', projectId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TransferRequest[];

    } catch (error) {
      console.error('Failed to get project transfers:', error);
      throw new ProjectTransferError('Failed to get project transfers', 'FETCH_FAILED');
    }
  }

  // Get pending transfers for a project
  async getPendingTransfers(projectId: string): Promise<TransferRequest[]> {
    try {
      const transfers = await this.getProjectTransfers(projectId);
      return transfers.filter(t => t.status === 'pending' && t.expiresAt > Date.now());
    } catch (error) {
      console.error('Failed to get pending transfers:', error);
      throw new ProjectTransferError('Failed to get pending transfers', 'FETCH_FAILED');
    }
  }

  // Get transfer requests for a user
  async getUserTransfers(userId: string): Promise<TransferRequest[]> {
    try {
      const transfersRef = collection(db, 'projectTransfers');
      const q = query(
        transfersRef, 
        where('toUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TransferRequest[];

    } catch (error) {
      console.error('Failed to get user transfers:', error);
      throw new ProjectTransferError('Failed to get user transfers', 'FETCH_FAILED');
    }
  }

  // Cleanup expired transfers
  async cleanupExpiredTransfers(): Promise<number> {
    try {
      const transfersRef = collection(db, 'projectTransfers');
      const q = query(
        transfersRef,
        where('status', '==', 'pending'),
        where('expiresAt', '<', Date.now())
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      let cleanedCount = 0;

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: Date.now()
        });
        cleanedCount++;
      });

      if (cleanedCount > 0) {
        await batch.commit();
      }

      return cleanedCount;

    } catch (error) {
      console.error('Failed to cleanup expired transfers:', error);
      throw new ProjectTransferError('Failed to cleanup expired transfers', 'CLEANUP_FAILED');
    }
  }

  // Send transfer notification
  private async sendTransferNotification(
    transfer: TransferRequest, 
    project: Project | null, 
    status: 'requested' | 'accepted' | 'declined' | 'cancelled' = 'requested'
  ): Promise<void> {
    try {
      if (status === 'requested') {
        // Send notification to target user
        await emailService.sendTransferRequestEmail(transfer, project);
      } else {
        // Send notification to original owner
        await emailService.sendTransferStatusEmail(transfer, status);
      }
    } catch (error) {
      console.error('Failed to send transfer notification:', error);
      // Don't throw error for notification failures
    }
  }

  // Log transfer activity
  private async logTransferActivity(
    projectId: string, 
    action: string, 
    metadata: any
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'projects', projectId, 'activities'), {
        type: 'transfer',
        action,
        metadata,
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to log transfer activity:', error);
      // Don't throw error for logging failures
    }
  }

  // Get transfer statistics
  async getTransferStats(projectId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    cancelled: number;
    expired: number;
  }> {
    try {
      const transfers = await this.getProjectTransfers(projectId);
      
      return {
        total: transfers.length,
        pending: transfers.filter(t => t.status === 'pending').length,
        accepted: transfers.filter(t => t.status === 'accepted').length,
        declined: transfers.filter(t => t.status === 'declined').length,
        cancelled: transfers.filter(t => t.status === 'cancelled').length,
        expired: transfers.filter(t => t.status === 'expired').length
      };
    } catch (error) {
      console.error('Failed to get transfer stats:', error);
      throw new ProjectTransferError('Failed to get transfer stats', 'STATS_FAILED');
    }
  }
}

// Export singleton instance
export const projectTransferService = ProjectTransferService.getInstance();

// Utility functions
export const formatTransferStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    declined: 'Declined',
    cancelled: 'Cancelled',
    expired: 'Expired'
  };
  
  return statusMap[status] || status;
};

export const getTransferStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'yellow',
    accepted: 'green',
    declined: 'red',
    cancelled: 'gray',
    expired: 'gray'
  };
  
  return colorMap[status] || 'gray';
};

export const formatTransferExpiry = (expiresAt: number): string => {
  const now = Date.now();
  const diff = expiresAt - now;
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} left`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} left`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
  }
};

export const isTransferExpired = (expiresAt: number): boolean => {
  return expiresAt < Date.now();
};

export const canUserAcceptTransfer = (transfer: TransferRequest, userId: string): boolean => {
  return transfer.toUserId === userId && 
         transfer.status === 'pending' && 
         !isTransferExpired(transfer.expiresAt);
};

export const canUserCancelTransfer = (transfer: TransferRequest, userId: string): boolean => {
  return transfer.fromUserId === userId && transfer.status === 'pending';
};

export default projectTransferService;

