import React, { useEffect, Suspense } from 'react';
import AppRouter from "./components/Routing/AppRouter";
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { PerformanceMonitor } from './components/Performance/PerformanceMonitor';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ServiceWorkerProvider } from './contexts/ServiceWorkerContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ProjectCanvasProvider } from './contexts/ProjectCanvasContext';
import './index.css';

// Global error boundary component
const GlobalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Application Error</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Something went wrong with the application. Please refresh the page or contact support if the problem persists.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Global application error:', error, errorInfo);
        // Here you would typically send the error to your error reporting service
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Loading component for suspense fallback
const AppLoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">Loading CollabCanvas...</p>
    </div>
  </div>
);

// Main App component with all providers
export default function App() {
  // Initialize global app features
  useEffect(() => {
    // Set up global error handling
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Here you would typically send the error to your error reporting service
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // Here you would typically send the error to your error reporting service
    };

    // Add global event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      <Suspense fallback={<AppLoadingSpinner />}>
        <AuthProvider>
          <ThemeProvider>
            <NavigationProvider>
              <ProjectProvider>
                <ProjectCanvasProvider>
                  <AccessibilityProvider>
                    <AnalyticsProvider>
                      <ServiceWorkerProvider>
                        <PerformanceMonitor>
                          <AppRouter />
                        </PerformanceMonitor>
                      </ServiceWorkerProvider>
                    </AnalyticsProvider>
                  </AccessibilityProvider>
                </ProjectCanvasProvider>
              </ProjectProvider>
            </NavigationProvider>
          </ThemeProvider>
        </AuthProvider>
      </Suspense>
    </GlobalErrorBoundary>
  );
}
