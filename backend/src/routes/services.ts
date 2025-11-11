import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getServiceStatuses } from '../services/serviceStatus.js';
import { startService, stopService, restartService } from '../services/serviceControl.js';

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

  // Start a service
  fastify.post('/api/services/:serviceId/start', async (
    request: FastifyRequest<{ Params: { serviceId: string } }>,
    reply: FastifyReply
  ) => {
    const { serviceId } = request.params;
    const result = await startService(serviceId);
    
    if (!result.success) {
      return reply.code(400).send(result);
    }
    
    return result;
  });

  // Stop a service
  fastify.post('/api/services/:serviceId/stop', async (
    request: FastifyRequest<{ Params: { serviceId: string } }>,
    reply: FastifyReply
  ) => {
    const { serviceId } = request.params;
    const result = await stopService(serviceId);
    
    if (!result.success) {
      return reply.code(400).send(result);
    }
    
    return result;
  });

  // Restart a service
  fastify.post('/api/services/:serviceId/restart', async (
    request: FastifyRequest<{ Params: { serviceId: string } }>,
    reply: FastifyReply
  ) => {
    const { serviceId } = request.params;
    const result = await restartService(serviceId);
    
    if (!result.success) {
      return reply.code(400).send(result);
    }
    
    return result;
  });
}

