import {defineConfig} from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src',
            cleanVueFileName: true, // 去除 .vue 文件名的冗余
            copyDtsFiles: true,
        }),
    ],

    resolve: {
        alias: {}
    },
    build: {
        assetsInlineLimit: 0,
        lib: {
            entry: path.resolve(__dirname, './src/index.ts'),
            name: 'DeciphonyPlayer',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs']
        },

    }
});
