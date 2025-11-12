// Migration modal component for guiding users through the migration process
// Provides a smooth transition from single-canvas to multi-project system

import React, { useState, useEffect } from 'react';
import { useMigration, useMigrationProgress, MIGRATION_STATUS, getMigrationStatusType } from '../../hooks/useMigration';
import { X, CheckCircle, AlertCircle, Loader2, ArrowRight, Users, Folder, Palette } from 'lucide-react';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const {
    status,
    isChecking,
    isMigrating,
    needsMigration,
    error,
    migrateUser,
    retryMigration,
    hasError
  } = useMigration();

  const {
    progress,
    currentStep,
    isComplete,
    updateProgress,
    reset
  } = useMigrationProgress();

  const [projectName, setProjectName] = useState('My First Project');
  const [canvasName, setCanvasName] = useState('Main Canvas');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const migrationStatusType = getMigrationStatusType({
    status,
    isChecking,
    isMigrating,
    needsMigration,
    error,
    progress: 0
  });

  // Reset progress when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handle migration completion
  useEffect(() => {
    if (isComplete && status?.isMigrated) {
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 2000);
    }
  }, [isComplete, status, onComplete, onClose]);

  const handleStartMigration = async () => {
    try {
      await migrateUser({
        projectName,
        canvasName,
        cleanupLegacy: true,
        onProgress: updateProgress,
        onComplete: () => {
          console.log('Migration completed successfully');
        },
        onError: (error) => {
          console.error('Migration error:', error);
        }
      });
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  const handleRetry = async () => {
    try {
      await retryMigration({
        projectName,
        canvasName,
        cleanupLegacy: true,
        onProgress: updateProgress
      });
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Welcome to Projects!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Let's set up your workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isMigrating}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Migration Status */}
          {migrationStatusType === MIGRATION_STATUS.NOT_STARTED && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upgrade to Multi-Project System
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  We're upgrading your workspace to support multiple projects and team collaboration. 
                  Your existing canvas will be preserved and moved to your first project.
                </p>
              </div>

              {/* Project Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Canvas Name
                  </label>
                  <input
                    type="text"
                    value={canvasName}
                    onChange={(e) => setCanvasName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter canvas name"
                  />
                </div>

                {/* Advanced Options */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>

                {showAdvanced && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cleanup"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="cleanup" className="text-sm text-gray-700 dark:text-gray-300">
                        Clean up legacy data after migration
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This will remove your old canvas data after successful migration to save space.
                    </p>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Multiple Projects</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Organize your work into separate projects</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Team Collaboration</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Invite team members and collaborate in real-time</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Enhanced Features</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Access to advanced project management tools</p>
                </div>
              </div>
            </div>
          )}

          {/* Migration in Progress */}
          {migrationStatusType === MIGRATION_STATUS.IN_PROGRESS && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Setting up your workspace...
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {currentStep}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Migration Steps */}
              <div className="space-y-2">
                {[
                  'Creating project structure',
                  'Setting up canvas',
                  'Migrating your shapes',
                  'Configuring permissions',
                  'Finalizing setup'
                ].map((step, index) => {
                  const stepProgress = (index + 1) * 20;
                  const isActive = progress >= stepProgress - 10;
                  const isCompleted = progress > stepProgress;

                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isActive 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${
                        isActive || isCompleted 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Migration Complete */}
          {migrationStatusType === MIGRATION_STATUS.COMPLETED && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Migration Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your workspace has been successfully upgraded. You can now create multiple projects and collaborate with your team.
              </p>
              {status?.shapesCount && status.shapesCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Migrated {status.shapesCount} shapes to your new project.
                </p>
              )}
            </div>
          )}

          {/* Migration Error */}
          {migrationStatusType === MIGRATION_STATUS.FAILED && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Migration Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {error || 'An unexpected error occurred during migration.'}
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  What happened?
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  The migration process encountered an error. Your existing data is safe and unchanged. 
                  You can try again or contact support if the problem persists.
                </p>
              </div>
            </div>
          )}

          {/* Not Needed */}
          {migrationStatusType === MIGRATION_STATUS.NOT_NEEDED && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Already Upgraded!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your workspace is already using the multi-project system. You're all set!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {migrationStatusType === MIGRATION_STATUS.IN_PROGRESS && (
              'This may take a few moments...'
            )}
            {migrationStatusType === MIGRATION_STATUS.COMPLETED && (
              'Redirecting to your project...'
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {migrationStatusType === MIGRATION_STATUS.NOT_STARTED && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartMigration}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  Start Migration
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
            
            {migrationStatusType === MIGRATION_STATUS.FAILED && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  Try Again
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
            
            {migrationStatusType === MIGRATION_STATUS.NOT_NEEDED && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all duration-200"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
