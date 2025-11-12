// Thumbnail-related type definitions

export interface CanvasThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  backgroundColor?: string;
  forceRegenerate?: boolean;
}

export interface CanvasThumbnailResult {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  format: string;
  quality: number;
}

export interface ThumbnailGenerationRequest {
  canvasId: string;
  projectId: string;
  options: CanvasThumbnailOptions;
  priority?: 'low' | 'normal' | 'high';
  callback?: (result: CanvasThumbnailResult) => void;
}
