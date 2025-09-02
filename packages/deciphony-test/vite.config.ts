import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import {fileURLToPath, URL} from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(),
    ],
    server: {
        port: 12345, // 指定开发服务器端口
        host: '0.0.0.0', // 可选，允许局域网访问
        open: true, // 可选，启动后自动打开浏览器
    },
    resolve: {
        alias: {
            'deciphony-renderer': path.resolve(__dirname, 'node_modules/deciphony-renderer/src'),
            'deciphony-player':  path.resolve(__dirname, 'node_modules/deciphony-player/src/**'),
            'deciphony-core/**': path.resolve(__dirname, 'node_modules/deciphony-core/src/**')
        }
    },

});
