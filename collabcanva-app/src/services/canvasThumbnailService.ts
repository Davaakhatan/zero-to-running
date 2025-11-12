// Enhanced canvas thumbnail service that integrates with the actual canvas system
// Provides real-time thumbnail generation from live canvas data

import { thumbnailService, ThumbnailResult, ThumbnailOptions, ThumbnailError } from './thumbnailService';
import { Shape } from '../types';
import { ProjectCanvas } from '../types';
import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { FIREBASE_STRUCTURE } from './firebaseProjectStructure';

// Canvas thumbnail generation options
export interface CanvasThumbnailOptions extends ThumbnailOptions {
  includeShapes?: boolean;
  maxShapes?: number;
  shapeTypes?: string[];
  excludeShapeTypes?: string[];
  includeBackground?: boolean;
  includeGrid?: boolean;
  gridSize?: number;
  gridColor?: string;
  includeBorders?: boolean;
  borderColor?: string;
  borderWidth?: number;
  forceRegenerate?: boolean;
}

// Thumbnail generation result with metadata
export interface CanvasThumbnailResult extends ThumbnailResult {
  canvasId: string;
  projectId: string;
  shapeCount: number;
  lastModified: number;
  generatedFrom: 'shapes' | 'konva' | 'placeholder';
}

// Thumbnail generation request
export interface ThumbnailGenerationRequest {
  canvasId: string;
  projectId: string;
  priority: 'low' | 'normal' | 'high';
  options?: CanvasThumbnailOptions;
  forceRegenerate?: boolean;
}

class CanvasThumbnailService {
  private generationQueue: ThumbnailGenerationRequest[] = [];
  private isProcessingQueue = false;
  private activeGenerations = new Set<string>();
  private thumbnailCache = new Map<string, CanvasThumbnailResult>();

  /**
   * Generate thumbnail for a specific canvas
   */
  async generateCanvasThumbnail(
    canvasId: string,
    projectId: string,
    options: CanvasThumbnailOptions = {}
  ): Promise<CanvasThumbnailResult> {
    const cacheKey = `${projectId}_${canvasId}`;
    
    // Check if already generating
    if (this.activeGenerations.has(cacheKey)) {
      throw new ThumbnailError(
        'Thumbnail generation already in progress for this canvas',
        'GENERATION_IN_PROGRESS'
      );
    }

    // Check cache first (unless force regenerate)
    if (!options.forceRegenerate) {
      const cached = this.thumbnailCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }
    }

    this.activeGenerations.add(cacheKey);

    try {
      // Fetch canvas data
      const canvasData = await this.fetchCanvasData(canvasId, projectId);
      
      if (!canvasData) {
        throw new ThumbnailError(
          'Canvas not found',
          'CANVAS_NOT_FOUND'
        );
      }

      // Generate thumbnail based on available data
      let result: CanvasThumbnailResult;

      if (canvasData.shapes && canvasData.shapes.length > 0) {
        // Generate from shapes data
        result = await this.generateFromShapes(
          canvasId,
          projectId,
          canvasData.shapes,
          canvasData.canvas,
          options
        );
      } else {
        // Generate placeholder
        result = await this.generatePlaceholder(
          canvasId,
          projectId,
          canvasData.canvas,
          options
        );
      }

      // Cache the result
      this.thumbnailCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new ThumbnailError(
        `Failed to generate canvas thumbnail: ${error instanceof Error ? error.message : String(error)}`,
        'CANVAS_THUMBNAIL_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.activeGenerations.delete(cacheKey);
    }
  }

  /**
   * Generate thumbnail from Konva stage (real-time)
   */
  async generateFromKonvaStage(
    stage: any, // Konva.Stage
    canvasId: string,
    projectId: string,
    options: CanvasThumbnailOptions = {}
  ): Promise<CanvasThumbnailResult> {
    const cacheKey = `${projectId}_${canvasId}`;
    
    try {
      // Generate thumbnail using the base service
      const baseResult = await thumbnailService.generateFromKonvaStage(stage, options);
      
      // Count shapes
      const shapeCount = stage.find('Shape').length;
      
      const result: CanvasThumbnailResult = {
        ...baseResult,
        canvasId,
        projectId,
        shapeCount,
        lastModified: Date.now(),
        generatedFrom: 'konva'
      };

      // Cache the result
      this.thumbnailCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new ThumbnailError(
        `Failed to generate thumbnail from Konva stage: ${error instanceof Error ? error.message : String(error)}`,
        'KONVA_THUMBNAIL_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generate thumbnail from shapes data
   */
  private async generateFromShapes(
    canvasId: string,
    projectId: string,
    shapes: Shape[],
    canvas: ProjectCanvas,
    options: CanvasThumbnailOptions
  ): Promise<CanvasThumbnailResult> {
    const {
      includeShapes = true,
      maxShapes = 100,
      shapeTypes,
      excludeShapeTypes = ['path'], // Exclude complex shapes by default
      includeBackground = true,
      includeGrid = false,
      gridSize = 20,
      gridColor = '#e5e7eb',
      includeBorders = true,
      borderColor = '#d1d5db',
      borderWidth = 1,
      ...baseOptions
    } = options;

    // Filter shapes
    let filteredShapes = shapes;
    
    if (includeShapes) {
      // Apply shape type filters
      if (shapeTypes && shapeTypes.length > 0) {
        filteredShapes = filteredShapes.filter(shape => shapeTypes.includes(shape.type));
      }
      
      if (excludeShapeTypes && excludeShapeTypes.length > 0) {
        filteredShapes = filteredShapes.filter(shape => !excludeShapeTypes.includes(shape.type));
      }
      
      // Limit shapes for performance
      filteredShapes = filteredShapes.slice(0, maxShapes);
    } else {
      filteredShapes = [];
    }

    // Prepare canvas info
    const canvasInfo = {
      width: canvas.width,
      height: canvas.height,
      backgroundColor: includeBackground ? canvas.backgroundColor : undefined
    };

    // Generate base thumbnail
    const baseResult = await thumbnailService.generateCanvasThumbnail(
      canvasId,
      filteredShapes,
      canvasInfo,
      {
        ...baseOptions,
        backgroundColor: includeBackground ? canvas.backgroundColor : '#ffffff',
        includeBorder: includeBorders
      }
    );

    // Add custom enhancements if needed
    let enhancedDataUrl = baseResult.dataUrl;
    
    if (includeGrid) {
      enhancedDataUrl = await this.addGridToThumbnail(
        baseResult.dataUrl,
        canvas.width,
        canvas.height,
        gridSize,
        gridColor
      );
    }

    return {
      ...baseResult,
      dataUrl: enhancedDataUrl,
      canvasId,
      projectId,
      shapeCount: filteredShapes.length,
      lastModified: Date.now(),
      generatedFrom: 'shapes'
    };
  }

  /**
   * Generate placeholder thumbnail
   */
  private async generatePlaceholder(
    canvasId: string,
    projectId: string,
    canvas: ProjectCanvas,
    options: CanvasThumbnailOptions
  ): Promise<CanvasThumbnailResult> {
    const baseResult = await thumbnailService.generatePlaceholderThumbnail('canvas', options);
    
    return {
      ...baseResult,
      canvasId,
      projectId,
      shapeCount: 0,
      lastModified: Date.now(),
      generatedFrom: 'placeholder'
    };
  }

  /**
   * Fetch canvas data from Firebase
   */
  private async fetchCanvasData(canvasId: string, projectId: string): Promise<{
    canvas: ProjectCanvas;
    shapes: Shape[];
  } | null> {
    try {
      // Fetch canvas info
      const canvasRef = doc(db, 'projects', projectId, 'canvases', canvasId);
      const canvasSnap = await getDoc(canvasRef);
      
      if (!canvasSnap.exists()) {
        return null;
      }
      
      const canvas = { id: canvasSnap.id, ...canvasSnap.data() } as ProjectCanvas;
      
      // Fetch shapes
      const shapesRef = collection(db, 'projects', projectId, 'canvases', canvasId, 'shapes');
      const shapesQuery = query(
        shapesRef,
        orderBy('createdAt', 'asc'),
        limit(1000) // Limit for performance
      );
      
      const shapesSnap = await getDocs(shapesQuery);
      const shapes = shapesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shape[];
      
      return { canvas, shapes };
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
      return null;
    }
  }

  /**
   * Add grid to thumbnail
   */
  private async addGridToThumbnail(
    dataUrl: string,
    width: number,
    height: number,
    gridSize: number,
    gridColor: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image
          ctx?.drawImage(img, 0, 0);
          
          if (ctx) {
            // Draw grid
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.3;
            
            // Vertical lines
            for (let x = 0; x <= width; x += gridSize) {
              const scaledX = (x / width) * img.width;
              ctx.beginPath();
              ctx.moveTo(scaledX, 0);
              ctx.lineTo(scaledX, img.height);
              ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y <= height; y += gridSize) {
              const scaledY = (y / height) * img.height;
              ctx.beginPath();
              ctx.moveTo(0, scaledY);
              ctx.lineTo(img.width, scaledY);
              ctx.stroke();
            }
          }
          
          resolve(canvas.toDataURL());
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for grid overlay'));
        };
        
        img.src = dataUrl;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Queue thumbnail generation
   */
  queueThumbnailGeneration(request: ThumbnailGenerationRequest): void {
    // Remove existing request for same canvas
    this.generationQueue = this.generationQueue.filter(
      req => !(req.canvasId === request.canvasId && req.projectId === request.projectId)
    );
    
    // Add new request
    this.generationQueue.push(request);
    
    // Sort by priority
    this.generationQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processGenerationQueue();
    }
  }

  /**
   * Process generation queue
   */
  private async processGenerationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.generationQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.generationQueue.length > 0) {
      const request = this.generationQueue.shift();
      if (request) {
        try {
          await this.generateCanvasThumbnail(
            request.canvasId,
            request.projectId,
            request.options
          );
        } catch (error) {
          console.error(`Failed to generate thumbnail for canvas ${request.canvasId}:`, error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: CanvasThumbnailResult): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - entry.generatedAt < maxAge;
  }

  /**
   * Get cached thumbnail
   */
  getCachedThumbnail(canvasId: string, projectId: string): CanvasThumbnailResult | null {
    const cacheKey = `${projectId}_${canvasId}`;
    const cached = this.thumbnailCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }
    
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.thumbnailCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[]; queueLength: number } {
    return {
      size: this.thumbnailCache.size,
      entries: Array.from(this.thumbnailCache.keys()),
      queueLength: this.generationQueue.length
    };
  }

  /**
   * Generate thumbnails for multiple canvases
   */
  async generateMultipleThumbnails(
    requests: ThumbnailGenerationRequest[]
  ): Promise<CanvasThumbnailResult[]> {
    const results: CanvasThumbnailResult[] = [];
    
    // Process high priority requests immediately
    const highPriorityRequests = requests.filter(req => req.priority === 'high');
    const otherRequests = requests.filter(req => req.priority !== 'high');
    
    // Process high priority requests
    for (const request of highPriorityRequests) {
      try {
        const result = await this.generateCanvasThumbnail(
          request.canvasId,
          request.projectId,
          request.options
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate high priority thumbnail for ${request.canvasId}:`, error);
      }
    }
    
    // Queue other requests
    for (const request of otherRequests) {
      this.queueThumbnailGeneration(request);
    }
    
    return results;
  }
}

// Export singleton instance
export const canvasThumbnailService = new CanvasThumbnailService();

// Types are already exported as interfaces above
