import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(),mkcert()],
  server: {
    host: true,
    // @ts-ignore
    https: false,
    port: 3000
  },
  allowedHosts: ['your_hostname'],  // <== this must be an array
})