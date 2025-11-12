// Project-aware canvas context for multi-project system
// Provides canvas functionality with project-specific Firebase synchronization

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";
import type Konva from "konva";
import { generateId } from "../utils/helpers";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_COLOR } from "../utils/constants";
import { useProjectCanvasSync } from "../hooks/useProjectCanvasSync";
import { useHistory } from "../hooks/useHistory";
import { createGroup, ungroupGroup } from "../utils/groupingUtils";

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Rotation in degrees
  fill: string;
  stroke?: string; // Stroke color
  strokeWidth?: number; // Stroke width
  strokeDashArray?: number[]; // Stroke dash pattern
  strokeLineCap?: 'butt' | 'round' | 'square'; // Stroke line cap
  strokeLineJoin?: 'miter' | 'round' | 'bevel'; // Stroke line join
  cornerRadius?: number; // Border radius for rectangles
  scaleX?: number; // Horizontal scale
  scaleY?: number; // Vertical scale
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
  createdBy?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null; // Timestamp when lock was acquired (null when unlocked)
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
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null;
}

interface ProjectCanvasContextType {
  // Canvas state
  shapes: Shape[];
  groups: Group[];
  selectedIds: string[];
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  loading: boolean;
  error: string | null;
  
  // Project info
  projectId: string | null;
  canvasId: string | null;
  currentCanvas: any | null; // Current canvas object
  projectCanvases: any[]; // List of canvases in the project
  createCanvas: (name: string) => Promise<void>;
  updateCanvas: (id: string, updates: any) => Promise<void>;
  deleteCanvas: (id: string) => Promise<void>;
  duplicateCanvas: (id: string) => Promise<void>;
  
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
  pushState: () => void;
  forceSave: () => void;
  
  // Alignment operations (work on all selected shapes)
  alignLeft: () => void;
  alignRight: () => void;
  alignCenter: () => void;
  alignTop: () => void;
  alignBottom: () => void;
  alignMiddle: () => void;
  
  // Grouping operations
  groupShapes: (groupName?: string) => void;
  ungroupShapes: () => void;
  renameGroup: (groupId: string, newName: string) => void;
  
  // Project canvas operations
  setCurrentCanvas: (projectId: string, canvasId: string) => void;
  clearCurrentCanvas: () => void;
  refreshCanvas: () => Promise<void>;
  clearError: () => void;
}

const ProjectCanvasContext = createContext<ProjectCanvasContextType | null>(null);

export function ProjectCanvasProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [scale, setScaleState] = useState(1);
  const [position, setPositionState] = useState({ x: 0, y: 0 });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  
  // Use project-aware canvas sync hook
  const {
    shapes,
    loading,
    error,
    addShape: addShapeSync,
    updateShape: updateShapeSync,
    updateShapes: updateShapesSync,
    deleteShape: deleteShapeSync,
    lockShape: lockShapeSync,
    unlockShape: unlockShapeSync,
    clearError: clearErrorSync,
    refreshCanvas: refreshCanvasSync,
  } = useProjectCanvasSync({
    projectId: projectId || '',
    canvasId: canvasId || '',
    enabled: !!(projectId && canvasId)
  });

  // Debug sync state
  console.log('🔄 [ProjectCanvasContext] Sync state:', { 
    projectId, 
    canvasId, 
    enabled: !!(projectId && canvasId),
    shapesCount: shapes.length,
    loading,
    error
  });

  // History management - only initialize when sync is enabled
  const { pushState, forceSave, undo, redo, canUndo, canRedo } = useHistory(
    shapes,
    selectedIds,
    (restoredShapes, restoredSelectedIds) => {
      // This function is called when restoring from history
      console.log('🔄 Restoring from project canvas history:', { 
        projectId, 
        canvasId, 
        shapeCount: restoredShapes.length, 
        selectedIds: restoredSelectedIds 
      });
      
      // Update the shapes in the sync system
      updateShapesSync(restoredShapes);
      setSelectedIds(restoredSelectedIds);
      
      console.log('✅ Project canvas history restoration complete');
    }
  );

  // Force re-initialization of history when sync becomes enabled
  useEffect(() => {
    if (projectId && canvasId && shapes.length >= 0) {
      console.log('🔄 [ProjectCanvasContext] Sync enabled, re-initializing history');
      // The history will be re-initialized by the useHistory hook
    }
  }, [projectId, canvasId, shapes.length]);

  // Removed problematic useEffect that was causing infinite re-renders

  // Debug logging for history state (reduced frequency)
  if (shapes.length > 0 || canUndo || canRedo) {
    console.log('📚 [ProjectCanvasContext] History state:', { 
      canUndo, 
      canRedo, 
      shapesCount: shapes.length, 
      projectId,
      canvasId
    });
  }

  // History is automatically saved via useHistory hook

  // Wrapper functions for undo/redo
  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  // Set current canvas
  const setCurrentCanvas = (newProjectId: string, newCanvasId: string) => {
    console.log('🎯 [ProjectCanvasContext] Setting current project canvas:', { newProjectId, newCanvasId });
    setProjectId(newProjectId);
    setCanvasId(newCanvasId);
    // Clear selection when switching canvases
    setSelectedIds([]);
    console.log('✅ [ProjectCanvasContext] Project canvas set successfully');
  };

  // Clear current canvas
  const clearCurrentCanvas = () => {
    console.log('Clearing current project canvas');
    setProjectId(null);
    setCanvasId(null);
    setSelectedIds([]);
  };

  // Refresh canvas
  const refreshCanvas = async () => {
    if (projectId && canvasId) {
      await refreshCanvasSync();
    }
  };

  // Clear error
  const clearError = () => {
    clearErrorSync();
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
    if (!projectId || !canvasId) {
      throw new Error('No project canvas selected');
    }

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
      await addShapeSync(newShape);
      console.log('🎨 [addImageShape] Image shape added to project canvas:', { projectId, canvasId, newShape });
      // Save to history after adding image shape with a small delay to ensure state is updated
      setTimeout(() => {
      pushState();
    }, 10);
    } catch (error) {
      console.error('Failed to upload image to project canvas:', error);
      throw error;
    }
  };

  const addShape = (
    type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image' | 'group',
    overrides?: Partial<Shape>
  ) => {
    if (!projectId || !canvasId) {
      console.error('Cannot add shape: no project canvas selected');
      return;
    }

    // Default dimensions based on shape type (like CanvasContext)
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
      zIndex: Math.max(...shapes.map(s => s.zIndex || 0), 0) + 1,
      // Text-specific defaults (like CanvasContext)
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
      // Apply any overrides LAST (so they override defaults)
      ...overrides,
    };

    addShapeSync(newShape);
    // Save to history after adding shape - use setTimeout with validation
    setTimeout(() => {
      // Validate that the shape was actually added before saving to history
      if (shapes.some(shape => shape.id === newShape.id)) {
        pushState();
      } else {
        console.log('⚠️ [ProjectCanvasContext] Shape not found after add, retrying pushState');
        setTimeout(() => pushState(), 50);
      }
    }, 10);
  };

  const updateShape = (id: string, updates: Partial<Shape>) => {
    if (!projectId || !canvasId) {
      console.error('Cannot update shape: no project canvas selected');
      return;
    }

    updateShapeSync(id, updates);
    // Save to history after updating shape - use setTimeout with validation
    setTimeout(() => {
      // Validate that the shape was actually updated before saving to history
      const updatedShape = shapes.find(shape => shape.id === id);
      if (updatedShape) {
        pushState();
      } else {
        console.log('⚠️ [ProjectCanvasContext] Shape not found after update, retrying pushState');
        setTimeout(() => pushState(), 50);
      }
    }, 10);
  };

  const updateSelectedShapes = (updates: Partial<Shape>) => {
    if (!projectId || !canvasId) {
      console.error('Cannot update selected shapes: no project canvas selected');
      return;
    }

    if (selectedIds.length === 0) return;

    const updatedShapes = shapes.map(shape =>
      selectedIds.includes(shape.id)
        ? { ...shape, ...updates }
        : shape
    );

    updateShapesSync(updatedShapes);
    // Save to history after updating shapes with a small delay to ensure state is updated
    setTimeout(() => {
      pushState();
    }, 10);
  };

  const batchUpdateShapes = (updates: Array<{ id: string; updates: Partial<Shape> }>) => {
    if (!projectId || !canvasId) {
      console.error('Cannot batch update shapes: no project canvas selected');
      return;
    }

    const updatedShapes = shapes.map(shape => {
      const update = updates.find(u => u.id === shape.id);
      return update ? { ...shape, ...update.updates } : shape;
    });

    updateShapesSync(updatedShapes);
    // Save to history after updating shapes with a small delay to ensure state is updated
    setTimeout(() => {
      pushState();
    }, 10);
  };

  const deleteShape = (id: string) => {
    if (!projectId || !canvasId) {
      console.error('Cannot delete shape: no project canvas selected');
      return;
    }

    deleteShapeSync(id);
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    // Save to history after deleting shape with a small delay to ensure state is updated
    setTimeout(() => {
      pushState();
    }, 10);
  };

  const deleteSelectedShapes = async () => {
    if (!projectId || !canvasId) {
      console.error('Cannot delete selected shapes: no project canvas selected');
      return;
    }

    if (selectedIds.length === 0) return;

    // Delete all selected shapes
    for (const id of selectedIds) {
      await deleteShapeSync(id);
    }

    setSelectedIds([]);
    // Save to history after deleting shapes with a small delay to ensure state is updated
    setTimeout(() => {
      pushState();
    }, 10);
  };

  const selectShape = async (id: string | null, addToSelection = false) => {
    if (!id) {
      // Clear selection and unlock all shapes
      selectedIds.forEach(sid => unlockShapeSync(sid));
      setSelectedIds([]);
      return;
    }

    if (addToSelection) {
      // Cmd/Ctrl+Click: toggle shape in selection
      if (selectedIds.includes(id)) {
        // Remove from selection and unlock
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
    if (!projectId || !canvasId) {
      console.error('Cannot lock shape: no project canvas selected');
      return false;
    }

    try {
      await lockShapeSync(id);
      console.log('🔒 [lockShape] Shape locked in project canvas:', { projectId, canvasId, id });
      return true;
    } catch (error) {
      console.error('Failed to lock shape in project canvas:', error);
      return false;
    }
  };

  const unlockShape = (id: string) => {
    if (!projectId || !canvasId) {
      console.error('Cannot unlock shape: no project canvas selected');
      return;
    }

    unlockShapeSync(id);
    console.log('🔓 [unlockShape] Shape unlocked in project canvas:', { projectId, canvasId, id });
  };

  // Z-index operations
  const bringToFront = () => {
    if (selectedIds.length === 0) return;

    const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0));
    const updates = selectedIds.map((id, index) => ({
      id,
      updates: { zIndex: maxZIndex + index + 1 }
    }));

    batchUpdateShapes(updates);
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;

    const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0));
    const updates = selectedIds.map((id, index) => ({
      id,
      updates: { zIndex: minZIndex - index - 1 }
    }));

    batchUpdateShapes(updates);
  };

  const bringForward = () => {
    if (selectedIds.length === 0) return;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { zIndex: (shape?.zIndex || 0) + 1 }
      };
    });

    batchUpdateShapes(updates);
  };

  const sendBackward = () => {
    if (selectedIds.length === 0) return;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { zIndex: Math.max((shape?.zIndex || 0) - 1, 0) }
      };
    });

    batchUpdateShapes(updates);
  };

  // Canvas operations
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

  const panToPosition = (canvasX: number, canvasY: number) => {
    console.log('🎯 [ProjectCanvasContext] panToPosition called with:', { canvasX, canvasY, currentScale: scale });
    
    // Get viewport center
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    // Calculate new stage position to center the target point
    const newX = viewportCenterX - canvasX * scale;
    const newY = viewportCenterY - canvasY * scale;
    
    console.log('🎯 [ProjectCanvasContext] Calculated new position:', { newX, newY, viewportCenterX, viewportCenterY });
    
    // Force update the position state
    setPositionState({ x: newX, y: newY });
    
    // Also try to update the stage directly if available
    if (stageRef.current) {
      console.log('🎯 [ProjectCanvasContext] Updating stage position directly');
      stageRef.current.position({ x: newX, y: newY });
      stageRef.current.batchDraw();
      
      // Force a redraw to ensure the position change is visible
      setTimeout(() => {
        if (stageRef.current) {
          stageRef.current.batchDraw();
          console.log('🎯 [ProjectCanvasContext] Forced redraw completed');
        }
      }, 10);
    } else {
      console.log('❌ [ProjectCanvasContext] stageRef.current is null');
    }
    
    console.log('✅ [ProjectCanvasContext] Position updated');
  };

  // Alignment operations
  const alignLeft = () => {
    if (selectedIds.length < 2) return;

    const leftmostX = Math.min(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return shape?.x || 0;
    }));

    updateSelectedShapes({ x: leftmostX });
  };

  const alignRight = () => {
    if (selectedIds.length < 2) return;

    const rightmostX = Math.max(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return (shape?.x || 0) + (shape?.width || 0);
    }));

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { x: rightmostX - (shape?.width || 0) }
      };
    });

    batchUpdateShapes(updates);
  };

  const alignCenter = () => {
    if (selectedIds.length < 2) return;

    const centerX = selectedIds.reduce((sum, id) => {
      const shape = shapes.find(s => s.id === id);
      return sum + (shape?.x || 0) + (shape?.width || 0) / 2;
    }, 0) / selectedIds.length;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { x: centerX - (shape?.width || 0) / 2 }
      };
    });

    batchUpdateShapes(updates);
  };

  const alignTop = () => {
    if (selectedIds.length < 2) return;

    const topmostY = Math.min(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return shape?.y || 0;
    }));

    updateSelectedShapes({ y: topmostY });
  };

  const alignBottom = () => {
    if (selectedIds.length < 2) return;

    const bottommostY = Math.max(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return (shape?.y || 0) + (shape?.height || 0);
    }));

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { y: bottommostY - (shape?.height || 0) }
      };
    });

    batchUpdateShapes(updates);
  };

  const alignMiddle = () => {
    if (selectedIds.length < 2) return;

    const centerY = selectedIds.reduce((sum, id) => {
      const shape = shapes.find(s => s.id === id);
      return sum + (shape?.y || 0) + (shape?.height || 0) / 2;
    }, 0) / selectedIds.length;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { y: centerY - (shape?.height || 0) / 2 }
      };
    });

    batchUpdateShapes(updates);
  };

  // Grouping operations
  const groupShapes = (groupName?: string) => {
    if (selectedIds.length < 2) return;

    try {
      // First, unlock all selected shapes to allow grouping
      const unlockedShapes = shapes.map(shape => 
        selectedIds.includes(shape.id) 
          ? { ...shape, isLocked: false, lockedBy: null, lockedAt: null }
          : shape
      );
      
      const { group, updatedShapes } = createGroup(selectedIds, unlockedShapes, groupName);
      
      // Update shapes with unlocked versions
      updateShapesSync(updatedShapes);
      
      // Add group to groups array
      setGroups(prev => [...prev, group]);
      
      // Select the new group
      setSelectedIds([group.id]);
      
      // Save to history
      setTimeout(() => pushState(), 10);
      
      console.log('✅ [ProjectCanvasContext] Shapes grouped successfully', { 
        groupId: group.id, 
        groupName: group.name, 
        childCount: group.children.length 
      });
    } catch (error) {
      console.error('❌ [ProjectCanvasContext] Failed to group shapes:', error);
    }
  };

  const ungroupShapes = () => {
    if (selectedIds.length !== 1) return;
    
    const selectedGroup = groups.find(g => g.id === selectedIds[0]);
    if (!selectedGroup) return;

    try {
      const { updatedShapes, remainingGroups } = ungroupGroup(selectedGroup.id, groups, shapes);
      
      // Update shapes
      updateShapesSync(updatedShapes);
      
      // Update groups array
      setGroups(remainingGroups);
      
      // Select the ungrouped shapes
      setSelectedIds(selectedGroup.children);
      
      // Save to history
      setTimeout(() => pushState(), 10);
      
      console.log('✅ [ProjectCanvasContext] Group ungrouped successfully', { 
        groupId: selectedGroup.id, 
        ungroupedShapes: selectedGroup.children.length 
      });
    } catch (error) {
      console.error('❌ [ProjectCanvasContext] Failed to ungroup shapes:', error);
    }
  };

  const renameGroup = (groupId: string, newName: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, name: newName, lastModifiedAt: Date.now() }
        : group
    ));
    
    console.log('✅ [ProjectCanvasContext] Group renamed', { groupId, newName });
  };

  const value: ProjectCanvasContextType = {
    // Canvas state
    shapes,
    groups,
    selectedIds,
    stageRef,
    loading,
    error,
    
    // Project info
    projectId,
    canvasId,
    currentCanvas: null, // TODO: Implement currentCanvas state
    projectCanvases: [], // TODO: Implement projectCanvases state
    createCanvas: async (name: string) => { console.log('createCanvas not implemented:', name); },
    updateCanvas: async (id: string, updates: any) => { console.log('updateCanvas not implemented:', id, updates); },
    deleteCanvas: async (id: string) => { console.log('deleteCanvas not implemented:', id); },
    duplicateCanvas: async (id: string) => { console.log('duplicateCanvas not implemented:', id); },
    
    // Zoom and pan state
    scale,
    position,
    
    // Shape operations
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
    
    // Locking operations
    lockShape,
    unlockShape,
    
    // Z-index operations
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    
    // Canvas operations
    setScale,
    setPosition,
    resetView,
    panToPosition,
    
    // History operations
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    pushState,
    forceSave,
    
    // Alignment operations
    alignLeft,
    alignRight,
    alignCenter,
    alignTop,
    alignBottom,
    alignMiddle,
    
    // Grouping operations
    groupShapes,
    ungroupShapes,
    renameGroup,
    
    // Project canvas operations
    setCurrentCanvas,
    clearCurrentCanvas,
    refreshCanvas,
    clearError,
  };

  return (
    <ProjectCanvasContext.Provider value={value}>
      {children}
    </ProjectCanvasContext.Provider>
  );
}

export function useProjectCanvas() {
  const context = useContext(ProjectCanvasContext);
  if (!context) {
    throw new Error('useProjectCanvas must be used within a ProjectCanvasProvider');
  }
  return context;
}

export default ProjectCanvasContext;