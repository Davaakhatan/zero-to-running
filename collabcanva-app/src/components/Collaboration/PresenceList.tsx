import { useState, useRef, useEffect } from "react";
import type { CursorsMap } from "../../services/cursor";

interface PresenceListProps {
  cursors: CursorsMap;
  onUserClick: (userId: string, cursorX: number, cursorY: number) => void;
  projectId?: string;
  canvasId?: string;
  variant?: string;
}

export default function PresenceList({ cursors, onUserClick, projectId, canvasId }: PresenceListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - 300 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Convert cursors map to array for easier rendering
  const cursorUsers = Object.entries(cursors).map(([userId, cursor]) => {
    // Use cursorColor from CursorData type
    const color = cursor.cursorColor || '#3B82F6';
    
    return {
      userId,
      displayName: cursor.displayName,
      color: color,
      cursorX: cursor.cursorX,
      cursorY: cursor.cursorY,
      isOnline: true
    };
  });

  // Use only real cursor users
  const allUsers = cursorUsers;

  const userCount = allUsers.length;

  console.log('🔍 [PresenceList] Rendering with:', {
    projectId,
    canvasId,
    userCount,
    cursorsCount: Object.keys(cursors).length,
    users: allUsers.map(u => u.displayName),
    rawCursors: cursors
  });

  if (userCount === 0) {
    console.log('⚠️ [PresenceList] No users online, returning null');
    return null;
  }
  
  console.log('✅ [PresenceList] Rendering presence list with', userCount, 'users');
  console.log('🔍 [PresenceList] Cursor users data:', cursorUsers.map(u => ({ userId: u.userId, displayName: u.displayName, color: u.color })));

  const handleUserClick = (userId: string) => {
    const cursor = cursors[userId];
    
    if (cursor) {
      onUserClick(userId, cursor.cursorX, cursor.cursorY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="fixed bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 dark:border-slate-600/50 z-30 max-w-[200px] overflow-hidden transition-shadow duration-300 hover:shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto'
      }}
    >
      {/* Header with drag handle */}
      <div 
        className="px-3 py-2.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              Online
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{userCount} {userCount === 1 ? 'person' : 'people'}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* User List */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-1 max-h-64 overflow-y-auto">
          {allUsers.length > 0 ? (
            allUsers.map((user) => (
            <button
              key={user.userId}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ [PresenceList] Button clicked for user:', user.userId, user.displayName);
                handleUserClick(user.userId);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ [PresenceList] Mouse down on user:', user.userId, user.displayName);
              }}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group cursor-pointer"
              title={`Jump to ${user.displayName}'s cursor`}
              style={{ pointerEvents: 'auto', zIndex: 1000 }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform shrink-0"
                style={{ backgroundColor: user.color }}
              >
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p 
                  className="text-xs font-semibold truncate"
                  style={{ color: user.color }}
                >
                  {user.displayName}
                </p>
                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Follow
                  </span>
                </div>
              </div>
              <svg 
                className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No other users online
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                Open in another browser to test
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

