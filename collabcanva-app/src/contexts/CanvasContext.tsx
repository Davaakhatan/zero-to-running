import { createContext, useContext, useState, useRef, type ReactNode } from "react";
import type Konva from "konva";
import { generateId } from "../utils/helpers";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_COLOR } from "../utils/constants";
import { useCanvasSync } from "../hooks/useCanvasSync";
import { useHistory } from "../hooks/useHistory";

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
  strokeDashArray?: number[]; // Stroke dash pattern
  strokeLineCap?: 'butt' | 'round' | 'square'; // Stroke line cap
  strokeLineJoin?: 'miter' | 'round' | 'bevel'; // Stroke line join
  cornerRadius?: number; // Border radius for rectangles
  scaleX?: number;
  scaleY?: number;
  zIndex?: number; // Layer order (higher = on top)
  // Shadow properties
  shadowColor?: string; // Shadow color
  shadowBlur?: number; // Shadow blur radius
  shadowOffsetX?: number; // Shadow horizontal offset
  shadowOffsetY?: number; // Shadow vertical offset
  shadowOpacity?: number; // Shadow opacity (0-1)
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
  createdBy?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null; // Timestamp when lock was acquired (null when unlocked)
}

interface CanvasContextType {
  // Canvas state
  shapes: Shape[];
  selectedIds: string[];
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  loading: boolean;
  
  // Zoom and pan state
  scale: number;
  position: { x: number; y: number };
  
  // Shape operations
  addShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image' | 'group', overrides?: Partial<Shape>) => void;
  addImageShape: (file: File, overrides?: Partial<Shape>) => Promise<void>;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  updateSelectedShapes: (updates: Partial<Shape>) => void; // Batch update all selected shapes with same updates
  batchUpdateShapes: (updates: Array<{ id: string; updates: Partial<Shape> }>) => void; // Batch update with different updates per shape
  deleteShape: (id: string) => void;
  deleteSelectedShapes: () => Promise<void>;
  selectShape: (id: string | null, addToSelection?: boolean) => Promise<void>;
  selectShapes: (ids: string[]) => Promise<void>;
  clearSelection: () => void;
  
  // Locking operations
  lockShape: (id: string) => Promise<boolean>;
  unlockShape: (id: string) => void;
  
  // Z-index operations (work on all selected shapes)
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  
  // Canvas operations
  setScale: (scale: number) => void;
  setPosition: (position: { x: number; y: number }) => void;
  resetView: () => void;
  panToPosition: (canvasX: number, canvasY: number) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Alignment operations (work on all selected shapes)
  alignLeft: () => void;
  alignRight: () => void;
  alignCenter: () => void;
  alignTop: () => void;
  alignBottom: () => void;
  alignMiddle: () => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scale, setScaleState] = useState(1);
  const [position, setPositionState] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage | null>(null);
  
  // Use real-time sync hook
  const {
    shapes,
    loading,
    setShapes,
    addShape: addShapeSync,
    updateShape: updateShapeSync,
    updateShapes: updateShapesSync,
    deleteShape: deleteShapeSync,
    lockShape: lockShapeSync,
    unlockShape: unlockShapeSync,
  } = useCanvasSync();

  // History management
  const { pushState, undo, redo, canUndo, canRedo } = useHistory(
    shapes,
    selectedIds,
    (restoredShapes, restoredSelectedIds) => {
      // This function is called when restoring from history
      // We need to restore the shapes to the sync system
      console.log('🔄 Restoring from history:', { shapeCount: restoredShapes.length, selectedIds: restoredSelectedIds });
      
      // Update the shapes in the sync system
      // This is a simplified approach - in a real app you'd want to sync with Firebase
      setShapes(restoredShapes);
      setSelectedIds(restoredSelectedIds);
      
      console.log('✅ History restoration complete');
    }
  );

  // History is automatically saved via useHistory hook

  // Wrapper functions for undo/redo
  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  // Image upload function
  const uploadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const addImageShape = async (file: File, overrides?: Partial<Shape>) => {
    try {
      const imageUrl = await uploadImage(file);
      const newShape: Shape = {
        id: generateId(),
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        rotation: 0,
        fill: 'transparent',
        imageUrl,
        imageAlt: file.name,
        createdAt: Date.now(),
        ...overrides,
      };
    addShapeSync(newShape);
    // Save to history after adding image shape
    pushState();
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  };

  const addShape = (
    type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image' | 'group',
    overrides?: Partial<Shape>
  ) => {
    // Default dimensions based on shape type
    let defaultWidth = DEFAULT_SHAPE_WIDTH;
    let defaultHeight = DEFAULT_SHAPE_HEIGHT;
    
    if (type === 'circle') {
      defaultWidth = 150;
      defaultHeight = 150;
    } else if (type === 'ellipse') {
      defaultWidth = 200;
      defaultHeight = 120;
    } else if (type === 'text') {
      defaultWidth = 300;
      defaultHeight = 60;
    } else if (type === 'star') {
      defaultWidth = 120;
      defaultHeight = 120;
    } else if (type === 'polygon') {
      defaultWidth = 120;
      defaultHeight = 120;
    } else if (type === 'path') {
      defaultWidth = 200;
      defaultHeight = 100;
    } else if (type === 'image') {
      defaultWidth = 200;
      defaultHeight = 150;
    }

    const newShape: Shape = {
      id: generateId(),
      type,
      x: 100,
      y: 100,
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
      fill: DEFAULT_SHAPE_COLOR,
      createdAt: Date.now(),
      // Text-specific defaults
      ...(type === 'text' && {
        text: 'Double-click to edit',
        fontSize: 16,
        fontFamily: 'Arial',
        fontStyle: 'normal',
        fontWeight: 'normal',
        textDecoration: 'none',
      }),
      // Star-specific defaults
      ...(type === 'star' && {
        numPoints: 5,
        innerRadius: 0.4,
      }),
      // Polygon-specific defaults
      ...(type === 'polygon' && {
        sides: 6,
      }),
      // Path-specific defaults
      ...(type === 'path' && {
        pathData: 'M10,10 L50,10 L50,50 L10,50 Z', // Simple rectangle path
      }),
      // Image-specific defaults
      ...(type === 'image' && {
        imageUrl: '',
        imageAlt: 'Uploaded image',
      }),
      // Apply any overrides
      ...overrides,
    };
    addShapeSync(newShape);
    // Save to history after adding shape
    pushState();
  };

  const updateShape = (id: string, updates: Partial<Shape>) => {
    updateShapeSync(id, updates);
    // Save to history after updating shape
    pushState();
  };

  // Update multiple selected shapes at once (batch update for better sync)
  const updateSelectedShapes = (updates: Partial<Shape>) => {
    if (selectedIds.length === 0) return;
    
    const shapesUpdates = selectedIds.map(id => ({
      id,
      updates,
    }));
    
    updateShapesSync(shapesUpdates);
    // Save to history after updating shapes
    pushState();
  };

  // Batch update multiple shapes with different updates for each
  const batchUpdateShapes = (updates: Array<{ id: string; updates: Partial<Shape> }>) => {
    if (updates.length === 0) return;
    updateShapesSync(updates);
    // Save to history after updating shapes
    pushState();
  };

  const deleteShape = (id: string) => {
    deleteShapeSync(id);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
    // Save to history after deleting shape
    pushState();
  };

  const deleteSelectedShapes = async () => {
    console.log('[deleteSelectedShapes] Deleting shapes:', selectedIds);
    
    if (selectedIds.length === 0) return;
    
    // Create a copy of selectedIds to avoid issues during deletion
    const idsToDelete = [...selectedIds];
    
    // Clear selection first to avoid UI issues
    setSelectedIds([]);
    
    // Delete all shapes sequentially to avoid race conditions
    for (const id of idsToDelete) {
      console.log('[deleteSelectedShapes] Unlocking and deleting:', id);
      try {
        await unlockShapeSync(id);
        await deleteShapeSync(id);
      } catch (error) {
        console.error(`Failed to delete shape ${id}:`, error);
      }
    }
    
    // Save to history after deleting shapes
    pushState();
  };

  const selectShape = async (id: string | null, addToSelection = false) => {
    if (!id) {
      // Clear selection
      selectedIds.forEach(sid => unlockShapeSync(sid));
      setSelectedIds([]);
      return;
    }

    if (addToSelection) {
      // Cmd/Ctrl+Click: toggle shape in selection
      if (selectedIds.includes(id)) {
        // Remove from selection
        unlockShapeSync(id);
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
        // Add to selection - await lock acquisition
        const locked = await lockShapeSync(id);
        if (locked) {
          setSelectedIds([...selectedIds, id]);
        }
      }
    } else {
      // Normal click: replace selection
      selectedIds.forEach(sid => {
        if (sid !== id) unlockShapeSync(sid);
      });
      
      // Await lock acquisition before updating selection
      const locked = await lockShapeSync(id);
      if (locked) {
        setSelectedIds([id]);
      }
    }
  };

  const selectShapes = async (ids: string[]) => {
    console.log('[selectShapes] Attempting to select:', ids);
    
    // Unlock previously selected shapes
    selectedIds.forEach(sid => {
      if (!ids.includes(sid)) unlockShapeSync(sid);
    });
    
    // Lock newly selected shapes - await all locks
    const lockPromises = ids.map(id => lockShapeSync(id));
    const lockResults = await Promise.all(lockPromises);
    
    console.log('[selectShapes] Lock results:', lockResults);
    
    // Only add shapes that were successfully locked
    const lockedIds = ids.filter((_, index) => lockResults[index]);
    console.log('[selectShapes] Successfully locked IDs:', lockedIds);
    
    setSelectedIds(lockedIds);
  };

  const clearSelection = () => {
    selectedIds.forEach(sid => unlockShapeSync(sid));
    setSelectedIds([]);
  };

  const lockShape = async (id: string): Promise<boolean> => {
    const result = await lockShapeSync(id);
    return result ?? false;
  };

  const unlockShape = (id: string) => {
    unlockShapeSync(id);
  };

  const setScale = (newScale: number) => {
    setScaleState(newScale);
  };

  const setPosition = (newPosition: { x: number; y: number }) => {
    setPositionState(newPosition);
  };

  const resetView = () => {
    setScaleState(1);
    setPositionState({ x: 0, y: 0 });
  };

  // Pan to a specific canvas position (e.g., another user's cursor)
  // Z-index management (work on all selected shapes)
  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    const maxZ = Math.max(...shapes.map(s => s.zIndex || 0), 0);
    const updates = selectedIds.map((id, index) => ({
      id,
      updates: { zIndex: maxZ + 1 + index }
    }));
    batchUpdateShapes(updates);
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    const minZ = Math.min(...shapes.map(s => s.zIndex || 0), 0);
    const updates = selectedIds.map((id, index) => ({
      id,
      updates: { zIndex: minZ - 1 - index }
    }));
    batchUpdateShapes(updates);
  };

  const bringForward = () => {
    if (selectedIds.length === 0) return;
    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      const currentZ = shape?.zIndex || 0;
      return { id, updates: { zIndex: currentZ + 1 } };
    });
    batchUpdateShapes(updates);
  };

  const sendBackward = () => {
    if (selectedIds.length === 0) return;
    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      const currentZ = shape?.zIndex || 0;
      return { id, updates: { zIndex: currentZ - 1 } };
    });
    batchUpdateShapes(updates);
  };

  const panToPosition = (canvasX: number, canvasY: number) => {
    console.log('🎯 [panToPosition] Called with:', { canvasX, canvasY, currentScale: scale });
    
    // Get viewport center
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    // Calculate new stage position to center the target point
    const newX = viewportCenterX - canvasX * scale;
    const newY = viewportCenterY - canvasY * scale;
    
    console.log('🎯 [panToPosition] Calculated new position:', { newX, newY, viewportCenterX, viewportCenterY });
    
    // Force update the position state
    setPositionState({ x: newX, y: newY });
    
    // Also try to update the stage directly if available
    if (stageRef.current) {
      console.log('🎯 [panToPosition] Updating stage position directly');
      stageRef.current.position({ x: newX, y: newY });
      stageRef.current.batchDraw();
      
      // Force a redraw to ensure the position change is visible
      setTimeout(() => {
        if (stageRef.current) {
          stageRef.current.batchDraw();
          console.log('🎯 [panToPosition] Forced redraw completed');
        }
      }, 10);
    } else {
      console.log('❌ [panToPosition] stageRef.current is null');
    }
    
    console.log('✅ [panToPosition] Position updated');
  };

  // Alignment functions (work on all selected shapes)
  const alignLeft = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the leftmost position among selected shapes
    const leftmostX = Math.min(...selectedShapes.map(s => s.x));
    const updates = selectedIds.map(id => ({
      id,
      updates: { x: leftmostX }
    }));
    batchUpdateShapes(updates);
  };

  const alignRight = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the rightmost position among selected shapes
    const rightmostX = Math.max(...selectedShapes.map(s => s.x + s.width));
    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { x: shape ? rightmostX - shape.width : 0 }
      };
    });
    batchUpdateShapes(updates);
  };

  const alignCenter = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the center position among selected shapes
    const leftmostX = Math.min(...selectedShapes.map(s => s.x));
    const rightmostX = Math.max(...selectedShapes.map(s => s.x + s.width));
    const centerX = (leftmostX + rightmostX) / 2;
    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { x: shape ? centerX - shape.width / 2 : 0 }
      };
    });
    batchUpdateShapes(updates);
  };

  const alignTop = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the topmost position among selected shapes
    const topmostY = Math.min(...selectedShapes.map(s => s.y));
    const updates = selectedIds.map(id => ({
      id,
      updates: { y: topmostY }
    }));
    batchUpdateShapes(updates);
  };

  const alignBottom = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the bottommost position among selected shapes
    const bottommostY = Math.max(...selectedShapes.map(s => s.y + s.height));
    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { y: shape ? bottommostY - shape.height : 0 }
      };
    });
    batchUpdateShapes(updates);
  };

  const alignMiddle = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the middle position among selected shapes
    const topmostY = Math.min(...selectedShapes.map(s => s.y));
    const bottommostY = Math.max(...selectedShapes.map(s => s.y + s.height));
    const middleY = (topmostY + bottommostY) / 2;
    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { y: shape ? middleY - shape.height / 2 : 0 }
      };
    });
    batchUpdateShapes(updates);
  };

  return (
    <CanvasContext.Provider
      value={{
        shapes,
        selectedIds,
        stageRef,
        loading,
        scale,
        position,
        addShape,
        addImageShape,
        updateShape,
        updateSelectedShapes,
        batchUpdateShapes,
        deleteShape,
        deleteSelectedShapes,
        selectShape,
        selectShapes,
        clearSelection,
        lockShape,
        unlockShape,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward,
        setScale,
        setPosition,
        resetView,
        panToPosition,
        undo: handleUndo,
        redo: handleRedo,
        canUndo,
        canRedo,
        alignLeft,
        alignRight,
        alignCenter,
        alignTop,
        alignBottom,
        alignMiddle,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}

