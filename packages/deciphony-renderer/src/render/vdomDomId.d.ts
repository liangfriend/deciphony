import type { VDom } from '@/types/common';
/**
 * 选中态 / DOM 绑定的稳定语义键（不含 skinName、skinKey，换肤后不变）。
 * 格式：tag:targetId:slotName[:ledgerLine]
 */
export declare function vdomSelectionKey(node: VDom): string;
/**
 * 顶层事件绑定 g 的 DOM id。
 * 有 targetId 时由语义键派生；无 targetId（如 space）用 domIndex 保证唯一。
 */
export declare function vdomDomId(node: VDom, domIndex?: number): string;
/** 在 svg 根下按语义键查找顶层绑定 g（有 targetId 的节点） */
export declare function findElementByVdomDomId(root: ParentNode, node: VDom): SVGElement | null;
/** 在 vDom 列表中按语义键找回节点 */
export declare function findVDomBySelectionKey(vDoms: readonly VDom[], key: string): VDom | undefined;
/** 在 vDom 列表中按 DOM id 找回节点（id 由 vdomDomId 生成） */
export declare function findVDomByDomId(vDoms: readonly VDom[], domId: string): VDom | undefined;
