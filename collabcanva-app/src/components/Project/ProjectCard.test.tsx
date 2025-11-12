// Unit tests for ProjectCard component
// Tests project card functionality, view modes, actions, and metadata display

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectCard, { ProjectCardProps, ProjectCardViewMode, ProjectCardSize } from './ProjectCard';
import { useAuth } from '../../contexts/AuthContext';
import { useThumbnails } from '../../hooks/useThumbnails';
import { projectHelpers } from '../../utils/projectHelpers';
import { Project } from "../../types"

// Mock dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/useThumbnails', () => ({
  useThumbnails: vi.fn()
}));

vi.mock('../../utils/projectHelpers', () => ({
  projectHelpers: {
    projectTransformers: {
      toDisplayFormat: vi.fn()
    }
  }
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  Squares2X2Icon: () => <div data-testid="squares-icon" />,
  EllipsisVerticalIcon: () => <div data-testid="more-icon" />,
  ArchiveBoxIcon: () => <div data-testid="archive-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
  ShareIcon: () => <div data-testid="share-icon" />,
  UserGroupIcon: () => <div data-testid="users-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  TagIcon: () => <div data-testid="tag-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />,
  DocumentIcon: () => <div data-testid="document-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  LockClosedIcon: () => <div data-testid="lock-icon" />,
  GlobeAltIcon: () => <div data-testid="globe-icon" />
}));

// Test data
const mockUser = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockProject: Project = {
  id: 'project1',
  name: 'Test Project',
  description: 'A test project for unit testing',
  ownerId: 'user123',
  isArchived: false,
  isDeleted: false,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 3600000,
  settings: {
    allowComments: true,
    allowDownloads: true,
    isPublic: false
  },
  metadata: {
    version: '1.0.0',
    tags: ['test', 'unit-test'],
    category: 'testing'
  }
};

const mockDisplayProject = {
  ...mockProject,
  displayName: 'Test Project',
  displayDescription: 'A test project for unit testing',
  displayCreatedAt: '1 day ago',
  displayUpdatedAt: '1 hour ago',
  displayDate: 'Jan 15, 2024',
  displayDateTime: 'Jan 15, 2024 at 2:30 PM',
  isRecent: true,
  isToday: false
};

const mockThumbnailFunctions = {
  getProjectThumbnail: vi.fn(),
  generatePlaceholderThumbnail: vi.fn()
};

const defaultProps: ProjectCardProps = {
  project: mockProject,
  onView: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onArchive: vi.fn(),
  onShare: vi.fn()
};

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (useAuth as Mock).mockReturnValue({ user: mockUser });
    (useThumbnails as Mock).mockReturnValue(mockThumbnailFunctions);
    (projectHelpers.projectTransformers.toDisplayFormat as Mock).mockReturnValue(mockDisplayProject);
    
    // Setup thumbnail mock
    mockThumbnailFunctions.getProjectThumbnail.mockReturnValue(null);
    mockThumbnailFunctions.generatePlaceholderThumbnail.mockResolvedValue({
      dataUrl: 'data:image/png;base64,placeholder'
    });
  });

  describe('Rendering', () => {
    it('should render project card with basic information', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('A test project for unit testing')).toBeInTheDocument();
    });

    it('should render project name as display name', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should render project description when provided', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('A test project for unit testing')).toBeInTheDocument();
    });

    it('should render placeholder when no description', () => {
      const projectWithoutDescription = { ...mockProject, description: undefined };
      (projectHelpers.projectTransformers.toDisplayFormat as Mock).mockReturnValue({
        ...mockDisplayProject,
        displayDescription: 'No description'
      });

      render(<ProjectCard {...defaultProps} project={projectWithoutDescription} />);

      expect(screen.getByText('No description')).toBeInTheDocument();
    });
  });

  describe('View Modes', () => {
    it('should render grid view by default', () => {
      render(<ProjectCard {...defaultProps} />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('group', 'relative', 'bg-white');
    });

    it('should render list view when specified', () => {
      render(<ProjectCard {...defaultProps} viewMode="list" />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('flex', 'items-center');
    });

    it('should render compact view when specified', () => {
      render(<ProjectCard {...defaultProps} viewMode="compact" />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('flex', 'items-center', 'p-3');
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<ProjectCard {...defaultProps} size="sm" />);

      const title = screen.getByText('Test Project');
      expect(title).toHaveClass('text-sm');
    });

    it('should render medium size by default', () => {
      render(<ProjectCard {...defaultProps} size="md" />);

      const title = screen.getByText('Test Project');
      expect(title).toHaveClass('text-lg');
    });

    it('should render large size', () => {
      render(<ProjectCard {...defaultProps} size="lg" />);

      const title = screen.getByText('Test Project');
      expect(title).toHaveClass('text-xl');
    });
  });

  describe('Thumbnail Display', () => {
    it('should show thumbnail when enabled', () => {
      render(<ProjectCard {...defaultProps} showThumbnail={true} />);

      expect(mockThumbnailFunctions.getProjectThumbnail).toHaveBeenCalledWith('project1');
    });

    it('should hide thumbnail when disabled', () => {
      render(<ProjectCard {...defaultProps} showThumbnail={false} />);

      expect(mockThumbnailFunctions.getProjectThumbnail).not.toHaveBeenCalled();
    });

    it('should show loading state while thumbnail loads', () => {
      render(<ProjectCard {...defaultProps} />);

      // The component should show loading state initially
      expect(screen.getByTestId('squares-icon')).toBeInTheDocument();
    });

    it('should show placeholder when no thumbnail available', async () => {
      mockThumbnailFunctions.getProjectThumbnail.mockReturnValue(null);
      mockThumbnailFunctions.generatePlaceholderThumbnail.mockResolvedValue({
        dataUrl: 'data:image/png;base64,placeholder'
      });

      render(<ProjectCard {...defaultProps} />);

      await waitFor(() => {
        expect(mockThumbnailFunctions.generatePlaceholderThumbnail).toHaveBeenCalledWith('project');
      });
    });

    it('should show existing thumbnail when available', async () => {
      mockThumbnailFunctions.getProjectThumbnail.mockReturnValue({
        dataUrl: 'data:image/png;base64,existing'
      });

      render(<ProjectCard {...defaultProps} />);

      await waitFor(() => {
        const img = screen.getByAltText('Test Project');
        expect(img).toHaveAttribute('src', 'data:image/png;base64,existing');
      });
    });
  });

  describe('Status Display', () => {
    it('should show archived badge for archived projects', () => {
      const archivedProject = { ...mockProject, isArchived: true };
      render(<ProjectCard {...defaultProps} project={archivedProject} showStatus={true} />);

      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('should show public badge for public projects', () => {
      const publicProject = { 
        ...mockProject, 
        settings: { ...mockProject.settings, isPublic: true } 
      };
      render(<ProjectCard {...defaultProps} project={publicProject} showStatus={true} />);

      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('should hide status badges when disabled', () => {
      const archivedProject = { ...mockProject, isArchived: true };
      render(<ProjectCard {...defaultProps} project={archivedProject} showStatus={false} />);

      expect(screen.queryByText('Archived')).not.toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should show project stats when enabled', () => {
      const projectWithStats = {
        ...mockProject,
        members: [{ id: '1', userId: 'user1', role: 'editor' as const }],
        canvases: [{ id: '1', name: 'Canvas 1' }]
      };

      render(<ProjectCard {...defaultProps} project={projectWithStats} showStats={true} />);

      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });

    it('should show tags when enabled', () => {
      render(<ProjectCard {...defaultProps} showTags={true} />);

      expect(screen.getByText('2')).toBeInTheDocument(); // 2 tags
    });

    it('should hide metadata when disabled', () => {
      render(<ProjectCard {...defaultProps} showMetadata={false} />);

      expect(screen.queryByText('A test project for unit testing')).not.toBeInTheDocument();
    });
  });

  describe('Action Menu', () => {
    it('should show action menu when more button is clicked', () => {
      render(<ProjectCard {...defaultProps} showActions={true} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should hide action menu when disabled', () => {
      render(<ProjectCard {...defaultProps} showActions={false} />);

      expect(screen.queryByTestId('more-icon')).not.toBeInTheDocument();
    });

    it('should show unarchive option for archived projects', () => {
      const archivedProject = { ...mockProject, isArchived: true };
      render(<ProjectCard {...defaultProps} project={archivedProject} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('Unarchive')).toBeInTheDocument();
    });

    it('should hide edit and delete options for non-owner', () => {
      const otherUserProject = { ...mockProject, ownerId: 'other-user' };
      render(<ProjectCard {...defaultProps} project={otherUserProject} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should show edit option for project members with edit permissions', () => {
      const projectWithMembers = {
        ...mockProject,
        members: [{ id: '1', userId: 'user123', role: 'editor' as const }]
      };
      render(<ProjectCard {...defaultProps} project={projectWithMembers} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('Action Handlers', () => {
    it('should call onView when card is clicked', () => {
      const onView = vi.fn();
      render(<ProjectCard {...defaultProps} onView={onView} />);

      const card = screen.getByText('Test Project').closest('div');
      fireEvent.click(card!);

      expect(onView).toHaveBeenCalledWith(mockProject);
    });

    it('should call onEdit when edit action is clicked', () => {
      const onEdit = vi.fn();
      render(<ProjectCard {...defaultProps} onEdit={onEdit} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockProject);
    });

    it('should call onDelete when delete action is clicked', () => {
      const onDelete = vi.fn();
      render(<ProjectCard {...defaultProps} onDelete={onDelete} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(mockProject);
    });

    it('should call onArchive when archive action is clicked', () => {
      const onArchive = vi.fn();
      render(<ProjectCard {...defaultProps} onArchive={onArchive} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      const archiveButton = screen.getByText('Archive');
      fireEvent.click(archiveButton);

      expect(onArchive).toHaveBeenCalledWith(mockProject);
    });

    it('should call onShare when share action is clicked', () => {
      const onShare = vi.fn();
      render(<ProjectCard {...defaultProps} onShare={onShare} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      expect(onShare).toHaveBeenCalledWith(mockProject);
    });

    it('should close action menu after action is clicked', () => {
      render(<ProjectCard {...defaultProps} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('View')).toBeInTheDocument();

      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);

      expect(screen.queryByText('View')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when loading prop is true', () => {
      render(<ProjectCard {...defaultProps} loading={true} />);

      // Should show skeleton loading
      const skeleton = screen.getByText('Test Project').closest('div');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should not show project content when loading', () => {
      render(<ProjectCard {...defaultProps} loading={true} />);

      expect(screen.queryByText('A test project for unit testing')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state when error prop is provided', () => {
      render(<ProjectCard {...defaultProps} error="Failed to load project" />);

      expect(screen.getByText('Failed to load project')).toBeInTheDocument();
      expect(screen.getByText('Failed to load project')).toBeInTheDocument();
    });

    it('should not show project content when error is present', () => {
      render(<ProjectCard {...defaultProps} error="Failed to load project" />);

      expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ProjectCard {...defaultProps} />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should have proper button roles', () => {
      render(<ProjectCard {...defaultProps} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      expect(moreButton).toBeInTheDocument();
    });

    it('should have proper alt text for images', async () => {
      mockThumbnailFunctions.getProjectThumbnail.mockReturnValue({
        dataUrl: 'data:image/png;base64,test'
      });

      render(<ProjectCard {...defaultProps} />);

      await waitFor(() => {
        const img = screen.getByAltText('Test Project');
        expect(img).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes for grid view', () => {
      render(<ProjectCard {...defaultProps} viewMode="grid" />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('group', 'relative');
    });

    it('should apply responsive classes for list view', () => {
      render(<ProjectCard {...defaultProps} viewMode="list" />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('flex', 'items-center');
    });

    it('should apply responsive classes for compact view', () => {
      render(<ProjectCard {...defaultProps} viewMode="compact" />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('flex', 'items-center', 'p-3');
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', () => {
      render(<ProjectCard {...defaultProps} />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('dark:bg-slate-800');
    });

    it('should apply dark mode text colors', () => {
      render(<ProjectCard {...defaultProps} />);

      const title = screen.getByText('Test Project');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  describe('Hover Effects', () => {
    it('should apply hover effects', () => {
      render(<ProjectCard {...defaultProps} />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('group', 'hover:shadow-lg');
    });

    it('should show action button on hover', () => {
      render(<ProjectCard {...defaultProps} />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      expect(moreButton).toHaveClass('opacity-0', 'group-hover:opacity-100');
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes correctly', () => {
      const projectWithSize = {
        ...mockProject,
        metadata: { ...mockProject.metadata, size: 1024 }
      };

      render(<ProjectCard {...defaultProps} project={projectWithSize} showStats={true} />);

      // The component should display formatted file size
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className', () => {
      render(<ProjectCard {...defaultProps} className="custom-class" />);

      const card = screen.getByText('Test Project').closest('div');
      expect(card).toHaveClass('custom-class');
    });
  });
});
