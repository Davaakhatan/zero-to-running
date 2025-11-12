// Unit tests for useDeepLink hook
// Tests for deep link processing, navigation, and state management

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDeepLink, useProjectDeepLink, useCanvasDeepLink } from './useDeepLink';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from './useProjects';
import { useProjectCanvas } from '../contexts/ProjectCanvasContext';
import { deepLinkService } from '../services/deepLinkService';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn()
}));

jest.mock('../contexts/AuthContext');
jest.mock('./useProjects');
jest.mock('../contexts/ProjectCanvasContext');
jest.mock('../services/deepLinkService');

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUseProjectCanvas = useProjectCanvas as jest.MockedFunction<typeof useProjectCanvas>;
const mockDeepLinkService = deepLinkService as jest.Mocked<typeof deepLinkService>;

describe('useDeepLink', () => {
  const mockNavigate = jest.fn();
  const mockSetCurrentProject = jest.fn();
  const mockSetCurrentCanvas = jest.fn();

  const defaultMocks = {
    location: { pathname: '/projects/project123', search: '' },
    navigate: mockNavigate,
    user: { uid: 'user1', email: 'user1@example.com' },
    setCurrentProject: mockSetCurrentProject,
    setCurrentCanvas: mockSetCurrentCanvas,
    processDeepLink: jest.fn(),
    generateUrl: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseLocation.mockReturnValue(defaultMocks.location);
    mockUseNavigate.mockReturnValue(defaultMocks.navigate);
    mockUseAuth.mockReturnValue({
      user: defaultMocks.user,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });
    mockUseProjects.mockReturnValue({
      setCurrentProject: defaultMocks.setCurrentProject,
      // ... other required properties
    } as any);
    mockUseProjectCanvas.mockReturnValue({
      setCurrentCanvas: defaultMocks.setCurrentCanvas,
      // ... other required properties
    } as any);
    mockDeepLinkService.processDeepLink.mockResolvedValue({
      success: true,
      project: { id: 'project123', name: 'Test Project' }
    });
    mockDeepLinkService.constructor.prototype.generateUrl.mockReturnValue('/projects/project123');
  });

  describe('basic functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDeepLink());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.result).toBe(null);
      expect(result.current.params).toBe(null);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should process current URL', async () => {
      const { result } = renderHook(() => useDeepLink());

      await act(async () => {
        await result.current.processCurrentUrl();
      });

      expect(mockDeepLinkService.processDeepLink).toHaveBeenCalledWith(
        window.location.href,
        {}
      );
    });

    it('should process specific URL', async () => {
      const { result } = renderHook(() => useDeepLink());
      const testUrl = 'https://example.com/projects/project123';

      await act(async () => {
        await result.current.processUrl(testUrl);
      });

      expect(mockDeepLinkService.processDeepLink).toHaveBeenCalledWith(testUrl, {});
    });

    it('should handle processing errors', async () => {
      const errorMessage = 'Processing failed';
      mockDeepLinkService.processDeepLink.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useDeepLink());

      await act(async () => {
        await result.current.processCurrentUrl();
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('navigation helpers', () => {
    it('should navigate to project', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.navigateToProject('project123');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project123');
    });

    it('should navigate to canvas', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.navigateToCanvas('project123', 'canvas456');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project123/canvases/canvas456');
    });

    it('should navigate to project view', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.navigateToProjectView('project123', 'settings');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project123/settings');
    });

    it('should include options in navigation', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.navigateToProject('project123', { tab: 'members' });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project123');
    });
  });

  describe('URL generation', () => {
    it('should generate URL from parameters', () => {
      const { result } = renderHook(() => useDeepLink());
      const params = { projectId: 'project123', view: 'dashboard' };

      act(() => {
        result.current.generateUrl(params);
      });

      expect(mockDeepLinkService.constructor.prototype.generateUrl).toHaveBeenCalledWith(params);
    });

    it('should generate shareable link', () => {
      const { result } = renderHook(() => useDeepLink());
      const params = { projectId: 'project123', view: 'dashboard' };

      act(() => {
        result.current.generateShareableLink(params);
      });

      expect(mockDeepLinkService.constructor.prototype.generateUrl).toHaveBeenCalledWith(params);
    });
  });

  describe('state management', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should retry processing', async () => {
      const { result } = renderHook(() => useDeepLink());

      await act(async () => {
        await result.current.retry();
      });

      // Should not call processDeepLink if no URL was processed before
      expect(mockDeepLinkService.processDeepLink).not.toHaveBeenCalled();
    });

    it('should clear cache', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.clearCache();
      });

      expect(mockDeepLinkService.clearCache).toHaveBeenCalled();
    });

    it('should invalidate project cache', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.invalidateProject('project123');
      });

      expect(mockDeepLinkService.invalidateProject).toHaveBeenCalledWith('project123');
    });

    it('should invalidate canvas cache', () => {
      const { result } = renderHook(() => useDeepLink());

      act(() => {
        result.current.invalidateCanvas('project123', 'canvas456');
      });

      expect(mockDeepLinkService.invalidateCanvas).toHaveBeenCalledWith('project123', 'canvas456');
    });
  });

  describe('auto-processing', () => {
    it('should auto-process on location change when enabled', async () => {
      const { rerender } = renderHook(() => useDeepLink({ autoProcess: true }));

      // Change location
      mockUseLocation.mockReturnValue({
        pathname: '/projects/project456',
        search: ''
      });

      rerender();

      await waitFor(() => {
        expect(mockDeepLinkService.processDeepLink).toHaveBeenCalled();
      });
    });

    it('should not auto-process when disabled', () => {
      renderHook(() => useDeepLink({ autoProcess: false }));

      // Change location
      mockUseLocation.mockReturnValue({
        pathname: '/projects/project456',
        search: ''
      });

      expect(mockDeepLinkService.processDeepLink).not.toHaveBeenCalled();
    });

    it('should not auto-process when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      renderHook(() => useDeepLink({ autoProcess: true }));

      expect(mockDeepLinkService.processDeepLink).not.toHaveBeenCalled();
    });
  });

  describe('success handling', () => {
    it('should call onSuccess callback', async () => {
      const onSuccess = jest.fn();
      const mockResult = { success: true, project: { id: 'project123' } };
      mockDeepLinkService.processDeepLink.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useDeepLink({ onSuccess }));

      await act(async () => {
        await result.current.processCurrentUrl();
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const errorMessage = 'Processing failed';
      mockDeepLinkService.processDeepLink.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useDeepLink({ onError }));

      await act(async () => {
        await result.current.processCurrentUrl();
      });

      expect(onError).toHaveBeenCalledWith(errorMessage);
    });
  });
});

describe('useProjectDeepLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/projects/project123', search: '' });
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuth.mockReturnValue({
      user: { uid: 'user1', email: 'user1@example.com' },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });
    mockUseProjects.mockReturnValue({
      setCurrentProject: mockSetCurrentProject,
      // ... other required properties
    } as any);
    mockUseProjectCanvas.mockReturnValue({
      setCurrentCanvas: mockSetCurrentCanvas,
      // ... other required properties
    } as any);
  });

  it('should navigate to project', () => {
    const { result } = renderHook(() => useProjectDeepLink('project123'));

    act(() => {
      result.current.navigateToProject();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/projects/project123');
  });

  it('should navigate to project view', () => {
    const { result } = renderHook(() => useProjectDeepLink('project123'));

    act(() => {
      result.current.navigateToProjectView('settings');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/projects/project123/settings');
  });

  it('should generate project URL', () => {
    const { result } = renderHook(() => useProjectDeepLink('project123'));

    act(() => {
      result.current.generateProjectUrl();
    });

    expect(mockDeepLinkService.constructor.prototype.generateUrl).toHaveBeenCalledWith({
      projectId: 'project123',
      view: 'dashboard'
    });
  });

  it('should not navigate when projectId is not provided', () => {
    const { result } = renderHook(() => useProjectDeepLink());

    act(() => {
      result.current.navigateToProject();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('useCanvasDeepLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/projects/project123/canvases/canvas456', search: '' });
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuth.mockReturnValue({
      user: { uid: 'user1', email: 'user1@example.com' },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });
    mockUseProjects.mockReturnValue({
      setCurrentProject: mockSetCurrentProject,
      // ... other required properties
    } as any);
    mockUseProjectCanvas.mockReturnValue({
      setCurrentCanvas: mockSetCurrentCanvas,
      // ... other required properties
    } as any);
  });

  it('should navigate to canvas', () => {
    const { result } = renderHook(() => useCanvasDeepLink('project123', 'canvas456'));

    act(() => {
      result.current.navigateToCanvas();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/projects/project123/canvases/canvas456');
  });

  it('should generate canvas URL', () => {
    const { result } = renderHook(() => useCanvasDeepLink('project123', 'canvas456'));

    act(() => {
      result.current.generateCanvasUrl();
    });

    expect(mockDeepLinkService.constructor.prototype.generateUrl).toHaveBeenCalledWith({
      projectId: 'project123',
      canvasId: 'canvas456',
      view: 'canvas'
    });
  });

  it('should not navigate when projectId or canvasId is not provided', () => {
    const { result } = renderHook(() => useCanvasDeepLink());

    act(() => {
      result.current.navigateToCanvas();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
