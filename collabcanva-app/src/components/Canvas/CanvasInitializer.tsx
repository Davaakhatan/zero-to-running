// CanvasInitializer component for setting up project canvas context
// Handles setting the current project and canvas in the ProjectCanvasContext

import React, { useEffect, useRef } from 'react';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';

interface CanvasInitializerProps {
  projectId: string;
  canvasId: string;
  children: React.ReactNode;
}

export const CanvasInitializer: React.FC<CanvasInitializerProps> = ({
  projectId,
  canvasId,
  children
}) => {
  const { setCurrentCanvas } = useProjectCanvas();
  const initializedRef = useRef<string | null>(null);

  // Set the current canvas when projectId or canvasId changes
  useEffect(() => {
    const key = `${projectId}-${canvasId}`;
    
    // Only initialize once for each project-canvas combination
    if (initializedRef.current === key) {
      return;
    }
    
    console.log('[CanvasInitializer] Initializing canvas', { projectId, canvasId });
    
    if (projectId && canvasId) {
      initializedRef.current = key;
      setCurrentCanvas(projectId, canvasId);
    } else {
      console.warn('[CanvasInitializer] Missing projectId or canvasId', { projectId, canvasId });
    }
  }, [projectId, canvasId, setCurrentCanvas]);

  return <>{children}</>;
};

export default CanvasInitializer;
