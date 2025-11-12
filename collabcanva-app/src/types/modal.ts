// Modal-related type definitions

import type { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  isAnimating: boolean;
  isClosing: boolean;
  isOpening: boolean;
}

export interface ModalConfig {
  enableAnimations: boolean;
  enableKeyboardNavigation: boolean;
  enableFocusTrap: boolean;
  enableBackdrop: boolean;
  enableScrollLock: boolean;
  animationDuration: number;
  animationEasing: string;
}

export interface ModalResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
