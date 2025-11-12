// Search-related type definitions

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  pagination?: SearchPagination;
}

export interface SearchFilters {
  type?: 'project' | 'canvas' | 'member' | 'all';
  role?: string;
  isArchived?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  owner?: string;
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort;
}

export interface SearchIndex {
  [key: string]: {
    [key: string]: any;
  };
}

export interface SearchConfig {
  enableFuzzySearch: boolean;
  enableHighlighting: boolean;
  enableSuggestions: boolean;
  maxResults: number;
  debounceMs: number;
}
