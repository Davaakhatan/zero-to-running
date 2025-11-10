import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig, updateConfig } from '../services/config.js';

export async function configRoutes(fastify: FastifyInstance) {
  // Get configuration
  fastify.get('/api/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const config = await getConfig();
    return config;
  });

  // Update configuration
  fastify.put('/api/config', async (
    request: FastifyRequest<{ Body: Record<string, any> }>,
    reply: FastifyReply
  ) => {
    try {
      const updatedConfig = await updateConfig(request.body);
      return updatedConfig;
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid configuration' });
    }
  });
}

