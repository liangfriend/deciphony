/**
 * 鼓谱倚音：DrumNote 级（graceNotes / graceNotesAfter 为 DrumNotesInfo[]）；VDom.scale 由 group.vue 缩放至 50%
 * 每颗倚音一个音符头，符干方向随所在声部；index0 最靠主音（前倚音向左排、后倚音向右排）。
 */

import type {DrumNotationSkinPack, VDom} from "@/types/common";
import type {DrumNotesInfo} from "@/types/MusicScoreType";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import type {DrumVoice, NodeIdMap} from "../types";
import {AUGMENTATION_DOT_GAP} from "../constants";
import {getAugmentationDotSkinKey, getDrumHeadSkinKey} from "../utils/skinKey";
import {getStemAttachY} from "../utils/note";
import {addLineBoxAt} from "../utils/addLine";
import {renderStemAndTail} from "../note/renderStemAndTail";
import {GRACE_NOTE_SCALE, graceNoteSpacing, graceScaleCenterOffsetX, withGraceScale} from "@/render/graceNote";
import {scaledSpan} from "@/render/vdomScale";

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
  let obj = map.get(id);
  if (!obj) {
    obj = {};
    map.set(id, obj);
  }
  obj[vdom.tag] = vdom;
}

function dotSpan(ni: DrumNotesInfo, skin: DrumNotationSkinPack, measureHeight: number): number {
  if (!ni.augmentationDot) return 0;
  const augSkin = skin[getAugmentationDotSkinKey(ni.augmentationDot)];
  return scaledSpan(AUGMENTATION_DOT_GAP * measureHeight + (augSkin?.w ?? 0), GRACE_NOTE_SCALE);
}

/** 单颗倚音占位宽度（视觉缩放后）：符头 + 附点 */
export function estimateGraceDrumWidth(ni: DrumNotesInfo, skin: DrumNotationSkinPack, measureHeight: number): number {
  const headW = skin[getDrumHeadSkinKey(ni.headType)]?.w ?? 0;
  return scaledSpan(headW, GRACE_NOTE_SCALE) + dotSpan(ni, skin, measureHeight);
}

export type RenderGraceDrumContext = {
  voice: DrumVoice;
  noteCenterY: (region: number) => number;
  measureY: number;
  measureHeight: number;
  skin: DrumNotationSkinPack;
  skinName: string;
  zIndex: number;
  idMap: NodeIdMap;
  out: VDom[];
};

/** headAnchorX：未缩放符头盒子左缘（中心缩放后视觉左缘 = headAnchorX + 补偿） */
function renderGraceDrumNote(ni: DrumNotesInfo, headAnchorX: number, ctx: RenderGraceDrumContext): void {
  const {voice, noteCenterY, measureY, measureHeight, skin, skinName, zIndex, idMap, out} = ctx;
  const headKey = getDrumHeadSkinKey(ni.headType);
  const headItem = skin[headKey];
  if (!headItem) return;
  const hcy = noteCenterY(ni.region);
  const headY = hcy - headItem.h / 2;

  const ledgerCenterX = headAnchorX + headItem.w / 2;
  const addLineSkinD = skin[DrumNotationSkinKeyEnum.AddLine_d];
  const addLineSkinU = skin[DrumNotationSkinKeyEnum.AddLine_u];
  if (addLineSkinD && ni.region < -1) for (let line = -2; line >= ni.region; line -= 2) {
    out.push(withGraceScale({
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {ledgerLine: line},
      ...addLineBoxAt(noteCenterY(line), ledgerCenterX, addLineSkinD),
      zIndex,
      tag: 'addLine_g', skinName, targetId: ni.id,
      skinKey: DrumNotationSkinKeyEnum.AddLine_d, dataComment: '倚音下加线',
    }));
  }
  if (addLineSkinU && ni.region > 9) for (let line = 10; line <= ni.region; line += 2) {
    out.push(withGraceScale({
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {ledgerLine: line},
      ...addLineBoxAt(noteCenterY(line), ledgerCenterX, addLineSkinU),
      zIndex,
      tag: 'addLine_u', skinName, targetId: ni.id,
      skinKey: DrumNotationSkinKeyEnum.AddLine_u, dataComment: '倚音上加线',
    }));
  }

  const headVDom = withGraceScale({
    startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
    x: headAnchorX, y: headY, w: headItem.w, h: headItem.h, zIndex,
    tag: 'noteHead', skinName, targetId: ni.id, skinKey: headKey, dataComment: '倚音音符头',
  });
  out.push(headVDom);
  setNodeIdMap(idMap, ni.id, headVDom);

  if (ni.augmentationDot) {
    const augSkinKey = getAugmentationDotSkinKey(ni.augmentationDot);
    const augSkin = skin[augSkinKey];
    if (augSkin) {
      const visualRight = headAnchorX + headItem.w / 2 + scaledSpan(headItem.w, GRACE_NOTE_SCALE) / 2;
      const visualDotLeft = visualRight + scaledSpan(AUGMENTATION_DOT_GAP * measureHeight, GRACE_NOTE_SCALE);
      let augY = hcy - augSkin.h / 2;
      if (ni.region % 2 === 0) augY -= measureHeight / 8;
      out.push(withGraceScale({
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: visualDotLeft - graceScaleCenterOffsetX(augSkin.w), y: augY, w: augSkin.w, h: augSkin.h, zIndex,
        tag: 'augmentationDot', skinName, targetId: ni.augmentationDot.id,
        skinKey: augSkinKey, dataComment: '倚音附点',
      }));
    }
  }

  // 接点按视觉符头算：盒子绕中心缩放，Normal 头的接点偏移也随之缩小
  const visualH = headItem.h * GRACE_NOTE_SCALE;
  const stemAttachY = getStemAttachY(
    ni.headType,
    {y: hcy - visualH / 2, h: visualH},
    voice,
    measureHeight * GRACE_NOTE_SCALE,
  );
  for (const v of renderStemAndTail({
    headX: headAnchorX,
    headY,
    headW: headItem.w,
    headH: headItem.h,
    stemAttachY,
    measureY,
    measureHeight,
    skin,
    zIndex,
    chronaxie: ni.chronaxie,
    direction: voice,
    stemTargetId: ni.id,
    skinName,
    isGrace: true,
  })) {
    out.push(v);
    setNodeIdMap(idMap, ni.id, v);
  }
}

function headAnchorFromVisualLeft(visualLeft: number, headW: number): number {
  return visualLeft - graceScaleCenterOffsetX(headW);
}

/** 前倚音：最靠主音的一颗（index0）右缘贴 mainLeftX - gap，依次向左排 */
export function renderGraceDrumBefore(
  graceNotes: DrumNotesInfo[] | undefined,
  mainLeftX: number,
  ctx: RenderGraceDrumContext,
): void {
  if (!graceNotes?.length) return;
  const gap = graceNoteSpacing(ctx.measureHeight);
  let clusterRight = mainLeftX - gap;
  for (const ni of graceNotes) {
    const headW = ctx.skin[getDrumHeadSkinKey(ni.headType)]?.w ?? 0;
    const headVisualLeft = clusterRight - dotSpan(ni, ctx.skin, ctx.measureHeight) - scaledSpan(headW, GRACE_NOTE_SCALE);
    renderGraceDrumNote(ni, headAnchorFromVisualLeft(headVisualLeft, headW), ctx);
    clusterRight -= estimateGraceDrumWidth(ni, ctx.skin, ctx.measureHeight) + gap;
  }
}

/** 后倚音：最靠主音的一颗（index0）左缘贴 mainRightX + gap，依次向右排 */
export function renderGraceDrumAfter(
  graceNotesAfter: DrumNotesInfo[] | undefined,
  mainRightX: number,
  ctx: RenderGraceDrumContext,
): void {
  if (!graceNotesAfter?.length) return;
  const gap = graceNoteSpacing(ctx.measureHeight);
  let clusterLeft = mainRightX + gap;
  for (const ni of graceNotesAfter) {
    const headW = ctx.skin[getDrumHeadSkinKey(ni.headType)]?.w ?? 0;
    renderGraceDrumNote(ni, headAnchorFromVisualLeft(clusterLeft, headW), ctx);
    clusterLeft += estimateGraceDrumWidth(ni, ctx.skin, ctx.measureHeight) + gap;
  }
}
