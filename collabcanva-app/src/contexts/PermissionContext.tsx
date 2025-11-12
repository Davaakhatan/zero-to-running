// PermissionContext for global permission management
// Provides permission checking throughout the application

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { ProjectRole, Permission } from '../types';

// Permission context interface
interface PermissionContextType {
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
  
  // Quick permission checks
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManage: boolean;
  canTransfer: boolean;
  canUseAI: boolean;
  canExport: boolean;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

// Create context
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Permission configuration (same as in usePermissions)
const PERMISSION_CONFIG = {
  'project.view': ['owner', 'admin', 'editor', 'viewer'],
  'project.edit': ['owner', 'admin', 'editor'],
  'project.delete': ['owner'],
  'project.archive': ['owner', 'admin'],
  'project.settings': ['owner', 'admin'],
  
  'members.view': ['owner', 'admin', 'editor', 'viewer'],
  'members.invite': ['owner', 'admin'],
  'members.edit': ['owner', 'admin'],
  'members.remove': ['owner', 'admin'],
  'members.transfer_ownership': ['owner'],
  
  'canvas.view': ['owner', 'admin', 'editor', 'viewer'],
  'canvas.edit': ['owner', 'admin', 'editor'],
  'canvas.create': ['owner', 'admin', 'editor'],
  'canvas.delete': ['owner', 'admin'],
  'canvas.duplicate': ['owner', 'admin', 'editor'],
  
  'shapes.view': ['owner', 'admin', 'editor', 'viewer'],
  'shapes.create': ['owner', 'admin', 'editor'],
  'shapes.edit': ['owner', 'admin', 'editor'],
  'shapes.delete': ['owner', 'admin', 'editor'],
  'shapes.lock': ['owner', 'admin', 'editor'],
  'shapes.unlock': ['owner', 'admin', 'editor'],
  
  'collaboration.view_cursors': ['owner', 'admin', 'editor', 'viewer'],
  'collaboration.view_presence': ['owner', 'admin', 'editor', 'viewer'],
  'collaboration.chat': ['owner', 'admin', 'editor'],
  'collaboration.comments': ['owner', 'admin', 'editor', 'viewer'],
  
  'export.canvas': ['owner', 'admin', 'editor', 'viewer'],
  'export.shapes': ['owner', 'admin', 'editor'],
  'export.project': ['owner', 'admin'],
  
  'ai.assistant': ['owner', 'admin', 'editor'],
  'ai.commands': ['owner', 'admin', 'editor'],
  'ai.generate': ['owner', 'admin', 'editor']
};

// Permission provider props
interface PermissionProviderProps {
  children: ReactNode;
  projectId: string;
  enabled?: boolean;
}

// Permission provider component
export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
  projectId,
  enabled = true
}) => {
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
  const hasPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!currentUserRole) return false;
      
      const allowedRoles = PERMISSION_CONFIG[permission];
      if (!allowedRoles) return false;
      
      return allowedRoles.includes(currentUserRole);
    };
  }, [currentUserRole]);

  const hasAnyPermission = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      return permissions.some(permission => hasPermission(permission));
    };
  }, [hasPermission]);

  const hasAllPermissions = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      return permissions.every(permission => hasPermission(permission));
    };
  }, [hasPermission]);

  // Role checking functions
  const hasRole = useMemo(() => {
    return (role: ProjectRole): boolean => {
      return currentUserRole === role;
    };
  }, [currentUserRole]);

  const hasAnyRole = useMemo(() => {
    return (roles: ProjectRole[]): boolean => {
      return currentUserRole ? roles.includes(currentUserRole) : false;
    };
  }, [currentUserRole]);

  // Quick permission checks
  const canEdit = useMemo(() => {
    return hasPermission('project.edit');
  }, [hasPermission]);

  const canDelete = useMemo(() => {
    return hasPermission('project.delete');
  }, [hasPermission]);

  const canInvite = useMemo(() => {
    return hasPermission('members.invite');
  }, [hasPermission]);

  const canManage = useMemo(() => {
    return hasPermission('members.edit');
  }, [hasPermission]);

  const canTransfer = useMemo(() => {
    return hasPermission('members.transfer_ownership');
  }, [hasPermission]);

  const canUseAI = useMemo(() => {
    return hasPermission('ai.assistant');
  }, [hasPermission]);

  const canExport = useMemo(() => {
    return hasPermission('export.canvas');
  }, [hasPermission]);

  // Context value
  const contextValue = useMemo(() => ({
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
    
    // Quick permission checks
    canEdit,
    canDelete,
    canInvite,
    canManage,
    canTransfer,
    canUseAI,
    canExport,
    
    // Loading and error states
    isLoading,
    error
  }), [
    currentUserRole,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canEdit,
    canDelete,
    canInvite,
    canManage,
    canTransfer,
    canUseAI,
    canExport,
    isLoading,
    error
  ]);

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to use permission context
export const usePermissionContext = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  
  return context;
};

// Higher-order component for permission-based rendering
export const withPermissionContext = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  fallback?: React.ComponentType<P>
) => {
  return (props: P) => {
    const { hasAllPermissions } = usePermissionContext();
    
    if (hasAllPermissions(requiredPermissions)) {
      return <Component {...props} />;
    }
    
    if (fallback) {
      return <div {...props} />;
    }
    
    return null;
  };
};

// Permission guard component
interface PermissionGuardProps {
  permission: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  const allPermissions = [permission, ...permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Role guard component
interface RoleGuardProps {
  role: ProjectRole;
  roles?: ProjectRole[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasRole, hasAnyRole } = usePermissionContext();
  
  const allRoles = [role, ...roles];
  
  const hasAccess = requireAll 
    ? allRoles.every(r => hasRole(r))
    : hasAnyRole(allRoles);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Permission-based button component
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  ...buttonProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  const allPermissions = [permission, ...permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <button {...buttonProps}>{children}</button>;
};

// Permission-based link component
interface PermissionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  permission: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionLink: React.FC<PermissionLinkProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  ...linkProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  const allPermissions = [permission, ...permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <a {...linkProps}>{children}</a>;
};

// Permission-based input component
interface PermissionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  permission: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionInput: React.FC<PermissionInputProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  ...inputProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  const allPermissions = [permission, ...permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <input {...inputProps} />;
};

// Permission-based textarea component
interface PermissionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  permission: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionTextarea: React.FC<PermissionTextareaProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  ...textareaProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  const allPermissions = [permission, ...permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <textarea {...textareaProps} />;
};

// Permission-based select component
interface PermissionSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  permission: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionSelect: React.FC<PermissionSelectProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  ...selectProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  const allPermissions = [permission, ...permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <select {...selectProps}>{children}</select>;
};

