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
// 双音符，双小节附属型符号名称
export var DoubleAffiliatedSymbolNameEnum;
(function (DoubleAffiliatedSymbolNameEnum) {
    DoubleAffiliatedSymbolNameEnum[DoubleAffiliatedSymbolNameEnum["slur"] = 0] = "slur";
    DoubleAffiliatedSymbolNameEnum[DoubleAffiliatedSymbolNameEnum["volta"] = 1] = "volta"; // 反复小房子
})(DoubleAffiliatedSymbolNameEnum || (DoubleAffiliatedSymbolNameEnum = {}));
// 单音符，单小节附属型符号名称
export var SingleAffiliatedSymbolNameEnum;
(function (SingleAffiliatedSymbolNameEnum) {
    SingleAffiliatedSymbolNameEnum[SingleAffiliatedSymbolNameEnum["slur"] = 0] = "slur";
    SingleAffiliatedSymbolNameEnum[SingleAffiliatedSymbolNameEnum["volta"] = 1] = "volta"; // 反复小房子
})(SingleAffiliatedSymbolNameEnum || (SingleAffiliatedSymbolNameEnum = {}));
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
