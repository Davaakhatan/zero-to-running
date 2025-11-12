import type { Shape, Group } from '../types';

/**
 * Utility functions for shape grouping operations
 */

export interface GroupBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Calculate the bounding box for a group of shapes
 */
export function calculateGroupBounds(shapes: Shape[]): GroupBounds {
  if (shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach(shape => {
    const shapeMinX = shape.x;
    const shapeMinY = shape.y;
    const shapeMaxX = shape.x + shape.width;
    const shapeMaxY = shape.y + shape.height;

    minX = Math.min(minX, shapeMinX);
    minY = Math.min(minY, shapeMinY);
    maxX = Math.max(maxX, shapeMaxX);
    maxY = Math.max(maxY, shapeMaxY);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Create a group from selected shapes
 */
export function createGroup(
  selectedShapeIds: string[],
  shapes: Shape[],
  groupName?: string
): { group: Group; updatedShapes: Shape[] } {
  if (selectedShapeIds.length < 2) {
    throw new Error('At least 2 shapes are required to create a group');
  }

  const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
  
  if (selectedShapes.length !== selectedShapeIds.length) {
    throw new Error('Some selected shapes were not found');
  }

  // Calculate group bounds
  const bounds = calculateGroupBounds(selectedShapes);
  
  // Create group
  const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const group: Group = {
    id: groupId,
    name: groupName || `Group ${Date.now()}`,
    children: selectedShapeIds,
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.width,
    height: bounds.height,
    zIndex: Math.max(...selectedShapes.map(s => s.zIndex || 0)),
    createdBy: 'current-user', // This should be passed from context
    createdAt: Date.now(),
    lastModifiedAt: Date.now()
  };

  // Update shapes to be relative to group position
  const updatedShapes = shapes.map(shape => {
    if (selectedShapeIds.includes(shape.id)) {
      return {
        ...shape,
        x: shape.x - bounds.minX,
        y: shape.y - bounds.minY,
        zIndex: (shape.zIndex || 0) - 1 // Ensure group is on top
      };
    }
    return shape;
  });

  return { group, updatedShapes };
}

/**
 * Ungroup a group, returning shapes to their original positions
 */
export function ungroupGroup(
  groupId: string,
  groups: Group[],
  shapes: Shape[]
): { updatedShapes: Shape[]; remainingGroups: Group[] } {
  const group = groups.find(g => g.id === groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Get child shapes
  const childShapes = shapes.filter(shape => group.children.includes(shape.id));
  
  // Calculate group's current position
  const groupShape = shapes.find(s => s.id === groupId);
  if (!groupShape) {
    throw new Error('Group shape not found');
  }

  // Update child shapes to absolute positions
  const updatedShapes = shapes.map(shape => {
    if (group.children.includes(shape.id)) {
      return {
        ...shape,
        x: shape.x + groupShape.x,
        y: shape.y + groupShape.y,
        zIndex: (shape.zIndex || 0) + 1 // Restore original z-index
      };
    }
    return shape;
  });

  // Remove group from groups array
  const remainingGroups = groups.filter(g => g.id !== groupId);

  return { updatedShapes, remainingGroups };
}

/**
 * Check if shapes can be grouped (not already in groups, not locked, etc.)
 */
export function canGroupShapes(selectedShapeIds: string[], shapes: Shape[]): boolean {
  console.log('🔍 [canGroupShapes] Input:', {
    selectedShapeIds,
    selectedShapeIdsLength: selectedShapeIds.length,
    shapesLength: shapes.length
  });

  if (selectedShapeIds.length < 2) {
    console.log('🔍 [canGroupShapes] Too few shapes selected:', selectedShapeIds.length);
    return false;
  }
  
  const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
  console.log('🔍 [canGroupShapes] Selected shapes found:', selectedShapes.length);
  
  // Check if all shapes exist
  if (selectedShapes.length !== selectedShapeIds.length) {
    console.log('🔍 [canGroupShapes] Some shapes not found:', {
      expected: selectedShapeIds.length,
      found: selectedShapes.length
    });
    return false;
  }
  
  // Check if any shape is already in a group
  const hasGroupedShapes = selectedShapes.some(shape => shape.type === 'group');
  if (hasGroupedShapes) {
    console.log('🔍 [canGroupShapes] Some shapes are already groups');
    return false;
  }
  
  // Check if any shape is locked
  const hasLockedShapes = selectedShapes.some(shape => shape.isLocked);
  if (hasLockedShapes) {
    console.log('🔍 [canGroupShapes] Some shapes are locked');
    return false;
  }
  
  console.log('🔍 [canGroupShapes] All checks passed, can group!');
  return true;
}

/**
 * Check if a group can be ungrouped
 */
export function canUngroupGroup(groupId: string, groups: Group[]): boolean {
  const group = groups.find(g => g.id === groupId);
  if (!group) return false;
  
  // Check if group is locked
  if (group.isLocked) return false;
  
  return true;
}

/**
 * Get all shapes in a group (including nested groups)
 */
export function getGroupShapes(groupId: string, groups: Group[], shapes: Shape[]): Shape[] {
  const group = groups.find(g => g.id === groupId);
  if (!group) return [];
  
  const groupShapes: Shape[] = [];
  
  group.children.forEach(childId => {
    const childShape = shapes.find(s => s.id === childId);
    if (childShape) {
      if (childShape.type === 'group') {
        // Recursively get shapes from nested groups
        groupShapes.push(...getGroupShapes(childId, groups, shapes));
      } else {
        groupShapes.push(childShape);
      }
    }
  });
  
  return groupShapes;
}

/**
 * Move a group and all its children
 */
export function moveGroup(
  groupId: string,
  deltaX: number,
  deltaY: number,
  groups: Group[],
  shapes: Shape[]
): { updatedGroups: Group[]; updatedShapes: Shape[] } {
  const group = groups.find(g => g.id === groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Update group position
  const updatedGroups = groups.map(g => 
    g.id === groupId 
      ? { ...g, x: g.x + deltaX, y: g.y + deltaY, lastModifiedAt: Date.now() }
      : g
  );

  // Update all child shapes
  const updatedShapes = shapes.map(shape => {
    if (group.children.includes(shape.id)) {
      return {
        ...shape,
        x: shape.x + deltaX,
        y: shape.y + deltaY,
        lastModifiedAt: Date.now()
      };
    }
    return shape;
  });

  return { updatedGroups, updatedShapes };
}

/**
 * Rotate a group and all its children
 */
export function rotateGroup(
  groupId: string,
  rotation: number,
  groups: Group[],
  shapes: Shape[]
): { updatedGroups: Group[]; updatedShapes: Shape[] } {
  const group = groups.find(g => g.id === groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Update group rotation
  const updatedGroups = groups.map(g => 
    g.id === groupId 
      ? { ...g, rotation: (g.rotation || 0) + rotation, lastModifiedAt: Date.now() }
      : g
  );

  // For now, we'll just update the group rotation
  // In a full implementation, you'd need to rotate each child shape around the group center
  const updatedShapes = shapes.map(shape => {
    if (group.children.includes(shape.id)) {
      return {
        ...shape,
        rotation: (shape.rotation || 0) + rotation,
        lastModifiedAt: Date.now()
      };
    }
    return shape;
  });

  return { updatedGroups, updatedShapes };
}

/**
 * Scale a group and all its children
 */
export function scaleGroup(
  groupId: string,
  scaleX: number,
  scaleY: number,
  groups: Group[],
  shapes: Shape[]
): { updatedGroups: Group[]; updatedShapes: Shape[] } {
  const group = groups.find(g => g.id === groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Update group scale
  const updatedGroups = groups.map(g => 
    g.id === groupId 
      ? { 
          ...g, 
          scaleX: (g.scaleX || 1) * scaleX, 
          scaleY: (g.scaleY || 1) * scaleY,
          width: g.width * scaleX,
          height: g.height * scaleY,
          lastModifiedAt: Date.now() 
        }
      : g
  );

  // Update all child shapes
  const updatedShapes = shapes.map(shape => {
    if (group.children.includes(shape.id)) {
      return {
        ...shape,
        x: shape.x * scaleX,
        y: shape.y * scaleY,
        width: shape.width * scaleX,
        height: shape.height * scaleY,
        scaleX: (shape.scaleX || 1) * scaleX,
        scaleY: (shape.scaleY || 1) * scaleY,
        lastModifiedAt: Date.now()
      };
    }
    return shape;
  });

  return { updatedGroups, updatedShapes };
}
