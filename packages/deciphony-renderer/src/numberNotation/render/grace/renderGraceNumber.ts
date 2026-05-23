/**
 * 简谱倚音：NoteNumber 级；横向扩散（前置向左、后置向右），y 与主音相同（顶部对齐）
 */

import {VDom} from "@/types/common";
import type {NumberNotationSkinPack} from "@/types/common";
import type {AugmentationDot, NoteNumber} from "@/types/MusicScoreType";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {
  ACCIDENTAL_NOTE_X_GAP,
  ACCIDENTAL_NOTE_Y_OFFSET,
  AUGMENTATION_DOT_X_GAP,
  AUGMENTATION_DOT_Y_OFFSET,
  OCTAVE_DOT_FIRST_OFFSET,
  OCTAVE_DOT_LAST_EDGE_MARGIN,
  OCTAVE_DOT_SPACING,
  REDUCE_LINE_Y_OFFSET,
} from "../constants";
import {
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getReduceLineSkinKey,
  getSyllableSkinKey,
} from "../utils/skinKey";
import {computeOctaveDotYOffsets, noteCenterY} from "../utils/noteLayout";
import {GRACE_NOTE_SCALE, graceNoteSpacing, withGraceScale} from "@/render/graceNote";
import {boxYForVisualTop, scaledSpan, visualBottomFromBox} from "@/render/vdomScale";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";

const S = GRACE_NOTE_SCALE;

/** 倚音附属元素：先算视觉目标 y，再反推 center 缩放下的布局 y */
function graceBoxY(targetVisualTop: number, h: number): number {
  return boxYForVisualTop(targetVisualTop, h, S);
}

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

/** 单条倚音 NoteNumber 占位宽度（视觉缩放后） */
export function estimateGraceNoteNumberWidth(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight: number,
): number {
  let w = 0;
  for (const n of note.notesInfo) {
    const numSkin = skin[getSyllableSkinKey(n.syllable)];
    if (numSkin) w = Math.max(w, scaledSpan(numSkin.w, GRACE_NOTE_SCALE));
    if (n.accidental) {
      const accSkin = skin[getAccidentalSkinKey(n.accidental.type)];
      w += scaledSpan(ACCIDENTAL_NOTE_X_GAP * measureHeight + (accSkin?.w ?? 0), GRACE_NOTE_SCALE);
    }
  }
  if (note.augmentationDot) {
    const augSkin = skin[getAugmentationDotSkinKey(note.augmentationDot)];
    w += scaledSpan(AUGMENTATION_DOT_X_GAP * measureHeight + (augSkin?.w ?? 0), GRACE_NOTE_SCALE);
  }
  if (w <= 0) w = scaledSpan(skin[NumberNotationSkinKeyEnum.Number_1]?.w ?? 20, GRACE_NOTE_SCALE);
  return w;
}

function graceNoteNumberGroupWidth(
  graceList: NoteNumber[] | undefined,
  skin: NumberNotationSkinPack,
  measureHeight: number,
): number {
  if (!graceList?.length) return 0;
  const gap = graceNoteSpacing(measureHeight);
  let total = gap;
  for (let i = 0; i < graceList.length; i++) {
    if (i > 0) total += gap;
    total += estimateGraceNoteNumberWidth(graceList[i]!, skin, measureHeight);
  }
  return total;
}

export function graceNoteNumberBeforeWidth(
  graceNotes: NoteNumber[] | undefined,
  skin: NumberNotationSkinPack,
  measureHeight: number,
): number {
  return graceNoteNumberGroupWidth(graceNotes, skin, measureHeight);
}

export function graceNoteNumberAfterWidth(
  graceNotesAfter: NoteNumber[] | undefined,
  skin: NumberNotationSkinPack,
  measureHeight: number,
): number {
  return graceNoteNumberGroupWidth(graceNotesAfter, skin, measureHeight);
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

/** 在 headX 渲染一条倚音；数字顶边与主音对齐，附属元素相对缩放后的视觉边界 + 常量间距 */
export function renderGraceNoteNumberAt(
  note: NoteNumber,
  headX: number,
  ctx: RenderGraceNumberCtx,
): void {
  const {measureY, measureHeight, skin, skinName, zIndex, idMap, out} = ctx;
  const allNotes = note.notesInfo.slice();
  const octaveDotSkin = skin[NumberNotationSkinKeyEnum.OctaveDot];
  const fOff = OCTAVE_DOT_FIRST_OFFSET * measureHeight;
  const spacing = OCTAVE_DOT_SPACING * measureHeight;
  const lastEdgeMargin = OCTAVE_DOT_LAST_EDGE_MARGIN * measureHeight;
  const octaveDotYOffsets = octaveDotSkin
    ? computeOctaveDotYOffsets(allNotes, octaveDotSkin.h, fOff, spacing, lastEdgeMargin)
    : allNotes.map(() => 0);

  let lowestGraceVisualBottom = 0;

  for (let stackIdx = 0; stackIdx < allNotes.length; stackIdx++) {
    const n = allNotes[stackIdx]!;
    const numKey = getSyllableSkinKey(n.syllable);
    const numItem = skin[numKey];
    if (!numItem) continue;
    const hcy = noteCenterY(measureY, measureHeight, stackIdx, numItem.h, octaveDotYOffsets[stackIdx]);
    const mainNy = hcy - numItem.h / 2;
    const ny = boxYForVisualTop(mainNy, numItem.h, S);
    const noteVisualBottom = visualBottomFromBox(ny, numItem.h, S);
    if (stackIdx === 0) {
      lowestGraceVisualBottom = noteVisualBottom;
    }

    if (n.accidental) {
      const accSkinKey = getAccidentalSkinKey(n.accidental.type);
      const accSkin = skin[accSkinKey];
      if (accSkin) {
        const mainAccY = measureY + ACCIDENTAL_NOTE_Y_OFFSET * measureHeight;
        pushGrace(out, {
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
          x: headX - ACCIDENTAL_NOTE_X_GAP * measureHeight - accSkin.w,
          y: boxYForVisualTop(mainAccY, accSkin.h, S),
          w: accSkin.w, h: accSkin.h, zIndex,
          tag: 'accidental', skinName, targetId: n.accidental.id ?? n.id,
          skinKey: accSkinKey, dataComment: '倚音变音号',
        });
      }
    }

    pushGrace(out, {
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
      x: headX, y: ny, w: numItem.w, h: numItem.h, zIndex,
      tag: 'noteHead', skinName, targetId: n.id, skinKey: numKey,
      dataComment: '倚音',
    });
    setNodeIdMap(idMap, n.id, out[out.length - 1]!);

    if ((n.syllable !== 0 && n.syllable !== 'X') && (n.octaveDot ?? 0) !== 0 && octaveDotSkin) {
      const dotCount = Math.abs(n.octaveDot!);
      const dotX = headX + (numItem.w - octaveDotSkin.w) / 2;
      if (n.octaveDot! > 0) {
        let targetDotTop = mainNy - fOff - octaveDotSkin.h;
        for (let k = 0; k < dotCount; k++) {
          pushGrace(out, {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: dotX, y: graceBoxY(targetDotTop, octaveDotSkin.h), w: octaveDotSkin.w, h: octaveDotSkin.h, zIndex,
            tag: 'accidental', skinName, targetId: n.id,
            skinKey: NumberNotationSkinKeyEnum.OctaveDot, dataComment: '倚音八度点',
          });
          targetDotTop -= octaveDotSkin.h + spacing;
        }
      } else {
        let baseBottom: number;
        if (stackIdx === 0 && note.chronaxie <= 32) {
          const reduceLineSkin = skin[getReduceLineSkinKey(note.chronaxie)];
          const reduceVisualTop = noteVisualBottom + REDUCE_LINE_Y_OFFSET * measureHeight;
          baseBottom = reduceVisualTop + scaledSpan(reduceLineSkin?.h ?? 0, S);
        } else {
          baseBottom = noteVisualBottom;
        }
        let targetDotTop = baseBottom + fOff;
        for (let k = 0; k < dotCount; k++) {
          pushGrace(out, {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: dotX, y: graceBoxY(targetDotTop, octaveDotSkin.h), w: octaveDotSkin.w, h: octaveDotSkin.h, zIndex,
            tag: 'accidental', skinName, targetId: n.id,
            skinKey: NumberNotationSkinKeyEnum.OctaveDot, dataComment: '倚音八度点',
          });
          targetDotTop += octaveDotSkin.h + spacing;
        }
      }
    }
  }

  if (note.augmentationDot) {
    const augSkinKey = getAugmentationDotSkinKey(note.augmentationDot as AugmentationDot);
    const augSkin = skin[augSkinKey];
    const num1 = skin[NumberNotationSkinKeyEnum.Number_1];
    if (augSkin && num1) {
      const augX = headX + num1.w + AUGMENTATION_DOT_X_GAP * measureHeight;
      allNotes.forEach((n, stackIdx) => {
        if (n.syllable === 0 || n.syllable === 'X') return;
        const numKey = getSyllableSkinKey(n.syllable);
        const numItemN = skin[numKey];
        if (!numItemN) return;
        const hcy = noteCenterY(measureY, measureHeight, stackIdx, numItemN.h, octaveDotYOffsets[stackIdx]);
        const augY = hcy + AUGMENTATION_DOT_Y_OFFSET * measureHeight - augSkin.h / 2;
        pushGrace(out, {
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
          x: augX, y: augY, w: augSkin.w, h: augSkin.h, zIndex,
          tag: 'accidental', skinName, targetId: note.augmentationDot!.id,
          skinKey: augSkinKey, dataComment: '倚音附点',
        });
      });
    }
  }

  if (note.chronaxie <= 32 && allNotes[0]) {
    const reduceLineKey = getReduceLineSkinKey(note.chronaxie);
    const reduceLineSkin = skin[reduceLineKey];
    const lowest = allNotes[0];
    const lowestSkin = skin[getSyllableSkinKey(lowest.syllable)];
    if (reduceLineSkin && lowestSkin) {
      const targetReduceTop = lowestGraceVisualBottom + REDUCE_LINE_Y_OFFSET * measureHeight;
      const lineW = lowestSkin.w * (note.beamType === BeamTypeEnum.None ? 1 : 1.5);
      pushGrace(out, {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: headX, y: graceBoxY(targetReduceTop, reduceLineSkin.h), w: lineW, h: reduceLineSkin.h, zIndex,
        tag: 'accidental', skinName, targetId: lowest.id,
        skinKey: reduceLineKey, dataComment: '倚音减时线',
      });
    }
  }
}

/** 前置倚音：index0 靠主音，整体向左扩散 */
export function renderGraceNotesNumberBefore(
  graceNotes: NoteNumber[] | undefined,
  mainHeadX: number,
  ctx: RenderGraceNumberCtx,
): void {
  if (!graceNotes?.length) return;
  const gap = graceNoteSpacing(ctx.measureHeight);
  let x = mainHeadX - gap;
  for (let i = 0; i < graceNotes.length; i++) {
    const gn = graceNotes[i]!;
    const gw = estimateGraceNoteNumberWidth(gn, ctx.skin, ctx.measureHeight);
    x -= gw;
    renderGraceNoteNumberAt(gn, x, ctx);
    if (i < graceNotes.length - 1) x -= gap;
  }
}

/** 后置倚音：向右扩散 */
export function renderGraceNotesNumberAfter(
  graceNotesAfter: NoteNumber[] | undefined,
  mainHeadX: number,
  mainRefW: number,
  ctx: RenderGraceNumberCtx,
): void {
  if (!graceNotesAfter?.length) return;
  const gap = graceNoteSpacing(ctx.measureHeight);
  let x = mainHeadX + mainRefW + gap;
  for (let i = 0; i < graceNotesAfter.length; i++) {
    const gn = graceNotesAfter[i]!;
    renderGraceNoteNumberAt(gn, x, ctx);
    x += estimateGraceNoteNumberWidth(gn, ctx.skin, ctx.measureHeight) + gap;
  }
}
