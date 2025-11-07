import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// Core plugins that are always loaded
const plugins = [react(), runtimeErrorOverlay()];

// Optional Replit plugins - we'll try to load them but won't fail if they're missing
if (process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined) {
  // These plugins are optional and enhance the dev experience in Replit
  // We skip them here to keep the config synchronous and simple
  // They can be added back with dynamic import if needed
}



export default defineConfig({
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    hmr: {
      overlay: false,
    },
  },
});
