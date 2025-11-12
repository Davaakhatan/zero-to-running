// Invitation-related type definitions

import type { ProjectRole } from './projectTypes.js';

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: ProjectRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  cancelledAt?: Date;
  message?: string;
  metadata?: Record<string, any>;
}

export interface InvitationCreateData {
  projectId: string;
  email: string;
  role: ProjectRole;
  message?: string;
  expiresInDays?: number;
}

export interface InvitationUpdateData {
  status?: 'accepted' | 'declined' | 'cancelled';
  message?: string;
}

export interface InvitationFilters {
  projectId?: string;
  status?: string;
  role?: ProjectRole;
  inviterId?: string;
  inviteeEmail?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
}
