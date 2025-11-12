// Service worker context for managing PWA features and offline functionality
// Provides service worker registration, update management, and offline state

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Service worker state interface
interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalled: boolean;
  isUpdated: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

// Service worker context interface
interface ServiceWorkerContextType {
  state: ServiceWorkerState;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  installPrompt: () => Promise<void>;
  isInstallable: boolean;
  isUpdateAvailable: boolean;
}

// Create service worker context
const ServiceWorkerContext = createContext<ServiceWorkerContextType | undefined>(undefined);

// Service worker provider props
interface ServiceWorkerProviderProps {
  children: React.ReactNode;
  swPath?: string;
  scope?: string;
  enableNotifications?: boolean;
  enableOfflineSupport?: boolean;
}

// Service worker provider component
export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({
  children,
  swPath = '/sw.js',
  scope = '/',
  enableNotifications = true,
  enableOfflineSupport = true
}) => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalled: false,
    isUpdated: false,
    isOffline: !navigator.onLine,
    registration: null,
    error: null
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Check for service worker support
  useEffect(() => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Service workers are not supported in this browser' }));
      return;
    }
  }, [state.isSupported]);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      setState(prev => ({ ...prev, isInstalled: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register service worker
  const register = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath, { scope });
      
      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null
      }));

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available
                setState(prev => ({ ...prev, isUpdated: true }));
              } else {
                // Content is cached for the first time
                setState(prev => ({ ...prev, isInstalled: true }));
              }
            }
          });
        }
      });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to register service worker'
      }));
    }
  }, [state.isSupported, swPath, scope]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.unregister();
      setState(prev => ({
        ...prev,
        isRegistered: false,
        isInstalled: false,
        isUpdated: false,
        registration: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to unregister service worker'
      }));
    }
  }, [state.registration]);

  // Update service worker
  const update = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update service worker'
      }));
    }
  }, [state.registration]);

  // Skip waiting for new service worker
  const skipWaiting = useCallback(async () => {
    if (!state.registration || !state.registration.waiting) return;

    try {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to skip waiting'
      }));
    }
  }, [state.registration]);

  // Install app
  const installApp = useCallback(async () => {
    if (!installPrompt) return;

    try {
      const result = await installPrompt.prompt();
      console.log('Install prompt result:', result);
      
      if (result.outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstalled: true }));
      }
      
      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to install app'
      }));
    }
  }, [installPrompt]);

  // Auto-register service worker on mount
  useEffect(() => {
    if (state.isSupported && !state.isRegistered && !state.error) {
      register();
    }
  }, [state.isSupported, state.isRegistered, state.error, register]);

  // Check for updates periodically
  useEffect(() => {
    if (!state.registration) return;

    const interval = setInterval(() => {
      update();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.registration, update]);

  const contextValue: ServiceWorkerContextType = {
    state,
    register,
    unregister,
    update,
    skipWaiting,
    installPrompt: installApp,
    isInstallable,
    isUpdateAvailable: state.isUpdated
  };

  return (
    <ServiceWorkerContext.Provider value={contextValue}>
      {children}
    </ServiceWorkerContext.Provider>
  );
};

// Hook to use service worker context
export const useServiceWorker = (): ServiceWorkerContextType => {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider');
  }
  return context;
};

// Hook for offline state
export const useOffline = () => {
  const { state } = useServiceWorker();
  return state.isOffline;
};

// Service worker update notification component
export const ServiceWorkerUpdateNotification: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { state, skipWaiting, isUpdateAvailable } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Update Available
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              A new version of the app is available. Would you like to update now?
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={skipWaiting}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Install prompt component
export const InstallPrompt: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { isInstallable, installPrompt } = useServiceWorker();

  if (!isInstallable || !installPrompt) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Install App
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Install CollabCanvas for a better experience with offline access.
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={installPrompt}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => {
                  // Install prompt dismissed
                }}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Offline indicator component
export const OfflineIndicator: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 5.636m12.728 12.728L5.636 18.364" />
          </svg>
          <span className="text-sm font-medium">You're offline</span>
        </div>
      </div>
    </div>
  );
};

// Type definitions for install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}
