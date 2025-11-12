// Unit tests for deep link service
// Tests for URL parsing, validation, processing, and caching

import { DeepLinkParser, DeepLinkService, deepLinkService, deepLinkUtils } from './deepLinkService';
import { projectService } from './projectService';

// Mock project service
jest.mock('./projectService', () => ({
  projectService: {
    getProject: jest.fn(),
    getProjectCanvases: jest.fn()
  }
}));

const mockProjectService = projectService as jest.Mocked<typeof projectService>;

describe('DeepLinkParser', () => {
  describe('parseUrl', () => {
    it('should parse project URL correctly', () => {
      const url = 'https://example.com/projects/project123';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({
        projectId: 'project123'
      });
    });

    it('should parse canvas URL correctly', () => {
      const url = 'https://example.com/projects/project123/canvases/canvas456';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({
        projectId: 'project123',
        canvasId: 'canvas456'
      });
    });

    it('should parse project view URL correctly', () => {
      const url = 'https://example.com/projects/project123/settings';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({
        projectId: 'project123',
        view: 'settings'
      });
    });

    it('should parse query parameters correctly', () => {
      const url = 'https://example.com/projects/project123?tab=members&q=search&zoom=1.5&mode=edit';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({
        projectId: 'project123',
        tab: 'members',
        query: 'search',
        zoom: 1.5,
        mode: 'edit'
      });
    });

    it('should parse pan coordinates correctly', () => {
      const url = 'https://example.com/projects/project123?panX=100&panY=200';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({
        projectId: 'project123',
        pan: { x: 100, y: 200 }
      });
    });

    it('should parse selection correctly', () => {
      const url = 'https://example.com/projects/project123?selection=shape1,shape2,shape3';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({
        projectId: 'project123',
        selection: ['shape1', 'shape2', 'shape3']
      });
    });

    it('should handle invalid URLs gracefully', () => {
      const url = 'invalid-url';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({});
    });

    it('should handle empty URLs', () => {
      const url = '';
      const result = DeepLinkParser.parseUrl(url);
      
      expect(result).toEqual({});
    });
  });

  describe('generateUrl', () => {
    it('should generate project URL correctly', () => {
      const params = { projectId: 'project123' };
      const result = DeepLinkParser.generateUrl(params);
      
      expect(result).toContain('/projects/project123');
    });

    it('should generate canvas URL correctly', () => {
      const params = { projectId: 'project123', canvasId: 'canvas456' };
      const result = DeepLinkParser.generateUrl(params);
      
      expect(result).toContain('/projects/project123/canvases/canvas456');
    });

    it('should generate URL with query parameters', () => {
      const params = {
        projectId: 'project123',
        tab: 'members',
        query: 'search',
        zoom: 1.5,
        mode: 'edit'
      };
      const result = DeepLinkParser.generateUrl(params);
      
      expect(result).toContain('/projects/project123');
      expect(result).toContain('tab=members');
      expect(result).toContain('q=search');
      expect(result).toContain('zoom=1.5');
      expect(result).toContain('mode=edit');
    });

    it('should generate URL with pan coordinates', () => {
      const params = {
        projectId: 'project123',
        pan: { x: 100, y: 200 }
      };
      const result = DeepLinkParser.generateUrl(params);
      
      expect(result).toContain('panX=100');
      expect(result).toContain('panY=200');
    });

    it('should generate URL with selection', () => {
      const params = {
        projectId: 'project123',
        selection: ['shape1', 'shape2', 'shape3']
      };
      const result = DeepLinkParser.generateUrl(params);
      
      expect(result).toContain('selection=shape1,shape2,shape3');
    });

    it('should handle invalid parameters gracefully', () => {
      const params = { projectId: 'invalid@id' };
      const result = DeepLinkParser.generateUrl(params);
      
      expect(result).toBeDefined();
    });
  });

  describe('validateParams', () => {
    it('should validate correct parameters', () => {
      const params = {
        projectId: 'project123',
        canvasId: 'canvas456',
        view: 'dashboard',
        mode: 'edit',
        zoom: 1.5
      };
      const result = DeepLinkParser.validateParams(params);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid project ID format', () => {
      const params = { projectId: 'invalid@id' };
      const result = DeepLinkParser.validateParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid project ID format');
    });

    it('should reject invalid canvas ID format', () => {
      const params = { canvasId: 'invalid@id' };
      const result = DeepLinkParser.validateParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid canvas ID format');
    });

    it('should reject invalid view parameter', () => {
      const params = { view: 'invalid' };
      const result = DeepLinkParser.validateParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid view parameter');
    });

    it('should reject invalid mode parameter', () => {
      const params = { mode: 'invalid' };
      const result = DeepLinkParser.validateParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid mode parameter');
    });

    it('should reject invalid zoom level', () => {
      const params = { zoom: 15 };
      const result = DeepLinkParser.validateParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid zoom level (must be between 0.1 and 10)');
    });

    it('should reject invalid pan coordinates', () => {
      const params = { pan: { x: 'invalid', y: 200 } };
      const result = DeepLinkParser.validateParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid pan coordinates');
    });
  });
});

describe('DeepLinkService', () => {
  let service: DeepLinkService;

  beforeEach(() => {
    service = new DeepLinkService();
    jest.clearAllMocks();
  });

  describe('processDeepLink', () => {
    it('should process valid project deep link', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        ownerId: 'user1',
        members: []
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);

      const url = 'https://example.com/projects/project123';
      const result = await service.processDeepLink(url);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockProject);
      expect(mockProjectService.getProject).toHaveBeenCalledWith('project123');
    });

    it('should process valid canvas deep link', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        ownerId: 'user1',
        members: []
      };

      const mockCanvas = {
        id: 'canvas456',
        projectId: 'project123',
        name: 'Test Canvas',
        width: 1920,
        height: 1080
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);
      mockProjectService.getProjectCanvases.mockResolvedValue([mockCanvas]);

      const url = 'https://example.com/projects/project123/canvases/canvas456';
      const result = await service.processDeepLink(url);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockProject);
      expect(result.canvas).toEqual(mockCanvas);
    });

    it('should handle project not found', async () => {
      mockProjectService.getProject.mockResolvedValue(null);

      const url = 'https://example.com/projects/nonexistent';
      const result = await service.processDeepLink(url);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project not found');
    });

    it('should handle canvas not found', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        ownerId: 'user1',
        members: []
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);
      mockProjectService.getProjectCanvases.mockResolvedValue([]);

      const url = 'https://example.com/projects/project123/canvases/nonexistent';
      const result = await service.processDeepLink(url);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Canvas not found');
    });

    it('should handle service errors', async () => {
      mockProjectService.getProject.mockRejectedValue(new Error('Service error'));

      const url = 'https://example.com/projects/project123';
      const result = await service.processDeepLink(url);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service error');
    });

    it('should handle timeout', async () => {
      mockProjectService.getProject.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(null), 2000))
      );

      const url = 'https://example.com/projects/project123';
      const result = await service.processDeepLink(url, { timeout: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout');
    });

    it('should use cache for repeated requests', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        ownerId: 'user1',
        members: []
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);

      const url = 'https://example.com/projects/project123';
      
      // First request
      const result1 = await service.processDeepLink(url);
      expect(result1.success).toBe(true);
      expect(mockProjectService.getProject).toHaveBeenCalledTimes(1);

      // Second request should use cache
      const result2 = await service.processDeepLink(url);
      expect(result2.success).toBe(true);
      expect(mockProjectService.getProject).toHaveBeenCalledTimes(1);
    });

    it('should generate metadata when requested', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        description: 'Test Description',
        thumbnail: 'test-thumbnail.jpg',
        ownerId: 'user1',
        members: []
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);

      const url = 'https://example.com/projects/project123';
      const result = await service.processDeepLink(url, { generateMetadata: true });

      expect(result.success).toBe(true);
      expect(result.metadata).toEqual({
        title: 'Test Project',
        description: 'Test Description',
        thumbnail: 'test-thumbnail.jpg'
      });
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      service.clearCache();
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should invalidate project cache', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        ownerId: 'user1',
        members: []
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);

      const url = 'https://example.com/projects/project123';
      await service.processDeepLink(url);

      service.invalidateProject('project123');
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should invalidate canvas cache', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        ownerId: 'user1',
        members: []
      };

      const mockCanvas = {
        id: 'canvas456',
        projectId: 'project123',
        name: 'Test Canvas',
        width: 1920,
        height: 1080
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);
      mockProjectService.getProjectCanvases.mockResolvedValue([mockCanvas]);

      const url = 'https://example.com/projects/project123/canvases/canvas456';
      await service.processDeepLink(url);

      service.invalidateCanvas('project123', 'canvas456');
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        ownerId: 'user1',
        members: []
      };

      mockProjectService.getProject.mockResolvedValue(mockProject);

      const url = 'https://example.com/projects/project123';
      await service.processDeepLink(url);

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toHaveLength(1);
    });
  });
});

describe('deepLinkUtils', () => {
  describe('isDeepLink', () => {
    it('should identify project deep links', () => {
      const url = 'https://example.com/projects/project123';
      expect(deepLinkUtils.isDeepLink(url)).toBe(true);
    });

    it('should identify canvas deep links', () => {
      const url = 'https://example.com/projects/project123/canvases/canvas456';
      expect(deepLinkUtils.isDeepLink(url)).toBe(true);
    });

    it('should reject non-deep links', () => {
      const url = 'https://example.com/login';
      expect(deepLinkUtils.isDeepLink(url)).toBe(false);
    });
  });

  describe('getDeepLinkType', () => {
    it('should return canvas for canvas URLs', () => {
      const url = 'https://example.com/projects/project123/canvases/canvas456';
      expect(deepLinkUtils.getDeepLinkType(url)).toBe('canvas');
    });

    it('should return project for project URLs', () => {
      const url = 'https://example.com/projects/project123';
      expect(deepLinkUtils.getDeepLinkType(url)).toBe('project');
    });

    it('should return none for non-deep links', () => {
      const url = 'https://example.com/login';
      expect(deepLinkUtils.getDeepLinkType(url)).toBe('none');
    });
  });

  describe('getProjectIdFromUrl', () => {
    it('should extract project ID from URL', () => {
      const url = 'https://example.com/projects/project123';
      expect(deepLinkUtils.getProjectIdFromUrl(url)).toBe('project123');
    });

    it('should return null for non-project URLs', () => {
      const url = 'https://example.com/login';
      expect(deepLinkUtils.getProjectIdFromUrl(url)).toBe(null);
    });
  });

  describe('getCanvasIdFromUrl', () => {
    it('should extract canvas ID from URL', () => {
      const url = 'https://example.com/projects/project123/canvases/canvas456';
      expect(deepLinkUtils.getCanvasIdFromUrl(url)).toBe('canvas456');
    });

    it('should return null for non-canvas URLs', () => {
      const url = 'https://example.com/projects/project123';
      expect(deepLinkUtils.getCanvasIdFromUrl(url)).toBe(null);
    });
  });

  describe('createShareableLink', () => {
    it('should create project shareable link', () => {
      const params = { projectId: 'project123' };
      const link = deepLinkUtils.createShareableLink(params);
      expect(link).toContain('/projects/project123');
    });

    it('should create canvas shareable link', () => {
      const params = { projectId: 'project123', canvasId: 'canvas456' };
      const link = deepLinkUtils.createShareableLink(params);
      expect(link).toContain('/projects/project123/canvases/canvas456');
    });
  });

  describe('createCanvasShareLink', () => {
    it('should create canvas share link', () => {
      const link = deepLinkUtils.createCanvasShareLink('project123', 'canvas456');
      expect(link).toContain('/projects/project123/canvases/canvas456');
    });

    it('should include additional options', () => {
      const link = deepLinkUtils.createCanvasShareLink('project123', 'canvas456', { mode: 'edit' });
      expect(link).toContain('mode=edit');
    });
  });

  describe('createProjectShareLink', () => {
    it('should create project share link', () => {
      const link = deepLinkUtils.createProjectShareLink('project123');
      expect(link).toContain('/projects/project123');
    });

    it('should include additional options', () => {
      const link = deepLinkUtils.createProjectShareLink('project123', { view: 'settings' });
      expect(link).toContain('/projects/project123/settings');
    });
  });
});

describe('deepLinkService singleton', () => {
  it('should return same instance', () => {
    const instance1 = DeepLinkService.getInstance();
    const instance2 = DeepLinkService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should work with exported singleton', () => {
    expect(deepLinkService).toBeDefined();
    expect(deepLinkService).toBeInstanceOf(DeepLinkService);
  });
});
