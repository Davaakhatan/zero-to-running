// Permission-aware UI components
// Reusable components with built-in permission checking

import React from 'react';
import { usePermissionContext } from '../../contexts/PermissionContext';
import { Permission, ProjectRole } from "../../types"

// Base permission component props
interface BasePermissionProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Permission wrapper component
export const PermissionWrapper: React.FC<BasePermissionProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  if (!permission && permissions.length === 0) {
    return <>{children}</>;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Role wrapper component
interface RoleWrapperProps {
  role?: ProjectRole;
  roles?: ProjectRole[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleWrapper: React.FC<RoleWrapperProps> = ({
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasRole, hasAnyRole } = usePermissionContext();
  
  if (!role && roles.length === 0) {
    return <>{children}</>;
  }
  
  const allRoles = role ? [role, ...roles] : roles;
  
  const hasAccess = requireAll 
    ? allRoles.every(r => hasRole(r))
    : hasAnyRole(allRoles);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Permission-aware button component
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: Permission;
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
  
  if (!permission && permissions.length === 0) {
    return <button {...buttonProps}>{children}</button>;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <button {...buttonProps}>{children}</button>;
};

// Permission-aware link component
interface PermissionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  permission?: Permission;
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
  
  if (!permission && permissions.length === 0) {
    return <a {...linkProps}>{children}</a>;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <a {...linkProps}>{children}</a>;
};

// Permission-aware input component
interface PermissionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  permission?: Permission;
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
  
  if (!permission && permissions.length === 0) {
    return <input {...inputProps} />;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <input {...inputProps} />;
};

// Permission-aware textarea component
interface PermissionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  permission?: Permission;
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
  
  if (!permission && permissions.length === 0) {
    return <textarea {...textareaProps} />;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <textarea {...textareaProps} />;
};

// Permission-aware select component
interface PermissionSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  permission?: Permission;
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
  
  if (!permission && permissions.length === 0) {
    return <select {...selectProps}>{children}</select>;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <select {...selectProps}>{children}</select>;
};

// Permission-aware div component
interface PermissionDivProps extends React.HTMLAttributes<HTMLDivElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionDiv: React.FC<PermissionDivProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  ...divProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  if (!permission && permissions.length === 0) {
    return <div {...divProps}>{children}</div>;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <div {...divProps}>{children}</div>;
};

// Permission-aware span component
interface PermissionSpanProps extends React.HTMLAttributes<HTMLSpanElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionSpan: React.FC<PermissionSpanProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  ...spanProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  if (!permission && permissions.length === 0) {
    return <span {...spanProps}>{children}</span>;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <span {...spanProps}>{children}</span>;
};

// Permission-aware form component
interface PermissionFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionForm: React.FC<PermissionFormProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  ...formProps
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  if (!permission && permissions.length === 0) {
    return <form {...formProps}>{children}</form>;
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <form {...formProps}>{children}</form>;
};

// Permission-aware modal component
interface PermissionModalProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  isOpen,
  onClose,
  title,
  className = ''
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  if (!isOpen) {
    return null;
  }
  
  if (!permission && permissions.length === 0) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// Permission-aware tooltip component
interface PermissionTooltipProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const PermissionTooltip: React.FC<PermissionTooltipProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  content,
  position = 'top',
  className = ''
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  if (!permission && permissions.length === 0) {
    return (
      <div className={`relative group ${className}`}>
        {children}
        <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : position === 'bottom' ? 'top-full mt-2' : position === 'left' ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}>
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {content}
          </div>
        </div>
      </div>
    );
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={`relative group ${className}`}>
      {children}
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : position === 'bottom' ? 'top-full mt-2' : position === 'left' ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}>
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
};

// Permission-aware badge component
interface PermissionBadgeProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  
  if (!permission && permissions.length === 0) {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      error: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
    };
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-2 text-base'
    };
    
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
        {children}
      </span>
    );
  }
  
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

export default {
  PermissionWrapper,
  RoleWrapper,
  PermissionButton,
  PermissionLink,
  PermissionInput,
  PermissionTextarea,
  PermissionSelect,
  PermissionDiv,
  PermissionSpan,
  PermissionForm,
  PermissionModal,
  PermissionTooltip,
  PermissionBadge
};
