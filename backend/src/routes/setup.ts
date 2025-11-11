import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPrerequisites, getSetupSteps } from '../services/setup.js';

export async function setupRoutes(fastify: FastifyInstance) {
  // Get prerequisites status
  fastify.get('/api/setup/prerequisites', async (request: FastifyRequest, reply: FastifyReply) => {
    const prerequisites = await getPrerequisites();
    return prerequisites;
  });

  // Get setup steps status
  fastify.get('/api/setup/steps', async (request: FastifyRequest, reply: FastifyReply) => {
    const steps = await getSetupSteps();
    return steps;
  });

  // Get complete setup status
  fastify.get('/api/setup/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const [prerequisites, steps] = await Promise.all([
      getPrerequisites(),
      getSetupSteps(),
    ]);

    const allPrerequisitesMet = prerequisites.every(p => !p.required || p.status === 'installed');
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const totalSteps = steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;
    const isComplete = allPrerequisitesMet && completedSteps === totalSteps;

    return {
      prerequisites,
      steps,
      allPrerequisitesMet,
      completedSteps,
      totalSteps,
      progressPercentage,
      isComplete,
    };
  });
}

