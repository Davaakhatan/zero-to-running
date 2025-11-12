// Custom hook for simplified project management
// Provides easy-to-use functions for common project operations

import { useCallback, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  CreateProjectData,
  UpdateProjectData,
  ProjectRole 
} from '../types';

// ProjectSummary type for simplified project display
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  memberCount: number;
  canvasCount: number;
  lastUpdated: number;
  isArchived: boolean;
  userRole: string;
  ownerId: string;
  metadata?: {
    tags?: string[];
  };
}

// Hook return type
export interface UseProjectsReturn {
  // Project list
  projects: ProjectSummary[];
  projectsLoading: boolean;
  projectsError: string | null;
  loading: boolean;
  error: string | null;
  
  // Current project
  currentProject: Project | null;
  currentProjectId: string | null;
  currentProjectMembers: ProjectMember[];
  currentProjectCanvases: ProjectCanvas[];
  userRole: ProjectRole | null;
  
  // Loading states
  isCreatingProject: boolean;
  isUpdatingProject: boolean;
  isDeletingProject: boolean;
  membersLoading: boolean;
  canvasesLoading: boolean;
  
  // Search and filters
  searchTerm: string;
  showArchived: boolean;
  hasMoreProjects: boolean;
  
  // Project operations
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (projectId: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  unarchiveProject: (projectId: string) => Promise<void>;
  
  // Navigation
  setCurrentProject: (projectId: string) => Promise<void>;
  clearCurrentProject: () => void;
  
  // Member operations
  addMember: (projectId: string, member: ProjectMember) => Promise<void>;
  updateMember: (projectId: string, member: ProjectMember) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  
  // Canvas operations
  addCanvas: (projectId: string, canvas: ProjectCanvas) => Promise<void>;
  updateCanvas: (projectId: string, canvas: ProjectCanvas) => Promise<void>;
  removeCanvas: (projectId: string, canvasId: string) => Promise<void>;
  
  // Search and filters
  setSearchTerm: (term: string) => void;
  setShowArchived: (show: boolean) => void;
  loadMoreProjects: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  
  // Permission checks
  canEditProject: (projectId?: string) => boolean;
  canDeleteProject: (projectId?: string) => boolean;
  canManageMembers: (projectId?: string) => boolean;
  canCreateCanvas: (projectId?: string) => boolean;
  canEditCanvas: (projectId?: string, canvasId?: string) => boolean;
  canDeleteCanvas: (projectId?: string, canvasId?: string) => boolean;
  
  // Utility functions
  getProjectById: (projectId: string) => Project | undefined;
  getMemberById: (userId: string) => ProjectMember | undefined;
  getCanvasById: (canvasId: string) => ProjectCanvas | undefined;
  isProjectOwner: (projectId?: string) => boolean;
  isProjectAdmin: (projectId?: string) => boolean;
}

export const useProjects = (): UseProjectsReturn => {
  const { user } = useAuth();
  const {
    state,
    loadProjects,
    loadMoreProjects,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    setCurrentProject,
    clearCurrentProject,
    loadCurrentProjectDetails,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    addProjectCanvas,
    updateProjectCanvas,
    removeProjectCanvas,
    setSearchTerm,
    setShowArchived,
    hasPermission,
    isProjectOwner,
    isProjectAdmin,
    canEdit,
    canView
  } = useProject();

  // Transform projects to ProjectSummary format
  const projects = useMemo((): ProjectSummary[] => {
    return state.projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      thumbnailUrl: project.thumbnail,
      memberCount: (project as any).members?.length || 1, // Default to 1 (owner)
      canvasCount: (project as any).canvases?.length || 1, // Default to 1 (main canvas)
      lastUpdated: typeof project.updatedAt === 'number' ? project.updatedAt : new Date(project.updatedAt).getTime(),
      isArchived: project.isArchived,
      userRole: state.userRole || 'owner', // Default to owner for projects in the list
      ownerId: project.ownerId,
      metadata: project.metadata
    }));
  }, [state.projects, state.userRole]);

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!state.searchTerm) return projects;
    
    const term = state.searchTerm.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term)
    );
  }, [projects, state.searchTerm]);

  // Filter projects based on archived status
  const visibleProjects = useMemo(() => {
    return filteredProjects.filter(project => 
      state.showArchived ? project.isArchived : !project.isArchived
    );
  }, [filteredProjects, state.showArchived]);

  // Project operations with error handling
  const createProjectWithErrorHandling = useCallback(async (data: CreateProjectData): Promise<Project> => {
    try {
      return await createProject(data);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [createProject]);

  const updateProjectWithErrorHandling = useCallback(async (projectId: string, data: UpdateProjectData): Promise<void> => {
    try {
      await updateProject(projectId, data);
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }, [updateProject]);

  const deleteProjectWithErrorHandling = useCallback(async (projectId: string): Promise<void> => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [deleteProject]);

  // Navigation with error handling
  const setCurrentProjectWithErrorHandling = useCallback(async (projectId: string): Promise<void> => {
    try {
      await setCurrentProject(projectId);
      // loadCurrentProjectDetails() is no longer needed since setCurrentProject now sets details directly
    } catch (error) {
      console.error('Failed to set current project:', error);
      throw error;
    }
  }, [setCurrentProject]);

  // Member operations with error handling
  const addMemberWithErrorHandling = useCallback(async (projectId: string, member: ProjectMember): Promise<void> => {
    try {
      await addProjectMember(projectId, member);
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error;
    }
  }, [addProjectMember]);

  const updateMemberWithErrorHandling = useCallback(async (projectId: string, member: ProjectMember): Promise<void> => {
    try {
      await updateProjectMember(projectId, member);
    } catch (error) {
      console.error('Failed to update member:', error);
      throw error;
    }
  }, [updateProjectMember]);

  const removeMemberWithErrorHandling = useCallback(async (projectId: string, userId: string): Promise<void> => {
    try {
      await removeProjectMember(projectId, userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }, [removeProjectMember]);

  // Canvas operations with error handling
  const addCanvasWithErrorHandling = useCallback(async (projectId: string, canvas: ProjectCanvas): Promise<void> => {
    try {
      await addProjectCanvas(projectId, canvas);
    } catch (error) {
      console.error('Failed to add canvas:', error);
      throw error;
    }
  }, [addProjectCanvas]);

  const updateCanvasWithErrorHandling = useCallback(async (projectId: string, canvas: ProjectCanvas): Promise<void> => {
    try {
      await updateProjectCanvas(projectId, canvas);
    } catch (error) {
      console.error('Failed to update canvas:', error);
      throw error;
    }
  }, [updateProjectCanvas]);

  const removeCanvasWithErrorHandling = useCallback(async (projectId: string, canvasId: string): Promise<void> => {
    try {
      await removeProjectCanvas(projectId, canvasId);
    } catch (error) {
      console.error('Failed to remove canvas:', error);
      throw error;
    }
  }, [removeProjectCanvas]);

  // Refresh projects
  const refreshProjects = useCallback(async (): Promise<void> => {
    try {
      await loadProjects(true);
    } catch (error) {
      console.error('Failed to refresh projects:', error);
      throw error;
    }
  }, [loadProjects]);

  // Permission checking functions
  const canEditProject = useCallback((projectId?: string): boolean => {
    if (projectId && projectId !== state.currentProjectId) {
      // Check permission for specific project
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return false;
      
      // TODO: Check user's role in that specific project
      return true; // Placeholder
    }
    
    return canEdit();
  }, [state.currentProjectId, state.projects, canEdit]);

  const canDeleteProject = useCallback((projectId?: string): boolean => {
    if (projectId && projectId !== state.currentProjectId) {
      // Check permission for specific project
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return false;
      
      // TODO: Check if user is owner of that specific project
      return project.ownerId === user?.uid;
    }
    
    return isProjectOwner();
  }, [state.currentProjectId, state.projects, user?.uid, isProjectOwner]);

  const canManageMembers = useCallback((projectId?: string): boolean => {
    if (projectId && projectId !== state.currentProjectId) {
      // Check permission for specific project
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return false;
      
      // TODO: Check if user is admin/owner of that specific project
      return true; // Placeholder
    }
    
    return isProjectAdmin();
  }, [state.currentProjectId, state.projects, isProjectAdmin]);

  const canCreateCanvas = useCallback((projectId?: string): boolean => {
    return canEditProject(projectId);
  }, [canEditProject]);

  const canEditCanvas = useCallback((projectId?: string, canvasId?: string): boolean => {
    return canEditProject(projectId);
  }, [canEditProject]);

  const canDeleteCanvas = useCallback((projectId?: string, canvasId?: string): boolean => {
    return canEditProject(projectId);
  }, [canEditProject]);

  // Utility functions
  const getProjectById = useCallback((projectId: string): Project | undefined => {
    return state.projects.find(p => p.id === projectId);
  }, [state.projects]);

  const getMemberById = useCallback((userId: string): ProjectMember | undefined => {
    return state.currentProjectMembers.find(m => m.userId === userId);
  }, [state.currentProjectMembers]);

  const getCanvasById = useCallback((canvasId: string): ProjectCanvas | undefined => {
    return state.currentProjectCanvases.find(c => c.id === canvasId);
  }, [state.currentProjectCanvases]);

  const isProjectOwnerById = useCallback((projectId?: string): boolean => {
    if (projectId && projectId !== state.currentProjectId) {
      const project = state.projects.find(p => p.id === projectId);
      return project?.ownerId === user?.uid;
    }
    
    return isProjectOwner();
  }, [state.currentProjectId, state.projects, user?.uid, isProjectOwner]);

  const isProjectAdminById = useCallback((projectId?: string): boolean => {
    if (projectId && projectId !== state.currentProjectId) {
      // TODO: Check if user is admin of that specific project
      return true; // Placeholder
    }
    
    return isProjectAdmin();
  }, [state.currentProjectId, isProjectAdmin]);

  return {
    // Project list
    projects: visibleProjects,
    projectsLoading: state.projectsLoading,
    projectsError: state.projectsError,
    loading: state.projectsLoading,
    error: state.projectsError,
    
    // Current project
    currentProject: state.currentProject,
    currentProjectId: state.currentProjectId,
    currentProjectMembers: state.currentProjectMembers,
    currentProjectCanvases: state.currentProjectCanvases,
    userRole: state.userRole,
    
    // Loading states
    isCreatingProject: state.isCreatingProject,
    isUpdatingProject: state.isUpdatingProject,
    isDeletingProject: state.isDeletingProject,
    membersLoading: state.membersLoading,
    canvasesLoading: state.canvasesLoading,
    
    // Search and filters
    searchTerm: state.searchTerm,
    showArchived: state.showArchived,
    hasMoreProjects: state.hasMoreProjects,
    
    // Project operations
    createProject: createProjectWithErrorHandling,
    updateProject: updateProjectWithErrorHandling,
    deleteProject: deleteProjectWithErrorHandling,
    archiveProject,
    unarchiveProject,
    
    // Navigation
    setCurrentProject: setCurrentProjectWithErrorHandling,
    clearCurrentProject,
    
    // Member operations
    addMember: addMemberWithErrorHandling,
    updateMember: updateMemberWithErrorHandling,
    removeMember: removeMemberWithErrorHandling,
    
    // Canvas operations
    addCanvas: addCanvasWithErrorHandling,
    updateCanvas: updateCanvasWithErrorHandling,
    removeCanvas: removeCanvasWithErrorHandling,
    
    // Search and filters
    setSearchTerm,
    setShowArchived,
    loadMoreProjects,
    refreshProjects,
    
    // Permission checks
    canEditProject,
    canDeleteProject,
    canManageMembers,
    canCreateCanvas,
    canEditCanvas,
    canDeleteCanvas,
    
    // Utility functions
    getProjectById,
    getMemberById,
    getCanvasById,
    isProjectOwner: isProjectOwnerById,
    isProjectAdmin: isProjectAdminById
  };
};
