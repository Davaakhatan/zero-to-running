// History-related type definitions

import type { Shape } from './canvas.js';

export interface HistoryState {
  shapes: Shape[];
  selectedIds: string[];
  timestamp: number;
}

export interface HistoryConfig {
  maxHistory: number;
  enableAutoSave: boolean;
  saveInterval: number;
  enableCompression: boolean;
}

export interface HistoryAction {
  type: 'add' | 'update' | 'delete' | 'move' | 'resize' | 'rotate' | 'color' | 'text';
  shapeId: string;
  oldState?: any;
  newState?: any;
  timestamp: number;
}

export interface HistoryResult {
  success: boolean;
  error?: string;
  state?: HistoryState;
}
