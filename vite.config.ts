import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Blind - 진심으로 만나는 특별한 인연',
        short_name: 'Blind',
        description: '신뢰할 수 있는 프리미엄 블라인드 데이팅 애플리케이션',
        theme_color: '#FF5864',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'ko'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // SSE 연결을 위한 설정
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Error:', err)
          })
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('[Vite Proxy]', req.method, req.url)
          })
        },
      },
    },
  },
  build: {
    sourcemap: false,  // 프로덕션에서 소스맵 비활성화 (보안)
    minify: 'esbuild',
    target: 'es2020'
  }
})
