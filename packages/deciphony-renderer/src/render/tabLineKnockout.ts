import type {VDom, VDomKnockout} from '@/types/common';

/** 品格数字左右各多挖的距离（px），弦线断口比数字略宽 */
const TAB_LINE_KNOCKOUT_PAD_X = 1;

/**
 * 弦线在品格数字处断开：弦线画在 measure 皮肤里无法拆分，这里把与小节相交的 tabNoteNumber
 * 视觉框（含 scale）写进 measure.knockouts，由 group.vue 用蒙版挖掉。
 * 须在所有 Frame 偏移之后调用；knockouts 为小节局部坐标，整行纵向平移时不用跟着改。
 */
export function applyTabLineKnockouts(vDoms: VDom[]): void {
    const boxes: VDomKnockout[] = [];
    for (const node of vDoms) {
        if (node.tag !== 'tabNoteNumber') continue;
        const s = node.scale ?? 1;
        const w = node.w * s;
        const h = node.h * s;
        boxes.push({
            x: node.x + (node.w - w) / 2 - TAB_LINE_KNOCKOUT_PAD_X,
            y: node.y + (node.h - h) / 2,
            w: w + 2 * TAB_LINE_KNOCKOUT_PAD_X,
            h,
        });
    }
    if (!boxes.length) return;
    for (const m of vDoms) {
        if (m.tag !== 'measure') continue;
        const hits: VDomKnockout[] = [];
        for (const b of boxes) {
            if (b.x >= m.x + m.w || b.x + b.w <= m.x || b.y >= m.y + m.h || b.y + b.h <= m.y) continue;
            hits.push({x: b.x - m.x, y: b.y - m.y, w: b.w, h: b.h});
        }
        if (hits.length) m.knockouts = hits;
    }
}
