import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  server: {
    port: 5173,
    // In dev, Vite serves the frontend; /api/chat is handled by Vercel dev or a fallback.
    // For local dev without Vercel CLI, the app gracefully degrades if /api/chat is unavailable.
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['lightweight-charts'],
        },
      },
    },
  },
})
