/**
 * Setup Service
 * Handles environment setup, prerequisites checking, and setup progress
 */

export interface Prerequisite {
  name: string;
  status: 'checking' | 'installed' | 'missing';
  version?: string;
  required: boolean;
  description: string;
}

export interface SetupStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  service?: string;
  duration?: number;
}

/**
 * Check if a command/tool is available
 * Note: In Docker containers, some commands may not be available
 */
async function checkCommand(command: string): Promise<{ installed: boolean; version?: string }> {
  // In Docker/production, we can't reliably check host commands
  // Return based on environment or check if we're in a container
  const isDocker = process.env.DOCKER === 'true' || process.env.IN_DOCKER === 'true';
  
  if (isDocker) {
    // In Docker, assume prerequisites are met (they're handled by the host)
    // For Node.js and pnpm, check if they're available in the container
    if (command === 'node') {
      return { installed: true, version: process.version };
    }
    if (command === 'pnpm') {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { stdout } = await execAsync('pnpm --version');
        return { installed: true, version: stdout.trim() };
      } catch {
        return { installed: false };
      }
    }
    // Docker, kubectl, Azure CLI are on the host, assume available
    return { installed: true };
  }

  // On host machine, check commands
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Try to get version
    let version: string | undefined;
    try {
      if (command === 'docker') {
        const { stdout } = await execAsync('docker --version');
        version = stdout.trim();
      } else if (command === 'kubectl') {
        const { stdout } = await execAsync('kubectl version --client --short');
        version = stdout.trim();
      } else if (command === 'az') {
        const { stdout } = await execAsync('az --version');
        version = stdout.split('\n')[0] || undefined;
      } else if (command === 'node') {
        version = process.version;
      } else if (command === 'pnpm') {
        const { stdout } = await execAsync('pnpm --version');
        version = stdout.trim();
      }
    } catch {
      // Version check failed, but command might still exist
    }

    // Check if command exists
    const { stdout } = await execAsync(`which ${command} || command -v ${command}`);
    return { installed: stdout.trim().length > 0, version };
  } catch {
    return { installed: false };
  }
}

/**
 * Get prerequisites status
 * Dynamically shows prerequisites based on detected cloud provider
 */
export async function getPrerequisites(): Promise<Prerequisite[]> {
  const { detectCloudProvider } = await import('../utils/environment.js');
  const cloudProvider = await detectCloudProvider();

  // Base prerequisites (always required)
  const basePrerequisites: Prerequisite[] = [
    { name: 'Docker', status: 'checking', required: true, description: 'Container runtime' },
    { name: 'kubectl', status: 'checking', required: true, description: 'Kubernetes CLI' },
    { name: 'Node.js', status: 'checking', required: true, description: 'v18 or higher' },
    { name: 'pnpm', status: 'checking', required: true, description: 'Package manager' },
  ];

  // Cloud-specific prerequisites
  const cloudPrerequisites: Record<string, Prerequisite> = {
    aws: { name: 'AWS CLI', status: 'checking', required: false, description: 'For EKS access' },
    azure: { name: 'Azure CLI', status: 'checking', required: false, description: 'For AKS access' },
    gcp: { name: 'gcloud CLI', status: 'checking', required: false, description: 'For GKE access' },
  };

  // Build prerequisites list
  const prerequisites: Prerequisite[] = [...basePrerequisites];
  
  // Add cloud-specific prerequisite if detected
  if (cloudProvider !== 'unknown' && cloudPrerequisites[cloudProvider]) {
    prerequisites.push(cloudPrerequisites[cloudProvider]);
  }

  // Check each prerequisite
  const checkCommands: Record<string, string> = {
    'Docker': 'docker',
    'kubectl': 'kubectl',
    'Node.js': 'node',
    'pnpm': 'pnpm',
    'AWS CLI': 'aws',
    'Azure CLI': 'az',
    'gcloud CLI': 'gcloud',
  };

  const checks = await Promise.allSettled(
    prerequisites.map(prereq => {
      const command = checkCommands[prereq.name];
      if (!command) return Promise.resolve({ name: prereq.name, result: { installed: false } });
      return checkCommand(command).then(r => ({ name: prereq.name, result: r }));
    })
  );

  return prerequisites.map(prereq => {
    const check = checks.find(c => 
      c.status === 'fulfilled' && 
      c.value.name === prereq.name
    );

    if (check && check.status === 'fulfilled') {
      const result = check.value.result;
      return {
        ...prereq,
        status: result.installed ? 'installed' : 'missing',
        version: result.version,
      };
    }

    return prereq;
  });
}

/**
 * Get setup steps status based on actual service health
 */
export async function getSetupSteps(): Promise<SetupStep[]> {
  const { getServiceStatuses } = await import('./serviceStatus.js');
  const { getConfig } = await import('./config.js');
  const { checkDatabaseHealth, checkRedisHealth } = await import('./health.js');

  const services = await getServiceStatuses();
  const config = await getConfig();

  const steps: SetupStep[] = [
    { id: '1', name: 'Validate Prerequisites', status: 'completed' },
    { id: '2', name: 'Load Configuration', status: config ? 'completed' : 'failed' },
  ];

  // Infrastructure services (always shown)
  const dbService = services.find(s => s.id === 'database');
  const redisService = services.find(s => s.id === 'cache');
  const apiService = services.find(s => s.id === 'api-server');

  steps.push({
    id: '3',
    name: 'Start PostgreSQL',
    status: dbService?.status === 'operational' ? 'completed' : dbService?.status === 'degraded' ? 'in-progress' : 'pending',
    service: 'postgresql',
  });

  steps.push({
    id: '4',
    name: 'Start Redis',
    status: redisService?.status === 'operational' ? 'completed' : redisService?.status === 'degraded' ? 'in-progress' : 'pending',
    service: 'redis',
  });

  steps.push({
    id: '5',
    name: 'Start Backend API',
    status: apiService?.status === 'operational' ? 'completed' : apiService?.status === 'degraded' ? 'in-progress' : 'pending',
    service: 'backend',
  });

  // Frontend services (dynamically discovered - exclude infrastructure services already shown)
  const infrastructureIds = ['database', 'cache', 'api-server'];
  const frontendServices = services.filter(s => !infrastructureIds.includes(s.id));

  // Service name mapping for display (fallback to service name if not mapped)
  const serviceNameMap: Record<string, string> = {
    'app-frontend': 'Application Frontend',
    'dashboard-frontend': 'Dashboard Frontend',
    'collabcanva': 'CollabCanva',
  };

  // Service tag mapping (for UI display tags)
  const serviceTagMap: Record<string, string> = {
    'app-frontend': 'app-frontend',
    'dashboard-frontend': 'dashboard-frontend',
    'collabcanva': 'collabcanva',
  };

  // Add all frontend services dynamically
  let stepId = 6;
  for (const frontendService of frontendServices) {
    const displayName = serviceNameMap[frontendService.id] || frontendService.name;
    steps.push({
      id: String(stepId),
      name: `Start ${displayName}`,
      status: frontendService.status === 'operational' ? 'completed' : frontendService.status === 'degraded' ? 'in-progress' : 'pending',
      service: serviceTagMap[frontendService.id] || frontendService.id,
    });
    stepId++;
  }

  // Health checks step
  const allHealthy = services.every(s => s.status === 'operational');
  const someHealthy = services.some(s => s.status === 'operational');
  
  steps.push({
    id: String(stepId),
    name: 'Health Checks',
    status: allHealthy ? 'completed' : someHealthy ? 'in-progress' : 'pending',
  });

  return steps;
}

