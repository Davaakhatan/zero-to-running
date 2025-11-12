// Performance-related type definitions

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  shapeCount: number;
  selectedShapeCount: number;
  isPanning: boolean;
  isZooming: boolean;
  zoomLevel: number;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  targetFPS: number;
  maxMemoryUsage: number;
  enableProfiling: boolean;
  logInterval: number;
}

export interface PerformanceState {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  isProfiling: boolean;
  history: PerformanceMetrics[];
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  type: 'fps' | 'memory' | 'render';
  level: 'warning' | 'error';
  message: string;
  timestamp: Date;
  value: number;
  threshold: number;
}
