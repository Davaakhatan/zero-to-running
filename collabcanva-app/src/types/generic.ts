// Generic-related type definitions

export interface GenericResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface GenericState<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface GenericActions<T = any> {
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  refresh: () => Promise<void>;
}

export interface GenericConfig {
  enableLogging: boolean;
  enableErrorBoundary: boolean;
  enableDevTools: boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface GenericResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
