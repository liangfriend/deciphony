import type {DrumNotesInfo, DrumSlot, Measure, MeasureNoteSlot} from "@/types/MusicScoreType";
import type {DrumNotationSkinPack} from "@/types/common";
import {DrumHeadTypeEnum} from "@/enums/musicScoreEnum";
import {resolveWidthRatio} from "@/utils/widthRatio";
import {getMeasureVoices} from "@/utils/measureNotes";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import {STEM_Y_OFFSET} from "../constants";
import type {DrumVoice, LongRestRole} from "../types";
import {getAugmentationDotSkinKey, getDrumHeadSkinKey, getRestSkinKey} from "./skinKey";
import {isDrumNote, isDrumRest, slotSymbol} from "./staffSlot";
import {getPrefixParts, getSuffixParts} from "./measureParts";
import {GRACE_NOTE_SCALE} from "@/render/graceNote";

type WidthPick = (item: { widthRatio?: number; widthRatioForMeasure?: number } | undefined, data?: number) => number;

/**
 * relativeX 参与合并（相同才合并），但 relativeY/W/H 偏移会破坏符干的垂直/宽度贴合，
 * 带这类偏移的音符独立渲染符干符尾，不参与合并。
 */
function hasNonXRelativeOffset(n: DrumNotesInfo): boolean {
  return (n.relativeY ?? 0) !== 0
    || (n.relativeW ?? 0) !== 0
    || (n.relativeH ?? 0) !== 0;
}

/**
 * 共用一条符干的音符分组（符干方向由声部决定）：chronaxie + relativeX 相同者合并；
 * 带 relativeY/W/H 偏移的音符各自单独一组。
 */
export function getStemBuckets(notesInfo: DrumNotesInfo[]): DrumNotesInfo[][] {
  const buckets: DrumNotesInfo[][] = [];
  const merged = new Map<string, DrumNotesInfo[]>();
  for (const n of notesInfo) {
    if (hasNonXRelativeOffset(n)) {
      buckets.push([n]);
      continue;
    }
    const key = `${n.chronaxie}|${n.relativeX ?? 0}`;
    let list = merged.get(key);
    if (!list) {
      list = [];
      merged.set(key, list);
      buckets.push(list);
    }
    list.push(n);
  }
  return buckets;
}

/**
 * 同一符干组内相邻（二度）音符头错位：
 * - up 声部：自下而上扫描，与下方未错位音符相邻者移到符干右侧（'right'）；
 * - down 声部：自上而下扫描，与上方未错位音符相邻者移到符干左侧（'left'）。
 */
export function computeSecondDisplacement(notesInfo: DrumNotesInfo[], voice: DrumVoice): Map<string, 'left' | 'right'> {
  const result = new Map<string, 'left' | 'right'>();
  const up = voice === 'up';
  for (const bucket of getStemBuckets(notesInfo)) {
    if (bucket.length < 2) continue;
    const sorted = [...bucket].sort((a, b) => (up ? a.region - b.region : b.region - a.region));
    let prevRegion: number | null = null;
    let prevDisplaced = false;
    for (const n of sorted) {
      if (prevRegion != null && n.region === prevRegion) continue;
      const adjacent = prevRegion != null && Math.abs(n.region - prevRegion) === 1;
      const displaced: boolean = adjacent && !prevDisplaced;
      if (displaced) result.set(n.id, up ? 'right' : 'left');
      prevRegion = n.region;
      prevDisplaced = displaced;
    }
  }
  return result;
}

/**
 * 符干与音符头的接点 y（符干靠音符头一端）：
 * - Normal：中心向符干方向偏 STEM_Y_OFFSET；
 * - 叉号：向上接叉号顶部，向下接叉号底部；
 * - 带圆框 / 棱形：接中心；
 * - 三角形：上下都接三角形底部。
 */
export function getStemAttachY(
  headType: DrumHeadTypeEnum,
  head: { y: number; h: number },
  direction: DrumVoice,
  measureHeight: number,
): number {
  const centerY = head.y + head.h / 2;
  switch (headType) {
    case DrumHeadTypeEnum.Cross:
      return direction === 'up' ? head.y : head.y + head.h;
    case DrumHeadTypeEnum.CircledCross:
    case DrumHeadTypeEnum.CircledSlash:
    case DrumHeadTypeEnum.Diamond:
      return centerY;
    case DrumHeadTypeEnum.Triangle:
      return head.y + head.h;
    case DrumHeadTypeEnum.Normal:
    default:
      return direction === 'up'
        ? centerY - STEM_Y_OFFSET * measureHeight
        : centerY + STEM_Y_OFFSET * measureHeight;
  }
}

/** 附点延长后的时值（与播放 getDuration 一致） */
export function getDotExtendedChronaxie(chronaxie: number, dotCount: number): number {
  let total = chronaxie;
  let add = chronaxie;
  for (let i = 0; i < dotCount; i++) {
    add /= 2;
    total += add;
  }
  return total;
}

/** 列布局 onset 推进：含附点；音符取首个 notesInfo */
export function getSlotLayoutChronaxie(slot: DrumSlot): number {
  if (isDrumRest(slot)) {
    return getDotExtendedChronaxie(slot.chronaxie, slot.augmentationDot?.count ?? 0);
  }
  const lead = slot.notesInfo[0];
  if (!lead) return 64;
  return getDotExtendedChronaxie(lead.chronaxie, lead.augmentationDot?.count ?? 0);
}

/** 音符 / 休止符位的时值（用于宽度系数；和弦取 notesInfo 最大 chronaxie） */
export function getSlotChronaxie(slot: DrumSlot): number {
  if (isDrumRest(slot)) return slot.chronaxie;
  if (slot.notesInfo.length === 0) return 64;
  let max = slot.notesInfo[0]!.chronaxie;
  for (let i = 1; i < slot.notesInfo.length; i++) {
    const c = slot.notesInfo[i]!.chronaxie;
    if (c > max) max = c;
  }
  return max;
}

/**
 * widthRatio 时值换算系数。
 * onset 列布局后，全/二/四分不再靠放大 ratio 给符尾/增时腾位（时长由 onset 对齐）；仅更短时值略缩小。
 */
export function getChronaxieWidthCoefficient(chronaxie: number): number {
  if (chronaxie >= 64) return 1;
  if (chronaxie === 32) return 0.8;
  if (chronaxie === 16) return 0.7;
  if (chronaxie === 8) return 0.6;
  if (chronaxie === 4) return 0.55;
  if (chronaxie === 2) return 0.5;
  if (chronaxie === 1) return 0.45;
  return 1;
}

/** 槽位主体皮肤：休止符按时值，音符取首个 notesInfo 的音符头类型 */
function slotBaseSkinKey(slot: DrumSlot): DrumNotationSkinKeyEnum {
  if (isDrumRest(slot)) return getRestSkinKey(slot.chronaxie);
  return getDrumHeadSkinKey(slot.notesInfo[0]?.headType ?? DrumHeadTypeEnum.Normal);
}

function collectGraceNotesWidthRatio(graceNotes: DrumNotesInfo[] | undefined, skin: DrumNotationSkinPack, pick: WidthPick): number {
  let sub = 0;
  for (const g of graceNotes ?? []) {
    sub += pick(skin[getDrumHeadSkinKey(g.headType)], g.widthRatio) * GRACE_NOTE_SCALE;
    if (g.augmentationDot) {
      sub += pick(skin[getAugmentationDotSkinKey(g.augmentationDot)], g.augmentationDot.widthRatio) * GRACE_NOTE_SCALE;
    }
  }
  return sub;
}

function collectSlotSubWidthRatio(slot: DrumSlot, voice: DrumVoice, skin: DrumNotationSkinPack, pick: WidthPick): number {
  let sub = 0;
  if (isDrumNote(slot)) {
    const displaced = computeSecondDisplacement(slot.notesInfo, voice);
    for (const side of new Set(displaced.values())) {
      const ni = slot.notesInfo.find((n) => displaced.get(n.id) === side)!;
      sub += pick(skin[getDrumHeadSkinKey(ni.headType)], ni.widthRatio);
    }
    for (const ni of slot.notesInfo) {
      if (ni.augmentationDot) {
        sub += pick(skin[getAugmentationDotSkinKey(ni.augmentationDot)], ni.augmentationDot.widthRatio);
      }
    }
    sub += collectGraceNotesWidthRatio(slot.graceNotes, skin, pick);
    sub += collectGraceNotesWidthRatio(slot.graceNotesAfter, skin, pick);
  } else if (slot.augmentationDot) {
    sub += pick(skin[getAugmentationDotSkinKey(slot.augmentationDot)], slot.augmentationDot.widthRatio);
  }
  return sub;
}

function slotWidthRatio(
  measureSlot: MeasureNoteSlot,
  voice: DrumVoice,
  skin: DrumNotationSkinPack,
  field: 'widthRatio' | 'widthRatioForMeasure',
): number {
  const slot = slotSymbol(measureSlot) as DrumSlot;
  const chronaxie = getSlotChronaxie(slot);
  const pick: WidthPick = (item, data) => resolveWidthRatio(data, item?.[field]);
  const base = pick(skin[slotBaseSkinKey(slot)], measureSlot[field]) * getChronaxieWidthCoefficient(chronaxie);
  return base + collectSlotSubWidthRatio(slot, voice, skin, pick);
}

/** 音符 / 休止符在小节内的宽度占比（widthRatio 在 MeasureNoteSlot 上） */
export function getNoteWidthRatio(measureSlot: MeasureNoteSlot, voice: DrumVoice, skin: DrumNotationSkinPack): number {
  return slotWidthRatio(measureSlot, voice, skin, 'widthRatio');
}

/** 音符 / 休止符对小节在单谱表内宽度占比的系数 */
export function getNoteWidthRatioForMeasure(measureSlot: MeasureNoteSlot, voice: DrumVoice, skin: DrumNotationSkinPack): number {
  return slotWidthRatio(measureSlot, voice, skin, 'widthRatioForMeasure');
}

/**
 * 小节的宽度系数：上下声部按 onset 合并（同 onset 取较大者，与列对齐一致）；
 * 长休止符小节不计音符，前后置符号按角色取舍。
 */
export function getMeasureWidthRatio(measure: Measure, skin: DrumNotationSkinPack, role?: LongRestRole | null): number {
  let acc = resolveWidthRatio(measure.widthRatioForMeasure, skin[DrumNotationSkinKeyEnum.Measure]?.widthRatioForMeasure);
  if (!role) {
    const byOnset = new Map<number, number>();
    const voices = getMeasureVoices(measure);
    for (const voice of ['up', 'down'] as const) {
      let onset = 0;
      for (const measureSlot of voices[voice]) {
        const sym = slotSymbol(measureSlot);
        if (!isDrumNote(sym) && !isDrumRest(sym)) continue;
        const ratio = getNoteWidthRatioForMeasure(measureSlot, voice, skin);
        byOnset.set(onset, Math.max(byOnset.get(onset) ?? 0, ratio));
        onset += getSlotLayoutChronaxie(sym);
      }
    }
    for (const ratio of byOnset.values()) acc += ratio;
  }
  for (const part of [...getPrefixParts(measure, role), ...getSuffixParts(measure, role)]) {
    acc += resolveWidthRatio(part.data.widthRatioForMeasure, skin[part.skinKey]?.widthRatioForMeasure);
  }
  return acc;
}
