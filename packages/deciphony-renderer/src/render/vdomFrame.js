import { NoteSymbolTypeEnum } from '@/enums/musicScoreEnum';
const ZERO_FRAME = {
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
};
function isNoteNumber(slot) {
    return !('type' in slot);
}
function frameOf(frame) {
    return {
        relativeX: frame?.relativeX ?? 0,
        relativeY: frame?.relativeY ?? 0,
        relativeW: frame?.relativeW ?? 0,
        relativeH: frame?.relativeH ?? 0,
    };
}
function mergeFrames(...frames) {
    return frames.reduce((acc, frame) => {
        const cur = frameOf(frame);
        acc.relativeX += cur.relativeX;
        acc.relativeY += cur.relativeY;
        acc.relativeW += cur.relativeW;
        acc.relativeH += cur.relativeH;
        return acc;
    }, { ...ZERO_FRAME });
}
function registerFrame(map, id, ...frames) {
    if (!id)
        return;
    map.set(id, mergeFrames(...frames));
}
function registerAccidental(map, accidental, ...parents) {
    if (!accidental)
        return;
    registerFrame(map, accidental.id, ...parents, accidental);
}
function registerAugmentationDot(map, dot, ...parents) {
    if (!dot)
        return;
    registerFrame(map, dot.id, ...parents, dot);
}
function registerSingleNoteAffiliatedSymbols(map, symbols, ...parents) {
    for (const sym of symbols ?? []) {
        registerFrame(map, sym.id, ...parents, sym);
    }
}
function registerNotesInfo(map, info, ...parents) {
    const frame = mergeFrames(...parents, info);
    registerFrame(map, info.id, frame);
    registerAccidental(map, info.accidental, frame);
    registerAugmentationDot(map, info.augmentationDot, frame);
    registerSingleNoteAffiliatedSymbols(map, info.affiliatedSymbols, frame);
}
function registerStandardGraceNotes(map, notes, ...parents) {
    for (const info of notes ?? []) {
        registerNotesInfo(map, info, ...parents);
    }
}
function registerNoteSymbol(map, note) {
    registerFrame(map, note.id, note);
    // 上下加线 targetId 为 NotesInfo.id（见 registerNotesInfo），apply 时仅施加 relativeX
    if (note.clef) {
        registerFrame(map, note.clef.id, note, note.clef);
    }
    for (const info of note.notesInfo) {
        registerNotesInfo(map, info, note);
    }
    registerStandardGraceNotes(map, note.graceNotes, note);
    registerStandardGraceNotes(map, note.graceNotesAfter, note);
}
function registerNoteRest(map, rest) {
    registerFrame(map, rest.id, rest);
    if (rest.clef) {
        registerFrame(map, rest.clef.id, rest, rest.clef);
    }
    registerAugmentationDot(map, rest.augmentationDot, rest);
    registerSingleNoteAffiliatedSymbols(map, rest.affiliatedSymbols, rest);
}
function registerNotesNumberInfo(map, info, ...parents) {
    const frame = mergeFrames(...parents);
    registerFrame(map, info.id, frame);
    registerAccidental(map, info.accidental, frame);
    for (const grace of info.graceNotes ?? []) {
        registerNotesNumberInfo(map, grace, frame);
    }
    for (const grace of info.graceNotesAfter ?? []) {
        registerNotesNumberInfo(map, grace, frame);
    }
}
function registerNoteNumber(map, note) {
    registerFrame(map, note.id, note);
    registerAugmentationDot(map, note.augmentationDot, note);
    registerSingleNoteAffiliatedSymbols(map, note.affiliatedSymbols, note);
    for (const info of note.notesInfo) {
        registerNotesNumberInfo(map, info, note);
    }
}
function registerMeasure(map, measure) {
    registerFrame(map, measure.id, measure);
    registerFrame(map, measure.barline_f?.id, measure.barline_f);
    registerFrame(map, measure.barline_b?.id, measure.barline_b);
    registerFrame(map, measure.clef_f?.id, measure.clef_f);
    registerFrame(map, measure.clef_b?.id, measure.clef_b);
    registerFrame(map, measure.keySignature_f?.id, measure.keySignature_f);
    registerFrame(map, measure.keySignature_b?.id, measure.keySignature_b);
    registerFrame(map, measure.timeSignature_f?.id, measure.timeSignature_f);
    registerFrame(map, measure.timeSignature_b?.id, measure.timeSignature_b);
    registerFrame(map, measure.startRepeat?.id, measure.startRepeat);
    registerFrame(map, measure.endRepeat?.id, measure.endRepeat);
    for (const sym of measure.affiliatedSymbols ?? []) {
        registerFrame(map, sym.id, sym);
    }
    for (const slot of measure.notes) {
        if (isNoteNumber(slot)) {
            registerNoteNumber(map, slot);
        }
        else if (slot.type === NoteSymbolTypeEnum.Rest) {
            registerNoteRest(map, slot);
        }
        else {
            registerNoteSymbol(map, slot);
        }
    }
}
/**
 * 从曲谱树收集「id → 累计 Frame 偏移」。
 *
 * 级联规则（子级在 map 中的值为祖先 Frame 之和 + 自身 Frame，见 registerFrame / mergeFrames）：
 * - NoteSymbol：自身 → 各 NotesInfo → 变音号 / 附点 / 单音附属符号 / 倚音 NotesInfo 链；
 *   上下加线（vDom addLine，targetId=extreme NotesInfo.id / 倚音 NotesInfo.id）走 NotesInfo 链累计 Frame，
 *   apply 时仅 relativeX（Y 随小节 region 布局，X 随音符头）
 * - NoteRest：自身 → 附点、单音附属、谱号
 * - NoteNumber（简谱）：自身 → 各 NotesNumberInfo → 变音号、倚音链
 * - Measure：自身；小节线 / 谱号 / 调号 / 拍号 / 反复记号 / 单小节附属 仅合并各自对象（不继承 measure 的 relative，除非将来改 registerMeasure）
 * - GrandStaff / SingleStaff / Bracket：仅各自 id
 *
 * 布局用 targetId（如 `g-${grandStaffId}`）与曲谱 id 不一致时，Frame 不会自动作用到插槽 vDom，需改 targetId 或 register 逻辑。
 */
export function collectRelativeFrameMap(musicScore) {
    const map = new Map();
    for (const grandStaff of musicScore.grandStaffs) {
        registerFrame(map, grandStaff.id, grandStaff);
        registerFrame(map, grandStaff.bracket?.id, grandStaff.bracket);
        for (const staff of grandStaff.staves) {
            registerFrame(map, staff.id, staff);
            for (const measure of staff.measures) {
                registerMeasure(map, measure);
            }
        }
    }
    for (const sym of musicScore.affiliatedSymbols ?? []) {
        registerFrame(map, sym.id, sym);
    }
    return map;
}
export function applyRelativeFrameToVDom(node, frame) {
    const f = frameOf(frame);
    /**
     * 五线谱上下加线（skinKey addLine_u / addLine_d）较特殊：Y 由小节内 region 布局（跟随小节），
     * X 与音符头水平对齐；故级联 Frame 只施加 relativeX，忽略 relativeY / relativeW / relativeH。
     * 简谱无上下加线，其加时线等 tag=addLine 的 vDom 走常规模板。
     */
    if (node.tag === 'addLine'
        && (node.skinKey === 'addLine_u' || node.skinKey === 'addLine_d')) {
        if (f.relativeX === 0)
            return node;
        node.x += f.relativeX;
        return node;
    }
    if (f.relativeX === 0 && f.relativeY === 0 && f.relativeW === 0 && f.relativeH === 0) {
        return node;
    }
    node.x += f.relativeX;
    node.y += f.relativeY;
    node.w += f.relativeW;
    node.h += f.relativeH;
    if (f.relativeX !== 0 || f.relativeY !== 0) {
        if (node.tag === 'noteBeam' || node.special?.slur) {
            node.startPoint = {
                x: node.startPoint.x + f.relativeX,
                y: node.startPoint.y + f.relativeY,
            };
            node.endPoint = {
                x: node.endPoint.x + f.relativeX,
                y: node.endPoint.y + f.relativeY,
            };
        }
        if (node.special?.beam) {
            node.special.beam.centerX += f.relativeX;
        }
    }
    return node;
}
/**
 * 对 vDoms[startIndex, endIndex) 中具备 targetId 的节点，按 frameMap 累计值平移/扩缩几何（x/y/w/h）。
 * 连音线（special.slur）、符杠（tag noteBeam + special.beam）会同步平移 startPoint/endPoint 与 centerX。
 * applied：已处理过的节点引用，用于多阶段 apply 时避免对同一 vDom 重复叠加偏移。
 *
 * musicScoreToVDom 不在全曲渲染结束后只调用一次本函数，原因见 standardStaff/musicScoreToVDomImpl：
 * processBeam/processGraceBeam 依赖已偏移的 noteStem 接点生成 noteBeam，且 noteBeam 通常无 targetId；
 * 连音线在符号偏移后才取 noteHead 锚点；连谱号等布局 vDom 晚于小节符号才创建。
 */
export function applyRelativeFramesToVDomRange(nodes, frameMap, startIndex = 0, endIndex = nodes.length, applied) {
    const end = Math.min(endIndex, nodes.length);
    for (let i = startIndex; i < end; i++) {
        const node = nodes[i];
        if (!node?.targetId || applied?.has(node))
            continue;
        const frame = frameMap.get(node.targetId);
        if (!frame)
            continue;
        applyRelativeFrameToVDom(node, frame);
        applied?.add(node);
    }
}
/** 对整棵 vDom 树施加相对偏移；曲谱主流程请用分阶段 apply（见 musicScoreToVDomImpl），勿假定末尾一次即可 */
export function applyRelativeFramesToVDoms(nodes, frameMap, startIndex = 0, applied) {
    applyRelativeFramesToVDomRange(nodes, frameMap, startIndex, nodes.length, applied);
}
