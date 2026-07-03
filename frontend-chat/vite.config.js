import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({

  plugins: [react()],
  optimizeDeps: {
    include: ['remark-gfm'],
  },
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

