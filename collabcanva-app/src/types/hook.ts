// Hook-related type definitions

export interface HookState<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface HookActions<T = any> {
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  refresh: () => Promise<void>;
}

export interface HookConfig {
  enableLogging: boolean;
  enableErrorBoundary: boolean;
  enableDevTools: boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface HookResult<T = any> extends HookState<T>, HookActions<T> {
  config: HookConfig;
}
