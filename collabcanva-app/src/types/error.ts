// Error-related type definitions

export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: any;
}

export interface ErrorHandler {
  handle: (error: AppError) => void;
  report: (error: AppError) => Promise<void>;
  clear: () => void;
}

export interface ErrorConfig {
  enableReporting: boolean;
  enableLogging: boolean;
  enableNotifications: boolean;
  maxErrors: number;
  reportUrl?: string;
}
