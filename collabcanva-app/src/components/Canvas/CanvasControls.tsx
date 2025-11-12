import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useProjectCanvas } from "../../contexts/ProjectCanvasContext";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from "../../utils/constants";
import { clamp } from "../../utils/helpers";
import { FPSMonitor, generateRandomPosition } from "../../utils/performance";
import { exportAsPNG } from "../../utils/export";
import { canGroupShapes, canUngroupGroup } from "../../utils/groupingUtils";

interface CanvasControlsProps {
  onShowHelp: () => void;
}

// Unified Button Component with responsive sizing
interface TButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  iconSize?: number; // pixels, default 40
}

const TButton = ({
  onClick, disabled, title, active, children, className = '',
  'aria-label': ariaLabel, buttonRef, iconSize = 40
}: TButtonProps) => (
  <button
    ref={buttonRef}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={ariaLabel || title}
    /* 👇 stable class + icon size var */
    style={{ ['--icon-size' as any]: `${iconSize}px` }}
    className={`
      t-btn
      size-12 rounded-xl border flex items-center justify-center shrink-0
      transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
      disabled:opacity-40 disabled:cursor-not-allowed
      ${active 
        ? 'bg-gradient-to-br from-blue-500/90 to-purple-500/90 text-white border-transparent shadow-md focus-visible:ring-2 ring-blue-500/40' 
        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95'
      }
      ${className}
    `}
  >
    {children}
  </button>
);

// Single Pill Toggle Component
interface ToolbarToggleProps {
  state: 'bottom' | 'left';
  onToggle: () => void;
}

const ToolbarToggle = ({ state, onToggle }: ToolbarToggleProps) => {
  const isLeft = state === 'left';
  
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isLeft}
      title={isLeft ? 'Move toolbar to bottom' : 'Move toolbar to sidebar'}
      className="absolute top-20 right-6 z-40 inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-slate-800 shadow-md border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 focus-visible:ring-2 ring-blue-500/40 transition-all duration-150 w-auto"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path  d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      {isLeft ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2}>
          <path  d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2}>
          <path  d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
};

// Unified Shape Menu Component (Portal-based)
interface ShapeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path') => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  mode: 'bottom' | 'left';
}

const ShapeMenu = ({ isOpen, onClose, onSelectShape, anchorRef, mode }: ShapeMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const shapeTypes: Array<{ type: 'rectangle' | 'circle' | 'triangle' | 'ellipse' | 'text' | 'star' | 'polygon' | 'path', label: string, svg: React.ReactElement }> = [
    { 
      type: 'rectangle' as const, 
      label: 'Rectangle',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2}>
          <rect x="4" y="7" width="16" height="10" rx="1" />
        </svg>
      )
    },
    { 
      type: 'circle' as const, 
      label: 'Circle',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
    },
    { 
      type: 'triangle' as const, 
      label: 'Triangle',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2} >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5 L20 19 L4 19 Z" />
        </svg>
      )
    },
    { 
      type: 'ellipse' as const, 
      label: 'Ellipse',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2}>
          <ellipse cx="12" cy="12" rx="8" ry="5" />
        </svg>
      )
    },
    { 
      type: 'text' as const, 
      label: 'Text',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2} >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      )
    },
    { 
      type: 'star' as const, 
      label: 'Star',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2} >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      )
    },
    { 
      type: 'polygon' as const, 
      label: 'Polygon',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2} >
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
        </svg>
      )
    },
    { 
      type: 'path' as const, 
      label: 'Path',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2} >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9 9l6 6M15 9l-6 6" />
        </svg>
      )
    },
  ];

  // Calculate position
  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const anchor = anchorRef.current.getBoundingClientRect();
    const collisionPadding = 12;

    if (mode === 'bottom') {
      // Open upward from bottom toolbar
      setPosition({
        left: anchor.left + anchor.width / 2,
        top: anchor.top - collisionPadding
      });
    } else {
      // Open to the right of vertical toolbar
      setPosition({
        left: anchor.right + collisionPadding,
        top: anchor.top
      });
    }
  }, [isOpen, anchorRef, mode]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  // Focus first item on open
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstButton = menuRef.current.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuStyle = mode === 'bottom'
    ? { bottom: `${window.innerHeight - position.top}px`, left: `${position.left}px`, transform: 'translateX(-50%)' }
    : { top: `${position.top}px`, left: `${position.left}px` };

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 pointer-events-auto"
      style={menuStyle}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-600 py-2 min-w-[280px] max-w-none max-h-[calc(100vh-160px)] overflow-y-auto overflow-x-hidden overscroll-contain">
        {shapeTypes.map((shape) => (
          <button
            key={shape.type}
            onClick={() => {
              onSelectShape(shape.type);
              onClose();
            }}
            role="menuitem"
            tabIndex={0}
            className="w-full h-10 px-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700 focus-visible:outline-none rounded-md mx-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-gray-700 dark:text-gray-300">
              {shape.svg}
            </div>
            <span className="text-[15px] leading-none font-medium text-gray-700 dark:text-gray-200">{shape.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default function CanvasControls({ onShowHelp }: CanvasControlsProps) {
  const { 
    scale, setScale, resetView, addShape, addImageShape, stageRef, shapes, groups, selectedIds, 
    batchUpdateShapes, undo, redo, canUndo, canRedo, projectId, canvasId, pushState,
    groupShapes, ungroupShapes, renameGroup
  } = useProjectCanvas();
  
  // Debug logging for undo/redo state (reduced frequency)
  if (shapes.length > 0 || canUndo || canRedo) {
    console.log('🎛️ [CanvasControls] Undo/Redo state:', { canUndo, canRedo, shapesCount: shapes.length });
  }
  const [fps, setFps] = useState(60);
  const [showPerf, setShowPerf] = useState(false);
  const [perfPosition, setPerfPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<'bottom' | 'left'>('bottom');
  
  const addShapeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a file smaller than 10MB');
      return;
    }

    try {
      await addImageShape(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Movement functions (works on all selected shapes) - USES BATCH UPDATES
  const moveShape = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (selectedIds.length === 0) return;
    
    const moveDistance = 10; // Move 10px at a time
    
    // Collect all updates first, then batch them
    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return null;
      
      let newX = shape.x;
      let newY = shape.y;
      
      switch (direction) {
        case 'up':
          newY -= moveDistance;
          break;
        case 'down':
          newY += moveDistance;
          break;
        case 'left':
          newX -= moveDistance;
          break;
        case 'right':
          newX += moveDistance;
          break;
      }
      
      return { id, updates: { x: newX, y: newY } };
    }).filter((u): u is { id: string; updates: { x: number; y: number } } => u !== null);
    
    // Batch update all shapes at once
    batchUpdateShapes(updates);
  };
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);

  const colorPalette = [
    // Reds
    '#FF6B6B', '#EF476F', '#E63946', '#DC2F02', '#D00000',
    // Oranges & Yellows
    '#FFA07A', '#FF8500', '#FFB703', '#FFD166', '#F7DC6F',
    // Greens
    '#52B788', '#06FFA5', '#98D8C8', '#4ECDC4', '#06D6A0',
    // Blues
    '#45B7D1', '#118AB2', '#85C1E2', '#0077B6', '#023E8A',
    // Purples & Pinks
    '#BB8FCE', '#A78BFA', '#9D4EDD', '#C77DFF', '#E0AAFF',
    // Neutrals
    '#000000', '#495057', '#6C757D', '#ADB5BD', '#FFFFFF',
  ];

  const handleZoomIn = () => {
    const newScale = clamp(scale * (1 + ZOOM_SPEED), MIN_ZOOM, MAX_ZOOM);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = clamp(scale / (1 + ZOOM_SPEED), MIN_ZOOM, MAX_ZOOM);
    setScale(newScale);
  };

  useEffect(() => {
    const monitor = new FPSMonitor();
    monitor.start((currentFps) => {
      setFps(currentFps);
    });
    return () => monitor.stop();
  }, []);

  const handleAddShape = (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path') => {
    try {
      const stage = stageRef.current;
      if (stage) {
        const centerX = (window.innerWidth / 2 - stage.x()) / scale;
        const centerY = (window.innerHeight / 2 - stage.y()) / scale;
        addShape(type, { x: centerX - 50, y: centerY - 50 });
      } else {
        addShape(type);
      }
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  };


  const handleExportPNG = () => {
    const stage = stageRef.current;
    if (stage) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      exportAsPNG(stage, `collabcanvas-${timestamp}.png`);
    }
  };

  // Performance monitor drag handlers
  const handlePerfMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('h3')) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handlePerfMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Clamp to viewport bounds
      const clampedX = Math.max(0, Math.min(window.innerWidth - 320, newX));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 200, newY));
      
      setPerfPosition({ x: clampedX, y: clampedY });
    }
  };

  const handlePerfMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handlePerfMouseMove);
      document.addEventListener('mouseup', handlePerfMouseUp);
      return () => {
        document.removeEventListener('mousemove', handlePerfMouseMove);
        document.removeEventListener('mouseup', handlePerfMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const zoomPercentage = Math.round(scale * 100);
  const shapeCount = shapes.length;
  const fpsColor = fps >= 55 ? 'text-green-600' : fps >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <>
      {/* Single Pill Toggle */}
      <ToolbarToggle 
        state={toolbarPosition} 
        onToggle={() => setToolbarPosition(toolbarPosition === 'bottom' ? 'left' : 'bottom')} 
      />

      {/* Vertical Toolbar - Hidden on mobile */}
      {toolbarPosition === 'left' && (
        <div 
          className="hidden md:block fixed left-6 z-40 overflow-visible"
          style={{
            top: '120px',
            bottom: 'max(env(safe-area-inset-bottom, 0px), 24px)'
          }}
        >
          <div 
            className="vertical-toolbar-container flex flex-col gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-600/50 p-2 overflow-x-hidden overflow-y-auto w-[64px] overscroll-contain max-h-full"
            style={{
              boxShadow: '0 18px 50px rgba(0,0,0,.12)'
            }}
          >
            {/* Zoom Group */}
            <div className="flex flex-col items-center gap-2">
              <TButton onClick={handleZoomOut} disabled={scale <= MIN_ZOOM} title="Zoom Out" aria-label="Zoom Out">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </TButton>
              
              <div className="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-center min-w-[3.5ch]">
                {zoomPercentage}%
              </div>
              
              <TButton onClick={handleZoomIn} disabled={scale >= MAX_ZOOM} title="Zoom In" aria-label="Zoom In">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </TButton>
            </div>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={resetView} title="Fit to Screen" aria-label="Fit to Screen">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </TButton>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)" aria-label="Undo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </TButton>
            <TButton onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)" aria-label="Redo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </TButton>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />
            
            {/* Movement Controls */}
            {selectedIds.length > 0 && (
              <>
                <TButton onClick={() => moveShape('up')} title="Move Up" aria-label="Move Up">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M5 15l7-7 7 7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('down')} title="Move Down" aria-label="Move Down">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M19 9l-7 7-7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('left')} title="Move Left" aria-label="Move Left">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M15 19l-7-7 7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('right')} title="Move Right" aria-label="Move Right">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M9 5l7 7-7 7" />
                  </svg>
                </TButton>
                <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />
              </>
            )}

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />


            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Primary Add Button */}
            <TButton 
              buttonRef={addShapeButtonRef}
              onClick={() => setShowShapeMenu(prev => !prev)} 
              active={true}
              title="Add Shape"
              aria-label="Add Shape"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M12 4v16m8-8H4" />
              </svg>
            </TButton>

            {/* Image Upload Button */}
            <TButton 
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
              aria-label="Upload Image"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </TButton>

            {/* Export Button */}
            <TButton onClick={handleExportPNG} title="Export as PNG" aria-label="Export as PNG">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </TButton>

            {selectedIds.length > 0 && (
              <>
                <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />
                <TButton 
                  buttonRef={colorPickerButtonRef}
                  onClick={() => setShowColorPicker(prev => !prev)} 
                  title="Change Color" 
                  aria-label="Change Color"
                >
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </TButton>
              </>
            )}

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton 
              onClick={() => setShowPerf(!showPerf)} 
              active={showPerf}
              title="Performance Info"
              aria-label="Performance Info"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </TButton>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={onShowHelp} title="Help & Shortcuts" aria-label="Help & Shortcuts">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </TButton>


          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      {toolbarPosition === 'bottom' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-600/50 px-3 py-2 shadow-lg">
            <TButton onClick={handleZoomOut} disabled={scale <= MIN_ZOOM} title="Zoom Out" aria-label="Zoom Out">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </TButton>
            
            <div className="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[3.5rem] text-center rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
              {zoomPercentage}%
            </div>
            
            <TButton onClick={handleZoomIn} disabled={scale >= MAX_ZOOM} title="Zoom In" aria-label="Zoom In">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </TButton>

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={resetView} title="Fit to Screen" aria-label="Fit to Screen">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </TButton>

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)" aria-label="Undo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </TButton>
            <TButton onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)" aria-label="Redo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </TButton>

            {/* Movement Controls */}
            {selectedIds.length > 0 && (
              <>
                <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />
                <TButton onClick={() => moveShape('up')} title="Move Up" aria-label="Move Up">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M5 15l7-7 7 7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('down')} title="Move Down" aria-label="Move Down">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M19 9l-7 7-7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('left')} title="Move Left" aria-label="Move Left">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M15 19l-7-7 7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('right')} title="Move Right" aria-label="Move Right">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M9 5l7 7-7 7" />
                  </svg>
                </TButton>
              </>
            )}

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton 
              buttonRef={addShapeButtonRef}
              onClick={() => setShowShapeMenu(prev => !prev)} 
              active={true}
              title="Add Shape"
              aria-label="Add Shape"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M12 4v16m8-8H4" />
              </svg>
            </TButton>

            {/* Image Upload Button */}
            <TButton 
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
              aria-label="Upload Image"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </TButton>

            {/* Export Button */}
            <TButton onClick={handleExportPNG} title="Export as PNG" aria-label="Export as PNG">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </TButton>

            {/* Grouping Controls - only show when shapes are selected */}
            {selectedIds.length > 0 && (
              <>
                <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />
                
                {/* Group Button */}
                <TButton
                  onClick={groupShapes}
                  disabled={!canGroupShapes(selectedIds, shapes)}
                  title={canGroupShapes(selectedIds, shapes) ? 'Group selected shapes' : 'Select 2 or more shapes to group'}
                  aria-label="Group selected shapes"
                >
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </TButton>

                {/* Ungroup Button - only show when a group is selected */}
                {selectedIds.length === 1 && groups.find(g => g.id === selectedIds[0]) && (
                  <TButton
                    onClick={ungroupShapes}
                    disabled={!canUngroupGroup(selectedIds[0], groups)}
                    title={canUngroupGroup(selectedIds[0], groups) ? 'Ungroup selected group' : 'Cannot ungroup this group'}
                    aria-label="Ungroup selected group"
                  >
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </TButton>
                )}
              </>
            )}

            {selectedIds.length > 0 && (
              <>
                <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />
                <TButton 
                  buttonRef={colorPickerButtonRef}
                  onClick={() => setShowColorPicker(prev => !prev)} 
                  title="Change Color" 
                  aria-label="Change Color"
                >
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </TButton>
              </>
            )}

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton 
              onClick={() => setShowPerf(!showPerf)} 
              active={showPerf}
              title="Performance Info"
              aria-label="Performance Info"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </TButton>

            <TButton onClick={onShowHelp} title="Help & Shortcuts" aria-label="Help & Shortcuts">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </TButton>

          </div>
        </div>
      )}

      {/* Unified Shape Menu Portal */}
      <ShapeMenu
        isOpen={showShapeMenu}
        onClose={() => setShowShapeMenu(false)}
        onSelectShape={handleAddShape}
        anchorRef={addShapeButtonRef}
        mode={toolbarPosition}
      />

      {/* Color Picker Portal (for selected shapes) */}
      {showColorPicker && selectedIds.length > 0 && colorPickerButtonRef.current && createPortal(
        <div
          className="fixed z-50 pointer-events-auto"
          style={{
            left: toolbarPosition === 'left' 
              ? `${colorPickerButtonRef.current.getBoundingClientRect().right + 12}px`
              : `${colorPickerButtonRef.current.getBoundingClientRect().left + colorPickerButtonRef.current.getBoundingClientRect().width / 2}px`,
            top: toolbarPosition === 'left'
              ? `${colorPickerButtonRef.current.getBoundingClientRect().top}px`
              : 'auto',
            bottom: toolbarPosition === 'bottom'
              ? `${window.innerHeight - colorPickerButtonRef.current.getBoundingClientRect().top + 12}px`
              : 'auto',
            transform: toolbarPosition === 'bottom' ? 'translateX(-50%)' : 'none'
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-600 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-5 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    // Update color for all selected shapes - USES BATCH UPDATES
                    const updates = selectedIds.map(id => ({ id, updates: { fill: color } }));
                    batchUpdateShapes(updates);
                    setShowColorPicker(false);
                  }}
                  className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Performance Panel */}
      {showPerf && (
        <div 
          className="fixed bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 p-5 z-50 min-w-[320px] cursor-move"
          style={{ 
            left: perfPosition.x || '50%', 
            top: perfPosition.y || 'auto',
            transform: perfPosition.x ? 'none' : 'translateX(-50%)',
            bottom: perfPosition.x ? 'auto' : '96px'
          }}
          onMouseDown={handlePerfMouseDown}
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Performance Monitor
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">FPS</span>
              <span className={`text-lg font-bold ${fpsColor}`}>{fps}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Shapes</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{shapeCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Zoom</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{zoomPercentage}%</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          </div>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </>
  );
}
