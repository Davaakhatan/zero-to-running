// Project-aware canvas service for multi-project system
// Handles canvas synchronization with project-specific Firebase paths

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

export interface ProjectCanvasDocument {
  canvasId: string;
  projectId: string;
  shapes: Shape[];
  lastUpdated: any; // Firestore Timestamp
  metadata?: {
    name?: string;
    description?: string;
    thumbnail?: string;
    createdBy?: string;
    createdAt?: number;
    lastModifiedBy?: string;
    lastModifiedAt?: number;
  };
}

/**
 * Get Firebase path for project canvas
 */
export function getProjectCanvasPath(projectId: string, canvasId: string): string {
  return `projects/${projectId}/canvases/${canvasId}`;
}

/**
 * Initialize project canvas document if it doesn't exist
 */
export async function initializeProjectCanvas(
  projectId: string, 
  canvasId: string,
  metadata?: ProjectCanvasDocument['metadata']
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (!canvasDoc.exists()) {
    await setDoc(canvasRef, {
      canvasId,
      projectId,
      shapes: [],
      lastUpdated: serverTimestamp(),
      metadata: {
        name: metadata?.name || 'Untitled Canvas',
        description: metadata?.description || '',
        thumbnail: metadata?.thumbnail || '',
        createdBy: metadata?.createdBy || '',
        createdAt: Date.now(),
        lastModifiedBy: metadata?.lastModifiedBy || '',
        lastModifiedAt: Date.now(),
        ...metadata
      }
    });
  }
}

/**
 * Subscribe to project canvas changes in real-time
 */
export function subscribeToProjectCanvas(
  projectId: string,
  canvasId: string,
  callback: (shapes: Shape[]) => void
): Unsubscribe {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  
  return onSnapshot(canvasRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as ProjectCanvasDocument;
      callback(data.shapes || []);
    } else {
      // Initialize if doesn't exist
      initializeProjectCanvas(projectId, canvasId).then(() => callback([]));
    }
  });
}

/**
 * Create a new shape in project canvas
 */
export async function createProjectShape(
  projectId: string,
  canvasId: string,
  shape: Shape
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as ProjectCanvasDocument;
    const shapes = data.shapes || [];
    
    await updateDoc(canvasRef, {
      shapes: [...shapes, shape],
      lastUpdated: serverTimestamp(),
      'metadata.lastModifiedAt': Date.now(),
      'metadata.lastModifiedBy': shape.createdBy
    });
  } else {
    await initializeProjectCanvas(projectId, canvasId);
    await createProjectShape(projectId, canvasId, shape);
  }
}

/**
 * Update an existing shape in project canvas
 */
export async function updateProjectShape(
  projectId: string,
  canvasId: string,
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as ProjectCanvasDocument;
    const shapes = data.shapes || [];
    
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId
        ? { ...shape, ...updates, lastModifiedAt: Date.now() }
        : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
      'metadata.lastModifiedAt': Date.now(),
      'metadata.lastModifiedBy': updates.lastModifiedBy || updates.createdBy
    });
  }
}

/**
 * Update multiple shapes in project canvas
 */
export async function updateProjectShapes(
  projectId: string,
  canvasId: string,
  shapes: Shape[]
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  
  await updateDoc(canvasRef, {
    shapes,
    lastUpdated: serverTimestamp(),
    'metadata.lastModifiedAt': Date.now()
  });
}

/**
 * Delete a shape from project canvas
 */
export async function deleteProjectShape(
  projectId: string,
  canvasId: string,
  shapeId: string
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as ProjectCanvasDocument;
    const shapes = data.shapes || [];
    
    const updatedShapes = shapes.filter((shape) => shape.id !== shapeId);
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
      'metadata.lastModifiedAt': Date.now()
    });
  }
}

/**
 * Lock a shape in project canvas
 */
export async function lockProjectShape(
  projectId: string,
  canvasId: string,
  shapeId: string,
  userId: string
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as ProjectCanvasDocument;
    const shapes = data.shapes || [];
    
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId
        ? { 
            ...shape, 
            isLocked: true, 
            lockedBy: userId, 
            lockedAt: Date.now(),
            lastModifiedAt: Date.now()
          }
        : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
      'metadata.lastModifiedAt': Date.now()
    });
  }
}

/**
 * Unlock a shape in project canvas
 */
export async function unlockProjectShape(
  projectId: string,
  canvasId: string,
  shapeId: string
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as ProjectCanvasDocument;
    const shapes = data.shapes || [];
    
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId
        ? { 
            ...shape, 
            isLocked: false, 
            lockedBy: null, 
            lockedAt: null,
            lastModifiedAt: Date.now()
          }
        : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
      'metadata.lastModifiedAt': Date.now()
    });
  }
}

/**
 * Get project canvas metadata
 */
export async function getProjectCanvasMetadata(
  projectId: string,
  canvasId: string
): Promise<ProjectCanvasDocument['metadata'] | null> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as ProjectCanvasDocument;
    return data.metadata || null;
  }
  
  return null;
}

/**
 * Update project canvas metadata
 */
export async function updateProjectCanvasMetadata(
  projectId: string,
  canvasId: string,
  metadata: Partial<ProjectCanvasDocument['metadata']>
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    const data = canvasDoc.data() as ProjectCanvasDocument;
    const currentMetadata = data.metadata || {};
    
    await updateDoc(canvasRef, {
      metadata: {
        ...currentMetadata,
        ...metadata,
        lastModifiedAt: Date.now()
      },
      lastUpdated: serverTimestamp()
    });
  }
}

/**
 * Delete project canvas
 */
export async function deleteProjectCanvas(
  projectId: string,
  canvasId: string
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  await setDoc(canvasRef, {
    canvasId,
    projectId,
    shapes: [],
    lastUpdated: serverTimestamp(),
    metadata: {
      name: 'Deleted Canvas',
      description: '',
      thumbnail: '',
      createdBy: '',
      createdAt: Date.now(),
      lastModifiedBy: '',
      lastModifiedAt: Date.now(),
      deleted: true
    }
  });
}

/**
 * Duplicate project canvas
 */
export async function duplicateProjectCanvas(
  sourceProjectId: string,
  sourceCanvasId: string,
  targetProjectId: string,
  targetCanvasId: string,
  newName?: string
): Promise<void> {
  const sourceRef = doc(db, getProjectCanvasPath(sourceProjectId, sourceCanvasId));
  const sourceDoc = await getDoc(sourceRef);
  
  if (sourceDoc.exists()) {
    const sourceData = sourceDoc.data() as ProjectCanvasDocument;
    
    const targetRef = doc(db, getProjectCanvasPath(targetProjectId, targetCanvasId));
    await setDoc(targetRef, {
      canvasId: targetCanvasId,
      projectId: targetProjectId,
      shapes: sourceData.shapes.map(shape => ({
        ...shape,
        id: `${shape.id}-copy-${Date.now()}`,
        createdBy: sourceData.metadata?.createdBy || '',
        createdAt: Date.now(),
        lastModifiedBy: sourceData.metadata?.createdBy || '',
        lastModifiedAt: Date.now(),
        isLocked: false,
        lockedBy: null,
        lockedAt: null
      })),
      lastUpdated: serverTimestamp(),
      metadata: {
        ...sourceData.metadata,
        name: newName || `${sourceData.metadata?.name || 'Canvas'} (Copy)`,
        createdAt: Date.now(),
        lastModifiedAt: Date.now()
      }
    });
  }
}

/**
 * Export project canvas data
 */
export async function exportProjectCanvas(
  projectId: string,
  canvasId: string
): Promise<ProjectCanvasDocument | null> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  const canvasDoc = await getDoc(canvasRef);
  
  if (canvasDoc.exists()) {
    return canvasDoc.data() as ProjectCanvasDocument;
  }
  
  return null;
}

/**
 * Import project canvas data
 */
export async function importProjectCanvas(
  projectId: string,
  canvasId: string,
  canvasData: ProjectCanvasDocument
): Promise<void> {
  const canvasRef = doc(db, getProjectCanvasPath(projectId, canvasId));
  
  await setDoc(canvasRef, {
    ...canvasData,
    canvasId,
    projectId,
    lastUpdated: serverTimestamp(),
    'metadata.lastModifiedAt': Date.now()
  });
}

export default {
  getProjectCanvasPath,
  initializeProjectCanvas,
  subscribeToProjectCanvas,
  createProjectShape,
  updateProjectShape,
  updateProjectShapes,
  deleteProjectShape,
  lockProjectShape,
  unlockProjectShape,
  getProjectCanvasMetadata,
  updateProjectCanvasMetadata,
  deleteProjectCanvas,
  duplicateProjectCanvas,
  exportProjectCanvas,
  importProjectCanvas
};