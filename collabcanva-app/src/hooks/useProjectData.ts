// Enhanced hook for project data fetching and caching
// Provides optimized data fetching with caching, background updates, and performance optimization

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectService, ProjectServiceError } from '../services/projectService';
import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  ProjectActivity,
  CreateProjectData,
  UpdateProjectData,
  ProjectRole 
} from '../types';

// Cache configuration
const CACHE_CONFIG = {
  PROJECTS_TTL: 5 * 60 * 1000, // 5 minutes
  PROJECT_DETAILS_TTL: 2 * 60 * 1000, // 2 minutes
  MEMBERS_TTL: 3 * 60 * 1000, // 3 minutes
  CANVASES_TTL: 3 * 60 * 1000, // 3 minutes
  ACTIVITIES_TTL: 1 * 60 * 1000, // 1 minute
  MAX_CACHE_SIZE: 100,
  BACKGROUND_REFRESH_INTERVAL: 30 * 1000 // 30 seconds
};

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  lastAccessed: number;
}

// Cache management
class ProjectDataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = [];

  set<T>(key: string, data: T, ttl: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      lastAccessed: Date.now()
    });

    // Update access order
    this.updateAccessOrder(key);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = now;
    this.updateAccessOrder(key);
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      // Invalidate entries matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.removeFromAccessOrder(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
      this.accessOrder = [];
    }
  }

  private evictOldest(): void {
    if (this.accessOrder.length === 0) return;

    const oldestKey = this.accessOrder[0];
    this.cache.delete(oldestKey);
    this.accessOrder.shift();
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const projectCache = new ProjectDataCache();

// Hook state interface
interface ProjectDataState {
  // Projects list
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  hasMoreProjects: boolean;
  lastProjectDoc: any;
  loading: boolean;
  error: string | null;

  // Current project details
  currentProject: Project | null;
  currentProjectMembers: ProjectMember[];
  currentProjectCanvases: ProjectCanvas[];
  currentProjectActivities: ProjectActivity[];
  
  // Loading states
  projectLoading: boolean;
  membersLoading: boolean;
  canvasesLoading: boolean;
  activitiesLoading: boolean;
  
  // Error states
  projectError: string | null;
  membersError: string | null;
  canvasesError: string | null;
  activitiesError: string | null;

  // Cache stats
  cacheStats: { size: number; keys: string[] };
}

// Hook return interface
interface UseProjectDataReturn extends ProjectDataState {
  // Data fetching
  fetchProjects: (refresh?: boolean) => Promise<void>;
  fetchMoreProjects: () => Promise<void>;
  fetchProject: (projectId: string, forceRefresh?: boolean) => Promise<Project | null>;
  fetchProjectMembers: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  fetchProjectCanvases: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  fetchProjectActivities: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  
  // Data mutations
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (projectId: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  unarchiveProject: (projectId: string) => Promise<void>;
  
  // Cache management
  invalidateCache: (pattern?: string) => void;
  refreshCurrentProject: () => Promise<void>;
  
  // Search and filters
  searchProjects: (searchTerm: string) => Promise<void>;
  setShowArchived: (show: boolean) => void;
  
  // Utility functions
  getProjectById: (projectId: string) => Project | undefined;
  isProjectCached: (projectId: string) => boolean;
  getCacheAge: (projectId: string) => number | null;
}

export const useProjectData = (): UseProjectDataReturn => {
  const { user } = useAuth();
  const [state, setState] = useState<ProjectDataState>({
    projects: [],
    projectsLoading: false,
    projectsError: null,
    hasMoreProjects: true,
    lastProjectDoc: null,
    loading: false,
    error: null,
    currentProject: null,
    currentProjectMembers: [],
    currentProjectCanvases: [],
    currentProjectActivities: [],
    projectLoading: false,
    membersLoading: false,
    canvasesLoading: false,
    activitiesLoading: false,
    projectError: null,
    membersError: null,
    canvasesError: null,
    activitiesError: null,
    cacheStats: { size: 0, keys: [] }
  });

  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const backgroundRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Update cache stats
  const updateCacheStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      cacheStats: projectCache.getStats()
    }));
  }, []);

  // Fetch projects with caching
  const fetchProjects = useCallback(async (refresh = false): Promise<void> => {
    if (!user) return;

    const cacheKey = `projects_${user.uid}_${showArchived}`;
    
    // Check cache first
    if (!refresh) {
      const cachedData = projectCache.get<{
        projects: Project[];
        lastDoc: any;
        hasMore: boolean;
      }>(cacheKey);
      
      if (cachedData) {
        setState(prev => ({
          ...prev,
          projects: cachedData.projects,
          lastProjectDoc: cachedData.lastDoc,
          hasMoreProjects: cachedData.hasMore,
          projectsLoading: false,
          projectsError: null
        }));
        updateCacheStats();
        return;
      }
    }

    try {
      setState(prev => ({ ...prev, projectsLoading: true, projectsError: null }));

      const result = await projectService.getUserProjects(user.uid, {
        includeArchived: showArchived,
        limit: 20,
        startAfter: refresh ? undefined : state.lastProjectDoc
      });

      const newProjects = refresh ? result.projects : [...state.projects, ...result.projects];

      setState(prev => ({
        ...prev,
        projects: newProjects,
        lastProjectDoc: result.lastDoc,
        hasMoreProjects: result.hasMore,
        projectsLoading: false
      }));

      // Cache the result
      projectCache.set(cacheKey, {
        projects: newProjects,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore
      }, CACHE_CONFIG.PROJECTS_TTL);

      updateCacheStats();
    } catch (error) {
      const errorMessage = error instanceof ProjectServiceError 
        ? error.message 
        : 'Failed to fetch projects';
      
      setState(prev => ({
        ...prev,
        projectsLoading: false,
        projectsError: errorMessage
      }));
    }
  }, [user, showArchived, state.projects, state.lastProjectDoc, updateCacheStats]);

  // Fetch more projects (pagination)
  const fetchMoreProjects = useCallback(async (): Promise<void> => {
    if (!state.hasMoreProjects || state.projectsLoading) return;
    await fetchProjects(false);
  }, [fetchProjects, state.hasMoreProjects, state.projectsLoading]);

  // Fetch single project with caching
  const fetchProject = useCallback(async (projectId: string, forceRefresh = false): Promise<Project | null> => {
    const cacheKey = `project_${projectId}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedProject = projectCache.get<Project>(cacheKey);
      if (cachedProject) {
        setState(prev => ({
          ...prev,
          currentProject: cachedProject,
          projectLoading: false,
          projectError: null
        }));
        updateCacheStats();
        return cachedProject;
      }
    }

    try {
      setState(prev => ({ ...prev, projectLoading: true, projectError: null }));

      const project = await projectService.getProject(projectId);
      
      setState(prev => ({
        ...prev,
        currentProject: project,
        projectLoading: false
      }));

      // Cache the result
      if (project) {
        projectCache.set(cacheKey, project, CACHE_CONFIG.PROJECT_DETAILS_TTL);
      }

      updateCacheStats();
      return project;
    } catch (error) {
      const errorMessage = error instanceof ProjectServiceError 
        ? error.message 
        : 'Failed to fetch project';
      
      setState(prev => ({
        ...prev,
        projectLoading: false,
        projectError: errorMessage
      }));
      return null;
    }
  }, [updateCacheStats]);

  // Fetch project members with caching
  const fetchProjectMembers = useCallback(async (projectId: string, forceRefresh = false): Promise<void> => {
    const cacheKey = `members_${projectId}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedMembers = projectCache.get<ProjectMember[]>(cacheKey);
      if (cachedMembers) {
        setState(prev => ({
          ...prev,
          currentProjectMembers: cachedMembers,
          membersLoading: false,
          membersError: null
        }));
        updateCacheStats();
        return;
      }
    }

    try {
      setState(prev => ({ ...prev, membersLoading: true, membersError: null }));

      const members = await projectService.getProjectMembers(projectId);
      
      setState(prev => ({
        ...prev,
        currentProjectMembers: members,
        membersLoading: false
      }));

      // Cache the result
      projectCache.set(cacheKey, members, CACHE_CONFIG.MEMBERS_TTL);
      updateCacheStats();
    } catch (error) {
      const errorMessage = error instanceof ProjectServiceError 
        ? error.message 
        : 'Failed to fetch project members';
      
      setState(prev => ({
        ...prev,
        membersLoading: false,
        membersError: errorMessage
      }));
    }
  }, [updateCacheStats]);

  // Fetch project canvases with caching
  const fetchProjectCanvases = useCallback(async (projectId: string, forceRefresh = false): Promise<void> => {
    const cacheKey = `canvases_${projectId}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedCanvases = projectCache.get<ProjectCanvas[]>(cacheKey);
      if (cachedCanvases) {
        setState(prev => ({
          ...prev,
          currentProjectCanvases: cachedCanvases,
          canvasesLoading: false,
          canvasesError: null
        }));
        updateCacheStats();
        return;
      }
    }

    try {
      setState(prev => ({ ...prev, canvasesLoading: true, canvasesError: null }));

      const canvases = await projectService.getProjectCanvases(projectId);
      
      setState(prev => ({
        ...prev,
        currentProjectCanvases: canvases,
        canvasesLoading: false
      }));

      // Cache the result
      projectCache.set(cacheKey, canvases, CACHE_CONFIG.CANVASES_TTL);
      updateCacheStats();
    } catch (error) {
      const errorMessage = error instanceof ProjectServiceError 
        ? error.message 
        : 'Failed to fetch project canvases';
      
      setState(prev => ({
        ...prev,
        canvasesLoading: false,
        canvasesError: errorMessage
      }));
    }
  }, [updateCacheStats]);

  // Fetch project activities with caching
  const fetchProjectActivities = useCallback(async (projectId: string, forceRefresh = false): Promise<void> => {
    const cacheKey = `activities_${projectId}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedActivities = projectCache.get<ProjectActivity[]>(cacheKey);
      if (cachedActivities) {
        setState(prev => ({
          ...prev,
          currentProjectActivities: cachedActivities,
          activitiesLoading: false,
          activitiesError: null
        }));
        updateCacheStats();
        return;
      }
    }

    try {
      setState(prev => ({ ...prev, activitiesLoading: true, activitiesError: null }));

      const result = await projectService.getProjectActivities(projectId, { limit: 50 });
      
      setState(prev => ({
        ...prev,
        currentProjectActivities: result.activities,
        activitiesLoading: false
      }));

      // Cache the result
      projectCache.set(cacheKey, result.activities, CACHE_CONFIG.ACTIVITIES_TTL);
      updateCacheStats();
    } catch (error) {
      const errorMessage = error instanceof ProjectServiceError 
        ? error.message 
        : 'Failed to fetch project activities';
      
      setState(prev => ({
        ...prev,
        activitiesLoading: false,
        activitiesError: errorMessage
      }));
    }
  }, [updateCacheStats]);

  // Create project
  const createProject = useCallback(async (data: CreateProjectData): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const project = await projectService.createProject(data, user.uid);
      
      // Update local state
      setState(prev => ({
        ...prev,
        projects: [project, ...prev.projects]
      }));

      // Invalidate cache
      projectCache.invalidate(`projects_${user.uid}`);
      updateCacheStats();

      return project;
    } catch (error) {
      throw error instanceof ProjectServiceError ? error : new ProjectServiceError(
        'Failed to create project',
        'CREATE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, [user, updateCacheStats]);

  // Update project
  const updateProject = useCallback(async (projectId: string, data: UpdateProjectData): Promise<void> => {
    try {
      await projectService.updateProject(projectId, data);
      
      // Update local state
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === projectId ? { 
            ...p, 
            ...data, 
            updatedAt: Date.now(),
            settings: data.settings ? { ...p.settings, ...data.settings } : p.settings
          } : p
        ),
        currentProject: prev.currentProject?.id === projectId 
          ? { 
              ...prev.currentProject, 
              ...data, 
              updatedAt: Date.now(),
              settings: data.settings ? { ...prev.currentProject.settings, ...data.settings } : prev.currentProject.settings
            }
          : prev.currentProject
      }));

      // Invalidate cache
      projectCache.invalidate(`project_${projectId}`);
      projectCache.invalidate(`projects_${user?.uid}`);
      updateCacheStats();
    } catch (error) {
      throw error instanceof ProjectServiceError ? error : new ProjectServiceError(
        'Failed to update project',
        'UPDATE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, [user, updateCacheStats]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await projectService.deleteProject(projectId, user.uid);
      
      // Update local state
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        currentProject: prev.currentProject?.id === projectId ? null : prev.currentProject
      }));

      // Invalidate cache
      projectCache.invalidate(`project_${projectId}`);
      projectCache.invalidate(`projects_${user.uid}`);
      updateCacheStats();
    } catch (error) {
      throw error instanceof ProjectServiceError ? error : new ProjectServiceError(
        'Failed to delete project',
        'DELETE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, [user, updateCacheStats]);

  // Archive project
  const archiveProject = useCallback(async (projectId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await projectService.archiveProject(projectId, user.uid);
      await updateProject(projectId, { isArchived: true });
    } catch (error) {
      throw error instanceof ProjectServiceError ? error : new ProjectServiceError(
        'Failed to archive project',
        'ARCHIVE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, [user, updateProject]);

  // Unarchive project
  const unarchiveProject = useCallback(async (projectId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await projectService.unarchiveProject(projectId, user.uid);
      await updateProject(projectId, { isArchived: false });
    } catch (error) {
      throw error instanceof ProjectServiceError ? error : new ProjectServiceError(
        'Failed to unarchive project',
        'UNARCHIVE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, [user, updateProject]);

  // Invalidate cache
  const invalidateCache = useCallback((pattern?: string): void => {
    projectCache.invalidate(pattern);
    updateCacheStats();
  }, [updateCacheStats]);

  // Refresh current project
  const refreshCurrentProject = useCallback(async (): Promise<void> => {
    if (!state.currentProject) return;

    const projectId = state.currentProject.id;
    await Promise.all([
      fetchProject(projectId, true),
      fetchProjectMembers(projectId, true),
      fetchProjectCanvases(projectId, true),
      fetchProjectActivities(projectId, true)
    ]);
  }, [state.currentProject, fetchProject, fetchProjectMembers, fetchProjectCanvases, fetchProjectActivities]);

  // Search projects
  const searchProjects = useCallback(async (searchTerm: string): Promise<void> => {
    if (!user || !searchTerm.trim()) return;

    const cacheKey = `search_${user.uid}_${searchTerm}`;
    
    // Check cache first
    const cachedResults = projectCache.get<Project[]>(cacheKey);
    if (cachedResults) {
      setState(prev => ({
        ...prev,
        projects: cachedResults,
        projectsLoading: false,
        projectsError: null
      }));
      updateCacheStats();
      return;
    }

    try {
      setState(prev => ({ ...prev, projectsLoading: true, projectsError: null }));

      const result = await projectService.searchProjects(user.uid, searchTerm, { limit: 20 });
      
      setState(prev => ({
        ...prev,
        projects: result.projects,
        lastProjectDoc: result.lastDoc,
        hasMoreProjects: result.hasMore,
        projectsLoading: false
      }));

      // Cache the result
      projectCache.set(cacheKey, result.projects, CACHE_CONFIG.PROJECTS_TTL);
      updateCacheStats();
    } catch (error) {
      const errorMessage = error instanceof ProjectServiceError 
        ? error.message 
        : 'Failed to search projects';
      
      setState(prev => ({
        ...prev,
        projectsLoading: false,
        projectsError: errorMessage
      }));
    }
  }, [user, updateCacheStats]);

  // Utility functions
  const getProjectById = useCallback((projectId: string): Project | undefined => {
    return state.projects.find(p => p.id === projectId);
  }, [state.projects]);

  const isProjectCached = useCallback((projectId: string): boolean => {
    return projectCache.has(`project_${projectId}`);
  }, []);

  const getCacheAge = useCallback((projectId: string): number | null => {
    const entry = projectCache['cache'].get(`project_${projectId}`);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }, []);

  // Background refresh
  useEffect(() => {
    if (!user || !state.currentProject) return;

    const startBackgroundRefresh = () => {
      backgroundRefreshRef.current = setInterval(() => {
        if (state.currentProject) {
          fetchProject(state.currentProject.id, true);
        }
      }, CACHE_CONFIG.BACKGROUND_REFRESH_INTERVAL);
    };

    startBackgroundRefresh();

    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
      }
    };
  }, [user, state.currentProject, fetchProject]);

  // Load projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects(true);
    } else {
      setState(prev => ({
        ...prev,
        projects: [],
        currentProject: null,
        currentProjectMembers: [],
        currentProjectCanvases: [],
        currentProjectActivities: []
      }));
      projectCache.invalidate();
    }
  }, [user, fetchProjects]);

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  return {
    ...state,
    loading: state.projectsLoading,
    error: state.projectsError,
    fetchProjects,
    fetchMoreProjects,
    fetchProject,
    fetchProjectMembers,
    fetchProjectCanvases,
    fetchProjectActivities,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    invalidateCache,
    refreshCurrentProject,
    searchProjects,
    setShowArchived,
    getProjectById,
    isProjectCached,
    getCacheAge
  };
};
