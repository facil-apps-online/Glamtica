import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    cors: true,
    proxy: {
      '/functions/v1': {
        target: 'https://vtfsbogpkrcbfuhhoepf.supabase.co',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
