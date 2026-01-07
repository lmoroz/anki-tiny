import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Vue3Toastify from 'vue3-toastify'
import '@/shared/types/electron.d.ts'
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import 'vue3-toastify/dist/index.css'
import '@/app/assets/css/styles.css'

const pinia = createPinia()

const startApp = () => {
  const app = createApp(App)
  app.use(router)
  app.use(pinia)
  app.use(Vue3Toastify, {
    theme: 'dark',
    autoClose: 3000,
    position: 'top-right',
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  })
  return app.mount('#app')
}

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
