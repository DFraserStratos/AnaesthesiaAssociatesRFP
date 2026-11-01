import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port 5181: clear of the prototype (5173), its PWA (5174) and the Requirements Board (5180).
export default defineConfig({
  plugins: [react()],
  server: { port: 5181, strictPort: true },
  preview: { port: 5181, strictPort: true },
})
