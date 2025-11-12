// Analytics-related type definitions

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface UserAnalytics {
  userId: string;
  userName: string;
  userEmail: string;
  metadata?: Record<string, any>;
  events: AnalyticsEvent[];
  sessionCount: number;
  lastActiveAt: Date;
}

export interface ProjectAnalytics {
  projectId: string;
  projectName: string;
  ownerId: string;
  memberCount: number;
  canvasCount: number;
  totalShapes: number;
  totalSessions: number;
  lastActivityAt: Date;
  events: AnalyticsEvent[];
}

export interface CanvasAnalytics {
  canvasId: string;
  projectId: string;
  canvasName: string;
  shapeCount: number;
  sessionCount: number;
  lastActivityAt: Date;
  events: AnalyticsEvent[];
}
