// Enhanced project breadcrumb navigation component
// Provides comprehensive navigation with project hierarchy, recent items, and quick actions

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useProjectData } from '../../hooks/useProjectData';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChevronRightIcon, 
  HomeIcon, 
  FolderIcon, 
  DocumentIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  FolderIcon as FolderIconSolid,
  DocumentIcon as DocumentIconSolid
} from '@heroicons/react/24/solid';

// Breadcrumb item interface
interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
  type: 'home' | 'projects' | 'project' | 'canvas' | 'custom';
  icon?: React.ReactNode;
  isActive?: boolean;
  metadata?: {
    lastAccessed?: Date;
    isFavorite?: boolean;
    memberCount?: number;
    canvasCount?: number;
  };
}

// Recent item interface
interface RecentItem {
  id: string;
  label: string;
  path: string;
  type: 'project' | 'canvas';
  lastAccessed: Date;
  projectId: string;
  canvasId?: string;
}

// Project breadcrumb props
interface ProjectBreadcrumbProps {
  className?: string;
  showRecentItems?: boolean;
  showQuickActions?: boolean;
  maxRecentItems?: number;
  variant?: 'default' | 'compact' | 'minimal';
  onNavigate?: (path: string) => void;
}

// Main breadcrumb component
export const ProjectBreadcrumb: React.FC<ProjectBreadcrumbProps> = ({
  className = '',
  showRecentItems = true,
  showQuickActions = true,
  maxRecentItems = 5,
  variant = 'default',
  onNavigate
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentProject } = useProjects();
  const { currentProjectCanvases } = useProjectData();
  
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const recentRef = useRef<HTMLDivElement>(null);

  // Generate breadcrumb items based on current route
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Always start with home
    items.push({
      id: 'home',
      label: 'Home',
      path: '/',
      type: 'home',
      icon: <HomeIcon className="w-4 h-4" />
    });

    // Add projects if we're in project context
    if (pathSegments.includes('projects')) {
      items.push({
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        type: 'projects',
        icon: <FolderIcon className="w-4 h-4" />
      });

      // Add current project if available
      if (currentProject && pathSegments.length >= 2) {
        items.push({
          id: currentProject.id,
          label: currentProject.name,
          path: `/projects/${currentProject.id}`,
          type: 'project',
          icon: <FolderIconSolid className="w-4 h-4" />,
          metadata: {
            memberCount: currentProject.members?.length || 0,
            canvasCount: currentProjectCanvases?.length || 0
          }
        });

        // Add current canvas if available
        const canvasId = pathSegments[pathSegments.length - 1];
        if (canvasId && canvasId !== currentProject.id) {
          const currentCanvas = currentProjectCanvases?.find(c => c.id === canvasId);
          if (currentCanvas) {
            items.push({
              id: currentCanvas.id,
              label: currentCanvas.name,
              path: `/projects/${currentProject.id}/canvases/${currentCanvas.id}`,
              type: 'canvas',
              icon: <DocumentIconSolid className="w-4 h-4" />,
              isActive: true
            });
          }
        }
      }
    }

    return items;
  };

  // Load recent items from localStorage
  useEffect(() => {
    const loadRecentItems = () => {
      try {
        const stored = localStorage.getItem('collabcanvas_recent_items');
        if (stored) {
          const items = JSON.parse(stored).map((item: any) => ({
            ...item,
            lastAccessed: new Date(item.lastAccessed)
          }));
          setRecentItems(items.slice(0, maxRecentItems));
        }
      } catch (error) {
        console.error('Failed to load recent items:', error);
      }
    };

    loadRecentItems();
  }, [maxRecentItems]);

  // Save recent item
  const saveRecentItem = (item: Omit<RecentItem, 'lastAccessed'>) => {
    try {
      const newItem: RecentItem = {
        ...item,
        lastAccessed: new Date()
      };

      const existing = recentItems.filter(i => i.id !== newItem.id);
      const updated = [newItem, ...existing].slice(0, maxRecentItems);
      
      setRecentItems(updated);
      localStorage.setItem('collabcanvas_recent_items', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent item:', error);
    }
  };

  // Handle navigation
  const handleNavigate = (path: string, item?: BreadcrumbItem) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }

    // Save to recent items if it's a project or canvas
    if (item && (item.type === 'project' || item.type === 'canvas')) {
      saveRecentItem({
        id: item.id,
        label: item.label,
        path: item.path,
        type: item.type,
        projectId: currentProject?.id || '',
        canvasId: item.type === 'canvas' ? item.id : undefined
      });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(event.target as Node)) {
        setIsRecentOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const breadcrumbItems = generateBreadcrumbItems();

  // Render compact variant
  if (variant === 'compact') {
    return (
      <nav className={`flex items-center space-x-1 text-sm ${className}`}>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRightIcon className="w-3 h-3 text-gray-400" />
            )}
            <button
              onClick={() => handleNavigate(item.path, item)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                item.isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[120px]">{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>
    );
  }

  // Render minimal variant
  if (variant === 'minimal') {
    const currentItem = breadcrumbItems[breadcrumbItems.length - 1];
    return (
      <nav className={`flex items-center space-x-2 text-sm ${className}`}>
        <button
          onClick={() => handleNavigate('/projects')}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <FolderIcon className="w-4 h-4" />
        </button>
        <ChevronRightIcon className="w-3 h-3 text-gray-400" />
        <span className="text-gray-900 dark:text-white font-medium">
          {currentItem?.label || 'Canvas'}
        </span>
      </nav>
    );
  }

  // Render default variant
  return (
    <div className={`relative ${className}`}>
      <nav className="flex items-center space-x-1 text-sm">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
            )}
            <button
              onClick={() => handleNavigate(item.path, item)}
              className={`flex items-center space-x-2 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                item.isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
              {item.metadata && (
                <div className="flex items-center space-x-1 text-xs opacity-75">
                  {item.metadata.memberCount !== undefined && (
                    <span>{item.metadata.memberCount} members</span>
                  )}
                  {item.metadata.canvasCount !== undefined && (
                    <span>{item.metadata.canvasCount} canvases</span>
                  )}
                </div>
              )}
            </button>
          </React.Fragment>
        ))}

        {/* Recent items dropdown */}
        {showRecentItems && recentItems.length > 0 && (
          <div className="relative" ref={recentRef}>
            <button
              onClick={() => setIsRecentOpen(!isRecentOpen)}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm">Recent</span>
            </button>

            {isRecentOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Recent Items</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {recentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleNavigate(item.path);
                        setIsRecentOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {item.type === 'project' ? (
                        <FolderIcon className="w-4 h-4 text-blue-500" />
                      ) : (
                        <DocumentIcon className="w-4 h-4 text-green-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.lastAccessed.toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </nav>
    </div>
  );
};

// Breadcrumb context for sharing state
interface BreadcrumbContextType {
  addRecentItem: (item: Omit<RecentItem, 'lastAccessed'>) => void;
  getRecentItems: () => RecentItem[];
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType | null>(null);

export const useBreadcrumb = (): BreadcrumbContextType => {
  const context = React.useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};

// Breadcrumb provider component
export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const addRecentItem = (item: Omit<RecentItem, 'lastAccessed'>) => {
    const newItem: RecentItem = {
      ...item,
      lastAccessed: new Date()
    };

    setRecentItems(prev => {
      const existing = prev.filter(i => i.id !== newItem.id);
      const updated = [newItem, ...existing].slice(0, 10);
      
      // Save to localStorage
      try {
        localStorage.setItem('collabcanvas_recent_items', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent items:', error);
      }
      
      return updated;
    });
  };

  const getRecentItems = () => recentItems;

  return (
    <BreadcrumbContext.Provider value={{ addRecentItem, getRecentItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};
