// Route configuration for the application
// Centralizes route definitions, metadata, and navigation structure

import React, { Suspense } from 'react';
import { lazy } from 'react';

// Define RouteObject type for compatibility
interface RouteObject {
  path: string;
  element: React.ReactElement;
  meta?: {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
    roles?: string[];
  };
}

// Create wrapper components for lazy loading
const HomeWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Home />
  </Suspense>
);

const LoginWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Login />
  </Suspense>
);

const SignupWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Signup />
  </Suspense>
);

const CanvasPageWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <CanvasPage />
  </Suspense>
);

const ProjectDashboardPageWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ProjectDashboardPage />
  </Suspense>
);

const ProjectCanvasPageWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ProjectCanvasPage />
  </Suspense>
);

// Lazy load page components
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../components/Auth/Login'));
const Signup = lazy(() => import('../components/Auth/Signup'));
const CanvasPage = lazy(() => import('../pages/CanvasPage'));
const ProjectDashboardPage = lazy(() => import('../pages/ProjectDashboardPage'));
const ProjectCanvasPage = lazy(() => import('../pages/ProjectCanvasPage'));

// Route metadata interface
export interface RouteMetadata {
  title: string;
  description?: string;
  requiresAuth: boolean;
  requiredPermission?: 'view' | 'edit' | 'admin';
  breadcrumb?: {
    label: string;
    path: string;
  }[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  layout?: 'default' | 'minimal' | 'fullscreen';
}

// Route configuration with metadata
export interface AppRoute extends RouteObject {
  meta?: RouteMetadata;
}

// Route definitions
export const routes: AppRoute[] = [
  {
    path: '/',
    element: React.createElement(HomeWrapper),
    meta: {
      title: 'CollabCanvas - Real-time Collaborative Design Tool',
      description: 'Create, collaborate, and design together in real-time with your team',
      requiresAuth: false,
      layout: 'default',
      seo: {
        title: 'CollabCanvas - Real-time Collaborative Design Tool',
        description: 'Create, collaborate, and design together in real-time with your team',
        keywords: ['collaborative design', 'real-time', 'team collaboration', 'design tool']
      }
    }
  },
  {
    path: '/login',
    element: React.createElement(LoginWrapper),
    meta: {
      title: 'Sign In - CollabCanvas',
      description: 'Sign in to your CollabCanvas account',
      requiresAuth: false,
      layout: 'minimal',
      seo: {
        title: 'Sign In - CollabCanvas',
        description: 'Sign in to your CollabCanvas account to start collaborating',
        keywords: ['sign in', 'login', 'authentication']
      }
    }
  },
  {
    path: '/signup',
    element: React.createElement(SignupWrapper),
    meta: {
      title: 'Create Account - CollabCanvas',
      description: 'Create a new CollabCanvas account',
      requiresAuth: false,
      layout: 'minimal',
      seo: {
        title: 'Create Account - CollabCanvas',
        description: 'Create a new CollabCanvas account to start collaborating with your team',
        keywords: ['sign up', 'create account', 'register']
      }
    }
  },
  {
    path: '/canvas',
    element: React.createElement(CanvasPageWrapper),
    meta: {
      title: 'Legacy Canvas - CollabCanvas',
      description: 'Legacy single-canvas mode',
      requiresAuth: true,
      layout: 'fullscreen',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'Legacy Canvas', path: '/canvas' }
      ],
      seo: {
        title: 'Legacy Canvas - CollabCanvas',
        description: 'Legacy single-canvas mode for backward compatibility'
      }
    }
  },
  {
    path: '/projects',
    element: React.createElement(ProjectDashboardPageWrapper),
    meta: {
      title: 'Projects - CollabCanvas',
      description: 'Manage your projects and collaborate with your team',
      requiresAuth: true,
      layout: 'default',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'Projects', path: '/projects' }
      ],
      seo: {
        title: 'Projects - CollabCanvas',
        description: 'Manage your projects and collaborate with your team',
        keywords: ['projects', 'project management', 'collaboration']
      }
    }
  },
  {
    path: '/projects/:projectId',
    element: React.createElement(ProjectCanvasPageWrapper),
    meta: {
      title: 'Project - CollabCanvas',
      description: 'View and manage project canvases',
      requiresAuth: true,
      requiredPermission: 'view',
      layout: 'fullscreen',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project', path: '/projects/:projectId' }
      ],
      seo: {
        title: 'Project - CollabCanvas',
        description: 'View and manage project canvases'
      }
    }
  },
  {
    path: '/projects/:projectId/canvases/:canvasId',
    element: React.createElement(ProjectCanvasPageWrapper),
    meta: {
      title: 'Canvas - CollabCanvas',
      description: 'Collaborative canvas workspace',
      requiresAuth: true,
      requiredPermission: 'view',
      layout: 'fullscreen',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project', path: '/projects/:projectId' },
        { label: 'Canvas', path: '/projects/:projectId/canvases/:canvasId' }
      ],
      seo: {
        title: 'Canvas - CollabCanvas',
        description: 'Collaborative canvas workspace for real-time design and collaboration'
      }
    }
  }
];

// Route helper functions
export const getRouteByPath = (path: string): AppRoute | undefined => {
  return routes.find(route => {
    if (route.path === path) return true;
    
    // Handle dynamic routes
    if (route.path?.includes(':')) {
      const routeSegments = route.path.split('/');
      const pathSegments = path.split('/');
      
      if (routeSegments.length !== pathSegments.length) return false;
      
      return routeSegments.every((segment, index) => {
        if (segment.startsWith(':')) return true;
        return segment === pathSegments[index];
      });
    }
    
    return false;
  });
};

export const getRouteMetadata = (path: string): RouteMetadata | undefined => {
  const route = getRouteByPath(path);
  return route?.meta;
};

export const getBreadcrumbForPath = (path: string, params?: Record<string, string>): RouteMetadata['breadcrumb'] => {
  const route = getRouteByPath(path);
  if (!route?.meta?.breadcrumb) return undefined;
  
  // Replace dynamic segments with actual values
  return route.meta.breadcrumb.map(breadcrumb => ({
    ...breadcrumb,
    path: breadcrumb.path.replace(/:(\w+)/g, (match, key) => params?.[key] || match)
  }));
};

export const isProtectedRoute = (path: string): boolean => {
  const route = getRouteByPath(path);
  return route?.meta?.requiresAuth || false;
};

export const getRequiredPermission = (path: string): RouteMetadata['requiredPermission'] => {
  const route = getRouteByPath(path);
  return route?.meta?.requiredPermission;
};

export const getLayoutForPath = (path: string): RouteMetadata['layout'] => {
  const route = getRouteByPath(path);
  return route?.meta?.layout || 'default';
};

// Route constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  CANVAS: '/canvas',
  PROJECTS: '/projects',
  PROJECT: (projectId: string) => `/projects/${projectId}`,
  CANVAS_ROUTE: (projectId: string, canvasId: string) => `/projects/${projectId}/canvases/${canvasId}`
} as const;

// Navigation structure
export const navigationStructure = {
  public: [
    { path: ROUTES.HOME, label: 'Home', icon: 'home' },
    { path: ROUTES.LOGIN, label: 'Sign In', icon: 'login' },
    { path: ROUTES.SIGNUP, label: 'Sign Up', icon: 'user-plus' }
  ],
  authenticated: [
    { path: ROUTES.PROJECTS, label: 'Projects', icon: 'folder' },
    { path: ROUTES.CANVAS, label: 'Legacy Canvas', icon: 'canvas' }
  ],
  project: [
    { path: ROUTES.PROJECTS, label: 'All Projects', icon: 'folder' },
    { path: ROUTES.CANVAS, label: 'Legacy Canvas', icon: 'canvas' }
  ]
};

// Route validation
export const validateRoute = (path: string): { isValid: boolean; error?: string } => {
  // Check if route exists
  const route = getRouteByPath(path);
  if (!route) {
    return { isValid: false, error: 'Route not found' };
  }
  
  // Check if route requires auth
  if (route.meta?.requiresAuth) {
    // This would be checked by the RouteGuard component
    return { isValid: true };
  }
  
  return { isValid: true };
};

// SEO helpers
export const getSEOTitle = (path: string, params?: Record<string, string>): string => {
  const route = getRouteByPath(path);
  if (!route?.meta?.seo?.title) return 'CollabCanvas';
  
  let title = route.meta.seo.title;
  
  // Replace dynamic segments
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      title = title.replace(new RegExp(`:${key}`, 'g'), value);
    });
  }
  
  return title;
};

export const getSEODescription = (path: string, params?: Record<string, string>): string => {
  const route = getRouteByPath(path);
  if (!route?.meta?.seo?.description) return 'Real-time collaborative design tool';
  
  let description = route.meta.seo.description;
  
  // Replace dynamic segments
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      description = description.replace(new RegExp(`:${key}`, 'g'), value);
    });
  }
  
  return description;
};

export const getSEOKeywords = (path: string): string[] => {
  const route = getRouteByPath(path);
  return route?.meta?.seo?.keywords || ['collaborative design', 'real-time', 'team collaboration'];
};
