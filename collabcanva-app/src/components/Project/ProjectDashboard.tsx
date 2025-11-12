// Project Dashboard component with grid layout and search functionality
// Main dashboard for viewing and managing projects

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
// import { useSearch } from '../../hooks/useSearch'; // TEMPORARILY DISABLED FOR FRONTEND DEMO
// import { useThumbnails } from '../../hooks/useThumbnails'; // TEMPORARILY DISABLED FOR FRONTEND DEMO
import { projectHelpers } from '../../utils/projectHelpers';
import { Project, ProjectRole } from "../../types"
import { ProjectSummary } from "../../hooks/useProjects"
import CreateProjectModal from './CreateProjectModal';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ShareIcon,
  UserGroupIcon,
  CalendarIcon,
  TagIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

// Dashboard view modes
type ViewMode = 'grid' | 'list';

// Sort options
interface SortOption {
  value: string;
  label: string;
  field: 'name' | 'createdAt' | 'updatedAt' | 'memberCount' | 'canvasCount';
  direction: 'asc' | 'desc';
}

// Filter options
interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Dashboard props
interface ProjectDashboardProps {
  className?: string;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onShareProject?: (projectId: string) => void;
  onCreateProject?: () => void;
}

// Project card props
interface ProjectCardProps {
  project: ProjectSummary;
  viewMode: ViewMode;
  onEdit: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
  onArchive: (project: ProjectSummary) => void;
  onShare: (project: ProjectSummary) => void;
  onView: (project: ProjectSummary) => void;
}

// Sort options configuration
const SORT_OPTIONS: SortOption[] = [
  { value: 'updated-desc', label: 'Recently Updated', field: 'updatedAt', direction: 'desc' },
  { value: 'created-desc', label: 'Recently Created', field: 'createdAt', direction: 'desc' },
  { value: 'name-asc', label: 'Name A-Z', field: 'name', direction: 'asc' },
  { value: 'name-desc', label: 'Name Z-A', field: 'name', direction: 'desc' },
  { value: 'members-desc', label: 'Most Members', field: 'memberCount', direction: 'desc' },
  { value: 'canvases-desc', label: 'Most Canvases', field: 'canvasCount', direction: 'desc' }
];

// Filter options configuration
const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Projects' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'shared', label: 'Shared with Me' },
  { value: 'owned', label: 'Owned by Me' }
];

// Project Card Component
const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode,
  onEdit,
  onDelete,
  onArchive,
  onShare,
  onView
}) => {
  const { user } = useAuth();
  // TEMPORARY: Mock thumbnail functionality for frontend demo
  const getProjectThumbnail = (projectId: string) => null;
  const generatePlaceholderThumbnail = (project: ProjectSummary) => null;
  const [showActions, setShowActions] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  // Get project display data
  const displayProject = useMemo(() => ({
    displayName: project.name || 'Untitled Project',
    displayDescription: project.description || 'No description',
    displayUpdatedAt: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(project.lastUpdated))
  }), [project]);

  // Load thumbnail
  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        const existingThumbnail = getProjectThumbnail(project.id);
        if (existingThumbnail && existingThumbnail.dataUrl) {
          setThumbnail(existingThumbnail.dataUrl);
        } else {
          const placeholder = await generatePlaceholderThumbnail(project);
          if (placeholder && placeholder.dataUrl) {
            setThumbnail(placeholder.dataUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load thumbnail:', error);
      }
    };

    loadThumbnail();
  }, [project.id, getProjectThumbnail, generatePlaceholderThumbnail]);

  // Check if user is owner
  const isOwner = user?.uid === project.ownerId;

  // Handle card click
  const handleCardClick = () => {
    onView(project);
  };

  // Handle action click
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowActions(false);
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors cursor-pointer group"
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Squares2X2Icon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 ml-4 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {displayProject.displayName}
            </h3>
            <div className="flex items-center space-x-2">
              {project.isArchived && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <ArchiveBoxIcon className="w-3 h-3 mr-1" />
                  Archived
                </span>
              )}
              {/* Removed ellipsis button */}
            </div>
          </div>
          
          {project.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {displayProject.displayDescription}
            </p>
          )}
          
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {displayProject.displayUpdatedAt}
            </span>
            {project.metadata?.tags && project.metadata.tags.length > 0 && (
              <span className="flex items-center">
                <TagIcon className="w-3 h-3 mr-1" />
                {project.metadata.tags.length} tag{project.metadata.tags.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute right-4 top-16 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-10">
            <button
              onClick={(e) => handleActionClick(e, () => onView(project))}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              View
            </button>
            {isOwner && (
              <button
                onClick={(e) => handleActionClick(e, () => onEdit(project))}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            <button
              onClick={(e) => handleActionClick(e, () => onShare(project))}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <ShareIcon className="w-4 h-4 mr-2" />
              Share
            </button>
            {isOwner && (
              <>
                <button
                  onClick={(e) => handleActionClick(e, () => onArchive(project))}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                  {project.isArchived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onDelete(project))}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className="group relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Squares2X2Icon className="w-12 h-12" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
        
        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Status Badge */}
        {project.isArchived && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <ArchiveBoxIcon className="w-3 h-3 mr-1" />
              Archived
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
            {displayProject.displayName}
          </h3>
        </div>
        
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {displayProject.displayDescription}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <CalendarIcon className="w-3 h-3 mr-1" />
            {displayProject.displayUpdatedAt}
          </span>
          {project.metadata?.tags && project.metadata.tags.length > 0 && (
            <span className="flex items-center">
              <TagIcon className="w-3 h-3 mr-1" />
              {project.metadata.tags.length}
            </span>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="absolute right-3 top-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-10">
          <button
            onClick={(e) => handleActionClick(e, () => onView(project))}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View
          </button>
          {isOwner && (
            <button
              onClick={(e) => handleActionClick(e, () => onEdit(project))}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
          <button
            onClick={(e) => handleActionClick(e, () => onShare(project))}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </button>
          {isOwner && (
            <>
              <button
                onClick={(e) => handleActionClick(e, () => onArchive(project))}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                {project.isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                onClick={(e) => handleActionClick(e, () => onDelete(project))}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, projectsLoading, projectsError } = useProjects();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // TEMPORARY: Mock search functionality for frontend demo
  const searchState = { query: '', results: [], loading: false, error: null, isSearching: false };
  const searchWithQuery = (query: string) => console.log('Search:', query);
  const updateFilters = (filters: any) => console.log('Update filters:', filters);
  const updateSort = (sort: any) => console.log('Update sort:', sort);
  const clearSearch = () => console.log('Clear search');
  const hasResults = true;
  const isEmpty = false;
  const isError = false;
  const totalCount = projects?.length || 0;
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('updated-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchWithQuery(query);
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    
    switch (filter) {
      case 'active':
        updateFilters({ isArchived: false, isDeleted: false });
        break;
      case 'archived':
        updateFilters({ isArchived: true, isDeleted: false });
        break;
      case 'shared':
        // This would need to be implemented based on your data structure
        updateFilters({});
        break;
      case 'owned':
        // This would need to be implemented based on your data structure
        updateFilters({});
        break;
      default:
        updateFilters({});
    }
  };

  // Handle sort change
  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    const sortOption = SORT_OPTIONS.find(option => option.value === sort);
    if (sortOption) {
      updateSort({ field: sortOption.field, direction: sortOption.direction });
    }
  };

  // Handle project actions
  const handleViewProject = (project: ProjectSummary) => {
    // Navigate to the first canvas of the project
    navigate(`/projects/${project.id}/canvases/canvas-1`);
  };

  const handleEditProject = (project: ProjectSummary) => {
    navigate(`/projects/${project.id}/settings`);
  };

  const handleDeleteProject = (project: ProjectSummary) => {
    // Implement delete functionality
    console.log('Delete project:', project.id);
  };

  const handleArchiveProject = (project: ProjectSummary) => {
    // Implement archive functionality
    console.log('Archive project:', project.id);
  };

  const handleShareProject = (project: ProjectSummary) => {
    // Implement share functionality
    console.log('Share project:', project.id);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleProjectCreated = async (project: any) => {
    setShowCreateModal(false);
    
    console.log('Project created successfully:', project.id);
    
    // The project is already added to the state via ADD_PROJECTS dispatch in ProjectContext
    // No need to navigate immediately - user can see the new project in the dashboard
    
    // Optional: Show a success toast notification here if you have a toast system
    // toast.success(`Project "${project.name}" created successfully!`);
  };

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      // This would close any open action menus
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your projects
          </h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (projectsLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${className}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (projectsError) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${className}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 dark:text-red-400 text-xl">!</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Loading Projects</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{projectsError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Projects
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalCount > 0 ? `${totalCount} project${totalCount !== 1 ? 's' : ''}` : 'No projects yet'}
              </p>
            </div>
            
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {isError && (
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-4">
              Failed to load projects. Please try again.
            </div>
            <button
              onClick={() => clearSearch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isEmpty && !isError && (
          <div className="text-center py-12">
            <Squares2X2Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms or filters.'
                : 'Get started by creating your first project.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Project
              </button>
            )}
          </div>
        )}

        {hasResults && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {projects?.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                onArchive={handleArchiveProject}
                onShare={handleShareProject}
                onView={handleViewProject}
              />
            ))}
          </div>
        )}

        {/* Loading State */}
        {searchState.isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading projects...</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
};

export default ProjectDashboard;
