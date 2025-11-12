// Firebase collection structure design for multi-project system
// This file documents the Firebase data organization and provides helper functions

import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  ProjectInvitation, 
  ProjectActivity,
  PROJECT_COLLECTIONS 
} from '../types';

// Firebase collection structure documentation
export const FIREBASE_STRUCTURE = {
  // Main projects collection
  projects: {
    // Each project document contains metadata
    [PROJECT_COLLECTIONS.PROJECTS]: {
      // Document ID: projectId (auto-generated)
      // Document data: Project interface
      // Example: projects/project_123/metadata
      metadata: {
        id: 'project_123',
        name: 'My Design Project',
        description: 'A collaborative design project',
        thumbnail: 'https://...',
        ownerId: 'user_456',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T15:45:00Z',
        isArchived: false,
        settings: {
          allowComments: true,
          allowViewing: true,
          defaultCanvasWidth: 1920,
          defaultCanvasHeight: 1080,
          theme: 'light'
        }
      }
    },

    // Project members subcollection
    [PROJECT_COLLECTIONS.MEMBERS]: {
      // Subcollection: projects/{projectId}/members
      // Document ID: userId
      // Document data: ProjectMember interface
      // Example: projects/project_123/members/user_456
      'user_456': {
        userId: 'user_456',
        email: 'john@example.com',
        displayName: 'John Doe',
        avatar: 'https://...',
        role: 'owner',
        joinedAt: '2024-01-15T10:30:00Z',
        lastActiveAt: '2024-01-15T15:45:00Z',
        isOnline: true
      },
      'user_789': {
        userId: 'user_789',
        email: 'jane@example.com',
        displayName: 'Jane Smith',
        avatar: 'https://...',
        role: 'editor',
        joinedAt: '2024-01-15T11:00:00Z',
        lastActiveAt: '2024-01-15T14:30:00Z',
        isOnline: false
      }
    },

    // Project canvases subcollection
    [PROJECT_COLLECTIONS.CANVASES]: {
      // Subcollection: projects/{projectId}/canvases
      // Document ID: canvasId
      // Document data: ProjectCanvas interface
      // Example: projects/project_123/canvases/canvas_abc
      'canvas_abc': {
        id: 'canvas_abc',
        projectId: 'project_123',
        name: 'Main Design',
        description: 'Primary design canvas',
        thumbnail: 'https://...',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T15:45:00Z',
        createdBy: 'user_456',
        isArchived: false,
        order: 0
      },
      'canvas_def': {
        id: 'canvas_def',
        projectId: 'project_123',
        name: 'Mobile Version',
        description: 'Mobile responsive design',
        thumbnail: 'https://...',
        width: 375,
        height: 812,
        backgroundColor: '#ffffff',
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        createdBy: 'user_456',
        isArchived: false,
        order: 1
      }
    },

    // Canvas shapes subcollection (existing structure, now project-scoped)
    shapes: {
      // Subcollection: projects/{projectId}/canvases/{canvasId}/shapes
      // Document ID: shapeId
      // Document data: Shape interface (existing)
      // Example: projects/project_123/canvases/canvas_abc/shapes/shape_xyz
      'shape_xyz': {
        id: 'shape_xyz',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#3b82f6',
        stroke: '#1e40af',
        strokeWidth: 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 1,
        lockedBy: null,
        lockedAt: null,
        createdAt: '2024-01-15T10:35:00Z',
        updatedAt: '2024-01-15T15:40:00Z',
        createdBy: 'user_456'
      }
    },

    // Project invitations subcollection
    [PROJECT_COLLECTIONS.INVITATIONS]: {
      // Subcollection: projects/{projectId}/invitations
      // Document ID: invitationId
      // Document data: ProjectInvitation interface
      // Example: projects/project_123/invitations/invite_ghi
      'invite_ghi': {
        id: 'invite_ghi',
        projectId: 'project_123',
        projectName: 'My Design Project',
        inviterId: 'user_456',
        inviterName: 'John Doe',
        inviteeEmail: 'newuser@example.com',
        role: 'editor',
        status: 'pending',
        createdAt: '2024-01-15T13:00:00Z',
        expiresAt: '2024-01-22T13:00:00Z'
      }
    },

    // Project activity subcollection
    [PROJECT_COLLECTIONS.ACTIVITIES]: {
      // Subcollection: projects/{projectId}/activities
      // Document ID: activityId
      // Document data: ProjectActivity interface
      // Example: projects/project_123/activities/activity_jkl
      'activity_jkl': {
        id: 'activity_jkl',
        projectId: 'project_123',
        userId: 'user_456',
        userName: 'John Doe',
        userAvatar: 'https://...',
        action: 'canvas_created',
        targetType: 'canvas',
        targetId: 'canvas_def',
        targetName: 'Mobile Version',
        metadata: {
          canvasWidth: 375,
          canvasHeight: 812
        },
        createdAt: '2024-01-15T12:00:00Z'
      }
    }
  },

  // Global collections (not project-specific)
  global: {
    // User project memberships (for quick lookup)
    userProjects: {
      // Collection: userProjects
      // Document ID: userId
      // Document data: { projects: { projectId: { role, joinedAt } } }
      // Example: userProjects/user_456
      'user_456': {
        projects: {
          'project_123': {
            role: 'owner',
            joinedAt: '2024-01-15T10:30:00Z',
            projectName: 'My Design Project'
          },
          'project_456': {
            role: 'editor',
            joinedAt: '2024-01-10T09:15:00Z',
            projectName: 'Team Project'
          }
        }
      }
    },

    // Global invitations (for email-based lookup)
    invitations: {
      // Collection: invitations
      // Document ID: invitationId
      // Document data: ProjectInvitation interface
      // Example: invitations/invite_ghi
      'invite_ghi': {
        id: 'invite_ghi',
        projectId: 'project_123',
        projectName: 'My Design Project',
        inviterId: 'user_456',
        inviterName: 'John Doe',
        inviteeEmail: 'newuser@example.com',
        role: 'editor',
        status: 'pending',
        createdAt: '2024-01-15T13:00:00Z',
        expiresAt: '2024-01-22T13:00:00Z'
      }
    }
  }
};

// Helper functions for Firebase paths
export const getProjectPath = (projectId: string) => 
  `${PROJECT_COLLECTIONS.PROJECTS}/${projectId}`;

export const getProjectMetadataPath = (projectId: string) => 
  `${getProjectPath(projectId)}/${PROJECT_COLLECTIONS.METADATA}`;

export const getProjectMembersPath = (projectId: string) => 
  `${getProjectPath(projectId)}/${PROJECT_COLLECTIONS.MEMBERS}`;

export const getProjectMemberPath = (projectId: string, userId: string) => 
  `${getProjectMembersPath(projectId)}/${userId}`;

export const getProjectCanvasesPath = (projectId: string) => 
  `${getProjectPath(projectId)}/${PROJECT_COLLECTIONS.CANVASES}`;

export const getProjectCanvasPath = (projectId: string, canvasId: string) => 
  `${getProjectCanvasesPath(projectId)}/${canvasId}`;

export const getCanvasShapesPath = (projectId: string, canvasId: string) => 
  `${getProjectCanvasPath(projectId, canvasId)}/shapes`;

export const getCanvasShapePath = (projectId: string, canvasId: string, shapeId: string) => 
  `${getCanvasShapesPath(projectId, canvasId)}/${shapeId}`;

export const getProjectInvitationsPath = (projectId: string) => 
  `${getProjectPath(projectId)}/${PROJECT_COLLECTIONS.INVITATIONS}`;

export const getProjectInvitationPath = (projectId: string, invitationId: string) => 
  `${getProjectInvitationsPath(projectId)}/${invitationId}`;

export const getProjectActivitiesPath = (projectId: string) => 
  `${getProjectPath(projectId)}/${PROJECT_COLLECTIONS.ACTIVITIES}`;

export const getProjectActivityPath = (projectId: string, activityId: string) => 
  `${getProjectActivitiesPath(projectId)}/${activityId}`;

export const getUserProjectsPath = (userId: string) => 
  `userProjects/${userId}`;

export const getGlobalInvitationsPath = () => 
  'invitations';

export const getGlobalInvitationPath = (invitationId: string) => 
  `${getGlobalInvitationsPath()}/${invitationId}`;

// Migration helper for existing single-canvas users
export const MIGRATION_STRUCTURE = {
  // Existing structure: shapes/{shapeId}
  // New structure: projects/{projectId}/canvases/{canvasId}/shapes/{shapeId}
  
  // Migration strategy:
  // 1. Create a default project for existing users
  // 2. Create a default canvas within that project
  // 3. Move all existing shapes to the new structure
  // 4. Update user's project memberships
  
  createDefaultProject: (userId: string) => ({
    id: `default_${userId}`,
    name: 'My First Project',
    description: 'Migrated from single canvas',
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
    settings: {
      allowComments: true,
      allowViewing: true,
      defaultCanvasWidth: 1920,
      defaultCanvasHeight: 1080,
      theme: 'light'
    }
  }),

  createDefaultCanvas: (projectId: string, userId: string) => ({
    id: `canvas_${projectId}_default`,
    projectId,
    name: 'Main Canvas',
    description: 'Migrated from single canvas',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    isArchived: false,
    order: 0
  })
};

// Firebase indexes configuration (for firestore.indexes.json)
export const FIREBASE_INDEXES = {
  // Project queries
  projects: [
    {
      collectionGroup: 'projects',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'ownerId', order: 'ASCENDING' },
        { fieldPath: 'updatedAt', order: 'DESCENDING' }
      ]
    },
    {
      collectionGroup: 'projects',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'isArchived', order: 'ASCENDING' },
        { fieldPath: 'updatedAt', order: 'DESCENDING' }
      ]
    }
  ],

  // Member queries
  members: [
    {
      collectionGroup: 'members',
      queryScope: 'COLLECTION_GROUP',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'joinedAt', order: 'DESCENDING' }
      ]
    }
  ],

  // Canvas queries
  canvases: [
    {
      collectionGroup: 'canvases',
      queryScope: 'COLLECTION_GROUP',
      fields: [
        { fieldPath: 'projectId', order: 'ASCENDING' },
        { fieldPath: 'order', order: 'ASCENDING' }
      ]
    }
  ],

  // Activity queries
  activities: [
    {
      collectionGroup: 'activities',
      queryScope: 'COLLECTION_GROUP',
      fields: [
        { fieldPath: 'projectId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    }
  ],

  // Invitation queries
  invitations: [
    {
      collectionGroup: 'invitations',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'inviteeEmail', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    }
  ]
};
