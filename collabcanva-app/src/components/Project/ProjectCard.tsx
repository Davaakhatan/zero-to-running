// ProjectCard component with thumbnail, metadata, and quick actions
// Reusable project card component for displaying project information

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useThumbnails } from '../../hooks/useThumbnails';
import { projectHelpers } from '../../utils/projectHelpers';
import { Project, ProjectRole } from "../../types"
import { 
  Squares2X2Icon,
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ShareIcon,
  UserGroupIcon,
  CalendarIcon,
  TagIcon,
  EyeIcon,
  PencilIcon,
  DocumentIcon,
  ClockIcon,
  StarIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

// View modes for the card
export type ProjectCardViewMode = 'grid' | 'list' | 'compact';

// Card size variants
export type ProjectCardSize = 'sm' | 'md' | 'lg';

// Project card props
export interface ProjectCardProps {
  project: Project;
  viewMode?: ProjectCardViewMode;
  size?: ProjectCardSize;
  showActions?: boolean;
  showMetadata?: boolean;
  showThumbnail?: boolean;
  showStatus?: boolean;
  showTags?: boolean;
  showStats?: boolean;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onArchive?: (project: Project) => void;
  onShare?: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
  onStar?: (project: Project) => void;
  className?: string;
  loading?: boolean;
  error?: string;
}

// Action menu item
interface ActionMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
}

// Project stats interface
interface ProjectStats {
  memberCount: number;
  canvasCount: number;
  lastActivity: string;
  size: string;
}

// Main ProjectCard component
const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode = 'grid',
  size = 'md',
  showActions = true,
  showMetadata = true,
  showThumbnail = true,
  showStatus = true,
  showTags = true,
  showStats = true,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onShare,
  onDuplicate,
  onStar,
  className = '',
  loading = false,
  error
}) => {
  const { user } = useAuth();
  const { getProjectThumbnail, generatePlaceholderThumbnail } = useThumbnails();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  // Get project display data
  const displayProject = useMemo(() => 
    projectHelpers.projectTransformers.toDisplayFormat(project), 
    [project]
  );

  // Check user permissions
  const isOwner = user?.uid === project.ownerId;
  const canEdit = isOwner || project.members?.some(member => 
    member.userId === user?.uid && ['admin', 'editor'].includes(member.role)
  );

  // Load thumbnail
  useEffect(() => {
    if (!showThumbnail) {
      setThumbnailLoading(false);
      return;
    }

    const loadThumbnail = async () => {
      try {
        setThumbnailLoading(true);
        const existingThumbnail = getProjectThumbnail(project.id);
        if (existingThumbnail) {
          setThumbnail(existingThumbnail.thumbnailUrl || null);
        } else {
          const placeholder = await generatePlaceholderThumbnail('project');
          setThumbnail(placeholder.thumbnailUrl || null);
        }
      } catch (error) {
        console.error('Failed to load thumbnail:', error);
        setThumbnail(null);
      } finally {
        setThumbnailLoading(false);
      }
    };

    loadThumbnail();
  }, [project.id, showThumbnail, getProjectThumbnail, generatePlaceholderThumbnail]);

  // Generate action menu items
  const actionMenuItems = useMemo((): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [];

    if (onView) {
      items.push({
        id: 'view',
        label: 'View',
        icon: EyeIcon,
        onClick: () => onView(project)
      });
    }

    if (onEdit && canEdit) {
      items.push({
        id: 'edit',
        label: 'Edit',
        icon: PencilIcon,
        onClick: () => onEdit(project)
      });
    }

    if (onDuplicate) {
      items.push({
        id: 'duplicate',
        label: 'Duplicate',
        icon: DocumentIcon,
        onClick: () => onDuplicate(project)
      });
    }

    if (onShare) {
      items.push({
        id: 'share',
        label: 'Share',
        icon: ShareIcon,
        onClick: () => onShare(project)
      });
    }

    if (onStar) {
      items.push({
        id: 'star',
        label: project.metadata?.starred ? 'Unstar' : 'Star',
        icon: StarIcon,
        onClick: () => onStar(project)
      });
    }

    if (items.length > 0) {
      items.push({ id: 'divider1', label: '', icon: DocumentIcon, onClick: () => {}, divider: true });
    }

    if (onArchive && isOwner) {
      items.push({
        id: 'archive',
        label: project.isArchived ? 'Unarchive' : 'Archive',
        icon: ArchiveBoxIcon,
        onClick: () => onArchive(project)
      });
    }

    if (onDelete && isOwner) {
      items.push({
        id: 'delete',
        label: 'Delete',
        icon: TrashIcon,
        onClick: () => onDelete(project),
        destructive: true
      });
    }

    return items;
  }, [project, onView, onEdit, onDelete, onArchive, onShare, onDuplicate, onStar, canEdit, isOwner]);

  // Get project stats
  const projectStats = useMemo((): ProjectStats => {
    const memberCount = project.members?.length || 0;
    const canvasCount = project.canvases?.length || 0;
    const lastActivity = displayProject.displayUpdatedAt;
    const size = project.metadata?.size ? formatFileSize(project.metadata.size) : '0 B';

    return {
      memberCount,
      canvasCount,
      lastActivity,
      size
    };
  }, [project, displayProject]);

  // Handle card click
  const handleCardClick = () => {
    if (onView) {
      onView(project);
    }
  };

  // Handle action click
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowActionMenu(false);
  };

  // Handle action menu toggle
  const handleActionMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionMenu(!showActionMenu);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionMenu(false);
    };

    if (showActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionMenu]);

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3',
          thumbnail: 'h-20',
          title: 'text-sm',
          description: 'text-xs',
          metadata: 'text-xs'
        };
      case 'lg':
        return {
          container: 'p-6',
          thumbnail: 'h-48',
          title: 'text-xl',
          description: 'text-base',
          metadata: 'text-sm'
        };
      default: // md
        return {
          container: 'p-4',
          thumbnail: 'h-32',
          title: 'text-lg',
          description: 'text-sm',
          metadata: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 animate-pulse ${className}`}>
        <div className={`${sizeClasses.thumbnail} bg-gray-200 dark:bg-slate-700 rounded-t-xl`} />
        <div className={sizeClasses.container}>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrashIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load project
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact view
  if (viewMode === 'compact') {
    return (
      <div 
        className={`flex items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/5 dark:hover:shadow-blue-400/5 cursor-pointer group hover:-translate-y-0.5 ${className}`}
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        {showThumbnail && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 mr-3 group-hover:scale-105 transition-transform duration-300">
            {thumbnailLoading ? (
              <div className="w-full h-full bg-gray-200 dark:bg-slate-600 animate-pulse relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            ) : thumbnail ? (
              <img 
                src={thumbnail} 
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                <Squares2X2Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300">
              {displayProject.displayName}
            </h3>
            {showActions && actionMenuItems.length > 0 && (
              <button
                onClick={handleActionMenuToggle}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          
          {showMetadata && project.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              {displayProject.displayDescription}
            </p>
          )}
        </div>

        {/* Action Menu */}
        {showActionMenu && (
          <div className="absolute right-3 top-12 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 dark:border-slate-700/50 py-1 z-10 animate-in slide-in-from-top-2 duration-200">
            {actionMenuItems.map((item) => (
              item.divider ? (
                <div key={item.id} className="border-t border-gray-200 dark:border-slate-700 my-1" />
              ) : (
                <button
                  key={item.id}
                  onClick={(e) => handleActionClick(e, item.onClick)}
                  disabled={item.disabled}
                  className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 ${
                    item.destructive 
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                      : 'text-gray-700 dark:text-gray-300'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              )
            ))}
          </div>
        )}
      </div>
    );
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div 
        className={`flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-400/5 cursor-pointer group relative hover:-translate-y-0.5 ${className}`}
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        {showThumbnail && (
          <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 mr-4 group-hover:scale-105 transition-transform duration-300">
            {thumbnailLoading ? (
              <div className="w-full h-full bg-gray-200 dark:bg-slate-600 animate-pulse relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            ) : thumbnail ? (
              <img 
                src={thumbnail} 
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                <Squares2X2Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300">
              {displayProject.displayName}
            </h3>
            <div className="flex items-center space-x-2">
              {showStatus && project.isArchived && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 backdrop-blur-sm shadow-sm">
                  <ArchiveBoxIcon className="w-3 h-3 mr-1" />
                  Archived
                </span>
              )}
              {showStatus && project.settings?.isPublic && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 backdrop-blur-sm shadow-sm">
                  <GlobeAltIcon className="w-3 h-3 mr-1" />
                  Public
                </span>
              )}
              {/* Removed ellipsis button */}
            </div>
          </div>
          
          {showMetadata && project.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              {displayProject.displayDescription}
            </p>
          )}
          
          {showStats && (
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
              <span className="flex items-center">
                <CalendarIcon className="w-3 h-3 mr-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300" />
                {projectStats.lastActivity}
              </span>
              {projectStats.memberCount > 0 && (
                <span className="flex items-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 rounded-full px-2 py-1 transition-all duration-300">
                  <UserGroupIcon className="w-3 h-3 mr-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                  {projectStats.memberCount}
                </span>
              )}
              {projectStats.canvasCount > 0 && (
                <span className="flex items-center group-hover:bg-green-100 dark:group-hover:bg-green-900/20 rounded-full px-2 py-1 transition-all duration-300">
                  <DocumentIcon className="w-3 h-3 mr-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300" />
                  {projectStats.canvasCount}
                </span>
              )}
              {showTags && project.metadata?.tags && project.metadata.tags.length > 0 && (
                <span className="flex items-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 rounded-full px-2 py-1 transition-all duration-300">
                  <TagIcon className="w-3 h-3 mr-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" />
                  {project.metadata.tags.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Menu */}
        {showActionMenu && (
          <div className="absolute right-4 top-16 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 dark:border-slate-700/50 py-1 z-10 animate-in slide-in-from-top-2 duration-200">
            {actionMenuItems.map((item) => (
              item.divider ? (
                <div key={item.id} className="border-t border-gray-200 dark:border-slate-700 my-1" />
              ) : (
                <button
                  key={item.id}
                  onClick={(e) => handleActionClick(e, item.onClick)}
                  disabled={item.disabled}
                  className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 ${
                    item.destructive 
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                      : 'text-gray-700 dark:text-gray-300'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              )
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div 
      className={`group relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 cursor-pointer overflow-hidden hover:-translate-y-1 ${className}`}
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      {showThumbnail && (
        <div className={`${sizeClasses.thumbnail} bg-gray-100 dark:bg-slate-700 relative overflow-hidden`}>
          {thumbnailLoading ? (
            <div className="w-full h-full bg-gray-200 dark:bg-slate-600 animate-pulse relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          ) : thumbnail ? (
            <img 
              src={thumbnail} 
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
              <Squares2X2Icon className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          
          {/* Actions */}
          {showActions && actionMenuItems.length > 0 && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <button
                onClick={handleActionMenuToggle}
                className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}

          {/* Status Badges */}
          {showStatus && (
            <div className="absolute top-3 left-3 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              {project.isArchived && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 backdrop-blur-sm shadow-sm">
                  <ArchiveBoxIcon className="w-3 h-3 mr-1" />
                  Archived
                </span>
              )}
              {project.settings?.isPublic && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 backdrop-blur-sm shadow-sm">
                  <GlobeAltIcon className="w-3 h-3 mr-1" />
                  Public
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`${sizeClasses.container} group-hover:bg-gradient-to-br group-hover:from-blue-50/50 group-hover:to-purple-50/50 dark:group-hover:from-blue-900/10 dark:group-hover:to-purple-900/10 transition-all duration-300`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className={`${sizeClasses.title} font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300`}>
            {displayProject.displayName}
          </h3>
        </div>
        
        {showMetadata && project.description && (
          <p className={`${sizeClasses.description} text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300`}>
            {displayProject.displayDescription}
          </p>
        )}
        
        {showStats && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
            <span className="flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300" />
              {projectStats.lastActivity}
            </span>
            <div className="flex items-center space-x-2">
              {projectStats.memberCount > 0 && (
                <span className="flex items-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 rounded-full px-2 py-1 transition-all duration-300">
                  <UserGroupIcon className="w-3 h-3 mr-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                  {projectStats.memberCount}
                </span>
              )}
              {projectStats.canvasCount > 0 && (
                <span className="flex items-center group-hover:bg-green-100 dark:group-hover:bg-green-900/20 rounded-full px-2 py-1 transition-all duration-300">
                  <DocumentIcon className="w-3 h-3 mr-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300" />
                  {projectStats.canvasCount}
                </span>
              )}
              {showTags && project.metadata?.tags && project.metadata.tags.length > 0 && (
                <span className="flex items-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 rounded-full px-2 py-1 transition-all duration-300">
                  <TagIcon className="w-3 h-3 mr-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" />
                  {project.metadata.tags.length}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Menu */}
      {showActionMenu && (
        <div className="absolute right-3 top-12 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 dark:border-slate-700/50 py-1 z-10 animate-in slide-in-from-top-2 duration-200">
          {actionMenuItems.map((item) => (
            item.divider ? (
              <div key={item.id} className="border-t border-gray-200 dark:border-slate-700 my-1" />
            ) : (
              <button
                key={item.id}
                onClick={(e) => handleActionClick(e, item.onClick)}
                disabled={item.disabled}
                className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 ${
                  item.destructive 
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                    : 'text-gray-700 dark:text-gray-300'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default ProjectCard;
