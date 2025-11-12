// Context-related type definitions

import type { ReactNode } from 'react';

export interface ContextProviderProps {
  children: ReactNode;
}

export interface ContextState<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface ContextActions<T = any> {
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  refresh: () => Promise<void>;
}

export interface ContextConfig {
  enableLogging: boolean;
  enableErrorBoundary: boolean;
  enableDevTools: boolean;
  maxRetries: number;
  retryDelay: number;
}
