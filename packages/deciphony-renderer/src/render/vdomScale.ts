import type {VDom} from '@/types/common';

/** 在 translate(x,y) 内的局部缩放 transform（scale 为 1 或未设置时返回空串）；锚点为盒子中心 */
export function vdomScaleTransform(node: VDom): string {
    const s = node.scale;
    if (s == null || s === 1) return '';
    const {w, h} = node;
    return `translate(${w / 2} ${h / 2}) scale(${s}) translate(${-w / 2} ${-h / 2})`;
}

export function vdomOuterTransform(node: VDom): string {
    const inner = vdomScaleTransform(node);
    return inner
        ? `translate(${node.x} ${node.y}) ${inner}`
        : `translate(${node.x} ${node.y})`;
}

/** 布局占位：视觉缩放后的宽/高跨度 */
export function scaledSpan(size: number, scale?: number): number {
    if (scale == null || scale === 1) return size;
    return size * scale;
}

/** center 缩放：布局盒 (y,h) 的视觉顶边 y */
export function visualTopFromBox(y: number, h: number, scale?: number): number {
    if (scale == null || scale === 1) return y;
    return y + h * (1 - scale) / 2;
}

/** center 缩放：使视觉顶边落在 targetTop 时的布局盒 y */
export function boxYForVisualTop(targetTop: number, h: number, scale?: number): number {
    if (scale == null || scale === 1) return targetTop;
    return targetTop - h * (1 - scale) / 2;
}

/** center 缩放：布局盒 (y,h) 的视觉底边 y */
export function visualBottomFromBox(y: number, h: number, scale?: number): number {
    if (scale == null || scale === 1) return y + h;
    return y + h * (1 + scale) / 2;
}

/** center 缩放：使视觉底边落在 targetBottom 时的布局盒 y */
export function boxYForVisualBottom(targetBottom: number, h: number, scale?: number): number {
    if (scale == null || scale === 1) return targetBottom - h;
    return targetBottom - h * (1 + scale) / 2;
}
