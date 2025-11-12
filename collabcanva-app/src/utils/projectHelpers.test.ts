// Unit tests for projectHelpers
// Tests all utility functions for project data transformation and manipulation

import { describe, it, expect, beforeEach } from 'vitest';
import {
  projectHelpers,
  dateHelpers,
  projectTransformers,
  memberHelpers,
  canvasHelpers,
  projectStats,
  projectValidators,
  projectSorters,
  projectFilters,
  ProjectSummary,
  ProjectDisplay,
  ProjectExport,
  ProjectSearchIndex,
  ProjectStats
} from './projectHelpers';
import { Project, ProjectMember, ProjectCanvas, ProjectRole, ProjectActivity } from '../types';

describe('projectHelpers', () => {
  const mockProject: Project = {
    id: 'project1',
    name: 'Test Project',
    description: 'A test project for unit testing',
    ownerId: 'user123',
    isArchived: false,
    isDeleted: false,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000, // 1 hour ago
    settings: {
      allowComments: true,
      allowDownloads: true,
      isPublic: false
    },
    metadata: {
      version: '1.0.0',
      tags: ['test', 'unit-test'],
      category: 'testing'
    }
  };

  const mockMember: ProjectMember = {
    id: 'member1',
    projectId: 'project1',
    userId: 'user456',
    role: 'editor',
    displayName: 'John Doe',
    email: 'john@example.com',
    avatarUrl: null,
    joinedAt: Date.now() - 43200000, // 12 hours ago
    lastActiveAt: Date.now() - 1800000 // 30 minutes ago
  };

  const mockCanvas: ProjectCanvas = {
    id: 'canvas1',
    projectId: 'project1',
    name: 'Test Canvas',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    shapeCount: 15,
    size: 1024000, // 1MB
    isArchived: false,
    createdAt: Date.now() - 7200000, // 2 hours ago
    updatedAt: Date.now() - 1800000, // 30 minutes ago
    createdBy: 'user123',
    updatedBy: 'user456'
  };

  const mockActivity: ProjectActivity = {
    id: 'activity1',
    projectId: 'project1',
    userId: 'user456',
    action: 'canvas_created',
    details: { canvasId: 'canvas1', canvasName: 'Test Canvas' },
    timestamp: Date.now() - 1800000 // 30 minutes ago
  };

  describe('dateHelpers', () => {
    describe('formatRelativeTime', () => {
      it('should format recent timestamps correctly', () => {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        expect(dateHelpers.formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
        expect(dateHelpers.formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
        expect(dateHelpers.formatRelativeTime(oneDayAgo)).toBe('1 day ago');
      });

      it('should handle plural forms correctly', () => {
        const now = Date.now();
        const twoMinutesAgo = now - 120000;
        const threeHoursAgo = now - 10800000;
        const fiveDaysAgo = now - 432000000;

        expect(dateHelpers.formatRelativeTime(twoMinutesAgo)).toBe('2 minutes ago');
        expect(dateHelpers.formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
        expect(dateHelpers.formatRelativeTime(fiveDaysAgo)).toBe('5 days ago');
      });

      it('should handle very recent timestamps', () => {
        const now = Date.now();
        const thirtySecondsAgo = now - 30000;

        expect(dateHelpers.formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
      });

      it('should handle very old timestamps', () => {
        const now = Date.now();
        const oneYearAgo = now - 31536000000;

        expect(dateHelpers.formatRelativeTime(oneYearAgo)).toBe('1 year ago');
      });
    });

    describe('formatDate', () => {
      it('should format timestamp to readable date', () => {
        const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
        const formatted = dateHelpers.formatDate(timestamp);
        
        expect(formatted).toMatch(/Jan 15, 2024/);
      });
    });

    describe('formatDateTime', () => {
      it('should format timestamp to readable date and time', () => {
        const timestamp = new Date('2024-01-15T14:30:00Z').getTime();
        const formatted = dateHelpers.formatDateTime(timestamp);
        
        expect(formatted).toMatch(/Jan 15, 2024/);
        expect(formatted).toMatch(/2:30 PM/);
      });
    });

    describe('isToday', () => {
      it('should correctly identify today', () => {
        const today = Date.now();
        expect(dateHelpers.isToday(today)).toBe(true);
      });

      it('should correctly identify yesterday', () => {
        const yesterday = Date.now() - 86400000;
        expect(dateHelpers.isToday(yesterday)).toBe(false);
      });
    });

    describe('isThisWeek', () => {
      it('should correctly identify this week', () => {
        const threeDaysAgo = Date.now() - 259200000;
        expect(dateHelpers.isThisWeek(threeDaysAgo)).toBe(true);
      });

      it('should correctly identify last week', () => {
        const tenDaysAgo = Date.now() - 864000000;
        expect(dateHelpers.isThisWeek(tenDaysAgo)).toBe(false);
      });
    });

    describe('isThisMonth', () => {
      it('should correctly identify this month', () => {
        const fifteenDaysAgo = Date.now() - 1296000000;
        expect(dateHelpers.isThisMonth(fifteenDaysAgo)).toBe(true);
      });

      it('should correctly identify last month', () => {
        const fortyDaysAgo = Date.now() - 3456000000;
        expect(dateHelpers.isThisMonth(fortyDaysAgo)).toBe(false);
      });
    });
  });

  describe('projectTransformers', () => {
    describe('toSummary', () => {
      it('should transform project to summary format', () => {
        const summary = projectTransformers.toSummary(mockProject);

        expect(summary).toMatchObject({
          id: mockProject.id,
          name: mockProject.name,
          description: mockProject.description,
          ownerId: mockProject.ownerId,
          isArchived: mockProject.isArchived,
          isDeleted: mockProject.isDeleted,
          createdAt: mockProject.createdAt,
          updatedAt: mockProject.updatedAt,
          memberCount: 0,
          canvasCount: 0,
          thumbnailUrl: null,
          lastActivity: null
        });
      });
    });

    describe('toDisplayFormat', () => {
      it('should transform project to display format', () => {
        const display = projectTransformers.toDisplayFormat(mockProject);

        expect(display).toMatchObject({
          ...mockProject,
          displayName: mockProject.name,
          displayDescription: mockProject.description,
          isRecent: true,
          isToday: false
        });

        expect(display.displayCreatedAt).toMatch(/ago$/);
        expect(display.displayUpdatedAt).toMatch(/ago$/);
        expect(display.displayDate).toMatch(/Jan \d+, \d{4}/);
        expect(display.displayDateTime).toMatch(/Jan \d+, \d{4} at \d+:\d+ [AP]M/);
      });

      it('should handle projects without description', () => {
        const projectWithoutDescription = { ...mockProject, description: undefined };
        const display = projectTransformers.toDisplayFormat(projectWithoutDescription);

        expect(display.displayDescription).toBe('No description');
      });

      it('should handle projects without name', () => {
        const projectWithoutName = { ...mockProject, name: '' };
        const display = projectTransformers.toDisplayFormat(projectWithoutName);

        expect(display.displayName).toBe('Untitled Project');
      });
    });

    describe('toExportFormat', () => {
      it('should transform project to export format', () => {
        const exportData = projectTransformers.toExportFormat(mockProject);

        expect(exportData).toMatchObject({
          id: mockProject.id,
          name: mockProject.name,
          description: mockProject.description,
          ownerId: mockProject.ownerId,
          createdAt: mockProject.createdAt,
          updatedAt: mockProject.updatedAt,
          settings: mockProject.settings,
          metadata: mockProject.metadata,
          exportedAt: expect.any(Number),
          version: '1.0.0'
        });
      });
    });

    describe('toSearchIndex', () => {
      it('should transform project to search index format', () => {
        const searchIndex = projectTransformers.toSearchIndex(mockProject);

        expect(searchIndex).toMatchObject({
          id: mockProject.id,
          name: mockProject.name.toLowerCase(),
          description: mockProject.description?.toLowerCase(),
          tags: mockProject.metadata?.tags?.map(tag => tag.toLowerCase()),
          category: mockProject.metadata?.category?.toLowerCase(),
          ownerId: mockProject.ownerId,
          createdAt: mockProject.createdAt,
          updatedAt: mockProject.updatedAt,
          isArchived: mockProject.isArchived,
          isDeleted: mockProject.isDeleted
        });
      });

      it('should handle projects without description', () => {
        const projectWithoutDescription = { ...mockProject, description: undefined };
        const searchIndex = projectTransformers.toSearchIndex(projectWithoutDescription);

        expect(searchIndex.description).toBe('');
      });

      it('should handle projects without metadata', () => {
        const projectWithoutMetadata = { ...mockProject, metadata: undefined };
        const searchIndex = projectTransformers.toSearchIndex(projectWithoutMetadata);

        expect(searchIndex.tags).toEqual([]);
        expect(searchIndex.category).toBe('');
      });
    });
  });

  describe('memberHelpers', () => {
    describe('getRoleDisplayName', () => {
      it('should return correct display names for all roles', () => {
        expect(memberHelpers.getRoleDisplayName('owner')).toBe('Owner');
        expect(memberHelpers.getRoleDisplayName('admin')).toBe('Admin');
        expect(memberHelpers.getRoleDisplayName('editor')).toBe('Editor');
        expect(memberHelpers.getRoleDisplayName('viewer')).toBe('Viewer');
      });
    });

    describe('getRoleColor', () => {
      it('should return correct colors for all roles', () => {
        expect(memberHelpers.getRoleColor('owner')).toBe('#8b5cf6');
        expect(memberHelpers.getRoleColor('admin')).toBe('#3b82f6');
        expect(memberHelpers.getRoleColor('editor')).toBe('#10b981');
        expect(memberHelpers.getRoleColor('viewer')).toBe('#6b7280');
      });
    });

    describe('canEdit', () => {
      it('should return true for roles with edit permissions', () => {
        expect(memberHelpers.canEdit('owner')).toBe(true);
        expect(memberHelpers.canEdit('admin')).toBe(true);
        expect(memberHelpers.canEdit('editor')).toBe(true);
      });

      it('should return false for roles without edit permissions', () => {
        expect(memberHelpers.canEdit('viewer')).toBe(false);
      });
    });

    describe('canAdmin', () => {
      it('should return true for roles with admin permissions', () => {
        expect(memberHelpers.canAdmin('owner')).toBe(true);
        expect(memberHelpers.canAdmin('admin')).toBe(true);
      });

      it('should return false for roles without admin permissions', () => {
        expect(memberHelpers.canAdmin('editor')).toBe(false);
        expect(memberHelpers.canAdmin('viewer')).toBe(false);
      });
    });

    describe('isOwner', () => {
      it('should return true only for owner role', () => {
        expect(memberHelpers.isOwner('owner')).toBe(true);
        expect(memberHelpers.isOwner('admin')).toBe(false);
        expect(memberHelpers.isOwner('editor')).toBe(false);
        expect(memberHelpers.isOwner('viewer')).toBe(false);
      });
    });

    describe('getInitials', () => {
      it('should generate initials from full name', () => {
        expect(memberHelpers.getInitials('John Doe')).toBe('JD');
        expect(memberHelpers.getInitials('Jane Smith Wilson')).toBe('JS');
        expect(memberHelpers.getInitials('A')).toBe('A');
      });

      it('should handle empty names', () => {
        expect(memberHelpers.getInitials('')).toBe('');
      });
    });

    describe('sortMembersByRole', () => {
      it('should sort members by role priority', () => {
        const members: ProjectMember[] = [
          { ...mockMember, id: '1', role: 'viewer' },
          { ...mockMember, id: '2', role: 'owner' },
          { ...mockMember, id: '3', role: 'editor' },
          { ...mockMember, id: '4', role: 'admin' }
        ];

        const sorted = memberHelpers.sortMembersByRole(members);

        expect(sorted[0].role).toBe('owner');
        expect(sorted[1].role).toBe('admin');
        expect(sorted[2].role).toBe('editor');
        expect(sorted[3].role).toBe('viewer');
      });

      it('should sort by name when roles are equal', () => {
        const members: ProjectMember[] = [
          { ...mockMember, id: '1', role: 'editor', displayName: 'Zoe' },
          { ...mockMember, id: '2', role: 'editor', displayName: 'Alice' },
          { ...mockMember, id: '3', role: 'editor', displayName: 'Bob' }
        ];

        const sorted = memberHelpers.sortMembersByRole(members);

        expect(sorted[0].displayName).toBe('Alice');
        expect(sorted[1].displayName).toBe('Bob');
        expect(sorted[2].displayName).toBe('Zoe');
      });
    });

    describe('getMemberCountByRole', () => {
      it('should count members by role', () => {
        const members: ProjectMember[] = [
          { ...mockMember, id: '1', role: 'owner' },
          { ...mockMember, id: '2', role: 'admin' },
          { ...mockMember, id: '3', role: 'editor' },
          { ...mockMember, id: '4', role: 'editor' },
          { ...mockMember, id: '5', role: 'viewer' }
        ];

        const counts = memberHelpers.getMemberCountByRole(members);

        expect(counts).toEqual({
          owner: 1,
          admin: 1,
          editor: 2,
          viewer: 1
        });
      });
    });
  });

  describe('canvasHelpers', () => {
    describe('getDisplayName', () => {
      it('should return canvas name', () => {
        expect(canvasHelpers.getDisplayName(mockCanvas)).toBe('Test Canvas');
      });

      it('should return default name for unnamed canvas', () => {
        const unnamedCanvas = { ...mockCanvas, name: '' };
        expect(canvasHelpers.getDisplayName(unnamedCanvas)).toBe('Untitled Canvas');
      });
    });

    describe('getSizeDisplay', () => {
      it('should return formatted size display', () => {
        expect(canvasHelpers.getSizeDisplay(mockCanvas)).toBe('1920 × 1080');
      });

      it('should use default dimensions when not specified', () => {
        const canvasWithoutDimensions = { ...mockCanvas, width: undefined, height: undefined };
        expect(canvasHelpers.getSizeDisplay(canvasWithoutDimensions)).toBe('1920 × 1080');
      });
    });

    describe('getAspectRatio', () => {
      it('should calculate aspect ratio correctly', () => {
        expect(canvasHelpers.getAspectRatio(mockCanvas)).toBeCloseTo(1.78, 2);
      });

      it('should handle square canvas', () => {
        const squareCanvas = { ...mockCanvas, width: 1000, height: 1000 };
        expect(canvasHelpers.getAspectRatio(squareCanvas)).toBe(1);
      });
    });

    describe('isLandscape', () => {
      it('should return true for landscape canvas', () => {
        expect(canvasHelpers.isLandscape(mockCanvas)).toBe(true);
      });

      it('should return false for portrait canvas', () => {
        const portraitCanvas = { ...mockCanvas, width: 1080, height: 1920 };
        expect(canvasHelpers.isLandscape(portraitCanvas)).toBe(false);
      });
    });

    describe('isPortrait', () => {
      it('should return false for landscape canvas', () => {
        expect(canvasHelpers.isPortrait(mockCanvas)).toBe(false);
      });

      it('should return true for portrait canvas', () => {
        const portraitCanvas = { ...mockCanvas, width: 1080, height: 1920 };
        expect(canvasHelpers.isPortrait(portraitCanvas)).toBe(true);
      });
    });

    describe('isSquare', () => {
      it('should return false for landscape canvas', () => {
        expect(canvasHelpers.isSquare(mockCanvas)).toBe(false);
      });

      it('should return true for square canvas', () => {
        const squareCanvas = { ...mockCanvas, width: 1000, height: 1000 };
        expect(canvasHelpers.isSquare(squareCanvas)).toBe(true);
      });
    });

    describe('getThumbnailDimensions', () => {
      it('should calculate thumbnail dimensions for landscape canvas', () => {
        const dimensions = canvasHelpers.getThumbnailDimensions(mockCanvas, 300);
        expect(dimensions.width).toBe(300);
        expect(dimensions.height).toBe(169);
      });

      it('should calculate thumbnail dimensions for portrait canvas', () => {
        const portraitCanvas = { ...mockCanvas, width: 1080, height: 1920 };
        const dimensions = canvasHelpers.getThumbnailDimensions(portraitCanvas, 300);
        expect(dimensions.width).toBe(169);
        expect(dimensions.height).toBe(300);
      });
    });

    describe('sortCanvasesByName', () => {
      it('should sort canvases by name', () => {
        const canvases: ProjectCanvas[] = [
          { ...mockCanvas, id: '1', name: 'Zebra' },
          { ...mockCanvas, id: '2', name: 'Apple' },
          { ...mockCanvas, id: '3', name: 'Banana' }
        ];

        const sorted = canvasHelpers.sortCanvasesByName(canvases);

        expect(sorted[0].name).toBe('Apple');
        expect(sorted[1].name).toBe('Banana');
        expect(sorted[2].name).toBe('Zebra');
      });
    });

    describe('sortCanvasesByDate', () => {
      it('should sort canvases by creation date', () => {
        const now = Date.now();
        const canvases: ProjectCanvas[] = [
          { ...mockCanvas, id: '1', createdAt: now - 1000 },
          { ...mockCanvas, id: '2', createdAt: now - 3000 },
          { ...mockCanvas, id: '3', createdAt: now - 2000 }
        ];

        const sorted = canvasHelpers.sortCanvasesByDate(canvases);

        expect(sorted[0].id).toBe('1');
        expect(sorted[1].id).toBe('3');
        expect(sorted[2].id).toBe('2');
      });
    });
  });

  describe('projectStats', () => {
    describe('calculateStats', () => {
      it('should calculate project statistics correctly', () => {
        const members: ProjectMember[] = [
          { ...mockMember, id: '1', role: 'owner' },
          { ...mockMember, id: '2', role: 'editor' },
          { ...mockMember, id: '3', role: 'viewer' }
        ];

        const canvases: ProjectCanvas[] = [
          { ...mockCanvas, id: '1', shapeCount: 10, size: 500000 },
          { ...mockCanvas, id: '2', shapeCount: 20, size: 1000000 }
        ];

        const stats = projectStats.calculateStats(mockProject, members, canvases);

        expect(stats).toMatchObject({
          memberCount: 3,
          memberCounts: {
            owner: 1,
            admin: 0,
            editor: 1,
            viewer: 1
          },
          canvasCount: 2,
          totalShapes: 30,
          totalSize: 1500000,
          averageShapesPerCanvas: 15,
          averageSizePerCanvas: 750000
        });
      });

      it('should handle empty members and canvases', () => {
        const stats = projectStats.calculateStats(mockProject, [], []);

        expect(stats).toMatchObject({
          memberCount: 0,
          canvasCount: 0,
          totalShapes: 0,
          totalSize: 0,
          averageShapesPerCanvas: 0,
          averageSizePerCanvas: 0
        });
      });
    });

    describe('getHealthScore', () => {
      it('should calculate health score correctly', () => {
        const members: ProjectMember[] = [
          { ...mockMember, id: '1', role: 'owner' },
          { ...mockMember, id: '2', role: 'editor' }
        ];

        const canvases: ProjectCanvas[] = [
          { ...mockCanvas, id: '1' }
        ];

        const score = projectStats.getHealthScore(mockProject, members, canvases);

        expect(score).toBe(100);
      });

      it('should deduct points for missing description', () => {
        const projectWithoutDescription = { ...mockProject, description: '' };
        const score = projectStats.getHealthScore(projectWithoutDescription, [], []);

        expect(score).toBe(40); // 100 - 10 (description) - 30 (no canvases) - 20 (no members)
      });

      it('should deduct points for archived project', () => {
        const archivedProject = { ...mockProject, isArchived: true };
        const score = projectStats.getHealthScore(archivedProject, [], []);

        expect(score).toBe(20); // 100 - 10 (description) - 30 (no canvases) - 20 (no members) - 50 (archived)
      });
    });

    describe('getActivityLevel', () => {
      it('should return high activity level', () => {
        const now = Date.now();
        const activities: ProjectActivity[] = Array.from({ length: 15 }, (_, i) => ({
          ...mockActivity,
          id: `activity${i}`,
          timestamp: now - (i * 3600000) // 1 hour apart
        }));

        const level = projectStats.getActivityLevel(mockProject, activities);

        expect(level).toBe('high');
      });

      it('should return medium activity level', () => {
        const now = Date.now();
        const activities: ProjectActivity[] = Array.from({ length: 5 }, (_, i) => ({
          ...mockActivity,
          id: `activity${i}`,
          timestamp: now - (i * 3600000) // 1 hour apart
        }));

        const level = projectStats.getActivityLevel(mockProject, activities);

        expect(level).toBe('medium');
      });

      it('should return low activity level', () => {
        const now = Date.now();
        const activities: ProjectActivity[] = [
          { ...mockActivity, timestamp: now - 86400000 } // 1 day ago
        ];

        const level = projectStats.getActivityLevel(mockProject, activities);

        expect(level).toBe('low');
      });

      it('should return none activity level', () => {
        const level = projectStats.getActivityLevel(mockProject, []);

        expect(level).toBe('none');
      });
    });
  });

  describe('projectValidators', () => {
    describe('validateName', () => {
      it('should validate correct project name', () => {
        const result = projectValidators.validateName('Valid Project Name');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject empty name', () => {
        const result = projectValidators.validateName('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Project name is required');
      });

      it('should reject name that is too short', () => {
        const result = projectValidators.validateName('A');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Project name must be at least 2 characters');
      });

      it('should reject name that is too long', () => {
        const longName = 'A'.repeat(101);
        const result = projectValidators.validateName(longName);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Project name must be less than 100 characters');
      });
    });

    describe('validateDescription', () => {
      it('should validate correct description', () => {
        const result = projectValidators.validateDescription('Valid description');
        expect(result.isValid).toBe(true);
      });

      it('should reject description that is too long', () => {
        const longDescription = 'A'.repeat(501);
        const result = projectValidators.validateDescription(longDescription);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Description must be less than 500 characters');
      });
    });

    describe('validateSettings', () => {
      it('should validate correct settings', () => {
        const result = projectValidators.validateSettings(mockProject.settings);
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid settings', () => {
        const invalidSettings = { ...mockProject.settings, allowComments: 'invalid' as any };
        const result = projectValidators.validateSettings(invalidSettings);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Allow comments must be a boolean');
      });
    });

    describe('validateMetadata', () => {
      it('should validate correct metadata', () => {
        const result = projectValidators.validateMetadata(mockProject.metadata);
        expect(result.isValid).toBe(true);
      });

      it('should reject too many tags', () => {
        const metadataWithTooManyTags = {
          ...mockProject.metadata,
          tags: Array.from({ length: 11 }, (_, i) => `tag${i}`)
        };
        const result = projectValidators.validateMetadata(metadataWithTooManyTags);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Maximum 10 tags allowed');
      });

      it('should reject invalid tag format', () => {
        const metadataWithInvalidTags = {
          ...mockProject.metadata,
          tags: ['valid', 'a'.repeat(21)] // Too long
        };
        const result = projectValidators.validateMetadata(metadataWithInvalidTags);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Each tag must be a string with maximum 20 characters');
      });
    });

    describe('validateProject', () => {
      it('should validate correct project', () => {
        const result = projectValidators.validateProject(mockProject);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return multiple errors for invalid project', () => {
        const invalidProject = {
          name: '',
          description: 'A'.repeat(501),
          settings: { allowComments: 'invalid' as any, allowDownloads: true, isPublic: false }
        };
        const result = projectValidators.validateProject(invalidProject);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('projectSorters', () => {
    const projects: Project[] = [
      { ...mockProject, id: '1', name: 'Zebra Project', createdAt: 1000, updatedAt: 3000 },
      { ...mockProject, id: '2', name: 'Apple Project', createdAt: 3000, updatedAt: 1000 },
      { ...mockProject, id: '3', name: 'Banana Project', createdAt: 2000, updatedAt: 2000 }
    ];

    describe('byName', () => {
      it('should sort projects by name ascending', () => {
        const sorted = projectSorters.byName(projects, 'asc');
        expect(sorted[0].name).toBe('Apple Project');
        expect(sorted[1].name).toBe('Banana Project');
        expect(sorted[2].name).toBe('Zebra Project');
      });

      it('should sort projects by name descending', () => {
        const sorted = projectSorters.byName(projects, 'desc');
        expect(sorted[0].name).toBe('Zebra Project');
        expect(sorted[1].name).toBe('Banana Project');
        expect(sorted[2].name).toBe('Apple Project');
      });
    });

    describe('byCreatedAt', () => {
      it('should sort projects by creation date', () => {
        const sorted = projectSorters.byCreatedAt(projects, 'desc');
        expect(sorted[0].id).toBe('2');
        expect(sorted[1].id).toBe('3');
        expect(sorted[2].id).toBe('1');
      });
    });

    describe('byUpdatedAt', () => {
      it('should sort projects by update date', () => {
        const sorted = projectSorters.byUpdatedAt(projects, 'desc');
        expect(sorted[0].id).toBe('1');
        expect(sorted[1].id).toBe('3');
        expect(sorted[2].id).toBe('2');
      });
    });
  });

  describe('projectFilters', () => {
    const projects: Project[] = [
      { ...mockProject, id: '1', name: 'Design Project', description: 'UI/UX design', isArchived: false },
      { ...mockProject, id: '2', name: 'Development Project', description: 'Web development', isArchived: true },
      { ...mockProject, id: '3', name: 'Marketing Project', description: 'Marketing campaign', isArchived: false }
    ];

    describe('byName', () => {
      it('should filter projects by name', () => {
        const filtered = projectFilters.byName(projects, 'design');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Design Project');
      });

      it('should return all projects for empty query', () => {
        const filtered = projectFilters.byName(projects, '');
        expect(filtered).toHaveLength(3);
      });
    });

    describe('byDescription', () => {
      it('should filter projects by description', () => {
        const filtered = projectFilters.byDescription(projects, 'development');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].description).toBe('Web development');
      });
    });

    describe('byStatus', () => {
      it('should filter active projects', () => {
        const filtered = projectFilters.byStatus(projects, 'active');
        expect(filtered).toHaveLength(2);
        expect(filtered.every(p => !p.isArchived && !p.isDeleted)).toBe(true);
      });

      it('should filter archived projects', () => {
        const filtered = projectFilters.byStatus(projects, 'archived');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].isArchived).toBe(true);
      });
    });

    describe('byDateRange', () => {
      it('should filter projects by date range', () => {
        const startDate = new Date(Date.now() - 86400000);
        const endDate = new Date(Date.now() + 86400000);
        const filtered = projectFilters.byDateRange(projects, startDate, endDate);
        expect(filtered).toHaveLength(3);
      });
    });

    describe('byOwner', () => {
      it('should filter projects by owner', () => {
        const filtered = projectFilters.byOwner(projects, 'user123');
        expect(filtered).toHaveLength(3);
      });
    });

    describe('byTags', () => {
      it('should filter projects by tags', () => {
        const projectsWithTags = projects.map(p => ({
          ...p,
          metadata: { ...p.metadata, tags: ['design', 'ui'] }
        }));
        const filtered = projectFilters.byTags(projectsWithTags, ['design']);
        expect(filtered).toHaveLength(3);
      });
    });
  });
});
