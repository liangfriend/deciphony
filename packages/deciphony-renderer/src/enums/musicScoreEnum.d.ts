export declare enum MusicScoreTypeEnum {
    StandardStaff = 1,// 五线谱
    NumberNotation = 2,// 简谱（数字谱）
    RhythmNotation = 3,// 节奏谱（主要显示节奏）
    Percussion = 4
}
export declare enum BarlineTypeEnum {
    Single_barline = "single_barline",
    Double_barline = "double_barline",
    StartRepeat_barline = "startRepeat_barline",
    EndRepeat_barline = "endRepeat_barline",
    Dashed_barline = "dashed_barline",
    Final_barline = "final_barline",
    Start_end_repeat_barline = "start_end_repeat_barline",
    Dotted_barline = "dotted_barline",
    Reverse_barline = "reverse_barline",
    Heavy_barline = "heavy_barline",
    Heavy_double_barline = "heavy_double_barline"
}
export declare enum ClefTypeEnum {
    Treble = "treble",
    Bass = "bass",
    Alto = "alto",
    Tenor = "tenor"
}
export declare enum KeySignatureTypeEnum {
    C = "C",
    C_sharp = "C_sharp",
    D_flat = "D_flat",
    D = "D",
    E_flat = "E_flat",
    E = "E",
    F = "F",
    F_sharp = "F_sharp",
    G_flat = "G_flat",
    G = "G",
    A_flat = "A_flat",
    A = "A",
    B_flat = "B_flat",
    B = "B",
    C_flat = "C_flat"
}
export declare enum TimeSignatureTypeEnum {
    '1_1' = "1_1",
    '1_4' = "1_4",
    '2_4' = "2_4",
    '3_4' = "3_4",
    '4_4' = "4_4",
    '3_8' = "3_8",
    '6_8' = "6_8"
}
export declare enum SpanSymbolTypeEnum {
    DoubleNote = 1,// 双音符型 如连音线、通过起始，结束音符定位   符杠beam不属于跨小节符号，beam属于一种特殊逻辑
    DoubleMeasure = 2
}
export declare enum SpanSymbolNameEnum {
    Volta = 1,
    slur = 2
}
export declare enum NoteSymbolTypeEnum {
    Note = 1,// 音符
    Rest = 2
}
export declare enum DoubleAffiliatedSymbolNameEnum {
    slur = 0,// 连音线
    volta = 1
}
export declare enum SingleAffiliatedSymbolNameEnum {
    slur = 0,// 连音线
    volta = 1
}
export declare enum AccidentalTypeEnum {
    Sharp = "Sharp",
    Flat = "Flat",
    Double_sharp = "double_sharp",
    Double_flat = "double_flat",
    Natural = "natural"
}
export declare enum BeamTypeEnum {
    None = "None",// 无符杠
    OnlyRight = "OnlyRight",// 只连接右侧
    Combined = "Combined"
}
