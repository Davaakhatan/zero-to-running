/**
 * API Client for Backend Communication
 * Handles all API calls to the backend service
 */

// API base URL - dynamically determines backend URL based on environment
const getApiBaseUrl = (): string => {
  // Server-side (SSR) can use the Kubernetes service name or Docker service name
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  }
  
  // Browser-side: detect environment and use appropriate backend URL
  const hostname = window.location.hostname;
  
  // If accessing via AWS LoadBalancer (contains .elb.amazonaws.com)
  // Try to get backend URL from runtime config or construct it
  if (hostname.includes('.elb.amazonaws.com')) {
    // Try to get from window.__BACKEND_URL__ (can be injected via script tag)
    const runtimeBackendUrl = (window as any).__BACKEND_URL__;
    if (runtimeBackendUrl) {
      return runtimeBackendUrl;
    }
    
    // Try NEXT_PUBLIC_BACKEND_URL (set at build time)
    const buildTimeBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (buildTimeBackendUrl && !buildTimeBackendUrl.includes('localhost')) {
      return buildTimeBackendUrl;
    }
    
    // Fallback: Try to fetch backend URL from a known endpoint
    // Or use a common pattern (backend LoadBalancer should be exposed)
    // For now, we'll need to set it manually or rebuild
    console.warn('Backend URL not configured for AWS LoadBalancer. API calls will fail.');
    console.warn('Set window.__BACKEND_URL__ or rebuild with NEXT_PUBLIC_BACKEND_URL');
    return 'http://localhost:3003'; // Will fail, but won't break the build
  }
  
  // If accessing via localhost (local Docker Desktop)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3003';
  }
  
  // Default: try to construct from current origin
  // If dashboard is at http://dashboard.example.com, backend might be at http://api.example.com
  const origin = window.location.origin;
  if (origin.includes('dashboard')) {
    return origin.replace('dashboard', 'api').replace(':3000', ':3003').replace(':3001', ':3003');
  }
  
  // Fallback to localhost
  return 'http://localhost:3003';
};

const API_BASE_URL = getApiBaseUrl();

export interface Service {
  id: string;
  name: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  service: string;
  message: string;
  details?: string;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  dependencies?: {
    database: {
      status: string;
      details: {
        healthy: boolean;
        responseTime?: number;
        error?: string;
      };
    };
    redis: {
      status: string;
      details: {
        healthy: boolean;
        responseTime?: number;
        error?: string;
      };
    };
  };
}

export interface Config {
  services: {
    'app-frontend': {
      port: number;
      host: string;
    };
    backend: {
      port: number;
      host: string;
    };
    database: {
      host: string;
      port: number;
      name: string;
      user: string;
    };
    redis: {
      host: string;
      port: number;
    };
  };
  healthChecks: {
    interval: number;
    timeout: number;
  };
}

export interface Prerequisite {
  name: string;
  status: 'checking' | 'installed' | 'missing';
  version?: string;
  required: boolean;
  description: string;
}

export interface SetupStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  service?: string;
  duration?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 second timeout (increased for slow compilations)
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`API request timeout for ${endpoint} (${url})`);
        throw new Error(`Request timeout: ${endpoint}`);
      }
      console.error(`API request error for ${endpoint} (${url}):`, error);
      throw error;
    }
  }

  // Health Check Endpoints
  async getHealth(): Promise<{ status: string; timestamp: string; service: string; version: string }> {
    return this.request('/health');
  }

  async getDetailedHealth(): Promise<HealthCheck> {
    return this.request('/health/detailed');
  }

  // Service Status Endpoints
  async getServices(): Promise<Service[]> {
    return this.request('/api/services');
  }

  async getService(serviceId: string): Promise<Service> {
    return this.request(`/api/services/${serviceId}`);
  }

  // Log Endpoints
  async getLogs(params?: {
    service?: string;
    level?: 'info' | 'warning' | 'error' | 'debug';
    limit?: number;
    since?: string;
  }): Promise<LogEntry[]> {
    const queryParams = new URLSearchParams();
    if (params?.service) queryParams.append('service', params.service);
    if (params?.level) queryParams.append('level', params.level);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.since) queryParams.append('since', params.since);

    const queryString = queryParams.toString();
    const endpoint = `/api/logs${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // Configuration Endpoints
  async getConfig(): Promise<Config> {
    return this.request('/api/config');
  }

  async updateConfig(config: Partial<Config>): Promise<Config> {
    return this.request('/api/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Setup Endpoints
  async getPrerequisites(): Promise<Prerequisite[]> {
    return this.request<Prerequisite[]>('/api/setup/prerequisites');
  }

  async getSetupSteps(): Promise<SetupStep[]> {
    return this.request<SetupStep[]>('/api/setup/steps');
  }

  async getSetupStatus(): Promise<{
    prerequisites: Prerequisite[];
    steps: SetupStep[];
    allPrerequisitesMet: boolean;
    completedSteps: number;
    totalSteps: number;
    progressPercentage: number;
    isComplete: boolean;
  }> {
    return this.request('/api/setup/status');
  }

  // Resources Endpoint
  async getResources(): Promise<{
    containers: Array<{
      name: string;
      id: string;
      status: string;
      cpu: number;
      memory: number;
      memoryLimit: number;
      networkIn: number;
      networkOut: number;
    }>;
    timestamp: string;
  }> {
    return this.request('/api/resources');
  }

  // Service Control Endpoints
  async startService(serviceId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/services/${serviceId}/start`, {
      method: 'POST',
      body: JSON.stringify({}), // Send empty object to satisfy Fastify's JSON body requirement
    });
  }

  async stopService(serviceId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/services/${serviceId}/stop`, {
      method: 'POST',
      body: JSON.stringify({}), // Send empty object to satisfy Fastify's JSON body requirement
    });
  }

  async restartService(serviceId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/services/${serviceId}/restart`, {
      method: 'POST',
      body: JSON.stringify({}), // Send empty object to satisfy Fastify's JSON body requirement
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience functions
export const getServices = () => apiClient.getServices();
export const getService = (id: string) => apiClient.getService(id);
export const getHealth = () => apiClient.getHealth();
export const getDetailedHealth = () => apiClient.getDetailedHealth();
export const getLogs = (params?: Parameters<typeof apiClient.getLogs>[0]) => apiClient.getLogs(params);
export const getConfig = () => apiClient.getConfig();
export const updateConfig = (config: Partial<Config>) => apiClient.updateConfig(config);
export const getPrerequisites = () => apiClient.getPrerequisites();
export const getSetupSteps = () => apiClient.getSetupSteps();
export const getSetupStatus = () => apiClient.getSetupStatus();
export const getResources = () => apiClient.getResources();
export const startService = (serviceId: string) => apiClient.startService(serviceId);
export const stopService = (serviceId: string) => apiClient.stopService(serviceId);
export const restartService = (serviceId: string) => apiClient.restartService(serviceId);

