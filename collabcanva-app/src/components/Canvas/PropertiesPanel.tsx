// PropertiesPanel component for editing selected shape properties
// Provides a comprehensive interface for editing all shape properties

import React, { useState, useRef, useEffect } from 'react';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';
import AdvancedColorPicker from './AdvancedColorPicker';
import type { Shape } from '../../contexts/ProjectCanvasContext';

interface PropertiesPanelProps {
  className?: string;
}

export default function PropertiesPanel({ className = '' }: PropertiesPanelProps) {
  const { 
    shapes, 
    selectedIds, 
    updateShape, 
    batchUpdateShapes, 
    pushState 
  } = useProjectCanvas();

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
  const [colorPickerProperty, setColorPickerProperty] = useState<'fill' | 'stroke' | 'shadowColor'>('fill');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the first selected shape for property editing
  const selectedShape = selectedIds.length > 0 
    ? shapes.find(shape => shape.id === selectedIds[0]) 
    : null;

  // Handle panel dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
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

  // Property update handlers
  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedShape) return;

    // Update the shape
    updateShape(selectedShape.id, { [property]: value });
    
    // Save to history
    pushState();
  };

  const handleBatchPropertyChange = (property: string, value: any) => {
    if (selectedIds.length === 0) return;

    // Batch update all selected shapes
    const updates = selectedIds.map(id => ({ id, updates: { [property]: value } }));
    batchUpdateShapes(updates);
    
    // Save to history
    pushState();
  };

  // Don't render if no shape is selected
  if (!selectedShape) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`fixed bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-[9999] w-[320px] max-h-[calc(100vh-120px)] overflow-y-auto transition-all duration-200 ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Header - Draggable area */}
      <div 
        className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-slate-600 cursor-grab active:cursor-grabbing select-none drag-handle hover:bg-gray-50 dark:hover:bg-slate-700 rounded-t-lg px-2 -mx-2 pt-2 -mt-2"
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle icon */}
        <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
          </div>
        </div>
        
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">Properties</h3>
        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {selectedIds.length > 1 ? `${selectedIds.length} selected` : selectedShape.type}
        </div>
      </div>


      {/* Properties Content */}
      <div className="space-y-4">
        {/* Position & Size */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Position & Size</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedShape.x)}
                onChange={(e) => handlePropertyChange('x', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.y)}
                onChange={(e) => handlePropertyChange('y', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
              <input
                type="number"
                value={Math.round(selectedShape.width)}
                onChange={(e) => handlePropertyChange('width', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedShape.height)}
                onChange={(e) => handlePropertyChange('height', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Rotation</label>
              <input
                type="number"
                value={Math.round(selectedShape.rotation || 0)}
                onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={selectedShape.rotation || 0}
              onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Visual Properties */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Visual</h4>
          
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fill Color</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setColorPickerProperty('fill');
                  setShowAdvancedColorPicker(true);
                }}
                className="w-8 h-8 border border-gray-300 dark:border-slate-600 rounded cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: selectedShape.fill }}
                title="Open advanced color picker"
              />
              <input
                type="text"
                value={selectedShape.fill}
                onChange={(e) => handleBatchPropertyChange('fill', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Stroke Color</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setColorPickerProperty('stroke');
                  setShowAdvancedColorPicker(true);
                }}
                className="w-8 h-8 border border-gray-300 dark:border-slate-600 rounded cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: selectedShape.stroke || '#000000' }}
                title="Open advanced color picker"
              />
              <input
                type="text"
                value={selectedShape.stroke || ''}
                onChange={(e) => handleBatchPropertyChange('stroke', e.target.value)}
                placeholder="No stroke"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Stroke Width</label>
              <input
                type="number"
                value={selectedShape.strokeWidth || 0}
                onChange={(e) => handleBatchPropertyChange('strokeWidth', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={selectedShape.strokeWidth || 0}
              onChange={(e) => handleBatchPropertyChange('strokeWidth', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Border Style Controls */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Border Style</h5>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Line Cap</label>
              <select
                value={selectedShape.strokeLineCap || 'butt'}
                onChange={(e) => handleBatchPropertyChange('strokeLineCap', e.target.value as 'butt' | 'round' | 'square')}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="butt">Butt</option>
                <option value="round">Round</option>
                <option value="square">Square</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Line Join</label>
              <select
                value={selectedShape.strokeLineJoin || 'miter'}
                onChange={(e) => handleBatchPropertyChange('strokeLineJoin', e.target.value as 'miter' | 'round' | 'bevel')}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="miter">Miter</option>
                <option value="round">Round</option>
                <option value="bevel">Bevel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dash Pattern</label>
              <input
                type="text"
                value={selectedShape.strokeDashArray?.join(',') || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleBatchPropertyChange('strokeDashArray', undefined);
                  } else {
                    const dashArray = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                    handleBatchPropertyChange('strokeDashArray', dashArray);
                  }
                }}
                placeholder="5,5 (comma-separated)"
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
          </div>

          {/* Corner Radius for Rectangles */}
          {selectedShape.type === 'rectangle' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Corner Radius</label>
                <input
                  type="number"
                  value={selectedShape.cornerRadius || 0}
                  onChange={(e) => handleBatchPropertyChange('cornerRadius', parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={selectedShape.cornerRadius || 0}
                onChange={(e) => handleBatchPropertyChange('cornerRadius', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Shadow Controls */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Shadow</h5>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Shadow Color</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setColorPickerProperty('shadowColor');
                    setShowAdvancedColorPicker(true);
                  }}
                  className="w-8 h-8 border border-gray-300 dark:border-slate-600 rounded cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: selectedShape.shadowColor || '#000000' }}
                  title="Open advanced color picker"
                />
                <input
                  type="text"
                  value={selectedShape.shadowColor || ''}
                  onChange={(e) => handleBatchPropertyChange('shadowColor', e.target.value)}
                  placeholder="No shadow"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Blur</label>
                  <input
                    type="number"
                    value={selectedShape.shadowBlur || 0}
                    onChange={(e) => handleBatchPropertyChange('shadowBlur', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={selectedShape.shadowBlur || 0}
                  onChange={(e) => handleBatchPropertyChange('shadowBlur', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Opacity</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedShape.shadowOpacity || 0.5}
                    onChange={(e) => handleBatchPropertyChange('shadowOpacity', parseFloat(e.target.value) || 0.5)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedShape.shadowOpacity || 0.5}
                  onChange={(e) => handleBatchPropertyChange('shadowOpacity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Offset X</label>
                  <input
                    type="number"
                    value={selectedShape.shadowOffsetX || 0}
                    onChange={(e) => handleBatchPropertyChange('shadowOffsetX', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={selectedShape.shadowOffsetX || 0}
                  onChange={(e) => handleBatchPropertyChange('shadowOffsetX', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Offset Y</label>
                  <input
                    type="number"
                    value={selectedShape.shadowOffsetY || 0}
                    onChange={(e) => handleBatchPropertyChange('shadowOffsetY', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={selectedShape.shadowOffsetY || 0}
                  onChange={(e) => handleBatchPropertyChange('shadowOffsetY', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Opacity and Blend Mode Controls */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Opacity & Blend Mode</h5>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Opacity</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={Math.round((selectedShape.opacity || 1) * 100) / 100}
                  onChange={(e) => handleBatchPropertyChange('opacity', parseFloat(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedShape.opacity || 1}
                onChange={(e) => handleBatchPropertyChange('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Blend Mode</label>
              <select
                value={selectedShape.blendMode || 'normal'}
                onChange={(e) => handleBatchPropertyChange('blendMode', e.target.value as any)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
                <option value="hard-light">Hard Light</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transform Properties */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Transform</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Scale X</label>
                <input
                  type="number"
                  value={Math.round((selectedShape.scaleX || 1) * 100) / 100}
                  onChange={(e) => handlePropertyChange('scaleX', parseFloat(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={selectedShape.scaleX || 1}
                onChange={(e) => handlePropertyChange('scaleX', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Scale Y</label>
                <input
                  type="number"
                  value={Math.round((selectedShape.scaleY || 1) * 100) / 100}
                  onChange={(e) => handlePropertyChange('scaleY', parseFloat(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={selectedShape.scaleY || 1}
                onChange={(e) => handlePropertyChange('scaleY', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Text-specific properties */}
        {selectedShape.type === 'text' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Text</h4>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Content</label>
              <textarea
                value={selectedShape.text || ''}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Size</label>
                <input
                  type="number"
                  value={selectedShape.fontSize || 16}
                  onChange={(e) => handlePropertyChange('fontSize', parseFloat(e.target.value) || 16)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Family</label>
                <select
                  value={selectedShape.fontFamily || 'Arial'}
                  onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedShape.fontWeight === 'bold'}
                  onChange={(e) => handlePropertyChange('fontWeight', e.target.checked ? 'bold' : 'normal')}
                  className="rounded"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Bold</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedShape.fontStyle === 'italic'}
                  onChange={(e) => handlePropertyChange('fontStyle', e.target.checked ? 'italic' : 'normal')}
                  className="rounded"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Italic</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedShape.textDecoration === 'underline'}
                  onChange={(e) => handlePropertyChange('textDecoration', e.target.checked ? 'underline' : 'none')}
                  className="rounded"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Underline</span>
              </label>
            </div>
          </div>
        )}

        {/* Shape-specific properties */}
        {selectedShape.type === 'star' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Star</h4>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Points</label>
              <input
                type="number"
                min="3"
                max="20"
                value={selectedShape.numPoints || 5}
                onChange={(e) => handlePropertyChange('numPoints', parseInt(e.target.value) || 5)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Inner Radius</label>
                <input
                  type="number"
                  value={Math.round((selectedShape.innerRadius || 0.4) * 100) / 100}
                  onChange={(e) => handlePropertyChange('innerRadius', parseFloat(e.target.value) || 0.4)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={selectedShape.innerRadius || 0.4}
                onChange={(e) => handlePropertyChange('innerRadius', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {selectedShape.type === 'polygon' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Polygon</h4>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Sides</label>
              <input
                type="number"
                min="3"
                max="20"
                value={selectedShape.sides || 6}
                onChange={(e) => handlePropertyChange('sides', parseInt(e.target.value) || 6)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Color Picker Modal */}
      {showAdvancedColorPicker && selectedShape && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-[60]"
          onClick={(e) => {
            // Only close if clicking on the backdrop, not on the color picker itself
            if (e.target === e.currentTarget) {
              setShowAdvancedColorPicker(false);
            }
          }}
        >
          {colorPickerProperty === 'fill' || colorPickerProperty === 'stroke' ? (
            <AdvancedColorPicker
              selectedShape={selectedShape}
              targetProperty={colorPickerProperty}
              onColorChange={(property, value) => {
                // Apply the color change to the correct property
                handleBatchPropertyChange(property, value);
              }}
              onClose={() => setShowAdvancedColorPicker(false)}
              className="relative"
            />
          ) : (
            <div className="p-4 text-center text-gray-500">
              Color picker not available for {colorPickerProperty}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
