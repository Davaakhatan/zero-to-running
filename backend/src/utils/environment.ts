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

