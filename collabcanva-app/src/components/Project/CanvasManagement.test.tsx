// Unit tests for CanvasManagement component
// Tests for canvas management functionality within projects

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasManagement } from './CanvasManagement';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';
import { useProjects } from '../../hooks/useProjects';
import { usePermissions } from '../../hooks/usePermissions';
import type { ProjectCanvas } from "../../types"

// Mock dependencies
jest.mock('../../contexts/ProjectCanvasContext');
jest.mock('../../hooks/useProjects');
jest.mock('../../hooks/usePermissions');

const mockUseProjectCanvas = useProjectCanvas as jest.MockedFunction<typeof useProjectCanvas>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

describe('CanvasManagement', () => {
  const mockProjectId = 'project1';
  const mockCurrentCanvasId = 'canvas1';

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

  const mockArchivedCanvas: ProjectCanvas = {
    ...mockCanvas,
    id: 'canvas2',
    name: 'Archived Canvas',
    isArchived: true
  };

  const mockProject = {
    id: 'project1',
    name: 'Test Project',
    ownerId: 'user1',
    members: []
  };

  const defaultMocks = {
    projectCanvases: [mockCanvas, mockArchivedCanvas],
    createCanvas: jest.fn(),
    updateCanvas: jest.fn(),
    deleteCanvas: jest.fn(),
    duplicateCanvas: jest.fn(),
    currentProject: mockProject,
    canEdit: true,
    canDelete: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseProjectCanvas.mockReturnValue({
      projectCanvases: defaultMocks.projectCanvases,
      createCanvas: defaultMocks.createCanvas,
      updateCanvas: defaultMocks.updateCanvas,
      deleteCanvas: defaultMocks.deleteCanvas,
      duplicateCanvas: defaultMocks.duplicateCanvas,
      // ... other required properties
    } as any);

    mockUseProjects.mockReturnValue({
      currentProject: defaultMocks.currentProject,
      // ... other required properties
    } as any);

    mockUsePermissions.mockReturnValue({
      canEdit: defaultMocks.canEdit,
      canDelete: defaultMocks.canDelete,
      // ... other required properties
    } as any);
  });

  describe('Rendering', () => {
    it('should render canvas management interface', () => {
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      expect(screen.getByText('Canvases')).toBeInTheDocument();
      expect(screen.getByText('1 active canvas, 1 archived')).toBeInTheDocument();
      expect(screen.getByText('New Canvas')).toBeInTheDocument();
    });

    it('should display active canvases', () => {
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      expect(screen.getByText('A test canvas')).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    });

    it('should display archived canvases section', () => {
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      expect(screen.getByText('Archived Canvases')).toBeInTheDocument();
      expect(screen.getByText('Archived Canvas')).toBeInTheDocument();
    });

    it('should show empty state when no canvases exist', () => {
      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [],
        createCanvas: jest.fn(),
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
        />
      );

      expect(screen.getByText('No canvases')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating a new canvas.')).toBeInTheDocument();
      expect(screen.getByText('Create Canvas')).toBeInTheDocument();
    });

    it('should hide create button when user cannot edit', () => {
      mockUsePermissions.mockReturnValue({
        canEdit: false,
        canDelete: false,
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
        />
      );

      expect(screen.queryByText('New Canvas')).not.toBeInTheDocument();
    });
  });

  describe('Canvas Selection', () => {
    it('should call onCanvasSelect when canvas is clicked', async () => {
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
        />
      );

      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.click(canvasCard!);

      expect(mockOnCanvasSelect).toHaveBeenCalledWith('canvas1');
    });

    it('should highlight selected canvas', () => {
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      const selectedCanvas = screen.getByText('Test Canvas').closest('div');
      expect(selectedCanvas).toHaveClass('border-blue-500');
    });
  });

  describe('Create Canvas', () => {
    it('should open create modal when New Canvas button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
        />
      );

      await user.click(screen.getByText('New Canvas'));

      expect(screen.getByText('Create New Canvas')).toBeInTheDocument();
      expect(screen.getByLabelText('Canvas Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
    });

    it('should create canvas when form is submitted', async () => {
      const user = userEvent.setup();
      const mockCreateCanvas = jest.fn().mockResolvedValue({
        id: 'newCanvasId',
        name: 'New Canvas',
        description: 'New description'
      });

      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [mockCanvas],
        createCanvas: mockCreateCanvas,
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
          onCanvasSelect={mockOnCanvasSelect}
        />
      );

      await user.click(screen.getByText('New Canvas'));
      await user.type(screen.getByLabelText('Canvas Name *'), 'New Canvas');
      await user.type(screen.getByLabelText('Description (optional)'), 'New description');
      await user.click(screen.getByText('Create Canvas'));

      await waitFor(() => {
        expect(mockCreateCanvas).toHaveBeenCalledWith('New Canvas', 'New description');
        expect(mockOnCanvasSelect).toHaveBeenCalledWith('newCanvasId');
      });
    });

    it('should handle create canvas error', async () => {
      const user = userEvent.setup();
      const mockCreateCanvas = jest.fn().mockRejectedValue(new Error('Create failed'));

      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [mockCanvas],
        createCanvas: mockCreateCanvas,
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
        />
      );

      await user.click(screen.getByText('New Canvas'));
      await user.type(screen.getByLabelText('Canvas Name *'), 'New Canvas');
      await user.click(screen.getByText('Create Canvas'));

      await waitFor(() => {
        expect(screen.getByText('Create failed')).toBeInTheDocument();
      });
    });
  });

  describe('Rename Canvas', () => {
    it('should open rename modal when rename button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      // Hover over canvas to show action buttons
      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

      await waitFor(() => {
        const renameButton = screen.getByTitle('Rename canvas');
        expect(renameButton).toBeInTheDocument();
      });

      const renameButton = screen.getByTitle('Rename canvas');
      await user.click(renameButton);

      expect(screen.getByText('Rename Canvas')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Canvas')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test canvas')).toBeInTheDocument();
    });

    it('should rename canvas when form is submitted', async () => {
      const user = userEvent.setup();
      const mockUpdateCanvas = jest.fn().mockResolvedValue(undefined);

      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [mockCanvas],
        createCanvas: jest.fn(),
        updateCanvas: mockUpdateCanvas,
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      // Open rename modal
      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

      await waitFor(() => {
        const renameButton = screen.getByTitle('Rename canvas');
        expect(renameButton).toBeInTheDocument();
      });

      const renameButton = screen.getByTitle('Rename canvas');
      await user.click(renameButton);

      // Update form
      const nameInput = screen.getByDisplayValue('Test Canvas');
      await user.clear(nameInput);
      await user.type(nameInput, 'Renamed Canvas');

      const descriptionInput = screen.getByDisplayValue('A test canvas');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Renamed description');

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockUpdateCanvas).toHaveBeenCalledWith('canvas1', {
          name: 'Renamed Canvas',
          description: 'Renamed description'
        });
      });
    });
  });

  describe('Duplicate Canvas', () => {
    it('should duplicate canvas when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      const mockDuplicateCanvas = jest.fn().mockResolvedValue({
        id: 'duplicatedCanvasId',
        name: 'Test Canvas (Copy)'
      });

      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [mockCanvas],
        createCanvas: jest.fn(),
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: mockDuplicateCanvas,
        // ... other required properties
      } as any);

      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
        />
      );

      // Hover over canvas to show action buttons
      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

      await waitFor(() => {
        const duplicateButton = screen.getByTitle('Duplicate canvas');
        expect(duplicateButton).toBeInTheDocument();
      });

      const duplicateButton = screen.getByTitle('Duplicate canvas');
      await user.click(duplicateButton);

      await waitFor(() => {
        expect(mockDuplicateCanvas).toHaveBeenCalledWith('canvas1');
        expect(mockOnCanvasSelect).toHaveBeenCalledWith('duplicatedCanvasId');
      });
    });
  });

  describe('Delete Canvas', () => {
    it('should open delete modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      // Hover over canvas to show action buttons
      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

      await waitFor(() => {
        const deleteButton = screen.getByTitle('Delete canvas');
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete canvas');
      await user.click(deleteButton);

      expect(screen.getByText('Delete Canvas')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete "Test Canvas"?')).toBeInTheDocument();
    });

    it('should delete canvas when confirmed', async () => {
      const user = userEvent.setup();
      const mockDeleteCanvas = jest.fn().mockResolvedValue(undefined);

      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [mockCanvas],
        createCanvas: jest.fn(),
        updateCanvas: jest.fn(),
        deleteCanvas: mockDeleteCanvas,
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      // Open delete modal
      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

      await waitFor(() => {
        const deleteButton = screen.getByTitle('Delete canvas');
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete canvas');
      await user.click(deleteButton);

      // Confirm deletion
      await user.click(screen.getByText('Delete Canvas'));

      await waitFor(() => {
        expect(mockDeleteCanvas).toHaveBeenCalledWith('canvas1');
      });
    });

    it('should handle delete canvas error', async () => {
      const user = userEvent.setup();
      const mockDeleteCanvas = jest.fn().mockRejectedValue(new Error('Delete failed'));

      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [mockCanvas],
        createCanvas: jest.fn(),
        updateCanvas: jest.fn(),
        deleteCanvas: mockDeleteCanvas,
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      // Open delete modal
      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

      await waitFor(() => {
        const deleteButton = screen.getByTitle('Delete canvas');
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete canvas');
      await user.click(deleteButton);

      // Confirm deletion
      await user.click(screen.getByText('Delete Canvas'));

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    });
  });

  describe('Permission Handling', () => {
    it('should hide action buttons when user cannot edit', () => {
      mockUsePermissions.mockReturnValue({
        canEdit: false,
        canDelete: false,
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

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
        <CanvasManagement
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
        />
      );

      const canvasCard = screen.getByText('Test Canvas').closest('div');
      fireEvent.mouseEnter(canvasCard!);

      expect(screen.queryByTitle('Delete canvas')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during operations', async () => {
      const user = userEvent.setup();
      const mockCreateCanvas = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [mockCanvas],
        createCanvas: mockCreateCanvas,
        updateCanvas: jest.fn(),
        deleteCanvas: jest.fn(),
        duplicateCanvas: jest.fn(),
        // ... other required properties
      } as any);

      render(
        <CanvasManagement
          projectId={mockProjectId}
        />
      );

      await user.click(screen.getByText('New Canvas'));
      await user.type(screen.getByLabelText('Canvas Name *'), 'New Canvas');
      await user.click(screen.getByText('Create Canvas'));

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
        />
      );

      await user.click(screen.getByText('New Canvas'));
      expect(screen.getByText('Create New Canvas')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Create New Canvas')).not.toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CanvasManagement
          projectId={mockProjectId}
        />
      );

      await user.click(screen.getByText('New Canvas'));
      expect(screen.getByText('Create New Canvas')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      expect(screen.queryByText('Create New Canvas')).not.toBeInTheDocument();
    });
  });
});
