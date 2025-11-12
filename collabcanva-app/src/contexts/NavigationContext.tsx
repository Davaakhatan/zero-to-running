// Navigation context for managing global navigation state and actions
// Provides breadcrumb state, recent items, and navigation helpers

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Navigation item interface
interface NavigationItem {
  id: string;
  label: string;
  path: string;
  type: 'home' | 'projects' | 'project' | 'canvas' | 'custom';
  icon?: string;
  metadata?: {
    lastAccessed?: Date;
    isFavorite?: boolean;
    memberCount?: number;
    canvasCount?: number;
    projectId?: string;
    canvasId?: string;
  };
}

// Navigation state interface
interface NavigationState {
  currentPath: string;
  breadcrumbItems: NavigationItem[];
  recentItems: NavigationItem[];
  favorites: NavigationItem[];
  isNavigating: boolean;
  navigationHistory: string[];
  historyIndex: number;
}

// Navigation actions interface
interface NavigationActions {
  navigateTo: (path: string, options?: { replace?: boolean; state?: any }) => void;
  goBack: () => void;
  goForward: () => void;
  addToRecent: (item: Omit<NavigationItem, 'lastAccessed'>) => void;
  addToFavorites: (item: NavigationItem) => void;
  removeFromFavorites: (itemId: string) => void;
  clearRecent: () => void;
  clearHistory: () => void;
  updateBreadcrumb: (items: NavigationItem[]) => void;
}

// Navigation context type
interface NavigationContextType extends NavigationState, NavigationActions {}

// Create context
const NavigationContext = createContext<NavigationContextType | null>(null);

// Navigation provider props
interface NavigationProviderProps {
  children: React.ReactNode;
  maxRecentItems?: number;
  maxHistoryItems?: number;
}

// Navigation provider component
export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  maxRecentItems = 10,
  maxHistoryItems = 50
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [state, setState] = useState<NavigationState>({
    currentPath: location.pathname,
    breadcrumbItems: [],
    recentItems: [],
    favorites: [],
    isNavigating: false,
    navigationHistory: [location.pathname],
    historyIndex: 0
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedRecent = localStorage.getItem('collabcanvas_navigation_recent');
        const storedFavorites = localStorage.getItem('collabcanvas_navigation_favorites');
        const storedHistory = localStorage.getItem('collabcanvas_navigation_history');

        if (storedRecent) {
          const recent = JSON.parse(storedRecent).map((item: any) => ({
            ...item,
            lastAccessed: new Date(item.lastAccessed)
          }));
          setState(prev => ({ ...prev, recentItems: recent }));
        }

        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          setState(prev => ({ ...prev, favorites }));
        }

        if (storedHistory) {
          const history = JSON.parse(storedHistory);
          setState(prev => ({ ...prev, navigationHistory: history }));
        }
      } catch (error) {
        console.error('Failed to load navigation data:', error);
      }
    };

    loadStoredData();
  }, []);

  // Update current path when location changes
  useEffect(() => {
    setState(prev => {
      // Only update if the path has actually changed
      if (prev.currentPath === location.pathname) {
        return prev;
      }

      const newHistory = [...prev.navigationHistory, location.pathname].slice(-maxHistoryItems);
      
      // Save history to localStorage
      try {
        localStorage.setItem('collabcanvas_navigation_history', JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save navigation history:', error);
      }

      return {
        ...prev,
        currentPath: location.pathname,
        navigationHistory: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, [location.pathname, maxHistoryItems]);

  // Navigate to path
  const navigateTo = useCallback((
    path: string, 
    options: { replace?: boolean; state?: any } = {}
  ) => {
    setState(prev => ({ ...prev, isNavigating: true }));
    
    if (options.replace) {
      navigate(path, { replace: true, state: options.state });
    } else {
      navigate(path, { state: options.state });
    }
    
    // Reset navigating state after a short delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isNavigating: false }));
    }, 100);
  }, [navigate]);

  // Go back in history
  const goBack = useCallback(() => {
    if (state.navigationHistory.length > 1) {
      const previousPath = state.navigationHistory[state.navigationHistory.length - 2];
      navigate(previousPath, { replace: true });
    }
  }, [navigate, state.navigationHistory]);

  // Go forward in history (simplified - would need more complex history management)
  const goForward = useCallback(() => {
    // This would require maintaining a forward history stack
    // For now, we'll just navigate to the projects page
    navigate('/projects');
  }, [navigate]);

  // Add item to recent
  const addToRecent = useCallback((item: NavigationItem) => {
    const newItem: NavigationItem = {
      ...item,
      metadata: {
        ...item.metadata,
        lastAccessed: new Date()
      }
    };

    setState(prev => {
      const existing = prev.recentItems.filter(i => i.id !== newItem.id);
      const updated = [newItem, ...existing].slice(0, maxRecentItems);
      
      // Save to localStorage
      try {
        localStorage.setItem('collabcanvas_navigation_recent', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent items:', error);
      }
      
      return { ...prev, recentItems: updated };
    });
  }, [maxRecentItems]);

  // Add item to favorites
  const addToFavorites = useCallback((item: NavigationItem) => {
    setState(prev => {
      const existing = prev.favorites.find(f => f.id === item.id);
      if (existing) return prev;
      
      const updated = [...prev.favorites, { ...item, metadata: { ...item.metadata, isFavorite: true } }];
      
      // Save to localStorage
      try {
        localStorage.setItem('collabcanvas_navigation_favorites', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
      
      return { ...prev, favorites: updated };
    });
  }, []);

  // Remove item from favorites
  const removeFromFavorites = useCallback((itemId: string) => {
    setState(prev => {
      const updated = prev.favorites.filter(f => f.id !== itemId);
      
      // Save to localStorage
      try {
        localStorage.setItem('collabcanvas_navigation_favorites', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
      
      return { ...prev, favorites: updated };
    });
  }, []);

  // Clear recent items
  const clearRecent = useCallback(() => {
    setState(prev => ({ ...prev, recentItems: [] }));
    
    try {
      localStorage.removeItem('collabcanvas_navigation_recent');
    } catch (error) {
      console.error('Failed to clear recent items:', error);
    }
  }, []);

  // Clear navigation history
  const clearHistory = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      navigationHistory: [location.pathname] 
    }));
    
    try {
      localStorage.setItem('collabcanvas_navigation_history', JSON.stringify([location.pathname]));
    } catch (error) {
      console.error('Failed to clear navigation history:', error);
    }
  }, [location.pathname]);

  // Update breadcrumb items
  const updateBreadcrumb = useCallback((items: NavigationItem[]) => {
    setState(prev => ({ ...prev, breadcrumbItems: items }));
  }, []);

  const contextValue: NavigationContextType = {
    ...state,
    navigateTo,
    goBack,
    goForward,
    addToRecent,
    addToFavorites,
    removeFromFavorites,
    clearRecent,
    clearHistory,
    updateBreadcrumb
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

// Hook to use navigation context
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Hook for breadcrumb-specific functionality
export const useBreadcrumb = () => {
  const { breadcrumbItems, updateBreadcrumb, addToRecent } = useNavigation();
  
  const generateBreadcrumbFromPath = useCallback((path: string, projectData?: any, canvasData?: any) => {
    const items: NavigationItem[] = [];
    const segments = path.split('/').filter(Boolean);

    // Always start with home
    items.push({
      id: 'home',
      label: 'Home',
      path: '/',
      type: 'home',
      icon: 'home'
    });

    // Add projects if we're in project context
    if (segments.includes('projects')) {
      items.push({
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        type: 'projects',
        icon: 'folder'
      });

      // Add project if available
      if (projectData && segments.length >= 2) {
        items.push({
          id: projectData.id,
          label: projectData.name,
          path: `/projects/${projectData.id}`,
          type: 'project',
          icon: 'folder',
          metadata: {
            memberCount: projectData.members?.length || 0,
            canvasCount: projectData.canvases?.length || 0,
            projectId: projectData.id
          }
        });

        // Add canvas if available
        const canvasId = segments[segments.length - 1];
        if (canvasId && canvasId !== projectData.id && canvasData) {
          items.push({
            id: canvasData.id,
            label: canvasData.name,
            path: `/projects/${projectData.id}/canvases/${canvasData.id}`,
            type: 'canvas',
            icon: 'document',
            metadata: {
              projectId: projectData.id,
              canvasId: canvasData.id
            }
          });
        }
      }
    }

    updateBreadcrumb(items);
    return items;
  }, [updateBreadcrumb]);

  const navigateWithBreadcrumb = useCallback((path: string, item?: NavigationItem) => {
    if (item) {
      addToRecent(item);
    }
    // Navigation will be handled by the component using this hook
  }, [addToRecent]);

  return {
    breadcrumbItems,
    generateBreadcrumbFromPath,
    navigateWithBreadcrumb,
    updateBreadcrumb
  };
};
