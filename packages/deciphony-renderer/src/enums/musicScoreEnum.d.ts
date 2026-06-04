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
/** 双音符附属型符号名称（如连音线 slur） */
export declare enum DoubleNoteAffiliatedSymbolNameEnum {
    slur = 0,
    Trill_line = "trill_line",
    Upprail_line = "upprail_line",
    Downprail_line = "downprail_line",
    Prallprall_line = "prallprall_line",
    Pedal_ped_asterisk = "pedal_ped_asterisk",
    Pedal_ped_line = "pedal_ped_line",
    Pedal_straight_hooks = "pedal_straight_hooks",
    Pedal_angled_end_hook = "pedal_angled_end_hook",
    Pedal_both_hooks_angled = "pedal_both_hooks_angled",
    Pedaal_angled_start_hook = "pedal_angled_start_hook",
    Crescendo_line = "crescendo_line",
    Diminuendo_line = "diminuendo_line",
    Crescendo_hairpin = "crescendo_hairpin",
    Diminuendo_hairpin = "diminuendo_hairpin",
    '8va_alta' = "8va_alta",
    '8va_bassa' = "8va_bassa",
    '15ma_alta' = "15ma_alta",
    '15ma_bassa' = "15ma_bassa",
    '22ma_alta' = "22ma_alta",
    '22ma_bassa' = "22ma_bassa"
}
/** 双小节附属型符号名称（如反复小房子 volta） */
export declare enum DoubleMeasureAffiliatedSymbolNameEnum {
    volta = 0
}
/** 单音符附属型符号名称 */
export declare enum SingleNoteAffiliatedSymbolNameEnum {
    Accent_above = "acccent_above",
    Staccato_above = "staccato_above",
    Staccatissimo_above = "staccato_above",
    Tenuto_above = "tenuto_above",
    Loure_above = "loure_above",
    Marcato_above = "marcato_above",
    Accent_staccato_above = "accent_staccato_above",
    Marcato_staccato_above = "marcato_staccato_above",
    Marcato_tenuto_above = "marcato_tenuto_above",
    Staccatissimo_stroke_above = "staccatissimo_stroke_above",
    Staccatissimo_wedge_above = "staccatissimo_wedge_above",
    Stress_above = "stress_above",
    Tenuto_accent_above = "tenuto_accent_above",
    Unstress_above = "unstress_above",
    Open = "open",
    Muted = "muted",
    Harmonic = "harmonic",
    Up_bow = "up_bow",
    Down_bow = "down_bow",
    Turn = "turn",
    InvertedTurn = "invertedTurn",
    Trill = "trill",
    ShortTrill = "shortTrill",
    Mordent = "mordent",
    Arpeggio = "arpeggio",
    Up_arpeggio = "up_arpeggio",
    Down_arpeggio = "down_arpeggio",
    Bracket_arpeggio = "bracket_arpeggio",
    Up_arpeggio_straight = "up_arpeggio_straight",
    Down_arpeggio_straight = "down_arpeggio_straight",
    PPP = "ppp",
    PP = "pp",
    P = "p",
    MP = "mp",
    MF = "mf",
    F = "f",
    FF = "ff",
    FFF = "fff",
    FP = "fp",
    PF = "pf",
    SF = "sf",
    SFZ = "sfz",
    SFF = "sff",
    SFFZ = "sffz",
    SFP = "sfp",
    RFZ = "rfz",
    RF = "rf",
    FZ = "fz"
}
/** 单小节附属型符号名称 */
export declare enum SingleMeasureAffiliatedSymbolNameEnum {
}
/**
 *  反复符号枚举(不包含反复小节线和volta)
 */
export declare enum MeasureStartRepeatEnum {
    Coda = "coda",// 走到to_coda
    Segno = "segno"
}
export declare enum MeasureEndRepeatEnum {
    To_coda = "to_coda",
    DC = "DC",// 回到乐曲开头
    DS = "DS",// 回到segno
    Fine = "fine",// 终止收尾
    DC_al_fine = "dc_al_fine",
    DC_al_coda = "dc_al_coda",
    DS_al_fine = "ds_al_fine",
    DS_al_coda = "ds_al_coda"
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
export declare enum BracketTypeEnum {
    Bracket = "Bracket",// 大括号
    Brace = "Brace",// 花括号
    Square = "Square"
}
