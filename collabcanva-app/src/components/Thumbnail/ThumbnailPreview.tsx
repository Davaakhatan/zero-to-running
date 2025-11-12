// Thumbnail preview component with loading states and management options
// Provides a visual interface for canvas thumbnails with generation and caching

import React, { useState, useCallback } from 'react';
import { useCanvasThumbnails } from '../../hooks/useCanvasThumbnails';
import { CanvasThumbnailOptions } from '../../services/canvasThumbnailService';
import { 
  PhotoIcon, 
  ArrowPathIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface ThumbnailPreviewProps {
  canvasId: string;
  projectId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showActions?: boolean;
  showMetadata?: boolean;
  autoGenerate?: boolean;
  options?: CanvasThumbnailOptions;
  className?: string;
  onThumbnailGenerated?: (result: any) => void;
  onThumbnailError?: (error: string) => void;
}

const sizeClasses = {
  sm: 'w-16 h-12',
  md: 'w-24 h-18',
  lg: 'w-32 h-24',
  xl: 'w-48 h-36'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10'
};

export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  canvasId,
  projectId,
  size = 'md',
  showActions = true,
  showMetadata = false,
  autoGenerate = true,
  options = {},
  className = '',
  onThumbnailGenerated,
  onThumbnailError
}) => {
  const {
    getThumbnail,
    generateThumbnail,
    isThumbnailLoading,
    getThumbnailError,
    isInQueue,
    refreshThumbnail,
    downloadThumbnail,
    getThumbnailMetadata
  } = useCanvasThumbnails();

  const [showOptions, setShowOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const thumbnail = getThumbnail(canvasId, projectId);
  const isLoading = isThumbnailLoading(canvasId, projectId);
  const error = getThumbnailError(canvasId, projectId);
  const inQueue = isInQueue(canvasId, projectId);
  const metadata = getThumbnailMetadata(canvasId, projectId);

  // Generate thumbnail
  const handleGenerateThumbnail = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateThumbnail(canvasId, projectId, options);
      onThumbnailGenerated?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate thumbnail';
      onThumbnailError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [canvasId, projectId, options, generateThumbnail, onThumbnailGenerated, onThumbnailError]);

  // Refresh thumbnail
  const handleRefreshThumbnail = useCallback(async () => {
    setIsGenerating(true);
    try {
      await refreshThumbnail(canvasId, projectId, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh thumbnail';
      onThumbnailError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [canvasId, projectId, options, refreshThumbnail, onThumbnailError]);

  // Download thumbnail
  const handleDownloadThumbnail = useCallback(() => {
    downloadThumbnail(canvasId, projectId, `canvas_${canvasId}_thumbnail.png`);
  }, [canvasId, projectId, downloadThumbnail]);

  // Auto-generate on mount if enabled
  React.useEffect(() => {
    if (autoGenerate && !thumbnail && !isLoading && !error) {
      handleGenerateThumbnail();
    }
  }, [autoGenerate, thumbnail, isLoading, error, handleGenerateThumbnail]);

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  return (
    <div className={`relative group ${sizeClass} ${className}`}>
      {/* Thumbnail Container */}
      <div className={`relative w-full h-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 ${sizeClass}`}>
        {thumbnail ? (
          // Thumbnail Image
          <img
            src={thumbnail.dataUrl}
            alt={`Canvas ${canvasId} thumbnail`}
            className="w-full h-full object-cover"
            onError={() => {
              // Fallback to placeholder if image fails to load
              console.warn(`Failed to load thumbnail for canvas ${canvasId}`);
            }}
          />
        ) : isLoading || isGenerating ? (
          // Loading State
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <ArrowPathIcon className={`${iconSize} animate-spin text-blue-500`} />
              <span className="text-xs text-gray-500">Generating...</span>
            </div>
          </div>
        ) : inQueue ? (
          // Queue State
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <div className={`${iconSize} rounded-full border-2 border-blue-500 border-t-transparent animate-spin`} />
              <span className="text-xs text-gray-500">Queued</span>
            </div>
          </div>
        ) : error ? (
          // Error State
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2 text-center p-2">
              <PhotoIcon className={`${iconSize} text-red-500`} />
              <span className="text-xs text-red-500">Error</span>
              <button
                onClick={handleGenerateThumbnail}
                className="text-xs text-blue-500 hover:text-blue-700 underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          // Placeholder State
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <PhotoIcon className={`${iconSize} text-gray-400`} />
              <span className="text-xs text-gray-500">No thumbnail</span>
            </div>
          </div>
        )}

        {/* Overlay Actions */}
        {showActions && (thumbnail || error) && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-1">
              {!thumbnail && (
                <button
                  onClick={handleGenerateThumbnail}
                  disabled={isLoading || isGenerating}
                  className="p-1.5 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Generate thumbnail"
                >
                  <PhotoIcon className="w-4 h-4 text-gray-700" />
                </button>
              )}
              
              {thumbnail && (
                <>
                  <button
                    onClick={handleRefreshThumbnail}
                    disabled={isLoading || isGenerating}
                    className="p-1.5 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Refresh thumbnail"
                  >
                    <ArrowPathIcon className={`w-4 h-4 text-gray-700 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <button
                    onClick={handleDownloadThumbnail}
                    className="p-1.5 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                    title="Download thumbnail"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-700" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="absolute top-1 right-1 flex space-x-1">
          {isLoading && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Generating" />
          )}
          {inQueue && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="In queue" />
          )}
          {error && (
            <div className="w-2 h-2 bg-red-500 rounded-full" title="Error" />
          )}
          {thumbnail && !isLoading && !error && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Ready" />
          )}
        </div>
      </div>

      {/* Metadata */}
      {showMetadata && metadata && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>Shapes: {metadata.shapeCount}</div>
          <div>Generated: {new Date(metadata.lastModified).toLocaleTimeString()}</div>
          <div>Source: {metadata.generatedFrom}</div>
        </div>
      )}

      {/* Options Panel */}
      {showOptions && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[200px]">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Thumbnail Options</h4>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeShapes !== false}
                  onChange={(e) => {
                    // This would update options
                    console.log('Include shapes:', e.target.checked);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Include shapes</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeBackground !== false}
                  onChange={(e) => {
                    console.log('Include background:', e.target.checked);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Include background</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeGrid === true}
                  onChange={(e) => {
                    console.log('Include grid:', e.target.checked);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Include grid</span>
              </label>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowOptions(false)}
                className="w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Thumbnail Grid Component
interface ThumbnailGridProps {
  projectId: string;
  canvasIds: string[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showActions?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  projectId,
  canvasIds,
  size = 'md',
  showActions = true,
  showMetadata = false,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${className}`}>
      {canvasIds.map(canvasId => (
        <ThumbnailPreview
          key={canvasId}
          canvasId={canvasId}
          projectId={projectId}
          size={size}
          showActions={showActions}
          showMetadata={showMetadata}
          autoGenerate={true}
        />
      ))}
    </div>
  );
};

// Thumbnail List Component
interface ThumbnailListProps {
  projectId: string;
  canvasIds: string[];
  showActions?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export const ThumbnailList: React.FC<ThumbnailListProps> = ({
  projectId,
  canvasIds,
  showActions = true,
  showMetadata = true,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {canvasIds.map(canvasId => (
        <div key={canvasId} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ThumbnailPreview
            canvasId={canvasId}
            projectId={projectId}
            size="sm"
            showActions={showActions}
            showMetadata={false}
            autoGenerate={true}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Canvas {canvasId}
            </div>
            {showMetadata && (
              <div className="text-xs text-gray-500">
                {/* Metadata would be displayed here */}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
