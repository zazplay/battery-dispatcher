import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `allowedHosts: true` lets tunnels (ngrok etc.) reach the dev and preview servers.
export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
});
