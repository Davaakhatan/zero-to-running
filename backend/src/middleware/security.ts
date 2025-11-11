/**
 * Security Middleware for Fastify
 * Best practices for production security
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function securityMiddleware(fastify: FastifyInstance) {
  // Security headers
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    // Remove X-Powered-By header
    reply.removeHeader('X-Powered-By');
    
    // Security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    if (process.env.NODE_ENV === 'production') {
      reply.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
      );
    }
  });

  // Rate limiting (basic implementation)
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Get client IP, handling both string and string[] types
    let clientIp = request.ip || 'unknown';
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    }
    
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // 100 requests per minute
    
    const clientData = rateLimitMap.get(clientIp);
    
    if (clientData && clientData.resetTime > now) {
      if (clientData.count >= maxRequests) {
        reply.code(429).send({ error: 'Too many requests' });
        return;
      }
      clientData.count++;
    } else {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    }
    
    // Clean up old entries
    if (rateLimitMap.size > 1000) {
      for (const [ip, data] of rateLimitMap.entries()) {
        if (data.resetTime < now) {
          rateLimitMap.delete(ip);
        }
      }
    }
  });

  // Request logging for security monitoring
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    if (process.env.NODE_ENV === 'production') {
      const userAgent = request.headers['user-agent'];
      fastify.log.info({
        method: request.method,
        url: request.url,
        ip: request.ip || 'unknown',
        userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent || 'unknown',
      }, 'Request received');
    }
  });
}

