# CollabCanvas

A real-time collaborative canvas application where multiple users can create, edit, and manipulate shapes together in real-time. Built with React, TypeScript, Konva.js, and Firebase.

🔗 **Live Demo:** [https://collabcanva-d9e10.web.app](https://collabcanva-d9e10.web.app)

---

## ✨ Features

### Core Functionality
- **🎨 Interactive Canvas** - 5000x5000px workspace with pan and zoom controls
- **📦 Multi-Shape Support** - Create, move, resize, rotate, and delete rectangles, circles, triangles, text, ellipses, stars, polygons, paths, and images
- **🔄 Real-time Synchronization** - Changes sync instantly across all connected users (<100ms latency)
- **🔒 Object Locking** - Automatic locking when users interact with shapes to prevent conflicts
- **👥 User Presence** - See who's online and actively working on the canvas
- **🖱️ Multiplayer Cursors** - Track other users' cursor positions in real-time (when Realtime Database is enabled)
- **🎯 Multi-Select** - Select multiple shapes with Cmd/Ctrl+Click or box selection
- **📝 Text Editing** - Rich text formatting with font size, family, style (bold, italic, underline), and color
- **🖼️ Image Upload** - Upload and embed images directly on the canvas
- **🎨 Color Picker** - Change shape colors with recent colors and saved palettes
- **↩️ Undo/Redo** - Full history system with keyboard shortcuts (Cmd+Z/Cmd+Shift+Z)
- **⌨️ Keyboard Shortcuts** - Comprehensive shortcuts for all operations
- **📤 Export** - Export canvas as PNG or SVG
- **🤖 AI Assistant** - Natural language commands to create and manipulate shapes
- **🏢 Multi-Project System** - Create and manage multiple projects with separate canvases
- **👤 User Management** - Profile, settings, and signout functionality
- **🌙 Dark/Light Mode** - Complete theme switching with proper canvas backgrounds

### Authentication
- **📧 Email/Password Authentication** - Secure user registration and login
- **💾 Persistent Sessions** - Stay logged in across browser sessions

### User Experience
- **🎯 Modern UI/UX** - Beautiful gradient design with glassmorphism effects
- **📱 Responsive Design** - Works on desktop and tablet devices
- **❓ Help System** - Interactive tutorial overlay for new users
- **🎭 Empty State** - Helpful onboarding when canvas is empty
- **⚡ Performance** - 60 FPS rendering with 500+ shapes
- **📊 Performance Monitor** - Built-in FPS counter and stress testing tools
- **🌙 Dark/Light Mode** - Complete theme switching with proper canvas backgrounds
- **🎛️ Flexible Toolbar** - Movable toolbar (sidebar or bottom docked)
- **📐 Alignment Tools** - Align and distribute shapes
- **📚 Z-Index Management** - Bring to front, send to back, layer management
- **🔔 Notifications** - Real-time notification system
- **🔍 Search** - Search projects and canvases
- **👤 User Profile** - Profile management with settings and signout

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Konva.js** - HTML5 Canvas library for shape rendering
- **React Konva** - React bindings for Konva

### Backend & Services
- **Firebase Authentication** - User management
- **Cloud Firestore** - Real-time database for canvas state
- **Firebase Realtime Database** - High-frequency updates for cursors (optional)
- **Firebase Hosting** - Static site deployment
- **OpenAI API** - AI-powered natural language commands

### Developer Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Firebase CLI** - Deployment management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Davaakhatan/collabcanva.git
cd collabcanva
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password only)
   - Create a Firestore database
   - (Optional) Create a Realtime Database for multiplayer cursors
   - Copy your Firebase configuration

4. **Configure environment variables**
```bash
cp env.example .env
```

Edit `.env` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_OPENAI_API_KEY=your-openai-api-key
```

**⚠️ Security Note:** Never commit your `.env` file to version control. It's already in `.gitignore` for your protection.

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building for Production

1. **Build the application**
```bash
npm run build
```

2. **Preview the production build locally**
```bash
npm run preview
```

---

## 🚢 Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI** (if not already installed)
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Firebase** (first time only)
```bash
firebase init
```
Select:
- Hosting
- Firestore
- Use existing project
- Public directory: `dist`
- Single-page app: `Yes`

4. **Deploy**
```bash
npm run build
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

---

## 🎮 How to Use

1. **Sign Up / Login**
   - Create an account with email/password
   - Sign in with your registered credentials

2. **Canvas Controls**
   - **Pan:** Click and drag on empty space
   - **Zoom:** Scroll with mouse wheel or use zoom controls
   - **Add Shape:** Click the "Add Shape" button (+ icon)
   - **Move Shape:** Click and drag a shape
   - **Resize:** Click a shape to select, then drag corner handles
   - **Rotate:** Click a shape to select, then drag rotation handle
   - **Delete:** Select a shape and press Delete or Backspace
   - **Multi-Select:** Hold Cmd/Ctrl and click multiple shapes, or drag to box select
   - **Text Editing:** Double-click text shapes to edit content
   - **Color Change:** Select shapes and use the color picker
   - **Upload Images:** Click the upload button to add images
   - **Export:** Click export button to download as PNG/SVG

3. **AI Assistant**
   - Click the AI Assistant button to open the command panel
   - Try commands like:
     - "Create a red circle at 500, 300"
     - "Make a 3x3 grid of blue squares"
     - "Add a text box with 'Hello World'"
     - "Create 5 green triangles in a row"

4. **Keyboard Shortcuts**
   - **Cmd+Z / Ctrl+Z:** Undo
   - **Cmd+Shift+Z / Ctrl+Shift+Z:** Redo
   - **Delete / Backspace:** Delete selected shapes
   - **Arrow Keys:** Move selected shapes
   - **Cmd+D / Ctrl+D:** Duplicate selected shapes
   - **Esc:** Deselect all shapes
   - **?:** Show help overlay

5. **Collaboration**
   - Multiple users can work simultaneously
   - Shapes are automatically locked when being edited
   - See other users' presence in the top-right panel

---

## 📁 Project Structure

```
collabcanvas/
├── src/
│   ├── components/
│   │   ├── Auth/           # Login & Signup components
│   │   ├── AI/             # AI Command Panel
│   │   ├── Canvas/         # Canvas, Shape, Controls, TextFormatting
│   │   ├── Collaboration/  # Cursors, Presence
│   │   └── Layout/         # Navbar
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── CanvasContext.tsx    # Canvas state management
│   │   └── ThemeContext.tsx     # Dark/Light mode
│   ├── hooks/
│   │   ├── useCanvasSync.ts     # Firestore sync
│   │   ├── useCursors.ts        # Cursor tracking
│   │   ├── useHistory.ts        # Undo/Redo system
│   │   └── usePresence.ts       # User presence
│   ├── services/
│   │   ├── firebase.ts          # Firebase initialization
│   │   ├── canvas.ts            # Canvas CRUD operations
│   │   ├── cursor.ts            # Cursor/presence operations
│   │   └── ai.ts                # AI command processing
│   ├── utils/
│   │   ├── constants.ts         # App constants
│   │   ├── helpers.ts           # Utility functions
│   │   └── performance.ts       # FPS monitoring
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── public/                      # Static assets
├── firebase.json               # Firebase configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore indexes
└── .env                        # Environment variables (not in git)
```

---

## 🔒 Security

- **Environment Variables** - API keys stored in `.env` file (not committed to git)
- **Firestore Rules** - Database access controlled by authentication
- **Authentication** - Firebase Authentication with secure session management
- **HTTPS** - All traffic encrypted via Firebase Hosting

---

## 🎯 MVP Requirements Met

✅ **Basic canvas with pan/zoom** - 5000x5000px bounded canvas  
✅ **Multiple shape types** - Rectangles, circles, triangles, text, ellipses, stars, polygons, paths, images  
✅ **Object locking** - Automatic locking during interactions  
✅ **Real-time sync** - <100ms shape synchronization via Firestore  
✅ **Multiplayer cursors** - Real-time cursor tracking (optional RTDB)  
✅ **Presence awareness** - See online users  
✅ **User authentication** - Email/Password authentication  
✅ **Performance** - 60 FPS with 500+ shapes  
✅ **Deployed** - Live on Firebase Hosting  
✅ **Multi-select** - Select and manipulate multiple shapes  
✅ **Undo/Redo** - Full history system with keyboard shortcuts  
✅ **Export functionality** - PNG and SVG export  
✅ **AI Assistant** - Natural language commands  
✅ **Image upload** - Upload and embed images  
✅ **Text formatting** - Rich text editing with fonts and styles  
✅ **Color picker** - Change shape colors  
✅ **Keyboard shortcuts** - Comprehensive shortcut system  
✅ **Dark/Light mode** - Complete theme switching with proper canvas backgrounds  
✅ **Alignment tools** - Align and distribute shapes  
✅ **Z-index management** - Layer management  
✅ **Multi-Project System** - Create and manage multiple projects  
✅ **User Management** - Profile, settings, and signout functionality  
✅ **Notifications** - Real-time notification system  
✅ **Search** - Search projects and canvases  

---

## 🚀 Performance

- **60 FPS** rendering during all interactions
- **<100ms** shape change synchronization
- **<50ms** cursor position updates (when Realtime Database enabled)
- **500+ shapes** supported without FPS drops
- **5+ concurrent users** tested successfully

---

## 🔮 Future Enhancements

- [ ] Advanced shape editing (bezier curves, custom paths)
- [ ] Shape grouping and ungrouping
- [ ] Layer management panel
- [ ] Custom shape libraries
- [ ] Animation and transitions
- [ ] Touch/mobile optimizations
- [ ] Voice chat integration
- [ ] Advanced AI features (auto-layout, design suggestions)
- [ ] Plugin system for custom tools
- [ ] Version history and branching
- [ ] Collaborative comments and annotations

---

## 🐛 Known Issues

- Multiplayer cursors require Realtime Database to be manually created in Firebase Console
- Mobile touch gestures need optimization
- Some complex multi-select operations may have minor performance impacts with 100+ shapes

---

## 📝 License

This project is built as an assessment project for educational purposes.

---

## 🙏 Acknowledgments

- **React** - Facebook Open Source
- **Konva.js** - Anton Lavrenov
- **Firebase** - Google
- **Tailwind CSS** - Tailwind Labs

---

## 👨‍💻 Developer

Built with ❤️ by Davaakhatan

**Live Demo:** [https://collabcanva-d9e10.web.app](https://collabcanva-d9e10.web.app)  
**Repository:** [https://github.com/Davaakhatan/collabcanva](https://github.com/Davaakhatan/collabcanva)

---

## 📧 Support

For questions or issues, please open an issue on GitHub or contact the developer.

---

**Last Updated:** January 2025

## 🔄 Recent Updates

### Latest Fixes (January 2025)
- ✅ **Fixed Profile Dropdown** - Sign out functionality now works correctly across all pages
- ✅ **Removed Legacy Canvas Button** - Cleaned up home page interface
- ✅ **Fixed Project Counters** - Active Projects and Canvases Created now show real data instead of static zeros
- ✅ **Improved User Experience** - Dynamic messages based on actual project/canvas counts
