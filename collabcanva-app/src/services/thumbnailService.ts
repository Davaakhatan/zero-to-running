// Thumbnail generation service for projects and canvases
// Generates thumbnails from canvas content using Konva and HTML5 Canvas

import Konva from 'konva';
import { Shape } from '../types';
import { ProjectCanvas } from '../types';

// Thumbnail configuration
export const THUMBNAIL_CONFIG = {
  // Thumbnail dimensions
  PROJECT_THUMBNAIL: {
    width: 300,
    height: 200,
    quality: 0.8
  },
  CANVAS_THUMBNAIL: {
    width: 200,
    height: 150,
    quality: 0.8
  },
  
  // Generation settings
  MAX_SHAPES: 100, // Limit shapes for performance
  BACKGROUND_COLOR: '#ffffff',
  BORDER_COLOR: '#e5e7eb',
  BORDER_WIDTH: 1,
  
  // Performance settings
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Thumbnail generation options
export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
  includeBorder?: boolean;
  maxShapes?: number;
  format?: 'png' | 'jpeg' | 'webp';
}

// Thumbnail result
export interface ThumbnailResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  size: number; // bytes
  format: string;
  generatedAt: number;
}

// Error types
export class ThumbnailError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ThumbnailError';
  }
}

class ThumbnailService {
  private cache = new Map<string, ThumbnailResult>();
  private generationQueue = new Set<string>();

  /**
   * Generate project thumbnail from canvas shapes
   */
  async generateProjectThumbnail(
    projectId: string,
    shapes: Shape[],
    canvasInfo: { width: number; height: number; backgroundColor?: string },
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const cacheKey = `project_${projectId}_${this.getShapesHash(shapes)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Check if already generating
    if (this.generationQueue.has(cacheKey)) {
      throw new ThumbnailError(
        'Thumbnail generation already in progress',
        'GENERATION_IN_PROGRESS'
      );
    }

    this.generationQueue.add(cacheKey);

    try {
      const result = await this.generateThumbnail(
        shapes,
        canvasInfo,
        {
          ...THUMBNAIL_CONFIG.PROJECT_THUMBNAIL,
          ...options
        }
      );

      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new ThumbnailError(
        'Failed to generate project thumbnail',
        'PROJECT_THUMBNAIL_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.generationQueue.delete(cacheKey);
    }
  }

  /**
   * Generate canvas thumbnail from shapes
   */
  async generateCanvasThumbnail(
    canvasId: string,
    shapes: Shape[],
    canvasInfo: { width: number; height: number; backgroundColor?: string },
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const cacheKey = `canvas_${canvasId}_${this.getShapesHash(shapes)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Check if already generating
    if (this.generationQueue.has(cacheKey)) {
      throw new ThumbnailError(
        'Thumbnail generation already in progress',
        'GENERATION_IN_PROGRESS'
      );
    }

    this.generationQueue.add(cacheKey);

    try {
      const result = await this.generateThumbnail(
        shapes,
        canvasInfo,
        {
          ...THUMBNAIL_CONFIG.CANVAS_THUMBNAIL,
          ...options
        }
      );

      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new ThumbnailError(
        'Failed to generate canvas thumbnail',
        'CANVAS_THUMBNAIL_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.generationQueue.delete(cacheKey);
    }
  }

  /**
   * Generate thumbnail from Konva stage
   */
  async generateFromKonvaStage(
    stage: Konva.Stage,
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const {
      width = THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.width,
      height = THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.height,
      quality = THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.quality,
      format = 'png'
    } = options;

    try {
      // Get stage dimensions
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      
      // Calculate scale to fit thumbnail dimensions
      const scaleX = width / stageWidth;
      const scaleY = height / stageHeight;
      const scale = Math.min(scaleX, scaleY);

      // Create temporary stage for thumbnail
      const tempStage = new Konva.Stage({
        container: document.createElement('div'),
        width: width,
        height: height
      });

      // Create layer
      const layer = new Konva.Layer();
      tempStage.add(layer);

      // Clone and scale shapes
      const shapes = stage.find('Shape');
      shapes.forEach((shape) => {
        const cloned = shape.clone();
        cloned.scaleX(scale);
        cloned.scaleY(scale);
        cloned.x(cloned.x() * scale);
        cloned.y(cloned.y() * scale);
        layer.add(cloned);
      });

      // Generate data URL
      const dataUrl = tempStage.toDataURL({
        mimeType: `image/${format}`,
        quality: quality,
        pixelRatio: 1
      });

      // Convert to blob
      const blob = await this.dataUrlToBlob(dataUrl);

      // Clean up
      tempStage.destroy();

      return {
        dataUrl,
        blob,
        width,
        height,
        size: blob.size,
        format,
        generatedAt: Date.now()
      };
    } catch (error) {
      throw new ThumbnailError(
        'Failed to generate thumbnail from Konva stage',
        'KONVA_THUMBNAIL_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generate thumbnail from shapes data
   */
  private async generateThumbnail(
    shapes: Shape[],
    canvasInfo: { width: number; height: number; backgroundColor?: string },
    options: ThumbnailOptions
  ): Promise<ThumbnailResult> {
    const {
      width = THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.width,
      height = THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.height,
      quality = THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.quality,
      backgroundColor = THUMBNAIL_CONFIG.BACKGROUND_COLOR,
      includeBorder = true,
      maxShapes = THUMBNAIL_CONFIG.MAX_SHAPES,
      format = 'png'
    } = options;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new ThumbnailError('Thumbnail generation timeout', 'TIMEOUT'));
      }, THUMBNAIL_CONFIG.TIMEOUT);

      try {
        // Limit shapes for performance
        const limitedShapes = shapes.slice(0, maxShapes);

        // Create temporary stage
        const tempStage = new Konva.Stage({
          container: document.createElement('div'),
          width: width,
          height: height
        });

        const layer = new Konva.Layer();
        tempStage.add(layer);

        // Add background
        if (backgroundColor) {
          const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: width,
            height: height,
            fill: backgroundColor
          });
          layer.add(background);
        }

        // Add border
        if (includeBorder) {
          const border = new Konva.Rect({
            x: 0,
            y: 0,
            width: width,
            height: height,
            stroke: THUMBNAIL_CONFIG.BORDER_COLOR,
            strokeWidth: THUMBNAIL_CONFIG.BORDER_WIDTH,
            fill: undefined
          });
          layer.add(border);
        }

        // Calculate scale to fit canvas content
        const scaleX = width / canvasInfo.width;
        const scaleY = height / canvasInfo.height;
        const scale = Math.min(scaleX, scaleY);

        // Add shapes
        limitedShapes.forEach((shapeData) => {
          const shape = this.createKonvaShape(shapeData, scale);
          if (shape) {
            layer.add(shape);
          }
        });

        // Generate thumbnail
        const dataUrl = tempStage.toDataURL({
          mimeType: `image/${format}`,
          quality: quality,
          pixelRatio: 1
        });

        // Convert to blob
        this.dataUrlToBlob(dataUrl).then((blob) => {
          clearTimeout(timeout);
          
          // Clean up
          tempStage.destroy();

          resolve({
            dataUrl,
            blob,
            width,
            height,
            size: blob.size,
            format,
            generatedAt: Date.now()
          });
        }).catch((error) => {
          clearTimeout(timeout);
          tempStage.destroy();
          reject(error);
        });

      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Create Konva shape from shape data
   */
  private createKonvaShape(shapeData: Shape, scale: number): Konva.Shape | null {
    try {
      const scaledX = shapeData.x * scale;
      const scaledY = shapeData.y * scale;
      const scaledWidth = shapeData.width * scale;
      const scaledHeight = shapeData.height * scale;

      switch (shapeData.type) {
        case 'rectangle':
          return new Konva.Rect({
            x: scaledX,
            y: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: (shapeData.strokeWidth || 0) * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'circle':
          return new Konva.Circle({
            x: scaledX + scaledWidth / 2,
            y: scaledY + scaledHeight / 2,
            radius: Math.min(scaledWidth, scaledHeight) / 2,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: (shapeData.strokeWidth || 0) * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'ellipse':
          return new Konva.Ellipse({
            x: scaledX + scaledWidth / 2,
            y: scaledY + scaledHeight / 2,
            radiusX: scaledWidth / 2,
            radiusY: scaledHeight / 2,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: (shapeData.strokeWidth || 0) * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'triangle':
          return new Konva.RegularPolygon({
            x: scaledX + scaledWidth / 2,
            y: scaledY + scaledHeight / 2,
            sides: 3,
            radius: Math.min(scaledWidth, scaledHeight) / 2,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: (shapeData.strokeWidth || 0) * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'text':
          return new Konva.Text({
            x: scaledX,
            y: scaledY,
            text: shapeData.text || 'Text',
            fontSize: (shapeData.fontSize || 16) * scale,
            fontFamily: shapeData.fontFamily || 'Arial',
            fontStyle: shapeData.fontStyle || 'normal',
            fill: shapeData.fill || '#000000',
            width: scaledWidth,
            height: scaledHeight,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'star':
          return new Konva.Star({
            x: scaledX + scaledWidth / 2,
            y: scaledY + scaledHeight / 2,
            numPoints: 5,
            innerRadius: Math.min(scaledWidth, scaledHeight) / 4,
            outerRadius: Math.min(scaledWidth, scaledHeight) / 2,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: (shapeData.strokeWidth || 0) * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'polygon':
          // For polygon, we'll create a simple rectangle as fallback
          return new Konva.Rect({
            x: scaledX,
            y: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: (shapeData.strokeWidth || 0) * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'path':
          // For path, we'll create a simple rectangle as fallback
          return new Konva.Rect({
            x: scaledX,
            y: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: (shapeData.strokeWidth || 0) * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        case 'image':
          // For images, we'll create a placeholder rectangle
          return new Konva.Rect({
            x: scaledX,
            y: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fill: '#f3f4f6',
            stroke: '#d1d5db',
            strokeWidth: 1 * scale,
            rotation: shapeData.rotation || 0,
            scaleX: shapeData.scaleX || 1,
            scaleY: shapeData.scaleY || 1
          });

        default:
          console.warn(`Unsupported shape type for thumbnail: ${shapeData.type}`);
          return null;
      }
    } catch (error) {
      console.error('Error creating Konva shape:', error);
      return null;
    }
  }

  /**
   * Convert data URL to blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          });
        };

        img.onerror = () => {
          reject(new Error('Failed to load image from data URL'));
        };

        img.src = dataUrl;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate hash for shapes to detect changes
   */
  private getShapesHash(shapes: Shape[]): string {
    const shapeData = shapes.map(shape => ({
      type: shape.type,
      x: Math.round(shape.x),
      y: Math.round(shape.y),
      width: Math.round(shape.width),
      height: Math.round(shape.height),
      fill: shape.fill,
      stroke: shape.stroke,
      rotation: Math.round(shape.rotation || 0)
    }));

    return btoa(JSON.stringify(shapeData)).slice(0, 16);
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: ThumbnailResult): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - entry.generatedAt < maxAge;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate placeholder thumbnail
   */
  async generatePlaceholderThumbnail(
    type: 'project' | 'canvas',
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const {
      width = type === 'project' ? THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.width : THUMBNAIL_CONFIG.CANVAS_THUMBNAIL.width,
      height = type === 'project' ? THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.height : THUMBNAIL_CONFIG.CANVAS_THUMBNAIL.height,
      format = 'png'
    } = options;

    try {
      // Create temporary stage
      const tempStage = new Konva.Stage({
        container: document.createElement('div'),
        width: width,
        height: height
      });

      const layer = new Konva.Layer();
      tempStage.add(layer);

      // Add background
      const background = new Konva.Rect({
        x: 0,
        y: 0,
        width: width,
        height: height,
        fill: '#f9fafb',
        stroke: '#e5e7eb',
        strokeWidth: 1
      });
      layer.add(background);

      // Add placeholder icon
      const iconSize = Math.min(width, height) * 0.3;
      const icon = new Konva.Text({
        x: width / 2 - iconSize / 2,
        y: height / 2 - iconSize / 2,
        text: type === 'project' ? '📁' : '🎨',
        fontSize: iconSize,
        fill: '#9ca3af'
      });
      layer.add(icon);

      // Generate data URL
      const dataUrl = tempStage.toDataURL({
        mimeType: `image/${format}`,
        quality: 0.8,
        pixelRatio: 1
      });

      // Convert to blob
      const blob = await this.dataUrlToBlob(dataUrl);

      // Clean up
      tempStage.destroy();

      return {
        dataUrl,
        blob,
        width,
        height,
        size: blob.size,
        format,
        generatedAt: Date.now()
      };
    } catch (error) {
      throw new ThumbnailError(
        'Failed to generate placeholder thumbnail',
        'PLACEHOLDER_THUMBNAIL_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Export singleton instance
export const thumbnailService = new ThumbnailService();

// Error class is already exported above
