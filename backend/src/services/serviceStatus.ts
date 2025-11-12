import { checkDatabaseHealth, checkRedisHealth } from './health.js';
import { isKubernetes } from '../utils/environment.js';

export interface Service {
  id: string;
  name: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

// Mock service definitions - will be replaced with actual K8s service discovery
const SERVICE_DEFINITIONS = [
  {
    id: 'api-server',
    name: 'API Server',
    endpoint: 'http://localhost:3003/health',
  },
  {
    id: 'database',
    name: 'Database',
    endpoint: 'postgres://localhost:5432',
  },
  {
    id: 'cache',
    name: 'Cache Service',
    endpoint: 'redis://localhost:6379',
  },
      {
        id: 'app-frontend',
        name: 'Application Frontend',
        endpoint: 'http://localhost:3000',
      },
      {
        id: 'dashboard-frontend',
        name: 'Dashboard Frontend',
        endpoint: 'http://localhost:3001',
      },
      {
        id: 'collabcanva',
        name: 'CollabCanva',
        endpoint: 'http://localhost:3002',
      },
];

export async function getServiceStatuses(): Promise<Service[]> {
  const services: Service[] = [];
  const now = new Date();

  for (const serviceDef of SERVICE_DEFINITIONS) {
    let status: 'operational' | 'degraded' | 'down' = 'down';
    let responseTime = 0;
    let uptime = 0;

    try {
      if (serviceDef.id === 'database') {
        const health = await checkDatabaseHealth();
        status = health.healthy ? 'operational' : 'down';
        responseTime = health.responseTime || 0;
        uptime = health.healthy ? 99.9 : 0;
      } else if (serviceDef.id === 'cache') {
        const health = await checkRedisHealth();
        status = health.healthy ? 'operational' : 'down';
        responseTime = health.responseTime || 0;
        uptime = health.healthy ? 99.8 : 0;
      } else if (serviceDef.id === 'api-server') {
        // Check self
        status = 'operational';
        responseTime = 5;
        uptime = 99.95;
      } else if (serviceDef.id === 'app-frontend') {
        // Check application frontend health endpoint
        // Try Kubernetes service name first, then Docker service name, then localhost
        const k8sUrl = 'http://app-frontend-service:3000/api/health';
        const dockerUrl = 'http://app-frontend:3000/api/health';
        const localhostUrl = 'http://localhost:3000/api/health';
        
        let healthCheckSuccess = false;
        
        // Determine which URL to try first based on environment
        const urlsToTry = isKubernetes() 
          ? [k8sUrl, dockerUrl, localhostUrl]
          : [dockerUrl, localhostUrl];
        
        for (const url of urlsToTry) {
          try {
            const startTime = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
              },
            });
            clearTimeout(timeoutId);
            responseTime = Date.now() - startTime;
            
            if (response.ok) {
              const data = await response.json() as { status?: string };
              status = data.status === 'healthy' ? 'operational' : 'degraded';
              uptime = status === 'operational' ? 99.9 : 95;
              healthCheckSuccess = true;
              break; // Success, exit loop
            } else {
              // Response not OK, try next URL
              console.log(`[ServiceStatus] ${url} returned status ${response.status}`);
              continue;
            }
          } catch (error) {
            // Log error for debugging, then try next URL
            console.log(`[ServiceStatus] Failed to check ${url}:`, error instanceof Error ? error.message : String(error));
            continue;
          }
        }
        
        // If all health endpoints failed, try root endpoints as final fallback
        if (!healthCheckSuccess) {
          const rootUrlsToTry = isKubernetes()
            ? ['http://app-frontend-service:3000', 'http://app-frontend:3000', 'http://localhost:3000']
            : ['http://app-frontend:3000', 'http://localhost:3000'];
          
          for (const url of rootUrlsToTry) {
            try {
              const startTime = Date.now();
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
              const response = await fetch(url, { 
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              responseTime = Date.now() - startTime;
              if (response.ok) {
                status = 'operational';
                uptime = 99.9;
                healthCheckSuccess = true;
                break; // Success, exit loop
              }
            } catch {
              // Try next URL
              continue;
            }
          }
        }
        
        // If all attempts failed
        if (!healthCheckSuccess) {
          status = 'down';
          responseTime = 0;
          uptime = 0;
        }
      } else if (serviceDef.id === 'dashboard-frontend') {
        // Check dashboard-frontend health endpoint
        // Try host.docker.internal (for Docker Desktop), then Docker service name, then localhost
        const hostDockerInternal = 'http://host.docker.internal:3001/api/health';
        const dockerUrl = 'http://dashboard-frontend:3000/api/health';
        const localhostUrl = 'http://localhost:3001/api/health';
        const k8sUrl = 'http://dashboard-frontend-service:3000/api/health';
        
        let healthCheckSuccess = false;
        
        // Determine which URL to try first based on environment
        // In Docker, try host.docker.internal first (works on Mac/Windows Docker Desktop),
        // then Docker service name, then localhost
        const urlsToTry = isKubernetes() 
          ? [k8sUrl, dockerUrl, localhostUrl]
          : [hostDockerInternal, dockerUrl, localhostUrl];
        
        for (const url of urlsToTry) {
          try {
            const startTime = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
              },
            });
            clearTimeout(timeoutId);
            responseTime = Date.now() - startTime;
            
            if (response.ok) {
              const data = await response.json() as { status?: string };
              status = data.status === 'healthy' ? 'operational' : 'degraded';
              uptime = status === 'operational' ? 99.9 : 95;
              healthCheckSuccess = true;
              break; // Success, exit loop
            } else {
              // Response not OK, try next URL
              console.log(`[ServiceStatus] ${url} returned status ${response.status}`);
              continue;
            }
          } catch (error) {
            // Log error for debugging, then try next URL
            console.log(`[ServiceStatus] Failed to check ${url}:`, error instanceof Error ? error.message : String(error));
            continue;
          }
        }
        
        // If all health endpoints failed, try root endpoints as final fallback
        if (!healthCheckSuccess) {
          const rootUrlsToTry = isKubernetes()
            ? ['http://dashboard-frontend-service:3000', 'http://dashboard-frontend:3000', 'http://localhost:3001']
            : ['http://dashboard-frontend:3000', 'http://localhost:3001'];
          
          for (const url of rootUrlsToTry) {
            try {
              const startTime = Date.now();
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
              const response = await fetch(url, { 
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              responseTime = Date.now() - startTime;
              if (response.ok) {
                status = 'operational';
                uptime = 99.9;
                healthCheckSuccess = true;
                break; // Success, exit loop
              }
            } catch {
              // Try next URL
              continue;
            }
          }
        }
        
        // If all attempts failed
        if (!healthCheckSuccess) {
          status = 'down';
          responseTime = 0;
          uptime = 0;
        }
      } else if (serviceDef.id === 'collabcanva') {
        // Check CollabCanva health endpoint
        // Try Docker service name first (from backend container), then localhost
        const dockerUrl = 'http://collabcanva:3002/health.json';
        const localhostUrl = 'http://localhost:3002/health.json';
        const k8sUrl = 'http://collabcanva-service:3002/health.json';
        
        let healthCheckSuccess = false;
        
        // Determine which URL to try first based on environment
        const urlsToTry = isKubernetes() 
          ? [k8sUrl, dockerUrl, localhostUrl]
          : [dockerUrl, localhostUrl];
        
        for (const url of urlsToTry) {
          try {
            const startTime = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
              },
            });
            clearTimeout(timeoutId);
            responseTime = Date.now() - startTime;
            
            if (response.ok) {
              const data = await response.json() as { status?: string };
              status = data.status === 'healthy' ? 'operational' : 'degraded';
              uptime = status === 'operational' ? 99.9 : 95;
              healthCheckSuccess = true;
              console.log(`[ServiceStatus] collabcanva health check succeeded via ${url}`);
              break; // Success, exit loop
            } else {
              // Response not OK, try next URL
              console.log(`[ServiceStatus] ${url} returned status ${response.status}`);
              continue;
            }
          } catch (error) {
            // Log error for debugging, then try next URL
            console.log(`[ServiceStatus] Failed to check ${url}:`, error instanceof Error ? error.message : String(error));
            continue;
          }
        }
        
        // If all health endpoints failed, try root endpoints as final fallback
        if (!healthCheckSuccess) {
          const rootUrlsToTry = isKubernetes()
            ? ['http://collabcanva-service:3002', 'http://collabcanva:3002', 'http://localhost:3002']
            : ['http://collabcanva:3002', 'http://localhost:3002'];
          
          for (const url of rootUrlsToTry) {
            try {
              const startTime = Date.now();
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
              const response = await fetch(url, { 
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              responseTime = Date.now() - startTime;
              if (response.ok) {
                status = 'operational';
                uptime = 99.9;
                healthCheckSuccess = true;
                console.log(`[ServiceStatus] collabcanva root check succeeded via ${url}`);
                break; // Success, exit loop
              }
            } catch (error) {
              console.log(`[ServiceStatus] Root check failed for ${url}:`, error instanceof Error ? error.message : String(error));
              // Try next URL
              continue;
            }
          }
        }
        
        // If all attempts failed, mark as down but still include in response
        if (!healthCheckSuccess) {
          console.warn(`[ServiceStatus] collabcanva health check failed for all URLs, marking as down`);
          status = 'down';
          responseTime = 0;
          uptime = 0;
        }
      }
    } catch (error) {
      console.error(`[ServiceStatus] Error checking ${serviceDef.id}:`, error);
      status = 'down';
      responseTime = 0;
      uptime = 0;
    }

    // ALWAYS add the service to the list, even if health check failed
    // This ensures all services are visible in the dashboard
    services.push({
      id: serviceDef.id,
      name: serviceDef.name,
      endpoint: serviceDef.endpoint,
      status,
      responseTime,
      uptime,
      lastChecked: now.toISOString(),
    });
  }

  // Log all services for debugging
  console.log(`[ServiceStatus] Returning ${services.length} services:`, services.map(s => `${s.id} (${s.status})`));

  return services;
}

