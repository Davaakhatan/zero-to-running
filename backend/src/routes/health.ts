import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { checkDatabaseHealth, checkRedisHealth } from '../services/health.js';

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'backend-api',
      version: '0.1.0',
    };
  });

  // Detailed health check with dependencies
  fastify.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    
    const [dbHealth, redisHealth] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const dbStatus = dbHealth.status === 'fulfilled' && dbHealth.value.healthy
      ? 'healthy'
      : 'unhealthy';
    const redisStatus = redisHealth.status === 'fulfilled' && redisHealth.value.healthy
      ? 'healthy'
      : 'unhealthy';

    // Check frontend services
    type HealthCheckResult = 
      | { healthy: true; responseTime: number; status: 'healthy' }
      | { healthy: false; responseTime: number; status: 'unhealthy'; error: string };
    
    const checkFrontendHealth = async (url: string, serviceName: string): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      try {
        fastify.log.info(`[Health Check] Attempting to check ${serviceName} at ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          fastify.log.warn(`[Health Check] ${serviceName} timeout after 5s at ${url}`);
          controller.abort();
        }, 5000); // 5 second timeout
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        fastify.log.info(`[Health Check] ${serviceName} response: ${response.status} ${response.statusText} (${responseTime}ms)`);
        
        if (!response.ok) {
          return {
            healthy: false,
            responseTime,
            status: 'unhealthy' as const,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        
        return {
          healthy: true,
          responseTime,
          status: 'healthy' as const,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Connection failed';
        const errorCause = error instanceof Error && 'cause' in error && error.cause
          ? String(error.cause)
          : undefined;
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        
        fastify.log.error({
          service: serviceName,
          url,
          responseTime,
          error: {
            name: errorName,
            message: errorMessage,
            cause: errorCause,
          }
        }, `[Health Check] ${serviceName} failed at ${url}`);
        
        return {
          healthy: false,
          responseTime: 0,
          status: 'unhealthy' as const,
          error: errorMessage || 'fetch failed',
        };
      }
    };

    // Check app-frontend (try host.docker.internal first for Docker Desktop, then Docker service name, then Kubernetes, then localhost)
    let appFrontendHealthResult: HealthCheckResult = { healthy: false, responseTime: 0, status: 'unhealthy' as const, error: 'Connection failed' };
    
    // Try host.docker.internal first (works on Mac/Windows Docker Desktop)
    appFrontendHealthResult = await checkFrontendHealth('http://host.docker.internal:3000/api/health', 'app-frontend');
    if (!appFrontendHealthResult.healthy) {
      // Try Docker service name
      appFrontendHealthResult = await checkFrontendHealth('http://app-frontend:3000/api/health', 'app-frontend');
      if (!appFrontendHealthResult.healthy) {
        // Try Kubernetes service name
        appFrontendHealthResult = await checkFrontendHealth('http://app-frontend-service:3000/api/health', 'app-frontend');
        if (!appFrontendHealthResult.healthy) {
          // Try localhost as last resort
          appFrontendHealthResult = await checkFrontendHealth('http://localhost:3000/api/health', 'app-frontend');
        }
      }
    }

    // Check dashboard-frontend (try host.docker.internal first for Docker Desktop, then Docker service name, then Kubernetes, then localhost)
    let dashboardFrontendHealthResult: HealthCheckResult = { healthy: false, responseTime: 0, status: 'unhealthy' as const, error: 'Connection failed' };
    
    // Try host.docker.internal first (works on Mac/Windows Docker Desktop)
    // Dashboard runs on port 3000 inside container, mapped to 3001 on host
    dashboardFrontendHealthResult = await checkFrontendHealth('http://host.docker.internal:3001/api/health', 'dashboard-frontend');
    if (!dashboardFrontendHealthResult.healthy) {
      // Try Docker service name (port 3000 inside container)
      dashboardFrontendHealthResult = await checkFrontendHealth('http://dashboard-frontend:3000/api/health', 'dashboard-frontend');
      if (!dashboardFrontendHealthResult.healthy) {
        // Try Kubernetes service name
        dashboardFrontendHealthResult = await checkFrontendHealth('http://dashboard-frontend-service:3000/api/health', 'dashboard-frontend');
        if (!dashboardFrontendHealthResult.healthy) {
          // Try localhost as last resort
          dashboardFrontendHealthResult = await checkFrontendHealth('http://localhost:3001/api/health', 'dashboard-frontend');
        }
      }
    }

    // Check collabcanva (try host.docker.internal first for Docker Desktop, then Docker service name, then Kubernetes, then localhost)
    let collabcanvaHealthResult: HealthCheckResult = { healthy: false, responseTime: 0, status: 'unhealthy' as const, error: 'Connection failed' };
    
    // Try host.docker.internal first (works on Mac/Windows Docker Desktop)
    collabcanvaHealthResult = await checkFrontendHealth('http://host.docker.internal:3002/health.json', 'collabcanva');
    if (!collabcanvaHealthResult.healthy) {
      // Try Docker service name
      collabcanvaHealthResult = await checkFrontendHealth('http://collabcanva:3002/health.json', 'collabcanva');
      if (!collabcanvaHealthResult.healthy) {
        // Try Kubernetes service name
        collabcanvaHealthResult = await checkFrontendHealth('http://collabcanva-service:3002/health.json', 'collabcanva');
        if (!collabcanvaHealthResult.healthy) {
          // Try localhost as last resort
          collabcanvaHealthResult = await checkFrontendHealth('http://localhost:3002/health.json', 'collabcanva');
        }
      }
    }

    const appFrontendHealth = { status: 'fulfilled' as const, value: appFrontendHealthResult };
    const dashboardFrontendHealth = { status: 'fulfilled' as const, value: dashboardFrontendHealthResult };
    const collabcanvaHealth = { status: 'fulfilled' as const, value: collabcanvaHealthResult };

    const appFrontendStatus = appFrontendHealth.status === 'fulfilled' && appFrontendHealth.value.healthy
      ? 'healthy'
      : 'unhealthy';
    const dashboardFrontendStatus = dashboardFrontendHealth.status === 'fulfilled' && dashboardFrontendHealth.value.healthy
      ? 'healthy'
      : 'unhealthy';
    const collabcanvaStatus = collabcanvaHealth.status === 'fulfilled' && collabcanvaHealth.value.healthy
      ? 'healthy'
      : 'unhealthy';

    const overallStatus = dbStatus === 'healthy' && redisStatus === 'healthy'
      ? 'healthy'
      : 'degraded';

    const responseTime = Date.now() - startTime;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'backend-api',
      responseTime,
      dependencies: {
        database: {
          status: dbStatus,
          details: dbHealth.status === 'fulfilled' 
            ? { 
                ...dbHealth.value,
                responseTime: dbHealth.value.responseTime || 0,
              }
            : { 
                error: 'Connection failed',
                responseTime: 0,
              },
        },
        redis: {
          status: redisStatus,
          details: redisHealth.status === 'fulfilled'
            ? {
                ...redisHealth.value,
                responseTime: redisHealth.value.responseTime || 0,
              }
            : { 
                error: 'Connection failed',
                responseTime: 0,
              },
        },
        'app-frontend': {
          status: appFrontendStatus,
          details: appFrontendHealth.status === 'fulfilled'
            ? {
                ...appFrontendHealth.value,
                responseTime: appFrontendHealth.value.responseTime || 0,
              }
            : {
                error: 'Connection failed',
                responseTime: 0,
              },
        },
        'dashboard-frontend': {
          status: dashboardFrontendStatus,
          details: dashboardFrontendHealth.status === 'fulfilled'
            ? {
                ...dashboardFrontendHealth.value,
                responseTime: dashboardFrontendHealth.value.responseTime || 0,
              }
            : {
                error: 'Connection failed',
                responseTime: 0,
              },
        },
        'collabcanva': {
          status: collabcanvaStatus,
          details: collabcanvaHealth.status === 'fulfilled'
            ? {
                ...collabcanvaHealth.value,
                responseTime: collabcanvaHealth.value.responseTime || 0,
              }
            : {
                error: 'Connection failed',
                responseTime: 0,
              },
        },
      },
    };
  });
}
