// Notification-related type definitions

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  enablePush: boolean;
  enableEmail: boolean;
  enableInApp: boolean;
  maxNotifications: number;
  autoDismiss: boolean;
  dismissDelay: number;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isEnabled: boolean;
  permission: NotificationPermission;
}
