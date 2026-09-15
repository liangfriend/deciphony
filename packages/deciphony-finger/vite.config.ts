import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig(({command}) => ({
  plugins: [
    vue(),
    ...(command === 'build'
      ? [
          dts({
            entryRoot: 'src',
            cleanVueFileName: true,
            copyDtsFiles: true,
          }),
        ]
      : []),
  ],
  server: {
    port: 12347,
    host: '0.0.0.0',
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    assetsInlineLimit: 0,
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'DeciphonyFinger',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
}))
