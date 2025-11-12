// Unit tests for ThumbnailPreview component
// Tests for thumbnail preview with loading states and management options

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThumbnailPreview, ThumbnailGrid, ThumbnailList } from './ThumbnailPreview';
import { useCanvasThumbnails } from '../../hooks/useCanvasThumbnails';

// Mock dependencies
jest.mock('../../hooks/useCanvasThumbnails');

const mockUseCanvasThumbnails = useCanvasThumbnails as jest.MockedFunction<typeof useCanvasThumbnails>;

describe('ThumbnailPreview', () => {
  const mockThumbnail = {
    dataUrl: 'data:image/png;base64,mock-thumbnail-data',
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
    generatedFrom: 'shapes' as const
  };

  const defaultMocks = {
    getThumbnail: jest.fn(),
    generateThumbnail: jest.fn(),
    generateFromKonvaStage: jest.fn(),
    queueThumbnailGeneration: jest.fn(),
    isThumbnailLoading: jest.fn(),
    getThumbnailError: jest.fn(),
    isInQueue: jest.fn(),
    generateMultipleThumbnails: jest.fn(),
    generateAllProjectThumbnails: jest.fn(),
    clearCache: jest.fn(),
    invalidateThumbnail: jest.fn(),
    refreshThumbnail: jest.fn(),
    getThumbnailDataUrl: jest.fn(),
    downloadThumbnail: jest.fn(),
    getThumbnailSize: jest.fn(),
    getThumbnailMetadata: jest.fn(),
    state: {
      thumbnails: new Map(),
      loading: new Set(),
      errors: new Map(),
      generationQueue: [],
      isProcessingQueue: false,
      cacheStats: { size: 0, entries: [], queueLength: 0 }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCanvasThumbnails.mockReturnValue(defaultMocks);
  });

  describe('Rendering', () => {
    it('should render thumbnail when available', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="md"
        />
      );

      const img = screen.getByAltText('Canvas canvas1 thumbnail');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockThumbnail.dataUrl);
    });

    it('should render loading state', () => {
      defaultMocks.isThumbnailLoading.mockReturnValue(true);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="md"
        />
      );

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render queue state', () => {
      defaultMocks.isInQueue.mockReturnValue(true);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="md"
        />
      );

      expect(screen.getByText('Queued')).toBeInTheDocument();
    });

    it('should render error state', () => {
      defaultMocks.getThumbnailError.mockReturnValue('Generation failed');

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="md"
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should render placeholder state', () => {
      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="md"
        />
      );

      expect(screen.getByText('No thumbnail')).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('should render small size', () => {
      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="sm"
        />
      );

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('w-16', 'h-12');
    });

    it('should render medium size', () => {
      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="md"
        />
      );

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('w-24', 'h-18');
    });

    it('should render large size', () => {
      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="lg"
        />
      );

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('w-32', 'h-24');
    });

    it('should render extra large size', () => {
      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          size="xl"
        />
      );

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('w-48', 'h-36');
    });
  });

  describe('Actions', () => {
    it('should show action buttons on hover', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          showActions={true}
        />
      );

      const container = screen.getByRole('img').closest('div');
      fireEvent.mouseEnter(container!);

      expect(screen.getByTitle('Refresh thumbnail')).toBeInTheDocument();
      expect(screen.getByTitle('Download thumbnail')).toBeInTheDocument();
    });

    it('should generate thumbnail when generate button clicked', async () => {
      defaultMocks.generateThumbnail.mockResolvedValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          showActions={true}
        />
      );

      const generateButton = screen.getByTitle('Generate thumbnail');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(defaultMocks.generateThumbnail).toHaveBeenCalledWith(
          'canvas1',
          'project1',
          {}
        );
      });
    });

    it('should refresh thumbnail when refresh button clicked', async () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);
      defaultMocks.refreshThumbnail.mockResolvedValue(undefined);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          showActions={true}
        />
      );

      const container = screen.getByRole('img').closest('div');
      fireEvent.mouseEnter(container!);

      const refreshButton = screen.getByTitle('Refresh thumbnail');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(defaultMocks.refreshThumbnail).toHaveBeenCalledWith(
          'canvas1',
          'project1',
          {}
        );
      });
    });

    it('should download thumbnail when download button clicked', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          showActions={true}
        />
      );

      const container = screen.getByRole('img').closest('div');
      fireEvent.mouseEnter(container!);

      const downloadButton = screen.getByTitle('Download thumbnail');
      fireEvent.click(downloadButton);

      expect(defaultMocks.downloadThumbnail).toHaveBeenCalledWith(
        'canvas1',
        'project1',
        'canvas_canvas1_thumbnail.png'
      );
    });

    it('should not show actions when showActions is false', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          showActions={false}
        />
      );

      const container = screen.getByRole('img').closest('div');
      fireEvent.mouseEnter(container!);

      expect(screen.queryByTitle('Refresh thumbnail')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Download thumbnail')).not.toBeInTheDocument();
    });
  });

  describe('Metadata display', () => {
    it('should show metadata when showMetadata is true', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);
      defaultMocks.getThumbnailMetadata.mockReturnValue({
        shapeCount: 5,
        lastModified: Date.now(),
        generatedFrom: 'shapes'
      });

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          showMetadata={true}
        />
      );

      expect(screen.getByText('Shapes: 5')).toBeInTheDocument();
      expect(screen.getByText('Source: shapes')).toBeInTheDocument();
    });

    it('should not show metadata when showMetadata is false', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          showMetadata={false}
        />
      );

      expect(screen.queryByText('Shapes: 5')).not.toBeInTheDocument();
    });
  });

  describe('Auto-generation', () => {
    it('should auto-generate thumbnail when autoGenerate is true', async () => {
      defaultMocks.generateThumbnail.mockResolvedValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          autoGenerate={true}
        />
      );

      await waitFor(() => {
        expect(defaultMocks.generateThumbnail).toHaveBeenCalledWith(
          'canvas1',
          'project1',
          {}
        );
      });
    });

    it('should not auto-generate when autoGenerate is false', () => {
      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          autoGenerate={false}
        />
      );

      expect(defaultMocks.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should not auto-generate when thumbnail already exists', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          autoGenerate={true}
        />
      );

      expect(defaultMocks.generateThumbnail).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('should call onThumbnailGenerated when thumbnail is generated', async () => {
      const onThumbnailGenerated = jest.fn();
      defaultMocks.generateThumbnail.mockResolvedValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          onThumbnailGenerated={onThumbnailGenerated}
        />
      );

      await waitFor(() => {
        expect(onThumbnailGenerated).toHaveBeenCalledWith(mockThumbnail);
      });
    });

    it('should call onThumbnailError when generation fails', async () => {
      const onThumbnailError = jest.fn();
      const error = new Error('Generation failed');
      defaultMocks.generateThumbnail.mockRejectedValue(error);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
          onThumbnailError={onThumbnailError}
        />
      );

      await waitFor(() => {
        expect(onThumbnailError).toHaveBeenCalledWith('Generation failed');
      });
    });
  });

  describe('Status indicators', () => {
    it('should show loading indicator when loading', () => {
      defaultMocks.isThumbnailLoading.mockReturnValue(true);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
        />
      );

      expect(screen.getByTitle('Generating')).toBeInTheDocument();
    });

    it('should show queue indicator when in queue', () => {
      defaultMocks.isInQueue.mockReturnValue(true);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
        />
      );

      expect(screen.getByTitle('In queue')).toBeInTheDocument();
    });

    it('should show error indicator when error exists', () => {
      defaultMocks.getThumbnailError.mockReturnValue('Error message');

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
        />
      );

      expect(screen.getByTitle('Error')).toBeInTheDocument();
    });

    it('should show ready indicator when thumbnail is ready', () => {
      defaultMocks.getThumbnail.mockReturnValue(mockThumbnail);

      render(
        <ThumbnailPreview
          canvasId="canvas1"
          projectId="project1"
        />
      );

      expect(screen.getByTitle('Ready')).toBeInTheDocument();
    });
  });
});

describe('ThumbnailGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCanvasThumbnails.mockReturnValue({
      getThumbnail: jest.fn(),
      generateThumbnail: jest.fn(),
      generateFromKonvaStage: jest.fn(),
      queueThumbnailGeneration: jest.fn(),
      isThumbnailLoading: jest.fn(),
      getThumbnailError: jest.fn(),
      isInQueue: jest.fn(),
      generateMultipleThumbnails: jest.fn(),
      generateAllProjectThumbnails: jest.fn(),
      clearCache: jest.fn(),
      invalidateThumbnail: jest.fn(),
      refreshThumbnail: jest.fn(),
      getThumbnailDataUrl: jest.fn(),
      downloadThumbnail: jest.fn(),
      getThumbnailSize: jest.fn(),
      getThumbnailMetadata: jest.fn(),
      state: {
        thumbnails: new Map(),
        loading: new Set(),
        errors: new Map(),
        generationQueue: [],
        isProcessingQueue: false,
        cacheStats: { size: 0, entries: [], queueLength: 0 }
      }
    });
  });

  it('should render grid of thumbnails', () => {
    const canvasIds = ['canvas1', 'canvas2', 'canvas3'];

    render(
      <ThumbnailGrid
        projectId="project1"
        canvasIds={canvasIds}
        size="md"
      />
    );

    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('should apply correct grid classes', () => {
    const canvasIds = ['canvas1', 'canvas2'];

    render(
      <ThumbnailGrid
        projectId="project1"
        canvasIds={canvasIds}
        size="lg"
      />
    );

    const grid = screen.getByRole('img').closest('div')?.parentElement;
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6');
  });
});

describe('ThumbnailList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCanvasThumbnails.mockReturnValue({
      getThumbnail: jest.fn(),
      generateThumbnail: jest.fn(),
      generateFromKonvaStage: jest.fn(),
      queueThumbnailGeneration: jest.fn(),
      isThumbnailLoading: jest.fn(),
      getThumbnailError: jest.fn(),
      isInQueue: jest.fn(),
      generateMultipleThumbnails: jest.fn(),
      generateAllProjectThumbnails: jest.fn(),
      clearCache: jest.fn(),
      invalidateThumbnail: jest.fn(),
      refreshThumbnail: jest.fn(),
      getThumbnailDataUrl: jest.fn(),
      downloadThumbnail: jest.fn(),
      getThumbnailSize: jest.fn(),
      getThumbnailMetadata: jest.fn(),
      state: {
        thumbnails: new Map(),
        loading: new Set(),
        errors: new Map(),
        generationQueue: [],
        isProcessingQueue: false,
        cacheStats: { size: 0, entries: [], queueLength: 0 }
      }
    });
  });

  it('should render list of thumbnails', () => {
    const canvasIds = ['canvas1', 'canvas2'];

    render(
      <ThumbnailList
        projectId="project1"
        canvasIds={canvasIds}
      />
    );

    expect(screen.getAllByText(/Canvas canvas\d/)).toHaveLength(2);
  });

  it('should show metadata when enabled', () => {
    const canvasIds = ['canvas1'];

    render(
      <ThumbnailList
        projectId="project1"
        canvasIds={canvasIds}
        showMetadata={true}
      />
    );

    // Metadata section should be present
    const metadataSection = screen.getByText('Canvas canvas1').closest('div')?.querySelector('.text-xs');
    expect(metadataSection).toBeInTheDocument();
  });
});
