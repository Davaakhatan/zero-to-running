// EmptyStates component for project dashboard
// Comprehensive empty state components for various scenarios

import React from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  UserGroupIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  StarIcon,
  GlobeAltIcon,
  ShareIcon,
  HeartIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  HomeIcon,
  PaintBrushIcon,
  PresentationChartLineIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

// Empty state props
interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  illustration?: string;
  className?: string;
}

// Main EmptyState component
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  illustration,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      {/* Illustration or Icon */}
      <div className="mx-auto flex items-center justify-center h-24 w-24 mb-6">
        {illustration ? (
          <img 
            src={illustration} 
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
            <Icon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <button
            onClick={action.onClick}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              action.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : action.variant === 'outline'
                ? 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
            }`}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              secondaryAction.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : secondaryAction.variant === 'outline'
                ? 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

// No Projects Empty State
export const NoProjectsEmptyState: React.FC<{
  onCreateProject: () => void;
  onImportProject?: () => void;
  isNewUser?: boolean;
}> = ({ onCreateProject, onImportProject, isNewUser = false }) => {
  if (isNewUser) {
    return (
      <EmptyState
        title="Welcome to CollabCanvas!"
        description="Create your first project to start collaborating with your team. You can design, prototype, and share your ideas in real-time."
        icon={RocketLaunchIcon}
        action={{
          label: 'Create Your First Project',
          onClick: onCreateProject,
          variant: 'primary'
        }}
        secondaryAction={onImportProject ? {
          label: 'Import Project',
          onClick: onImportProject,
          variant: 'outline'
        } : undefined}
        illustration="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2MzY2RjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM4QjVDQjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPldlbGNvbWUhPC90ZXh0Pjwvc3ZnPg=="
      />
    );
  }

  return (
    <EmptyState
      title="No projects yet"
      description="Get started by creating your first project. You can organize your work, collaborate with your team, and bring your ideas to life."
      icon={FolderIcon}
      action={{
        label: 'Create Project',
        onClick: onCreateProject,
        variant: 'primary'
      }}
      secondaryAction={onImportProject ? {
        label: 'Import Project',
        onClick: onImportProject,
        variant: 'outline'
      } : undefined}
    />
  );
};

// No Search Results Empty State
export const NoSearchResultsEmptyState: React.FC<{
  searchQuery: string;
  onClearSearch: () => void;
  onCreateProject: () => void;
}> = ({ searchQuery, onClearSearch, onCreateProject }) => {
  return (
    <EmptyState
      title="No projects found"
      description={`We couldn't find any projects matching "${searchQuery}". Try adjusting your search terms or create a new project.`}
      icon={MagnifyingGlassIcon}
      action={{
        label: 'Create New Project',
        onClick: onCreateProject,
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline'
      }}
    />
  );
};

// No Filtered Results Empty State
export const NoFilteredResultsEmptyState: React.FC<{
  filterType: string;
  onClearFilters: () => void;
  onCreateProject: () => void;
}> = ({ filterType, onClearFilters, onCreateProject }) => {
  return (
    <EmptyState
      title={`No ${filterType.toLowerCase()} projects`}
      description={`You don't have any ${filterType.toLowerCase()} projects yet. Create a new project or adjust your filters.`}
      icon={FolderIcon}
      action={{
        label: 'Create Project',
        onClick: onCreateProject,
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Clear Filters',
        onClick: onClearFilters,
        variant: 'outline'
      }}
    />
  );
};

// Loading Empty State
export const LoadingEmptyState: React.FC<{
  message?: string;
}> = ({ message = 'Loading projects...' }) => {
  return (
    <div className="text-center py-12 px-6">
      <div className="mx-auto flex items-center justify-center h-24 w-24 mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {message}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Please wait while we load your projects...
      </p>
    </div>
  );
};

// Error Empty State
export const ErrorEmptyState: React.FC<{
  error: string;
  onRetry: () => void;
  onCreateProject?: () => void;
}> = ({ error, onRetry, onCreateProject }) => {
  return (
    <EmptyState
      title="Something went wrong"
      description={`We encountered an error while loading your projects: ${error}`}
      icon={ExclamationTriangleIcon}
      action={{
        label: 'Try Again',
        onClick: onRetry,
        variant: 'primary'
      }}
      secondaryAction={onCreateProject ? {
        label: 'Create Project',
        onClick: onCreateProject,
        variant: 'outline'
      } : undefined}
    />
  );
};

// No Team Members Empty State
export const NoTeamMembersEmptyState: React.FC<{
  onInviteMembers: () => void;
  onShareProject: () => void;
}> = ({ onInviteMembers, onShareProject }) => {
  return (
    <EmptyState
      title="No team members yet"
      description="Invite your team members to collaborate on this project. You can share the project link or send email invitations."
      icon={UserGroupIcon}
      action={{
        label: 'Invite Members',
        onClick: onInviteMembers,
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Share Project',
        onClick: onShareProject,
        variant: 'outline'
      }}
    />
  );
};

// No Canvases Empty State
export const NoCanvasesEmptyState: React.FC<{
  onCreateCanvas: () => void;
  onImportCanvas?: () => void;
}> = ({ onCreateCanvas, onImportCanvas }) => {
  return (
    <EmptyState
      title="No canvases yet"
      description="Create your first canvas to start designing. You can add shapes, text, images, and collaborate in real-time."
      icon={DocumentTextIcon}
      action={{
        label: 'Create Canvas',
        onClick: onCreateCanvas,
        variant: 'primary'
      }}
      secondaryAction={onImportCanvas ? {
        label: 'Import Canvas',
        onClick: onImportCanvas,
        variant: 'outline'
      } : undefined}
    />
  );
};

// Getting Started Tips Empty State
export const GettingStartedTipsEmptyState: React.FC<{
  onCreateProject: () => void;
  onViewTemplates: () => void;
  onReadDocs: () => void;
}> = ({ onCreateProject, onViewTemplates, onReadDocs }) => {
  return (
    <div className="text-center py-12 px-6">
      {/* Icon */}
      <div className="mx-auto flex items-center justify-center h-24 w-24 mb-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 flex items-center justify-center">
          <LightBulbIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Getting Started
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Here are some ways to get started with CollabCanvas:
      </p>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
            <RocketLaunchIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Create Project
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Start with a blank project or choose from our templates
          </p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-3">
            <UserGroupIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Invite Team
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Collaborate with your team in real-time
          </p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
            <SparklesIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Start Designing
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Use our powerful tools to bring ideas to life
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onCreateProject}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Project
        </button>
        <button
          onClick={onViewTemplates}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          View Templates
        </button>
        <button
          onClick={onReadDocs}
          className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium transition-colors"
        >
          Read Documentation
        </button>
      </div>
    </div>
  );
};

// Project Categories Empty State
export const ProjectCategoriesEmptyState: React.FC<{
  onCreateProject: () => void;
  onBrowseTemplates: () => void;
}> = ({ onCreateProject, onBrowseTemplates }) => {
  return (
    <div className="text-center py-12 px-6">
      {/* Icon */}
      <div className="mx-auto flex items-center justify-center h-24 w-24 mb-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
          <FolderIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Choose Your Project Type
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Select a category that best describes your project to get started with the right tools and templates.
      </p>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
        <button
          onClick={onCreateProject}
          className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
        >
          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40">
            <PaintBrushIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Design
          </h4>
        </button>
        <button
          onClick={onCreateProject}
          className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
        >
          <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-green-200 dark:group-hover:bg-green-900/40">
            <PresentationChartLineIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Presentation
          </h4>
        </button>
        <button
          onClick={onCreateProject}
          className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
        >
          <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40">
            <CubeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Prototype
          </h4>
        </button>
        <button
          onClick={onCreateProject}
          className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors group"
        >
          <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/40">
            <AcademicCapIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Education
          </h4>
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onCreateProject}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Blank Project
        </button>
        <button
          onClick={onBrowseTemplates}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Browse Templates
        </button>
      </div>
    </div>
  );
};

// Offline Empty State
export const OfflineEmptyState: React.FC<{
  onRetry: () => void;
}> = ({ onRetry }) => {
  return (
    <EmptyState
      title="You're offline"
      description="Please check your internet connection and try again. Some features may not be available while offline."
      icon={ExclamationTriangleIcon}
      action={{
        label: 'Try Again',
        onClick: onRetry,
        variant: 'primary'
      }}
    />
  );
};

// Maintenance Empty State
export const MaintenanceEmptyState: React.FC<{
  onRetry: () => void;
}> = ({ onRetry }) => {
  return (
    <EmptyState
      title="Under maintenance"
      description="We're currently performing scheduled maintenance. Please try again in a few minutes."
      icon={ArrowPathIcon}
      action={{
        label: 'Try Again',
        onClick: onRetry,
        variant: 'primary'
      }}
    />
  );
};

export default EmptyState;
