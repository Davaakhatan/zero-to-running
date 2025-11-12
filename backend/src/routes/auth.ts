import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createUser,
  authenticateUser,
  getUserById,
  userToAuthUser,
  initAuthTables,
} from '../services/auth.js';

interface SignupBody {
  email: string;
  password: string;
  displayName?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Initialize auth tables on startup
  fastify.addHook('onReady', async () => {
    try {
      await initAuthTables();
      fastify.log.info('Auth tables initialized');
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to initialize auth tables');
    }
  });

  // Signup
  fastify.post('/api/auth/signup', async (
    request: FastifyRequest<{ Body: SignupBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, password, displayName } = request.body;
      
      if (!email || !password) {
        return reply.code(400).send({
          error: 'Email and password are required',
        });
      }
      
      // Check if user already exists (by email)
      const { getUserByEmail } = await import('../services/auth.js');
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return reply.code(409).send({
          error: 'User with this email already exists',
        });
      }
      
      const user = await createUser(email, password, displayName);
      const authUser = userToAuthUser(user);
      
      return reply.code(201).send({
        user: authUser,
        message: 'User created successfully',
      });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error during signup');
      reply.code(500).send({
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Login
  fastify.post('/api/auth/login', async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        return reply.code(400).send({
          error: 'Email and password are required',
        });
      }
      
      const user = await authenticateUser(email, password);
      
      if (!user) {
        return reply.code(401).send({
          error: 'Invalid email or password',
        });
      }
      
      const authUser = userToAuthUser(user);
      
      return reply.code(200).send({
        user: authUser,
        message: 'Login successful',
      });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error during login');
      reply.code(500).send({
        error: 'Failed to authenticate user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get current user (by ID)
  fastify.get('/api/auth/user/:userId', async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;
      const user = await getUserById(userId);
      
      if (!user) {
        return reply.code(404).send({
          error: 'User not found',
        });
      }
      
      const authUser = userToAuthUser(user);
      return reply.code(200).send({ user: authUser });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error getting user');
      reply.code(500).send({
        error: 'Failed to get user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

