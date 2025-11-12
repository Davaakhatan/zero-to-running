// Style-related type definitions

import type { CSSProperties } from 'react';

export interface StyleProps {
  className?: string;
  style?: CSSProperties;
  variant?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  theme?: 'light' | 'dark' | 'auto';
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  success?: boolean;
  warning?: boolean;
  info?: boolean;
}

export interface StyleState {
  isHovered: boolean;
  isFocused: boolean;
  isActive: boolean;
  isDisabled: boolean;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isWarning: boolean;
  isInfo: boolean;
}

export interface StyleConfig {
  enableHover: boolean;
  enableFocus: boolean;
  enableActive: boolean;
  enableDisabled: boolean;
  enableLoading: boolean;
  enableError: boolean;
  enableSuccess: boolean;
  enableWarning: boolean;
  enableInfo: boolean;
  enableTransitions: boolean;
  transitionDuration: number;
  transitionEasing: string;
}

export interface StyleResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
