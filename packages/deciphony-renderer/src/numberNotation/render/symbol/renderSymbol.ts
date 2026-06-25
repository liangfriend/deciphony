/**
 * 简谱小节符号渲染：前置谱号→前置调号→前置拍号→音符→后置谱号→小节线→后置调号→后置拍号
 * syllable: 0=休止符, 1-7=do~si, X=节奏音符；减时线有 beamType 控制断开/连接
 */

import {VDom} from "@/types/common";
import type {NoteNumber, NotesNumberInfo} from "@/types/MusicScoreType";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import type {NodeIdMap, RenderSymbolParams} from "../types";
import {
  ACCIDENTAL_NOTE_X_GAP,
  ACCIDENTAL_NOTE_Y_OFFSET,
  AUGMENTATION_DOT_X_GAP,
  AUGMENTATION_DOT_Y_OFFSET,
  KEY_SIGNATURE_B_X_OFFSET,
  KEY_SIGNATURE_B_Y_OFFSET,
  KEY_SIGNATURE_F_X_OFFSET,
  KEY_SIGNATURE_F_Y_OFFSET,
  OCTAVE_DOT_FIRST_OFFSET,
  OCTAVE_DOT_SPACING,
  REDUCE_LINE_Y_OFFSET
} from "../constants";
import {
  chronaxieToBeamLineCount,
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getBarlineSkinKey,
  getClefForMeasure,
  getKeySignatureSkinKey,
  getReduceLineSkinKey,
  getSyllableSkinKey,
  getTimeSignatureSkinKey,
} from "../utils/skinKey";
import {
  getAddLineCount,
  getInfoChronaxie,
  isSlotRest,
  resolveAddLineXFromLayout,
  resolveAugmentationDotAnchorXFromLayout,
} from "../utils/note";
import {
  graceNoteNumberBeforeWidth,
  renderGraceNotesNumberAfter,
  renderGraceNotesNumberBefore,
} from "../grace/renderGraceNumber";
import {floorCenterY} from "../utils/noteLayout";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {renderSingleNoteAffiliatedSymbols} from "@/render/affiliated";
import {
  buildMeasureColumnLayout,
  computeSlotOnset,
} from "@/render/layout/measureColumnLayout";
import {createNumberNotationColumnLayoutAdapter} from "../layout/measureColumnLayoutAdapter";

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
  } = params;
  const skinNameForNodes = skinName ?? 'default';
  const out: VDom[] = [];
  const z = 1200;
  const clefType = getClefForMeasure(measures, measureIndex);

  type RightPart = {
    skinKey: typeof NumberNotationSkinKeyEnum[keyof typeof NumberNotationSkinKeyEnum];
    tag: VDom['tag'];
    dataComment: string;
    targetId: string;
  };

  let prefixW = 0;
  // if (measure.clef_f) {
  //   const key = getClefSkinKey(measure.clef_f.type, true);
  //   const item = skin[key];
  //   if (item) prefixW += item.w;
  // }
  // 简谱调号绘制在小节上方，不参与定宽 prefixW
  if (measure.timeSignature_f) {
    const key = getTimeSignatureSkinKey(measure.timeSignature_f.type);
    const item = skin[key];
    if (item) prefixW += item.w;
  }
  if (measure.barline_f) {
    const key = getBarlineSkinKey(measure.barline_f.type);
    const item = skin[key];
    if (item) prefixW += item.w;
  }

  const rightParts: RightPart[] = [];
  if (measure.barline_b) {
    rightParts.push({
      skinKey: getBarlineSkinKey(measure.barline_b.type),
      tag: 'barline_b',
      dataComment: '后置小节线',
      targetId: measure.barline_b.id ?? '',
    });
  }
  // if (measure.clef_b) {
  //   rightParts.push({
  //     skinKey: getClefSkinKey(measure.clef_b.type, false),
  //     tag: 'clef_b',
  //     dataComment: '后置谱号',
  //     targetId: measure.clef_b.id ?? '',
  //   });
  // }
  if (measure.keySignature_b) {
    rightParts.push({
      skinKey: getKeySignatureSkinKey(measure.keySignature_b.type),
      tag: 'keySignature_b',
      dataComment: '后置调号',
      targetId: measure.keySignature_b.id ?? '',
    });
  }
  if (measure.timeSignature_b) {
    rightParts.push({
      skinKey: getTimeSignatureSkinKey(measure.timeSignature_b.type),
      tag: 'timeSignature_b',
      dataComment: '后置拍号',
      targetId: measure.timeSignature_b.id ?? '',
    });
  }
  let suffixW = 0;
  for (const p of rightParts) {
    const item = skin[p.skinKey];
    // 简谱调号不参与x累加
    if (p.tag === 'keySignature_b') continue;
    if (item) suffixW += item.w;
  }

  const noteDomainW = Math.max(0, measureWidth - prefixW - suffixW);

  /** 简谱调号位置：前置 X=小节x Y=小节y-调号.h；后置 X=小节x+小节w-调号.w Y=小节y-调号.h */
  const pushSymbol = (
    x: number,
    skinKey: typeof NumberNotationSkinKeyEnum[keyof typeof NumberNotationSkinKeyEnum],
    tag: VDom['tag'],
    dataComment: string,
    targetId: string,
    yOffset?: number,
    opts?: { xOverride?: number; yOverride?: number },
  ) => {
    const item = skin[skinKey];
    if (!item) return;
    const finalX = opts?.xOverride ?? x;
    let y = opts?.yOverride != null ? opts.yOverride : measureY + (measureHeight - item.h) / 2;
    if (opts?.yOverride == null && yOffset != null) y += yOffset;
    const vdom: VDom = {
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: finalX, y, w: item.w, h: item.h, zIndex: z, tag, skinName: skinNameForNodes, targetId, skinKey, dataComment,
    };
    out.push(vdom);
    if (targetId) setNodeIdMap(idMap, targetId, vdom);
  };

  let x = measureX;
  // if (measure.clef_f) {
  //   const clefKey = getClefSkinKey(measure.clef_f.type, true);
  //   pushSymbol(x, clefKey, 'clef_f', '前置谱号', measure.clef_f.id ?? '');
  //   const item = skin[clefKey];
  //   if (item) x += item.w;
  // }
  if (measure.keySignature_f) {
    const keySigKey = getKeySignatureSkinKey(measure.keySignature_f.type);
    const keySigItem = skin[keySigKey];
    const kf = measure.keySignature_f;
    if (keySigItem) {
      pushSymbol(x, keySigKey, 'keySignature_f', '前置调号', kf.id ?? '', undefined, {
        xOverride: x + KEY_SIGNATURE_F_X_OFFSET * measureHeight,
        yOverride: measureY - keySigItem.h + KEY_SIGNATURE_F_Y_OFFSET * measureHeight,
      });
    }
  }
  if (measure.timeSignature_f) {
    const timeSigKey = getTimeSignatureSkinKey(measure.timeSignature_f.type);
    pushSymbol(x, timeSigKey, 'timeSignature_f', '前置拍号', measure.timeSignature_f.id ?? '');
    const item = skin[timeSigKey];
    if (item) x += item.w;
  }
  if (measure.barline_f) {
    const barlineKey = getBarlineSkinKey(measure.barline_f.type);
    pushSymbol(x, barlineKey, 'barline_f', '前置小节线', measure.barline_f.id ?? '');
    const item = skin[barlineKey];
    if (item) x += item.w;
  }

  const notes = measure.notes as NoteNumber[];
  const columnAdapter = createNumberNotationColumnLayoutAdapter(skin, measureHeight);
  const layout =
    columnLayout ?? buildMeasureColumnLayout(measure, noteDomainW, prefixW, columnAdapter);
  const domainStartX = measureX + layout.noteDomainStartOffset;

  type SlotInfo = {
    note: NoteNumber;
    i: number;
    slotStartX: number;
    slotW: number;
    /** 槽位布局锚点 x（未叠 Frame）；减时线等 note 层级符号用此值 */
    slotX: number;
    refW: number;
    isRest: boolean;
  };

  function getFloorInfo(slot: SlotInfo, floorIdx: number): NotesNumberInfo | null {
    if (slot.isRest) return floorIdx === 0 ? (slot.note.notesInfo[0] ?? null) : null;
    return slot.note.notesInfo[floorIdx] ?? null;
  }

  function maxFloorCount(slotList: SlotInfo[]): number {
    let max = 0;
    for (const s of slotList) {
      if (s.isRest) max = Math.max(max, 1);
      else max = Math.max(max, s.note.notesInfo.length);
    }
    return max;
  }

  function renderAddLines(
    info: NotesNumberInfo,
    note: NoteNumber,
    slotOnset: number,
    floorIdx: number,
    targetId: string,
  ): void {
    const chronaxie = getInfoChronaxie(info, note);
    const addLineCount = getAddLineCount(chronaxie);
    if (addLineCount <= 0) return;
    const addLineSkin = skin[NumberNotationSkinKeyEnum.Addline];
    if (!addLineSkin) return;
    const lineY = floorCenterY(measureY, measureHeight, floorIdx, measure.floorSpan) - addLineSkin.h / 2;
    for (let k = 0; k < addLineCount; k++) {
      const lineX = resolveAddLineXFromLayout(layout, domainStartX, slotOnset, k);
      if (lineX == null) continue;
      out.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: lineX,
        y: lineY,
        w: addLineSkin.w,
        h: addLineSkin.h,
        zIndex: z,
        tag: 'addLine',
        skinName: skinNameForNodes,
        targetId,
        skinKey: NumberNotationSkinKeyEnum.Addline,
        dataComment: '加时线',
      });
    }
  }

  const slots: SlotInfo[] = [];

  if (notes.length > 0) {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const geo = layout.slotGeometries[i];
      if (!geo) continue;
      const slotStartX = domainStartX + geo.startInDomain;
      const slotW = geo.width;

      const isRestSlot = isSlotRest(note);

      let referenceW: number;
      if (isRestSlot) {
        const num0Item = skin[NumberNotationSkinKeyEnum.Number_0];
        if (!num0Item) continue;
        referenceW = num0Item.w;
      } else {
        referenceW = 0;
        for (const n of note.notesInfo) {
          const numSkin = skin[getSyllableSkinKey(n.syllable)];
          if (numSkin && numSkin.w > referenceW) referenceW = numSkin.w;
        }
        if (referenceW <= 0) referenceW = skin[NumberNotationSkinKeyEnum.Number_1]?.w ?? 20;
      }

      // 数字头 x：同 onset 列内各时值共用整列 slotW 居中
      let graceBeforeW = 0;
      if (!isRestSlot) {
        for (const ni of note.notesInfo) {
          graceBeforeW = Math.max(graceBeforeW, graceNoteNumberBeforeWidth(ni.graceNotes, ni, skin, measureHeight));
        }
      }
      const slotOnset = computeSlotOnset(measure, i, columnAdapter);
      const slotX = slotStartX + graceBeforeW;
      if (note.notesInfo.length === 0) continue;
      slots.push({note, i, slotStartX, slotW, slotX, refW: referenceW, isRest: isRestSlot});

      let firstHeadVDom: VDom | null = null;
      const allNotes = note.notesInfo.slice();
      const octaveDotSkin = skin[NumberNotationSkinKeyEnum.OctaveDot];
      const fOff = OCTAVE_DOT_FIRST_OFFSET * measureHeight;
      const spacing = OCTAVE_DOT_SPACING * measureHeight;

      const graceCtx = {
        measureY,
        measureHeight,
        floorSpan: measure.floorSpan,
        skin,
        skinName: skinNameForNodes,
        zIndex: z,
        idMap,
        out,
      };
      // 休止符渲染
      if (isRestSlot) {
        const restInfo = allNotes[0];
        const restChronaxie = restInfo ? getInfoChronaxie(restInfo) : 64;
        const headKey = NumberNotationSkinKeyEnum.Number_0;
        const num0Item = skin[headKey];
        if (!num0Item) continue;
        const hcy = floorCenterY(measureY, measureHeight, 0, measure.floorSpan);
        const ny = hcy - num0Item.h / 2;
        const vdom: VDom = {
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: slotX,
          y: ny,
          w: num0Item.w,
          h: num0Item.h,
          zIndex: z,
          tag: 'rest',
          skinName: skinNameForNodes,
          targetId: restInfo?.id ?? note.id,
          skinKey: headKey,
          dataComment: '休止符',
        };
        out.push(vdom);
        setNodeIdMap(idMap, restInfo?.id ?? note.id, vdom);
        if (restInfo?.augmentationDot) {
          const augSkinKey = getAugmentationDotSkinKey(restInfo.augmentationDot);
          const augSkin = skin[augSkinKey];
          const addLineSkin = skin[NumberNotationSkinKeyEnum.Addline];
          if (augSkin) {
            const restCh = getInfoChronaxie(restInfo, note);
            const anchorX = resolveAugmentationDotAnchorXFromLayout(
              layout,
              domainStartX,
              slotOnset,
              restCh,
              slotX,
              num0Item.w,
              addLineSkin?.w ?? 0,
            );
            const augX = anchorX + AUGMENTATION_DOT_X_GAP * measureHeight;
            const augY = hcy + AUGMENTATION_DOT_Y_OFFSET * measureHeight - augSkin.h / 2;
            out.push({
              startPoint: {x: 0, y: 0},
              endPoint: {x: 0, y: 0},
              special: {},
              x: augX,
              y: augY,
              w: augSkin.w,
              h: augSkin.h,
              zIndex: z,
              tag: 'augmentationDot',
              skinName: skinNameForNodes,
              targetId: restInfo.augmentationDot.id,
              skinKey: augSkinKey,
              dataComment: '休止符附点',
            });
          }
        }
        if (restInfo) {
          renderAddLines(restInfo, note, slotOnset, 0, restInfo.id);
        }
      } else { // 音符渲染
        // 先渲染音符头（slotX）；变音/八度点/附点等 NotesNumberInfo 符号再从音符头 vDom 取 headX
        for (let stackIdx = 0; stackIdx < allNotes.length; stackIdx++) {
          const n = allNotes[stackIdx];
          const numKey = getSyllableSkinKey(n.syllable);
          const numItem = skin[numKey];
          if (!numItem) continue;
          const hcy = floorCenterY(measureY, measureHeight, stackIdx, measure.floorSpan);
          const ny = hcy - numItem.h / 2;
          const vdom: VDom = {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: slotX, y: ny, w: numItem.w, h: numItem.h, zIndex: z,
            tag: 'noteHead', skinName: skinNameForNodes, targetId: n.id, skinKey: numKey,
            dataComment: n.syllable === 'X' ? '节奏音符' : '简谱音符',
          };
          out.push(vdom);
          setNodeIdMap(idMap, n.id, vdom);
          if (!firstHeadVDom) firstHeadVDom = vdom;
        }

        const primaryHeadVDom = allNotes[0] ? idMap.get(allNotes[0].id)?.noteHead : undefined;
        const headX = primaryHeadVDom?.x ?? slotX;

        for (let stackIdx = 0; stackIdx < allNotes.length; stackIdx++) {
          const gn = allNotes[stackIdx]!;
          renderGraceNotesNumberBefore(gn.graceNotes, gn, headX, {...graceCtx, floorIndex: stackIdx});
        }
        for (let stackIdx = 0; stackIdx < allNotes.length; stackIdx++) {
          const n = allNotes[stackIdx];
          const numKey = getSyllableSkinKey(n.syllable);
          const numItem = skin[numKey];
          const headVDom = idMap.get(n.id)?.noteHead;
          const noteHeadX = headVDom?.x ?? slotX;
          const noteHeadW = headVDom?.w ?? numItem?.w ?? referenceW;
          const hcy = floorCenterY(measureY, measureHeight, stackIdx, measure.floorSpan);

          if (n.accidental) {
            const accSkinKey = getAccidentalSkinKey(n.accidental.type);
            const accSkin = skin[accSkinKey];
            if (accSkin) {
              const accX = noteHeadX - ACCIDENTAL_NOTE_X_GAP * measureHeight - accSkin.w;
              const accY = measureY + ACCIDENTAL_NOTE_Y_OFFSET * measureHeight;
              out.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
                special: {},
                x: accX,
                y: accY,
                w: accSkin.w,
                h: accSkin.h,
                zIndex: z,
                tag: 'accidental',
                skinName: skinNameForNodes,
                targetId: n.accidental.id ?? n.id,
                skinKey: accSkinKey,
                dataComment: '变音符号',
              });
            }
          }

          if (n.augmentationDot) {
            const augSkinKey = getAugmentationDotSkinKey(n.augmentationDot);
            const augSkin = skin[augSkinKey];
            const addLineSkin = skin[NumberNotationSkinKeyEnum.Addline];
            if (augSkin) {
              const ch = getInfoChronaxie(n, note);
              const anchorX = resolveAugmentationDotAnchorXFromLayout(
                layout,
                domainStartX,
                slotOnset,
                ch,
                noteHeadX,
                noteHeadW,
                addLineSkin?.w ?? 0,
              );
              const augX = anchorX + AUGMENTATION_DOT_X_GAP * measureHeight;
              const augY = hcy + AUGMENTATION_DOT_Y_OFFSET * measureHeight - augSkin.h / 2;
              out.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
                special: {},
                x: augX,
                y: augY,
                w: augSkin.w,
                h: augSkin.h,
                zIndex: z,
                tag: 'augmentationDot',
                skinName: skinNameForNodes,
                targetId: n.augmentationDot.id,
                skinKey: augSkinKey,
                dataComment: '附点',
              });
            }
          }

          if ((n.syllable !== 0 && n.syllable !== 'X') && (n.octaveDot ?? 0) !== 0 && octaveDotSkin && numItem) {
            const dotCount = Math.abs(n.octaveDot!);
            const dotX = noteHeadX + (noteHeadW - octaveDotSkin.w) / 2;
            const ny = headVDom?.y ?? (hcy - numItem.h / 2);
            if (n.octaveDot! > 0) {
              let dotY = ny - fOff - octaveDotSkin.h;
              for (let k = 0; k < dotCount; k++) {
                out.push({
                  startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                  x: dotX, y: dotY, w: octaveDotSkin.w, h: octaveDotSkin.h, zIndex: z,
                  tag: 'accidental', skinName: skinNameForNodes, targetId: n.id,
                  skinKey: NumberNotationSkinKeyEnum.OctaveDot, dataComment: '八度点',
                });
                dotY -= octaveDotSkin.h + spacing;
              }
            } else {
              const ch = getInfoChronaxie(n);
              let baseBottom = hcy + numItem.h / 2;
              if (ch <= 32) {
                const reduceLineSkin = skin[getReduceLineSkinKey(ch)];
                const reduceY = hcy + numItem.h / 2 + REDUCE_LINE_Y_OFFSET * measureHeight;
                baseBottom = reduceY + (reduceLineSkin?.h ?? 0);
              }
              let dotY = baseBottom + fOff;
              for (let k = 0; k < dotCount; k++) {
                out.push({
                  startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                  x: dotX, y: dotY, w: octaveDotSkin.w, h: octaveDotSkin.h, zIndex: z,
                  tag: 'accidental', skinName: skinNameForNodes, targetId: n.id,
                  skinKey: NumberNotationSkinKeyEnum.OctaveDot, dataComment: '八度点',
                });
                dotY += octaveDotSkin.h + spacing;
              }
            }
          }
          renderAddLines(n, note, slotOnset, stackIdx, n.id);
        }
        if (firstHeadVDom) {
          renderSingleNoteAffiliatedSymbols(note.affiliatedSymbols, firstHeadVDom, {
            VDoms: out,
            idMap,
            skinName: skinNameForNodes,
            skin,
            measureHeight,
          });
        }
        for (let gi = 0; gi < allNotes.length; gi++) {
          const gn = allNotes[gi]!;
          renderGraceNotesNumberAfter(gn.graceNotesAfter, gn, headX, referenceW, {...graceCtx, floorIndex: gi});
        }
      }

    }

    // 第二遍：按层渲染减时线（每层独立 beam 连接）
    const floorCount = maxFloorCount(slots);
    for (let floorIdx = 0; floorIdx < floorCount; floorIdx++) {
      const hasReduceLineAt = (slot: SlotInfo, info: NotesNumberInfo) =>
        !slot.isRest && info.syllable !== 0 && info.syllable !== 'X' && getInfoChronaxie(info) <= 32;

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]!;
        const info = getFloorInfo(slot, floorIdx);
        if (!info || slot.isRest || info.syllable === 0 || info.syllable === 'X') continue;
        const ch = getInfoChronaxie(info);
        if (ch > 32) continue;

        const reduceLineKey = getReduceLineSkinKey(ch);
        const reduceLineSkin = skin[reduceLineKey];
        if (!reduceLineSkin) continue;

        const beamType = info.beamType ?? BeamTypeEnum.None;
        const myCount = chronaxieToBeamLineCount(ch);
        let leftIdx = i;
        let rightIdx = i;
        if (beamType === BeamTypeEnum.Combined || beamType === BeamTypeEnum.OnlyRight) {
          if (beamType === BeamTypeEnum.Combined) {
            for (let j = i - 1; j >= 0; j--) {
              const leftInfo = getFloorInfo(slots[j]!, floorIdx);
              if (!leftInfo || getInfoChronaxie(leftInfo) > 32) break;
              if (leftInfo.beamType !== BeamTypeEnum.Combined) break;
              leftIdx = j;
            }
          }
          for (let j = i + 1; j < slots.length; j++) {
            const rightInfo = getFloorInfo(slots[j]!, floorIdx);
            if (!rightInfo || getInfoChronaxie(rightInfo) > 32) break;
            if (rightInfo.beamType !== BeamTypeEnum.Combined) break;
            rightIdx = j;
          }
        }
        const leftSlot = leftIdx < i ? slots[leftIdx]! : null;
        const rightSlot = rightIdx > i ? slots[rightIdx]! : null;
        const leftInfo = leftSlot ? getFloorInfo(leftSlot, floorIdx) : null;
        const rightInfo = rightSlot ? getFloorInfo(rightSlot, floorIdx) : null;
        const leftCount = leftInfo && leftSlot && hasReduceLineAt(leftSlot, leftInfo)
          ? chronaxieToBeamLineCount(getInfoChronaxie(leftInfo)) : Infinity;
        const rightCount = rightInfo && rightSlot && hasReduceLineAt(rightSlot, rightInfo)
          ? chronaxieToBeamLineCount(getInfoChronaxie(rightInfo)) : Infinity;

        const slotHeadX = slot.slotX;
        const leftHeadX = leftSlot ? leftSlot.slotX : slotHeadX;
        const rightHeadX = rightSlot ? rightSlot.slotX : slotHeadX;
        const lineX = myCount < leftCount && leftSlot
          ? leftHeadX + leftSlot.refW
          : slotHeadX;
        const lineEnd = myCount <= rightCount && rightSlot
          ? rightHeadX + rightSlot.refW
          : slotHeadX + slot.refW;
        const lineW = Math.max(lineEnd - lineX, slot.refW);

        const numSkin = skin[getSyllableSkinKey(info.syllable)];
        const hcy = floorCenterY(measureY, measureHeight, floorIdx, measure.floorSpan);
        const reduceY = hcy + (numSkin?.h ?? 0) / 2 + REDUCE_LINE_Y_OFFSET * measureHeight;
        out.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: lineX,
          y: reduceY,
          w: lineW,
          h: reduceLineSkin.h,
          zIndex: z,
          tag: 'accidental',
          skinName: skinNameForNodes,
          targetId: info.id,
          skinKey: reduceLineKey,
          dataComment: '减时线',
        });
      }
    }
  }

  x = measureX + measureWidth - suffixW;
  for (const p of rightParts) {
    const item = skin[p.skinKey];
    if (!item) continue;
    const opts = p.tag === 'keySignature_b' && measure.keySignature_b
      ? {
        xOverride: measureX + measureWidth - item.w + KEY_SIGNATURE_B_X_OFFSET * measureHeight,
        yOverride: measureY - item.h + KEY_SIGNATURE_B_Y_OFFSET * measureHeight,
      }
      : undefined;
    pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId, undefined, opts);
    // 简谱调号不参与 x 累加
    if (p.tag === 'keySignature_b') continue;
    x += item.w;
  }

  return out;
}

/** 计算前置小节线在小节内的左边缘 x（timeSig_f 之后，供连谱小节线 barline_f 定位；简谱调号不参与定宽） */
export function getBarlineFXInMeasure(
  measure: import("@/types/MusicScoreType").Measure,
  measureX: number,
  skin: import("@/types/common").NumberNotationSkinPack,
): number {
  let prefixW = 0;
  // if (measure.clef_f) {
  //   const item = skin[getClefSkinKey(measure.clef_f.type, true)];
  //   if (item) prefixW += item.w;
  // }
  if (measure.timeSignature_f) {
    const item = skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)];
    if (item) prefixW += item.w;
  }
  return measureX + prefixW;
}

/** 计算后置小节线在小节内的左边缘 x（与 renderSymbol 中 rightParts 摆放一致，简谱 suffixW 不含 keySignature_b） */
export function getBarlineXInMeasure(
  measure: import("@/types/MusicScoreType").Measure,
  measureX: number,
  measureWidth: number,
  skin: import("@/types/common").NumberNotationSkinPack,
): number {
  const rightParts: {
    skinKey: typeof NumberNotationSkinKeyEnum[keyof typeof NumberNotationSkinKeyEnum];
    tag: string
  }[] = [];
  if (measure.barline_b) rightParts.push({skinKey: getBarlineSkinKey(measure.barline_b.type), tag: 'barline_b'});
  // if (measure.clef_b) rightParts.push({ skinKey: getClefSkinKey(measure.clef_b.type, false), tag: 'clef_b' });
  if (measure.keySignature_b) rightParts.push({
    skinKey: getKeySignatureSkinKey(measure.keySignature_b.type),
    tag: 'keySignature_b'
  });
  if (measure.timeSignature_b) rightParts.push({
    skinKey: getTimeSignatureSkinKey(measure.timeSignature_b.type),
    tag: 'timeSignature_b'
  });
  let suffixW = 0;
  for (const p of rightParts) {
    if (p.tag === 'keySignature_b') continue;
    const item = skin[p.skinKey];
    if (item) suffixW += item.w;
  }
  let x = measureX + measureWidth - suffixW;
  const barlineIdx = rightParts.findIndex((p) => p.tag === 'barline_b');
  if (barlineIdx < 0) return x;
  for (let j = 0; j < barlineIdx; j++) {
    const item = skin[rightParts[j].skinKey];
    if (item) x += item.w;
  }
  return x;
}
