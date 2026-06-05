import type { VDom } from '@/types/common';
/** 从指针/点击事件命中 DOM 向上查找带 data-target-id 的元素 */
export declare function getHitElement(event: Event): Element | null;
/**
 * 将顶层 SVG 上的事件解析为 VDom（与 dr-* 逐节点绑定互补）。
 * 优先 targetId + data-tag 精确匹配；无 tag 时按 targetId 回退（插槽父 g 等）。
 */
export declare function resolveVDomFromEvent(event: Event, vDoms: readonly VDom[]): VDom | null;
