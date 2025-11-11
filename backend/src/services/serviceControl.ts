import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

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
 * Start a service (Docker container)
 */
export async function startService(serviceId: string): Promise<ServiceActionResponse> {
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
 * Stop a service (Docker container)
 */
export async function stopService(serviceId: string): Promise<ServiceActionResponse> {
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
 * Restart a service (Docker container)
 */
export async function restartService(serviceId: string): Promise<ServiceActionResponse> {
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

