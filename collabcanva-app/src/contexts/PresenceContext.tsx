// PresenceContext for global presence management
// Provides real-time presence state throughout the application

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePresence } from '../hooks/usePresence';
import { PresenceData } from '../types';
import { ActivityType } from '../services/presenceService';

// Presence context interface
interface PresenceContextType {
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

// Create context
const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

// Presence provider props
interface PresenceProviderProps {
  children: ReactNode;
  projectId: string;
  canvasId?: string;
  enabled?: boolean;
}

// Presence provider component
export const PresenceProvider: React.FC<PresenceProviderProps> = ({
  children,
  projectId,
  canvasId,
  enabled = true
}) => {
  const { user } = useAuth();
  const presence = usePresence({ projectId, canvasId, enabled });

  // Initialize presence when user changes
  useEffect(() => {
    if (user && enabled) {
      presence.initializePresence();
    }
  }, [user, enabled, presence.initializePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      presence.cleanup();
    };
  }, [presence.cleanup]);

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
};

// Hook to use presence context
export const usePresenceContext = (): PresenceContextType => {
  const context = useContext(PresenceContext);
  
  if (context === undefined) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  
  return context;
};

// Higher-order component for presence-based rendering
export const withPresenceContext = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    projectId: string;
    canvasId?: string;
    enabled?: boolean;
  }
) => {
  return (props: P) => (
    <PresenceProvider {...options}>
      <Component {...props} />
    </PresenceProvider>
  );
};

// Presence guard component
interface PresenceGuardProps {
  projectId: string;
  canvasId?: string;
  enabled?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PresenceGuard: React.FC<PresenceGuardProps> = ({
  projectId,
  canvasId,
  enabled = true,
  fallback = null,
  children
}) => {
  if (!enabled) {
    return <>{fallback}</>;
  }

  return (
    <PresenceProvider projectId={projectId} canvasId={canvasId} enabled={enabled}>
      {children}
    </PresenceProvider>
  );
};

// Presence status component
interface PresenceStatusProps {
  projectId: string;
  canvasId?: string;
  showCount?: boolean;
  showActivity?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PresenceStatus: React.FC<PresenceStatusProps> = ({
  projectId,
  canvasId,
  showCount = true,
  showActivity = true,
  size = 'md',
  className = ''
}) => {
  const { 
    projectPresence, 
    canvasPresence, 
    projectOnlineCount, 
    canvasOnlineCount,
    isLoading,
    error 
  } = usePresence({ projectId, canvasId });

  const presence = canvasId ? canvasPresence : projectPresence;
  const onlineCount = canvasId ? canvasOnlineCount : projectOnlineCount;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse">
          <div className="w-2 h-2 bg-gray-300 rounded-full" />
        </div>
        <span className={`${sizeClasses[size]} text-gray-500`}>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className={`${sizeClasses[size]} text-red-500`}>Offline</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Online indicator */}
      <div className={`w-2 h-2 rounded-full ${
        onlineCount > 0 ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      
      {/* Count */}
      {showCount && (
        <span className={`${sizeClasses[size]} text-gray-600 dark:text-gray-400`}>
          {onlineCount} online
        </span>
      )}
      
      {/* Activity indicator */}
      {showActivity && onlineCount > 0 && (
        <div className="flex items-center gap-1">
          {presence.some(p => p.isTyping) && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          )}
          {presence.some(p => p.currentActivity === 'editing') && (
            <span className={`${sizeClasses[size]} text-green-600`}>Editing</span>
          )}
        </div>
      )}
    </div>
  );
};

// Presence activity component
interface PresenceActivityProps {
  projectId: string;
  canvasId?: string;
  showTyping?: boolean;
  showEditing?: boolean;
  showCollaborating?: boolean;
  className?: string;
}

export const PresenceActivity: React.FC<PresenceActivityProps> = ({
  projectId,
  canvasId,
  showTyping = true,
  showEditing = true,
  showCollaborating = true,
  className = ''
}) => {
  const { 
    projectPresence, 
    canvasPresence, 
    isLoading,
    error 
  } = usePresence({ projectId, canvasId });

  const presence = canvasId ? canvasPresence : projectPresence;

  if (isLoading || error || presence.length === 0) {
    return null;
  }

  const typingUsers = presence.filter(p => p.isTyping);
  const editingUsers = presence.filter(p => p.currentActivity === 'editing');
  const collaboratingUsers = presence.filter(p => p.currentActivity === 'collaborating');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Typing indicator */}
      {showTyping && typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span className="text-sm">
            {typingUsers.length === 1 
              ? `${typingUsers[0].displayName} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </span>
        </div>
      )}

      {/* Editing indicator */}
      {showEditing && editingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm">
            {editingUsers.length === 1 
              ? `${editingUsers[0].displayName} is editing`
              : `${editingUsers.length} people are editing`
            }
          </span>
        </div>
      )}

      {/* Collaborating indicator */}
      {showCollaborating && collaboratingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <span className="text-sm">
            {collaboratingUsers.length === 1 
              ? `${collaboratingUsers[0].displayName} is collaborating`
              : `${collaboratingUsers.length} people are collaborating`
            }
          </span>
        </div>
      )}
    </div>
  );
};

// Presence cursor component
interface PresenceCursorProps {
  projectId: string;
  canvasId: string;
  showCursors?: boolean;
  showSelections?: boolean;
  className?: string;
}

export const PresenceCursor: React.FC<PresenceCursorProps> = ({
  projectId,
  canvasId,
  showCursors = true,
  showSelections = true,
  className = ''
}) => {
  const { canvasPresence, isLoading, error } = usePresence({ projectId, canvasId });

  if (isLoading || error || !showCursors) {
    return null;
  }

  const activeUsers = canvasPresence.filter(p => 
    p.isOnline && p.cursorPosition && p.currentActivity === 'editing'
  );

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {activeUsers.map((presence) => (
        <div key={presence.userId}>
          {/* Cursor */}
          {presence.cursorPosition && (
            <div
              className="absolute w-4 h-4 pointer-events-none z-50"
              style={{
                left: presence.cursorPosition.x,
                top: presence.cursorPosition.y,
                transform: 'translate(-2px, -2px)'
              }}
            >
              <div className="relative">
                {/* Cursor icon */}
                <div className="w-4 h-4 bg-blue-500 rounded-sm transform rotate-45" />
                
                {/* User label */}
                <div className="absolute top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {presence.displayName}
                </div>
              </div>
            </div>
          )}

          {/* Selection indicators */}
          {showSelections && presence.selectedShapes && presence.selectedShapes.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {presence.selectedShapes.map((shapeId) => (
                <div
                  key={shapeId}
                  className="absolute border-2 border-blue-500 border-dashed opacity-50"
                  style={{
                    // This would need to be connected to the actual shape positions
                    // For now, we'll just show a placeholder
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PresenceContext;
