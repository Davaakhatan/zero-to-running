// Unit tests for CanvasThumbnailService
// Tests for enhanced canvas thumbnail generation and caching

import { canvasThumbnailService, CanvasThumbnailOptions, ThumbnailGenerationRequest } from './canvasThumbnailService';
import { ThumbnailError } from './thumbnailService';
import { Shape } from '../types';
import { ProjectCanvas } from '../types';

// Mock dependencies
jest.mock('./thumbnailService');
jest.mock('../lib/firebase');
jest.mock('./firebaseProjectStructure');

// Mock Konva
const mockKonvaStage = {
  width: () => 1920,
  height: () => 1080,
  find: jest.fn(() => []),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-data-url')
};

// Mock Firebase
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockGetDocs = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  getDocs: mockGetDocs
}));

// Mock thumbnail service
const mockThumbnailService = {
  generateCanvasThumbnail: jest.fn(),
  generateFromKonvaStage: jest.fn(),
  generatePlaceholderThumbnail: jest.fn()
};

jest.mock('./thumbnailService', () => ({
  thumbnailService: mockThumbnailService,
  ThumbnailError: class ThumbnailError extends Error {
    constructor(message: string, public code: string, public originalError?: Error) {
      super(message);
      this.name = 'ThumbnailError';
    }
  }
}));

// Mock firebase project structure
const mockFirebaseProjectStructure = {
  getCanvasPath: jest.fn(() => 'projects/project1/canvases/canvas1'),
  getShapesCollectionPath: jest.fn(() => 'projects/project1/canvases/canvas1/shapes')
};

jest.mock('./firebaseProjectStructure', () => ({
  firebaseProjectStructure: mockFirebaseProjectStructure
}));

describe('CanvasThumbnailService', () => {
  const mockCanvas: ProjectCanvas = {
    id: 'canvas1',
    projectId: 'project1',
    name: 'Test Canvas',
    description: 'A test canvas',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1',
    isArchived: false,
    order: 0
  };

  const mockShapes: Shape[] = [
    {
      id: 'shape1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1'
    },
    {
      id: 'shape2',
      type: 'circle',
      x: 300,
      y: 200,
      width: 100,
      height: 100,
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1'
    }
  ];

  const mockThumbnailResult = {
    dataUrl: 'data:image/png;base64,mock-thumbnail-data',
    blob: new Blob(['mock-data'], { type: 'image/png' }),
    width: 200,
    height: 150,
    size: 1024,
    format: 'png',
    generatedAt: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockCanvas
    });
    
    mockGetDocs.mockResolvedValue({
      docs: mockShapes.map(shape => ({
        id: shape.id,
        data: () => shape
      }))
    });
    
    mockThumbnailService.generateCanvasThumbnail.mockResolvedValue(mockThumbnailResult);
    mockThumbnailService.generateFromKonvaStage.mockResolvedValue(mockThumbnailResult);
    mockThumbnailService.generatePlaceholderThumbnail.mockResolvedValue(mockThumbnailResult);
  });

  describe('generateCanvasThumbnail', () => {
    it('should generate thumbnail from shapes data', async () => {
      const result = await canvasThumbnailService.generateCanvasThumbnail(
        'canvas1',
        'project1',
        { includeShapes: true }
      );

      expect(result).toMatchObject({
        canvasId: 'canvas1',
        projectId: 'project1',
        shapeCount: 2,
        generatedFrom: 'shapes'
      });

      expect(mockThumbnailService.generateCanvasThumbnail).toHaveBeenCalledWith(
        'canvas1',
        mockShapes,
        {
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff'
        },
        expect.objectContaining({
          includeShapes: true
        })
      );
    });

    it('should generate placeholder when no shapes exist', async () => {
      mockGetDocs.mockResolvedValue({
        docs: []
      });

      const result = await canvasThumbnailService.generateCanvasThumbnail(
        'canvas1',
        'project1'
      );

      expect(result).toMatchObject({
        canvasId: 'canvas1',
        projectId: 'project1',
        shapeCount: 0,
        generatedFrom: 'placeholder'
      });

      expect(mockThumbnailService.generatePlaceholderThumbnail).toHaveBeenCalledWith(
        'canvas',
        expect.any(Object)
      );
    });

    it('should filter shapes based on options', async () => {
      const options: CanvasThumbnailOptions = {
        includeShapes: true,
        maxShapes: 1,
        shapeTypes: ['rectangle'],
        excludeShapeTypes: ['circle']
      };

      await canvasThumbnailService.generateCanvasThumbnail(
        'canvas1',
        'project1',
        options
      );

      expect(mockThumbnailService.generateCanvasThumbnail).toHaveBeenCalledWith(
        'canvas1',
        [mockShapes[0]], // Only rectangle shape
        expect.any(Object),
        expect.objectContaining(options)
      );
    });

    it('should throw error when canvas not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(
        canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1')
      ).rejects.toThrow(ThumbnailError);
    });

    it('should prevent concurrent generation for same canvas', async () => {
      const promise1 = canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1');
      const promise2 = canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1');

      await expect(promise2).rejects.toThrow('Thumbnail generation already in progress');
      await promise1; // Wait for first generation to complete
    });

    it('should use cached result when available', async () => {
      // Generate first thumbnail
      const result1 = await canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1');
      
      // Generate second thumbnail (should use cache)
      const result2 = await canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1');
      
      expect(result1).toBe(result2);
      expect(mockThumbnailService.generateCanvasThumbnail).toHaveBeenCalledTimes(1);
    });

    it('should force regenerate when forceRegenerate is true', async () => {
      // Generate first thumbnail
      await canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1');
      
      // Force regenerate
      await canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1', {
        forceRegenerate: true
      });
      
      expect(mockThumbnailService.generateCanvasThumbnail).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateFromKonvaStage', () => {
    it('should generate thumbnail from Konva stage', async () => {
      const result = await canvasThumbnailService.generateFromKonvaStage(
        mockKonvaStage,
        'canvas1',
        'project1'
      );

      expect(result).toMatchObject({
        canvasId: 'canvas1',
        projectId: 'project1',
        generatedFrom: 'konva'
      });

      expect(mockThumbnailService.generateFromKonvaStage).toHaveBeenCalledWith(
        mockKonvaStage,
        expect.any(Object)
      );
    });

    it('should count shapes from Konva stage', async () => {
      mockKonvaStage.find.mockReturnValue([
        { id: 'shape1' },
        { id: 'shape2' },
        { id: 'shape3' }
      ]);

      const result = await canvasThumbnailService.generateFromKonvaStage(
        mockKonvaStage,
        'canvas1',
        'project1'
      );

      expect(result.shapeCount).toBe(3);
    });
  });

  describe('queueThumbnailGeneration', () => {
    it('should queue thumbnail generation requests', () => {
      const request: ThumbnailGenerationRequest = {
        canvasId: 'canvas1',
        projectId: 'project1',
        priority: 'high',
        options: { includeShapes: true }
      };

      canvasThumbnailService.queueThumbnailGeneration(request);

      const stats = canvasThumbnailService.getCacheStats();
      expect(stats.queueLength).toBe(1);
    });

    it('should replace existing request for same canvas', () => {
      const request1: ThumbnailGenerationRequest = {
        canvasId: 'canvas1',
        projectId: 'project1',
        priority: 'low'
      };

      const request2: ThumbnailGenerationRequest = {
        canvasId: 'canvas1',
        projectId: 'project1',
        priority: 'high'
      };

      canvasThumbnailService.queueThumbnailGeneration(request1);
      canvasThumbnailService.queueThumbnailGeneration(request2);

      const stats = canvasThumbnailService.getCacheStats();
      expect(stats.queueLength).toBe(1);
    });

    it('should sort requests by priority', () => {
      const requests: ThumbnailGenerationRequest[] = [
        { canvasId: 'canvas1', projectId: 'project1', priority: 'low' },
        { canvasId: 'canvas2', projectId: 'project1', priority: 'high' },
        { canvasId: 'canvas3', projectId: 'project1', priority: 'normal' }
      ];

      requests.forEach(request => {
        canvasThumbnailService.queueThumbnailGeneration(request);
      });

      const stats = canvasThumbnailService.getCacheStats();
      expect(stats.queueLength).toBe(3);
    });
  });

  describe('generateMultipleThumbnails', () => {
    it('should generate multiple thumbnails', async () => {
      const requests: ThumbnailGenerationRequest[] = [
        { canvasId: 'canvas1', projectId: 'project1', priority: 'high' },
        { canvasId: 'canvas2', projectId: 'project1', priority: 'normal' }
      ];

      const results = await canvasThumbnailService.generateMultipleThumbnails(requests);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        canvasId: 'canvas1',
        projectId: 'project1'
      });
      expect(results[1]).toMatchObject({
        canvasId: 'canvas2',
        projectId: 'project1'
      });
    });

    it('should handle errors gracefully in batch generation', async () => {
      mockThumbnailService.generateCanvasThumbnail
        .mockResolvedValueOnce(mockThumbnailResult)
        .mockRejectedValueOnce(new Error('Generation failed'));

      const requests: ThumbnailGenerationRequest[] = [
        { canvasId: 'canvas1', projectId: 'project1', priority: 'high' },
        { canvasId: 'canvas2', projectId: 'project1', priority: 'high' }
      ];

      const results = await canvasThumbnailService.generateMultipleThumbnails(requests);

      expect(results).toHaveLength(1);
      expect(results[0].canvasId).toBe('canvas1');
    });
  });

  describe('cache management', () => {
    it('should cache generated thumbnails', async () => {
      await canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1');

      const cached = canvasThumbnailService.getCachedThumbnail('canvas1', 'project1');
      expect(cached).toBeTruthy();
      expect(cached?.canvasId).toBe('canvas1');
    });

    it('should clear cache', () => {
      canvasThumbnailService.clearCache();
      
      const stats = canvasThumbnailService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', async () => {
      await canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1');
      await canvasThumbnailService.generateCanvasThumbnail('canvas2', 'project1');

      const stats = canvasThumbnailService.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toContain('project1_canvas1');
      expect(stats.entries).toContain('project1_canvas2');
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(
        canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1')
      ).rejects.toThrow(ThumbnailError);
    });

    it('should handle thumbnail service errors', async () => {
      mockThumbnailService.generateCanvasThumbnail.mockRejectedValue(
        new Error('Thumbnail generation failed')
      );

      await expect(
        canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1')
      ).rejects.toThrow(ThumbnailError);
    });
  });

  describe('performance', () => {
    it('should limit shapes for performance', async () => {
      const manyShapes = Array.from({ length: 200 }, (_, i) => ({
        ...mockShapes[0],
        id: `shape${i}`
      }));

      mockGetDocs.mockResolvedValue({
        docs: manyShapes.map(shape => ({
          id: shape.id,
          data: () => shape
        }))
      });

      await canvasThumbnailService.generateCanvasThumbnail('canvas1', 'project1', {
        maxShapes: 50
      });

      expect(mockThumbnailService.generateCanvasThumbnail).toHaveBeenCalledWith(
        'canvas1',
        expect.arrayContaining([]),
        expect.any(Object),
        expect.objectContaining({ maxShapes: 50 })
      );

      // Should only pass 50 shapes
      const passedShapes = mockThumbnailService.generateCanvasThumbnail.mock.calls[0][1];
      expect(passedShapes.length).toBeLessThanOrEqual(50);
    });
  });
});
