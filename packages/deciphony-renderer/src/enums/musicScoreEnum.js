// 曲谱展示模式
export var MusicScoreTypeEnum;
(function (MusicScoreTypeEnum) {
    MusicScoreTypeEnum[MusicScoreTypeEnum["StandardStaff"] = 1] = "StandardStaff";
    MusicScoreTypeEnum[MusicScoreTypeEnum["NumberNotation"] = 2] = "NumberNotation";
    MusicScoreTypeEnum[MusicScoreTypeEnum["RhythmNotation"] = 3] = "RhythmNotation";
    MusicScoreTypeEnum[MusicScoreTypeEnum["Percussion"] = 4] = "Percussion";
})(MusicScoreTypeEnum || (MusicScoreTypeEnum = {}));
// 小节线类型
export var BarlineTypeEnum;
(function (BarlineTypeEnum) {
    BarlineTypeEnum["Single_barline"] = "single_barline";
    BarlineTypeEnum["Double_barline"] = "double_barline";
    BarlineTypeEnum["StartRepeat_barline"] = "startRepeat_barline";
    BarlineTypeEnum["EndRepeat_barline"] = "endRepeat_barline";
    BarlineTypeEnum["Dashed_barline"] = "dashed_barline";
    BarlineTypeEnum["Final_barline"] = "final_barline";
    BarlineTypeEnum["Start_end_repeat_barline"] = "start_end_repeat_barline";
    BarlineTypeEnum["Dotted_barline"] = "dotted_barline";
    BarlineTypeEnum["Reverse_barline"] = "reverse_barline";
    BarlineTypeEnum["Heavy_barline"] = "heavy_barline";
    BarlineTypeEnum["Heavy_double_barline"] = "heavy_double_barline";
})(BarlineTypeEnum || (BarlineTypeEnum = {}));
// 谱号
export var ClefTypeEnum;
(function (ClefTypeEnum) {
    ClefTypeEnum["Treble"] = "treble";
    ClefTypeEnum["Bass"] = "bass";
    ClefTypeEnum["Alto"] = "alto";
    ClefTypeEnum["Tenor"] = "tenor";
})(ClefTypeEnum || (ClefTypeEnum = {}));
// 调号（升号调 / 降号调，与皮肤 Sharp / Flat 对应）
export var KeySignatureTypeEnum;
(function (KeySignatureTypeEnum) {
    KeySignatureTypeEnum["C"] = "C";
    KeySignatureTypeEnum["C_sharp"] = "C_sharp";
    KeySignatureTypeEnum["D_flat"] = "D_flat";
    KeySignatureTypeEnum["D"] = "D";
    KeySignatureTypeEnum["E_flat"] = "E_flat";
    KeySignatureTypeEnum["E"] = "E";
    KeySignatureTypeEnum["F"] = "F";
    KeySignatureTypeEnum["F_sharp"] = "F_sharp";
    KeySignatureTypeEnum["G_flat"] = "G_flat";
    KeySignatureTypeEnum["G"] = "G";
    KeySignatureTypeEnum["A_flat"] = "A_flat";
    KeySignatureTypeEnum["A"] = "A";
    KeySignatureTypeEnum["B_flat"] = "B_flat";
    KeySignatureTypeEnum["B"] = "B";
    KeySignatureTypeEnum["C_flat"] = "C_flat";
})(KeySignatureTypeEnum || (KeySignatureTypeEnum = {}));
// 拍号
export var TimeSignatureTypeEnum;
(function (TimeSignatureTypeEnum) {
    TimeSignatureTypeEnum["1_1"] = "1_1";
    TimeSignatureTypeEnum["1_4"] = "1_4";
    TimeSignatureTypeEnum["2_4"] = "2_4";
    TimeSignatureTypeEnum["3_4"] = "3_4";
    TimeSignatureTypeEnum["4_4"] = "4_4";
    TimeSignatureTypeEnum["3_8"] = "3_8";
    TimeSignatureTypeEnum["6_8"] = "6_8";
})(TimeSignatureTypeEnum || (TimeSignatureTypeEnum = {}));
// 跨小节符号类型
export var SpanSymbolTypeEnum;
(function (SpanSymbolTypeEnum) {
    SpanSymbolTypeEnum[SpanSymbolTypeEnum["DoubleNote"] = 1] = "DoubleNote";
    SpanSymbolTypeEnum[SpanSymbolTypeEnum["DoubleMeasure"] = 2] = "DoubleMeasure"; // 双小节型 如volta(反复房子符号) 通过起始，结束小节定位
})(SpanSymbolTypeEnum || (SpanSymbolTypeEnum = {}));
// 跨小节符号名称
export var SpanSymbolNameEnum;
(function (SpanSymbolNameEnum) {
    SpanSymbolNameEnum[SpanSymbolNameEnum["Volta"] = 1] = "Volta";
    SpanSymbolNameEnum[SpanSymbolNameEnum["slur"] = 2] = "slur";
})(SpanSymbolNameEnum || (SpanSymbolNameEnum = {}));
export var NoteSymbolTypeEnum;
(function (NoteSymbolTypeEnum) {
    NoteSymbolTypeEnum[NoteSymbolTypeEnum["Note"] = 1] = "Note";
    NoteSymbolTypeEnum[NoteSymbolTypeEnum["Rest"] = 2] = "Rest"; // 休止符
})(NoteSymbolTypeEnum || (NoteSymbolTypeEnum = {}));
/** 双音符附属型符号名称（如连音线 slur） */
export var DoubleNoteAffiliatedSymbolNameEnum;
(function (DoubleNoteAffiliatedSymbolNameEnum) {
    // 连音线/延音线
    DoubleNoteAffiliatedSymbolNameEnum[DoubleNoteAffiliatedSymbolNameEnum["slur"] = 0] = "slur";
    // ornaments
    DoubleNoteAffiliatedSymbolNameEnum["Trill_line"] = "trill_line";
    DoubleNoteAffiliatedSymbolNameEnum["Upprail_line"] = "upprail_line";
    DoubleNoteAffiliatedSymbolNameEnum["Downprail_line"] = "downprail_line";
    DoubleNoteAffiliatedSymbolNameEnum["Prallprall_line"] = "prallprall_line";
    // keyboard
    DoubleNoteAffiliatedSymbolNameEnum["Pedal_ped_asterisk"] = "pedal_ped_asterisk";
    DoubleNoteAffiliatedSymbolNameEnum["Pedal_ped_line"] = "pedal_ped_line";
    DoubleNoteAffiliatedSymbolNameEnum["Pedal_straight_hooks"] = "pedal_straight_hooks";
    DoubleNoteAffiliatedSymbolNameEnum["Pedal_angled_end_hook"] = "pedal_angled_end_hook";
    DoubleNoteAffiliatedSymbolNameEnum["Pedal_both_hooks_angled"] = "pedal_both_hooks_angled";
    DoubleNoteAffiliatedSymbolNameEnum["Pedaal_angled_start_hook"] = "pedal_angled_start_hook";
    // dynamics
    DoubleNoteAffiliatedSymbolNameEnum["Crescendo_line"] = "crescendo_line";
    DoubleNoteAffiliatedSymbolNameEnum["Diminuendo_line"] = "diminuendo_line";
    DoubleNoteAffiliatedSymbolNameEnum["Crescendo_hairpin"] = "crescendo_hairpin";
    DoubleNoteAffiliatedSymbolNameEnum["Diminuendo_hairpin"] = "diminuendo_hairpin";
    // pitch
    DoubleNoteAffiliatedSymbolNameEnum["8va_alta"] = "8va_alta";
    DoubleNoteAffiliatedSymbolNameEnum["8va_bassa"] = "8va_bassa";
    DoubleNoteAffiliatedSymbolNameEnum["15ma_alta"] = "15ma_alta";
    DoubleNoteAffiliatedSymbolNameEnum["15ma_bassa"] = "15ma_bassa";
    DoubleNoteAffiliatedSymbolNameEnum["22ma_alta"] = "22ma_alta";
    DoubleNoteAffiliatedSymbolNameEnum["22ma_bassa"] = "22ma_bassa";
})(DoubleNoteAffiliatedSymbolNameEnum || (DoubleNoteAffiliatedSymbolNameEnum = {}));
/** 双小节附属型符号名称（如反复小房子 volta） */
export var DoubleMeasureAffiliatedSymbolNameEnum;
(function (DoubleMeasureAffiliatedSymbolNameEnum) {
    DoubleMeasureAffiliatedSymbolNameEnum[DoubleMeasureAffiliatedSymbolNameEnum["volta"] = 0] = "volta";
})(DoubleMeasureAffiliatedSymbolNameEnum || (DoubleMeasureAffiliatedSymbolNameEnum = {}));
/** 单音符附属型符号名称 */
export var SingleNoteAffiliatedSymbolNameEnum;
(function (SingleNoteAffiliatedSymbolNameEnum) {
    // Articulations
    SingleNoteAffiliatedSymbolNameEnum["Accent_above"] = "acccent_above";
    SingleNoteAffiliatedSymbolNameEnum["Staccato_above"] = "staccato_above";
    SingleNoteAffiliatedSymbolNameEnum["Staccatissimo_above"] = "staccato_above";
    SingleNoteAffiliatedSymbolNameEnum["Tenuto_above"] = "tenuto_above";
    SingleNoteAffiliatedSymbolNameEnum["Loure_above"] = "loure_above";
    SingleNoteAffiliatedSymbolNameEnum["Marcato_above"] = "marcato_above";
    SingleNoteAffiliatedSymbolNameEnum["Accent_staccato_above"] = "accent_staccato_above";
    SingleNoteAffiliatedSymbolNameEnum["Marcato_staccato_above"] = "marcato_staccato_above";
    SingleNoteAffiliatedSymbolNameEnum["Marcato_tenuto_above"] = "marcato_tenuto_above";
    SingleNoteAffiliatedSymbolNameEnum["Staccatissimo_stroke_above"] = "staccatissimo_stroke_above";
    SingleNoteAffiliatedSymbolNameEnum["Staccatissimo_wedge_above"] = "staccatissimo_wedge_above";
    SingleNoteAffiliatedSymbolNameEnum["Stress_above"] = "stress_above";
    SingleNoteAffiliatedSymbolNameEnum["Tenuto_accent_above"] = "tenuto_accent_above";
    SingleNoteAffiliatedSymbolNameEnum["Unstress_above"] = "unstress_above";
    SingleNoteAffiliatedSymbolNameEnum["Open"] = "open";
    SingleNoteAffiliatedSymbolNameEnum["Muted"] = "muted";
    SingleNoteAffiliatedSymbolNameEnum["Harmonic"] = "harmonic";
    SingleNoteAffiliatedSymbolNameEnum["Up_bow"] = "up_bow";
    SingleNoteAffiliatedSymbolNameEnum["Down_bow"] = "down_bow";
    // ornaments
    SingleNoteAffiliatedSymbolNameEnum["Turn"] = "turn";
    SingleNoteAffiliatedSymbolNameEnum["InvertedTurn"] = "invertedTurn";
    SingleNoteAffiliatedSymbolNameEnum["Trill"] = "trill";
    SingleNoteAffiliatedSymbolNameEnum["ShortTrill"] = "shortTrill";
    SingleNoteAffiliatedSymbolNameEnum["Mordent"] = "mordent";
    // Arpeggios
    SingleNoteAffiliatedSymbolNameEnum["Arpeggio"] = "arpeggio";
    SingleNoteAffiliatedSymbolNameEnum["Up_arpeggio"] = "up_arpeggio";
    SingleNoteAffiliatedSymbolNameEnum["Down_arpeggio"] = "down_arpeggio";
    SingleNoteAffiliatedSymbolNameEnum["Bracket_arpeggio"] = "bracket_arpeggio";
    SingleNoteAffiliatedSymbolNameEnum["Up_arpeggio_straight"] = "up_arpeggio_straight";
    SingleNoteAffiliatedSymbolNameEnum["Down_arpeggio_straight"] = "down_arpeggio_straight";
    // glissandos TODO 这个暂时不做
    // dynamics 强弱记号
    SingleNoteAffiliatedSymbolNameEnum["PPP"] = "ppp";
    SingleNoteAffiliatedSymbolNameEnum["PP"] = "pp";
    SingleNoteAffiliatedSymbolNameEnum["P"] = "p";
    SingleNoteAffiliatedSymbolNameEnum["MP"] = "mp";
    SingleNoteAffiliatedSymbolNameEnum["MF"] = "mf";
    SingleNoteAffiliatedSymbolNameEnum["F"] = "f";
    SingleNoteAffiliatedSymbolNameEnum["FF"] = "ff";
    SingleNoteAffiliatedSymbolNameEnum["FFF"] = "fff";
    SingleNoteAffiliatedSymbolNameEnum["FP"] = "fp";
    SingleNoteAffiliatedSymbolNameEnum["PF"] = "pf";
    SingleNoteAffiliatedSymbolNameEnum["SF"] = "sf";
    SingleNoteAffiliatedSymbolNameEnum["SFZ"] = "sfz";
    SingleNoteAffiliatedSymbolNameEnum["SFF"] = "sff";
    SingleNoteAffiliatedSymbolNameEnum["SFFZ"] = "sffz";
    SingleNoteAffiliatedSymbolNameEnum["SFP"] = "sfp";
    SingleNoteAffiliatedSymbolNameEnum["RFZ"] = "rfz";
    SingleNoteAffiliatedSymbolNameEnum["RF"] = "rf";
    SingleNoteAffiliatedSymbolNameEnum["FZ"] = "fz";
})(SingleNoteAffiliatedSymbolNameEnum || (SingleNoteAffiliatedSymbolNameEnum = {}));
/** 单小节附属型符号名称 */
export var SingleMeasureAffiliatedSymbolNameEnum;
(function (SingleMeasureAffiliatedSymbolNameEnum) {
})(SingleMeasureAffiliatedSymbolNameEnum || (SingleMeasureAffiliatedSymbolNameEnum = {}));
/**
 *  反复符号枚举(不包含反复小节线和volta)
 */
// 出现在小节前方的反复符号
export var MeasureStartRepeatEnum;
(function (MeasureStartRepeatEnum) {
    MeasureStartRepeatEnum["Coda"] = "coda";
    MeasureStartRepeatEnum["Segno"] = "segno";
})(MeasureStartRepeatEnum || (MeasureStartRepeatEnum = {}));
// 出现在小节后方的反复符号
export var MeasureEndRepeatEnum;
(function (MeasureEndRepeatEnum) {
    MeasureEndRepeatEnum["To_coda"] = "to_coda";
    MeasureEndRepeatEnum["DC"] = "DC";
    MeasureEndRepeatEnum["DS"] = "DS";
    MeasureEndRepeatEnum["Fine"] = "fine";
    MeasureEndRepeatEnum["DC_al_fine"] = "dc_al_fine";
    MeasureEndRepeatEnum["DC_al_coda"] = "dc_al_coda";
    MeasureEndRepeatEnum["DS_al_fine"] = "ds_al_fine";
    MeasureEndRepeatEnum["DS_al_coda"] = "ds_al_coda";
})(MeasureEndRepeatEnum || (MeasureEndRepeatEnum = {}));
// 变音符号类型
export var AccidentalTypeEnum;
(function (AccidentalTypeEnum) {
    AccidentalTypeEnum["Sharp"] = "Sharp";
    AccidentalTypeEnum["Flat"] = "Flat";
    AccidentalTypeEnum["Double_sharp"] = "double_sharp";
    AccidentalTypeEnum["Double_flat"] = "double_flat";
    AccidentalTypeEnum["Natural"] = "natural";
})(AccidentalTypeEnum || (AccidentalTypeEnum = {}));
// 符杠类型
export var BeamTypeEnum;
(function (BeamTypeEnum) {
    BeamTypeEnum["None"] = "None";
    BeamTypeEnum["OnlyRight"] = "OnlyRight";
    BeamTypeEnum["Combined"] = "Combined";
})(BeamTypeEnum || (BeamTypeEnum = {}));
// 连谱号
export var BracketTypeEnum;
(function (BracketTypeEnum) {
    BracketTypeEnum["Bracket"] = "Bracket";
    BracketTypeEnum["Brace"] = "Brace";
    BracketTypeEnum["Square"] = "Square";
})(BracketTypeEnum || (BracketTypeEnum = {}));
