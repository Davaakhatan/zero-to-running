export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Rotation in degrees
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  // Advanced color properties
  opacity?: number; // 0-1
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference' | 'exclusion';
  // Gradient properties
  gradientType?: 'linear' | 'radial' | 'conic';
  gradientColors?: string[]; // Array of color stops
  gradientStops?: number[]; // Array of stop positions (0-1)
  gradientAngle?: number; // For linear gradients (degrees)
  gradientCenterX?: number; // For radial/conic gradients (0-1)
  gradientCenterY?: number; // For radial/conic gradients (0-1)
  gradientRadius?: number; // For radial gradients (0-1)
  scaleX?: number;
  scaleY?: number;
  zIndex?: number; // Layer order (higher = on top)
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: 'normal' | 'bold';
  textDecoration?: 'none' | 'underline';
  // Star-specific properties
  numPoints?: number; // Number of points for star (default 5)
  innerRadius?: number; // Inner radius for star (default 0.4)
  // Polygon-specific properties
  sides?: number; // Number of sides for polygon (default 6)
  // Path-specific properties
  pathData?: string; // SVG path data
  // Image-specific properties
  imageUrl?: string; // URL or data URL of the image
  imageAlt?: string; // Alt text for accessibility
  // Group-specific properties
  children?: string[]; // Array of child shape IDs
  groupName?: string; // Optional name for the group
  // Common properties
  createdBy?: string;
  createdAt?: number;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null;
}

export interface Group {
  id: string;
  name: string;
  children: string[]; // Array of child shape IDs
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  zIndex?: number;
  createdBy?: string;
  createdAt?: number;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null;
}

export interface CanvasState {
  shapes: Shape[];
  selectedShapeIds: string[];
  groups: Group[];
  isPanning: boolean;
  isZooming: boolean;
  zoom: number;
  panX: number;
  panY: number;
  isMultiSelecting: boolean;
  multiSelectStart: { x: number; y: number } | null;
  multiSelectEnd: { x: number; y: number } | null;
}

export interface CanvasHistory {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  backgroundColor: string;
  width: number;
  height: number;
}
