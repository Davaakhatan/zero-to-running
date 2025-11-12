// usePermissions hook for role-based access control
// Comprehensive permission checking throughout the application

import React, { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjectMembers } from './useProjectMembers';
import { ProjectRole } from '../types';

// Permission types
export type Permission = 
  // Project permissions
  | 'project.view'
  | 'project.edit'
  | 'project.delete'
  | 'project.archive'
  | 'project.settings'
  
  // Member permissions
  | 'members.view'
  | 'members.invite'
  | 'members.edit'
  | 'members.remove'
  | 'members.transfer_ownership'
  
  // Canvas permissions
  | 'canvas.view'
  | 'canvas.edit'
  | 'canvas.create'
  | 'canvas.delete'
  | 'canvas.duplicate'
  
  // Shape permissions
  | 'shapes.view'
  | 'shapes.create'
  | 'shapes.edit'
  | 'shapes.delete'
  | 'shapes.lock'
  | 'shapes.unlock'
  
  // Collaboration permissions
  | 'collaboration.view_cursors'
  | 'collaboration.view_presence'
  | 'collaboration.chat'
  | 'collaboration.comments'
  
  // Export permissions
  | 'export.canvas'
  | 'export.shapes'
  | 'export.project'
  
  // AI permissions
  | 'ai.assistant'
  | 'ai.commands'
  | 'ai.generate';

// Permission configuration
interface PermissionConfig {
  [key: string]: {
    roles: ProjectRole[];
    description: string;
    category: string;
  };
}

const PERMISSION_CONFIG: PermissionConfig = {
  // Project permissions
  'project.view': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'View project details and metadata',
    category: 'Project'
  },
  'project.edit': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Edit project name, description, and settings',
    category: 'Project'
  },
  'project.delete': {
    roles: ['owner'],
    description: 'Delete the entire project',
    category: 'Project'
  },
  'project.archive': {
    roles: ['owner', 'admin'],
    description: 'Archive or unarchive the project',
    category: 'Project'
  },
  'project.settings': {
    roles: ['owner', 'admin'],
    description: 'Modify project settings and preferences',
    category: 'Project'
  },

  // Member permissions
  'members.view': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'View project members and their roles',
    category: 'Members'
  },
  'members.invite': {
    roles: ['owner', 'admin'],
    description: 'Invite new members to the project',
    category: 'Members'
  },
  'members.edit': {
    roles: ['owner', 'admin'],
    description: 'Change member roles and permissions',
    category: 'Members'
  },
  'members.remove': {
    roles: ['owner', 'admin'],
    description: 'Remove members from the project',
    category: 'Members'
  },
  'members.transfer_ownership': {
    roles: ['owner'],
    description: 'Transfer project ownership to another member',
    category: 'Members'
  },

  // Canvas permissions
  'canvas.view': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'View canvas content and layouts',
    category: 'Canvas'
  },
  'canvas.edit': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Modify canvas properties and settings',
    category: 'Canvas'
  },
  'canvas.create': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Create new canvases in the project',
    category: 'Canvas'
  },
  'canvas.delete': {
    roles: ['owner', 'admin'],
    description: 'Delete canvases from the project',
    category: 'Canvas'
  },
  'canvas.duplicate': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Duplicate existing canvases',
    category: 'Canvas'
  },

  // Shape permissions
  'shapes.view': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'View all shapes on the canvas',
    category: 'Shapes'
  },
  'shapes.create': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Create new shapes and objects',
    category: 'Shapes'
  },
  'shapes.edit': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Edit existing shapes and properties',
    category: 'Shapes'
  },
  'shapes.delete': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Delete shapes from the canvas',
    category: 'Shapes'
  },
  'shapes.lock': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Lock shapes to prevent editing',
    category: 'Shapes'
  },
  'shapes.unlock': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Unlock shapes for editing',
    category: 'Shapes'
  },

  // Collaboration permissions
  'collaboration.view_cursors': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'See other users\' cursors and selections',
    category: 'Collaboration'
  },
  'collaboration.view_presence': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'See who is currently online',
    category: 'Collaboration'
  },
  'collaboration.chat': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Participate in project chat',
    category: 'Collaboration'
  },
  'collaboration.comments': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'View and add comments to shapes',
    category: 'Collaboration'
  },

  // Export permissions
  'export.canvas': {
    roles: ['owner', 'admin', 'editor', 'viewer'],
    description: 'Export canvas as image or PDF',
    category: 'Export'
  },
  'export.shapes': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Export individual shapes or selections',
    category: 'Export'
  },
  'export.project': {
    roles: ['owner', 'admin'],
    description: 'Export entire project data',
    category: 'Export'
  },

  // AI permissions
  'ai.assistant': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Access AI assistant features',
    category: 'AI'
  },
  'ai.commands': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Execute AI commands and operations',
    category: 'AI'
  },
  'ai.generate': {
    roles: ['owner', 'admin', 'editor'],
    description: 'Generate content using AI',
    category: 'AI'
  }
};

// Hook props
interface UsePermissionsProps {
  projectId: string;
  enabled?: boolean;
}

// Permission checking functions
interface UsePermissionsReturn {
  // Current user info
  currentUserRole: ProjectRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  
  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  
  // Role checking
  hasRole: (role: ProjectRole) => boolean;
  hasAnyRole: (roles: ProjectRole[]) => boolean;
  hasAllRoles: (roles: ProjectRole[]) => boolean;
  
  // Permission utilities
  getPermissionsForRole: (role: ProjectRole) => Permission[];
  getRolesForPermission: (permission: Permission) => ProjectRole[];
  getPermissionInfo: (permission: Permission) => { roles: ProjectRole[]; description: string; category: string } | null;
  
  // Permission categories
  getPermissionsByCategory: (category: string) => Permission[];
  getAllCategories: () => string[];
  
  // UI helpers
  canView: (permission: Permission) => boolean;
  canEdit: (permission: Permission) => boolean;
  canDelete: (permission: Permission) => boolean;
  canCreate: (permission: Permission) => boolean;
  
  // Specific permission checks
  canManageProject: boolean;
  canManageMembers: boolean;
  canEditCanvas: boolean;
  canCreateShapes: boolean;
  canUseAI: boolean;
  canExport: boolean;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

// Main usePermissions hook
export const usePermissions = ({ 
  projectId, 
  enabled = true 
}: UsePermissionsProps): UsePermissionsReturn => {
  const { user } = useAuth();
  const {
    currentUserRole,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    isLoading,
    error
  } = useProjectMembers({ projectId, enabled });

  // Permission checking functions
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentUserRole) return false;
    
    const config = PERMISSION_CONFIG[permission];
    if (!config) return false;
    
    return config.roles.includes(currentUserRole);
  }, [currentUserRole]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Role checking functions
  const hasRole = useCallback((role: ProjectRole): boolean => {
    return currentUserRole === role;
  }, [currentUserRole]);

  const hasAnyRole = useCallback((roles: ProjectRole[]): boolean => {
    return currentUserRole ? roles.includes(currentUserRole) : false;
  }, [currentUserRole]);

  const hasAllRoles = useCallback((roles: ProjectRole[]): boolean => {
    // This is always false for a single user, but useful for validation
    return false;
  }, []);

  // Permission utilities
  const getPermissionsForRole = useCallback((role: ProjectRole): Permission[] => {
    return Object.keys(PERMISSION_CONFIG).filter(permission => 
      PERMISSION_CONFIG[permission].roles.includes(role)
    ) as Permission[];
  }, []);

  const getRolesForPermission = useCallback((permission: Permission): ProjectRole[] => {
    const config = PERMISSION_CONFIG[permission];
    return config ? config.roles : [];
  }, []);

  const getPermissionInfo = useCallback((permission: Permission) => {
    const config = PERMISSION_CONFIG[permission];
    return config ? {
      roles: config.roles,
      description: config.description,
      category: config.category
    } : null;
  }, []);

  // Permission categories
  const getPermissionsByCategory = useCallback((category: string): Permission[] => {
    return Object.keys(PERMISSION_CONFIG).filter(permission => 
      PERMISSION_CONFIG[permission].category === category
    ) as Permission[];
  }, []);

  const getAllCategories = useCallback((): string[] => {
    const categories = new Set<string>();
    Object.values(PERMISSION_CONFIG).forEach(config => {
      categories.add(config.category);
    });
    return Array.from(categories);
  }, []);

  // UI helpers
  const canView = useCallback((permission: Permission): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  const canEdit = useCallback((permission: Permission): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  const canDelete = useCallback((permission: Permission): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  const canCreate = useCallback((permission: Permission): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  // Specific permission checks
  const canManageProject = useMemo(() => {
    return hasAnyPermission(['project.edit', 'project.delete', 'project.archive', 'project.settings']);
  }, [hasAnyPermission]);

  const canManageMembers = useMemo(() => {
    return hasAnyPermission(['members.invite', 'members.edit', 'members.remove', 'members.transfer_ownership']);
  }, [hasAnyPermission]);

  const canEditCanvas = useMemo(() => {
    return hasAnyPermission(['canvas.edit', 'canvas.create', 'canvas.delete', 'canvas.duplicate']);
  }, [hasAnyPermission]);

  const canCreateShapes = useMemo(() => {
    return hasAnyPermission(['shapes.create', 'shapes.edit', 'shapes.delete']);
  }, [hasAnyPermission]);

  const canUseAI = useMemo(() => {
    return hasAnyPermission(['ai.assistant', 'ai.commands', 'ai.generate']);
  }, [hasAnyPermission]);

  const canExport = useMemo(() => {
    return hasAnyPermission(['export.canvas', 'export.shapes', 'export.project']);
  }, [hasAnyPermission]);

  return {
    // Current user info
    currentUserRole,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    
    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checking
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Permission utilities
    getPermissionsForRole,
    getRolesForPermission,
    getPermissionInfo,
    
    // Permission categories
    getPermissionsByCategory,
    getAllCategories,
    
    // UI helpers
    canView,
    canEdit,
    canDelete,
    canCreate,
    
    // Specific permission checks
    canManageProject,
    canManageMembers,
    canEditCanvas,
    canCreateShapes,
    canUseAI,
    canExport,
    
    // Loading and error states
    isLoading,
    error
  };
};

// Higher-order component for permission-based rendering
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  fallback?: React.ComponentType<P>
) => {
  return (props: P & { projectId: string }) => {
    const { hasAllPermissions } = usePermissions({ projectId: props.projectId });
    
    if (hasAllPermissions(requiredPermissions)) {
      return React.createElement(Component, props);
    }
    
    if (fallback) {
      return React.createElement(fallback, props);
    }
    
    return null;
  };
};

// Permission guard component
interface PermissionGuardProps {
  projectId: string;
  permission: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  projectId,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions({ projectId });
  
  const allPermissions = [permission, ...permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  return hasAccess ? children : fallback;
};

// Permission hook for specific operations
export const usePermissionCheck = (projectId: string) => {
  const permissions = usePermissions({ projectId });
  
  return {
    // Quick permission checks
    canEdit: permissions.hasPermission('project.edit'),
    canDelete: permissions.hasPermission('project.delete'),
    canInvite: permissions.hasPermission('members.invite'),
    canManage: permissions.hasPermission('members.edit'),
    canTransfer: permissions.hasPermission('members.transfer_ownership'),
    
    // Canvas permissions
    canEditCanvas: permissions.hasPermission('canvas.edit'),
    canCreateCanvas: permissions.hasPermission('canvas.create'),
    canDeleteCanvas: permissions.hasPermission('canvas.delete'),
    
    // Shape permissions
    canCreateShapes: permissions.hasPermission('shapes.create'),
    canEditShapes: permissions.hasPermission('shapes.edit'),
    canDeleteShapes: permissions.hasPermission('shapes.delete'),
    
    // AI permissions
    canUseAI: permissions.hasPermission('ai.assistant'),
    canExecuteAI: permissions.hasPermission('ai.commands'),
    canGenerateAI: permissions.hasPermission('ai.generate'),
    
    // Export permissions
    canExportCanvas: permissions.hasPermission('export.canvas'),
    canExportShapes: permissions.hasPermission('export.shapes'),
    canExportProject: permissions.hasPermission('export.project'),
    
    // Collaboration permissions
    canChat: permissions.hasPermission('collaboration.chat'),
    canComment: permissions.hasPermission('collaboration.comments'),
    canViewCursors: permissions.hasPermission('collaboration.view_cursors'),
    canViewPresence: permissions.hasPermission('collaboration.view_presence')
  };
};

export default usePermissions;
