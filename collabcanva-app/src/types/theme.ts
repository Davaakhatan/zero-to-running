// Theme-related type definitions

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  defaultTheme: Theme;
  enableSystemTheme: boolean;
  enableThemeTransition: boolean;
  transitionDuration: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ThemeState {
  currentTheme: Theme;
  systemTheme: Theme;
  isDark: boolean;
  isLight: boolean;
  isAuto: boolean;
  colors: ThemeColors;
}
