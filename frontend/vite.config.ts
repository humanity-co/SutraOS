import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['*'],
    },
    origin: 'http://localhost:5173',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
  },
})
