import {TimeSignatureTypeEnum} from '@/enums/musicScoreEnum';

/** 数字型拍号 skin key（不含 Common / Cut） */
export const FRACTION_TIME_SIGNATURE_KEYS = [
  '2_4',
  '3_4',
  '4_4',
  '5_4',
  '6_4',
  '3_8',
  '4_8',
  '5_8',
  '6_8',
  '7_8',
  '9_8',
  '12_8',
  '2_2',
  '3_2',
  '4_2',
] as const;

export type FractionTimeSignatureKey = (typeof FRACTION_TIME_SIGNATURE_KEYS)[number];

/** 展示 / 对照曲谱用：全部拍号（固定顺序） */
export const TIME_SIGNATURE_TYPES_ORDERED: TimeSignatureTypeEnum[] = [
  TimeSignatureTypeEnum['2_4'],
  TimeSignatureTypeEnum['3_4'],
  TimeSignatureTypeEnum['4_4'],
  TimeSignatureTypeEnum['5_4'],
  TimeSignatureTypeEnum['6_4'],
  TimeSignatureTypeEnum['3_8'],
  TimeSignatureTypeEnum['4_8'],
  TimeSignatureTypeEnum['5_8'],
  TimeSignatureTypeEnum['6_8'],
  TimeSignatureTypeEnum['7_8'],
  TimeSignatureTypeEnum['9_8'],
  TimeSignatureTypeEnum['12_8'],
  TimeSignatureTypeEnum.Common,
  TimeSignatureTypeEnum.Cut,
  TimeSignatureTypeEnum['2_2'],
  TimeSignatureTypeEnum['3_2'],
  TimeSignatureTypeEnum['4_2'],
];

/** 拍号 → 分子 / 分母（Common=4/4，Cut=2/2） */
export function timeSignatureTypeToBeats(type: TimeSignatureTypeEnum): {
  beats: number;
  beatType: number;
} {
  switch (type) {
    case TimeSignatureTypeEnum.Common:
      return {beats: 4, beatType: 4};
    case TimeSignatureTypeEnum.Cut:
      return {beats: 2, beatType: 2};
    default: {
      const [beatsRaw, beatTypeRaw] = String(type).split('_');
      return {
        beats: Number(beatsRaw) || 4,
        beatType: Number(beatTypeRaw) || 4,
      };
    }
  }
}

/** UI / 导出用标签 */
export function timeSignatureTypeToLabel(type: TimeSignatureTypeEnum): string {
  switch (type) {
    case TimeSignatureTypeEnum.Common:
      return 'C';
    case TimeSignatureTypeEnum.Cut:
      return 'C|';
    default:
      return String(type).replace('_', '/');
  }
}

/** MusicXML beats + beat-type → 拍号枚举 */
export function beatsToTimeSignatureType(
  beats: number | string,
  beatType: number | string,
): TimeSignatureTypeEnum | undefined {
  const key = `${beats}_${beatType}` as keyof typeof TimeSignatureTypeEnum;
  if (key in TimeSignatureTypeEnum) {
    return TimeSignatureTypeEnum[key];
  }
  return undefined;
}

/** MusicXML time@symbol → 拍号枚举 */
export function timeSignatureSymbolToType(symbol: string): TimeSignatureTypeEnum | undefined {
  if (symbol === 'common') return TimeSignatureTypeEnum.Common;
  if (symbol === 'cut') return TimeSignatureTypeEnum.Cut;
  return undefined;
}

/** MusicXML 导出：数字拍号或 symbol */
export function timeSignatureTypeToMusicXml(type: TimeSignatureTypeEnum): {
  beats?: number;
  beatType?: number;
  symbol?: 'common' | 'cut';
} {
  switch (type) {
    case TimeSignatureTypeEnum.Common:
      return {symbol: 'common'};
    case TimeSignatureTypeEnum.Cut:
      return {symbol: 'cut'};
    default:
      return timeSignatureTypeToBeats(type);
  }
}
