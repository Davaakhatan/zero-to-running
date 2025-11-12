// Animation-related type definitions

import type { ReactNode } from 'react';

export interface AnimationProps {
  children: ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'pulse' | 'shake' | 'wobble';
  duration?: number;
  delay?: number;
  easing?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
  distance?: number;
  scale?: number;
  rotation?: number;
  trigger?: 'hover' | 'focus' | 'click' | 'load' | 'scroll' | 'inview';
  loop?: boolean;
  infinite?: boolean;
  disabled?: boolean;
}

export interface AnimationState {
  isAnimating: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isReversed: boolean;
  currentFrame: number;
  totalFrames: number;
  progress: number;
}

export interface AnimationConfig {
  enableAnimations: boolean;
  enableReducedMotion: boolean;
  enableHardwareAcceleration: boolean;
  enableGPUAcceleration: boolean;
  enableWillChange: boolean;
  defaultDuration: number;
  defaultEasing: string;
  defaultDistance: number;
  defaultScale: number;
  defaultRotation: number;
}

export interface AnimationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
