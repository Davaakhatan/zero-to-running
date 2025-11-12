// ProjectDashboardPage - Main dashboard for project management
// Provides overview of all projects and quick access to project features

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProjectProvider } from "../contexts/ProjectContext";
import { PermissionProvider } from "../contexts/PermissionContext";
import { NavigationProvider } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";
import { useMigration } from "../hooks/useMigration";
import { NavigationBar } from "../components/Navigation/NavigationBar";
import ProjectDashboard from "../components/Project/ProjectDashboard";
import CreateProjectModal from "../components/Project/CreateProjectModal";
import WelcomeScreen from "../components/Project/WelcomeScreen";
import { MigrationModal } from "../components/Migration/MigrationModal";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>
    </div>
  </div>
);

// Error component
const ErrorPage: React.FC<{ 
  title: string; 
  message: string; 
  onRetry?: () => void;
}> = ({ title, message, onRetry }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6 p-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ProjectDashboardPage component
export default function ProjectDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFixing, setIsFixing] = useState(false);
  const [showFixButton, setShowFixButton] = useState(false);

  // Migration handling
  const { 
    needsMigration, 
    isMigrating, 
    migrationError, 
    migrateUser, 
    retryMigration 
  } = useMigration();

  // Project data
  const { 
    projects,
    loading: projectsLoading,
    error: projectsError 
  } = useProjects();

  // Handle migration - TEMPORARILY DISABLED FOR DEMO
  // useEffect(() => {
  //   if (needsMigration && user) {
  //     migrateUser();
  //   }
  // }, [needsMigration, user, migrateUser]);

  // Handle initialization
  useEffect(() => {
    if (!projectsLoading && !isMigrating) {
      setIsInitializing(false);
    }
  }, [projectsLoading, isMigrating]);

  // Handle errors
  useEffect(() => {
    if (projectsError) {
      setError(projectsError);
    } else if (migrationError) {
      setError(migrationError);
    } else {
      setError(null);
    }
  }, [projectsError, migrationError]);

  // Handle URL parameters
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowCreateModal(true);
    }
  }, [searchParams]);
  
  // Check if data needs fixing
  useEffect(() => {
    const checkDataStructure = async () => {
      if (!user) return;
      
      try {
        const userProjectsRef = doc(db, 'userProjects', user.uid);
        const snap = await getDoc(userProjectsRef);
        
        if (snap.exists()) {
          const data = snap.data();
          // If data has nested 'projects' key, show fix button
          if (data.projects && typeof data.projects === 'object') {
            setShowFixButton(true);
          }
        }
      } catch (error) {
        console.error('Error checking data structure:', error);
      }
    };
    
    checkDataStructure();
  }, [user]);
  
  // Fix data structure
  const handleFixData = async () => {
    if (!user) return;
    
    setIsFixing(true);
    try {
      const userProjectsRef = doc(db, 'userProjects', user.uid);
      const snap = await getDoc(userProjectsRef);
      
      if (snap.exists()) {
        const data = snap.data();
        console.log('Current data:', data);
        
        if (data.projects && typeof data.projects === 'object') {
          // Flatten the structure
          const fixed = { ...data.projects };
          await setDoc(userProjectsRef, fixed);
          console.log('✅ Fixed! New structure:', fixed);
          
          // Reload page to show projects
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error fixing data:', error);
      alert('Failed to fix data. Please try refreshing the page.');
    } finally {
      setIsFixing(false);
    }
  };

  // Show migration modal - TEMPORARILY DISABLED FOR DEMO
  // if (needsMigration || isMigrating) {
  //   return (
  //     <MigrationModal
  //       isOpen={true}
  //       onClose={() => {}} // Prevent closing during migration
  //       onSuccess={() => {
  //         // Migration completed, continue with normal flow
  //       }}
  //       isLoading={isMigrating}
  //       error={migrationError}
  //       onRetry={retryMigration}
  //     />
  //   );
  // }

  // Show loading state
  if (isInitializing) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorPage
        title="Something went wrong"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Handle project actions
  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleEditProject = (projectId: string) => {
    // This would open an edit project modal
    console.log('Edit project:', projectId);
  };

  const handleDeleteProject = (projectId: string) => {
    // This would open a delete confirmation modal
    console.log('Delete project:', projectId);
  };

  const handleArchiveProject = (projectId: string) => {
    // This would archive the project
    console.log('Archive project:', projectId);
  };

  const handleShareProject = (projectId: string) => {
    // This would open a share project modal
    console.log('Share project:', projectId);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleCreateProjectSuccess = (project: any) => {
    setShowCreateModal(false);
    // Navigate to the new project
    navigate(`/projects/${project.id}`);
  };

  return (
    <NavigationProvider>
      <ProjectProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Enhanced navigation bar */}
            <NavigationBar 
              showBreadcrumb={true}
              showSearch={true}
              showNotifications={true}
              showUserMenu={true}
              showBackButton={false}
              showQuickActions={true}
              variant="default"
            />
            
            {/* Fix button for corrupted data */}
            {showFixButton && (
              <div className="pt-20 px-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Your project data needs to be updated to the new format. Click the button to fix it automatically.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleFixData}
                      disabled={isFixing}
                      className="ml-auto flex-shrink-0 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isFixing ? 'Fixing...' : 'Fix Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main content */}
            <div className={showFixButton ? "" : "pt-20"}>
              <div className="w-full px-6 py-8">
                <ProjectDashboard
                  onEditProject={handleEditProject}
                  onDeleteProject={handleDeleteProject}
                  onArchiveProject={handleArchiveProject}
                  onShareProject={handleShareProject}
                  onCreateProject={handleCreateProject}
                />
              </div>
            </div>

            {/* Create project modal */}
            {showCreateModal && (
              <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateProjectSuccess}
              />
            )}
          </div>
      </ProjectProvider>
    </NavigationProvider>
  );
}
