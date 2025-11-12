// Event-related type definitions

export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: Date;
  source: string;
  userId?: string;
  projectId?: string;
  canvasId?: string;
}

export interface EventHandler<T = any> {
  (event: AppEvent & { payload: T }): void;
}

export interface EventConfig {
  enableLogging: boolean;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  maxEventHistory: number;
  eventTimeout: number;
}

export interface EventState {
  isEnabled: boolean;
  isLogging: boolean;
  isAnalytics: boolean;
  isErrorReporting: boolean;
  eventCount: number;
  lastEvent?: AppEvent;
}
