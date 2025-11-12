import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Shape } from "../contexts/CanvasContext";
import {
  subscribeToCanvas,
  createShape as createShapeService,
  updateShape as updateShapeService,
  batchUpdateShapes as updateShapesService,
  deleteShape as deleteShapeService,
  lockShape as lockShapeService,
  unlockShape as unlockShapeService,
  initializeCanvas,
} from "../services/api-client";

export function useCanvasSync() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track lock timeouts
  const lockTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('useCanvasSync: Initializing...');
    setLoading(true);
    
    let unsubscribe: (() => void) | null = null;
    
    // Initialize canvas first, then subscribe
    initializeCanvas()
      .then(() => {
        console.log('Canvas initialized successfully');
        // Subscribe to real-time updates
        unsubscribe = subscribeToCanvas((updatedShapes) => {
          console.log('Received shapes update:', updatedShapes.length, 'shapes');
          setShapes(updatedShapes);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error("Failed to initialize canvas:", err);
        alert('Failed to connect to Firebase: ' + err.message);
        setError(err.message);
        setLoading(false);
      });
    
    // Cleanup function
    return () => {
      console.log('useCanvasSync: Cleaning up...');
      if (unsubscribe) {
        unsubscribe();
      }
      // Clear all lock timeouts
      lockTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      lockTimeoutsRef.current.clear();
    };
  }, []);

  // Add shape
  const addShape = useCallback(
    async (shape: Shape) => {
      console.log('useCanvasSync.addShape called', { 
        shape, 
        user, 
        hasUser: !!user,
        userId: (user as any)?.uid,
        userEmail: (user as any)?.email,
        userKeys: user ? Object.keys(user) : []
      });
      
      if (!user) {
        console.error('Cannot add shape: user is null/undefined');
        alert('You must be logged in to add shapes. Please refresh the page.');
        return;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot add shape: user.uid not found', { user });
        alert('Authentication error: User ID not found. Please log out and log back in.');
        return;
      }

      try {
        const shapeWithUser = {
          ...shape,
          createdBy: userId,
          createdAt: Date.now(),
        };
        
        console.log('Creating shape in Firestore:', shapeWithUser);
        await createShapeService(shapeWithUser);
        console.log('Shape created successfully');
      } catch (err: any) {
        console.error("Failed to create shape:", err);
        alert('Failed to create shape: ' + err.message);
        setError(err.message);
      }
    },
    [user]
  );

  // Update shape - immediate for real-time feel
  const updateShape = useCallback(
    async (shapeId: string, updates: Partial<Shape>) => {
      const userId = (user as any)?.uid;
      if (!userId) return;

      try {
        // Don't check lock status here - rely on UI to prevent editing locked shapes
        // This allows immediate updates and better real-time sync
        console.log('Updating shape via backend API:', shapeId, updates);
        await updateShapeService(shapeId, {
          ...updates,
          lastModifiedBy: userId,
        }, 'global-canvas-v1');
      } catch (err: any) {
        console.error("Failed to update shape:", err);
        setError(err.message);
      }
    },
    [user]
  );

  // Update multiple shapes at once (batch update)
  const updateShapes = useCallback(
    async (shapesUpdates: Array<{ id: string; updates: Partial<Shape> }>) => {
      const userId = (user as any)?.uid;
      if (!userId) return;

      try {
        console.log('Batch updating shapes:', shapesUpdates.length, 'shapes');
        // Add lastModifiedBy to all updates
        const updatesWithUser = shapesUpdates.map(({ id, updates }) => ({
          id,
          updates: { ...updates, lastModifiedBy: userId },
        }));
        await updateShapesService(updatesWithUser, 'global-canvas-v1');
      } catch (err: any) {
        console.error("Failed to batch update shapes:", err);
        setError(err.message);
      }
    },
    [user]
  );

  // Delete shape
  const deleteShape = useCallback(
    async (shapeId: string) => {
      const userId = (user as any)?.uid;
      if (!userId) return;

      try {
        // UI already prevents deleting locked shapes
        console.log('Deleting shape via backend API:', shapeId);
        await deleteShapeService(shapeId, 'global-canvas-v1');
      } catch (err: any) {
        console.error("Failed to delete shape:", err);
        setError(err.message);
      }
    },
    [user]
  );

  // Lock shape
  const lockShape = useCallback(
    async (shapeId: string) => {
      const userId = (user as any)?.uid;
      if (!userId) {
        console.error('Cannot lock: no user ID');
        return false;
      }

      try {
        // Find the current shape to check lock status
        const currentShape = shapes.find(s => s.id === shapeId);
        if (currentShape) {
          // If locked, check if stale (older than 10 seconds)
          if (currentShape.isLocked && currentShape.lockedAt) {
            const lockAge = Date.now() - currentShape.lockedAt;
            if (lockAge > 10000) {
              console.log(`Stale lock detected (${lockAge}ms old), force unlocking shape ${shapeId}`);
              await unlockShapeService(shapeId, 'global-canvas-v1');
            } else if (currentShape.lockedBy !== userId) {
              console.warn(`Shape ${shapeId} is locked by another user (lock age: ${lockAge}ms)`);
              return false;
            }
          }
        }

        console.log(`Locking shape ${shapeId} for user ${userId}`);
        await lockShapeService(shapeId, userId, 'global-canvas-v1');
        
        // Auto-unlock after 15 seconds as safety fallback
        const timeout = window.setTimeout(() => {
          console.log(`Safety timeout (15s): force unlocking shape ${shapeId}`);
          unlockShapeService(shapeId, 'global-canvas-v1');
          lockTimeoutsRef.current.delete(shapeId);
        }, 15000);
        
        lockTimeoutsRef.current.set(shapeId, timeout);
        return true;
      } catch (err: any) {
        console.error("Failed to lock shape:", err);
        return false;
      }
    },
    [user, shapes]
  );

  // Unlock shape
  const unlockShape = useCallback(
    async (shapeId: string) => {
      const userId = (user as any)?.uid;
      if (!userId) return;

      try {
        // Clear timeout if exists
        const timeout = lockTimeoutsRef.current.get(shapeId);
        if (timeout) {
          clearTimeout(timeout);
          lockTimeoutsRef.current.delete(shapeId);
        }

        console.log(`[useCanvasSync] Unlocking shape ${shapeId} by user ${userId}`);
        await unlockShapeService(shapeId, 'global-canvas-v1');
      } catch (err: any) {
        console.error("Failed to unlock shape:", err);
      }
    },
    [user]
  );

  return {
    shapes,
    loading,
    error,
    setShapes,
    addShape,
    updateShape,
    updateShapes,
    deleteShape,
    lockShape,
    unlockShape,
  };
}

