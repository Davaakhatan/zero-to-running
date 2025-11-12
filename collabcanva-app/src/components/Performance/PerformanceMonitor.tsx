// Performance monitoring component
// Tracks and reports performance metrics for the application

import React, { useEffect, useRef, useState } from 'react';

// Performance metrics interface
interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  appLoadTime?: number;
  routeChangeTime?: number;
  componentRenderTime?: number;
  
  // Memory usage
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  
  // Network metrics
  networkInfo?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

// Performance monitor props
interface PerformanceMonitorProps {
  children: React.ReactNode;
  enabled?: boolean;
  reportInterval?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  onPerformanceIssue?: (issue: { type: string; value: number; threshold: number }) => void;
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  lcp: 2500, // Good: < 2.5s, Needs Improvement: 2.5s - 4s, Poor: > 4s
  fid: 100,  // Good: < 100ms, Needs Improvement: 100ms - 300ms, Poor: > 300ms
  cls: 0.1,  // Good: < 0.1, Needs Improvement: 0.1 - 0.25, Poor: > 0.25
  fcp: 1800, // Good: < 1.8s, Needs Improvement: 1.8s - 3s, Poor: > 3s
  ttfb: 800  // Good: < 800ms, Needs Improvement: 800ms - 1.8s, Poor: > 1.8s
};

// Performance monitor component
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  children,
  enabled = true,
  reportInterval = 30000, // 30 seconds
  onMetricsUpdate,
  onPerformanceIssue
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const observerRef = useRef<PerformanceObserver | null>(null);
  const reportIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize performance monitoring
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const initializeMonitoring = () => {
      // Set up Core Web Vitals monitoring
      setupCoreWebVitals();
      
      // Set up custom metrics
      setupCustomMetrics();
      
      // Set up periodic reporting
      setupPeriodicReporting();
      
      // Set up memory monitoring
      setupMemoryMonitoring();
      
      // Set up network monitoring
      setupNetworkMonitoring();
    };

    // Wait for page load to start monitoring
    if (document.readyState === 'complete') {
      initializeMonitoring();
    } else {
      window.addEventListener('load', initializeMonitoring);
    }

    return () => {
      cleanup();
      window.removeEventListener('load', initializeMonitoring);
    };
  }, [enabled, reportInterval]);

  // Cleanup function
  const cleanup = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    if (reportIntervalRef.current) {
      clearInterval(reportIntervalRef.current);
      reportIntervalRef.current = null;
    }
  };

  // Set up Core Web Vitals monitoring
  const setupCoreWebVitals = () => {
    try {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          updateMetric('lcp', lastEntry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          updateMetric('fid', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            updateMetric('cls', clsValue);
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint (FCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            updateMetric('fcp', entry.startTime);
          }
        });
      }).observe({ entryTypes: ['paint'] });

    } catch (error) {
      console.warn('Failed to set up Core Web Vitals monitoring:', error);
    }
  };

  // Set up custom metrics
  const setupCustomMetrics = () => {
    // App load time
    const appLoadTime = Date.now() - startTimeRef.current;
    updateMetric('appLoadTime', appLoadTime);

    // Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      updateMetric('ttfb', navigationEntry.responseStart - navigationEntry.requestStart);
    }
  };

  // Set up periodic reporting
  const setupPeriodicReporting = () => {
    reportIntervalRef.current = setInterval(() => {
      collectAndReportMetrics();
    }, reportInterval);
  };

  // Set up memory monitoring
  const setupMemoryMonitoring = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      updateMetric('memoryUsage', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
    }
  };

  // Set up network monitoring
  const setupNetworkMonitoring = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      updateMetric('networkInfo', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
    }
  };

  // Update metric and check thresholds
  const updateMetric = (key: keyof PerformanceMetrics, value: any) => {
    setMetrics(prev => {
      const newMetrics = { ...prev, [key]: value };
      
      // Check performance thresholds
      if (typeof value === 'number' && PERFORMANCE_THRESHOLDS[key as keyof typeof PERFORMANCE_THRESHOLDS]) {
        const threshold = PERFORMANCE_THRESHOLDS[key as keyof typeof PERFORMANCE_THRESHOLDS];
        if (value > threshold && onPerformanceIssue) {
          onPerformanceIssue({
            type: key,
            value,
            threshold
          });
        }
      }
      
      return newMetrics;
    });
  };

  // Collect and report metrics
  const collectAndReportMetrics = () => {
    const currentMetrics = { ...metrics };
    
    // Add current memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      currentMetrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }

    // Report metrics
    if (onMetricsUpdate) {
      onMetricsUpdate(currentMetrics);
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', currentMetrics);
    }
  };

  // Track route change performance
  const trackRouteChange = (routeName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const routeChangeTime = endTime - startTime;
      
      updateMetric('routeChangeTime', routeChangeTime);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Route change to ${routeName} took ${routeChangeTime.toFixed(2)}ms`);
      }
    };
  };

  // Track component render performance
  const trackComponentRender = (componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      updateMetric('componentRenderTime', renderTime);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Component ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
      }
    };
  };

  // Expose tracking functions via context
  React.useEffect(() => {
    (window as any).__PERFORMANCE_MONITOR__ = {
      trackRouteChange,
      trackComponentRender,
      getMetrics: () => metrics,
      collectMetrics: collectAndReportMetrics
    };
  }, [metrics]);

  return <>{children}</>;
};

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    const monitor = (window as any).__PERFORMANCE_MONITOR__;
    if (monitor) {
      setMetrics(monitor.getMetrics());
    }
  }, []);

  const trackRouteChange = (routeName: string) => {
    const monitor = (window as any).__PERFORMANCE_MONITOR__;
    if (monitor) {
      return monitor.trackRouteChange(routeName);
    }
    return () => {};
  };

  const trackComponentRender = (componentName: string) => {
    const monitor = (window as any).__PERFORMANCE_MONITOR__;
    if (monitor) {
      return monitor.trackComponentRender(componentName);
    }
    return () => {};
  };

  return {
    metrics,
    trackRouteChange,
    trackComponentRender
  };
};

// Higher-order component for performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const { trackComponentRender } = usePerformanceMonitor();
    const endTracking = useRef<(() => void) | null>(null);

    useEffect(() => {
      endTracking.current = trackComponentRender(componentName || Component.displayName || Component.name);
      
      return () => {
        if (endTracking.current) {
          endTracking.current();
        }
      };
    }, []);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
