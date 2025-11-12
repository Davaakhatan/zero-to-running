// CanvasManagement component for managing canvases within a project
// Provides interface for creating, renaming, deleting, and duplicating canvases

import React, { useState, useCallback } from 'react';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';
import { useProjects } from '../../hooks/useProjects';
import { usePermissions, Permission } from '../../hooks/usePermissions';
import type { ProjectCanvas } from "../../types"

// Canvas management props
interface CanvasManagementProps {
  projectId: string;
  currentCanvasId?: string;
  onCanvasSelect?: (canvasId: string) => void;
  className?: string;
}

// Canvas card props
interface CanvasCardProps {
  canvas: ProjectCanvas;
  isSelected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

// Canvas card component
const CanvasCard: React.FC<CanvasCardProps> = ({
  canvas,
  isSelected,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  canEdit,
  canDelete
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowActions(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowActions(false);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div
      className={`
        relative group cursor-pointer rounded-lg border-2 transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${isHovered ? 'shadow-lg scale-105' : 'shadow-sm'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
    >
      {/* Canvas thumbnail placeholder */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Canvas info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
            {canvas.name}
          </h3>
          {canvas.isArchived && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              Archived
            </span>
          )}
        </div>
        
        {canvas.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {canvas.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{canvas.width} × {canvas.height}</span>
          <span>{formatDate(canvas.updatedAt)}</span>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (canEdit || canDelete) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {canEdit && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
                className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Rename canvas"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Duplicate canvas"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors"
              title="Delete canvas"
            >
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Main canvas management component
export const CanvasManagement: React.FC<CanvasManagementProps> = ({
  projectId,
  currentCanvasId,
  onCanvasSelect,
  className = ''
}) => {
  const { projectCanvases, createCanvas, updateCanvas, deleteCanvas, duplicateCanvas } = useProjectCanvas();
  const { currentProject } = useProjects();
  const { hasPermission } = usePermissions({ projectId });
  const canEdit = hasPermission('canvas.edit');
  const canDelete = hasPermission('canvas.delete');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState<ProjectCanvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out archived canvases for main view
  const activeCanvases = projectCanvases.filter(canvas => !canvas.isArchived);
  const archivedCanvases = projectCanvases.filter(canvas => canvas.isArchived);

  // Handle canvas selection
  const handleCanvasSelect = useCallback((canvasId: string) => {
    onCanvasSelect?.(canvasId);
  }, [onCanvasSelect]);

  // Handle create canvas
  const handleCreateCanvas = useCallback(async (name: string, description?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await createCanvas(name);
      setShowCreateModal(false);
      
      // Canvas will be automatically added to the list via context
      // No need to auto-select since we don't have the canvas ID
    } catch (err: any) {
      setError(err.message || 'Failed to create canvas');
    } finally {
      setIsLoading(false);
    }
  }, [createCanvas, handleCanvasSelect]);

  // Handle rename canvas
  const handleRenameCanvas = useCallback(async (name: string, description?: string) => {
    if (!selectedCanvas) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await updateCanvas(selectedCanvas.id, { name, description });
      setShowRenameModal(false);
      setSelectedCanvas(null);
    } catch (err: any) {
      setError(err.message || 'Failed to rename canvas');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCanvas, updateCanvas]);

  // Handle duplicate canvas
  const handleDuplicateCanvas = useCallback(async (canvas: ProjectCanvas) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await duplicateCanvas(canvas.id);
      
      // Auto-select the duplicated canvas (it will be the last one in the list)
      const duplicatedCanvas = projectCanvases[projectCanvases.length - 1];
      if (duplicatedCanvas) {
        handleCanvasSelect(duplicatedCanvas.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate canvas');
    } finally {
      setIsLoading(false);
    }
  }, [duplicateCanvas, handleCanvasSelect]);

  // Handle delete canvas
  const handleDeleteCanvas = useCallback(async () => {
    if (!selectedCanvas) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await deleteCanvas(selectedCanvas.id);
      setShowDeleteModal(false);
      setSelectedCanvas(null);
      
      // If we deleted the current canvas, select the first available canvas
      if (selectedCanvas.id === currentCanvasId) {
        const remainingCanvases = activeCanvases.filter(c => c.id !== selectedCanvas.id);
        if (remainingCanvases.length > 0) {
          handleCanvasSelect(remainingCanvases[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete canvas');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCanvas, deleteCanvas, currentCanvasId, activeCanvases, handleCanvasSelect]);

  // Open rename modal
  const openRenameModal = useCallback((canvas: ProjectCanvas) => {
    setSelectedCanvas(canvas);
    setShowRenameModal(true);
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback((canvas: ProjectCanvas) => {
    setSelectedCanvas(canvas);
    setShowDeleteModal(true);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Canvases
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeCanvases.length} active canvas{activeCanvases.length !== 1 ? 'es' : ''}
            {archivedCanvases.length > 0 && `, ${archivedCanvases.length} archived`}
          </p>
        </div>
        
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Canvas
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
          </div>
        </div>
      )}

      {/* Active canvases */}
      {activeCanvases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeCanvases.map((canvas) => (
            <CanvasCard
              key={canvas.id}
              canvas={canvas}
              isSelected={canvas.id === currentCanvasId}
              onSelect={() => handleCanvasSelect(canvas.id)}
              onRename={() => openRenameModal(canvas)}
              onDuplicate={() => handleDuplicateCanvas(canvas)}
              onDelete={() => openDeleteModal(canvas)}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No canvases</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new canvas.
          </p>
          {canEdit && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Canvas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Archived canvases */}
      {archivedCanvases.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Archived Canvases</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {archivedCanvases.map((canvas) => (
              <CanvasCard
                key={canvas.id}
                canvas={canvas}
                isSelected={canvas.id === currentCanvasId}
                onSelect={() => handleCanvasSelect(canvas.id)}
                onRename={() => openRenameModal(canvas)}
                onDuplicate={() => handleDuplicateCanvas(canvas)}
                onDelete={() => openDeleteModal(canvas)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateCanvasModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCanvas}
          isLoading={isLoading}
        />
      )}

      {showRenameModal && selectedCanvas && (
        <RenameCanvasModal
          isOpen={showRenameModal}
          onClose={() => {
            setShowRenameModal(false);
            setSelectedCanvas(null);
          }}
          canvas={selectedCanvas}
          onSubmit={handleRenameCanvas}
          isLoading={isLoading}
        />
      )}

      {showDeleteModal && selectedCanvas && (
        <DeleteCanvasModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCanvas(null);
          }}
          canvas={selectedCanvas}
          onConfirm={handleDeleteCanvas}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

// Create canvas modal component
interface CreateCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => void;
  isLoading: boolean;
}

const CreateCanvasModal: React.FC<CreateCanvasModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim() || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Create New Canvas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Canvas Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter canvas name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter canvas description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Canvas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rename canvas modal component
interface RenameCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: ProjectCanvas;
  onSubmit: (name: string, description?: string) => void;
  isLoading: boolean;
}

const RenameCanvasModal: React.FC<RenameCanvasModalProps> = ({
  isOpen,
  onClose,
  canvas,
  onSubmit,
  isLoading
}) => {
  const [name, setName] = useState(canvas.name);
  const [description, setDescription] = useState(canvas.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim() || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Rename Canvas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Canvas Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter canvas name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter canvas description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete canvas modal component
interface DeleteCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: ProjectCanvas;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteCanvasModal: React.FC<DeleteCanvasModalProps> = ({
  isOpen,
  onClose,
  canvas,
  onConfirm,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Delete Canvas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Are you sure you want to delete "{canvas.name}"?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This action cannot be undone. All shapes and data in this canvas will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Canvas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasManagement;
