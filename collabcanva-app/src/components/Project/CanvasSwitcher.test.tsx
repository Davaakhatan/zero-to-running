// Unit tests for CanvasSwitcher component
// Tests for canvas switching functionality

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasSwitcher, CanvasBreadcrumb, CanvasInfo } from './CanvasSwitcher';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { ProjectCanvas } from "../../types"

// Mock dependencies
jest.mock('../../contexts/ProjectCanvasContext');
jest.mock('../../hooks/usePermissions');

const mockUseProjectCanvas = useProjectCanvas as jest.MockedFunction<typeof useProjectCanvas>;
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

describe('CanvasSwitcher', () => {
  const mockProjectId = 'project1';
  const mockCurrentCanvasId = 'canvas1';

  const mockCanvases: ProjectCanvas[] = [
    {
      id: 'canvas1',
      projectId: 'project1',
      name: 'Test Canvas 1',
      description: 'First test canvas',
      width: 1920,
      height: 1080,
      backgroundColor: '#ffffff',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      createdBy: 'user1',
      isArchived: false,
      order: 0
    },
    {
      id: 'canvas2',
      projectId: 'project1',
      name: 'Test Canvas 2',
      description: 'Second test canvas',
      width: 1280,
      height: 720,
      backgroundColor: '#f0f0f0',
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-04'),
      createdBy: 'user1',
      isArchived: false,
      order: 1
    },
    {
      id: 'canvas3',
      projectId: 'project1',
      name: 'Archived Canvas',
      description: 'An archived canvas',
      width: 800,
      height: 600,
      backgroundColor: '#e0e0e0',
      createdAt: new Date('2023-01-05'),
      updatedAt: new Date('2023-01-06'),
      createdBy: 'user1',
      isArchived: true,
      order: 2
    }
  ];

  const defaultMocks = {
    projectCanvases: mockCanvases,
    canEdit: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseProjectCanvas.mockReturnValue({
      projectCanvases: defaultMocks.projectCanvases,
      // ... other required properties
    } as any);

    mockUsePermissions.mockReturnValue({
      canEdit: defaultMocks.canEdit,
      // ... other required properties
    } as any);
  });

  describe('Dropdown Variant', () => {
    it('should render dropdown switcher', () => {
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      expect(screen.getByText('Test Canvas 1')).toBeInTheDocument();
    });

    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      expect(screen.getByPlaceholderText('Search canvases...')).toBeInTheDocument();
      expect(screen.getByText('Test Canvas 2')).toBeInTheDocument();
      expect(screen.getByText('Archived Canvas')).toBeInTheDocument();
    });

    it('should filter canvases based on search query', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      const searchInput = screen.getByPlaceholderText('Search canvases...');
      await user.type(searchInput, 'Canvas 2');

      expect(screen.getByText('Test Canvas 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Canvas 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Archived Canvas')).not.toBeInTheDocument();
    });

    it('should select canvas when clicked', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      const canvas2Button = screen.getByText('Test Canvas 2');
      await user.click(canvas2Button);

      expect(mockOnCanvasSelect).toHaveBeenCalledWith('canvas2');
    });

    it('should close dropdown when canvas is selected', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      expect(screen.getByPlaceholderText('Search canvases...')).toBeInTheDocument();

      const canvas2Button = screen.getByText('Test Canvas 2');
      await user.click(canvas2Button);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search canvases...')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when escape key is pressed', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      expect(screen.getByPlaceholderText('Search canvases...')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search canvases...')).not.toBeInTheDocument();
      });
    });

    it('should show archived indicator for archived canvases', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('should show canvas dimensions', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      expect(screen.getByText('1920×1080')).toBeInTheDocument();
      expect(screen.getByText('1280×720')).toBeInTheDocument();
    });
  });

  describe('Tabs Variant', () => {
    it('should render tabs switcher', () => {
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="tabs"
        />
      );

      expect(screen.getByText('Test Canvas 1')).toBeInTheDocument();
      expect(screen.getByText('Test Canvas 2')).toBeInTheDocument();
      expect(screen.getByText('Archived Canvas')).toBeInTheDocument();
    });

    it('should highlight current canvas tab', () => {
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="tabs"
        />
      );

      const currentTab = screen.getByText('Test Canvas 1');
      expect(currentTab).toHaveClass('border-blue-500');
    });

    it('should select canvas when tab is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="tabs"
        />
      );

      const canvas2Tab = screen.getByText('Test Canvas 2');
      await user.click(canvas2Tab);

      expect(mockOnCanvasSelect).toHaveBeenCalledWith('canvas2');
    });
  });

  describe('Compact Variant', () => {
    it('should render compact switcher', () => {
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="compact"
        />
      );

      expect(screen.getByText('Canvas:')).toBeInTheDocument();
      expect(screen.getByText('Test Canvas 1')).toBeInTheDocument();
    });

    it('should open compact dropdown when clicked', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="compact"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Test Canvas 2')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show no canvases message when no canvases exist', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      mockUseProjectCanvas.mockReturnValue({
        projectCanvases: [],
        // ... other required properties
      } as any);

      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Select Canvas');
      await user.click(dropdownButton);

      expect(screen.getByText('No canvases available')).toBeInTheDocument();
    });

    it('should show no results message when search yields no results', async () => {
      const user = userEvent.setup();
      const mockOnCanvasSelect = jest.fn();
      
      render(
        <CanvasSwitcher
          projectId={mockProjectId}
          currentCanvasId={mockCurrentCanvasId}
          onCanvasSelect={mockOnCanvasSelect}
          variant="dropdown"
        />
      );

      const dropdownButton = screen.getByText('Test Canvas 1');
      await user.click(dropdownButton);

      const searchInput = screen.getByPlaceholderText('Search canvases...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No canvases found')).toBeInTheDocument();
    });
  });
});

describe('CanvasBreadcrumb', () => {
  it('should render breadcrumb with project and canvas names', () => {
    render(
      <CanvasBreadcrumb
        projectName="Test Project"
        canvasName="Test Canvas"
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Canvas')).toBeInTheDocument();
  });

  it('should call onProjectClick when project name is clicked', async () => {
    const user = userEvent.setup();
    const mockOnProjectClick = jest.fn();
    
    render(
      <CanvasBreadcrumb
        projectName="Test Project"
        canvasName="Test Canvas"
        onProjectClick={mockOnProjectClick}
      />
    );

    const projectButton = screen.getByText('Test Project');
    await user.click(projectButton);

    expect(mockOnProjectClick).toHaveBeenCalled();
  });

  it('should show default names when not provided', () => {
    render(
      <CanvasBreadcrumb />
    );

    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Canvas')).toBeInTheDocument();
  });
});

describe('CanvasInfo', () => {
  const mockCanvas: ProjectCanvas = {
    id: 'canvas1',
    projectId: 'project1',
    name: 'Test Canvas',
    description: 'A test canvas',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02T10:30:00Z'),
    createdBy: 'user1',
    isArchived: false,
    order: 0
  };

  it('should render canvas information', () => {
    render(
      <CanvasInfo canvas={mockCanvas} />
    );

    expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('should show archived indicator for archived canvas', () => {
    const archivedCanvas = { ...mockCanvas, isArchived: true };
    
    render(
      <CanvasInfo canvas={archivedCanvas} />
    );

    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should not render when canvas is not provided', () => {
    const { container } = render(
      <CanvasInfo />
    );

    expect(container.firstChild).toBeNull();
  });
});
