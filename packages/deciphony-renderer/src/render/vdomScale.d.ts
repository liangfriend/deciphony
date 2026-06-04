import type { VDom } from '@/types/common';
/** 在 translate(x,y) 内的局部缩放 transform（scale 为 1 或未设置时返回空串）；锚点为盒子中心 */
export declare function vdomScaleTransform(node: VDom): string;
export declare function vdomOuterTransform(node: VDom): string;
/** 布局占位：视觉缩放后的宽/高跨度 */
export declare function scaledSpan(size: number, scale?: number): number;
/** center 缩放：布局盒 (y,h) 的视觉顶边 y */
export declare function visualTopFromBox(y: number, h: number, scale?: number): number;
/** center 缩放：使视觉顶边落在 targetTop 时的布局盒 y */
export declare function boxYForVisualTop(targetTop: number, h: number, scale?: number): number;
/** center 缩放：布局盒 (y,h) 的视觉底边 y */
export declare function visualBottomFromBox(y: number, h: number, scale?: number): number;
/** center 缩放：使视觉底边落在 targetBottom 时的布局盒 y */
export declare function boxYForVisualBottom(targetBottom: number, h: number, scale?: number): number;
