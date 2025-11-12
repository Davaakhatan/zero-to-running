// Unit tests for enhanced Navbar component
// Tests for breadcrumb integration, navigation, and user interactions

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useProjects } from '../../hooks/useProjects';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';
import { useNavigation } from '../../contexts/NavigationContext';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/ThemeContext');
jest.mock('../../hooks/useProjects');
jest.mock('../../contexts/ProjectCanvasContext');
jest.mock('../../contexts/NavigationContext');
jest.mock('../Navigation/ProjectBreadcrumb', () => ({
  ProjectBreadcrumb: ({ variant, showQuickActions, showRecentItems, showMetadata }: any) => (
    <div data-testid="project-breadcrumb">
      ProjectBreadcrumb - {variant} - {showQuickActions ? 'quick' : 'no-quick'} - {showRecentItems ? 'recent' : 'no-recent'} - {showMetadata ? 'meta' : 'no-meta'}
    </div>
  )
}));
jest.mock('../Presence/PresenceList', () => ({
  PresenceList: () => <div data-testid="presence-list">PresenceList</div>
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUseProjectCanvas = useProjectCanvas as jest.MockedFunction<typeof useProjectCanvas>;
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

describe('Navbar', () => {
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
    theme: 'light',
    toggleTheme: jest.fn(),
    currentProject: mockProject,
    currentCanvas: mockCanvas,
    goBack: jest.fn(),
    goForward: jest.fn(),
    navigationHistory: ['/projects', '/projects/project1'],
    historyIndex: 1,
    navigateTo: jest.fn()
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

    mockUseTheme.mockReturnValue({
      theme: defaultMocks.theme,
      resolvedTheme: 'light',
      setTheme: jest.fn(),
      toggleTheme: defaultMocks.toggleTheme,
      isDark: false,
      isLight: true,
      isSystem: false
    });

    mockUseProjects.mockReturnValue({
      currentProject: defaultMocks.currentProject,
      // ... other required properties
    } as any);

    mockUseProjectCanvas.mockReturnValue({
      currentCanvas: defaultMocks.currentCanvas,
      // ... other required properties
    } as any);

    mockUseNavigation.mockReturnValue({
      goBack: defaultMocks.goBack,
      goForward: defaultMocks.goForward,
      navigationHistory: defaultMocks.navigationHistory,
      historyIndex: defaultMocks.historyIndex,
      navigateTo: defaultMocks.navigateTo,
      // ... other required properties
    } as any);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  describe('Basic Rendering', () => {
    it('should render navbar with logo and brand', () => {
      renderWithRouter(<Navbar />);

      expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
      expect(screen.getByText('Real-time Design Tool')).toBeInTheDocument();
    });

    it('should render user information', () => {
      renderWithRouter(<Navbar />);

      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      renderWithRouter(<Navbar />);

      expect(screen.queryByText('CollabCanvas')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant with full brand', () => {
      renderWithRouter(<Navbar variant="default" />);

      expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
      expect(screen.getByText('Real-time Design Tool')).toBeInTheDocument();
    });

    it('should render compact variant with full brand', () => {
      renderWithRouter(<Navbar variant="compact" />);

      expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
      expect(screen.getByText('Real-time Design Tool')).toBeInTheDocument();
    });

    it('should render minimal variant without brand text', () => {
      renderWithRouter(<Navbar variant="minimal" />);

      expect(screen.queryByText('CollabCanvas')).not.toBeInTheDocument();
      expect(screen.queryByText('Real-time Design Tool')).not.toBeInTheDocument();
    });
  });

  describe('Breadcrumb Integration', () => {
    it('should render breadcrumb when showBreadcrumb is true', () => {
      renderWithRouter(<Navbar showBreadcrumb={true} />);

      expect(screen.getByTestId('project-breadcrumb')).toBeInTheDocument();
    });

    it('should not render breadcrumb when showBreadcrumb is false', () => {
      renderWithRouter(<Navbar showBreadcrumb={false} />);

      expect(screen.queryByTestId('project-breadcrumb')).not.toBeInTheDocument();
    });

    it('should pass correct props to ProjectBreadcrumb', () => {
      renderWithRouter(<Navbar variant="compact" showQuickActions={true} />);

      const breadcrumb = screen.getByTestId('project-breadcrumb');
      expect(breadcrumb).toHaveTextContent('compact');
      expect(breadcrumb).toHaveTextContent('quick');
      expect(breadcrumb).toHaveTextContent('recent');
      expect(breadcrumb).toHaveTextContent('meta');
    });
  });

  describe('Navigation Buttons', () => {
    it('should render back/forward buttons when showBackButton is true', () => {
      renderWithRouter(<Navbar showBackButton={true} />);

      const backButton = screen.getByTitle('Go back');
      const forwardButton = screen.getByTitle('Go forward');

      expect(backButton).toBeInTheDocument();
      expect(forwardButton).toBeInTheDocument();
    });

    it('should not render back/forward buttons when showBackButton is false', () => {
      renderWithRouter(<Navbar showBackButton={false} />);

      expect(screen.queryByTitle('Go back')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Go forward')).not.toBeInTheDocument();
    });

    it('should disable back button when at beginning of history', () => {
      mockUseNavigation.mockReturnValue({
        ...defaultMocks,
        historyIndex: 0
      } as any);

      renderWithRouter(<Navbar showBackButton={true} />);

      const backButton = screen.getByTitle('Go back');
      expect(backButton).toBeDisabled();
    });

    it('should disable forward button when at end of history', () => {
      mockUseNavigation.mockReturnValue({
        ...defaultMocks,
        historyIndex: 1
      } as any);

      renderWithRouter(<Navbar showBackButton={true} />);

      const forwardButton = screen.getByTitle('Go forward');
      expect(forwardButton).toBeDisabled();
    });

    it('should call goBack when back button is clicked', () => {
      renderWithRouter(<Navbar showBackButton={true} />);

      const backButton = screen.getByTitle('Go back');
      fireEvent.click(backButton);

      expect(defaultMocks.goBack).toHaveBeenCalled();
    });

    it('should call goForward when forward button is clicked', () => {
      renderWithRouter(<Navbar showBackButton={true} />);

      const forwardButton = screen.getByTitle('Go forward');
      fireEvent.click(forwardButton);

      expect(defaultMocks.goForward).toHaveBeenCalled();
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions when showQuickActions is true', () => {
      renderWithRouter(<Navbar showQuickActions={true} />);

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('should not render quick actions when showQuickActions is false', () => {
      renderWithRouter(<Navbar showQuickActions={false} />);

      expect(screen.queryByText('New Project')).not.toBeInTheDocument();
    });

    it('should render New Canvas button when current project exists', () => {
      renderWithRouter(<Navbar showQuickActions={true} />);

      expect(screen.getByText('New Canvas')).toBeInTheDocument();
    });

    it('should not render New Canvas button when no current project', () => {
      mockUseProjects.mockReturnValue({
        currentProject: null,
        // ... other required properties
      } as any);

      renderWithRouter(<Navbar showQuickActions={true} />);

      expect(screen.queryByText('New Canvas')).not.toBeInTheDocument();
    });

    it('should call navigateTo with correct path when New Project is clicked', () => {
      renderWithRouter(<Navbar showQuickActions={true} />);

      const newProjectButton = screen.getByText('New Project');
      fireEvent.click(newProjectButton);

      expect(defaultMocks.navigateTo).toHaveBeenCalledWith('/projects/new');
    });

    it('should call navigateTo with correct path when New Canvas is clicked', () => {
      renderWithRouter(<Navbar showQuickActions={true} />);

      const newCanvasButton = screen.getByText('New Canvas');
      fireEvent.click(newCanvasButton);

      expect(defaultMocks.navigateTo).toHaveBeenCalledWith('/projects/project1/canvases/new');
    });
  });

  describe('Search Functionality', () => {
    it('should render search button when showSearch is true', () => {
      renderWithRouter(<Navbar showSearch={true} />);

      const searchButton = screen.getByTitle('Search');
      expect(searchButton).toBeInTheDocument();
    });

    it('should not render search button when showSearch is false', () => {
      renderWithRouter(<Navbar showSearch={false} />);

      expect(screen.queryByTitle('Search')).not.toBeInTheDocument();
    });

    it('should open search dropdown when search button is clicked', () => {
      renderWithRouter(<Navbar showSearch={true} />);

      const searchButton = screen.getByTitle('Search');
      fireEvent.click(searchButton);

      expect(screen.getByPlaceholderText('Search projects, canvases...')).toBeInTheDocument();
    });

    it('should close search dropdown when clicking outside', async () => {
      renderWithRouter(<Navbar showSearch={true} />);

      const searchButton = screen.getByTitle('Search');
      fireEvent.click(searchButton);

      expect(screen.getByPlaceholderText('Search projects, canvases...')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search projects, canvases...')).not.toBeInTheDocument();
      });
    });

    it('should handle search input and submission', () => {
      renderWithRouter(<Navbar showSearch={true} />);

      const searchButton = screen.getByTitle('Search');
      fireEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText('Search projects, canvases...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');

      const submitButton = screen.getByText('Search');
      fireEvent.click(submitButton);

      // Search should close after submission
      expect(screen.queryByPlaceholderText('Search projects, canvases...')).not.toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    it('should render user menu when showUserMenu is true', () => {
      renderWithRouter(<Navbar showUserMenu={true} />);

      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    it('should not render user menu when showUserMenu is false', () => {
      renderWithRouter(<Navbar showUserMenu={false} />);

      expect(screen.queryByText('User One')).not.toBeInTheDocument();
    });

    it('should open user menu dropdown when clicked', () => {
      renderWithRouter(<Navbar showUserMenu={true} />);

      const userButton = screen.getByText('User One');
      fireEvent.click(userButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should close user menu when clicking outside', async () => {
      renderWithRouter(<Navbar showUserMenu={true} />);

      const userButton = screen.getByText('User One');
      fireEvent.click(userButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });

    it('should handle user menu navigation', () => {
      renderWithRouter(<Navbar showUserMenu={true} />);

      const userButton = screen.getByText('User One');
      fireEvent.click(userButton);

      const profileButton = screen.getByText('Profile');
      fireEvent.click(profileButton);

      // Menu should close after navigation
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('should render theme toggle button', () => {
      renderWithRouter(<Navbar />);

      const themeButton = screen.getByTitle('Switch to Dark Mode');
      expect(themeButton).toBeInTheDocument();
    });

    it('should call toggleTheme when theme button is clicked', () => {
      renderWithRouter(<Navbar />);

      const themeButton = screen.getByTitle('Switch to Dark Mode');
      fireEvent.click(themeButton);

      expect(defaultMocks.toggleTheme).toHaveBeenCalled();
    });

    it('should show correct icon for light theme', () => {
      renderWithRouter(<Navbar />);

      const themeButton = screen.getByTitle('Switch to Dark Mode');
      expect(themeButton).toBeInTheDocument();
    });

    it('should show correct icon for dark theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: jest.fn(),
        toggleTheme: defaultMocks.toggleTheme,
        isDark: true,
        isLight: false,
        isSystem: false
      });

      renderWithRouter(<Navbar />);

      const themeButton = screen.getByTitle('Switch to Light Mode');
      expect(themeButton).toBeInTheDocument();
    });
  });

  describe('Presence List', () => {
    it('should render presence list in default variant', () => {
      renderWithRouter(<Navbar variant="default" />);

      expect(screen.getByTestId('presence-list')).toBeInTheDocument();
    });

    it('should render presence list in compact variant', () => {
      renderWithRouter(<Navbar variant="compact" />);

      expect(screen.getByTestId('presence-list')).toBeInTheDocument();
    });

    it('should not render presence list in minimal variant', () => {
      renderWithRouter(<Navbar variant="minimal" />);

      expect(screen.queryByTestId('presence-list')).not.toBeInTheDocument();
    });
  });

  describe('Notifications', () => {
    it('should render notifications button when showNotifications is true', () => {
      renderWithRouter(<Navbar showNotifications={true} />);

      const notificationsButton = screen.getByTitle('Notifications');
      expect(notificationsButton).toBeInTheDocument();
    });

    it('should not render notifications button when showNotifications is false', () => {
      renderWithRouter(<Navbar showNotifications={false} />);

      expect(screen.queryByTitle('Notifications')).not.toBeInTheDocument();
    });

    it('should show notification indicator', () => {
      renderWithRouter(<Navbar showNotifications={true} />);

      const notificationsButton = screen.getByTitle('Notifications');
      const indicator = notificationsButton.querySelector('.bg-red-500');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      renderWithRouter(<Navbar className="custom-navbar" />);

      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveClass('custom-navbar');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and titles', () => {
      renderWithRouter(<Navbar showSearch={true} showNotifications={true} showBackButton={true} />);

      expect(screen.getByTitle('Search')).toBeInTheDocument();
      expect(screen.getByTitle('Notifications')).toBeInTheDocument();
      expect(screen.getByTitle('Go back')).toBeInTheDocument();
      expect(screen.getByTitle('Go forward')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithRouter(<Navbar />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper navigation role', () => {
      renderWithRouter(<Navbar />);

      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });
  });
});
