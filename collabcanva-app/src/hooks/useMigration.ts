// React hook for managing user migration to multi-project system
// Provides migration status, progress tracking, and error handling

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { migrationService } from '../services/migrationService';
import { MigrationStatus, MIGRATION_CONFIG } from '../types/migration';

export interface MigrationState {
  status: MigrationStatus | null;
  isChecking: boolean;
  isMigrating: boolean;
  progress: number;
  error: string | null;
  needsMigration: boolean;
}

export interface MigrationOptions {
  projectName?: string;
  canvasName?: string;
  cleanupLegacy?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (status: MigrationStatus) => void;
  onError?: (error: string) => void;
}

export const useMigration = () => {
  const { user } = useAuth();
  const [state, setState] = useState<MigrationState>({
    status: null,
    isChecking: false,
    isMigrating: false,
    progress: 0,
    error: null,
    needsMigration: false
  });

  // Check migration status on mount and when user changes
  useEffect(() => {
    if (user) {
      checkMigrationStatus();
    } else {
      setState(prev => ({
        ...prev,
        status: null,
        needsMigration: false,
        error: null
      }));
    }
  }, [user]);

  const checkMigrationStatus = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const status = await migrationService.checkMigrationStatus(user.uid);
      const needsMigration = !status.isMigrated;
      
      setState(prev => ({
        ...prev,
        status,
        needsMigration,
        isChecking: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Failed to check migration status'
      }));
    }
  }, [user]);

  const migrateUser = useCallback(async (options?: MigrationOptions) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({
      ...prev,
      isMigrating: true,
      progress: 0,
      error: null
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => {
          const newProgress = Math.min(prev.progress + 10, 90);
          options?.onProgress?.(newProgress);
          return {
            ...prev,
            progress: newProgress
          };
        });
      }, 200);

      const status = await migrationService.migrateUser(user.uid, {
        projectName: options?.projectName,
        canvasName: options?.canvasName,
        cleanupLegacy: options?.cleanupLegacy
      });

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        status,
        isMigrating: false,
        progress: 100,
        needsMigration: false
      }));

      options?.onComplete?.(status);
      options?.onProgress?.(100);

      return status;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMigrating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Migration failed'
      }));

      const errorMessage = error instanceof Error ? error.message : 'Migration failed';
      options?.onError?.(errorMessage);
      throw error;
    }
  }, [user]);

  const retryMigration = useCallback(async (options?: MigrationOptions) => {
    setState(prev => ({ ...prev, error: null }));
    return migrateUser(options);
  }, [migrateUser]);

  const resetMigration = useCallback(async () => {
    if (!user) return;

    try {
      // Reset migration status in Firebase
      await migrationService.updateMigrationStatus({
        userId: user.uid,
        isMigrated: false
      });

      // Refresh status
      await checkMigrationStatus();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to reset migration'
      }));
    }
  }, [user, checkMigrationStatus]);

  return {
    ...state,
    checkMigrationStatus,
    migrateUser,
    retryMigration,
    resetMigration,
    isReady: !state.isChecking && !state.isMigrating,
    canMigrate: state.needsMigration && !state.isMigrating,
    hasError: !!state.error,
    migrationError: state.error
  };
};

// Hook for migration progress UI
export const useMigrationProgress = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    'Checking migration status...',
    'Creating default project...',
    'Setting up canvas...',
    'Migrating shapes...',
    'Cleaning up legacy data...',
    'Finalizing migration...'
  ];

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    
    // Update current step based on progress
    const stepIndex = Math.floor((newProgress / 100) * steps.length);
    if (stepIndex < steps.length) {
      setCurrentStep(steps[stepIndex]);
    }
    
    if (newProgress >= 100) {
      setIsComplete(true);
      setCurrentStep('Migration complete!');
    }
  }, [steps]);

  const reset = useCallback(() => {
    setProgress(0);
    setCurrentStep('');
    setIsComplete(false);
  }, []);

  return {
    progress,
    currentStep,
    isComplete,
    updateProgress,
    reset
  };
};

// Migration status constants
export const MIGRATION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  NOT_NEEDED: 'not_needed'
} as const;

export type MigrationStatusType = typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS];

// Helper function to determine migration status
export const getMigrationStatusType = (state: MigrationState): MigrationStatusType => {
  if (state.isMigrating) return MIGRATION_STATUS.IN_PROGRESS;
  if (state.error) return MIGRATION_STATUS.FAILED;
  if (state.status?.isMigrated) return MIGRATION_STATUS.COMPLETED;
  if (!state.needsMigration) return MIGRATION_STATUS.NOT_NEEDED;
  return MIGRATION_STATUS.NOT_STARTED;
};
