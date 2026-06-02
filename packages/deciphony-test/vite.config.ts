import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

const rendererSrc = path.resolve(__dirname, '../deciphony-renderer/src');
console.log('chicken',)
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
      'deciphony-renderer': path.resolve(rendererSrc, 'index.ts'),
      'deciphony-player': path.resolve(__dirname, '../deciphony-player/src/index.ts'),
      'j-player': path.resolve(__dirname, '../j-player/src/index.ts'),
      'deciphony-ui': path.resolve(__dirname, '../deciphony-ui/src/index.ts'),
      '@assets': path.resolve(__dirname, '../deciphony-ui/src/assets'),
      // 必须与 deciphony-renderer 指向同一份源码，否则 @/ 与包入口会被 Vite 当成两个模块实例
      '@': rendererSrc,
    }
  },

});
console.log('chicken', path.resolve(__dirname, '../j-player/src/index.ts'))