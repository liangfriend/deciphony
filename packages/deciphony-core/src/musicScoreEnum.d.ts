export declare enum MsTypeNameEnum {
    MultipStaves = 1,
    SingleStaff = 2,
    Measure = 3,
    SpanSymbol = 4,
    MsSymbolContainer = 5,
    MsSymbol = 6
}
export declare enum StaffPositionTypeEnum {
    Line = "line",
    Space = "space"
}
export declare enum StaffRegionEnum {
    Lower = "lower",
    Main = "main",
    Upper = "upper"
}
export declare enum ClefEnum {
    Treble = 1,// 高音谱号（G）
    MezzoSoprano = 2,// 次女高音谱号（C）
    Alto = 3,// 中音谱号（C）
    Tenor = 4,// 次男高音谱号（C）
    BaritoneF = 5,// 男中音F谱号（F）
    BaritoneC = 6,// 男中音C谱号（C）
    Bass = 7,// 低音谱号（F）
    Subbass = 8
}
export declare enum KeySignatureEnum {
    Cb = "Cb",
    Gb = "Gb",
    Db = "Db",
    Ab = "Ab",
    Eb = "Eb",
    Bb = "Bb",
    F = "F",
    C = "C",
    G = "G",
    D = "D",
    A = "A",
    E = "E",
    B = "B",
    'F#' = "F#",
    'C#' = "C#"
}
export declare enum SolmizationEnum {
    "DO" = 1,
    "RE" = 2,
    "MI" = 3,
    "FA" = 4,
    "SOL" = 5,
    "LA" = 6,
    "TI" = 7
}
export declare enum NoteLetterEnum {
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G",
    A = "A",
    B = "B"
}
export declare enum AccidentalEnum {
    None = "",
    Natural = "&",// 还原
    Sharp = "#",// 升
    Flat = "b",// 降
    DoubleSharp = "##",// 重升
    DoubleFlat = "bb"
}
export declare enum DotEnum {
    None = "",
    'Single' = ".",
    'Double' = "..",
    'Triple' = "..."
}
export declare enum ChronaxieEnum {
    whole = 1,
    half = 2,
    quarter = 4,
    eighth = 8,
    sixteenth = 16,
    thirtySecond = 32,
    sixtyFourth = 64,
    oneTwentyEighth = 128,
    twoFiftySixth = 256
}
export declare enum MsSymbolTypeEnum {
    NoteHead = "noteHead",// 线谱指音符头， 简谱指音符
    NoteStem = "noteStem",
    NoteTail = "noteTail",
    NoteNumber = "noteNumber",// 简谱的数字符号
    ChronaxieReducingLine = "chronaxieReducingLine",// 简谱的时值线
    ChronaxieIncreasingLine = "chronaxieIncreasingLine",// 简谱的增时线
    NoteDot = "noteDot",// 八度点
    Rest = "rest",// 休止符
    Slur = "slur",// 圆滑线  不同音高
    Tie = "tie",// 延音线  延音线只能连接两个音
    DurationDot = "durationDot",// 附点
    Accidental = "accidental",
    Tuplet = "tuplet",// 连音符
    Clef = "clef",
    Clef_f = "clef_f",// 前置谱号
    KeySignature = "keySignature",//
    TimeSignature = "timeSignature",
    BarLine = "barLine",// 小节线
    BarLine_f = "barLine_f"
}
export declare enum MusicScoreShowModeEnum {
    standardStaff = 1,// 五线谱
    numberNotation = 2,// 简谱（数字谱）
    rhythmNotation = 3,// 节奏谱（主要显示节奏）
    percussion = 4
}
export declare enum MsSymbolCategoryEnum {
    singleMeasure = 1,//单小节类型
    multipleMeasure = 2
}
export declare enum SpanSymbolTypeEnum {
    volta = 1,
    slur = 2,
    tie = 3
}
export declare enum SpanSymbolFollowingCategoryEnum {
    msSymbol = 1,
    measure = 2,
    singleStaff = 3,
    multipleStaves = 4
}
export declare enum MsSymbolContainerTypeEnum {
    frontFixed = 1,// 前置定宽
    rearFixed = 2,// 后置定宽
    variable = 3,// 变宽
    span = 4
}
export declare enum BarLineTypeEnum {
    single = 1,
    final = 2,
    reverseFinal = 3,// 前置结束小节线
    startRepeatSign = 4,
    endRepeatSign = 5
}
export declare enum OrderTypeEnum {
    highlight = 1
}
export declare enum MsMode {
    normal = 1,
    edit = 2
}
export declare enum ReserveMsSymbolType {
    note = 1,// 音符头
    rest = 2
}
export declare enum BeamTypeEnum {
    left = 1
}
