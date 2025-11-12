// Unit tests for enhanced Home component
// Tests for automatic redirection, user states, and navigation functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../contexts/NavigationContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

// Mock timers
jest.useFakeTimers();

describe('Home', () => {
  const mockUser = {
    uid: 'user1',
    email: 'user1@example.com',
    displayName: 'User One'
  };

  const defaultMocks = {
    user: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    navigateTo: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    mockUseAuth.mockReturnValue({
      user: defaultMocks.user,
      loading: defaultMocks.loading,
      signIn: defaultMocks.signIn,
      signUp: defaultMocks.signUp,
      signOut: defaultMocks.signOut,
      resetPassword: defaultMocks.resetPassword,
      updateProfile: defaultMocks.updateProfile
    });

    mockUseNavigation.mockReturnValue({
      navigateTo: defaultMocks.navigateTo,
      // ... other required properties
    } as any);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        loading: true
      });

      renderWithRouter(<Home />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should not show loading spinner when loading is false', () => {
      renderWithRouter(<Home />);

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Not Logged In State', () => {
    it('should render landing page for non-authenticated users', () => {
      renderWithRouter(<Home />);

      expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
      expect(screen.getByText('Real-time collaborative design tool for teams to create, brainstorm, and build together')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('should show feature highlights', () => {
      renderWithRouter(<Home />);

      expect(screen.getByText('Real-time')).toBeInTheDocument();
      expect(screen.getByText('Collaborate')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should have correct links for authentication', () => {
      renderWithRouter(<Home />);

      const signInLink = screen.getByText('Sign In').closest('a');
      const signUpLink = screen.getByText('Create Account').closest('a');

      expect(signInLink).toHaveAttribute('href', '/login');
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Logged In State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: mockUser
      });
    });

    it('should render user information for authenticated users', () => {
      renderWithRouter(<Home />);

      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('✅ Ready to collaborate')).toBeInTheDocument();
    });

    it('should show action buttons for authenticated users', () => {
      renderWithRouter(<Home />);

      expect(screen.getByText('Open Projects')).toBeInTheDocument();
      expect(screen.getByText('Legacy Canvas')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should show quick stats', () => {
      renderWithRouter(<Home />);

      expect(screen.getByText('Active Projects')).toBeInTheDocument();
      expect(screen.getByText('Canvases Created')).toBeInTheDocument();
    });

    it('should call navigateTo when Open Projects is clicked', () => {
      renderWithRouter(<Home />);

      const openProjectsButton = screen.getByText('Open Projects');
      fireEvent.click(openProjectsButton);

      expect(defaultMocks.navigateTo).toHaveBeenCalledWith('/projects');
    });

    it('should call navigateTo when Legacy Canvas is clicked', () => {
      renderWithRouter(<Home />);

      const legacyCanvasButton = screen.getByText('Legacy Canvas');
      fireEvent.click(legacyCanvasButton);

      expect(defaultMocks.navigateTo).toHaveBeenCalledWith('/canvas');
    });

    it('should call signOut when Sign Out is clicked', () => {
      renderWithRouter(<Home />);

      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      expect(defaultMocks.signOut).toHaveBeenCalled();
    });
  });

  describe('Auto Redirect Functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: mockUser
      });
    });

    it('should start auto redirect countdown for logged-in users', () => {
      renderWithRouter(<Home />);

      expect(screen.getByText('Redirecting to Projects')).toBeInTheDocument();
      expect(screen.getByText('Taking you to your projects dashboard...')).toBeInTheDocument();
      expect(screen.getByText('Redirecting in 2s')).toBeInTheDocument();
    });

    it('should countdown and redirect after delay', async () => {
      renderWithRouter(<Home />);

      // Fast-forward time by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('Redirecting in 1s')).toBeInTheDocument();

      // Fast-forward time by another second to trigger redirect
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(defaultMocks.navigateTo).toHaveBeenCalledWith('/projects');
      });
    });

    it('should not auto redirect when autoRedirect is false', () => {
      renderWithRouter(<Home autoRedirect={false} />);

      expect(screen.queryByText('Redirecting to Projects')).not.toBeInTheDocument();
    });

    it('should not auto redirect when showRedirectMessage is false', () => {
      renderWithRouter(<Home showRedirectMessage={false} />);

      expect(screen.queryByText('Redirecting to Projects')).not.toBeInTheDocument();
    });

    it('should allow manual redirect with Go Now button', () => {
      renderWithRouter(<Home />);

      const goNowButton = screen.getByText('Go Now');
      fireEvent.click(goNowButton);

      expect(defaultMocks.navigateTo).toHaveBeenCalledWith('/projects');
      expect(screen.queryByText('Redirecting to Projects')).not.toBeInTheDocument();
    });

    it('should allow staying on home page with Stay Here button', () => {
      renderWithRouter(<Home />);

      const stayHereButton = screen.getByText('Stay Here');
      fireEvent.click(stayHereButton);

      expect(screen.queryByText('Redirecting to Projects')).not.toBeInTheDocument();
    });

    it('should use custom redirect delay', () => {
      renderWithRouter(<Home redirectDelay={5000} />);

      expect(screen.getByText('Redirecting in 5s')).toBeInTheDocument();
    });

    it('should not redirect if user explicitly came to home page', () => {
      const mockLocation = { state: { from: 'explicit' } };
      
      renderWithRouter(
        <MemoryRouter initialEntries={[{ pathname: '/', state: mockLocation.state }]}>
          <Home />
        </MemoryRouter>
      );

      expect(screen.queryByText('Redirecting to Projects')).not.toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('should display user displayName when available', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: { ...mockUser, displayName: 'John Doe' }
      });

      renderWithRouter(<Home />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display email prefix when displayName is not available', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: { ...mockUser, displayName: null, email: 'john.doe@example.com' }
      });

      renderWithRouter(<Home />);

      expect(screen.getByText('john.doe')).toBeInTheDocument();
    });

    it('should display first letter of email for avatar when displayName is not available', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: { ...mockUser, displayName: null, email: 'john.doe@example.com' }
      });

      renderWithRouter(<Home />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
    });

    it('should display first letter of displayName for avatar when available', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: { ...mockUser, displayName: 'John Doe' }
      });

      renderWithRouter(<Home />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
    });

    it('should display U for avatar when no name or email is available', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: { uid: 'user1', displayName: null, email: null }
      });

      renderWithRouter(<Home />);

      const avatar = screen.getByText('U');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: mockUser
      });
    });

    it('should use default props when none provided', () => {
      renderWithRouter(<Home />);

      expect(screen.getByText('Redirecting in 2s')).toBeInTheDocument();
    });

    it('should use custom redirect delay', () => {
      renderWithRouter(<Home redirectDelay={3000} />);

      expect(screen.getByText('Redirecting in 3s')).toBeInTheDocument();
    });

    it('should not show redirect message when showRedirectMessage is false', () => {
      renderWithRouter(<Home showRedirectMessage={false} />);

      expect(screen.queryByText('Redirecting to Projects')).not.toBeInTheDocument();
    });

    it('should not auto redirect when autoRedirect is false', () => {
      renderWithRouter(<Home autoRedirect={false} />);

      expect(screen.queryByText('Redirecting to Projects')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<Home />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('CollabCanvas');
    });

    it('should have proper button roles', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: mockUser
      });

      renderWithRouter(<Home />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper link roles', () => {
      renderWithRouter(<Home />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have proper loading state accessibility', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        loading: true
      });

      renderWithRouter(<Home />);

      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      renderWithRouter(<Home />);

      // Check that responsive classes are applied
      const heroSection = screen.getByText('CollabCanvas').closest('div');
      expect(heroSection).toHaveClass('text-5xl', 'md:text-6xl');
    });

    it('should have responsive button layout', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: mockUser
      });

      renderWithRouter(<Home />);

      const buttonContainer = screen.getByText('Open Projects').closest('div');
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: { uid: 'user1', displayName: null, email: null }
      });

      renderWithRouter(<Home />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should handle navigation errors gracefully', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: mockUser
      });

      mockUseNavigation.mockReturnValue({
        navigateTo: jest.fn().mockImplementation(() => {
          throw new Error('Navigation failed');
        }),
        // ... other required properties
      } as any);

      renderWithRouter(<Home />);

      const openProjectsButton = screen.getByText('Open Projects');
      
      // Should not throw error
      expect(() => fireEvent.click(openProjectsButton)).not.toThrow();
    });
  });

  describe('Timer Cleanup', () => {
    it('should cleanup timers on unmount', () => {
      mockUseAuth.mockReturnValue({
        ...defaultMocks,
        user: mockUser
      });

      const { unmount } = renderWithRouter(<Home />);

      // Start the countdown
      expect(screen.getByText('Redirecting in 2s')).toBeInTheDocument();

      // Unmount component
      unmount();

      // Fast-forward time - should not cause errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(3000);
        });
      }).not.toThrow();
    });
  });
});
