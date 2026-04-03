
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api/* → nginx → Express API
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
      // Forward /ws/* → nginx → Hocuspocus WS nodes
      '/ws': {
        target: 'ws://localhost:80',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
