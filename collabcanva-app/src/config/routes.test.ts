// Unit tests for route configuration
// Tests for route definitions, metadata, and helper functions

import { 
  routes, 
  getRouteByPath, 
  getRouteMetadata, 
  getBreadcrumbForPath, 
  isProtectedRoute, 
  getRequiredPermission, 
  getLayoutForPath,
  ROUTES,
  navigationStructure,
  validateRoute,
  getSEOTitle,
  getSEODescription,
  getSEOKeywords
} from './routes';

describe('Route Configuration', () => {
  describe('Route Definitions', () => {
    it('should have all required routes defined', () => {
      expect(routes).toHaveLength(7);
      
      const paths = routes.map(route => route.path);
      expect(paths).toContain('/');
      expect(paths).toContain('/login');
      expect(paths).toContain('/signup');
      expect(paths).toContain('/canvas');
      expect(paths).toContain('/projects');
      expect(paths).toContain('/projects/:projectId');
      expect(paths).toContain('/projects/:projectId/canvases/:canvasId');
    });

    it('should have metadata for all routes', () => {
      routes.forEach(route => {
        expect(route.meta).toBeDefined();
        expect(route.meta?.title).toBeDefined();
        expect(route.meta?.requiresAuth).toBeDefined();
        expect(route.meta?.layout).toBeDefined();
      });
    });

    it('should have correct authentication requirements', () => {
      const publicRoutes = routes.filter(route => !route.meta?.requiresAuth);
      const protectedRoutes = routes.filter(route => route.meta?.requiresAuth);

      expect(publicRoutes).toHaveLength(3); // /, /login, /signup
      expect(protectedRoutes).toHaveLength(4); // /canvas, /projects, /projects/:projectId, /projects/:projectId/canvases/:canvasId
    });

    it('should have correct permission requirements', () => {
      const viewRoutes = routes.filter(route => route.meta?.requiredPermission === 'view');
      const noPermissionRoutes = routes.filter(route => !route.meta?.requiredPermission);

      expect(viewRoutes).toHaveLength(2); // /projects/:projectId, /projects/:projectId/canvases/:canvasId
      expect(noPermissionRoutes).toHaveLength(5); // All other routes
    });
  });

  describe('getRouteByPath', () => {
    it('should find exact route matches', () => {
      const homeRoute = getRouteByPath('/');
      const loginRoute = getRouteByPath('/login');
      const projectsRoute = getRouteByPath('/projects');

      expect(homeRoute?.path).toBe('/');
      expect(loginRoute?.path).toBe('/login');
      expect(projectsRoute?.path).toBe('/projects');
    });

    it('should find dynamic route matches', () => {
      const projectRoute = getRouteByPath('/projects/project1');
      const canvasRoute = getRouteByPath('/projects/project1/canvases/canvas1');

      expect(projectRoute?.path).toBe('/projects/:projectId');
      expect(canvasRoute?.path).toBe('/projects/:projectId/canvases/:canvasId');
    });

    it('should return undefined for non-existent routes', () => {
      const nonExistentRoute = getRouteByPath('/non-existent');
      expect(nonExistentRoute).toBeUndefined();
    });

    it('should handle complex dynamic routes', () => {
      const complexRoute = getRouteByPath('/projects/abc123/canvases/def456');
      expect(complexRoute?.path).toBe('/projects/:projectId/canvases/:canvasId');
    });
  });

  describe('getRouteMetadata', () => {
    it('should return metadata for existing routes', () => {
      const homeMeta = getRouteMetadata('/');
      const projectMeta = getRouteMetadata('/projects/project1');

      expect(homeMeta?.title).toBe('CollabCanvas - Real-time Collaborative Design Tool');
      expect(projectMeta?.requiresAuth).toBe(true);
      expect(projectMeta?.requiredPermission).toBe('view');
    });

    it('should return undefined for non-existent routes', () => {
      const nonExistentMeta = getRouteMetadata('/non-existent');
      expect(nonExistentMeta).toBeUndefined();
    });
  });

  describe('getBreadcrumbForPath', () => {
    it('should return breadcrumb for routes with breadcrumb metadata', () => {
      const projectBreadcrumb = getBreadcrumbForPath('/projects/project1', { projectId: 'project1' });
      const canvasBreadcrumb = getBreadcrumbForPath('/projects/project1/canvases/canvas1', { 
        projectId: 'project1', 
        canvasId: 'canvas1' 
      });

      expect(projectBreadcrumb).toHaveLength(3);
      expect(canvasBreadcrumb).toHaveLength(4);
    });

    it('should replace dynamic segments in breadcrumb paths', () => {
      const canvasBreadcrumb = getBreadcrumbForPath('/projects/project1/canvases/canvas1', { 
        projectId: 'project1', 
        canvasId: 'canvas1' 
      });

      expect(canvasBreadcrumb?.[2].path).toBe('/projects/project1');
      expect(canvasBreadcrumb?.[3].path).toBe('/projects/project1/canvases/canvas1');
    });

    it('should return undefined for routes without breadcrumb metadata', () => {
      const homeBreadcrumb = getBreadcrumbForPath('/');
      expect(homeBreadcrumb).toBeUndefined();
    });
  });

  describe('isProtectedRoute', () => {
    it('should return true for protected routes', () => {
      expect(isProtectedRoute('/projects')).toBe(true);
      expect(isProtectedRoute('/projects/project1')).toBe(true);
      expect(isProtectedRoute('/canvas')).toBe(true);
    });

    it('should return false for public routes', () => {
      expect(isProtectedRoute('/')).toBe(false);
      expect(isProtectedRoute('/login')).toBe(false);
      expect(isProtectedRoute('/signup')).toBe(false);
    });

    it('should return false for non-existent routes', () => {
      expect(isProtectedRoute('/non-existent')).toBe(false);
    });
  });

  describe('getRequiredPermission', () => {
    it('should return correct permission for routes that require it', () => {
      expect(getRequiredPermission('/projects/project1')).toBe('view');
      expect(getRequiredPermission('/projects/project1/canvases/canvas1')).toBe('view');
    });

    it('should return undefined for routes that do not require permissions', () => {
      expect(getRequiredPermission('/')).toBeUndefined();
      expect(getRequiredPermission('/projects')).toBeUndefined();
      expect(getRequiredPermission('/canvas')).toBeUndefined();
    });
  });

  describe('getLayoutForPath', () => {
    it('should return correct layout for different routes', () => {
      expect(getLayoutForPath('/')).toBe('default');
      expect(getLayoutForPath('/login')).toBe('minimal');
      expect(getLayoutForPath('/canvas')).toBe('fullscreen');
      expect(getLayoutForPath('/projects/project1')).toBe('fullscreen');
    });

    it('should return default layout for routes without specific layout', () => {
      expect(getLayoutForPath('/non-existent')).toBe('default');
    });
  });

  describe('ROUTES Constants', () => {
    it('should have all required route constants', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.LOGIN).toBe('/login');
      expect(ROUTES.SIGNUP).toBe('/signup');
      expect(ROUTES.CANVAS).toBe('/canvas');
      expect(ROUTES.PROJECTS).toBe('/projects');
    });

    it('should generate dynamic routes correctly', () => {
      expect(ROUTES.PROJECT('project1')).toBe('/projects/project1');
      expect(ROUTES.CANVAS_ROUTE('project1', 'canvas1')).toBe('/projects/project1/canvases/canvas1');
    });
  });

  describe('Navigation Structure', () => {
    it('should have public navigation items', () => {
      expect(navigationStructure.public).toHaveLength(3);
      expect(navigationStructure.public[0].path).toBe('/');
      expect(navigationStructure.public[1].path).toBe('/login');
      expect(navigationStructure.public[2].path).toBe('/signup');
    });

    it('should have authenticated navigation items', () => {
      expect(navigationStructure.authenticated).toHaveLength(2);
      expect(navigationStructure.authenticated[0].path).toBe('/projects');
      expect(navigationStructure.authenticated[1].path).toBe('/canvas');
    });

    it('should have project navigation items', () => {
      expect(navigationStructure.project).toHaveLength(2);
      expect(navigationStructure.project[0].path).toBe('/projects');
      expect(navigationStructure.project[1].path).toBe('/canvas');
    });
  });

  describe('validateRoute', () => {
    it('should validate existing routes', () => {
      const homeValidation = validateRoute('/');
      const projectValidation = validateRoute('/projects/project1');

      expect(homeValidation.isValid).toBe(true);
      expect(projectValidation.isValid).toBe(true);
    });

    it('should reject non-existent routes', () => {
      const nonExistentValidation = validateRoute('/non-existent');
      expect(nonExistentValidation.isValid).toBe(false);
      expect(nonExistentValidation.error).toBe('Route not found');
    });
  });

  describe('SEO Helpers', () => {
    it('should generate SEO title for routes', () => {
      const homeTitle = getSEOTitle('/');
      const projectTitle = getSEOTitle('/projects/project1', { projectId: 'project1' });

      expect(homeTitle).toBe('CollabCanvas - Real-time Collaborative Design Tool');
      expect(projectTitle).toBe('Project - CollabCanvas');
    });

    it('should generate SEO description for routes', () => {
      const homeDescription = getSEODescription('/');
      const projectDescription = getSEODescription('/projects/project1', { projectId: 'project1' });

      expect(homeDescription).toBe('Create, collaborate, and design together in real-time with your team');
      expect(projectDescription).toBe('View and manage project canvases');
    });

    it('should generate SEO keywords for routes', () => {
      const homeKeywords = getSEOKeywords('/');
      const projectKeywords = getSEOKeywords('/projects');

      expect(homeKeywords).toContain('collaborative design');
      expect(homeKeywords).toContain('real-time');
      expect(projectKeywords).toContain('projects');
    });

    it('should replace dynamic segments in SEO content', () => {
      const canvasTitle = getSEOTitle('/projects/project1/canvases/canvas1', { 
        projectId: 'project1', 
        canvasId: 'canvas1' 
      });
      const canvasDescription = getSEODescription('/projects/project1/canvases/canvas1', { 
        projectId: 'project1', 
        canvasId: 'canvas1' 
      });

      expect(canvasTitle).toBe('Canvas - CollabCanvas');
      expect(canvasDescription).toBe('Collaborative canvas workspace for real-time design and collaboration');
    });
  });

  describe('Route Metadata Validation', () => {
    it('should have consistent metadata structure', () => {
      routes.forEach(route => {
        if (route.meta) {
          expect(typeof route.meta.title).toBe('string');
          expect(typeof route.meta.requiresAuth).toBe('boolean');
          expect(typeof route.meta.layout).toBe('string');
          
          if (route.meta.requiredPermission) {
            expect(['view', 'edit', 'admin']).toContain(route.meta.requiredPermission);
          }
          
          if (route.meta.breadcrumb) {
            expect(Array.isArray(route.meta.breadcrumb)).toBe(true);
            route.meta.breadcrumb.forEach(breadcrumb => {
              expect(typeof breadcrumb.label).toBe('string');
              expect(typeof breadcrumb.path).toBe('string');
            });
          }
          
          if (route.meta.seo) {
            expect(typeof route.meta.seo.title).toBe('string');
            expect(typeof route.meta.seo.description).toBe('string');
            if (route.meta.seo.keywords) {
              expect(Array.isArray(route.meta.seo.keywords)).toBe(true);
            }
          }
        }
      });
    });
  });
});
