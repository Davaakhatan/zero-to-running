import { ref, set, onValue, onDisconnect, off, type Database } from "firebase/database";
import { rtdb } from "./firebase";

// Check if Realtime Database is available
const isRtdbAvailable = () => rtdb !== null;

export interface CursorData {
  displayName: string;
  cursorColor: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number;
}

export type CursorsMap = Record<string, CursorData>;

/**
 * Get the canvas path for cursor tracking
 * Format: projects/{projectId}/canvases/{canvasId}/cursors
 */
function getCanvasPath(projectId?: string, canvasId?: string): string {
  console.log('🔍 [getCanvasPath] Called with:', { projectId, canvasId });
  
  if (projectId && canvasId) {
    const path = `projects/${projectId}/canvases/${canvasId}/cursors`;
    console.log('✅ [getCanvasPath] Using canvas-specific path:', path);
    return path;
  }
  
  // Fallback to global canvas for backwards compatibility
  console.warn('⚠️ [getCanvasPath] Falling back to global path - missing projectId or canvasId');
  return `sessions/global-canvas-v1`;
}

/**
 * Update user's cursor position in Realtime Database
 */
export async function updateCursorPosition(
  userId: string,
  x: number,
  y: number,
  displayName: string,
  cursorColor: string,
  projectId?: string,
  canvasId?: string
): Promise<void> {
  if (!isRtdbAvailable()) return;
  
  const path = getCanvasPath(projectId, canvasId);
  const cursorRef = ref(rtdb as Database, `${path}/${userId}`);
  
  await set(cursorRef, {
    displayName,
    cursorColor,
    cursorX: x,
    cursorY: y,
    lastSeen: Date.now(),
  });
}

/**
 * Set user as online and setup auto-cleanup on disconnect
 */
export async function setUserOnline(
  userId: string,
  displayName: string,
  cursorColor: string,
  projectId?: string,
  canvasId?: string
): Promise<void> {
  if (!isRtdbAvailable()) return;
  
  const path = getCanvasPath(projectId, canvasId);
  const userRef = ref(rtdb as Database, `${path}/${userId}`);
  
  // Set initial presence
  await set(userRef, {
    displayName,
    cursorColor,
    cursorX: 0,
    cursorY: 0,
    lastSeen: Date.now(),
  });
  
  // Auto-cleanup on disconnect
  onDisconnect(userRef).remove();
}

/**
 * Subscribe to all cursor/presence updates for a specific canvas
 */
export function subscribeToCursors(
  callback: (cursors: CursorsMap) => void,
  projectId?: string,
  canvasId?: string
): () => void {
  if (!isRtdbAvailable()) {
    // Return no-op unsubscribe if RTDB is not available
    return () => {};
  }
  
  const path = getCanvasPath(projectId, canvasId);
  const cursorsRef = ref(rtdb as Database, path);
  
  console.log('📡 [Cursor Service] Subscribing to cursors at:', path);
  
  const listener = onValue(cursorsRef, (snapshot) => {
    const data = snapshot.val();
    console.log('👥 [Cursor Service] Received cursor data:', {
      path,
      hasData: !!data,
      userCount: data ? Object.keys(data).length : 0,
      rawData: data
    });
    callback(data || {});
  }, (error) => {
    console.error('🔥 [Cursor Service] Firebase subscription error:', error);
  });
  
  // Return unsubscribe function
  return () => off(cursorsRef, 'value', listener);
}

/**
 * Remove user's cursor (manual cleanup)
 */
export async function removeUserCursor(
  userId: string,
  projectId?: string,
  canvasId?: string
): Promise<void> {
  if (!isRtdbAvailable()) return;
  
  const path = getCanvasPath(projectId, canvasId);
  const userRef = ref(rtdb as Database, `${path}/${userId}`);
  await set(userRef, null);
}

