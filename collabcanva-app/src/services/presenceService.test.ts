// Unit tests for PresenceService
// Tests for real-time presence and activity tracking

import { 
  PresenceService, 
  presenceService,
  getActivityDisplayName,
  getActivityColor,
  getActivityIcon,
  formatLastSeen,
  isUserRecentlyActive
} from './presenceService';
import { PresenceData, ActivityType } from '../types';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  push: jest.fn(),
  serverTimestamp: jest.fn(() => ({ toMillis: () => Date.now() })),
  onDisconnect: jest.fn(() => ({
    remove: jest.fn()
  })),
  getDatabase: jest.fn()
}));

// Mock Firebase database
jest.mock('./firebase', () => ({
  db: {}
}));

describe('PresenceService', () => {
  let presenceService: PresenceService;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    presenceService = PresenceService.getInstance();
    
    mockUser = {
      uid: 'user1',
      email: 'user1@example.com',
      displayName: 'User One',
      photoURL: 'https://example.com/avatar.jpg'
    };
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PresenceService.getInstance();
      const instance2 = PresenceService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('User Metadata', () => {
    it('should get browser name correctly', () => {
      // Mock navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });

      const metadata = presenceService['getUserMetadata']();
      
      expect(metadata.browser).toBe('Chrome');
      expect(metadata.platform).toBe('Win32');
      expect(metadata.userAgent).toContain('Chrome');
    });

    it('should get browser version correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });

      const version = presenceService['getBrowserVersion']();
      
      expect(version).toBe('91.0');
    });

    it('should handle unknown browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Unknown Browser',
        configurable: true
      });

      const browser = presenceService['getBrowserName']();
      const version = presenceService['getBrowserVersion']();
      
      expect(browser).toBe('Unknown');
      expect(version).toBe('Unknown');
    });
  });

  describe('Connection ID Generation', () => {
    it('should generate unique connection IDs', () => {
      const id1 = presenceService['generateConnectionId']();
      const id2 = presenceService['generateConnectionId']();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+_[a-z0-9]+$/);
    });
  });

  describe('Activity Tracking', () => {
    it('should track user activity', () => {
      const initialTime = Date.now();
      presenceService.trackActivity();
      
      // Activity should be tracked
      expect(presenceService['lastActivity']).toBeGreaterThanOrEqual(initialTime);
    });

    it('should get current activity based on last activity', () => {
      // Recent activity
      presenceService['lastActivity'] = Date.now() - 60000; // 1 minute ago
      expect(presenceService['getCurrentActivity']()).toBe('viewing');
      
      // Old activity
      presenceService['lastActivity'] = Date.now() - 400000; // 6+ minutes ago
      expect(presenceService['getCurrentActivity']()).toBe('away');
    });
  });

  describe('Presence Management', () => {
    it('should initialize presence for user', async () => {
      const { set, onDisconnect } = require('firebase/database');
      
      set.mockResolvedValue({});
      onDisconnect.mockReturnValue({
        remove: jest.fn()
      });

      await presenceService.initializePresence(mockUser);
      
      expect(presenceService.getCurrentUser()).toBe(mockUser);
      expect(presenceService.isUserOnline()).toBe(true);
    });

    it('should switch project context', async () => {
      const { set, remove } = require('firebase/database');
      
      set.mockResolvedValue({});
      remove.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      await presenceService.switchProject('project1');
      
      expect(presenceService.getCurrentProject()).toBe('project1');
    });

    it('should switch canvas context', async () => {
      const { set, remove } = require('firebase/database');
      
      set.mockResolvedValue({});
      remove.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      await presenceService.switchProject('project1');
      await presenceService.switchCanvas('canvas1');
      
      expect(presenceService.getCurrentCanvas()).toBe('canvas1');
    });

    it('should update activity', async () => {
      const { set } = require('firebase/database');
      
      set.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      await presenceService.updateActivity('editing', { shapeId: 'shape1' });
      
      // Activity should be updated (debounced)
      expect(set).toHaveBeenCalled();
    });

    it('should update cursor position', async () => {
      const { set } = require('firebase/database');
      
      set.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      await presenceService.switchProject('project1');
      await presenceService.switchCanvas('canvas1');
      await presenceService.updateCursorPosition(100, 200);
      
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          cursorPosition: { x: 100, y: 200 },
          currentActivity: 'editing'
        })
      );
    });

    it('should update selected shapes', async () => {
      const { set } = require('firebase/database');
      
      set.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      await presenceService.switchProject('project1');
      await presenceService.switchCanvas('canvas1');
      await presenceService.updateSelectedShapes(['shape1', 'shape2']);
      
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          selectedShapes: ['shape1', 'shape2'],
          currentActivity: 'editing'
        })
      );
    });

    it('should set typing status', async () => {
      const { set } = require('firebase/database');
      
      set.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      await presenceService.setTyping(true, 'chat1');
      
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isTyping: true,
          typingIn: 'chat1',
          currentActivity: 'chatting'
        })
      );
    });

    it('should auto-clear typing status', async () => {
      const { set } = require('firebase/database');
      
      set.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      await presenceService.setTyping(true);
      
      // Wait for auto-clear timeout
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isTyping: false,
          currentActivity: 'viewing'
        })
      );
    });
  });

  describe('Presence Listeners', () => {
    it('should listen to project presence', () => {
      const { onValue, off } = require('firebase/database');
      
      const mockCallback = jest.fn();
      const mockSnapshot = {
        val: () => ({
          user1: {
            userId: 'user1',
            displayName: 'User One',
            isOnline: true,
            currentActivity: 'editing'
          }
        })
      };

      onValue.mockImplementation((ref, callback) => {
        callback(mockSnapshot);
        return jest.fn(); // Return unsubscribe function
      });

      const cleanup = presenceService.listenToProjectPresence('project1', mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'user1',
          displayName: 'User One',
          isOnline: true,
          currentActivity: 'editing'
        })
      ]);
      
      // Test cleanup
      cleanup();
      expect(off).toHaveBeenCalled();
    });

    it('should listen to canvas presence', () => {
      const { onValue, off } = require('firebase/database');
      
      const mockCallback = jest.fn();
      const mockSnapshot = {
        val: () => ({
          user1: {
            userId: 'user1',
            displayName: 'User One',
            isOnline: true,
            currentActivity: 'editing',
            cursorPosition: { x: 100, y: 200 }
          }
        })
      };

      onValue.mockImplementation((ref, callback) => {
        callback(mockSnapshot);
        return jest.fn();
      });

      const cleanup = presenceService.listenToCanvasPresence('project1', 'canvas1', mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'user1',
          displayName: 'User One',
          isOnline: true,
          currentActivity: 'editing',
          cursorPosition: { x: 100, y: 200 }
        })
      ]);
      
      cleanup();
      expect(off).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', async () => {
      const { set } = require('firebase/database');
      
      set.mockResolvedValue({});

      await presenceService.initializePresence(mockUser);
      presenceService.cleanup();
      
      expect(presenceService.getCurrentUser()).toBeNull();
      expect(presenceService.isUserOnline()).toBe(false);
    });
  });
});

describe('Presence Utility Functions', () => {
  describe('getActivityDisplayName', () => {
    it('should return correct display names for all activities', () => {
      expect(getActivityDisplayName('idle')).toBe('Idle');
      expect(getActivityDisplayName('viewing')).toBe('Viewing');
      expect(getActivityDisplayName('editing')).toBe('Editing');
      expect(getActivityDisplayName('collaborating')).toBe('Collaborating');
      expect(getActivityDisplayName('chatting')).toBe('Chatting');
      expect(getActivityDisplayName('presenting')).toBe('Presenting');
      expect(getActivityDisplayName('away')).toBe('Away');
    });
  });

  describe('getActivityColor', () => {
    it('should return correct colors for all activities', () => {
      expect(getActivityColor('idle')).toBe('gray');
      expect(getActivityColor('viewing')).toBe('blue');
      expect(getActivityColor('editing')).toBe('green');
      expect(getActivityColor('collaborating')).toBe('purple');
      expect(getActivityColor('chatting')).toBe('orange');
      expect(getActivityColor('presenting')).toBe('red');
      expect(getActivityColor('away')).toBe('gray');
    });
  });

  describe('getActivityIcon', () => {
    it('should return correct icons for all activities', () => {
      expect(getActivityIcon('idle')).toBe('⏸️');
      expect(getActivityIcon('viewing')).toBe('👁️');
      expect(getActivityIcon('editing')).toBe('✏️');
      expect(getActivityIcon('collaborating')).toBe('🤝');
      expect(getActivityIcon('chatting')).toBe('💬');
      expect(getActivityIcon('presenting')).toBe('📺');
      expect(getActivityIcon('away')).toBe('😴');
    });
  });

  describe('formatLastSeen', () => {
    it('should format recent timestamps correctly', () => {
      const now = Date.now();
      
      expect(formatLastSeen(now - 30000)).toBe('Just now');
      expect(formatLastSeen(now - 120000)).toBe('2 minutes ago');
      expect(formatLastSeen(now - 3600000)).toBe('1 hour ago');
      expect(formatLastSeen(now - 7200000)).toBe('2 hours ago');
      expect(formatLastSeen(now - 86400000)).toBe('1 day ago');
      expect(formatLastSeen(now - 172800000)).toBe('2 days ago');
    });
  });

  describe('isUserRecentlyActive', () => {
    it('should correctly identify recently active users', () => {
      const now = Date.now();
      
      expect(isUserRecentlyActive(now - 60000)).toBe(true); // 1 minute ago
      expect(isUserRecentlyActive(now - 300000)).toBe(true); // 5 minutes ago
      expect(isUserRecentlyActive(now - 400000)).toBe(false); // 6+ minutes ago
    });

    it('should use custom threshold', () => {
      const now = Date.now();
      
      expect(isUserRecentlyActive(now - 60000, 30000)).toBe(false); // 1 minute ago, 30s threshold
      expect(isUserRecentlyActive(now - 15000, 30000)).toBe(true); // 15 seconds ago, 30s threshold
    });
  });
});

describe('PresenceService Integration', () => {
  let presenceService: PresenceService;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    presenceService = PresenceService.getInstance();
    
    mockUser = {
      uid: 'user1',
      email: 'user1@example.com',
      displayName: 'User One',
      photoURL: 'https://example.com/avatar.jpg'
    };
  });

  it('should handle complete presence lifecycle', async () => {
    const { set, onValue, off, onDisconnect } = require('firebase/database');
    
    set.mockResolvedValue({});
    onDisconnect.mockReturnValue({
      remove: jest.fn()
    });

    // Initialize presence
    await presenceService.initializePresence(mockUser);
    expect(presenceService.getCurrentUser()).toBe(mockUser);
    expect(presenceService.isUserOnline()).toBe(true);

    // Switch to project
    await presenceService.switchProject('project1');
    expect(presenceService.getCurrentProject()).toBe('project1');

    // Switch to canvas
    await presenceService.switchCanvas('canvas1');
    expect(presenceService.getCurrentCanvas()).toBe('canvas1');

    // Update activity
    await presenceService.updateActivity('editing');
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        currentActivity: 'editing'
      })
    );

    // Update cursor position
    await presenceService.updateCursorPosition(100, 200);
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        cursorPosition: { x: 100, y: 200 }
      })
    );

    // Set typing status
    await presenceService.setTyping(true, 'chat1');
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        isTyping: true,
        typingIn: 'chat1'
      })
    );

    // Cleanup
    presenceService.cleanup();
    expect(presenceService.getCurrentUser()).toBeNull();
    expect(presenceService.isUserOnline()).toBe(false);
  });

  it('should handle connection state changes', async () => {
    const { onValue } = require('firebase/database');
    
    let connectionCallback: (snapshot: any) => void;
    
    onValue.mockImplementation((ref, callback) => {
      if (ref.toString().includes('.info/connected')) {
        connectionCallback = callback;
      }
      return jest.fn();
    });

    await presenceService.initializePresence(mockUser);
    
    // Simulate connection
    connectionCallback({ val: () => true });
    expect(presenceService.isUserOnline()).toBe(true);
    
    // Simulate disconnection
    connectionCallback({ val: () => false });
    expect(presenceService.isUserOnline()).toBe(false);
  });

  it('should handle error scenarios gracefully', async () => {
    const { set } = require('firebase/database');
    
    set.mockRejectedValue(new Error('Firebase error'));

    // Should not throw error
    await expect(presenceService.initializePresence(mockUser)).resolves.not.toThrow();
    await expect(presenceService.updateActivity('editing')).resolves.not.toThrow();
    await expect(presenceService.setTyping(true)).resolves.not.toThrow();
  });
});
