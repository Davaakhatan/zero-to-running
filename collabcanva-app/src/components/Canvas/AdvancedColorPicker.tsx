// AdvancedColorPicker component with gradient support and advanced color tools
// Provides comprehensive color editing with gradients, color history, and favorites

import React, { useState, useRef, useEffect } from 'react';
import type { Shape } from '../../contexts/CanvasContext';

interface AdvancedColorPickerProps {
  selectedShape: Shape;
  onColorChange: (property: string, value: any) => void;
  onClose: () => void;
  className?: string;
  targetProperty?: 'fill' | 'stroke';
}

type ColorMode = 'solid' | 'linear' | 'radial' | 'conic';

export default function AdvancedColorPicker({ 
  selectedShape, 
  onColorChange, 
  onClose, 
  className = '',
  targetProperty = 'fill'
}: AdvancedColorPickerProps) {
  const [colorMode, setColorMode] = useState<ColorMode>('solid');
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [alpha, setAlpha] = useState(1);
  const [gradientColors, setGradientColors] = useState<string[]>(['#ff0000', '#0000ff']);
  const [gradientStops, setGradientStops] = useState<number[]>([0, 1]);
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientCenterX, setGradientCenterX] = useState(0.5);
  const [gradientCenterY, setGradientCenterY] = useState(0.5);
  const [gradientRadius, setGradientRadius] = useState(0.5);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeGradientStop, setActiveGradientStop] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close and keyboard events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Color palette
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

  // Initialize from selected shape
  useEffect(() => {
    const currentColor = targetProperty === 'fill' ? selectedShape.fill : selectedShape.stroke;
    
    if (currentColor) {
      const color = parseColor(currentColor);
      if (color) {
        setHue(color.h);
        setSaturation(color.s);
        setLightness(color.l);
        setAlpha(color.a);
      }
    }

    if (selectedShape.gradientType) {
      setColorMode(selectedShape.gradientType);
      setGradientColors(selectedShape.gradientColors || ['#ff0000', '#0000ff']);
      setGradientStops(selectedShape.gradientStops || [0, 1]);
      setGradientAngle(selectedShape.gradientAngle || 0);
      setGradientCenterX(selectedShape.gradientCenterX || 0.5);
      setGradientCenterY(selectedShape.gradientCenterY || 0.5);
      setGradientRadius(selectedShape.gradientRadius || 0.5);
    }
  }, [selectedShape, targetProperty]);

  // Parse color string to HSL
  const parseColor = (color: string) => {
    if (!color) return null;
    
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      const a = hex.length === 8 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
      
      const hsl = rgbToHsl(r, g, b);
      return { h: hsl.h, s: hsl.s, l: hsl.l, a };
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]) / 255;
        const g = parseInt(matches[1]) / 255;
        const b = parseInt(matches[2]) / 255;
        const a = matches[3] ? parseInt(matches[3]) / 255 : 1;
        
        const hsl = rgbToHsl(r, g, b);
        return { h: hsl.h, s: hsl.s, l: hsl.l, a };
      }
    }
    
    return null;
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  // Get current color as hex
  const getCurrentColor = () => {
    const rgb = hslToRgb(hue, saturation, lightness);
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}${alphaHex}`;
  };

  // Get current gradient
  const getCurrentGradient = () => {
    if (colorMode === 'solid') return null;
    
    const stops = gradientColors.map((color, index) => 
      `${color} ${(gradientStops[index] || 0) * 100}%`
    ).join(', ');

    switch (colorMode) {
      case 'linear':
        return `linear-gradient(${gradientAngle}deg, ${stops})`;
      case 'radial':
        return `radial-gradient(circle at ${gradientCenterX * 100}% ${gradientCenterY * 100}%, ${stops})`;
      case 'conic':
        return `conic-gradient(from ${gradientAngle}deg at ${gradientCenterX * 100}% ${gradientCenterY * 100}%, ${stops})`;
      default:
        return null;
    }
  };

  // Apply color change
  const applyColorChange = () => {
    if (colorMode === 'solid') {
      const color = getCurrentColor();
      onColorChange(targetProperty, color);
      onColorChange('gradientType', undefined);
      onColorChange('gradientColors', undefined);
      onColorChange('gradientStops', undefined);
    } else {
      const gradient = getCurrentGradient();
      if (gradient) {
        onColorChange(targetProperty, gradient);
        onColorChange('gradientType', colorMode);
        onColorChange('gradientColors', gradientColors);
        onColorChange('gradientStops', gradientStops);
        onColorChange('gradientAngle', gradientAngle);
        onColorChange('gradientCenterX', gradientCenterX);
        onColorChange('gradientCenterY', gradientCenterY);
        onColorChange('gradientRadius', gradientRadius);
      }
    }
  };

  // Add to color history
  const addToHistory = (color: string) => {
    setColorHistory(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 10);
    });
  };

  // Toggle favorite
  const toggleFavorite = (color: string) => {
    setFavorites(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  // Handle color picker change
  const handleColorChange = (newHue: number, newSaturation: number, newLightness: number) => {
    setHue(newHue);
    setSaturation(newSaturation);
    setLightness(newLightness);
  };

  // Handle gradient stop change
  const handleGradientStopChange = (index: number, color: string) => {
    const newColors = [...gradientColors];
    newColors[index] = color;
    setGradientColors(newColors);
  };

  // Add gradient stop
  const addGradientStop = () => {
    if (gradientColors.length < 8) {
      const newStop = (gradientStops[gradientStops.length - 1] + 1) / 2;
      setGradientColors([...gradientColors, getCurrentColor()]);
      setGradientStops([...gradientStops, newStop]);
    }
  };

  // Remove gradient stop
  const removeGradientStop = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors(gradientColors.filter((_, i) => i !== index));
      setGradientStops(gradientStops.filter((_, i) => i !== index));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 p-4 z-50 w-[400px] max-h-[calc(100vh-120px)] overflow-y-auto ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-600">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Advanced Color Picker</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
          title="Close color picker"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Color Mode Tabs */}
      <div className="flex mb-4">
        {(['solid', 'linear', 'radial', 'conic'] as ColorMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setColorMode(mode)}
            className={`px-3 py-1 text-xs font-medium rounded-t-md ${
              colorMode === mode
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Color Preview */}
      <div className="mb-4">
        <div className="w-full h-16 rounded-lg border border-gray-300 dark:border-slate-600 mb-2"
             style={{ 
               background: colorMode === 'solid' ? getCurrentColor() : getCurrentGradient() || '#000000'
             }}
        />
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          {colorMode === 'solid' ? getCurrentColor() : `${colorMode} gradient`}
        </div>
      </div>

      {/* Solid Color Picker */}
      {colorMode === 'solid' && (
        <div className="space-y-4">
          {/* HSL Sliders */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Hue</label>
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Saturation</label>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Lightness</label>
              <input
                type="range"
                min="0"
                max="100"
                value={lightness}
                onChange={(e) => setLightness(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Alpha</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Quick Colors</label>
            <div className="grid grid-cols-10 gap-1">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const parsed = parseColor(color);
                    if (parsed) {
                      setHue(parsed.h);
                      setSaturation(parsed.s);
                      setLightness(parsed.l);
                      setAlpha(parsed.a);
                    }
                  }}
                  className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gradient Editor */}
      {colorMode !== 'solid' && (
        <div className="space-y-4">
          {/* Gradient Stops */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Gradient Stops</label>
            <div className="space-y-2">
              {gradientColors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border border-gray-300 dark:border-slate-600"
                       style={{ backgroundColor: color }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleGradientStopChange(index, e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-slate-600 rounded cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gradientStops[index] || 0}
                    onChange={(e) => {
                      const newStops = [...gradientStops];
                      newStops[index] = parseFloat(e.target.value);
                      setGradientStops(newStops);
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
                    {Math.round((gradientStops[index] || 0) * 100)}%
                  </span>
                  {gradientColors.length > 2 && (
                    <button
                      onClick={() => removeGradientStop(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {gradientColors.length < 8 && (
                <button
                  onClick={addGradientStop}
                  className="w-full py-2 text-xs text-blue-600 dark:text-blue-400 border border-dashed border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  + Add Stop
                </button>
              )}
            </div>
          </div>

          {/* Gradient Controls */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Angle</label>
              <input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            {(colorMode === 'radial' || colorMode === 'conic') && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Center X</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gradientCenterX}
                    onChange={(e) => setGradientCenterX(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Center Y</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gradientCenterY}
                    onChange={(e) => setGradientCenterY(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Color History */}
      {colorHistory.length > 0 && (
        <div className="mt-4">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Recent Colors</label>
          <div className="flex gap-1">
            {colorHistory.slice(0, 8).map((color, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const parsed = parseColor(color);
                  if (parsed) {
                    setHue(parsed.h);
                    setSaturation(parsed.s);
                    setLightness(parsed.l);
                    setAlpha(parsed.a);
                  }
                }}
                className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-slate-600">
        <button
          onClick={() => {
            const color = getCurrentColor();
            addToHistory(color);
            applyColorChange();
            onClose(); // Close the picker after applying
          }}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply & Close
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const color = getCurrentColor();
            toggleFavorite(color);
          }}
          className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          title="Add to favorites"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
