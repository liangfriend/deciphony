// 曲谱展示模式
export enum MusicScoreTypeEnum {
  StandardStaff = 1,        // 五线谱
  NumberNotation,      // 简谱（数字谱）
  RhythmNotation,      // 节奏谱（主要显示节奏）
  Percussion,          //  打击乐谱（可选）
}

// 小节线类型
export enum BarlineTypeEnum {
  Single_barline = 'single_barline',
  Double_barline = 'double_barline',
  StartRepeat_barline = 'startRepeat_barline',
  EndRepeat_barline = 'endRepeat_barline',
  Dashed_barline = 'dashed_barline',
  Final_barline = 'final_barline',
  Start_end_repeat_barline = 'start_end_repeat_barline',
  Dotted_barline = 'dotted_barline',
  Reverse_barline = 'reverse_barline',
  Heavy_barline = 'heavy_barline',
  Heavy_double_barline = 'heavy_double_barline',
}

// 谱号
export enum ClefTypeEnum {
  Treble = 'treble',
  Bass = 'bass',
  Alto = 'alto',
  Tenor = 'tenor', // tenor比Treble还高
}

// 调号（升号调 / 降号调，与皮肤 Sharp / Flat 对应）
export enum KeySignatureTypeEnum {
  C = 'C',
  C_sharp = 'C_sharp',
  D_flat = 'D_flat',
  D = 'D',
  E_flat = 'E_flat',
  E = 'E',
  F = 'F',
  F_sharp = 'F_sharp',
  G_flat = 'G_flat',
  G = 'G',
  A_flat = 'A_flat',
  A = 'A',
  B_flat = 'B_flat',
  B = 'B',
  C_flat = 'C_flat',
}

// 拍号
export enum TimeSignatureTypeEnum {
  '1_1' = '1_1',
  '1_4' = '1_4',
  '2_4' = '2_4',
  '3_4' = '3_4',
  '4_4' = '4_4',
  '3_8' = '3_8',
  '6_8' = '6_8',
}

// 跨小节符号类型
// 跨小节符号类型
export enum SpanSymbolTypeEnum {
  DoubleNote = 1, // 双音符型 如连音线、通过起始，结束音符定位   符杠beam不属于跨小节符号，beam属于一种特殊逻辑
  DoubleMeasure// 双小节型 如volta(反复房子符号) 通过起始，结束小节定位
}

// 跨小节符号名称
export enum SpanSymbolNameEnum {
  Volta = 1,
  slur,
}

export enum NoteSymbolTypeEnum {
  Note = 1, // 音符
  Rest // 休止符
}


// 双音符，双小节附属型符号名称
export enum DoubleAffiliatedSymbolNameEnum {
  slur, // 连音线
  volta // 反复小房子
}

// 单音符，单小节附属型符号名称
export enum SingleAffiliatedSymbolNameEnum {
  slur, // 连音线
  volta // 反复小房子
}

// 变音符号类型
export enum AccidentalTypeEnum {
  Sharp = 'Sharp',
  Flat = 'Flat',
  Double_sharp = 'double_sharp',
  Double_flat = 'double_flat',
  Natural = 'natural',
}