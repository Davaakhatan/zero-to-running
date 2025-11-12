// Unit tests for searchService
// Tests search functionality, filtering, sorting, caching, and error handling

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { searchService, SearchError, SearchFilters, SortOptions, SEARCH_CONFIG } from './searchService';
import { Project, ProjectRole } from '../types';

// Mock projectService
const mockProjectService = {
  getUserProjects: vi.fn()
};

vi.mock('./projectService', () => ({
  projectService: mockProjectService
}));

// Mock btoa
Object.defineProperty(global, 'btoa', {
  value: vi.fn((str) => Buffer.from(str).toString('base64'))
});

describe('SearchService', () => {
  const mockUserId = 'user123';
  
  const mockProjects: Project[] = [
    {
      id: 'project1',
      name: 'My First Project',
      description: 'A sample project for testing',
      ownerId: mockUserId,
      isArchived: false,
      isDeleted: false,
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now() - 3600000, // 1 hour ago
      settings: {
        allowComments: true,
        allowDownloads: true,
        isPublic: false
      },
      metadata: {
        version: '1.0.0',
        tags: ['design', 'prototype'],
        category: 'design'
      }
    },
    {
      id: 'project2',
      name: 'Archived Project',
      description: 'This project is archived',
      ownerId: mockUserId,
      isArchived: true,
      isDeleted: false,
      createdAt: Date.now() - 172800000, // 2 days ago
      updatedAt: Date.now() - 7200000, // 2 hours ago
      settings: {
        allowComments: false,
        allowDownloads: false,
        isPublic: false
      },
      metadata: {
        version: '1.0.0',
        tags: ['archived'],
        category: 'archive'
      }
    },
    {
      id: 'project3',
      name: 'Another Project',
      description: 'Another sample project',
      ownerId: mockUserId,
      isArchived: false,
      isDeleted: false,
      createdAt: Date.now() - 259200000, // 3 days ago
      updatedAt: Date.now() - 10800000, // 3 hours ago
      settings: {
        allowComments: true,
        allowDownloads: true,
        isPublic: true
      },
      metadata: {
        version: '1.0.0',
        tags: ['public', 'demo'],
        category: 'demo'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    searchService.clearCache();
    
    // Setup default mock
    mockProjectService.getUserProjects.mockResolvedValue({
      projects: mockProjects,
      hasMore: false
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchProjects', () => {
    it('should search projects successfully with default parameters', async () => {
      const result = await searchService.searchProjects(mockUserId);

      expect(result).toMatchObject({
        projects: expect.any(Array),
        totalCount: expect.any(Number),
        hasMore: expect.any(Boolean),
        searchTime: expect.any(Number),
        filters: {},
        sort: { field: 'updatedAt', direction: 'desc' }
      });

      expect(result.projects.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
    });

    it('should filter projects by text query', async () => {
      const filters: SearchFilters = {
        query: 'first'
      };

      const result = await searchService.searchProjects(mockUserId, filters);

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toContain('First');
    });

    it('should filter projects by archived status', async () => {
      const filters: SearchFilters = {
        isArchived: true
      };

      const result = await searchService.searchProjects(mockUserId, filters);

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].isArchived).toBe(true);
    });

    it('should filter projects by deleted status', async () => {
      const filters: SearchFilters = {
        isDeleted: false
      };

      const result = await searchService.searchProjects(mockUserId, filters);

      expect(result.projects.every(p => !p.isDeleted)).toBe(true);
    });

    it('should filter projects by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      const filters: SearchFilters = {
        createdAfter: yesterday,
        createdBefore: tomorrow
      };

      const result = await searchService.searchProjects(mockUserId, filters);

      expect(result.projects.every(p => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= yesterday && createdAt <= tomorrow;
      })).toBe(true);
    });

    it('should sort projects by name ascending', async () => {
      const sort: SortOptions = {
        field: 'name',
        direction: 'asc'
      };

      const result = await searchService.searchProjects(mockUserId, {}, sort);

      expect(result.projects[0].name).toBe('Another Project');
      expect(result.projects[1].name).toBe('Archived Project');
      expect(result.projects[2].name).toBe('My First Project');
    });

    it('should sort projects by name descending', async () => {
      const sort: SortOptions = {
        field: 'name',
        direction: 'desc'
      };

      const result = await searchService.searchProjects(mockUserId, {}, sort);

      expect(result.projects[0].name).toBe('My First Project');
      expect(result.projects[1].name).toBe('Archived Project');
      expect(result.projects[2].name).toBe('Another Project');
    });

    it('should sort projects by creation date', async () => {
      const sort: SortOptions = {
        field: 'createdAt',
        direction: 'desc'
      };

      const result = await searchService.searchProjects(mockUserId, {}, sort);

      // Should be sorted by creation date (newest first)
      for (let i = 1; i < result.projects.length; i++) {
        expect(result.projects[i-1].createdAt).toBeGreaterThanOrEqual(
          result.projects[i].createdAt
        );
      }
    });

    it('should sort projects by update date', async () => {
      const sort: SortOptions = {
        field: 'updatedAt',
        direction: 'desc'
      };

      const result = await searchService.searchProjects(mockUserId, {}, sort);

      // Should be sorted by update date (newest first)
      for (let i = 1; i < result.projects.length; i++) {
        expect(result.projects[i-1].updatedAt).toBeGreaterThanOrEqual(
          result.projects[i].updatedAt
        );
      }
    });

    it('should apply pagination', async () => {
      const pagination = {
        limit: 2
      };

      const result = await searchService.searchProjects(mockUserId, {}, undefined, pagination);

      expect(result.projects.length).toBeLessThanOrEqual(2);
      expect(result.hasMore).toBe(true);
    });

    it('should handle pagination with startAfter', async () => {
      const pagination = {
        limit: 1,
        startAfter: { id: 'project1' }
      };

      const result = await searchService.searchProjects(mockUserId, {}, undefined, pagination);

      expect(result.projects.length).toBeLessThanOrEqual(1);
      // Should not include the startAfter project
      expect(result.projects.every(p => p.id !== 'project1')).toBe(true);
    });

    it('should use cached results on subsequent calls', async () => {
      // First call
      const result1 = await searchService.searchProjects(mockUserId);

      // Second call should use cache
      const result2 = await searchService.searchProjects(mockUserId);

      expect(result1.projects).toEqual(result2.projects);
      expect(result1.searchTime).toBe(result2.searchTime);
    });

    it('should throw error for query too short', async () => {
      const filters: SearchFilters = {
        query: 'a' // Too short
      };

      await expect(
        searchService.searchProjects(mockUserId, filters)
      ).rejects.toThrow(SearchError);
    });

    it('should throw error for query too long', async () => {
      const filters: SearchFilters = {
        query: 'a'.repeat(SEARCH_CONFIG.MAX_SEARCH_LENGTH + 1)
      };

      await expect(
        searchService.searchProjects(mockUserId, filters)
      ).rejects.toThrow(SearchError);
    });

    it('should handle projectService errors', async () => {
      mockProjectService.getUserProjects.mockRejectedValue(new Error('Service error'));

      await expect(
        searchService.searchProjects(mockUserId)
      ).rejects.toThrow(SearchError);
    });
  });

  describe('advancedSearch', () => {
    it('should perform advanced search with multiple criteria', async () => {
      const criteria = {
        text: 'project',
        dateRange: {
          start: new Date(Date.now() - 86400000),
          end: new Date(Date.now() + 86400000)
        },
        status: 'active' as const,
        sortBy: 'name' as const,
        sortDirection: 'asc' as const
      };

      const result = await searchService.advancedSearch(mockUserId, criteria);

      expect(result).toMatchObject({
        projects: expect.any(Array),
        totalCount: expect.any(Number),
        hasMore: expect.any(Boolean),
        searchTime: expect.any(Number),
        filters: expect.objectContaining({
          query: 'project',
          isArchived: false,
          isDeleted: false
        }),
        sort: { field: 'name', direction: 'asc' }
      });
    });

    it('should handle archived status in advanced search', async () => {
      const criteria = {
        status: 'archived' as const
      };

      const result = await searchService.advancedSearch(mockUserId, criteria);

      expect(result.filters.isArchived).toBe(true);
    });

    it('should handle deleted status in advanced search', async () => {
      const criteria = {
        status: 'deleted' as const
      };

      const result = await searchService.advancedSearch(mockUserId, criteria);

      expect(result.filters.isDeleted).toBe(true);
    });
  });

  describe('searchByTags', () => {
    it('should return empty result for tag search (not implemented)', async () => {
      const result = await searchService.searchByTags(mockUserId, ['design']);

      expect(result).toMatchObject({
        projects: [],
        totalCount: 0,
        hasMore: false,
        searchTime: 0,
        filters: { tags: ['design'] },
        sort: { field: 'updatedAt', direction: 'desc' }
      });
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return popular queries when no query provided', () => {
      const suggestions = searchService.getSearchSuggestions('');

      expect(suggestions).toEqual(expect.any(Array));
    });

    it('should return filtered suggestions based on query', () => {
      // First, perform some searches to populate popular queries
      searchService.searchProjects(mockUserId, { query: 'project' });
      searchService.searchProjects(mockUserId, { query: 'design' });
      searchService.searchProjects(mockUserId, { query: 'prototype' });

      const suggestions = searchService.getSearchSuggestions('pro');

      expect(suggestions).toEqual(expect.any(Array));
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getRecentSearches', () => {
    it('should return recent searches for user', () => {
      const recentSearches = searchService.getRecentSearches(mockUserId, 5);

      expect(recentSearches).toEqual(expect.any(Array));
      expect(recentSearches.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getSearchStats', () => {
    it('should return search statistics', () => {
      const stats = searchService.getSearchStats();

      expect(stats).toMatchObject({
        totalSearches: expect.any(Number),
        averageSearchTime: expect.any(Number),
        cacheHitRate: expect.any(Number),
        popularQueries: expect.any(Array),
        filterUsage: expect.any(Object)
      });
    });

    it('should update statistics after searches', async () => {
      const initialStats = searchService.getSearchStats();
      const initialSearches = initialStats.totalSearches;

      await searchService.searchProjects(mockUserId);

      const updatedStats = searchService.getSearchStats();
      expect(updatedStats.totalSearches).toBe(initialSearches + 1);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      searchService.clearCache();
      const stats = searchService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', async () => {
      await searchService.searchProjects(mockUserId);

      const stats = searchService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.keys).toEqual(expect.any(Array));
    });

    it('should invalidate cache after TTL', async () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Perform search
      await searchService.searchProjects(mockUserId);

      // Fast forward time beyond TTL
      mockTime += SEARCH_CONFIG.CACHE_TTL + 1000;

      // Perform another search - should not use cache
      const result = await searchService.searchProjects(mockUserId);

      expect(result).toBeDefined();

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID', async () => {
      await expect(
        searchService.searchProjects('')
      ).rejects.toThrow();
    });

    it('should handle service unavailability', async () => {
      mockProjectService.getUserProjects.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        searchService.searchProjects(mockUserId)
      ).rejects.toThrow(SearchError);
    });

    it('should handle malformed filters', async () => {
      const invalidFilters = {
        createdAfter: 'invalid-date' as any
      };

      await expect(
        searchService.searchProjects(mockUserId, invalidFilters)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large number of projects efficiently', async () => {
      const manyProjects = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProjects[0],
        id: `project${i}`,
        name: `Project ${i}`,
        createdAt: Date.now() - (i * 1000)
      }));

      mockProjectService.getUserProjects.mockResolvedValue({
        projects: manyProjects,
        hasMore: false
      });

      const startTime = Date.now();
      const result = await searchService.searchProjects(mockUserId);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should limit results for performance', async () => {
      const pagination = {
        limit: 10
      };

      const result = await searchService.searchProjects(mockUserId, {}, undefined, pagination);

      expect(result.projects.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Filter Combinations', () => {
    it('should handle multiple filters simultaneously', async () => {
      const filters: SearchFilters = {
        query: 'project',
        isArchived: false,
        isDeleted: false,
        createdAfter: new Date(Date.now() - 86400000)
      };

      const result = await searchService.searchProjects(mockUserId, filters);

      expect(result.projects.every(p => 
        !p.isArchived && 
        !p.isDeleted && 
        p.name.toLowerCase().includes('project')
      )).toBe(true);
    });

    it('should handle empty filter results', async () => {
      const filters: SearchFilters = {
        query: 'nonexistent'
      };

      const result = await searchService.searchProjects(mockUserId, filters);

      expect(result.projects).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
