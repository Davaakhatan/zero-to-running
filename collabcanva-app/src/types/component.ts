// Component-related type definitions

import type { ReactNode } from 'react';

export interface ComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface ComponentState {
  isVisible: boolean;
  isMounted: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isDisabled: boolean;
}

export interface ComponentRef<T = HTMLElement> {
  current: T | null;
}

export interface ComponentConfig {
  enableLogging: boolean;
  enableErrorBoundary: boolean;
  enableDevTools: boolean;
  enableAccessibility: boolean;
  enableKeyboardNavigation: boolean;
}
