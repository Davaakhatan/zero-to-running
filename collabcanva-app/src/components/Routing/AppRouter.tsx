// Enhanced app router with route guards and metadata
// Provides comprehensive routing with permission-based access control

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { RouteGuard, ProjectRouteGuard, CanvasRouteGuard } from './RouteGuard';
import { routes, ROUTES } from '../../config/routes';
import { getRouteMetadata, getSEOTitle, getSEODescription } from '../../config/routes';

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

// Error boundary component
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                We encountered an error while loading this page. Please try refreshing or go back to the previous page.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// SEO component to update document title and meta tags
const SEOUpdater: React.FC<{ path: string; params?: Record<string, string> }> = ({ path, params }) => {
  useEffect(() => {
    const routeMeta = getRouteMetadata(path);
    if (routeMeta) {
      const title = getSEOTitle(path, params);
      const description = getSEODescription(path, params);
      
      // Update document title
      document.title = title;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [path, params]);

  return null;
};

// Route wrapper component
const RouteWrapper: React.FC<{ 
  path: string; 
  element: React.ReactNode; 
  meta?: any;
}> = ({ path, element, meta }) => {
  const params = useParams();
  
  return (
    <>
      <SEOUpdater path={path} params={params} />
      {element}
    </>
  );
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  requiredPermission?: 'view' | 'edit' | 'admin';
  requireProject?: boolean;
  requireCanvas?: boolean;
}> = ({ children, requiredPermission, requireProject, requireCanvas }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // If no specific permissions required, just check authentication
  if (!requiredPermission && !requireProject && !requireCanvas) {
    return <>{children}</>;
  }

  // Use route guard for permission-based access
  return (
    <RouteGuard
      requiredPermission={requiredPermission}
      requireProject={requireProject}
      requireCanvas={requireCanvas}
    >
      {children}
    </RouteGuard>
  );
};

// Main router component
const AppRouter: React.FC = () => {
  const location = useLocation();

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
        <Routes>
          {/* Public routes */}
          <Route 
            path={ROUTES.HOME} 
            element={
              <RouteWrapper path={ROUTES.HOME} element={routes[0].element} meta={routes[0].meta} />
            } 
          />
          <Route 
            path={ROUTES.LOGIN} 
            element={
              <RouteWrapper path={ROUTES.LOGIN} element={routes[1].element} meta={routes[1].meta} />
            } 
          />
          <Route 
            path={ROUTES.SIGNUP} 
            element={
              <RouteWrapper path={ROUTES.SIGNUP} element={routes[2].element} meta={routes[2].meta} />
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path={ROUTES.CANVAS} 
            element={
              <ProtectedRoute>
                <RouteWrapper path={ROUTES.CANVAS} element={routes[3].element} meta={routes[3].meta} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path={ROUTES.PROJECTS} 
            element={
              <ProtectedRoute>
                <RouteWrapper path={ROUTES.PROJECTS} element={routes[4].element} meta={routes[4].meta} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/:projectId" 
            element={
              <ProtectedRoute requiredPermission="view" requireProject={true}>
                <RouteWrapper path="/projects/:projectId" element={routes[5].element} meta={routes[5].meta} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/:projectId/canvases/:canvasId" 
            element={
              <ProtectedRoute requiredPermission="view" requireProject={true} requireCanvas={true}>
                <RouteWrapper path="/projects/:projectId/canvases/:canvasId" element={routes[6].element} meta={routes[6].meta} />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md mx-auto px-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                    <p className="text-gray-600 mb-6">
                      The page you're looking for doesn't exist or has been moved.
                    </p>
                    <a
                      href={ROUTES.HOME}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Go Home
                    </a>
                  </div>
                </div>
              </div>
            } 
          />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
};

// Main app component with auth provider
const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default AppWithAuth;
