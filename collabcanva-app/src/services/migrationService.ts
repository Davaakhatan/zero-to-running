// Migration service for transitioning from single-canvas to multi-project system
// This service handles the migration of existing user data to the new structure

import { 
  doc, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  CreateProjectData,
  PROJECT_COLLECTIONS 
} from '../types';
import { Shape } from '../types/canvas';
import { MigrationStatus, MIGRATION_CONFIG } from '../types/migration';
import { generateId } from '../utils/helpers';



class MigrationService {
  private migrationStatusCollection = 'migrationStatus';

  /**
   * Check if a user has been migrated to the new system
   */
  async checkMigrationStatus(userId: string): Promise<MigrationStatus> {
    try {
      const migrationDoc = await getDoc(
        doc(db, this.migrationStatusCollection, userId)
      );
      
      if (migrationDoc.exists()) {
        return migrationDoc.data() as MigrationStatus;
      }
      
      return {
        userId,
        isMigrated: false
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        userId,
        isMigrated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user has existing canvas data that needs migration
   */
  async hasExistingCanvasData(userId: string): Promise<boolean> {
    try {
      // Check if user has any shapes in the legacy canvas collection
      const canvasQuery = query(
        collection(db, 'canvas'),
        where('createdBy', '==', userId),
        limit(1)
      );
      
      const canvasSnapshot = await getDocs(canvasQuery);
      return !canvasSnapshot.empty;
    } catch (error) {
      console.error('Error checking existing canvas data:', error);
      return false;
    }
  }

  /**
   * Get all shapes for a user from the legacy canvas collection
   */
  async getLegacyShapes(userId: string): Promise<Shape[]> {
    try {
      const canvasQuery = query(
        collection(db, 'canvas'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const canvasSnapshot = await getDocs(canvasQuery);
      const shapes: Shape[] = [];
      
      for (const canvasDoc of canvasSnapshot.docs) {
        const canvasData = canvasDoc.data();
        if (canvasData.shapes && Array.isArray(canvasData.shapes)) {
          shapes.push(...canvasData.shapes);
        }
      }
      
      return shapes;
    } catch (error) {
      console.error('Error getting legacy shapes:', error);
      return [];
    }
  }

  /**
   * Create a default project for a user
   */
  async createDefaultProject(userId: string, projectData?: Partial<CreateProjectData>): Promise<string> {
    try {
      const projectId = `project_${userId}_${Date.now()}`;
      const now = Date.now();
      
      const project: Project = {
        id: projectId,
        name: projectData?.name || 'My First Project',
        description: projectData?.description || 'Default project created during migration',
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
        isArchived: false,
        settings: {
          allowComments: true,
          allowViewing: true,
          allowDownloads: true,
          isPublic: false,
          defaultCanvasWidth: 800,
          defaultCanvasHeight: 600,
          theme: 'light' as const
        }
      };
      
      // Create project metadata
      await setDoc(
        doc(db, PROJECT_COLLECTIONS.PROJECTS, projectId),
        project
      );
      
      // Add user as project owner
      const member: ProjectMember = {
        id: generateId(),
        userId,
        email: '', // Will be populated from user data
        name: '', // Will be populated from user data
        role: 'owner',
        status: 'active',
        joinedAt: now,
        lastActiveAt: now,
        isOnline: false
      };
      
      await setDoc(
        doc(db, PROJECT_COLLECTIONS.PROJECTS, projectId, PROJECT_COLLECTIONS.MEMBERS, userId),
        member
      );
      
      // Update user's project memberships
      await this.updateUserProjectMembership(userId, projectId, 'owner');
      
      return projectId;
    } catch (error) {
      console.error('Error creating default project:', error);
      throw new Error(`Failed to create default project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a default canvas within a project
   */
  async createDefaultCanvas(projectId: string, userId: string, canvasData?: Partial<ProjectCanvas>): Promise<string> {
    try {
      const canvasId = `canvas_${projectId}_${Date.now()}`;
      const now = Date.now();
      
      const canvas: ProjectCanvas = {
        id: canvasId,
        projectId,
        name: canvasData?.name || 'Main Canvas',
        description: canvasData?.description || 'Default canvas for the project',
        width: canvasData?.width || 1920,
        height: canvasData?.height || 1080,
        backgroundColor: canvasData?.backgroundColor || '#ffffff',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        isArchived: false,
        order: 0
      };
      
      await setDoc(
        doc(db, PROJECT_COLLECTIONS.PROJECTS, projectId, PROJECT_COLLECTIONS.CANVASES, canvasId),
        canvas
      );
      
      return canvasId;
    } catch (error) {
      console.error('Error creating default canvas:', error);
      throw new Error(`Failed to create default canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Migrate shapes from legacy canvas to new project structure
   */
  async migrateShapes(
    projectId: string, 
    canvasId: string, 
    shapes: Shape[]
  ): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;
    
    try {
      // Process shapes in batches
      for (let i = 0; i < shapes.length; i += MIGRATION_CONFIG.batchSize) {
        const batch = writeBatch(db);
        const batchShapes = shapes.slice(i, i + MIGRATION_CONFIG.batchSize);
        
        for (const shape of batchShapes) {
          try {
            const shapeRef = doc(
              db, 
              PROJECT_COLLECTIONS.PROJECTS, 
              projectId, 
              PROJECT_COLLECTIONS.CANVASES, 
              canvasId, 
              'shapes', 
              shape.id
            );
            
            // Ensure shape has required fields for new structure
            const migratedShape = {
              ...shape,
              projectId,
              canvasId,
              createdBy: shape.createdBy || 'unknown',
              createdAt: shape.createdAt || Date.now(),
              updatedAt: Date.now()
            };
            
            batch.set(shapeRef, migratedShape);
            migrated++;
          } catch (error) {
            errors.push(`Failed to migrate shape ${shape.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // Commit batch
        await batch.commit();
        
        // Add delay between batches to avoid rate limiting
        if (i + MIGRATION_CONFIG.batchSize < shapes.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      errors.push(`Batch migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return { migrated, errors };
  }

  /**
   * Update user's project membership record
   */
  async updateUserProjectMembership(userId: string, projectId: string, role: string): Promise<void> {
    try {
      const userProjectsRef = doc(db, 'userProjects', userId);
      const userProjectsDoc = await getDoc(userProjectsRef);
      
      const userProjects = userProjectsDoc.exists() ? userProjectsDoc.data() : { projects: {} };
      
      userProjects.projects[projectId] = {
        role,
        joinedAt: Date.now(),
        projectName: 'My First Project' // Hardcoded fallback
      };
      
      await setDoc(userProjectsRef, userProjects);
    } catch (error) {
      console.error('Error updating user project membership:', error);
      throw new Error(`Failed to update user project membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up legacy canvas data after successful migration
   */
  async cleanupLegacyData(userId: string): Promise<void> {
    try {
      const canvasQuery = query(
        collection(db, 'canvas'),
        where('createdBy', '==', userId)
      );
      
      const canvasSnapshot = await getDocs(canvasQuery);
      const batch = writeBatch(db);
      
      for (const canvasDoc of canvasSnapshot.docs) {
        batch.delete(canvasDoc.ref);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up legacy data:', error);
      // Don't throw error - cleanup is not critical
    }
  }

  /**
   * Update migration status
   */
  async updateMigrationStatus(status: MigrationStatus): Promise<void> {
    try {
      await setDoc(
        doc(db, this.migrationStatusCollection, status.userId),
        {
          ...status,
          updatedAt: new Date()
        }
      );
    } catch (error) {
      console.error('Error updating migration status:', error);
      throw new Error(`Failed to update migration status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform complete migration for a user
   */
  async migrateUser(userId: string, options?: {
    projectName?: string;
    canvasName?: string;
    cleanupLegacy?: boolean;
  }): Promise<MigrationStatus> {
    const startTime = Date.now();
    
    try {
      // Check if already migrated
      const existingStatus = await this.checkMigrationStatus(userId);
      if (existingStatus.isMigrated) {
        return existingStatus;
      }
      
      // Check if user has data to migrate
      const hasData = await this.hasExistingCanvasData(userId);
      if (!hasData) {
        // Create default project even if no data exists
        const projectId = await this.createDefaultProject(userId, {
          name: options?.projectName
        });
        
        const canvasId = await this.createDefaultCanvas(projectId, userId, {
          name: options?.canvasName
        });
        
        const status: MigrationStatus = {
          userId,
          isMigrated: true,
          migratedAt: new Date(),
          projectId,
          canvasId,
          shapesCount: 0
        };
        
        await this.updateMigrationStatus(status);
        return status;
      }
      
      // Get legacy shapes
      const shapes = await this.getLegacyShapes(userId);
      
      // Create default project
      const projectId = await this.createDefaultProject(userId, {
        name: options?.projectName
      });
      
      // Create default canvas
      const canvasId = await this.createDefaultCanvas(projectId, userId, {
        name: options?.canvasName
      });
      
      // Migrate shapes
      const migrationResult = await this.migrateShapes(projectId, canvasId, shapes);
      
      // Clean up legacy data if requested
      if (options?.cleanupLegacy !== false) {
        await this.cleanupLegacyData(userId);
      }
      
      // Update migration status
      const status: MigrationStatus = {
        userId,
        isMigrated: true,
        migratedAt: new Date(),
        projectId,
        canvasId,
        shapesCount: migrationResult.migrated,
        error: migrationResult.errors.length > 0 ? migrationResult.errors.join('; ') : undefined
      };
      
      await this.updateMigrationStatus(status);
      
      const duration = Date.now() - startTime;
      console.log(`Migration completed for user ${userId} in ${duration}ms`);
      
      return status;
    } catch (error) {
      const status: MigrationStatus = {
        userId,
        isMigrated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      await this.updateMigrationStatus(status);
      throw error;
    }
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats(): Promise<{
    totalUsers: number;
    migratedUsers: number;
    pendingUsers: number;
    errorUsers: number;
  }> {
    try {
      const migrationSnapshot = await getDocs(
        collection(db, this.migrationStatusCollection)
      );
      
      let migratedUsers = 0;
      let errorUsers = 0;
      
      migrationSnapshot.docs.forEach(doc => {
        const data = doc.data() as MigrationStatus;
        if (data.isMigrated) {
          migratedUsers++;
        } else if (data.error) {
          errorUsers++;
        }
      });
      
      return {
        totalUsers: migrationSnapshot.docs.length,
        migratedUsers,
        pendingUsers: migrationSnapshot.docs.length - migratedUsers - errorUsers,
        errorUsers
      };
    } catch (error) {
      console.error('Error getting migration stats:', error);
      return {
        totalUsers: 0,
        migratedUsers: 0,
        pendingUsers: 0,
        errorUsers: 0
      };
    }
  }
}

// Export singleton instance
export const migrationService = new MigrationService();

// Export utility functions for easy access
export const migrateUser = (userId: string, options?: Parameters<MigrationService['migrateUser']>[1]) => 
  migrationService.migrateUser(userId, options);

export const checkMigrationStatus = (userId: string) => 
  migrationService.checkMigrationStatus(userId);

export const getMigrationStats = () => 
  migrationService.getMigrationStats();
