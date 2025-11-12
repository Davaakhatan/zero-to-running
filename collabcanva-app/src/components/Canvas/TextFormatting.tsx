import { useState, useRef, useEffect } from "react";
import { useProjectCanvas } from "../../contexts/ProjectCanvasContext";

interface TextFormattingProps {
  selectedShapeId: string;
}

export default function TextFormatting({ selectedShapeId }: TextFormattingProps) {
  const { shapes, updateShape } = useProjectCanvas();
  const [position, setPosition] = useState({ x: 24, y: 96 }); // Default position (right-6, top-24)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const shape = shapes.find(s => s.id === selectedShapeId);
  if (!shape || shape.type !== 'text') return null;

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return; // Only drag from header area
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 320; // 320px is the width of the panel
    const maxY = window.innerHeight - 200; // 200px is minimum height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const fontSize = shape.fontSize || 16;
  const fontFamily = shape.fontFamily || 'Arial';
  const fontStyle = shape.fontStyle || 'normal';
  const fontWeight = shape.fontWeight || 'normal';
  const textDecoration = shape.textDecoration || 'none';

  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Arial Black',
  ];

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

  return (
    <div 
      ref={containerRef}
      className="fixed bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 p-4 z-50 w-[320px] max-h-[calc(100vh-120px)] overflow-y-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Header - Draggable area */}
      <div 
        className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-slate-600 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Text Formatting</h3>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
            Font Size
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateShape(selectedShapeId, { fontSize: Math.max(8, fontSize - 2) })}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-gray-200 dark:border-slate-600"
              title="Decrease font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              min="8"
              max="200"
              value={fontSize}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  const clampedValue = Math.max(8, Math.min(200, value));
                  updateShape(selectedShapeId, { fontSize: clampedValue });
                }
              }}
              onBlur={(e) => {
                // If empty or invalid, reset to current fontSize
                if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                  e.target.value = fontSize.toString();
                }
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 w-[70px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => updateShape(selectedShapeId, { fontSize: Math.min(200, fontSize + 2) })}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-gray-200 dark:border-slate-600"
              title="Increase font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
            Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => updateShape(selectedShapeId, { fontFamily: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Text Styles */}
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
            Text Style
          </label>
          <div className="flex gap-2">
            {/* Bold */}
            <button
              onClick={() => updateShape(selectedShapeId, { 
                fontWeight: fontWeight === 'bold' ? 'normal' : 'bold' 
              })}
              className={`flex-1 p-2.5 rounded-lg transition-all font-bold text-sm border ${
                fontWeight === 'bold'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
              }`}
              title="Bold"
            >
              B
            </button>

            {/* Italic */}
            <button
              onClick={() => updateShape(selectedShapeId, { 
                fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' 
              })}
              className={`flex-1 p-2.5 rounded-lg transition-all italic text-sm border ${
                fontStyle === 'italic'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
              }`}
              title="Italic"
            >
              I
            </button>

            {/* Underline */}
            <button
              onClick={() => updateShape(selectedShapeId, { 
                textDecoration: textDecoration === 'underline' ? 'none' : 'underline' 
              })}
              className={`flex-1 p-2.5 rounded-lg transition-all underline text-sm border ${
                textDecoration === 'underline'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
              }`}
              title="Underline"
            >
              U
            </button>
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
            Text Color
          </label>
          <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto p-1">
            {colorPalette.map((color) => (
              <button
                key={color}
                onClick={() => updateShape(selectedShapeId, { fill: color })}
                className={`w-10 h-10 rounded-lg border-2 hover:scale-110 transition-all ${
                  shape.fill === color
                    ? 'border-blue-600 ring-2 ring-blue-300 dark:ring-blue-500'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="pt-3 border-t border-gray-200 dark:border-slate-600">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
            Preview
          </label>
          <div 
            className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-center"
            style={{
              fontSize: `${Math.min(fontSize, 24)}px`,
              fontFamily: fontFamily,
              fontStyle: fontStyle,
              fontWeight: fontWeight,
              textDecoration: textDecoration,
              color: shape.fill || '#000000',
            }}
          >
            {shape.text || 'Sample Text'}
          </div>
        </div>
      </div>
    </div>
  );
}

