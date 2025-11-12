/**
 * Environment detection utilities
 * Detects if running in Docker, Kubernetes, or host machine
 */

/**
 * Check if we're running in Kubernetes
 */
export function isKubernetes(): boolean {
  return !!(
    process.env.KUBERNETES_SERVICE_HOST ||
    process.env.KUBERNETES_SERVICE_PORT ||
    (process.env.HOSTNAME && process.env.HOSTNAME.includes('-'))
  );
}

/**
 * Check if we're running in Docker (but not Kubernetes)
 */
export function isDocker(): boolean {
  return !isKubernetes() && (
    process.env.DOCKER === 'true' ||
    process.env.IN_DOCKER === 'true' ||
    process.env.IN_DOCKER === '1'
  );
}

/**
 * Get the current environment type
 */
export function getEnvironment(): 'kubernetes' | 'docker' | 'host' {
  if (isKubernetes()) {
    return 'kubernetes';
  }
  if (isDocker()) {
    return 'docker';
  }
  return 'host';
}

/**
 * Get Kubernetes namespace (defaults to dev-env)
 */
export function getKubernetesNamespace(): string {
  return process.env.KUBERNETES_NAMESPACE || 'dev-env';
}

/**
 * Detect which cloud provider is being used
 * Returns 'aws', 'azure', 'gcp', or 'unknown'
 */
export async function detectCloudProvider(): Promise<'aws' | 'azure' | 'gcp' | 'unknown'> {
  // Check environment variables first
  if (process.env.AWS_REGION || process.env.AWS_ACCOUNT_ID || process.env.AWS_EXECUTION_ENV) {
    return 'aws';
  }
  if (process.env.AZURE_REGION || process.env.AZURE_SUBSCRIPTION_ID || process.env.AZURE_CLIENT_ID) {
    return 'azure';
  }
  if (process.env.GCP_PROJECT || process.env.GCP_REGION || process.env.GOOGLE_CLOUD_PROJECT) {
    return 'gcp';
  }

  // If in Kubernetes, try to detect from cluster info
  if (isKubernetes()) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Check kubectl context name
      try {
        const { stdout: context } = await execAsync('kubectl config current-context');
        const contextLower = context.toLowerCase().trim();
        
        if (contextLower.includes('eks') || contextLower.includes('aws') || contextLower.includes('arn:aws')) {
          return 'aws';
        }
        if (contextLower.includes('aks') || contextLower.includes('azure')) {
          return 'azure';
        }
        if (contextLower.includes('gke') || contextLower.includes('gcp')) {
          return 'gcp';
        }
      } catch {
        // kubectl not available or not configured
      }

      // Check cluster info
      try {
        const { stdout: clusterInfo } = await execAsync('kubectl cluster-info');
        const infoLower = clusterInfo.toLowerCase();
        
        if (infoLower.includes('eks') || infoLower.includes('.amazonaws.com')) {
          return 'aws';
        }
        if (infoLower.includes('aks') || infoLower.includes('.azmk8s.io')) {
          return 'azure';
        }
        if (infoLower.includes('gke') || infoLower.includes('.gke.io')) {
          return 'gcp';
        }
      } catch {
        // Can't get cluster info
      }
    } catch {
      // Error detecting, return unknown
    }
  }

  return 'unknown';
}

