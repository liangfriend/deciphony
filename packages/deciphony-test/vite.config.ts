import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

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
            'deciphony-render': path.resolve(__dirname, '../deciphony-render/src'),
            '@player': path.resolve(__dirname, '../deciphony-player/src'),
            '@core': path.resolve(__dirname, '../deciphony-core/src'),
            '@render': path.resolve(__dirname, '../deciphony-render/src'),
            'deciphony-core': path.resolve(__dirname, '../deciphony-core/src')
        }
    },

});
