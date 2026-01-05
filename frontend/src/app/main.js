import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/shared/types/electron.d.ts'
import '@/app/assets/css/styles.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'

const pinia = createPinia()

const startApp = () => createApp(App).use(router).use(pinia).mount('#app')

if (window.electronAPI)
  window.electronAPI.onBackendPort(port => {
    console.log('[API Client] Backend port received:', port)
    window.__BACKEND_URL__ = `http://localhost:${port}`
    startApp()
  })
else {
  window.__BACKEND_URL__ = `http://localhost:3000`
  startApp()
}

console.log('[App] Repetitio initialized')
