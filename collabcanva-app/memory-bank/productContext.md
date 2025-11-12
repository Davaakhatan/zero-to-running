# Product Context

## Why This Project Exists
CollabCanvas addresses the need for a lightweight, real-time collaborative design tool that combines the power of Figma-like canvas manipulation with AI-powered creation capabilities.

## Problems It Solves

### 1. Real-Time Design Collaboration
**Problem**: Teams need to collaborate on visual designs without file conflicts or version control issues.
**Solution**: Live multiplayer editing with cursor tracking, presence awareness, and automatic conflict resolution via shape locking.

### 2. Tedious Manual Shape Creation
**Problem**: Creating multiple shapes, layouts, or UI mockups is time-consuming.
**Solution**: AI-powered canvas agent that understands natural language commands to generate shapes, layouts, and complex designs instantly.

### 3. Complex Tool Learning Curves
**Problem**: Professional design tools have steep learning curves.
**Solution**: Intuitive keyboard shortcuts, visual feedback, and a clean Figma-inspired interface that's easy to learn.

## How It Works

### Core Workflow
1. **Authentication**: Users sign up/login via Firebase (email/password or Google)
2. **Canvas Creation**: Each workspace has a persistent canvas stored in Firestore
3. **Real-Time Sync**: All shape changes sync via Firebase Realtime Database (<100ms)
4. **Multiplayer**: Cursors tracked in real-time, shapes locked when selected
5. **AI Commands**: Natural language input processed by OpenAI to generate/modify shapes

### User Experience Goals

#### For Solo Users
- **Fast prototyping**: Quickly create mockups with AI assistance
- **Smooth editing**: 60 FPS performance even with 500+ shapes
- **Rich formatting**: Text with bold, italic, underline, 10 fonts, 30 colors
- **Export**: Download as PNG for presentations/documentation

#### For Teams
- **Live collaboration**: See teammates' cursors and edits in real-time
- **No conflicts**: Shape locking prevents simultaneous edits
- **Presence awareness**: Know who's online and what they're working on
- **Persistent state**: Refresh without losing work

## Key Features

### Canvas Manipulation
- **Pan**: Drag canvas or use mouse wheel
- **Zoom**: Ctrl+scroll or zoom buttons (10%-500%)
- **Select**: Click shapes or drag box selection
- **Transform**: Move, resize (8 anchors), rotate
- **Delete**: Keyboard shortcut or UI button

### Shape Types (5 total)
1. **Rectangle**: Rounded corners, any size
2. **Circle**: Perfect circles at any scale
3. **Triangle**: Equilateral triangles
4. **Ellipse**: Oval shapes with independent radii
5. **Text**: Rich formatting with live preview

### Text Formatting
- **Font Size**: 8-200px (manual input or +/- buttons)
- **Font Family**: 10 options (Arial, Helvetica, Times New Roman, etc.)
- **Styles**: Bold, Italic, Underline (any combination)
- **Color**: 30-color organized palette
- **Live Preview**: See changes before applying

### Collaboration Features
- **Multiplayer Cursors**: See where teammates are pointing
- **Shape Locking**: Prevents edit conflicts (10s timeout)
- **Presence List**: Compact online users list (click to follow)
- **Visual Feedback**: Blue border = you, Red border = locked by other

### AI Integration
- **Natural Language**: "Create a red circle at 500, 300"
- **Complex Layouts**: "Make a 3x3 grid of blue squares"
- **UI Generation**: "Create a login form"
- **Smart Positioning**: AI places shapes intelligently

## User Interface Philosophy

### Design Principles
1. **Figma-Inspired**: Familiar interface for design tool users
2. **Minimal Yet Powerful**: Clean UI with all tools accessible
3. **Dark Mode**: Reduce eye strain for long sessions
4. **Responsive**: Adapts to different screen sizes

### UI Components
- **Movable Toolbar**: Toggle between bottom bar and sidebar
- **Compact Controls**: Maximum functionality, minimum space
- **Visual Hierarchy**: Important actions prominent
- **Glassmorphism**: Modern blur effects for depth

## Success Metrics
- **Performance**: Maintains 60 FPS with 500+ shapes
- **Sync Speed**: Objects sync in <100ms, cursors in <50ms
- **AI Response**: Sub-2 second command execution
- **User Experience**: Zero lag during rapid edits
- **Collaboration**: 5+ concurrent users supported

## Target Audience
- Design students learning collaborative tools
- Small teams prototyping UI/UX ideas
- Developers creating quick mockups
- Anyone needing a lightweight Figma alternative

