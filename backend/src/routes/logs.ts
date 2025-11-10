import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLogs } from '../services/logs.js';

export async function logsRoutes(fastify: FastifyInstance) {
  // Get logs with optional filtering
  fastify.get('/api/logs', async (
    request: FastifyRequest<{
      Querystring: {
        service?: string;
        level?: string;
        limit?: string;
        since?: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    const { service, level, limit, since } = request.query;
    
    const logs = await getLogs({
      service,
      level: level as 'info' | 'warning' | 'error' | 'debug' | undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      since: since ? new Date(since) : undefined,
    });

    return logs;
  });
}

