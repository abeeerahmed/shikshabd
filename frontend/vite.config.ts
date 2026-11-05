import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'favicon.svg'],
      manifest: {
        name: 'ShikshaBD',
        short_name: 'ShikshaBD',
        description: 'Bangladesh Educational Institutes Database',
        theme_color: '#047857',
        background_color: '#fafaf9',
        display: 'standalone',
        icons: [
          { src: '/logo.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/logo.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/shikshabd\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 100, maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})