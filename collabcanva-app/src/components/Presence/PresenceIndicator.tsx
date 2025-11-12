// PresenceIndicator component for showing member online status and activity
// Real-time presence indicators with activity tracking

import React, { useState, useEffect } from 'react';
import { usePresence } from '../../hooks/usePresence';
import { PresenceData, ActivityType } from "../../services/presenceService"
import { 
  getActivityDisplayName, 
  getActivityColor, 
  getActivityIcon, 
  formatLastSeen,
  isUserRecentlyActive 
} from '../../services/presenceService';

// Presence indicator props
interface PresenceIndicatorProps {
  projectId: string;
  canvasId?: string;
  showAvatars?: boolean;
  showNames?: boolean;
  showActivity?: boolean;
  showLastSeen?: boolean;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'detailed' | 'minimal';
  className?: string;
}

// Individual presence item props
interface PresenceItemProps {
  presence: PresenceData;
  showAvatar?: boolean;
  showName?: boolean;
  showActivity?: boolean;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'detailed' | 'minimal';
  className?: string;
}

// Presence item component
const PresenceItem: React.FC<PresenceItemProps> = ({
  presence,
  showAvatar = true,
  showName = true,
  showActivity = true,
  showLastSeen = false,
  size = 'md',
  variant = 'compact',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const sizeClasses = {
    sm: {
      avatar: 'w-6 h-6',
      text: 'text-xs',
      icon: 'w-3 h-3',
      padding: 'p-1'
    },
    md: {
      avatar: 'w-8 h-8',
      text: 'text-sm',
      icon: 'w-4 h-4',
      padding: 'p-2'
    },
    lg: {
      avatar: 'w-10 h-10',
      text: 'text-base',
      icon: 'w-5 h-5',
      padding: 'p-3'
    }
  };

  const activityColor = getActivityColor(presence.currentActivity);
  const activityIcon = getActivityIcon(presence.currentActivity);
  const activityName = getActivityDisplayName(presence.currentActivity);
  const lastSeenText = formatLastSeen(presence.lastSeen);
  const isRecentlyActive = isUserRecentlyActive(presence.lastSeen);

  if (variant === 'minimal') {
    return (
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar with online indicator */}
        <div className={`relative ${sizeClasses[size].avatar}`}>
          {showAvatar && (
            <div className={`${sizeClasses[size].avatar} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden`}>
              {presence.avatar ? (
                <img
                  src={presence.avatar}
                  alt={presence.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`${sizeClasses[size].text} font-medium text-gray-600 dark:text-gray-300`}>
                  {presence.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
          
          {/* Online indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
            presence.isOnline && isRecentlyActive 
              ? 'bg-green-500' 
              : presence.isOnline 
                ? 'bg-yellow-500' 
                : 'bg-gray-400'
          }`} />
        </div>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
            <div className="font-medium">{presence.displayName}</div>
            {showActivity && (
              <div className="flex items-center gap-1 mt-1">
                <span>{activityIcon}</span>
                <span>{activityName}</span>
              </div>
            )}
            {showLastSeen && (
              <div className="text-gray-300 mt-1">{lastSeenText}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2 ${sizeClasses[size].padding} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar */}
        {showAvatar && (
          <div className={`relative ${sizeClasses[size].avatar}`}>
            <div className={`${sizeClasses[size].avatar} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden`}>
              {presence.avatar ? (
                <img
                  src={presence.avatar}
                  alt={presence.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`${sizeClasses[size].text} font-medium text-gray-600 dark:text-gray-300`}>
                  {presence.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Online indicator */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              presence.isOnline && isRecentlyActive 
                ? 'bg-green-500' 
                : presence.isOnline 
                  ? 'bg-yellow-500' 
                  : 'bg-gray-400'
            }`} />
          </div>
        )}

        {/* Name and activity */}
        <div className="flex-1 min-w-0">
          {showName && (
            <div className={`${sizeClasses[size].text} font-medium text-gray-900 dark:text-white truncate`}>
              {presence.displayName}
            </div>
          )}
          {showActivity && (
            <div className={`${sizeClasses[size].text} text-gray-500 dark:text-gray-400 flex items-center gap-1`}>
              <span>{activityIcon}</span>
              <span>{activityName}</span>
            </div>
          )}
        </div>

        {/* Typing indicator */}
        {presence.isTyping && (
          <div className="flex items-center gap-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div
      className={`flex items-center gap-3 ${sizeClasses[size].padding} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className={`relative ${sizeClasses[size].avatar}`}>
          <div className={`${sizeClasses[size].avatar} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden`}>
            {presence.avatar ? (
              <img
                src={presence.avatar}
                alt={presence.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`${sizeClasses[size].text} font-medium text-gray-600 dark:text-gray-300`}>
                {presence.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Online indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
            presence.isOnline && isRecentlyActive 
              ? 'bg-green-500' 
              : presence.isOnline 
                ? 'bg-yellow-500' 
                : 'bg-gray-400'
          }`} />
        </div>
      )}

      {/* User info */}
      <div className="flex-1 min-w-0">
        {showName && (
          <div className={`${sizeClasses[size].text} font-medium text-gray-900 dark:text-white truncate`}>
            {presence.displayName}
          </div>
        )}
        {showActivity && (
          <div className={`${sizeClasses[size].text} text-gray-500 dark:text-gray-400 flex items-center gap-1`}>
            <span>{activityIcon}</span>
            <span>{activityName}</span>
          </div>
        )}
        {showLastSeen && (
          <div className={`${sizeClasses[size].text} text-gray-400 dark:text-gray-500`}>
            {lastSeenText}
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-2">
        {/* Typing indicator */}
        {presence.isTyping && (
          <div className="flex items-center gap-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-xs text-blue-500">Typing...</span>
          </div>
        )}

        {/* Activity indicator */}
        <div className={`w-2 h-2 rounded-full bg-${activityColor}-500`} />
      </div>
    </div>
  );
};

// Main presence indicator component
export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  projectId,
  canvasId,
  showAvatars = true,
  showNames = true,
  showActivity = true,
  showLastSeen = false,
  maxVisible = 5,
  size = 'md',
  variant = 'compact',
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

  const [showAll, setShowAll] = useState(false);

  // Determine which presence to show
  const presence = canvasId ? canvasPresence : projectPresence;
  const onlineCount = canvasId ? canvasOnlineCount : projectOnlineCount;

  // Filter and sort presence
  const visiblePresence = presence
    .filter(p => p.isOnline)
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, showAll ? presence.length : maxVisible);

  const hiddenCount = Math.max(0, presence.length - maxVisible);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse flex space-x-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-500 ${className}`}>
        <span className="text-sm">Presence unavailable</span>
      </div>
    );
  }

  if (presence.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 dark:text-gray-400 ${className}`}>
        <span className="text-sm">No one online</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Presence avatars */}
      <div className="flex items-center -space-x-2">
        {visiblePresence.map((presence, index) => (
          <PresenceItem
            key={presence.userId}
            presence={presence}
            showAvatar={showAvatars}
            showName={false}
            showActivity={false}
            showLastSeen={false}
            size={size}
            variant="minimal"
            className={index > 0 ? 'ml-2' : ''}
          />
        ))}
        
        {/* Hidden count indicator */}
        {hiddenCount > 0 && !showAll && (
          <div className="ml-2 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              +{hiddenCount}
            </span>
          </div>
        )}
      </div>

      {/* Online count */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {onlineCount} online
        </span>
        
        {/* Show all toggle */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAll ? 'Show less' : `Show all ${presence.length}`}
          </button>
        )}
      </div>
    </div>
  );
};

// Presence list component
interface PresenceListProps {
  projectId: string;
  canvasId?: string;
  showAvatars?: boolean;
  showNames?: boolean;
  showActivity?: boolean;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'detailed';
  className?: string;
}

export const PresenceList: React.FC<PresenceListProps> = ({
  projectId,
  canvasId,
  showAvatars = true,
  showNames = true,
  showActivity = true,
  showLastSeen = false,
  size = 'md',
  variant = 'compact',
  className = ''
}) => {
  const { 
    projectPresence, 
    canvasPresence, 
    isLoading,
    error 
  } = usePresence({ projectId, canvasId });

  const presence = canvasId ? canvasPresence : projectPresence;

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-red-500 text-sm">Failed to load presence</div>
      </div>
    );
  }

  if (presence.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400 text-sm">No members online</div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {presence
        .sort((a, b) => {
          // Sort by online status first, then by last seen
          if (a.isOnline !== b.isOnline) {
            return a.isOnline ? -1 : 1;
          }
          return b.lastSeen - a.lastSeen;
        })
        .map((presence) => (
          <PresenceItem
            key={presence.userId}
            presence={presence}
            showAvatar={showAvatars}
            showName={showNames}
            showActivity={showActivity}
            showLastSeen={showLastSeen}
            size={size}
            variant={variant}
          />
        ))}
    </div>
  );
};

export default PresenceIndicator;
