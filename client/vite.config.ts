import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  resolve: {
    // Prefer TSX/TS over JS when both files exist with the same basename
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
})
