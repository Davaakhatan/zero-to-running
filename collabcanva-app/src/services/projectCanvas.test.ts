// Unit tests for project canvas service
// Tests for project-specific Firebase paths and canvas operations

import { 
  getProjectCanvasPath,
  initializeProjectCanvas,
  subscribeToProjectCanvas,
  createProjectShape,
  updateProjectShape,
  updateProjectShapes,
  deleteProjectShape,
  lockProjectShape,
  unlockProjectShape,
  getProjectCanvasMetadata,
  updateProjectCanvasMetadata,
  deleteProjectCanvas,
  duplicateProjectCanvas,
  exportProjectCanvas,
  importProjectCanvas
} from './projectCanvas';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
}));

jest.mock('./firebase', () => ({
  db: {}
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

describe('Project Canvas Service', () => {
  const mockProjectId = 'project123';
  const mockCanvasId = 'canvas456';
  const mockShape = {
    id: 'shape789',
    type: 'rectangle' as const,
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#ff0000',
    createdBy: 'user123',
    createdAt: Date.now()
  };

  const mockCanvasRef = { id: mockCanvasId };
  const mockCanvasDoc = {
    exists: () => true,
    data: () => ({
      canvasId: mockCanvasId,
      projectId: mockProjectId,
      shapes: [mockShape],
      lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 },
      metadata: {
        name: 'Test Canvas',
        description: 'A test canvas',
        createdBy: 'user123',
        createdAt: Date.now()
      }
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue(mockCanvasRef as any);
    mockGetDoc.mockResolvedValue(mockCanvasDoc as any);
  });

  describe('getProjectCanvasPath', () => {
    it('should generate correct Firebase path', () => {
      const path = getProjectCanvasPath(mockProjectId, mockCanvasId);
      expect(path).toBe(`projects/${mockProjectId}/canvases/${mockCanvasId}`);
    });
  });

  describe('initializeProjectCanvas', () => {
    it('should create new canvas document if it does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      await initializeProjectCanvas(mockProjectId, mockCanvasId);

      expect(mockDoc).toHaveBeenCalledWith(db, `projects/${mockProjectId}/canvases/${mockCanvasId}`);
      expect(mockSetDoc).toHaveBeenCalledWith(mockCanvasRef, {
        canvasId: mockCanvasId,
        projectId: mockProjectId,
        shapes: [],
        lastUpdated: expect.any(Object),
        metadata: {
          name: 'Untitled Canvas',
          description: '',
          thumbnail: '',
          createdBy: '',
          createdAt: expect.any(Number),
          lastModifiedBy: '',
          lastModifiedAt: expect.any(Number)
        }
      });
    });

    it('should not create document if it already exists', async () => {
      await initializeProjectCanvas(mockProjectId, mockCanvasId);

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should use custom metadata when provided', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      const customMetadata = {
        name: 'Custom Canvas',
        description: 'Custom description',
        createdBy: 'user456'
      };

      await initializeProjectCanvas(mockProjectId, mockCanvasId, customMetadata);

      expect(mockSetDoc).toHaveBeenCalledWith(mockCanvasRef, {
        canvasId: mockCanvasId,
        projectId: mockProjectId,
        shapes: [],
        lastUpdated: expect.any(Object),
        metadata: {
          name: 'Custom Canvas',
          description: 'Custom description',
          thumbnail: '',
          createdBy: 'user456',
          createdAt: expect.any(Number),
          lastModifiedBy: 'user456',
          lastModifiedAt: expect.any(Number)
        }
      });
    });
  });

  describe('subscribeToProjectCanvas', () => {
    it('should subscribe to canvas changes', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToProjectCanvas(mockProjectId, mockCanvasId, mockCallback);

      expect(mockDoc).toHaveBeenCalledWith(db, `projects/${mockProjectId}/canvases/${mockCanvasId}`);
      expect(mockOnSnapshot).toHaveBeenCalledWith(mockCanvasRef, expect.any(Function));
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with shapes when document exists', () => {
      const mockCallback = jest.fn();
      const mockSnapshot = {
        exists: () => true,
        data: () => ({
          shapes: [mockShape]
        })
      };

      mockOnSnapshot.mockImplementation((ref, callback) => {
        callback(mockSnapshot as any);
        return jest.fn();
      });

      subscribeToProjectCanvas(mockProjectId, mockCanvasId, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([mockShape]);
    });

    it('should initialize canvas if document does not exist', () => {
      const mockCallback = jest.fn();
      const mockSnapshot = {
        exists: () => false
      };

      mockOnSnapshot.mockImplementation((ref, callback) => {
        callback(mockSnapshot as any);
        return jest.fn();
      });

      subscribeToProjectCanvas(mockProjectId, mockCanvasId, mockCallback);

      expect(mockGetDoc).toHaveBeenCalled();
    });
  });

  describe('createProjectShape', () => {
    it('should add shape to existing canvas', async () => {
      await createProjectShape(mockProjectId, mockCanvasId, mockShape);

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockCanvasRef, {
        shapes: [mockShape, mockShape],
        lastUpdated: expect.any(Object),
        'metadata.lastModifiedAt': expect.any(Number),
        'metadata.lastModifiedBy': mockShape.createdBy
      });
    });

    it('should initialize canvas if it does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      await createProjectShape(mockProjectId, mockCanvasId, mockShape);

      expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('updateProjectShape', () => {
    it('should update existing shape', async () => {
      const updates = { fill: '#00ff00', width: 300 };

      await updateProjectShape(mockProjectId, mockCanvasId, mockShape.id, updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockCanvasRef, {
        shapes: [{
          ...mockShape,
          ...updates,
          lastModifiedAt: expect.any(Number)
        }],
        lastUpdated: expect.any(Object),
        'metadata.lastModifiedAt': expect.any(Number),
        'metadata.lastModifiedBy': updates.lastModifiedBy || updates.createdBy
      });
    });

    it('should not update if canvas does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      await updateProjectShape(mockProjectId, mockCanvasId, mockShape.id, { fill: '#00ff00' });

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('updateProjectShapes', () => {
    it('should update multiple shapes', async () => {
      const updatedShapes = [mockShape, { ...mockShape, id: 'shape999' }];

      await updateProjectShapes(mockProjectId, mockCanvasId, updatedShapes);

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockCanvasRef, {
        shapes: updatedShapes,
        lastUpdated: expect.any(Object),
        'metadata.lastModifiedAt': expect.any(Number)
      });
    });
  });

  describe('deleteProjectShape', () => {
    it('should remove shape from canvas', async () => {
      await deleteProjectShape(mockProjectId, mockCanvasId, mockShape.id);

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockCanvasRef, {
        shapes: [],
        lastUpdated: expect.any(Object),
        'metadata.lastModifiedAt': expect.any(Number)
      });
    });

    it('should not update if canvas does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      await deleteProjectShape(mockProjectId, mockCanvasId, mockShape.id);

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('lockProjectShape', () => {
    it('should lock shape with user ID', async () => {
      const userId = 'user123';

      await lockProjectShape(mockProjectId, mockCanvasId, mockShape.id, userId);

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockCanvasRef, {
        shapes: [{
          ...mockShape,
          isLocked: true,
          lockedBy: userId,
          lockedAt: expect.any(Number),
          lastModifiedAt: expect.any(Number)
        }],
        lastUpdated: expect.any(Object),
        'metadata.lastModifiedAt': expect.any(Number)
      });
    });
  });

  describe('unlockProjectShape', () => {
    it('should unlock shape', async () => {
      await unlockProjectShape(mockProjectId, mockCanvasId, mockShape.id);

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockCanvasRef, {
        shapes: [{
          ...mockShape,
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          lastModifiedAt: expect.any(Number)
        }],
        lastUpdated: expect.any(Object),
        'metadata.lastModifiedAt': expect.any(Number)
      });
    });
  });

  describe('getProjectCanvasMetadata', () => {
    it('should return metadata if canvas exists', async () => {
      const metadata = await getProjectCanvasMetadata(mockProjectId, mockCanvasId);

      expect(metadata).toEqual({
        name: 'Test Canvas',
        description: 'A test canvas',
        createdBy: 'user123',
        createdAt: expect.any(Number)
      });
    });

    it('should return null if canvas does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      const metadata = await getProjectCanvasMetadata(mockProjectId, mockCanvasId);

      expect(metadata).toBeNull();
    });
  });

  describe('updateProjectCanvasMetadata', () => {
    it('should update canvas metadata', async () => {
      const updates = { name: 'Updated Canvas', description: 'Updated description' };

      await updateProjectCanvasMetadata(mockProjectId, mockCanvasId, updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockCanvasRef, {
        metadata: {
          name: 'Test Canvas',
          description: 'A test canvas',
          createdBy: 'user123',
          createdAt: expect.any(Number),
          ...updates,
          lastModifiedAt: expect.any(Number)
        },
        lastUpdated: expect.any(Object)
      });
    });

    it('should not update if canvas does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      await updateProjectCanvasMetadata(mockProjectId, mockCanvasId, { name: 'Updated' });

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('deleteProjectCanvas', () => {
    it('should mark canvas as deleted', async () => {
      await deleteProjectCanvas(mockProjectId, mockCanvasId);

      expect(mockSetDoc).toHaveBeenCalledWith(mockCanvasRef, {
        canvasId: mockCanvasId,
        projectId: mockProjectId,
        shapes: [],
        lastUpdated: expect.any(Object),
        metadata: {
          name: 'Deleted Canvas',
          description: '',
          thumbnail: '',
          createdBy: '',
          createdAt: expect.any(Number),
          lastModifiedBy: '',
          lastModifiedAt: expect.any(Number),
          deleted: true
        }
      });
    });
  });

  describe('duplicateProjectCanvas', () => {
    it('should duplicate canvas with new IDs', async () => {
      const targetProjectId = 'project999';
      const targetCanvasId = 'canvas999';
      const newName = 'Duplicated Canvas';

      await duplicateProjectCanvas(
        mockProjectId, 
        mockCanvasId, 
        targetProjectId, 
        targetCanvasId, 
        newName
      );

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: targetCanvasId }),
        {
          canvasId: targetCanvasId,
          projectId: targetProjectId,
          shapes: expect.arrayContaining([
            expect.objectContaining({
              id: expect.stringContaining('shape789-copy-'),
              createdBy: 'user123',
              createdAt: expect.any(Number),
              lastModifiedBy: 'user123',
              lastModifiedAt: expect.any(Number),
              isLocked: false,
              lockedBy: null,
              lockedAt: null
            })
          ]),
          lastUpdated: expect.any(Object),
          metadata: {
            name: 'Duplicated Canvas',
            description: 'A test canvas',
            createdBy: 'user123',
            createdAt: expect.any(Number),
            lastModifiedAt: expect.any(Number)
          }
        }
      );
    });

    it('should not duplicate if source canvas does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      await duplicateProjectCanvas(
        mockProjectId, 
        mockCanvasId, 
        'project999', 
        'canvas999'
      );

      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('exportProjectCanvas', () => {
    it('should return canvas data if it exists', async () => {
      const canvasData = await exportProjectCanvas(mockProjectId, mockCanvasId);

      expect(canvasData).toEqual({
        canvasId: mockCanvasId,
        projectId: mockProjectId,
        shapes: [mockShape],
        lastUpdated: expect.any(Object),
        metadata: expect.any(Object)
      });
    });

    it('should return null if canvas does not exist', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValue(mockNonExistentDoc as any);

      const canvasData = await exportProjectCanvas(mockProjectId, mockCanvasId);

      expect(canvasData).toBeNull();
    });
  });

  describe('importProjectCanvas', () => {
    it('should import canvas data', async () => {
      const canvasData = {
        canvasId: 'imported123',
        projectId: 'imported456',
        shapes: [mockShape],
        lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 },
        metadata: {
          name: 'Imported Canvas',
          createdBy: 'user123'
        }
      };

      await importProjectCanvas(mockProjectId, mockCanvasId, canvasData);

      expect(mockSetDoc).toHaveBeenCalledWith(mockCanvasRef, {
        ...canvasData,
        canvasId: mockCanvasId,
        projectId: mockProjectId,
        lastUpdated: expect.any(Object),
        'metadata.lastModifiedAt': expect.any(Number)
      });
    });
  });
});