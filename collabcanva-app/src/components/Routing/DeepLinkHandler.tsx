// Deep link handler component for processing deep links in specific routes
// Provides loading states, error handling, and automatic navigation

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDeepLinkContext } from '../../contexts/DeepLinkContext';
import { DeepLinkOptions } from '../../services/deepLinkService';

// Deep link handler props
interface DeepLinkHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  options?: DeepLinkOptions;
  autoProcess?: boolean;
  requireProject?: boolean;
  requireCanvas?: boolean;
}

// Loading component
const DefaultLoadingComponent: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

// Error component
const DefaultErrorComponent: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
    <div className="text-center space-y-6 max-w-md mx-auto px-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Deep Link Error</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

// Not found component
const DefaultNotFoundComponent: React.FC<{ type: 'project' | 'canvas' }> = ({ type }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
    <div className="text-center space-y-6 max-w-md mx-auto px-6">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {type === 'project' ? 'Project Not Found' : 'Canvas Not Found'}
        </h1>
        <p className="text-gray-600 mb-6">
          {type === 'project' 
            ? 'The project you\'re looking for doesn\'t exist or you don\'t have access to it.'
            : 'The canvas you\'re looking for doesn\'t exist in this project.'
          }
        </p>
        <a
          href="/projects"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </a>
      </div>
    </div>
  </div>
);

// Main deep link handler component
export const DeepLinkHandler: React.FC<DeepLinkHandlerProps> = ({
  children,
  fallback,
  loadingComponent,
  errorComponent,
  onSuccess,
  onError,
  options = {},
  autoProcess = true,
  requireProject = false,
  requireCanvas = false
}) => {
  const { projectId, canvasId } = useParams<{ projectId?: string; canvasId?: string }>();
  const location = useLocation();
  const deepLink = useDeepLinkContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [notFoundType, setNotFoundType] = useState<'project' | 'canvas' | null>(null);

  // Process deep link
  const processDeepLink = useCallback(async () => {
    if (!autoProcess) return;

    setIsProcessing(true);
    setProcessingError(null);
    setNotFoundType(null);

    try {
      const result = await deepLink.processCurrentUrl(options);

      if (result.success) {
        onSuccess?.(result);
      } else {
        const error = result.error || 'Unknown error';
        setProcessingError(error);
        onError?.(error);

        // Determine if it's a not found error
        if (error.includes('not found') || error.includes('doesn\'t exist')) {
          if (requireCanvas && canvasId) {
            setNotFoundType('canvas');
          } else if (requireProject && projectId) {
            setNotFoundType('project');
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process deep link';
      setProcessingError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [autoProcess, options, onSuccess, onError, deepLink, requireProject, requireCanvas, projectId, canvasId]);

  // Retry processing
  const handleRetry = useCallback(() => {
    processDeepLink();
  }, [processDeepLink]);

  // Process on mount and location change
  useEffect(() => {
    processDeepLink();
  }, [processDeepLink]);

  // Show loading state
  if (isProcessing || deepLink.isLoading) {
    return loadingComponent || <DefaultLoadingComponent message="Processing deep link..." />;
  }

  // Show error state
  if (processingError || deepLink.error) {
    const error = processingError || deepLink.error;
    
    if (notFoundType) {
      return <DefaultNotFoundComponent type={notFoundType} />;
    }
    
    return errorComponent || <DefaultErrorComponent error={error} onRetry={handleRetry} />;
  }

  // Show fallback if no result
  if (!deepLink.currentResult && (requireProject || requireCanvas)) {
    return fallback || <DefaultLoadingComponent message="Loading..." />;
  }

  // Show children if processing successful or not required
  return <>{children}</>;
};

// Convenience components for specific use cases
export const ProjectDeepLinkHandler: React.FC<Omit<DeepLinkHandlerProps, 'requireProject'>> = (props) => (
  <DeepLinkHandler {...props} requireProject={true} />
);

export const CanvasDeepLinkHandler: React.FC<Omit<DeepLinkHandlerProps, 'requireProject' | 'requireCanvas'>> = (props) => (
  <DeepLinkHandler {...props} requireProject={true} requireCanvas={true} />
);

// Hook for deep link processing in components
export const useDeepLinkProcessing = (options: DeepLinkOptions = {}) => {
  const deepLink = useDeepLinkContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processCurrentUrl = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await deepLink.processCurrentUrl(options);
      if (!result.success) {
        setError(result.error || 'Unknown error');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process deep link';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  }, [deepLink, options]);

  return {
    processCurrentUrl,
    isProcessing,
    error,
    clearError: () => setError(null)
  };
};

export default DeepLinkHandler;
