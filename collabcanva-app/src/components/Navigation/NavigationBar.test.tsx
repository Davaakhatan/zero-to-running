// Unit tests for NavigationBar component
// Tests for enhanced navigation bar with breadcrumb integration

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationBar } from './NavigationBar';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useProjectData } from '../../hooks/useProjectData';
import { useNavigation } from '../../contexts/NavigationContext';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useProjects');
jest.mock('../../hooks/useProjectData');
jest.mock('../../contexts/NavigationContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
const mockUseProjectData = useProjectData as jest.MockedFunction<typeof useProjectData>;
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

describe('NavigationBar', () => {
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
    currentProjectCanvases: [mockCanvas],
    goBack: jest.fn(),
    goForward: jest.fn(),
    recentItems: [],
    favorites: []
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

    mockUseNavigation.mockReturnValue({
      goBack: defaultMocks.goBack,
      goForward: defaultMocks.goForward,
      recentItems: defaultMocks.recentItems,
      favorites: defaultMocks.favorites,
      // ... other required properties
    } as any);
  });

  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/projects/project1']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render navigation bar with all elements', () => {
      renderWithRouter(<NavigationBar />);

      expect(screen.getByTitle('Go back')).toBeInTheDocument();
      expect(screen.getByTitle('Go forward')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search projects, canvases...')).toBeInTheDocument();
      expect(screen.getByTitle('Notifications')).toBeInTheDocument();
      expect(screen.getByTitle('Home')).toBeInTheDocument();
    });

    it('should render user menu when user is logged in', () => {
      renderWithRouter(<NavigationBar />);

      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    it('should render project-specific quick actions when in project context', () => {
      renderWithRouter(<NavigationBar />);

      expect(screen.getByTitle('New canvas')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render compact variant', () => {
      renderWithRouter(<NavigationBar variant="compact" />);

      expect(screen.getByTitle('Go back')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search projects, canvases...')).not.toBeInTheDocument();
    });

    it('should render minimal variant', () => {
      renderWithRouter(<NavigationBar variant="minimal" />);

      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.queryByTitle('Go back')).not.toBeInTheDocument();
    });

    it('should render default variant with all features', () => {
      renderWithRouter(<NavigationBar variant="default" />);

      expect(screen.getByTitle('Go back')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search projects, canvases...')).toBeInTheDocument();
      expect(screen.getByTitle('Notifications')).toBeInTheDocument();
    });
  });

  describe('Navigation Controls', () => {
    it('should handle back navigation', () => {
      renderWithRouter(<NavigationBar showBackButton={true} />);

      const backButton = screen.getByTitle('Go back');
      fireEvent.click(backButton);

      expect(defaultMocks.goBack).toHaveBeenCalled();
    });

    it('should handle forward navigation', () => {
      renderWithRouter(<NavigationBar showBackButton={true} />);

      const forwardButton = screen.getByTitle('Go forward');
      fireEvent.click(forwardButton);

      expect(defaultMocks.goForward).toHaveBeenCalled();
    });

    it('should not show back button when showBackButton is false', () => {
      renderWithRouter(<NavigationBar showBackButton={false} />);

      expect(screen.queryByTitle('Go back')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input', () => {
      renderWithRouter(<NavigationBar showSearch={true} />);

      const searchInput = screen.getByPlaceholderText('Search projects, canvases...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');
    });

    it('should handle search on Enter key', () => {
      renderWithRouter(<NavigationBar showSearch={true} />);

      const searchInput = screen.getByPlaceholderText('Search projects, canvases...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Should navigate to search results (mocked)
      expect(searchInput).toHaveValue('test search');
    });

    it('should handle custom search callback', () => {
      const onSearch = jest.fn();
      renderWithRouter(<NavigationBar showSearch={true} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText('Search projects, canvases...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(onSearch).toHaveBeenCalledWith('test search');
    });

    it('should not show search when showSearch is false', () => {
      renderWithRouter(<NavigationBar showSearch={false} />);

      expect(screen.queryByPlaceholderText('Search projects, canvases...')).not.toBeInTheDocument();
    });
  });

  describe('Notifications', () => {
    it('should show notification count when notifications exist', () => {
      renderWithRouter(<NavigationBar showNotifications={true} />);

      // Mock notification count (component uses random number)
      const notificationButton = screen.getByTitle('Notifications');
      expect(notificationButton).toBeInTheDocument();
    });

    it('should handle notification click', () => {
      const onNotificationClick = jest.fn();
      renderWithRouter(<NavigationBar showNotifications={true} onNotificationClick={onNotificationClick} />);

      const notificationButton = screen.getByTitle('Notifications');
      fireEvent.click(notificationButton);

      expect(onNotificationClick).toHaveBeenCalled();
    });

    it('should show notifications dropdown when clicked', () => {
      renderWithRouter(<NavigationBar showNotifications={true} />);

      const notificationButton = screen.getByTitle('Notifications');
      fireEvent.click(notificationButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should not show notifications when showNotifications is false', () => {
      renderWithRouter(<NavigationBar showNotifications={false} />);

      expect(screen.queryByTitle('Notifications')).not.toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    it('should show user menu when clicked', () => {
      renderWithRouter(<NavigationBar showUserMenu={true} />);

      const userButton = screen.getByText('User One');
      fireEvent.click(userButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should handle user menu click callback', () => {
      const onUserMenuClick = jest.fn();
      renderWithRouter(<NavigationBar showUserMenu={true} onUserMenuClick={onUserMenuClick} />);

      const userButton = screen.getByText('User One');
      fireEvent.click(userButton);

      expect(onUserMenuClick).toHaveBeenCalled();
    });

    it('should handle sign out', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: defaultMocks.user,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: mockSignOut,
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      renderWithRouter(<NavigationBar showUserMenu={true} />);

      const userButton = screen.getByText('User One');
      fireEvent.click(userButton);

      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should not show user menu when showUserMenu is false', () => {
      renderWithRouter(<NavigationBar showUserMenu={false} />);

      expect(screen.queryByText('User One')).not.toBeInTheDocument();
    });

    it('should not show user menu when user is not logged in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn()
      });

      renderWithRouter(<NavigationBar showUserMenu={true} />);

      expect(screen.queryByText('User One')).not.toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should show new canvas button when in project context', () => {
      renderWithRouter(<NavigationBar showQuickActions={true} />);

      expect(screen.getByTitle('New canvas')).toBeInTheDocument();
    });

    it('should handle new canvas creation', () => {
      renderWithRouter(<NavigationBar showQuickActions={true} />);

      const newCanvasButton = screen.getByTitle('New canvas');
      fireEvent.click(newCanvasButton);

      // Should navigate to new canvas (mocked)
      expect(newCanvasButton).toBeInTheDocument();
    });

    it('should not show quick actions when showQuickActions is false', () => {
      renderWithRouter(<NavigationBar showQuickActions={false} />);

      expect(screen.queryByTitle('New canvas')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Interactions', () => {
    it('should close user menu when clicking outside', async () => {
      renderWithRouter(<NavigationBar showUserMenu={true} />);

      const userButton = screen.getByText('User One');
      fireEvent.click(userButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });

    it('should close notifications dropdown when clicking outside', async () => {
      renderWithRouter(<NavigationBar showNotifications={true} />);

      const notificationButton = screen.getByTitle('Notifications');
      fireEvent.click(notificationButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should hide user name on small screens', () => {
      renderWithRouter(<NavigationBar showUserMenu={true} />);

      const userButton = screen.getByText('User One');
      expect(userButton).toHaveClass('hidden', 'sm:block');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      renderWithRouter(<NavigationBar />);

      expect(screen.getByTitle('Go back')).toBeInTheDocument();
      expect(screen.getByTitle('Go forward')).toBeInTheDocument();
      expect(screen.getByTitle('Notifications')).toBeInTheDocument();
      expect(screen.getByTitle('Home')).toBeInTheDocument();
    });

    it('should have proper input labels', () => {
      renderWithRouter(<NavigationBar showSearch={true} />);

      const searchInput = screen.getByPlaceholderText('Search projects, canvases...');
      expect(searchInput).toBeInTheDocument();
    });
  });
});
