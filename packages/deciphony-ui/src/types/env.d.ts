// src/env.d.ts
/// <reference types="vite/client" />

declare module '*.png' {
    const pngUrl: string;
    export default pngUrl;
}
declare module '*.jpg' {
    const jpgUrl: string;
    export default jpgUrl;
}
declare module '*.svg' {
    const svgUrl: string;
    export default svgUrl;
}
declare module '*.mp4' {
    const mp4Url: string;
    export default mp4Url;
}
declare module '*.mp3' {
    const mp3Url: string;
    export default mp3Url;
}
