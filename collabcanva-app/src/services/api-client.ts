/**
 * API Client for CollabCanva - uses backend API instead of Firebase
 */

// API URL - supports multiple environments:
// 1. Browser with port-forward: localhost:3003 (ALWAYS prioritize this when on localhost)
// 2. Browser via AWS LoadBalancer: use backend LoadBalancer URL (from VITE_API_URL)
// 3. Browser via custom domain/ingress: construct from current hostname (api.domain.com)
const getApiBaseUrl = (): string => {
  // If running in browser (client-side)
  if (typeof window !== 'undefined') {
    // ALWAYS use localhost for port-forwarding (highest priority)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3003';
    }
    
    // Check if we have a configured API URL (from build-time env var) - only use if not localhost
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1') && !envApiUrl.includes('backend-service')) {
      return envApiUrl;
    }
    
    // If accessing via AWS LoadBalancer, use backend LoadBalancer URL
    const hostname = window.location.hostname;
    if (hostname.includes('.elb.amazonaws.com')) {
      // Backend LoadBalancer URL should be set via VITE_API_URL at build time
      // Fallback: try to get from window (runtime injection)
      const runtimeBackendUrl = (window as any).__BACKEND_URL__;
      if (runtimeBackendUrl) {
        return runtimeBackendUrl;
      }
      
      // If VITE_API_URL is set and contains elb.amazonaws.com, use it
      if (envApiUrl && envApiUrl.includes('.elb.amazonaws.com')) {
        return envApiUrl;
      }
      
      // Last resort: construct from current hostname (won't work, but won't break)
      console.warn('Backend LoadBalancer URL not configured. API calls will fail.');
      return 'http://localhost:3003'; // Will fail, but won't break the build
    }
    
    // Running via custom domain/ingress - construct API URL from current hostname
    // Pattern: if on collabcanva.yourdomain.com, use api.yourdomain.com
    const protocol = window.location.protocol;
    
    if (hostname.includes('collabcanva')) {
      // Replace collabcanva with api subdomain
      const domainParts = hostname.split('.');
      if (domainParts.length > 1) {
        domainParts[0] = 'api';
        return `${protocol}//${domainParts.join('.')}`;
      }
    }
    
    // Fallback: try api subdomain on same domain
    const domainParts = hostname.split('.');
    if (domainParts.length > 1) {
      domainParts[0] = 'api';
      return `${protocol}//${domainParts.join('.')}`;
    }
    
    // Last resort: same origin (if API is proxied)
    return `${protocol}//${hostname}`;
  }
  
  // Server-side (shouldn't happen with Vite, but just in case)
  const envApiUrl = import.meta.env.VITE_API_URL;
  return envApiUrl || 'http://backend-service:3003';
};

const API_BASE_URL = getApiBaseUrl();

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
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
  [key: string]: any;
}

export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  lastUpdated: string;
}

/**
 * Get canvas document
 */
export async function getCanvas(canvasId: string = 'global-canvas-v1'): Promise<CanvasDocument> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/canvas?canvasId=${canvasId}`);
  if (!response.ok) {
    throw new Error(`Failed to get canvas: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Initialize canvas
 */
export async function initializeCanvas(canvasId: string = 'global-canvas-v1'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/canvas/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canvasId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to initialize canvas: ${response.statusText}`);
  }
}

/**
 * Create a shape
 */
export async function createShape(shape: Shape, canvasId: string = 'global-canvas-v1'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/shapes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shape, canvasId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create shape: ${response.statusText}`);
  }
}

/**
 * Update a shape
 */
export async function updateShape(
  shapeId: string,
  updates: Partial<Shape>,
  canvasId: string = 'global-canvas-v1'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/shapes/${shapeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, canvasId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update shape: ${response.statusText}`);
  }
}

/**
 * Delete a shape
 */
export async function deleteShape(shapeId: string, canvasId: string = 'global-canvas-v1'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/shapes/${shapeId}?canvasId=${canvasId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete shape: ${response.statusText}`);
  }
}

/**
 * Lock a shape
 */
export async function lockShape(
  shapeId: string,
  userId: string,
  canvasId: string = 'global-canvas-v1'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/shapes/${shapeId}/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, canvasId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to lock shape: ${response.statusText}`);
  }
}

/**
 * Unlock a shape
 */
export async function unlockShape(shapeId: string, canvasId: string = 'global-canvas-v1'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/shapes/${shapeId}/unlock?canvasId=${canvasId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to unlock shape: ${response.statusText}`);
  }
}

/**
 * Batch update shapes
 */
export async function batchUpdateShapes(
  updates: Array<{ id: string; updates: Partial<Shape> }>,
  canvasId: string = 'global-canvas-v1'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collabcanva/shapes/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, canvasId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to batch update shapes: ${response.statusText}`);
  }
}

/**
 * Subscribe to canvas changes (polling-based for now)
 * TODO: Implement WebSocket support for real-time updates
 */
export function subscribeToCanvas(
  callback: (shapes: Shape[]) => void,
  canvasId: string = 'global-canvas-v1',
  pollInterval: number = 500 // Poll every 500ms for real-time feel
): () => void {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const canvas = await getCanvas(canvasId);
      callback(canvas.shapes || []);
    } catch (error) {
      console.error('Error polling canvas:', error);
    }
    
    if (isActive) {
      setTimeout(poll, pollInterval);
    }
  };
  
  // Start polling
  poll();
  
  // Return unsubscribe function
  return () => {
    isActive = false;
  };
}

