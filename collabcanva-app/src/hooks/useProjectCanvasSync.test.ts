// Unit tests for useProjectCanvasSync hook
// Tests for project-aware canvas synchronization

import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectCanvasSync } from './useProjectCanvasSync';
import { useAuth } from '../contexts/AuthContext';
import * as projectCanvasService from '../services/projectCanvas';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../services/projectCanvas');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockProjectCanvasService = projectCanvasService as jest.Mocked<typeof projectCanvasService>;

describe('useProjectCanvasSync', () => {
  const mockUser = {
    uid: 'user123',
    email: 'user@example.com',
    displayName: 'Test User'
  };

  const mockShape = {
    id: 'shape123',
    type: 'rectangle' as const,
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#ff0000',
    createdBy: 'user123',
    createdAt: Date.now()
  };

  const defaultMocks = {
    user: mockUser,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultMocks);
    
    // Default service mocks
    mockProjectCanvasService.initializeProjectCanvas.mockResolvedValue();
    mockProjectCanvasService.subscribeToProjectCanvas.mockReturnValue(jest.fn());
    mockProjectCanvasService.createProjectShape.mockResolvedValue();
    mockProjectCanvasService.updateProjectShape.mockResolvedValue();
    mockProjectCanvasService.updateProjectShapes.mockResolvedValue();
    mockProjectCanvasService.deleteProjectShape.mockResolvedValue();
    mockProjectCanvasService.lockProjectShape.mockResolvedValue();
    mockProjectCanvasService.unlockProjectShape.mockResolvedValue();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      expect(result.current.shapes).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.projectId).toBe('project123');
      expect(result.current.canvasId).toBe('canvas456');
      expect(result.current.isEnabled).toBe(true);
    });

    it('should not initialize when disabled', () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456',
        enabled: false
      }));

      expect(result.current.loading).toBe(false);
      expect(mockProjectCanvasService.initializeProjectCanvas).not.toHaveBeenCalled();
    });

    it('should not initialize when projectId or canvasId is missing', () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: '',
        canvasId: 'canvas456'
      }));

      expect(result.current.loading).toBe(false);
      expect(mockProjectCanvasService.initializeProjectCanvas).not.toHaveBeenCalled();
    });

    it('should initialize canvas and subscribe to updates', async () => {
      const mockCallback = jest.fn();
      mockProjectCanvasService.subscribeToProjectCanvas.mockImplementation((projectId, canvasId, callback) => {
        // Simulate receiving shapes
        setTimeout(() => callback([mockShape]), 100);
        return jest.fn();
      });

      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      expect(mockProjectCanvasService.initializeProjectCanvas).toHaveBeenCalledWith('project123', 'canvas456');
      expect(mockProjectCanvasService.subscribeToProjectCanvas).toHaveBeenCalledWith(
        'project123',
        'canvas456',
        expect.any(Function)
      );

      await waitFor(() => {
        expect(result.current.shapes).toEqual([mockShape]);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle initialization errors', async () => {
      const errorMessage = 'Failed to initialize canvas';
      mockProjectCanvasService.initializeProjectCanvas.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('shape operations', () => {
    it('should add shape successfully', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.addShape(mockShape);
      });

      expect(mockProjectCanvasService.createProjectShape).toHaveBeenCalledWith(
        'project123',
        'canvas456',
        expect.objectContaining({
          ...mockShape,
          createdBy: 'user123',
          createdAt: expect.any(Number)
        })
      );
    });

    it('should not add shape when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: null
      });

      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.addShape(mockShape);
      });

      expect(mockProjectCanvasService.createProjectShape).not.toHaveBeenCalled();
      expect(result.current.error).toBe('You must be logged in to add shapes. Please refresh the page.');
    });

    it('should not add shape when projectId or canvasId is missing', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: '',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.addShape(mockShape);
      });

      expect(mockProjectCanvasService.createProjectShape).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Canvas not properly initialized. Please refresh the page.');
    });

    it('should handle add shape errors', async () => {
      const errorMessage = 'Failed to create shape';
      mockProjectCanvasService.createProjectShape.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.addShape(mockShape);
      });

      expect(result.current.error).toBe('Failed to create shape: ' + errorMessage);
    });

    it('should update shape successfully', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      const updates = { fill: '#00ff00', width: 300 };

      await act(async () => {
        await result.current.updateShape('shape123', updates);
      });

      expect(mockProjectCanvasService.updateProjectShape).toHaveBeenCalledWith(
        'project123',
        'canvas456',
        'shape123',
        expect.objectContaining({
          ...updates,
          lastModifiedBy: 'user123',
          lastModifiedAt: expect.any(Number)
        })
      );
    });

    it('should update multiple shapes successfully', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      const updatedShapes = [mockShape, { ...mockShape, id: 'shape456' }];

      await act(async () => {
        await result.current.updateShapes(updatedShapes);
      });

      expect(mockProjectCanvasService.updateProjectShapes).toHaveBeenCalledWith(
        'project123',
        'canvas456',
        expect.arrayContaining([
          expect.objectContaining({
            ...mockShape,
            lastModifiedBy: 'user123',
            lastModifiedAt: expect.any(Number)
          })
        ])
      );
    });

    it('should delete shape successfully', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.deleteShape('shape123');
      });

      expect(mockProjectCanvasService.deleteProjectShape).toHaveBeenCalledWith(
        'project123',
        'canvas456',
        'shape123'
      );
    });
  });

  describe('locking operations', () => {
    it('should lock shape successfully', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.lockShape('shape123', 30000);
      });

      expect(mockProjectCanvasService.lockProjectShape).toHaveBeenCalledWith(
        'project123',
        'canvas456',
        'shape123',
        'user123'
      );
    });

    it('should unlock shape successfully', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.unlockShape('shape123');
      });

      expect(mockProjectCanvasService.unlockProjectShape).toHaveBeenCalledWith(
        'project123',
        'canvas456',
        'shape123'
      );
    });

    it('should handle lock shape errors', async () => {
      const errorMessage = 'Failed to lock shape';
      mockProjectCanvasService.lockProjectShape.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.lockShape('shape123');
      });

      expect(result.current.error).toBe('Failed to lock shape: ' + errorMessage);
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should refresh canvas', async () => {
      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.refreshCanvas();
      });

      expect(mockProjectCanvasService.initializeProjectCanvas).toHaveBeenCalledWith(
        'project123',
        'canvas456'
      );
    });

    it('should handle refresh canvas errors', async () => {
      const errorMessage = 'Failed to refresh canvas';
      mockProjectCanvasService.initializeProjectCanvas.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      await act(async () => {
        await result.current.refreshCanvas();
      });

      expect(result.current.error).toBe('Failed to refresh canvas: ' + errorMessage);
    });
  });

  describe('cleanup', () => {
    it('should cleanup subscriptions on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockProjectCanvasService.subscribeToProjectCanvas.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should clear lock timeouts on unmount', () => {
      const { result, unmount } = renderHook(() => useProjectCanvasSync({
        projectId: 'project123',
        canvasId: 'canvas456'
      }));

      // Mock setTimeout and clearTimeout
      const mockSetTimeout = jest.spyOn(global, 'setTimeout');
      const mockClearTimeout = jest.spyOn(global, 'clearTimeout');

      act(() => {
        result.current.lockShape('shape123', 30000);
      });

      unmount();

      expect(mockClearTimeout).toHaveBeenCalled();
    });
  });

  describe('parameter changes', () => {
    it('should reinitialize when projectId changes', async () => {
      const { rerender } = renderHook(
        ({ projectId, canvasId }) => useProjectCanvasSync({ projectId, canvasId }),
        {
          initialProps: { projectId: 'project123', canvasId: 'canvas456' }
        }
      );

      expect(mockProjectCanvasService.initializeProjectCanvas).toHaveBeenCalledWith(
        'project123',
        'canvas456'
      );

      rerender({ projectId: 'project999', canvasId: 'canvas456' });

      expect(mockProjectCanvasService.initializeProjectCanvas).toHaveBeenCalledWith(
        'project999',
        'canvas456'
      );
    });

    it('should reinitialize when canvasId changes', async () => {
      const { rerender } = renderHook(
        ({ projectId, canvasId }) => useProjectCanvasSync({ projectId, canvasId }),
        {
          initialProps: { projectId: 'project123', canvasId: 'canvas456' }
        }
      );

      expect(mockProjectCanvasService.initializeProjectCanvas).toHaveBeenCalledWith(
        'project123',
        'canvas456'
      );

      rerender({ projectId: 'project123', canvasId: 'canvas999' });

      expect(mockProjectCanvasService.initializeProjectCanvas).toHaveBeenCalledWith(
        'project123',
        'canvas999'
      );
    });
  });
});