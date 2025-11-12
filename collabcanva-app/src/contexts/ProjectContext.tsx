// Project Context for managing project-related state across the application
// Provides centralized state management for projects, members, and canvases

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  ProjectWithDetails,
  ProjectRole,
  CreateProjectData,
  UpdateProjectData 
} from '../types';
import { 
  ProjectQueries, 
  MemberQueries, 
  CanvasQueries, 
  QueryExecutor 
} from '../services/firebaseQueryService';

// State interface
interface ProjectState {
  // Current project
  currentProject: ProjectWithDetails | null;
  currentProjectId: string | null;
  
  // Project list
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  
  // Project members
  currentProjectMembers: ProjectMember[];
  membersLoading: boolean;
  membersError: string | null;
  
  // Project canvases
  currentProjectCanvases: ProjectCanvas[];
  canvasesLoading: boolean;
  canvasesError: string | null;
  
  // User's role in current project
  userRole: ProjectRole | null;
  
  // UI state
  isCreatingProject: boolean;
  isUpdatingProject: boolean;
  isDeletingProject: boolean;
  
  // Search and filters
  searchTerm: string;
  showArchived: boolean;
  
  // Pagination
  hasMoreProjects: boolean;
  lastProjectDoc: any;
}

// Action types
type ProjectAction =
  | { type: 'SET_CURRENT_PROJECT'; payload: { project: ProjectWithDetails; projectId: string } }
  | { type: 'CLEAR_CURRENT_PROJECT' }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECTS'; payload: Project[] }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'SET_PROJECTS_LOADING'; payload: boolean }
  | { type: 'SET_PROJECTS_ERROR'; payload: string | null }
  | { type: 'SET_MEMBERS'; payload: ProjectMember[] }
  | { type: 'ADD_MEMBER'; payload: ProjectMember }
  | { type: 'UPDATE_MEMBER'; payload: ProjectMember }
  | { type: 'REMOVE_MEMBER'; payload: string }
  | { type: 'SET_MEMBERS_LOADING'; payload: boolean }
  | { type: 'SET_MEMBERS_ERROR'; payload: string | null }
  | { type: 'SET_CANVASES'; payload: ProjectCanvas[] }
  | { type: 'ADD_CANVAS'; payload: ProjectCanvas }
  | { type: 'UPDATE_CANVAS'; payload: ProjectCanvas }
  | { type: 'REMOVE_CANVAS'; payload: string }
  | { type: 'SET_CANVASES_LOADING'; payload: boolean }
  | { type: 'SET_CANVASES_ERROR'; payload: string | null }
  | { type: 'SET_USER_ROLE'; payload: ProjectRole }
  | { type: 'SET_CREATING_PROJECT'; payload: boolean }
  | { type: 'SET_UPDATING_PROJECT'; payload: boolean }
  | { type: 'SET_DELETING_PROJECT'; payload: boolean }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SHOW_ARCHIVED'; payload: boolean }
  | { type: 'SET_PAGINATION'; payload: { hasMore: boolean; lastDoc: any } }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: ProjectState = {
  currentProject: null,
  currentProjectId: null,
  projects: [],
  projectsLoading: false,
  projectsError: null,
  currentProjectMembers: [],
  membersLoading: false,
  membersError: null,
  currentProjectCanvases: [],
  canvasesLoading: false,
  canvasesError: null,
  userRole: null,
  isCreatingProject: false,
  isUpdatingProject: false,
  isDeletingProject: false,
  searchTerm: '',
  showArchived: false,
  hasMoreProjects: true,
  lastProjectDoc: null
};

// Reducer
function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_CURRENT_PROJECT':
      return {
        ...state,
        currentProject: action.payload.project,
        currentProjectId: action.payload.projectId,
        userRole: action.payload.project.members.find(
          m => m.userId === state.currentProject?.ownerId
        )?.role || null
      };
    
    case 'CLEAR_CURRENT_PROJECT':
      return {
        ...state,
        currentProject: null,
        currentProjectId: null,
        currentProjectMembers: [],
        currentProjectCanvases: [],
        userRole: null
      };
    
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload,
        hasMoreProjects: action.payload.length > 0
      };
    
    case 'ADD_PROJECTS':
      return {
        ...state,
        projects: [...state.projects, ...action.payload],
        hasMoreProjects: action.payload.length > 0
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject: state.currentProject?.id === action.payload.id 
          ? { ...state.currentProject, ...action.payload }
          : state.currentProject
      };
    
    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload 
          ? null 
          : state.currentProject,
        currentProjectId: state.currentProjectId === action.payload 
          ? null 
          : state.currentProjectId
      };
    
    case 'SET_PROJECTS_LOADING':
      return { ...state, projectsLoading: action.payload };
    
    case 'SET_PROJECTS_ERROR':
      return { ...state, projectsError: action.payload };
    
    case 'SET_MEMBERS':
      return { ...state, currentProjectMembers: action.payload };
    
    case 'ADD_MEMBER':
      return {
        ...state,
        currentProjectMembers: [...state.currentProjectMembers, action.payload]
      };
    
    case 'UPDATE_MEMBER':
      return {
        ...state,
        currentProjectMembers: state.currentProjectMembers.map(m =>
          m.userId === action.payload.userId ? action.payload : m
        )
      };
    
    case 'REMOVE_MEMBER':
      return {
        ...state,
        currentProjectMembers: state.currentProjectMembers.filter(
          m => m.userId !== action.payload
        )
      };
    
    case 'SET_MEMBERS_LOADING':
      return { ...state, membersLoading: action.payload };
    
    case 'SET_MEMBERS_ERROR':
      return { ...state, membersError: action.payload };
    
    case 'SET_CANVASES':
      return { ...state, currentProjectCanvases: action.payload };
    
    case 'ADD_CANVAS':
      return {
        ...state,
        currentProjectCanvases: [...state.currentProjectCanvases, action.payload]
      };
    
    case 'UPDATE_CANVAS':
      return {
        ...state,
        currentProjectCanvases: state.currentProjectCanvases.map(c =>
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'REMOVE_CANVAS':
      return {
        ...state,
        currentProjectCanvases: state.currentProjectCanvases.filter(
          c => c.id !== action.payload
        )
      };
    
    case 'SET_CANVASES_LOADING':
      return { ...state, canvasesLoading: action.payload };
    
    case 'SET_CANVASES_ERROR':
      return { ...state, canvasesError: action.payload };
    
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };
    
    case 'SET_CREATING_PROJECT':
      return { ...state, isCreatingProject: action.payload };
    
    case 'SET_UPDATING_PROJECT':
      return { ...state, isUpdatingProject: action.payload };
    
    case 'SET_DELETING_PROJECT':
      return { ...state, isDeletingProject: action.payload };
    
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    
    case 'SET_SHOW_ARCHIVED':
      return { ...state, showArchived: action.payload };
    
    case 'SET_PAGINATION':
      return {
        ...state,
        hasMoreProjects: action.payload.hasMore,
        lastProjectDoc: action.payload.lastDoc
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context interface
interface ProjectContextType {
  // State
  state: ProjectState;
  
  // Project management
  loadProjects: (refresh?: boolean) => Promise<void>;
  loadMoreProjects: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (projectId: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  unarchiveProject: (projectId: string) => Promise<void>;
  
  // Current project management
  setCurrentProject: (projectId: string) => Promise<void>;
  clearCurrentProject: () => void;
  loadCurrentProjectDetails: () => Promise<void>;
  
  // Project members
  loadProjectMembers: (projectId: string) => Promise<void>;
  addProjectMember: (projectId: string, member: ProjectMember) => Promise<void>;
  updateProjectMember: (projectId: string, member: ProjectMember) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
  
  // Project canvases
  loadProjectCanvases: (projectId: string) => Promise<void>;
  addProjectCanvas: (projectId: string, canvas: ProjectCanvas) => Promise<void>;
  updateProjectCanvas: (projectId: string, canvas: ProjectCanvas) => Promise<void>;
  removeProjectCanvas: (projectId: string, canvasId: string) => Promise<void>;
  
  // Search and filters
  setSearchTerm: (term: string) => void;
  setShowArchived: (show: boolean) => void;
  
  // Utility functions
  hasPermission: (permission: string) => boolean;
  isProjectOwner: () => boolean;
  isProjectAdmin: () => boolean;
  canEdit: () => boolean;
  canView: () => boolean;
}

// Create context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider component
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { user } = useAuth();
  const projectsLoadedRef = useRef(false);

  // Load projects when provider mounts
  useEffect(() => {
    if (user && !projectsLoadedRef.current) {
      projectsLoadedRef.current = true;
      
      // Try to load projects from Firebase first
      const loadFromFirebase = async () => {
        dispatch({ type: 'SET_PROJECTS_LOADING', payload: true });
        
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          
          // TEMPORARY: Load ALL projects for collaboration (not just user's projects)
          // This allows all users to see and collaborate on all projects
          console.log('[ProjectContext] Loading ALL projects for collaboration');
          const projectsRef = collection(db, 'projects');
          const querySnapshot = await getDocs(projectsRef);
          
          const allProjects: Project[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            allProjects.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
            } as Project);
          });
          
          // Filter out archived projects
          const validProjects = allProjects.filter(p => !p.isArchived);
          console.log('[ProjectContext] Successfully loaded', validProjects.length, 'projects (from', allProjects.length, 'total)');
          
          if (validProjects.length > 0) {
            dispatch({ type: 'SET_PROJECTS', payload: validProjects });
            dispatch({ type: 'SET_PROJECTS_LOADING', payload: false });
            return;
          }
          
          // No projects found in Firebase, load mock data
          console.log('[ProjectContext] No Firebase projects found, loading mock data');
          loadMockProjects();
        } catch (error) {
          console.warn('[ProjectContext] Firebase load failed, using mock data:', error);
          loadMockProjects();
        }
      };
      
      const loadMockProjects = () => {
        const mockProjects: Project[] = [
          {
            id: 'mock-1',
            name: 'My First Project',
            description: 'A sample project to demonstrate the interface',
            ownerId: user.uid,
            createdAt: new Date('2024-01-15').getTime(),
            updatedAt: new Date('2024-01-20').getTime(),
            isArchived: false,
            settings: {
              allowComments: true,
              allowViewing: true,
              allowDownloads: true,
              isPublic: false,
              defaultCanvasWidth: 1920,
              defaultCanvasHeight: 1080,
              theme: 'light'
            },
            canvases: [
              {
                id: 'canvas-1',
                projectId: 'mock-1',
                name: 'Main Canvas',
                description: 'Primary canvas for this project',
                createdAt: new Date('2024-01-15').getTime(),
                updatedAt: new Date('2024-01-20').getTime(),
                createdBy: user.uid,
                thumbnail: null,
                width: 1920,
                height: 1080,
                backgroundColor: '#ffffff',
                isArchived: false,
                order: 0
              }
            ],
            members: [
              {
                id: user.uid,
                userId: user.uid,
                email: user.email || '',
                name: user.displayName || 'User',
                role: 'owner' as const,
                status: 'active' as const,
                joinedAt: Date.now(),
                isOnline: true,
                permissions: ['edit', 'delete', 'invite', 'manage']
              }
            ],
            metadata: {
              color: '#3b82f6',
              tags: ['design', 'prototype'],
              totalCanvases: 1,
              totalMembers: 1,
              totalViews: 0,
              lastActivity: new Date('2024-01-20')
            }
          }
        ];

        dispatch({ type: 'SET_PROJECTS', payload: mockProjects });
        dispatch({ type: 'SET_PROJECTS_LOADING', payload: false });
      };
      
      loadFromFirebase();
    }
  }, [user]);

  // Load user's projects
  const loadProjects = useCallback(async (refresh = false): Promise<void> => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_PROJECTS_LOADING', payload: true });
      dispatch({ type: 'SET_PROJECTS_ERROR', payload: null });

      // TEMPORARY: Mock data for frontend demonstration
      const mockProjects: Project[] = [
        {
          id: 'mock-1',
          name: 'My First Project',
          description: 'A sample project to demonstrate the interface',
          ownerId: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false,
          settings: {
            allowComments: true,
            allowViewing: true,
            allowDownloads: true,
            isPublic: false,
            defaultCanvasWidth: 1920,
            defaultCanvasHeight: 1080,
            theme: 'light'
          },
          canvases: [
            {
              id: 'canvas-1',
              projectId: 'mock-1',
              name: 'Main Canvas',
              description: 'Primary canvas for this project',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              createdBy: user.uid,
              thumbnail: null,
              width: 1920,
              height: 1080,
              backgroundColor: '#ffffff',
              isArchived: false,
              order: 0
            }
          ],
          members: [
            {
              id: user.uid,
              userId: user.uid,
              email: user.email || 'demo@demo.com',
              name: user.displayName || 'Demo User',
              role: 'owner' as const,
              status: 'active' as const,
              isOnline: true,
              joinedAt: Date.now(),
              permissions: ['edit', 'delete', 'invite', 'manage']
            }
          ],
          metadata: {
            color: '#3b82f6',
            tags: ['design', 'prototype'],
            totalCanvases: 1,
            totalMembers: 1,
            totalViews: 0,
            lastActivity: new Date('2024-01-20')
          }
        },
        {
          id: 'mock-2',
          name: 'Team Collaboration',
          description: 'Working together on a new design system',
          ownerId: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false,
          settings: {
            allowComments: true,
            allowViewing: true,
            allowDownloads: false,
            isPublic: false,
            defaultCanvasWidth: 1920,
            defaultCanvasHeight: 1080,
            theme: 'light'
          },
          canvases: [
            {
              id: 'canvas-2a',
              projectId: 'mock-2',
              name: 'Design System',
              description: 'Core design components',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              createdBy: user.uid,
              thumbnail: null,
              width: 1920,
              height: 1080,
              backgroundColor: '#f8fafc',
              isArchived: false,
              order: 0
            },
            {
              id: 'canvas-2b',
              projectId: 'mock-2',
              name: 'User Flows',
              description: 'User journey mapping',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              createdBy: user.uid,
              thumbnail: null,
              width: 1920,
              height: 1080,
              backgroundColor: '#ffffff',
              isArchived: false,
              order: 1
            }
          ],
          members: [
            {
              id: user.uid,
              userId: user.uid,
              email: user.email || 'demo@demo.com',
              name: user.displayName || 'Demo User',
              role: 'owner' as const,
              status: 'active' as const,
              isOnline: true,
              joinedAt: Date.now(),
              permissions: ['edit', 'delete', 'invite', 'manage']
            }
          ],
          metadata: {
            color: '#10b981',
            tags: ['collaboration', 'design-system', 'ux'],
            totalCanvases: 2,
            totalMembers: 1,
            totalViews: 0,
            lastActivity: new Date('2024-01-18')
          }
        },
        {
          id: 'mock-3',
          name: 'Archived Project',
          description: 'This project has been archived',
          ownerId: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: true,
          settings: {
            allowComments: false,
            allowViewing: true,
            allowDownloads: false,
            isPublic: false,
            defaultCanvasWidth: 1920,
            defaultCanvasHeight: 1080,
            theme: 'light'
          },
          canvases: [
            {
              id: 'canvas-3',
              projectId: 'mock-3',
              name: 'Old Design',
              description: 'Previous version',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              createdBy: user.uid,
              thumbnail: null,
              width: 1920,
              height: 1080,
              backgroundColor: '#ffffff',
              isArchived: false,
              order: 0
            }
          ],
          members: [
            {
              id: user.uid,
              userId: user.uid,
              email: user.email || 'demo@demo.com',
              name: user.displayName || 'Demo User',
              role: 'owner' as const,
              status: 'active' as const,
              isOnline: true,
              joinedAt: Date.now(),
              permissions: ['edit', 'delete', 'invite', 'manage']
            }
          ],
          metadata: {
            color: '#6b7280',
            tags: ['archived', 'old'],
            totalCanvases: 1,
            totalMembers: 1,
            totalViews: 0,
            lastActivity: new Date('2023-12-15')
          }
        }
      ];

      // Filter based on archived status
      const filteredProjects = mockProjects.filter(p => !p.isArchived);

      // Load projects immediately (no async delay for demo)
      dispatch({ type: 'SET_PROJECTS', payload: filteredProjects });
      dispatch({ 
        type: 'SET_PAGINATION', 
        payload: { hasMore: false, lastDoc: null }
      });

      /* ORIGINAL FIREBASE CODE - COMMENTED OUT FOR FRONTEND DEMO
      const query = state.showArchived 
        ? ProjectQueries.getUserProjects(user.uid, { pageSize: 20 })
        : ProjectQueries.getUserActiveProjects(user.uid, { pageSize: 20 });

      const result = await QueryExecutor.executeQuery<Project>(query);
      
      if (refresh) {
        dispatch({ type: 'SET_PROJECTS', payload: result.data });
      } else {
        dispatch({ type: 'ADD_PROJECTS', payload: result.data });
      }
      
      dispatch({ 
        type: 'SET_PAGINATION', 
        payload: { hasMore: result.hasMore, lastDoc: result.lastDoc }
      });
      */
    } catch (error) {
      console.warn('Failed to load projects:', error);
      dispatch({ 
        type: 'SET_PROJECTS_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load projects'
      });
    } finally {
      dispatch({ type: 'SET_PROJECTS_LOADING', payload: false });
    }
  }, [user]);

  // Load more projects (pagination) - TEMPORARILY DISABLED FOR DEMO
  const loadMoreProjects = useCallback(async () => {
    // No more projects to load in demo mode
    dispatch({ 
      type: 'SET_PAGINATION', 
      payload: { hasMore: false, lastDoc: null }
    });
  }, []);

  // Create new project
  const createProject = useCallback(async (data: CreateProjectData): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    try {
      dispatch({ type: 'SET_CREATING_PROJECT', payload: true });

      // Import projectService dynamically to avoid circular dependencies
      const { projectService } = await import('../services/projectService');
      
      try {
        // Create project using Firebase service
        const project = await projectService.createProject(data, user.uid);

        // Add to local state
        dispatch({ type: 'ADD_PROJECTS', payload: [project] });
        
        return project;
      } catch (firebaseError) {
        console.warn('Firebase project creation failed, using mock project:', firebaseError);
        
        // Fallback to mock project if Firebase fails
        const mockProject: Project = {
          id: `project_${user.uid}_${Date.now()}`,
          name: data.name,
          description: data.description,
          ownerId: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false,
          settings: {
            allowComments: true,
            allowViewing: true,
            allowDownloads: true,
            isPublic: false,
            defaultCanvasWidth: 1920,
            defaultCanvasHeight: 1080,
            theme: 'light'
          }
        };

        // Add to local state with default canvas
        const projectWithCanvas = {
          ...mockProject,
          canvases: [{
            id: 'canvas-1',
            projectId: mockProject.id,
            name: 'Main Canvas',
            description: 'Default canvas for the project',
            width: 1920,
            height: 1080,
            backgroundColor: '#ffffff',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: user.uid,
            isArchived: false,
            order: 0
          }]
        };

        dispatch({ type: 'ADD_PROJECTS', payload: [projectWithCanvas] });
        
        return projectWithCanvas;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      dispatch({ type: 'SET_CREATING_PROJECT', payload: false });
    }
  }, [user]);

  // Update project
  const updateProject = useCallback(async (projectId: string, data: UpdateProjectData): Promise<void> => {
    try {
      dispatch({ type: 'SET_UPDATING_PROJECT', payload: true });

      // TODO: Implement project update service
      // await projectService.updateProject(projectId, data);
      
      // For now, update local state
      const updatedProject = state.projects.find(p => p.id === projectId);
      if (updatedProject) {
        const newProject = { 
          ...updatedProject, 
          ...data, 
          updatedAt: Date.now(),
          settings: {
            ...updatedProject.settings,
            ...data.settings
          }
        };
        dispatch({ type: 'UPDATE_PROJECT', payload: newProject });
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      dispatch({ type: 'SET_UPDATING_PROJECT', payload: false });
    }
  }, [state.projects]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_DELETING_PROJECT', payload: true });

      // TODO: Implement project deletion service
      // await projectService.deleteProject(projectId);
      
      dispatch({ type: 'REMOVE_PROJECT', payload: projectId });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      dispatch({ type: 'SET_DELETING_PROJECT', payload: false });
    }
  }, []);

  // Archive project
  const archiveProject = useCallback(async (projectId: string): Promise<void> => {
    await updateProject(projectId, { isArchived: true });
  }, [updateProject]);

  // Unarchive project
  const unarchiveProject = useCallback(async (projectId: string): Promise<void> => {
    await updateProject(projectId, { isArchived: false });
  }, [updateProject]);

  // Set current project - TEMPORARILY DISABLED FOR DEMO
  const setCurrentProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      // Find project in current list - use a function to get current state
      let currentProjects = state.projects;
      let project = currentProjects.find(p => p.id === projectId);
      
      // If project not found, try to load it from Firebase or create it for demo purposes
      if (!project) {
        console.log('Project not found in local state, attempting to load from Firebase:', projectId);
        
        try {
          // Try to load from Firebase first
          const { projectService } = await import('../services/projectService');
          const firebaseProject = await projectService.getProject(projectId);
          
          if (firebaseProject) {
            console.log('Found project in Firebase, adding to local state:', firebaseProject);
            // Add the project to local state
            dispatch({ type: 'ADD_PROJECTS', payload: [firebaseProject] });
            project = firebaseProject;
            
            // If Firebase project has canvases, load them
            if ((firebaseProject as any).canvases && Array.isArray((firebaseProject as any).canvases)) {
              console.log('Loading canvases from Firebase project:', (firebaseProject as any).canvases.length);
              dispatch({ type: 'SET_CANVASES', payload: (firebaseProject as any).canvases });
            } else {
              // Try to fetch canvases separately
              try {
                const canvases = await projectService.getProjectCanvases(projectId);
                console.log('Loaded canvases separately from Firebase:', canvases.length);
                dispatch({ type: 'SET_CANVASES', payload: canvases });
              } catch (canvasError) {
                console.warn('Could not load canvases from Firebase:', canvasError);
              }
            }
          }
        } catch (firebaseError) {
          console.warn('Failed to load project from Firebase, creating demo project:', firebaseError);
        }
        
        // If still not found, create it for demo purposes
        if (!project) {
          project = {
            id: projectId,
            name: 'Demo Project',
            description: 'A demo project created on demand',
            ownerId: user?.uid || 'demo-user',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isArchived: false,
            settings: {
              allowComments: true,
              allowViewing: true,
              allowDownloads: true,
              isPublic: false,
              defaultCanvasWidth: 1920,
              defaultCanvasHeight: 1080,
              theme: 'light'
            },
            canvases: [
              {
                id: 'canvas-1',
                projectId: projectId,
                name: 'Main Canvas',
                description: 'Primary canvas for this project',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                createdBy: user?.uid || 'demo-user',
                thumbnail: null,
                width: 1920,
                height: 1080,
                backgroundColor: '#ffffff',
                isArchived: false,
                order: 0
              }
            ],
            members: [
              {
                id: user?.uid || 'demo-user',
                userId: user?.uid || 'demo-user',
                email: user?.email || 'demo@demo.com',
                name: user?.displayName || 'Demo User',
                role: 'owner' as const,
                status: 'active' as const,
                joinedAt: Date.now(),
                isOnline: true,
                permissions: ['edit', 'delete', 'invite', 'manage']
              }
            ],
            metadata: {
              color: '#3b82f6',
              tags: ['demo'],
              totalCanvases: 1,
              totalMembers: 1,
              totalViews: 0,
              lastActivity: new Date()
            }
          };
        }
      }

      // Mock project details for demo
      const mockMembers: ProjectMember[] = [
        {
          id: user?.uid || 'demo-user',
          userId: user?.uid || 'demo-user',
          email: user?.email || 'demo@demo.com',
          name: user?.displayName || 'Demo User',
          role: 'owner',
          status: 'active',
          isOnline: true,
          joinedAt: Date.now(),
          permissions: ['project.view', 'project.edit', 'project.delete', 'project.settings']
        }
      ];

      const mockCanvases: ProjectCanvas[] = [
        {
          id: 'canvas-1',
          projectId: projectId,
          name: 'Main Canvas',
          description: 'Default canvas for the project',
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user?.uid || 'demo-user',
          isArchived: false,
          order: 0
        }
      ];

      const projectWithDetails: ProjectWithDetails = {
        ...project,
        members: mockMembers,
        canvases: mockCanvases,
        recentActivity: [],
        stats: {
          memberCount: mockMembers.length,
          canvasCount: mockCanvases.length,
          lastActivityAt: new Date()
        }
      };

      dispatch({ 
        type: 'SET_CURRENT_PROJECT', 
        payload: { project: projectWithDetails, projectId }
      });
      
      // IMPORTANT: Also dispatch canvases separately so CanvasSwitcher can access them
      dispatch({ type: 'SET_CANVASES', payload: mockCanvases });
      dispatch({ type: 'SET_MEMBERS', payload: mockMembers });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to set current project');
    }
  }, [user]); // Removed state.projects from dependencies

  // Clear current project
  const clearCurrentProject = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_PROJECT' });
  }, []);

  // Load current project details
  const loadCurrentProjectDetails = useCallback(async (): Promise<void> => {
    if (!state.currentProjectId) return;

    try {
      await loadProjectMembers(state.currentProjectId);
      await loadProjectCanvases(state.currentProjectId);
    } catch (error) {
      console.error('Failed to load project details:', error);
    }
  }, [state.currentProjectId]);

  // Load project members - TEMPORARILY DISABLED FOR DEMO
  const loadProjectMembers = useCallback(async (projectId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_MEMBERS_LOADING', payload: true });
      dispatch({ type: 'SET_MEMBERS_ERROR', payload: null });

      // Mock members data for demo
      const mockMembers: ProjectMember[] = [
        {
          id: user?.uid || 'demo-user',
          userId: user?.uid || 'demo-user',
          email: user?.email || 'demo@demo.com',
          name: user?.displayName || 'Demo User',
          role: 'owner',
          status: 'active',
          isOnline: true,
          joinedAt: Date.now(),
          permissions: ['project.view', 'project.edit', 'project.delete', 'project.settings']
        }
      ];

      dispatch({ type: 'SET_MEMBERS', payload: mockMembers });
    } catch (error) {
      dispatch({ 
        type: 'SET_MEMBERS_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load members'
      });
    } finally {
      dispatch({ type: 'SET_MEMBERS_LOADING', payload: false });
    }
  }, [user]);

  // Add project member
  const addProjectMember = useCallback(async (projectId: string, member: ProjectMember): Promise<void> => {
    try {
      // TODO: Implement member addition service
      // await projectService.addMember(projectId, member);
      
      dispatch({ type: 'ADD_MEMBER', payload: member });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add member');
    }
  }, []);

  // Update project member
  const updateProjectMember = useCallback(async (projectId: string, member: ProjectMember): Promise<void> => {
    try {
      // TODO: Implement member update service
      // await projectService.updateMember(projectId, member);
      
      dispatch({ type: 'UPDATE_MEMBER', payload: member });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update member');
    }
  }, []);

  // Remove project member
  const removeProjectMember = useCallback(async (projectId: string, userId: string): Promise<void> => {
    try {
      // TODO: Implement member removal service
      // await projectService.removeMember(projectId, userId);
      
      dispatch({ type: 'REMOVE_MEMBER', payload: userId });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  }, []);

  // Load project canvases - TEMPORARILY DISABLED FOR DEMO
  const loadProjectCanvases = useCallback(async (projectId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_CANVASES_LOADING', payload: true });
      dispatch({ type: 'SET_CANVASES_ERROR', payload: null });

      // Mock canvases data for demo
      const mockCanvases: ProjectCanvas[] = [
        {
          id: 'canvas-1',
          projectId: projectId,
          name: 'Main Canvas',
          description: 'Default canvas for the project',
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user?.uid || 'demo-user',
          isArchived: false,
          order: 0
        }
      ];

      dispatch({ type: 'SET_CANVASES', payload: mockCanvases });
    } catch (error) {
      dispatch({ 
        type: 'SET_CANVASES_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load canvases'
      });
    } finally {
      dispatch({ type: 'SET_CANVASES_LOADING', payload: false });
    }
  }, [user]);

  // Add project canvas
  const addProjectCanvas = useCallback(async (projectId: string, canvas: ProjectCanvas): Promise<void> => {
    try {
      // TODO: Implement canvas addition service
      // await projectService.addCanvas(projectId, canvas);
      
      dispatch({ type: 'ADD_CANVAS', payload: canvas });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add canvas');
    }
  }, []);

  // Update project canvas
  const updateProjectCanvas = useCallback(async (projectId: string, canvas: ProjectCanvas): Promise<void> => {
    try {
      // TODO: Implement canvas update service
      // await projectService.updateCanvas(projectId, canvas);
      
      dispatch({ type: 'UPDATE_CANVAS', payload: canvas });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update canvas');
    }
  }, []);

  // Remove project canvas
  const removeProjectCanvas = useCallback(async (projectId: string, canvasId: string): Promise<void> => {
    try {
      // TODO: Implement canvas removal service
      // await projectService.removeCanvas(projectId, canvasId);
      
      dispatch({ type: 'REMOVE_CANVAS', payload: canvasId });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove canvas');
    }
  }, []);

  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  // Set show archived
  const setShowArchived = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_ARCHIVED', payload: show });
  }, []);

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.userRole) return false;
    
    // TODO: Implement permission checking logic
    // return PROJECT_PERMISSIONS[state.userRole].includes(permission);
    return true; // Placeholder
  }, [state.userRole]);

  const isProjectOwner = useCallback((): boolean => {
    return state.userRole === 'owner';
  }, [state.userRole]);

  const isProjectAdmin = useCallback((): boolean => {
    return state.userRole === 'owner' || state.userRole === 'admin';
  }, [state.userRole]);

  const canEdit = useCallback((): boolean => {
    return ['owner', 'admin', 'editor'].includes(state.userRole || '');
  }, [state.userRole]);

  const canView = useCallback((): boolean => {
    return ['owner', 'admin', 'editor', 'viewer'].includes(state.userRole || '');
  }, [state.userRole]);

  // Load projects on mount
  useEffect(() => {
    if (user) {
      loadProjects(true);
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user, loadProjects]);

  // Context value
  const contextValue: ProjectContextType = {
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
    loadProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    loadProjectCanvases,
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
  };

  // Load projects when provider mounts
  useEffect(() => {
    if (user) {
      // Load projects immediately (synchronous)
      loadProjects();
    }
  }, [user]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

// Export types for external use
export type { ProjectContextType, ProjectState };
