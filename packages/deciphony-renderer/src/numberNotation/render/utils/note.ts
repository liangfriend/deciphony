import type {Measure, NoteNumber, NotesNumberInfo} from "@/types/MusicScoreType";
import type {MeasureColumnLayout} from "@/render/layout/measureColumnLayout";
import type {NumberNotationSkinPack} from "@/types/common";
import {resolveWidthRatio} from "@/utils/widthRatio";
import {
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getBarlineSkinKey,
  getSyllableSkinKey,
  getTimeSignatureSkinKey,
} from "./skinKey";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import {graceNoteNumberAfterWidth, graceNoteNumberBeforeWidth} from "@/numberNotation/render/grace/renderGraceNumber";

/** 单个 NotesNumberInfo 时值（兼容旧数据 NoteNumber.chronaxie） */
export function getInfoChronaxie(info: NotesNumberInfo, note?: NoteNumber): number {
  if (info.chronaxie != null) return info.chronaxie;
  const legacy = note && (note as NoteNumber & { chronaxie?: number }).chronaxie;
  return legacy ?? 64;
}

/** 简谱音符位时值（同 onset 各层取最大，用于列布局 onset 推进） */
export function getSlotChronaxie(note: NoteNumber): number {
  if (!note.notesInfo.length) return 64;
  return Math.max(...note.notesInfo.map((ni) => getInfoChronaxie(ni, note)));
}

/** 是否为休止符位：syllable===0 */
export function isSlotRest(note: NoteNumber): boolean {
  return !note.notesInfo.length || note.notesInfo.every((n) => n.syllable === 0);
}

/** 休止符位时值 */
export function getSlotRestChronaxie(note: NoteNumber): number {
  const lead = note.notesInfo[0];
  return lead ? getInfoChronaxie(lead, note) : 64;
}

/**
 * 皮肤包仅存四分音符 widthRatio；≥64 不乘时值系数（长时值由加时线虚拟 onset 列表达）。
 */
export function getChronaxieWidthCoefficient(chronaxie: number): number {
  if (chronaxie >= 64) return 1;
  if (chronaxie === 32) return 0.5;
  if (chronaxie === 16) return 0.25;
  if (chronaxie === 8) return 0.25;
  if (chronaxie === 4) return 0.25;
  if (chronaxie === 2) return 0.25;
  if (chronaxie === 1) return 0.25;
  return 1;
}

/** 四分音符 chronaxie 单位 */
export const QUARTER_CHRONAXIE = 64;

/** 加时线条数 */
export function getAddLineCount(chronaxie: number): number {
  if (chronaxie <= QUARTER_CHRONAXIE) return 0;
  return chronaxie / QUARTER_CHRONAXIE - 1;
}

/** 相对符头 onset 的加时线虚拟列偏移：128→[64]，256→[64,128,192] */
export function getAddLineOnsetOffsets(chronaxie: number): number[] {
  const offsets: number[] = [];
  for (let o = QUARTER_CHRONAXIE; o < chronaxie; o += QUARTER_CHRONAXIE) {
    offsets.push(o);
  }
  return offsets;
}

type WidthPick = (
  item: { widthRatio?: number; widthRatioForMeasure?: number } | undefined,
  data?: number,
) => number;

function getSlotSkinWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  forMeasure: boolean,
): number {
  const slotSkinKey = getSyllableSkinKey('X');
  const slotW = forMeasure
    ? resolveWidthRatio(note.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure)
    : resolveWidthRatio(note.widthRatio, skin[slotSkinKey]?.widthRatio);
  return slotW * getChronaxieWidthCoefficient(getSlotChronaxie(note));
}

function collectHeadSubWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  pick: WidthPick,
  includeAugDot: boolean,
): number {
  let sub = 0;
  for (const n of note.notesInfo) {
    if (n.accidental) {
      sub += pick(skin[getAccidentalSkinKey(n.accidental.type)], n.accidental.widthRatio);
    }
    if (includeAugDot && n.augmentationDot) {
      sub += pick(skin[getAugmentationDotSkinKey(n.augmentationDot)], n.augmentationDot.widthRatio);
    }
  }
  return sub;
}

function collectAugDotSubWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  pick: WidthPick,
): number {
  let sub = 0;
  for (const n of note.notesInfo) {
    if (n.augmentationDot) {
      sub += pick(skin[getAugmentationDotSkinKey(n.augmentationDot)], n.augmentationDot.widthRatio);
    }
  }
  return sub;
}

function graceWidthRatioForNoteNumber(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight: number,
): number {
  if (isSlotRest(note)) return 0;
  let before = 0;
  let after = 0;
  for (const ni of note.notesInfo) {
    before = Math.max(before, graceNoteNumberBeforeWidth(ni.graceNotes, ni, skin, measureHeight));
    after = Math.max(after, graceNoteNumberAfterWidth(ni.graceNotesAfter, ni, skin, measureHeight));
  }
  return ((before + after) / measureHeight) * 4;
}

/** 符头 onset 列：皮肤 + 变音/倚音等；有加时线时不含附点 */
export function getNoteHeadColumnWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const hasAddLines = getSlotChronaxie(note) > QUARTER_CHRONAXIE;
  return (
    getSlotSkinWidthRatio(note, skin, false)
    + collectHeadSubWidthRatio(note, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio), !hasAddLines)
    + graceWidthRatioForNoteNumber(note, skin, measureHeight)
  );
}

/** 中间加时线 onset 列：仅皮肤 widthRatio */
export function getAddLineOnlyColumnWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
): number {
  return getSlotSkinWidthRatio(note, skin, false);
}

/** 最后一条加时线 onset 列：皮肤 + 附点（若有） */
export function getLastAddLineColumnWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
): number {
  return (
    getSlotSkinWidthRatio(note, skin, false)
    + collectAugDotSubWidthRatio(note, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio))
  );
}

/** @deprecated 列布局符头 onset 用 getNoteHeadColumnWidthRatio */
export function getNoteColumnWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45,
): number {
  return getNoteHeadColumnWidthRatio(note, skin, measureHeight);
}

/** 音符在小节内的宽度占比（符头 + 各加时线虚拟列） */
export function getNoteWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const ch = getSlotChronaxie(note);
  const offsets = getAddLineOnsetOffsets(ch);
  let acc = getNoteHeadColumnWidthRatio(note, skin, measureHeight);
  for (let i = 0; i < offsets.length; i++) {
    acc += i === offsets.length - 1
      ? getLastAddLineColumnWidthRatio(note, skin)
      : getAddLineOnlyColumnWidthRatio(note, skin);
  }
  return acc;
}

function getNoteHeadColumnWidthRatioForMeasure(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight: number,
): number {
  const hasAddLines = getSlotChronaxie(note) > QUARTER_CHRONAXIE;
  return (
    getSlotSkinWidthRatio(note, skin, true)
    + collectHeadSubWidthRatio(
      note,
      skin,
      (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure),
      !hasAddLines,
    )
    + graceWidthRatioForNoteNumber(note, skin, measureHeight)
  );
}

function getAddLineOnlyColumnWidthRatioForMeasure(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
): number {
  return getSlotSkinWidthRatio(note, skin, true);
}

function getLastAddLineColumnWidthRatioForMeasure(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
): number {
  return (
    getSlotSkinWidthRatio(note, skin, true)
    + collectAugDotSubWidthRatio(
      note,
      skin,
      (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure),
    )
  );
}

/** 音符对小节在单谱表内宽度占比的系数 */
export function getNoteWidthRatioForMeasure(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const offsets = getAddLineOnsetOffsets(getSlotChronaxie(note));
  let acc = getNoteHeadColumnWidthRatioForMeasure(note, skin, measureHeight);
  for (let i = 0; i < offsets.length; i++) {
    acc += i === offsets.length - 1
      ? getLastAddLineColumnWidthRatioForMeasure(note, skin)
      : getAddLineOnlyColumnWidthRatioForMeasure(note, skin);
  }
  return acc;
}

/** 简谱列布局：为 slot 登记加时线虚拟 onset 的 widthRatio（不含 DEFAULT） */
export function getNumberNotationExtraOnsetRatios(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
): Array<{ onsetOffset: number; ratio: number }> {
  const offsets = getAddLineOnsetOffsets(getSlotChronaxie(note));
  return offsets.map((offset, index) => ({
    onsetOffset: offset,
    ratio: index === offsets.length - 1
      ? getLastAddLineColumnWidthRatio(note, skin)
      : getAddLineOnlyColumnWidthRatio(note, skin),
  }));
}

/** 加时线 x：取虚拟 onset 列起点（简谱居左） */
export function resolveAddLineXFromLayout(
  layout: MeasureColumnLayout,
  domainStartX: number,
  slotOnset: number,
  lineIndex: number,
): number | null {
  const onset = slotOnset + QUARTER_CHRONAXIE * (lineIndex + 1);
  const geo = layout.onsetColumnGeometry.get(onset);
  if (!geo) return null;
  return domainStartX + geo.startInDomain;
}

/** 附点 x 锚点：无加时线在符头右；有加时线在最后一根加时线 onset 列内 */
export function resolveAugmentationDotAnchorXFromLayout(
  layout: MeasureColumnLayout,
  domainStartX: number,
  slotOnset: number,
  chronaxie: number,
  noteHeadX: number,
  noteHeadW: number,
  addLineSkinW: number,
): number {
  const offsets = getAddLineOnsetOffsets(chronaxie);
  if (!offsets.length) return noteHeadX + noteHeadW;
  const lastOnset = slotOnset + offsets[offsets.length - 1]!;
  const geo = layout.onsetColumnGeometry.get(lastOnset);
  if (!geo) return noteHeadX + noteHeadW;
  return domainStartX + geo.startInDomain + addLineSkinW;
}

/** 小节的宽度系数 */
export function getMeasureWidthRatio(measure: Measure, skin: NumberNotationSkinPack): number {
  let acc = 0;
  acc += resolveWidthRatio(measure.widthRatioForMeasure, skin[NumberNotationSkinKeyEnum.Measure]?.widthRatioForMeasure);
  for (let i = 0; i < measure.notes.length; i++) {
    acc += getNoteWidthRatioForMeasure(measure.notes[i] as NoteNumber, skin);
  }
  if (measure.barline_f) {
    acc += resolveWidthRatio(measure.barline_f.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_f.type)]?.widthRatioForMeasure);
  }
  if (measure.barline_b) {
    acc += resolveWidthRatio(measure.barline_b.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_b.type)]?.widthRatioForMeasure);
  }
  if (measure.timeSignature_f) {
    acc += resolveWidthRatio(measure.timeSignature_f.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)]?.widthRatioForMeasure);
  }
  if (measure.timeSignature_b) {
    acc += resolveWidthRatio(measure.timeSignature_b.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_b.type)]?.widthRatioForMeasure);
  }
  return acc;
}
