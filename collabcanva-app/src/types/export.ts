// Export-related type definitions

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'pdf';
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  includeGrid?: boolean;
  includeShapes?: boolean;
  includeText?: boolean;
  includeImages?: boolean;
  width?: number;
  height?: number;
}

export interface ExportResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  error?: string;
  size?: number;
  format?: string;
}

export interface ExportConfig {
  defaultFormat: 'png' | 'jpeg' | 'svg' | 'pdf';
  defaultQuality: number;
  defaultScale: number;
  maxFileSize: number;
  enableCompression: boolean;
  enableWatermark: boolean;
}
