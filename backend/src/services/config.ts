import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// Determine config file based on environment
const getConfigPath = (): string => {
  // Priority: 1. CONFIG_PATH env var, 2. NODE_ENV-based, 3. default dev.yaml
  if (process.env.CONFIG_PATH) {
    return process.env.CONFIG_PATH;
  }
  
  const env = process.env.NODE_ENV || 'development';
  let configFile = 'dev.yaml';
  
  if (env === 'production') {
    configFile = 'production.yaml';
  } else if (env === 'staging') {
    configFile = 'staging.yaml';
  }
  
  return join(process.cwd(), 'config', configFile);
};

const CONFIG_PATH = getConfigPath();

export interface Config {
  services: {
    'app-frontend': {
      port: number;
      host: string;
    };
    backend: {
      port: number;
      host: string;
    };
    database: {
      host: string;
      port: number;
      name: string;
      user: string;
    };
    redis: {
      host: string;
      port: number;
    };
  };
  healthChecks: {
    interval: number;
    timeout: number;
  };
}

let cachedConfig: Config | null = null;

export async function getConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const fileContent = readFileSync(CONFIG_PATH, 'utf-8');
    const config = yaml.load(fileContent) as Config;
    cachedConfig = config;
    return config;
  } catch (error) {
    // Return default config if file doesn't exist
    return {
      services: {
        'app-frontend': {
          port: 3000,
          host: 'localhost',
        },
        backend: {
          port: 3003,
          host: 'localhost',
        },
        database: {
          host: 'localhost',
          port: 5432,
          name: 'dev_env',
          user: 'postgres',
        },
        redis: {
          host: 'localhost',
          port: 6379,
        },
      },
      healthChecks: {
        interval: 30,
        timeout: 5000,
      },
    };
  }
}

export async function updateConfig(updates: Partial<Config>): Promise<Config> {
  const currentConfig = await getConfig();
  const newConfig = { ...currentConfig, ...updates };
  
  try {
    const yamlContent = yaml.dump(newConfig);
    writeFileSync(CONFIG_PATH, yamlContent, 'utf-8');
    cachedConfig = newConfig;
    return newConfig;
  } catch (error) {
    throw new Error('Failed to update configuration file');
  }
}

