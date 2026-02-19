import {
  BarlineTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {AugmentationDot} from "@/types/MusicScoreType";
import {AccidentalTypeEnum} from "@/enums/musicScoreEnum";

export function getBarlineSkinKey(barlineType: BarlineTypeEnum): StandardStaffSkinKeyEnum {
  const map: Record<BarlineTypeEnum, StandardStaffSkinKeyEnum> = {
    [BarlineTypeEnum.Single_barline]: StandardStaffSkinKeyEnum.Single_barline,
    [BarlineTypeEnum.Double_barline]: StandardStaffSkinKeyEnum.Double_barline,
    [BarlineTypeEnum.StartRepeat_barline]: StandardStaffSkinKeyEnum.StartRepeat_barline,
    [BarlineTypeEnum.EndRepeat_barline]: StandardStaffSkinKeyEnum.EndRepeat_barline,
    [BarlineTypeEnum.Dashed_barline]: StandardStaffSkinKeyEnum.Dashed_barline,
    [BarlineTypeEnum.Final_barline]: StandardStaffSkinKeyEnum.Final_barline,
    [BarlineTypeEnum.Start_end_repeat_barline]: StandardStaffSkinKeyEnum.Start_end_repeat_barline,
    [BarlineTypeEnum.Dotted_barline]: StandardStaffSkinKeyEnum.Dotted_barline,
    [BarlineTypeEnum.Reverse_barline]: StandardStaffSkinKeyEnum.Reverse_barline,
    [BarlineTypeEnum.Heavy_barline]: StandardStaffSkinKeyEnum.Heavy_barline,
    [BarlineTypeEnum.Heavy_double_barline]: StandardStaffSkinKeyEnum.Heavy_double_barline,
  };
  return map[barlineType] ?? StandardStaffSkinKeyEnum.Single_barline;
}

/** 谱号类型 + 是否前置 */
export function getClefSkinKey(clefType: ClefTypeEnum, isFront: boolean): StandardStaffSkinKeyEnum {
  switch (clefType) {
    case ClefTypeEnum.Treble:
      return isFront ? StandardStaffSkinKeyEnum.Treble_f : StandardStaffSkinKeyEnum.Treble;
    case ClefTypeEnum.Bass:
      return isFront ? StandardStaffSkinKeyEnum.Bass_f : StandardStaffSkinKeyEnum.Bass;
    case ClefTypeEnum.Alto:
      return isFront ? StandardStaffSkinKeyEnum.Alto_f : StandardStaffSkinKeyEnum.Alto;
    case ClefTypeEnum.Tenor:
      return isFront ? StandardStaffSkinKeyEnum.Tenor_f : StandardStaffSkinKeyEnum.Tenor;
    default:
      return isFront ? StandardStaffSkinKeyEnum.Treble_f : StandardStaffSkinKeyEnum.Treble;
  }
}

/** 小节生效谱号：可传 noteIndex 表示该音符位前生效的谱号 */
export function getClefForMeasure(
  measures: import("@/types/MusicScoreType").Measure[],
  measureIndex: number,
  noteIndex?: number
): ClefTypeEnum {
  if (measureIndex < 0) return ClefTypeEnum.Treble;
  const m = measures[measureIndex];
  if (noteIndex != null && noteIndex >= 0 && m.notes) {
    for (let i = noteIndex; i >= 0; i--) {
      const note = m.notes[i] as { clef?: { clefType: ClefTypeEnum } };
      if (note?.clef) return note.clef.clefType;
    }
  }
  if (m.clef_f) return m.clef_f.clefType;
  const prev = measureIndex - 1;
  if (prev < 0) return ClefTypeEnum.Treble;
  const pm = measures[prev];
  if (pm.clef_b) return pm.clef_b.clefType;
  if (pm.clef_f) return pm.clef_f.clefType;
  return getClefForMeasure(measures, prev);
}

/** 调号 y 偏移：皮肤按 treble 布局，中音/次中音 +5.5，低音 +11 */
export function getKeySignatureYOffset(
  clefType: ClefTypeEnum,
  measureHeight: number,
  measureLineWidth: number
): number {
  const unit = (measureHeight - 5 * measureLineWidth) / 8 + measureLineWidth / 2;
  switch (clefType) {
    case ClefTypeEnum.Alto:
      return unit;
    case ClefTypeEnum.Tenor:
      return -unit;
    case ClefTypeEnum.Bass:
      return unit * 2;
    default:
      return 0;
  }
}

export function getKeySignatureSkinKey(type: KeySignatureTypeEnum): StandardStaffSkinKeyEnum {
  return StandardStaffSkinKeyEnum[type];
}

export function getTimeSignatureSkinKey(type?: TimeSignatureTypeEnum): StandardStaffSkinKeyEnum {
  if (type == null) return StandardStaffSkinKeyEnum['4_4'];
  const map: Record<TimeSignatureTypeEnum, StandardStaffSkinKeyEnum> = {
    [TimeSignatureTypeEnum['1_1']]: StandardStaffSkinKeyEnum['1_1'],
    [TimeSignatureTypeEnum['1_4']]: StandardStaffSkinKeyEnum['1_4'],
    [TimeSignatureTypeEnum['2_4']]: StandardStaffSkinKeyEnum['2_4'],
    [TimeSignatureTypeEnum['3_4']]: StandardStaffSkinKeyEnum['3_4'],
    [TimeSignatureTypeEnum['4_4']]: StandardStaffSkinKeyEnum['4_4'],
    [TimeSignatureTypeEnum['3_8']]: StandardStaffSkinKeyEnum['3_8'],
    [TimeSignatureTypeEnum['6_8']]: StandardStaffSkinKeyEnum['6_8'],
  };
  return map[type] ?? StandardStaffSkinKeyEnum['4_4'];
}

/** 时值 chronaxie → 音符头皮肤 */
export function getNoteHeadSkinKey(chronaxie: number): StandardStaffSkinKeyEnum {
  if (chronaxie >= 256) return StandardStaffSkinKeyEnum.NoteHead_1;
  if (chronaxie >= 128) return StandardStaffSkinKeyEnum.NoteHead_2;
  return StandardStaffSkinKeyEnum.NoteHead_3;
}

/** 时值 chronaxie → 休止符皮肤 */
export function getRestSkinKey(chronaxie: number): StandardStaffSkinKeyEnum {
  const map: Record<number, StandardStaffSkinKeyEnum> = {
    256: StandardStaffSkinKeyEnum.Rest_1,
    128: StandardStaffSkinKeyEnum.Rest_2,
    64: StandardStaffSkinKeyEnum.Rest_3,
    32: StandardStaffSkinKeyEnum.Rest_4,
    16: StandardStaffSkinKeyEnum.Rest_5,
    8: StandardStaffSkinKeyEnum.Rest_6,
    4: StandardStaffSkinKeyEnum.Rest_7,
    2: StandardStaffSkinKeyEnum.Rest_8,
    1: StandardStaffSkinKeyEnum.Rest_9,
  };
  return map[chronaxie] ?? StandardStaffSkinKeyEnum.Rest_4;
}

/** 时值 chronaxie ≤32 → 符尾皮肤；direction 为 down 时用符尾倒（_r） */
export function getNoteTailSkinKey(chronaxie: number, direction?: 'up' | 'down'): StandardStaffSkinKeyEnum {
  const map: Record<number, StandardStaffSkinKeyEnum> = {
    32: StandardStaffSkinKeyEnum.NoteTail_1,
    16: StandardStaffSkinKeyEnum.NoteTail_2,
    8: StandardStaffSkinKeyEnum.NoteTail_3,
    4: StandardStaffSkinKeyEnum.NoteTail_4,
    2: StandardStaffSkinKeyEnum.NoteTail_5,
    1: StandardStaffSkinKeyEnum.NoteTail_6,
  };
  const rMap: Record<number, StandardStaffSkinKeyEnum> = {
    32: StandardStaffSkinKeyEnum.NoteTail_1_r,
    16: StandardStaffSkinKeyEnum.NoteTail_2_r,
    8: StandardStaffSkinKeyEnum.NoteTail_3_r,
    4: StandardStaffSkinKeyEnum.NoteTail_4_r,
    2: StandardStaffSkinKeyEnum.NoteTail_5_r,
    1: StandardStaffSkinKeyEnum.NoteTail_6_r,
  };
  if (direction === 'down') {
    return rMap[chronaxie] ?? StandardStaffSkinKeyEnum.NoteTail_1_r;
  }
  return map[chronaxie] ?? StandardStaffSkinKeyEnum.NoteTail_1;
}

export function chronaxieToBeamLineCount(chronaxie: number): number {
  const map: Record<number, number> = {32: 1, 16: 2, 8: 3, 4: 4, 2: 5, 1: 6};
  return map[chronaxie] ?? 1;
}

export function getAccidentalSkinKey(type: AccidentalTypeEnum): StandardStaffSkinKeyEnum {
  const map: Record<AccidentalTypeEnum, StandardStaffSkinKeyEnum> = {
    [AccidentalTypeEnum.Sharp]: StandardStaffSkinKeyEnum.Sharp,
    [AccidentalTypeEnum.Flat]: StandardStaffSkinKeyEnum.Flat,
    [AccidentalTypeEnum.Double_sharp]: StandardStaffSkinKeyEnum.Double_sharp,
    [AccidentalTypeEnum.Double_flat]: StandardStaffSkinKeyEnum.Double_flat,
    [AccidentalTypeEnum.Natural]: StandardStaffSkinKeyEnum.Natural,
  };
  return map[type] ?? StandardStaffSkinKeyEnum.Natural;
}

export function getAugmentationDotSkinKey(augmentationDot: AugmentationDot): StandardStaffSkinKeyEnum {
  const map: Record<1 | 2 | 3, StandardStaffSkinKeyEnum> = {
    [1]: StandardStaffSkinKeyEnum.AugmentationDot_1,
    [2]: StandardStaffSkinKeyEnum.AugmentationDot_2,
    [3]: StandardStaffSkinKeyEnum.AugmentationDot_3,
  };
  return map[augmentationDot.count as 1 | 2 | 3];
}
