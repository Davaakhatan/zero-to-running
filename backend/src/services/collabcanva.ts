import { Pool } from 'pg';
import { initDatabase, initRedis } from './health.js';
import type { RedisClientType } from 'redis';

/**
 * CollabCanva service - manages canvas data in PostgreSQL with Redis caching
 */

export interface Shape {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null;
  lastModifiedAt?: number;
  [key: string]: any; // Allow additional shape properties
}

export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  lastUpdated: string;
}

/**
 * Initialize canvas table if it doesn't exist
 */
export async function initCanvasTable(): Promise<void> {
  const pool = initDatabase();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS canvases (
      canvas_id VARCHAR(255) PRIMARY KEY,
      shapes JSONB NOT NULL DEFAULT '[]'::jsonb,
      last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_canvases_last_updated 
    ON canvases(last_updated)
  `);
}

/**
 * Get canvas document (with Redis caching)
 */
export async function getCanvas(canvasId: string = 'global-canvas-v1'): Promise<CanvasDocument | null> {
  // Try Redis cache first
  try {
    const redis = initRedis();
    if (redis && redis.isOpen) {
      const cached = await redis.get(`canvas:${canvasId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    // Redis not available, continue to database
    console.warn('Redis cache miss, falling back to database:', error);
  }
  
  // Fallback to database
  const pool = initDatabase();
  const result = await pool.query(
    'SELECT canvas_id, shapes, last_updated FROM canvases WHERE canvas_id = $1',
    [canvasId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  const canvas: CanvasDocument = {
    canvasId: row.canvas_id,
    shapes: row.shapes || [],
    lastUpdated: row.last_updated.toISOString(),
  };
  
  // Cache in Redis (5 minute TTL)
  try {
    const redis = initRedis();
    if (redis && redis.isOpen) {
      await redis.setEx(`canvas:${canvasId}`, 300, JSON.stringify(canvas));
    }
  } catch (error) {
    // Ignore Redis errors, database is source of truth
    console.warn('Failed to cache canvas in Redis:', error);
  }
  
  return canvas;
}

/**
 * Initialize canvas if it doesn't exist
 */
export async function initializeCanvas(canvasId: string = 'global-canvas-v1'): Promise<void> {
  await initCanvasTable();
  
  const existing = await getCanvas(canvasId);
  if (!existing) {
    const pool = initDatabase();
    await pool.query(
      'INSERT INTO canvases (canvas_id, shapes, last_updated) VALUES ($1, $2, NOW())',
      [canvasId, JSON.stringify([])]
    );
  }
}

/**
 * Update canvas shapes (updates both database and cache)
 */
export async function updateCanvasShapes(
  canvasId: string,
  shapes: Shape[]
): Promise<void> {
  await initCanvasTable();
  
  const pool = initDatabase();
  await pool.query(
    'UPDATE canvases SET shapes = $1, last_updated = NOW() WHERE canvas_id = $2',
    [JSON.stringify(shapes), canvasId]
  );
  
  // Invalidate/update Redis cache
  try {
    const redis = initRedis();
    if (redis && redis.isOpen) {
      const canvas: CanvasDocument = {
        canvasId,
        shapes,
        lastUpdated: new Date().toISOString(),
      };
      await redis.setEx(`canvas:${canvasId}`, 300, JSON.stringify(canvas));
    }
  } catch (error) {
    // Ignore Redis errors, database is source of truth
    console.warn('Failed to update canvas cache in Redis:', error);
  }
}

/**
 * Create a shape
 */
export async function createShape(
  canvasId: string,
  shape: Shape
): Promise<void> {
  await initCanvasTable();
  await initializeCanvas(canvasId);
  
  const canvas = await getCanvas(canvasId);
  if (!canvas) {
    throw new Error('Canvas not found');
  }
  
  const shapes = [...canvas.shapes, shape];
  await updateCanvasShapes(canvasId, shapes);
}

/**
 * Update a shape
 */
export async function updateShape(
  canvasId: string,
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> {
  await initCanvasTable();
  
  const canvas = await getCanvas(canvasId);
  if (!canvas) {
    throw new Error('Canvas not found');
  }
  
  const shapes = canvas.shapes.map((shape) =>
    shape.id === shapeId
      ? { ...shape, ...updates, lastModifiedAt: Date.now() }
      : shape
  );
  
  await updateCanvasShapes(canvasId, shapes);
}

/**
 * Delete a shape
 */
export async function deleteShape(
  canvasId: string,
  shapeId: string
): Promise<void> {
  await initCanvasTable();
  
  const canvas = await getCanvas(canvasId);
  if (!canvas) {
    throw new Error('Canvas not found');
  }
  
  const shapes = canvas.shapes.filter((shape) => shape.id !== shapeId);
  await updateCanvasShapes(canvasId, shapes);
}

/**
 * Lock a shape
 */
export async function lockShape(
  canvasId: string,
  shapeId: string,
  userId: string
): Promise<void> {
  await updateShape(canvasId, shapeId, {
    isLocked: true,
    lockedBy: userId,
    lockedAt: Date.now(),
  });
}

/**
 * Unlock a shape
 */
export async function unlockShape(
  canvasId: string,
  shapeId: string
): Promise<void> {
  await updateShape(canvasId, shapeId, {
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  });
}

/**
 * Batch update shapes
 */
export async function batchUpdateShapes(
  canvasId: string,
  updates: Array<{ id: string; updates: Partial<Shape> }>
): Promise<void> {
  await initCanvasTable();
  
  const canvas = await getCanvas(canvasId);
  if (!canvas) {
    throw new Error('Canvas not found');
  }
  
  const updatesMap = new Map(updates.map(u => [u.id, u.updates]));
  const shapes = canvas.shapes.map((shape) => {
    const shapeUpdates = updatesMap.get(shape.id);
    return shapeUpdates
      ? { ...shape, ...shapeUpdates, lastModifiedAt: Date.now() }
      : shape;
  });
  
  await updateCanvasShapes(canvasId, shapes);
}

