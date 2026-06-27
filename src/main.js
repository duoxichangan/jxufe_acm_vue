import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import { vReveal } from './directives/reveal.js'

import './styles/index.css'

createApp(App).use(router).directive('reveal', vReveal).mount('#app')
