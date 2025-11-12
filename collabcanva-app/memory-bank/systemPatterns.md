# System Patterns & Architecture

## Application Architecture

### High-Level Structure
```
CollabCanvas
├── Frontend (React + TypeScript)
│   ├── UI Layer (Components)
│   ├── State Management (React Context)
│   ├── Canvas Rendering (Konva.js)
│   └── Real-time Sync (Firebase SDK)
├── Backend (Firebase)
│   ├── Authentication (Firebase Auth)
│   ├── Database (Firestore)
│   ├── Real-time (Realtime Database)
│   └── Hosting
└── AI Layer (OpenAI API)
    └── Command Processing (GPT-4o-mini)
```

## Key Technical Decisions

### 1. Shape Coordinate System
**Challenge**: Different shapes use different origin points.
- **Rectangle/Text**: Top-left corner (x, y)
- **Circle/Ellipse**: Center point requires offset (`x + width/2, y + height/2`)
- **Triangle**: Center-based with custom points array

**Solution**: 
- Store ALL shapes with top-left corner coordinates in database
- Convert to center-based rendering for Circle/Ellipse/Triangle
- Convert back to top-left on drag/transform end

```typescript
// On drag end for center-based shapes:
newX = dragX - shape.width / 2;
newY = dragY - shape.height / 2;
```

### 2. Real-Time Synchronization
**Pattern**: Optimistic updates with server reconciliation

**Firestore (Objects)**:
- Stores persistent shape data
- Updates on: create, modify, delete
- Debounced writes (reduce database calls)

**Realtime Database (Cursors)**:
- Ephemeral cursor positions
- Throttled updates (50ms intervals)
- Auto-cleanup on disconnect

**Shape Locking**:
```typescript
interface Shape {
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: number | null; // Timestamp
}

// Lock on select (10s timeout)
// Unlock on deselect or stale check
```

### 3. Component Architecture

**Context Pattern**:
```
AuthContext
├── User state
├── Login/Logout methods
└── Protected route wrapper

CanvasContext
├── Shapes array
├── Selection state
├── Scale/Position
├── CRUD operations
├── History (undo/redo)
└── Real-time sync
```

**Component Hierarchy**:
```
App
├── Navbar (always visible)
└── Routes
    ├── Login/Signup
    └── Canvas
        ├── Konva Stage
        │   ├── Layer
        │   │   ├── Shape[] (sorted by z-index)
        │   │   └── Cursors[]
        │   └── Transformer
        ├── CanvasControls (movable toolbar)
        ├── PresenceList
        ├── TextFormatting (conditional)
        ├── HelpOverlay (conditional)
        └── AICommandPanel (conditional)
```

### 4. Event Handling Pattern

**Click Detection** (avoiding drag conflicts):
```typescript
// Record mouse down position
onPointerDown: (e) => {
  mouseDownPosRef.current = { x: e.x, y: e.y };
}

// Check distance on mouse up
onPointerUp: (e) => {
  const distance = calculateDistance(mouseDownPosRef, currentPos);
  if (distance < 5) {
    // It's a click!
    handleSelect();
  }
}
```

**Keyboard Shortcuts** (with input protection):
```typescript
// Check if user is typing
const isTyping = activeElement?.tagName === 'INPUT' || 
                 activeElement?.tagName === 'TEXTAREA';

// Only trigger shortcuts when NOT typing
if (!isTyping && e.key === 'Delete') {
  deleteShape();
}
```

### 5. State Management Pattern

**Undo/Redo System**:
```typescript
interface HistoryState {
  past: Shape[][];
  present: Shape[];
  future: Shape[][];
}

// On shape change:
pushState(newShapes) {
  past.push(present);
  present = newShapes;
  future = []; // Clear redo stack
}

// Undo: move present to future, pop from past
// Redo: move present to past, pop from future
```

## Design Patterns

### 1. Compound Component Pattern
**TextFormatting Toolbar**:
- Self-contained with all controls
- Reads shape from context
- Updates via context methods
- Conditional rendering based on selection

### 2. Portal Pattern
**Popovers & Overlays**:
```typescript
{showShapeMenu && createPortal(
  <ShapeMenu ... />,
  document.body
)}
```
- Prevents clipping issues
- Proper z-index control
- Accessibility friendly

### 3. Custom Hooks Pattern
```typescript
useCursors()    // Manages real-time cursor tracking
usePresence()   // Manages online users list
useHistory()    // Manages undo/redo state
useCanvas()     // Main canvas state & operations
```

### 4. Throttle/Debounce Pattern
```typescript
// Cursor updates: Throttled (max frequency)
const throttledCursorUpdate = throttle(updateCursor, 50ms);

// Shape updates: Debounced (wait for pause)
const debouncedShapeUpdate = debounce(saveShape, 300ms);
```

## Performance Optimizations

### 1. Render Optimization
- **Konva Layers**: Separate layer for shapes vs UI
- **Batch Updates**: `batchDraw()` instead of `draw()` per change
- **Transform Caching**: Reset scale, apply to width/height
- **Conditional Rendering**: Only render visible overlays

### 2. Database Optimization
- **Indexed Queries**: Firestore indexed by `createdAt`
- **Selective Syncing**: Only sync changed properties
- **Connection Pooling**: Reuse Firebase connections
- **Graceful Degradation**: Works if RTDB unavailable

### 3. Memory Management
- **Cursor Cleanup**: Auto-remove on disconnect
- **Shape Cleanup**: Delete from both Firestore & RTDB
- **Event Listener Cleanup**: `useEffect` return functions
- **Ref Cleanup**: Clear refs on unmount

## Error Handling

### Graceful Failures
```typescript
// RTDB unavailable? Fall back to Firestore only
if (!isRtdbAvailable) {
  console.warn('Real-time features unavailable');
  // Continue with local state
}

// Firebase connection lost?
onDisconnect(() => {
  // Auto-remove cursor
  // Unlock shapes
});
```

### User Feedback
- Loading states during auth/sync
- Error toasts for failed operations
- Visual indicators for locked shapes
- Empty states when no shapes exist

## Security Patterns

### Authentication
```typescript
// Protected routes
<PrivateRoute>
  <Canvas />
</PrivateRoute>

// User-specific data
shapes.filter(s => s.createdBy === currentUser.uid)
```

### Database Rules
```json
{
  "rules": {
    "shapes": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=***
VITE_OPENAI_API_KEY=***
```
- Never committed to repo
- Loaded via `import.meta.env`
- Validated on startup

## Testing Patterns

### Manual Testing Protocol
1. **Solo User**: All CRUD operations
2. **Multi-User**: Lock conflicts, cursor tracking
3. **Performance**: 500+ shapes stress test
4. **AI Agent**: Command parsing, execution
5. **Persistence**: Refresh, disconnect/reconnect

### Debugging Tools
- **FPS Monitor**: Real-time performance display
- **Console Logging**: Structured logs for sync events
- **React DevTools**: Component state inspection
- **Firebase Console**: Database state verification

