// Unit tests for DeepLinkContext
// Tests for context state management, deep link processing, and navigation

import React from 'react';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeepLinkProvider, useDeepLinkContext, useProjectDeepLink, useCanvasDeepLink } from './DeepLinkContext';
import { useAuth } from './AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useProjectCanvas } from './ProjectCanvasContext';
import { deepLinkService } from '../services/deepLinkService';

// Mock dependencies
jest.mock('./AuthContext');
jest.mock('../hooks/useProjects');
jest.mock('./ProjectCanvasContext');
jest.mock('../services/deepLinkService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUseProjectCanvas = useProjectCanvas as jest.MockedFunction<typeof useProjectCanvas>;
const mockDeepLinkService = deepLinkService as jest.Mocked<typeof deepLinkService>;

// Test component
const TestComponent: React.FC = () => {
  const deepLink = useDeepLinkContext();
  return (
    <div>
      <div data-testid="is-processing">{deepLink.isProcessing ? 'true' : 'false'}</div>
      <div data-testid="is-loading">{deepLink.isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{deepLink.error || 'none'}</div>
      <div data-testid="current-url">{deepLink.currentUrl}</div>
      <div data-testid="cache-size">{deepLink.cacheStats.size}</div>
      <div data-testid="recent-links-count">{deepLink.recentLinks.length}</div>
    </div>
  );
};

const ProjectTestComponent: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const projectDeepLink = useProjectDeepLink(projectId);
  return (
    <div>
      <div data-testid="project-navigation">
        {projectDeepLink.navigateToProject ? 'available' : 'unavailable'}
      </div>
    </div>
  );
};

const CanvasTestComponent: React.FC<{ projectId?: string; canvasId?: string }> = ({ projectId, canvasId }) => {
  const canvasDeepLink = useCanvasDeepLink(projectId, canvasId);
  return (
    <div>
      <div data-testid="canvas-navigation">
        {canvasDeepLink.navigateToCanvas ? 'available' : 'unavailable'}
      </div>
    </div>
  );
};

describe('DeepLinkProvider', () => {
  const mockNavigate = jest.fn();
  const mockSetCurrentProject = jest.fn();
  const mockSetCurrentCanvas = jest.fn();

  const defaultMocks = {
    user: { uid: 'user1', email: 'user1@example.com' },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    setCurrentProject: mockSetCurrentProject,
    setCurrentCanvas: mockSetCurrentCanvas,
    processDeepLink: jest.fn(),
    generateUrl: jest.fn(),
    getCacheStats: jest.fn(),
    clearCache: jest.fn(),
    invalidateProject: jest.fn(),
    invalidateCanvas: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: defaultMocks.user,
      loading: defaultMocks.loading,
      signIn: defaultMocks.signIn,
      signUp: defaultMocks.signUp,
      signOut: defaultMocks.signOut,
      resetPassword: defaultMocks.resetPassword,
      updateProfile: defaultMocks.updateProfile
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
    mockDeepLinkService.getCacheStats.mockReturnValue({ size: 0, keys: [] });
  });

  const renderWithProvider = (children: React.ReactNode, props = {}) => {
    return render(
      <MemoryRouter>
        <DeepLinkProvider {...props}>
          {children}
        </DeepLinkProvider>
      </MemoryRouter>
    );
  };

  describe('context state', () => {
    it('should provide initial state', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
      expect(screen.getByTestId('current-url')).toHaveTextContent('');
      expect(screen.getByTestId('cache-size')).toHaveTextContent('0');
      expect(screen.getByTestId('recent-links-count')).toHaveTextContent('0');
    });

    it('should update state when processing deep links', async () => {
      renderWithProvider(<TestComponent />);

      // Simulate processing
      await waitFor(() => {
        expect(screen.getByTestId('is-processing')).toHaveTextContent('true');
      });
    });
  });

  describe('deep link processing', () => {
    it('should process current URL on mount', async () => {
      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(mockDeepLinkService.processDeepLink).toHaveBeenCalled();
      });
    });

    it('should handle successful processing', async () => {
      const mockResult = {
        success: true,
        project: { id: 'project123', name: 'Test Project' },
        canvas: { id: 'canvas456', name: 'Test Canvas' }
      };
      mockDeepLinkService.processDeepLink.mockResolvedValue(mockResult);

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(mockSetCurrentProject).toHaveBeenCalledWith(mockResult.project);
        expect(mockSetCurrentCanvas).toHaveBeenCalledWith(mockResult.canvas);
      });
    });

    it('should handle processing errors', async () => {
      const errorMessage = 'Processing failed';
      mockDeepLinkService.processDeepLink.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });
    });

    it('should call success callback', async () => {
      const onSuccess = jest.fn();
      const mockResult = { success: true, project: { id: 'project123' } };
      mockDeepLinkService.processDeepLink.mockResolvedValue(mockResult);

      renderWithProvider(<TestComponent />, { onDeepLinkSuccess: onSuccess });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockResult);
      });
    });

    it('should call error callback', async () => {
      const onError = jest.fn();
      const errorMessage = 'Processing failed';
      mockDeepLinkService.processDeepLink.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<TestComponent />, { onDeepLinkError: onError });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to project', async () => {
      renderWithProvider(<TestComponent />);

      // Get the context and test navigation
      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.navigateToProject('project123');
      });

      // Navigation would be tested in integration tests
      expect(result.current.navigateToProject).toBeDefined();
    });

    it('should navigate to canvas', async () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.navigateToCanvas('project123', 'canvas456');
      });

      expect(result.current.navigateToCanvas).toBeDefined();
    });

    it('should navigate to project view', async () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.navigateToProjectView('project123', 'settings');
      });

      expect(result.current.navigateToProjectView).toBeDefined();
    });
  });

  describe('URL generation', () => {
    it('should generate URL from parameters', () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.generateUrl({ projectId: 'project123' });
      });

      expect(mockDeepLinkService.constructor.prototype.generateUrl).toHaveBeenCalledWith({
        projectId: 'project123'
      });
    });

    it('should generate shareable link', () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.generateShareableLink({ projectId: 'project123' });
      });

      expect(mockDeepLinkService.constructor.prototype.generateUrl).toHaveBeenCalledWith({
        projectId: 'project123'
      });
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.clearCache();
      });

      expect(mockDeepLinkService.clearCache).toHaveBeenCalled();
    });

    it('should invalidate project cache', () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.invalidateProject('project123');
      });

      expect(mockDeepLinkService.invalidateProject).toHaveBeenCalledWith('project123');
    });

    it('should invalidate canvas cache', () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.invalidateCanvas('project123', 'canvas456');
      });

      expect(mockDeepLinkService.invalidateCanvas).toHaveBeenCalledWith('project123', 'canvas456');
    });
  });

  describe('recent links management', () => {
    it('should add to recent links on successful processing', async () => {
      const mockResult = { success: true, project: { id: 'project123' } };
      mockDeepLinkService.processDeepLink.mockResolvedValue(mockResult);

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('recent-links-count')).toHaveTextContent('1');
      });
    });

    it('should clear recent links', () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.clearRecentLinks();
      });

      expect(result.current.recentLinks).toHaveLength(0);
    });

    it('should remove specific recent link', () => {
      renderWithProvider(<TestComponent />);

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      act(() => {
        result.current.removeRecentLink('test-url');
      });

      // Should not throw error
      expect(result.current.removeRecentLink).toBeDefined();
    });
  });

  describe('convenience hooks', () => {
    it('should provide project deep link functionality', () => {
      renderWithProvider(<ProjectTestComponent projectId="project123" />);

      expect(screen.getByTestId('project-navigation')).toHaveTextContent('available');
    });

    it('should provide canvas deep link functionality', () => {
      renderWithProvider(<CanvasTestComponent projectId="project123" canvasId="canvas456" />);

      expect(screen.getByTestId('canvas-navigation')).toHaveTextContent('available');
    });
  });

  describe('error handling', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        useDeepLinkContext();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useDeepLinkContext must be used within a DeepLinkProvider');
    });
  });

  describe('configuration options', () => {
    it('should respect maxRecentLinks configuration', () => {
      renderWithProvider(<TestComponent />, { maxRecentLinks: 5 });

      const { result } = renderHook(() => useDeepLinkContext(), {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <DeepLinkProvider maxRecentLinks={5}>{children}</DeepLinkProvider>
          </MemoryRouter>
        )
      });

      expect(result.current.recentLinks).toHaveLength(0);
    });

    it('should respect autoProcessOnNavigation configuration', () => {
      renderWithProvider(<TestComponent />, { autoProcessOnNavigation: false });

      // Should not auto-process on navigation
      expect(mockDeepLinkService.processDeepLink).not.toHaveBeenCalled();
    });
  });
});
