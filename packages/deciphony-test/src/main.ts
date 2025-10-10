// main.ts
import {createApp} from 'vue'
import App from './App.vue'
import haloUI from 'deciphony-ui'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'


// Vue 组件错误捕获
const app = createApp(App)
app.use(ElementPlus)
app.use(haloUI)

app.mount('#app')
