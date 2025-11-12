// Firebase query service for optimized database queries
// Provides pre-configured queries that use the proper indexes

import {
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  Query,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Project, 
  ProjectMember, 
  ProjectCanvas, 
  ProjectActivity,
  ProjectInvitation,
  Shape
} from '../types';

// Query result types
export interface QueryResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot;
}

// Project queries
class ProjectQueries {
  /**
   * Get user's projects ordered by most recent
   */
  static getUserProjects(
    userId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collection(db, 'projects'), ...constraints);
  }

  /**
   * Get user's active (non-archived) projects
   */
  static getUserActiveProjects(
    userId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('ownerId', '==', userId),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collection(db, 'projects'), ...constraints);
  }

  /**
   * Search projects by name
   */
  static searchProjects(
    userId: string, 
    searchTerm: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('ownerId', '==', userId),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name', 'asc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collection(db, 'projects'), ...constraints);
  }

  /**
   * Ultra-simple fallback query for new users (no indexes required)
   * Just gets all projects for a user without any ordering or complex filters
   */
  static getUserProjectsSimple(
    userId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20 } = options;
    const constraints: QueryConstraint[] = [
      where('ownerId', '==', userId),
      limit(pageSize)
    ];

    return query(collection(db, 'projects'), ...constraints);
  }

  /**
   * Get ALL projects for collaboration (TEMPORARY - for development/testing)
   * This allows all users to see all projects regardless of ownership
   */
  static getAllProjectsForCollaboration(
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 50 } = options;
    const constraints: QueryConstraint[] = [
      limit(pageSize)
    ];

    return query(collection(db, 'projects'), ...constraints);
  }

  /**
   * Absolute simplest query - just get all projects (for testing/initial setup)
   * This requires NO indexes at all
   */
  static getAllProjectsSimple(
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20 } = options;
    const constraints: QueryConstraint[] = [
      limit(pageSize)
    ];

    return query(collection(db, 'projects'), ...constraints);
  }

  /**
   * Get a single project by ID
   */
  static getProject(projectId: string): Promise<DocumentSnapshot> {
    return getDoc(doc(db, 'projects', projectId));
  }
}

// Member queries
class MemberQueries {
  /**
   * Get all projects where user is a member
   */
  static getUserMemberships(
    userId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('joinedAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collectionGroup(db, 'members'), ...constraints);
  }

  /**
   * Get all members of a project
   */
  static getProjectMembers(
    projectId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 50, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      orderBy('role', 'asc'),
      orderBy('joinedAt', 'asc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'members'), 
      ...constraints
    );
  }

  /**
   * Get recently active team members
   */
  static getActiveMembers(
    projectId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      orderBy('lastActiveAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'members'), 
      ...constraints
    );
  }

  /**
   * Get a specific member
   */
  static getMember(projectId: string, userId: string): Promise<DocumentSnapshot> {
    return getDoc(doc(db, 'projects', projectId, 'members', userId));
  }
}

// Canvas queries
class CanvasQueries {
  /**
   * Get canvases in a project ordered by position
   */
  static getProjectCanvases(
    projectId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 50, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      orderBy('order', 'asc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'canvases'), 
      ...constraints
    );
  }

  /**
   * Get recently updated canvases
   */
  static getRecentCanvases(
    projectId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      orderBy('updatedAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'canvases'), 
      ...constraints
    );
  }

  /**
   * Get canvases created by a user
   */
  static getUserCanvases(
    userId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collectionGroup(db, 'canvases'), ...constraints);
  }

  /**
   * Get a single canvas
   */
  static getCanvas(projectId: string, canvasId: string): Promise<DocumentSnapshot> {
    return getDoc(doc(db, 'projects', projectId, 'canvases', canvasId));
  }
}

// Shape queries
class ShapeQueries {
  /**
   * Get shapes in a canvas ordered by z-index
   */
  static getCanvasShapes(
    projectId: string, 
    canvasId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 1000, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      orderBy('zIndex', 'asc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'canvases', canvasId, 'shapes'), 
      ...constraints
    );
  }

  /**
   * Get shapes of a specific type
   */
  static getShapesByType(
    projectId: string, 
    canvasId: string, 
    shapeType: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 100, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('type', '==', shapeType),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'canvases', canvasId, 'shapes'), 
      ...constraints
    );
  }

  /**
   * Get shapes created by a user
   */
  static getUserShapes(
    userId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 100, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collectionGroup(db, 'shapes'), ...constraints);
  }

  /**
   * Get currently locked shapes
   */
  static getLockedShapes(
    projectId: string, 
    canvasId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 50, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('lockedBy', '!=', null),
      orderBy('lockedBy', 'asc'),
      orderBy('lockedAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'canvases', canvasId, 'shapes'), 
      ...constraints
    );
  }

  /**
   * Get a single shape
   */
  static getShape(
    projectId: string, 
    canvasId: string, 
    shapeId: string
  ): Promise<DocumentSnapshot> {
    return getDoc(doc(db, 'projects', projectId, 'canvases', canvasId, 'shapes', shapeId));
  }
}

// Activity queries
class ActivityQueries {
  /**
   * Get recent project activities
   */
  static getProjectActivities(
    projectId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 50, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'activities'), 
      ...constraints
    );
  }

  /**
   * Get activities by a specific user
   */
  static getUserActivities(
    userId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 50, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collectionGroup(db, 'activities'), ...constraints);
  }

  /**
   * Get activities by action type
   */
  static getActivitiesByAction(
    projectId: string, 
    action: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 50, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('action', '==', action),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(
      collection(db, 'projects', projectId, 'activities'), 
      ...constraints
    );
  }
}

// Invitation queries
class InvitationQueries {
  /**
   * Get invitations sent to a user's email
   */
  static getUserInvitations(
    userEmail: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('inviteeEmail', '==', userEmail),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collection(db, 'invitations'), ...constraints);
  }

  /**
   * Get all invitations for a project
   */
  static getProjectInvitations(
    projectId: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 20, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('projectId', '==', projectId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collection(db, 'invitations'), ...constraints);
  }

  /**
   * Get expired invitations for cleanup
   */
  static getExpiredInvitations(
    userEmail: string, 
    options: PaginationOptions = {}
  ): Query {
    const { pageSize = 100, lastDoc } = options;
    const constraints: QueryConstraint[] = [
      where('inviteeEmail', '==', userEmail),
      where('expiresAt', '<', new Date()),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    return query(collection(db, 'invitations'), ...constraints);
  }

  /**
   * Get a single invitation
   */
  static getInvitation(invitationId: string): Promise<DocumentSnapshot> {
    return getDoc(doc(db, 'invitations', invitationId));
  }
}

// Utility functions for executing queries
class QueryExecutor {
  /**
   * Execute a query and return paginated results
   */
  static async executeQuery<T>(
    query: Query, 
    options: PaginationOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      const snapshot = await getDocs(query);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === (options.pageSize || 20);

      return {
        data,
        lastDoc,
        hasMore
      };
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute a query and return all results (use with caution)
   */
  static async executeQueryAll<T>(query: Query): Promise<T[]> {
    try {
      const snapshot = await getDocs(query);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute a single document query
   */
  static async executeSingleQuery<T>(docPromise: Promise<DocumentSnapshot>): Promise<T | null> {
    try {
      const doc = await docPromise;
      if (doc.exists()) {
        return { id: doc.id, ...doc.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Single query execution failed:', error);
      throw error;
    }
  }
}

// Export all query classes and utilities
export {
  ProjectQueries,
  MemberQueries,
  CanvasQueries,
  ShapeQueries,
  ActivityQueries,
  InvitationQueries,
  QueryExecutor
};
