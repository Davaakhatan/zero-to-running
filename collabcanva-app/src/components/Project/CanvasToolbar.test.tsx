// Unit tests for CanvasToolbar component
// Tests for canvas toolbar functionality

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasToolbar, CanvasStatusIndicator } from './CanvasToolbar';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { ProjectCanvas } from "../../types"

// Mock dependencies
jest.mock('../../contexts/ProjectCanvasContext');
jest.mock('../../hooks/usePermissions');

const mockUseProjectCanvas = useProjectCanvas as jest.MockedFunction<typeof useProjectCanvas>;
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

describe('CanvasToolbar', () => {
  const mockProjectId = 'project1';

  const mockCanvas: ProjectCanvas = {
    id: 'canvas1',
    projectId: 'project1',
    name: 'Test Canvas',
    description: 'A test canvas',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    createdBy: 'user1',
    isArchived: false,
    order: 0
  };

  const defaultMocks = {
    createCanvas: jest.fn(),
    updateCanvas: jest.fn(),
    deleteCanvas: jest.fn(),
    duplicateCanvas: jest.fn(),
    canEdit: true,
    canDelete: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseProjectCanvas.mockReturnValue({
      createCanvas: defaultMocks.createCanvas,
      updateCanvas: defaultMocks.updateCanvas,
      deleteCanvas: defaultMocks.deleteCanvas,
      duplicateCanvas: defaultMocks.duplicateCanvas,
      // ... other required properties
    } as any);

    mockUsePermissions.mockReturnValue({
      canEdit: defaultMocks.canEdit,
      canDelete: defaultMocks.canDelete,
      // ... other required properties
    } as any);
  });

  describe('Horizontal Variant', () => {
    it('should render horizontal toolbar', () => {
      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="horizontal"
        />
      );

      expect(screen.getByTitle('Create new canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Rename canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Duplicate canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Delete canvas')).toBeInTheDocument();
    });

    it('should create canvas when create button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateCanvas = jest.fn().mockResolvedValue({
        id: 'newCanvasId',
        name: 'New Canvas'
      });

      mockUseProjectCanvas.mockReturnValue({
        createCanvas: mockCreateCanvas,
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          variant="horizontal"
        />
      );

      const createButton = screen.getByTitle('Create new canvas');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockCreateCanvas).toHaveBeenCalledWith('New Canvas', 'A new canvas');
      });
    });

    it('should duplicate canvas when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      const mockDuplicateCanvas = jest.fn().mockResolvedValue({
        id: 'duplicatedCanvasId',
        name: 'Test Canvas (Copy)'
      });

      mockUseProjectCanvas.mockReturnValue({
        createCanvas: jest.fn(),
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: mockDuplicateCanvas,
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="horizontal"
        />
      );

      const duplicateButton = screen.getByTitle('Duplicate canvas');
      await user.click(duplicateButton);

      await waitFor(() => {
        expect(mockDuplicateCanvas).toHaveBeenCalledWith('canvas1');
      });
    });

    it('should delete canvas when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      const mockDeleteCanvas = jest.fn().mockResolvedValue(undefined);
      mockConfirm.mockReturnValue(true);

      mockUseProjectCanvas.mockReturnValue({
        createCanvas: jest.fn(),
        updateCanvas: jest.fn(),
        deleteCanvas: mockDeleteCanvas,
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="horizontal"
        />
      );

      const deleteButton = screen.getByTitle('Delete canvas');
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Canvas"? This action cannot be undone.'
      );

      await waitFor(() => {
        expect(mockDeleteCanvas).toHaveBeenCalledWith('canvas1');
      });
    });

    it('should not delete canvas when delete is cancelled', async () => {
      const user = userEvent.setup();
      const mockDeleteCanvas = jest.fn();
      mockConfirm.mockReturnValue(false);

      mockUseProjectCanvas.mockReturnValue({
        createCanvas: jest.fn(),
        updateCanvas: jest.fn(),
        deleteCanvas: mockDeleteCanvas,
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="horizontal"
        />
      );

      const deleteButton = screen.getByTitle('Delete canvas');
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteCanvas).not.toHaveBeenCalled();
    });

    it('should handle create canvas error', async () => {
      const user = userEvent.setup();
      const mockCreateCanvas = jest.fn().mockRejectedValue(new Error('Create failed'));

      mockUseProjectCanvas.mockReturnValue({
        createCanvas: mockCreateCanvas,
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          variant="horizontal"
        />
      );

      const createButton = screen.getByTitle('Create new canvas');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create failed')).toBeInTheDocument();
      });
    });
  });

  describe('Vertical Variant', () => {
    it('should render vertical toolbar', () => {
      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="vertical"
        />
      );

      expect(screen.getByTitle('Create new canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Rename canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Duplicate canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Delete canvas')).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('should render compact toolbar', () => {
      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="compact"
        />
      );

      expect(screen.getByTitle('Create new canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Rename canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Duplicate canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Delete canvas')).toBeInTheDocument();
    });
  });

  describe('Permission Handling', () => {
    it('should hide create button when user cannot edit', () => {
      mockUsePermissions.mockReturnValue({
        canEdit: false,
        canDelete: false,
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="horizontal"
        />
      );

      expect(screen.queryByTitle('Create new canvas')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Rename canvas')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Duplicate canvas')).not.toBeInTheDocument();
    });

    it('should hide delete button when user cannot delete', () => {
      mockUsePermissions.mockReturnValue({
        canEdit: true,
        canDelete: false,
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="horizontal"
        />
      );

      expect(screen.queryByTitle('Delete canvas')).not.toBeInTheDocument();
    });

    it('should show only create button when no current canvas', () => {
      render(
        <CanvasToolbar
          projectId={mockProjectId}
          variant="horizontal"
        />
      );

      expect(screen.getByTitle('Create new canvas')).toBeInTheDocument();
      expect(screen.queryByTitle('Rename canvas')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Duplicate canvas')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete canvas')).not.toBeInTheDocument();
    });
  });

  describe('Custom Handlers', () => {
    it('should call custom create handler when provided', async () => {
      const user = userEvent.setup();
      const mockOnCanvasCreate = jest.fn();

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          onCanvasCreate={mockOnCanvasCreate}
          variant="horizontal"
        />
      );

      const createButton = screen.getByTitle('Create new canvas');
      await user.click(createButton);

      expect(mockOnCanvasCreate).toHaveBeenCalled();
    });

    it('should call custom rename handler when provided', async () => {
      const user = userEvent.setup();
      const mockOnCanvasRename = jest.fn();

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          onCanvasRename={mockOnCanvasRename}
          variant="horizontal"
        />
      );

      const renameButton = screen.getByTitle('Rename canvas');
      await user.click(renameButton);

      expect(mockOnCanvasRename).toHaveBeenCalled();
    });

    it('should call custom duplicate handler when provided', async () => {
      const user = userEvent.setup();
      const mockOnCanvasDuplicate = jest.fn();

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          onCanvasDuplicate={mockOnCanvasDuplicate}
          variant="horizontal"
        />
      );

      const duplicateButton = screen.getByTitle('Duplicate canvas');
      await user.click(duplicateButton);

      expect(mockOnCanvasDuplicate).toHaveBeenCalled();
    });

    it('should call custom delete handler when provided', async () => {
      const user = userEvent.setup();
      const mockOnCanvasDelete = jest.fn();

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          onCanvasDelete={mockOnCanvasDelete}
          variant="horizontal"
        />
      );

      const deleteButton = screen.getByTitle('Delete canvas');
      await user.click(deleteButton);

      expect(mockOnCanvasDelete).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during loading', async () => {
      const user = userEvent.setup();
      const mockCreateCanvas = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      mockUseProjectCanvas.mockReturnValue({
        createCanvas: mockCreateCanvas,
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasToolbar
          projectId={mockProjectId}
          currentCanvas={mockCanvas}
          variant="horizontal"
        />
      );

      const createButton = screen.getByTitle('Create new canvas');
      await user.click(createButton);

      expect(createButton).toBeDisabled();
    });
  });
});

describe('CanvasStatusIndicator', () => {
  const mockCanvas: ProjectCanvas = {
    id: 'canvas1',
    projectId: 'project1',
    name: 'Test Canvas',
    description: 'A test canvas',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    createdBy: 'user1',
    isArchived: false,
    order: 0
  };

  it('should render active status for active canvas', () => {
    render(
      <CanvasStatusIndicator canvas={mockCanvas} />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render archived status for archived canvas', () => {
    const archivedCanvas = { ...mockCanvas, isArchived: true };
    
    render(
      <CanvasStatusIndicator canvas={archivedCanvas} />
    );

    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should not render when canvas is not provided', () => {
    const { container } = render(
      <CanvasStatusIndicator />
    );

    expect(container.firstChild).toBeNull();
  });
});
