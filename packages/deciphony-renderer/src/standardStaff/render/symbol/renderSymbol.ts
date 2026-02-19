/**
 * 小节符号渲染：前置谱号→前置调号→前置拍号→音符→后置谱号→小节线→后置调号→后置拍号
 */

import {VDom} from "@/types/common";
import type {AugmentationDot} from "@/types/MusicScoreType";
import {NoteSymbol} from "@/types/MusicScoreType";
import {AccidentalTypeEnum} from "@/enums/musicScoreEnum";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {NodeIdMap, RenderSymbolParams} from "../types";
import {ACCIDENTAL_NOTE_GAP, AUGMENTATION_DOT_GAP, CLEF_NOTE_GAP_RATIO} from "../constants";
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
import {getNoteWidthRatio, getSlotRestChronaxie, isSlotRest} from "../utils/note";
import {renderStemAndTail} from "../note/renderStemAndTail";

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
  } = params;
  const out: VDom[] = [];
  const z = 1001;
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
      x, y, w: item.w, h: item.h, zIndex: z, tag, skinName: 'default', targetId, skinKey, dataComment,
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
    const clefKey = getClefSkinKey(measure.clef_f.clefType, true);
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

  const notes = measure.notes;
  // 计算当前小节总的widthRatio
  const totalNoteRatio = notes.reduce((sum, n) => sum + getNoteWidthRatio(n as NoteSymbol), 0);
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
      const note = notes[i] as NoteSymbol;
      const ratio = useEqualSlots ? 1 : getNoteWidthRatio(note);
      // 计算出符号域宽度
      const slotW = useEqualSlots ? slotWidth : (ratio / totalNoteRatio) * noteDomainW;
      // 计算出符号域开始x值
      const slotStartX = domainStartX + (useEqualSlots ? i * slotWidth : (accRatio / totalNoteRatio) * noteDomainW);
      if (!useEqualSlots) accRatio += ratio;
      const isRest = isSlotRest(note);
      // 参考宽度：用于在 slot 内居中。休止符用休止符皮肤宽；音符用该 slot 内所有声部符头皮肤的最大宽（全/二分/四分符头尺寸可能不同）
      let referenceW: number;
      if (isRest) {
        const restItem = skin[getRestSkinKey(getSlotRestChronaxie(note))];
        if (!restItem) continue;
        referenceW = restItem.w;
      } else {
        const beats = [...note.voicePart1, ...note.voicePart2].filter((b) => b.notesInfo.length > 0);
        referenceW = 0;
        for (const beat of beats) {
          const headSkin = skin[getNoteHeadSkinKey(beat.chronaxie)];
          if (headSkin && headSkin.w > referenceW) referenceW = headSkin.w;
        }
      }
      // 计算音符头的x值
      const headX = slotStartX + (slotW - referenceW) / 2;
      /*
      * 渲染音符前谱号
      * */
      if (note.clef) {
        const clefKey = getClefSkinKey(note.clef.clefType, true);
        const clefItem = skin[clefKey];
        if (clefItem) {
          const clefX = headX - CLEF_NOTE_GAP_RATIO * measureHeight - clefItem.w;
          const clefY = measureY - (clefItem.h - measureHeight) / 2;
          const clefVDom: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: clefX, y: clefY, w: clefItem.w, h: clefItem.h,
            zIndex: z, tag: 'clef_f', skinName: 'default', targetId: note.clef.id,
            skinKey: clefKey, dataComment: '音符前谱号',
          };
          out.push(clefVDom);
          setNodeIdMap(idMap, note.clef.id, clefVDom);
        }
      }
      // 渲染休止符
      if (isRest) {
        const restChronaxie = getSlotRestChronaxie(note);
        const headKey = getRestSkinKey(restChronaxie);
        const restItem = skin[headKey];
        if (!restItem) continue;
        let ny: number;
        if (restChronaxie === 256) ny = measureY + measureHeight / 4;
        else if (restChronaxie === 128) ny = measureY + measureHeight / 2 - restItem.h;
        else ny = measureY + (measureHeight - restItem.h) / 2;
        const vdom: VDom = {
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
          x: headX, y: ny, w: restItem.w, h: restItem.h,
          zIndex: z, tag: 'rest', skinName: 'default', targetId: note.id, skinKey: headKey, dataComment: '休止符',
        };
        out.push(vdom);
        setNodeIdMap(idMap, note.id, vdom);
        continue;
      }

      const beat1 = note.voicePart1.find((b) => b.notesInfo.length > 0);
      const beat2 = note.voicePart2.find((b) => b.notesInfo.length > 0);
      let stemV1: VDom | null = null;
      let stemV2: VDom | null = null;
      let headCenterY1: number | null = null;
      let headCenterY2: number | null = null;
      let firstHeadVDom: VDom | null = null;

      const addLineSkinD = skin[StandardStaffSkinKeyEnum.AddLine_d];
      const addLineSkinU = skin[StandardStaffSkinKeyEnum.AddLine_u];

      const drawVoice = (
          beat: {
            chronaxie: number;
            notesInfo: {
              id: string;
              region: number;
              accidental?: { type: AccidentalTypeEnum; id?: string; relativeX?: number; relativeY?: number }
            }[];
            augmentationDot?: import("@/types/MusicScoreType").AugmentationDot;
          },
          directionUp: boolean,
          setStemAndHead?: (stem: VDom, headCenterY: number) => void,
      ) => {
        const regions = beat.notesInfo.map((n) => n.region);
        const headKey = getNoteHeadSkinKey(beat.chronaxie);
        const headItem = skin[headKey];
        const minRegion = Math.min(...regions);
        const maxRegion = Math.max(...regions);
        // 加线x
        const ledgerX = headX + headItem.w / 2 - (addLineSkinD?.w ?? 15) / 2;
        // 符干尾部离小节最远的距离信息
        const extremeRegion = directionUp ? maxRegion : minRegion;
        const extremeHeadY = noteCenterY(extremeRegion) - headItem.h / 2;
        const extremeHeadCenterY = extremeHeadY + headItem.h / 2;
        // 相反一侧最远距离音符头中心点y
        const otherExtremeHeadCenterY = directionUp ? noteCenterY(minRegion) : noteCenterY(maxRegion);
        // 最远音符信息
        const extremeNotesInfo = beat.notesInfo.find((n) => n.region === extremeRegion);
        // 是否需要加线
        const needLower = new Set<number>();
        const needUpper = new Set<number>();
        for (const r of regions) {
          if (r < -1) for (let line = -2; line >= r; line -= 2) needLower.add(line);
          if (r > 9) for (let line = 10; line <= r; line += 2) needUpper.add(line);
        }
        // 渲染加线
        if (addLineSkinD) for (const r of needLower) {
          const lineY = noteCenterY(r);
          out.push({
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: ledgerX, y: lineY + measureLineWidth / 2 - addLineSkinD.h,
            w: addLineSkinD.w, h: addLineSkinD.h, zIndex: 1000,
            tag: 'addLine', skinName: 'default', targetId: note.id,
            skinKey: StandardStaffSkinKeyEnum.AddLine_d, dataComment: '下加线',
          });
        }
        if (addLineSkinU) for (const r of needUpper) {
          const lineY = noteCenterY(r);
          out.push({
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: ledgerX, y: lineY - measureLineWidth / 2,
            w: addLineSkinU.w, h: addLineSkinU.h, zIndex: z - 1,
            tag: 'addLine', skinName: 'default', targetId: note.id,
            skinKey: StandardStaffSkinKeyEnum.AddLine_u, dataComment: '上加线',
          });
        }
        // 渲染变音符号和音符头
        beat.notesInfo.forEach((n) => {
          const ny = noteCenterY(n.region) - headItem.h / 2;
          const hcy = noteCenterY(n.region);
          if (n.accidental) {
            const accSkinKey = getAccidentalSkinKey(n.accidental.type);
            const accSkin = skin[accSkinKey];
            if (accSkin) {
              const accX = headX - ACCIDENTAL_NOTE_GAP * measureHeight - accSkin.w + (n.accidental.relativeX ?? 0);
              const isFlatOrDoubleFlat = n.accidental.type === AccidentalTypeEnum.Flat || n.accidental.type === AccidentalTypeEnum.Double_flat;
              const accY = isFlatOrDoubleFlat ? (hcy + measureHeight / 8) - accSkin.h + (n.accidental.relativeY ?? 0) : hcy - accSkin.h / 2 + (n.accidental.relativeY ?? 0);
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
                skinName: 'default',
                targetId: n.accidental.id ?? n.id,
                skinKey: accSkinKey,
                dataComment: '变音符号',
              });
            }
          }
          // 渲染音符头
          const vdom: VDom = {
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: headX, y: ny, w: headItem.w, h: headItem.h, zIndex: z,
            tag: 'noteHead', skinName: 'default', targetId: n.id, skinKey: headKey, dataComment: '音符头',
          };
          out.push(vdom);
          setNodeIdMap(idMap, n.id, vdom);
          if (!firstHeadVDom) firstHeadVDom = vdom;
        });
        // 渲染附点
        if (beat.augmentationDot) {
          const augSkinKey = getAugmentationDotSkinKey(beat.augmentationDot as AugmentationDot);
          const augSkin = skin[augSkinKey];
          if (augSkin) {
            const augX = headX + headItem.w + AUGMENTATION_DOT_GAP * measureHeight;
            beat.notesInfo.forEach((n) => {
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
                skinName: 'default',
                targetId: beat.augmentationDot!.id,
                skinKey: augSkinKey,
                dataComment: '附点符号',
              });
            });
          }
        }
        if (!extremeNotesInfo) return;
        /*
        * 渲染符尾和符干。不过这里不是最终的符干vdom,后续beam里会调整符干vdom
        * */
        const stemTailVDoms = renderStemAndTail({
          note,
          headX: headX,
          headY: extremeHeadY,
          headW: headItem.w,
          headH: headItem.h,
          measureY,
          measureHeight,
          measureWidth,
          skin,
          zIndex: z,
          idMap,
          chronaxie: beat.chronaxie,
          direction: directionUp ? 'up' : 'down',
          stemTargetId: extremeNotesInfo.id,
          headCenterYOther: otherExtremeHeadCenterY,
        });
        for (const v of stemTailVDoms) {
          out.push(v);
          if (v.tag === 'noteStem') setStemAndHead?.(v, extremeHeadCenterY);
          if (v.targetId) setNodeIdMap(idMap, v.targetId, v);
        }
      };

      if (beat1) drawVoice(beat1, note.direction === 'up', (s, h) => {
        stemV1 = s;
        headCenterY1 = h;
      });
      if (beat2) drawVoice(beat2, note.direction !== 'up', (s, h) => {
        stemV2 = s;
        headCenterY2 = h;
      });

      if (firstHeadVDom) setNodeIdMap(idMap, note.id, firstHeadVDom);
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
