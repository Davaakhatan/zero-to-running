// Project service for Firebase CRUD operations
// Handles all project-related database operations with proper error handling and validation

import {
  doc,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  ProjectActivity,
  ProjectInvitation,
  CreateProjectData,
  UpdateProjectData,
  ProjectRole,
  PROJECT_COLLECTIONS 
} from '../types';
import { generateId } from '../utils/helpers';
import { 
  getProjectPath,
  getProjectMetadataPath,
  getProjectMembersPath,
  getProjectMemberPath,
  getProjectCanvasesPath,
  getProjectCanvasPath,
  getProjectActivitiesPath,
  getProjectActivityPath,
  getUserProjectsPath
} from './firebaseProjectStructure';

// Service configuration
const SERVICE_CONFIG = {
  BATCH_SIZE: 500,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000
};

// Error types
export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProjectServiceError';
  }
}

// Service class
class ProjectService {
  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData, ownerId: string): Promise<Project> {
    try {
      const now = Date.now();
      const projectId = `project_${ownerId}_${now}`;
      
      console.log('Creating project with ID:', projectId);
      console.log('Owner ID:', ownerId);
      console.log('Project data:', data);
      
      // Create project document
      const project: Project = {
        id: projectId,
        name: data.name,
        description: data.description || '', // Ensure it's never undefined
        ownerId,
        createdAt: now,
        updatedAt: now,
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

      console.log('About to create project metadata...');
      // Create project metadata
      await this.setProjectMetadata(projectId, project);
      console.log('Project metadata created successfully');
      
      console.log('About to add project member...');
      // Add owner as project member
      await this.addProjectMember(projectId, {
        id: generateId(),
        userId: ownerId,
        email: '', // Will be populated by Firebase Auth
        name: '', // Will be populated by Firebase Auth
        displayName: '', // Will be populated by Firebase Auth
        avatar: '', // Will be populated by Firebase Auth
        role: 'owner',
        status: 'active',
        joinedAt: now,
        lastActiveAt: now,
        isOnline: true
      });
      console.log('Project member added successfully');

      console.log('About to update user project membership...');
      await this.updateUserProjectMembership(ownerId, projectId, 'owner');
      console.log('User project membership updated successfully');

      console.log('About to create default canvas...');
      // Create default canvas
      const defaultCanvas: ProjectCanvas = {
        id: 'canvas-1',
        projectId,
        name: 'Main Canvas',
        description: 'Default canvas for the project',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        createdAt: now,
        updatedAt: now,
        createdBy: ownerId,
        isArchived: false,
        order: 0
      };
      
      await this.addProjectCanvas(projectId, defaultCanvas);
      console.log('Default canvas created successfully');

      console.log('About to create project activity...');
      await this.createProjectActivity(projectId, {
        userId: ownerId,
        userName: '', // Will be populated later
        userAvatar: '', // Will be populated later
        action: 'project_created',
        targetType: 'project',
        targetId: projectId,
        targetName: data.name,
        metadata: {
          projectName: data.name,
          projectDescription: data.description
        },
        createdAt: now,
        projectId: projectId,
        timestamp: now
      });
      console.log('Project activity created successfully');
      
      console.log('Project creation completed successfully');

      // Return project with canvases
      return {
        ...project,
        canvases: [defaultCanvas]
      } as Project & { canvases: ProjectCanvas[] };
    } catch (error) {
      console.error('ProjectService.createProject error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        details: (error as any)?.details
      });
      throw new ProjectServiceError(
        'Failed to create project',
        'CREATE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await getDoc(doc(db, PROJECT_COLLECTIONS.PROJECTS, projectId));
      
      if (!projectDoc.exists()) {
        return null;
      }

      return { id: projectDoc.id, ...projectDoc.data() } as Project;
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to get project',
        'GET_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, data: UpdateProjectData): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, PROJECT_COLLECTIONS.PROJECTS, projectId), updateData);

      // Create activity if significant changes
      if (data.name || data.description) {
        await this.createProjectActivity(projectId, {
          userId: data.updatedBy || 'system',
          userName: '', // Will be populated later
          userAvatar: '', // Will be populated later
          action: 'project_updated',
          targetType: 'project',
          targetId: projectId,
          targetName: data.name || 'Project',
          metadata: {
            changes: Object.keys(data).filter(key => key !== 'updatedAt' && key !== 'updatedBy')
          },
          createdAt: Date.now(),
          projectId: projectId,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to update project',
        'UPDATE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete a project (soft delete)
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      // Verify user has permission to delete
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      if (project.ownerId !== userId) {
        throw new Error('Only project owner can delete the project');
      }

      // Soft delete by marking as deleted
      await this.updateProject(projectId, {
        isDeleted: true
      });

      // Create activity
      await this.createProjectActivity(projectId, {
        userId,
        userName: '', // Will be populated later
        userAvatar: '', // Will be populated later
        action: 'project_deleted',
        targetType: 'project',
        targetId: projectId,
        targetName: project.name,
        metadata: {
          projectName: project.name
        },
        createdAt: Date.now(),
        projectId: projectId,
        timestamp: Date.now()
      });
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to delete project',
        'DELETE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Archive a project
   */
  async archiveProject(projectId: string, userId: string): Promise<void> {
    try {
      await this.updateProject(projectId, {
        isArchived: true
      });

      // Create activity
      await this.createProjectActivity(projectId, {
        userId,
        userName: '', // Will be populated later
        userAvatar: '', // Will be populated later
        action: 'project_archived',
        targetType: 'project',
        targetId: projectId,
        targetName: 'Project',
        metadata: {},
        createdAt: Date.now(),
        projectId: projectId,
        timestamp: Date.now()
      });
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to archive project',
        'ARCHIVE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Unarchive a project
   */
  async unarchiveProject(projectId: string, userId: string): Promise<void> {
    try {
      await this.updateProject(projectId, {
        isArchived: false
      });

      // Create activity
      await this.createProjectActivity(projectId, {
        userId,
        userName: '', // Will be populated later
        userAvatar: '', // Will be populated later
        action: 'project_unarchived',
        targetType: 'project',
        targetId: projectId,
        targetName: 'Project',
        metadata: {},
        createdAt: Date.now(),
        projectId: projectId,
        timestamp: Date.now()
      });
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to unarchive project',
        'UNARCHIVE_PROJECT_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get user's projects
   */
  async getUserProjects(
    userId: string, 
    options: {
      includeArchived?: boolean;
      limit?: number;
      startAfter?: any;
    } = {}
  ): Promise<{ projects: Project[]; lastDoc: any; hasMore: boolean }> {
    try {
      const { includeArchived = false, limit: limitCount = 20, startAfter: startAfterDoc } = options;
      
      let q = query(
        collection(db, PROJECT_COLLECTIONS.PROJECTS),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      if (!includeArchived) {
        q = query(
          collection(db, PROJECT_COLLECTIONS.PROJECTS),
          where('ownerId', '==', userId),
          where('isArchived', '==', false),
          orderBy('updatedAt', 'desc'),
          limit(limitCount)
        );
      }

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === limitCount;

      return { projects, lastDoc, hasMore };
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to get user projects',
        'GET_USER_PROJECTS_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Search projects by name
   */
  async searchProjects(
    userId: string,
    searchTerm: string,
    options: {
      limit?: number;
      startAfter?: any;
    } = {}
  ): Promise<{ projects: Project[]; lastDoc: any; hasMore: boolean }> {
    try {
      const { limit: limitCount = 20, startAfter: startAfterDoc } = options;
      
      let q = query(
        collection(db, PROJECT_COLLECTIONS.PROJECTS),
        where('ownerId', '==', userId),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name', 'asc'),
        limit(limitCount)
      );

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === limitCount;

      return { projects, lastDoc, hasMore };
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to search projects',
        'SEARCH_PROJECTS_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Add a project member
   */
  async addProjectMember(projectId: string, member: ProjectMember): Promise<void> {
    try {
      console.log('Adding project member:', { projectId, userId: member.userId, role: member.role });
      await this.setProjectMember(projectId, member.userId, member);
      console.log('Project member document created successfully');
      
      console.log('Updating user project membership...');
      await this.updateUserProjectMembership(member.userId, projectId, member.role);
      console.log('User project membership updated successfully');
    } catch (error) {
      console.error('Error in addProjectMember:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        details: (error as any)?.details,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new ProjectServiceError(
        'Failed to add project member',
        'ADD_MEMBER_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update a project member
   */
  async updateProjectMember(projectId: string, userId: string, updates: Partial<ProjectMember>): Promise<void> {
    try {
      const memberDoc = await getDoc(doc(db, getProjectMemberPath(projectId, userId)));
      
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }

      const updatedMember = {
        ...memberDoc.data(),
        ...updates,
        updatedAt: new Date()
      };

      await this.setProjectMember(projectId, userId, updatedMember as ProjectMember);
      
      // Update user's project membership if role changed
      if (updates.role) {
        await this.updateUserProjectMembership(userId, projectId, updates.role);
      }
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to update project member',
        'UPDATE_MEMBER_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Remove a project member
   */
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, getProjectMemberPath(projectId, userId)));
      await this.removeUserProjectMembership(userId, projectId);
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to remove project member',
        'REMOVE_MEMBER_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get project members
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const membersSnapshot = await getDocs(collection(db, getProjectMembersPath(projectId)));
      return membersSnapshot.docs.map(doc => ({ ...doc.data() } as ProjectMember));
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to get project members',
        'GET_MEMBERS_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Add a project canvas
   */
  async addProjectCanvas(projectId: string, canvas: ProjectCanvas): Promise<void> {
    try {
      console.log('Adding project canvas:', { projectId, canvasId: canvas.id });
      await this.setProjectCanvas(projectId, canvas.id, canvas);
      console.log('Canvas document created successfully');
      
      // Create activity
      console.log('Creating canvas activity...');
      await this.createProjectActivity(projectId, {
        userId: canvas.createdBy,
        userName: '', // Will be populated later
        userAvatar: '', // Will be populated later
        action: 'canvas_created',
        targetType: 'canvas',
        targetId: canvas.id,
        targetName: canvas.name,
        metadata: {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height
        },
        createdAt: Date.now(),
        projectId: projectId,
        timestamp: Date.now()
      });
      console.log('Canvas activity created successfully');
    } catch (error) {
      console.error('Error in addProjectCanvas:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        details: (error as any)?.details,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new ProjectServiceError(
        'Failed to add project canvas',
        'ADD_CANVAS_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update a project canvas
   */
  async updateProjectCanvas(projectId: string, canvasId: string, updates: Partial<ProjectCanvas>): Promise<void> {
    try {
      const canvasDoc = await getDoc(doc(db, getProjectCanvasPath(projectId, canvasId)));
      
      if (!canvasDoc.exists()) {
        throw new Error('Canvas not found');
      }

      const updatedCanvas = {
        ...canvasDoc.data(),
        ...updates,
        updatedAt: Date.now()
      };

      await this.setProjectCanvas(projectId, canvasId, updatedCanvas as ProjectCanvas);
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to update project canvas',
        'UPDATE_CANVAS_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Remove a project canvas
   */
  async removeProjectCanvas(projectId: string, canvasId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, getProjectCanvasPath(projectId, canvasId)));
      
      // Create activity
      await this.createProjectActivity(projectId, {
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        action: 'canvas_deleted',
        targetType: 'canvas',
        targetId: canvasId,
        targetName: 'Canvas',
        metadata: {},
        createdAt: Date.now(),
        projectId: projectId,
        timestamp: Date.now()
      });
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to remove project canvas',
        'REMOVE_CANVAS_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get project canvases
   */
  async getProjectCanvases(projectId: string): Promise<ProjectCanvas[]> {
    try {
      const canvasesSnapshot = await getDocs(collection(db, getProjectCanvasesPath(projectId)));
      return canvasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectCanvas));
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to get project canvases',
        'GET_CANVASES_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get project activities
   */
  async getProjectActivities(
    projectId: string,
    options: {
      limit?: number;
      startAfter?: any;
    } = {}
  ): Promise<{ activities: ProjectActivity[]; lastDoc: any; hasMore: boolean }> {
    try {
      const { limit: limitCount = 50, startAfter: startAfterDoc } = options;
      
      let q = query(
        collection(db, getProjectActivitiesPath(projectId)),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectActivity));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === limitCount;

      return { activities, lastDoc, hasMore };
    } catch (error) {
      throw new ProjectServiceError(
        'Failed to get project activities',
        'GET_ACTIVITIES_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  private async setProjectMetadata(projectId: string, project: Project): Promise<void> {
    await setDoc(doc(db, PROJECT_COLLECTIONS.PROJECTS, projectId), project);
  }

  private async setProjectMember(projectId: string, userId: string, member: ProjectMember): Promise<void> {
    const path = getProjectMemberPath(projectId, userId);
    console.log('Setting project member at path:', path);
    const pathSegments = path.split('/');
    await setDoc(doc(db, pathSegments[0], pathSegments[1], pathSegments[2], pathSegments[3]), member);
  }

  private async setProjectCanvas(projectId: string, canvasId: string, canvas: ProjectCanvas): Promise<void> {
    const path = getProjectCanvasPath(projectId, canvasId);
    console.log('Setting project canvas at path:', path);
    const pathSegments = path.split('/');
    await setDoc(doc(db, pathSegments[0], pathSegments[1], pathSegments[2], pathSegments[3]), canvas);
  }

  private async createProjectActivity(projectId: string, activity: Omit<ProjectActivity, 'id'>): Promise<void> {
    try {
      const activityId = `activity_${projectId}_${Date.now()}`;
      const activityDoc: ProjectActivity = {
        id: activityId,
        projectId,
        ...activity,
        createdAt: Date.now()
      };

      const path = getProjectActivityPath(projectId, activityId);
      console.log('Setting project activity at path:', path);
      console.log('Activity document:', activityDoc);
      const pathSegments = path.split('/');
      await setDoc(doc(db, pathSegments[0], pathSegments[1], pathSegments[2], pathSegments[3]), activityDoc);
      console.log('Project activity created successfully');
    } catch (error) {
      console.error('Error in createProjectActivity:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        details: (error as any)?.details,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async updateUserProjectMembership(userId: string, projectId: string, role: ProjectRole): Promise<void> {
    const userProjectsRef = doc(db, 'userProjects', userId);
    const userProjectsDoc = await getDoc(userProjectsRef);
    
    // Get existing data or start with empty object
    const userProjects = userProjectsDoc.exists() ? userProjectsDoc.data() : {};
    
    // Store project ID as key directly (NOT nested under 'projects')
    userProjects[projectId] = {
      role,
      joinedAt: new Date(),
      projectName: 'Project' // TODO: Get actual project name
    };
    
    console.log('Updating user project membership for user:', userId, 'project:', projectId);
    console.log('userProjects data structure:', userProjects);
    // Use setDoc instead of updateDoc to create the document if it doesn't exist
    await setDoc(userProjectsRef, userProjects);
    console.log('User project membership updated successfully');
  }

  private async removeUserProjectMembership(userId: string, projectId: string): Promise<void> {
    const userProjectsRef = doc(db, 'userProjects', userId);
    const userProjectsDoc = await getDoc(userProjectsRef);
    
    if (userProjectsDoc.exists()) {
      const userProjects = userProjectsDoc.data();
      // Delete project ID directly (NOT nested under 'projects')
      delete userProjects[projectId];
      await updateDoc(userProjectsRef, userProjects);
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();

// Error class is already exported above
