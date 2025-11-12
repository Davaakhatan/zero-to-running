// Unit tests for useCanvasThumbnails hook
// Tests for React integration with canvas thumbnail service

import { renderHook, act } from '@testing-library/react';
import { useCanvasThumbnails } from './useCanvasThumbnails';
import { useProjectData } from './useProjectData';
import { canvasThumbnailService } from '../services/canvasThumbnailService';
import { CanvasThumbnailResult, ThumbnailGenerationRequest } from '../services/canvasThumbnailService';
import { ThumbnailError } from '../services/thumbnailService';

// Mock dependencies
jest.mock('./useProjectData');
jest.mock('../services/canvasThumbnailService');

const mockUseProjectData = useProjectData as jest.MockedFunction<typeof useProjectData>;
const mockCanvasThumbnailService = canvasThumbnailService as jest.Mocked<typeof canvasThumbnailService>;

describe('useCanvasThumbnails', () => {
  const mockProject = {
    id: 'project1',
    name: 'Test Project',
    ownerId: 'user1',
    members: []
  };

  const mockCanvases = [
    {
      id: 'canvas1',
      projectId: 'project1',
      name: 'Canvas 1',
      width: 1920,
      height: 1080,
      backgroundColor: '#ffffff'
    },
    {
      id: 'canvas2',
      projectId: 'project1',
      name: 'Canvas 2',
      width: 1920,
      height: 1080,
      backgroundColor: '#ffffff'
    }
  ];

  const mockThumbnailResult: CanvasThumbnailResult = {
    dataUrl: 'data:image/png;base64,mock-data',
    blob: new Blob(['mock-data'], { type: 'image/png' }),
    width: 200,
    height: 150,
    size: 1024,
    format: 'png',
    generatedAt: Date.now(),
    canvasId: 'canvas1',
    projectId: 'project1',
    shapeCount: 5,
    lastModified: Date.now(),
    generatedFrom: 'shapes'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseProjectData.mockReturnValue({
      currentProject: mockProject,
      currentProjectCanvases: mockCanvases,
      // ... other required properties
    } as any);

    mockCanvasThumbnailService.generateCanvasThumbnail.mockResolvedValue(mockThumbnailResult);
    mockCanvasThumbnailService.generateFromKonvaStage.mockResolvedValue(mockThumbnailResult);
    mockCanvasThumbnailService.generateMultipleThumbnails.mockResolvedValue([mockThumbnailResult]);
    mockCanvasThumbnailService.getCacheStats.mockReturnValue({
      size: 0,
      entries: [],
      queueLength: 0
    });
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      expect(result.current.state.thumbnails.size).toBe(0);
      expect(result.current.state.loading.size).toBe(0);
      expect(result.current.state.errors.size).toBe(0);
      expect(result.current.state.generationQueue).toEqual([]);
    });

    it('should auto-generate thumbnails for current project canvases', async () => {
      renderHook(() => useCanvasThumbnails());

      // Wait for auto-generation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockCanvasThumbnailService.queueThumbnailGeneration).toHaveBeenCalledTimes(2);
      expect(mockCanvasThumbnailService.queueThumbnailGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          canvasId: 'canvas1',
          projectId: 'project1',
          priority: 'normal'
        })
      );
    });
  });

  describe('thumbnail operations', () => {
    it('should get cached thumbnail', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      // Generate thumbnail first
      await act(async () => {
        await result.current.generateThumbnail('canvas1', 'project1');
      });

      const thumbnail = result.current.getThumbnail('canvas1', 'project1');
      expect(thumbnail).toEqual(mockThumbnailResult);
    });

    it('should generate thumbnail', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      await act(async () => {
        const thumbnail = await result.current.generateThumbnail('canvas1', 'project1');
        expect(thumbnail).toEqual(mockThumbnailResult);
      });

      expect(mockCanvasThumbnailService.generateCanvasThumbnail).toHaveBeenCalledWith(
        'canvas1',
        'project1',
        {}
      );
    });

    it('should generate thumbnail with options', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const options = { includeShapes: true, maxShapes: 50 };

      await act(async () => {
        await result.current.generateThumbnail('canvas1', 'project1', options);
      });

      expect(mockCanvasThumbnailService.generateCanvasThumbnail).toHaveBeenCalledWith(
        'canvas1',
        'project1',
        options
      );
    });

    it('should generate thumbnail from Konva stage', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const mockStage = { width: () => 1920, height: () => 1080 };

      await act(async () => {
        const thumbnail = await result.current.generateFromKonvaStage(
          mockStage,
          'canvas1',
          'project1'
        );
        expect(thumbnail).toEqual(mockThumbnailResult);
      });

      expect(mockCanvasThumbnailService.generateFromKonvaStage).toHaveBeenCalledWith(
        mockStage,
        'canvas1',
        'project1',
        {}
      );
    });

    it('should queue thumbnail generation', () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const request: ThumbnailGenerationRequest = {
        canvasId: 'canvas1',
        projectId: 'project1',
        priority: 'high'
      };

      act(() => {
        result.current.queueThumbnailGeneration(request);
      });

      expect(mockCanvasThumbnailService.queueThumbnailGeneration).toHaveBeenCalledWith(request);
    });
  });

  describe('status checks', () => {
    it('should check if thumbnail is loading', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      // Start generation
      act(() => {
        result.current.generateThumbnail('canvas1', 'project1');
      });

      expect(result.current.isThumbnailLoading('canvas1', 'project1')).toBe(true);

      // Complete generation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isThumbnailLoading('canvas1', 'project1')).toBe(false);
    });

    it('should get thumbnail error', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const error = new ThumbnailError('Generation failed', 'GENERATION_FAILED');

      mockCanvasThumbnailService.generateCanvasThumbnail.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.generateThumbnail('canvas1', 'project1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.getThumbnailError('canvas1', 'project1')).toBe('Generation failed');
    });

    it('should check if thumbnail is in queue', () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const request: ThumbnailGenerationRequest = {
        canvasId: 'canvas1',
        projectId: 'project1',
        priority: 'normal'
      };

      act(() => {
        result.current.queueThumbnailGeneration(request);
      });

      expect(result.current.isInQueue('canvas1', 'project1')).toBe(true);
    });
  });

  describe('batch operations', () => {
    it('should generate multiple thumbnails', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const requests: ThumbnailGenerationRequest[] = [
        { canvasId: 'canvas1', projectId: 'project1', priority: 'high' },
        { canvasId: 'canvas2', projectId: 'project1', priority: 'normal' }
      ];

      await act(async () => {
        const thumbnails = await result.current.generateMultipleThumbnails(requests);
        expect(thumbnails).toEqual([mockThumbnailResult]);
      });

      expect(mockCanvasThumbnailService.generateMultipleThumbnails).toHaveBeenCalledWith(requests);
    });

    it('should generate all project thumbnails', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      await act(async () => {
        await result.current.generateAllProjectThumbnails('project1');
      });

      expect(mockCanvasThumbnailService.generateMultipleThumbnails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ canvasId: 'canvas1', projectId: 'project1' }),
          expect.objectContaining({ canvasId: 'canvas2', projectId: 'project1' })
        ])
      );
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      act(() => {
        result.current.clearCache();
      });

      expect(mockCanvasThumbnailService.clearCache).toHaveBeenCalled();
    });

    it('should invalidate thumbnail', () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      act(() => {
        result.current.invalidateThumbnail('canvas1', 'project1');
      });

      // Should remove from state
      expect(result.current.getThumbnail('canvas1', 'project1')).toBeNull();
    });

    it('should refresh thumbnail', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      await act(async () => {
        await result.current.refreshThumbnail('canvas1', 'project1');
      });

      expect(mockCanvasThumbnailService.generateCanvasThumbnail).toHaveBeenCalledWith(
        'canvas1',
        'project1',
        { forceRegenerate: true }
      );
    });
  });

  describe('utility functions', () => {
    it('should get thumbnail data URL', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      await act(async () => {
        await result.current.generateThumbnail('canvas1', 'project1');
      });

      const dataUrl = result.current.getThumbnailDataUrl('canvas1', 'project1');
      expect(dataUrl).toBe(mockThumbnailResult.dataUrl);
    });

    it('should get thumbnail size', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      await act(async () => {
        await result.current.generateThumbnail('canvas1', 'project1');
      });

      const size = result.current.getThumbnailSize('canvas1', 'project1');
      expect(size).toBe(mockThumbnailResult.size);
    });

    it('should get thumbnail metadata', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      await act(async () => {
        await result.current.generateThumbnail('canvas1', 'project1');
      });

      const metadata = result.current.getThumbnailMetadata('canvas1', 'project1');
      expect(metadata).toEqual({
        shapeCount: mockThumbnailResult.shapeCount,
        lastModified: mockThumbnailResult.lastModified,
        generatedFrom: mockThumbnailResult.generatedFrom
      });
    });

    it('should download thumbnail', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      
      // Mock createElement and appendChild
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => mockLink)
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild
      });

      await act(async () => {
        await result.current.generateThumbnail('canvas1', 'project1');
      });

      act(() => {
        result.current.downloadThumbnail('canvas1', 'project1', 'test.png');
      });

      expect(mockLink.href).toBe(mockThumbnailResult.dataUrl);
      expect(mockLink.download).toBe('test.png');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('error handling', () => {
    it('should handle generation errors gracefully', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const error = new ThumbnailError('Service unavailable', 'SERVICE_ERROR');

      mockCanvasThumbnailService.generateCanvasThumbnail.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.generateThumbnail('canvas1', 'project1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.getThumbnailError('canvas1', 'project1')).toBe('Service unavailable');
      expect(result.current.isThumbnailLoading('canvas1', 'project1')).toBe(false);
    });

    it('should handle batch generation errors', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());
      const error = new ThumbnailError('Batch generation failed', 'BATCH_ERROR');

      mockCanvasThumbnailService.generateMultipleThumbnails.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.generateMultipleThumbnails([
            { canvasId: 'canvas1', projectId: 'project1', priority: 'high' }
          ]);
        } catch (e) {
          // Expected to throw
        }
      });

      // Should not crash the hook
      expect(result.current.state.thumbnails.size).toBe(0);
    });
  });

  describe('cache stats updates', () => {
    it('should update cache stats periodically', async () => {
      const { result } = renderHook(() => useCanvasThumbnails());

      // Initial stats
      expect(result.current.state.cacheStats.size).toBe(0);

      // Update mock to return different stats
      mockCanvasThumbnailService.getCacheStats.mockReturnValue({
        size: 5,
        entries: ['entry1', 'entry2'],
        queueLength: 2
      });

      // Wait for periodic update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.state.cacheStats.size).toBe(5);
    });
  });
});
