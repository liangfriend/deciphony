export var MsTypeNameEnum;
(function (MsTypeNameEnum) {
    MsTypeNameEnum[MsTypeNameEnum["MultipStaves"] = 1] = "MultipStaves";
    MsTypeNameEnum[MsTypeNameEnum["SingleStaff"] = 2] = "SingleStaff";
    MsTypeNameEnum[MsTypeNameEnum["Measure"] = 3] = "Measure";
    MsTypeNameEnum[MsTypeNameEnum["SpanSymbol"] = 4] = "SpanSymbol";
    MsTypeNameEnum[MsTypeNameEnum["MsSymbolContainer"] = 5] = "MsSymbolContainer";
    MsTypeNameEnum[MsTypeNameEnum["MsSymbol"] = 6] = "MsSymbol";
})(MsTypeNameEnum || (MsTypeNameEnum = {}));
// 五线谱位置：线 or 间
export var StaffPositionTypeEnum;
(function (StaffPositionTypeEnum) {
    StaffPositionTypeEnum["Line"] = "line";
    StaffPositionTypeEnum["Space"] = "space";
})(StaffPositionTypeEnum || (StaffPositionTypeEnum = {}));
// 区域：下方 / 本体 / 上方
export var StaffRegionEnum;
(function (StaffRegionEnum) {
    StaffRegionEnum["Lower"] = "lower";
    StaffRegionEnum["Main"] = "main";
    StaffRegionEnum["Upper"] = "upper";
})(StaffRegionEnum || (StaffRegionEnum = {}));
export var ClefEnum;
(function (ClefEnum) {
    ClefEnum[ClefEnum["Treble"] = 1] = "Treble";
    ClefEnum[ClefEnum["MezzoSoprano"] = 2] = "MezzoSoprano";
    ClefEnum[ClefEnum["Alto"] = 3] = "Alto";
    ClefEnum[ClefEnum["Tenor"] = 4] = "Tenor";
    ClefEnum[ClefEnum["BaritoneF"] = 5] = "BaritoneF";
    ClefEnum[ClefEnum["BaritoneC"] = 6] = "BaritoneC";
    ClefEnum[ClefEnum["Bass"] = 7] = "Bass";
    ClefEnum[ClefEnum["Subbass"] = 8] = "Subbass"; // 次低音谱号（F）
})(ClefEnum || (ClefEnum = {}));
export var KeySignatureEnum;
(function (KeySignatureEnum) {
    KeySignatureEnum["Cb"] = "Cb";
    KeySignatureEnum["Gb"] = "Gb";
    KeySignatureEnum["Db"] = "Db";
    KeySignatureEnum["Ab"] = "Ab";
    KeySignatureEnum["Eb"] = "Eb";
    KeySignatureEnum["Bb"] = "Bb";
    KeySignatureEnum["F"] = "F";
    KeySignatureEnum["C"] = "C";
    KeySignatureEnum["G"] = "G";
    KeySignatureEnum["D"] = "D";
    KeySignatureEnum["A"] = "A";
    KeySignatureEnum["E"] = "E";
    KeySignatureEnum["B"] = "B";
    KeySignatureEnum["F#"] = "F#";
    KeySignatureEnum["C#"] = "C#";
})(KeySignatureEnum || (KeySignatureEnum = {}));
// 唱名
export var SolmizationEnum;
(function (SolmizationEnum) {
    SolmizationEnum[SolmizationEnum["DO"] = 1] = "DO";
    SolmizationEnum[SolmizationEnum["RE"] = 2] = "RE";
    SolmizationEnum[SolmizationEnum["MI"] = 3] = "MI";
    SolmizationEnum[SolmizationEnum["FA"] = 4] = "FA";
    SolmizationEnum[SolmizationEnum["SOL"] = 5] = "SOL";
    SolmizationEnum[SolmizationEnum["LA"] = 6] = "LA";
    SolmizationEnum[SolmizationEnum["TI"] = 7] = "TI";
})(SolmizationEnum || (SolmizationEnum = {}));
// 基础音名 (A ~ G)
export var NoteLetterEnum;
(function (NoteLetterEnum) {
    NoteLetterEnum["C"] = "C";
    NoteLetterEnum["D"] = "D";
    NoteLetterEnum["E"] = "E";
    NoteLetterEnum["F"] = "F";
    NoteLetterEnum["G"] = "G";
    NoteLetterEnum["A"] = "A";
    NoteLetterEnum["B"] = "B";
})(NoteLetterEnum || (NoteLetterEnum = {}));
// 升降号（Accidental）
export var AccidentalEnum;
(function (AccidentalEnum) {
    AccidentalEnum["None"] = "";
    AccidentalEnum["Natural"] = "&";
    AccidentalEnum["Sharp"] = "#";
    AccidentalEnum["Flat"] = "b";
    AccidentalEnum["DoubleSharp"] = "##";
    AccidentalEnum["DoubleFlat"] = "bb";
})(AccidentalEnum || (AccidentalEnum = {}));
// 附点类型
export var DotEnum;
(function (DotEnum) {
    DotEnum["None"] = "";
    DotEnum["Single"] = ".";
    DotEnum["Double"] = "..";
    DotEnum["Triple"] = "...";
})(DotEnum || (DotEnum = {}));
// 时值
export var ChronaxieEnum;
(function (ChronaxieEnum) {
    ChronaxieEnum[ChronaxieEnum["whole"] = 1] = "whole";
    ChronaxieEnum[ChronaxieEnum["half"] = 2] = "half";
    ChronaxieEnum[ChronaxieEnum["quarter"] = 4] = "quarter";
    ChronaxieEnum[ChronaxieEnum["eighth"] = 8] = "eighth";
    ChronaxieEnum[ChronaxieEnum["sixteenth"] = 16] = "sixteenth";
    ChronaxieEnum[ChronaxieEnum["thirtySecond"] = 32] = "thirtySecond";
    ChronaxieEnum[ChronaxieEnum["sixtyFourth"] = 64] = "sixtyFourth";
})(ChronaxieEnum || (ChronaxieEnum = {}));
// 符号类型
export var MsSymbolTypeEnum;
(function (MsSymbolTypeEnum) {
    MsSymbolTypeEnum["NoteHead"] = "noteHead";
    MsSymbolTypeEnum["NoteStem"] = "noteStem";
    MsSymbolTypeEnum["NoteTail"] = "noteTail";
    MsSymbolTypeEnum["NoteNumber"] = "noteNumber";
    MsSymbolTypeEnum["ChronaxieReducingLine"] = "chronaxieReducingLine";
    MsSymbolTypeEnum["ChronaxieIncreasingLine"] = "chronaxieIncreasingLine";
    MsSymbolTypeEnum["NoteDot"] = "noteDot";
    MsSymbolTypeEnum["Rest"] = "rest";
    MsSymbolTypeEnum["Slur"] = "slur";
    MsSymbolTypeEnum["Tie"] = "tie";
    MsSymbolTypeEnum["DurationDot"] = "durationDot";
    MsSymbolTypeEnum["Accidental"] = "accidental";
    MsSymbolTypeEnum["Tuplet"] = "tuplet";
    MsSymbolTypeEnum["Clef"] = "clef";
    MsSymbolTypeEnum["Clef_f"] = "clef_f";
    MsSymbolTypeEnum["KeySignature"] = "keySignature";
    MsSymbolTypeEnum["TimeSignature"] = "timeSignature";
    MsSymbolTypeEnum["BarLine"] = "barLine";
    MsSymbolTypeEnum["BarLine_f"] = "barLine_f";
})(MsSymbolTypeEnum || (MsSymbolTypeEnum = {}));
// 曲谱展示模式
export var MusicScoreShowModeEnum;
(function (MusicScoreShowModeEnum) {
    MusicScoreShowModeEnum[MusicScoreShowModeEnum["standardStaff"] = 1] = "standardStaff";
    MusicScoreShowModeEnum[MusicScoreShowModeEnum["numberNotation"] = 2] = "numberNotation";
    MusicScoreShowModeEnum[MusicScoreShowModeEnum["rhythmNotation"] = 3] = "rhythmNotation";
    MusicScoreShowModeEnum[MusicScoreShowModeEnum["percussion"] = 4] = "percussion";
})(MusicScoreShowModeEnum || (MusicScoreShowModeEnum = {}));
// 符号类型
export var MsSymbolCategoryEnum;
(function (MsSymbolCategoryEnum) {
    MsSymbolCategoryEnum[MsSymbolCategoryEnum["singleMeasure"] = 1] = "singleMeasure";
    MsSymbolCategoryEnum[MsSymbolCategoryEnum["multipleMeasure"] = 2] = "multipleMeasure";
})(MsSymbolCategoryEnum || (MsSymbolCategoryEnum = {}));
// 跨小节符号类型
export var SpanSymbolTypeEnum;
(function (SpanSymbolTypeEnum) {
    SpanSymbolTypeEnum[SpanSymbolTypeEnum["volta"] = 1] = "volta";
    SpanSymbolTypeEnum[SpanSymbolTypeEnum["slur"] = 2] = "slur";
    SpanSymbolTypeEnum[SpanSymbolTypeEnum["tie"] = 3] = "tie";
})(SpanSymbolTypeEnum || (SpanSymbolTypeEnum = {}));
// 跨小节符号跟随类型
export var SpanSymbolFollowingCategoryEnum;
(function (SpanSymbolFollowingCategoryEnum) {
    SpanSymbolFollowingCategoryEnum[SpanSymbolFollowingCategoryEnum["msSymbol"] = 1] = "msSymbol";
    SpanSymbolFollowingCategoryEnum[SpanSymbolFollowingCategoryEnum["measure"] = 2] = "measure";
    SpanSymbolFollowingCategoryEnum[SpanSymbolFollowingCategoryEnum["singleStaff"] = 3] = "singleStaff";
    SpanSymbolFollowingCategoryEnum[SpanSymbolFollowingCategoryEnum["multipleStaves"] = 4] = "multipleStaves";
})(SpanSymbolFollowingCategoryEnum || (SpanSymbolFollowingCategoryEnum = {}));
// 符号容器类型
export var MsSymbolContainerTypeEnum;
(function (MsSymbolContainerTypeEnum) {
    MsSymbolContainerTypeEnum[MsSymbolContainerTypeEnum["frontFixed"] = 1] = "frontFixed";
    MsSymbolContainerTypeEnum[MsSymbolContainerTypeEnum["rearFixed"] = 2] = "rearFixed";
    MsSymbolContainerTypeEnum[MsSymbolContainerTypeEnum["variable"] = 3] = "variable";
    MsSymbolContainerTypeEnum[MsSymbolContainerTypeEnum["span"] = 4] = "span";
})(MsSymbolContainerTypeEnum || (MsSymbolContainerTypeEnum = {}));
// 小节线类型
export var BarLineTypeEnum;
(function (BarLineTypeEnum) {
    BarLineTypeEnum[BarLineTypeEnum["single"] = 1] = "single";
    BarLineTypeEnum[BarLineTypeEnum["final"] = 2] = "final";
    BarLineTypeEnum[BarLineTypeEnum["reverseFinal"] = 3] = "reverseFinal";
    BarLineTypeEnum[BarLineTypeEnum["startRepeatSign"] = 4] = "startRepeatSign";
    BarLineTypeEnum[BarLineTypeEnum["endRepeatSign"] = 5] = "endRepeatSign";
})(BarLineTypeEnum || (BarLineTypeEnum = {}));
// ----------------------------------------- 非乐谱类型
export var OrderTypeEnum;
(function (OrderTypeEnum) {
    OrderTypeEnum[OrderTypeEnum["highlight"] = 1] = "highlight";
})(OrderTypeEnum || (OrderTypeEnum = {}));
// 编辑器模式
export var MsMode;
(function (MsMode) {
    MsMode[MsMode["normal"] = 1] = "normal";
    MsMode[MsMode["edit"] = 2] = "edit";
})(MsMode || (MsMode = {}));
// 预备符号类型
export var ReserveMsSymbolType;
(function (ReserveMsSymbolType) {
    ReserveMsSymbolType[ReserveMsSymbolType["note"] = 1] = "note";
    ReserveMsSymbolType[ReserveMsSymbolType["rest"] = 2] = "rest"; // 休止符
})(ReserveMsSymbolType || (ReserveMsSymbolType = {}));
// 连音组类型
export var BeamTypeEnum;
(function (BeamTypeEnum) {
    BeamTypeEnum[BeamTypeEnum["left"] = 1] = "left";
})(BeamTypeEnum || (BeamTypeEnum = {}));
