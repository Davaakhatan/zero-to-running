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
    const checkFrontendHealth = async (url: string, serviceName: string) => {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          signal: AbortSignal.timeout(3000),
          headers: { 'Accept': 'application/json' },
        });
        const responseTime = Date.now() - startTime;
        return {
          healthy: response.ok,
          responseTime,
          status: response.ok ? 'healthy' : 'unhealthy',
        };
      } catch (error) {
        return {
          healthy: false,
          responseTime: 0,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Connection failed',
        };
      }
    };

    // Check app-frontend (try Docker service name first, then localhost)
    let appFrontendHealthResult;
    try {
      appFrontendHealthResult = await checkFrontendHealth('http://app-frontend:3000/api/health', 'app-frontend');
    } catch {
      try {
        appFrontendHealthResult = await checkFrontendHealth('http://localhost:3000/api/health', 'app-frontend');
      } catch {
        appFrontendHealthResult = { healthy: false, responseTime: 0, status: 'unhealthy', error: 'Connection failed' };
      }
    }

    // Check dashboard-frontend (try Docker service name first, then localhost)
    let dashboardFrontendHealthResult;
    try {
      // Dashboard runs on port 3000 inside container, mapped to 3001 on host
      dashboardFrontendHealthResult = await checkFrontendHealth('http://dashboard-frontend:3000', 'dashboard-frontend');
    } catch {
      try {
        dashboardFrontendHealthResult = await checkFrontendHealth('http://localhost:3001', 'dashboard-frontend');
      } catch {
        dashboardFrontendHealthResult = { healthy: false, responseTime: 0, status: 'unhealthy', error: 'Connection failed' };
      }
    }

    const appFrontendHealth = { status: 'fulfilled' as const, value: appFrontendHealthResult };
    const dashboardFrontendHealth = { status: 'fulfilled' as const, value: dashboardFrontendHealthResult };

    const appFrontendStatus = appFrontendHealth.status === 'fulfilled' && appFrontendHealth.value.healthy
      ? 'healthy'
      : 'unhealthy';
    const dashboardFrontendStatus = dashboardFrontendHealth.status === 'fulfilled' && dashboardFrontendHealth.value.healthy
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
      },
    };
  });
}
