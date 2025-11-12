// Unit tests for ProjectDashboard component
// Tests dashboard functionality, search, filtering, and project management

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectDashboard from './ProjectDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../hooks/useSearch';
import { useThumbnails } from '../../hooks/useThumbnails';
import { projectHelpers } from '../../utils/projectHelpers';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/projects' })
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/useSearch', () => ({
  useSearch: vi.fn()
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
  MagnifyingGlassIcon: () => <div data-testid="search-icon" />,
  FunnelIcon: () => <div data-testid="filter-icon" />,
  Squares2X2Icon: () => <div data-testid="grid-icon" />,
  ListBulletIcon: () => <div data-testid="list-icon" />,
  PlusIcon: () => <div data-testid="plus-icon" />,
  EllipsisVerticalIcon: () => <div data-testid="more-icon" />,
  ArchiveBoxIcon: () => <div data-testid="archive-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
  ShareIcon: () => <div data-testid="share-icon" />,
  UserGroupIcon: () => <div data-testid="users-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  TagIcon: () => <div data-testid="tag-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />
}));

// Test data
const mockUser = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockProject: any = {
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

const mockSearchState = {
  results: {
    projects: [mockProject],
    totalCount: 1,
    hasMore: false,
    searchTime: 100,
    filters: {},
    sort: { field: 'updatedAt', direction: 'desc' }
  },
  isSearching: false,
  isInitialLoad: false,
  error: null,
  currentFilters: {},
  currentSort: { field: 'updatedAt', direction: 'desc' },
  currentPagination: { limit: 20 },
  searchQuery: '',
  showFilters: false,
  showSortOptions: false,
  suggestions: [],
  showSuggestions: false,
  searchStats: {
    totalSearches: 0,
    averageSearchTime: 0,
    cacheHitRate: 0
  }
};

const mockSearchFunctions = {
  searchWithQuery: vi.fn(),
  updateFilters: vi.fn(),
  updateSort: vi.fn(),
  clearSearch: vi.fn(),
  hasResults: true,
  isEmpty: false,
  isError: false,
  totalCount: 1
};

const mockThumbnailFunctions = {
  getProjectThumbnail: vi.fn(),
  generatePlaceholderThumbnail: vi.fn()
};

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProjectDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (useAuth as Mock).mockReturnValue({ user: mockUser });
    (useSearch as Mock).mockReturnValue({
      state: mockSearchState,
      ...mockSearchFunctions
    });
    (useThumbnails as Mock).mockReturnValue(mockThumbnailFunctions);
    (projectHelpers.projectTransformers.toDisplayFormat as Mock).mockReturnValue({
      ...mockProject,
      displayName: mockProject.name,
      displayDescription: mockProject.description,
      displayCreatedAt: '1 hour ago',
      displayUpdatedAt: '1 hour ago',
      displayDate: 'Jan 15, 2024',
      displayDateTime: 'Jan 15, 2024 at 2:30 PM',
      isRecent: true,
      isToday: false
    });
  });

  describe('Rendering', () => {
    it('should render dashboard with projects', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('1 project')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('A test project for unit testing')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderWithRouter(<ProjectDashboard />);

      const searchInput = screen.getByPlaceholderText('Search projects...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render filter and sort controls', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByDisplayValue('All Projects')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Recently Updated')).toBeInTheDocument();
    });

    it('should render view mode toggle', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByTestId('grid-icon')).toBeInTheDocument();
      expect(screen.getByTestId('list-icon')).toBeInTheDocument();
    });

    it('should render create project button', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should show sign in prompt when user is not authenticated', () => {
      (useAuth as Mock).mockReturnValue({ user: null });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('Please sign in to view your projects')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input changes', async () => {
      renderWithRouter(<ProjectDashboard />);

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(mockSearchFunctions.searchWithQuery).toHaveBeenCalledWith('test query');
    });

    it('should clear search when input is empty', async () => {
      renderWithRouter(<ProjectDashboard />);

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(mockSearchFunctions.searchWithQuery).toHaveBeenCalledWith('');
    });
  });

  describe('Filtering', () => {
    it('should handle filter changes', () => {
      renderWithRouter(<ProjectDashboard />);

      const filterSelect = screen.getByDisplayValue('All Projects');
      fireEvent.change(filterSelect, { target: { value: 'active' } });

      expect(mockSearchFunctions.updateFilters).toHaveBeenCalledWith({
        isArchived: false,
        isDeleted: false
      });
    });

    it('should handle archived filter', () => {
      renderWithRouter(<ProjectDashboard />);

      const filterSelect = screen.getByDisplayValue('All Projects');
      fireEvent.change(filterSelect, { target: { value: 'archived' } });

      expect(mockSearchFunctions.updateFilters).toHaveBeenCalledWith({
        isArchived: true,
        isDeleted: false
      });
    });

    it('should handle all projects filter', () => {
      renderWithRouter(<ProjectDashboard />);

      const filterSelect = screen.getByDisplayValue('All Projects');
      fireEvent.change(filterSelect, { target: { value: 'all' } });

      expect(mockSearchFunctions.updateFilters).toHaveBeenCalledWith({});
    });
  });

  describe('Sorting', () => {
    it('should handle sort changes', () => {
      renderWithRouter(<ProjectDashboard />);

      const sortSelect = screen.getByDisplayValue('Recently Updated');
      fireEvent.change(sortSelect, { target: { value: 'name-asc' } });

      expect(mockSearchFunctions.updateSort).toHaveBeenCalledWith({
        field: 'name',
        direction: 'asc'
      });
    });

    it('should handle different sort options', () => {
      renderWithRouter(<ProjectDashboard />);

      const sortSelect = screen.getByDisplayValue('Recently Updated');
      fireEvent.change(sortSelect, { target: { value: 'created-desc' } });

      expect(mockSearchFunctions.updateSort).toHaveBeenCalledWith({
        field: 'createdAt',
        direction: 'desc'
      });
    });
  });

  describe('View Mode', () => {
    it('should toggle between grid and list view', () => {
      renderWithRouter(<ProjectDashboard />);

      const listButton = screen.getByTestId('list-icon').closest('button');
      fireEvent.click(listButton!);

      // The component should re-render with list view
      expect(listButton).toHaveClass('bg-white');
    });

    it('should default to grid view', () => {
      renderWithRouter(<ProjectDashboard />);

      const gridButton = screen.getByTestId('grid-icon').closest('button');
      expect(gridButton).toHaveClass('bg-white');
    });
  });

  describe('Project Cards', () => {
    it('should render project cards in grid view', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('A test project for unit testing')).toBeInTheDocument();
    });

    it('should show project metadata', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
      expect(screen.getByText('2 tags')).toBeInTheDocument();
    });

    it('should show archived badge for archived projects', () => {
      const archivedProject = { ...mockProject, isArchived: true };
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          results: {
            ...mockSearchState.results,
            projects: [archivedProject]
          }
        },
        ...mockSearchFunctions
      });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('Archived')).toBeInTheDocument();
    });
  });

  describe('Project Actions', () => {
    it('should show action menu when more button is clicked', () => {
      renderWithRouter(<ProjectDashboard />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show unarchive option for archived projects', () => {
      const archivedProject = { ...mockProject, isArchived: true };
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          results: {
            ...mockSearchState.results,
            projects: [archivedProject]
          }
        },
        ...mockSearchFunctions
      });

      renderWithRouter(<ProjectDashboard />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('Unarchive')).toBeInTheDocument();
    });

    it('should hide edit and delete options for non-owner', () => {
      const otherUserProject = { ...mockProject, ownerId: 'other-user' };
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          results: {
            ...mockSearchState.results,
            projects: [otherUserProject]
          }
        },
        ...mockSearchFunctions
      });

      renderWithRouter(<ProjectDashboard />);

      const moreButton = screen.getByTestId('more-icon').closest('button');
      fireEvent.click(moreButton!);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no projects', () => {
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          results: {
            ...mockSearchState.results,
            projects: [],
            totalCount: 0
          }
        },
        ...mockSearchFunctions,
        hasResults: false,
        isEmpty: true,
        totalCount: 0
      });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first project.')).toBeInTheDocument();
    });

    it('should show no results state when search returns empty', () => {
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          results: {
            ...mockSearchState.results,
            projects: [],
            totalCount: 0
          },
          searchQuery: 'nonexistent'
        },
        ...mockSearchFunctions,
        hasResults: false,
        isEmpty: true,
        totalCount: 0
      });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms or filters.')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error state when search fails', () => {
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          error: 'Search failed'
        },
        ...mockSearchFunctions,
        isError: true
      });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('Failed to load projects. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle retry button click', () => {
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          error: 'Search failed'
        },
        ...mockSearchFunctions,
        isError: true
      });

      renderWithRouter(<ProjectDashboard />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockSearchFunctions.clearSearch).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when searching', () => {
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          isSearching: true
        },
        ...mockSearchFunctions
      });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });
  });

  describe('Project Count Display', () => {
    it('should show singular form for one project', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('1 project')).toBeInTheDocument();
    });

    it('should show plural form for multiple projects', () => {
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          results: {
            ...mockSearchState.results,
            totalCount: 5
          }
        },
        ...mockSearchFunctions,
        totalCount: 5
      });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('5 projects')).toBeInTheDocument();
    });

    it('should show zero projects', () => {
      (useSearch as Mock).mockReturnValue({
        state: {
          ...mockSearchState,
          results: {
            ...mockSearchState.results,
            totalCount: 0
          }
        },
        ...mockSearchFunctions,
        totalCount: 0
      });

      renderWithRouter(<ProjectDashboard />);

      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive grid classes', () => {
      renderWithRouter(<ProjectDashboard />);

      const gridContainer = screen.getByText('Test Project').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });

    it('should apply responsive flex classes for list view', () => {
      renderWithRouter(<ProjectDashboard />);

      const listButton = screen.getByTestId('list-icon').closest('button');
      fireEvent.click(listButton!);

      // The component should re-render with list view classes
      expect(listButton).toHaveClass('bg-white');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<ProjectDashboard />);

      const searchInput = screen.getByPlaceholderText('Search projects...');
      expect(searchInput).toBeInTheDocument();

      const createButton = screen.getByText('New Project');
      expect(createButton).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithRouter(<ProjectDashboard />);

      const viewModeButtons = screen.getAllByRole('button');
      expect(viewModeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Thumbnail Loading', () => {
    it('should load project thumbnails', () => {
      renderWithRouter(<ProjectDashboard />);

      expect(mockThumbnailFunctions.getProjectThumbnail).toHaveBeenCalledWith('project1');
    });

    it('should generate placeholder thumbnails when none exist', () => {
      mockThumbnailFunctions.getProjectThumbnail.mockReturnValue(null);
      mockThumbnailFunctions.generatePlaceholderThumbnail.mockResolvedValue({
        dataUrl: 'data:image/png;base64,placeholder'
      });

      renderWithRouter(<ProjectDashboard />);

      expect(mockThumbnailFunctions.generatePlaceholderThumbnail).toHaveBeenCalledWith('project');
    });
  });
});
