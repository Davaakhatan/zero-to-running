// Enhanced navigation bar component with breadcrumb integration
// Provides comprehensive navigation with project context and user actions

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useProjectData } from '../../hooks/useProjectData';
import { useNavigation } from '../../contexts/NavigationContext';
import { ThemeToggle } from '../../contexts/ThemeContext';
import { ProjectBreadcrumb } from './ProjectBreadcrumb';
import { 
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { 
  BellIcon as BellIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/react/24/solid';

// Navigation bar props
interface NavigationBarProps {
  className?: string;
  showBreadcrumb?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showBackButton?: boolean;
  showQuickActions?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
}

// Main navigation bar component
export const NavigationBar: React.FC<NavigationBarProps> = ({
  className = '',
  showBreadcrumb = true,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  showBackButton = true,
  showQuickActions = true,
  variant = 'default',
  onSearch,
  onNotificationClick,
  onUserMenuClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentProject } = useProjects();
  const { currentProjectCanvases } = useProjectData();
  const { goBack, goForward, recentItems, favorites } = useNavigation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mock notifications (in real app, this would come from a service)
  useEffect(() => {
    // Simulate notification count
    setNotificationCount(Math.floor(Math.random() * 5));
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Add a small delay to allow button clicks to be processed first
      setTimeout(() => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
          setShowUserDropdown(false);
        }
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
          setShowNotificationsDropdown(false);
        }
      }, 100);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Update dropdown position when window resizes or scrolls
  useEffect(() => {
    const updatePosition = () => {
      if (showUserDropdown && userMenuRef.current) {
        const rect = userMenuRef.current.getBoundingClientRect();
        // Update the dropdown position by re-rendering
        setShowUserDropdown(false);
        setTimeout(() => setShowUserDropdown(true), 0);
      }
    };

    if (showUserDropdown) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [showUserDropdown]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    } else {
      // Default search behavior - navigate to projects with search
      if (query.trim()) {
        navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
      } else {
        navigate('/projects');
      }
    }
  };

  // Handle back navigation
  const handleBack = () => {
    goBack();
  };

  // Handle forward navigation
  const handleForward = () => {
    goForward();
  };

  // Handle user menu
  const handleUserMenuClick = () => {
    if (onUserMenuClick) {
      onUserMenuClick();
    } else {
      setShowUserDropdown(!showUserDropdown);
    }
  };

  // Handle notifications
  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      setShowNotificationsDropdown(!showNotificationsDropdown);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    console.log('handleSignOut called!');
    try {
      await logout();
      console.log('logout successful, navigating to home');
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Go back"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
              )}
              
              {showBreadcrumb && (
                <ProjectBreadcrumb variant="compact" />
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <ThemeToggle size="sm" />
              
              {showUserMenu && user && (
                <button
                  onClick={handleUserMenuClick}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title={user.displayName || user.email}
                >
                  <UserCircleIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <ProjectBreadcrumb variant="minimal" />
            
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <ThemeToggle size="sm" />
              
              {/* Notifications */}
              {showNotifications && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Notifications"
                  >
                    {notificationCount > 0 ? (
                      <BellIconSolid className="w-4 h-4" />
                    ) : (
                      <BellIcon className="w-4 h-4" />
                    )}
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
              
              {showUserMenu && user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <span>{user.displayName || user.email?.split('@')[0]}</span>
                    <UserCircleIcon className="w-5 h-5" />
                  </button>

                  {showUserDropdown && createPortal(
                    <div className="fixed w-56 rounded-lg shadow-xl border z-[99999] ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600" style={{ 
                      top: userMenuRef.current ? userMenuRef.current.getBoundingClientRect().bottom + 8 : 0,
                      right: userMenuRef.current ? window.innerWidth - userMenuRef.current.getBoundingClientRect().right : 0,
                      zIndex: 99999 
                    }}>
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.displayName || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <UserCircleIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Cog6ToothIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">Settings</span>
                        </button>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Sign out button clicked in portal');
                            handleSignOut();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <span className="text-sm text-red-600 dark:text-red-400">Sign out</span>
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Render default variant
  return (
    <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Navigation controls and breadcrumb */}
          <div className="flex items-center space-x-6">
            {/* Back/Forward buttons */}
            {showBackButton && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Go back"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleForward}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Go forward"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Breadcrumb */}
            {showBreadcrumb && (
              <div className="flex-1 min-w-0">
                <ProjectBreadcrumb 
                  variant="default"
                  showRecentItems={true}
                  showQuickActions={showQuickActions}
                />
              </div>
            )}
          </div>

          {/* Center section - Search */}
          {showSearch && (
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                    }
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search projects, canvases..."
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm transition-colors ${
                    isSearchFocused
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Right section - Actions and user menu */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle size="sm" className="p-2" />
            
            {/* Notifications */}
            {showNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={handleNotificationClick}
                  className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Notifications"
                >
                  {notificationCount > 0 ? (
                    <BellIconSolid className="w-4 h-4" />
                  ) : (
                    <BellIcon className="w-4 h-4" />
                  )}
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                      <button
                        onClick={() => setShowNotificationsDropdown(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
                        title="Close"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificationCount > 0 ? (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                          You have {notificationCount} new notifications
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                          No new notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User menu */}
            {showUserMenu && user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={handleUserMenuClick}
                  className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>

                {showUserDropdown && createPortal(
                  <div className="fixed w-56 rounded-lg shadow-xl border z-[99999] ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600" style={{ 
                    top: userMenuRef.current ? userMenuRef.current.getBoundingClientRect().bottom + 8 : 0,
                    right: userMenuRef.current ? window.innerWidth - userMenuRef.current.getBoundingClientRect().right : 0,
                    zIndex: 99999 
                  }}>
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <UserCircleIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">Profile</span>
                      </button>
                      
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Cog6ToothIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">Settings</span>
                      </button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Sign out button clicked in portal');
                          handleSignOut();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="text-sm text-red-600 dark:text-red-400">Sign out</span>
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
