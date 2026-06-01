/**
 * 简谱倚音：NotesNumberInfo 级（graceNotes 挂在主音 notesInfo 上）；时值/符杠取自父 NoteNumber
 */

import {VDom} from "@/types/common";
import type {NumberNotationSkinPack} from "@/types/common";
import type {AugmentationDot, NoteNumber, NotesNumberInfo} from "@/types/MusicScoreType";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {
    ACCIDENTAL_NOTE_X_GAP,
    ACCIDENTAL_NOTE_Y_OFFSET,
    AUGMENTATION_DOT_X_GAP,
    AUGMENTATION_DOT_Y_OFFSET,
} from "../constants";
import {
    chronaxieToBeamLineCount,
    getAccidentalSkinKey,
    getAugmentationDotSkinKey,
    getReduceLineSkinKey,
    getSyllableSkinKey,
} from "../utils/skinKey";
import {noteCenterY} from "../utils/noteLayout";
import {
    GRACE_NOTE_SCALE,
    GRACE_OCTAVE_DOT_FIRST_OFFSET,
    GRACE_OCTAVE_DOT_SPACING,
    GRACE_REDUCE_LINE_Y_OFFSET,
    graceNoteSpacing,
    withGraceScale
} from "@/render/graceNote";
import {boxYForVisualTop, scaledSpan, visualBottomFromBox, visualTopFromBox} from "@/render/vdomScale";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";

const S = GRACE_NOTE_SCALE;

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[vdom.tag] = vdom;
}

function graceBoxY(targetVisualTop: number, h: number): number {
    return boxYForVisualTop(targetVisualTop, h, S);
}

/** center 缩放：视觉宽度 → 布局盒 (x,w) */
function layoutBoxForVisualSpan(visualLeft: number, visualWidth: number, h: number): {
    x: number;
    w: number;
    h: number
} {
    const w = visualWidth / S;
    return {x: visualLeft - w * (1 - S) / 2, w, h};
}

function pushGrace(out: VDom[], v: VDom): void {
    out.push(withGraceScale(v));
}

type GraceReduceSlot = {
    parent: NoteNumber;
    ni: NotesNumberInfo;
    visualLeft: number;
    visualRight: number;
    visualW: number;
    visualBottom: number;
};

function buildGraceReduceSlot(
    ni: NotesNumberInfo,
    parent: NoteNumber,
    headX: number,
    skin: NumberNotationSkinPack,
    measureY: number,
    measureHeight: number,
): GraceReduceSlot | null {
    const numSkin = skin[getSyllableSkinKey(ni.syllable)];
    if (!numSkin) return null;
    const numW = numSkin.w;
    const numH = numSkin.h;
    const hcy = noteCenterY(measureY, measureHeight, 0, numH);
    const ny = boxYForVisualTop(hcy - numH / 2, numH, S);
    const visualW = scaledSpan(numW, S);
    const visualLeft = headX + numW * (1 - S) / 2;
    return {
        parent,
        ni,
        visualLeft,
        visualRight: visualLeft + visualW,
        visualW,
        visualBottom: visualBottomFromBox(ny, numH, S),
    };
}

/** 第二遍：倚音减时线连接（规则同 renderSymbol 主音符） */
function processGraceReduceLines(slots: GraceReduceSlot[], ctx: RenderGraceNumberCtx): void {
    const {skin, skinName, zIndex, out, measureHeight} = ctx;
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]!;
        const parent = slot.parent;
        if (parent.chronaxie > 32) continue;
        const reduceLineKey = getReduceLineSkinKey(parent.chronaxie);
        const reduceLineSkin = skin[reduceLineKey];
        if (!reduceLineSkin) continue;

        const beamType = parent.beamType ?? BeamTypeEnum.None;
        const myCount = chronaxieToBeamLineCount(parent.chronaxie);
        let leftIdx = i;
        let rightIdx = i;
        if (beamType === BeamTypeEnum.Combined || beamType === BeamTypeEnum.OnlyRight) {
            if (beamType === BeamTypeEnum.Combined) {
                for (let j = i - 1; j >= 0; j--) {
                    const s = slots[j]!;
                    if (s.parent.chronaxie > 32) break;
                    if (s.parent.beamType !== BeamTypeEnum.Combined) break;
                    leftIdx = j;
                }
            }
            for (let j = i + 1; j < slots.length; j++) {
                const s = slots[j]!;
                if (s.parent.chronaxie > 32) break;
                if (s.parent.beamType !== BeamTypeEnum.Combined) break;
                rightIdx = j;
            }
        }
        const leftSlot = leftIdx < i ? slots[i - 1]! : null;
        const rightSlot = rightIdx > i ? slots[i + 1]! : null;
        const leftCount = leftSlot && leftSlot.parent.chronaxie <= 32
            ? chronaxieToBeamLineCount(leftSlot.parent.chronaxie) : Infinity;
        const rightCount = rightSlot && rightSlot.parent.chronaxie <= 32
            ? chronaxieToBeamLineCount(rightSlot.parent.chronaxie) : Infinity;

        let visualLineLeft = slot.visualLeft;
        let visualLineRight = slot.visualRight;
        if (myCount < leftCount && leftSlot) {
            visualLineLeft = leftSlot.visualRight;
        }
        if (myCount <= rightCount && rightSlot) {
            visualLineRight = rightSlot.visualRight;
        }
        visualLineRight = Math.max(visualLineRight, visualLineLeft + slot.visualW);

        const targetReduceTop = slot.visualBottom + GRACE_REDUCE_LINE_Y_OFFSET * measureHeight;
        const box = layoutBoxForVisualSpan(visualLineLeft, visualLineRight - visualLineLeft, reduceLineSkin.h);
        pushGrace(out, {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: box.x, y: graceBoxY(targetReduceTop, reduceLineSkin.h), w: box.w, h: box.h, zIndex,
            tag: 'accidental', skinName, targetId: slot.ni.id,
            skinKey: reduceLineKey, dataComment: '倚音减时线',
        });
    }
}

/** 单条倚音 NotesNumberInfo 占位宽度（视觉缩放后） */
export function estimateGraceNotesNumberInfoWidth(
    ni: NotesNumberInfo,
    parent: NoteNumber,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    let w = 0;
    const numSkin = skin[getSyllableSkinKey(ni.syllable)];
    if (numSkin) w = scaledSpan(numSkin.w, GRACE_NOTE_SCALE);
    if (ni.accidental) {
        const accSkin = skin[getAccidentalSkinKey(ni.accidental.type)];
        w += scaledSpan(ACCIDENTAL_NOTE_X_GAP * measureHeight + (accSkin?.w ?? 0), GRACE_NOTE_SCALE);
    }
    if (parent.augmentationDot) {
        const augSkin = skin[getAugmentationDotSkinKey(parent.augmentationDot)];
        w += scaledSpan(AUGMENTATION_DOT_X_GAP * measureHeight + (augSkin?.w ?? 0), GRACE_NOTE_SCALE);
    }
    if (w <= 0) w = scaledSpan(skin[NumberNotationSkinKeyEnum.Number_1]?.w ?? 20, GRACE_NOTE_SCALE);
    return w;
}

function graceNotesNumberInfoGroupWidth(
    graceList: NotesNumberInfo[] | undefined,
    parent: NoteNumber,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    if (!graceList?.length) return 0;
    const gap = graceNoteSpacing(measureHeight);
    let total = gap;
    for (let i = 0; i < graceList.length; i++) {
        if (i > 0) total += gap;
        total += estimateGraceNotesNumberInfoWidth(graceList[i]!, parent, skin, measureHeight);
    }
    return total;
}

export function graceNoteNumberBeforeWidth(
    graceNotes: NotesNumberInfo[] | undefined,
    parent: NoteNumber,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    return graceNotesNumberInfoGroupWidth(graceNotes, parent, skin, measureHeight);
}

export function graceNoteNumberAfterWidth(
    graceNotesAfter: NotesNumberInfo[] | undefined,
    parent: NoteNumber,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    return graceNotesNumberInfoGroupWidth(graceNotesAfter, parent, skin, measureHeight);
}

export type RenderGraceNumberCtx = {
    measureY: number;
    measureHeight: number;
    skin: NumberNotationSkinPack;
    skinName: string;
    zIndex: number;
    idMap: NodeIdMap;
    out: VDom[];
};

/** 在 headX 渲染一条倚音（不含减时线；减时线由 processGraceReduceLines 第二遍连接） */
export function renderGraceNotesNumberInfoAt(
    ni: NotesNumberInfo,
    parent: NoteNumber,
    headX: number,
    ctx: RenderGraceNumberCtx,
): void {
    const {measureY, measureHeight, skin, skinName, zIndex, idMap, out} = ctx;
    const octaveDotSkin = skin[NumberNotationSkinKeyEnum.OctaveDot];
    const fOff = GRACE_OCTAVE_DOT_FIRST_OFFSET * measureHeight;
    const spacing = GRACE_OCTAVE_DOT_SPACING * measureHeight;

    const numKey = getSyllableSkinKey(ni.syllable);
    const numItem = skin[numKey];
    if (!numItem) return;
    const hcy = noteCenterY(measureY, measureHeight, 0, numItem.h);
    const mainNy = hcy - numItem.h / 2;
    const ny = boxYForVisualTop(mainNy, numItem.h, S);
    const noteVisualBottom = visualBottomFromBox(ny, numItem.h, S);

    if (ni.accidental) {
        const accSkinKey = getAccidentalSkinKey(ni.accidental.type);
        const accSkin = skin[accSkinKey];
        if (accSkin) {
            const mainAccY = measureY + ACCIDENTAL_NOTE_Y_OFFSET * measureHeight;
            pushGrace(out, {
                startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                x: headX - ACCIDENTAL_NOTE_X_GAP * measureHeight - accSkin.w,
                y: boxYForVisualTop(mainAccY, accSkin.h, S),
                w: accSkin.w, h: accSkin.h, zIndex,
                tag: 'accidental', skinName, targetId: ni.accidental.id ?? ni.id,
                skinKey: accSkinKey, dataComment: '倚音变音号',
            });
        }
    }

    pushGrace(out, {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: headX, y: ny, w: numItem.w, h: numItem.h, zIndex,
        tag: 'noteHead', skinName, targetId: ni.id, skinKey: numKey,
        dataComment: '倚音',
    });
    setNodeIdMap(idMap, ni.id, out[out.length - 1]!);

    if ((ni.syllable !== 0 && ni.syllable !== 'X') && (ni.octaveDot ?? 0) !== 0 && octaveDotSkin) {
        const dotCount = Math.abs(ni.octaveDot!);
        const dotX = headX + (numItem.w - octaveDotSkin.w) / 2;
        if (ni.octaveDot! > 0) {
            const dotH = scaledSpan(octaveDotSkin.h, S);
            let targetDotTop = visualTopFromBox(ny, numItem.h, S) - fOff - dotH;
            for (let k = 0; k < dotCount; k++) {
                pushGrace(out, {
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: dotX,
                    y: graceBoxY(targetDotTop, octaveDotSkin.h),
                    w: octaveDotSkin.w,
                    h: octaveDotSkin.h,
                    zIndex,
                    tag: 'accidental',
                    skinName,
                    targetId: ni.id,
                    skinKey: NumberNotationSkinKeyEnum.OctaveDot,
                    dataComment: '倚音八度点',
                });
                targetDotTop -= dotH + spacing;
            }
        } else {
            let baseBottom: number;
            if (parent.chronaxie <= 32) {
                const reduceLineSkin = skin[getReduceLineSkinKey(parent.chronaxie)];
                const reduceVisualTop = noteVisualBottom + GRACE_REDUCE_LINE_Y_OFFSET * measureHeight;
                baseBottom = reduceVisualTop + scaledSpan(reduceLineSkin?.h ?? 0, S);
            } else {
                baseBottom = noteVisualBottom;
            }
            const dotH = scaledSpan(octaveDotSkin.h, S);
            let targetDotTop = baseBottom + fOff;
            for (let k = 0; k < dotCount; k++) {
                pushGrace(out, {
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: dotX,
                    y: graceBoxY(targetDotTop, octaveDotSkin.h),
                    w: octaveDotSkin.w,
                    h: octaveDotSkin.h,
                    zIndex,
                    tag: 'accidental',
                    skinName,
                    targetId: ni.id,
                    skinKey: NumberNotationSkinKeyEnum.OctaveDot,
                    dataComment: '倚音八度点',
                });
                targetDotTop += dotH + spacing;
            }
        }
    }

    if (parent.augmentationDot) {
        const augSkinKey = getAugmentationDotSkinKey(parent.augmentationDot as AugmentationDot);
        const augSkin = skin[augSkinKey];
        const num1 = skin[NumberNotationSkinKeyEnum.Number_1];
        if (augSkin && num1 && ni.syllable !== 0 && ni.syllable !== 'X') {
            const augX = headX + num1.w + AUGMENTATION_DOT_X_GAP * measureHeight;
            const augY = hcy + AUGMENTATION_DOT_Y_OFFSET * measureHeight - augSkin.h / 2;
            pushGrace(out, {
                startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                x: augX, y: augY, w: augSkin.w, h: augSkin.h, zIndex,
                tag: 'accidental', skinName, targetId: parent.augmentationDot!.id,
                skinKey: augSkinKey, dataComment: '倚音附点',
            });
        }
    }
}

/** 前置倚音：index0 靠主音，整体向左扩散 */
export function renderGraceNotesNumberBefore(
    graceNotes: NotesNumberInfo[] | undefined,
    parent: NoteNumber,
    mainHeadX: number,
    ctx: RenderGraceNumberCtx,
): void {
    if (!graceNotes?.length) return;
    const gap = graceNoteSpacing(ctx.measureHeight);
    const reduceSlots: GraceReduceSlot[] = [];
    let x = mainHeadX - gap;
    for (let i = 0; i < graceNotes.length; i++) {
        const ni = graceNotes[i]!;
        const gw = estimateGraceNotesNumberInfoWidth(ni, parent, ctx.skin, ctx.measureHeight);
        x -= gw;
        renderGraceNotesNumberInfoAt(ni, parent, x, ctx);
        const slot = buildGraceReduceSlot(ni, parent, x, ctx.skin, ctx.measureY, ctx.measureHeight);
        if (slot) reduceSlots.unshift(slot);
        if (i < graceNotes.length - 1) x -= gap;
    }
    processGraceReduceLines(reduceSlots, ctx);
}

/** 后置倚音：向右扩散 */
export function renderGraceNotesNumberAfter(
    graceNotesAfter: NotesNumberInfo[] | undefined,
    parent: NoteNumber,
    mainHeadX: number,
    mainRefW: number,
    ctx: RenderGraceNumberCtx,
): void {
    if (!graceNotesAfter?.length) return;
    const gap = graceNoteSpacing(ctx.measureHeight);
    const reduceSlots: GraceReduceSlot[] = [];
    let x = mainHeadX + mainRefW + gap;
    for (let i = 0; i < graceNotesAfter.length; i++) {
        const ni = graceNotesAfter[i]!;
        renderGraceNotesNumberInfoAt(ni, parent, x, ctx);
        const slot = buildGraceReduceSlot(ni, parent, x, ctx.skin, ctx.measureY, ctx.measureHeight);
        if (slot) reduceSlots.push(slot);
        x += estimateGraceNotesNumberInfoWidth(ni, parent, ctx.skin, ctx.measureHeight) + gap;
    }
    processGraceReduceLines(reduceSlots, ctx);
}
