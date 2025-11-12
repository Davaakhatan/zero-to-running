// Unit tests for EmptyStates component
// Tests all empty state components and their functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyStates, {
  NoProjectsEmptyState,
  NoSearchResultsEmptyState,
  NoFilteredResultsEmptyState,
  LoadingEmptyState,
  ErrorEmptyState,
  NoTeamMembersEmptyState,
  NoCanvasesEmptyState,
  GettingStartedTipsEmptyState,
  ProjectCategoriesEmptyState,
  OfflineEmptyState,
  MaintenanceEmptyState
} from './EmptyStates';

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  PlusIcon: () => <div data-testid="plus-icon" />,
  MagnifyingGlassIcon: () => <div data-testid="search-icon" />,
  FolderIcon: () => <div data-testid="folder-icon" />,
  UserGroupIcon: () => <div data-testid="users-icon" />,
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  DocumentTextIcon: () => <div data-testid="document-icon" />,
  ArrowPathIcon: () => <div data-testid="refresh-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="warning-icon" />,
  InformationCircleIcon: () => <div data-testid="info-icon" />,
  LightBulbIcon: () => <div data-testid="lightbulb-icon" />,
  RocketLaunchIcon: () => <div data-testid="rocket-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  GlobeAltIcon: () => <div data-testid="globe-icon" />,
  ShareIcon: () => <div data-testid="share-icon" />,
  HeartIcon: () => <div data-testid="heart-icon" />,
  AcademicCapIcon: () => <div data-testid="academic-icon" />,
  BriefcaseIcon: () => <div data-testid="briefcase-icon" />,
  HomeIcon: () => <div data-testid="home-icon" />,
  PaintBrushIcon: () => <div data-testid="paint-icon" />,
  PresentationChartLineIcon: () => <div data-testid="presentation-icon" />,
  CubeIcon: () => <div data-testid="cube-icon" />
}));

describe('EmptyStates', () => {
  describe('Base EmptyState Component', () => {
    it('should render with basic props', () => {
      const mockAction = vi.fn();
      
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
          action={{
            label: 'Test Action',
            onClick: mockAction,
            variant: 'primary'
          }}
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Test Action')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
        />
      );

      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('should render with illustration', () => {
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
          illustration="data:image/svg+xml;base64,test"
        />
      );

      const img = screen.getByAltText('Test Title');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'data:image/svg+xml;base64,test');
    });

    it('should handle primary action click', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();
      
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
          action={{
            label: 'Test Action',
            onClick: mockAction,
            variant: 'primary'
          }}
        />
      );

      const button = screen.getByText('Test Action');
      await user.click(button);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should handle secondary action click', async () => {
      const user = userEvent.setup();
      const mockPrimaryAction = vi.fn();
      const mockSecondaryAction = vi.fn();
      
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
          action={{
            label: 'Primary Action',
            onClick: mockPrimaryAction,
            variant: 'primary'
          }}
          secondaryAction={{
            label: 'Secondary Action',
            onClick: mockSecondaryAction,
            variant: 'outline'
          }}
        />
      );

      const secondaryButton = screen.getByText('Secondary Action');
      await user.click(secondaryButton);

      expect(mockSecondaryAction).toHaveBeenCalled();
    });

    it('should apply custom className', () => {
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
          className="custom-class"
        />
      );

      const container = screen.getByText('Test Title').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('NoProjectsEmptyState', () => {
    it('should render for new user', () => {
      const mockCreateProject = vi.fn();
      
      render(
        <NoProjectsEmptyState
          onCreateProject={mockCreateProject}
          isNewUser={true}
        />
      );

      expect(screen.getByText('Welcome to CollabCanvas!')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Project')).toBeInTheDocument();
    });

    it('should render for existing user', () => {
      const mockCreateProject = vi.fn();
      
      render(
        <NoProjectsEmptyState
          onCreateProject={mockCreateProject}
          isNewUser={false}
        />
      );

      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });

    it('should render import button when provided', () => {
      const mockCreateProject = vi.fn();
      const mockImportProject = vi.fn();
      
      render(
        <NoProjectsEmptyState
          onCreateProject={mockCreateProject}
          onImportProject={mockImportProject}
        />
      );

      expect(screen.getByText('Import Project')).toBeInTheDocument();
    });

    it('should call onCreateProject when create button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateProject = vi.fn();
      
      render(
        <NoProjectsEmptyState
          onCreateProject={mockCreateProject}
        />
      );

      const createButton = screen.getByText('Create Project');
      await user.click(createButton);

      expect(mockCreateProject).toHaveBeenCalled();
    });

    it('should call onImportProject when import button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateProject = vi.fn();
      const mockImportProject = vi.fn();
      
      render(
        <NoProjectsEmptyState
          onCreateProject={mockCreateProject}
          onImportProject={mockImportProject}
        />
      );

      const importButton = screen.getByText('Import Project');
      await user.click(importButton);

      expect(mockImportProject).toHaveBeenCalled();
    });
  });

  describe('NoSearchResultsEmptyState', () => {
    it('should render with search query', () => {
      const mockClearSearch = vi.fn();
      const mockCreateProject = vi.fn();
      
      render(
        <NoSearchResultsEmptyState
          searchQuery="test query"
          onClearSearch={mockClearSearch}
          onCreateProject={mockCreateProject}
        />
      );

      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('We couldn\'t find any projects matching "test query".')).toBeInTheDocument();
    });

    it('should call onClearSearch when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockClearSearch = vi.fn();
      const mockCreateProject = vi.fn();
      
      render(
        <NoSearchResultsEmptyState
          searchQuery="test"
          onClearSearch={mockClearSearch}
          onCreateProject={mockCreateProject}
        />
      );

      const clearButton = screen.getByText('Clear Search');
      await user.click(clearButton);

      expect(mockClearSearch).toHaveBeenCalled();
    });

    it('should call onCreateProject when create button is clicked', async () => {
      const user = userEvent.setup();
      const mockClearSearch = vi.fn();
      const mockCreateProject = vi.fn();
      
      render(
        <NoSearchResultsEmptyState
          searchQuery="test"
          onClearSearch={mockClearSearch}
          onCreateProject={mockCreateProject}
        />
      );

      const createButton = screen.getByText('Create New Project');
      await user.click(createButton);

      expect(mockCreateProject).toHaveBeenCalled();
    });
  });

  describe('NoFilteredResultsEmptyState', () => {
    it('should render with filter type', () => {
      const mockClearFilters = vi.fn();
      const mockCreateProject = vi.fn();
      
      render(
        <NoFilteredResultsEmptyState
          filterType="Archived"
          onClearFilters={mockClearFilters}
          onCreateProject={mockCreateProject}
        />
      );

      expect(screen.getByText('No archived projects')).toBeInTheDocument();
      expect(screen.getByText('You don\'t have any archived projects yet.')).toBeInTheDocument();
    });

    it('should call onClearFilters when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockClearFilters = vi.fn();
      const mockCreateProject = vi.fn();
      
      render(
        <NoFilteredResultsEmptyState
          filterType="Archived"
          onClearFilters={mockClearFilters}
          onCreateProject={mockCreateProject}
        />
      );

      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      expect(mockClearFilters).toHaveBeenCalled();
    });
  });

  describe('LoadingEmptyState', () => {
    it('should render with default message', () => {
      render(<LoadingEmptyState />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we load your projects...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingEmptyState message="Loading data..." />);

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should show loading spinner', () => {
      render(<LoadingEmptyState />);

      const spinner = screen.getByText('Loading projects...').closest('div')?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('ErrorEmptyState', () => {
    it('should render with error message', () => {
      const mockRetry = vi.fn();
      
      render(
        <ErrorEmptyState
          error="Network error"
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('We encountered an error while loading your projects: Network error')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();
      
      render(
        <ErrorEmptyState
          error="Network error"
          onRetry={mockRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should render create project button when provided', () => {
      const mockRetry = vi.fn();
      const mockCreateProject = vi.fn();
      
      render(
        <ErrorEmptyState
          error="Network error"
          onRetry={mockRetry}
          onCreateProject={mockCreateProject}
        />
      );

      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });
  });

  describe('NoTeamMembersEmptyState', () => {
    it('should render team members empty state', () => {
      const mockInviteMembers = vi.fn();
      const mockShareProject = vi.fn();
      
      render(
        <NoTeamMembersEmptyState
          onInviteMembers={mockInviteMembers}
          onShareProject={mockShareProject}
        />
      );

      expect(screen.getByText('No team members yet')).toBeInTheDocument();
      expect(screen.getByText('Invite Members')).toBeInTheDocument();
      expect(screen.getByText('Share Project')).toBeInTheDocument();
    });

    it('should call onInviteMembers when invite button is clicked', async () => {
      const user = userEvent.setup();
      const mockInviteMembers = vi.fn();
      const mockShareProject = vi.fn();
      
      render(
        <NoTeamMembersEmptyState
          onInviteMembers={mockInviteMembers}
          onShareProject={mockShareProject}
        />
      );

      const inviteButton = screen.getByText('Invite Members');
      await user.click(inviteButton);

      expect(mockInviteMembers).toHaveBeenCalled();
    });

    it('should call onShareProject when share button is clicked', async () => {
      const user = userEvent.setup();
      const mockInviteMembers = vi.fn();
      const mockShareProject = vi.fn();
      
      render(
        <NoTeamMembersEmptyState
          onInviteMembers={mockInviteMembers}
          onShareProject={mockShareProject}
        />
      );

      const shareButton = screen.getByText('Share Project');
      await user.click(shareButton);

      expect(mockShareProject).toHaveBeenCalled();
    });
  });

  describe('NoCanvasesEmptyState', () => {
    it('should render canvases empty state', () => {
      const mockCreateCanvas = vi.fn();
      
      render(
        <NoCanvasesEmptyState
          onCreateCanvas={mockCreateCanvas}
        />
      );

      expect(screen.getByText('No canvases yet')).toBeInTheDocument();
      expect(screen.getByText('Create Canvas')).toBeInTheDocument();
    });

    it('should render import button when provided', () => {
      const mockCreateCanvas = vi.fn();
      const mockImportCanvas = vi.fn();
      
      render(
        <NoCanvasesEmptyState
          onCreateCanvas={mockCreateCanvas}
          onImportCanvas={mockImportCanvas}
        />
      );

      expect(screen.getByText('Import Canvas')).toBeInTheDocument();
    });

    it('should call onCreateCanvas when create button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateCanvas = vi.fn();
      
      render(
        <NoCanvasesEmptyState
          onCreateCanvas={mockCreateCanvas}
        />
      );

      const createButton = screen.getByText('Create Canvas');
      await user.click(createButton);

      expect(mockCreateCanvas).toHaveBeenCalled();
    });
  });

  describe('GettingStartedTipsEmptyState', () => {
    it('should render getting started tips', () => {
      const mockCreateProject = vi.fn();
      const mockViewTemplates = vi.fn();
      const mockReadDocs = vi.fn();
      
      render(
        <GettingStartedTipsEmptyState
          onCreateProject={mockCreateProject}
          onViewTemplates={mockViewTemplates}
          onReadDocs={mockReadDocs}
        />
      );

      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Project')).toBeInTheDocument();
      expect(screen.getByText('View Templates')).toBeInTheDocument();
      expect(screen.getByText('Read Documentation')).toBeInTheDocument();
    });

    it('should render tips grid', () => {
      const mockCreateProject = vi.fn();
      const mockViewTemplates = vi.fn();
      const mockReadDocs = vi.fn();
      
      render(
        <GettingStartedTipsEmptyState
          onCreateProject={mockCreateProject}
          onViewTemplates={mockViewTemplates}
          onReadDocs={mockReadDocs}
        />
      );

      expect(screen.getByText('Create Project')).toBeInTheDocument();
      expect(screen.getByText('Invite Team')).toBeInTheDocument();
      expect(screen.getByText('Start Designing')).toBeInTheDocument();
    });

    it('should call onCreateProject when create button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateProject = vi.fn();
      const mockViewTemplates = vi.fn();
      const mockReadDocs = vi.fn();
      
      render(
        <GettingStartedTipsEmptyState
          onCreateProject={mockCreateProject}
          onViewTemplates={mockViewTemplates}
          onReadDocs={mockReadDocs}
        />
      );

      const createButton = screen.getByText('Create Your First Project');
      await user.click(createButton);

      expect(mockCreateProject).toHaveBeenCalled();
    });

    it('should call onViewTemplates when templates button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateProject = vi.fn();
      const mockViewTemplates = vi.fn();
      const mockReadDocs = vi.fn();
      
      render(
        <GettingStartedTipsEmptyState
          onCreateProject={mockCreateProject}
          onViewTemplates={mockViewTemplates}
          onReadDocs={mockReadDocs}
        />
      );

      const templatesButton = screen.getByText('View Templates');
      await user.click(templatesButton);

      expect(mockViewTemplates).toHaveBeenCalled();
    });

    it('should call onReadDocs when docs button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateProject = vi.fn();
      const mockViewTemplates = vi.fn();
      const mockReadDocs = vi.fn();
      
      render(
        <GettingStartedTipsEmptyState
          onCreateProject={mockCreateProject}
          onViewTemplates={mockViewTemplates}
          onReadDocs={mockReadDocs}
        />
      );

      const docsButton = screen.getByText('Read Documentation');
      await user.click(docsButton);

      expect(mockReadDocs).toHaveBeenCalled();
    });
  });

  describe('ProjectCategoriesEmptyState', () => {
    it('should render project categories', () => {
      const mockCreateProject = vi.fn();
      const mockBrowseTemplates = vi.fn();
      
      render(
        <ProjectCategoriesEmptyState
          onCreateProject={mockCreateProject}
          onBrowseTemplates={mockBrowseTemplates}
        />
      );

      expect(screen.getByText('Choose Your Project Type')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Presentation')).toBeInTheDocument();
      expect(screen.getByText('Prototype')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
    });

    it('should call onCreateProject when category is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateProject = vi.fn();
      const mockBrowseTemplates = vi.fn();
      
      render(
        <ProjectCategoriesEmptyState
          onCreateProject={mockCreateProject}
          onBrowseTemplates={mockBrowseTemplates}
        />
      );

      const designCategory = screen.getByText('Design');
      await user.click(designCategory);

      expect(mockCreateProject).toHaveBeenCalled();
    });

    it('should call onBrowseTemplates when browse button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreateProject = vi.fn();
      const mockBrowseTemplates = vi.fn();
      
      render(
        <ProjectCategoriesEmptyState
          onCreateProject={mockCreateProject}
          onBrowseTemplates={mockBrowseTemplates}
        />
      );

      const browseButton = screen.getByText('Browse Templates');
      await user.click(browseButton);

      expect(mockBrowseTemplates).toHaveBeenCalled();
    });
  });

  describe('OfflineEmptyState', () => {
    it('should render offline state', () => {
      const mockRetry = vi.fn();
      
      render(
        <OfflineEmptyState
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText('You\'re offline')).toBeInTheDocument();
      expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();
      
      render(
        <OfflineEmptyState
          onRetry={mockRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('MaintenanceEmptyState', () => {
    it('should render maintenance state', () => {
      const mockRetry = vi.fn();
      
      render(
        <MaintenanceEmptyState
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText('Under maintenance')).toBeInTheDocument();
      expect(screen.getByText('We\'re currently performing scheduled maintenance.')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();
      
      render(
        <MaintenanceEmptyState
          onRetry={mockRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      const mockAction = vi.fn();
      
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
          action={{
            label: 'Test Action',
            onClick: mockAction,
            variant: 'primary'
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Title');
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', () => {
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
        />
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes', () => {
      render(
        <EmptyStates
          title="Test Title"
          description="Test description"
          icon={FolderIcon}
          action={{
            label: 'Test Action',
            onClick: vi.fn(),
            variant: 'primary'
          }}
          secondaryAction={{
            label: 'Secondary Action',
            onClick: vi.fn(),
            variant: 'outline'
          }}
        />
      );

      const actionsContainer = screen.getByText('Test Action').closest('div');
      expect(actionsContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });
});
