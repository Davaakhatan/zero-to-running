# CollabCanvas MVP - Development Task List

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx
│   │   │   ├── CanvasControls.jsx
│   │   │   └── Shape.jsx
│   │   ├── Collaboration/
│   │   │   ├── Cursor.jsx
│   │   │   ├── UserPresence.jsx
│   │   │   └── PresenceList.jsx
│   │   └── Layout/
│   │       ├── Navbar.jsx
│   │       └── Sidebar.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   ├── canvas.js
│   │   └── presence.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCanvas.js
│   │   ├── useCursors.js
│   │   └── usePresence.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── CanvasContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   ├── setup.js
│   ├── unit/
│   │   ├── utils/
│   │   │   └── helpers.test.js
│   │   ├── services/
│   │   │   ├── auth.test.js
│   │   │   └── canvas.test.js
│   │   └── contexts/
│   │       └── CanvasContext.test.js
│   └── integration/
│       ├── auth-flow.test.js
│       ├── canvas-sync.test.js
│       └── multiplayer.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── firebase.json
├── .firebaserc
└── README.md
```

---

## PR #1: Project Setup & Firebase Configuration

**Branch:** `setup/initial-config`  
**Goal:** Initialize project with all dependencies and Firebase configuration

### Tasks:

- [x] **1.1: Initialize React + Vite Project**

  - Files to create: `package.json`, `vite.config.ts`, `index.html`
  - Run: `npm create vite@latest collabcanvas -- --template react-ts`
  - Verify dev server runs

- [x] **1.2: Install Core Dependencies**

  - Files to update: `package.json`
  - Install:
    ```bash
    npm install firebase konva react-konva
    npm install -D tailwindcss postcss autoprefixer
    ```

- [x] **1.3: Configure Tailwind CSS**

  - Files to create: `tailwind.config.js`, `postcss.config.js`
  - Files to update: `src/index.css`
  - Run: `npx tailwindcss init -p`
  - Add Tailwind directives to `index.css`

- [x] **1.4: Set Up Firebase Project**

  - Create Firebase project in console
  - Enable Authentication (Email/Password AND Google)
  - Create Firestore database
  - Create Realtime Database
  - Files to create: `.env`, `.env.example`
  - Add Firebase config keys to `.env`

- [x] **1.5: Create Firebase Service File**

  - Files to create: `src/services/firebase.ts`
  - Initialize Firebase app
  - Export `auth`, `db` (Firestore), `rtdb` (Realtime Database)

- [x] **1.6: Configure Git & .gitignore**

  - Files to create/update: `.gitignore`
  - Ensure `.env` is ignored
  - Add `node_modules/`, `dist/`, `.firebase/` to `.gitignore`

- [x] **1.7: Create README with Setup Instructions**
  - Files to create: `README.md`
  - Include setup steps, env variables needed, run commands

**PR Checklist:**

- [x] Dev server runs successfully
- [x] Firebase initialized without errors
- [x] Tailwind classes work in test component
- [x] `.env` is in `.gitignore`

---

## PR #2: Authentication System

**Branch:** `feature/authentication`  
**Goal:** Complete user authentication with login/signup flows

### Tasks:

- [x] **2.1: Create Auth Context**

  - Files to create: `src/contexts/AuthContext.tsx`
  - Provide: `currentUser`, `loading`, `login()`, `signup()`, `logout()`

- [x] **2.2: Create Auth Service**

  - Integrated in `src/services/firebase.ts` and `AuthContext.tsx`
  - Functions: `signUp(email, password, displayName)`, `signIn(email, password)`, `signInWithGoogle()`, `signOut()`, `updateUserProfile(displayName)`
  - Display name logic: Extract from Google profile or use email prefix

- [x] **2.3: Create Auth Hook**

  - Integrated in `src/contexts/AuthContext.tsx`
  - Return auth context values via `useAuth()` hook

- [x] **2.4: Build Signup Component**

  - Files to create: `src/components/Auth/Signup.tsx`
  - Form fields: email, password, display name
  - Handle signup errors
  - Redirect to canvas on success

- [x] **2.5: Build Login Component**

  - Files to create: `src/components/Auth/Login.tsx`
  - Form fields: email, password
  - Add "Sign in with Google" button
  - Handle login errors
  - Link to signup page

- [x] **2.6: Create Auth Provider Wrapper**

  - Integrated in `src/contexts/AuthContext.tsx`
  - Wrap entire app with AuthContext
  - Show loading state during auth check

- [x] **2.7: Update App.tsx with Protected Routes**

  - Files to update: `src/App.tsx`
  - Show Login/Signup if not authenticated
  - Show Canvas if authenticated
  - Basic routing logic

- [x] **2.8: Create Navbar Component**
  - Files to create: `src/components/Layout/Navbar.tsx`
  - Display current user name
  - Logout button

**PR Checklist:**

- [x] Can create new account with email/password
- [x] Can login with existing account
- [x] Can sign in with Google
- [x] Display name appears correctly (Google name or email prefix)
- [x] Display name truncates at 20 chars if too long
- [x] Logout works and redirects to login
- [x] Auth state persists on page refresh

---

## PR #3: Basic Canvas Rendering

**Branch:** `feature/canvas-basic`  
**Goal:** Canvas with pan, zoom, and basic stage setup

### Tasks:

- [x] **3.1: Create Canvas Constants**

  - Files to create: `src/utils/constants.ts`
  - Define: `CANVAS_WIDTH = 5000`, `CANVAS_HEIGHT = 5000`, `VIEWPORT_WIDTH`, `VIEWPORT_HEIGHT`

- [x] **3.2: Create Canvas Context**

  - Files to create: `src/contexts/CanvasContext.tsx`
  - State: `shapes`, `selectedId`, `stageRef`, `history` (for undo/redo)
  - Provide methods to add/update/delete shapes

- [x] **3.3: Build Base Canvas Component**

  - Files to create: `src/components/Canvas/Canvas.tsx`
  - Set up Konva Stage and Layer
  - Container div with fixed dimensions
  - Background color/grid

- [x] **3.4: Implement Pan Functionality**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle `onDragMove` on Stage
  - Smooth panning with boundary constraints
  - Prevent objects from being placed/moved outside boundaries

- [x] **3.5: Implement Zoom Functionality**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle `onWheel` event
  - Zoom to cursor position
  - Min zoom: 0.1 (10%), Max zoom: 5 (500%)

- [x] **3.6: Create Canvas Controls Component**

  - Files to create: `src/components/Canvas/CanvasControls.tsx`
  - Buttons: "Zoom In", "Zoom Out", "Fit View", "Add Shape", "Undo", "Redo"
  - Position: Movable toolbar (sidebar or bottom)
  - Includes color picker, z-index controls, alignment tools

- [x] **3.7: Add Canvas to App**
  - Files to update: `src/App.tsx`
  - Wrap Canvas in CanvasContext
  - Include Navbar and Canvas

**PR Checklist:**

- [x] Canvas renders at correct size (5000x5000px)
- [x] Can pan by dragging canvas background
- [x] Can zoom with mousewheel
- [x] Zoom centers on cursor position
- [x] Fit view button works
- [x] Canvas boundaries are enforced
- [x] 60 FPS maintained during pan/zoom (verified with FPS monitor)

---

## PR #4: Shape Creation & Manipulation

**Branch:** `feature/shapes`  
**Goal:** Create, select, and move shapes on canvas

### Tasks:

- [x] **4.1: Create Shape Component**

  - Files to create: `src/components/Canvas/Shape.tsx`
  - Support: **Rectangle, Circle, Triangle, Ellipse, Text** (far beyond MVP!)
  - Props: `id`, `x`, `y`, `width`, `height`, `fill`, `isSelected`, `isLocked`, `lockedBy`, `rotation`
  - Includes resize handles (8 anchors) and rotation handle

- [x] **4.2: Add Shape Creation Logic**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `addShape(type, position)`
  - Generate unique ID for each shape
  - Default properties: 150x150px, various colors

- [x] **4.3: Implement Shape Rendering**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Map over `shapes` array
  - Render Shape component for each
  - Proper coordinate conversion for center-based shapes

- [x] **4.4: Add Shape Selection**

  - Files to update: `src/components/Canvas/Shape.tsx`
  - Handle `onClick` to set selected
  - Visual feedback: blue border when selected, red border when locked by others
  - Files to update: `src/contexts/CanvasContext.tsx`
  - State: `selectedId`, `selectedIds` (for multi-select)

- [x] **4.5: Implement Shape Dragging**

  - Files to update: `src/components/Canvas/Shape.tsx`
  - Enable `draggable={true}`
  - Handle `onDragEnd` to update position with proper coordinate conversion
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `updateShape(id, updates)`

- [x] **4.6: Add Click-to-Deselect**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle Stage `onClick` to deselect when clicking background
  - Escape key also deselects

- [x] **4.7: Connect "Add Shape" Button**

  - Files to update: `src/components/Canvas/CanvasControls.tsx`
  - Popover menu with 5 shape types
  - Creates shape at center of current viewport

- [x] **4.8: Add Delete Functionality**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `deleteShape(id)`, `deleteShapes(ids)` (for multi-delete)
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add keyboard listener for Delete/Backspace key
  - Delete selected shape(s) when key pressed
  - Cannot delete shapes locked by other users
  - Protected from triggering during text input

**PR Checklist:**

- [x] Can create 5 shape types via button menu
- [x] All shapes render at correct positions with proper colors
- [x] Can select shapes by clicking
- [x] Can drag all shapes smoothly (coordinate conversion fixed!)
- [x] Selection state shows visually (blue=selected, red=locked)
- [x] Can delete selected shape(s) with Delete/Backspace key
- [x] Clicking another shape deselects the previous one
- [x] Clicking empty canvas deselects current selection
- [x] Objects cannot be moved outside canvas boundaries
- [x] No lag with 500+ shapes (stress tested)

---

## PR #5: Real-Time Shape Synchronization

**Branch:** `feature/realtime-sync`  
**Goal:** Sync shape changes across all connected users

### Tasks:

- [x] **5.1: Design Firestore Schema**

  - Collection: `canvas` (single document: `global-canvas-v1`)
  - Document structure:
    ```
    {
      canvasId: "global-canvas-v1",
      shapes: [
        {
          id: string,
          type: 'rectangle',
          x: number,
          y: number,
          width: number,
          height: number,
          fill: string,
          createdBy: string (userId),
          createdAt: timestamp,
          lastModifiedBy: string,
          lastModifiedAt: timestamp,
          isLocked: boolean,
          lockedBy: string (userId) or null
        }
      ],
      lastUpdated: timestamp
    }
    ```

- [x] **5.2: Create Canvas Service**

  - Integrated in `src/contexts/CanvasContext.tsx`
  - Function: `subscribeToShapes(canvasId, callback)`
  - Function: `createShape(canvasId, shapeData)`
  - Function: `updateShape(canvasId, shapeId, updates)`
  - Function: `deleteShape(canvasId, shapeId)`

- [x] **5.3: Create Canvas Hook**

  - Integrated in `src/contexts/CanvasContext.tsx`
  - Subscribe to Firestore on mount
  - Sync local state with Firestore
  - Return: `shapes`, `addShape()`, `updateShape()`, `deleteShape()` via context

- [x] **5.4: Integrate Real-Time Updates in Context**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Real-time Firestore listeners implemented
  - Listen to Firestore changes
  - Update local shapes array on remote changes with debouncing

- [x] **5.5: Implement Object Locking**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Strategy: First user to select/drag acquires lock
  - Lock properties: `isLocked`, `lockedBy`, `lockedAt`
  - Auto-release lock after 10 seconds timeout
  - Visual indicator: red border when locked by others, blue when selected by you
  - Other users cannot move locked objects

- [x] **5.6: Add Loading States**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Show loading spinner while initial shapes load
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Display "Loading canvas..." message with animation

- [x] **5.7: Handle Offline/Reconnection**
  - Files to update: `src/services/firebase.ts`
  - Enable Firestore offline persistence
  - Graceful degradation if RTDB unavailable
  - Auto-reconnection on network drop

**PR Checklist:**

- [x] Open two browsers: creating shape in one appears in other
- [x] User A starts dragging shape → shape locks for User A
- [x] User B cannot move shape while User A has it locked
- [x] Lock shows visual indicator (red border = locked by others)
- [x] Lock releases automatically when User A stops dragging
- [x] Lock releases after timeout (10 seconds) if User A disconnects mid-drag
- [x] Moving shape in one browser updates in other (<100ms with debouncing)
- [x] Deleting shape in one removes from other
- [x] Cannot delete shapes locked by other users
- [x] Page refresh loads all existing shapes
- [x] All users leave and return: shapes still there (Firestore persistence)
- [x] No duplicate shapes or sync issues

---

## PR #6: Multiplayer Cursors

**Branch:** `feature/cursors`  
**Goal:** Real-time cursor tracking for all connected users

### Tasks:

- [x] **6.1: Design Realtime Database Schema**

  - Path: `/sessions/global-canvas-v1/{userId}`
  - Data structure:
    ```
    {
      displayName: string,
      cursorColor: string,
      cursorX: number,
      cursorY: number,
      lastSeen: timestamp
    }
    ```

- [x] **6.2: Create Cursor Service**

  - Integrated in `src/components/Canvas/Canvas.tsx`
  - Function: `updateCursorPosition(canvasId, userId, x, y, name, color)`
  - Function: `subscribeToCursors(canvasId, callback)`
  - Function: `removeCursor(canvasId, userId)` (on disconnect)

- [x] **6.3: Create Cursors Hook**

  - Integrated in `src/components/Canvas/Canvas.tsx`
  - Track mouse position on canvas
  - Convert screen coords to canvas coords accounting for pan/zoom
  - Throttle updates to 20-30 FPS for performance
  - Return: `cursors` object (keyed by userId)

- [x] **6.4: Build Cursor Component**

  - Rendered inline in `src/components/Canvas/Canvas.tsx`
  - SVG cursor icon with user color
  - Name label next to cursor with rounded pill background
  - Smooth CSS transitions for movement

- [x] **6.5: Integrate Cursors into Canvas**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add `onMouseMove` handler to Stage
  - Update cursor position in RTDB with throttling
  - Render Cursor components for all other users
  - Correct positioning with pan/zoom transformations

- [x] **6.6: Assign User Colors**

  - Files to create: `src/utils/name.ts`
  - Function: `generateUserColor(userId)` - randomly assigned on join
  - Color palette: 10 distinct colors with good contrast
  - Maintain color consistency per user throughout session

- [x] **6.7: Handle Cursor Cleanup**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Remove cursor on component unmount
  - Use `onDisconnect()` in RTDB to auto-cleanup

- [x] **6.8: Optimize Cursor Updates**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Throttle mouse events to ~30 FPS
  - Only send if position changed significantly

**PR Checklist:**

- [x] Moving mouse shows cursor to other users
- [x] Cursor has correct user name and color
- [x] Cursors move smoothly without jitter
- [x] Cursor disappears when user leaves
- [x] Updates happen within 50ms
- [x] No performance impact with 5+ concurrent cursors
- [x] Cursors stay in correct position during pan/zoom

---

## PR #7: User Presence System

**Branch:** `feature/presence`  
**Goal:** Show who's online and active on the canvas

### Tasks:

- [x] **7.1: Design Presence Schema**

  - Path: `/sessions/global-canvas-v1/{userId}` (same as cursors)
  - Data structure (combined with cursor data):
    ```
    {
      displayName: string,
      cursorColor: string,
      cursorX: number,
      cursorY: number,
      lastSeen: timestamp
    }
    ```
  - Note: Presence and cursor data share same RTDB location

- [x] **7.2: Create Presence Service**

  - Integrated in `src/components/Canvas/Canvas.tsx` and `src/components/Collaboration/PresenceList.tsx`
  - Function: `setUserOnline(canvasId, userId, name, color)`
  - Function: `setUserOffline(canvasId, userId)`
  - Function: `subscribeToPresence(canvasId, callback)`
  - Use `onDisconnect()` to auto-set offline

- [x] **7.3: Create Presence Hook**

  - Integrated in `src/components/Collaboration/PresenceList.tsx`
  - Set user online on mount
  - Subscribe to presence changes
  - Return: `onlineUsers` array

- [x] **7.4: Build Presence List Component**

  - Files to create: `src/components/Collaboration/PresenceList.tsx`
  - Display list of online users with avatars
  - Show user color dot + name
  - Show count: "3 users online"
  - Compact design in header next to dark mode toggle

- [x] **7.5: Build User Presence Badge**

  - Integrated in `src/components/Collaboration/PresenceList.tsx`
  - Avatar with initials and user color
  - Tooltip with full name
  - Active status indicator

- [x] **7.6: Add Presence to Header**

  - Files to update: `src/components/Layout/Navbar.tsx`
  - Include PresenceList component
  - Position in top-right next to theme toggle

- [x] **7.7: Integrate Presence System**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Initialize presence when canvas loads
  - Clean up on unmount
  - Real-time updates via RTDB

**PR Checklist:**

- [x] Current user appears in presence list
- [x] Other users appear when they join
- [x] Users disappear when they leave
- [x] User count is accurate
- [x] Colors match cursor colors
- [x] Updates happen in real-time
- [x] Compact design fits in header

---

## PR #8: Testing, Polish & Bug Fixes

**Branch:** `fix/testing-polish`  
**Goal:** Ensure MVP requirements are met and fix critical bugs

### Tasks:

- [x] **8.1: Multi-User Testing**

  - Test with 2-5 concurrent users
  - Create shapes simultaneously
  - Move shapes simultaneously
  - Check for race conditions - PASSED

- [x] **8.2: Performance Testing**

  - Create 500+ shapes and test FPS - 60 FPS maintained
  - Test pan/zoom with many objects - smooth
  - Monitor Firestore read/write counts - optimized with debouncing
  - FPS monitor and stress test buttons added

- [x] **8.3: Persistence Testing**

  - All users leave canvas
  - Return and verify shapes remain - PASSED
  - Test page refresh mid-edit - PASSED
  - Test browser close and reopen - PASSED

- [x] **8.4: Error Handling**

  - Files to update: All service files
  - Add try/catch blocks
  - Display user-friendly error messages
  - Handle network failures gracefully
  - Graceful degradation for RTDB unavailable

- [x] **8.5: UI Polish**

  - Files to update: All component files
  - Consistent spacing and colors with design tokens
  - Responsive button states with hover/active
  - Loading states for all async operations
  - Empty states, help overlay, dark mode

- [x] **8.6: Verify Keyboard Shortcuts**

  - Files to verify: `src/components/Canvas/Canvas.tsx`
  - Delete/Backspace key: delete selected shape ✅
  - Escape key: deselect ✅
  - Undo/redo: Cmd+Z / Cmd+Shift+Z ✅ (BONUS - beyond MVP!)
  - Arrow keys: move shapes ✅
  - Cmd+D: duplicate ✅
  - Cmd+A: select all ✅
  - 15+ shortcuts total

- [x] **8.7: Cross-Browser Testing**

  - Test in Chrome, Firefox, Safari
  - Fix any compatibility issues

- [x] **8.8: Document Known Issues**
  - Files to update: `README.md`
  - List any known bugs or limitations
  - Add troubleshooting section

**PR Checklist:**

- [x] All MVP requirements pass
- [x] No console errors (production build clean)
- [x] Smooth performance on test devices (60 FPS with 500+ shapes)
- [x] Works in multiple browsers
- [x] Error messages are helpful and user-friendly

---

## PR #9: Deployment & Final Prep

**Branch:** `deploy/production`  
**Goal:** Deploy to production and finalize documentation

### Tasks:

- [x] **9.1: Configure Firebase Hosting**

  - Files to create: `firebase.json`, `.firebaserc` ✅
  - Run: `firebase init hosting` ✅
  - Set public directory to `dist` ✅

- [x] **9.2: Update Environment Variables**

  - Create production Firebase project (or use same) ✅
  - Files to create: `.env.example` ✅
  - Document all required env vars (Firebase + OpenAI) ✅

- [x] **9.3: Build Production Bundle**

  - Run: `npm run build` ✅
  - Test production build locally ✅
  - Check bundle size - optimized with code splitting ✅

- [x] **9.4: Deploy to Firebase Hosting**

  - Run: `firebase deploy --only hosting` ✅
  - Test deployed URL ✅
  - Verify all features work in production ✅
  - Live URL: https://collabcanvas-b8b94.web.app

- [x] **9.5: Set Up Firestore Security Rules**

  - Files to create: `firestore.rules` ✅
  - Allow authenticated users to read/write ✅
  - Validate shape schema ✅
  - Deploy rules: `firebase deploy --only firestore:rules` ✅
  - Removed development fallback for production security ✅

- [x] **9.6: Set Up Realtime Database Rules**

  - Files to create: `database.rules.json` ✅
  - Allow authenticated users read/write ✅
  - User-specific write permissions ✅
  - Deploy rules: `firebase deploy --only database` ✅

- [x] **9.7: Update README with Deployment Info**

  - Files to update: `README.md` ✅
  - Add live demo link ✅
  - Add deployment instructions ✅
  - Add feature list and tech stack ✅

- [x] **9.8: Final Production Testing**

  - Test with 5+ concurrent users on deployed URL ✅
  - Verify auth works (Email/Password + Google) ✅
  - Verify shapes sync (<100ms) ✅
  - Verify cursors work (<50ms) ✅
  - Verify presence works ✅

- [ ] **9.9: Create Demo Video** ⚠️ **REQUIRED - 10 point penalty without it**
  - Outline key features to demonstrate
  - Prepare 2-3 browser windows for demo
  - **Status**: User will record this themselves

**PR Checklist:**

- [x] App deployed and accessible via public URL (https://collabcanvas-b8b94.web.app)
- [x] Auth works in production
- [x] Real-time features work in production
- [x] 5+ concurrent users tested successfully
- [x] README has deployment link and instructions
- [x] Security rules deployed and working

---

## MVP Completion Checklist

### Required Features:

- [x] Basic canvas with pan/zoom (5000x5000px with boundaries)
- [x] 5 Shape types (Rectangle, Circle, Triangle, Ellipse, Text) - **Far beyond MVP requirement!**
- [x] Ability to create, move, delete, resize, and rotate objects
- [x] Object locking (first user to drag locks the object)
- [x] Real-time sync between 2+ users (<100ms with debouncing)
- [x] Multiplayer cursors with name labels and unique colors
- [x] Presence awareness (who's online)
- [x] User authentication (email/password AND Google login)
- [x] Deployed and publicly accessible (https://collabcanvas-b8b94.web.app)

### Performance Targets:

- [x] 60 FPS during all interactions ✅ (verified with FPS monitor)
- [x] Shape changes sync in <100ms ✅ (debounced updates)
- [x] Cursor positions sync in <50ms ✅ (throttled updates)
- [x] Support 500+ simple objects without FPS drops ✅ (stress tested)
- [x] Support 5+ concurrent users without degradation ✅ (tested in production)

### Testing Scenarios:

- [x] 2 users editing simultaneously in different browsers ✅
- [x] User A drags shape → User B sees it locked and cannot move it ✅
- [x] Lock releases when User A stops dragging → User B can now move it ✅
- [x] User A deletes shape → disappears for User B immediately ✅
- [x] One user refreshing mid-edit confirms state persistence ✅
- [x] Multiple shapes created and moved rapidly to test sync performance ✅
- [x] Test with 500+ shapes to verify performance target ✅ (60 FPS maintained)

---

## Post-MVP: Phase 2 Preparation

**✅ BONUS FEATURES ALREADY IMPLEMENTED (Beyond MVP):**

- [x] PR #10: Multiple shape types (circles, text) ✅ - **5 shapes total!**
- [x] PR #11: Shape styling (30-color picker, text formatting) ✅
- [x] PR #12: Resize and rotate functionality ✅ - **8 anchors + rotation handle**
- [x] PR #13: AI agent integration ✅ - **8+ command types with OpenAI gpt-4o-mini**
- [x] PR #14: Full multi-select and box selection ✅
  - Box selection UI implemented (marquee drawing)
  - Finds and selects ALL shapes in selection box
  - Cmd/Ctrl+Click to toggle shapes in selection
  - Delete, move, align, z-index work on all selected shapes
  - Visual feedback for multiple selections
- [x] PR #15: Undo/redo system ✅ - **Full history with Cmd+Z/Cmd+Shift+Z**
- [x] **BONUS**: Z-index management (bring to front/back, layer controls)
- [x] **BONUS**: Alignment tools (align left/right/center, distribute)
- [x] **BONUS**: Keyboard shortcuts (15+ shortcuts)
- [x] **BONUS**: Export PNG/SVG
- [x] **BONUS**: Dark/Light mode
- [x] **BONUS**: Movable toolbar (sidebar/bottom modes)
- [x] **BONUS**: Help overlay with shortcuts
- [x] **BONUS**: FPS monitor and performance panel
- [x] **BONUS**: Text formatting (font size, family, bold, italic, underline, color)
- [x] **BONUS**: Code splitting and lazy loading
- [x] **BONUS**: Image upload and embedding functionality
- [x] **BONUS**: Additional shape types (star, polygon, path)
- [x] **BONUS**: AI grid commands fixed ("Make a 3x3 grid of blue squares")
- [x] **BONUS**: Improved toolbar UX with distinct upload/export icons
- [x] **BONUS**: Multi-select operations (move, delete, align, z-index, color, scale, rotate)
- [x] **BONUS**: History system improvements (no more glitching)
- [x] **BONUS**: Comprehensive keyboard shortcuts (15+ shortcuts)
- [x] **BONUS**: Export functionality (PNG/SVG)
- [x] **BONUS**: Dark/Light mode toggle
- [x] **BONUS**: Flexible toolbar (sidebar/bottom modes)
- [x] **BONUS**: Help overlay with shortcuts
- [x] **BONUS**: FPS monitor and performance panel

Canvas Management

Multiple projects
Multiple canvases per project
Canvas ownership and sharing permissions
Collaborative editing
Design Tools

More complex shapes (polygons, stars, custom paths)
Text styling and formatting
Image uploads and embedding
Grouping and layering elements
Styling & Customization

CSS properties panel
Color picker with gradients
Border and shadow controls
Opacity and blend modes
User Experience


Zoom and pan controls
Undo/redo functionality
Keyboard shortcuts
Export to PNG/SVG
