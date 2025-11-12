import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { servicesRoutes } from './routes/services.js';
import { configRoutes } from './routes/config.js';
import { logsRoutes } from './routes/logs.js';
import { setupRoutes } from './routes/setup.js';
import { resourcesRoutes } from './routes/resources.js';
import { collabcanvaRoutes } from './routes/collabcanva.js';
import { authRoutes } from './routes/auth.js';
import { securityMiddleware } from './middleware/security.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }),
  },
  // Production optimizations
  disableRequestLogging: process.env.NODE_ENV === 'production',
  requestIdLogLabel: 'reqId',
  requestIdHeader: 'x-request-id',
});

// Register security middleware
await fastify.register(securityMiddleware);

// Register CORS with production best practices
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3002'];

await fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost origins for development/testing
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    
    // Allow AWS LoadBalancer origins (for AWS EKS deployments)
    if (origin.includes('.elb.amazonaws.com')) {
      return callback(null, true);
    }
    
    // Allow Azure LoadBalancer origins (for Azure AKS deployments)
    if (origin.includes('.cloudapp.azure.com') || origin.includes('.azurecontainer.io')) {
      return callback(null, true);
    }
    
    // Allow GCP LoadBalancer origins (for GCP GKE deployments)
    if (origin.includes('.googleusercontent.com') || origin.includes('.run.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
});

// Register routes
await fastify.register(healthRoutes);
await fastify.register(servicesRoutes);
await fastify.register(configRoutes);
await fastify.register(logsRoutes);
await fastify.register(setupRoutes);
await fastify.register(resourcesRoutes);
await fastify.register(collabcanvaRoutes);
await fastify.register(authRoutes);

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3003;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`🚀 Backend API server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

