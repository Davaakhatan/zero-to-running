// Unit tests for NavigationContext
// Tests for navigation state management and actions

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationProvider, useNavigation, useBreadcrumb } from './NavigationContext';
import { useAuth } from './AuthContext';

// Mock dependencies
jest.mock('./AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test component that uses the navigation context
const TestComponent: React.FC = () => {
  const navigation = useNavigation();
  
  return (
    <div>
      <div data-testid="current-path">{navigation.currentPath}</div>
      <div data-testid="breadcrumb-count">{navigation.breadcrumbItems.length}</div>
      <div data-testid="recent-count">{navigation.recentItems.length}</div>
      <div data-testid="favorites-count">{navigation.favorites.length}</div>
      <div data-testid="is-navigating">{navigation.isNavigating.toString()}</div>
      <button onClick={() => navigation.navigateTo('/test')}>Navigate</button>
      <button onClick={() => navigation.goBack()}>Go Back</button>
      <button onClick={() => navigation.goForward()}>Go Forward</button>
      <button onClick={() => navigation.addToRecent({
        id: 'test1',
        label: 'Test Item',
        path: '/test',
        type: 'project'
      })}>Add Recent</button>
      <button onClick={() => navigation.addToFavorites({
        id: 'fav1',
        label: 'Favorite Item',
        path: '/favorite',
        type: 'project'
      })}>Add Favorite</button>
      <button onClick={() => navigation.removeFromFavorites('fav1')}>Remove Favorite</button>
      <button onClick={() => navigation.clearRecent()}>Clear Recent</button>
      <button onClick={() => navigation.clearHistory()}>Clear History</button>
      <button onClick={() => navigation.updateBreadcrumb([{
        id: 'breadcrumb1',
        label: 'Breadcrumb Item',
        path: '/breadcrumb',
        type: 'custom'
      }])}>Update Breadcrumb</button>
    </div>
  );
};

// Test component that uses the breadcrumb hook
const BreadcrumbTestComponent: React.FC = () => {
  const breadcrumb = useBreadcrumb();
  
  return (
    <div>
      <div data-testid="breadcrumb-items">{breadcrumb.breadcrumbItems.length}</div>
      <button onClick={() => breadcrumb.generateBreadcrumbFromPath('/projects/project1/canvases/canvas1', {
        id: 'project1',
        name: 'Test Project',
        members: []
      }, {
        id: 'canvas1',
        name: 'Test Canvas'
      })}>Generate Breadcrumb</button>
      <button onClick={() => breadcrumb.navigateWithBreadcrumb('/test', {
        id: 'test1',
        label: 'Test Item',
        path: '/test',
        type: 'project'
      })}>Navigate With Breadcrumb</button>
    </div>
  );
};

describe('NavigationContext', () => {
  const mockUser = {
    uid: 'user1',
    email: 'user1@example.com',
    displayName: 'User One'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });

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

  const renderWithProvider = (component: React.ReactElement, initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <NavigationProvider>
          {component}
        </NavigationProvider>
      </MemoryRouter>
    );
  };

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('0');
      expect(screen.getByTestId('recent-count')).toHaveTextContent('0');
      expect(screen.getByTestId('favorites-count')).toHaveTextContent('0');
      expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
    });

    it('should load data from localStorage on mount', () => {
      const mockRecentItems = [
        {
          id: 'recent1',
          label: 'Recent Item',
          path: '/recent',
          type: 'project',
          lastAccessed: new Date().toISOString()
        }
      ];

      const mockFavorites = [
        {
          id: 'fav1',
          label: 'Favorite Item',
          path: '/favorite',
          type: 'project'
        }
      ];

      (window.localStorage.getItem as jest.Mock)
        .mockReturnValueOnce(JSON.stringify(mockRecentItems))
        .mockReturnValueOnce(JSON.stringify(mockFavorites))
        .mockReturnValueOnce(JSON.stringify(['/previous']));

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('recent-count')).toHaveTextContent('1');
      expect(screen.getByTestId('favorites-count')).toHaveTextContent('1');
    });

    it('should handle localStorage errors gracefully', () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not crash
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    });
  });

  describe('Navigation Actions', () => {
    it('should handle navigation', () => {
      renderWithProvider(<TestComponent />);

      const navigateButton = screen.getByText('Navigate');
      act(() => {
        navigateButton.click();
      });

      expect(screen.getByTestId('is-navigating')).toHaveTextContent('true');
    });

    it('should handle go back', () => {
      renderWithProvider(<TestComponent />, ['/initial', '/current']);

      const goBackButton = screen.getByText('Go Back');
      act(() => {
        goBackButton.click();
      });

      // Should call goBack function
      expect(goBackButton).toBeInTheDocument();
    });

    it('should handle go forward', () => {
      renderWithProvider(<TestComponent />);

      const goForwardButton = screen.getByText('Go Forward');
      act(() => {
        goForwardButton.click();
      });

      // Should call goForward function
      expect(goForwardButton).toBeInTheDocument();
    });
  });

  describe('Recent Items Management', () => {
    it('should add item to recent', () => {
      renderWithProvider(<TestComponent />);

      const addRecentButton = screen.getByText('Add Recent');
      act(() => {
        addRecentButton.click();
      });

      expect(screen.getByTestId('recent-count')).toHaveTextContent('1');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'collabcanvas_navigation_recent',
        expect.stringContaining('Test Item')
      );
    });

    it('should limit recent items to maxRecentItems', () => {
      renderWithProvider(
        <NavigationProvider maxRecentItems={2}>
          <TestComponent />
        </NavigationProvider>
      );

      // Add more items than the limit
      const addRecentButton = screen.getByText('Add Recent');
      act(() => {
        addRecentButton.click();
        addRecentButton.click();
        addRecentButton.click();
      });

      expect(screen.getByTestId('recent-count')).toHaveTextContent('2');
    });

    it('should clear recent items', () => {
      renderWithProvider(<TestComponent />);

      // Add an item first
      const addRecentButton = screen.getByText('Add Recent');
      act(() => {
        addRecentButton.click();
      });

      expect(screen.getByTestId('recent-count')).toHaveTextContent('1');

      // Clear recent items
      const clearRecentButton = screen.getByText('Clear Recent');
      act(() => {
        clearRecentButton.click();
      });

      expect(screen.getByTestId('recent-count')).toHaveTextContent('0');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('collabcanvas_navigation_recent');
    });
  });

  describe('Favorites Management', () => {
    it('should add item to favorites', () => {
      renderWithProvider(<TestComponent />);

      const addFavoriteButton = screen.getByText('Add Favorite');
      act(() => {
        addFavoriteButton.click();
      });

      expect(screen.getByTestId('favorites-count')).toHaveTextContent('1');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'collabcanvas_navigation_favorites',
        expect.stringContaining('Favorite Item')
      );
    });

    it('should not add duplicate favorites', () => {
      renderWithProvider(<TestComponent />);

      const addFavoriteButton = screen.getByText('Add Favorite');
      act(() => {
        addFavoriteButton.click();
        addFavoriteButton.click(); // Try to add same item again
      });

      expect(screen.getByTestId('favorites-count')).toHaveTextContent('1');
    });

    it('should remove item from favorites', () => {
      renderWithProvider(<TestComponent />);

      // Add an item first
      const addFavoriteButton = screen.getByText('Add Favorite');
      act(() => {
        addFavoriteButton.click();
      });

      expect(screen.getByTestId('favorites-count')).toHaveTextContent('1');

      // Remove the item
      const removeFavoriteButton = screen.getByText('Remove Favorite');
      act(() => {
        removeFavoriteButton.click();
      });

      expect(screen.getByTestId('favorites-count')).toHaveTextContent('0');
    });
  });

  describe('Breadcrumb Management', () => {
    it('should update breadcrumb items', () => {
      renderWithProvider(<TestComponent />);

      const updateBreadcrumbButton = screen.getByText('Update Breadcrumb');
      act(() => {
        updateBreadcrumbButton.click();
      });

      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('1');
    });
  });

  describe('History Management', () => {
    it('should clear navigation history', () => {
      renderWithProvider(<TestComponent />);

      const clearHistoryButton = screen.getByText('Clear History');
      act(() => {
        clearHistoryButton.click();
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'collabcanvas_navigation_history',
        JSON.stringify(['/'])
      );
    });
  });

  describe('useBreadcrumb Hook', () => {
    it('should provide breadcrumb functionality', () => {
      renderWithProvider(<BreadcrumbTestComponent />);

      expect(screen.getByTestId('breadcrumb-items')).toHaveTextContent('0');
    });

    it('should generate breadcrumb from path', () => {
      renderWithProvider(<BreadcrumbTestComponent />);

      const generateButton = screen.getByText('Generate Breadcrumb');
      act(() => {
        generateButton.click();
      });

      expect(screen.getByTestId('breadcrumb-items')).toHaveTextContent('4'); // Home, Projects, Project, Canvas
    });

    it('should handle navigation with breadcrumb', () => {
      renderWithProvider(<BreadcrumbTestComponent />);

      const navigateButton = screen.getByText('Navigate With Breadcrumb');
      act(() => {
        navigateButton.click();
      });

      // Should add to recent items
      expect(screen.getByTestId('recent-count')).toHaveTextContent('1');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage setItem errors', () => {
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      // Should not crash
      renderWithProvider(<TestComponent />);

      const addRecentButton = screen.getByText('Add Recent');
      act(() => {
        addRecentButton.click();
      });

      expect(screen.getByTestId('recent-count')).toHaveTextContent('1');
    });

    it('should handle invalid JSON in localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid json');

      // Should not crash
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    });
  });

  describe('Context Provider', () => {
    it('should throw error when useNavigation is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useNavigation must be used within a NavigationProvider');
      
      consoleError.mockRestore();
    });

    it('should throw error when useBreadcrumb is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<BreadcrumbTestComponent />);
      }).toThrow('useBreadcrumb must be used within a NavigationProvider');
      
      consoleError.mockRestore();
    });
  });
});
