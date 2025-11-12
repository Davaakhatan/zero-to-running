// Cursor-related type definitions

export interface CursorData {
  userId: string;
  userName: string;
  cursorColor: string;
  position: {
    x: number;
    y: number;
  };
  isActive: boolean;
  lastSeen: Date;
  selectedShapeIds?: string[];
}

export interface CursorState {
  cursors: Map<string, CursorData>;
  currentUser: CursorData | null;
  isConnected: boolean;
}

export interface CursorConfig {
  enableCursors: boolean;
  updateInterval: number;
  inactiveTimeout: number;
  maxCursors: number;
  colors: string[];
}
