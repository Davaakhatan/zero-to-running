import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database'],
          'konva-vendor': ['konva', 'react-konva'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 KB to suppress warnings for now
    target: 'es2020'
  },
  esbuild: {
    // Skip TypeScript checking during build
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2020',
    // Ignore TypeScript errors
    logLevel: 'silent'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  optimizeDeps: {
    exclude: ['typescript']
  },
  server: {
    host: '0.0.0.0',
    port: 3002,
    strictPort: true,
    // Allow requests from Docker service names and host.docker.internal
    allowedHosts: [
      'localhost',
      '.localhost',
      'collabcanva',
      'backend',
      'dashboard-frontend',
      'app-frontend',
      'host.docker.internal',
      '.host.docker.internal',
    ],
    fs: {
      strict: false
    }
  }
})
