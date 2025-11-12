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

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  service: string;
  message: string;
  details?: string;
}

interface LogFilters {
  service?: string;
  level?: 'info' | 'warning' | 'error' | 'debug';
  limit?: number;
  since?: Date;
}

// Map service names to container names
const SERVICE_TO_CONTAINER: Record<string, string> = {
  'api-server': 'dev-env-backend',
  'backend': 'dev-env-backend',
  'api server': 'dev-env-backend',
  'database': 'dev-env-postgres',
  'postgres': 'dev-env-postgres',
  'cache': 'dev-env-redis',
  'cache service': 'dev-env-redis',
  'redis': 'dev-env-redis',
  'app-frontend': 'dev-env-app-frontend',
  'application frontend': 'dev-env-app-frontend',
  'dashboard-frontend': 'dev-env-dashboard-frontend',
  'dashboard frontend': 'dev-env-dashboard-frontend',
  'collabcanva': 'dev-env-collabcanva',
  'collab canvas': 'dev-env-collabcanva',
  'collab-canva': 'dev-env-collabcanva',
};

// Map container names to service display names
const CONTAINER_TO_SERVICE: Record<string, string> = {
  'dev-env-backend': 'API Server',
  'dev-env-postgres': 'Database',
  'dev-env-redis': 'Cache Service',
  'dev-env-app-frontend': 'Application Frontend',
  'dev-env-dashboard-frontend': 'Dashboard Frontend',
  'dev-env-collabcanva': 'CollabCanva',
};

// Map Kubernetes pod name patterns to service display names
const POD_TO_SERVICE: Record<string, string> = {
  'backend': 'API Server',
  'postgres': 'Database',
  'redis': 'Cache Service',
  'app-frontend': 'Application Frontend',
  'dashboard-frontend': 'Dashboard Frontend',
  'collabcanva': 'CollabCanva',
};

/**
 * Get service display name from pod/container name
 */
function getServiceDisplayName(podOrContainerName: string): string {
  // Try Kubernetes pod name pattern first
  for (const [pattern, displayName] of Object.entries(POD_TO_SERVICE)) {
    if (podOrContainerName.includes(pattern)) {
      return displayName;
    }
  }
  
  // Fallback to container name mapping
  return CONTAINER_TO_SERVICE[podOrContainerName] || podOrContainerName;
}

/**
 * Parse Docker log line format
 * Docker logs have an 8-byte header: [stream (1 byte)][padding (3 bytes)][size (4 bytes)][message]
 */
function parseDockerLogLine(buffer: Buffer): string | null {
  if (buffer.length < 8) {
    return null;
  }

  // Read the size from bytes 4-7 (big-endian)
  const size = buffer.readUInt32BE(4);
  
  if (buffer.length < 8 + size) {
    return null;
  }

  // Extract the message (skip 8-byte header)
  const message = buffer.slice(8, 8 + size).toString('utf-8');
  return message.trim();
}

/**
 * Parse log line to extract level and message
 */
function parseLogLine(line: string, containerName: string): LogEntry | null {
  try {
    // Handle Docker log format with binary header
    let cleanLine = line;
    
    // If line starts with binary characters, try to parse as Docker format
    if (line.charCodeAt(0) < 32 || line.charCodeAt(0) > 126) {
      try {
        const buffer = Buffer.from(line, 'binary');
        const parsed = parseDockerLogLine(buffer);
        if (parsed) {
          cleanLine = parsed;
        }
      } catch {
        // If parsing fails, try to extract readable text
        cleanLine = line.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
      }
    }
    
    if (!cleanLine || cleanLine.length === 0) {
      return null;
    }

    // Try to parse JSON logs first (structured logging)
    try {
      const jsonLog = JSON.parse(cleanLine);
      const level = detectLogLevel(jsonLog.message || jsonLog.msg || cleanLine);
      return {
        id: `${containerName}-${Date.now()}-${Math.random()}`,
        timestamp: jsonLog.time || jsonLog.timestamp || jsonLog['@timestamp'] || new Date().toISOString(),
        level,
        service: getServiceDisplayName(containerName),
        message: jsonLog.message || jsonLog.msg || cleanLine,
        details: jsonLog.details || jsonLog.error || jsonLog.stack || undefined,
      };
    } catch {
      // Not JSON, parse as plain text
    }

    // Parse standard log formats with timestamp
    // Format: "2025-11-11T16:32:39.420Z message content"
    const timestampMatch = cleanLine.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/);
    let timestamp = new Date().toISOString();
    let message = cleanLine;
    
    if (timestampMatch) {
      timestamp = timestampMatch[1];
      // Remove timestamp prefix
      message = cleanLine.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s+/, '');
    }
    
    // Remove common prefixes
    message = message
      .replace(/^(stdout|stderr)\s+/, '')
      .replace(/^\[.*?\]\s+/, '') // Remove [INFO], [ERROR] style prefixes
      .trim();
    
    // Detect log level from message
    const level = detectLogLevel(message);
    
    if (!message || message.length === 0) {
      return null;
    }

    // Truncate very long messages
    if (message.length > 500) {
      message = message.substring(0, 500) + '...';
    }

    return {
      id: `${containerName}-${Date.now()}-${Math.random()}`,
      timestamp,
      level,
      service: getServiceDisplayName(containerName),
      message,
    };
  } catch (error) {
    // If parsing fails, return a basic log entry
    const cleanMessage = line.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().substring(0, 200);
    if (!cleanMessage) {
      return null;
    }
    
    return {
      id: `${containerName}-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      service: getServiceDisplayName(containerName),
      message: cleanMessage,
    };
  }
}

/**
 * Detect log level from message content
 */
function detectLogLevel(message: string): 'info' | 'warning' | 'error' | 'debug' {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('error') || lowerMessage.includes('exception') || 
      lowerMessage.includes('failed') || lowerMessage.includes('fatal')) {
    return 'error';
  }
  if (lowerMessage.includes('warn') || lowerMessage.includes('deprecated') ||
      lowerMessage.includes('slow') || lowerMessage.includes('timeout')) {
    return 'warning';
  }
  if (lowerMessage.includes('debug') || lowerMessage.includes('trace') ||
      lowerMessage.includes('verbose')) {
    return 'debug';
  }
  return 'info';
}

/**
 * Get logs from a Kubernetes pod
 */
async function getKubernetesPodLogs(podName: string, limit: number = 100): Promise<LogEntry[]> {
  try {
    const namespace = getKubernetesNamespace();
    
    // Get pod logs using kubectl
    const { stdout } = await execAsync(
      `kubectl logs -n ${namespace} ${podName} --tail=${limit} --timestamps 2>/dev/null || echo ""`
    );

    if (!stdout.trim()) {
      return [];
    }

    const logs: LogEntry[] = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      const parsed = parseLogLine(line, podName);
      if (parsed) {
        // Map pod name to service display name
        parsed.service = getServiceDisplayName(podName);
        logs.push(parsed);
      }
    }

    return logs;
  } catch (error) {
    console.error(`Error getting logs from pod ${podName}:`, error);
    return [];
  }
}

/**
 * Get logs from a Docker container
 */
async function getDockerContainerLogs(containerName: string, limit: number = 100): Promise<LogEntry[]> {
  if (!docker) {
    return [];
  }

  try {
    const containers = await docker.listContainers({ all: true });
    // Container names in Docker have a leading slash, so we need to check both
    const containerInfo = containers.find(c => 
      c.Names.some(name => 
        name.includes(containerName) || name.includes(`/${containerName}`)
      )
    );

    if (!containerInfo) {
      console.warn(`Container not found: ${containerName}`);
      return [];
    }

    const container = docker.getContainer(containerInfo.Id);
    
    // Get logs (last N lines)
    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      tail: limit,
      timestamps: true,
    });

    // Docker logs come as a Buffer with 8-byte headers per line
    // We need to parse each log entry properly
    const logs: LogEntry[] = [];
    
    // Ensure we have a Buffer
    const logBuffer = Buffer.isBuffer(logStream) ? logStream : Buffer.from(logStream as any);
    
    if (logBuffer && logBuffer.length > 0) {
      let offset = 0;
      while (offset < logBuffer.length) {
        if (logBuffer.length - offset < 8) {
          break; // Not enough data for header
        }
        
        // Read size from bytes 4-7
        const size = logBuffer.readUInt32BE(offset + 4);
        
        if (logBuffer.length - offset < 8 + size) {
          break; // Not enough data for message
        }
        
        // Extract message (skip 8-byte header)
        const messageBuffer = logBuffer.slice(offset + 8, offset + 8 + size);
        const messageText = messageBuffer.toString('utf-8').trim();
        
        // Only parse non-empty lines
        if (messageText && messageText.length > 0) {
          // Parse the log line
          const parsed = parseLogLine(messageText, containerName);
          if (parsed) {
            // Map container name to service display name
            parsed.service = getServiceDisplayName(containerName);
            logs.push(parsed);
          }
        }
        
        offset += 8 + size;
      }
      
      // If we didn't get any logs from binary parsing, try simple line-by-line parsing
      if (logs.length === 0 && logBuffer.length > 0) {
        const text = logBuffer.toString('utf-8');
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        for (const line of lines.slice(-limit)) {
          const parsed = parseLogLine(line.trim(), containerName);
          if (parsed) {
            parsed.service = getServiceDisplayName(containerName);
            logs.push(parsed);
          }
        }
      }
    }

    return logs;
  } catch (error) {
    console.error(`Error getting logs from container ${containerName}:`, error);
    return [];
  }
}

/**
 * Get logs from all containers or specific service
 * NOTE: This only READS logs from Docker, it does NOT store them.
 * Docker itself manages log rotation via docker-compose.yml logging configuration.
 */
export async function getLogs(filters: LogFilters): Promise<LogEntry[]> {
  try {
    let allLogs: LogEntry[] = [];

    // Limit the number of logs fetched to prevent memory issues
    const maxLogsPerContainer = Math.min(filters.limit || 100, 200); // Cap at 200 per container

    if (isKubernetes()) {
      // Kubernetes mode: use kubectl to get pod logs
      if (filters.service) {
        // Map service name to pod name pattern
        const serviceName = filters.service.toLowerCase();
        // Try multiple patterns: direct service name, container name, and pod pattern
        const containerName = SERVICE_TO_CONTAINER[serviceName];
        const podPattern = containerName ? containerName.replace('dev-env-', '') : serviceName;
        
        // Get all pods matching the pattern
        const namespace = getKubernetesNamespace();
        const { stdout } = await execAsync(
          `kubectl get pods -n ${namespace} -o json 2>/dev/null || echo "{}"`
        );
        
        const pods = JSON.parse(stdout || '{}');
        if (pods.items) {
          // Match pods by name pattern - pods typically start with service name
          const matchingPods = pods.items.filter((pod: any) => {
            const podName = pod.metadata.name.toLowerCase();
            // Match if pod name starts with the pattern or contains it
            return podName.startsWith(podPattern) || 
                   podName.includes(podPattern) ||
                   // Also check labels for app name
                   pod.metadata.labels?.app === serviceName ||
                   pod.metadata.labels?.app === podPattern;
          });
          
          if (matchingPods.length === 0) {
            console.warn(`No pods found matching service: ${serviceName} (pattern: ${podPattern})`);
          }
          
          const logPromises = matchingPods.map((pod: any) => 
            getKubernetesPodLogs(pod.metadata.name, maxLogsPerContainer)
          );
          const logArrays = await Promise.all(logPromises);
          allLogs = logArrays.flat();
        }
      } else {
        // Get logs from all pods
        const namespace = getKubernetesNamespace();
        const { stdout } = await execAsync(
          `kubectl get pods -n ${namespace} -o json 2>/dev/null || echo "{}"`
        );
        
        const pods = JSON.parse(stdout || '{}');
        if (pods.items) {
          const logsPerPod = Math.ceil(maxLogsPerContainer / pods.items.length);
          const logPromises = pods.items.map((pod: any) => 
            getKubernetesPodLogs(pod.metadata.name, logsPerPod)
          );
          const logArrays = await Promise.all(logPromises);
          allLogs = logArrays.flat();
        }
      }
    } else {
      // Docker mode: use dockerode
      if (filters.service) {
        // Get logs from specific service
        const containerName = SERVICE_TO_CONTAINER[filters.service.toLowerCase()];
        if (containerName) {
          const logs = await getDockerContainerLogs(containerName, maxLogsPerContainer);
          allLogs.push(...logs);
        }
      } else {
        // Get logs from all containers dynamically
        // First, get all running containers that match our service pattern
        if (!docker) {
          return [];
        }
        const containers = await docker.listContainers({ all: false });
        const serviceContainerNames = Object.values(SERVICE_TO_CONTAINER);
        
        // Find all containers that match our service names
        const matchingContainers = containers
          .filter(c => 
            c.Names.some(name => 
              serviceContainerNames.some(serviceName => 
                name.includes(serviceName)
              )
            )
          )
          .map(c => {
            // Extract the container name (remove leading slash)
            const containerName = c.Names[0].replace(/^\//, '');
            return containerName;
          });
        
        // Get logs from all matching containers in parallel
        const logsPerContainer = matchingContainers.length > 0 
          ? Math.ceil(maxLogsPerContainer / matchingContainers.length)
          : maxLogsPerContainer;
        
        const logPromises = matchingContainers.map(name => 
          getDockerContainerLogs(name, logsPerContainer)
        );
        
        const logArrays = await Promise.all(logPromises);
        allLogs = logArrays.flat();
      }
    }

    // Filter by level
    if (filters.level) {
      allLogs = allLogs.filter(log => log.level === filters.level);
    }

    // Filter by time
    if (filters.since) {
      allLogs = allLogs.filter(log => new Date(log.timestamp) >= filters.since!);
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply limit
    if (filters.limit) {
      allLogs = allLogs.slice(0, filters.limit);
    }

    return allLogs;
  } catch (error) {
    console.error('Error getting logs:', error);
    return [];
  }
}
