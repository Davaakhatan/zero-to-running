// Utility functions for creating Konva gradients
// Converts CSS gradient strings to Konva gradient objects

import Konva from "konva";

export interface GradientStop {
  color: string;
  position: number; // 0-1
}

export interface LinearGradientConfig {
  type: 'linear';
  angle: number; // degrees
  stops: GradientStop[];
}

export interface RadialGradientConfig {
  type: 'radial';
  centerX: number; // 0-1
  centerY: number; // 0-1
  radius: number; // 0-1
  stops: GradientStop[];
}

export interface ConicGradientConfig {
  type: 'conic';
  centerX: number; // 0-1
  centerY: number; // 0-1
  angle: number; // degrees
  stops: GradientStop[];
}

export type GradientConfig = LinearGradientConfig | RadialGradientConfig | ConicGradientConfig;

// Convert CSS linear gradient to Konva gradient
export function createLinearGradient(
  stage: any,
  shape: { x: number; y: number; width: number; height: number },
  config: LinearGradientConfig
): any | null {
  try {
    const { angle, stops } = config;
    
    // Convert angle to radians
    const angleRad = (angle * Math.PI) / 180;
    
    // Calculate start and end points based on angle
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    
    const startX = centerX - (Math.cos(angleRad) * shape.width / 2);
    const startY = centerY - (Math.sin(angleRad) * shape.height / 2);
    const endX = centerX + (Math.cos(angleRad) * shape.width / 2);
    const endY = centerY + (Math.sin(angleRad) * shape.height / 2);
    
    // Create Konva gradient
    const gradient = new (Konva as any).LinearGradient({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      colorStops: stops.map(stop => ({
        color: stop.color,
        position: stop.position
      }))
    });
    
    return gradient;
  } catch (error) {
    console.error('Error creating linear gradient:', error);
    return null;
  }
}

// Convert CSS radial gradient to Konva gradient
export function createRadialGradient(
  stage: any,
  shape: { x: number; y: number; width: number; height: number },
  config: RadialGradientConfig
): any | null {
  try {
    const { centerX, centerY, radius, stops } = config;
    
    // Calculate center position
    const centerPosX = shape.x + (centerX * shape.width);
    const centerPosY = shape.y + (centerY * shape.height);
    
    // Calculate radius in pixels
    const radiusPx = Math.max(shape.width, shape.height) * radius;
    
    // Create Konva gradient
    const gradient = new (Konva as any).RadialGradient({
      x: centerPosX,
      y: centerPosY,
      radius: radiusPx,
      colorStops: stops.map(stop => ({
        color: stop.color,
        position: stop.position
      }))
    });
    
    return gradient;
  } catch (error) {
    console.error('Error creating radial gradient:', error);
    return null;
  }
}

// Parse CSS gradient string to gradient config
export function parseGradientString(gradientString: string): GradientConfig | null {
  if (!gradientString || !gradientString.includes('gradient')) {
    return null;
  }
  
  try {
    // Parse linear gradient
    if (gradientString.includes('linear-gradient')) {
      const match = gradientString.match(/linear-gradient\(([^)]+)\)/);
      if (match) {
        const content = match[1];
        const parts = content.split(',');
        
        // Extract angle (first part)
        let angle = 0;
        if (parts[0] && parts[0].includes('deg')) {
          angle = parseFloat(parts[0].replace('deg', '').trim());
        }
        
        // Extract color stops
        const stops: GradientStop[] = [];
        const colorParts = parts.slice(1);
        
        for (const part of colorParts) {
          const trimmed = part.trim();
          const colorMatch = trimmed.match(/([^0-9%]+)\s*(\d+)?%?/);
          if (colorMatch) {
            const color = colorMatch[1].trim();
            const position = colorMatch[2] ? parseFloat(colorMatch[2]) / 100 : 0;
            stops.push({ color, position });
          }
        }
        
        return {
          type: 'linear',
          angle,
          stops
        };
      }
    }
    
    // Parse radial gradient
    if (gradientString.includes('radial-gradient')) {
      const match = gradientString.match(/radial-gradient\(([^)]+)\)/);
      if (match) {
        const content = match[1];
        const parts = content.split(',');
        
        // Extract center position (first part)
        let centerX = 0.5;
        let centerY = 0.5;
        if (parts[0] && parts[0].includes('at')) {
          const centerMatch = parts[0].match(/at\s*(\d+)%\s*(\d+)%/);
          if (centerMatch) {
            centerX = parseFloat(centerMatch[1]) / 100;
            centerY = parseFloat(centerMatch[2]) / 100;
          }
        }
        
        // Extract color stops
        const stops: GradientStop[] = [];
        const colorParts = parts.slice(1);
        
        for (const part of colorParts) {
          const trimmed = part.trim();
          const colorMatch = trimmed.match(/([^0-9%]+)\s*(\d+)?%?/);
          if (colorMatch) {
            const color = colorMatch[1].trim();
            const position = colorMatch[2] ? parseFloat(colorMatch[2]) / 100 : 0;
            stops.push({ color, position });
          }
        }
        
        return {
          type: 'radial',
          centerX,
          centerY,
          radius: 0.5,
          stops
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing gradient string:', error);
    return null;
  }
}

// Create Konva gradient from shape properties
export function createGradientFromShape(
  stage: any,
  shape: { 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    gradientType?: string;
    gradientColors?: string[];
    gradientStops?: number[];
    gradientAngle?: number;
    gradientCenterX?: number;
    gradientCenterY?: number;
    gradientRadius?: number;
  }
): any | null {
  if (!shape.gradientType || !shape.gradientColors || !shape.gradientStops) {
    return null;
  }
  
  const stops: GradientStop[] = shape.gradientColors.map((color, index) => ({
    color,
    position: shape.gradientStops![index] || 0
  }));
  
  switch (shape.gradientType) {
    case 'linear':
      return createLinearGradient(stage, shape, {
        type: 'linear',
        angle: shape.gradientAngle || 0,
        stops
      });
      
    case 'radial':
      return createRadialGradient(stage, shape, {
        type: 'radial',
        centerX: shape.gradientCenterX || 0.5,
        centerY: shape.gradientCenterY || 0.5,
        radius: shape.gradientRadius || 0.5,
        stops
      });
      
    default:
      return null;
  }
}
