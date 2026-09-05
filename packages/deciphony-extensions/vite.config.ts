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
      '@': rendererSrc,
    },
  },
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, './src/index.ts'),
        'dr-title/index': path.resolve(__dirname, './src/dr-title/index.ts'),
        'dr-lyrics/index': path.resolve(__dirname, './src/dr-lyrics/index.ts'),
        'dr-edit/edit-util': path.resolve(__dirname, './src/dr-edit/edit-util.ts'),
        'dr-edit/score-builder': path.resolve(__dirname, './src/dr-edit/score-builder.ts'),
        'dr-play/index': path.resolve(__dirname, './src/dr-play/index.ts'),
        'dr-play-highlight/index': path.resolve(__dirname, './src/dr-play-highlight/index.ts'),
        'dr-musicxml-transfer/index': path.resolve(__dirname, './src/dr-musicxml-transfer/index.ts'),
        'dr-numberNotation-transfer/index': path.resolve(
          __dirname,
          './src/dr-numberNotation-transfer/index.ts',
        ),
        'score-util': path.resolve(__dirname, './src/scoreUtil.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@deciphony/renderer', 'fast-xml-parser', 'xmlbuilder'],
    },
  },
})
