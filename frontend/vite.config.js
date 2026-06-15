import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all /api/v1/* calls (backlogs, features, tasks, users etc.)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Auth endpoints live directly under the root on your FastAPI server
      // e.g. POST /login/access-token, POST /signup, POST /login/test-token
      '/login': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/signup': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});