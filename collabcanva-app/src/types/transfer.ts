// Transfer-related type definitions

export interface ProjectTransfer {
  id: string;
  projectId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

export interface TransferRequest {
  id: string;
  projectId: string;
  newOwnerId: string;
  newOwnerEmail: string;
  requesterId: string;
  fromUserName: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  cancelledAt?: Date;
  message?: string;
  metadata?: Record<string, any>;
}

export interface TransferCreateData {
  projectId: string;
  newOwnerId: string;
  newOwnerEmail: string;
  message?: string;
  expiresInDays?: number;
}

export interface TransferUpdateData {
  status: 'accepted' | 'declined' | 'cancelled';
  message?: string;
}

export interface TransferFilters {
  projectId?: string;
  status?: string;
  fromUserId?: string;
  toUserId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TransferStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  cancelled: number;
  expired: number;
}
