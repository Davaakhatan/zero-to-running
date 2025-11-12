// Utility-related type definitions

export interface DateHelpers {
  formatRelativeTime: (timestamp: number) => string;
  formatDate: (timestamp: number) => string;
  formatDateTime: (timestamp: number) => string;
  isToday: (timestamp: number) => boolean;
  isThisWeek: (timestamp: number) => boolean;
  isThisMonth: (timestamp: number) => boolean;
}

export interface ProjectFilters {
  search?: string;
  role?: string;
  isArchived?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  owner?: string;
}

export interface ProjectHelpers {
  dateHelpers: DateHelpers;
  projectFilters: ProjectFilters;
  formatFileSize: (bytes: number) => string;
  formatDuration: (ms: number) => string;
  generateId: () => string;
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
  throttle: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
}

// Removed duplicate validation types that are already defined in validation.ts

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}
