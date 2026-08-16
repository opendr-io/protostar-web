import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  // Proxied build sets VITE_NEO_BASE="/graph/" so assets resolve under the
  // proxy subpath; unset = "/" so local dev at :3000 is unchanged.
  base: process.env.VITE_NEO_BASE || '/',
  plugins: [react(),mkcert()],
  server: {
    host: true,
    // @ts-ignore
    https: false,
    port: 3000,
    allowedHosts: ['hostname'], // <== Must be an array
  },
})