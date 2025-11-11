import { checkDatabaseHealth, checkRedisHealth } from './health.js';

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
        // Try Docker service name first, then localhost as fallback
        const dockerUrl = 'http://app-frontend:3000/api/health';
        const localhostUrl = 'http://localhost:3000/api/health';
        
        let healthCheckSuccess = false;
        
        // Try Docker service name first
        try {
          const startTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(dockerUrl, { 
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
          }
        } catch (dockerError) {
          // Docker service name failed, try localhost
          try {
            const startTime = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(localhostUrl, { 
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
            }
          } catch (localhostError) {
            // Both failed, try root endpoints as final fallback
            try {
              const startTime = Date.now();
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
              const response = await fetch('http://app-frontend:3000', { 
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              responseTime = Date.now() - startTime;
              if (response.ok) {
                status = 'operational';
                uptime = 99.9;
                healthCheckSuccess = true;
              }
            } catch {
              try {
                const startTime = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch('http://localhost:3000', { 
                  signal: controller.signal
                });
                clearTimeout(timeoutId);
                responseTime = Date.now() - startTime;
                if (response.ok) {
                  status = 'operational';
                  uptime = 99.9;
                  healthCheckSuccess = true;
                }
              } catch {
                // All attempts failed
                status = 'down';
                responseTime = 0;
                uptime = 0;
              }
            }
          }
        }
      }
    } catch (error) {
      status = 'down';
      responseTime = 0;
      uptime = 0;
    }

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

  return services;
}

