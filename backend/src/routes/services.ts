import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getServiceStatuses } from '../services/serviceStatus.js';

export async function servicesRoutes(fastify: FastifyInstance) {
  // Get all service statuses
  fastify.get('/api/services', async (request: FastifyRequest, reply: FastifyReply) => {
    const services = await getServiceStatuses();
    return services;
  });

  // Get single service status
  fastify.get('/api/services/:serviceId', async (
    request: FastifyRequest<{ Params: { serviceId: string } }>,
    reply: FastifyReply
  ) => {
    const { serviceId } = request.params;
    const services = await getServiceStatuses();
    const service = services.find(s => s.id === serviceId);

    if (!service) {
      return reply.code(404).send({ error: 'Service not found' });
    }

    return service;
  });
}

