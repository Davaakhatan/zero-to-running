// Presence-related type definitions

export interface PresenceData {
  userId: string;
  userName: string;
  displayName?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: number;
  activity: ActivityType;
  currentActivity?: ActivityType; // For compatibility
  selectedShapeIds?: string[];
  selectedShapes?: string[];
  isTyping?: boolean;
  cursorPosition?: {
    x: number;
    y: number;
  };
  cursorColor?: string;
  // Additional properties for compatibility
  userEmail?: string;
  currentCanvas?: string;
  currentProject?: string;
  connectionId?: string;
  metadata?: {
    userAgent: string;
    platform: string;
    browser: string;
    version: string;
  };
}

export type ActivityType = 
  | 'idle'
  | 'viewing'
  | 'editing'
  | 'collaborating'
  | 'away';

export interface PresenceUpdate {
  userId: string;
  activity: ActivityType;
  selectedShapeIds?: string[];
  cursorPosition?: {
    x: number;
    y: number;
  };
  isTyping?: boolean;
}

export interface PresenceState {
  users: Map<string, PresenceData>;
  currentUser: PresenceData | null;
  isConnected: boolean;
}
