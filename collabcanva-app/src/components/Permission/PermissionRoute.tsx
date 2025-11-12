// Permission-based route protection
// Protects routes based on user permissions and roles

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissionContext } from '../../contexts/PermissionContext';
import { Permission, ProjectRole } from "../../types"

// Route protection props
interface PermissionRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: ProjectRole;
  roles?: ProjectRole[];
  requireAllRoles?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

// Access denied component
const AccessDenied: React.FC<{ message?: string }> = ({ message = 'Access Denied' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
        {message}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
);

// Permission route component
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  requireAllRoles = false,
  fallback = null,
  redirectTo,
  showAccessDenied = true
}) => {
  const location = useLocation();
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading,
    error
  } = usePermissionContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
            Permission Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {error}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check permissions
  let hasAccess = true;

  // Check permission-based access
  if (permission || permissions.length > 0) {
    const allPermissions = permission ? [permission, ...permissions] : permissions;
    hasAccess = requireAll 
      ? hasAllPermissions(allPermissions)
      : hasAnyPermission(allPermissions);
  }

  // Check role-based access
  if (role || roles.length > 0) {
    const allRoles = role ? [role, ...roles] : roles;
    const hasRoleAccess = requireAllRoles 
      ? allRoles.every(r => hasRole(r))
      : hasAnyRole(allRoles);
    
    hasAccess = hasAccess && hasRoleAccess;
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If redirect is specified, redirect to that route
  if (redirectTo) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show access denied page
  if (showAccessDenied) {
    return <AccessDenied />;
  }

  // Default: don't render anything
  return null;
};

// Higher-order component for permission-based route protection
export const withPermissionRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    permission?: Permission;
    permissions?: Permission[];
    requireAll?: boolean;
    role?: ProjectRole;
    roles?: ProjectRole[];
    requireAllRoles?: boolean;
    redirectTo?: string;
    showAccessDenied?: boolean;
  }
) => {
  return (props: P) => (
    <PermissionRoute {...options}>
      <Component {...props} />
    </PermissionRoute>
  );
};

// Permission-based route guard hook
export const usePermissionRoute = (options: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: ProjectRole;
  roles?: ProjectRole[];
  requireAllRoles?: boolean;
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading,
    error
  } = usePermissionContext();

  const { permission, permissions = [], requireAll = false, role, roles = [], requireAllRoles = false } = options;

  // Check permissions
  let hasAccess = true;

  // Check permission-based access
  if (permission || permissions.length > 0) {
    const allPermissions = permission ? [permission, ...permissions] : permissions;
    hasAccess = requireAll 
      ? hasAllPermissions(allPermissions)
      : hasAnyPermission(allPermissions);
  }

  // Check role-based access
  if (role || roles.length > 0) {
    const allRoles = role ? [role, ...roles] : roles;
    const hasRoleAccess = requireAllRoles 
      ? allRoles.every(r => hasRole(r))
      : hasAnyRole(allRoles);
    
    hasAccess = hasAccess && hasRoleAccess;
  }

  return {
    hasAccess,
    isLoading,
    error
  };
};

// Permission-based navigation component
interface PermissionNavLinkProps {
  to: string;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: ProjectRole;
  roles?: ProjectRole[];
  requireAllRoles?: boolean;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  fallback?: React.ReactNode;
}

export const PermissionNavLink: React.FC<PermissionNavLinkProps> = ({
  to,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  requireAllRoles = false,
  children,
  className = '',
  activeClassName = '',
  fallback = null
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole
  } = usePermissionContext();

  // Check permissions
  let hasAccess = true;

  // Check permission-based access
  if (permission || permissions.length > 0) {
    const allPermissions = permission ? [permission, ...permissions] : permissions;
    hasAccess = requireAll 
      ? hasAllPermissions(allPermissions)
      : hasAnyPermission(allPermissions);
  }

  // Check role-based access
  if (role || roles.length > 0) {
    const allRoles = role ? [role, ...roles] : roles;
    const hasRoleAccess = requireAllRoles 
      ? allRoles.every(r => hasRole(r))
      : hasAnyRole(allRoles);
    
    hasAccess = hasAccess && hasRoleAccess;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return (
    <a
      href={to}
      className={`${className} ${activeClassName}`}
    >
      {children}
    </a>
  );
};

// Permission-based breadcrumb component
interface PermissionBreadcrumbProps {
  items: Array<{
    label: string;
    href: string;
    permission?: Permission;
    permissions?: Permission[];
    requireAll?: boolean;
    role?: ProjectRole;
    roles?: ProjectRole[];
    requireAllRoles?: boolean;
  }>;
  separator?: string;
  className?: string;
}

export const PermissionBreadcrumb: React.FC<PermissionBreadcrumbProps> = ({
  items,
  separator = '/',
  className = ''
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole
  } = usePermissionContext();

  const visibleItems = items.filter(item => {
    // Check permissions
    let hasAccess = true;

    // Check permission-based access
    if (item.permission || (item.permissions && item.permissions.length > 0)) {
      const allPermissions = item.permission ? [item.permission, ...(item.permissions || [])] : item.permissions || [];
      hasAccess = item.requireAll 
        ? hasAllPermissions(allPermissions)
        : hasAnyPermission(allPermissions);
    }

    // Check role-based access
    if (item.role || (item.roles && item.roles.length > 0)) {
      const allRoles = item.role ? [item.role, ...(item.roles || [])] : item.roles || [];
      const hasRoleAccess = item.requireAllRoles 
        ? allRoles.every(r => hasRole(r))
        : hasAnyRole(allRoles);
      
      hasAccess = hasAccess && hasRoleAccess;
    }

    return hasAccess;
  });

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {visibleItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">{separator}</span>
            )}
            <a
              href={item.href}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default PermissionRoute;
