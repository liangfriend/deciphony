// main.ts
import { createApp } from 'vue'
import App from './App.vue'

// 捕获全局同步错误
// window.addEventListener('error', (event) => {
//     console.group('%c全局运行时错误', 'color: red; font-weight: bold;')
//     console.log('消息:', event.message)
//     console.log('文件:', event.filename)
//     console.log('行号:', event.lineno)
//     console.log('列号:', event.colno)
//     console.log('调用栈:', event.error?.stack)
//     console.groupEnd()
// })
//
// // 捕获未处理的 Promise 异常
// window.addEventListener('unhandledrejection', (event) => {
//     console.group('%c未处理的 Promise 异常', 'color: orange; font-weight: bold;')
//     console.log('原因:', event.reason)
//     console.log('调用栈:', event.reason?.stack)
//     console.groupEnd()
// })

// Vue 组件错误捕获
const app = createApp(App)
// app.config.errorHandler = (err, instance, info) => {
//     console.group('%cVue 组件错误', 'color: blue; font-weight: bold;')
//     console.log('错误信息:', err.message)
//     console.log('组件:', instance?.$options.name || instance?.type?.name || '未知组件')
//     console.log('生命周期/调用信息:', info)
//     console.log('调用栈:', err.stack)
//     console.groupEnd()
// }

app.mount('#app')
