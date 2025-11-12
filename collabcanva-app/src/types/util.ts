// Utility-related type definitions

export interface UtilityConfig {
  enableLogging: boolean;
  enableCaching: boolean;
  enableValidation: boolean;
  enableSanitization: boolean;
  maxCacheSize: number;
  cacheTimeout: number;
}

export interface UtilityState {
  isInitialized: boolean;
  isEnabled: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface UtilityResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface UtilityError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}
