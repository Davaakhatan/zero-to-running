// Project-related TypeScript interfaces for multi-project system

export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string; // URL or base64 data
  ownerId: string; // User ID of the project owner
  createdAt: number;
  updatedAt: number;
  isArchived: boolean;
  isDeleted?: boolean;
  settings: ProjectSettings;
  members?: ProjectMember[];
  canvases?: ProjectCanvas[];
  metadata?: ProjectMetadata;
}

export interface ProjectSettings {
  allowComments: boolean;
  allowViewing: boolean;
  allowDownloads: boolean;
  isPublic: boolean;
  defaultCanvasWidth: number;
  defaultCanvasHeight: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface ProjectMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: ProjectRole;
  status: 'active' | 'pending' | 'inactive';
  joinedAt: number;
  lastActiveAt?: number;
  isOnline: boolean;
  permissions?: string[];
}

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  email: string;
  role: ProjectRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  declinedAt?: number;
  cancelledAt?: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface ProjectCanvas {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  width: number;
  height: number;
  backgroundColor: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string; // User ID
  isArchived: boolean;
  order: number; // For canvas ordering within a project
  shapeCount?: number;
  size?: number;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: ProjectActivityAction;
  targetType: 'project' | 'canvas' | 'member' | 'comment';
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  timestamp: number;
}

export type ProjectActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_archived'
  | 'project_unarchived'
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'invited'
  | 'joined'
  | 'left'
  | 'canvas_created'
  | 'canvas_updated'
  | 'canvas_deleted'
  | 'canvas_duplicated';

export interface ProjectSearchFilters {
  query?: string;
  role?: ProjectRole;
  isArchived?: boolean;
  sortBy?: 'name' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalCanvases: number;
  totalMembers: number;
  recentActivity: ProjectActivity[];
}

// Firebase collection paths
export const PROJECT_COLLECTIONS = {
  PROJECTS: "projects",
  MEMBERS: "members",
  CANVASES: "canvases",
  INVITATIONS: "invitations",
  ACTIVITIES: "activities",
  METADATA: "metadata"
} as const;

// Permission levels for role-based access
export const PROJECT_PERMISSIONS = {
  owner: ["read", "write", "delete", "manage_members", "manage_settings", "transfer_ownership"],
  admin: ["read", "write", "delete", "manage_members", "manage_settings"],
  editor: ["read", "write"],
  viewer: ["read"]
} as const;

export type ProjectPermission = typeof PROJECT_PERMISSIONS[keyof typeof PROJECT_PERMISSIONS][number];

// Permission type for general permission checking
export type Permission = 
  | 'project.read'
  | 'project.write'
  | 'project.delete'
  | 'project.edit'
  | 'members.invite'
  | 'members.edit'
  | 'members.transfer_ownership'
  | 'ai.assistant'
  | 'export.canvas'
  | 'canvas.read'
  | 'canvas.write'
  | 'canvas.delete'
  | 'canvas.edit';

// Presence and activity types
export interface PresenceData {
  userId: string;
  isOnline: boolean;
  lastSeen: number;
  currentActivity?: ActivityType;
  cursorPosition?: {
    x: number;
    y: number;
  };
  selectedShapeIds?: string[];
}

export type ActivityType = 
  | 'idle'
  | 'viewing'
  | 'editing'
  | 'selecting'
  | 'drawing'
  | 'typing'
  | 'navigating'
  | 'collaborating'
  | 'chatting'
  | 'presenting'
  | 'away';

// Utility types
export type ProjectWithMembers = Project & {
  members: ProjectMember[];
  memberCount: number;
};

export type ProjectWithCanvases = Project & {
  canvases: ProjectCanvas[];
  canvasCount: number;
};

export type ProjectWithDetails = Project & {
  members: ProjectMember[];
  canvases: ProjectCanvas[];
  recentActivity: ProjectActivity[];
  stats: {
    memberCount: number;
    canvasCount: number;
    lastActivityAt: Date;
  };
};

// Form types for creating/updating projects
export interface CreateProjectData {
  name: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
  color?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  thumbnail?: string;
  settings?: Partial<ProjectSettings>;
  isArchived?: boolean;
  isDeleted?: boolean;
  members?: ProjectMember[];
  updatedBy?: string;
}

export interface InviteMemberData {
  email: string;
  role: ProjectRole;
  message?: string;
}

export interface TransferRequest {
  id: string;
  projectId: string;
  newOwnerId: string;
  newOwnerEmail: string;
  requesterId: string;
  fromUserName: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  cancelledAt?: Date;
  message?: string;
  metadata?: Record<string, any>;
}

export interface ProjectMetadata {
  tags?: string[];
  color?: string;
  lastAccessed?: Date;
  [key: string]: any;
}

export interface ThumbnailResult {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface FormErrors {
  [key: string]: string;
}

export interface ProjectTransfer {
  id: string;
  projectId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}