// Constant-related type definitions

export interface AppConstants {
  VERSION: string;
  BUILD_DATE: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  API_BASE_URL: string;
  FIREBASE_CONFIG: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  OPENAI_API_KEY: string;
  MAX_FILE_SIZE: number;
  MAX_SHAPES: number;
  MAX_HISTORY: number;
  CANVAS_SIZE: {
    width: number;
    height: number;
  };
  DEFAULT_SHAPE_SIZE: {
    width: number;
    height: number;
  };
  DEFAULT_COLORS: string[];
  DEFAULT_FONT_FAMILY: string;
  DEFAULT_FONT_SIZE: number;
  ZOOM_LIMITS: {
    min: number;
    max: number;
  };
  PAN_LIMITS: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}
