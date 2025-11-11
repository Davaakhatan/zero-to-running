import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

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
};

// Map container names to service display names
const CONTAINER_TO_SERVICE: Record<string, string> = {
  'dev-env-backend': 'API Server',
  'dev-env-postgres': 'Database',
  'dev-env-redis': 'Cache Service',
  'dev-env-app-frontend': 'Application Frontend',
  'dev-env-dashboard-frontend': 'Dashboard Frontend',
};

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
        service: CONTAINER_TO_SERVICE[containerName] || containerName,
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
      service: CONTAINER_TO_SERVICE[containerName] || containerName,
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
      service: CONTAINER_TO_SERVICE[containerName] || containerName,
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
 * Get logs from a Docker container
 */
async function getContainerLogs(containerName: string, limit: number = 100): Promise<LogEntry[]> {
  try {
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      c.Names.some(name => name.includes(containerName))
    );

    if (!containerInfo) {
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
        
        // Extract timestamp (first part of message)
        const messageBuffer = logBuffer.slice(offset + 8, offset + 8 + size);
        const messageText = messageBuffer.toString('utf-8');
        
        // Parse the log line
        const parsed = parseLogLine(messageText, containerName);
        if (parsed) {
          logs.push(parsed);
        }
        
        offset += 8 + size;
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

    if (filters.service) {
      // Get logs from specific service
      const containerName = SERVICE_TO_CONTAINER[filters.service.toLowerCase()];
      if (containerName) {
        const logs = await getContainerLogs(containerName, maxLogsPerContainer);
        allLogs.push(...logs);
      }
    } else {
      // Get logs from all containers in parallel
      const containerNames = Object.values(SERVICE_TO_CONTAINER);
      const logsPerContainer = Math.ceil(maxLogsPerContainer / containerNames.length);
      const logPromises = containerNames.map(name => 
        getContainerLogs(name, logsPerContainer)
      );
      
      const logArrays = await Promise.all(logPromises);
      allLogs = logArrays.flat();
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
