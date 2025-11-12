// AI-related type definitions

import type { Shape } from './canvas.js';

export interface AICommand {
  type: 'create' | 'update' | 'delete' | 'move' | 'resize' | 'color' | 'text';
  shapeType?: string;
  properties?: Record<string, any>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  color?: string;
  text?: string;
}

export interface AIResponse {
  success: boolean;
  commands: AICommand[];
  error?: string;
  message?: string;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enableStreaming: boolean;
  timeout: number;
}

export interface AIContext {
  projectId: string;
  canvasId: string;
  userId: string;
  currentShapes: Shape[];
  selectedShapes: Shape[];
  canvasSize: { width: number; height: number };
}
