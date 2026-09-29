import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Read only PORT here. FAL_KEY stays out of the bundle: Vite exposes VITE_-prefixed
  // variables to client code and nothing else.
  const { PORT = '8787' } = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5180,
      strictPort: true,
      proxy: { '/api': `http://127.0.0.1:${PORT}` }
    }
  };
});
