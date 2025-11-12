// React hook for project search and filtering
// Provides search functionality with debouncing, caching, and state management

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchService, SearchFilters, SortOptions, SearchResult, SearchError } from '../services/searchService';

// Search state interface
interface SearchState {
  // Search results
  results: SearchResult | null;
  
  // Loading states
  isSearching: boolean;
  isInitialLoad: boolean;
  
  // Error states
  error: string | null;
  
  // Search parameters
  currentFilters: SearchFilters;
  currentSort: SortOptions;
  currentPagination: { limit: number; startAfter?: any };
  
  // UI state
  searchQuery: string;
  showFilters: boolean;
  showSortOptions: boolean;
  
  // Suggestions
  suggestions: string[];
  showSuggestions: boolean;
  
  // Statistics
  searchStats: {
    totalSearches: number;
    averageSearchTime: number;
    cacheHitRate: number;
  };
}

// Hook return interface
interface UseSearchReturn {
  // State
  state: SearchState;
  
  // Search functions
  search: (filters?: Partial<SearchFilters>, sort?: Partial<SortOptions>) => Promise<void>;
  searchWithQuery: (query: string) => Promise<void>;
  clearSearch: () => void;
  refreshSearch: () => Promise<void>;
  
  // Filter functions
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  
  // Sort functions
  updateSort: (sort: Partial<SortOptions>) => void;
  resetSort: () => void;
  
  // Pagination functions
  loadMore: () => Promise<void>;
  resetPagination: () => void;
  
  // Suggestion functions
  getSuggestions: (query: string) => string[];
  selectSuggestion: (suggestion: string) => void;
  
  // UI functions
  toggleFilters: () => void;
  toggleSortOptions: () => void;
  
  // Utility functions
  getSearchStats: () => any;
  clearCache: () => void;
  
  // Computed values
  hasResults: boolean;
  hasMore: boolean;
  totalCount: number;
  isEmpty: boolean;
  isError: boolean;
}

// Default search configuration
const DEFAULT_FILTERS: SearchFilters = {
  isArchived: false,
  isDeleted: false
};

const DEFAULT_SORT: SortOptions = {
  field: 'updatedAt',
  direction: 'desc'
};

const DEFAULT_PAGINATION = {
  limit: 20
};

export const useSearch = (): UseSearchReturn => {
  const { user } = useAuth();
  const [state, setState] = useState<SearchState>({
    results: null,
    isSearching: false,
    isInitialLoad: true,
    error: null,
    currentFilters: DEFAULT_FILTERS,
    currentSort: DEFAULT_SORT,
    currentPagination: DEFAULT_PAGINATION,
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
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  // Debounced search function
  const debouncedSearch = useCallback(
    (filters: SearchFilters, sort: SortOptions, pagination: { limit: number; startAfter?: any }) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (!user) return;

        try {
          setState(prev => ({
            ...prev,
            isSearching: true,
            error: null
          }));

          const results = await searchService.searchProjects(
            user.uid,
            filters,
            sort,
            pagination
          );

          setState(prev => ({
            ...prev,
            results,
            isSearching: false,
            isInitialLoad: false,
            currentFilters: filters,
            currentSort: sort,
            currentPagination: pagination
          }));
        } catch (error) {
          const errorMessage = error instanceof SearchError 
            ? error.message 
            : 'Search failed';

          setState(prev => ({
            ...prev,
            isSearching: false,
            isInitialLoad: false,
            error: errorMessage
          }));
        }
      }, 300); // 300ms debounce
    },
    [user]
  );

  // Main search function
  const search = useCallback(async (
    filters: Partial<SearchFilters> = {},
    sort: Partial<SortOptions> = {}
  ): Promise<void> => {
    if (!user) return;

    const newFilters = { ...state.currentFilters, ...filters };
    const newSort = { ...state.currentSort, ...sort };
    const newPagination = { ...DEFAULT_PAGINATION }; // Reset pagination

    // Update search query if provided
    if (filters.query !== undefined) {
      setState(prev => ({ ...prev, searchQuery: filters.query || '' }));
    }

    debouncedSearch(newFilters, newSort, newPagination);
  }, [user, state.currentFilters, state.currentSort, debouncedSearch]);

  // Search with query
  const searchWithQuery = useCallback(async (query: string): Promise<void> => {
    setState(prev => ({ ...prev, searchQuery: query }));
    await search({ query });
  }, [search]);

  // Clear search
  const clearSearch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      results: null,
      searchQuery: '',
      error: null,
      isSearching: false,
      isInitialLoad: true,
      currentFilters: DEFAULT_FILTERS,
      currentSort: DEFAULT_SORT,
      currentPagination: DEFAULT_PAGINATION
    }));
  }, []);

  // Refresh search
  const refreshSearch = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isSearching: true, error: null }));

      const results = await searchService.searchProjects(
        user.uid,
        state.currentFilters,
        state.currentSort,
        state.currentPagination
      );

      setState(prev => ({
        ...prev,
        results,
        isSearching: false
      }));
    } catch (error) {
      const errorMessage = error instanceof SearchError 
        ? error.message 
        : 'Search failed';

      setState(prev => ({
        ...prev,
        isSearching: false,
        error: errorMessage
      }));
    }
  }, [user, state.currentFilters, state.currentSort, state.currentPagination]);

  // Update filters
  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    const newFilters = { ...state.currentFilters, ...filters };
    setState(prev => ({ ...prev, currentFilters: newFilters }));
    debouncedSearch(newFilters, state.currentSort, DEFAULT_PAGINATION);
  }, [state.currentFilters, state.currentSort, debouncedSearch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const newFilters = { ...DEFAULT_FILTERS };
    setState(prev => ({ ...prev, currentFilters: newFilters }));
    debouncedSearch(newFilters, state.currentSort, DEFAULT_PAGINATION);
  }, [state.currentSort, debouncedSearch]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setState(prev => ({ ...prev, currentFilters: DEFAULT_FILTERS }));
  }, []);

  // Update sort
  const updateSort = useCallback((sort: Partial<SortOptions>) => {
    const newSort = { ...state.currentSort, ...sort };
    setState(prev => ({ ...prev, currentSort: newSort }));
    debouncedSearch(state.currentFilters, newSort, DEFAULT_PAGINATION);
  }, [state.currentFilters, state.currentSort, debouncedSearch]);

  // Reset sort
  const resetSort = useCallback(() => {
    setState(prev => ({ ...prev, currentSort: DEFAULT_SORT }));
  }, []);

  // Load more results
  const loadMore = useCallback(async (): Promise<void> => {
    if (!user || !state.results || !state.results.hasMore || state.isSearching) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isSearching: true }));

      const newPagination = {
        ...state.currentPagination,
        startAfter: state.results.lastDoc
      };

      const results = await searchService.searchProjects(
        user.uid,
        state.currentFilters,
        state.currentSort,
        newPagination
      );

      setState(prev => ({
        ...prev,
        results: {
          ...results,
          projects: [...(prev.results?.projects || []), ...results.projects]
        },
        isSearching: false,
        currentPagination: newPagination
      }));
    } catch (error) {
      const errorMessage = error instanceof SearchError 
        ? error.message 
        : 'Failed to load more results';

      setState(prev => ({
        ...prev,
        isSearching: false,
        error: errorMessage
      }));
    }
  }, [user, state.results, state.currentFilters, state.currentSort, state.currentPagination, state.isSearching]);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setState(prev => ({ ...prev, currentPagination: DEFAULT_PAGINATION }));
  }, []);

  // Get suggestions
  const getSuggestions = useCallback((query: string): string[] => {
    return searchService.getSearchSuggestions(query, 5);
  }, []);

  // Select suggestion
  const selectSuggestion = useCallback((suggestion: string) => {
    setState(prev => ({ ...prev, searchQuery: suggestion, showSuggestions: false }));
    search({ query: suggestion });
  }, [search]);

  // Toggle filters
  const toggleFilters = useCallback(() => {
    setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  // Toggle sort options
  const toggleSortOptions = useCallback(() => {
    setState(prev => ({ ...prev, showSortOptions: !prev.showSortOptions }));
  }, []);

  // Get search stats
  const getSearchStats = useCallback(() => {
    return searchService.getSearchStats();
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    searchService.clearCache();
  }, []);

  // Computed values
  const hasResults = useMemo(() => {
    return state.results !== null && state.results.projects.length > 0;
  }, [state.results]);

  const hasMore = useMemo(() => {
    return state.results?.hasMore || false;
  }, [state.results]);

  const totalCount = useMemo(() => {
    return state.results?.totalCount || 0;
  }, [state.results]);

  const isEmpty = useMemo(() => {
    return !state.isSearching && !state.isInitialLoad && state.results?.projects.length === 0;
  }, [state.isSearching, state.isInitialLoad, state.results]);

  const isError = useMemo(() => {
    return state.error !== null;
  }, [state.error]);

  // Update suggestions when query changes
  useEffect(() => {
    if (state.searchQuery.length >= 2) {
      const suggestions = getSuggestions(state.searchQuery);
      setState(prev => ({ ...prev, suggestions }));
    } else {
      setState(prev => ({ ...prev, suggestions: [] }));
    }
  }, [state.searchQuery, getSuggestions]);

  // Update search stats
  useEffect(() => {
    const stats = getSearchStats();
    setState(prev => ({
      ...prev,
      searchStats: {
        totalSearches: stats.totalSearches,
        averageSearchTime: stats.averageSearchTime,
        cacheHitRate: stats.cacheHitRate
      }
    }));
  }, [getSearchStats]);

  // Initial search on mount
  useEffect(() => {
    if (user && state.isInitialLoad) {
      search();
    }
  }, [user, state.isInitialLoad, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    search,
    searchWithQuery,
    clearSearch,
    refreshSearch,
    updateFilters,
    clearFilters,
    resetFilters,
    updateSort,
    resetSort,
    loadMore,
    resetPagination,
    getSuggestions,
    selectSuggestion,
    toggleFilters,
    toggleSortOptions,
    getSearchStats,
    clearCache,
    hasResults,
    hasMore,
    totalCount,
    isEmpty,
    isError
  };
};
