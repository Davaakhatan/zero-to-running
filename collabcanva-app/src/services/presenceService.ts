// PresenceService for real-time member presence and activity tracking
// Handles online status, activity indicators, and presence synchronization

import { 
  ref, 
  onValue, 
  off, 
  set, 
  remove, 
  push, 
  serverTimestamp,
  onDisconnect,
  getDatabase
} from 'firebase/database';
import { rtdb } from './firebase';

// Presence types
export interface PresenceData {
  userId: string;
  userEmail: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: number;
  currentActivity: ActivityType;
  currentCanvas?: string;
  currentProject?: string;
  cursorPosition?: {
    x: number;
    y: number;
  };
  selectedShapes?: string[];
  isTyping?: boolean;
  typingIn?: string; // canvas ID or chat ID
  connectionId: string;
  metadata: {
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
  | 'chatting'
  | 'presenting'
  | 'away';

// Presence configuration
const PRESENCE_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  OFFLINE_TIMEOUT: 60000, // 1 minute
  TYPING_TIMEOUT: 3000, // 3 seconds
  CURSOR_UPDATE_INTERVAL: 100, // 100ms for smooth cursor movement
  MAX_PRESENCE_HISTORY: 100,
  CLEANUP_INTERVAL: 300000, // 5 minutes
  ACTIVITY_DEBOUNCE: 2000 // 2 seconds
};

// Presence service class
export class PresenceService {
  private static instance: PresenceService;
  private presenceRef: any;
  private userPresenceRef: any;
  private projectPresenceRef: any;
  private canvasPresenceRef: any;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;
  private cursorUpdateInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private currentUser: any = null;
  private currentProject: string | null = null;
  private currentCanvas: string | null = null;
  private listeners: Map<string, (data: any) => void> = new Map();
  private isConnected = false;
  private lastActivity = Date.now();
  private activityDebounceTimeout: NodeJS.Timeout | null = null;

  // Singleton pattern
  static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  private constructor() {
    this.initializeConnection();
  }

  // Check if Realtime Database is available
  private isDatabaseAvailable(): boolean {
    return rtdb !== null;
  }

  // Initialize Firebase connection monitoring
  private initializeConnection(): void {
    if (!rtdb) {
      console.warn('Realtime Database not available. Presence features will be disabled.');
      return;
    }
    
    const connectedRef = ref(rtdb, '.info/connected');
    
    onValue(connectedRef, (snapshot) => {
      this.isConnected = snapshot.val();
      
      if (this.isConnected && this.currentUser) {
        this.setOnline();
        this.startHeartbeat();
      } else {
        this.setOffline();
        this.stopHeartbeat();
      }
    });
  }

  // Set user online status
  async setOnline(): Promise<void> {
    if (!this.currentUser) return;
    
    if (!this.isDatabaseAvailable()) {
      console.warn('Realtime Database not available. Cannot set online status.');
      return;
    }

    const presenceData: PresenceData = {
      userId: this.currentUser.uid,
      userEmail: this.currentUser.email || '',
      displayName: this.currentUser.displayName || this.currentUser.email || 'Unknown',
      avatar: this.currentUser.photoURL || null,
      isOnline: true,
      lastSeen: Date.now(),
      currentActivity: 'viewing',
      currentCanvas: this.currentCanvas || null,
      currentProject: this.currentProject || null,
      connectionId: this.generateConnectionId(),
      metadata: this.getUserMetadata()
    };

    try {
      // Set global presence
      this.presenceRef = ref(rtdb, `presence/${this.currentUser.uid}`);
      await set(this.presenceRef, presenceData);

      // Set project presence if in a project
      if (this.currentProject) {
        this.projectPresenceRef = ref(rtdb, `projects/${this.currentProject}/presence/${this.currentUser.uid}`);
        await set(this.projectPresenceRef, presenceData);
      }

      // Set canvas presence if on a canvas
      if (this.currentCanvas) {
        this.canvasPresenceRef = ref(rtdb, `projects/${this.currentProject}/canvases/${this.currentCanvas}/presence/${this.currentUser.uid}`);
        await set(this.canvasPresenceRef, presenceData);
      }

      // Set up disconnect handler
      if (this.presenceRef) {
        onDisconnect(this.presenceRef).remove();
      }
      if (this.projectPresenceRef) {
        onDisconnect(this.projectPresenceRef).remove();
      }
      if (this.canvasPresenceRef) {
        onDisconnect(this.canvasPresenceRef).remove();
      }

    } catch (error) {
      console.error('Failed to set online status:', error);
    }
  }

  // Set user offline status
  async setOffline(): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Update last seen timestamp
      const offlineData = {
        isOnline: false,
        lastSeen: Date.now(),
        currentActivity: 'idle'
      };

      if (this.presenceRef) {
        await set(this.presenceRef, offlineData);
      }
      if (this.projectPresenceRef) {
        await set(this.projectPresenceRef, offlineData);
      }
      if (this.canvasPresenceRef) {
        await set(this.canvasPresenceRef, offlineData);
      }

    } catch (error) {
      console.error('Failed to set offline status:', error);
    }
  }

  // Start heartbeat to maintain online status
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentUser && this.isConnected) {
        await this.updateLastSeen();
      }
    }, PRESENCE_CONFIG.HEARTBEAT_INTERVAL);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Update last seen timestamp
  private async updateLastSeen(): Promise<void> {
    if (!this.currentUser) return;

    const updateData = {
      lastSeen: Date.now(),
      currentActivity: this.getCurrentActivity()
    };

    try {
      if (this.presenceRef) {
        await set(this.presenceRef, updateData);
      }
      if (this.projectPresenceRef) {
        await set(this.projectPresenceRef, updateData);
      }
      if (this.canvasPresenceRef) {
        await set(this.canvasPresenceRef, updateData);
      }
    } catch (error) {
      console.error('Failed to update last seen:', error);
    }
  }

  // Update current activity
  async updateActivity(activity: ActivityType, metadata?: any): Promise<void> {
    if (!this.currentUser) return;

    // Debounce activity updates
    if (this.activityDebounceTimeout) {
      clearTimeout(this.activityDebounceTimeout);
    }

    this.activityDebounceTimeout = setTimeout(async () => {
      const updateData = {
        currentActivity: activity,
        lastSeen: Date.now(),
        ...metadata
      };

      try {
        if (this.presenceRef) {
          await set(this.presenceRef, updateData);
        }
        if (this.projectPresenceRef) {
          await set(this.projectPresenceRef, updateData);
        }
        if (this.canvasPresenceRef) {
          await set(this.canvasPresenceRef, updateData);
        }
      } catch (error) {
        console.error('Failed to update activity:', error);
      }
    }, PRESENCE_CONFIG.ACTIVITY_DEBOUNCE);
  }

  // Update cursor position
  async updateCursorPosition(x: number, y: number): Promise<void> {
    if (!this.currentUser) return;

    const updateData = {
      cursorPosition: { x, y },
      lastSeen: Date.now(),
      currentActivity: 'editing'
    };

    try {
      if (this.canvasPresenceRef) {
        await set(this.canvasPresenceRef, updateData);
      }
    } catch (error) {
      console.error('Failed to update cursor position:', error);
    }
  }

  // Update selected shapes
  async updateSelectedShapes(shapeIds: string[]): Promise<void> {
    if (!this.currentUser) return;

    const updateData = {
      selectedShapes: shapeIds,
      lastSeen: Date.now(),
      currentActivity: 'editing'
    };

    try {
      if (this.canvasPresenceRef) {
        await set(this.canvasPresenceRef, updateData);
      }
    } catch (error) {
      console.error('Failed to update selected shapes:', error);
    }
  }

  // Set typing status
  async setTyping(isTyping: boolean, context?: string): Promise<void> {
    if (!this.currentUser) return;

    // Clear existing typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    const updateData = {
      isTyping,
      typingIn: isTyping ? context : undefined,
      lastSeen: Date.now(),
      currentActivity: isTyping ? 'chatting' : 'viewing'
    };

    try {
      if (this.presenceRef) {
        await set(this.presenceRef, updateData);
      }
      if (this.projectPresenceRef) {
        await set(this.projectPresenceRef, updateData);
      }
      if (this.canvasPresenceRef) {
        await set(this.canvasPresenceRef, updateData);
      }

      // Auto-clear typing status after timeout
      if (isTyping) {
        this.typingTimeout = setTimeout(() => {
          this.setTyping(false);
        }, PRESENCE_CONFIG.TYPING_TIMEOUT);
      }
    } catch (error) {
      console.error('Failed to set typing status:', error);
    }
  }

  // Switch project context
  async switchProject(projectId: string): Promise<void> {
    if (this.currentProject === projectId) return;

    // Remove from old project presence
    if (this.currentProject && this.projectPresenceRef) {
      await remove(this.projectPresenceRef);
    }

    this.currentProject = projectId;
    await this.setOnline();
  }

  // Switch canvas context
  async switchCanvas(canvasId: string): Promise<void> {
    if (this.currentCanvas === canvasId) return;

    // Remove from old canvas presence
    if (this.currentCanvas && this.canvasPresenceRef) {
      await remove(this.canvasPresenceRef);
    }

    this.currentCanvas = canvasId;
    await this.setOnline();
  }

  // Listen to project presence
  listenToProjectPresence(projectId: string, callback: (presence: PresenceData[]) => void): () => void {
    if (!this.isDatabaseAvailable()) {
      console.warn('Realtime Database not available. Cannot listen to project presence.');
      return () => {}; // Return empty cleanup function
    }
    
    const projectPresenceRef = ref(rtdb, `projects/${projectId}/presence`);
    
    const listener = onValue(projectPresenceRef, (snapshot) => {
      const presenceData = snapshot.val();
      const presenceList: PresenceData[] = [];
      
      if (presenceData) {
        Object.values(presenceData).forEach((presence: any) => {
          if (presence.userId !== this.currentUser?.uid) {
            presenceList.push(presence);
          }
        });
      }
      
      callback(presenceList);
    });

    // Store listener for cleanup
    const listenerId = `project_${projectId}`;
    this.listeners.set(listenerId, listener);

    // Return cleanup function
    return () => {
      off(projectPresenceRef, 'value', listener);
      this.listeners.delete(listenerId);
    };
  }

  // Listen to canvas presence
  listenToCanvasPresence(projectId: string, canvasId: string, callback: (presence: PresenceData[]) => void): () => void {
    if (!this.isDatabaseAvailable()) {
      console.warn('Realtime Database not available. Cannot listen to canvas presence.');
      return () => {}; // Return empty cleanup function
    }
    
    const canvasPresenceRef = ref(rtdb, `projects/${projectId}/canvases/${canvasId}/presence`);
    
    const listener = onValue(canvasPresenceRef, (snapshot) => {
      const presenceData = snapshot.val();
      const presenceList: PresenceData[] = [];
      
      if (presenceData) {
        Object.values(presenceData).forEach((presence: any) => {
          if (presence.userId !== this.currentUser?.uid) {
            presenceList.push(presence);
          }
        });
      }
      
      callback(presenceList);
    });

    // Store listener for cleanup
    const listenerId = `canvas_${projectId}_${canvasId}`;
    this.listeners.set(listenerId, listener);

    // Return cleanup function
    return () => {
      off(canvasPresenceRef, 'value', listener);
      this.listeners.delete(listenerId);
    };
  }

  // Get user metadata
  private getUserMetadata(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      browser: this.getBrowserName(),
      version: this.getBrowserVersion()
    };
  }

  // Get browser name
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  // Get browser version
  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    
    // Simple version extraction
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/);
    return match ? match[2] : 'Unknown';
  }

  // Generate unique connection ID
  private generateConnectionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current activity based on user behavior
  private getCurrentActivity(): ActivityType {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    if (timeSinceLastActivity > 300000) { // 5 minutes
      return 'away';
    }
    
    return 'viewing';
  }

  // Track user activity
  trackActivity(): void {
    this.lastActivity = Date.now();
  }

  // Initialize presence for user
  async initializePresence(user: any): Promise<void> {
    this.currentUser = user;
    await this.setOnline();
    this.startHeartbeat();
    this.startCleanup();
  }

  // Start cleanup process
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOfflineUsers();
    }, PRESENCE_CONFIG.CLEANUP_INTERVAL);
  }

  // Cleanup offline users
  private async cleanupOfflineUsers(): Promise<void> {
    // This would typically be done server-side
    // For now, we'll just log the cleanup
    console.log('Cleaning up offline users...');
  }

  // Cleanup all listeners and intervals
  cleanup(): void {
    this.stopHeartbeat();
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    if (this.cursorUpdateInterval) {
      clearInterval(this.cursorUpdateInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.activityDebounceTimeout) {
      clearTimeout(this.activityDebounceTimeout);
    }
    
    // Remove all listeners
    this.listeners.forEach((listener) => {
      listener(null);
    });
    this.listeners.clear();
    
    // Set offline
    this.setOffline();
  }

  // Get current user presence
  getCurrentUser(): any {
    return this.currentUser;
  }

  // Get current project
  getCurrentProject(): string | null {
    return this.currentProject;
  }

  // Get current canvas
  getCurrentCanvas(): string | null {
    return this.currentCanvas;
  }

  // Check if user is online
  isUserOnline(): boolean {
    return this.isConnected && this.currentUser !== null;
  }
}

// Export singleton instance
export const presenceService = PresenceService.getInstance();

// Utility functions
export const getActivityDisplayName = (activity: ActivityType): string => {
  const activityNames: Record<ActivityType, string> = {
    idle: 'Idle',
    viewing: 'Viewing',
    editing: 'Editing',
    collaborating: 'Collaborating',
    chatting: 'Chatting',
    presenting: 'Presenting',
    away: 'Away'
  };
  
  return activityNames[activity] || 'Unknown';
};

export const getActivityColor = (activity: ActivityType): string => {
  const activityColors: Record<ActivityType, string> = {
    idle: 'gray',
    viewing: 'blue',
    editing: 'green',
    collaborating: 'purple',
    chatting: 'orange',
    presenting: 'red',
    away: 'gray'
  };
  
  return activityColors[activity] || 'gray';
};

export const getActivityIcon = (activity: ActivityType): string => {
  const activityIcons: Record<ActivityType, string> = {
    idle: '⏸️',
    viewing: '👁️',
    editing: '✏️',
    collaborating: '🤝',
    chatting: '💬',
    presenting: '📺',
    away: '😴'
  };
  
  return activityIcons[activity] || '❓';
};

export const formatLastSeen = (lastSeen: number): string => {
  const now = Date.now();
  const diff = now - lastSeen;
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now';
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

export const isUserRecentlyActive = (lastSeen: number, threshold: number = 300000): boolean => {
  return Date.now() - lastSeen < threshold;
};

export default presenceService;
