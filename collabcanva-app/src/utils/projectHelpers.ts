// Utility functions for project data transformation and manipulation
// Provides helper functions for common project operations and data formatting

import { Project, ProjectMember, ProjectCanvas, ProjectRole, ProjectActivity, Shape } from '../types';

// Date formatting utilities
export const dateHelpers = {
  /**
   * Format timestamp to relative time (e.g., "2 hours ago", "3 days ago")
   */
  formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
  },

  /**
   * Format timestamp to readable date (e.g., "Jan 15, 2024")
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format timestamp to readable date and time (e.g., "Jan 15, 2024 at 2:30 PM")
   */
  formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  /**
   * Check if timestamp is today
   */
  isToday(timestamp: number): boolean {
    const today = new Date();
    const date = new Date(timestamp);
    return today.toDateString() === date.toDateString();
  },

  /**
   * Check if timestamp is this week
   */
  isThisWeek(timestamp: number): boolean {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    return timestamp >= weekAgo;
  },

  /**
   * Check if timestamp is this month
   */
  isThisMonth(timestamp: number): boolean {
    const now = new Date();
    const date = new Date(timestamp);
    return now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
  }
};

// Project data transformation utilities
export const projectTransformers = {
  /**
   * Transform project to summary format for lists
   */
  toSummary(project: Project): ProjectSummary {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      isArchived: project.isArchived,
      isDeleted: project.isDeleted,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      memberCount: 0, // Will be populated by the calling code
      canvasCount: 0, // Will be populated by the calling code
      thumbnail: null, // Will be populated by the calling code
      lastActivity: null // Will be populated by the calling code
    };
  },

  /**
   * Transform project to display format for UI
   */
  toDisplayFormat(project: Project): ProjectDisplay {
    return {
      ...project,
      displayName: project.name || 'Untitled Project',
      displayDescription: project.description || 'No description',
      displayCreatedAt: dateHelpers.formatRelativeTime(project.createdAt),
      displayUpdatedAt: dateHelpers.formatRelativeTime(project.updatedAt),
      displayDate: dateHelpers.formatDate(project.createdAt),
      displayDateTime: dateHelpers.formatDateTime(project.updatedAt),
      isRecent: dateHelpers.isThisWeek(project.updatedAt),
      isToday: dateHelpers.isToday(project.updatedAt)
    };
  },

  /**
   * Transform project to export format
   */
  toExportFormat(project: Project): ProjectExport {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      settings: project.settings,
      metadata: project.metadata,
      exportedAt: Date.now(),
      version: '1.0.0'
    };
  },

  /**
   * Transform project to search index format
   */
  toSearchIndex(project: Project): ProjectSearchIndex {
    return {
      id: project.id,
      name: project.name.toLowerCase(),
      description: project.description?.toLowerCase() || '',
      tags: project.metadata?.tags?.map(tag => tag.toLowerCase()) || [],
      category: project.metadata?.category?.toLowerCase() || '',
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isArchived: project.isArchived,
      isDeleted: project.isDeleted
    };
  }
};

// Project member utilities
export const memberHelpers = {
  /**
   * Get member role display name
   */
  getRoleDisplayName(role: ProjectRole): string {
    const roleNames: Record<ProjectRole, string> = {
      owner: 'Owner',
      admin: 'Admin',
      editor: 'Editor',
      viewer: 'Viewer'
    };
    return roleNames[role] || 'Unknown';
  },

  /**
   * Get member role color
   */
  getRoleColor(role: ProjectRole): string {
    const roleColors: Record<ProjectRole, string> = {
      owner: '#8b5cf6', // Purple
      admin: '#3b82f6', // Blue
      editor: '#10b981', // Green
      viewer: '#6b7280' // Gray
    };
    return roleColors[role] || '#6b7280';
  },

  /**
   * Check if role has edit permissions
   */
  canEdit(role: ProjectRole): boolean {
    return ['owner', 'admin', 'editor'].includes(role);
  },

  /**
   * Check if role has admin permissions
   */
  canAdmin(role: ProjectRole): boolean {
    return ['owner', 'admin'].includes(role);
  },

  /**
   * Check if role is owner
   */
  isOwner(role: ProjectRole): boolean {
    return role === 'owner';
  },

  /**
   * Get member initials for avatar
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Sort members by role priority
   */
  sortMembersByRole(members: ProjectMember[]): ProjectMember[] {
    const rolePriority: Record<ProjectRole, number> = {
      owner: 0,
      admin: 1,
      editor: 2,
      viewer: 3
    };

    return [...members].sort((a, b) => {
      const priorityA = rolePriority[a.role];
      const priorityB = rolePriority[b.role];
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same role, sort by name
      return a.displayName.localeCompare(b.displayName);
    });
  },

  /**
   * Get member count by role
   */
  getMemberCountByRole(members: ProjectMember[]): Record<ProjectRole, number> {
    const counts: Record<ProjectRole, number> = {
      owner: 0,
      admin: 0,
      editor: 0,
      viewer: 0
    };

    members.forEach(member => {
      counts[member.role]++;
    });

    return counts;
  }
};

// Canvas utilities
export const canvasHelpers = {
  /**
   * Get canvas display name
   */
  getDisplayName(canvas: ProjectCanvas): string {
    return canvas.name || 'Untitled Canvas';
  },

  /**
   * Get canvas size display
   */
  getSizeDisplay(canvas: ProjectCanvas): string {
    const width = canvas.width || 1920;
    const height = canvas.height || 1080;
    return `${width} × ${height}`;
  },

  /**
   * Get canvas aspect ratio
   */
  getAspectRatio(canvas: ProjectCanvas): number {
    const width = canvas.width || 1920;
    const height = canvas.height || 1080;
    return width / height;
  },

  /**
   * Check if canvas is landscape
   */
  isLandscape(canvas: ProjectCanvas): boolean {
    return canvasHelpers.getAspectRatio(canvas) > 1;
  },

  /**
   * Check if canvas is portrait
   */
  isPortrait(canvas: ProjectCanvas): boolean {
    return canvasHelpers.getAspectRatio(canvas) < 1;
  },

  /**
   * Check if canvas is square
   */
  isSquare(canvas: ProjectCanvas): boolean {
    const aspectRatio = canvasHelpers.getAspectRatio(canvas);
    return Math.abs(aspectRatio - 1) < 0.1;
  },

  /**
   * Get canvas dimensions for thumbnail
   */
  getThumbnailDimensions(canvas: ProjectCanvas, maxSize: number = 300): { width: number; height: number } {
    const width = canvas.width || 1920;
    const height = canvas.height || 1080;
    const aspectRatio = width / height;

    if (width > height) {
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio)
      };
    } else {
      return {
        width: Math.round(maxSize * aspectRatio),
        height: maxSize
      };
    }
  },

  /**
   * Sort canvases by name
   */
  sortCanvasesByName(canvases: ProjectCanvas[]): ProjectCanvas[] {
    return [...canvases].sort((a, b) => {
      const nameA = canvasHelpers.getDisplayName(a);
      const nameB = canvasHelpers.getDisplayName(b);
      return nameA.localeCompare(nameB);
    });
  },

  /**
   * Sort canvases by creation date
   */
  sortCanvasesByDate(canvases: ProjectCanvas[]): ProjectCanvas[] {
    return [...canvases].sort((a, b) => b.createdAt - a.createdAt);
  }
};

// Project statistics utilities
export const projectStats = {
  /**
   * Calculate project statistics
   */
  calculateStats(project: Project, members: ProjectMember[], canvases: ProjectCanvas[]): ProjectStats {
    const memberCounts = memberHelpers.getMemberCountByRole(members);
    const totalShapes = canvases.reduce((sum, canvas) => sum + (canvas.shapeCount || 0), 0);
    const totalSize = canvases.reduce((sum, canvas) => sum + (canvas.size || 0), 0);

    return {
      memberCount: members.length,
      memberCounts,
      canvasCount: canvases.length,
      totalShapes,
      totalSize,
      averageShapesPerCanvas: canvases.length > 0 ? totalShapes / canvases.length : 0,
      averageSizePerCanvas: canvases.length > 0 ? totalSize / canvases.length : 0,
      lastActivity: Math.max(
        project.updatedAt,
        ...canvases.map(canvas => canvas.updatedAt)
      ),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  },

  /**
   * Get project health score (0-100)
   */
  getHealthScore(project: Project, members: ProjectMember[], canvases: ProjectCanvas[]): number {
    let score = 100;

    // Deduct points for missing description
    if (!project.description || project.description.trim().length === 0) {
      score -= 10;
    }

    // Deduct points for no canvases
    if (canvases.length === 0) {
      score -= 30;
    }

    // Deduct points for no members (except owner)
    if (members.length <= 1) {
      score -= 20;
    }

    // Deduct points for archived status
    if (project.isArchived) {
      score -= 50;
    }

    // Deduct points for old projects with no activity
    const daysSinceUpdate = (Date.now() - project.updatedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 30) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  },

  /**
   * Get project activity level
   */
  getActivityLevel(project: Project, activities: ProjectActivity[]): 'high' | 'medium' | 'low' | 'none' {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const recentActivities = activities.filter(activity => activity.timestamp >= weekAgo);
    const monthlyActivities = activities.filter(activity => activity.timestamp >= monthAgo);

    if (recentActivities.length >= 10) return 'high';
    if (recentActivities.length >= 3) return 'medium';
    if (monthlyActivities.length >= 1) return 'low';
    return 'none';
  }
};

// Project validation utilities
export const projectValidators = {
  /**
   * Validate project name
   */
  validateName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Project name is required' };
    }

    if (name.trim().length < 2) {
      return { isValid: false, error: 'Project name must be at least 2 characters' };
    }

    if (name.trim().length > 100) {
      return { isValid: false, error: 'Project name must be less than 100 characters' };
    }

    return { isValid: true };
  },

  /**
   * Validate project description
   */
  validateDescription(description: string): { isValid: boolean; error?: string } {
    if (description && description.length > 500) {
      return { isValid: false, error: 'Description must be less than 500 characters' };
    }

    return { isValid: true };
  },

  /**
   * Validate project settings
   */
  validateSettings(settings: Project['settings']): { isValid: boolean; error?: string } {
    if (!settings) {
      return { isValid: false, error: 'Project settings are required' };
    }

    if (typeof settings.allowComments !== 'boolean') {
      return { isValid: false, error: 'Allow comments must be a boolean' };
    }

    if (typeof settings.allowDownloads !== 'boolean') {
      return { isValid: false, error: 'Allow downloads must be a boolean' };
    }

    if (typeof settings.isPublic !== 'boolean') {
      return { isValid: false, error: 'Is public must be a boolean' };
    }

    return { isValid: true };
  },

  /**
   * Validate project metadata
   */
  validateMetadata(metadata: Project['metadata']): { isValid: boolean; error?: string } {
    if (!metadata) {
      return { isValid: true }; // Metadata is optional
    }

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      return { isValid: false, error: 'Tags must be an array' };
    }

    if (metadata.tags && metadata.tags.length > 10) {
      return { isValid: false, error: 'Maximum 10 tags allowed' };
    }

    if (metadata.tags && metadata.tags.some(tag => typeof tag !== 'string' || tag.length > 20)) {
      return { isValid: false, error: 'Each tag must be a string with maximum 20 characters' };
    }

    return { isValid: true };
  },

  /**
   * Validate entire project
   */
  validateProject(project: Partial<Project>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const nameValidation = projectValidators.validateName(project.name || '');
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!);
    }

    const descriptionValidation = projectValidators.validateDescription(project.description || '');
    if (!descriptionValidation.isValid) {
      errors.push(descriptionValidation.error!);
    }

    const settingsValidation = projectValidators.validateSettings(project.settings);
    if (!settingsValidation.isValid) {
      errors.push(settingsValidation.error!);
    }

    const metadataValidation = projectValidators.validateMetadata(project.metadata);
    if (!metadataValidation.isValid) {
      errors.push(metadataValidation.error!);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Project sorting utilities
export const projectSorters = {
  /**
   * Sort projects by name
   */
  byName(projects: Project[], direction: 'asc' | 'desc' = 'asc'): Project[] {
    return [...projects].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const result = nameA.localeCompare(nameB);
      return direction === 'asc' ? result : -result;
    });
  },

  /**
   * Sort projects by creation date
   */
  byCreatedAt(projects: Project[], direction: 'asc' | 'desc' = 'desc'): Project[] {
    return [...projects].sort((a, b) => {
      const result = a.createdAt - b.createdAt;
      return direction === 'asc' ? result : -result;
    });
  },

  /**
   * Sort projects by update date
   */
  byUpdatedAt(projects: Project[], direction: 'asc' | 'desc' = 'desc'): Project[] {
    return [...projects].sort((a, b) => {
      const result = a.updatedAt - b.updatedAt;
      return direction === 'asc' ? result : -result;
    });
  },

  /**
   * Sort projects by member count
   */
  byMemberCount(projects: Project[], membersMap: Map<string, ProjectMember[]>, direction: 'asc' | 'desc' = 'desc'): Project[] {
    return [...projects].sort((a, b) => {
      const countA = membersMap.get(a.id)?.length || 0;
      const countB = membersMap.get(b.id)?.length || 0;
      const result = countA - countB;
      return direction === 'asc' ? result : -result;
    });
  },

  /**
   * Sort projects by canvas count
   */
  byCanvasCount(projects: Project[], canvasesMap: Map<string, ProjectCanvas[]>, direction: 'asc' | 'desc' = 'desc'): Project[] {
    return [...projects].sort((a, b) => {
      const countA = canvasesMap.get(a.id)?.length || 0;
      const countB = canvasesMap.get(b.id)?.length || 0;
      const result = countA - countB;
      return direction === 'asc' ? result : -result;
    });
  }
};

// Project filtering utilities
export const projectFilters = {
  /**
   * Filter projects by name
   */
  byName(projects: Project[], query: string): Project[] {
    if (!query.trim()) return projects;
    
    const lowerQuery = query.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Filter projects by description
   */
  byDescription(projects: Project[], query: string): Project[] {
    if (!query.trim()) return projects;
    
    const lowerQuery = query.toLowerCase();
    return projects.filter(project => 
      project.description?.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Filter projects by status
   */
  byStatus(projects: Project[], status: 'active' | 'archived' | 'deleted'): Project[] {
    return projects.filter(project => {
      switch (status) {
        case 'active':
          return !project.isArchived && !project.isDeleted;
        case 'archived':
          return project.isArchived && !project.isDeleted;
        case 'deleted':
          return project.isDeleted;
        default:
          return true;
      }
    });
  },

  /**
   * Filter projects by date range
   */
  byDateRange(projects: Project[], startDate: Date, endDate: Date): Project[] {
    return projects.filter(project => {
      const projectDate = new Date(project.updatedAt);
      return projectDate >= startDate && projectDate <= endDate;
    });
  },

  /**
   * Filter projects by owner
   */
  byOwner(projects: Project[], ownerId: string): Project[] {
    return projects.filter(project => project.ownerId === ownerId);
  },

  /**
   * Filter projects by tags
   */
  byTags(projects: Project[], tags: string[]): Project[] {
    if (tags.length === 0) return projects;
    
    return projects.filter(project => 
      tags.every(tag => 
        project.metadata?.tags?.some(projectTag => 
          projectTag.toLowerCase() === tag.toLowerCase()
        )
      )
    );
  }
};

// Type definitions for helper functions
export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
  memberCount: number;
  canvasCount: number;
  thumbnail: string | null;
  lastActivity: number | null;
  canvases?: ProjectCanvas[];
}

export interface ProjectDisplay extends Project {
  displayName: string;
  displayDescription: string;
  displayCreatedAt: string;
  displayUpdatedAt: string;
  displayDate: string;
  displayDateTime: string;
  isRecent: boolean;
  isToday: boolean;
}

export interface ProjectExport {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  settings: Project['settings'];
  metadata: Project['metadata'];
  exportedAt: number;
  version: string;
}

export interface ProjectSearchIndex {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  isArchived: boolean;
  isDeleted: boolean;
}

export interface ProjectStats {
  memberCount: number;
  memberCounts: Record<ProjectRole, number>;
  canvasCount: number;
  totalShapes: number;
  totalSize: number;
  averageShapesPerCanvas: number;
  averageSizePerCanvas: number;
  lastActivity: number;
  createdAt: number;
  updatedAt: number;
}

// Export all utilities as a single object
export const projectHelpers = {
  dateHelpers,
  projectTransformers,
  memberHelpers,
  canvasHelpers,
  projectStats,
  projectValidators,
  projectSorters,
  projectFilters
};
