import { CURSOR_COLORS } from './constants';

/**
 * Generate a unique ID for shapes
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get a random cursor color for a user
 */
export function generateUserColor(userId: string): string {
  // Use userId to generate consistent color for same user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get display name from user (Google name or email prefix)
 */
export function getDisplayName(user: { displayName?: string | null; email?: string | null; uid?: string }): string {
  if (user.displayName) {
    return user.displayName.length > 20 
      ? user.displayName.substring(0, 20) + '...' 
      : user.displayName;
  }
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.length > 20 
      ? emailPrefix.substring(0, 20) + '...' 
      : emailPrefix;
  }
  return 'Anonymous';
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  let lastCall = 0;

  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = window.setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

