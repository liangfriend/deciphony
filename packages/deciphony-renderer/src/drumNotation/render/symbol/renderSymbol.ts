/**
 * 鼓谱小节符号渲染：前置谱号→前置调号→前置拍号→前置小节线→（音符 | 长休止符）→后置小节线→后置谱号→后置调号→后置拍号
 *
 * 音符分上下两个声部：up 声部符干向上、down 声部符干向下；两声部同 onset 的槽位共用列几何（见 buildDrumColumnLayouts）。
 * 长休止符小节不渲染音符，前后置符号只在组首 / 组尾保留（见 measureParts）。
 */

import {VDom} from "@/types/common";
import type {DrumNote, DrumNotesInfo, DrumRest, Measure, MeasureNoteSlot} from "@/types/MusicScoreType";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import {getMeasureVoices} from "@/utils/measureNotes";
import {renderSingleNoteAffiliatedSymbols} from "@/render/affiliated";
import type {MeasureColumnLayout} from "@/render/layout/measureColumnLayout";
import type {DrumVoice, LongRestRole, NodeIdMap, RenderSymbolParams} from "../types";
import {
  AUGMENTATION_DOT_GAP,
  LONG_REST_COMPLETE_WIDTH_RATIO,
  LONG_REST_HEAD_START_RATIO,
  LONG_REST_HEIGHT_RATIO,
  LONG_REST_TAIL_END_RATIO,
} from "../constants";
import {addLineBoxAt} from "../utils/addLine";
import {
  getAugmentationDotSkinKey,
  getClefForMeasure,
  getDrumHeadSkinKey,
  getKeySignatureYOffset,
  getLongRestSkinKey,
  getRestSkinKey,
} from "../utils/skinKey";
import {computeSecondDisplacement, getStemAttachY, getStemBuckets} from "../utils/note";
import {isDrumNote, isDrumRest, slotSymbol} from "../utils/staffSlot";
import {getPrefixParts, getSuffixParts, sumPartsWidth} from "../utils/measureParts";
import {renderStemAndTail} from "../note/renderStemAndTail";
import {buildDrumColumnLayouts} from "../layout/measureColumnLayoutAdapter";

const LONG_REST_LABEL: Record<LongRestRole['kind'], string> = {
  complete: '完整',
  head: '头',
  content: '内容',
  tail: '尾',
};

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
  let obj = map.get(id);
  if (!obj) {
    obj = {};
    map.set(id, obj);
  }
  obj[vdom.tag] = vdom;
}

export function renderSymbol(params: RenderSymbolParams): VDom[] {
  const {
    measure,
    measures,
    measureIndex,
    measureX,
    measureY,
    measureWidth,
    measureHeight,
    measureLineWidth,
    skin,
    idMap,
    skinName,
    columnLayout,
    longRest,
  } = params;
  const skinNameForNodes = skinName ?? 'default';
  const out: VDom[] = [];
  const z = 1200;
  const clefType = getClefForMeasure(measures, measureIndex);
  const keySignatureYOffset = getKeySignatureYOffset(clefType, measureHeight, measureLineWidth);

  const prefixParts = getPrefixParts(measure, longRest);
  const suffixParts = getSuffixParts(measure, longRest);
  const prefixW = sumPartsWidth(prefixParts, skin);
  const suffixW = sumPartsWidth(suffixParts, skin);
  const noteDomainW = Math.max(0, measureWidth - prefixW - suffixW);

  const pushSymbol = (
    x: number,
    skinKey: DrumNotationSkinKeyEnum,
    tag: VDom['tag'],
    dataComment: string,
    targetId: string,
    yOffset?: number
  ) => {
    const item = skin[skinKey];
    if (!item) return;
    let y = measureY + (measureHeight - item.h) / 2;
    if (yOffset != null) y += yOffset;
    const vdom: VDom = {
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x, y, w: item.w, h: item.h, zIndex: z, tag, skinName: skinNameForNodes, targetId, skinKey, dataComment,
    };
    out.push(vdom);
    if (targetId) setNodeIdMap(idMap, targetId, vdom);
  };

  let x = measureX;
  for (const p of prefixParts) {
    const yOff = p.tag === 'keySignature_f' ? keySignatureYOffset : undefined;
    pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId, yOff);
    x += skin[p.skinKey]?.w ?? 0;
  }

  if (longRest) {
    const domainStartX = measureX + prefixW;
    const h = LONG_REST_HEIGHT_RATIO * measureHeight;
    let restX: number;
    let restW: number;
    switch (longRest.kind) {
      case 'complete':
        restW = LONG_REST_COMPLETE_WIDTH_RATIO * measureHeight;
        restX = domainStartX + (noteDomainW - restW) / 2;
        break;
      case 'head':
        restX = domainStartX + LONG_REST_HEAD_START_RATIO * noteDomainW;
        restW = domainStartX + noteDomainW - restX;
        break;
      case 'tail':
        restX = domainStartX;
        restW = LONG_REST_TAIL_END_RATIO * noteDomainW;
        break;
      case 'content':
      default:
        restX = domainStartX;
        restW = noteDomainW;
        break;
    }
    const vdom: VDom = {
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: restX,
      y: measureY + (measureHeight - h) / 2,
      w: Math.max(0, restW),
      h,
      zIndex: z,
      tag: 'longRest',
      skinName: skinNameForNodes,
      targetId: measure.id,
      skinKey: getLongRestSkinKey(longRest.kind),
      dataComment: `长休止符（${LONG_REST_LABEL[longRest.kind]}）`,
    };
    out.push(vdom);
    setNodeIdMap(idMap, measure.id, vdom);
  } else {
    const layouts = columnLayout
      ?? buildDrumColumnLayouts([measure], noteDomainW, prefixW, skin, measureHeight)[0];
    if (layouts) {
      const voices = getMeasureVoices(measure);
      for (const voice of ['up', 'down'] as const) {
        renderVoice(voices[voice], layouts[voice], voice, params, out);
      }
    }
  }

  x = measureX + measureWidth - suffixW;
  for (const p of suffixParts) {
    const yOff = p.tag === 'keySignature_b' ? keySignatureYOffset : undefined;
    pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId, yOff);
    x += skin[p.skinKey]?.w ?? 0;
  }

  return out;
}

/** 单个声部的音符 / 休止符 */
function renderVoice(
  slots: MeasureNoteSlot[],
  layout: MeasureColumnLayout,
  voice: DrumVoice,
  params: RenderSymbolParams,
  out: VDom[],
): void {
  const {measureX, measureY, measureHeight, measureLineWidth, skin, idMap} = params;
  const skinNameForNodes = params.skinName ?? 'default';
  const z = 1200;
  const domainStartX = measureX + layout.noteDomainStartOffset;
  const noteCenterY = (region: number) =>
    measureY + measureHeight - measureLineWidth / 2
    - region * (measureHeight - 5 * measureLineWidth) / 8
    - region * measureLineWidth / 2;
  const affiliatedCtx = {VDoms: out, idMap, skinName: skinNameForNodes, skin, measureHeight};

  const pushAugmentationDot = (
    dot: NonNullable<DrumNotesInfo['augmentationDot']>,
    leftX: number,
    region: number,
    dataComment: string,
  ) => {
    const augSkinKey = getAugmentationDotSkinKey(dot);
    const augSkin = skin[augSkinKey];
    if (!augSkin) return;
    let augY = noteCenterY(region) - augSkin.h / 2;
    if (region % 2 === 0) augY -= measureHeight / 8;
    out.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: leftX + AUGMENTATION_DOT_GAP * measureHeight,
      y: augY,
      w: augSkin.w,
      h: augSkin.h,
      zIndex: z,
      tag: 'augmentationDot',
      skinName: skinNameForNodes,
      targetId: dot.id,
      skinKey: augSkinKey,
      dataComment,
    });
  };

  const renderRest = (rest: DrumRest, slotX: number) => {
    const restKey = getRestSkinKey(rest.chronaxie);
    const restItem = skin[restKey];
    if (!restItem) return;
    const vdom: VDom = {
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: slotX,
      y: noteCenterY(rest.region) - restItem.h / 2,
      w: restItem.w,
      h: restItem.h,
      zIndex: z,
      tag: 'rest',
      skinName: skinNameForNodes,
      targetId: rest.id,
      skinKey: restKey,
      dataComment: '休止符',
    };
    out.push(vdom);
    setNodeIdMap(idMap, rest.id, vdom);
    if (rest.augmentationDot) {
      pushAugmentationDot(rest.augmentationDot, slotX + restItem.w, rest.region, '休止符附点');
    }
    renderSingleNoteAffiliatedSymbols(rest.affiliatedSymbols ?? [], vdom, affiliatedCtx);
  };

  const renderNote = (note: DrumNote, slotX: number) => {
    const allNotesInfo = note.notesInfo;
    const stemW = skin[DrumNotationSkinKeyEnum.NoteStem]?.w ?? 0;
    // 同槽音符头宽度不一时，up 声部右对齐（贴符干）、down 声部左对齐（贴符干）
    const maxHeadW = Math.max(0, ...allNotesInfo.map((n) => skin[getDrumHeadSkinKey(n.headType)]?.w ?? 0));
    const displacement = computeSecondDisplacement(allNotesInfo, voice);
    const headShiftX = new Map<string, number>();

    // 1) 音符头：皮肤按音符头类型；同符干组内二度相邻者错位到符干另一侧
    for (const n of allNotesInfo) {
      const headKey = getDrumHeadSkinKey(n.headType);
      const headItem = skin[headKey];
      if (!headItem) continue;
      const side = displacement.get(n.id);
      const shift = side === 'right' ? headItem.w - stemW : side === 'left' ? stemW - headItem.w : 0;
      if (shift !== 0) headShiftX.set(n.id, shift);
      const alignX = voice === 'up' ? maxHeadW - headItem.w : 0;
      const vdom: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: slotX + alignX + shift,
        y: noteCenterY(n.region) - headItem.h / 2,
        w: headItem.w,
        h: headItem.h,
        zIndex: z,
        tag: 'noteHead',
        skinName: skinNameForNodes,
        targetId: n.id,
        skinKey: headKey,
        dataComment: '音符头',
      };
      out.push(vdom);
      setNodeIdMap(idMap, n.id, vdom);
      renderSingleNoteAffiliatedSymbols(n.affiliatedSymbols, vdom, affiliatedCtx);
    }

    // 2) 上下加线：每个音符头独立渲染（按各自 headX 居中）
    const addLineSkinD = skin[DrumNotationSkinKeyEnum.AddLine_d];
    const addLineSkinU = skin[DrumNotationSkinKeyEnum.AddLine_u];
    for (const n of allNotesInfo) {
      const headVDom = idMap.get(n.id)?.noteHead;
      if (!headVDom) continue;
      const ledgerCenterX = headVDom.x + headVDom.w / 2;
      const r = n.region;
      if (addLineSkinD && r < -1) for (let line = -2; line >= r; line -= 2) {
        out.push({
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {ledgerLine: line},
          ...addLineBoxAt(noteCenterY(line), ledgerCenterX, addLineSkinD),
          zIndex: z,
          tag: 'addLine_g', skinName: skinNameForNodes, targetId: n.id,
          skinKey: DrumNotationSkinKeyEnum.AddLine_d, dataComment: '下加线',
        });
      }
      if (addLineSkinU && r > 9) for (let line = 10; line <= r; line += 2) {
        out.push({
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {ledgerLine: line},
          ...addLineBoxAt(noteCenterY(line), ledgerCenterX, addLineSkinU),
          zIndex: z,
          tag: 'addLine_u', skinName: skinNameForNodes, targetId: n.id,
          skinKey: DrumNotationSkinKeyEnum.AddLine_u, dataComment: '上加线',
        });
      }
    }

    const buckets = getStemBuckets(allNotesInfo);

    // 3) 附点：贴所在符干组最右符头
    for (const bucket of buckets) {
      const heads = bucket.map((n) => idMap.get(n.id)?.noteHead).filter((v): v is VDom => v != null);
      if (heads.length === 0) continue;
      const right = Math.max(...heads.map((v) => v.x + v.w));
      for (const n of bucket) {
        if (n.augmentationDot) pushAugmentationDot(n.augmentationDot, right, n.region, '附点');
      }
    }

    // 4) 符干符尾：每个符干组一条；长度从符杠端音符头量起，接点由另一端音符头类型决定
    for (const bucket of buckets) {
      const regions = bucket.map((n) => n.region);
      const up = voice === 'up';
      const extreme = bucket.find((n) => n.region === (up ? Math.max(...regions) : Math.min(...regions)));
      const other = bucket.find((n) => n.region === (up ? Math.min(...regions) : Math.max(...regions)));
      if (!extreme || !other) continue;
      const extremeHead = idMap.get(extreme.id)?.noteHead;
      const otherHead = idMap.get(other.id)?.noteHead;
      if (!extremeHead || !otherHead) continue;
      const stemTailVDoms = renderStemAndTail({
        headX: extremeHead.x - (headShiftX.get(extreme.id) ?? 0),
        headY: extremeHead.y,
        headW: extremeHead.w,
        headH: extremeHead.h,
        stemAttachY: getStemAttachY(other.headType, otherHead, voice, measureHeight),
        measureY,
        measureHeight,
        skin,
        zIndex: z,
        chronaxie: bucket[0]!.chronaxie,
        direction: voice,
        stemTargetId: extreme.id,
        skinName: skinNameForNodes,
      });
      for (const v of stemTailVDoms) {
        out.push(v);
        if (v.targetId) setNodeIdMap(idMap, v.targetId, v);
      }
    }
  };

  for (let i = 0; i < slots.length; i++) {
    const geo = layout.slotGeometries[i];
    if (!geo) continue;
    const sym = slotSymbol(slots[i]!);
    const slotX = domainStartX + geo.startInDomain;
    if (isDrumRest(sym)) renderRest(sym, slotX);
    else if (isDrumNote(sym)) renderNote(sym, slotX);
  }
}

/** 前置小节线在小节内的左边缘 x（供连谱小节线 barline_f 定位） */
export function getBarlineFXInMeasure(
  measure: Measure,
  measureX: number,
  skin: import("@/types/common").DrumNotationSkinPack,
  role?: LongRestRole | null,
): number {
  const before = getPrefixParts(measure, role).filter((p) => p.tag !== 'barline_f');
  return measureX + sumPartsWidth(before, skin);
}

/** 后置小节线在小节内的左边缘 x（后置小节线排在后置符号第一位，供连谱小节线 barline_b 定位） */
export function getBarlineXInMeasure(
  measure: Measure,
  measureX: number,
  measureWidth: number,
  skin: import("@/types/common").DrumNotationSkinPack,
  role?: LongRestRole | null,
): number {
  return measureX + measureWidth - sumPartsWidth(getSuffixParts(measure, role), skin);
}
