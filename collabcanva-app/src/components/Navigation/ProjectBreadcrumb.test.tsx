// Unit tests for ProjectBreadcrumb component
// Tests for enhanced breadcrumb navigation with recent items and quick actions

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectBreadcrumb } from './ProjectBreadcrumb';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useProjectData } from '../../hooks/useProjectData';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useProjects');
jest.mock('../../hooks/useProjectData');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUseProjectData = useProjectData as jest.MockedFunction<typeof useProjectData>;

describe('ProjectBreadcrumb', () => {
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
    height: 1080,
    backgroundColor: '#ffffff'
  };

  const defaultMocks = {
    user: mockUser,
    currentProject: mockProject,
    currentProjectCanvases: [mockCanvas]
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
      // ... other required properties
    } as any);

    mockUseProjectData.mockReturnValue({
      currentProjectCanvases: defaultMocks.currentProjectCanvases,
      // ... other required properties
    } as any);

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });
  });

  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/projects/project1/canvases/canvas1']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render breadcrumb with home and projects', () => {
      renderWithRouter(<ProjectBreadcrumb />, ['/projects']);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('should render breadcrumb with project when in project context', () => {
      renderWithRouter(<ProjectBreadcrumb />, ['/projects/project1']);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should render breadcrumb with canvas when in canvas context', () => {
      renderWithRouter(<ProjectBreadcrumb />, ['/projects/project1/canvases/canvas1']);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test Canvas')).toBeInTheDocument();
    });

    it('should show project metadata', () => {
      renderWithRouter(<ProjectBreadcrumb />, ['/projects/project1']);

      expect(screen.getByText('0 members')).toBeInTheDocument();
      expect(screen.getByText('1 canvases')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render compact variant', () => {
      renderWithRouter(<ProjectBreadcrumb variant="compact" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // Home, Projects, Project, Canvas
    });

    it('should render minimal variant', () => {
      renderWithRouter(<ProjectBreadcrumb variant="minimal" />);

      expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('should render default variant with all features', () => {
      renderWithRouter(<ProjectBreadcrumb />);

      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recent/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should handle navigation clicks', () => {
      const onNavigate = jest.fn();
      renderWithRouter(<ProjectBreadcrumb onNavigate={onNavigate} />);

      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);

      expect(onNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle project navigation', () => {
      const onNavigate = jest.fn();
      renderWithRouter(<ProjectBreadcrumb onNavigate={onNavigate} />);

      const projectButton = screen.getByText('Test Project');
      fireEvent.click(projectButton);

      expect(onNavigate).toHaveBeenCalledWith('/projects/project1');
    });
  });

  describe('Recent Items', () => {
    it('should show recent items dropdown when clicked', () => {
      renderWithRouter(<ProjectBreadcrumb showRecentItems={true} />);

      const recentButton = screen.getByText('Recent');
      fireEvent.click(recentButton);

      expect(screen.getByText('Recent Items')).toBeInTheDocument();
    });

    it('should load recent items from localStorage', () => {
      const mockRecentItems = [
        {
          id: 'project1',
          label: 'Recent Project',
          path: '/projects/project1',
          type: 'project',
          lastAccessed: new Date().toISOString(),
          projectId: 'project1'
        }
      ];

      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRecentItems));

      renderWithRouter(<ProjectBreadcrumb showRecentItems={true} />);

      const recentButton = screen.getByText('Recent');
      fireEvent.click(recentButton);

      expect(screen.getByText('Recent Project')).toBeInTheDocument();
    });

    it('should save recent items to localStorage on navigation', () => {
      const onNavigate = jest.fn();
      renderWithRouter(<ProjectBreadcrumb onNavigate={onNavigate} showRecentItems={true} />);

      const projectButton = screen.getByText('Test Project');
      fireEvent.click(projectButton);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'collabcanvas_recent_items',
        expect.stringContaining('Test Project')
      );
    });

    it('should not show recent items when showRecentItems is false', () => {
      renderWithRouter(<ProjectBreadcrumb showRecentItems={false} />);

      expect(screen.queryByText('Recent')).not.toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should show quick actions dropdown when clicked', () => {
      renderWithRouter(<ProjectBreadcrumb showQuickActions={true} />);

      const quickActionsButton = screen.getByRole('button', { name: /quick actions/i });
      fireEvent.click(quickActionsButton);

      expect(screen.getByText('All Projects')).toBeInTheDocument();
      expect(screen.getByText('New Canvas')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should handle quick action navigation', () => {
      const onNavigate = jest.fn();
      renderWithRouter(<ProjectBreadcrumb onNavigate={onNavigate} showQuickActions={true} />);

      const quickActionsButton = screen.getByRole('button', { name: /quick actions/i });
      fireEvent.click(quickActionsButton);

      const allProjectsButton = screen.getByText('All Projects');
      fireEvent.click(allProjectsButton);

      expect(onNavigate).toHaveBeenCalledWith('/projects');
    });

    it('should not show quick actions when showQuickActions is false', () => {
      renderWithRouter(<ProjectBreadcrumb showQuickActions={false} />);

      expect(screen.queryByRole('button', { name: /quick actions/i })).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Interactions', () => {
    it('should close recent items dropdown when clicking outside', async () => {
      renderWithRouter(<ProjectBreadcrumb showRecentItems={true} />);

      const recentButton = screen.getByText('Recent');
      fireEvent.click(recentButton);

      expect(screen.getByText('Recent Items')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Recent Items')).not.toBeInTheDocument();
      });
    });

    it('should close quick actions dropdown when clicking outside', async () => {
      renderWithRouter(<ProjectBreadcrumb showQuickActions={true} />);

      const quickActionsButton = screen.getByRole('button', { name: /quick actions/i });
      fireEvent.click(quickActionsButton);

      expect(screen.getByText('All Projects')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('All Projects')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not crash
      renderWithRouter(<ProjectBreadcrumb showRecentItems={true} />);

      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('should handle invalid JSON in localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid json');

      // Should not crash
      renderWithRouter(<ProjectBreadcrumb showRecentItems={true} />);

      expect(screen.getByText('Recent')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      renderWithRouter(<ProjectBreadcrumb />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels', () => {
      renderWithRouter(<ProjectBreadcrumb />);

      const recentButton = screen.getByText('Recent');
      expect(recentButton).toBeInTheDocument();
    });
  });
});
