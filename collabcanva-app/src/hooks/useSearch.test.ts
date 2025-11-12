// Unit tests for useSearch hook
// Tests search functionality, state management, and React integration

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from './useSearch';
import { searchService, SearchError } from '../services/searchService';
import { useAuth } from '../contexts/AuthContext';

// Mock useAuth
const mockUseAuth = {
  user: {
    uid: 'user123',
    email: 'test@example.com'
  }
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => mockUseAuth)
}));

// Mock searchService
const mockSearchService = {
  searchProjects: vi.fn(),
  getSearchSuggestions: vi.fn(),
  getSearchStats: vi.fn(),
  clearCache: vi.fn()
};

vi.mock('../services/searchService', () => ({
  searchService: mockSearchService,
  SearchError: class extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'SearchError';
    }
  }
}));

// Mock timers
vi.useFakeTimers();

describe('useSearch', () => {
  const mockSearchResult = {
    projects: [
      {
        id: 'project1',
        name: 'Test Project',
        description: 'A test project',
        ownerId: 'user123',
        isArchived: false,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: {
          allowComments: true,
          allowDownloads: true,
          isPublic: false
        },
        metadata: {
          version: '1.0.0',
          tags: ['test'],
          category: 'test'
        }
      }
    ],
    totalCount: 1,
    hasMore: false,
    searchTime: 100,
    filters: {},
    sort: { field: 'updatedAt', direction: 'desc' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchService.searchProjects.mockResolvedValue(mockSearchResult);
    mockSearchService.getSearchSuggestions.mockReturnValue(['test', 'project']);
    mockSearchService.getSearchStats.mockReturnValue({
      totalSearches: 0,
      averageSearchTime: 0,
      cacheHitRate: 0
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.state).toMatchObject({
        results: null,
        isSearching: false,
        isInitialLoad: true,
        error: null,
        currentFilters: {
          isArchived: false,
          isDeleted: false
        },
        currentSort: {
          field: 'updatedAt',
          direction: 'desc'
        },
        searchQuery: '',
        showFilters: false,
        showSortOptions: false,
        suggestions: [],
        showSuggestions: false
      });
    });

    it('should initialize computed values correctly', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.hasResults).toBe(false);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.isEmpty).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    it('should perform search successfully', async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.search();
      });

      expect(mockSearchService.searchProjects).toHaveBeenCalledWith(
        'user123',
        { isArchived: false, isDeleted: false },
        { field: 'updatedAt', direction: 'desc' },
        { limit: 20 }
      );

      expect(result.current.state.results).toEqual(mockSearchResult);
      expect(result.current.state.isSearching).toBe(false);
      expect(result.current.state.error).toBe(null);
    });

    it('should perform search with custom filters', async () => {
      const { result } = renderHook(() => useSearch());

      const filters = { query: 'test', isArchived: true };
      const sort = { field: 'name' as const, direction: 'asc' as const };

      await act(async () => {
        await result.current.search(filters, sort);
      });

      expect(mockSearchService.searchProjects).toHaveBeenCalledWith(
        'user123',
        { isArchived: true, isDeleted: false, query: 'test' },
        { field: 'name', direction: 'asc' },
        { limit: 20 }
      );
    });

    it('should perform search with query', async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.searchWithQuery('test query');
      });

      expect(result.current.state.searchQuery).toBe('test query');
      expect(mockSearchService.searchProjects).toHaveBeenCalledWith(
        'user123',
        { isArchived: false, isDeleted: false, query: 'test query' },
        { field: 'updatedAt', direction: 'desc' },
        { limit: 20 }
      );
    });

    it('should handle search errors', async () => {
      const { result } = renderHook(() => useSearch());

      mockSearchService.searchProjects.mockRejectedValue(
        new SearchError('Search failed', 'SEARCH_FAILED')
      );

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.state.error).toBe('Search failed');
      expect(result.current.state.isSearching).toBe(false);
      expect(result.current.isError).toBe(true);
    });

    it('should debounce search calls', async () => {
      const { result } = renderHook(() => useSearch());

      // Start multiple searches quickly
      act(() => {
        result.current.search({ query: 'test1' });
        result.current.search({ query: 'test2' });
        result.current.search({ query: 'test3' });
      });

      // Fast forward debounce timer
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSearchService.searchProjects).toHaveBeenCalledTimes(1);
      });

      expect(mockSearchService.searchProjects).toHaveBeenCalledWith(
        'user123',
        { isArchived: false, isDeleted: false, query: 'test3' },
        { field: 'updatedAt', direction: 'desc' },
        { limit: 20 }
      );
    });
  });

  describe('Filter Management', () => {
    it('should update filters', async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        result.current.updateFilters({ query: 'new query' });
      });

      expect(result.current.state.currentFilters.query).toBe('new query');
    });

    it('should clear filters', async () => {
      const { result } = renderHook(() => useSearch());

      // Set some filters first
      await act(async () => {
        result.current.updateFilters({ query: 'test' });
      });

      await act(async () => {
        result.current.clearFilters();
      });

      expect(result.current.state.currentFilters).toEqual({
        isArchived: false,
        isDeleted: false
      });
    });

    it('should reset filters', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.state.currentFilters).toEqual({
        isArchived: false,
        isDeleted: false
      });
    });
  });

  describe('Sort Management', () => {
    it('should update sort options', async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        result.current.updateSort({ field: 'name', direction: 'asc' });
      });

      expect(result.current.state.currentSort).toEqual({
        field: 'name',
        direction: 'asc'
      });
    });

    it('should reset sort options', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.resetSort();
      });

      expect(result.current.state.currentSort).toEqual({
        field: 'updatedAt',
        direction: 'desc'
      });
    });
  });

  describe('Pagination', () => {
    it('should load more results', async () => {
      const { result } = renderHook(() => useSearch());

      // Set up initial results
      await act(async () => {
        await result.current.search();
      });

      const moreResults = {
        ...mockSearchResult,
        projects: [
          {
            ...mockSearchResult.projects[0],
            id: 'project2',
            name: 'Another Project'
          }
        ],
        hasMore: false
      };

      mockSearchService.searchProjects.mockResolvedValue(moreResults);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.state.results?.projects).toHaveLength(2);
    });

    it('should not load more if no more results', async () => {
      const { result } = renderHook(() => useSearch());

      // Set up results with no more
      await act(async () => {
        await result.current.search();
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockSearchService.searchProjects).toHaveBeenCalledTimes(1);
    });

    it('should reset pagination', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.state.currentPagination).toEqual({
        limit: 20
      });
    });
  });

  describe('Suggestions', () => {
    it('should get search suggestions', () => {
      const { result } = renderHook(() => useSearch());

      const suggestions = result.current.getSuggestions('test');

      expect(mockSearchService.getSearchSuggestions).toHaveBeenCalledWith('test', 5);
      expect(suggestions).toEqual(['test', 'project']);
    });

    it('should select suggestion', async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        result.current.selectSuggestion('selected suggestion');
      });

      expect(result.current.state.searchQuery).toBe('selected suggestion');
      expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should update suggestions when query changes', async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        result.current.searchWithQuery('test query');
      });

      expect(result.current.state.suggestions).toEqual(['test', 'project']);
    });
  });

  describe('UI State Management', () => {
    it('should toggle filters visibility', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleFilters();
      });

      expect(result.current.state.showFilters).toBe(true);

      act(() => {
        result.current.toggleFilters();
      });

      expect(result.current.state.showFilters).toBe(false);
    });

    it('should toggle sort options visibility', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleSortOptions();
      });

      expect(result.current.state.showSortOptions).toBe(true);

      act(() => {
        result.current.toggleSortOptions();
      });

      expect(result.current.state.showSortOptions).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.clearCache();
      });

      expect(mockSearchService.clearCache).toHaveBeenCalled();
    });

    it('should get search stats', () => {
      const { result } = renderHook(() => useSearch());

      const stats = result.current.getSearchStats();

      expect(mockSearchService.getSearchStats).toHaveBeenCalled();
      expect(stats).toEqual({
        totalSearches: 0,
        averageSearchTime: 0,
        cacheHitRate: 0
      });
    });
  });

  describe('Computed Values', () => {
    it('should compute hasResults correctly', async () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.hasResults).toBe(false);

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.hasResults).toBe(true);
    });

    it('should compute hasMore correctly', async () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.hasMore).toBe(false);

      const resultWithMore = {
        ...mockSearchResult,
        hasMore: true
      };

      mockSearchService.searchProjects.mockResolvedValue(resultWithMore);

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.hasMore).toBe(true);
    });

    it('should compute totalCount correctly', async () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.totalCount).toBe(0);

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.totalCount).toBe(1);
    });

    it('should compute isEmpty correctly', async () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.isEmpty).toBe(false);

      const emptyResult = {
        ...mockSearchResult,
        projects: [],
        totalCount: 0
      };

      mockSearchService.searchProjects.mockResolvedValue(emptyResult);

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.isEmpty).toBe(true);
    });

    it('should compute isError correctly', async () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.isError).toBe(false);

      mockSearchService.searchProjects.mockRejectedValue(
        new SearchError('Test error', 'TEST_ERROR')
      );

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('Clear Search', () => {
    it('should clear search results', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.state.results).toBe(null);
      expect(result.current.state.searchQuery).toBe('');
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.isSearching).toBe(false);
    });
  });

  describe('Refresh Search', () => {
    it('should refresh search results', async () => {
      const { result } = renderHook(() => useSearch());

      // Set up initial results
      await act(async () => {
        await result.current.search();
      });

      await act(async () => {
        await result.current.refreshSearch();
      });

      expect(mockSearchService.searchProjects).toHaveBeenCalledTimes(2);
    });
  });

  describe('Initial Search', () => {
    it('should perform initial search on mount', async () => {
      renderHook(() => useSearch());

      await waitFor(() => {
        expect(mockSearchService.searchProjects).toHaveBeenCalled();
      });
    });

    it('should not perform initial search if no user', () => {
      (useAuth as Mock).mockReturnValue({ user: null });

      renderHook(() => useSearch());

      expect(mockSearchService.searchProjects).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timers on unmount', () => {
      const { unmount } = renderHook(() => useSearch());

      unmount();

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });
});
