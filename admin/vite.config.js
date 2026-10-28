import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api calls are forwarded to the local backend (npm run dev:api from the project root),
// so leave VITE_API_URL empty locally. In production set VITE_API_URL to the store's address.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy: { '/api': 'http://localhost:4000' } },
})
