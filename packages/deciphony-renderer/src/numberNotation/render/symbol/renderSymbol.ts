/**
 * 简谱小节符号渲染：前置谱号→前置调号→前置拍号→音符→后置谱号→小节线→后置调号→后置拍号
 * syllable: 0=休止符, 1-7=do~si, X=节奏音符；减时线有 beamType 控制断开/连接
 */

import {VDom} from "@/types/common";
import type {AugmentationDot, VoiceBeatNumber} from "@/types/MusicScoreType";
import {NoteNumber} from "@/types/MusicScoreType";
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
  OCTAVE_DOT_LAST_EDGE_MARGIN,
  OCTAVE_DOT_SPACING,
  REDUCE_LINE_Y_OFFSET
} from "../constants";
import {
  chronaxieToBeamLineCount,
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getBarlineSkinKey,
  getClefForMeasure,
  getClefSkinKey,
  getKeySignatureSkinKey,
  getReduceLineSkinKey,
  getSyllableSkinKey,
  getTimeSignatureSkinKey,
} from "../utils/skinKey";
import {getNoteWidthRatio, getSlotChronaxie, getSlotRestChronaxie, isSlotRest} from "../utils/note";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
  let obj = map.get(id);
  if (!obj) {
    obj = {};
    map.set(id, obj);
  }
  obj[vdom.tag] = vdom;
}

/** 音符 y 中心：全部居中，堆叠时按 stackIndex 依次 +measureHeight；yOffset 为八度点等导致的累加偏移（负值=上移） */
function noteCenterY(
  measureY: number,
  measureHeight: number,
  stackIndex: number,
  noteH = measureHeight,
  yOffset = 0,
): number {
  return measureY + measureHeight / 2 - stackIndex * noteH + yOffset;
}

/** 计算单个音符的上/下八度点总高度（用于堆叠时累加偏移） */
function getOctaveDotHeight(
  octaveDot: number | undefined,
  dotH: number,
  fOff: number,
  spacing: number,
  isUpper: boolean,
): number {
  if (octaveDot == null || octaveDot === 0) return 0;
  const need = isUpper ? octaveDot > 0 : octaveDot < 0;
  if (!need) return 0;
  const count = Math.abs(octaveDot);
  return fOff + count * dotH + Math.max(0, count - 1) * spacing;
}

/** 计算和弦各音符的八度点累加 y 偏移：上方音符需累加自己的下八度点 + 下方音符的上下八度点 */
function computeOctaveDotYOffsets(
  allNotes: { syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X'; octaveDot?: number }[],
  dotH: number,
  fOff: number,
  spacing: number,
  lastEdgeMargin: number,
): number[] {
  const offsets: number[] = [];
  const skip = (s: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X') => s === 0 || s === 'X';
  for (let k = 0; k < allNotes.length; k++) {
    let acc = 0;
    for (let j = 0; j < k; j++) {
      const upperJ = skip(allNotes[j].syllable) ? 0 : getOctaveDotHeight(allNotes[j].octaveDot, dotH, fOff, spacing, true);
      const lowerJ1 = j + 1 < allNotes.length && !skip(allNotes[j + 1].syllable)
        ? getOctaveDotHeight(allNotes[j + 1].octaveDot, dotH, fOff, spacing, false)
        : 0;
      acc += upperJ + lowerJ1;
      if (upperJ > 0 && lowerJ1 > 0) acc += lastEdgeMargin;
    }
    offsets.push(-acc);
  }
  return offsets;
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
  if (measure.clef_f) {
    const key = getClefSkinKey(measure.clef_f.clefType, true);
    const item = skin[key];
    if (item) prefixW += item.w;
  }
  if (measure.keySignature_f) {
    const key = getKeySignatureSkinKey(measure.keySignature_f.type);
    const item = skin[key];
    if (item) prefixW += item.w;
  }
  if (measure.timeSignature_f) {
    const key = getTimeSignatureSkinKey(measure.timeSignature_f.type);
    const item = skin[key];
    if (item) prefixW += item.w;
  }

  const rightParts: RightPart[] = [];
  if (measure.clef_b) {
    rightParts.push({
      skinKey: getClefSkinKey(measure.clef_b.clefType, false),
      tag: 'clef_b',
      dataComment: '后置谱号',
      targetId: measure.clef_b.id ?? '',
    });
  }
  if (measure.barline) {
    rightParts.push({
      skinKey: getBarlineSkinKey(measure.barline.barlineType),
      tag: 'barline',
      dataComment: '小节线',
      targetId: measure.barline.id ?? '',
    });
  }
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
  if (measure.clef_f) {
    const clefKey = getClefSkinKey(measure.clef_f.clefType, true);
    pushSymbol(x, clefKey, 'clef_f', '前置谱号', measure.clef_f.id ?? '');
    const item = skin[clefKey];
    if (item) x += item.w;
  }
  if (measure.keySignature_f) {
    const keySigKey = getKeySignatureSkinKey(measure.keySignature_f.type);
    const keySigItem = skin[keySigKey];
    const kf = measure.keySignature_f;
    if (keySigItem) {
      pushSymbol(x, keySigKey, 'keySignature_f', '前置调号', kf.id ?? '', undefined, {
        xOverride: x + KEY_SIGNATURE_F_X_OFFSET * measureHeight + (kf.relativeX ?? 0),
        yOverride: measureY - keySigItem.h + KEY_SIGNATURE_F_Y_OFFSET * measureHeight + (kf.relativeY ?? 0),
      });
    }
  }
  if (measure.timeSignature_f) {
    const timeSigKey = getTimeSignatureSkinKey(measure.timeSignature_f.type);
    pushSymbol(x, timeSigKey, 'timeSignature_f', '前置拍号', measure.timeSignature_f.id ?? '');
    const item = skin[timeSigKey];
    if (item) x += item.w;
  }

  const notes = measure.notes as NoteNumber[];
  const totalNoteRatio = notes.reduce((sum, n) => sum + getNoteWidthRatio(n, skin), 0);
  const domainStartX = measureX + prefixW;
  const useEqualSlots = notes.length > 0 && totalNoteRatio <= 0;

  type SlotInfo = {
    note: NoteNumber;
    i: number;
    slotStartX: number;
    slotW: number;
    headX: number;
    refW: number;
    beat: VoiceBeatNumber | null;
    isRest: boolean
  };
  const slots: SlotInfo[] = [];

  if (notes.length > 0) {
    let accRatio = 0;
    const slotWidth = useEqualSlots ? noteDomainW / notes.length : 0;
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const ratio = useEqualSlots ? 1 : getNoteWidthRatio(note, skin);
      const slotW = useEqualSlots ? slotWidth : (ratio / totalNoteRatio) * noteDomainW;
      const slotStartX = domainStartX + (useEqualSlots ? i * slotWidth : (accRatio / totalNoteRatio) * noteDomainW);
      if (!useEqualSlots) accRatio += ratio;

      const isRestSlot = isSlotRest(note);
      const restChronaxie = getSlotRestChronaxie(note);

      let referenceW: number;
      if (isRestSlot) {
        const num0Item = skin[NumberNotationSkinKeyEnum.Number_0];
        if (!num0Item) continue;
        referenceW = num0Item.w;
      } else {
        referenceW = 0;
        for (const n of note.voicePart.notesInfo) {
          const numSkin = skin[getSyllableSkinKey(n.syllable)];
          if (numSkin && numSkin.w > referenceW) referenceW = numSkin.w;
        }
        if (referenceW <= 0) referenceW = skin[NumberNotationSkinKeyEnum.Number_1]?.w ?? 20;
      }

      // 计算音符头的x值：四分及以下居中；二分因1条加时线 slotW/2；全音符因3条加时线 slotW/4
      const slotChronaxie = isRestSlot ? restChronaxie : getSlotChronaxie(note);
      // 一个音符宽度域中每一份的宽度（如果没有加时线等于音符宽度域slotW）
      const effectiveSlotW = slotChronaxie <= 64 ? slotW : (slotChronaxie === 128 ? slotW / 2 : slotW / 4);
      const headX = slotStartX
      const beat = note.voicePart.notesInfo.length > 0 ? note.voicePart : null;
      slots.push({note, i, slotStartX, slotW, headX, refW: referenceW, beat, isRest: isRestSlot});

      if (!beat) continue;
      let firstHeadVDom: VDom | null = null;
      const allNotes = beat.notesInfo.slice();
      const octaveDotSkin = skin[NumberNotationSkinKeyEnum.OctaveDot];
      const fOff = OCTAVE_DOT_FIRST_OFFSET * measureHeight;
      const spacing = OCTAVE_DOT_SPACING * measureHeight;
      const lastEdgeMargin = OCTAVE_DOT_LAST_EDGE_MARGIN * measureHeight;
      const octaveDotYOffsets = octaveDotSkin
        ? computeOctaveDotYOffsets(allNotes, octaveDotSkin.h, fOff, spacing, lastEdgeMargin)
        : allNotes.map(() => 0);
      // 休止符渲染
      if (isRestSlot) {
        const headKey = NumberNotationSkinKeyEnum.Number_0;
        const num0Item = skin[headKey];
        if (!num0Item) continue;
        const ny = measureY + (measureHeight - num0Item.h) / 2;
        const vdom: VDom = {
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: headX,
          y: ny,
          w: num0Item.w,
          h: num0Item.h,
          zIndex: z,
          tag: 'rest',
          skinName: skinNameForNodes,
          targetId: note.id,
          skinKey: headKey,
          dataComment: '休止符',
        };
        out.push(vdom);
        setNodeIdMap(idMap, note.id, vdom);
        // 休止符加时线：二分1条、全音符3条
        const addLineCount = restChronaxie === 128 ? 1 : restChronaxie === 256 ? 3 : 0;
        if (addLineCount > 0) {
          const addLineSkin = skin[NumberNotationSkinKeyEnum.addLine];
          if (addLineSkin) {
            for (let k = 0; k < addLineCount; k++) {
              const lineY = measureY + (measureHeight - addLineSkin.h) / 2
              const lineX = slotStartX + effectiveSlotW * (k + 1)
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
                targetId: note.id,
                skinKey: NumberNotationSkinKeyEnum.addLine,
                dataComment: '加时线',
              });
            }
          }
        }
      } else { // 音符渲染
        for (let stackIdx = 0; stackIdx < allNotes.length; stackIdx++) {
          const n = allNotes[stackIdx];
          const numKey = getSyllableSkinKey(n.syllable);
          const numItem = skin[numKey];
          const hcy = noteCenterY(measureY, measureHeight, stackIdx, numItem?.h ?? measureHeight, octaveDotYOffsets[stackIdx]);

          if (n.accidental) {
            const accSkinKey = getAccidentalSkinKey(n.accidental.type);
            const accSkin = skin[accSkinKey];
            if (accSkin) {
              const accX = headX - ACCIDENTAL_NOTE_X_GAP * measureHeight - accSkin.w + (n.accidental.relativeX ?? 0);
              const accY = measureY + ACCIDENTAL_NOTE_Y_OFFSET * measureHeight + (n.accidental.relativeY ?? 0)
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


          if (!numItem) continue;

          const ny = hcy - numItem.h / 2;
          const vdom: VDom = {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: headX, y: ny, w: numItem.w, h: numItem.h, zIndex: z,
            tag: 'noteHead', skinName: skinNameForNodes, targetId: n.id, skinKey: numKey,
            dataComment: n.syllable === 'X' ? '节奏音符' : '简谱音符',
          };
          out.push(vdom);
          setNodeIdMap(idMap, n.id, vdom);
          if (!firstHeadVDom) firstHeadVDom = vdom;

          // 八度点：休止符与节奏音符不渲染
          if ((n.syllable === 0 || n.syllable === 'X') || (n.octaveDot ?? 0) === 0) continue;
          if (!octaveDotSkin) continue;
          const dotCount = Math.abs(n.octaveDot!);
          const dotX = headX + (numItem.w - octaveDotSkin.w) / 2;
          if (n.octaveDot! > 0) {
            // 上方八度点：从音符顶部向上排列
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
            // 下方八度点：仅最下方音符（stackIdx 0）有减时线时贴着减时线下缘，其它音符贴着自身下缘
            let baseBottom: number;
            if (stackIdx === 0 && beat && beat.chronaxie <= 32) {
              const reduceLineKey = getReduceLineSkinKey(beat.chronaxie);
              const reduceLineSkin = skin[reduceLineKey];
              const lowestNote = allNotes[0];
              const lowestNumSkin = skin[getSyllableSkinKey(lowestNote.syllable)];
              const lowestCy = noteCenterY(measureY, measureHeight, 0, lowestNumSkin?.h ?? measureHeight, octaveDotYOffsets[0]);
              const reduceY = lowestCy + (lowestNumSkin?.h ?? 0) / 2 + REDUCE_LINE_Y_OFFSET * measureHeight;
              baseBottom = reduceY + (reduceLineSkin?.h ?? 0);
            } else {
              baseBottom = hcy + numItem.h / 2;
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
        // 音符加时线：二分1条、全音符3条，y居中，x等分居中
        const addLineCount = slotChronaxie === 128 ? 1 : slotChronaxie === 256 ? 3 : 0;
        if (addLineCount > 0) {
          const addLineSkin = skin[NumberNotationSkinKeyEnum.addLine];
          if (addLineSkin) {
            for (let k = 0; k < addLineCount; k++) {
              const lineY = measureY + (measureHeight - addLineSkin.h) / 2
              const lineX = slotStartX + effectiveSlotW * (k + 1)
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
                targetId: note.id,
                skinKey: NumberNotationSkinKeyEnum.addLine,
                dataComment: '加时线',
              });
            }
          }
        }
      }

      if (beat.augmentationDot) {
        const augSkinKey = getAugmentationDotSkinKey(beat.augmentationDot as AugmentationDot);
        const augSkin = skin[augSkinKey];
        const numItem = skin[NumberNotationSkinKeyEnum.Number_1];
        if (augSkin && numItem) {
          const augX = headX + numItem.w + AUGMENTATION_DOT_X_GAP * measureHeight;
          allNotes.forEach((n, stackIdx) => {
            if (n.syllable === 0 || n.syllable === 'X') return;
            const numKey = getSyllableSkinKey(n.syllable);
            const numItemN = skin[numKey];
            if (!numItemN) return;
            const hcy = noteCenterY(measureY, measureHeight, stackIdx, numItemN.h, octaveDotYOffsets[stackIdx]);
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
              tag: 'accidental',
              skinName: skinNameForNodes,
              targetId: beat.augmentationDot!.id,
              skinKey: augSkinKey,
              dataComment: '附点',
            });
          });
        }
      }

      if (firstHeadVDom) setNodeIdMap(idMap, note.id, firstHeadVDom);
    }

    // 第二遍：渲染减时线（slots 已完整，可正确计算连接）
    /*
    * 比如音符A,B 减时线数： 1 2
      此时将A的减时线延长到B的x位置
      音符A,B 减时线：2 1
      此时将B的减时线x减少到A的减时线结束位置，就是A的音符x+音符皮肤w。然后延长B的减时线w到B的x+B音符皮肤w
      音符A B C  2 1 2
      此时将中间减时线向左移动，并延长到音符C开始
      就是这样，永远会移动减时线少的乙方
      * 如果A B 相等，延长左侧减时线
    * */
    const hasReduceLine = (s: SlotInfo) => s.beat != null && s.beat.chronaxie <= 32;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.beat || slot.beat.chronaxie > 32) continue;
      const reduceLineKey = getReduceLineSkinKey(slot.beat.chronaxie);
      const reduceLineSkin = skin[reduceLineKey];
      if (!reduceLineSkin) continue;
      const allNotes = slot.beat.notesInfo;
      if (allNotes.length === 0) continue;

      const beamType = slot.beat.beamType ?? BeamTypeEnum.None;
      const myCount = chronaxieToBeamLineCount(slot.beat.chronaxie);
      let leftIdx = i;
      let rightIdx = i;
      if (beamType === BeamTypeEnum.Combined || beamType === BeamTypeEnum.OnlyRight) {
        if (beamType === BeamTypeEnum.Combined) {
          for (let j = i - 1; j >= 0; j--) {
            const s = slots[j];
            if (s.isRest || !s.beat || !hasReduceLine(s)) break;
            if (s.beat.beamType !== BeamTypeEnum.Combined) break;
            leftIdx = j;
          }
        }
        for (let j = i + 1; j < slots.length; j++) {
          const s = slots[j];
          if (s.isRest || !s.beat || !hasReduceLine(s)) break;
          if (s.beat.beamType !== BeamTypeEnum.Combined) break;
          rightIdx = j;
        }
      }
      const leftSlot = leftIdx < i ? slots[i - 1] : null;
      const rightSlot = rightIdx > i ? slots[i + 1] : null;
      const leftCount = leftSlot && hasReduceLine(leftSlot) ? chronaxieToBeamLineCount(leftSlot.beat!.chronaxie) : Infinity;
      const rightCount = rightSlot && hasReduceLine(rightSlot) ? chronaxieToBeamLineCount(rightSlot.beat!.chronaxie) : Infinity;
      // 减时线少的向多的一方延伸；相等时延长左侧（myCount <= rightCount 时向右延伸）
      const lineX = myCount < leftCount && leftSlot
        ? leftSlot.headX + leftSlot.refW
        : slot.headX;
      const lineEnd = myCount <= rightCount && rightSlot
        ? rightSlot.headX + rightSlot.refW
        : slot.headX + slot.refW;
      const lineW = Math.max(lineEnd - lineX, slot.refW);
      const lowestNote = allNotes[0];
      const lowestNumSkin = skin[getSyllableSkinKey(lowestNote.syllable)];
      const lowestCy = noteCenterY(measureY, measureHeight, 0);
      const reduceY = lowestCy + lowestNumSkin?.h / 2 + REDUCE_LINE_Y_OFFSET * measureHeight;
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
        targetId: slot.beat.notesInfo[0]?.id ?? slot.note.id,
        skinKey: reduceLineKey,
        dataComment: '减时线',
      });
    }
  }

  x = measureX + measureWidth - suffixW;
  for (const p of rightParts) {
    const item = skin[p.skinKey];
    if (!item) continue;
    const opts = p.tag === 'keySignature_b' && measure.keySignature_b
      ? {
        xOverride: measureX + measureWidth - item.w + KEY_SIGNATURE_B_X_OFFSET * measureHeight + (measure.keySignature_b.relativeX ?? 0),
        yOverride: measureY - item.h + KEY_SIGNATURE_B_Y_OFFSET * measureHeight + (measure.keySignature_b.relativeY ?? 0),
      }
      : undefined;
    pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId, undefined, opts);
    x += item.w;
  }

  return out;
}
