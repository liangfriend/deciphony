/**
 * 简谱倚音：NoteNumber 级（graceNotes / graceNotesAfter）；host 为主音 notesInfo 供八度/层对齐；时值/符杠取自倚音自身
 * 倚音符号一律在视觉坐标（缩放后）下排布，写入 VDom 前再换算为 center-scale 布局盒。
 */

import {VDom} from "@/types/common";
import type {NumberNotationSkinPack} from "@/types/common";
import type {NotesNumberInfo} from "@/types/MusicScoreType";
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
    getReduceLineLastLineY,
    getReduceLineSkinKey,
    getSyllableSkinKey,
} from "../utils/skinKey";
import {getInfoChronaxie} from "../utils/note";
import {floorCenterY} from "../utils/noteLayout";
import {
    GRACE_NOTE_SCALE,
    GRACE_OCTAVE_DOT_FIRST_OFFSET,
    GRACE_OCTAVE_DOT_SPACING,
    GRACE_REDUCE_LINE_Y_OFFSET,
    graceNoteSpacing,
    graceScaleCenterOffsetX,
    withGraceScale
} from "@/render/graceNote";
import {boxYForVisualTop, scaledSpan} from "@/render/vdomScale";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";

const S = GRACE_NOTE_SCALE;
const REDUCE_LINE_STROKE = 1;

type GracePedestalSide = 'before' | 'after';

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[vdom.tag] = vdom;
}

/** 视觉左上 + 皮肤尺寸 → center-scale 布局盒 */
function layoutBoxFromVisualTopLeft(
    visualLeft: number,
    visualTop: number,
    skinW: number,
    skinH: number,
): Pick<VDom, 'x' | 'y' | 'w' | 'h'> {
    return {
        x: visualLeft - graceScaleCenterOffsetX(skinW, S),
        y: boxYForVisualTop(visualTop, skinH, S),
        w: skinW,
        h: skinH,
    };
}

/** 视觉宽度可变（减时线）→ center-scale 布局盒 */
function layoutBoxFromVisualSpan(
    visualLeft: number,
    visualTop: number,
    visualWidth: number,
    skinH: number,
): Pick<VDom, 'x' | 'y' | 'w' | 'h'> {
    const w = visualWidth / S;
    return {
        x: visualLeft - w * (1 - S) / 2,
        y: boxYForVisualTop(visualTop, skinH, S),
        w,
        h: skinH,
    };
}

function pushGrace(out: VDom[], v: VDom): void {
    out.push(withGraceScale(v));
}

type GraceVisualNode = Omit<VDom, 'x' | 'y' | 'w' | 'h' | 'startPoint' | 'endPoint' | 'special'>;

function pushGraceVisual(
    out: VDom[],
    visualLeft: number,
    visualTop: number,
    skinW: number,
    skinH: number,
    node: GraceVisualNode,
): void {
    pushGrace(out, {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        ...layoutBoxFromVisualTopLeft(visualLeft, visualTop, skinW, skinH),
        ...node,
    });
}

/** 视觉左/右缘 → center-scale 布局盒 x（按该符号自身 skinW 补偿） */
function layoutXFromVisualLeft(visualLeft: number, skinW: number): number {
    return visualLeft - graceScaleCenterOffsetX(skinW, S);
}

function layoutXFromVisualRight(visualRight: number, skinW: number): number {
    return layoutXFromVisualLeft(visualRight - scaledSpan(skinW, S), skinW);
}

type GraceReduceSlot = {
    host: NotesNumberInfo;
    ni: NotesNumberInfo;
    visualLeft: number;
    visualRight: number;
    visualW: number;
    visualBottom: number;
};

function buildGraceReduceSlot(
    ni: NotesNumberInfo,
    host: NotesNumberInfo,
    noteVisualLeft: number,
    skin: NumberNotationSkinPack,
    measureY: number,
    measureHeight: number,
    floorIndex: number,
    floorSpan?: number[],
): GraceReduceSlot | null {
    const numSkin = skin[getSyllableSkinKey(ni.syllable)];
    if (!numSkin) return null;
    const hcy = floorCenterY(measureY, measureHeight, floorIndex, floorSpan);
    const noteVisualTop = hcy - numSkin.h / 2;
    const visualW = scaledSpan(numSkin.w, S);
    return {
        host,
        ni,
        visualLeft: noteVisualLeft,
        visualRight: noteVisualLeft + visualW,
        visualW,
        visualBottom: noteVisualTop + scaledSpan(numSkin.h, S),
    };
}

/** 变音号在数字左侧占用的视觉宽度（与 estimateGraceNotesNumberInfoWidth 一致） */
function leadingAccidentalVisualWidth(
    ni: NotesNumberInfo,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    if (!ni.accidental) return 0;
    const accSkin = skin[getAccidentalSkinKey(ni.accidental.type)];
    return scaledSpan(ACCIDENTAL_NOTE_X_GAP * measureHeight + (accSkin?.w ?? 0), S);
}

/** 整簇视觉左缘 → 数字头视觉左缘 */
function noteVisualLeftFromClusterLeft(
    ni: NotesNumberInfo,
    clusterVisualLeft: number,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    return clusterVisualLeft + leadingAccidentalVisualWidth(ni, skin, measureHeight);
}

/** 减时线视觉底边（最后一条线 stroke 下沿） */
function getGraceReduceLineVisualBottom(slot: GraceReduceSlot, measureHeight: number): number {
    const ch = getInfoChronaxie(slot.ni);
    const visualTop = slot.visualBottom + GRACE_REDUCE_LINE_Y_OFFSET * measureHeight;
    if (ch > 32) return visualTop;
    return visualTop + scaledSpan(getReduceLineLastLineY(ch) + REDUCE_LINE_STROKE, S);
}

/** 倚音托架顶边 y（视觉坐标）：贴减时线最后一条下边 */
function getGracePedestalVisualTop(slot: GraceReduceSlot, measureHeight: number): number {
    return getGraceReduceLineVisualBottom(slot, measureHeight);
}

/** 减时线绘制后：每条倚音各一条托架 */
function processGracePedestals(
    slots: GraceReduceSlot[],
    ctx: RenderGraceNumberCtx,
    side: GracePedestalSide,
): void {
    const {skin, skinName, zIndex, out, measureHeight} = ctx;
    const skinKey = side === 'before'
        ? NumberNotationSkinKeyEnum.Grace_pedestal_before
        : NumberNotationSkinKeyEnum.Grace_pedestal_after;
    const pedestalSkin = skin[skinKey];
    if (!pedestalSkin) return;

    for (const slot of slots) {
        const ni = slot.ni;
        if (ni.syllable === 0 || ni.syllable === 'X') continue;

        const targetTop = getGracePedestalVisualTop(slot, measureHeight);
        const pedW = pedestalSkin.w;
        const layoutX = side === 'before'
            ? layoutXFromVisualRight(slot.visualRight, pedW)
            : layoutXFromVisualLeft(slot.visualLeft, pedW);
        pushGrace(out, {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: layoutX,
            y: boxYForVisualTop(targetTop, pedestalSkin.h, S),
            w: pedW,
            h: pedestalSkin.h,
            zIndex,
            tag: 'gracePedestal',
            skinName,
            targetId: ni.id,
            skinKey,
            dataComment: side === 'before' ? '前倚音托架' : '后倚音托架',
        });
    }
}

/** 第二遍：倚音减时线连接（规则同 renderSymbol 主音符） */
function processGraceReduceLines(slots: GraceReduceSlot[], ctx: RenderGraceNumberCtx): void {
    const {skin, skinName, zIndex, out, measureHeight} = ctx;
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]!;
        const ni = slot.ni;
        const ch = getInfoChronaxie(ni);
        if (ch > 32) continue;
        const reduceLineKey = getReduceLineSkinKey(ch);
        const reduceLineSkin = skin[reduceLineKey];
        if (!reduceLineSkin) continue;

        const beamType = ni.beamType ?? BeamTypeEnum.None;
        const myCount = chronaxieToBeamLineCount(ch);
        let leftIdx = i;
        let rightIdx = i;
        if (beamType === BeamTypeEnum.Combined || beamType === BeamTypeEnum.OnlyRight) {
            if (beamType === BeamTypeEnum.Combined) {
                for (let j = i - 1; j >= 0; j--) {
                    const s = slots[j]!;
                    if (getInfoChronaxie(s.ni) > 32) break;
                    if (s.ni.beamType !== BeamTypeEnum.Combined) break;
                    leftIdx = j;
                }
            }
            for (let j = i + 1; j < slots.length; j++) {
                const s = slots[j]!;
                if (getInfoChronaxie(s.ni) > 32) break;
                if (s.ni.beamType !== BeamTypeEnum.Combined) break;
                rightIdx = j;
            }
        }
        const leftSlot = leftIdx < i ? slots[leftIdx]! : null;
        const rightSlot = rightIdx > i ? slots[rightIdx]! : null;
        const leftCount = leftSlot && getInfoChronaxie(leftSlot.ni) <= 32
            ? chronaxieToBeamLineCount(getInfoChronaxie(leftSlot.ni)) : Infinity;
        const rightCount = rightSlot && getInfoChronaxie(rightSlot.ni) <= 32
            ? chronaxieToBeamLineCount(getInfoChronaxie(rightSlot.ni)) : Infinity;

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
        const box = layoutBoxFromVisualSpan(visualLineLeft, targetReduceTop, visualLineRight - visualLineLeft, reduceLineSkin.h);
        pushGrace(out, {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            ...box, zIndex,
            tag: 'accidental', skinName, targetId: slot.ni.id,
            skinKey: reduceLineKey, dataComment: '倚音减时线',
        });
    }
}

/** 单条倚音 NotesNumberInfo 占位宽度（视觉缩放后） */
export function estimateGraceNotesNumberInfoWidth(
    ni: NotesNumberInfo,
    _host: NotesNumberInfo,
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
    if (ni.augmentationDot) {
        const augSkin = skin[getAugmentationDotSkinKey(ni.augmentationDot)];
        w += scaledSpan(AUGMENTATION_DOT_X_GAP * measureHeight + (augSkin?.w ?? 0), GRACE_NOTE_SCALE);
    }
    if (w <= 0) w = scaledSpan(skin[NumberNotationSkinKeyEnum.Number_1]?.w ?? 20, GRACE_NOTE_SCALE);
    return w;
}

function graceNotesNumberInfoGroupWidth(
    graceList: NotesNumberInfo[] | undefined,
    host: NotesNumberInfo,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    if (!graceList?.length) return 0;
    const gap = graceNoteSpacing(measureHeight);
    let total = gap;
    for (let i = 0; i < graceList.length; i++) {
        if (i > 0) total += gap;
        total += estimateGraceNotesNumberInfoWidth(graceList[i]!, host, skin, measureHeight);
    }
    return total;
}

export function graceNoteNumberBeforeWidth(
    graceNotes: NotesNumberInfo[] | undefined,
    host: NotesNumberInfo,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    return graceNotesNumberInfoGroupWidth(graceNotes, host, skin, measureHeight);
}

export function graceNoteNumberAfterWidth(
    graceNotesAfter: NotesNumberInfo[] | undefined,
    host: NotesNumberInfo,
    skin: NumberNotationSkinPack,
    measureHeight: number,
): number {
    return graceNotesNumberInfoGroupWidth(graceNotesAfter, host, skin, measureHeight);
}

export type RenderGraceNumberCtx = {
    measureY: number;
    measureHeight: number;
    floorIndex?: number;
    floorSpan?: number[];
    skin: NumberNotationSkinPack;
    skinName: string;
    zIndex: number;
    idMap: NodeIdMap;
    out: VDom[];
};

/** 在 noteVisualLeft 渲染一条倚音（不含减时线；减时线由 processGraceReduceLines 第二遍连接） */
export function renderGraceNotesNumberInfoAt(
    ni: NotesNumberInfo,
    host: NotesNumberInfo,
    noteVisualLeft: number,
    ctx: RenderGraceNumberCtx,
): void {
    const {measureY, measureHeight, floorIndex = 0, floorSpan, skin, skinName, zIndex, idMap, out} = ctx;
    const octaveDotSkin = skin[NumberNotationSkinKeyEnum.OctaveDot];
    const fOff = GRACE_OCTAVE_DOT_FIRST_OFFSET * measureHeight;
    const spacing = GRACE_OCTAVE_DOT_SPACING * measureHeight;

    const numKey = getSyllableSkinKey(ni.syllable);
    const numItem = skin[numKey];
    if (!numItem) return;
    const hcy = floorCenterY(measureY, measureHeight, floorIndex, floorSpan);
    const noteVisualTop = hcy - numItem.h / 2;
    const noteVisualBottom = noteVisualTop + scaledSpan(numItem.h, S);
    const noteVisualW = scaledSpan(numItem.w, S);

    if (ni.accidental) {
        const accSkinKey = getAccidentalSkinKey(ni.accidental.type);
        const accSkin = skin[accSkinKey];
        if (accSkin) {
            const accVisualW = scaledSpan(accSkin.w, S);
            const accVisualLeft = noteVisualLeft - ACCIDENTAL_NOTE_X_GAP * measureHeight - accVisualW;
            const accVisualTop = measureY + ACCIDENTAL_NOTE_Y_OFFSET * measureHeight;
            pushGraceVisual(out, accVisualLeft, accVisualTop, accSkin.w, accSkin.h, {
                zIndex,
                tag: 'accidental', skinName, targetId: ni.accidental.id ?? ni.id,
                skinKey: accSkinKey, dataComment: '倚音变音号',
            });
        }
    }

    pushGraceVisual(out, noteVisualLeft, noteVisualTop, numItem.w, numItem.h, {
        zIndex,
        tag: 'noteHead', skinName, targetId: ni.id, skinKey: numKey,
        dataComment: '倚音',
    });
    setNodeIdMap(idMap, ni.id, out[out.length - 1]!);

    if ((ni.syllable !== 0 && ni.syllable !== 'X') && (ni.octaveDot ?? 0) !== 0 && octaveDotSkin) {
        const dotCount = Math.abs(ni.octaveDot!);
        const dotVisualW = scaledSpan(octaveDotSkin.w, S);
        const dotVisualLeft = noteVisualLeft + (noteVisualW - dotVisualW) / 2;
        if (ni.octaveDot! > 0) {
            const dotVisualH = scaledSpan(octaveDotSkin.h, S);
            let targetDotTop = noteVisualTop - fOff - dotVisualH;
            for (let k = 0; k < dotCount; k++) {
                pushGraceVisual(out, dotVisualLeft, targetDotTop, octaveDotSkin.w, octaveDotSkin.h, {
                    zIndex,
                    tag: 'accidental',
                    skinName,
                    targetId: ni.id,
                    skinKey: NumberNotationSkinKeyEnum.OctaveDot,
                    dataComment: '倚音八度点',
                });
                targetDotTop -= dotVisualH + spacing;
            }
        } else {
            let baseBottom: number;
            const ch = getInfoChronaxie(ni);
            if (ch <= 32) {
                const reduceLineSkin = skin[getReduceLineSkinKey(ch)];
                const reduceVisualTop = noteVisualBottom + GRACE_REDUCE_LINE_Y_OFFSET * measureHeight;
                baseBottom = reduceVisualTop + scaledSpan(reduceLineSkin?.h ?? 0, S);
            } else {
                baseBottom = noteVisualBottom;
            }
            const dotVisualH = scaledSpan(octaveDotSkin.h, S);
            let targetDotTop = baseBottom + fOff;
            for (let k = 0; k < dotCount; k++) {
                pushGraceVisual(out, dotVisualLeft, targetDotTop, octaveDotSkin.w, octaveDotSkin.h, {
                    zIndex,
                    tag: 'accidental',
                    skinName,
                    targetId: ni.id,
                    skinKey: NumberNotationSkinKeyEnum.OctaveDot,
                    dataComment: '倚音八度点',
                });
                targetDotTop += dotVisualH + spacing;
            }
        }
    }

    if (ni.augmentationDot) {
        const augSkinKey = getAugmentationDotSkinKey(ni.augmentationDot);
        const augSkin = skin[augSkinKey];
        if (augSkin && ni.syllable !== 0 && ni.syllable !== 'X') {
            const augVisualLeft = noteVisualLeft + noteVisualW + AUGMENTATION_DOT_X_GAP * measureHeight;
            const augVisualTop = hcy + AUGMENTATION_DOT_Y_OFFSET * measureHeight - scaledSpan(augSkin.h, S) / 2;
            pushGraceVisual(out, augVisualLeft, augVisualTop, augSkin.w, augSkin.h, {
                zIndex,
                tag: 'accidental', skinName, targetId: ni.augmentationDot.id,
                skinKey: augSkinKey, dataComment: '倚音附点',
            });
        }
    }
}

/** 前置倚音：index0 靠主音，整体向左扩散 */
export function renderGraceNotesNumberBefore(
    graceNotes: NotesNumberInfo[] | undefined,
    host: NotesNumberInfo,
    mainHeadX: number,
    ctx: RenderGraceNumberCtx,
): void {
    if (!graceNotes?.length) return;
    const gap = graceNoteSpacing(ctx.measureHeight);
    const reduceSlots: GraceReduceSlot[] = [];
    let clusterVisualRight = mainHeadX - gap;
    for (let i = 0; i < graceNotes.length; i++) {
        const ni = graceNotes[i]!;
        const gw = estimateGraceNotesNumberInfoWidth(ni, host, ctx.skin, ctx.measureHeight);
        const clusterVisualLeft = clusterVisualRight - gw;
        const noteVisualLeft = noteVisualLeftFromClusterLeft(ni, clusterVisualLeft, ctx.skin, ctx.measureHeight);
        renderGraceNotesNumberInfoAt(ni, host, noteVisualLeft, ctx);
        const slot = buildGraceReduceSlot(
            ni, host, noteVisualLeft, ctx.skin, ctx.measureY, ctx.measureHeight, ctx.floorIndex ?? 0, ctx.floorSpan,
        );
        if (slot) reduceSlots.unshift(slot);
        if (i < graceNotes.length - 1) clusterVisualRight = clusterVisualLeft - gap;
    }
    processGraceReduceLines(reduceSlots, ctx);
    processGracePedestals(reduceSlots, ctx, 'before');
}

/** 后置倚音：向右扩散 */
export function renderGraceNotesNumberAfter(
    graceNotesAfter: NotesNumberInfo[] | undefined,
    host: NotesNumberInfo,
    mainHeadX: number,
    mainHeadW: number,
    ctx: RenderGraceNumberCtx,
): void {
    if (!graceNotesAfter?.length) return;
    const gap = graceNoteSpacing(ctx.measureHeight);
    const reduceSlots: GraceReduceSlot[] = [];
    let noteVisualLeft = mainHeadX + mainHeadW + gap;
    for (let i = 0; i < graceNotesAfter.length; i++) {
        const ni = graceNotesAfter[i]!;
        renderGraceNotesNumberInfoAt(ni, host, noteVisualLeft, ctx);
        const slot = buildGraceReduceSlot(
            ni, host, noteVisualLeft, ctx.skin, ctx.measureY, ctx.measureHeight, ctx.floorIndex ?? 0, ctx.floorSpan,
        );
        if (slot) reduceSlots.push(slot);
        noteVisualLeft += estimateGraceNotesNumberInfoWidth(ni, host, ctx.skin, ctx.measureHeight) + gap;
    }
    processGraceReduceLines(reduceSlots, ctx);
    processGracePedestals(reduceSlots, ctx, 'after');
}
