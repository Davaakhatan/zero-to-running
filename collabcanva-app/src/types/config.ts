// Config-related type definitions

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debug: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    retryDelay: number;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  canvas: {
    width: number;
    height: number;
    maxShapes: number;
    maxHistory: number;
    zoomLimits: {
      min: number;
      max: number;
    };
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    enableAnimations: boolean;
    enableTooltips: boolean;
  };
  performance: {
    enableMonitoring: boolean;
    targetFPS: number;
    maxMemoryUsage: number;
    enableProfiling: boolean;
  };
}
