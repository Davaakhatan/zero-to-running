import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Docker from 'dockerode';

// Initialize Docker client
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export interface ContainerResource {
  name: string;
  id: string;
  status: string;
  cpu: number;
  memory: number;
  memoryLimit: number;
  networkIn: number;
  networkOut: number;
}

/**
 * Get Docker container stats using Docker SDK
 */
async function getContainerStats(): Promise<ContainerResource[]> {
  try {
    // List all running containers
    const containers = await docker.listContainers({ all: false });
    
    if (containers.length === 0) {
      return [];
    }

    const containerStats: ContainerResource[] = [];

    // Get stats for all containers in parallel for better performance
    const statsPromises = containers.map(async (containerInfo) => {
      try {
        const container = docker.getContainer(containerInfo.Id);
        
        // Get a single stats snapshot (not streaming)
        const stats = await container.stats({ stream: false });
        
        const name = containerInfo.Names[0] 
          ? containerInfo.Names[0].replace(/^\//, '') // Remove leading slash
          : containerInfo.Id.substring(0, 12);
        
        const status = containerInfo.State || 'unknown';

        // Calculate CPU usage
        let cpu = 0;
        if (stats && stats.cpu_stats && stats.precpu_stats) {
          const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
          const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
          const numberOfCores = stats.cpu_stats.online_cpus || 1;

          if (systemDelta > 0 && cpuDelta > 0) {
            cpu = (cpuDelta / systemDelta) * numberOfCores * 100;
          }
        }

        // Calculate memory usage
        let memory = 0;
        let memoryLimit = 0;
        if (stats && stats.memory_stats) {
          memory = (stats.memory_stats.usage || 0) / (1024 * 1024); // Convert to MB
          memoryLimit = (stats.memory_stats.limit || 0) / (1024 * 1024); // Convert to MB
        }

        // Calculate network I/O
        let networkIn = 0;
        let networkOut = 0;
        if (stats && stats.networks) {
          for (const networkName in stats.networks) {
            const network = stats.networks[networkName];
            networkIn += network.rx_bytes || 0;
            networkOut += network.tx_bytes || 0;
          }
          networkIn = networkIn / (1024 * 1024); // Convert to MB
          networkOut = networkOut / (1024 * 1024); // Convert to MB
        }

        return {
          name,
          id: containerInfo.Id.substring(0, 12),
          status,
          cpu: parseFloat(cpu.toFixed(2)),
          memory: parseFloat(memory.toFixed(2)),
          memoryLimit: parseFloat(memoryLimit.toFixed(2)),
          networkIn: parseFloat(networkIn.toFixed(2)),
          networkOut: parseFloat(networkOut.toFixed(2)),
        };
      } catch (containerError) {
        // Skip containers that fail to get stats
        console.error(`Error getting stats for container ${containerInfo.Id}:`, containerError);
        return null;
      }
    });

    // Wait for all stats to be fetched in parallel
    const results = await Promise.all(statsPromises);
    
    // Filter out null results (failed containers)
    return results.filter((stat): stat is ContainerResource => stat !== null);
  } catch (error) {
    console.error('Error getting container stats:', error);
    return [];
  }
}

export async function resourcesRoutes(fastify: FastifyInstance) {
  // Get Docker container resources
  fastify.get('/api/resources', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const containers = await getContainerStats();
      return {
        containers,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      fastify.log.error({ err: error }, 'Error fetching resources');
      reply.code(500).send({
        error: 'Failed to fetch resource metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
