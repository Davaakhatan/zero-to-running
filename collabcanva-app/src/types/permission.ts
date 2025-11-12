// Permission-related type definitions

import type { ProjectRole, Permission } from './projectTypes.js';

export interface PermissionSet {
  [key: string]: string[];
}

export interface PermissionConfig {
  roles: {
    [key in ProjectRole]: Permission[];
  };
  fallback: Permission[];
}

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  requiredRole?: ProjectRole;
  currentRole?: ProjectRole;
}

export interface PermissionContext {
  userId: string;
  projectId: string;
  role: ProjectRole;
  permissions: Permission[];
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
}
