// Deep linking service for direct project/canvas access
// Handles URL parsing, validation, and navigation for direct links

import { Project, ProjectCanvas } from '../types';
import { projectService } from './projectService';

// Deep link types
export interface DeepLinkParams {
  projectId?: string;
  canvasId?: string;
  view?: 'dashboard' | 'canvas' | 'settings' | 'members';
  tab?: string;
  query?: string;
  zoom?: number;
  pan?: { x: number; y: number };
  selection?: string[];
  mode?: 'edit' | 'view' | 'present';
}

export interface DeepLinkResult {
  success: boolean;
  project?: Project;
  canvas?: ProjectCanvas;
  error?: string;
  redirectPath?: string;
  metadata?: {
    title: string;
    description: string;
    thumbnail?: string;
  };
}

export interface DeepLinkOptions {
  validateAccess?: boolean;
  loadProject?: boolean;
  loadCanvas?: boolean;
  generateMetadata?: boolean;
  timeout?: number;
}

// URL parsing utilities
export class DeepLinkParser {
  /**
   * Parse deep link URL and extract parameters
   */
  static parseUrl(url: string): DeepLinkParams {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      const params: DeepLinkParams = {};
      
      // Parse path segments
      if (pathParts[0] === 'projects') {
        if (pathParts[1]) {
          params.projectId = pathParts[1];
        }
        
        if (pathParts[2] === 'canvases' && pathParts[3]) {
          params.canvasId = pathParts[3];
        }
        
        if (pathParts[2] && pathParts[2] !== 'canvases') {
          params.view = pathParts[2] as DeepLinkParams['view'];
        }
      }
      
      // Parse query parameters
      const searchParams = urlObj.searchParams;
      params.tab = searchParams.get('tab') || undefined;
      params.query = searchParams.get('q') || undefined;
      params.zoom = searchParams.get('zoom') ? parseFloat(searchParams.get('zoom')!) : undefined;
      params.mode = (searchParams.get('mode') as DeepLinkParams['mode']) || undefined;
      
      // Parse pan coordinates
      const panX = searchParams.get('panX');
      const panY = searchParams.get('panY');
      if (panX && panY) {
        params.pan = {
          x: parseFloat(panX),
          y: parseFloat(panY)
        };
      }
      
      // Parse selection
      const selection = searchParams.get('selection');
      if (selection) {
        params.selection = selection.split(',').filter(Boolean);
      }
      
      return params;
    } catch (error) {
      console.error('Failed to parse deep link URL:', error);
      return {};
    }
  }
  
  /**
   * Generate deep link URL from parameters
   */
  static generateUrl(params: DeepLinkParams, baseUrl = window.location.origin): string {
    try {
      const url = new URL(baseUrl);
      
      // Build path
      const pathParts = ['projects'];
      if (params.projectId) {
        pathParts.push(params.projectId);
      }
      
      if (params.canvasId) {
        pathParts.push('canvases', params.canvasId);
      } else if (params.view && params.view !== 'dashboard') {
        pathParts.push(params.view);
      }
      
      url.pathname = '/' + pathParts.join('/');
      
      // Add query parameters
      if (params.tab) {
        url.searchParams.set('tab', params.tab);
      }
      if (params.query) {
        url.searchParams.set('q', params.query);
      }
      if (params.zoom) {
        url.searchParams.set('zoom', params.zoom.toString());
      }
      if (params.mode) {
        url.searchParams.set('mode', params.mode);
      }
      if (params.pan) {
        url.searchParams.set('panX', params.pan.x.toString());
        url.searchParams.set('panY', params.pan.y.toString());
      }
      if (params.selection && params.selection.length > 0) {
        url.searchParams.set('selection', params.selection.join(','));
      }
      
      return url.toString();
    } catch (error) {
      console.error('Failed to generate deep link URL:', error);
      return baseUrl;
    }
  }
  
  /**
   * Validate deep link parameters
   */
  static validateParams(params: DeepLinkParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate project ID format
    if (params.projectId && !/^[a-zA-Z0-9-_]+$/.test(params.projectId)) {
      errors.push('Invalid project ID format');
    }
    
    // Validate canvas ID format
    if (params.canvasId && !/^[a-zA-Z0-9-_]+$/.test(params.canvasId)) {
      errors.push('Invalid canvas ID format');
    }
    
    // Validate view parameter
    if (params.view && !['dashboard', 'canvas', 'settings', 'members'].includes(params.view)) {
      errors.push('Invalid view parameter');
    }
    
    // Validate mode parameter
    if (params.mode && !['edit', 'view', 'present'].includes(params.mode)) {
      errors.push('Invalid mode parameter');
    }
    
    // Validate zoom level
    if (params.zoom && (params.zoom < 0.1 || params.zoom > 10)) {
      errors.push('Invalid zoom level (must be between 0.1 and 10)');
    }
    
    // Validate pan coordinates
    if (params.pan) {
      if (typeof params.pan.x !== 'number' || typeof params.pan.y !== 'number') {
        errors.push('Invalid pan coordinates');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Deep link service
export class DeepLinkService {
  private static instance: DeepLinkService;
  private cache = new Map<string, DeepLinkResult>();
  private loadingPromises = new Map<string, Promise<DeepLinkResult>>();
  
  static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }
  
  /**
   * Process deep link and return result
   */
  async processDeepLink(
    url: string, 
    options: DeepLinkOptions = {}
  ): Promise<DeepLinkResult> {
    const {
      validateAccess = true,
      loadProject = true,
      loadCanvas = true,
      generateMetadata = true,
      timeout = 10000
    } = options;
    
    // Parse URL
    const params = DeepLinkParser.parseUrl(url);
    
    // Validate parameters
    const validation = DeepLinkParser.validateParams(params);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid parameters: ${validation.errors.join(', ')}`
      };
    }
    
    // Check cache
    const cacheKey = this.getCacheKey(params);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }
    
    // Create loading promise
    const loadingPromise = this.loadDeepLinkData(params, {
      validateAccess,
      loadProject,
      loadCanvas,
      generateMetadata,
      timeout
    });
    
    this.loadingPromises.set(cacheKey, loadingPromise);
    
    try {
      const result = await loadingPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }
  
  /**
   * Load data for deep link
   */
  private async loadDeepLinkData(
    params: DeepLinkParams,
    options: DeepLinkOptions
  ): Promise<DeepLinkResult> {
    const { validateAccess, loadProject, loadCanvas, generateMetadata, timeout } = options;
    
    try {
      let project: Project | undefined;
      let canvas: ProjectCanvas | undefined;
      let error: string | undefined;
      
      // Load project if required
      if (params.projectId && loadProject) {
        try {
          project = await Promise.race([
            projectService.getProject(params.projectId),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
          
          if (!project) {
            return {
              success: false,
              error: 'Project not found'
            };
          }
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to load project'
          };
        }
      }
      
      // Load canvas if required
      if (params.canvasId && loadCanvas && project) {
        try {
          const canvases = await Promise.race([
            projectService.getProjectCanvases(project.id),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
          
          canvas = canvases.find(c => c.id === params.canvasId);
          
          if (!canvas) {
            return {
              success: false,
              error: 'Canvas not found',
              project
            };
          }
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to load canvas',
            project
          };
        }
      }
      
      // Generate metadata if required
      let metadata;
      if (generateMetadata && project) {
        metadata = {
          title: project.name,
          description: project.description || `Project: ${project.name}`,
          thumbnail: project.thumbnail
        };
      }
      
      return {
        success: true,
        project,
        canvas,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Generate cache key for parameters
   */
  private getCacheKey(params: DeepLinkParams): string {
    return JSON.stringify({
      projectId: params.projectId,
      canvasId: params.canvasId,
      view: params.view
    });
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
  
  /**
   * Invalidate cache for specific project
   */
  invalidateProject(projectId: string): void {
    for (const [key, result] of this.cache.entries()) {
      if (result.project?.id === projectId) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Invalidate cache for specific canvas
   */
  invalidateCanvas(projectId: string, canvasId: string): void {
    for (const [key, result] of this.cache.entries()) {
      if (result.project?.id === projectId && result.canvas?.id === canvasId) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const deepLinkService = DeepLinkService.getInstance();

// Utility functions
export const deepLinkUtils = {
  /**
   * Check if URL is a deep link
   */
  isDeepLink(url: string): boolean {
    const params = DeepLinkParser.parseUrl(url);
    return !!(params.projectId || params.canvasId);
  },
  
  /**
   * Get deep link type
   */
  getDeepLinkType(url: string): 'project' | 'canvas' | 'none' {
    const params = DeepLinkParser.parseUrl(url);
    if (params.canvasId) return 'canvas';
    if (params.projectId) return 'project';
    return 'none';
  },
  
  /**
   * Extract project ID from URL
   */
  getProjectIdFromUrl(url: string): string | null {
    const params = DeepLinkParser.parseUrl(url);
    return params.projectId || null;
  },
  
  /**
   * Extract canvas ID from URL
   */
  getCanvasIdFromUrl(url: string): string | null {
    const params = DeepLinkParser.parseUrl(url);
    return params.canvasId || null;
  },
  
  /**
   * Create shareable link
   */
  createShareableLink(params: DeepLinkParams): string {
    return DeepLinkParser.generateUrl(params);
  },
  
  /**
   * Create canvas shareable link
   */
  createCanvasShareLink(projectId: string, canvasId: string, options: Partial<DeepLinkParams> = {}): string {
    return DeepLinkParser.generateUrl({
      projectId,
      canvasId,
      view: 'canvas',
      ...options
    });
  },
  
  /**
   * Create project shareable link
   */
  createProjectShareLink(projectId: string, options: Partial<DeepLinkParams> = {}): string {
    return DeepLinkParser.generateUrl({
      projectId,
      view: 'dashboard',
      ...options
    });
  }
};

export default deepLinkService;
