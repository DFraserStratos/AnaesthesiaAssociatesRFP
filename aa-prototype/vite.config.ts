import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The dev port is 5173 unless AA_PROTO_PORT says otherwise: a parallel build lane
// in its own worktree runs on its own ports (docs/prototype-build/catch-up/LANES.md),
// and then the port is strict, so a busy port fails rather than drifting to 5174.
const protoPort = process.env['AA_PROTO_PORT']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: protoPort ? { port: Number(protoPort), strictPort: true } : {},
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // Vitest owns unit tests under src/; Playwright specs live in visual/.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'visual/**'],
  },
})
