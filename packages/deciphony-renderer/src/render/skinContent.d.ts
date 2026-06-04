import type { VDom } from '@/types/common';
/** 皮肤 content 中 node.* 占位符 → 数值字符串 */
export declare function replaceSkinNodeVars(content: string, node: Pick<VDom, 'w' | 'h'>): string;
/**
 * scaleAt(s, cx, cy) → translate(cx,cy) scale(s) translate(-cx,-cy)
 * 锚点坐标支持 calc(...)，与 node.* 一样先替换再求值
 */
export declare function expandSkinScaleAt(content: string): string;
/** 将 content 中 calc(公式) 替换为求值结果；支持一层括号，如 calc((node.h-1.8)) */
export declare function evaluateSkinCalc(content: string): string;
/** 皮肤 content 模板：node.* 替换 → calc(...) 求值 → scaleAt(...) 展开 */
export declare function applySkinContentTemplate(content: string, node: Pick<VDom, 'w' | 'h'>): string;
