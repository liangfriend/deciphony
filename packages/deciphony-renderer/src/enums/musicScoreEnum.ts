// 曲谱展示模式
export enum MusicScoreTypeEnum {
  StandardStaff = 1,        // 五线谱
  NumberNotation,      // 简谱（数字谱）
  RhythmNotation,      // 节奏谱（主要显示节奏）
  Percussion,          //  打击乐谱（可选）
}

export enum SkinKeyEnum {
  // 小节
  Measure = 'measure',
  // 谱号
  Treble = 'treble',
  Bass = 'bass',
  // 单谱表第一小节的谱号稍微大一些
  Treble_big = 'treble_big',
  Bass_big = 'bass_big',
  // 变音符
  Sharp = 'sharp',
  Flat = 'flat',
  Double_sharp = 'double_sharp',
  Double_flat = 'double_flat',
  Natural = 'natural',
  // 小节线
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
  // 拍号
  '1_1' = '1_1',
  '1_4' = '1_4',
  '2_4' = '2_4',
  '3_4' = '3_4',
  '4_4' = '4_4',
  '6_8' = '6_8',
  // TODO 补全拍号
  // 音符头
  NoteHead_1 = 'noteHead_1', // 一分音符头
  NoteHead_2 = 'noteHead_2', // 二分音符头
  NoteHead_3 = 'noteHead_3', // 四分音符头
  // 符干
  NoteStem = 'notestem', // 符干
  // 符尾
  NoteTail_1 = 'noteTail_1', // 8分符尾
  NoteTail_2 = 'noteTail_2', // 16分符尾
  NoteTail_3 = 'noteTail_3', // 32分符尾
  NoteTail_4 = 'noteTail_4', // 64分符尾
  NoteTail_5 = 'noteTail_5', // 128分符尾
  NoteTail_6 = 'noteTail_6', // 256分符尾
  // 休止符
  rest_1 = 'rest_1', // 全休止符
  rest_2 = 'rest_2', // 2分休止符
  rest_3 = 'rest_3', // 4分休止符
  rest_4 = 'rest_4', // 8分休止符
  rest_5 = 'rest_5', // 16分休止符
  rest_6 = 'rest_6', // 32分休止符
  rest_7 = 'rest_7', // 64分休止符
  rest_8 = 'rest_8', // 128分休止符
  rest_9 = 'rest_9', // 256分休止符

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

export enum ClefTypeEnum {

}

export enum KeySignatureTypeEnum {

}

export enum TimeSignatureTypeEnum {

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