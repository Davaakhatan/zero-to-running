// Unit tests for thumbnailService
// Tests thumbnail generation, caching, and error handling

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { thumbnailService, ThumbnailError, THUMBNAIL_CONFIG } from './thumbnailService';
import { Shape } from '../types';

// Mock Konva
const mockKonvaStage = {
  width: vi.fn(() => 1920),
  height: vi.fn(() => 1080),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock-data'),
  find: vi.fn(() => []),
  destroy: vi.fn()
};

const mockKonvaLayer = {
  add: vi.fn()
};

const mockKonvaShape = {
  clone: vi.fn(() => ({
    scaleX: vi.fn(),
    scaleY: vi.fn(),
    x: vi.fn(),
    y: vi.fn()
  }))
};

vi.mock('konva', () => ({
  default: {
    Stage: vi.fn(() => mockKonvaStage),
    Layer: vi.fn(() => mockKonvaLayer),
    Rect: vi.fn(() => mockKonvaShape),
    Circle: vi.fn(() => mockKonvaShape),
    Ellipse: vi.fn(() => mockKonvaShape),
    RegularPolygon: vi.fn(() => mockKonvaShape),
    Text: vi.fn(() => mockKonvaShape),
    Star: vi.fn(() => mockKonvaShape)
  }
}));

// Mock HTML5 Canvas
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn()
  })),
  toBlob: vi.fn((callback) => {
    const blob = new Blob(['mock-image-data'], { type: 'image/png' });
    callback(blob);
  })
};

const mockImage = {
  width: 0,
  height: 0,
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: ''
};

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName) => {
    if (tagName === 'canvas') return mockCanvas;
    if (tagName === 'div') return { appendChild: vi.fn() };
    return {};
  })
});

Object.defineProperty(window, 'Image', {
  value: vi.fn(() => mockImage)
});

Object.defineProperty(global, 'btoa', {
  value: vi.fn((str) => Buffer.from(str).toString('base64'))
});

describe('ThumbnailService', () => {
  const mockProjectId = 'project123';
  const mockCanvasId = 'canvas123';
  
  const mockShapes: Shape[] = [
    {
      id: 'shape1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: 1,
      lockedBy: null,
      lockedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user123'
    },
    {
      id: 'shape2',
      type: 'circle',
      x: 300,
      y: 200,
      width: 100,
      height: 100,
      fill: '#ef4444',
      stroke: '#dc2626',
      strokeWidth: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: 2,
      lockedBy: null,
      lockedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user123'
    }
  ];

  const mockCanvasInfo = {
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    thumbnailService.clearCache();
    
    // Reset mock implementations
    mockKonvaStage.toDataURL.mockReturnValue('data:image/png;base64,mock-data');
    mockKonvaStage.find.mockReturnValue([]);
    mockCanvas.toBlob.mockImplementation((callback) => {
      const blob = new Blob(['mock-image-data'], { type: 'image/png' });
      callback(blob);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateProjectThumbnail', () => {
    it('should generate project thumbnail successfully', async () => {
      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      expect(result).toMatchObject({
        dataUrl: expect.stringContaining('data:image/png;base64,'),
        blob: expect.any(Blob),
        width: THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.width,
        height: THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.height,
        format: 'png',
        generatedAt: expect.any(Number)
      });

      expect(result.size).toBeGreaterThan(0);
    });

    it('should use cached thumbnail on subsequent calls', async () => {
      // First call
      const result1 = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      // Second call should use cache
      const result2 = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      expect(result1.dataUrl).toBe(result2.dataUrl);
      expect(result1.generatedAt).toBe(result2.generatedAt);
    });

    it('should handle custom options', async () => {
      const customOptions = {
        width: 400,
        height: 300,
        quality: 0.9,
        backgroundColor: '#f0f0f0',
        includeBorder: false,
        format: 'jpeg' as const
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo,
        customOptions
      );

      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
      expect(result.format).toBe('jpeg');
    });

    it('should limit shapes for performance', async () => {
      const manyShapes = Array.from({ length: 200 }, (_, i) => ({
        ...mockShapes[0],
        id: `shape${i}`,
        x: i * 10,
        y: i * 10
      }));

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        manyShapes,
        mockCanvasInfo,
        { maxShapes: 50 }
      );

      expect(result).toBeDefined();
      // Should not throw error even with many shapes
    });

    it('should throw ThumbnailError on failure', async () => {
      mockKonvaStage.toDataURL.mockImplementation(() => {
        throw new Error('Konva error');
      });

      await expect(
        thumbnailService.generateProjectThumbnail(
          mockProjectId,
          mockShapes,
          mockCanvasInfo
        )
      ).rejects.toThrow(ThumbnailError);
    });

    it('should prevent concurrent generation of same thumbnail', async () => {
      const promise1 = thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      const promise2 = thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      await expect(promise2).rejects.toThrow(ThumbnailError);
      await expect(promise1).resolves.toBeDefined();
    });
  });

  describe('generateCanvasThumbnail', () => {
    it('should generate canvas thumbnail successfully', async () => {
      const result = await thumbnailService.generateCanvasThumbnail(
        mockCanvasId,
        mockShapes,
        mockCanvasInfo
      );

      expect(result).toMatchObject({
        dataUrl: expect.stringContaining('data:image/png;base64,'),
        blob: expect.any(Blob),
        width: THUMBNAIL_CONFIG.CANVAS_THUMBNAIL.width,
        height: THUMBNAIL_CONFIG.CANVAS_THUMBNAIL.height,
        format: 'png',
        generatedAt: expect.any(Number)
      });
    });

    it('should use cached thumbnail on subsequent calls', async () => {
      // First call
      const result1 = await thumbnailService.generateCanvasThumbnail(
        mockCanvasId,
        mockShapes,
        mockCanvasInfo
      );

      // Second call should use cache
      const result2 = await thumbnailService.generateCanvasThumbnail(
        mockCanvasId,
        mockShapes,
        mockCanvasInfo
      );

      expect(result1.dataUrl).toBe(result2.dataUrl);
    });
  });

  describe('generateFromKonvaStage', () => {
    it('should generate thumbnail from Konva stage', async () => {
      const result = await thumbnailService.generateFromKonvaStage(
        mockKonvaStage as any,
        { width: 400, height: 300 }
      );

      expect(result).toMatchObject({
        dataUrl: expect.stringContaining('data:image/png;base64,'),
        blob: expect.any(Blob),
        width: 400,
        height: 300,
        format: 'png'
      });
    });

    it('should handle stage with shapes', async () => {
      const mockShape = {
        clone: vi.fn(() => ({
          scaleX: vi.fn(),
          scaleY: vi.fn(),
          x: vi.fn(),
          y: vi.fn()
        }))
      };

      mockKonvaStage.find.mockReturnValue([mockShape]);

      const result = await thumbnailService.generateFromKonvaStage(
        mockKonvaStage as any
      );

      expect(result).toBeDefined();
      expect(mockShape.clone).toHaveBeenCalled();
    });

    it('should throw ThumbnailError on failure', async () => {
      mockKonvaStage.toDataURL.mockImplementation(() => {
        throw new Error('Stage error');
      });

      await expect(
        thumbnailService.generateFromKonvaStage(mockKonvaStage as any)
      ).rejects.toThrow(ThumbnailError);
    });
  });

  describe('generatePlaceholderThumbnail', () => {
    it('should generate project placeholder thumbnail', async () => {
      const result = await thumbnailService.generatePlaceholderThumbnail('project');

      expect(result).toMatchObject({
        dataUrl: expect.stringContaining('data:image/png;base64,'),
        blob: expect.any(Blob),
        width: THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.width,
        height: THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.height,
        format: 'png'
      });
    });

    it('should generate canvas placeholder thumbnail', async () => {
      const result = await thumbnailService.generatePlaceholderThumbnail('canvas');

      expect(result).toMatchObject({
        dataUrl: expect.stringContaining('data:image/png;base64,'),
        blob: expect.any(Blob),
        width: THUMBNAIL_CONFIG.CANVAS_THUMBNAIL.width,
        height: THUMBNAIL_CONFIG.CANVAS_THUMBNAIL.height,
        format: 'png'
      });
    });

    it('should handle custom options for placeholder', async () => {
      const customOptions = {
        width: 500,
        height: 400,
        format: 'jpeg' as const
      };

      const result = await thumbnailService.generatePlaceholderThumbnail(
        'project',
        customOptions
      );

      expect(result.width).toBe(500);
      expect(result.height).toBe(400);
      expect(result.format).toBe('jpeg');
    });

    it('should throw ThumbnailError on failure', async () => {
      mockKonvaStage.toDataURL.mockImplementation(() => {
        throw new Error('Placeholder error');
      });

      await expect(
        thumbnailService.generatePlaceholderThumbnail('project')
      ).rejects.toThrow(ThumbnailError);
    });
  });

  describe('Shape Creation', () => {
    it('should create rectangle shape', async () => {
      const rectangleShape: Shape = {
        ...mockShapes[0],
        type: 'rectangle'
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [rectangleShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
    });

    it('should create circle shape', async () => {
      const circleShape: Shape = {
        ...mockShapes[0],
        type: 'circle'
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [circleShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
    });

    it('should create ellipse shape', async () => {
      const ellipseShape: Shape = {
        ...mockShapes[0],
        type: 'ellipse'
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [ellipseShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
    });

    it('should create triangle shape', async () => {
      const triangleShape: Shape = {
        ...mockShapes[0],
        type: 'triangle'
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [triangleShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
    });

    it('should create text shape', async () => {
      const textShape: Shape = {
        ...mockShapes[0],
        type: 'text',
        text: 'Hello World',
        fontSize: 24,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [textShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
    });

    it('should create star shape', async () => {
      const starShape: Shape = {
        ...mockShapes[0],
        type: 'star'
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [starShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
    });

    it('should handle unsupported shape types', async () => {
      const unsupportedShape: Shape = {
        ...mockShapes[0],
        type: 'unsupported' as any
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [unsupportedShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
      // Should not throw error, just skip unsupported shapes
    });

    it('should handle image shapes with placeholder', async () => {
      const imageShape: Shape = {
        ...mockShapes[0],
        type: 'image'
      };

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        [imageShape],
        mockCanvasInfo
      );

      expect(result).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      thumbnailService.clearCache();
      const stats = thumbnailService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', async () => {
      await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      const stats = thumbnailService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.entries).toContain(expect.stringContaining('project_'));
    });

    it('should invalidate cache after TTL', async () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Generate thumbnail
      await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      // Fast forward time beyond TTL
      mockTime += THUMBNAIL_CONFIG.PROJECT_THUMBNAIL.quality * 1000 + 1000;

      // Generate again - should not use cache
      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        mockShapes,
        mockCanvasInfo
      );

      expect(result).toBeDefined();

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      // Mock a slow operation
      mockKonvaStage.toDataURL.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('data:image/png;base64,mock'), 15000);
        });
      });

      await expect(
        thumbnailService.generateProjectThumbnail(
          mockProjectId,
          mockShapes,
          mockCanvasInfo
        )
      ).rejects.toThrow(ThumbnailError);
    });

    it('should handle blob conversion errors', async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null);
      });

      await expect(
        thumbnailService.generateProjectThumbnail(
          mockProjectId,
          mockShapes,
          mockCanvasInfo
        )
      ).rejects.toThrow();
    });

    it('should handle image loading errors', async () => {
      // Mock image loading error
      const originalImage = window.Image;
      window.Image = vi.fn(() => ({
        ...mockImage,
        onerror: null,
        onload: null,
        src: ''
      })) as any;

      // Trigger error
      const img = new window.Image();
      if (img.onerror) {
        img.onerror();
      }

      await expect(
        thumbnailService.generateProjectThumbnail(
          mockProjectId,
          mockShapes,
          mockCanvasInfo
        )
      ).rejects.toThrow();

      // Restore original Image
      window.Image = originalImage;
    });
  });

  describe('Performance', () => {
    it('should handle large number of shapes efficiently', async () => {
      const manyShapes = Array.from({ length: 1000 }, (_, i) => ({
        ...mockShapes[0],
        id: `shape${i}`,
        x: i * 2,
        y: i * 2
      }));

      const startTime = Date.now();
      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        manyShapes,
        mockCanvasInfo
      );
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should limit memory usage with large shapes', async () => {
      const largeShapes = Array.from({ length: 100 }, (_, i) => ({
        ...mockShapes[0],
        id: `shape${i}`,
        width: 1000,
        height: 1000,
        x: i * 10,
        y: i * 10
      }));

      const result = await thumbnailService.generateProjectThumbnail(
        mockProjectId,
        largeShapes,
        mockCanvasInfo
      );

      expect(result).toBeDefined();
      expect(result.size).toBeLessThan(1000000); // Should be reasonable size
    });
  });
});
