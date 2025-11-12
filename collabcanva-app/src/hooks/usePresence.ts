// usePresence hook for real-time member presence and activity tracking
// React hook for managing user presence and online status

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  presenceService, 
  getActivityDisplayName,
  getActivityColor,
  getActivityIcon,
  formatLastSeen,
  isUserRecentlyActive
} from '../services/presenceService';
import { ActivityType, PresenceData } from '../services/presenceService';

// Hook props
interface UsePresenceProps {
  projectId?: string;
  canvasId?: string;
  enabled?: boolean;
}

// Presence management functions
interface UsePresenceReturn {
  // Current user presence
  currentUser: any;
  isOnline: boolean;
  currentActivity: ActivityType;
  lastSeen: number;
  
  // Project presence
  projectPresence: PresenceData[];
  projectOnlineCount: number;
  projectActiveCount: number;
  
  // Canvas presence
  canvasPresence: PresenceData[];
  canvasOnlineCount: number;
  canvasActiveCount: number;
  
  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  
  // Error states
  error: string | null;
  
  // Presence management
  updateActivity: (activity: ActivityType, metadata?: any) => Promise<void>;
  updateCursorPosition: (x: number, y: number) => Promise<void>;
  updateSelectedShapes: (shapeIds: string[]) => Promise<void>;
  setTyping: (isTyping: boolean, context?: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  switchCanvas: (canvasId: string) => Promise<void>;
  
  // Utility functions
  getActivityDisplayName: (activity: ActivityType) => string;
  getActivityColor: (activity: ActivityType) => string;
  getActivityIcon: (activity: ActivityType) => string;
  formatLastSeen: (lastSeen: number) => string;
  isUserRecentlyActive: (lastSeen: number, threshold?: number) => boolean;
  
  // Statistics
  getPresenceStats: () => {
    total: number;
    online: number;
    active: number;
    byActivity: Record<ActivityType, number>;
  };
  
  // Actions
  initializePresence: () => Promise<void>;
  cleanup: () => void;
  trackActivity: () => void;
}

// Main usePresence hook
export const usePresence = ({ 
  projectId, 
  canvasId, 
  enabled = true 
}: UsePresenceProps): UsePresenceReturn => {
  const { user } = useAuth();
  
  // State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityType>('viewing');
  const [lastSeen, setLastSeen] = useState(Date.now());
  
  const [projectPresence, setProjectPresence] = useState<PresenceData[]>([]);
  const [canvasPresence, setCanvasPresence] = useState<PresenceData[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup
  const projectCleanupRef = useRef<(() => void) | null>(null);
  const canvasCleanupRef = useRef<(() => void) | null>(null);
  const activityTrackerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize presence
  const initializePresence = useCallback(async () => {
    if (!user || !enabled) return;
    
    try {
      setIsInitializing(true);
      setError(null);
      
      await presenceService.initializePresence(user);
      setCurrentUser(user);
      setIsOnline(true);
      
      // Switch to project if provided
      if (projectId) {
        await presenceService.switchProject(projectId);
      }
      
      // Switch to canvas if provided
      if (canvasId) {
        await presenceService.switchCanvas(canvasId);
      }
      
    } catch (err) {
      console.error('Failed to initialize presence:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize presence');
    } finally {
      setIsInitializing(false);
    }
  }, [user, enabled, projectId, canvasId]);

  // Update activity
  const updateActivity = useCallback(async (activity: ActivityType, metadata?: any) => {
    if (!user) return;
    
    try {
      await presenceService.updateActivity(activity, metadata);
      setCurrentActivity(activity);
      setLastSeen(Date.now());
    } catch (err) {
      console.error('Failed to update activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update activity');
    }
  }, [user]);

  // Update cursor position
  const updateCursorPosition = useCallback(async (x: number, y: number) => {
    if (!user) return;
    
    try {
      await presenceService.updateCursorPosition(x, y);
      setLastSeen(Date.now());
    } catch (err) {
      console.error('Failed to update cursor position:', err);
    }
  }, [user]);

  // Update selected shapes
  const updateSelectedShapes = useCallback(async (shapeIds: string[]) => {
    if (!user) return;
    
    try {
      await presenceService.updateSelectedShapes(shapeIds);
      setLastSeen(Date.now());
    } catch (err) {
      console.error('Failed to update selected shapes:', err);
    }
  }, [user]);

  // Set typing status
  const setTyping = useCallback(async (isTyping: boolean, context?: string) => {
    if (!user) return;
    
    try {
      await presenceService.setTyping(isTyping, context);
      setLastSeen(Date.now());
    } catch (err) {
      console.error('Failed to set typing status:', err);
    }
  }, [user]);

  // Switch project
  const switchProject = useCallback(async (newProjectId: string) => {
    if (!user) return;
    
    try {
      await presenceService.switchProject(newProjectId);
      setLastSeen(Date.now());
    } catch (err) {
      console.error('Failed to switch project:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch project');
    }
  }, [user]);

  // Switch canvas
  const switchCanvas = useCallback(async (newCanvasId: string) => {
    if (!user) return;
    
    try {
      await presenceService.switchCanvas(newCanvasId);
      setLastSeen(Date.now());
    } catch (err) {
      console.error('Failed to switch canvas:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch canvas');
    }
  }, [user]);

  // Track user activity
  const trackActivity = useCallback(() => {
    presenceService.trackActivity();
    setLastSeen(Date.now());
  }, []);

  // Get presence statistics
  const getPresenceStats = useCallback(() => {
    const allPresence = [...projectPresence, ...canvasPresence];
    const uniqueUsers = new Map<string, PresenceData>();
    
    // Deduplicate users
    allPresence.forEach(presence => {
      if (!uniqueUsers.has(presence.userId)) {
        uniqueUsers.set(presence.userId, presence);
      }
    });
    
    const users = Array.from(uniqueUsers.values());
    const online = users.filter(user => user.isOnline).length;
    const active = users.filter(user => isUserRecentlyActive(user.lastSeen)).length;
    
    const byActivity: Record<ActivityType, number> = {
      idle: 0,
      viewing: 0,
      editing: 0,
      collaborating: 0,
      chatting: 0,
      presenting: 0,
      away: 0
    };
    
    users.forEach(user => {
      byActivity[user.currentActivity]++;
    });
    
    return {
      total: users.length,
      online,
      active,
      byActivity
    };
  }, [projectPresence, canvasPresence]);

  // Setup project presence listener
  useEffect(() => {
    if (!projectId || !enabled) return;
    
    // Cleanup previous listener
    if (projectCleanupRef.current) {
      projectCleanupRef.current();
    }
    
    // Setup new listener
    projectCleanupRef.current = presenceService.listenToProjectPresence(
      projectId,
      (presence) => {
        setProjectPresence(presence);
      }
    );
    
    return () => {
      if (projectCleanupRef.current) {
        projectCleanupRef.current();
        projectCleanupRef.current = null;
      }
    };
  }, [projectId, enabled]);

  // Setup canvas presence listener
  useEffect(() => {
    if (!projectId || !canvasId || !enabled) return;
    
    // Cleanup previous listener
    if (canvasCleanupRef.current) {
      canvasCleanupRef.current();
    }
    
    // Setup new listener
    canvasCleanupRef.current = presenceService.listenToCanvasPresence(
      projectId,
      canvasId,
      (presence) => {
        setCanvasPresence(presence);
      }
    );
    
    return () => {
      if (canvasCleanupRef.current) {
        canvasCleanupRef.current();
        canvasCleanupRef.current = null;
      }
    };
  }, [projectId, canvasId, enabled]);

  // Initialize presence on mount
  useEffect(() => {
    if (user && enabled) {
      initializePresence();
    }
    
    return () => {
      if (projectCleanupRef.current) {
        projectCleanupRef.current();
      }
      if (canvasCleanupRef.current) {
        canvasCleanupRef.current();
      }
      if (activityTrackerRef.current) {
        clearInterval(activityTrackerRef.current);
      }
    };
  }, [user, enabled, initializePresence]);

  // Setup activity tracking
  useEffect(() => {
    if (!enabled) return;
    
    const trackActivity = () => {
      presenceService.trackActivity();
      setLastSeen(Date.now());
    };
    
    // Track activity on user interactions
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [enabled]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (projectCleanupRef.current) {
      projectCleanupRef.current();
      projectCleanupRef.current = null;
    }
    if (canvasCleanupRef.current) {
      canvasCleanupRef.current();
      canvasCleanupRef.current = null;
    }
    if (activityTrackerRef.current) {
      clearInterval(activityTrackerRef.current);
      activityTrackerRef.current = null;
    }
    
    presenceService.cleanup();
    setCurrentUser(null);
    setIsOnline(false);
    setProjectPresence([]);
    setCanvasPresence([]);
  }, []);

  // Computed values
  const projectOnlineCount = projectPresence.filter(p => p.isOnline).length;
  const projectActiveCount = projectPresence.filter(p => isUserRecentlyActive(p.lastSeen)).length;
  
  const canvasOnlineCount = canvasPresence.filter(p => p.isOnline).length;
  const canvasActiveCount = canvasPresence.filter(p => isUserRecentlyActive(p.lastSeen)).length;

  return {
    // Current user presence
    currentUser,
    isOnline,
    currentActivity,
    lastSeen,
    
    // Project presence
    projectPresence,
    projectOnlineCount,
    projectActiveCount,
    
    // Canvas presence
    canvasPresence,
    canvasOnlineCount,
    canvasActiveCount,
    
    // Loading states
    isLoading,
    isInitializing,
    
    // Error states
    error,
    
    // Presence management
    updateActivity,
    updateCursorPosition,
    updateSelectedShapes,
    setTyping,
    switchProject,
    switchCanvas,
    
    // Utility functions
    getActivityDisplayName,
    getActivityColor,
    getActivityIcon,
    formatLastSeen,
    isUserRecentlyActive,
    
    // Statistics
    getPresenceStats,
    
    // Actions
    initializePresence,
    cleanup,
    trackActivity
  };
};

// Hook for specific presence operations
export const usePresenceCheck = (projectId?: string, canvasId?: string) => {
  const { projectPresence, canvasPresence, isOnline } = usePresence({ 
    projectId, 
    canvasId, 
    enabled: true 
  });
  
  return {
    // Quick presence checks
    hasProjectPresence: projectPresence.length > 0,
    hasCanvasPresence: canvasPresence.length > 0,
    isUserOnline: isOnline,
    
    // Counts
    projectUserCount: projectPresence.length,
    canvasUserCount: canvasPresence.length,
    
    // Activity checks
    hasActiveUsers: projectPresence.some(p => isUserRecentlyActive(p.lastSeen)),
    hasTypingUsers: projectPresence.some(p => p.isTyping),
    hasEditingUsers: projectPresence.some(p => p.currentActivity === 'editing'),
    
    // Recent activity
    getRecentActivity: () => {
      const allPresence = [...projectPresence, ...canvasPresence];
      return allPresence
        .filter(p => isUserRecentlyActive(p.lastSeen))
        .sort((a, b) => b.lastSeen - a.lastSeen);
    }
  };
};

export default usePresence;