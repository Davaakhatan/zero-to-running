// Unit tests for DeepLinkHandler component
// Tests for deep link processing, loading states, error handling, and navigation

import React from 'react';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DeepLinkHandler, ProjectDeepLinkHandler, CanvasDeepLinkHandler, useDeepLinkProcessing } from './DeepLinkHandler';
import { useDeepLinkContext } from '../../contexts/DeepLinkContext';

// Mock dependencies
jest.mock('../../contexts/DeepLinkContext');

const mockUseDeepLinkContext = useDeepLinkContext as jest.MockedFunction<typeof useDeepLinkContext>;

// Test components
const TestComponent: React.FC = () => <div data-testid="test-component">Test Component</div>;
const FallbackComponent: React.FC = () => <div data-testid="fallback-component">Fallback Component</div>;
const LoadingComponent: React.FC = () => <div data-testid="loading-component">Loading Component</div>;
const ErrorComponent: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div data-testid="error-component">
    <div data-testid="error-message">{error}</div>
    {onRetry && <button data-testid="retry-button" onClick={onRetry}>Retry</button>}
  </div>
);

describe('DeepLinkHandler', () => {
  const defaultMocks = {
    isProcessing: false,
    isLoading: false,
    error: null,
    currentResult: null,
    processCurrentUrl: jest.fn(),
    clearError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeepLinkContext.mockReturnValue({
      ...defaultMocks,
      // ... other required properties
    } as any);
  });

  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/projects/project123']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/projects/:projectId" element={component} />
          <Route path="/projects/:projectId/canvases/:canvasId" element={component} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('basic functionality', () => {
    it('should render children when processing is successful', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        currentResult: { success: true }
      } as any);

      renderWithRouter(
        <DeepLinkHandler>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should render fallback when no result and requirements not met', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        currentResult: null
      } as any);

      renderWithRouter(
        <DeepLinkHandler requireProject={true} fallback={<FallbackComponent />}>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
    });

    it('should render children when no requirements', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        currentResult: null
      } as any);

      renderWithRouter(
        <DeepLinkHandler>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading when processing', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        isProcessing: true
      } as any);

      renderWithRouter(
        <DeepLinkHandler>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByText('Processing deep link...')).toBeInTheDocument();
    });

    it('should show loading when context is loading', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        isLoading: true
      } as any);

      renderWithRouter(
        <DeepLinkHandler>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByText('Processing deep link...')).toBeInTheDocument();
    });

    it('should show custom loading component', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        isProcessing: true
      } as any);

      renderWithRouter(
        <DeepLinkHandler loadingComponent={<LoadingComponent />}>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show error when processing fails', () => {
      const errorMessage = 'Processing failed';
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage
      } as any);

      renderWithRouter(
        <DeepLinkHandler>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByText('Deep Link Error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show custom error component', () => {
      const errorMessage = 'Processing failed';
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage
      } as any);

      renderWithRouter(
        <DeepLinkHandler errorComponent={<ErrorComponent error={errorMessage} />}>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByTestId('error-component')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });

    it('should show project not found for project errors', () => {
      const errorMessage = 'Project not found';
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage
      } as any);

      renderWithRouter(
        <DeepLinkHandler requireProject={true}>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByText('Project Not Found')).toBeInTheDocument();
    });

    it('should show canvas not found for canvas errors', () => {
      const errorMessage = 'Canvas not found';
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage
      } as any);

      renderWithRouter(
        <DeepLinkHandler requireProject={true} requireCanvas={true}>
          <TestComponent />
        </DeepLinkHandler>,
        ['/projects/project123/canvases/canvas456']
      );

      expect(screen.getByText('Canvas Not Found')).toBeInTheDocument();
    });

    it('should handle retry functionality', async () => {
      const errorMessage = 'Processing failed';
      const mockProcessCurrentUrl = jest.fn();
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage,
        processCurrentUrl: mockProcessCurrentUrl
      } as any);

      renderWithRouter(
        <DeepLinkHandler>
          <TestComponent />
        </DeepLinkHandler>
      );

      const retryButton = screen.getByText('Try Again');
      retryButton.click();

      await waitFor(() => {
        expect(mockProcessCurrentUrl).toHaveBeenCalled();
      });
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback', async () => {
      const onSuccess = jest.fn();
      const mockResult = { success: true, project: { id: 'project123' } };
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        currentResult: mockResult
      } as any);

      renderWithRouter(
        <DeepLinkHandler onSuccess={onSuccess}>
          <TestComponent />
        </DeepLinkHandler>
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockResult);
      });
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const errorMessage = 'Processing failed';
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage
      } as any);

      renderWithRouter(
        <DeepLinkHandler onError={onError}>
          <TestComponent />
        </DeepLinkHandler>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('auto-processing', () => {
    it('should auto-process when enabled', async () => {
      const mockProcessCurrentUrl = jest.fn();
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        processCurrentUrl: mockProcessCurrentUrl
      } as any);

      renderWithRouter(
        <DeepLinkHandler autoProcess={true}>
          <TestComponent />
        </DeepLinkHandler>
      );

      await waitFor(() => {
        expect(mockProcessCurrentUrl).toHaveBeenCalled();
      });
    });

    it('should not auto-process when disabled', () => {
      const mockProcessCurrentUrl = jest.fn();
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        processCurrentUrl: mockProcessCurrentUrl
      } as any);

      renderWithRouter(
        <DeepLinkHandler autoProcess={false}>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(mockProcessCurrentUrl).not.toHaveBeenCalled();
    });
  });

  describe('convenience components', () => {
    it('should render ProjectDeepLinkHandler with project requirement', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        currentResult: { success: true, project: { id: 'project123' } }
      } as any);

      renderWithRouter(
        <ProjectDeepLinkHandler>
          <TestComponent />
        </ProjectDeepLinkHandler>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should render CanvasDeepLinkHandler with project and canvas requirements', () => {
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        currentResult: { 
          success: true, 
          project: { id: 'project123' },
          canvas: { id: 'canvas456' }
        }
      } as any);

      renderWithRouter(
        <CanvasDeepLinkHandler>
          <TestComponent />
        </CanvasDeepLinkHandler>,
        ['/projects/project123/canvases/canvas456']
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const errorMessage = 'Processing failed';
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage
      } as any);

      renderWithRouter(
        <DeepLinkHandler>
          <TestComponent />
        </DeepLinkHandler>
      );

      expect(screen.getByText('Deep Link Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      const errorMessage = 'Project not found';
      mockUseDeepLinkContext.mockReturnValue({
        ...defaultMocks,
        error: errorMessage
      } as any);

      renderWithRouter(
        <DeepLinkHandler requireProject={true}>
          <TestComponent />
        </DeepLinkHandler>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Project Not Found');
    });
  });
});

describe('useDeepLinkProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeepLinkContext.mockReturnValue({
      ...defaultMocks,
      // ... other required properties
    } as any);
  });

  it('should provide processing functionality', () => {
    const { result } = renderHook(() => useDeepLinkProcessing());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.processCurrentUrl).toBeDefined();
    expect(result.current.clearError).toBeDefined();
  });

  it('should handle processing state', async () => {
    const mockProcessCurrentUrl = jest.fn().mockResolvedValue({ success: true });
    mockUseDeepLinkContext.mockReturnValue({
      ...defaultMocks,
      processCurrentUrl: mockProcessCurrentUrl
    } as any);

    const { result } = renderHook(() => useDeepLinkProcessing());

    await act(async () => {
      await result.current.processCurrentUrl();
    });

    expect(mockProcessCurrentUrl).toHaveBeenCalled();
  });

  it('should handle processing errors', async () => {
    const errorMessage = 'Processing failed';
    const mockProcessCurrentUrl = jest.fn().mockRejectedValue(new Error(errorMessage));
    mockUseDeepLinkContext.mockReturnValue({
      ...defaultMocks,
      processCurrentUrl: mockProcessCurrentUrl
    } as any);

    const { result } = renderHook(() => useDeepLinkProcessing());

    await act(async () => {
      await result.current.processCurrentUrl();
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useDeepLinkProcessing());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});
