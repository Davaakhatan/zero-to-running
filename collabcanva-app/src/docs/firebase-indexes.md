# Firebase Indexes Documentation

This document explains the Firebase indexes configured for the multi-project system and their usage patterns.

## Overview

Firebase indexes are essential for efficient querying of Firestore collections. Without proper indexes, complex queries will fail or perform poorly. This document outlines all the indexes we've configured and explains when they're used.

## Index Categories

### 1. Project Queries

#### User's Projects (Recent First)
```javascript
// Query: Get user's projects ordered by most recent
const userProjects = query(
  collection(db, 'projects'),
  where('ownerId', '==', userId),
  orderBy('updatedAt', 'desc')
);
```
**Index:** `projects` - `ownerId` (ASC), `updatedAt` (DESC)

#### User's Active Projects
```javascript
// Query: Get user's non-archived projects
const activeProjects = query(
  collection(db, 'projects'),
  where('ownerId', '==', userId),
  where('isArchived', '==', false),
  orderBy('updatedAt', 'desc')
);
```
**Index:** `projects` - `ownerId` (ASC), `isArchived` (ASC), `updatedAt` (DESC)

#### Project Search
```javascript
// Query: Search projects by name
const searchResults = query(
  collection(db, 'projects'),
  where('ownerId', '==', userId),
  where('name', '>=', searchTerm),
  where('name', '<=', searchTerm + '\uf8ff'),
  orderBy('name', 'asc')
);
```
**Index:** `projects` - `ownerId` (ASC), `name` (ASC), `updatedAt` (DESC)

### 2. Member Queries

#### User's Project Memberships
```javascript
// Query: Get all projects where user is a member
const memberships = query(
  collectionGroup(db, 'members'),
  where('userId', '==', userId),
  orderBy('joinedAt', 'desc')
);
```
**Index:** `members` (COLLECTION_GROUP) - `userId` (ASC), `joinedAt` (DESC)

#### Project Team Members
```javascript
// Query: Get all members of a project
const teamMembers = query(
  collection(db, 'projects', projectId, 'members'),
  orderBy('role', 'asc'),
  orderBy('joinedAt', 'asc')
);
```
**Index:** `members` (COLLECTION_GROUP) - `projectId` (ASC), `role` (ASC), `joinedAt` (ASC)

#### Active Team Members
```javascript
// Query: Get recently active team members
const activeMembers = query(
  collection(db, 'projects', projectId, 'members'),
  orderBy('lastActiveAt', 'desc')
);
```
**Index:** `members` (COLLECTION_GROUP) - `projectId` (ASC), `lastActiveAt` (DESC)

### 3. Canvas Queries

#### Project Canvases (Ordered)
```javascript
// Query: Get canvases in a project ordered by position
const projectCanvases = query(
  collection(db, 'projects', projectId, 'canvases'),
  orderBy('order', 'asc')
);
```
**Index:** `canvases` (COLLECTION_GROUP) - `projectId` (ASC), `order` (ASC)

#### Recent Canvases
```javascript
// Query: Get recently updated canvases
const recentCanvases = query(
  collection(db, 'projects', projectId, 'canvases'),
  orderBy('updatedAt', 'desc')
);
```
**Index:** `canvases` (COLLECTION_GROUP) - `projectId` (ASC), `updatedAt` (DESC)

#### User's Canvases
```javascript
// Query: Get canvases created by a user
const userCanvases = query(
  collectionGroup(db, 'canvases'),
  where('createdBy', '==', userId),
  orderBy('createdAt', 'desc')
);
```
**Index:** `canvases` (COLLECTION_GROUP) - `createdBy` (ASC), `createdAt` (DESC)

### 4. Shape Queries

#### Canvas Shapes (Z-Index Ordered)
```javascript
// Query: Get shapes in a canvas ordered by z-index
const canvasShapes = query(
  collection(db, 'projects', projectId, 'canvases', canvasId, 'shapes'),
  orderBy('zIndex', 'asc')
);
```
**Index:** `shapes` (COLLECTION_GROUP) - `canvasId` (ASC), `zIndex` (ASC)

#### Shapes by Type
```javascript
// Query: Get shapes of a specific type
const rectangles = query(
  collection(db, 'projects', projectId, 'canvases', canvasId, 'shapes'),
  where('type', '==', 'rectangle'),
  orderBy('createdAt', 'desc')
);
```
**Index:** `shapes` (COLLECTION_GROUP) - `canvasId` (ASC), `type` (ASC), `createdAt` (DESC)

#### User's Shapes
```javascript
// Query: Get shapes created by a user
const userShapes = query(
  collectionGroup(db, 'shapes'),
  where('createdBy', '==', userId),
  orderBy('createdAt', 'desc')
);
```
**Index:** `shapes` (COLLECTION_GROUP) - `createdBy` (ASC), `createdAt` (DESC)

#### Locked Shapes
```javascript
// Query: Get currently locked shapes
const lockedShapes = query(
  collection(db, 'projects', projectId, 'canvases', canvasId, 'shapes'),
  where('lockedBy', '!=', null),
  orderBy('lockedBy', 'asc'),
  orderBy('lockedAt', 'desc')
);
```
**Index:** `shapes` (COLLECTION_GROUP) - `canvasId` (ASC), `lockedBy` (ASC), `lockedAt` (DESC)

### 5. Activity Queries

#### Project Activity Feed
```javascript
// Query: Get recent project activities
const projectActivities = query(
  collection(db, 'projects', projectId, 'activities'),
  orderBy('createdAt', 'desc')
);
```
**Index:** `activities` (COLLECTION_GROUP) - `projectId` (ASC), `createdAt` (DESC)

#### User Activity
```javascript
// Query: Get activities by a specific user
const userActivities = query(
  collectionGroup(db, 'activities'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
);
```
**Index:** `activities` (COLLECTION_GROUP) - `userId` (ASC), `createdAt` (DESC)

#### Activity by Action Type
```javascript
// Query: Get specific types of activities
const canvasActivities = query(
  collection(db, 'projects', projectId, 'activities'),
  where('action', '==', 'canvas_created'),
  orderBy('createdAt', 'desc')
);
```
**Index:** `activities` (COLLECTION_GROUP) - `projectId` (ASC), `action` (ASC), `createdAt` (DESC)

### 6. Invitation Queries

#### User's Invitations
```javascript
// Query: Get invitations sent to a user's email
const userInvitations = query(
  collection(db, 'invitations'),
  where('inviteeEmail', '==', userEmail),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc')
);
```
**Index:** `invitations` - `inviteeEmail` (ASC), `status` (ASC), `createdAt` (DESC)

#### Project Invitations
```javascript
// Query: Get all invitations for a project
const projectInvitations = query(
  collection(db, 'invitations'),
  where('projectId', '==', projectId),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc')
);
```
**Index:** `invitations` - `projectId` (ASC), `status` (ASC), `createdAt` (DESC)

#### Expired Invitations
```javascript
// Query: Get expired invitations for cleanup
const expiredInvitations = query(
  collection(db, 'invitations'),
  where('inviteeEmail', '==', userEmail),
  where('expiresAt', '<', new Date())
);
```
**Index:** `invitations` - `inviteeEmail` (ASC), `expiresAt` (ASC)

### 7. Migration Queries

#### Migration Status
```javascript
// Query: Get migration status for all users
const migrationStatus = query(
  collection(db, 'migrationStatus'),
  where('isMigrated', '==', false),
  orderBy('migratedAt', 'desc')
);
```
**Index:** `migrationStatus` - `isMigrated` (ASC), `migratedAt` (DESC)

#### Migration Errors
```javascript
// Query: Get users with migration errors
const migrationErrors = query(
  collection(db, 'migrationStatus'),
  where('isMigrated', '==', false),
  where('error', '!=', null),
  orderBy('migratedAt', 'desc')
);
```
**Index:** `migrationStatus` - `isMigrated` (ASC), `error` (ASC), `migratedAt` (DESC)

## Field Overrides

### Text Search Indexes

#### Project Name Search
```javascript
// Query: Full-text search on project names
const searchResults = query(
  collection(db, 'projects'),
  where('name', 'array-contains-any', searchTerms)
);
```
**Field Override:** `projects.name` - Array contains index

#### Canvas Name Search
```javascript
// Query: Full-text search on canvas names
const searchResults = query(
  collectionGroup(db, 'canvases'),
  where('name', 'array-contains-any', searchTerms)
);
```
**Field Override:** `canvases.name` - Array contains index

## Performance Considerations

### Index Usage Best Practices

1. **Compound Indexes**: Use compound indexes for multi-field queries
2. **Order By**: Always include `orderBy` fields in your indexes
3. **Collection Group**: Use collection group queries sparingly as they're more expensive
4. **Limit Results**: Always use `limit()` for large result sets
5. **Pagination**: Use `startAfter()` for efficient pagination

### Query Optimization Tips

1. **Filter First**: Apply `where` clauses before `orderBy`
2. **Index Hints**: Use `hint()` to force specific index usage
3. **Batch Reads**: Use `getDocs()` for multiple documents
4. **Real-time Updates**: Use `onSnapshot()` for live data
5. **Offline Support**: Design queries to work offline

## Deployment

### Deploying Indexes

```bash
# Deploy indexes to Firebase
firebase deploy --only firestore:indexes

# Deploy specific environment
firebase use production
firebase deploy --only firestore:indexes
```

### Index Monitoring

1. **Firebase Console**: Monitor index usage in the Firebase Console
2. **Performance Monitoring**: Track query performance metrics
3. **Index Build Status**: Check index build progress
4. **Error Logs**: Monitor for index-related errors

## Maintenance

### Regular Tasks

1. **Index Review**: Review unused indexes monthly
2. **Performance Analysis**: Analyze slow queries
3. **Index Optimization**: Optimize based on usage patterns
4. **Cleanup**: Remove unused indexes to save costs

### Troubleshooting

1. **Missing Index Error**: Add the required index to `firestore.indexes.json`
2. **Slow Queries**: Check if proper indexes exist
3. **Index Build Failures**: Check for data validation issues
4. **Cost Optimization**: Monitor index usage and costs

## Cost Considerations

### Index Costs

- **Storage**: Each index consumes storage space
- **Build Time**: Index building consumes compute resources
- **Maintenance**: Index updates consume resources
- **Query Performance**: Proper indexes reduce query costs

### Optimization Strategies

1. **Selective Indexing**: Only create indexes for queries you actually use
2. **Composite Indexes**: Combine multiple fields into single indexes
3. **Array Indexes**: Use array indexes for text search
4. **Collection Group**: Minimize collection group queries

## Security Considerations

### Index Security

1. **Access Control**: Indexes respect Firestore security rules
2. **Data Privacy**: Sensitive data in indexes is still protected
3. **Query Validation**: Validate queries before execution
4. **Rate Limiting**: Implement rate limiting for expensive queries

## Future Enhancements

### Planned Improvements

1. **Full-Text Search**: Implement Algolia or Elasticsearch integration
2. **Geospatial Queries**: Add location-based project queries
3. **Analytics Indexes**: Create indexes for usage analytics
4. **Performance Monitoring**: Enhanced query performance tracking

### Monitoring and Alerting

1. **Query Performance**: Set up alerts for slow queries
2. **Index Usage**: Monitor index utilization
3. **Error Rates**: Track index-related errors
4. **Cost Monitoring**: Monitor index-related costs
