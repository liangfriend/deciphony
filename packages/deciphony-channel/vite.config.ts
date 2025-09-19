import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

export default defineConfig({
    plugins: [vue(), tailwindcss(),],
    resolve: {
        alias: {
            '@deciphony-player': path.resolve(__dirname, './node_modules/deciphony-player/src/index.ts'),
        }
    },
})
