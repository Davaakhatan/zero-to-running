// Search and filtering service for projects
// Provides advanced search capabilities with filtering, sorting, and pagination

import { Project, ProjectMember, ProjectCanvas, ProjectRole } from '../types';
import { projectService } from './projectService';

// Search configuration
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 50,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 100
};

// Search filters
export interface SearchFilters {
  // Text search
  query?: string;
  
  // Status filters
  isArchived?: boolean;
  isDeleted?: boolean;
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  
  // Member filters
  memberRole?: ProjectRole;
  hasMembers?: boolean;
  minMembers?: number;
  maxMembers?: number;
  
  // Canvas filters
  hasCanvases?: boolean;
  minCanvases?: number;
  maxCanvases?: number;
  
  // Size filters
  minSize?: number; // in bytes
  maxSize?: number; // in bytes
  
  // Custom filters
  tags?: string[];
  categories?: string[];
}

// Sort options
export interface SortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'memberCount' | 'canvasCount' | 'size';
  direction: 'asc' | 'desc';
}

// Search result
export interface SearchResult {
  projects: Project[];
  totalCount: number;
  hasMore: boolean;
  lastDoc?: any;
  searchTime: number;
  filters: SearchFilters;
  sort: SortOptions;
}

// Search cache entry
interface SearchCacheEntry {
  result: SearchResult;
  timestamp: number;
  ttl: number;
}

// Search statistics
export interface SearchStats {
  totalSearches: number;
  averageSearchTime: number;
  cacheHitRate: number;
  popularQueries: Array<{ query: string; count: number }>;
  filterUsage: Record<string, number>;
}

// Error types
export class SearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

class SearchService {
  private cache = new Map<string, SearchCacheEntry>();
  private searchStats: SearchStats = {
    totalSearches: 0,
    averageSearchTime: 0,
    cacheHitRate: 0,
    popularQueries: [],
    filterUsage: {}
  };

  /**
   * Search projects with filters and sorting
   */
  async searchProjects(
    userId: string,
    filters: SearchFilters = {},
    sort: SortOptions = { field: 'updatedAt', direction: 'desc' },
    pagination: { limit?: number; startAfter?: any } = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(userId, filters, sort, pagination);
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.updateSearchStats(startTime, true);
      return cached;
    }

    try {
      // Validate search query
      if (filters.query && filters.query.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
        throw new SearchError(
          `Search query must be at least ${SEARCH_CONFIG.MIN_SEARCH_LENGTH} characters`,
          'QUERY_TOO_SHORT'
        );
      }

      if (filters.query && filters.query.length > SEARCH_CONFIG.MAX_SEARCH_LENGTH) {
        throw new SearchError(
          `Search query must be less than ${SEARCH_CONFIG.MAX_SEARCH_LENGTH} characters`,
          'QUERY_TOO_LONG'
        );
      }

      // Get all user projects
      const allProjects = await this.getAllUserProjects(userId);
      
      // Apply filters
      let filteredProjects = this.applyFilters(allProjects, filters);
      
      // Apply sorting
      filteredProjects = this.applySorting(filteredProjects, sort);
      
      // Apply pagination
      const { limit = SEARCH_CONFIG.MAX_RESULTS, startAfter } = pagination;
      const startIndex = startAfter ? this.findStartIndex(filteredProjects, startAfter) : 0;
      const endIndex = startIndex + limit;
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
      
      // Create result
      const result: SearchResult = {
        projects: paginatedProjects,
        totalCount: filteredProjects.length,
        hasMore: endIndex < filteredProjects.length,
        lastDoc: paginatedProjects.length > 0 ? paginatedProjects[paginatedProjects.length - 1] : undefined,
        searchTime: Date.now() - startTime,
        filters,
        sort
      };

      // Cache the result
      this.cacheResult(cacheKey, result);
      
      // Update statistics
      this.updateSearchStats(startTime, false);
      this.updateFilterUsage(filters);
      this.updatePopularQueries(filters.query);

      return result;
    } catch (error) {
      throw new SearchError(
        'Failed to search projects',
        'SEARCH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get all user projects (with caching)
   */
  private async getAllUserProjects(userId: string): Promise<Project[]> {
    const cacheKey = `user_projects_${userId}`;
    const cached = this.getCachedResult(cacheKey);
    
    if (cached) {
      return cached.projects;
    }

    // Fetch all projects (including archived)
    const { projects } = await projectService.getUserProjects(userId, {
      includeArchived: true,
      limit: 1000 // Large limit to get all projects
    });

    // Cache the result
    this.cacheResult(cacheKey, {
      projects,
      totalCount: projects.length,
      hasMore: false,
      searchTime: 0,
      filters: {},
      sort: { field: 'updatedAt', direction: 'desc' }
    });

    return projects;
  }

  /**
   * Apply filters to projects
   */
  private applyFilters(projects: Project[], filters: SearchFilters): Project[] {
    return projects.filter(project => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(query);
        const matchesDescription = project.description?.toLowerCase().includes(query) || false;
        
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Status filters
      if (filters.isArchived !== undefined && project.isArchived !== filters.isArchived) {
        return false;
      }

      if (filters.isDeleted !== undefined && project.isDeleted !== filters.isDeleted) {
        return false;
      }

      // Date filters
      if (filters.createdAfter && project.createdAt < filters.createdAfter.getTime()) {
        return false;
      }

      if (filters.createdBefore && project.createdAt > filters.createdBefore.getTime()) {
        return false;
      }

      if (filters.updatedAfter && project.updatedAt < filters.updatedAfter.getTime()) {
        return false;
      }

      if (filters.updatedBefore && project.updatedAt > filters.updatedBefore.getTime()) {
        return false;
      }

      // Note: Member and canvas filters would require additional data fetching
      // For now, we'll implement basic filtering based on available data

      return true;
    });
  }

  /**
   * Apply sorting to projects
   */
  private applySorting(projects: Project[], sort: SortOptions): Project[] {
    return [...projects].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'memberCount':
          // This would require additional data fetching
          aValue = 0;
          bValue = 0;
          break;
        case 'canvasCount':
          // This would require additional data fetching
          aValue = 0;
          bValue = 0;
          break;
        case 'size':
          // This would require additional data fetching
          aValue = 0;
          bValue = 0;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Find start index for pagination
   */
  private findStartIndex(projects: Project[], startAfter: any): number {
    const index = projects.findIndex(project => project.id === startAfter.id);
    return index >= 0 ? index + 1 : 0;
  }

  /**
   * Generate cache key for search parameters
   */
  private generateCacheKey(
    userId: string,
    filters: SearchFilters,
    sort: SortOptions,
    pagination: { limit?: number; startAfter?: any }
  ): string {
    const key = {
      userId,
      filters: this.normalizeFilters(filters),
      sort,
      limit: pagination.limit,
      startAfter: pagination.startAfter?.id
    };
    
    return btoa(JSON.stringify(key)).slice(0, 32);
  }

  /**
   * Normalize filters for consistent caching
   */
  private normalizeFilters(filters: SearchFilters): SearchFilters {
    return {
      ...filters,
      query: filters.query?.trim().toLowerCase(),
      createdAfter: filters.createdAfter ? new Date(filters.createdAfter.getTime()) : undefined,
      createdBefore: filters.createdBefore ? new Date(filters.createdBefore.getTime()) : undefined,
      updatedAfter: filters.updatedAfter ? new Date(filters.updatedAfter.getTime()) : undefined,
      updatedBefore: filters.updatedBefore ? new Date(filters.updatedBefore.getTime()) : undefined
    };
  }

  /**
   * Get cached search result
   */
  private getCachedResult(cacheKey: string): SearchResult | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.result;
  }

  /**
   * Cache search result
   */
  private cacheResult(cacheKey: string, result: SearchResult): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= SEARCH_CONFIG.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl: SEARCH_CONFIG.CACHE_TTL
    });
  }

  /**
   * Update search statistics
   */
  private updateSearchStats(startTime: number, fromCache: boolean): void {
    const searchTime = Date.now() - startTime;
    
    this.searchStats.totalSearches++;
    this.searchStats.averageSearchTime = 
      (this.searchStats.averageSearchTime * (this.searchStats.totalSearches - 1) + searchTime) / 
      this.searchStats.totalSearches;
    
    if (fromCache) {
      this.searchStats.cacheHitRate = 
        (this.searchStats.cacheHitRate * (this.searchStats.totalSearches - 1) + 1) / 
        this.searchStats.totalSearches;
    } else {
      this.searchStats.cacheHitRate = 
        (this.searchStats.cacheHitRate * (this.searchStats.totalSearches - 1)) / 
        this.searchStats.totalSearches;
    }
  }

  /**
   * Update filter usage statistics
   */
  private updateFilterUsage(filters: SearchFilters): void {
    Object.keys(filters).forEach(filterKey => {
      if (filters[filterKey as keyof SearchFilters] !== undefined) {
        this.searchStats.filterUsage[filterKey] = 
          (this.searchStats.filterUsage[filterKey] || 0) + 1;
      }
    });
  }

  /**
   * Update popular queries
   */
  private updatePopularQueries(query?: string): void {
    if (!query) return;

    const existing = this.searchStats.popularQueries.find(q => q.query === query);
    if (existing) {
      existing.count++;
    } else {
      this.searchStats.popularQueries.push({ query, count: 1 });
    }

    // Keep only top 10 queries
    this.searchStats.popularQueries = this.searchStats.popularQueries
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get search suggestions based on popular queries
   */
  getSearchSuggestions(query: string, limit: number = 5): string[] {
    if (!query || query.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
      return this.searchStats.popularQueries
        .slice(0, limit)
        .map(q => q.query);
    }

    const suggestions = this.searchStats.popularQueries
      .filter(q => q.query.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(q => q.query);

    return suggestions;
  }

  /**
   * Get search statistics
   */
  getSearchStats(): SearchStats {
    return { ...this.searchStats };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Advanced search with multiple criteria
   */
  async advancedSearch(
    userId: string,
    criteria: {
      text?: string;
      dateRange?: { start: Date; end: Date };
      status?: 'active' | 'archived' | 'deleted';
      sortBy?: SortOptions['field'];
      sortDirection?: SortOptions['direction'];
    },
    pagination: { limit?: number; offset?: number } = {}
  ): Promise<SearchResult> {
    const filters: SearchFilters = {};

    if (criteria.text) {
      filters.query = criteria.text;
    }

    if (criteria.dateRange) {
      filters.updatedAfter = criteria.dateRange.start;
      filters.updatedBefore = criteria.dateRange.end;
    }

    if (criteria.status) {
      switch (criteria.status) {
        case 'active':
          filters.isArchived = false;
          filters.isDeleted = false;
          break;
        case 'archived':
          filters.isArchived = true;
          break;
        case 'deleted':
          filters.isDeleted = true;
          break;
      }
    }

    const sort: SortOptions = {
      field: criteria.sortBy || 'updatedAt',
      direction: criteria.sortDirection || 'desc'
    };

    return this.searchProjects(userId, filters, sort, pagination);
  }

  /**
   * Search projects by tags (future feature)
   */
  async searchByTags(
    userId: string,
    tags: string[],
    options: { matchAll?: boolean } = {}
  ): Promise<SearchResult> {
    // This would require adding tags to the Project interface
    // For now, return empty result
    return {
      projects: [],
      totalCount: 0,
      hasMore: false,
      searchTime: 0,
      filters: { tags },
      sort: { field: 'updatedAt', direction: 'desc' }
    };
  }

  /**
   * Get recent searches for user
   */
  getRecentSearches(userId: string, limit: number = 10): string[] {
    // This would require storing user-specific search history
    // For now, return popular queries
    return this.searchStats.popularQueries
      .slice(0, limit)
      .map(q => q.query);
  }
}

// Export singleton instance
export const searchService = new SearchService();

// Error class is already exported above
