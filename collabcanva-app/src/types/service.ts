// Service-related type definitions

export interface ServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
}

export interface ServiceState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  error?: string;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp: Date;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: Date;
}
