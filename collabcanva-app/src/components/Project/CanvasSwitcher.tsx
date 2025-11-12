// CanvasSwitcher component for switching between canvases within a project
// Provides a compact dropdown interface for canvas navigation

import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { ProjectCanvas } from "../../types"

// Canvas switcher props
interface CanvasSwitcherProps {
  projectId: string;
  currentCanvasId?: string;
  onCanvasSelect: (canvasId: string) => void;
  className?: string;
  variant?: 'dropdown' | 'tabs' | 'compact';
}

// Canvas switcher component
export const CanvasSwitcher: React.FC<CanvasSwitcherProps> = ({
  projectId,
  currentCanvasId,
  onCanvasSelect,
  className = '',
  variant = 'dropdown'
}) => {
  const { state: { currentProjectCanvases, canvasesLoading } } = useProject();
  const { canEdit } = usePermissions({ projectId });
  
  // Use currentProjectCanvases from ProjectContext
  const projectCanvases = currentProjectCanvases;
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter canvases based on search query
  const filteredCanvases = (projectCanvases || []).filter(canvas =>
    canvas.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (canvas.description && canvas.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get current canvas
  const currentCanvas = (projectCanvases || []).find(canvas => canvas.id === currentCanvasId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle canvas selection
  const handleCanvasSelect = (canvasId: string) => {
    onCanvasSelect(canvasId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Show loading state
  if (canvasesLoading || !projectCanvases) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading canvases...</span>
      </div>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="truncate">
            {currentCanvas ? currentCanvas.name : 'Select Canvas'}
          </span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search canvases..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>

            {/* Canvas list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCanvases.length > 0 ? (
                filteredCanvases.map((canvas) => (
                  <button
                    key={canvas.id}
                    onClick={() => handleCanvasSelect(canvas.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      canvas.id === currentCanvasId
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="truncate font-medium">{canvas.name}</span>
                          {canvas.isArchived && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              Archived
                            </span>
                          )}
                        </div>
                        {canvas.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {canvas.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        {canvas.width}×{canvas.height}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No canvases found' : 'No canvases available'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tabs variant
  if (variant === 'tabs') {
    return (
      <div className={`${className}`}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {projectCanvases.map((canvas) => (
              <button
                key={canvas.id}
                onClick={() => handleCanvasSelect(canvas.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  canvas.id === currentCanvasId
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <span className="truncate max-w-32">{canvas.name}</span>
                  {canvas.isArchived && (
                    <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Canvas:
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <span className="truncate max-w-32">
              {currentCanvas ? currentCanvas.name : 'Select'}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredCanvases.map((canvas) => (
                  <button
                    key={canvas.id}
                    onClick={() => handleCanvasSelect(canvas.id)}
                    className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      canvas.id === currentCanvasId
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{canvas.name}</span>
                      {canvas.isArchived && (
                        <span className="text-gray-400 text-xs">Archived</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

// Canvas breadcrumb component
interface CanvasBreadcrumbProps {
  projectName?: string;
  canvasName?: string;
  onProjectClick?: () => void;
  className?: string;
}

export const CanvasBreadcrumb: React.FC<CanvasBreadcrumbProps> = ({
  projectName,
  canvasName,
  onProjectClick,
  className = ''
}) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      <button
        onClick={onProjectClick}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        {projectName || 'Project'}
      </button>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="text-gray-900 dark:text-white font-medium">
        {canvasName || 'Canvas'}
      </span>
    </nav>
  );
};

// Canvas info component
interface CanvasInfoProps {
  canvas?: ProjectCanvas;
  className?: string;
}

export const CanvasInfo: React.FC<CanvasInfoProps> = ({
  canvas,
  className = ''
}) => {
  if (!canvas) return null;

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className={`flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <span>{canvas.width} × {canvas.height}</span>
      <span>•</span>
      <span>Updated {formatDate(canvas.updatedAt)}</span>
      {canvas.isArchived && (
        <>
          <span>•</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Archived
          </span>
        </>
      )}
    </div>
  );
};

export default CanvasSwitcher;
