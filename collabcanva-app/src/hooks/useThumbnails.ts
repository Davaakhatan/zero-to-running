// React hook for thumbnail generation and management
// Integrates thumbnail service with project and canvas data

import { useState, useCallback, useEffect, useRef } from 'react';
import { useProjectData } from './useProjectData';
// TEMPORARILY DISABLED FOR FRONTEND DEMO
// import { thumbnailService, ThumbnailError, ThumbnailResult, ThumbnailOptions } from '../services/thumbnailService';
import { Shape } from '../types';
import { ProjectCanvas } from '../types';

// Mock types for frontend demo
type ThumbnailError = Error;
type ThumbnailResult = { success: boolean; thumbnailUrl?: string; error?: string };
type ThumbnailOptions = { width?: number; height?: number; quality?: number };

// Mock thumbnail service for frontend demo
const thumbnailService = {
  getCacheStats: () => ({ size: 0, entries: [] }),
  generateThumbnail: async (canvasId: string, options?: ThumbnailOptions): Promise<ThumbnailResult> => {
    console.log('Mock: Generate thumbnail for canvas', canvasId, options);
    return { success: true, thumbnailUrl: null };
  },
  getThumbnail: async (canvasId: string): Promise<string | null> => {
    console.log('Mock: Get thumbnail for canvas', canvasId);
    return null;
  },
  deleteThumbnail: async (canvasId: string): Promise<void> => {
    console.log('Mock: Delete thumbnail for canvas', canvasId);
  },
  generateProjectThumbnail: async (projectId: string, shapes: any[], canvasInfo: any, options?: ThumbnailOptions): Promise<ThumbnailResult> => {
    return { success: true, thumbnailUrl: `mock-project-${projectId}.png` };
  },
  generateCanvasThumbnail: async (canvasId: string, shapes: any[], canvasInfo: any, options?: ThumbnailOptions): Promise<ThumbnailResult> => {
    return { success: true, thumbnailUrl: `mock-canvas-${canvasId}.png` };
  },
  generatePlaceholderThumbnail: async (type: 'project' | 'canvas', options?: ThumbnailOptions): Promise<ThumbnailResult> => {
    return { success: true, thumbnailUrl: `mock-${type}-placeholder.png` };
  },
  clearCache: () => {}
};

// Thumbnail state interface
interface ThumbnailState {
  // Project thumbnails
  projectThumbnails: Map<string, ThumbnailResult>;
  projectThumbnailsLoading: Set<string>;
  projectThumbnailsError: Map<string, string>;
  
  // Canvas thumbnails
  canvasThumbnails: Map<string, ThumbnailResult>;
  canvasThumbnailsLoading: Set<string>;
  canvasThumbnailsError: Map<string, string>;
  
  // Generation queue
  generationQueue: string[];
  isGenerating: boolean;
  
  // Cache stats
  cacheStats: { size: number; entries: string[] };
}

// Hook return interface
interface UseThumbnailsReturn {
  // State
  state: ThumbnailState;
  
  // Project thumbnails
  getProjectThumbnail: (projectId: string) => ThumbnailResult | null;
  generateProjectThumbnail: (projectId: string, shapes: Shape[], canvasInfo: any, options?: ThumbnailOptions) => Promise<ThumbnailResult>;
  isProjectThumbnailLoading: (projectId: string) => boolean;
  getProjectThumbnailError: (projectId: string) => string | null;
  
  // Canvas thumbnails
  getCanvasThumbnail: (canvasId: string) => ThumbnailResult | null;
  generateCanvasThumbnail: (canvasId: string, shapes: Shape[], canvasInfo: any, options?: ThumbnailOptions) => Promise<ThumbnailResult>;
  isCanvasThumbnailLoading: (canvasId: string) => boolean;
  getCanvasThumbnailError: (canvasId: string) => string | null;
  
  // Batch operations
  generateAllProjectThumbnails: (projectIds: string[]) => Promise<void>;
  generateAllCanvasThumbnails: (canvasIds: string[]) => Promise<void>;
  
  // Placeholder thumbnails
  generatePlaceholderThumbnail: (type: 'project' | 'canvas', options?: ThumbnailOptions) => Promise<ThumbnailResult>;
  
  // Cache management
  clearThumbnailCache: () => void;
  invalidateThumbnail: (id: string, type: 'project' | 'canvas') => void;
  refreshThumbnail: (id: string, type: 'project' | 'canvas') => Promise<void>;
  
  // Utility functions
  getThumbnailDataUrl: (id: string, type: 'project' | 'canvas') => string | null;
  downloadThumbnail: (id: string, type: 'project' | 'canvas', filename?: string) => void;
  getThumbnailSize: (id: string, type: 'project' | 'canvas') => number | null;
}

export const useThumbnails = (): UseThumbnailsReturn => {
  const { currentProject, currentProjectCanvases } = useProjectData();
  const [state, setState] = useState<ThumbnailState>({
    projectThumbnails: new Map(),
    projectThumbnailsLoading: new Set(),
    projectThumbnailsError: new Map(),
    canvasThumbnails: new Map(),
    canvasThumbnailsLoading: new Set(),
    canvasThumbnailsError: new Map(),
    generationQueue: [],
    isGenerating: false,
    cacheStats: { size: 0, entries: [] }
  });

  const generationQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  // Update cache stats
  const updateCacheStats = useCallback(() => {
    const stats = thumbnailService.getCacheStats();
    setState(prev => ({
      ...prev,
      cacheStats: stats
    }));
  }, []);

  // Process generation queue
  const processGenerationQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || generationQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    setState(prev => ({ ...prev, isGenerating: true }));

    while (generationQueueRef.current.length > 0) {
      const item = generationQueueRef.current.shift();
      if (item) {
        const [type, id] = item.split(':');
        
        try {
          if (type === 'project') {
            // Generate project thumbnail
            // This would need to be implemented based on your data structure
            console.log(`Generating thumbnail for project: ${id}`);
          } else if (type === 'canvas') {
            // Generate canvas thumbnail
            console.log(`Generating thumbnail for canvas: ${id}`);
          }
        } catch (error) {
          console.error(`Failed to generate thumbnail for ${type}:${id}`, error);
        }
      }
    }

    isProcessingQueueRef.current = false;
    setState(prev => ({ ...prev, isGenerating: false }));
  }, []);

  // Get project thumbnail
  const getProjectThumbnail = useCallback((projectId: string): ThumbnailResult | null => {
    return state.projectThumbnails.get(projectId) || null;
  }, [state.projectThumbnails]);

  // Generate project thumbnail
  const generateProjectThumbnail = useCallback(async (
    projectId: string,
    shapes: Shape[],
    canvasInfo: { width: number; height: number; backgroundColor?: string },
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> => {
    try {
      // Set loading state
      setState(prev => ({
        ...prev,
        projectThumbnailsLoading: new Set([...prev.projectThumbnailsLoading, projectId]),
        projectThumbnailsError: new Map([...prev.projectThumbnailsError].filter(([key]) => key !== projectId))
      }));

      const result = await thumbnailService.generateProjectThumbnail(
        projectId,
        shapes,
        canvasInfo,
        options
      );

      // Update state with result
      setState(prev => ({
        ...prev,
        projectThumbnails: new Map([...prev.projectThumbnails, [projectId, result]]),
        projectThumbnailsLoading: new Set([...prev.projectThumbnailsLoading].filter(id => id !== projectId))
      }));

      updateCacheStats();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate project thumbnail';

      setState(prev => ({
        ...prev,
        projectThumbnailsLoading: new Set([...prev.projectThumbnailsLoading].filter(id => id !== projectId)),
        projectThumbnailsError: new Map([...prev.projectThumbnailsError, [projectId, errorMessage]])
      }));

      throw error;
    }
  }, [updateCacheStats]);

  // Check if project thumbnail is loading
  const isProjectThumbnailLoading = useCallback((projectId: string): boolean => {
    return state.projectThumbnailsLoading.has(projectId);
  }, [state.projectThumbnailsLoading]);

  // Get project thumbnail error
  const getProjectThumbnailError = useCallback((projectId: string): string | null => {
    return state.projectThumbnailsError.get(projectId) || null;
  }, [state.projectThumbnailsError]);

  // Get canvas thumbnail
  const getCanvasThumbnail = useCallback((canvasId: string): ThumbnailResult | null => {
    return state.canvasThumbnails.get(canvasId) || null;
  }, [state.canvasThumbnails]);

  // Generate canvas thumbnail
  const generateCanvasThumbnail = useCallback(async (
    canvasId: string,
    shapes: Shape[],
    canvasInfo: { width: number; height: number; backgroundColor?: string },
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> => {
    try {
      // Set loading state
      setState(prev => ({
        ...prev,
        canvasThumbnailsLoading: new Set([...prev.canvasThumbnailsLoading, canvasId]),
        canvasThumbnailsError: new Map([...prev.canvasThumbnailsError].filter(([key]) => key !== canvasId))
      }));

      const result = await thumbnailService.generateCanvasThumbnail(
        canvasId,
        shapes,
        canvasInfo,
        options
      );

      // Update state with result
      setState(prev => ({
        ...prev,
        canvasThumbnails: new Map([...prev.canvasThumbnails, [canvasId, result]]),
        canvasThumbnailsLoading: new Set([...prev.canvasThumbnailsLoading].filter(id => id !== canvasId))
      }));

      updateCacheStats();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate canvas thumbnail';

      setState(prev => ({
        ...prev,
        canvasThumbnailsLoading: new Set([...prev.canvasThumbnailsLoading].filter(id => id !== canvasId)),
        canvasThumbnailsError: new Map([...prev.canvasThumbnailsError, [canvasId, errorMessage]])
      }));

      throw error;
    }
  }, [updateCacheStats]);

  // Check if canvas thumbnail is loading
  const isCanvasThumbnailLoading = useCallback((canvasId: string): boolean => {
    return state.canvasThumbnailsLoading.has(canvasId);
  }, [state.canvasThumbnailsLoading]);

  // Get canvas thumbnail error
  const getCanvasThumbnailError = useCallback((canvasId: string): string | null => {
    return state.canvasThumbnailsError.get(canvasId) || null;
  }, [state.canvasThumbnailsError]);

  // Generate all project thumbnails
  const generateAllProjectThumbnails = useCallback(async (projectIds: string[]): Promise<void> => {
    const promises = projectIds.map(async (projectId) => {
      try {
        // This would need to fetch shapes and canvas info for each project
        // For now, we'll generate placeholder thumbnails
        const result = await thumbnailService.generatePlaceholderThumbnail('project');
        
        setState(prev => ({
          ...prev,
          projectThumbnails: new Map([...prev.projectThumbnails, [projectId, result]])
        }));
      } catch (error) {
        console.error(`Failed to generate thumbnail for project ${projectId}:`, error);
      }
    });

    await Promise.allSettled(promises);
    updateCacheStats();
  }, [updateCacheStats]);

  // Generate all canvas thumbnails
  const generateAllCanvasThumbnails = useCallback(async (canvasIds: string[]): Promise<void> => {
    const promises = canvasIds.map(async (canvasId) => {
      try {
        // This would need to fetch shapes and canvas info for each canvas
        // For now, we'll generate placeholder thumbnails
        const result = await thumbnailService.generatePlaceholderThumbnail('canvas');
        
        setState(prev => ({
          ...prev,
          canvasThumbnails: new Map([...prev.canvasThumbnails, [canvasId, result]])
        }));
      } catch (error) {
        console.error(`Failed to generate thumbnail for canvas ${canvasId}:`, error);
      }
    });

    await Promise.allSettled(promises);
    updateCacheStats();
  }, [updateCacheStats]);

  // Generate placeholder thumbnail
  const generatePlaceholderThumbnail = useCallback(async (
    type: 'project' | 'canvas',
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> => {
    try {
      const result = await thumbnailService.generatePlaceholderThumbnail(type, options);
      updateCacheStats();
      return result;
    } catch (error) {
      throw error instanceof Error ? error : new Error(
        'Failed to generate placeholder thumbnail'
      );
    }
  }, [updateCacheStats]);

  // Clear thumbnail cache
  const clearThumbnailCache = useCallback(() => {
    thumbnailService.clearCache();
    setState(prev => ({
      ...prev,
      projectThumbnails: new Map(),
      canvasThumbnails: new Map(),
      projectThumbnailsError: new Map(),
      canvasThumbnailsError: new Map()
    }));
    updateCacheStats();
  }, [updateCacheStats]);

  // Invalidate thumbnail
  const invalidateThumbnail = useCallback((id: string, type: 'project' | 'canvas'): void => {
    if (type === 'project') {
      setState(prev => ({
        ...prev,
        projectThumbnails: new Map([...prev.projectThumbnails].filter(([key]) => key !== id)),
        projectThumbnailsError: new Map([...prev.projectThumbnailsError].filter(([key]) => key !== id))
      }));
    } else {
      setState(prev => ({
        ...prev,
        canvasThumbnails: new Map([...prev.canvasThumbnails].filter(([key]) => key !== id)),
        canvasThumbnailsError: new Map([...prev.canvasThumbnailsError].filter(([key]) => key !== id))
      }));
    }
  }, []);

  // Refresh thumbnail
  const refreshThumbnail = useCallback(async (id: string, type: 'project' | 'canvas'): Promise<void> => {
    invalidateThumbnail(id, type);
    
    try {
      if (type === 'project') {
        // This would need to fetch shapes and canvas info for the project
        const result = await thumbnailService.generatePlaceholderThumbnail('project');
        setState(prev => ({
          ...prev,
          projectThumbnails: new Map([...prev.projectThumbnails, [id, result]])
        }));
      } else {
        // This would need to fetch shapes and canvas info for the canvas
        const result = await thumbnailService.generatePlaceholderThumbnail('canvas');
        setState(prev => ({
          ...prev,
          canvasThumbnails: new Map([...prev.canvasThumbnails, [id, result]])
        }));
      }
      updateCacheStats();
    } catch (error) {
      console.error(`Failed to refresh thumbnail for ${type}:${id}`, error);
    }
  }, [invalidateThumbnail, updateCacheStats]);

  // Get thumbnail data URL
  const getThumbnailDataUrl = useCallback((id: string, type: 'project' | 'canvas'): string | null => {
    const thumbnail = type === 'project' 
      ? state.projectThumbnails.get(id)
      : state.canvasThumbnails.get(id);
    
    return thumbnail?.thumbnailUrl || null;
  }, [state.projectThumbnails, state.canvasThumbnails]);

  // Download thumbnail
  const downloadThumbnail = useCallback((
    id: string, 
    type: 'project' | 'canvas', 
    filename?: string
  ): void => {
    const thumbnail = type === 'project' 
      ? state.projectThumbnails.get(id)
      : state.canvasThumbnails.get(id);
    
    if (!thumbnail) {
      console.error(`Thumbnail not found for ${type}:${id}`);
      return;
    }

    const link = document.createElement('a');
    link.href = thumbnail.thumbnailUrl || '';
    link.download = filename || `${type}_${id}_thumbnail.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.projectThumbnails, state.canvasThumbnails]);

  // Get thumbnail size
  const getThumbnailSize = useCallback((id: string, type: 'project' | 'canvas'): number | null => {
    const thumbnail = type === 'project' 
      ? state.projectThumbnails.get(id)
      : state.canvasThumbnails.get(id);
    
    return thumbnail ? 0 : null; // Mock size for demo
  }, [state.projectThumbnails, state.canvasThumbnails]);

  // Auto-generate thumbnails for current project canvases
  useEffect(() => {
    if (currentProjectCanvases.length > 0) {
      const canvasIds = currentProjectCanvases.map(canvas => canvas.id);
      generateAllCanvasThumbnails(canvasIds);
    }
  }, [currentProjectCanvases, generateAllCanvasThumbnails]);

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  return {
    state,
    getProjectThumbnail,
    generateProjectThumbnail,
    isProjectThumbnailLoading,
    getProjectThumbnailError,
    getCanvasThumbnail,
    generateCanvasThumbnail,
    isCanvasThumbnailLoading,
    getCanvasThumbnailError,
    generateAllProjectThumbnails,
    generateAllCanvasThumbnails,
    generatePlaceholderThumbnail,
    clearThumbnailCache,
    invalidateThumbnail,
    refreshThumbnail,
    getThumbnailDataUrl,
    downloadThumbnail,
    getThumbnailSize
  };
};
