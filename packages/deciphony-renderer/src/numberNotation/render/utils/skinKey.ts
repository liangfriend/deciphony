import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import type {AugmentationDot} from "@/types/MusicScoreType";

export function getBarlineSkinKey(barlineType: BarlineTypeEnum): NumberNotationSkinKeyEnum {
  const map: Record<BarlineTypeEnum, NumberNotationSkinKeyEnum> = {
    [BarlineTypeEnum.Single_barline]: NumberNotationSkinKeyEnum.Single_barline,
    [BarlineTypeEnum.Double_barline]: NumberNotationSkinKeyEnum.Double_barline,
    [BarlineTypeEnum.StartRepeat_barline]: NumberNotationSkinKeyEnum.StartRepeat_barline,
    [BarlineTypeEnum.EndRepeat_barline]: NumberNotationSkinKeyEnum.EndRepeat_barline,
    [BarlineTypeEnum.Dashed_barline]: NumberNotationSkinKeyEnum.Dashed_barline,
    [BarlineTypeEnum.Final_barline]: NumberNotationSkinKeyEnum.Final_barline,
    [BarlineTypeEnum.Start_end_repeat_barline]: NumberNotationSkinKeyEnum.Start_end_repeat_barline,
    [BarlineTypeEnum.Dotted_barline]: NumberNotationSkinKeyEnum.Dotted_barline,
    [BarlineTypeEnum.Reverse_barline]: NumberNotationSkinKeyEnum.Reverse_barline,
    [BarlineTypeEnum.Heavy_barline]: NumberNotationSkinKeyEnum.Heavy_barline,
    [BarlineTypeEnum.Heavy_double_barline]: NumberNotationSkinKeyEnum.Heavy_double_barline,
  };
  return map[barlineType] ?? NumberNotationSkinKeyEnum.Single_barline;
}

/** 谱号类型 + 是否前置 */
export function getClefSkinKey(clefType: ClefTypeEnum, isFront: boolean): NumberNotationSkinKeyEnum {
  switch (clefType) {
    case ClefTypeEnum.Treble:
      return isFront ? NumberNotationSkinKeyEnum.Treble_f : NumberNotationSkinKeyEnum.Treble;
    case ClefTypeEnum.Bass:
      return isFront ? NumberNotationSkinKeyEnum.Bass_f : NumberNotationSkinKeyEnum.Bass;
    case ClefTypeEnum.Alto:
      return isFront ? NumberNotationSkinKeyEnum.Alto_f : NumberNotationSkinKeyEnum.Alto;
    case ClefTypeEnum.Tenor:
      return isFront ? NumberNotationSkinKeyEnum.Tenor_f : NumberNotationSkinKeyEnum.Tenor;
    default:
      return isFront ? NumberNotationSkinKeyEnum.Treble_f : NumberNotationSkinKeyEnum.Treble;
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

export function getKeySignatureSkinKey(type: KeySignatureTypeEnum): NumberNotationSkinKeyEnum {
  return NumberNotationSkinKeyEnum[type];
}

export function getTimeSignatureSkinKey(type?: TimeSignatureTypeEnum): NumberNotationSkinKeyEnum {
  if (type == null) return NumberNotationSkinKeyEnum['4_4'];
  const map: Record<TimeSignatureTypeEnum, NumberNotationSkinKeyEnum> = {
    [TimeSignatureTypeEnum['1_1']]: NumberNotationSkinKeyEnum['1_1'],
    [TimeSignatureTypeEnum['1_4']]: NumberNotationSkinKeyEnum['1_4'],
    [TimeSignatureTypeEnum['2_4']]: NumberNotationSkinKeyEnum['2_4'],
    [TimeSignatureTypeEnum['3_4']]: NumberNotationSkinKeyEnum['3_4'],
    [TimeSignatureTypeEnum['4_4']]: NumberNotationSkinKeyEnum['4_4'],
    [TimeSignatureTypeEnum['3_8']]: NumberNotationSkinKeyEnum['3_8'],
    [TimeSignatureTypeEnum['6_8']]: NumberNotationSkinKeyEnum['6_8'],
  };
  return map[type] ?? NumberNotationSkinKeyEnum['4_4'];
}

/** 时值 chronaxie → 音符头皮肤 */
export function getNoteHeadSkinKey(chronaxie: number): NumberNotationSkinKeyEnum {
  if (chronaxie >= 256) return NumberNotationSkinKeyEnum.NoteHead_1;
  if (chronaxie >= 128) return NumberNotationSkinKeyEnum.NoteHead_2;
  return NumberNotationSkinKeyEnum.NoteHead_3;
}

/** 时值 chronaxie → 休止符皮肤 */
export function getRestSkinKey(chronaxie: number): NumberNotationSkinKeyEnum {
  const map: Record<number, NumberNotationSkinKeyEnum> = {
    256: NumberNotationSkinKeyEnum.Rest_1,
    128: NumberNotationSkinKeyEnum.Rest_2,
    64: NumberNotationSkinKeyEnum.Rest_3,
    32: NumberNotationSkinKeyEnum.Rest_4,
    16: NumberNotationSkinKeyEnum.Rest_5,
    8: NumberNotationSkinKeyEnum.Rest_6,
    4: NumberNotationSkinKeyEnum.Rest_7,
    2: NumberNotationSkinKeyEnum.Rest_8,
    1: NumberNotationSkinKeyEnum.Rest_9,
  };
  return map[chronaxie] ?? NumberNotationSkinKeyEnum.Rest_4;
}

/** 时值 chronaxie ≤32 → 符尾皮肤；direction 为 down 时用符尾倒（_r） */
export function getNoteTailSkinKey(chronaxie: number, direction?: 'up' | 'down'): NumberNotationSkinKeyEnum {
  const map: Record<number, NumberNotationSkinKeyEnum> = {
    32: NumberNotationSkinKeyEnum.NoteTail_1,
    16: NumberNotationSkinKeyEnum.NoteTail_2,
    8: NumberNotationSkinKeyEnum.NoteTail_3,
    4: NumberNotationSkinKeyEnum.NoteTail_4,
    2: NumberNotationSkinKeyEnum.NoteTail_5,
    1: NumberNotationSkinKeyEnum.NoteTail_6,
  };
  const rMap: Record<number, NumberNotationSkinKeyEnum> = {
    32: NumberNotationSkinKeyEnum.NoteTail_1_r,
    16: NumberNotationSkinKeyEnum.NoteTail_2_r,
    8: NumberNotationSkinKeyEnum.NoteTail_3_r,
    4: NumberNotationSkinKeyEnum.NoteTail_4_r,
    2: NumberNotationSkinKeyEnum.NoteTail_5_r,
    1: NumberNotationSkinKeyEnum.NoteTail_6_r,
  };
  if (direction === 'down') {
    return rMap[chronaxie] ?? NumberNotationSkinKeyEnum.NoteTail_1_r;
  }
  return map[chronaxie] ?? NumberNotationSkinKeyEnum.NoteTail_1;
}

export function chronaxieToBeamLineCount(chronaxie: number): number {
  const map: Record<number, number> = {32: 1, 16: 2, 8: 3, 4: 4, 2: 5, 1: 6};
  return map[chronaxie] ?? 1;
}

export function getAccidentalSkinKey(type: AccidentalTypeEnum): NumberNotationSkinKeyEnum {
  const map: Record<AccidentalTypeEnum, NumberNotationSkinKeyEnum> = {
    [AccidentalTypeEnum.Sharp]: NumberNotationSkinKeyEnum.Sharp,
    [AccidentalTypeEnum.Flat]: NumberNotationSkinKeyEnum.Flat,
    [AccidentalTypeEnum.Double_sharp]: NumberNotationSkinKeyEnum.Double_sharp,
    [AccidentalTypeEnum.Double_flat]: NumberNotationSkinKeyEnum.Double_flat,
    [AccidentalTypeEnum.Natural]: NumberNotationSkinKeyEnum.Natural,
  };
  return map[type] ?? NumberNotationSkinKeyEnum.Natural;
}

export function getAugmentationDotSkinKey(augmentationDot: AugmentationDot): NumberNotationSkinKeyEnum {
  const map: Record<1 | 2 | 3, NumberNotationSkinKeyEnum> = {
    [1]: NumberNotationSkinKeyEnum.AugmentationDot_1,
    [2]: NumberNotationSkinKeyEnum.AugmentationDot_2,
    [3]: NumberNotationSkinKeyEnum.AugmentationDot_3,
  };
  return map[augmentationDot.count as 1 | 2 | 3];
}

/** 简谱 syllable → 数字皮肤 key。0=休止符(Number_0)，1-7=音高，'X'=节奏音符(Number_X) */
export function getSyllableSkinKey(syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X'): NumberNotationSkinKeyEnum {
  if (syllable === 'X') return NumberNotationSkinKeyEnum.Number_X;
  const map: Record<number, NumberNotationSkinKeyEnum> = {
    0: NumberNotationSkinKeyEnum.Number_0,
    1: NumberNotationSkinKeyEnum.Number_1,
    2: NumberNotationSkinKeyEnum.Number_2,
    3: NumberNotationSkinKeyEnum.Number_3,
    4: NumberNotationSkinKeyEnum.Number_4,
    5: NumberNotationSkinKeyEnum.Number_5,
    6: NumberNotationSkinKeyEnum.Number_6,
    7: NumberNotationSkinKeyEnum.Number_7,
  };
  return map[syllable] ?? NumberNotationSkinKeyEnum.Number_1;
}

/** 时值 chronaxie → 简谱减时线皮肤 key（32→1条线，16→2条…） */
export function getReduceLineSkinKey(chronaxie: number): NumberNotationSkinKeyEnum {
  const map: Record<number, NumberNotationSkinKeyEnum> = {
    32: NumberNotationSkinKeyEnum.ReduceLine_1,
    16: NumberNotationSkinKeyEnum.ReduceLine_2,
    8: NumberNotationSkinKeyEnum.ReduceLine_3,
    4: NumberNotationSkinKeyEnum.ReduceLine_4,
    2: NumberNotationSkinKeyEnum.ReduceLine_5,
    1: NumberNotationSkinKeyEnum.ReduceLine_6,
  };
  return map[chronaxie] ?? NumberNotationSkinKeyEnum.ReduceLine_1;
}
