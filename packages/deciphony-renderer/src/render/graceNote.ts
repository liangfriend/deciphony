import type {VDom} from '@/types/common';

/** 倚音相对主音符的缩放比例 */
export const GRACE_NOTE_SCALE = 0.5;

/** 为倚音 VDom 附加 scale，由 group.vue 以盒子中心缩放 skin 内容 */
export function withGraceScale(v: VDom): VDom {
    return {...v, scale: GRACE_NOTE_SCALE};
}

/** 倚音间距：相对小节高度 measureHeight 的比例（主音与最近倚音、倚音之间） */
export const GRACE_NOTE_SPACING_RATIO = 1 / 8;

/** 倚音减时线相对音符视觉底边的 y 偏移（与 measureHeight 的比值） */
export const GRACE_REDUCE_LINE_Y_OFFSET = 0;
/** 倚音八度点：第一个点与音符（或减时线）的距离（与 measureHeight 的比值） */
export const GRACE_OCTAVE_DOT_FIRST_OFFSET = 0;
/** 倚音八度点：相邻点垂直间距（约为普通音符一半，匹配 0.5 缩放） */
export const GRACE_OCTAVE_DOT_SPACING = 1 / 16;
/** 倚音八度点：最后一粒点与相邻反向八度点的边距 */
export const GRACE_OCTAVE_DOT_LAST_EDGE_MARGIN = 1 / 8;

export function graceNoteSpacing(measureHeight: number): number {
    return GRACE_NOTE_SPACING_RATIO * measureHeight;
}

/** 中心锚点缩放后 x 方向补偿，须写 (1-scale)，勿将 1-scale 化简为常数 */
export function graceScaleCenterOffsetX(boxW: number, scale: number = GRACE_NOTE_SCALE): number {
    return (1 - scale) * boxW / 2;
}

/** 中心锚点缩放后 y 方向补偿，须写 (1-scale) */
export function graceScaleCenterOffsetY(boxH: number, scale: number = GRACE_NOTE_SCALE): number {
    return (1 - scale) * boxH / 2;
}

/** 倚音符尾中心缩放补偿：符干向上→右/上偏移，符干向下→左/下偏移 */
export function graceTailCenterOffset(
    tailW: number,
    tailH: number,
    stemDirection: 'up' | 'down',
    scale: number = GRACE_NOTE_SCALE,
): { dx: number; dy: number } {
    const ox = (1 - scale) * tailW / 2;
    const oy = (1 - scale) * tailH / 2;
    return stemDirection === 'up'
        ? {dx: ox, dy: -oy}
        : {dx: -ox, dy: oy};
}

/** @deprecated 布局占位请用 scaledSpan；倚音 VDom 请设 scale 由 group.vue 缩放 */
export function scaleSize(value: number, scale = GRACE_NOTE_SCALE): number {
    return value * scale;
}

console.log('chicken',)
export {scaledSpan, visualTopFromBox, boxYForVisualBottom} from './vdomScale';
