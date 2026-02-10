import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // This ensures that process.env.API_KEY is replaced by the actual string value during build.
      // This prevents "process is not defined" errors in the browser.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      'process.env.GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash'),
    },
  };
});