// CanvasToolbar component for canvas management actions
// Provides quick access to canvas operations like create, duplicate, rename, delete

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { ProjectCanvas } from "../../types"

// Canvas toolbar props
interface CanvasToolbarProps {
  projectId: string;
  currentCanvas?: ProjectCanvas;
  onCanvasCreate?: () => void;
  onCanvasRename?: () => void;
  onCanvasDuplicate?: () => void;
  onCanvasDelete?: () => void;
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'compact';
}

// Canvas toolbar component
export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  projectId,
  currentCanvas,
  onCanvasCreate,
  onCanvasRename,
  onCanvasDuplicate,
  onCanvasDelete,
  className = '',
  variant = 'horizontal'
}) => {
  const navigate = useNavigate();
  const { addProjectCanvas, updateProjectCanvas, removeProjectCanvas } = useProject();
  const { user } = useAuth();
  const { canEdit, canDelete } = usePermissions({ projectId });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle create canvas
  const handleCreateCanvas = async () => {
    if (onCanvasCreate) {
      onCanvasCreate();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Create new canvas object
      const newCanvas: ProjectCanvas = {
        id: `canvas-${Date.now()}`,
        projectId,
        name: 'New Canvas',
        description: 'A new canvas',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: user?.uid || 'anonymous',
        isArchived: false,
        order: 0
      };
      
      await addProjectCanvas(projectId, newCanvas);
      console.log('Canvas created:', newCanvas);
      
      // Navigate to the new canvas
      navigate(`/projects/${projectId}/canvases/${newCanvas.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create canvas');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle duplicate canvas
  const handleDuplicateCanvas = async () => {
    if (!currentCanvas) return;

    if (onCanvasDuplicate) {
      onCanvasDuplicate();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Create duplicated canvas object
      const duplicatedCanvas: ProjectCanvas = {
        ...currentCanvas,
        id: `canvas-${Date.now()}`,
        name: `${currentCanvas.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: user?.uid || 'anonymous'
      };
      
      await addProjectCanvas(projectId, duplicatedCanvas);
      console.log('Canvas duplicated:', duplicatedCanvas);
      
      // Navigate to the duplicated canvas
      navigate(`/projects/${projectId}/canvases/${duplicatedCanvas.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate canvas');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rename canvas
  const handleRenameCanvas = () => {
    if (onCanvasRename) {
      onCanvasRename();
    }
  };

  // Handle delete canvas
  const handleDeleteCanvas = async () => {
    if (!currentCanvas) return;

    if (onCanvasDelete) {
      onCanvasDelete();
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${currentCanvas.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await removeProjectCanvas(projectId, currentCanvas.id);
      console.log('Canvas deleted:', currentCanvas.id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete canvas');
    } finally {
      setIsLoading(false);
    }
  };

  // Toolbar button component
  const ToolbarButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    title: string;
    icon: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
  }> = ({ onClick, disabled, title, icon, variant: buttonVariant = 'secondary' }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md focus:ring-blue-500",
      secondary: "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-blue-500",
      danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus:ring-red-500"
    };

    const sizeClasses = "p-2";

    return (
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        title={title}
        className={`${baseClasses} ${variantClasses[buttonVariant]} ${sizeClasses}`}
      >
        {icon}
      </button>
    );
  };

  // Error display
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 ${className}`}>
        <div className="flex items-center">
          <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {canEdit && (
          <ToolbarButton
            onClick={handleCreateCanvas}
            disabled={isLoading}
            title="Create new canvas"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            variant="primary"
          />
        )}

        {currentCanvas && canEdit && (
          <>
            <ToolbarButton
              onClick={handleRenameCanvas}
              disabled={isLoading}
              title="Rename canvas"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            />
            <ToolbarButton
              onClick={handleDuplicateCanvas}
              disabled={isLoading}
              title="Duplicate canvas"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
          </>
        )}

        {currentCanvas && canDelete && (
          <ToolbarButton
            onClick={handleDeleteCanvas}
            disabled={isLoading}
            title="Delete canvas"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            variant="danger"
          />
        )}
      </div>
    );
  }

  // Vertical variant
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col space-y-2 ${className}`}>
        {canEdit && (
          <ToolbarButton
            onClick={handleCreateCanvas}
            disabled={isLoading}
            title="Create new canvas"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            variant="primary"
          />
        )}

        {currentCanvas && canEdit && (
          <>
            <ToolbarButton
              onClick={handleRenameCanvas}
              disabled={isLoading}
              title="Rename canvas"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            />
            <ToolbarButton
              onClick={handleDuplicateCanvas}
              disabled={isLoading}
              title="Duplicate canvas"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
          </>
        )}

        {currentCanvas && canDelete && (
          <ToolbarButton
            onClick={handleDeleteCanvas}
            disabled={isLoading}
            title="Delete canvas"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            variant="danger"
          />
        )}
      </div>
    );
  }

  // Compact variant - minimal inline buttons next to canvas switcher
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-0.5 ${className}`}>
        {canEdit && (
          <button
            onClick={handleCreateCanvas}
            disabled={isLoading}
            title="Create new canvas"
            className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {currentCanvas && canEdit && (
          <>
            <button
              onClick={handleRenameCanvas}
              disabled={isLoading}
              title="Rename canvas"
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDuplicateCanvas}
              disabled={isLoading}
              title="Duplicate canvas"
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteCanvas}
              disabled={isLoading}
              title="Delete canvas"
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    );
  }

  return null;
};

// Canvas status indicator component
interface CanvasStatusIndicatorProps {
  canvas?: ProjectCanvas;
  className?: string;
}

export const CanvasStatusIndicator: React.FC<CanvasStatusIndicatorProps> = ({
  canvas,
  className = ''
}) => {
  if (!canvas) return null;

  const getStatusColor = () => {
    if (canvas.isArchived) return 'text-gray-500 dark:text-gray-400';
    return 'text-green-500 dark:text-green-400';
  };

  const getStatusText = () => {
    if (canvas.isArchived) return 'Archived';
    return 'Active';
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${canvas.isArchived ? 'bg-gray-400' : 'bg-green-400'}`} />
      <span className={`font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default CanvasToolbar;
