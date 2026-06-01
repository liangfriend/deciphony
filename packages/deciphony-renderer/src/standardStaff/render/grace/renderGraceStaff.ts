/**

 * 五线谱倚音：NoteSymbol 级（graceNotes 为 NotesInfo[]）；VDom.scale 由 group.vue 缩放至 50%

 */



import {VDom} from "@/types/common";

import type {StandardStaffSkinPack} from "@/types/common";

import type {AugmentationDot, NoteSymbol, NotesInfo} from "@/types/MusicScoreType";

import {AccidentalTypeEnum} from "@/enums/musicScoreEnum";

import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";

import type {NodeIdMap} from "../types";

import {ACCIDENTAL_NOTE_GAP, AUGMENTATION_DOT_GAP} from "../constants";

import {

  getAccidentalSkinKey,

  getAugmentationDotSkinKey,

  getNoteHeadSkinKey,

} from "../utils/skinKey";

import {renderGraceStemAndTail} from "../note/renderStemAndTail";

import {GRACE_NOTE_SCALE, graceNoteSpacing, withGraceScale} from "@/render/graceNote";

import {scaledSpan} from "@/render/vdomScale";

import {addLineBoxAt} from "../utils/addLine";



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

  skin: StandardStaffSkinPack,

  measureHeight: number,

): number {

  const headItem = skin[getNoteHeadSkinKey(ni.chronaxie)];

  let w = scaledSpan(headItem?.w ?? 0, GRACE_NOTE_SCALE);

  if (ni.accidental) {

    const accSkin = skin[getAccidentalSkinKey(ni.accidental.type)];

    w += scaledSpan((ACCIDENTAL_NOTE_GAP * measureHeight) + (accSkin?.w ?? 0), GRACE_NOTE_SCALE);

  }

  if (ni.augmentationDot) {

    const augSkin = skin[getAugmentationDotSkinKey(ni.augmentationDot)];

    w += scaledSpan((AUGMENTATION_DOT_GAP * measureHeight) + (augSkin?.w ?? 0), GRACE_NOTE_SCALE);

  }

  return w;

}



export function graceBeforeWidth(

  graceNotes: NotesInfo[] | undefined,

  skin: StandardStaffSkinPack,

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

  skin: StandardStaffSkinPack,

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

  skin: StandardStaffSkinPack;

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

  const addLineSkinD = skin[StandardStaffSkinKeyEnum.AddLine_d];
  const addLineSkinU = skin[StandardStaffSkinKeyEnum.AddLine_u];
  const r = ni.region;
  const ledgerCenterX = headAnchorX + headW / 2;

  if (r < -1 && addLineSkinD) {
    for (let line = -2; line >= r; line -= 2) {
      const lineY = noteCenterY(line);
      const box = addLineBoxAt(lineY, ledgerCenterX, addLineSkinD);
      pushGrace(out, {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        ...box,
        zIndex,
        tag: 'addLine', skinName, targetId: ni.id,
        skinKey: StandardStaffSkinKeyEnum.AddLine_d, dataComment: '倚音下加线',
      });
    }
  }
  if (r > 9 && addLineSkinU) {
    for (let line = 10; line <= r; line += 2) {
      const lineY = noteCenterY(line);
      const box = addLineBoxAt(lineY, ledgerCenterX, addLineSkinU);
      pushGrace(out, {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        ...box,
        zIndex,
        tag: 'addLine', skinName, targetId: ni.id,
        skinKey: StandardStaffSkinKeyEnum.AddLine_u, dataComment: '倚音上加线',
      });
    }
  }



  if (ni.accidental) {

    const accSkinKey = getAccidentalSkinKey(ni.accidental.type);

    const accSkin = skin[accSkinKey];

    if (accSkin) {

      const accX = headAnchorX - ACCIDENTAL_NOTE_GAP * measureHeight - accSkin.w + (ni.accidental.relativeX ?? 0);

      const isFlat = ni.accidental.type === AccidentalTypeEnum.Flat || ni.accidental.type === AccidentalTypeEnum.Double_flat;

      const accY = isFlat

        ? (hcy + measureHeight / 8) - accSkin.h + (ni.accidental.relativeY ?? 0)

        : hcy - accSkin.h / 2 + (ni.accidental.relativeY ?? 0);

      pushGrace(out, {

        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},

        x: accX, y: accY, w: accSkin.w, h: accSkin.h, zIndex,

        tag: 'accidental', skinName, targetId: ni.accidental.id ?? ni.id,

        skinKey: accSkinKey, dataComment: '倚音变音号',

      });

    }

  }



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

        tag: 'accidental', skinName, targetId: ni.augmentationDot.id,

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

    headCenterYOther: hcy,

    skinName,

  });

  for (const v of stemTailVDoms) {

    out.push(v);

    if (v.targetId) setNodeIdMap(idMap, v.targetId, v);

  }

}



export function renderGraceNotesBefore(

  graceNotes: NotesInfo[] | undefined,

  mainHeadX: number,

  ctx: Omit<RenderGraceStaffParams, 'ni' | 'headAnchorX'>,

): void {

  if (!graceNotes?.length) return;

  const gap = graceNoteSpacing(ctx.measureHeight);

  let x = mainHeadX - gap;

  for (let i = 0; i < graceNotes.length; i++) {

    const ni = graceNotes[i]!;

    const gw = estimateGraceNotesInfoWidth(ni, ctx.skin, ctx.measureHeight);

    x -= gw;

    renderGraceNotesInfo({...ctx, ni, headAnchorX: x});

    if (i < graceNotes.length - 1) x -= gap;

  }

}



export function renderGraceNotesAfter(

  graceNotesAfter: NotesInfo[] | undefined,

  mainHeadX: number,

  mainHeadW: number,

  ctx: Omit<RenderGraceStaffParams, 'ni' | 'headAnchorX'>,

): void {

  if (!graceNotesAfter?.length) return;

  const gap = graceNoteSpacing(ctx.measureHeight);

  let x = mainHeadX + mainHeadW + gap;

  for (let i = 0; i < graceNotesAfter.length; i++) {

    const ni = graceNotesAfter[i]!;

    renderGraceNotesInfo({...ctx, ni, headAnchorX: x});

    x += estimateGraceNotesInfoWidth(ni, ctx.skin, ctx.measureHeight) + gap;

  }

}


