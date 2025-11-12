import { useState, useCallback, useEffect, useRef } from 'react';
import type { Shape } from '../contexts/CanvasContext';

interface HistoryState {
  shapes: Shape[];
  selectedIds: string[];
  timestamp: number;
  actionId: string;
}

const MAX_HISTORY = 50; // Maximum number of undo states

export function useHistory(
  currentShapes: Shape[],
  selectedIds: string[],
  onRestore: (shapes: Shape[], selectedIds: string[]) => void
) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isRestoringRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const lastSavedStateRef = useRef<string>('');
  const actionCounterRef = useRef(0);

  // Initialize history with current state on first load
  useEffect(() => {
    if (!hasInitializedRef.current && currentShapes.length >= 0) {
      const initialState: HistoryState = {
        shapes: JSON.parse(JSON.stringify(currentShapes)),
        selectedIds: [...selectedIds],
        timestamp: Date.now(),
        actionId: `init_${Date.now()}`,
      };
      
      setHistory([initialState]);
      setCurrentIndex(0);
      hasInitializedRef.current = true;
      lastSavedStateRef.current = JSON.stringify(initialState);
      
      console.log('🚀 [useHistory] Initialized with:', { 
        shapeCount: initialState.shapes.length, 
        selectedIdsCount: initialState.selectedIds.length,
        actionId: initialState.actionId
      });
    }
  }, [currentShapes.length, selectedIds.length]);

  // Re-initialize history when shapes change significantly (e.g., from empty to having shapes)
  useEffect(() => {
    if (hasInitializedRef.current && history.length === 0 && currentShapes.length > 0) {
      console.log('🔄 [useHistory] Re-initializing history due to shape changes');
      const initialState: HistoryState = {
        shapes: JSON.parse(JSON.stringify(currentShapes)),
        selectedIds: [...selectedIds],
        timestamp: Date.now(),
        actionId: `reinit_${Date.now()}`,
      };
      
      setHistory([initialState]);
      setCurrentIndex(0);
      lastSavedStateRef.current = JSON.stringify(initialState);
    }
  }, [currentShapes.length, selectedIds.length]);

  // Save current state to history
  const pushState = useCallback(() => {
    actionCounterRef.current += 1;
    const actionId = `action_${actionCounterRef.current}_${Date.now()}`;
    
    console.log('💾 [useHistory] pushState called', { 
      isRestoring: isRestoringRef.current,
      shapeCount: currentShapes.length,
      selectedIdsCount: selectedIds.length,
      currentIndex,
      historyLength: history.length,
      actionId
    });
    
    // Don't save to history if we're currently restoring
    if (isRestoringRef.current) {
      console.log('🚫 [useHistory] Skipping save - currently restoring');
      return;
    }
    
    // Validate current state before saving
    if (!currentShapes || !Array.isArray(currentShapes) || 
        !selectedIds || !Array.isArray(selectedIds)) {
      console.log('❌ [useHistory] Invalid state - cannot save');
      return;
    }
    
    // Create a deep copy of the current state
    const newState: HistoryState = {
      shapes: JSON.parse(JSON.stringify(currentShapes)),
      selectedIds: [...selectedIds],
      timestamp: Date.now(),
      actionId,
    };
    
    // Create a string representation for comparison
    const newStateString = JSON.stringify(newState);
    
    // Skip if this state is identical to the last saved state
    if (newStateString === lastSavedStateRef.current) {
      console.log('🚫 [useHistory] Skipping save - state unchanged');
      return;
    }
    
    console.log('✅ [useHistory] Saving state to history', { 
      newStateShapeCount: newState.shapes.length,
      newStateSelectedIdsCount: newState.selectedIds.length,
      actionId,
      shapes: newState.shapes.map(s => ({ id: s.id, type: s.type, x: s.x, y: s.y }))
    });
    
    setHistory((prev) => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      
      const newIndex = newHistory.length - 1;
      setCurrentIndex(newIndex);
      
      console.log('📝 [useHistory] History updated', { 
        newLength: newHistory.length, 
        newIndex: newIndex,
        previousLength: prev.length,
        lastStateShapes: newHistory[newIndex]?.shapes?.map(s => ({ id: s.id, type: s.type, x: s.x, y: s.y })),
        actionId
      });
      
      return newHistory;
    });
    
    // Update the last saved state reference
    lastSavedStateRef.current = newStateString;
  }, [currentShapes, selectedIds, currentIndex]);

  // Force save current state (useful for ensuring final state is captured)
  const forceSave = useCallback(() => {
    console.log('💾 [useHistory] Force save called');
    pushState();
  }, [pushState]);

  // Undo function
  const undo = useCallback(() => {
    console.log('↩️ [useHistory] Undo called', { 
      currentIndex, 
      historyLength: history.length, 
      canUndo: currentIndex > 0 
    });
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const stateToRestore = history[newIndex];
      
      if (stateToRestore) {
        console.log('↩️ [useHistory] Undo to index', { 
          newIndex, 
          stateExists: true, 
          stateShapes: stateToRestore.shapes.length, 
          stateSelectedIdsCount: stateToRestore.selectedIds.length,
          actionId: stateToRestore.actionId
        });
        
        isRestoringRef.current = true;
        setCurrentIndex(newIndex);
        
        // Restore the state
        onRestore(stateToRestore.shapes, stateToRestore.selectedIds);
        
        // Reset the restoring flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
        
        console.log('✅ [useHistory] Undo completed', { newIndex, actionId: stateToRestore.actionId });
      } else {
        console.log('❌ [useHistory] Undo failed - state not found at index', newIndex);
      }
    } else {
      console.log('❌ [useHistory] Undo failed - no more history to undo');
    }
  }, [currentIndex, history, onRestore]);

  // Redo function
  const redo = useCallback(() => {
    console.log('↪️ [useHistory] Redo called', { 
      currentIndex, 
      historyLength: history.length, 
      canRedo: currentIndex < history.length - 1 
    });
    
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const stateToRestore = history[newIndex];
      
      if (stateToRestore) {
        console.log('↪️ [useHistory] Redo to index', { 
          newIndex, 
          stateExists: true, 
          stateShapes: stateToRestore.shapes.length, 
          stateSelectedIdsCount: stateToRestore.selectedIds.length,
          actionId: stateToRestore.actionId
        });
        
        isRestoringRef.current = true;
        setCurrentIndex(newIndex);
        
        // Restore the state
        onRestore(stateToRestore.shapes, stateToRestore.selectedIds);
        
        // Reset the restoring flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
        
        console.log('✅ [useHistory] Redo completed', { newIndex, actionId: stateToRestore.actionId });
      } else {
        console.log('❌ [useHistory] Redo failed - state not found at index', newIndex);
      }
    } else {
      console.log('❌ [useHistory] Redo failed - no more history to redo');
    }
  }, [currentIndex, history, onRestore]);

  // Calculate if undo/redo are possible
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Debug logging
  useEffect(() => {
    console.log('🔍 [useHistory] State:', { 
      currentIndex, 
      historyLength: history.length, 
      canUndo, 
      canRedo, 
      currentShapesCount: currentShapes.length,
      currentSelectedIdsCount: selectedIds.length,
      historyActions: history.map((h, i) => ({ 
        index: i, 
        shapes: h.shapes.length, 
        actionId: h.actionId 
      }))
    });
  }, [currentIndex, history.length, canUndo, canRedo, currentShapes.length, selectedIds.length, history]);

  return {
    pushState,
    forceSave,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}