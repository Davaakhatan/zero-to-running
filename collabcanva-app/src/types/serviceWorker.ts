// Service Worker-related type definitions

export interface ServiceWorkerState {
  isSupported: boolean;
  isInstalled: boolean;
  isUpdating: boolean;
  isActivated: boolean;
  isControlled: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

export interface ServiceWorkerConfig {
  enableNotifications: boolean;
  enableOfflineSupport: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  cacheStrategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
  maxCacheSize: number;
  maxCacheAge: number;
}

export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
  timestamp: Date;
  source: 'main' | 'worker';
}

export interface ServiceWorkerEvent {
  type: 'install' | 'activate' | 'message' | 'error' | 'updatefound';
  payload?: any;
  timestamp: Date;
}
