import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the existing code
      'process.env': env
    },
    server: {
      proxy: {
        // Route API requests to the local Express server
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    }
  };
});