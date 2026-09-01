import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase/firestore')) {
            return 'vendor-firebase-firestore';
          }
          if (id.includes('node_modules/firebase/auth') || id.includes('node_modules/firebase/app')) {
            return 'vendor-firebase-auth';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas';
          }
        },
      },
    },
  },
})
