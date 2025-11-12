// Analytics context for tracking user interactions and application events
// Provides analytics tracking with privacy controls and event management

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Analytics event interface
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

// Analytics context interface
interface AnalyticsContextType {
  track: (eventName: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (pageName: string, properties?: Record<string, any>) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  getSessionId: () => string;
  flush: () => void;
}

// Create analytics context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Analytics provider props
interface AnalyticsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  apiKey?: string;
  debug?: boolean;
  respectDoNotTrack?: boolean;
}

// Analytics provider component
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  enabled = true,
  apiKey,
  debug = false,
  respectDoNotTrack = true
}) => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [sessionId] = useState(() => generateSessionId());
  const [userProperties, setUserPropertiesState] = useState<Record<string, any>>({});
  const [eventQueue, setEventQueue] = useState<AnalyticsEvent[]>([]);

  // Check if analytics should be disabled
  useEffect(() => {
    if (respectDoNotTrack && navigator.doNotTrack === '1') {
      setIsEnabled(false);
      return;
    }

    // Check localStorage for user preference
    try {
      const userPreference = localStorage.getItem('collabcanvas-analytics-enabled');
      if (userPreference !== null) {
        setIsEnabled(userPreference === 'true');
      }
    } catch (error) {
      console.warn('Failed to read analytics preference from localStorage:', error);
    }
  }, [respectDoNotTrack]);

  // Generate session ID
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send event to analytics service
  const sendEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!isEnabled || !apiKey) return;

    try {
      // Here you would typically send to your analytics service
      // Examples: Google Analytics, Mixpanel, Amplitude, PostHog, etc.
      
      if (debug) {
        console.log('Analytics Event:', event);
      }

      // Example: Google Analytics 4
      // if (typeof gtag !== 'undefined') {
      //   gtag('event', event.name, {
      //     ...event.properties,
      //     user_id: event.userId,
      //     session_id: event.sessionId
      //   });
      // }

      // Example: Mixpanel
      // if (typeof mixpanel !== 'undefined') {
      //   mixpanel.track(event.name, {
      //     ...event.properties,
      //     $user_id: event.userId,
      //     $session_id: event.sessionId
      //   });
      // }

      // Example: Custom analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${apiKey}`
      //   },
      //   body: JSON.stringify(event)
      // });

    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }, [isEnabled, apiKey, debug]);

  // Track event
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        ...userProperties
      },
      timestamp: Date.now(),
      userId: user?.uid,
      sessionId
    };

    // Add to queue
    setEventQueue(prev => [...prev, event]);

    // Send immediately
    sendEvent(event);
  }, [isEnabled, userProperties, user?.uid, sessionId, sendEvent]);

  // Identify user
  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    if (!isEnabled) return;

    const event: AnalyticsEvent = {
      name: 'identify',
      properties: {
        userId,
        traits
      },
      timestamp: Date.now(),
      userId,
      sessionId
    };

    sendEvent(event);
  }, [isEnabled, sessionId, sendEvent]);

  // Track page view
  const page = useCallback((pageName: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;

    const event: AnalyticsEvent = {
      name: 'page_view',
      properties: {
        page_name: pageName,
        page_url: window.location.href,
        page_path: window.location.pathname,
        ...properties
      },
      timestamp: Date.now(),
      userId: user?.uid,
      sessionId
    };

    sendEvent(event);
  }, [isEnabled, user?.uid, sessionId, sendEvent]);

  // Set user properties
  const setUserProperties = useCallback((properties: Record<string, any>) => {
    setUserPropertiesState(prev => ({ ...prev, ...properties }));
  }, []);

  // Set enabled state
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    
    try {
      localStorage.setItem('collabcanvas-analytics-enabled', enabled.toString());
    } catch (error) {
      console.warn('Failed to save analytics preference to localStorage:', error);
    }
  }, []);

  // Get session ID
  const getSessionId = useCallback(() => sessionId, [sessionId]);

  // Flush event queue
  const flush = useCallback(() => {
    eventQueue.forEach(event => sendEvent(event));
    setEventQueue([]);
  }, [eventQueue, sendEvent]);

  // Auto-identify user when they log in
  useEffect(() => {
    if (user && isEnabled) {
      identify(user.uid, {
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt instanceof Date ? user.createdAt.getTime() : user.createdAt
      });
    }
  }, [user, isEnabled, identify]);

  // Track page views on route changes
  useEffect(() => {
    if (!isEnabled) return;

    const handleRouteChange = () => {
      page(window.location.pathname);
    };

    // Track initial page view
    handleRouteChange();

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isEnabled, page]);

  // Flush events before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flush]);

  const contextValue: AnalyticsContextType = {
    track,
    identify,
    page,
    setUserProperties,
    isEnabled,
    setEnabled,
    getSessionId,
    flush
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook to use analytics context
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Hook for tracking specific events
export const useAnalyticsTracking = () => {
  const analytics = useAnalytics();

  const trackButtonClick = useCallback((buttonName: string, properties?: Record<string, any>) => {
    analytics.track('button_click', {
      button_name: buttonName,
      ...properties
    });
  }, [analytics]);

  const trackFormSubmit = useCallback((formName: string, properties?: Record<string, any>) => {
    analytics.track('form_submit', {
      form_name: formName,
      ...properties
    });
  }, [analytics]);

  const trackError = useCallback((errorType: string, errorMessage: string, properties?: Record<string, any>) => {
    analytics.track('error', {
      error_type: errorType,
      error_message: errorMessage,
      ...properties
    });
  }, [analytics]);

  const trackPerformance = useCallback((metricName: string, value: number, properties?: Record<string, any>) => {
    analytics.track('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      ...properties
    });
  }, [analytics]);

  const trackUserAction = useCallback((action: string, properties?: Record<string, any>) => {
    analytics.track('user_action', {
      action,
      ...properties
    });
  }, [analytics]);

  return {
    trackButtonClick,
    trackFormSubmit,
    trackError,
    trackPerformance,
    trackUserAction,
    track: analytics.track,
    page: analytics.page
  };
};

// Higher-order component for automatic page tracking
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  pageName?: string
) => {
  const WrappedComponent = (props: P) => {
    const { page } = useAnalytics();

    useEffect(() => {
      if (pageName) {
        page(pageName);
      }
    }, [page, pageName]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
