import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const rendererSrc = path.resolve(__dirname, '../deciphony-renderer/src')
/** 强制全仓同一份 Vue，否则 alias 到兄弟包 src 时会解析到各自 node_modules，props/ref 跨包不更新 */
const vueRuntime = path.dirname(require.resolve('vue/package.json'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 12345, // 指定开发服务器端口
    host: '0.0.0.0', // 可选，允许局域网访问
    open: true, // 可选，启动后自动打开浏览器
    // monorepo：@deciphony/* alias 指到兄弟包 src，需放行仓库根，否则 @fs 偶发 404 / 回落 index.html
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  assetsInclude: ['**/*.glb', '**/*.sjw'],
  resolve: {
    // 兄弟包各自装了不同版本的 vue，不去重会出现多个 Vue 实例，跨包的 ref/reactive 无法互相追踪
    dedupe: ['vue'],
    alias: {
      vue: vueRuntime,
      '@deciphony/renderer': path.resolve(rendererSrc, 'index.ts'),
      '@deciphony/player': path.resolve(__dirname, '../deciphony-player/src/index.ts'),
      '@deciphony/ui': path.resolve(__dirname, '../deciphony-ui/src/index.ts'),
      '@deciphony/engine': path.resolve(__dirname, '../deciphony-engine/src/index.ts'),
      '@deciphony/work': path.resolve(__dirname, '../deciphony-work/src/index.ts'),
      '@deciphony/extensions': path.resolve(__dirname, '../deciphony-extensions/src'),
      '@deciphony/puff': path.resolve(__dirname, '../deciphony-puff/src/index.ts'),
      '@deciphony/cl-sheet': path.resolve(__dirname, '../deciphony-cl-sheet/src/index.ts'),
      '@deciphony/tune-judge': path.resolve(__dirname, '../deciphony-tune-judge/src/index.ts'),
      '@deciphony/finger': path.resolve(__dirname, '../deciphony-finger/src/index.ts'),
      '@assets': path.resolve(__dirname, '../deciphony-ui/src/assets'),
      // 必须与 @deciphony/renderer 指向同一份源码，否则 @/ 与包入口会被 Vite 当成两个模块实例
      '@': rendererSrc,
    },
  },
})
