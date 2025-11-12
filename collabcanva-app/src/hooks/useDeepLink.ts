// React hook for deep linking functionality
// Provides deep link processing, navigation, and state management

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useProjectCanvas } from '../contexts/ProjectCanvasContext';
import { deepLinkService, DeepLinkParams, DeepLinkResult, DeepLinkOptions } from '../services/deepLinkService';

// Hook state interface
interface DeepLinkState {
  isLoading: boolean;
  error: string | null;
  result: DeepLinkResult | null;
  params: DeepLinkParams | null;
  isProcessing: boolean;
}

// Hook return interface
interface UseDeepLinkReturn extends DeepLinkState {
  // Deep link processing
  processCurrentUrl: (options?: DeepLinkOptions) => Promise<DeepLinkResult>;
  processUrl: (url: string, options?: DeepLinkOptions) => Promise<DeepLinkResult>;
  
  // Navigation helpers
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
}

// Hook options
interface UseDeepLinkOptions {
  autoProcess?: boolean;
  processOnMount?: boolean;
  processOnLocationChange?: boolean;
  defaultOptions?: DeepLinkOptions;
  onSuccess?: (result: DeepLinkResult) => void;
  onError?: (error: string) => void;
}

export const useDeepLink = (options: UseDeepLinkOptions = {}): UseDeepLinkReturn => {
  const {
    autoProcess = true,
    processOnMount = true,
    processOnLocationChange = true,
    defaultOptions = {},
    onSuccess,
    onError
  } = options;

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentProject } = useProjects();
  const { setCurrentCanvas } = useProjectCanvas();
  
  const [state, setState] = useState<DeepLinkState>({
    isLoading: false,
    error: null,
    result: null,
    params: null,
    isProcessing: false
  });

  const processingRef = useRef<boolean>(false);
  const lastProcessedUrl = useRef<string>('');

  // Process deep link
  const processDeepLink = useCallback(async (
    url: string, 
    options: DeepLinkOptions = {}
  ): Promise<DeepLinkResult> => {
    if (processingRef.current) {
      return state.result || { success: false, error: 'Already processing' };
    }

    processingRef.current = true;
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isProcessing: true
    }));

    try {
      const result = await deepLinkService.processDeepLink(url, {
        ...defaultOptions,
        ...options
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        result,
        isProcessing: false
      }));

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.error || 'Unknown error');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process deep link';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isProcessing: false
      }));

      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      processingRef.current = false;
    }
  }, [defaultOptions, onSuccess, onError, state.result]);

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
    
    const url = deepLinkService.constructor.name === 'DeepLinkService' 
      ? `/projects/${projectId}`
      : deepLinkService.constructor.prototype.generateUrl(params);
    
    navigate(url);
  }, [navigate]);

  const navigateToCanvas = useCallback((projectId: string, canvasId: string, options: Partial<DeepLinkParams> = {}) => {
    const params: DeepLinkParams = {
      projectId,
      canvasId,
      view: 'canvas',
      ...options
    };
    
    const url = deepLinkService.constructor.name === 'DeepLinkService'
      ? `/projects/${projectId}/canvases/${canvasId}`
      : deepLinkService.constructor.prototype.generateUrl(params);
    
    navigate(url);
  }, [navigate]);

  const navigateToProjectView = useCallback((projectId: string, view: string, options: Partial<DeepLinkParams> = {}) => {
    const params: DeepLinkParams = {
      projectId,
      view: view as DeepLinkParams['view'],
      ...options
    };
    
    const url = deepLinkService.constructor.name === 'DeepLinkService'
      ? `/projects/${projectId}/${view}`
      : deepLinkService.constructor.prototype.generateUrl(params);
    
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
  }, []);

  const invalidateProject = useCallback((projectId: string) => {
    deepLinkService.invalidateProject(projectId);
  }, []);

  const invalidateCanvas = useCallback((projectId: string, canvasId: string) => {
    deepLinkService.invalidateCanvas(projectId, canvasId);
  }, []);

  // Auto-process on location change
  useEffect(() => {
    if (!autoProcess || !processOnLocationChange || !user) return;

    const currentUrl = window.location.href;
    if (currentUrl === lastProcessedUrl.current) return;

    lastProcessedUrl.current = currentUrl;
    processCurrentUrl();
  }, [location.pathname, location.search, autoProcess, processOnLocationChange, user, processCurrentUrl]);

  // Auto-process on mount
  useEffect(() => {
    if (!autoProcess || !processOnMount || !user) return;

    const currentUrl = window.location.href;
    if (currentUrl === lastProcessedUrl.current) return;

    lastProcessedUrl.current = currentUrl;
    processCurrentUrl();
  }, [autoProcess, processOnMount, user, processCurrentUrl]);

  // Handle successful deep link processing
  useEffect(() => {
    if (!state.result?.success || !user) return;

    const { project, canvas } = state.result;

    // Set current project if loaded
    if (project && setCurrentProject) {
      setCurrentProject(project.id);
    }

    // Set current canvas if loaded
    if (canvas && setCurrentCanvas) {
      setCurrentCanvas(project.id, canvas.id);
    }
  }, [state.result, user, setCurrentProject, setCurrentCanvas]);

  return {
    ...state,
    processCurrentUrl,
    processUrl,
    navigateToProject,
    navigateToCanvas,
    navigateToProjectView,
    generateUrl,
    generateShareableLink,
    clearError,
    retry,
    clearCache,
    invalidateProject,
    invalidateCanvas
  };
};

// Convenience hook for project deep linking
export const useProjectDeepLink = (projectId?: string) => {
  const deepLink = useDeepLink({
    autoProcess: false,
    processOnMount: false,
    processOnLocationChange: false
  });

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

// Convenience hook for canvas deep linking
export const useCanvasDeepLink = (projectId?: string, canvasId?: string) => {
  const deepLink = useDeepLink({
    autoProcess: false,
    processOnMount: false,
    processOnLocationChange: false
  });

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

export default useDeepLink;
