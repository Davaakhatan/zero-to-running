// Unit tests for useProjectData hook
// Tests data fetching, caching, and performance optimization

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectData } from './useProjectData';
import { useAuth } from '../contexts/AuthContext';
import { projectService, ProjectServiceError } from '../services/projectService';
import { Project, ProjectMember, ProjectCanvas, CreateProjectData } from '../types';

// Mock dependencies
vi.mock('../contexts/AuthContext');
vi.mock('../services/projectService');

const mockUseAuth = useAuth as Mock;
const mockProjectService = projectService as any;

describe('useProjectData', () => {
  const mockUser = { uid: 'user123', email: 'test@example.com' };
  const mockProject: Project = {
    id: 'project123',
    name: 'Test Project',
    description: 'A test project',
    ownerId: 'user123',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isArchived: false
  };

  const mockMember: ProjectMember = {
    userId: 'member123',
    projectId: 'project123',
    role: 'editor',
    joinedAt: Date.now(),
    lastActiveAt: Date.now()
  };

  const mockCanvas: ProjectCanvas = {
    id: 'canvas123',
    projectId: 'project123',
    name: 'Test Canvas',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'user123',
    isArchived: false,
    order: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser });
    
    // Mock successful service calls
    mockProjectService.getUserProjects.mockResolvedValue({
      projects: [mockProject],
      lastDoc: null,
      hasMore: false
    });
    
    mockProjectService.getProject.mockResolvedValue(mockProject);
    mockProjectService.getProjectMembers.mockResolvedValue([mockMember]);
    mockProjectService.getProjectCanvases.mockResolvedValue([mockCanvas]);
    mockProjectService.getProjectActivities.mockResolvedValue({
      activities: [],
      lastDoc: null,
      hasMore: false
    });
    mockProjectService.createProject.mockResolvedValue(mockProject);
    mockProjectService.updateProject.mockResolvedValue(undefined);
    mockProjectService.deleteProject.mockResolvedValue(undefined);
    mockProjectService.archiveProject.mockResolvedValue(undefined);
    mockProjectService.unarchiveProject.mockResolvedValue(undefined);
    mockProjectService.searchProjects.mockResolvedValue({
      projects: [mockProject],
      lastDoc: null,
      hasMore: false
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useProjectData());

      expect(result.current.projects).toEqual([]);
      expect(result.current.currentProject).toBeNull();
      expect(result.current.projectsLoading).toBe(false);
      expect(result.current.projectsError).toBeNull();
      expect(result.current.cacheStats.size).toBe(0);
    });

    it('should load projects on mount when user is authenticated', async () => {
      const { result } = renderHook(() => useProjectData());

      await waitFor(() => {
        expect(result.current.projectsLoading).toBe(false);
      });

      expect(mockProjectService.getUserProjects).toHaveBeenCalledWith('user123', {
        includeArchived: false,
        limit: 20,
        startAfter: undefined
      });
      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0]).toEqual(mockProject);
    });

    it('should not load projects when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null });
      
      const { result } = renderHook(() => useProjectData());

      expect(mockProjectService.getUserProjects).not.toHaveBeenCalled();
      expect(result.current.projects).toEqual([]);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch projects successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjects(true);
      });

      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0]).toEqual(mockProject);
      expect(result.current.projectsLoading).toBe(false);
      expect(result.current.projectsError).toBeNull();
    });

    it('should handle fetch projects error', async () => {
      const error = new ProjectServiceError('Network error', 'NETWORK_ERROR');
      mockProjectService.getUserProjects.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjects(true);
      });

      expect(result.current.projectsError).toBe('Network error');
      expect(result.current.projectsLoading).toBe(false);
    });

    it('should fetch single project successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        const project = await result.current.fetchProject('project123');
        expect(project).toEqual(mockProject);
      });

      expect(result.current.currentProject).toEqual(mockProject);
      expect(result.current.projectLoading).toBe(false);
      expect(result.current.projectError).toBeNull();
    });

    it('should fetch project members successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjectMembers('project123');
      });

      expect(result.current.currentProjectMembers).toHaveLength(1);
      expect(result.current.currentProjectMembers[0]).toEqual(mockMember);
      expect(result.current.membersLoading).toBe(false);
      expect(result.current.membersError).toBeNull();
    });

    it('should fetch project canvases successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjectCanvases('project123');
      });

      expect(result.current.currentProjectCanvases).toHaveLength(1);
      expect(result.current.currentProjectCanvases[0]).toEqual(mockCanvas);
      expect(result.current.canvasesLoading).toBe(false);
      expect(result.current.canvasesError).toBeNull();
    });

    it('should fetch project activities successfully', async () => {
      const mockActivities = [
        {
          id: 'activity1',
          projectId: 'project123',
          userId: 'user123',
          action: 'project_created',
          targetType: 'project',
          targetId: 'project123',
          targetName: 'Test Project',
          createdAt: Date.now()
        }
      ];

      mockProjectService.getProjectActivities.mockResolvedValue({
        activities: mockActivities,
        lastDoc: null,
        hasMore: false
      });

      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjectActivities('project123');
      });

      expect(result.current.currentProjectActivities).toHaveLength(1);
      expect(result.current.currentProjectActivities[0]).toEqual(mockActivities[0]);
      expect(result.current.activitiesLoading).toBe(false);
      expect(result.current.activitiesError).toBeNull();
    });
  });

  describe('Caching', () => {
    it('should cache fetched projects', async () => {
      const { result } = renderHook(() => useProjectData());

      // First fetch
      await act(async () => {
        await result.current.fetchProjects(true);
      });

      expect(result.current.cacheStats.size).toBeGreaterThan(0);

      // Second fetch should use cache
      mockProjectService.getUserProjects.mockClear();
      
      await act(async () => {
        await result.current.fetchProjects(false);
      });

      // Should not call service again due to caching
      expect(mockProjectService.getUserProjects).not.toHaveBeenCalled();
    });

    it('should cache single project', async () => {
      const { result } = renderHook(() => useProjectData());

      // First fetch
      await act(async () => {
        await result.current.fetchProject('project123');
      });

      expect(result.current.isProjectCached('project123')).toBe(true);

      // Second fetch should use cache
      mockProjectService.getProject.mockClear();
      
      await act(async () => {
        await result.current.fetchProject('project123');
      });

      // Should not call service again due to caching
      expect(mockProjectService.getProject).not.toHaveBeenCalled();
    });

    it('should force refresh when requested', async () => {
      const { result } = renderHook(() => useProjectData());

      // First fetch
      await act(async () => {
        await result.current.fetchProject('project123');
      });

      // Force refresh
      await act(async () => {
        await result.current.fetchProject('project123', true);
      });

      // Should call service again
      expect(mockProjectService.getProject).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache', async () => {
      const { result } = renderHook(() => useProjectData());

      // Fetch and cache data
      await act(async () => {
        await result.current.fetchProjects(true);
        await result.current.fetchProject('project123');
      });

      const initialCacheSize = result.current.cacheStats.size;
      expect(initialCacheSize).toBeGreaterThan(0);

      // Invalidate cache
      await act(async () => {
        result.current.invalidateCache();
      });

      expect(result.current.cacheStats.size).toBe(0);
    });

    it('should invalidate specific cache pattern', async () => {
      const { result } = renderHook(() => useProjectData());

      // Fetch and cache data
      await act(async () => {
        await result.current.fetchProjects(true);
        await result.current.fetchProject('project123');
      });

      const initialCacheSize = result.current.cacheStats.size;

      // Invalidate only project-specific cache
      await act(async () => {
        result.current.invalidateCache('project_');
      });

      expect(result.current.cacheStats.size).toBeLessThan(initialCacheSize);
    });

    it('should get cache age', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProject('project123');
      });

      const cacheAge = result.current.getCacheAge('project123');
      expect(cacheAge).toBeGreaterThanOrEqual(0);
      expect(cacheAge).toBeLessThan(1000); // Should be very recent
    });
  });

  describe('Data Mutations', () => {
    it('should create project successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      const projectData: CreateProjectData = {
        name: 'New Project',
        description: 'A new project'
      };

      await act(async () => {
        const project = await result.current.createProject(projectData);
        expect(project).toEqual(mockProject);
      });

      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0]).toEqual(mockProject);
    });

    it('should update project successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      // First set up a project
      await act(async () => {
        await result.current.fetchProjects(true);
      });

      const updateData = {
        name: 'Updated Project',
        description: 'Updated description'
      };

      await act(async () => {
        await result.current.updateProject('project123', updateData);
      });

      expect(result.current.projects[0].name).toBe('Updated Project');
      expect(result.current.projects[0].description).toBe('Updated description');
    });

    it('should delete project successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      // First set up a project
      await act(async () => {
        await result.current.fetchProjects(true);
      });

      expect(result.current.projects).toHaveLength(1);

      await act(async () => {
        await result.current.deleteProject('project123');
      });

      expect(result.current.projects).toHaveLength(0);
    });

    it('should archive project successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      // First set up a project
      await act(async () => {
        await result.current.fetchProjects(true);
      });

      await act(async () => {
        await result.current.archiveProject('project123');
      });

      expect(result.current.projects[0].isArchived).toBe(true);
    });

    it('should unarchive project successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      // First set up an archived project
      const archivedProject = { ...mockProject, isArchived: true };
      mockProjectService.getUserProjects.mockResolvedValue({
        projects: [archivedProject],
        lastDoc: null,
        hasMore: false
      });

      await act(async () => {
        await result.current.fetchProjects(true);
      });

      await act(async () => {
        await result.current.unarchiveProject('project123');
      });

      expect(result.current.projects[0].isArchived).toBe(false);
    });
  });

  describe('Search and Filtering', () => {
    it('should search projects successfully', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.searchProjects('test');
      });

      expect(mockProjectService.searchProjects).toHaveBeenCalledWith('user123', 'test', { limit: 20 });
      expect(result.current.projects).toHaveLength(1);
    });

    it('should cache search results', async () => {
      const { result } = renderHook(() => useProjectData());

      // First search
      await act(async () => {
        await result.current.searchProjects('test');
      });

      // Second search should use cache
      mockProjectService.searchProjects.mockClear();
      
      await act(async () => {
        await result.current.searchProjects('test');
      });

      expect(mockProjectService.searchProjects).not.toHaveBeenCalled();
    });

    it('should set show archived flag', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        result.current.setShowArchived(true);
      });

      // Should trigger a new fetch with archived flag
      await waitFor(() => {
        expect(mockProjectService.getUserProjects).toHaveBeenCalledWith('user123', {
          includeArchived: true,
          limit: 20,
          startAfter: undefined
        });
      });
    });
  });

  describe('Pagination', () => {
    it('should fetch more projects', async () => {
      const { result } = renderHook(() => useProjectData());

      // Set up initial state with hasMore = true
      await act(async () => {
        await result.current.fetchProjects(true);
      });

      // Mock hasMore = true for pagination
      mockProjectService.getUserProjects.mockResolvedValue({
        projects: [mockProject],
        lastDoc: 'lastDoc123',
        hasMore: true
      });

      await act(async () => {
        await result.current.fetchMoreProjects();
      });

      expect(mockProjectService.getUserProjects).toHaveBeenCalledWith('user123', {
        includeArchived: false,
        limit: 20,
        startAfter: undefined
      });
    });

    it('should not fetch more when hasMore is false', async () => {
      const { result } = renderHook(() => useProjectData());

      // Set up initial state with hasMore = false
      await act(async () => {
        await result.current.fetchProjects(true);
      });

      mockProjectService.getUserProjects.mockClear();

      await act(async () => {
        await result.current.fetchMoreProjects();
      });

      // Should not call service when hasMore is false
      expect(mockProjectService.getUserProjects).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should get project by ID', async () => {
      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjects(true);
      });

      const project = result.current.getProjectById('project123');
      expect(project).toEqual(mockProject);

      const nonExistentProject = result.current.getProjectById('nonexistent');
      expect(nonExistentProject).toBeUndefined();
    });

    it('should refresh current project', async () => {
      const { result } = renderHook(() => useProjectData());

      // Set up current project
      await act(async () => {
        await result.current.fetchProject('project123');
      });

      // Clear mocks
      mockProjectService.getProject.mockClear();
      mockProjectService.getProjectMembers.mockClear();
      mockProjectService.getProjectCanvases.mockClear();
      mockProjectService.getProjectActivities.mockClear();

      await act(async () => {
        await result.current.refreshCurrentProject();
      });

      // Should call all fetch methods with force refresh
      expect(mockProjectService.getProject).toHaveBeenCalledWith('project123');
      expect(mockProjectService.getProjectMembers).toHaveBeenCalledWith('project123');
      expect(mockProjectService.getProjectCanvases).toHaveBeenCalledWith('project123');
      expect(mockProjectService.getProjectActivities).toHaveBeenCalledWith('project123', { limit: 50 });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockProjectService.getUserProjects.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjects(true);
      });

      expect(result.current.projectsError).toBe('Failed to fetch projects');
      expect(result.current.projectsLoading).toBe(false);
    });

    it('should handle ProjectServiceError', async () => {
      const error = new ProjectServiceError('Custom error', 'CUSTOM_ERROR');
      mockProjectService.getUserProjects.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjects(true);
      });

      expect(result.current.projectsError).toBe('Custom error');
    });

    it('should handle non-Error objects', async () => {
      mockProjectService.getUserProjects.mockRejectedValue('String error');

      const { result } = renderHook(() => useProjectData());

      await act(async () => {
        await result.current.fetchProjects(true);
      });

      expect(result.current.projectsError).toBe('Failed to fetch projects');
    });
  });

  describe('Background Refresh', () => {
    it('should set up background refresh for current project', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useProjectData());

      // Set up current project
      await act(async () => {
        await result.current.fetchProject('project123');
      });

      mockProjectService.getProject.mockClear();

      // Fast forward time to trigger background refresh
      act(() => {
        vi.advanceTimersByTime(30000); // 30 seconds
      });

      await waitFor(() => {
        expect(mockProjectService.getProject).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });
});
