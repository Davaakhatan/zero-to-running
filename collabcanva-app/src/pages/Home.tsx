// Home page component
// Landing page with authentication state and feature showcase
// Automatically redirects logged-in users to projects dashboard

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useProjects } from '../hooks/useProjects';
import { ThemeToggle } from '../contexts/ThemeContext';
import CreateProjectModal from '../components/Project/CreateProjectModal';

// Home component props
interface HomeProps {
  autoRedirect?: boolean;
  redirectDelay?: number;
  showRedirectMessage?: boolean;
}

export default function Home({ 
  autoRedirect = false, 
  redirectDelay = 2000,
  showRedirectMessage = false 
}: HomeProps) {
  const { user, logout, loading } = useAuth();
  const { navigateTo } = useNavigation();
  const { projects, projectsLoading } = useProjects();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calculate stats from projects data
  const activeProjectsCount = projects?.filter(p => !p.isArchived).length || 0;
  const totalCanvasesCount = projects?.reduce((total, project) => total + (project.canvasCount || 0), 0) || 0;

  // No auto-redirect - let users choose their action

  // Handle manual navigation
  const handleNavigateToProjects = () => {
    navigateTo('/projects');
  };

  // Handle project creation
  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleProjectCreated = (project: any) => {
    setShowCreateModal(false);
    // Navigate to the new project
    navigateTo(`/projects/${project.id}/canvases/canvas-1`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      {/* Theme Toggle - Fixed in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>
      
      {/* Hero Section */}
      <div className="w-full max-w-7xl px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg
                className="w-12 h-12 text-white"
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
          </div>

          {/* Title */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              CollabCanvas
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real-time collaborative design tool for teams to create, brainstorm, and build together
            </p>
          </div>
          
          {user ? (
            /* Logged In State */
            <div className="space-y-6 pt-6">

              {/* User Status Card */}
              <div className="bg-white/80 backdrop-blur-lg border-2 border-green-200 rounded-2xl p-6 shadow-xl max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-green-700 font-semibold">✅ Ready to collaborate</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleCreateProject}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 transform inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>New Project</span>
                </button>
                <button
                  onClick={handleNavigateToProjects}
                  className="px-8 py-4 bg-white/80 backdrop-blur-lg border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <span>Browse Projects</span>
                </button>
                <button 
                  onClick={logout}
                  className="px-8 py-4 bg-white/80 backdrop-blur-lg border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
                >
                  Sign Out
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {projectsLoading ? '...' : activeProjectsCount}
                  </div>
                  <div className="text-sm text-gray-600">Active Projects</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {activeProjectsCount === 0 ? 'Create your first!' : 'Keep building!'}
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {projectsLoading ? '...' : totalCanvasesCount}
                  </div>
                  <div className="text-sm text-gray-600">Canvases Created</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {totalCanvasesCount === 0 ? 'Start designing!' : 'Great work!'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Not Logged In State */
            <div className="space-y-6 pt-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl max-w-2xl mx-auto border border-gray-200/50">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Real-time</h3>
                    <p className="text-sm text-gray-600">See changes instantly</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Collaborate</h3>
                    <p className="text-sm text-gray-600">Work with your team</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Create</h3>
                    <p className="text-sm text-gray-600">Design together</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/login" 
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 transform text-center"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-8 py-4 bg-white border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all duration-200 shadow-lg text-center"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {user && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  );
}
