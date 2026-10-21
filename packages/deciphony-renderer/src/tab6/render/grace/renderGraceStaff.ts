/**
 * 吉他谱倚音：TabNote 级（graceNotes / graceNotesAfter）；音符与主音等大，减时线 + 托架（简谱式 beamType 连接）。
 */

import {VDom} from "@/types/common";
import type {Tab6SkinPack} from "@/types/common";
import type {TabNote, TabNoteInfo} from "@/types/MusicScoreType";
import {Tab6SkinKeyEnum} from "@/tab6/enums/tab6SkinKeyEnum";
import type {NodeIdMap} from "../types";
import {AUGMENTATION_DOT_GAP} from "../constants";
import {
    chronaxieToBeamLineCount,
    getAugmentationDotSkinKey,
    getReduceLineLastLineY,
    getReduceLineSkinKey,
    getTabNoteHeadSkinKey,
} from "../utils/skinKey";
import {getRenderableAugmentationDot} from "../utils/note";
import {getTabNoteInfoRegion, isTabNoteHeadInfo} from "../utils/tabNoteInfo";
import {GRACE_REDUCE_LINE_Y_OFFSET, graceNoteSpacing} from "@/render/graceNote";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";

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

type GraceReduceSlot = {
    ni: TabNoteInfo;
    visualLeft: number;
    visualRight: number;
    visualW: number;
    noteBottom: number;
};

function buildGraceReduceSlot(
    ni: TabNoteInfo,
    noteLeft: number,
    noteCenterY: (region: number) => number,
    skin: Tab6SkinPack,
): GraceReduceSlot | null {
    if (!isTabNoteHeadInfo(ni)) return null;
    const headSkin = skin[getTabNoteHeadSkinKey(ni)];
    if (!headSkin) return null;
    const region = getTabNoteInfoRegion(ni);
    const noteTop = noteCenterY(region) - headSkin.h / 2;
    return {
        ni,
        visualLeft: noteLeft,
        visualRight: noteLeft + headSkin.w,
        visualW: headSkin.w,
        noteBottom: noteTop + headSkin.h,
    };
}

function getGraceReduceLineBottom(slot: GraceReduceSlot, measureHeight: number): number {
    const ch = slot.ni.chronaxie;
    const lineTop = slot.noteBottom + GRACE_REDUCE_LINE_Y_OFFSET * measureHeight;
    if (ch > 32) return lineTop;
    return lineTop + getReduceLineLastLineY(ch) + REDUCE_LINE_STROKE;
}

function getGracePedestalTop(slot: GraceReduceSlot, measureHeight: number): number {
    return getGraceReduceLineBottom(slot, measureHeight);
}

function processGracePedestals(
    slots: GraceReduceSlot[],
    ctx: RenderGraceTabCtx,
    side: GracePedestalSide,
): void {
    const {skin, skinName, zIndex, out, measureHeight} = ctx;
    const skinKey = side === 'before'
        ? Tab6SkinKeyEnum.Grace_pedestal_before
        : Tab6SkinKeyEnum.Grace_pedestal_after;
    const pedestalSkin = skin[skinKey];
    if (!pedestalSkin) return;

    for (const slot of slots) {
        if (!isTabNoteHeadInfo(slot.ni)) continue;
        const pedW = pedestalSkin.w;
        const x = side === 'before'
            ? slot.visualRight - pedW
            : slot.visualLeft;
        out.push({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x,
            y: getGracePedestalTop(slot, measureHeight),
            w: pedW,
            h: pedestalSkin.h,
            zIndex,
            tag: 'gracePedestal',
            skinName,
            targetId: slot.ni.id,
            skinKey,
            dataComment: side === 'before' ? '前倚音托架' : '后倚音托架',
        });
    }
}

function processGraceReduceLines(slots: GraceReduceSlot[], ctx: RenderGraceTabCtx): void {
    const {skin, skinName, zIndex, out, measureHeight} = ctx;
    const lineCount = (slot: GraceReduceSlot): number =>
        slot.ni.chronaxie > 32 ? 0 : chronaxieToBeamLineCount(slot.ni.chronaxie);
    const pushReduceLine = (slot: GraceReduceSlot, count: number, left: number, right: number) => {
        const reduceLineKey = getReduceLineSkinKey(64 >> Math.min(Math.max(count, 1), 6));
        const reduceLineSkin = skin[reduceLineKey];
        if (!reduceLineSkin) return;
        out.push({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: left,
            y: slot.noteBottom + GRACE_REDUCE_LINE_Y_OFFSET * measureHeight,
            w: right - left,
            h: reduceLineSkin.h,
            zIndex,
            tag: 'accidental',
            skinName,
            targetId: slot.ni.id,
            skinKey: reduceLineKey,
            dataComment: '倚音减时线',
        });
    };
    // 每个倚音画自己的条数；相连（左 Combined / OnlyRight、右 Combined）时只补两音之间的空隙，取较少条数。
    // 各段首尾相接不重叠：重叠处抗锯齿边缘会合成两次而发深
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]!;
        const count = lineCount(slot);
        if (!count) continue;
        const ownRight = Math.max(slot.visualRight, slot.visualLeft + slot.visualW);
        pushReduceLine(slot, count, slot.visualLeft, ownRight);

        const next = slots[i + 1];
        const nextCount = next ? lineCount(next) : 0;
        if (!next || !nextCount) continue;
        const beamType = slot.ni.beamType ?? BeamTypeEnum.None;
        if (beamType !== BeamTypeEnum.Combined && beamType !== BeamTypeEnum.OnlyRight) continue;
        if (next.ni.beamType !== BeamTypeEnum.Combined) continue;
        if (next.visualLeft > ownRight) pushReduceLine(slot, Math.min(count, nextCount), ownRight, next.visualLeft);
    }
}

/** 单条倚音占位宽度（与主音等大，无缩放） */
export function estimateGraceTabNoteInfoWidth(
    ni: TabNoteInfo,
    skin: Tab6SkinPack,
    measureHeight: number,
): number {
    const headItem = skin[getTabNoteHeadSkinKey(ni)];
    let w = headItem?.w ?? 0;
    const renderableDot = getRenderableAugmentationDot(ni.chronaxie, ni.augmentationDot);
    if (renderableDot) {
        const augSkin = skin[getAugmentationDotSkinKey(renderableDot)];
        w += AUGMENTATION_DOT_GAP * measureHeight + (augSkin?.w ?? 0);
    }
    return w;
}

export type RenderGraceTabCtx = {
    noteCenterY: (region: number) => number;
    measureY: number;
    measureHeight: number;
    measureLineWidth: number;
    measureWidth: number;
    skin: Tab6SkinPack;
    skinName: string;
    zIndex: number;
    note: TabNote;
    idMap: NodeIdMap;
    out: VDom[];
};

/** 渲染一条倚音（不含减时线 / 托架） */
export function renderGraceTabNoteInfoAt(
    ni: TabNoteInfo,
    noteLeft: number,
    ctx: RenderGraceTabCtx,
): void {
    const {noteCenterY, measureHeight, skin, skinName, zIndex, idMap, out} = ctx;
    if (!isTabNoteHeadInfo(ni)) return;

    const headKey = getTabNoteHeadSkinKey(ni);
    const headItem = skin[headKey];
    if (!headItem) return;

    const region = getTabNoteInfoRegion(ni);
    const hcy = noteCenterY(region);
    const ny = hcy - headItem.h / 2;

    out.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: noteLeft,
        y: ny,
        w: headItem.w,
        h: headItem.h,
        zIndex,
        tag: 'tabNoteNumber',
        skinName,
        targetId: ni.id,
        skinKey: headKey,
        dataComment: '倚音',
    });
    setNodeIdMap(idMap, ni.id, out[out.length - 1]!);

    const renderableDot = getRenderableAugmentationDot(ni.chronaxie, ni.augmentationDot);
    if (renderableDot) {
        const augSkinKey = getAugmentationDotSkinKey(renderableDot);
        const augSkin = skin[augSkinKey];
        if (augSkin) {
            const augX = noteLeft + headItem.w + AUGMENTATION_DOT_GAP * measureHeight;
            let augY = hcy - augSkin.h / 2;
            if (region % 2 === 0) augY -= measureHeight / 8;
            out.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
                special: {},
                x: augX,
                y: augY,
                w: augSkin.w,
                h: augSkin.h,
                zIndex,
                tag: 'augmentationDot',
                skinName,
                targetId: renderableDot.id,
                skinKey: augSkinKey,
                dataComment: '倚音附点',
            });
        }
    }
}

/** 前置倚音：index0 靠主音，整体向左扩散 */
export function renderGraceNotesBefore(
    graceNotes: TabNoteInfo[] | undefined,
    mainHeadX: number,
    ctx: RenderGraceTabCtx,
): void {
    if (!graceNotes?.length) return;
    const gap = graceNoteSpacing(ctx.measureHeight);
    const reduceSlots: GraceReduceSlot[] = [];
    let clusterRight = mainHeadX - gap;
    for (let i = 0; i < graceNotes.length; i++) {
        const ni = graceNotes[i]!;
        const gw = estimateGraceTabNoteInfoWidth(ni, ctx.skin, ctx.measureHeight);
        const noteLeft = clusterRight - gw;
        renderGraceTabNoteInfoAt(ni, noteLeft, ctx);
        const slot = buildGraceReduceSlot(ni, noteLeft, ctx.noteCenterY, ctx.skin);
        if (slot) reduceSlots.unshift(slot);
        if (i < graceNotes.length - 1) clusterRight = noteLeft - gap;
    }
    processGraceReduceLines(reduceSlots, ctx);
    processGracePedestals(reduceSlots, ctx, 'before');
}

/** 后置倚音：向右扩散 */
export function renderGraceNotesAfter(
    graceNotesAfter: TabNoteInfo[] | undefined,
    mainHeadX: number,
    mainHeadW: number,
    ctx: RenderGraceTabCtx,
): void {
    if (!graceNotesAfter?.length) return;
    const gap = graceNoteSpacing(ctx.measureHeight);
    const reduceSlots: GraceReduceSlot[] = [];
    let noteLeft = mainHeadX + mainHeadW + gap;
    for (let i = 0; i < graceNotesAfter.length; i++) {
        const ni = graceNotesAfter[i]!;
        renderGraceTabNoteInfoAt(ni, noteLeft, ctx);
        const slot = buildGraceReduceSlot(ni, noteLeft, ctx.noteCenterY, ctx.skin);
        if (slot) reduceSlots.push(slot);
        noteLeft += estimateGraceTabNoteInfoWidth(ni, ctx.skin, ctx.measureHeight) + gap;
    }
    processGraceReduceLines(reduceSlots, ctx);
    processGracePedestals(reduceSlots, ctx, 'after');
}
