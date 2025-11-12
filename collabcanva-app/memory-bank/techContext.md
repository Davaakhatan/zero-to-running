# Technical Context

## Technology Stack

### Frontend Framework
**React 18.3.1 + TypeScript 5.6.2**
- **Why**: Type safety, component reusability, strong ecosystem
- **Build Tool**: Vite 6.0.5 (fast HMR, optimized builds)
- **Package Manager**: npm

### Canvas Rendering
**Konva.js 9.3.20 (via react-konva 18.2.10)**
- **Why**: High-performance 2D canvas library built on HTML5 Canvas
- **Features**: Shape primitives, transformations, event handling
- **Performance**: Hardware-accelerated rendering
- **API**: Declarative React components

### Styling
**Tailwind CSS 3.4.17**
- **Why**: Utility-first, rapid prototyping, small bundle size
- **PostCSS**: Autoprefixer for browser compatibility
- **Custom Config**: Extended colors, animations, dark mode

### Backend Services
**Firebase 11.2.0**
- **Authentication**: Email/password + Google OAuth
- **Firestore**: Document database for persistent shapes
- **Realtime Database**: Low-latency cursor tracking
- **Hosting**: Static site deployment with CDN
- **Security Rules**: User-based access control

### AI Integration
**OpenAI API (GPT-4o-mini)**
- **Purpose**: Natural language command processing
- **Response Time**: <2 seconds for most commands
- **Cost**: Optimized with mini model for fast responses
- **API**: RESTful HTTP requests

## Development Setup

### Prerequisites
```bash
Node.js 18+ (tested on 24.6.0)
npm 8+
Firebase CLI
Git
```

### Environment Variables
Create `.env` file:
```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# OpenAI Config
VITE_OPENAI_API_KEY=sk-...
```

### Local Development
```bash
# Install dependencies
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy hosting
firebase deploy --only hosting

# Deploy database rules
firebase deploy --only database
```

## Project Structure

```
collabcanvas/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Login/Signup
│   │   ├── Canvas/         # Main canvas + controls
│   │   ├── Collaboration/  # Cursors, presence
│   │   ├── Layout/         # Navbar
│   │   └── Shared/         # Reusable UI
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── CanvasContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useCursors.ts
│   │   ├── useHistory.ts
│   │   └── usePresence.ts
│   ├── services/           # External services
│   │   ├── firebase.ts     # Firebase init
│   │   ├── canvas.ts       # Firestore ops
│   │   ├── cursor.ts       # RTDB ops
│   │   └── ai.ts           # OpenAI integration
│   ├── utils/              # Helper functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── performance.ts
│   │   └── export.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── memory-bank/            # Project memory files
├── .env                    # Environment variables (gitignored)
├── .gitignore
├── firebase.json           # Firebase config
├── database.rules.json     # RTDB security rules
├── package.json
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind config
├── vite.config.ts          # Vite config
└── README.md
```

## Dependencies

### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-konva": "^18.2.10",
  "konva": "^9.3.20",
  "firebase": "^11.2.0",
  "react-router-dom": "^7.1.3"
}
```

### Dev Dependencies
```json
{
  "typescript": "~5.6.2",
  "vite": "^6.0.5",
  "@vitejs/plugin-react": "^4.3.4",
  "tailwindcss": "^3.4.17",
  "postcss": "^8.4.49",
  "autoprefixer": "^10.4.20",
  "eslint": "^9.17.0"
}
```

## Build Configuration

### Vite Config
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', ...],
          'konva-vendor': ['konva', 'react-konva']
        }
      }
    }
  }
});
```

**Benefits**:
- Code splitting for faster initial load
- Vendor chunks cached separately
- Tree-shaking for unused code

### TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Benefits**:
- Strict type checking catches errors early
- Modern ES features
- Optimal for Vite bundler

### Tailwind Config
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom animations, colors, etc.
    }
  }
};
```

## Technical Constraints

### Browser Support
- **Modern browsers only** (ES2020+ features)
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- No IE11 support

### Performance Targets
- **Initial Load**: <3 seconds on 3G
- **FPS**: 60 FPS with 500+ shapes
- **Sync Latency**: <100ms object sync, <50ms cursors
- **AI Response**: <2 seconds for commands

### Security Constraints
- **API Keys**: Never in source code, always in .env
- **Auth Required**: All canvas operations require authentication
- **CORS**: Firebase handles cross-origin requests
- **Rate Limiting**: Considered for AI endpoint

### Scalability Limits
- **Concurrent Users**: Tested up to 5, should handle 10+
- **Shapes per Canvas**: Tested up to 500, performs well
- **Database**: Firestore free tier (50k reads/day, 20k writes/day)
- **AI Calls**: OpenAI rate limits apply

## Deployment

### Firebase Hosting
```bash
# Build production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Result: https://collabcanva-d9e10.web.app
```

**Features**:
- Global CDN
- Auto SSL/TLS
- Cache optimization
- Rollback support

### Environment-Specific Config
**Development**:
- Hot module replacement
- Source maps enabled
- Verbose logging

**Production**:
- Minified code
- Tree-shaken
- Source maps disabled
- Error boundaries
- Performance monitoring

## Known Technical Debt

### Areas for Improvement
1. **Test Coverage**: Currently manual testing only
2. **Error Logging**: No centralized error tracking (could add Sentry)
3. **Analytics**: No user behavior tracking (could add Google Analytics)
4. **Offline Support**: No service worker for offline functionality
5. **Mobile**: Not optimized for touch devices (keyboard-heavy)

### Future Enhancements
- WebSocket alternative to RTDB for lower latency
- WebGL renderer for >1000 shapes
- Voice commands for AI agent
- Real-time voice/video chat
- Version control for canvas states

