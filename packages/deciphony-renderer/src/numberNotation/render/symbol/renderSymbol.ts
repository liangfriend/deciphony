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
  canJoinReduceLineFromLeft,
  canJoinReduceLineToRight,
  chronaxieToBeamLineCount,
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getBarlineSkinKey,
  getClefForMeasure,
  getKeySignatureSkinKey,
  getReduceLineSkinKey,
  getReduceLineSkinKeyByCount,
  getSyllableSkinKey,
  getTimeSignatureSkinKey,
} from "../utils/skinKey";
import {
  getAddLineCount,
  getRenderableAugmentationDot,
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
import {graceNoteSpacing} from "@/render/graceNote";
import {floorCenterY, stackCenterYs} from "../utils/noteLayout";
import {renderSingleNoteAffiliatedSymbols} from "@/render/affiliated";
import {
  buildMeasureColumnLayout,
  computeSlotOnset,
} from "@/render/layout/measureColumnLayout";
import {createNumberNotationColumnLayoutAdapter} from "../layout/measureColumnLayoutAdapter";
import {slotIsNoteNumber, slotSymbol} from '@/standardStaff/render/utils/staffSlot';
import {getMeasureSlots} from '@/utils/measureNotes';
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum';

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

  const columnAdapter = createNumberNotationColumnLayoutAdapter(skin, measureHeight);
  const layout =
    columnLayout ?? buildMeasureColumnLayout(measure, noteDomainW, prefixW, columnAdapter, measureHeight);
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

  /** 减时线只画最底层（notesInfo[0]） */
  function getReduceLineInfo(slot: SlotInfo): NotesNumberInfo | null {
    return slot.note.notesInfo[0] ?? null;
  }

  /** 本音符自身减时线段超出数字底边的距离（只有最底层画减时线） */
  function reduceLineExtent(info: NotesNumberInfo, stackIdx: number): number {
    if (stackIdx !== 0 || info.syllable === 'X') return 0;
    const ch = getInfoChronaxie(info);
    if (ch > 32) return 0;
    const reduceLineSkin = skin[getReduceLineSkinKey(ch)];
    return REDUCE_LINE_Y_OFFSET * measureHeight + (reduceLineSkin?.h ?? 0);
  }

  /** count 个八度点（含与数字/减时线的首距）占用的高度 */
  function octaveDotsExtent(count: number): number {
    const dotSkin = skin[NumberNotationSkinKeyEnum.OctaveDot];
    if (count <= 0 || !dotSkin) return 0;
    return OCTAVE_DOT_FIRST_OFFSET * measureHeight + count * dotSkin.h
      + (count - 1) * OCTAVE_DOT_SPACING * measureHeight;
  }

  /** 附属物超出数字框的距离，写到 vDom 上供附属锚点 numberNotationAnchor 使用 */
  function numberNotationExtent(info: NotesNumberInfo, stackIdx: number): NonNullable<VDom['numberNotationExtent']> {
    const octave = info.syllable !== 0 && info.syllable !== 'X' ? (info.octaveDot ?? 0) : 0;
    const accSkin = info.accidental ? skin[getAccidentalSkinKey(info.accidental.type)] : undefined;
    return {
      top: octave > 0 ? octaveDotsExtent(octave) : 0,
      bottom: reduceLineExtent(info, stackIdx) + (octave < 0 ? octaveDotsExtent(-octave) : 0),
      left: accSkin ? ACCIDENTAL_NOTE_X_GAP * measureHeight + accSkin.w : 0,
      right: 0,
    };
  }

  /** 加时线只画最底层（notesInfo[0]） */
  function renderAddLines(
    info: NotesNumberInfo,
    note: NoteNumber,
    slotOnset: number,
    targetId: string,
  ): void {
    const chronaxie = getInfoChronaxie(info, note);
    const addLineCount = getAddLineCount(chronaxie, info.augmentationDot);
    if (addLineCount <= 0) return;
    const addLineSkin = skin[NumberNotationSkinKeyEnum.Addline];
    if (!addLineSkin) return;
    const lineY = floorCenterY(measureY, measureHeight) - addLineSkin.h / 2;
    for (let k = 0; k < addLineCount; k++) {
      const lineX = resolveAddLineXFromLayout(layout, domainStartX, slotOnset, k);
      if (lineX == null) continue;
      out.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {ledgerLine: k},
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

  const measureSlots = getMeasureSlots(measure);
  if (measureSlots.length > 0) {
    for (let i = 0; i < measureSlots.length; i++) {
      if (!slotIsNoteNumber(measureSlots[i])) continue;
      const note = slotSymbol(measureSlots[i]) as NoteNumber;
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

      // 数字头 x：同 onset 列内居左，且在前倚音区之后（见「小节内音符横坐标布局」）
      const slotOnset = computeSlotOnset(measure, i, columnAdapter);
      const hostInfo = note.notesInfo[0];
      const graceBeforeW = (!isRestSlot && hostInfo && note.graceNotes?.length)
        ? graceNoteNumberBeforeWidth(note.graceNotes, hostInfo, skin, measureHeight)
          + graceNoteSpacing(measureHeight)
        : 0;
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
          numberNotationExtent: restInfo ? numberNotationExtent(restInfo, 0) : undefined,
        };
        out.push(vdom);
        setNodeIdMap(idMap, restInfo?.id ?? note.id, vdom);
        if (restInfo?.augmentationDot) {
          const renderableDot = getRenderableAugmentationDot(restChronaxie, restInfo.augmentationDot);
          if (renderableDot) {
            const augSkinKey = getAugmentationDotSkinKey(renderableDot);
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
                restInfo.augmentationDot,
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
                targetId: renderableDot.id,
                skinKey: augSkinKey,
                dataComment: '休止符附点',
              });
            }
          }
        }
        if (restInfo) {
          renderAddLines(restInfo, note, slotOnset, restInfo.id);
        }
      } else { // 音符渲染
        const stackY = stackCenterYs(
          measureY,
          measureHeight,
          allNotes.map((n) => ({
            h: skin[getSyllableSkinKey(n.syllable)]?.h ?? measureHeight,
            octaveDot: n.syllable !== 0 && n.syllable !== 'X' ? (n.octaveDot ?? 0) : 0,
          })),
          octaveDotSkin ? {h: octaveDotSkin.h, firstOffset: fOff, spacing} : null,
          measure.floorSpan,
        );
        // 先渲染音符头（slotX）；变音/八度点/附点等 NotesNumberInfo 符号再从音符头 vDom 取 headX
        for (let stackIdx = 0; stackIdx < allNotes.length; stackIdx++) {
          const n = allNotes[stackIdx];
          const numKey = getSyllableSkinKey(n.syllable);
          const numItem = skin[numKey];
          if (!numItem) continue;
          const hcy = stackY[stackIdx]!;
          const ny = hcy - numItem.h / 2;
          const vdom: VDom = {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: slotX, y: ny, w: numItem.w, h: numItem.h, zIndex: z,
            tag: 'noteNumber', skinName: skinNameForNodes, targetId: n.id, skinKey: numKey,
            dataComment: n.syllable === 'X' ? '节奏音符' : '简谱音符',
            numberNotationExtent: numberNotationExtent(n, stackIdx),
          };
          out.push(vdom);
          setNodeIdMap(idMap, n.id, vdom);
          if (!firstHeadVDom) firstHeadVDom = vdom;
        }

        const primaryHeadVDom = allNotes[0] ? idMap.get(allNotes[0].id)?.noteNumber : undefined;
        const primaryInfo = allNotes[0];
        if (primaryInfo && primaryHeadVDom) {
          renderGraceNotesNumberBefore(
            note.graceNotes,
            primaryInfo,
            primaryHeadVDom.x,
            {...graceCtx, floorIndex: 0},
          );
        }

        for (let stackIdx = 0; stackIdx < allNotes.length; stackIdx++) {
          const n = allNotes[stackIdx];
          const numKey = getSyllableSkinKey(n.syllable);
          const numItem = skin[numKey];
          const headVDom = idMap.get(n.id)?.noteNumber;
          const noteHeadX = headVDom?.x ?? slotX;
          const noteHeadW = headVDom?.w ?? numItem?.w ?? referenceW;
          const hcy = stackY[stackIdx]!;

          if (n.accidental) {
            const accSkinKey = getAccidentalSkinKey(n.accidental.type);
            const accSkin = skin[accSkinKey];
            if (accSkin) {
              const accX = noteHeadX - ACCIDENTAL_NOTE_X_GAP * measureHeight - accSkin.w;
              // 顶部与本层数字对齐（按 info 楼层，不用槽位顶）
              const noteTop = headVDom?.y ?? (hcy - (numItem?.h ?? 0) / 2);
              const accY = noteTop + ACCIDENTAL_NOTE_Y_OFFSET * measureHeight;
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

          const renderableDot = getRenderableAugmentationDot(getInfoChronaxie(n, note), n.augmentationDot);
          if (renderableDot) {
            const augSkinKey = getAugmentationDotSkinKey(renderableDot);
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
                n.augmentationDot,
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
                targetId: renderableDot.id,
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
              const baseBottom = hcy + numItem.h / 2 + reduceLineExtent(n, stackIdx);
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
          if (stackIdx === 0) renderAddLines(n, note, slotOnset, n.id);
        }
        if (firstHeadVDom) {
          renderSingleNoteAffiliatedSymbols(note.affiliatedSymbols, firstHeadVDom, {
            VDoms: out,
            idMap,
            skinName: skinNameForNodes,
            skin,
            measureHeight,
            notationType: MusicScoreTypeEnum.NumberNotation,
          });
        }
        if (primaryInfo && primaryHeadVDom) {
          const primaryNumSkin = skin[getSyllableSkinKey(primaryInfo.syllable)];
          const primaryHeadW = primaryHeadVDom.w ?? primaryNumSkin?.w ?? referenceW;
          renderGraceNotesNumberAfter(
            note.graceNotesAfter,
            primaryInfo,
            primaryHeadVDom.x,
            primaryHeadW,
            {...graceCtx, floorIndex: 0},
          );
        }
      }

    }

    // 第二遍：渲染减时线（只有最底层；休止符 0 同样需要减时线）
    // 每个音符画自己的条数；相邻两音按 beam 相连时，只补两者都有的那几层（取较少条数），
    // 如 16-8-16：第一条贯穿三音，第二条只在两个十六分音符下各一段。
    // 连接段只补两音之间的空隙、不与音符自己的线重叠：重叠处抗锯齿边缘会合成两次而发深
    {
      const reduceLineCount = (slot: SlotInfo): number => {
        const info = getReduceLineInfo(slot);
        if (!info || info.syllable === 'X') return 0;
        const ch = getInfoChronaxie(info);
        return ch > 32 ? 0 : chronaxieToBeamLineCount(ch);
      };

      const pushReduceLine = (info: NotesNumberInfo, count: number, lineX: number, lineW: number) => {
        const reduceLineKey = getReduceLineSkinKeyByCount(count);
        const reduceLineSkin = skin[reduceLineKey];
        if (!reduceLineSkin) return;
        const numSkin = skin[getSyllableSkinKey(info.syllable)];
        const hcy = floorCenterY(measureY, measureHeight);
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
      };

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]!;
        const info = getReduceLineInfo(slot);
        const count = reduceLineCount(slot);
        if (!info || !count) continue;
        pushReduceLine(info, count, slot.slotX, slot.refW);

        const next = slots[i + 1];
        const nextInfo = next ? getReduceLineInfo(next) : null;
        const nextCount = next ? reduceLineCount(next) : 0;
        if (!next || !nextInfo || !nextCount) continue;
        if (!canJoinReduceLineFromLeft(info.beamType) || !canJoinReduceLineToRight(nextInfo.beamType)) continue;
        const gapX = slot.slotX + slot.refW;
        if (next.slotX > gapX) pushReduceLine(info, Math.min(count, nextCount), gapX, next.slotX - gapX);
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
