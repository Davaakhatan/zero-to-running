// CanvasPage - Standalone canvas access for legacy compatibility
// Redirects to a default project or creates one if none exists

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";

export default function CanvasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, createProject, projectsLoading } = useProjects();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Wait for projects to load
    if (projectsLoading) {
      return;
    }

    // If user has projects, redirect to the first one
    if (projects && projects.length > 0) {
      const firstProject = projects[0];
      const canvasId = firstProject.canvasCount > 0 
        ? 'main' // Default to main canvas
        : 'main';
      navigate(`/projects/${firstProject.id}/canvas/${canvasId}`, { replace: true });
      return;
    }

    // If no projects exist, create a default one
    const createDefaultProject = async () => {
      try {
        const defaultProject = await createProject({
          name: 'My Canvas',
          description: 'Default canvas project',
          color: '#3b82f6'
        });
        
        if (defaultProject) {
          navigate(`/projects/${defaultProject.id}/canvas/main`, { replace: true });
        }
      } catch (error) {
        console.error('Failed to create default project:', error);
        // Fallback: redirect to projects page
        navigate('/projects', { replace: true });
      }
    };

    createDefaultProject();
  }, [user, projects, projectsLoading, navigate, createProject]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading your canvas...</p>
      </div>
    </div>
  );
}
