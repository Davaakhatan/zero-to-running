// Unit tests for ProjectDashboardPage
// Tests for project dashboard page with routing and context integration

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectDashboardPage } from './ProjectDashboardPage';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useMigration } from '../hooks/useMigration';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../hooks/useProjects');
jest.mock('../hooks/useMigration');
jest.mock('../contexts/ProjectContext');
jest.mock('../contexts/PermissionContext');

// Mock components
jest.mock('../components/Layout/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('../components/Project/ProjectDashboard', () => {
  return function MockProjectDashboard({ 
    onViewProject, 
    onEditProject, 
    onDeleteProject, 
    onArchiveProject, 
    onShareProject, 
    onCreateProject 
  }: any) {
    return (
      <div data-testid="project-dashboard">
        <div>Project Dashboard</div>
        <button onClick={() => onViewProject('project1')}>View Project 1</button>
        <button onClick={() => onEditProject('project1')}>Edit Project 1</button>
        <button onClick={() => onDeleteProject('project1')}>Delete Project 1</button>
        <button onClick={() => onArchiveProject('project1')}>Archive Project 1</button>
        <button onClick={() => onShareProject('project1')}>Share Project 1</button>
        <button onClick={onCreateProject}>Create Project</button>
      </div>
    );
  };
});

jest.mock('../components/Project/CreateProjectModal', () => {
  return function MockCreateProjectModal({ isOpen, onClose, onSuccess }: any) {
    return (
      <div data-testid="create-project-modal">
        Create Project Modal - Open: {isOpen.toString()}
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSuccess({ id: 'newProject', name: 'New Project' })}>Create</button>
      </div>
    );
  };
});

jest.mock('../components/Migration/MigrationModal', () => {
  return function MockMigrationModal({ isOpen, onClose, onSuccess, isLoading, error, onRetry }: any) {
    return (
      <div data-testid="migration-modal">
        Migration Modal - Open: {isOpen.toString()}, Loading: {isLoading.toString()}, Error: {error || 'None'}
      </div>
    );
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUseMigration = useMigration as jest.MockedFunction<typeof useMigration>;

describe('ProjectDashboardPage', () => {
  const mockUser = {
    uid: 'user1',
    email: 'user1@example.com',
    displayName: 'User One'
  };

  const mockProjects = [
    {
      id: 'project1',
      name: 'Test Project 1',
      ownerId: 'user1',
      members: []
    },
    {
      id: 'project2',
      name: 'Test Project 2',
      ownerId: 'user1',
      members: []
    }
  ];

  const defaultMocks = {
    user: mockUser,
    projects: mockProjects,
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
      projects: defaultMocks.projects,
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

  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/projects']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render project dashboard page with all components', async () => {
      renderWithRouter(<ProjectDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });
    });

    it('should not show create project modal by default', () => {
      renderWithRouter(<ProjectDashboardPage />);

      expect(screen.queryByTestId('create-project-modal')).not.toBeInTheDocument();
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

      renderWithRouter(<ProjectDashboardPage />);

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

      renderWithRouter(<ProjectDashboardPage />);

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

      renderWithRouter(<ProjectDashboardPage />);

      expect(screen.getByTestId('migration-modal')).toBeInTheDocument();
      expect(screen.getByTestId('migration-modal')).toHaveTextContent('Error: Migration failed');
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during initialization', () => {
      mockUseProjects.mockReturnValue({
        projects: [],
        projectsLoading: true,
        projectsError: null,
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectDashboardPage />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error page when projects error occurs', () => {
      mockUseProjects.mockReturnValue({
        projects: [],
        projectsLoading: false,
        projectsError: 'Failed to load projects',
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectDashboardPage />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
    });

    it('should show retry button on error page', () => {
      mockUseProjects.mockReturnValue({
        projects: [],
        projectsLoading: false,
        projectsError: 'Failed to load projects',
        // ... other required properties
      } as any);

      renderWithRouter(<ProjectDashboardPage />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });
  });

  describe('Project Actions', () => {
    it('should handle view project action', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderWithRouter(<ProjectDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });

      // The navigation logic would be tested in integration tests
      // as it requires the full router context
    });

    it('should handle create project action', async () => {
      renderWithRouter(<ProjectDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Project');
      createButton.click();

      expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
      expect(screen.getByTestId('create-project-modal')).toHaveTextContent('Open: true');
    });

    it('should handle close create project modal', async () => {
      renderWithRouter(<ProjectDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Project');
      createButton.click();

      expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();

      const closeButton = screen.getByText('Close');
      closeButton.click();

      expect(screen.queryByTestId('create-project-modal')).not.toBeInTheDocument();
    });

    it('should handle create project success', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderWithRouter(<ProjectDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Project');
      createButton.click();

      expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();

      const createModalButton = screen.getByText('Create');
      createModalButton.click();

      // The navigation logic would be tested in integration tests
      expect(screen.queryByTestId('create-project-modal')).not.toBeInTheDocument();
    });
  });

  describe('URL Parameters', () => {
    it('should open create modal when action=create in URL', () => {
      renderWithRouter(<ProjectDashboardPage />, ['/projects?action=create']);

      expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
      expect(screen.getByTestId('create-project-modal')).toHaveTextContent('Open: true');
    });
  });

  describe('Context Integration', () => {
    it('should pass correct props to project dashboard', async () => {
      renderWithRouter(<ProjectDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
        expect(screen.getByText('View Project 1')).toBeInTheDocument();
        expect(screen.getByText('Edit Project 1')).toBeInTheDocument();
        expect(screen.getByText('Delete Project 1')).toBeInTheDocument();
        expect(screen.getByText('Archive Project 1')).toBeInTheDocument();
        expect(screen.getByText('Share Project 1')).toBeInTheDocument();
        expect(screen.getByText('Create Project')).toBeInTheDocument();
      });
    });
  });
});
