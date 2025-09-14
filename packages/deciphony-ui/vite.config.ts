import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dts from 'vite-plugin-dts';
import {viteStaticCopy} from 'vite-plugin-static-copy';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        // 启用 Vue 支持（支持 .vue 文件编译）
        vue(),
        // 生成 TypeScript 类型声明文件
        dts({
            entryRoot: 'src', // 类型声明的根目录为 src
            include: ['src'],
            cleanVueFileName: true // 移除生成的 .vue.d.ts 文件中的冗余 `.vue` 后缀
            // copyDtsFiles: true // 拷贝 `.d.ts` 文件到输出目
        }),
        // 静态文件复制插件（将资源原样拷贝到打包输出目录）
        viteStaticCopy({
            targets: [
                {
                    src: 'src/assets', // 要复制的源路径（相对于项目根目录）
                    dest: '' // 复制到 dist/assets（默认拷贝到 dist 根目录下）
                }
            ]
        })
    ],
    // 本地开发服务器配置
    server: {
        port: 9999, // 指定开发服务器端口
        host: '0.0.0.0', // 可选，允许局域网访问
        open: true // 可选，启动后自动打开浏览器
    },
    assetsInclude: ['**/*.glb'],
    // 路径别名配置
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@assets': path.resolve(__dirname, './src/assets')
        }
    },
    build: {
        // 设置为 0，表示所有资源都不要内联（例如 SVG 不转 data URL，而是保留文件路径）
        assetsInlineLimit: 0,
        // 构建为库（library）模式
        lib: {
            entry: path.resolve(__dirname, './src/index.ts'), // 库入口
            name: 'HaloUI', // 全局变量名（UMD/CJS 使用）
            fileName: (format) => `index.${format}.js`, // 输出文件名
            formats: ['es', 'cjs'] // 打包格式：ESModule 和 CommonJS
        },
        rollupOptions: {
            // 关键：把 vue 标记为 external，不打包进库
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                },
                exports: 'named'
            }
        }
    }
});
