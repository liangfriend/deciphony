// main.ts
import {createApp} from 'vue'
import App from './App.vue'
// import DsUI from 'deciphony-ui'
// import 'deciphony-ui/css'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
// app.use(DsUI)

// // 显示更详细的警告堆栈
// app.config.warnHandler = (msg, instance, trace) => {
//     console.error('Vue warn:', msg)
//     if (trace) console.log('Trace:', trace)
// }
//
// // 捕获运行时错误
// app.config.errorHandler = (err, instance, info) => {
//     console.error('Vue error:', err)
//     console.error('Component Info:', info)
//     console.error('Instance:', instance)
//     console.error('Stack Trace:', err?.stack)
// }

app.mount('#app')
