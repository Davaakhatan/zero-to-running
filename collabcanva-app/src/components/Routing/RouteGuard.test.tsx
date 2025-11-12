// Unit tests for enhanced RouteGuard component
// Tests for permission-based route protection, validation, and access control

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import { RouteGuard, ProjectRouteGuard, CanvasRouteGuard, AdminRouteGuard, EditorRouteGuard, AuthRouteGuard, useRouteValidation } from './RouteGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { usePermissions } from '../../hooks/usePermissions';
import { useProjectData } from '../../hooks/useProjectData';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useProjects');
jest.mock('../../hooks/usePermissions');
jest.mock('../../hooks/useProjectData');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;
const mockUseProjectData = useProjectData as jest.MockedFunction<typeof useProjectData>;

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

// Test components
const TestComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div data-testid="test-component">{children || 'Test Component'}</div>
);

const TestPage: React.FC = () => <div data-testid="test-page">Test Page</div>;

describe('RouteGuard', () => {
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
    width: 1920,
    height: 1080
  };

  const defaultMocks = {
    user: mockUser,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    currentProject: mockProject,
    currentProjectCanvases: [mockCanvas],
    hasPermission: jest.fn(),
    currentUserRole: 'editor',
    isOwner: false,
    isAdmin: false,
    isEditor: true,
    isViewer: false,
    isLoading: false,
    error: null
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
      currentProject: defaultMocks.currentProject,
      // ... other required properties
    } as any);

    mockUseProjectData.mockReturnValue({
      currentProjectCanvases: defaultMocks.currentProjectCanvases,
      // ... other required properties
    } as any);

    mockUsePermissions.mockReturnValue({
      hasPermission: defaultMocks.hasPermission,
      currentUserRole: defaultMocks.currentUserRole,
      isOwner: defaultMocks.isOwner,
      isAdmin: defaultMocks.isAdmin,
      isEditor: defaultMocks.isEditor,
      isViewer: defaultMocks.isViewer,
      isLoading: defaultMocks.isLoading,
      error: defaultMocks.error,
      // ... other required properties
    } as any);

    mockUseParams.mockReturnValue({ projectId: 'project1', canvasId: 'canvas1' });
  });

  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/test']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/test" element={component} />
          <Route path="/projects" element={<div data-testid="projects-page">Projects</div>} />
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Basic Route Protection', () => {
    it('should render children when user is authenticated and has access', async () => {
      defaultMocks.hasPermission.mockReturnValue(true);

      renderWithRouter(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should show loading spinner while validating', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        loading: true
      });

      renderWithRouter(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>
      );

      expect(screen.getByText('Validating access...')).toBeInTheDocument();
    });

    it('should show access denied when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: null
      });

      renderWithRouter(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Project Route Protection', () => {
    it('should require project ID when requireProject is true', async () => {
      mockUseParams.mockReturnValue({ projectId: undefined });

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('Project ID is required')).toBeInTheDocument();
      });
    });

    it('should validate project ID format', async () => {
      mockUseParams.mockReturnValue({ projectId: 'invalid@id' });

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('Invalid project ID format')).toBeInTheDocument();
      });
    });

    it('should show project not found when project does not exist', async () => {
      mockUseProjects.mockReturnValue({
        currentProject: null,
        // ... other required properties
      } as any);

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Canvas Route Protection', () => {
    it('should require canvas ID when requireCanvas is true', async () => {
      mockUseParams.mockReturnValue({ projectId: 'project1', canvasId: undefined });

      renderWithRouter(
        <RouteGuard requireProject={true} requireCanvas={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('Canvas ID is required')).toBeInTheDocument();
      });
    });

    it('should validate canvas ID format', async () => {
      mockUseParams.mockReturnValue({ projectId: 'project1', canvasId: 'invalid@id' });

      renderWithRouter(
        <RouteGuard requireProject={true} requireCanvas={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('Invalid canvas ID format')).toBeInTheDocument();
      });
    });

    it('should show canvas not found when canvas does not exist', async () => {
      mockUseProjectData.mockReturnValue({
        currentProjectCanvases: [],
        // ... other required properties
      } as any);

      renderWithRouter(
        <RouteGuard requireProject={true} requireCanvas={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Canvas Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should grant access for view permission', async () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        return permission === 'project.view';
      });

      renderWithRouter(
        <RouteGuard requireProject={true} requiredPermission="view">
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should grant access for edit permission', async () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        return permission === 'project.edit';
      });

      renderWithRouter(
        <RouteGuard requireProject={true} requiredPermission="edit">
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should grant access for admin permission', async () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        return permission === 'project.settings' || permission === 'members.edit';
      });

      renderWithRouter(
        <RouteGuard requireProject={true} requiredPermission="admin">
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required permission', async () => {
      defaultMocks.hasPermission.mockReturnValue(false);

      renderWithRouter(
        <RouteGuard requireProject={true} requiredPermission="edit">
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should call onAccessDenied callback when access is denied', async () => {
      const onAccessDenied = jest.fn();
      defaultMocks.hasPermission.mockReturnValue(false);

      renderWithRouter(
        <RouteGuard requireProject={true} requiredPermission="edit" onAccessDenied={onAccessDenied}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(onAccessDenied).toHaveBeenCalled();
      });
    });
  });

  describe('Convenience Components', () => {
    it('should render ProjectRouteGuard with view permission', async () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        return permission === 'project.view';
      });

      renderWithRouter(
        <ProjectRouteGuard permission="view">
          <TestComponent />
        </ProjectRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should render CanvasRouteGuard with edit permission', async () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        return permission === 'project.edit';
      });

      renderWithRouter(
        <CanvasRouteGuard permission="edit">
          <TestComponent />
        </CanvasRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should render AdminRouteGuard with admin permission', async () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        return permission === 'project.settings' || permission === 'members.edit';
      });

      renderWithRouter(
        <AdminRouteGuard>
          <TestComponent />
        </AdminRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should render EditorRouteGuard with edit permission', async () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        return permission === 'project.edit';
      });

      renderWithRouter(
        <EditorRouteGuard>
          <TestComponent />
        </EditorRouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should render AuthRouteGuard for authenticated users', () => {
      renderWithRouter(
        <AuthRouteGuard>
          <TestComponent />
        </AuthRouteGuard>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should redirect to login for unauthenticated users in AuthRouteGuard', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: null
      });

      renderWithRouter(
        <AuthRouteGuard>
          <TestComponent />
        </AuthRouteGuard>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback Paths', () => {
    it('should use custom fallback path for access denied', async () => {
      defaultMocks.hasPermission.mockReturnValue(false);

      renderWithRouter(
        <RouteGuard requireProject={true} requiredPermission="edit" fallbackPath="/custom">
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        const goBackButton = screen.getByText('Go Back');
        expect(goBackButton.closest('a')).toHaveAttribute('href', '/custom');
      });
    });

    it('should use custom fallback path in ProjectRouteGuard', async () => {
      defaultMocks.hasPermission.mockReturnValue(false);

      renderWithRouter(
        <ProjectRouteGuard permission="edit" fallbackPath="/custom">
          <TestComponent />
        </ProjectRouteGuard>
      );

      await waitFor(() => {
        const goBackButton = screen.getByText('Go Back');
        expect(goBackButton.closest('a')).toHaveAttribute('href', '/custom');
      });
    });
  });

  describe('useRouteValidation Hook', () => {
    const TestHookComponent: React.FC = () => {
      const validation = useRouteValidation();
      return (
        <div>
          <div data-testid="project-id">{validation.projectId}</div>
          <div data-testid="canvas-id">{validation.canvasId}</div>
          <div data-testid="is-valid-project">{validation.isValidProject ? 'true' : 'false'}</div>
          <div data-testid="is-valid-canvas">{validation.isValidCanvas ? 'true' : 'false'}</div>
          <div data-testid="is-route-valid">{validation.isRouteValid ? 'true' : 'false'}</div>
          <div data-testid="user-role">{validation.currentUserRole}</div>
          <div data-testid="has-view-access">{validation.hasViewAccess ? 'true' : 'false'}</div>
          <div data-testid="has-edit-access">{validation.hasEditAccess ? 'true' : 'false'}</div>
          <div data-testid="has-admin-access">{validation.hasAdminAccess ? 'true' : 'false'}</div>
        </div>
      );
    };

    it('should return correct validation state', () => {
      defaultMocks.hasPermission.mockImplementation((permission) => {
        switch (permission) {
          case 'project.view': return true;
          case 'project.edit': return true;
          case 'project.settings': return false;
          case 'members.edit': return false;
          default: return false;
        }
      });

      renderWithRouter(<TestHookComponent />);

      expect(screen.getByTestId('project-id')).toHaveTextContent('project1');
      expect(screen.getByTestId('canvas-id')).toHaveTextContent('canvas1');
      expect(screen.getByTestId('is-valid-project')).toHaveTextContent('true');
      expect(screen.getByTestId('is-valid-canvas')).toHaveTextContent('true');
      expect(screen.getByTestId('is-route-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('user-role')).toHaveTextContent('editor');
      expect(screen.getByTestId('has-view-access')).toHaveTextContent('true');
      expect(screen.getByTestId('has-edit-access')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin-access')).toHaveTextContent('false');
    });

    it('should return false for invalid project', () => {
      mockUseProjects.mockReturnValue({
        currentProject: null,
        // ... other required properties
      } as any);

      renderWithRouter(<TestHookComponent />);

      expect(screen.getByTestId('is-valid-project')).toHaveTextContent('false');
      expect(screen.getByTestId('is-route-valid')).toHaveTextContent('false');
    });

    it('should return false for invalid canvas', () => {
      mockUseProjectData.mockReturnValue({
        currentProjectCanvases: [],
        // ... other required properties
      } as any);

      renderWithRouter(<TestHookComponent />);

      expect(screen.getByTestId('is-valid-canvas')).toHaveTextContent('false');
      expect(screen.getByTestId('is-route-valid')).toHaveTextContent('false');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      mockUseProjects.mockImplementation(() => {
        throw new Error('Network error');
      });

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('should handle permission loading errors', async () => {
      mockUsePermissions.mockReturnValue({
        ...defaultMocks,
        isLoading: true,
        error: 'Permission check failed'
      } as any);

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      expect(screen.getByText('Validating access...')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        loading: true
      });

      renderWithRouter(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>
      );

      expect(screen.getByText('Validating access...')).toBeInTheDocument();
    });

    it('should show loading while project is loading', () => {
      mockUseProjects.mockReturnValue({
        ...defaultMocks,
        loading: true
      } as any);

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      expect(screen.getByText('Validating access...')).toBeInTheDocument();
    });

    it('should show loading while permissions are loading', () => {
      mockUsePermissions.mockReturnValue({
        ...defaultMocks,
        isLoading: true
      } as any);

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      expect(screen.getByText('Validating access...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      defaultMocks.hasPermission.mockReturnValue(false);

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go back/i })).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', async () => {
      mockUseProjects.mockReturnValue({
        currentProject: null,
        // ... other required properties
      } as any);

      renderWithRouter(
        <RouteGuard requireProject={true}>
          <TestComponent />
        </RouteGuard>
      );

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Project Not Found');
      });
    });
  });
});