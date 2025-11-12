// Accessibility context for managing accessibility features and preferences
// Provides accessibility state management and user preference handling

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Accessibility preferences interface
interface AccessibilityPreferences {
  // Visual preferences
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  colorBlindFriendly: boolean;
  
  // Interaction preferences
  keyboardNavigation: boolean;
  screenReader: boolean;
  focusVisible: boolean;
  
  // Content preferences
  simplifiedUI: boolean;
  showTooltips: boolean;
  announceChanges: boolean;
}

// Accessibility context interface
interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  resetPreferences: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isLargeText: boolean;
  isKeyboardNavigation: boolean;
  isScreenReader: boolean;
}

// Default accessibility preferences
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  colorBlindFriendly: false,
  keyboardNavigation: false,
  screenReader: false,
  focusVisible: true,
  simplifiedUI: false,
  showTooltips: true,
  announceChanges: true
};

// Create accessibility context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Accessibility provider props
interface AccessibilityProviderProps {
  children: React.ReactNode;
  storageKey?: string;
  detectSystemPreferences?: boolean;
}

// Accessibility provider component
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  storageKey = 'collabcanvas-accessibility',
  detectSystemPreferences = true
}) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [announcementElement, setAnnouncementElement] = useState<HTMLDivElement | null>(null);

  // Detect system preferences
  useEffect(() => {
    if (!detectSystemPreferences) return;

    const detectPreferences = () => {
      const newPreferences: Partial<AccessibilityPreferences> = {};

      // Detect reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        newPreferences.reducedMotion = true;
      }

      // Detect high contrast preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        newPreferences.highContrast = true;
      }

      // Detect color scheme preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Dark mode can be considered more accessible for some users
        newPreferences.colorBlindFriendly = true;
      }

      // Detect screen reader
      if (window.navigator.userAgent.includes('NVDA') || 
          window.navigator.userAgent.includes('JAWS') ||
          window.navigator.userAgent.includes('VoiceOver')) {
        newPreferences.screenReader = true;
        newPreferences.keyboardNavigation = true;
        newPreferences.announceChanges = true;
      }

      setPreferences(prev => ({ ...prev, ...newPreferences }));
    };

    detectPreferences();

    // Listen for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ];

    const handleChange = () => detectPreferences();

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, [detectSystemPreferences]);

  // Load preferences from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences(prev => ({ ...prev, ...parsedPreferences }));
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences from storage:', error);
    }
  }, [storageKey]);

  // Save preferences to storage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save accessibility preferences to storage:', error);
    }
  }, [preferences, storageKey]);

  // Apply accessibility styles to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply large text
    if (preferences.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Apply color blind friendly
    if (preferences.colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }

    // Apply simplified UI
    if (preferences.simplifiedUI) {
      root.classList.add('simplified-ui');
    } else {
      root.classList.remove('simplified-ui');
    }

    // Apply focus visible
    if (preferences.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

  }, [preferences]);

  // Create announcement element
  useEffect(() => {
    const element = document.createElement('div');
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';
    document.body.appendChild(element);
    setAnnouncementElement(element);

    return () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);

  // Update preference
  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset preferences
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Announce message to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementElement || !preferences.announceChanges) return;

    announcementElement.setAttribute('aria-live', priority);
    announcementElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcementElement) {
        announcementElement.textContent = '';
      }
    }, 1000);
  }, [announcementElement, preferences.announceChanges]);

  // Computed properties
  const isHighContrast = preferences.highContrast;
  const isReducedMotion = preferences.reducedMotion;
  const isLargeText = preferences.largeText;
  const isKeyboardNavigation = preferences.keyboardNavigation;
  const isScreenReader = preferences.screenReader;

  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreference,
    resetPreferences,
    announce,
    isHighContrast,
    isReducedMotion,
    isLargeText,
    isKeyboardNavigation,
    isScreenReader
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const { isKeyboardNavigation, announce } = useAccessibility();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsNavigating(true);
        announce('Keyboard navigation mode activated');
      }
    };

    const handleMouseDown = () => {
      setIsNavigating(false);
    };

    if (isKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isKeyboardNavigation, announce]);

  return {
    isNavigating,
    isKeyboardNavigation
  };
};

// Accessibility settings component
export const AccessibilitySettings: React.FC<{
  className?: string;
  showAdvanced?: boolean;
}> = ({ className = '', showAdvanced = false }) => {
  const { preferences, updatePreference, resetPreferences } = useAccessibility();

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Accessibility Settings
        </h3>
        
        <div className="space-y-4">
          {/* Visual Preferences */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visual Preferences
            </h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) => updatePreference('highContrast', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  High contrast mode
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Reduce motion
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.largeText}
                  onChange={(e) => updatePreference('largeText', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Large text
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.colorBlindFriendly}
                  onChange={(e) => updatePreference('colorBlindFriendly', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Color blind friendly
                </span>
              </label>
            </div>
          </div>

          {/* Interaction Preferences */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interaction Preferences
            </h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.keyboardNavigation}
                  onChange={(e) => updatePreference('keyboardNavigation', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Enhanced keyboard navigation
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.focusVisible}
                  onChange={(e) => updatePreference('focusVisible', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Show focus indicators
                </span>
              </label>
            </div>
          </div>

          {showAdvanced && (
            <>
              {/* Content Preferences */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Preferences
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.simplifiedUI}
                      onChange={(e) => updatePreference('simplifiedUI', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Simplified interface
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.showTooltips}
                      onChange={(e) => updatePreference('showTooltips', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Show tooltips
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.announceChanges}
                      onChange={(e) => updatePreference('announceChanges', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Announce changes
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Reset Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={resetPreferences}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
