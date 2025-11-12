import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  initializeCanvas,
  getCanvas,
  createShape,
  updateShape,
  deleteShape,
  lockShape,
  unlockShape,
  batchUpdateShapes,
  type Shape,
} from '../services/collabcanva.js';

interface CreateShapeBody {
  shape: Shape;
  canvasId?: string;
}

interface UpdateShapeBody {
  shapeId: string;
  updates: Partial<Shape>;
  canvasId?: string;
}

interface DeleteShapeBody {
  shapeId: string;
  canvasId?: string;
}

interface LockShapeBody {
  shapeId: string;
  userId: string;
  canvasId?: string;
}

interface BatchUpdateBody {
  updates: Array<{ id: string; updates: Partial<Shape> }>;
  canvasId?: string;
}

export async function collabcanvaRoutes(fastify: FastifyInstance) {
  const CANVAS_ID = 'global-canvas-v1';

  // Initialize canvas table on startup
  fastify.addHook('onReady', async () => {
    try {
      const { initCanvasTable } = await import('../services/collabcanva.js');
      await initCanvasTable();
      await initializeCanvas(CANVAS_ID);
      fastify.log.info('CollabCanva canvas table initialized');
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to initialize CollabCanva canvas table');
    }
  });

  // Get canvas
  fastify.get('/api/collabcanva/canvas', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const canvasId = (request.query as { canvasId?: string }).canvasId || CANVAS_ID;
      const canvas = await getCanvas(canvasId);
      
      if (!canvas) {
        await initializeCanvas(canvasId);
        return reply.code(200).send({
          canvasId,
          shapes: [],
          lastUpdated: new Date().toISOString(),
        });
      }
      
      return reply.code(200).send(canvas);
    } catch (error) {
      fastify.log.error({ err: error }, 'Error getting canvas');
      reply.code(500).send({
        error: 'Failed to get canvas',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Initialize canvas
  fastify.post('/api/collabcanva/canvas/init', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const canvasId = (request.body as { canvasId?: string })?.canvasId || CANVAS_ID;
      await initializeCanvas(canvasId);
      return reply.code(200).send({ success: true, canvasId });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error initializing canvas');
      reply.code(500).send({
        error: 'Failed to initialize canvas',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Create shape
  fastify.post('/api/collabcanva/shapes', async (request: FastifyRequest<{ Body: CreateShapeBody }>, reply: FastifyReply) => {
    try {
      const { shape, canvasId } = request.body;
      if (!shape || !shape.id) {
        return reply.code(400).send({ error: 'Shape with id is required' });
      }
      
      await createShape(canvasId || CANVAS_ID, shape);
      return reply.code(201).send({ success: true });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error creating shape');
      reply.code(500).send({
        error: 'Failed to create shape',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update shape
  fastify.put('/api/collabcanva/shapes/:shapeId', async (
    request: FastifyRequest<{ Params: { shapeId: string }; Body: UpdateShapeBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { shapeId } = request.params;
      const { updates, canvasId } = request.body;
      
      await updateShape(canvasId || CANVAS_ID, shapeId, updates);
      return reply.code(200).send({ success: true });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error updating shape');
      reply.code(500).send({
        error: 'Failed to update shape',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Delete shape
  fastify.delete('/api/collabcanva/shapes/:shapeId', async (
    request: FastifyRequest<{ Params: { shapeId: string }; Querystring: { canvasId?: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { shapeId } = request.params;
      const canvasId = request.query.canvasId || CANVAS_ID;
      
      await deleteShape(canvasId, shapeId);
      return reply.code(200).send({ success: true });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error deleting shape');
      reply.code(500).send({
        error: 'Failed to delete shape',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Lock shape
  fastify.post('/api/collabcanva/shapes/:shapeId/lock', async (
    request: FastifyRequest<{ Params: { shapeId: string }; Body: LockShapeBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { shapeId } = request.params;
      const { userId, canvasId } = request.body;
      
      if (!userId) {
        return reply.code(400).send({ error: 'userId is required' });
      }
      
      await lockShape(canvasId || CANVAS_ID, shapeId, userId);
      return reply.code(200).send({ success: true });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error locking shape');
      reply.code(500).send({
        error: 'Failed to lock shape',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Unlock shape
  fastify.post('/api/collabcanva/shapes/:shapeId/unlock', async (
    request: FastifyRequest<{ Params: { shapeId: string }; Querystring: { canvasId?: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { shapeId } = request.params;
      const canvasId = request.query.canvasId || CANVAS_ID;
      
      await unlockShape(canvasId, shapeId);
      return reply.code(200).send({ success: true });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error unlocking shape');
      reply.code(500).send({
        error: 'Failed to unlock shape',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Batch update shapes
  fastify.post('/api/collabcanva/shapes/batch', async (
    request: FastifyRequest<{ Body: BatchUpdateBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { updates, canvasId } = request.body;
      
      if (!updates || !Array.isArray(updates)) {
        return reply.code(400).send({ error: 'updates array is required' });
      }
      
      await batchUpdateShapes(canvasId || CANVAS_ID, updates);
      return reply.code(200).send({ success: true });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error batch updating shapes');
      reply.code(500).send({
        error: 'Failed to batch update shapes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

