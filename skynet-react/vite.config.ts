import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(), tailwindcss(),mkcert()],
  server: {
    host: true,
    https: false,
    allowedHosts: ['desktop-77ao329'], // <== Must be an array
  },
})