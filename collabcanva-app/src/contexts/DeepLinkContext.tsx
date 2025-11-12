// Deep link context for global deep linking state management
// Provides deep link processing, navigation, and state management across the application

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useProjectCanvas } from './ProjectCanvasContext';
import { deepLinkService, DeepLinkParams, DeepLinkResult, DeepLinkOptions } from '../services/deepLinkService';

// Context state interface
interface DeepLinkContextState {
  // Current deep link state
  currentUrl: string;
  currentParams: DeepLinkParams | null;
  currentResult: DeepLinkResult | null;
  
  // Processing state
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Cache state
  cacheStats: { size: number; keys: string[] };
  
  // Recent deep links
  recentLinks: Array<{
    url: string;
    params: DeepLinkParams;
    timestamp: number;
    success: boolean;
  }>;
}

// Context actions interface
interface DeepLinkContextActions {
  // Deep link processing
  processUrl: (url: string, options?: DeepLinkOptions) => Promise<DeepLinkResult>;
  processCurrentUrl: (options?: DeepLinkOptions) => Promise<DeepLinkResult>;
  
  // Navigation
  navigateToProject: (projectId: string, options?: Partial<DeepLinkParams>) => void;
  navigateToCanvas: (projectId: string, canvasId: string, options?: Partial<DeepLinkParams>) => void;
  navigateToProjectView: (projectId: string, view: string, options?: Partial<DeepLinkParams>) => void;
  
  // URL generation
  generateUrl: (params: DeepLinkParams) => string;
  generateShareableLink: (params: DeepLinkParams) => string;
  
  // State management
  clearError: () => void;
  retry: () => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  invalidateProject: (projectId: string) => void;
  invalidateCanvas: (projectId: string, canvasId: string) => void;
  
  // Recent links management
  clearRecentLinks: () => void;
  removeRecentLink: (url: string) => void;
}

// Combined context interface
interface DeepLinkContextType extends DeepLinkContextState, DeepLinkContextActions {}

// Context creation
const DeepLinkContext = createContext<DeepLinkContextType | undefined>(undefined);

// Provider props
interface DeepLinkProviderProps {
  children: ReactNode;
  maxRecentLinks?: number;
  autoProcessOnNavigation?: boolean;
  defaultOptions?: DeepLinkOptions;
  onDeepLinkSuccess?: (result: DeepLinkResult) => void;
  onDeepLinkError?: (error: string) => void;
}

// Provider component
export const DeepLinkProvider: React.FC<DeepLinkProviderProps> = ({
  children,
  maxRecentLinks = 10,
  autoProcessOnNavigation = true,
  defaultOptions = {},
  onDeepLinkSuccess,
  onDeepLinkError
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentProject } = useProjects();
  const { setCurrentCanvas } = useProjectCanvas();
  
  const [state, setState] = useState<DeepLinkContextState>({
    currentUrl: '',
    currentParams: null,
    currentResult: null,
    isProcessing: false,
    isLoading: false,
    error: null,
    cacheStats: { size: 0, keys: [] },
    recentLinks: []
  });

  const processingRef = useRef<boolean>(false);
  const lastProcessedUrl = useRef<string>('');

  // Update cache stats
  const updateCacheStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      cacheStats: deepLinkService.getCacheStats()
    }));
  }, []);

  // Add to recent links
  const addToRecentLinks = useCallback((url: string, params: DeepLinkParams, success: boolean) => {
    setState(prev => {
      const newLink = {
        url,
        params,
        timestamp: Date.now(),
        success
      };
      
      const updatedLinks = [newLink, ...prev.recentLinks.filter(link => link.url !== url)];
      
      return {
        ...prev,
        recentLinks: updatedLinks.slice(0, maxRecentLinks)
      };
    });
  }, [maxRecentLinks]);

  // Process deep link
  const processDeepLink = useCallback(async (
    url: string, 
    options: DeepLinkOptions = {}
  ): Promise<DeepLinkResult> => {
    if (processingRef.current) {
      return state.currentResult || { success: false, error: 'Already processing' };
    }

    processingRef.current = true;
    
    setState(prev => ({
      ...prev,
      isProcessing: true,
      isLoading: true,
      error: null,
      currentUrl: url
    }));

    try {
      const result = await deepLinkService.processDeepLink(url, {
        ...defaultOptions,
        ...options
      });

      // Parse params from URL
      const params = deepLinkService.constructor.prototype.parseUrl(url);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        isLoading: false,
        currentResult: result,
        currentParams: params
      }));

      // Add to recent links
      addToRecentLinks(url, params, result.success);

      // Update cache stats
      updateCacheStats();

      if (result.success) {
        onDeepLinkSuccess?.(result);
      } else {
        onDeepLinkError?.(result.error || 'Unknown error');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process deep link';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        isLoading: false,
        error: errorMessage
      }));

      onDeepLinkError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      processingRef.current = false;
    }
  }, [defaultOptions, onDeepLinkSuccess, onDeepLinkError, state.currentResult, addToRecentLinks, updateCacheStats]);

  // Process current URL
  const processCurrentUrl = useCallback(async (options: DeepLinkOptions = {}): Promise<DeepLinkResult> => {
    const currentUrl = window.location.href;
    return processDeepLink(currentUrl, options);
  }, [processDeepLink]);

  // Process specific URL
  const processUrl = useCallback(async (url: string, options: DeepLinkOptions = {}): Promise<DeepLinkResult> => {
    return processDeepLink(url, options);
  }, [processDeepLink]);

  // Navigation helpers
  const navigateToProject = useCallback((projectId: string, options: Partial<DeepLinkParams> = {}) => {
    const params: DeepLinkParams = {
      projectId,
      view: 'dashboard',
      ...options
    };
    
    const url = `/projects/${projectId}`;
    navigate(url);
  }, [navigate]);

  const navigateToCanvas = useCallback((projectId: string, canvasId: string, options: Partial<DeepLinkParams> = {}) => {
    const params: DeepLinkParams = {
      projectId,
      canvasId,
      view: 'canvas',
      ...options
    };
    
    const url = `/projects/${projectId}/canvases/${canvasId}`;
    navigate(url);
  }, [navigate]);

  const navigateToProjectView = useCallback((projectId: string, view: string, options: Partial<DeepLinkParams> = {}) => {
    const params: DeepLinkParams = {
      projectId,
      view: view as DeepLinkParams['view'],
      ...options
    };
    
    const url = `/projects/${projectId}/${view}`;
    navigate(url);
  }, [navigate]);

  // URL generation
  const generateUrl = useCallback((params: DeepLinkParams): string => {
    return deepLinkService.constructor.prototype.generateUrl(params);
  }, []);

  const generateShareableLink = useCallback((params: DeepLinkParams): string => {
    return deepLinkService.constructor.prototype.generateUrl(params);
  }, []);

  // State management
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    if (lastProcessedUrl.current) {
      await processDeepLink(lastProcessedUrl.current);
    }
  }, [processDeepLink]);

  // Cache management
  const clearCache = useCallback(() => {
    deepLinkService.clearCache();
    updateCacheStats();
  }, [updateCacheStats]);

  const invalidateProject = useCallback((projectId: string) => {
    deepLinkService.invalidateProject(projectId);
    updateCacheStats();
  }, [updateCacheStats]);

  const invalidateCanvas = useCallback((projectId: string, canvasId: string) => {
    deepLinkService.invalidateCanvas(projectId, canvasId);
    updateCacheStats();
  }, [updateCacheStats]);

  // Recent links management
  const clearRecentLinks = useCallback(() => {
    setState(prev => ({ ...prev, recentLinks: [] }));
  }, []);

  const removeRecentLink = useCallback((url: string) => {
    setState(prev => ({
      ...prev,
      recentLinks: prev.recentLinks.filter(link => link.url !== url)
    }));
  }, []);

  // Auto-process on location change
  useEffect(() => {
    if (!autoProcessOnNavigation || !user) return;

    const currentUrl = window.location.href;
    if (currentUrl === lastProcessedUrl.current) return;

    lastProcessedUrl.current = currentUrl;
    processCurrentUrl();
  }, [location.pathname, location.search, autoProcessOnNavigation, user, processCurrentUrl]);

  // Handle successful deep link processing
  useEffect(() => {
    if (!state.currentResult?.success || !user) return;

    const { project, canvas } = state.currentResult;

    // Set current project if loaded
    if (project && setCurrentProject) {
      setCurrentProject(project.id);
    }

    // Set current canvas if loaded
    if (canvas && setCurrentCanvas) {
      setCurrentCanvas(project.id, canvas.id);
    }
  }, [state.currentResult, user, setCurrentProject, setCurrentCanvas]);

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  // Context value
  const contextValue = useMemo(() => ({
    ...state,
    processUrl,
    processCurrentUrl,
    navigateToProject,
    navigateToCanvas,
    navigateToProjectView,
    generateUrl,
    generateShareableLink,
    clearError,
    retry,
    clearCache,
    invalidateProject,
    invalidateCanvas,
    clearRecentLinks,
    removeRecentLink
  }), [
    state,
    processUrl,
    processCurrentUrl,
    navigateToProject,
    navigateToCanvas,
    navigateToProjectView,
    generateUrl,
    generateShareableLink,
    clearError,
    retry,
    clearCache,
    invalidateProject,
    invalidateCanvas,
    clearRecentLinks,
    removeRecentLink
  ]);

  return (
    <DeepLinkContext.Provider value={contextValue}>
      {children}
    </DeepLinkContext.Provider>
  );
};

// Hook to use deep link context
export const useDeepLinkContext = (): DeepLinkContextType => {
  const context = useContext(DeepLinkContext);
  if (context === undefined) {
    throw new Error('useDeepLinkContext must be used within a DeepLinkProvider');
  }
  return context;
};

// Convenience hooks
export const useProjectDeepLink = (projectId?: string) => {
  const deepLink = useDeepLinkContext();

  const navigateToProject = useCallback((options: Partial<DeepLinkParams> = {}) => {
    if (!projectId) return;
    deepLink.navigateToProject(projectId, options);
  }, [projectId, deepLink]);

  const navigateToProjectView = useCallback((view: string, options: Partial<DeepLinkParams> = {}) => {
    if (!projectId) return;
    deepLink.navigateToProjectView(projectId, view, options);
  }, [projectId, deepLink]);

  const generateProjectUrl = useCallback((options: Partial<DeepLinkParams> = {}) => {
    if (!projectId) return '';
    return deepLink.generateUrl({
      projectId,
      view: 'dashboard',
      ...options
    });
  }, [projectId, deepLink]);

  return {
    ...deepLink,
    navigateToProject,
    navigateToProjectView,
    generateProjectUrl
  };
};

export const useCanvasDeepLink = (projectId?: string, canvasId?: string) => {
  const deepLink = useDeepLinkContext();

  const navigateToCanvas = useCallback((options: Partial<DeepLinkParams> = {}) => {
    if (!projectId || !canvasId) return;
    deepLink.navigateToCanvas(projectId, canvasId, options);
  }, [projectId, canvasId, deepLink]);

  const generateCanvasUrl = useCallback((options: Partial<DeepLinkParams> = {}) => {
    if (!projectId || !canvasId) return '';
    return deepLink.generateUrl({
      projectId,
      canvasId,
      view: 'canvas',
      ...options
    });
  }, [projectId, canvasId, deepLink]);

  return {
    ...deepLink,
    navigateToCanvas,
    generateCanvasUrl
  };
};

export default DeepLinkProvider;
