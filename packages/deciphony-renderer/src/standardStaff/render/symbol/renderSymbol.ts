/**
 * 小节符号渲染：前置谱号→前置调号→前置拍号→音符→后置谱号→小节线→后置调号→后置拍号
 */

import {VDom} from "@/types/common";
import type {AugmentationDot} from "@/types/MusicScoreType";
import type {NoteRest, NotesInfo, NoteSymbol, StaffSlot} from "@/types/MusicScoreType";
import {AccidentalTypeEnum} from "@/enums/musicScoreEnum";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {NodeIdMap, RenderSymbolParams} from "../types";
import {ACCIDENTAL_NOTE_GAP, AUGMENTATION_DOT_GAP, CLEF_NOTE_GAP_RATIO} from "../constants";
import {addLineBoxAt} from "../utils/addLine";
import {
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getBarlineSkinKey,
  getClefForMeasure,
  getClefSkinKey,
  getKeySignatureSkinKey,
  getKeySignatureYOffset,
  getNoteHeadSkinKey,
  getRestSkinKey,
  getTimeSignatureSkinKey,
} from "../utils/skinKey";
import {getNoteWidthRatio, getSlotRestChronaxie, getVoiceGroups, isSlotRest} from "../utils/note";
import {isNoteSymbol, isStaffSlot} from "../utils/staffSlot";
import {renderStemAndTail} from "../note/renderStemAndTail";
import {
  graceAfterWidth,
  graceBeforeWidth,
  renderGraceNotesAfter,
  renderGraceNotesBefore,
} from "../grace/renderGraceStaff";
import {renderSingleNoteAffiliatedSymbols} from "@/render/affiliated";

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
  let obj = map.get(id);
  if (!obj) {
    obj = {};
    map.set(id, obj);
  }
  obj[vdom.tag] = vdom;
}

/**
 * relativeX 参与合并（相同才合并，见合并键），但 relativeY/W/H 偏移会破坏符干的垂直/宽度贴合，
 * 带这类偏移的音符独立渲染符干符尾，不参与合并。
 */
function hasNonXRelativeOffset(n: NotesInfo): boolean {
  return (n.relativeY ?? 0) !== 0
    || (n.relativeW ?? 0) !== 0
    || (n.relativeH ?? 0) !== 0;
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
  const keySignatureYOffset = getKeySignatureYOffset(clefType, measureHeight, measureLineWidth);

  type RightPart = {
    skinKey: typeof StandardStaffSkinKeyEnum[keyof typeof StandardStaffSkinKeyEnum];
    tag: VDom['tag'];
    dataComment: string;
    targetId: string;
  };
  /*
  * 获取前置符号的w总和
  * */
  let prefixW = 0;
  if (measure.clef_f) {
    const key = getClefSkinKey(measure.clef_f.type, true);
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

  if (measure.clef_b) {
    rightParts.push({
      skinKey: getClefSkinKey(measure.clef_b.type, false),
      tag: 'clef_b',
      dataComment: '后置谱号',
      targetId: measure.clef_b.id ?? '',
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
  /*
  * 获取后置符号的w总和
  * */
  for (const p of rightParts) {
    const item = skin[p.skinKey];
    if (item) suffixW += item.w;
  }
  // 计算出留给音符的w总和
  const noteDomainW = Math.max(0, measureWidth - prefixW - suffixW);
  /*
  * 定义vodm添加函数
  * */
  const pushSymbol = (
    x: number,
    skinKey: typeof StandardStaffSkinKeyEnum[keyof typeof StandardStaffSkinKeyEnum],
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
    // 如果添加的vdom存在id, 缓存数据方便查找
    if (targetId) setNodeIdMap(idMap, targetId, vdom);
  };
  /*
  * 依次渲染前置符号并累加x
  * */
  let x = measureX;
  if (measure.clef_f) {
    const clefKey = getClefSkinKey(measure.clef_f.type, true);
    pushSymbol(x, clefKey, 'clef_f', '前置谱号', measure.clef_f.id ?? '');
    const item = skin[clefKey];
    if (item) x += item.w;
  }
  if (measure.keySignature_f) {
    const keySigKey = getKeySignatureSkinKey(measure.keySignature_f.type);
    pushSymbol(x, keySigKey, 'keySignature_f', '前置调号', measure.keySignature_f.id ?? '', keySignatureYOffset);
    const item = skin[keySigKey];
    if (item) x += item.w;
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

  const notes = measure.notes;
  // 计算当前小节总的widthRatio
  const totalNoteRatio = notes.reduce((sum, n) => {
    if (!isStaffSlot(n)) return sum;
    return sum + getNoteWidthRatio(n, skin, measureHeight);
  }, 0);
  const domainStartX = measureX + prefixW;
  /*
  * 定义音符中心点坐标获取函数
  * */
  const noteCenterY = (region: number) =>
    measureY + measureHeight - measureLineWidth / 2
    - region * (measureHeight - 5 * measureLineWidth) / 8
    - region * measureLineWidth / 2;
  /*
  * 使用均等槽位
  * 如果曲谱数据的widthRatio没有设置好，出现了不合理的总宽度系数，则使用均等槽位模式
  * 所有符号宽度域等比分配
  * 这个正常来讲不应该被用到，属于一个防报错手段
  * */
  const useEqualSlots = notes.length > 0 && totalNoteRatio <= 0;

  if (notes.length > 0) {
    let accRatio = 0;
    const slotWidth = useEqualSlots ? noteDomainW / notes.length : 0;
    for (let i = 0; i < notes.length; i++) {
      const slot = notes[i];
      if (!isStaffSlot(slot)) continue;
      const ratio = useEqualSlots ? 1 : getNoteWidthRatio(slot, skin, measureHeight);
      // 计算出符号域宽度
      const slotW = useEqualSlots ? slotWidth : (ratio / totalNoteRatio) * noteDomainW;
      // 计算出符号域开始x值
      const slotStartX = domainStartX + (useEqualSlots ? i * slotWidth : (accRatio / totalNoteRatio) * noteDomainW);
      if (!useEqualSlots) accRatio += ratio;
      const isRest = isSlotRest(slot);
      // 参考宽度：用于在 slot 内居中。休止符用休止符皮肤宽；音符用该 slot 内所有声部符头皮肤的最大宽（全/二分/四分符头尺寸可能不同）
      let referenceW: number;
      if (isRest) {
        const restItem = skin[getRestSkinKey(getSlotRestChronaxie(slot))];
        if (!restItem) continue;
        referenceW = restItem.w;
      } else {
        const voiceGroups = getVoiceGroups(slot);
        referenceW = 0;
        for (const group of voiceGroups) {
          const headSkin = skin[getNoteHeadSkinKey(group.chronaxie)];
          if (headSkin && headSkin.w > referenceW) referenceW = headSkin.w;
        }
      }
      let graceBeforeW = 0;
      let graceAfterW = 0;
      if (!isRest && isNoteSymbol(slot)) {
        graceBeforeW = graceBeforeWidth(slot.graceNotes, skin, measureHeight);
        graceAfterW = graceAfterWidth(slot.graceNotesAfter, skin, measureHeight);
      }
      /** 槽位内布局锚点 x（未叠加 Frame）；谱号、倚音区等与 slot 对齐的符号用此值 */
      const slotX = slotStartX + (slotW - graceBeforeW - referenceW - graceAfterW) / 2 + graceBeforeW;
      /*
      * 渲染音符前谱号
      * */
      if (slot.clef) {
        const clefKey = getClefSkinKey(slot.clef.type, true);
        const clefItem = skin[clefKey];
        if (clefItem) {
          const clefX = slotX - CLEF_NOTE_GAP_RATIO * measureHeight - clefItem.w;
          const clefY = measureY - (clefItem.h - measureHeight) / 2;
          const clefVDom: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: clefX, y: clefY, w: clefItem.w, h: clefItem.h,
            zIndex: z, tag: 'clef_f', skinName: skinNameForNodes, targetId: slot.clef.id,
            skinKey: clefKey, dataComment: '音符前谱号',
          };
          out.push(clefVDom);
          setNodeIdMap(idMap, slot.clef.id, clefVDom);
        }
      }
      // 渲染休止符
      if (isRest) {
        const rest = slot as NoteRest;
        const restChronaxie = getSlotRestChronaxie(rest);
        const headKey = getRestSkinKey(restChronaxie);
        const restItem = skin[headKey];
        if (!restItem) continue;
        let ny: number;
        if (restChronaxie === 256) ny = measureY + measureHeight / 4;
        else if (restChronaxie === 128) ny = measureY + measureHeight / 2 - restItem.h;
        else ny = measureY + (measureHeight - restItem.h) / 2;
        const vdom: VDom = {
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: slotX,
          y: ny,
          w: restItem.w,
          h: restItem.h,
          zIndex: z,
          tag: 'rest',
          skinName: skinNameForNodes,
          targetId: rest.id,
          skinKey: headKey,
          dataComment: '休止符',
        };
        out.push(vdom);
        setNodeIdMap(idMap, rest.id, vdom);
        renderSingleNoteAffiliatedSymbols(rest.affiliatedSymbols ?? [], vdom, {
          VDoms: out,
          idMap,
          skinName: skinNameForNodes,
          skin,
          measureHeight,
        });
        continue;
      }

      const note = slot;
      const allNotesInfo = note.notesInfo;

      const addLineSkinD = skin[StandardStaffSkinKeyEnum.AddLine_d];
      const addLineSkinU = skin[StandardStaffSkinKeyEnum.AddLine_u];

      // 1) 音符头：每个 NotesInfo 一个，x=slotX（相对 Frame 由小节级 apply 平移），皮肤按各自时值
      allNotesInfo.forEach((n) => {
        const headKey = getNoteHeadSkinKey(n.chronaxie);
        const headItem = skin[headKey];
        if (!headItem) return;
        const ny = noteCenterY(n.region) - headItem.h / 2;
        const vdom: VDom = {
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: slotX,
          y: ny,
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
        renderSingleNoteAffiliatedSymbols(n.affiliatedSymbols, vdom, {
          VDoms: out,
          idMap,
          skinName: skinNameForNodes,
          skin,
          measureHeight,
        });
      });

      // 2) 上下加线：每个音符头独立渲染（按各自 headX 居中、region 计算），互相重叠无妨
      allNotesInfo.forEach((n) => {
        const headVDom = idMap.get(n.id)?.noteHead;
        if (!headVDom) return;
        const ledgerCenterX = headVDom.x + headVDom.w / 2;
        const r = n.region;
        if (addLineSkinD && r < -1) for (let line = -2; line >= r; line -= 2) {
          const box = addLineBoxAt(noteCenterY(line), ledgerCenterX, addLineSkinD);
          out.push({
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            ...box,
            zIndex: z,
            tag: 'addLine', skinName: skinNameForNodes, targetId: n.id,
            skinKey: StandardStaffSkinKeyEnum.AddLine_d, dataComment: '下加线',
          });
        }
        if (addLineSkinU && r > 9) for (let line = 10; line <= r; line += 2) {
          const box = addLineBoxAt(noteCenterY(line), ledgerCenterX, addLineSkinU);
          out.push({
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            ...box,
            zIndex: z,
            tag: 'addLine', skinName: skinNameForNodes, targetId: n.id,
            skinKey: StandardStaffSkinKeyEnum.AddLine_u, dataComment: '上加线',
          });
        }
      });

      // 倚音/附点的参考音符头（首个 NotesInfo）
      const primaryHead = allNotesInfo[0] ? idMap.get(allNotesInfo[0].id)?.noteHead : undefined;
      const primaryHeadX = primaryHead?.x ?? slotX;
      const primaryHeadW = primaryHead?.w ?? (skin[getNoteHeadSkinKey(allNotesInfo[0]?.chronaxie ?? 64)]?.w ?? 0);

      const graceCtx = {
        noteCenterY,
        measureY,
        measureHeight,
        measureLineWidth,
        measureWidth,
        skin,
        skinName: skinNameForNodes,
        zIndex: z,
        note,
        idMap,
        out,
      };

      // 3) 前倚音
      renderGraceNotesBefore(note.graceNotes, primaryHeadX, graceCtx);

      // 4) 变音号：每个音符头用自己的 headX
      allNotesInfo.forEach((n) => {
        if (!n.accidental) return;
        const headVDom = idMap.get(n.id)?.noteHead;
        const noteHeadX = headVDom?.x ?? slotX;
        const hcy = noteCenterY(n.region);
        const accSkinKey = getAccidentalSkinKey(n.accidental.type);
        const accSkin = skin[accSkinKey];
        if (!accSkin) return;
        const accX = noteHeadX - ACCIDENTAL_NOTE_GAP * measureHeight - accSkin.w;
        const isFlatOrDoubleFlat = n.accidental.type === AccidentalTypeEnum.Flat || n.accidental.type === AccidentalTypeEnum.Double_flat;
        const accY = isFlatOrDoubleFlat ? (hcy + measureHeight / 8) - accSkin.h : hcy - accSkin.h / 2;
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
      });

      // 5) 后倚音
      renderGraceNotesAfter(note.graceNotesAfter, primaryHeadX, primaryHeadW, graceCtx);

      // 6) 附点：首个带附点的 NotesInfo 提供皮肤，每个音符头一个点
      const noteAugmentationDot = allNotesInfo.find((n) => n.augmentationDot)?.augmentationDot;
      if (noteAugmentationDot) {
        const augSkinKey = getAugmentationDotSkinKey(noteAugmentationDot as AugmentationDot);
        const augSkin = skin[augSkinKey];
        if (augSkin) {
          const augX = primaryHeadX + primaryHeadW + AUGMENTATION_DOT_GAP * measureHeight;
          allNotesInfo.forEach((n) => {
            let augY = noteCenterY(n.region) - augSkin.h / 2;
            if (n.region % 2 === 0) augY -= measureHeight / 8;
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
              targetId: noteAugmentationDot.id,
              skinKey: augSkinKey,
              dataComment: '附点符号',
            });
          });
        }
      }

      /**
       * 7) 符干符尾：每个音符独立渲染，避免共用一条符干导致偏移的音符头不贴合。
       * 合并键：direction + chronaxie + relativeX；三者相同的音符合并为一条 extreme 符干，
       * 由 extreme 符干延长覆盖整组（chordSpan）。
       * relativeX 相同才合并（共用同一水平锚点）；relativeY/W/H 偏移的音符不参与合并，各自独立。
       */
      const renderStemForSubgroup = (subNotes: NotesInfo[], subChronaxie: number, directionUp: boolean) => {
        if (subNotes.length === 0) return;
        const subRegions = subNotes.map((n) => n.region);
        const subMin = Math.min(...subRegions);
        const subMax = Math.max(...subRegions);
        const subExtremeRegion = directionUp ? subMax : subMin;
        const subExtreme = subNotes.find((n) => n.region === subExtremeRegion);
        if (!subExtreme) return;
        const headItem = skin[getNoteHeadSkinKey(subChronaxie)];
        const subHeadVDom = idMap.get(subExtreme.id)?.noteHead;
        const subHeadX = subHeadVDom?.x ?? slotX;
        const subHeadY = subHeadVDom?.y ?? (noteCenterY(subExtremeRegion) - (headItem?.h ?? 0) / 2);
        const subHeadW = subHeadVDom?.w ?? headItem?.w ?? 0;
        const subHeadH = subHeadVDom?.h ?? headItem?.h ?? 0;
        const subOtherCenterY = directionUp ? noteCenterY(subMin) : noteCenterY(subMax);
        const stemTailVDoms = renderStemAndTail({
          note,
          headX: subHeadX,
          headY: subHeadY,
          headW: subHeadW,
          headH: subHeadH,
          measureY,
          measureHeight,
          measureWidth,
          skin,
          zIndex: z,
          idMap,
          chronaxie: subChronaxie,
          direction: directionUp ? 'up' : 'down',
          stemTargetId: subExtreme.id,
          headCenterYOther: subOtherCenterY,
          skinName: skinNameForNodes,
        });
        for (const v of stemTailVDoms) {
          out.push(v);
          if (v.targetId) setNodeIdMap(idMap, v.targetId, v);
        }
      };

      const mergeBuckets = new Map<string, NotesInfo[]>();
      for (const n of allNotesInfo) {
        if (hasNonXRelativeOffset(n)) {
          renderStemForSubgroup([n], n.chronaxie, n.direction === 'up');
        } else {
          const key = `${n.direction}|${n.chronaxie}|${n.relativeX ?? 0}`;
          const list = mergeBuckets.get(key) ?? [];
          list.push(n);
          mergeBuckets.set(key, list);
        }
      }
      for (const subNotes of mergeBuckets.values()) {
        renderStemForSubgroup(subNotes, subNotes[0].chronaxie, subNotes[0].direction === 'up');
      }
    }
  }

  x = measureX + measureWidth - suffixW;
  for (const p of rightParts) {
    const yOff = p.tag === 'keySignature_b' ? keySignatureYOffset : undefined;
    pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId, yOff);
    const item = skin[p.skinKey];
    if (item) x += item.w;
  }

  return out;
}

/** 计算前置小节线在小节内的左边缘 x（clef_f + keySig_f + timeSig_f 之后，供连谱小节线 barline_f 定位） */
export function getBarlineFXInMeasure(
  measure: import("@/types/MusicScoreType").Measure,
  measureX: number,
  skin: import("@/types/common").StandardStaffSkinPack,
): number {
  let prefixW = 0;
  if (measure.clef_f) {
    const item = skin[getClefSkinKey(measure.clef_f.type, true)];
    if (item) prefixW += item.w;
  }
  if (measure.keySignature_f) {
    const item = skin[getKeySignatureSkinKey(measure.keySignature_f.type)];
    if (item) prefixW += item.w;
  }
  if (measure.timeSignature_f) {
    const item = skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)];
    if (item) prefixW += item.w;
  }
  return measureX + prefixW;
}

/** 计算后置小节线在小节内的左边缘 x（与 renderSymbol 中 rightParts 摆放一致，供连谱小节线 barline_b 定位） */
export function getBarlineXInMeasure(
  measure: import("@/types/MusicScoreType").Measure,
  measureX: number,
  measureWidth: number,
  skin: import("@/types/common").StandardStaffSkinPack,
): number {
  const rightKeys: typeof StandardStaffSkinKeyEnum[keyof typeof StandardStaffSkinKeyEnum][] = [];
  if (measure.barline_b) rightKeys.push(getBarlineSkinKey(measure.barline_b.type));
  if (measure.clef_b) rightKeys.push(getClefSkinKey(measure.clef_b.type, false));
  if (measure.keySignature_b) rightKeys.push(getKeySignatureSkinKey(measure.keySignature_b.type));
  if (measure.timeSignature_b) rightKeys.push(getTimeSignatureSkinKey(measure.timeSignature_b.type));
  let suffixW = 0;
  for (const k of rightKeys) {
    const item = skin[k];
    if (item) suffixW += item.w;
  }
  let x = measureX + measureWidth - suffixW;
  const barlineIdx = 0; // barline_b 在 rightParts 第一位
  for (let j = 0; j < barlineIdx && j < rightKeys.length; j++) {
    const item = skin[rightKeys[j]];
    if (item) x += item.w;
  }
  return x;
}
