import type { VDom } from '@/types/common';
/** 用于匹配同一渲染节点的稳定键 */
export declare function vdomNodeKey(node: VDom): string;
/** 比较影响 Group / 附属组件绘制的字段 */
export declare function isVDomRenderEqual(a: VDom, b: VDom): boolean;
/**
 * 将新一轮 musicScoreToVDom 结果与当前 vDom 合并：未变化的节点保留原对象引用，
 * 以便 Vue 跳过对应 Group 的更新。
 */
export declare function diffAndMergeVDom(current: VDom[], next: VDom[]): VDom[];
/**
 * 通过 updater 修改 vDom 后做 diff 合并（暴露给外部的 updateVDom API）
 */
export declare function applyVDomUpdate(current: VDom[], updater: (vDom: VDom[]) => VDom[]): VDom[];
