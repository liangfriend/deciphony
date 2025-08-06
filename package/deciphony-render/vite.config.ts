import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dts from 'vite-plugin-dts'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(),
        dts({
            entryRoot: 'src',
            cleanVueFileName: true, // 去除 .vue 文件名的冗余
            copyDtsFiles: true,
        }),],
    server: {
        port: 9999, // 指定开发服务器端口
        host: '0.0.0.0', // 可选，允许局域网访问
        open: true, // 可选，启动后自动打开浏览器
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    assetsInclude: ['**/*.svg',], //确保vite能正确处理.gltf文件
    build: {
        lib: {
            entry: path.resolve(__dirname, './src/index.ts'),
            name: 'DeciphonyRender',
            fileName: () => 'index.js',
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    }
});
