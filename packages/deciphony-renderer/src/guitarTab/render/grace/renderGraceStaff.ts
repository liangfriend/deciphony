/**

 * 吉他谱倚音：NoteSymbol 级（graceNotes 为 NotesInfo[]）；VDom.scale 由 group.vue 缩放至 50%

 */


import {VDom} from "@/types/common";

import type {GuitarTabSkinPack} from "@/types/common";

import type {AugmentationDot, NoteSymbol, NotesInfo} from "@/types/MusicScoreType";

import {GuitarTabSkinKeyEnum} from "@/guitarTab/enums/guitarTabSkinKeyEnum";

import type {NodeIdMap} from "../types";

import {AUGMENTATION_DOT_GAP} from "../constants";

import {
    getAugmentationDotSkinKey,
    getNoteHeadSkinKey,
} from "../utils/skinKey";

import {renderGraceStemAndTail} from "../note/renderStemAndTail";

import {GRACE_NOTE_SCALE, graceNoteSpacing, withGraceScale} from "@/render/graceNote";

import {scaledSpan} from "@/render/vdomScale";


function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {

    let obj = map.get(id);

    if (!obj) {

        obj = {};

        map.set(id, obj);

    }

    obj[vdom.tag] = vdom;

}


function pushGrace(out: VDom[], v: VDom): void {
    out.push(withGraceScale(v));
}


/** 估算单条倚音 NotesInfo 占位宽度（视觉缩放后） */

export function estimateGraceNotesInfoWidth(
    ni: NotesInfo,
    skin: GuitarTabSkinPack,
    measureHeight: number,
): number {

    const headItem = skin[getNoteHeadSkinKey(ni.chronaxie)];

    let w = scaledSpan(headItem?.w ?? 0, GRACE_NOTE_SCALE);

    if (ni.augmentationDot) {

        const augSkin = skin[getAugmentationDotSkinKey(ni.augmentationDot)];

        w += scaledSpan((AUGMENTATION_DOT_GAP * measureHeight) + (augSkin?.w ?? 0), GRACE_NOTE_SCALE);

    }

    return w;

}


export function graceBeforeWidth(
    graceNotes: NotesInfo[] | undefined,
    skin: GuitarTabSkinPack,
    measureHeight: number,
): number {

    if (!graceNotes?.length) return 0;

    const gap = graceNoteSpacing(measureHeight);

    let total = gap;

    for (let i = 0; i < graceNotes.length; i++) {

        if (i > 0) total += gap;

        total += estimateGraceNotesInfoWidth(graceNotes[i]!, skin, measureHeight);

    }

    return total;

}


export function graceAfterWidth(
    graceNotesAfter: NotesInfo[] | undefined,
    skin: GuitarTabSkinPack,
    measureHeight: number,
): number {

    return graceBeforeWidth(graceNotesAfter, skin, measureHeight);

}


export type RenderGraceStaffParams = {

    ni: NotesInfo;

    headAnchorX: number;

    noteCenterY: (region: number) => number;

    measureY: number;

    measureHeight: number;

    measureLineWidth: number;

    measureWidth: number;

    skin: GuitarTabSkinPack;

    skinName: string;

    zIndex: number;

    note: NoteSymbol;

    idMap: NodeIdMap;

    out: VDom[];

};


export function renderGraceNotesInfo(params: RenderGraceStaffParams): void {

    const {

        ni,

        headAnchorX,

        noteCenterY,

        measureHeight,

        measureLineWidth,

        measureWidth,

        skin,

        skinName,

        zIndex,

        note,

        idMap,

        out,

    } = params;

    const directionUp = ni.direction === 'up';

    const headKey = getNoteHeadSkinKey(ni.chronaxie);

    const headItem = skin[headKey];

    if (!headItem) return;


    const headW = headItem.w;

    const headH = headItem.h;

    const ny = noteCenterY(ni.region) - headH / 2;

    const hcy = noteCenterY(ni.region);


    pushGrace(out, {

        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},

        x: headAnchorX, y: ny, w: headW, h: headH, zIndex,

        tag: 'noteHead', skinName, targetId: ni.id, skinKey: headKey, dataComment: '倚音音符头',

    });

    setNodeIdMap(idMap, ni.id, out[out.length - 1]!);


    if (ni.augmentationDot) {

        const augSkinKey = getAugmentationDotSkinKey(ni.augmentationDot as AugmentationDot);

        const augSkin = skin[augSkinKey];

        if (augSkin) {

            const augX = headAnchorX + headW + AUGMENTATION_DOT_GAP * measureHeight;

            let augY = hcy - augSkin.h / 2;

            if (ni.region % 2 === 0) augY -= measureHeight / 8;

            pushGrace(out, {

                startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},

                x: augX, y: augY, w: augSkin.w, h: augSkin.h, zIndex,

                tag: 'augmentationDot', skinName, targetId: ni.augmentationDot.id,

                skinKey: augSkinKey, dataComment: '倚音附点',

            });

        }

    }


    const stemTailVDoms = renderGraceStemAndTail({

        note,

        headX: headAnchorX,

        headY: ny,

        headW,

        headH,

        measureY: params.measureY,

        measureHeight,

        measureWidth,

        skin,

        zIndex,

        idMap,

        chronaxie: ni.chronaxie,

        direction: directionUp ? 'up' : 'down',

        stemTargetId: ni.id,

        skinName,

    });

    for (const v of stemTailVDoms) {

        pushGrace(out, v);

        if (v.targetId) setNodeIdMap(idMap, v.targetId, v);

    }

}


export function renderGraceNotesBefore(
    graceNotes: NotesInfo[] | undefined,
    primaryHeadX: number,
    ctx: Omit<RenderGraceStaffParams, 'ni' | 'headAnchorX'>,
): void {

    if (!graceNotes?.length) return;

    const gap = graceNoteSpacing(ctx.measureHeight);

    let anchorX = primaryHeadX - gap;

    for (let i = graceNotes.length - 1; i >= 0; i--) {

        const ni = graceNotes[i]!;

        const w = estimateGraceNotesInfoWidth(ni, ctx.skin, ctx.measureHeight);

        anchorX -= w;

        renderGraceNotesInfo({...ctx, ni, headAnchorX: anchorX});

        anchorX -= gap;

    }

}


export function renderGraceNotesAfter(
    graceNotesAfter: NotesInfo[] | undefined,
    primaryHeadX: number,
    primaryHeadW: number,
    ctx: Omit<RenderGraceStaffParams, 'ni' | 'headAnchorX'>,
): void {

    if (!graceNotesAfter?.length) return;

    const gap = graceNoteSpacing(ctx.measureHeight);

    let anchorX = primaryHeadX + primaryHeadW + gap;

    for (const ni of graceNotesAfter) {

        renderGraceNotesInfo({...ctx, ni, headAnchorX: anchorX});

        anchorX += estimateGraceNotesInfoWidth(ni, ctx.skin, ctx.measureHeight) + gap;

    }

}
