import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './assets/styles/global.css'
import { initializeTheme } from './stores/theme.js'

initializeTheme()
createApp(App).use(router).mount('#app')
