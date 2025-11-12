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
    console.warn('Docker socket not available');
  }
}

// Map service IDs to Docker container names
const SERVICE_TO_CONTAINER: Record<string, string> = {
  'api-server': 'dev-env-backend',
  'backend': 'dev-env-backend',
  'database': 'dev-env-postgres',
  'postgres': 'dev-env-postgres',
  'cache': 'dev-env-redis',
  'redis': 'dev-env-redis',
  'app-frontend': 'dev-env-app-frontend',
  'dashboard-frontend': 'dev-env-dashboard-frontend',
};

export interface ServiceActionResponse {
  success: boolean;
  message: string;
  containerId?: string;
  containerName?: string;
}

/**
 * Get Docker container name from service ID
 */
function getContainerName(serviceId: string): string | null {
  return SERVICE_TO_CONTAINER[serviceId] || null;
}

/**
 * Check if a resource is a StatefulSet or Deployment
 */
async function getKubernetesResourceType(name: string, namespace: string): Promise<'statefulset' | 'deployment' | null> {
  try {
    // Check if it's a StatefulSet (redirect stderr to /dev/null to suppress errors)
    const { stdout } = await execAsync(`kubectl get statefulset ${name} -n ${namespace} -o name 2>/dev/null || true`);
    if (stdout && stdout.trim().includes('statefulset')) {
      return 'statefulset';
    }
  } catch {
    // Ignore errors
  }
  
  try {
    // Check if it's a Deployment
    const { stdout } = await execAsync(`kubectl get deployment ${name} -n ${namespace} -o name 2>/dev/null || true`);
    if (stdout && stdout.trim().includes('deployment')) {
      return 'deployment';
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

/**
 * Start a service (Kubernetes pod via deployment/statefulset scale or restart)
 */
async function startKubernetesService(serviceId: string): Promise<ServiceActionResponse> {
  try {
    const namespace = getKubernetesNamespace();
    const resourceName = getContainerName(serviceId)?.replace('dev-env-', '') || serviceId;
    
    // Determine if it's a StatefulSet or Deployment
    const resourceType = await getKubernetesResourceType(resourceName, namespace);
    
    if (!resourceType) {
      return {
        success: false,
        message: `Resource ${resourceName} not found (neither StatefulSet nor Deployment)`,
      };
    }
    
    if (resourceType === 'statefulset') {
      // For StatefulSets, scale to 1 replica to start
      await execAsync(`kubectl scale statefulset/${resourceName} --replicas=1 -n ${namespace}`);
      return {
        success: true,
        message: `Service ${serviceId} scaled to 1 (Kubernetes StatefulSet)`,
        containerName: resourceName,
      };
    } else {
      // For Deployments, scale to 1 replica to start
      await execAsync(`kubectl scale deployment/${resourceName} --replicas=1 -n ${namespace}`);
      return {
        success: true,
        message: `Service ${serviceId} scaled to 1 (Kubernetes Deployment)`,
        containerName: resourceName,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start service',
    };
  }
}

/**
 * Start a service (Docker container)
 */
async function startDockerService(serviceId: string): Promise<ServiceActionResponse> {
  if (!docker) {
    return {
      success: false,
      message: 'Docker not available',
    };
  }

  try {
    const containerName = getContainerName(serviceId);
    
    if (!containerName) {
      return {
        success: false,
        message: `Service ${serviceId} is not a Docker container or is not managed`,
      };
    }

    // Find container by name
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      c.Names.some(name => name.includes(containerName))
    );

    if (!containerInfo) {
      return {
        success: false,
        message: `Container ${containerName} not found`,
      };
    }

    const container = docker.getContainer(containerInfo.Id);
    
    // Check if container is already running
    const containerDetails = await container.inspect();
    if (containerDetails.State.Running) {
      return {
        success: true,
        message: `Service ${serviceId} is already running`,
        containerId: containerInfo.Id.substring(0, 12),
        containerName,
      };
    }
    
    await container.start();

    return {
      success: true,
      message: `Service ${serviceId} started successfully`,
      containerId: containerInfo.Id.substring(0, 12),
      containerName,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start service',
    };
  }
}

/**
 * Start a service (Docker or Kubernetes)
 */
export async function startService(serviceId: string): Promise<ServiceActionResponse> {
  if (isKubernetes()) {
    return startKubernetesService(serviceId);
  } else {
    return startDockerService(serviceId);
  }
}

/**
 * Stop a service (Kubernetes - scale to 0)
 */
async function stopKubernetesService(serviceId: string): Promise<ServiceActionResponse> {
  try {
    const namespace = getKubernetesNamespace();
    const resourceName = getContainerName(serviceId)?.replace('dev-env-', '') || serviceId;
    
    // Determine if it's a StatefulSet or Deployment
    const resourceType = await getKubernetesResourceType(resourceName, namespace);
    
    if (!resourceType) {
      return {
        success: false,
        message: `Resource ${resourceName} not found (neither StatefulSet nor Deployment)`,
      };
    }
    
    // Scale to 0 (works for both StatefulSets and Deployments)
    if (resourceType === 'statefulset') {
      await execAsync(`kubectl scale statefulset/${resourceName} --replicas=0 -n ${namespace}`);
    } else {
      await execAsync(`kubectl scale deployment/${resourceName} --replicas=0 -n ${namespace}`);
    }
    
    return {
      success: true,
      message: `Service ${serviceId} scaled to 0 (Kubernetes ${resourceType})`,
      containerName: resourceName,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to stop service',
    };
  }
}

/**
 * Stop a service (Docker container)
 */
async function stopDockerService(serviceId: string): Promise<ServiceActionResponse> {
  if (!docker) {
    return {
      success: false,
      message: 'Docker not available',
    };
  }

  try {
    const containerName = getContainerName(serviceId);
    
    if (!containerName) {
      return {
        success: false,
        message: `Service ${serviceId} is not a Docker container or is not managed`,
      };
    }

    // Find container by name
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      c.Names.some(name => name.includes(containerName))
    );

    if (!containerInfo) {
      return {
        success: false,
        message: `Container ${containerName} not found`,
      };
    }

    const container = docker.getContainer(containerInfo.Id);
    await container.stop();

    return {
      success: true,
      message: `Service ${serviceId} stopped successfully`,
      containerId: containerInfo.Id.substring(0, 12),
      containerName,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to stop service',
    };
  }
}

/**
 * Stop a service (Docker or Kubernetes)
 */
export async function stopService(serviceId: string): Promise<ServiceActionResponse> {
  if (isKubernetes()) {
    return stopKubernetesService(serviceId);
  } else {
    return stopDockerService(serviceId);
  }
}

/**
 * Restart a service (Kubernetes - rollout restart)
 */
async function restartKubernetesService(serviceId: string): Promise<ServiceActionResponse> {
  try {
    const namespace = getKubernetesNamespace();
    const resourceName = getContainerName(serviceId)?.replace('dev-env-', '') || serviceId;
    
    // Determine if it's a StatefulSet or Deployment
    const resourceType = await getKubernetesResourceType(resourceName, namespace);
    
    if (!resourceType) {
      return {
        success: false,
        message: `Resource ${resourceName} not found (neither StatefulSet nor Deployment)`,
      };
    }
    
    // Restart (works for both StatefulSets and Deployments)
    if (resourceType === 'statefulset') {
      await execAsync(`kubectl rollout restart statefulset/${resourceName} -n ${namespace}`);
    } else {
      await execAsync(`kubectl rollout restart deployment/${resourceName} -n ${namespace}`);
    }
    
    return {
      success: true,
      message: `Service ${serviceId} restart initiated (Kubernetes ${resourceType})`,
      containerName: resourceName,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to restart service',
    };
  }
}

/**
 * Restart a service (Docker container)
 */
async function restartDockerService(serviceId: string): Promise<ServiceActionResponse> {
  if (!docker) {
    return {
      success: false,
      message: 'Docker not available',
    };
  }

  try {
    const containerName = getContainerName(serviceId);
    
    if (!containerName) {
      return {
        success: false,
        message: `Service ${serviceId} is not a Docker container or is not managed`,
      };
    }

    // Find container by name
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      c.Names.some(name => name.includes(containerName))
    );

    if (!containerInfo) {
      return {
        success: false,
        message: `Container ${containerName} not found`,
      };
    }

    const container = docker.getContainer(containerInfo.Id);
    await container.restart();

    return {
      success: true,
      message: `Service ${serviceId} restarted successfully`,
      containerId: containerInfo.Id.substring(0, 12),
      containerName,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to restart service',
    };
  }
}

/**
 * Restart a service (Docker or Kubernetes)
 */
export async function restartService(serviceId: string): Promise<ServiceActionResponse> {
  if (isKubernetes()) {
    return restartKubernetesService(serviceId);
  } else {
    return restartDockerService(serviceId);
  }
}

