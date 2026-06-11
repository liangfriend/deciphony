import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      cleanVueFileName: true,
      copyDtsFiles: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    assetsInlineLimit: 0,
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'DeciphonyEngine',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'element-plus', 'deciphony-player', 'gsap'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          'element-plus': 'ElementPlus',
          'deciphony-player': 'DeciphonyPlayer',
          gsap: 'gsap'
        }
      }
    }
  }
})
