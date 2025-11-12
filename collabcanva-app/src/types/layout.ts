// Layout-related type definitions

import type { ReactNode } from 'react';

export interface LayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'minimal' | 'fullscreen';
  showHeader?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
  showBreadcrumb?: boolean;
  showBackButton?: boolean;
  showQuickActions?: boolean;
}

export interface LayoutState {
  isCollapsed: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isFullscreen: boolean;
  isSidebarOpen: boolean;
  isHeaderVisible: boolean;
  isFooterVisible: boolean;
}

export interface LayoutConfig {
  enableResponsive: boolean;
  enableCollapsible: boolean;
  enableFullscreen: boolean;
  enableKeyboardNavigation: boolean;
  enableTouchGestures: boolean;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface LayoutResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
