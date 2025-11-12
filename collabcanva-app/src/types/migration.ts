// Migration-related type definitions

export interface MigrationStatus {
  userId: string;
  isMigrated: boolean;
  migratedAt?: Date;
  projectId?: string;
  canvasId?: string;
  shapesCount?: number;
  error?: string;
}

export interface MigrationConfig {
  batchSize: number;
  maxRetries: number;
  timeout: number;
  enableCleanup: boolean;
}

export const MIGRATION_CONFIG: MigrationConfig = {
  batchSize: 50,
  maxRetries: 3,
  timeout: 30000,
  enableCleanup: true
};

export const BATCH_SIZE = 50;
