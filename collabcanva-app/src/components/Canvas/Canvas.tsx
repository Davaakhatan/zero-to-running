import { useEffect, useCallback, useState, useRef } from "react";
import { Stage, Layer, Rect, Transformer } from "react-konva";
import type Konva from "konva";
import { useProjectCanvas } from "../../contexts/ProjectCanvasContext";
import { useCursors } from "../../hooks/useCursors";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import Shape from "./Shape";
import Cursor from "../Collaboration/Cursor";
import PresenceList from "../Collaboration/PresenceList";
import EmptyState from "./EmptyState";
import TextFormatting from "./TextFormatting";
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED } from "../../utils/constants";
import { clamp } from "../../utils/helpers";

interface CanvasProps {
  onShowHelp?: () => void;
  projectId?: string;
  canvasId?: string;
}

export default function Canvas({ onShowHelp, projectId: propProjectId, canvasId: propCanvasId }: CanvasProps) {
  const {
    shapes,
    selectedIds,
    stageRef,
    loading,
    scale,
    position,
    setScale,
    setPosition,
    selectShape,
    selectShapes,
    clearSelection,
    deleteSelectedShapes,
    updateShape,
    batchUpdateShapes,
    addShape,
    panToPosition,
    projectId: contextProjectId,
    canvasId: contextCanvasId,
  } = useProjectCanvas();

  // Use props if available, fallback to context
  const projectId = propProjectId || contextProjectId;
  const canvasId = propCanvasId || contextCanvasId;

  // Responsive stage size
  const [stageSize, setStageSize] = useState({ 
    w: window.innerWidth, 
    h: window.innerHeight 
  });

  useEffect(() => {
    const onResize = () => {
      setStageSize({ 
        w: window.innerWidth, 
        h: window.innerHeight 
      });
    };
    
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { cursors, updateCursor } = useCursors(projectId, canvasId);
  const { user } = useAuth();
  const { theme } = useTheme();
  const [hasInteracted, setHasInteracted] = useState(false);
  
  console.log('🖼️ [Canvas] Initializing with:', { 
    propProjectId, 
    propCanvasId, 
    contextProjectId, 
    contextCanvasId,
    finalProjectId: projectId,
    finalCanvasId: canvasId,
    cursorsCount: Object.keys(cursors).length 
  });

  // Debug useCursors call
  console.log('🎯 [Canvas] About to call useCursors with:', { projectId, canvasId });
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [textareaPosition, setTextareaPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Box selection state
  const [selectionBox, setSelectionBox] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Group transformer for multi-select
  const layerRef = useRef<Konva.Layer>(null);
  const groupTransformerRef = useRef<Konva.Transformer>(null);
  const isTransformingRef = useRef(false); // Track if currently transforming
  // const initialShapeStatesRef = useRef<Map<string, any>>(new Map()); // Store initial states before transform
  const rafIdRef = useRef<number | null>(null); // For throttling onTransform

  // Handle text editing start
  const handleStartEditText = useCallback((shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || shape.type !== 'text' || !stageRef.current) return;
    
    // Calculate screen position from canvas position
    const stage = stageRef.current;
    const scaleVal = stage.scaleX();
    const stageBox = stage.container().getBoundingClientRect();
    
    const screenX = stageBox.left + shape.x * scaleVal + stage.x();
    const screenY = stageBox.top + shape.y * scaleVal + stage.y();
    const screenWidth = shape.width * scaleVal;
    const screenHeight = shape.height * scaleVal;
    
    setTextareaPosition({
      x: screenX,
      y: screenY,
      width: Math.max(200, screenWidth),
      height: Math.max(50, screenHeight)
    });
    
    setEditText(shape.text || '');
    setEditingTextId(shapeId);
  }, [shapes, stageRef]);

  // Handle zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate new scale
      const scaleBy = 1 + ZOOM_SPEED;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = clamp(newScale, MIN_ZOOM, MAX_ZOOM);

      // Calculate new position to zoom towards cursor
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setScale(clampedScale);
      setPosition(newPos);
    },
    [stageRef, setScale, setPosition]
  );

  // Handle stage drag (pan)
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // Only update position if we're dragging the stage itself, not a shape
      if (e.target === e.target.getStage()) {
        setPosition({
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [setPosition]
  );

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert screen coordinates to canvas coordinates (world space)
      const canvasX = (pointer.x - position.x) / scale;
      const canvasY = (pointer.y - position.y) / scale;

      // Update cursor position with canvas coordinates (throttled in hook)
      updateCursor(canvasX, canvasY);
      
      // Mark as interacted
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    },
    [stageRef, updateCursor, hasInteracted, position, scale]
  );

  // Attach group transformer to all selected shapes (for multi-select transform)
  useEffect(() => {
    const tr = groupTransformerRef.current;
    const layer = layerRef.current;
    
    if (!tr || !layer) return;
    
    if (selectedIds.length < 2) {
      tr.nodes([]);
      layer.batchDraw();
      return;
    }
    
    // Use requestAnimationFrame to ensure shapes are mounted
    requestAnimationFrame(() => {
      const nodes = selectedIds
        .map(id => layer.findOne('#' + id))
        .filter(Boolean) as Konva.Node[];
      
      console.debug('[GroupTR] nodes=', selectedIds);
      tr.nodes(nodes);
      layer.batchDraw();
    });
  }, [selectedIds]);

  const handleAddFirstShape = () => {
    addShape('rectangle', { x: CANVAS_WIDTH / 2 - 50, y: CANVAS_HEIGHT / 2 - 50 });
    setHasInteracted(true);
  };

  // Handle clicking on a user in the presence list to jump to their cursor
  const handleUserClick = useCallback(
    (userId: string, cursorX: number, cursorY: number) => {
      console.log(`Panning to user ${userId} at canvas position:`, cursorX, cursorY);
      panToPosition(cursorX, cursorY);
    },
    [panToPosition]
  );

  // Handle box selection start
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only start box selection if clicking on stage (not on a shape)
      if (e.target !== e.target.getStage()) return;
      
      const stage = stageRef.current;
      if (!stage) return;
      
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
      
      // Convert screen coordinates to canvas coordinates
      const canvasX = (pointerPos.x - position.x) / scale;
      const canvasY = (pointerPos.y - position.y) / scale;
      
      selectionStartRef.current = { x: canvasX, y: canvasY };
      setSelectionBox({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
    },
    [position, scale, stageRef]
  );

  // Handle box selection update
  const handleStageMouseMove = useCallback(
    () => {
      if (!selectionStartRef.current) return;
      
      const stage = stageRef.current;
      if (!stage) return;
      
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
      
      // Convert screen coordinates to canvas coordinates
      const canvasX = (pointerPos.x - position.x) / scale;
      const canvasY = (pointerPos.y - position.y) / scale;
      
      setSelectionBox({
        x1: selectionStartRef.current.x,
        y1: selectionStartRef.current.y,
        x2: canvasX,
        y2: canvasY,
      });
    },
    [position, scale, stageRef]
  );

  // Handle box selection end
  const handleStageMouseUp = useCallback(
    async () => {
      if (!selectionBox || !selectionStartRef.current) {
        selectionStartRef.current = null;
        setSelectionBox(null);
        return;
      }
      
      // Calculate selection box bounds
      const x1 = Math.min(selectionBox.x1, selectionBox.x2);
      const y1 = Math.min(selectionBox.y1, selectionBox.y2);
      const x2 = Math.max(selectionBox.x1, selectionBox.x2);
      const y2 = Math.max(selectionBox.y1, selectionBox.y2);
      
      // If box is too small (< 5px), treat as a click to deselect
      if (Math.abs(x2 - x1) < 5 && Math.abs(y2 - y1) < 5) {
        clearSelection();
      } else {
        // Find shapes that intersect with selection box
        const shapesInBox = shapes.filter((shape) => {
          const shapeX1 = shape.x;
          const shapeY1 = shape.y;
          const shapeX2 = shape.x + shape.width;
          const shapeY2 = shape.y + shape.height;
          
          // Check if rectangles intersect
          return !(x2 < shapeX1 || x1 > shapeX2 || y2 < shapeY1 || y1 > shapeY2);
        });
        
        // Select ALL shapes in the box (multi-select!) - AWAIT the async function
        if (shapesInBox.length > 0) {
          await selectShapes(shapesInBox.map(s => s.id));
        } else {
          clearSelection();
        }
      }
      
      // Clear selection box
      selectionStartRef.current = null;
      setSelectionBox(null);
    },
    [selectionBox, shapes, selectShapes, clearSelection]
  );

  // Handle clicking on empty canvas (keep for compatibility)
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Deselect when clicking on empty area
      if (e.target === e.target.getStage()) {
        selectShape(null);
      }
    },
    [selectShape]
  );

  // Log selectedIds whenever it changes
  useEffect(() => {
    console.log('🎯 [selectedIds CHANGED]:', selectedIds);
  }, [selectedIds]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input or textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      // Delete/Backspace - delete all selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && !isTyping) {
        // Prevent default backspace navigation
        e.preventDefault();
        
        console.log('[Delete] Attempting to delete shapes:', selectedIds);
        
        // Check if any shape is locked by another user
        const lockedByOthers = selectedIds.some(id => {
          const shape = shapes.find(s => s.id === id);
          return shape && shape.isLocked && shape.lockedBy !== (user as any)?.uid;
        });
        
        if (lockedByOthers) {
          console.warn('Cannot delete: one or more shapes are locked by other users');
          return;
        }
        
        deleteSelectedShapes().catch(console.error);
      }
      
      // Duplicate (Cmd/Ctrl + D) - duplicate first selected shape
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        const shape = shapes.find(s => s.id === selectedIds[0]);
        if (shape) {
          addShape(shape.type, {
            x: shape.x + 20,
            y: shape.y + 20,
            width: shape.width,
            height: shape.height,
            fill: shape.fill,
            rotation: shape.rotation,
            text: shape.text,
            fontSize: shape.fontSize,
            fontFamily: shape.fontFamily,
          });
        }
      }
      
      // Select All (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        // Select all shapes - must be async since selectShapes is async
        if (shapes.length > 0) {
          (async () => {
            await selectShapes(shapes.map(s => s.id));
          })();
        }
      }
      
      // Arrow keys for moving selected shapes
      if (selectedIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isTyping) {
        e.preventDefault();
        
        console.log('[Arrow Keys] Moving shapes:', selectedIds);
        
        // Check if any shape is locked by another user
        const lockedByOthers = selectedIds.some(id => {
          const shape = shapes.find(s => s.id === id);
          return shape && shape.isLocked && shape.lockedBy !== (user as any)?.uid;
        });
        
        if (lockedByOthers) {
          console.warn('Cannot move: one or more shapes are locked by other users');
          return;
        }
        
        const moveDistance = e.shiftKey ? 10 : 1; // Shift = 10px, normal = 1px
        
        // Collect all updates first, then batch them
        const updates = selectedIds.map(id => {
          const shape = shapes.find(s => s.id === id);
          console.log('[Arrow Keys] Moving shape:', id, shape ? `(${shape.x}, ${shape.y})` : 'NOT FOUND');
          if (!shape) return null;
          
          let newX = shape.x;
          let newY = shape.y;
          
          switch (e.key) {
            case 'ArrowUp':
              newY -= moveDistance;
              break;
            case 'ArrowDown':
              newY += moveDistance;
              break;
            case 'ArrowLeft':
              newX -= moveDistance;
              break;
            case 'ArrowRight':
              newX += moveDistance;
              break;
          }
          
          console.log('[Arrow Keys] Will update shape', id, 'to:', { x: newX, y: newY });
          return { id, updates: { x: newX, y: newY } };
        }).filter((u): u is { id: string; updates: { x: number; y: number } } => u !== null);
        
        // Batch update all shapes at once
        console.log('[Arrow Keys] 🚀 Batch updating', updates.length, 'shapes');
        batchUpdateShapes(updates);
        console.log('[Arrow Keys] ✅ All shapes updated. selectedIds after updates:', selectedIds);
      }
      
      // Z-index shortcuts - apply to all selected shapes
      if (selectedIds.length > 0 && (e.metaKey || e.ctrlKey)) {
        if (e.key === ']' && !e.shiftKey) {
          e.preventDefault();
          // Bring to front
          const maxZ = Math.max(...shapes.map(s => s.zIndex || 0), 0);
          selectedIds.forEach((id, index) => {
            updateShape(id, { zIndex: maxZ + 1 + index });
          });
        } else if (e.key === '[' && !e.shiftKey) {
          e.preventDefault();
          // Send to back
          const minZ = Math.min(...shapes.map(s => s.zIndex || 0), 0);
          selectedIds.forEach((id, index) => {
            updateShape(id, { zIndex: minZ - 1 - (selectedIds.length - 1 - index) });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, shapes, deleteSelectedShapes, addShape, selectShapes, updateShape, user]);

  // Update stage scale and position
  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: scale, y: scale });
      stage.position(position);
      stage.batchDraw();
    }
  }, [scale, position]);

  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading canvas...</p>
          <p className="text-xs text-gray-400">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }
  
  console.log('Canvas loaded:', { shapesCount: shapes.length, loading });

  const showEmptyState = shapes.length === 0 && !hasInteracted;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Konva Canvas */}
      <Stage
        ref={stageRef}
        width={stageSize.w}
        height={stageSize.h}
        draggable
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseDown={handleStageMouseDown}
        onMouseMove={() => {
          handleMouseMove();
          handleStageMouseMove();
        }}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer ref={layerRef}>
          {/* Canvas background - showing bounded area */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill={theme === 'dark' ? '#1e293b' : '#ffffff'}
            listening={false}
          />
          
          {/* Canvas border */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke={theme === 'dark' ? '#475569' : '#e0e0e0'}
            strokeWidth={2}
            listening={false}
          />

          {/* Render shapes (sorted by z-index) */}
          {[...shapes]
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={selectedIds.includes(shape.id)}
                showTransformer={selectedIds.length === 1} // Only show individual transformer for single selection
                isDraggable={true} // Always allow individual dragging
                listening={true} // Must be true for transformer to work!
                projectId={projectId}
                canvasId={canvasId}
                onSelect={(e?: any) => {
                  // Check for Cmd/Ctrl key for multi-select
                  const addToSelection = e?.evt?.metaKey || e?.evt?.ctrlKey || false;
                  console.log('🎯 [Canvas] Shape clicked:', { shapeId: shape.id, addToSelection, currentSelectedIds: selectedIds });
                  selectShape(shape.id, addToSelection);
                }}
                onChange={(updates) => {
                  if (selectedIds.length > 1 && selectedIds.includes(shape.id)) {
                    // Multi-select dragging: move all selected shapes by the same delta
                    const currentShape = shapes.find(s => s.id === shape.id);
                    if (currentShape && updates.x !== undefined && updates.y !== undefined) {
                      const deltaX = updates.x - currentShape.x;
                      const deltaY = updates.y - currentShape.y;
                      
                      const multiUpdates = selectedIds.map(id => ({
                        id,
                        updates: {
                          x: shapes.find(s => s.id === id)!.x + deltaX,
                          y: shapes.find(s => s.id === id)!.y + deltaY,
                        }
                      }));
                      
                      batchUpdateShapes(multiUpdates);
                    } else {
                      updateShape(shape.id, updates);
                    }
                  } else {
                    // Single selection or non-selected shape
                    updateShape(shape.id, updates);
                  }
                }}
                onStartEditText={handleStartEditText}
              />
            ))}

          {/* Render selection box */}
          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.x1, selectionBox.x2)}
              y={Math.min(selectionBox.y1, selectionBox.y2)}
              width={Math.abs(selectionBox.x2 - selectionBox.x1)}
              height={Math.abs(selectionBox.y2 - selectionBox.y1)}
              fill="rgba(0, 102, 255, 0.1)"
              stroke="#0066FF"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Group transformer for multi-select */}
          {selectedIds.length > 1 && (
            <Transformer
              ref={groupTransformerRef}
              rotateEnabled={true}
              resizeEnabled={true}
              ignoreStroke={true}
              keepRatio={false}
              anchorSize={10}
              anchorCornerRadius={5}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              draggable={false}
              onTransformStart={() => {
                console.log('[Group Transform] Transform started');
                isTransformingRef.current = true;
              }}
              onTransform={() => {
                // Throttle with requestAnimationFrame to avoid excessive state churn
                if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = requestAnimationFrame(() => {
                  const tr = groupTransformerRef.current!;
                  const nodes = tr.nodes();
                  
                  const updates = nodes.map(n => {
                    const s = shapes.find(x => x.id === n.id());
                    if (!s) return null;
                    
                    const sx = n.scaleX(), sy = n.scaleY(), rot = n.rotation();
                    const w = Math.max(5, s.width * sx), h = Math.max(5, s.height * sy);
                    
                    // Get the current position from the node (same as single shape logic)
                    let x = n.x(), y = n.y();
                    
                    // Reset scale but keep rotation for visual feedback (same as single shape logic)
                    n.scaleX(1); 
                    n.scaleY(1); 
                    
                    return { id: s.id, updates: { x, y, width: w, height: h, rotation: rot } };
                  }).filter(Boolean) as any[];
                  
                  batchUpdateShapes(updates);
                  tr.getLayer()?.batchDraw();
                });
              }}
              onTransformEnd={() => {
                isTransformingRef.current = false;
                console.log('[Group Transform] Transform ended - final commit');
                
                // Final commit with same logic as onTransform (same as single shape logic)
                const tr = groupTransformerRef.current!;
                const updates = tr.nodes().map(n => {
                  const s = shapes.find(x => x.id === n.id());
                  if (!s) return null;
                  
                  const sx = n.scaleX(), sy = n.scaleY(), rot = n.rotation();
                  const w = Math.max(5, s.width * sx), h = Math.max(5, s.height * sy);
                  
                  // Get the current position from the node (same as single shape logic)
                  let x = n.x(), y = n.y();
                  
                  // Reset scale and rotation (same as single shape logic)
                  n.scaleX(1); 
                  n.scaleY(1); 
                  n.rotation(0);
                  
                  return { id: s.id, updates: { x, y, width: w, height: h, rotation: rot } };
                }).filter(Boolean) as any[];
                
                batchUpdateShapes(updates);
              }}
            />
          )}
        </Layer>
      </Stage>

      {/* Render other users' cursors */}
      {Object.entries(cursors).map(([userId, cursor]) => {
        // Transform canvas coordinates to screen coordinates
        const screenX = (cursor.cursorX * scale) + position.x;
        const screenY = (cursor.cursorY * scale) + position.y;
        
        return (
          <Cursor
            key={userId}
            x={screenX}
            y={screenY}
            color={cursor.cursorColor}
            name={cursor.displayName}
          />
        );
      })}

      {/* Draggable Presence List - Removed: Now rendered in ProjectCanvasPage */}
      {/* <PresenceList cursors={cursors} onUserClick={handleUserClick} /> */}

      {/* Empty State */}
      {showEmptyState && (
        <EmptyState
          onAddShape={handleAddFirstShape}
          onShowHelp={() => onShowHelp?.()}
        />
      )}

      {/* Text Editing Overlay */}
      {editingTextId && (
        <div
          style={{
            position: 'fixed',
            top: `${textareaPosition.y}px`,
            left: `${textareaPosition.x}px`,
            width: `${textareaPosition.width}px`,
            minHeight: `${textareaPosition.height}px`,
            zIndex: 10000,
          }}
        >
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => {
              if (editingTextId) {
                updateShape(editingTextId, { text: editText });
                setEditingTextId(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditingTextId(null);
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                if (editingTextId) {
                  updateShape(editingTextId, { text: editText });
                  setEditingTextId(null);
                }
              }
            }}
            style={{
              width: '100%',
              minHeight: '100%',
              fontSize: `${((shapes.find(s => s.id === editingTextId)?.fontSize || 16) * scale)}px`,
              fontFamily: shapes.find(s => s.id === editingTextId)?.fontFamily || 'Arial',
              fontStyle: shapes.find(s => s.id === editingTextId)?.fontStyle || 'normal',
              fontWeight: shapes.find(s => s.id === editingTextId)?.fontWeight || 'normal',
              textDecoration: shapes.find(s => s.id === editingTextId)?.textDecoration || 'none',
              color: shapes.find(s => s.id === editingTextId)?.fill || '#000000',
              background: 'rgba(255, 255, 255, 0.98)',
              border: '3px solid #0066FF',
              borderRadius: '6px',
              padding: '8px',
              resize: 'none',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          />
        </div>
      )}

      {/* Text Formatting Toolbar */}
      {selectedIds.length === 1 && shapes.find(s => s.id === selectedIds[0])?.type === 'text' && !editingTextId && (
        <TextFormatting selectedShapeId={selectedIds[0]} />
      )}
    </div>
  );
}

