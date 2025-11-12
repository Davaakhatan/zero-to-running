import { useEffect, useRef } from "react";
import { Rect, Circle, Ellipse, Line, Text, Transformer, Star, RegularPolygon, Path, Image } from "react-konva";
import type Konva from "konva";
import { useAuth } from "../../contexts/AuthContext";
import { useCursors } from "../../hooks/useCursors";
import { createGradientFromShape } from "../../utils/gradientUtils";
import type { Shape as ShapeType } from "../../contexts/CanvasContext";

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  onSelect: (e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<ShapeType>) => void;
  onStartEditText?: (shapeId: string) => void;
  showTransformer?: boolean; // Only show transformer if single selection
  isDraggable?: boolean; // Allow disabling drag for group transforms
  listening?: boolean; // Allow disabling events for group transforms
  projectId?: string;
  canvasId?: string;
}

export default function Shape({ shape, isSelected, onSelect, onChange, onStartEditText, showTransformer = true, isDraggable = true, listening = true, projectId, canvasId }: ShapeProps) {
  const { user } = useAuth();
  const { cursors } = useCursors(projectId || '', canvasId || '');
  const shapeRef = useRef<any>(null); // Can be Rect, Circle, Line, or Text
  const transformerRef = useRef<Konva.Transformer>(null);
  const hasLockedRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTransformingRef = useRef(false); // Track if this shape is being transformed
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Check if locked by someone else
  const userId = (user as any)?.uid || null;
  
  // Consider locked by other only if locked and not by me (no timer-based auto-unlock)
  const isLockedByOther = shape.isLocked && shape.lockedBy !== userId;

  // Load image for image shapes
  useEffect(() => {
    if (shape.type === 'image' && shape.imageUrl && !imageRef.current) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        // Force re-render by updating the shape
        onChange({});
      };
      img.onerror = () => {
        console.error('Failed to load image:', shape.imageUrl);
      };
      img.src = shape.imageUrl;
    }
  }, [shape.type, shape.imageUrl, onChange]);

  // Lock is now handled in selectShape/selectShapes functions
  // This effect just resets the lock ref when deselected
  useEffect(() => {
    // Reset lock ref when deselected
    if (!isSelected) {
      hasLockedRef.current = false;
    }
  }, [isSelected]);

  // Update shape node properties from React props, but ONLY when not transforming
  useEffect(() => {
    const node = shapeRef.current;
    if (!node || isTransformingRef.current) return;
    
    // Update node properties to match React props
    node.x(shape.x);
    node.y(shape.y);
    node.rotation(shape.rotation || 0);
    // DO NOT reset scale here - only in onTransformEnd for single selection
    
    node.getLayer()?.batchDraw();
  }, [shape.x, shape.y, shape.width, shape.height, shape.rotation]);

  // Separate effect for transformer attachment to ensure it always updates
  useEffect(() => {
    console.log('[Shape Transformer] Effect triggered:', {
      shapeId: shape.id,
      isSelected,
      isLockedByOther,
      showTransformer,
      hasTransformerRef: !!transformerRef.current,
      hasShapeRef: !!shapeRef.current
    });
    
    if (isSelected && showTransformer && transformerRef.current && shapeRef.current) {
      // Attach transformer to the shape
      console.log('[Shape Transformer] ✅ Attaching transformer to shape:', shape.id);
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      console.log('[Shape Transformer] ❌ Not attaching transformer:', {
        isSelected,
        showTransformer,
        hasTransformerRef: !!transformerRef.current,
        hasShapeRef: !!shapeRef.current,
        isLocked: shape.isLocked,
        lockedBy: shape.lockedBy,
        currentUserId: userId
      });
    }
  }, [isSelected, isLockedByOther, shape.id, showTransformer]); // Added showTransformer to dependencies

  // Handle mouse/touch down to track starting position
  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Only use click detection if shape is NOT already selected
    // If already selected, let normal drag behavior work
    if (!isSelected) {
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          mouseDownPosRef.current = { x: pointerPos.x, y: pointerPos.y };
        }
      }
    }
  };

  // Handle mouse/touch up to detect clicks (even with slight movement)
  const handlePointerUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!mouseDownPosRef.current) {
      return;
    }

    // PREVENT selection if locked by another user (but allow current user to select their own locked shapes)
    if (isLockedByOther) {
      console.warn('Shape is locked by another user, cannot select');
      mouseDownPosRef.current = null;
      return;
    }

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Calculate distance moved
    const dx = pointerPos.x - mouseDownPosRef.current.x;
    const dy = pointerPos.y - mouseDownPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved less than 5 pixels, treat as a click/selection
    if (distance < 5) {
      console.log('Shape clicked (with tolerance):', shape.id);
      onSelect(e); // Pass event to check for Cmd/Ctrl key
    }

    mouseDownPosRef.current = null;
  };

  const handleDragStart = async () => {
    // Shape is already locked when selected, no need to lock again
    // Clear mousedown position since we're now dragging
    mouseDownPosRef.current = null;
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    // All shapes now use top-left coordinates consistently
    // Reset the node position to match our coordinate system
    e.target.x(newX);
    e.target.y(newY);
    
    onChange({
      x: newX,
      y: newY,
    });
    // Don't unlock here - will unlock when deselected
  };

  const handleTransformStart = async () => {
    // Set flag to prevent React from overwriting during transformation
    isTransformingRef.current = true;
    console.log('[Shape Transform] Started for:', shape.id);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    
    console.log('[Shape Transform] Ended for:', shape.id);
    isTransformingRef.current = false;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale and apply it to width/height (only for single selection)
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(5, node.width() * scaleX);
    const newHeight = Math.max(5, node.height() * scaleY);
    
    let newX = node.x();
    let newY = node.y();
    
    // All shapes now use top-left coordinates consistently
    // No coordinate conversion needed

    onChange({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      rotation: rotation,
    });
    
    // Don't unlock here - will unlock when deselected
  };

  // Determine stroke color based on selection and lock state
  let strokeColor = undefined;
  let strokeWidth = 0;
  
  if (isSelected) {
    // Blue border when selected by me (I'm actively using it)
    strokeColor = '#0066FF';
    strokeWidth = 2;
  } else if (isLockedByOther) {
    // Red border when locked by someone else (they're using it)
    strokeColor = '#FF3333';
    strokeWidth = 2;
  }
  // No border when not selected and not locked = anyone can use it

  // Create gradient if shape has gradient properties
  const gradient = shape.gradientType ? createGradientFromShape(
    shapeRef.current?.getStage() || null as any,
    shape
  ) : null;

  // Common props for all shapes
  const commonProps = {
    id: shape.id, // Real ID for Konva node selection
    ref: shapeRef,
    draggable: !isLockedByOther && isDraggable, // Respect isDraggable prop
    listening: listening, // Respect listening prop for group transforms
    onMouseDown: handlePointerDown,
    onMouseUp: handlePointerUp,
    onTouchStart: handlePointerDown,
    onTouchEnd: handlePointerUp,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTransformStart: handleTransformStart,
    onTransformEnd: handleTransformEnd,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    strokeDashArray: shape.strokeDashArray,
    strokeLineCap: shape.strokeLineCap,
    strokeLineJoin: shape.strokeLineJoin,
    cornerRadius: shape.cornerRadius,
    shadowColor: shape.shadowColor,
    shadowBlur: shape.shadowBlur,
    shadowOffsetX: shape.shadowOffsetX,
    shadowOffsetY: shape.shadowOffsetY,
    shadowOpacity: shape.shadowOpacity,
    opacity: isLockedByOther ? 0.6 : (shape.opacity || 1),
    blendMode: shape.blendMode || 'normal',
    fill: gradient || shape.fill, // Use gradient if available, otherwise use solid color
  };

  // Render shape based on type
  const renderShape = () => {
    switch (shape.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'circle':
        return (
          <Circle
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radius={shape.width / 2}
            offsetX={shape.width / 2}
            offsetY={shape.height / 2}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'ellipse':
        return (
          <Ellipse
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
            offsetX={shape.width / 2}
            offsetY={shape.height / 2}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'triangle':
        // Use relative coordinates (0-based), centered at origin
        const trianglePoints = [
          shape.width / 2, 0, // Top point (center top)
          0, shape.height, // Bottom left
          shape.width, shape.height, // Bottom right
        ];
        return (
          <Line
            {...commonProps}
            points={trianglePoints}
            closed
            rotation={shape.rotation || 0}
            offsetX={shape.width / 2}
            offsetY={shape.height / 2}
            x={shape.x}
            y={shape.y}
          />
        );
      
      case 'text':
        // Konva Text with separate style, weight, size, and family
        const textFontStyle = shape.fontStyle || 'normal';
        const textFontWeight = shape.fontWeight || 'normal';
        const textFontSize = shape.fontSize || 16;
        const textFontFamily = shape.fontFamily || 'Arial';
        
        // Konva Text uses separate fontFamily and fontStyle props
        const konvaFontStyle = 
          textFontStyle === 'italic' && textFontWeight === 'bold'
            ? 'bold italic'
            : textFontWeight === 'bold'
            ? 'bold'
            : textFontStyle === 'italic'
            ? 'italic'
            : 'normal';
        
        return (
          <Text
            {...commonProps}
            x={shape.x}
            y={shape.y}
            text={shape.text || 'Double-click to edit'}
            fontSize={textFontSize}
            fontFamily={textFontFamily}
            fontStyle={konvaFontStyle}
            textDecoration={shape.textDecoration || ''}
            width={shape.width}
            height={shape.height}
            rotation={shape.rotation || 0}
            align="left"
            verticalAlign="top"
            onDblClick={() => {
              if (!isLockedByOther && onStartEditText) {
                onStartEditText(shape.id);
              }
            }}
          />
        );
      
      case 'star':
        return (
          <Star
            {...commonProps}
            x={shape.x}
            y={shape.y}
            numPoints={shape.numPoints || 5}
            innerRadius={(shape.innerRadius || 0.4) * (shape.width / 2)}
            outerRadius={shape.width / 2}
            offsetX={shape.width / 2}
            offsetY={shape.height / 2}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'polygon':
        return (
          <RegularPolygon
            {...commonProps}
            x={shape.x}
            y={shape.y}
            sides={shape.sides || 6}
            radius={shape.width / 2}
            offsetX={shape.width / 2}
            offsetY={shape.height / 2}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'path':
        return (
          <Path
            {...commonProps}
            x={shape.x}
            y={shape.y}
            data={shape.pathData || 'M10,10 L50,10 L50,50 L10,50 Z'}
            rotation={shape.rotation || 0}
            scaleX={shape.width / 60} // Scale to fit width
            scaleY={shape.height / 60} // Scale to fit height
          />
        );
      
      case 'image':
        return (
          <Image
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            image={imageRef.current || undefined}
            rotation={shape.rotation || 0}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}
      
      {/* Show lock indicator text - only when locked by someone else */}
      {isLockedByOther && (() => {
        // Find the user who has locked this shape
        const lockedByUser = Object.entries(cursors).find(([userId]) => userId === shape.lockedBy);
        const lockedByUserName = lockedByUser?.[1]?.displayName || 'Unknown User';
        
        return (
          <Text
            x={shape.x}
            y={shape.y - 20}
            text={`🔒 In use by ${lockedByUserName}`}
            fontSize={12}
            fill="#FF3333"
            listening={false}
          />
        );
      })()}
      
      {isSelected && showTransformer && (
        <Transformer
          ref={transformerRef}
          listening={true}
          draggable={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum 5x5
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          resizeEnabled={true}
          keepRatio={false}
          ignoreStroke={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'top-center',
            'middle-left',
            'middle-right',
            'bottom-center',
          ]}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          borderStroke="#0066FF"
          borderStrokeWidth={2}
          anchorFill="#0066FF"
          anchorStroke="#FFFFFF"
          anchorSize={10}
          anchorCornerRadius={5}
          anchorStrokeWidth={2}
          borderDash={[3, 3]}
        />
      )}
    </>
  );
}

