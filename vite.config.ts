import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH is set by the GitHub Pages workflow (/battery-dispatcher/); locally the app runs at /.
// `allowedHosts: true` lets tunnels (ngrok etc.) reach the dev and preview servers.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
});
