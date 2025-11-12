// Navigation-related type definitions

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  isActive?: boolean;
  isVisible?: boolean;
  order?: number;
  lastAccessed?: Date;
  children?: NavigationItem[];
}

export interface NavigationState {
  currentPath: string;
  history: string[];
  breadcrumbs: NavigationItem[];
  isNavigating: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface NavigationConfig {
  enableHistory: boolean;
  maxHistorySize: number;
  enableBreadcrumbs: boolean;
  enableKeyboardNavigation: boolean;
  enableDeepLinking: boolean;
}

export interface NavigationEvent {
  type: 'navigate' | 'back' | 'forward' | 'breadcrumb';
  from: string;
  to: string;
  timestamp: Date;
}
