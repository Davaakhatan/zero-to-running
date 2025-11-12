import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  updateCursorPosition,
  setUserOnline,
  subscribeToCursors,
  type CursorsMap,
} from "../services/cursor";
import { generateUserColor, getDisplayName } from "../utils/helpers";
import { CURSOR_UPDATE_THROTTLE } from "../utils/constants";
import { throttle } from "../utils/helpers";

export function useCursors(projectId?: string, canvasId?: string) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<CursorsMap>({});
  const userColorRef = useRef<string | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  console.log('🚀 [useCursors] Hook called with:', { projectId, canvasId, user: !!user });
  console.log('🚀 [useCursors] Current cursors state:', { cursorsCount: Object.keys(cursors).length, cursors: Object.keys(cursors) });

  // Initialize user presence and get color
  useEffect(() => {
    console.log('✨ [useCursors] useEffect triggered:', { user: !!user, projectId, canvasId });
    
    if (!user) {
      console.log('❌ [useCursors] No user, returning early');
      return;
    }

    const userId = (user as any).uid;
    if (!userId) {
      console.log('❌ [useCursors] No userId, returning early');
      return;
    }

    console.log('🎯 [useCursors] Initializing for:', { userId, projectId, canvasId });
    
    // Don't initialize if projectId or canvasId are missing
    if (!projectId || !canvasId) {
      console.warn('⚠️ [useCursors] Missing projectId or canvasId, skipping initialization:', { projectId, canvasId });
      return;
    }

    console.log('✅ [useCursors] Both projectId and canvasId are available, proceeding with initialization');

    // Generate consistent color for this user
    if (!userColorRef.current) {
      userColorRef.current = generateUserColor(userId);
    }

    const displayName = getDisplayName(user);

    // Set user as online
    setUserOnline(userId, displayName, userColorRef.current, projectId, canvasId).catch((err) => {
      console.error("Failed to set user online:", err);
    });

    // Subscribe to all cursors for this canvas
    console.log('🔗 [useCursors] About to subscribe to cursors with:', { projectId, canvasId });
    const unsubscribe = subscribeToCursors((allCursors) => {
      console.log('📥 [useCursors] Received cursor update:', {
        totalUsers: Object.keys(allCursors).length,
        currentUserId: userId,
        allUserIds: Object.keys(allCursors),
        includesCurrentUser: allCursors[userId] ? 'YES' : 'NO',
        currentUserData: allCursors[userId],
        projectId,
        canvasId,
        rawData: allCursors
      });
      
      // Include all cursors (including current user) for PresenceList
      const allCursorsIncludingSelf = { ...allCursors };
      
      console.log('👥 [useCursors] Including all users (including self):', {
        totalUsersCount: Object.keys(allCursorsIncludingSelf).length,
        allUserIds: Object.keys(allCursorsIncludingSelf)
      });
      
      // Use functional update to prevent infinite loops
      setCursors(prev => {
        // Only update if cursors actually changed
        const prevKeys = Object.keys(prev).sort().join(',');
        const newKeys = Object.keys(allCursorsIncludingSelf).sort().join(',');
        if (prevKeys === newKeys) {
          // Check if any cursor values changed
          const hasChanged = Object.keys(allCursorsIncludingSelf).some(key => {
            const prevCursor = prev[key];
            const newCursor = allCursorsIncludingSelf[key];
            return !prevCursor || 
                   prevCursor.cursorX !== newCursor.cursorX || 
                   prevCursor.cursorY !== newCursor.cursorY;
          });
          if (!hasChanged) return prev;
        }
        console.log('✅ [useCursors] Updating cursors state:', Object.keys(allCursorsIncludingSelf).length, 'users');
        return allCursorsIncludingSelf;
      });
    }, projectId, canvasId);

    return () => {
      unsubscribe();
    };
  }, [user, projectId, canvasId]);

  // Throttled cursor position update
  const updateCursor = useCallback(
    throttle((x: number, y: number) => {
      if (!user) return;

      const userId = (user as any).uid;
      if (!userId || !userColorRef.current) return;

      // Only update if position changed significantly (>2px)
      const dx = Math.abs(x - lastPositionRef.current.x);
      const dy = Math.abs(y - lastPositionRef.current.y);

      if (dx < 2 && dy < 2) return;

      lastPositionRef.current = { x, y };

      const displayName = getDisplayName(user);

      console.log('🖱️ [useCursors] Updating cursor position:', {
        userId,
        x: Math.round(x),
        y: Math.round(y),
        projectId,
        canvasId
      });

      updateCursorPosition(
        userId,
        x,
        y,
        displayName,
        userColorRef.current,
        projectId,
        canvasId
      ).catch((err) => {
        console.error("Failed to update cursor:", err);
      });
    }, CURSOR_UPDATE_THROTTLE),
    [user, projectId, canvasId]
  );

  return {
    cursors,
    updateCursor,
    userColor: userColorRef.current,
  };
}

