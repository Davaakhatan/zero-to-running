// Unit tests for projectService
// Tests all CRUD operations and error handling

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  projectService, 
  ProjectServiceError 
} from './projectService';
import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  CreateProjectData,
  UpdateProjectData,
  ProjectRole 
} from '../types';

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {}
}));

// Mock Firebase Firestore functions
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockStartAfter = vi.fn();
const mockWriteBatch = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  collection: mockCollection,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  startAfter: mockStartAfter,
  writeBatch: mockWriteBatch,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  Timestamp: vi.fn()
}));

// Mock project structure helpers
vi.mock('./firebaseProjectStructure', () => ({
  getProjectPath: vi.fn((id) => `projects/${id}`),
  getProjectMetadataPath: vi.fn((id) => `projects/${id}/metadata`),
  getProjectMembersPath: vi.fn((id) => `projects/${id}/members`),
  getProjectMemberPath: vi.fn((id, userId) => `projects/${id}/members/${userId}`),
  getProjectCanvasesPath: vi.fn((id) => `projects/${id}/canvases`),
  getProjectCanvasPath: vi.fn((id, canvasId) => `projects/${id}/canvases/${canvasId}`),
  getProjectActivitiesPath: vi.fn((id) => `projects/${id}/activities`),
  getProjectActivityPath: vi.fn((id, activityId) => `projects/${id}/activities/${activityId}`),
  getUserProjectsPath: vi.fn((userId) => `userProjects/${userId}`)
}));

describe('ProjectService', () => {
  const mockUserId = 'user123';
  const mockProjectId = 'project123';
  const mockCanvasId = 'canvas123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const projectData: CreateProjectData = {
        name: 'Test Project',
        description: 'A test project'
      };

      const expectedProject: Project = {
        id: expect.stringMatching(/^project_user123_\d+$/),
        name: 'Test Project',
        description: 'A test project',
        ownerId: mockUserId,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
        isArchived: false,
        settings: {
          allowComments: true,
          allowViewing: true,
          defaultCanvasWidth: 1920,
          defaultCanvasHeight: 1080,
          theme: 'light'
        }
      };

      // Mock successful operations
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({ exists: () => false });

      const result = await projectService.createProject(projectData, mockUserId);

      expect(result).toMatchObject(expectedProject);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(4); // Project, member, userProjects, activity
    });

    it('should throw ProjectServiceError on failure', async () => {
      const projectData: CreateProjectData = {
        name: 'Test Project',
        description: 'A test project'
      };

      mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(projectService.createProject(projectData, mockUserId))
        .rejects
        .toThrow(ProjectServiceError);
    });
  });

  describe('getProject', () => {
    it('should return project when it exists', async () => {
      const mockProject = {
        id: mockProjectId,
        name: 'Test Project',
        ownerId: mockUserId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isArchived: false
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockProjectId,
        data: () => mockProject
      });

      const result = await projectService.getProject(mockProjectId);

      expect(result).toEqual(mockProject);
      expect(mockGetDoc).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return null when project does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await projectService.getProject(mockProjectId);

      expect(result).toBeNull();
    });

    it('should throw ProjectServiceError on failure', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(projectService.getProject(mockProjectId))
        .rejects
        .toThrow(ProjectServiceError);
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const updateData: UpdateProjectData = {
        name: 'Updated Project',
        description: 'Updated description'
      };

      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.updateProject(mockProjectId, updateData);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'Updated Project',
          description: 'Updated description',
          updatedAt: expect.any(Number)
        })
      );
    });

    it('should throw ProjectServiceError on failure', async () => {
      const updateData: UpdateProjectData = {
        name: 'Updated Project'
      };

      mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(projectService.updateProject(mockProjectId, updateData))
        .rejects
        .toThrow(ProjectServiceError);
    });
  });

  describe('deleteProject', () => {
    it('should soft delete project successfully', async () => {
      const mockProject: Project = {
        id: mockProjectId,
        name: 'Test Project',
        ownerId: mockUserId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isArchived: false
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.deleteProject(mockProjectId, mockUserId);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Number),
          deletedBy: mockUserId
        })
      );
    });

    it('should throw error when project not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(projectService.deleteProject(mockProjectId, mockUserId))
        .rejects
        .toThrow('Project not found');
    });

    it('should throw error when user is not owner', async () => {
      const mockProject: Project = {
        id: mockProjectId,
        name: 'Test Project',
        ownerId: 'other-user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isArchived: false
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject
      });

      await expect(projectService.deleteProject(mockProjectId, mockUserId))
        .rejects
        .toThrow('Only project owner can delete the project');
    });
  });

  describe('archiveProject', () => {
    it('should archive project successfully', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.archiveProject(mockProjectId, mockUserId);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          isArchived: true,
          archivedAt: expect.any(Number),
          archivedBy: mockUserId
        })
      );
    });

    it('should throw ProjectServiceError on failure', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(projectService.archiveProject(mockProjectId, mockUserId))
        .rejects
        .toThrow(ProjectServiceError);
    });
  });

  describe('unarchiveProject', () => {
    it('should unarchive project successfully', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.unarchiveProject(mockProjectId, mockUserId);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          isArchived: false,
          unarchivedAt: expect.any(Number),
          unarchivedBy: mockUserId
        })
      );
    });
  });

  describe('getUserProjects', () => {
    it('should return user projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project1',
          name: 'Project 1',
          ownerId: mockUserId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false
        },
        {
          id: 'project2',
          name: 'Project 2',
          ownerId: mockUserId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false
        }
      ];

      const mockSnapshot = {
        docs: mockProjects.map(project => ({
          id: project.id,
          data: () => project
        }))
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await projectService.getUserProjects(mockUserId);

      expect(result.projects).toHaveLength(2);
      expect(result.projects[0]).toMatchObject(mockProjects[0]);
      expect(result.projects[1]).toMatchObject(mockProjects[1]);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination correctly', async () => {
      const mockProjects = Array.from({ length: 20 }, (_, i) => ({
        id: `project${i}`,
        name: `Project ${i}`,
        ownerId: mockUserId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isArchived: false
      }));

      const mockSnapshot = {
        docs: mockProjects.map(project => ({
          id: project.id,
          data: () => project
        }))
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await projectService.getUserProjects(mockUserId, { limit: 20 });

      expect(result.projects).toHaveLength(20);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('searchProjects', () => {
    it('should search projects by name successfully', async () => {
      const mockProjects = [
        {
          id: 'project1',
          name: 'Design Project',
          ownerId: mockUserId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false
        }
      ];

      const mockSnapshot = {
        docs: mockProjects.map(project => ({
          id: project.id,
          data: () => project
        }))
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await projectService.searchProjects(mockUserId, 'Design');

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('Design Project');
    });
  });

  describe('addProjectMember', () => {
    it('should add project member successfully', async () => {
      const member: ProjectMember = {
        userId: 'member123',
        projectId: mockProjectId,
        role: 'editor' as ProjectRole,
        joinedAt: Date.now(),
        lastActiveAt: Date.now()
      };

      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({ exists: () => false });

      await projectService.addProjectMember(mockProjectId, member);

      expect(mockUpdateDoc).toHaveBeenCalledTimes(2); // Member and userProjects
    });
  });

  describe('updateProjectMember', () => {
    it('should update project member successfully', async () => {
      const existingMember: ProjectMember = {
        userId: 'member123',
        projectId: mockProjectId,
        role: 'editor' as ProjectRole,
        joinedAt: Date.now(),
        lastActiveAt: Date.now()
      };

      const updates = {
        role: 'admin' as ProjectRole
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingMember
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.updateProjectMember(mockProjectId, 'member123', updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          role: 'admin',
          updatedAt: expect.any(Number)
        })
      );
    });

    it('should throw error when member not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(
        projectService.updateProjectMember(mockProjectId, 'member123', { role: 'admin' })
      ).rejects.toThrow('Member not found');
    });
  });

  describe('removeProjectMember', () => {
    it('should remove project member successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ projects: {} }) });

      await projectService.removeProjectMember(mockProjectId, 'member123');

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('getProjectMembers', () => {
    it('should return project members successfully', async () => {
      const mockMembers = [
        {
          userId: 'member1',
          projectId: mockProjectId,
          role: 'owner' as ProjectRole,
          joinedAt: Date.now(),
          lastActiveAt: Date.now()
        },
        {
          userId: 'member2',
          projectId: mockProjectId,
          role: 'editor' as ProjectRole,
          joinedAt: Date.now(),
          lastActiveAt: Date.now()
        }
      ];

      const mockSnapshot = {
        docs: mockMembers.map(member => ({
          data: () => member
        }))
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await projectService.getProjectMembers(mockProjectId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject(mockMembers[0]);
      expect(result[1]).toMatchObject(mockMembers[1]);
    });
  });

  describe('addProjectCanvas', () => {
    it('should add project canvas successfully', async () => {
      const canvas: ProjectCanvas = {
        id: mockCanvasId,
        projectId: mockProjectId,
        name: 'Test Canvas',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: mockUserId,
        isArchived: false,
        order: 0
      };

      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.addProjectCanvas(mockProjectId, canvas);

      expect(mockUpdateDoc).toHaveBeenCalledTimes(2); // Canvas and activity
    });
  });

  describe('updateProjectCanvas', () => {
    it('should update project canvas successfully', async () => {
      const existingCanvas: ProjectCanvas = {
        id: mockCanvasId,
        projectId: mockProjectId,
        name: 'Test Canvas',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: mockUserId,
        isArchived: false,
        order: 0
      };

      const updates = {
        name: 'Updated Canvas'
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingCanvas
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.updateProjectCanvas(mockProjectId, mockCanvasId, updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'Updated Canvas',
          updatedAt: expect.any(Number)
        })
      );
    });

    it('should throw error when canvas not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(
        projectService.updateProjectCanvas(mockProjectId, mockCanvasId, { name: 'Updated' })
      ).rejects.toThrow('Canvas not found');
    });
  });

  describe('removeProjectCanvas', () => {
    it('should remove project canvas successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);

      await projectService.removeProjectCanvas(mockProjectId, mockCanvasId);

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.any(Object));
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1); // Activity
    });
  });

  describe('getProjectCanvases', () => {
    it('should return project canvases successfully', async () => {
      const mockCanvases = [
        {
          id: 'canvas1',
          projectId: mockProjectId,
          name: 'Canvas 1',
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: mockUserId,
          isArchived: false,
          order: 0
        }
      ];

      const mockSnapshot = {
        docs: mockCanvases.map(canvas => ({
          id: canvas.id,
          data: () => canvas
        }))
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await projectService.getProjectCanvases(mockProjectId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockCanvases[0]);
    });
  });

  describe('getProjectActivities', () => {
    it('should return project activities successfully', async () => {
      const mockActivities = [
        {
          id: 'activity1',
          projectId: mockProjectId,
          userId: mockUserId,
          action: 'project_created',
          targetType: 'project',
          targetId: mockProjectId,
          targetName: 'Test Project',
          createdAt: Date.now()
        }
      ];

      const mockSnapshot = {
        docs: mockActivities.map(activity => ({
          id: activity.id,
          data: () => activity
        }))
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await projectService.getProjectActivities(mockProjectId);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0]).toMatchObject(mockActivities[0]);
    });
  });

  describe('Error Handling', () => {
    it('should wrap Firebase errors in ProjectServiceError', async () => {
      const firebaseError = new Error('Firebase connection failed');
      mockGetDoc.mockRejectedValue(firebaseError);

      try {
        await projectService.getProject(mockProjectId);
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectServiceError);
        expect(error.message).toBe('Failed to get project');
        expect(error.code).toBe('GET_PROJECT_FAILED');
        expect(error.originalError).toBe(firebaseError);
      }
    });

    it('should handle non-Error objects', async () => {
      mockGetDoc.mockRejectedValue('String error');

      try {
        await projectService.getProject(mockProjectId);
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectServiceError);
        expect(error.originalError).toBeInstanceOf(Error);
        expect(error.originalError.message).toBe('String error');
      }
    });
  });
});
