import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@clerk')) return 'vendor-clerk';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'vendor-charts';
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('lucide-react') || id.includes('sonner')) return 'vendor-ui';
          }
        },
      },
    },
  },
})
