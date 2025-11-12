// Unit tests for usePresence hook
// Tests for presence management and activity tracking

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePresence, usePresenceCheck } from './usePresence';
import { useAuth } from '../contexts/AuthContext';
import { presenceService } from '../services/presenceService';
import { PresenceData, ActivityType } from '../types';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../services/presenceService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPresenceService = presenceService as jest.Mocked<typeof presenceService>;

// Test data
const mockUser = {
  uid: 'user1',
  email: 'user1@example.com',
  displayName: 'User One',
  photoURL: 'https://example.com/avatar.jpg'
};

const mockPresenceData: PresenceData[] = [
  {
    userId: 'user2',
    userEmail: 'user2@example.com',
    displayName: 'User Two',
    avatar: 'https://example.com/avatar2.jpg',
    isOnline: true,
    lastSeen: Date.now() - 60000,
    currentActivity: 'editing',
    currentCanvas: 'canvas1',
    currentProject: 'project1',
    cursorPosition: { x: 100, y: 200 },
    selectedShapes: ['shape1'],
    isTyping: false,
    connectionId: 'conn1',
    metadata: {
      userAgent: 'Mozilla/5.0...',
      platform: 'Win32',
      browser: 'Chrome',
      version: '91.0'
    }
  },
  {
    userId: 'user3',
    userEmail: 'user3@example.com',
    displayName: 'User Three',
    avatar: 'https://example.com/avatar3.jpg',
    isOnline: true,
    lastSeen: Date.now() - 120000,
    currentActivity: 'viewing',
    currentCanvas: 'canvas1',
    currentProject: 'project1',
    cursorPosition: { x: 300, y: 400 },
    selectedShapes: [],
    isTyping: true,
    typingIn: 'chat1',
    connectionId: 'conn2',
    metadata: {
      userAgent: 'Mozilla/5.0...',
      platform: 'MacIntel',
      browser: 'Safari',
      version: '14.0'
    }
  }
];

describe('usePresence', () => {
  const mockInitializePresence = jest.fn();
  const mockUpdateActivity = jest.fn();
  const mockUpdateCursorPosition = jest.fn();
  const mockUpdateSelectedShapes = jest.fn();
  const mockSetTyping = jest.fn();
  const mockSwitchProject = jest.fn();
  const mockSwitchCanvas = jest.fn();
  const mockListenToProjectPresence = jest.fn();
  const mockListenToCanvasPresence = jest.fn();
  const mockCleanup = jest.fn();
  const mockTrackActivity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });

    // Mock presence service methods
    mockPresenceService.initializePresence = mockInitializePresence;
    mockPresenceService.updateActivity = mockUpdateActivity;
    mockPresenceService.updateCursorPosition = mockUpdateCursorPosition;
    mockPresenceService.updateSelectedShapes = mockUpdateSelectedShapes;
    mockPresenceService.setTyping = mockSetTyping;
    mockPresenceService.switchProject = mockSwitchProject;
    mockPresenceService.switchCanvas = mockSwitchCanvas;
    mockPresenceService.listenToProjectPresence = mockListenToProjectPresence;
    mockPresenceService.listenToCanvasPresence = mockListenToCanvasPresence;
    mockPresenceService.cleanup = mockCleanup;
    mockPresenceService.trackActivity = mockTrackActivity;
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      expect(result.current.currentUser).toBeNull();
      expect(result.current.isOnline).toBe(false);
      expect(result.current.projectPresence).toEqual([]);
      expect(result.current.canvasPresence).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize presence when user is available', async () => {
      mockInitializePresence.mockResolvedValue();

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(mockInitializePresence).toHaveBeenCalled();
      });

      expect(result.current.currentUser).toBe(mockUser);
      expect(result.current.isOnline).toBe(true);
    });

    it('should not initialize when disabled', () => {
      const { result } = renderHook(() => 
        usePresence({ projectId: 'project1', enabled: false })
      );

      expect(result.current.currentUser).toBeNull();
      expect(mockInitializePresence).not.toHaveBeenCalled();
    });
  });

  describe('Presence Management', () => {
    it('should update activity', async () => {
      mockInitializePresence.mockResolvedValue();
      mockUpdateActivity.mockResolvedValue();

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.updateActivity('editing', { shapeId: 'shape1' });
      });

      expect(mockUpdateActivity).toHaveBeenCalledWith('editing', { shapeId: 'shape1' });
      expect(result.current.currentActivity).toBe('editing');
    });

    it('should update cursor position', async () => {
      mockInitializePresence.mockResolvedValue();
      mockUpdateCursorPosition.mockResolvedValue();

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.updateCursorPosition(100, 200);
      });

      expect(mockUpdateCursorPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should update selected shapes', async () => {
      mockInitializePresence.mockResolvedValue();
      mockUpdateSelectedShapes.mockResolvedValue();

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.updateSelectedShapes(['shape1', 'shape2']);
      });

      expect(mockUpdateSelectedShapes).toHaveBeenCalledWith(['shape1', 'shape2']);
    });

    it('should set typing status', async () => {
      mockInitializePresence.mockResolvedValue();
      mockSetTyping.mockResolvedValue();

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.setTyping(true, 'chat1');
      });

      expect(mockSetTyping).toHaveBeenCalledWith(true, 'chat1');
    });

    it('should switch project', async () => {
      mockInitializePresence.mockResolvedValue();
      mockSwitchProject.mockResolvedValue();

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.switchProject('project2');
      });

      expect(mockSwitchProject).toHaveBeenCalledWith('project2');
    });

    it('should switch canvas', async () => {
      mockInitializePresence.mockResolvedValue();
      mockSwitchCanvas.mockResolvedValue();

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.switchCanvas('canvas2');
      });

      expect(mockSwitchCanvas).toHaveBeenCalledWith('canvas2');
    });
  });

  describe('Presence Listeners', () => {
    it('should setup project presence listener', () => {
      const mockCleanup = jest.fn();
      mockListenToProjectPresence.mockReturnValue(mockCleanup);

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      expect(mockListenToProjectPresence).toHaveBeenCalledWith(
        'project1',
        expect.any(Function)
      );
    });

    it('should setup canvas presence listener', () => {
      const mockCleanup = jest.fn();
      mockListenToCanvasPresence.mockReturnValue(mockCleanup);

      const { result } = renderHook(() => usePresence({ projectId: 'project1', canvasId: 'canvas1' }));

      expect(mockListenToCanvasPresence).toHaveBeenCalledWith(
        'project1',
        'canvas1',
        expect.any(Function)
      );
    });

    it('should update presence data when listener receives data', () => {
      const mockCleanup = jest.fn();
      let presenceCallback: (presence: PresenceData[]) => void;
      
      mockListenToProjectPresence.mockImplementation((projectId, callback) => {
        presenceCallback = callback;
        return mockCleanup;
      });

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      // Simulate presence data received
      act(() => {
        presenceCallback(mockPresenceData);
      });

      expect(result.current.projectPresence).toEqual(mockPresenceData);
    });

    it('should cleanup listeners on unmount', () => {
      const mockCleanup = jest.fn();
      mockListenToProjectPresence.mockReturnValue(mockCleanup);

      const { unmount } = renderHook(() => usePresence({ projectId: 'project1' }));

      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('Activity Tracking', () => {
    it('should track activity on user interactions', () => {
      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      // Simulate user interaction
      act(() => {
        const event = new Event('mousedown');
        document.dispatchEvent(event);
      });

      expect(mockTrackActivity).toHaveBeenCalled();
    });

    it('should track activity on multiple event types', () => {
      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      
      events.forEach(eventType => {
        act(() => {
          const event = new Event(eventType);
          document.dispatchEvent(event);
        });
      });

      expect(mockTrackActivity).toHaveBeenCalledTimes(events.length);
    });
  });

  describe('Statistics', () => {
    it('should calculate presence statistics correctly', () => {
      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      // Set up presence data
      act(() => {
        result.current.projectPresence = mockPresenceData;
        result.current.canvasPresence = mockPresenceData;
      });

      const stats = result.current.getPresenceStats();

      expect(stats.total).toBe(2); // Unique users
      expect(stats.online).toBe(2); // Online users
      expect(stats.active).toBe(2); // Recently active users
      expect(stats.byActivity.editing).toBe(1);
      expect(stats.byActivity.viewing).toBe(1);
    });
  });

  describe('Computed Values', () => {
    it('should calculate online counts correctly', () => {
      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      // Set up presence data
      act(() => {
        result.current.projectPresence = mockPresenceData;
        result.current.canvasPresence = mockPresenceData;
      });

      expect(result.current.projectOnlineCount).toBe(2);
      expect(result.current.canvasOnlineCount).toBe(2);
      expect(result.current.projectActiveCount).toBe(2);
      expect(result.current.canvasActiveCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      mockInitializePresence.mockRejectedValue(new Error('Initialization failed'));

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.error).toBe('Initialization failed');
      });
    });

    it('should handle activity update errors', async () => {
      mockInitializePresence.mockResolvedValue();
      mockUpdateActivity.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.updateActivity('editing');
      });

      expect(result.current.error).toBe('Update failed');
    });

    it('should handle generic errors', async () => {
      mockInitializePresence.mockResolvedValue();
      mockUpdateActivity.mockRejectedValue(new Error('Generic error'));

      const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

      await waitFor(() => {
        expect(result.current.currentUser).toBe(mockUser);
      });

      await act(async () => {
        await result.current.updateActivity('editing');
      });

      expect(result.current.error).toBe('Failed to update activity');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => usePresence({ projectId: 'project1' }));

      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should cleanup when user changes', () => {
      const { rerender } = renderHook(
        ({ user }) => usePresence({ projectId: 'project1' }),
        { initialProps: { user: mockUser } }
      );

      rerender({ user: null });

      expect(mockCleanup).toHaveBeenCalled();
    });
  });
});

describe('usePresenceCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn()
    });
  });

  it('should provide quick presence checks', () => {
    const { result } = renderHook(() => usePresenceCheck('project1', 'canvas1'));

    expect(result.current.hasProjectPresence).toBe(false);
    expect(result.current.hasCanvasPresence).toBe(false);
    expect(result.current.isUserOnline).toBe(false);
    expect(result.current.projectUserCount).toBe(0);
    expect(result.current.canvasUserCount).toBe(0);
    expect(result.current.hasActiveUsers).toBe(false);
    expect(result.current.hasTypingUsers).toBe(false);
    expect(result.current.hasEditingUsers).toBe(false);
  });

  it('should get recent activity', () => {
    const { result } = renderHook(() => usePresenceCheck('project1', 'canvas1'));

    const recentActivity = result.current.getRecentActivity();
    expect(recentActivity).toEqual([]);
  });
});

describe('usePresence Integration', () => {
  it('should handle complete presence lifecycle', async () => {
    mockInitializePresence.mockResolvedValue();
    mockUpdateActivity.mockResolvedValue();
    mockUpdateCursorPosition.mockResolvedValue();
    mockSetTyping.mockResolvedValue();
    mockSwitchProject.mockResolvedValue();
    mockSwitchCanvas.mockResolvedValue();

    const { result } = renderHook(() => usePresence({ projectId: 'project1' }));

    // Initialize
    await waitFor(() => {
      expect(result.current.currentUser).toBe(mockUser);
    });

    // Update activity
    await act(async () => {
      await result.current.updateActivity('editing');
    });

    // Update cursor
    await act(async () => {
      await result.current.updateCursorPosition(100, 200);
    });

    // Set typing
    await act(async () => {
      await result.current.setTyping(true, 'chat1');
    });

    // Switch project
    await act(async () => {
      await result.current.switchProject('project2');
    });

    // Switch canvas
    await act(async () => {
      await result.current.switchCanvas('canvas2');
    });

    // Verify all methods were called
    expect(mockInitializePresence).toHaveBeenCalled();
    expect(mockUpdateActivity).toHaveBeenCalledWith('editing', undefined);
    expect(mockUpdateCursorPosition).toHaveBeenCalledWith(100, 200);
    expect(mockSetTyping).toHaveBeenCalledWith(true, 'chat1');
    expect(mockSwitchProject).toHaveBeenCalledWith('project2');
    expect(mockSwitchCanvas).toHaveBeenCalledWith('canvas2');
  });
});
