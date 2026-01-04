import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: './',
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', '@vueuse/core']
        }
      }
    }
  },
  plugins: [
    vue(),
    Components({
      dirs: ['src'],
      deep: true
    }),
    tailwindcss(),
    ,
    {
      name: 'inject-csp-production',
      transformIndexHtml(html) {
        // Вставляем CSP только при сборке (npm run build)
        if (command === 'build') {
          const csp = `
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self' lmorozanki:;
    script-src 'self' 'unsafe-inline' lmorozanki:;
    style-src 'self' 'unsafe-inline' lmorozanki: https://fonts.googleapis.com;
    font-src 'self' data: lmorozanki: https://fonts.gstatic.com;
    img-src 'self' data: lmorozanki: http://localhost:* http:;
    media-src 'self' data: lmorozanki: http://localhost:* http:;
    connect-src 'self' lmorozanki: http://localhost:*;
  ">
`
          return html.replace('<head>', `<head>${csp}`)
        }
        return html
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}))
