import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/shared/types/electron.d.ts'
import '@/app/assets/css/styles.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'

const app = createApp(App)

app.use(router)

app.mount('#app')

console.log('[App] Anki Tiny initialized')
