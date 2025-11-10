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

    const overallStatus = dbStatus === 'healthy' && redisStatus === 'healthy'
      ? 'healthy'
      : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'backend-api',
      dependencies: {
        database: {
          status: dbStatus,
          details: dbHealth.status === 'fulfilled' ? dbHealth.value : { error: 'Connection failed' },
        },
        redis: {
          status: redisStatus,
          details: redisHealth.status === 'fulfilled' ? redisHealth.value : { error: 'Connection failed' },
        },
      },
    };
  });
}

