// Project-aware canvas synchronization hook
// Handles real-time canvas synchronization with project-specific Firebase paths

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Shape } from "../contexts/CanvasContext";
import {
  subscribeToProjectCanvas,
  createProjectShape,
  updateProjectShape,
  updateProjectShapes,
  deleteProjectShape,
  lockProjectShape,
  unlockProjectShape,
  initializeProjectCanvas,
} from "../services/projectCanvas";

export interface UseProjectCanvasSyncProps {
  projectId: string;
  canvasId: string;
  enabled?: boolean;
}

export function useProjectCanvasSync({ 
  projectId, 
  canvasId, 
  enabled = true 
}: UseProjectCanvasSyncProps) {
  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled || !projectId || !canvasId) {
      setLoading(false);
      return;
    }

    console.log('useProjectCanvasSync: Initializing...', { projectId, canvasId });
    setLoading(true);
    setError(null);
    
    let unsubscribe: (() => void) | null = null;
    
    // Initialize canvas first, then subscribe
    initializeProjectCanvas(projectId, canvasId)
      .then(() => {
        console.log('Project canvas initialized successfully', { projectId, canvasId });
        // Subscribe to real-time updates
        unsubscribe = subscribeToProjectCanvas(projectId, canvasId, (updatedShapes) => {
          console.log('Received project canvas shapes update:', { 
            projectId, 
            canvasId, 
            shapeCount: updatedShapes.length 
          });
          setShapes(updatedShapes);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error("Failed to initialize project canvas:", err, { projectId, canvasId });
        setError(err.message);
        setLoading(false);
      });
    
    // Cleanup function
    return () => {
      console.log('useProjectCanvasSync: Cleaning up...', { projectId, canvasId });
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [projectId, canvasId, enabled]);

  // Add shape
  const addShape = useCallback(
    async (shape: Shape) => {
      console.log('useProjectCanvasSync.addShape called', { 
        projectId,
        canvasId,
        shape, 
        user, 
        hasUser: !!user,
        userId: (user as any)?.uid,
        userEmail: (user as any)?.email,
        userKeys: user ? Object.keys(user) : []
      });
      
      if (!user) {
        console.error('Cannot add shape: user is null/undefined');
        setError('You must be logged in to add shapes. Please refresh the page.');
        return;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot add shape: user.uid not found', { user });
        setError('Authentication error: User ID not found. Please log out and log back in.');
        return;
      }

      if (!projectId || !canvasId) {
        console.error('Cannot add shape: projectId or canvasId not provided', { projectId, canvasId });
        setError('Canvas not properly initialized. Please refresh the page.');
        return;
      }

      try {
        const shapeWithUser = {
          ...shape,
          createdBy: userId,
          createdAt: Date.now(),
        };
        
        console.log('Creating shape in project canvas:', { projectId, canvasId, shapeWithUser });
        await createProjectShape(projectId, canvasId, shapeWithUser);
        console.log('Shape created successfully in project canvas');
      } catch (err: any) {
        console.error("Failed to create shape in project canvas:", err);
        setError('Failed to create shape: ' + err.message);
      }
    },
    [user, projectId, canvasId]
  );

  // Update shape
  const updateShape = useCallback(
    async (shapeId: string, updates: Partial<Shape>) => {
      if (!user) {
        console.error('Cannot update shape: user is null/undefined');
        setError('You must be logged in to update shapes. Please refresh the page.');
        return;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot update shape: user.uid not found', { user });
        setError('Authentication error: User ID not found. Please log out and log back in.');
        return;
      }

      if (!projectId || !canvasId) {
        console.error('Cannot update shape: projectId or canvasId not provided', { projectId, canvasId });
        setError('Canvas not properly initialized. Please refresh the page.');
        return;
      }

      try {
        const updatesWithUser = {
          ...updates,
          lastModifiedBy: userId,
          lastModifiedAt: Date.now(),
        };
        
        console.log('Updating shape in project canvas:', { projectId, canvasId, shapeId, updatesWithUser });
        await updateProjectShape(projectId, canvasId, shapeId, updatesWithUser);
        console.log('Shape updated successfully in project canvas');
      } catch (err: any) {
        console.error("Failed to update shape in project canvas:", err);
        setError('Failed to update shape: ' + err.message);
      }
    },
    [user, projectId, canvasId]
  );

  // Update multiple shapes
  const updateShapes = useCallback(
    async (updatedShapes: Shape[]) => {
      if (!user) {
        console.error('Cannot update shapes: user is null/undefined');
        setError('You must be logged in to update shapes. Please refresh the page.');
        return;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot update shapes: user.uid not found', { user });
        setError('Authentication error: User ID not found. Please log out and log back in.');
        return;
      }

      if (!projectId || !canvasId) {
        console.error('Cannot update shapes: projectId or canvasId not provided', { projectId, canvasId });
        setError('Canvas not properly initialized. Please refresh the page.');
        return;
      }

      try {
        const shapesWithUser = updatedShapes.map(shape => ({
          ...shape,
          lastModifiedBy: userId,
          lastModifiedAt: Date.now(),
        }));
        
        console.log('Updating multiple shapes in project canvas:', { projectId, canvasId, shapeCount: shapesWithUser.length });
        await updateProjectShapes(projectId, canvasId, shapesWithUser);
        console.log('Shapes updated successfully in project canvas');
      } catch (err: any) {
        console.error("Failed to update shapes in project canvas:", err);
        setError('Failed to update shapes: ' + err.message);
      }
    },
    [user, projectId, canvasId]
  );

  // Delete shape
  const deleteShape = useCallback(
    async (shapeId: string) => {
      if (!user) {
        console.error('Cannot delete shape: user is null/undefined');
        setError('You must be logged in to delete shapes. Please refresh the page.');
        return;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot delete shape: user.uid not found', { user });
        setError('Authentication error: User ID not found. Please log out and log back in.');
        return;
      }

      if (!projectId || !canvasId) {
        console.error('Cannot delete shape: projectId or canvasId not provided', { projectId, canvasId });
        setError('Canvas not properly initialized. Please refresh the page.');
        return;
      }

      try {
        console.log('Deleting shape from project canvas:', { projectId, canvasId, shapeId });
        await deleteProjectShape(projectId, canvasId, shapeId);
        console.log('Shape deleted successfully from project canvas');
      } catch (err: any) {
        console.error("Failed to delete shape from project canvas:", err);
        setError('Failed to delete shape: ' + err.message);
      }
    },
    [user, projectId, canvasId]
  );

  // Lock shape
  const lockShape = useCallback(
    async (shapeId: string): Promise<boolean> => {
      if (!user) {
        console.error('Cannot lock shape: user is null/undefined');
        setError('You must be logged in to lock shapes. Please refresh the page.');
        return false;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot lock shape: user.uid not found', { user });
        setError('Authentication error: User ID not found. Please log out and log back in.');
        return false;
      }

      if (!projectId || !canvasId) {
        console.error('Cannot lock shape: projectId or canvasId not provided', { projectId, canvasId });
        setError('Canvas not properly initialized. Please refresh the page.');
        return false;
      }

      try {
        console.log('Locking shape in project canvas:', { projectId, canvasId, shapeId, userId });
        await lockProjectShape(projectId, canvasId, shapeId, userId);
        console.log('Shape locked successfully in project canvas');
        return true;
      } catch (err: any) {
        console.error("Failed to lock shape in project canvas:", err);
        setError('Failed to lock shape: ' + err.message);
        return false;
      }
    },
    [user, projectId, canvasId]
  );

  // Unlock shape
  const unlockShape = useCallback(
    async (shapeId: string) => {
      if (!user) {
        console.error('Cannot unlock shape: user is null/undefined');
        setError('You must be logged in to unlock shapes. Please refresh the page.');
        return;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot unlock shape: user.uid not found', { user });
        setError('Authentication error: User ID not found. Please log out and log back in.');
        return;
      }

      if (!projectId || !canvasId) {
        console.error('Cannot unlock shape: projectId or canvasId not provided', { projectId, canvasId });
        setError('Canvas not properly initialized. Please refresh the page.');
        return;
      }

      try {
        console.log('Unlocking shape in project canvas:', { projectId, canvasId, shapeId, userId });
        await unlockProjectShape(projectId, canvasId, shapeId);
        console.log('Shape unlocked successfully in project canvas');
        
        // Clear timeout if exists
      } catch (err: any) {
        console.error("Failed to unlock shape in project canvas:", err);
        setError('Failed to unlock shape: ' + err.message);
      }
    },
    [user, projectId, canvasId]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh canvas
  const refreshCanvas = useCallback(async () => {
    if (!projectId || !canvasId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await initializeProjectCanvas(projectId, canvasId);
      console.log('Canvas refreshed successfully', { projectId, canvasId });
    } catch (err: any) {
      console.error("Failed to refresh canvas:", err);
      setError('Failed to refresh canvas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, canvasId]);

  return {
    shapes,
    loading,
    error,
    addShape,
    updateShape,
    updateShapes,
    deleteShape,
    lockShape,
    unlockShape,
    clearError,
    refreshCanvas,
    // Project-specific info
    projectId,
    canvasId,
    isEnabled: enabled
  };
}

export default useProjectCanvasSync;