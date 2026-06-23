import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  define: {
    CANVAS_RENDERER: 'true',
    WEBGL_RENDERER: 'true',
  },
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        rewriteWsOrigin: true,
      },
      '/world': {
        target: 'http://localhost:8000',
      },
      '/npc': {
        target: 'http://localhost:8000',
      },
    },
  },
})
