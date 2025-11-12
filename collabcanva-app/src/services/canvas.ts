import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  type Unsubscribe 
} from "firebase/firestore";
import { db } from "./firebase";
import type { Shape } from "../contexts/CanvasContext";

const CANVAS_ID = "global-canvas-v1";

export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  lastUpdated: any; // Firestore Timestamp
}

/**
 * Initialize canvas document if it doesn't exist
 */
export async function initializeCanvas(): Promise<void> {
  const canvasRef = doc(db, "canvas", CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (!canvasDoc.exists()) {
    await setDoc(canvasRef, {
      canvasId: CANVAS_ID,
      shapes: [],
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Subscribe to canvas changes in real-time
 */
export function subscribeToCanvas(
  callback: (shapes: Shape[]) => void
): Unsubscribe {
  const canvasRef = doc(db, "canvas", CANVAS_ID);
  
  return onSnapshot(canvasRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as CanvasDocument;
      callback(data.shapes || []);
    } else {
      // Initialize if doesn't exist
      initializeCanvas().then(() => callback([]));
    }
  });
}

/**
 * Create a new shape
 */
export async function createShape(shape: Shape): Promise<void> {
  const canvasRef = doc(db, "canvas", CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as CanvasDocument;
    const shapes = data.shapes || [];
    
    await updateDoc(canvasRef, {
      shapes: [...shapes, shape],
      lastUpdated: serverTimestamp(),
    });
  } else {
    await initializeCanvas();
    await createShape(shape);
  }
}

/**
 * Update an existing shape
 */
export async function updateShape(
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> {
  const canvasRef = doc(db, "canvas", CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as CanvasDocument;
    const shapes = data.shapes || [];
    
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId
        ? { ...shape, ...updates, lastModifiedAt: Date.now() }
        : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Update multiple shapes at once (batch update)
 */
export async function updateShapes(updates: Array<{ id: string; updates: Partial<Shape> }>): Promise<void> {
  const canvasRef = doc(db, "canvas", CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as CanvasDocument;
    const shapes = data.shapes || [];
    
    // Create a map of updates for quick lookup
    const updatesMap = new Map(updates.map(u => [u.id, u.updates]));
    
    const updatedShapes = shapes.map((shape) => {
      const shapeUpdates = updatesMap.get(shape.id);
      return shapeUpdates 
        ? { ...shape, ...shapeUpdates, lastModifiedAt: Date.now() }
        : shape;
    });
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Delete a shape
 */
export async function deleteShape(shapeId: string): Promise<void> {
  const canvasRef = doc(db, "canvas", CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as CanvasDocument;
    const shapes = data.shapes || [];
    
    const filteredShapes = shapes.filter((shape) => shape.id !== shapeId);
    
    await updateDoc(canvasRef, {
      shapes: filteredShapes,
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Lock a shape for editing
 */
export async function lockShape(shapeId: string, userId: string): Promise<void> {
  await updateShape(shapeId, {
    isLocked: true,
    lockedBy: userId,
    lockedAt: Date.now(),
  });
}

/**
 * Unlock a shape
 */
export async function unlockShape(shapeId: string): Promise<void> {
  await updateShape(shapeId, {
    isLocked: false,
    lockedBy: null,
    lockedAt: null, // Use null instead of undefined for Firebase compatibility
  });
}

/**
 * Batch update multiple shapes (for performance)
 */
export async function batchUpdateShapes(updates: Array<{ id: string; updates: Partial<Shape> }>): Promise<void> {
  const canvasRef = doc(db, "canvas", CANVAS_ID);
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as CanvasDocument;
    let shapes = data.shapes || [];
    
    // Apply all updates
    updates.forEach(({ id, updates: shapeUpdates }) => {
      shapes = shapes.map((shape) =>
        shape.id === id
          ? { ...shape, ...shapeUpdates, lastModifiedAt: Date.now() }
          : shape
      );
    });
    
    await updateDoc(canvasRef, {
      shapes,
      lastUpdated: serverTimestamp(),
    });
  }
}

