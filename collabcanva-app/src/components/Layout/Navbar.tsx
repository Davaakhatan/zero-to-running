import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useProjects } from "../../hooks/useProjects";
import { useProjectCanvas } from "../../contexts/ProjectCanvasContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { getDisplayName } from "../../utils/helpers";
import { ProjectBreadcrumb } from "../Navigation/ProjectBreadcrumb";
import PresenceList from "../Collaboration/PresenceList";

// Navbar props interface
interface NavbarProps {
  variant?: 'default' | 'compact' | 'minimal';
  showBreadcrumb?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showBackButton?: boolean;
  showQuickActions?: boolean;
  className?: string;
}

export default function Navbar({
  variant = 'default',
  showBreadcrumb = true,
  showSearch = false,
  showNotifications = false,
  showUserMenu = true,
  showBackButton = false,
  showQuickActions = false,
  className = ''
}: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentProject } = useProjects();
  const { currentCanvas } = useProjectCanvas();
  const { goBack, goForward, navigationHistory, historyIndex, navigateTo } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  if (!user) return null;

  const displayName = getDisplayName(user);

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement actual search logic or navigate to a search results page
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery]);

  // Handle navigation
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setIsUserMenuOpen(false);
  }, [navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  // Handle forward navigation
  const handleForward = useCallback(() => {
    goForward();
  }, [goForward]);

  // Handle quick actions
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'new-project':
        navigateTo('/projects/new');
        break;
      case 'new-canvas':
        if (currentProject) {
          navigateTo(`/projects/${currentProject.id}/canvases/new`);
        }
        break;
      case 'home':
        navigateTo('/');
        break;
      case 'projects':
        navigateTo('/projects');
        break;
      default:
        break;
    }
  }, [navigateTo, currentProject]);

  // Render back/forward buttons
  const renderNavigationButtons = () => {
    if (!showBackButton) return null;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleBack}
          disabled={historyIndex === 0}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Go back"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleForward}
          disabled={historyIndex === navigationHistory.length - 1}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Go forward"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  // Render quick actions
  const renderQuickActions = () => {
    if (!showQuickActions) return null;

    return (
      <div className="flex items-center gap-2">
        {currentProject && (
          <button
            onClick={() => handleQuickAction('new-canvas')}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Canvas
          </button>
        )}
        <button
          onClick={() => handleQuickAction('new-project')}
          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          New Project
        </button>
      </div>
    );
  };

  // Render search
  const renderSearch = () => {
    if (!showSearch) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        {isSearchOpen && (
          <div className="absolute top-0 right-0 mt-12 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
            <input
              type="text"
              placeholder="Search projects, canvases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button
              onClick={handleSearch}
              className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render notifications
  const renderNotifications = () => {
    if (!showNotifications) return null;

    return (
      <button
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
        </svg>
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
    );
  };

  // Render user menu
  const renderUserMenu = () => {
    if (!showUserMenu) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
          </div>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isUserMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            <button
              onClick={() => handleNavigate('/profile')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Profile
            </button>
            <button
              onClick={() => handleNavigate('/settings')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Settings
            </button>
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <button
              onClick={logout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render breadcrumb
  const renderBreadcrumb = () => {
    if (!showBreadcrumb) return null;

    return (
      <div className="flex-1 mx-6">
        <ProjectBreadcrumb
          variant={variant === 'compact' ? 'compact' : 'default'}
          showQuickActions={showQuickActions}
          showRecentItems={true}
        />
      </div>
    );
  };

  // Render presence list
  const renderPresenceList = () => {
    if (variant === 'minimal') return null;

    return (
      <div className="hidden md:block">
        <PresenceList 
          cursors={{}}
          onUserClick={() => {}}
          projectId={currentProject?.id}
          canvasId={currentCanvas?.id}
        />
      </div>
    );
  };

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearchOpen || isUserMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('.navbar-search') && !target.closest('.navbar-user-menu')) {
          setIsSearchOpen(false);
          setIsUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, isUserMenuOpen]);

  return (
    <nav className={`fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/50 px-6 py-4 z-40 shadow-sm ${className}`}>
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left Section: Logo & Navigation */}
        <div className="flex items-center gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            {variant !== 'minimal' && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CollabCanvas
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-time Design Tool</p>
              </div>
            )}
          </Link>

          {/* Navigation Buttons */}
          {renderNavigationButtons()}

          {/* Breadcrumb */}
          {renderBreadcrumb()}
        </div>

        {/* Right Section: Actions & User Menu */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Search */}
          <div className="navbar-search">
            {renderSearch()}
          </div>

          {/* Notifications */}
          {renderNotifications()}

          {/* Presence List */}
          {renderPresenceList()}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 shadow-sm"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* User Menu */}
          <div className="navbar-user-menu">
            {renderUserMenu()}
          </div>
        </div>
      </div>
    </nav>
  );
}
