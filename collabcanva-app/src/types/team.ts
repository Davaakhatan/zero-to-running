// Team-related type definitions

import type { ProjectRole } from './projectTypes.js';

export interface ProjectMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: ProjectRole;
  status: 'active' | 'pending' | 'inactive';
  joinedAt: Date;
  lastActiveAt?: Date;
  isOnline: boolean;
  permissions?: string[];
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: ProjectRole;
  status: 'active' | 'pending' | 'inactive';
  joinedAt: Date;
  lastActiveAt?: Date;
  isOnline: boolean;
  permissions?: string[];
  projectCount: number;
  canvasCount: number;
  lastActivityAt: Date;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  inactiveMembers: number;
  roleDistribution: {
    [key in ProjectRole]: number;
  };
  recentActivity: TeamActivity[];
}

export interface TeamActivity {
  id: string;
  type: 'member_joined' | 'member_left' | 'role_changed' | 'permission_changed';
  userId: string;
  userName: string;
  targetUserId?: string;
  targetUserName?: string;
  details: string;
  timestamp: Date;
}

export interface TeamFilters {
  role?: ProjectRole;
  status?: 'active' | 'pending' | 'inactive';
  search?: string;
  sortBy?: 'name' | 'role' | 'joinedAt' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
}
