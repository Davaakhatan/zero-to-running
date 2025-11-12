import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';

let dbPool: Pool | null = null;
let redisClient: RedisClientType | null = null;

// Initialize database connection
export function initDatabase() {
  if (!dbPool) {
    // Use DATABASE_URL if provided, otherwise use individual env vars
    if (process.env.DATABASE_URL) {
      dbPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } else {
      dbPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'dev_env',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
  }
  return dbPool;
}

// Initialize Redis connection
export function initRedis(): RedisClientType {
  if (!redisClient) {
    // Use REDIS_URL from env, or default to redis-service (works in both Docker and K8s)
    const redisUrl = process.env.REDIS_URL || 'redis://redis-service:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 3000, // 3 second connection timeout
        reconnectStrategy: false, // Don't auto-reconnect on error
      },
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }
  return redisClient;
}

// Check database health
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const pool = initDatabase();
    const result = await pool.query('SELECT 1 as health');
    
    if (result.rows[0]?.health === 1) {
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    }
    
    return {
      healthy: false,
      error: 'Unexpected response from database',
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    };
  }
}

// Check Redis health
export async function checkRedisHealth(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const client = initRedis();
    
    // Add timeout to prevent hanging (5 seconds max)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Redis health check timeout')), 5000);
    });
    
    const connectPromise = (async () => {
      if (!client.isOpen) {
        await client.connect();
      }
      return await client.ping();
    })();
    
    const result = await Promise.race([connectPromise, timeoutPromise]);
    
    if (result === 'PONG') {
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    }
    
    return {
      healthy: false,
      error: 'Unexpected response from Redis',
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    };
  }
}

