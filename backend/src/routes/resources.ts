import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Docker from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { isKubernetes, getKubernetesNamespace } from '../utils/environment.js';

const execAsync = promisify(exec);

// Initialize Docker client (only if not in Kubernetes)
let docker: Docker | null = null;
if (!isKubernetes()) {
  try {
    docker = new Docker({ socketPath: '/var/run/docker.sock' });
  } catch (error) {
    console.warn('Docker socket not available, assuming Kubernetes');
  }
}

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
 * Get Kubernetes pod stats using kubectl
 */
async function getKubernetesPodStats(): Promise<ContainerResource[]> {
  try {
    const namespace = getKubernetesNamespace();
    
    // Get pod stats using kubectl top
    const { stdout: topOutput } = await execAsync(
      `kubectl top pods -n ${namespace} --no-headers 2>/dev/null || echo ""`
    );

    if (!topOutput.trim()) {
      return [];
    }

    // Get pod details for status
    const { stdout: podOutput } = await execAsync(
      `kubectl get pods -n ${namespace} -o json 2>/dev/null || echo "{}"`
    );

    const pods = JSON.parse(podOutput || '{}');
    const podMap = new Map<string, any>();
    
    if (pods.items) {
      pods.items.forEach((pod: any) => {
        podMap.set(pod.metadata.name, pod);
      });
    }

    const containerStats: ContainerResource[] = [];
    const lines = topOutput.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const podName = parts[0];
        const cpuStr = parts[1];
        const memoryStr = parts[2];
        
        const pod = podMap.get(podName);
        const status = pod?.status?.phase || 'unknown';
        
        // Parse CPU (could be in m, cores, etc.)
        let cpu = 0;
        if (cpuStr.includes('m')) {
          cpu = parseFloat(cpuStr.replace('m', '')) / 10; // Convert millicores to percentage (rough)
        } else {
          cpu = parseFloat(cpuStr) * 100; // Convert cores to percentage
        }

        // Parse memory (could be Mi, Gi, etc.)
        let memory = 0;
        let memoryLimit = 0;
        if (memoryStr.includes('Mi')) {
          memory = parseFloat(memoryStr.replace('Mi', ''));
        } else if (memoryStr.includes('Gi')) {
          memory = parseFloat(memoryStr.replace('Gi', '')) * 1024;
        } else {
          memory = parseFloat(memoryStr);
        }

        // Get memory limit from pod spec
        if (pod?.spec?.containers?.[0]?.resources?.limits?.memory) {
          const limitStr = pod.spec.containers[0].resources.limits.memory;
          if (limitStr.includes('Mi')) {
            memoryLimit = parseFloat(limitStr.replace('Mi', ''));
          } else if (limitStr.includes('Gi')) {
            memoryLimit = parseFloat(limitStr.replace('Gi', '')) * 1024;
          }
        }

        containerStats.push({
          name: podName,
          id: pod?.metadata?.uid?.substring(0, 12) || podName.substring(0, 12),
          status,
          cpu: parseFloat(cpu.toFixed(2)),
          memory: parseFloat(memory.toFixed(2)),
          memoryLimit: parseFloat(memoryLimit.toFixed(2)),
          networkIn: 0, // kubectl top doesn't provide network stats
          networkOut: 0,
        });
      }
    }

    return containerStats;
  } catch (error) {
    console.error('Error getting Kubernetes pod stats:', error);
    return [];
  }
}

/**
 * Get Docker container stats using Docker SDK
 */
async function getDockerContainerStats(): Promise<ContainerResource[]> {
  if (!docker) {
    return [];
  }

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
        if (!docker) return null;
        
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

/**
 * Get container/pod stats (Docker or Kubernetes)
 */
async function getContainerStats(): Promise<ContainerResource[]> {
  if (isKubernetes()) {
    return getKubernetesPodStats();
  } else {
    return getDockerContainerStats();
  }
}

export async function resourcesRoutes(fastify: FastifyInstance) {
  // Get container/pod resources (Docker or Kubernetes)
  fastify.get('/api/resources', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const containers = await getContainerStats();
      return {
        containers,
        timestamp: new Date().toISOString(),
        environment: isKubernetes() ? 'kubernetes' : 'docker',
      };
    } catch (error) {
      fastify.log.error({ err: error }, 'Error fetching resources');
      reply.code(500).send({
        error: 'Failed to fetch resource metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        environment: isKubernetes() ? 'kubernetes' : 'docker',
      });
    }
  });
}
