import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // esbuild explicitly handles jsx mapping to clear the bundler warning
  esbuild: {
    jsx: 'automatic', 
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // Changed localhost to 127.0.0.1
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

