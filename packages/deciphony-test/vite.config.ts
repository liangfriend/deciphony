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
    assetsInclude: ['**/*.glb'],
    resolve: {
        alias: {
            '@deciphony-player': path.resolve(__dirname, './node_modules/deciphony-player/src/index.ts'),
            '@deciphony-ui': path.resolve(__dirname, './node_modules/deciphony-ui/src/index.ts'),
            '@assets': path.resolve(__dirname, './node_modules/deciphony-ui/src/assets')
        }
    },

});
