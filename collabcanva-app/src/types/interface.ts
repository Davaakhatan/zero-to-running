// Interface-related type definitions

export interface BaseInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isDeleted: boolean;
}

export interface UserInterface extends BaseInterface {
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  isOnline: boolean;
  preferences?: Record<string, any>;
}

export interface ProjectInterface extends BaseInterface {
  name: string;
  description?: string;
  thumbnail?: string;
  ownerId: string;
  settings: Record<string, any>;
  members?: string[];
  canvases?: string[];
}

export interface CanvasInterface extends BaseInterface {
  projectId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  width: number;
  height: number;
  backgroundColor: string;
  createdBy: string;
  isArchived: boolean;
  order: number;
}

export interface ShapeInterface extends BaseInterface {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  fill: string;
  zIndex?: number;
  createdBy?: string;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null;
}
