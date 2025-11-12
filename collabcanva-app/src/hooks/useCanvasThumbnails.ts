// Enhanced React hook for canvas thumbnail generation and management
// Integrates with the canvas thumbnail service for real-time thumbnail generation

import { useState, useCallback, useEffect, useRef } from 'react';
import { useProjectData } from './useProjectData';
import { 
  canvasThumbnailService, 
  CanvasThumbnailResult, 
  CanvasThumbnailOptions, 
  ThumbnailGenerationRequest 
} from '../services/canvasThumbnailService';
import { ThumbnailError } from '../services/thumbnailService';

// Thumbnail state interface
interface CanvasThumbnailState {
  thumbnails: Map<string, CanvasThumbnailResult>;
  loading: Set<string>;
  errors: Map<string, string>;
  generationQueue: string[];
  isProcessingQueue: boolean;
  cacheStats: { size: number; entries: string[]; queueLength: number };
}

// Hook return interface
interface UseCanvasThumbnailsReturn {
  // State
  state: CanvasThumbnailState;
  
  // Thumbnail operations
  getThumbnail: (canvasId: string, projectId: string) => CanvasThumbnailResult | null;
  generateThumbnail: (canvasId: string, projectId: string, options?: CanvasThumbnailOptions) => Promise<CanvasThumbnailResult>;
  generateFromKonvaStage: (stage: any, canvasId: string, projectId: string, options?: CanvasThumbnailOptions) => Promise<CanvasThumbnailResult>;
  queueThumbnailGeneration: (request: ThumbnailGenerationRequest) => void;
  
  // Status checks
  isThumbnailLoading: (canvasId: string, projectId: string) => boolean;
  getThumbnailError: (canvasId: string, projectId: string) => string | null;
  isInQueue: (canvasId: string, projectId: string) => boolean;
  
  // Batch operations
  generateMultipleThumbnails: (requests: ThumbnailGenerationRequest[]) => Promise<CanvasThumbnailResult[]>;
  generateAllProjectThumbnails: (projectId: string, options?: CanvasThumbnailOptions) => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  invalidateThumbnail: (canvasId: string, projectId: string) => void;
  refreshThumbnail: (canvasId: string, projectId: string, options?: CanvasThumbnailOptions) => Promise<void>;
  
  // Utility functions
  getThumbnailDataUrl: (canvasId: string, projectId: string) => string | null;
  downloadThumbnail: (canvasId: string, projectId: string, filename?: string) => void;
  getThumbnailSize: (canvasId: string, projectId: string) => number | null;
  getThumbnailMetadata: (canvasId: string, projectId: string) => {
    shapeCount: number;
    lastModified: number;
    generatedFrom: string;
  } | null;
}

export const useCanvasThumbnails = (): UseCanvasThumbnailsReturn => {
  const { currentProject, currentProjectCanvases } = useProjectData();
  const [state, setState] = useState<CanvasThumbnailState>({
    thumbnails: new Map(),
    loading: new Set(),
    errors: new Map(),
    generationQueue: [],
    isProcessingQueue: false,
    cacheStats: { size: 0, entries: [], queueLength: 0 }
  });

  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Update cache stats
  const updateCacheStats = useCallback(() => {
    const stats = canvasThumbnailService.getCacheStats();
    setState(prev => ({
      ...prev,
      cacheStats: stats
    }));
  }, []);

  // Get cache key
  const getCacheKey = useCallback((canvasId: string, projectId: string): string => {
    return `${projectId}_${canvasId}`;
  }, []);

  // Get thumbnail
  const getThumbnail = useCallback((canvasId: string, projectId: string): CanvasThumbnailResult | null => {
    const cacheKey = getCacheKey(canvasId, projectId);
    return state.thumbnails.get(cacheKey) || null;
  }, [state.thumbnails, getCacheKey]);

  // Generate thumbnail
  const generateThumbnail = useCallback(async (
    canvasId: string,
    projectId: string,
    options: CanvasThumbnailOptions = {}
  ): Promise<CanvasThumbnailResult> => {
    const cacheKey = getCacheKey(canvasId, projectId);
    
    try {
      // Set loading state
      setState(prev => ({
        ...prev,
        loading: new Set([...prev.loading, cacheKey]),
        errors: new Map([...prev.errors].filter(([key]) => key !== cacheKey))
      }));

      const result = await canvasThumbnailService.generateCanvasThumbnail(
        canvasId,
        projectId,
        options
      );

      // Update state with result
      setState(prev => ({
        ...prev,
        thumbnails: new Map([...prev.thumbnails, [cacheKey, result]]),
        loading: new Set([...prev.loading].filter(key => key !== cacheKey))
      }));

      updateCacheStats();
      return result;
    } catch (error) {
      const errorMessage = error instanceof ThumbnailError 
        ? error.message 
        : 'Failed to generate canvas thumbnail';

      setState(prev => ({
        ...prev,
        loading: new Set([...prev.loading].filter(key => key !== cacheKey)),
        errors: new Map([...prev.errors, [cacheKey, errorMessage]])
      }));

      throw error;
    }
  }, [getCacheKey, updateCacheStats]);

  // Generate from Konva stage
  const generateFromKonvaStage = useCallback(async (
    stage: any,
    canvasId: string,
    projectId: string,
    options: CanvasThumbnailOptions = {}
  ): Promise<CanvasThumbnailResult> => {
    const cacheKey = getCacheKey(canvasId, projectId);
    
    try {
      // Set loading state
      setState(prev => ({
        ...prev,
        loading: new Set([...prev.loading, cacheKey]),
        errors: new Map([...prev.errors].filter(([key]) => key !== cacheKey))
      }));

      const result = await canvasThumbnailService.generateFromKonvaStage(
        stage,
        canvasId,
        projectId,
        options
      );

      // Update state with result
      setState(prev => ({
        ...prev,
        thumbnails: new Map([...prev.thumbnails, [cacheKey, result]]),
        loading: new Set([...prev.loading].filter(key => key !== cacheKey))
      }));

      updateCacheStats();
      return result;
    } catch (error) {
      const errorMessage = error instanceof ThumbnailError 
        ? error.message 
        : 'Failed to generate thumbnail from Konva stage';

      setState(prev => ({
        ...prev,
        loading: new Set([...prev.loading].filter(key => key !== cacheKey)),
        errors: new Map([...prev.errors, [cacheKey, errorMessage]])
      }));

      throw error;
    }
  }, [getCacheKey, updateCacheStats]);

  // Queue thumbnail generation
  const queueThumbnailGeneration = useCallback((request: ThumbnailGenerationRequest): void => {
    const cacheKey = getCacheKey(request.canvasId, request.projectId);
    
    setState(prev => ({
      ...prev,
      generationQueue: [...prev.generationQueue, cacheKey]
    }));
    
    canvasThumbnailService.queueThumbnailGeneration(request);
  }, [getCacheKey]);

  // Check if thumbnail is loading
  const isThumbnailLoading = useCallback((canvasId: string, projectId: string): boolean => {
    const cacheKey = getCacheKey(canvasId, projectId);
    return state.loading.has(cacheKey);
  }, [state.loading, getCacheKey]);

  // Get thumbnail error
  const getThumbnailError = useCallback((canvasId: string, projectId: string): string | null => {
    const cacheKey = getCacheKey(canvasId, projectId);
    return state.errors.get(cacheKey) || null;
  }, [state.errors, getCacheKey]);

  // Check if thumbnail is in queue
  const isInQueue = useCallback((canvasId: string, projectId: string): boolean => {
    const cacheKey = getCacheKey(canvasId, projectId);
    return state.generationQueue.includes(cacheKey);
  }, [state.generationQueue, getCacheKey]);

  // Generate multiple thumbnails
  const generateMultipleThumbnails = useCallback(async (
    requests: ThumbnailGenerationRequest[]
  ): Promise<CanvasThumbnailResult[]> => {
    try {
      const results = await canvasThumbnailService.generateMultipleThumbnails(requests);
      
      // Update state with results
      setState(prev => {
        const newThumbnails = new Map(prev.thumbnails);
        const newLoading = new Set(prev.loading);
        const newErrors = new Map(prev.errors);
        
        results.forEach(result => {
          const cacheKey = getCacheKey(result.canvasId, result.projectId);
          newThumbnails.set(cacheKey, result);
          newLoading.delete(cacheKey);
          newErrors.delete(cacheKey);
        });
        
        return {
          ...prev,
          thumbnails: newThumbnails,
          loading: newLoading,
          errors: newErrors
        };
      });
      
      updateCacheStats();
      return results;
    } catch (error) {
      console.error('Failed to generate multiple thumbnails:', error);
      throw error;
    }
  }, [getCacheKey, updateCacheStats]);

  // Generate all project thumbnails
  const generateAllProjectThumbnails = useCallback(async (
    projectId: string,
    options: CanvasThumbnailOptions = {}
  ): Promise<void> => {
    if (!currentProjectCanvases || currentProjectCanvases.length === 0) {
      return;
    }
    
    const requests: ThumbnailGenerationRequest[] = currentProjectCanvases.map(canvas => ({
      canvasId: canvas.id,
      projectId,
      priority: 'normal',
      options
    }));
    
    try {
      await generateMultipleThumbnails(requests);
    } catch (error) {
      console.error('Failed to generate all project thumbnails:', error);
    }
  }, [currentProjectCanvases, generateMultipleThumbnails]);

  // Clear cache
  const clearCache = useCallback(() => {
    canvasThumbnailService.clearCache();
    setState(prev => ({
      ...prev,
      thumbnails: new Map(),
      errors: new Map(),
      generationQueue: []
    }));
    updateCacheStats();
  }, [updateCacheStats]);

  // Invalidate thumbnail
  const invalidateThumbnail = useCallback((canvasId: string, projectId: string): void => {
    const cacheKey = getCacheKey(canvasId, projectId);
    
    setState(prev => ({
      ...prev,
      thumbnails: new Map([...prev.thumbnails].filter(([key]) => key !== cacheKey)),
      errors: new Map([...prev.errors].filter(([key]) => key !== cacheKey)),
      generationQueue: prev.generationQueue.filter(key => key !== cacheKey)
    }));
  }, [getCacheKey]);

  // Refresh thumbnail
  const refreshThumbnail = useCallback(async (
    canvasId: string,
    projectId: string,
    options: CanvasThumbnailOptions = {}
  ): Promise<void> => {
    invalidateThumbnail(canvasId, projectId);
    
    try {
      await generateThumbnail(canvasId, projectId, { ...options, forceRegenerate: true });
    } catch (error) {
      console.error(`Failed to refresh thumbnail for canvas ${canvasId}:`, error);
    }
  }, [invalidateThumbnail, generateThumbnail]);

  // Get thumbnail data URL
  const getThumbnailDataUrl = useCallback((canvasId: string, projectId: string): string | null => {
    const thumbnail = getThumbnail(canvasId, projectId);
    return thumbnail?.dataUrl || null;
  }, [getThumbnail]);

  // Download thumbnail
  const downloadThumbnail = useCallback((
    canvasId: string,
    projectId: string,
    filename?: string
  ): void => {
    const thumbnail = getThumbnail(canvasId, projectId);
    
    if (!thumbnail) {
      console.error(`Thumbnail not found for canvas ${canvasId}`);
      return;
    }

    const link = document.createElement('a');
    link.href = thumbnail.dataUrl;
    link.download = filename || `canvas_${canvasId}_thumbnail.${thumbnail.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [getThumbnail]);

  // Get thumbnail size
  const getThumbnailSize = useCallback((canvasId: string, projectId: string): number | null => {
    const thumbnail = getThumbnail(canvasId, projectId);
    return thumbnail?.size || null;
  }, [getThumbnail]);

  // Get thumbnail metadata
  const getThumbnailMetadata = useCallback((canvasId: string, projectId: string): {
    shapeCount: number;
    lastModified: number;
    generatedFrom: string;
  } | null => {
    const thumbnail = getThumbnail(canvasId, projectId);
    
    if (!thumbnail) {
      return null;
    }
    
    return {
      shapeCount: thumbnail.shapeCount,
      lastModified: thumbnail.lastModified,
      generatedFrom: thumbnail.generatedFrom
    };
  }, [getThumbnail]);

  // Auto-generate thumbnails for current project canvases
  useEffect(() => {
    if (currentProject && currentProjectCanvases && currentProjectCanvases.length > 0) {
      // Queue thumbnail generation for all canvases
      const requests: ThumbnailGenerationRequest[] = currentProjectCanvases.map(canvas => ({
        canvasId: canvas.id,
        projectId: currentProject.id,
        priority: 'normal',
        options: {
          includeShapes: true,
          maxShapes: 50,
          includeBackground: true,
          includeBorders: true
        }
      }));
      
      requests.forEach(request => queueThumbnailGeneration(request));
    }
  }, [currentProject, currentProjectCanvases, queueThumbnailGeneration]);

  // Update cache stats periodically
  useEffect(() => {
    updateCacheStats();
    
    updateIntervalRef.current = setInterval(updateCacheStats, 30000); // Every 30 seconds
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [updateCacheStats]);

  return {
    state,
    getThumbnail,
    generateThumbnail,
    generateFromKonvaStage,
    queueThumbnailGeneration,
    isThumbnailLoading,
    getThumbnailError,
    isInQueue,
    generateMultipleThumbnails,
    generateAllProjectThumbnails,
    clearCache,
    invalidateThumbnail,
    refreshThumbnail,
    getThumbnailDataUrl,
    downloadThumbnail,
    getThumbnailSize,
    getThumbnailMetadata
  };
};
