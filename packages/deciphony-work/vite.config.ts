import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'

const rendererSrc = path.resolve(__dirname, '../deciphony-renderer/src')

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      cleanVueFileName: true,
      copyDtsFiles: true,
    }),
  ],
  resolve: {
    alias: {
      '@deciphony/renderer': path.resolve(rendererSrc, 'index.ts'),
      '@deciphony/player': path.resolve(__dirname, '../deciphony-player/src/index.ts'),
      '@deciphony/extensions': path.resolve(__dirname, '../deciphony-extensions/src'),
      '@': rendererSrc,
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'DeciphonyWork',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@deciphony/renderer',
        '@deciphony/player',
        '@deciphony/extensions',
        'fflate',
      ],
    },
  },
})
