import {ref} from 'vue';
import type {VDomTagType} from '@/types/common';

/**
 * 以直线为主的节点：translate 吸附到设备像素网格。
 * 布局坐标是小数（如小节宽 = 可用宽 / 小节数），同一根 1px 线落在不同亚像素相位上，
 * 抗锯齿后有的压一个像素、有的摊成两个灰像素，看起来粗细不一；吸附后同类线相位一致。
 */
export const PIXEL_SNAP_TAGS: ReadonlySet<VDomTagType> = new Set<VDomTagType>([
    'measure',
    'barline_f',
    'barline_b',
    'linked_barline',
    'close_line',
    'linked_close_line',
    'noteStem',
    'addLine',
    'addLine_u',
    'addLine_g',
]);

const devicePixelRatio = ref(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

function watchDevicePixelRatio() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
        'change',
        () => {
            devicePixelRatio.value = window.devicePixelRatio || 1;
            watchDevicePixelRatio();
        },
        {once: true},
    );
}

watchDevicePixelRatio();

/** 吸附到 1 / devicePixelRatio 的整数倍（浏览器缩放 / 换屏时响应式更新） */
export function snapToDevicePixel(value: number): number {
    const ratio = devicePixelRatio.value;
    return Math.round(value * ratio) / ratio;
}
