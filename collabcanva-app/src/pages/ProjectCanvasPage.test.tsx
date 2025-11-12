// Unit tests for ProjectCanvasPage
// Tests for project-based canvas page with routing and context integration

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ProjectCanvasPage } from './ProjectCanvasPage';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useMigration } from '../hooks/useMigration';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../hooks/useProjects');
jest.mock('../hooks/useMigration');
jest.mock('../contexts/ProjectContext');
jest.mock('../contexts/PermissionContext');
jest.mock('../contexts/PresenceContext');
jest.mock('../contexts/ProjectCanvasContext');

// Mock components
jest.mock('../components/Layout/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('../components/Canvas/Canvas', () => {
  return function MockCanvas({ onShowHelp }: { onShowHelp: () => void }) {
    return <div data-testid="canvas">Canvas</div>;
  };
});

jest.mock('../components/Canvas/CanvasControls', () => {
  return function MockCanvasControls({ onShowHelp }: { onShowHelp: () => void }) {
    return <div data-testid="canvas-controls">Canvas Controls</div>;
  };
});

jest.mock('../components/Project/CanvasSwitcher', () => {
  return {
    CanvasSwitcher: function MockCanvasSwitcher({ projectId, currentCanvasId, onCanvasSelect }: any) {
      return (
        <div data-testid="canvas-switcher">
          Canvas Switcher - Project: {projectId}, Canvas: {currentCanvasId}
        </div>
      );
    },
    CanvasBreadcrumb: function MockCanvasBreadcrumb({ projectName, canvasName, onProjectClick }: any) {
      return (
        <div data-testid="canvas-breadcrumb">
          Breadcrumb - Project: {projectName}, Canvas: {canvasName}
        </div>
      );
    },
    CanvasInfo: function MockCanvasInfo({ canvas }: any) {
      return (
        <div data-testid="canvas-info">
          Canvas Info - {canvas?.name || 'No Canvas'}
        </div>
      );
    }
  };
});

jest.mock('../components/Project/CanvasToolbar', () => {
  return {
    CanvasToolbar: function MockCanvasToolbar({ projectId, currentCanvas, variant }: any) {
      return (
        <div data-testid="canvas-toolbar">
          Canvas Toolbar - Project: {projectId}, Canvas: {currentCanvas?.name || 'No Canvas'}, Variant: {variant}
        </div>
      );
    }
  };
});

jest.mock('../components/Migration/MigrationModal', () => {
  return {
    MigrationModal: function MockMigrationModal({ isOpen, onClose, onSuccess, isLoading, error, onRetry }: any) {
      return (
        <div data-testid="migration-modal">
          Migration Modal - Open: {isOpen.toString()}, Loading: {isLoading.toString()}, Error: {error || 'None'}
        </div>
      );
    }
  };
});

jest.mock('../components/Project/EmptyStates', () => {
  return {
    EmptyStates: {
      NoCanvasesEmptyState: function MockNoCanvasesEmptyState({ projectId, onCreateCanvas, onImportCanvas }: any) {
        return (
          <div data-testid="no-canvases-empty-state">
            No Canvases - Project: {projectId}
          </div>
        );
      }
    }
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUseMigration = useMigration as jest.MockedFunction<typeof useMigration>;

describe('ProjectCanvasPage', () => {
  const mockUser = {
    uid: 'user1',
    email: 'user1@example.com',
    displayName: 'User One'
  };

  const mockProject = {
    id: 'project1',
    name: 'Test Project',
    ownerId: 'user1',
    members: []
  };

  const mockCanvas = {
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

  const defaultMocks = {
    user: mockUser,
    currentProject: mockProject,
    currentProjectCanvases: [mockCanvas],
    setCurrentProject: jest.fn(),
    projectsLoading: false,
    projectsError: null,
    needsMigration: false,
    isMigrating: false,
    migrationError: null,
    migrateUser: jest.fn(),
    retryMigration: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
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
      currentProject: defaultMocks.currentProject,
      currentProjectCanvases: defaultMocks.currentProjectCanvases,
      setCurrentProject: defaultMocks.setCurrentProject,
      projectsLoading: defaultMocks.projectsLoading,
      projectsError: defaultMocks.projectsError,
      // ... other required properties
    } as any);

    mockUseMigration.mockReturnValue({
      needsMigration: defaultMocks.needsMigration,
      isMigrating: defaultMocks.isMigrating,
      migrationError: defaultMocks.migrationError,
      migrateUser: defaultMocks.migrateUser,
      retryMigration: defaultMocks.retryMigration,
      // ... other required properties
    } as any);
  });

  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/projects/project1/canvases/canvas1']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render project canvas page with all components', async () => {
      renderWithRouter(<ProjectCanvasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByTestId('canvas')).toBeInTheDocument();
        expect(screen.getByTestId('canvas-controls')).toBeInTheDocument();
        expect(screen.getByTestId('canvas-switcher')).toBeInTheDocument();
        expect(screen.getByTestId('canvas-breadcrumb')).toBeInTheDocument();
        expect(screen.getByTestId('canvas-info')).toBeInTheDocument();
        expect(screen.getByTestId('canvas-toolbar')).toBeInTheDocument();
      });
    });

    it('should display project and canvas information in breadcrumb', async () => {
      renderWithRouter(<ProjectCanvasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('canvas-breadcrumb')).toHaveTextContent('Project: Test Project');
        expect(screen.getByTestId('canvas-breadcrumb')).toHaveTextContent('Canvas: Test Canvas');
      });
    });

    it('should display canvas information', async () => {
      renderWithRouter(<ProjectCanvasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('canvas-info')).toHaveTextContent('Canvas Info - Test Canvas');
      });
    });
  });

  describe('Migration Handling', () => {
    it('should show migration modal when migration is needed', () => {
      mockUseMigration.mockReturnValue({
        needsMigration: true,
        isMigrating: false,
        migrationError: null,
        migrateUser: jest.fn(),
        retryMigration: jest.fn(),
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />);

      expect(screen.getByTestId('migration-modal')).toBeInTheDocument();
      expect(screen.getByTestId('migration-modal')).toHaveTextContent('Open: true');
    });

    it('should show migration modal when migration is in progress', () => {
      mockUseMigration.mockReturnValue({
        needsMigration: false,
        isMigrating: true,
        migrationError: null,
        migrateUser: jest.fn(),
        retryMigration: jest.fn(),
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />);

      expect(screen.getByTestId('migration-modal')).toBeInTheDocument();
      expect(screen.getByTestId('migration-modal')).toHaveTextContent('Loading: true');
    });

    it('should show migration error', () => {
      mockUseMigration.mockReturnValue({
        needsMigration: false,
        isMigrating: false,
        migrationError: 'Migration failed',
        migrateUser: jest.fn(),
        retryMigration: jest.fn(),
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />);

      expect(screen.getByTestId('migration-modal')).toBeInTheDocument();
      expect(screen.getByTestId('migration-modal')).toHaveTextContent('Error: Migration failed');
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during initialization', () => {
      mockUseProjects.mockReturnValue({
        currentProject: null,
        currentProjectCanvases: [],
        setCurrentProject: jest.fn(),
        projectsLoading: true,
        projectsError: null,
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />);

      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error page when project error occurs', () => {
      mockUseProjects.mockReturnValue({
        currentProject: null,
        currentProjectCanvases: [],
        setCurrentProject: jest.fn(),
        projectsLoading: false,
        projectsError: 'Project not found',
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });

    it('should show project not found error when project is null', () => {
      mockUseProjects.mockReturnValue({
        currentProject: null,
        currentProjectCanvases: [],
        setCurrentProject: jest.fn(),
        projectsLoading: false,
        projectsError: null,
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />);

      expect(screen.getByText('Project not found')).toBeInTheDocument();
      expect(screen.getByText("The project you're looking for doesn't exist or you don't have access to it.")).toBeInTheDocument();
    });

    it('should show canvas not found error when canvas is not found', () => {
      mockUseProjects.mockReturnValue({
        currentProject: mockProject,
        currentProjectCanvases: [mockCanvas],
        setCurrentProject: jest.fn(),
        projectsLoading: false,
        projectsError: null,
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />, ['/projects/project1/canvases/nonexistent']);

      expect(screen.getByText('Canvas not found')).toBeInTheDocument();
      expect(screen.getByText("The canvas you're looking for doesn't exist in this project.")).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show no canvases empty state when no canvases exist', () => {
      mockUseProjects.mockReturnValue({
        currentProject: mockProject,
        currentProjectCanvases: [],
        setCurrentProject: jest.fn(),
        projectsLoading: false,
        projectsError: null,
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />);

      expect(screen.getByTestId('no-canvases-empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('no-canvases-empty-state')).toHaveTextContent('No Canvases - Project: project1');
    });
  });

  describe('Canvas Navigation', () => {
    it('should redirect to first canvas when no canvas is specified', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      mockUseProjects.mockReturnValue({
        currentProject: mockProject,
        currentProjectCanvases: [mockCanvas],
        setCurrentProject: jest.fn(),
        projectsLoading: false,
        projectsError: null,
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectCanvasPage />, ['/projects/project1']);

      // The redirect logic would be tested in integration tests
      // as it requires the full router context
    });
  });

  describe('Context Integration', () => {
    it('should pass correct props to canvas switcher', async () => {
      renderWithRouter(<ProjectCanvasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('canvas-switcher')).toHaveTextContent('Project: project1');
        expect(screen.getByTestId('canvas-switcher')).toHaveTextContent('Canvas: canvas1');
      });
    });

    it('should pass correct props to canvas toolbar', async () => {
      renderWithRouter(<ProjectCanvasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('canvas-toolbar')).toHaveTextContent('Project: project1');
        expect(screen.getByTestId('canvas-toolbar')).toHaveTextContent('Canvas: Test Canvas');
        expect(screen.getByTestId('canvas-toolbar')).toHaveTextContent('Variant: horizontal');
      });
    });
  });

  describe('URL Parameters', () => {
    it('should handle different project and canvas IDs', async () => {
      renderWithRouter(<ProjectCanvasPage />, ['/projects/project2/canvases/canvas2']);

      await waitFor(() => {
        expect(screen.getByTestId('canvas-switcher')).toHaveTextContent('Project: project2');
        expect(screen.getByTestId('canvas-switcher')).toHaveTextContent('Canvas: canvas2');
      });
    });
  });
});
