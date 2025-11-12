import React, { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectCanvasProvider } from "../contexts/ProjectCanvasContext";
import { ProjectProvider } from "../contexts/ProjectContext";
import { PermissionProvider } from "../contexts/PermissionContext";
import { PresenceProvider } from "../contexts/PresenceContext";
import { NavigationProvider } from "../contexts/NavigationContext";
import { useProject } from "../contexts/ProjectContext";
import { useAuth } from "../contexts/AuthContext";
import { useProjectCanvas } from "../contexts/ProjectCanvasContext";
// import { usePresence } from "../hooks/usePresence"; // Not used
import { NavigationBar } from "../components/Navigation/NavigationBar";
import Canvas from "../components/Canvas/Canvas";
import CanvasControls from "../components/Canvas/CanvasControls";
import PropertiesPanel from "../components/Canvas/PropertiesPanel";
import { CanvasSwitcher, CanvasInfo } from "../components/Project/CanvasSwitcher";
import { CanvasToolbar } from "../components/Project/CanvasToolbar";
import { CanvasInitializer } from "../components/Canvas/CanvasInitializer";
import PresenceList from "../components/Collaboration/PresenceList";
import { useCursors } from "../hooks/useCursors";

// Lazy load heavy components
const HelpOverlay = lazy(() => import("../components/Canvas/HelpOverlay"));
const AICommandPanel = lazy(() => import("../components/AI/AICommandPanel"));

// Component that handles PresenceList with ProjectCanvasContext
function PresenceListWrapper({ cursors, projectId, canvasId }: { cursors: any; projectId: string; canvasId: string }) {
  const { panToPosition } = useProjectCanvas();
  
  // Handle clicking on a user in the presence list to jump to their cursor
  const handleUserClick = React.useCallback(
    (userId: string, cursorX: number, cursorY: number) => {
      console.log(`🎯 [PresenceListWrapper] Panning to user ${userId} at canvas position:`, cursorX, cursorY);
      panToPosition(cursorX, cursorY);
    },
    [panToPosition]
  );

  return (
    <PresenceList 
      cursors={cursors}
      onUserClick={handleUserClick}
      projectId={projectId}
      canvasId={canvasId}
    />
  );
}

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>
    </div>
  </div>
);


// Inner component that uses the Project context
function ProjectCanvasContent() {
  const params = useParams<{ projectId: string; canvasId: string }>();
  const projectId = params.projectId;
  const canvasId = params.canvasId;
  
  console.log('📍 [ProjectCanvasContent] URL params:', { projectId, canvasId, fullParams: params });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectLoadedRef = React.useRef<string | null>(null);
  
  // Get cursor data for PresenceList
  const { cursors } = useCursors(projectId, canvasId);

  // Get project data
  const { 
    state: { projects, currentProjectCanvases, projectsLoading },
    setCurrentProject
  } = useProject();

  // Set current project when component mounts and projects are loaded
  useEffect(() => {
    // Only proceed if we have a projectId
    if (!projectId) {
      console.log('[ProjectCanvasPage] No projectId, skipping');
      return;
    }
    
    // If we've already loaded this project, don't load again
    if (projectLoadedRef.current === projectId) {
      console.log('[ProjectCanvasPage] Project already loaded, skipping');
      return;
    }
    
    // If projects are still loading, wait
    if (projectsLoading) {
      console.log('[ProjectCanvasPage] Projects still loading, waiting...');
      return;
    }
    
    console.log('[ProjectCanvasPage] Loading project:', projectId);
    
    // Mark this project as loaded before calling setCurrentProject
    projectLoadedRef.current = projectId;
    
    // Try to set current project - setCurrentProject will handle loading from Firebase if needed
    setCurrentProject(projectId).catch((err) => {
      console.error('[ProjectCanvasPage] Failed to set current project:', err);
      setError('Project not found or access denied');
      projectLoadedRef.current = null; // Reset on error so we can retry
    });
  }, [projectId, setCurrentProject, projectsLoading]); // Removed 'projects' from dependencies

  // Reset loaded ref when projectId changes
  useEffect(() => {
    return () => {
      // Clean up when unmounting or projectId changes
      if (projectLoadedRef.current !== projectId) {
        projectLoadedRef.current = null;
      }
    };
  }, [projectId]);

  // Handle initialization
  useEffect(() => {
    // Simulate initialization delay
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handle canvas selection
  const handleCanvasSelect = (newCanvasId: string) => {
    navigate(`/projects/${projectId}/canvases/${newCanvasId}`);
  };

  // Show loading state - wait for projects to be loaded
  if (isInitializing || projectsLoading) {
    return <LoadingSpinner message="Loading project..." />;
  }

  // If no projects after loading, show error
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Projects Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Please create a project first.</p>
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get current canvas - provide fallback if needed
  const canvases = currentProjectCanvases || [{
    id: canvasId || 'canvas-1',
    name: 'Main Canvas',
    projectId: projectId || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    createdBy: user?.uid || '',
    isArchived: false,
    order: 0
  }];
  
  const currentCanvas = canvases.find(c => c.id === canvasId);

  return (
    <PermissionProvider projectId={projectId!}>
      <PresenceProvider projectId={projectId!} canvasId={canvasId}>
        <ProjectCanvasProvider>
          <CanvasInitializer projectId={projectId!} canvasId={canvasId!}>
                <div className="relative w-full h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
                  {/* Enhanced navigation bar with breadcrumb */}
                  <NavigationBar 
                    showBreadcrumb={false}
                    showSearch={true}
                    showNotifications={true}
                    showUserMenu={true}
                    showBackButton={false}
                    showQuickActions={false}
                    variant="minimal"
                  />
                  
                  {/* Compact canvas header with switcher and actions */}
                  <div className="fixed top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-40">
                    <div className="px-4 py-1.5 flex items-center gap-2">
                      <CanvasSwitcher
                        projectId={projectId!}
                        currentCanvasId={canvasId}
                        onCanvasSelect={handleCanvasSelect}
                        variant="compact"
                      />
                      <CanvasToolbar
                        projectId={projectId!}
                        currentCanvas={currentCanvas}
                        variant="compact"
                      />
                      <div className="h-3 w-px bg-gray-300 dark:bg-gray-600 hidden md:block" />
                      <CanvasInfo canvas={currentCanvas} className="hidden md:flex text-xs" />
                    </div>
                  </div>

                  {/* Main canvas area - add top padding for fixed header */}
                  <div className="flex-1 h-full pt-14">
                    <Canvas 
                      onShowHelp={() => setShowHelp(true)} 
                      projectId={projectId}
                      canvasId={canvasId}
                    />
                    <CanvasControls onShowHelp={() => setShowHelp(true)} />
                    <PropertiesPanel />
                    
                    {/* PresenceList - Draggable online users */}
                    <PresenceListWrapper 
                      cursors={cursors}
                      projectId={projectId}
                      canvasId={canvasId}
                    />
                    
                    <Suspense fallback={<div />}>
                      <AICommandPanel />
                    </Suspense>
                  </div>

                  {/* Help overlay */}
                  {showHelp && (
                    <Suspense fallback={<div />}>
                      <HelpOverlay onClose={() => setShowHelp(false)} />
                    </Suspense>
                  )}
                </div>
          </CanvasInitializer>
        </ProjectCanvasProvider>
      </PresenceProvider>
    </PermissionProvider>
  );
}

// Main component that provides the context
export default function ProjectCanvasPage() {
  return (
    <NavigationProvider>
      <ProjectProvider>
        <ProjectCanvasContent />
      </ProjectProvider>
    </NavigationProvider>
  );
}