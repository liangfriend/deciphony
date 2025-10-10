export enum MsTypeNameEnum {
    MultipStaves = 1,
    SingleStaff,
    Measure,
    SpanSymbol,
    MsSymbolContainer,
    MsSymbol,

}

// 五线谱位置：线 or 间
export enum StaffPositionTypeEnum {
    Line = "line",
    Space = "space",
}

// 区域：下方 / 本体 / 上方
export enum StaffRegionEnum {
    Lower = "lower",
    Main = "main",
    Upper = "upper",
}


export enum ClefEnum {
    Treble = 1,       // 高音谱号（G）
    MezzoSoprano, // 次女高音谱号（C）
    Alto,         // 中音谱号（C）
    Tenor,        // 次男高音谱号（C）
    BaritoneF,    // 男中音F谱号（F）
    BaritoneC,    // 男中音C谱号（C）
    Bass,         // 低音谱号（F）
    Subbass       // 次低音谱号（F）
}

export enum KeySignatureEnum {
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

// 唱名
export enum SolmizationEnum {
    "DO" = 1,
    "RE" = 2,
    "MI" = 3,
    "FA" = 4,
    "SOL" = 5,
    "LA" = 6,
    "TI" = 7,
}

// 基础音名 (A ~ G)
export enum NoteLetterEnum {
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G",
    A = "A",
    B = "B",
}

// 升降号（Accidental）
export enum AccidentalEnum {
    None = "",
    Natural = "&",   // 还原
    Sharp = "#",    // 升
    Flat = "b",     // 降
    DoubleSharp = "##", // 重升
    DoubleFlat = "bb",  // 重降
}


// 附点类型
export enum DotEnum {
    None = '',
    'Single' = '.',
    'Double' = '..',
    'Triple' = '...'
}

// 时值
export enum ChronaxieEnum {
    whole = 1,
    half = 2,
    quarter = 4,
    eighth = 8,
    sixteenth = 16,
    thirtySecond = 32,
    sixtyFourth = 64,
}


// 符号类型
export enum MsSymbolTypeEnum {
    NoteHead = 'noteHead', // 线谱指音符头， 简谱指音符
    NoteStem = 'noteStem',
    NoteTail = 'noteTail',
    NoteNumber = 'noteNumber', // 简谱的数字符号
    ChronaxieReducingLine = 'chronaxieReducingLine', // 简谱的时值线
    ChronaxieIncreasingLine = 'chronaxieIncreasingLine', // 简谱的增时线
    NoteDot = 'noteDot', // 八度点
    Rest = 'rest', // 休止符
    Slur = 'slur', // 圆滑线  不同音高
    Tie = 'tie',  // 延音线  延音线只能连接两个音
    DurationDot = 'durationDot', // 附点
    Accidental = 'accidental',
    Tuplet = 'tuplet', // 连音符
    Clef = 'clef',
    Clef_f = 'clef_f', // 前置谱号
    KeySignature = 'keySignature',  //
    TimeSignature = 'timeSignature',
    BarLine = 'barLine', // 小节线
    BarLine_f = 'barLine_f',
}

// 曲谱展示模式
export enum MusicScoreShowModeEnum {
    standardStaff = 1,        // 五线谱
    numberNotation,      // 简谱（数字谱）
    rhythmNotation,      // 节奏谱（主要显示节奏）
    percussion,          //  打击乐谱（可选）
}

// 符号类型
export enum MsSymbolCategoryEnum {
    singleMeasure = 1, //单小节类型
    multipleMeasure, // 跨小节类型
}

// 跨小节符号类型
export enum SpanSymbolTypeEnum {
    volta = 1,
    slur,
    tie,

}

// 跨小节符号跟随类型
export enum SpanSymbolFollowingCategoryEnum {
    msSymbol = 1,
    measure,
    singleStaff,
    multipleStaves,
}

// 符号容器类型
export enum MsSymbolContainerTypeEnum {
    frontFixed = 1, // 前置定宽
    rearFixed, // 后置定宽

    variable, // 变宽
    span, // 跨小节符号容器，不影响小节宽度
}

// 小节线类型
export enum BarLineTypeEnum {
    single = 1,
    final,
    reverseFinal, // 前置结束小节线
    startRepeatSign,
    endRepeatSign,
}

// ----------------------------------------- 非乐谱类型
export enum OrderTypeEnum {
    highlight = 1
}

// 编辑器模式
export enum MsMode {
    normal = 1,
    edit,
}

// 预备符号类型
export enum ReserveMsSymbolType {
    note = 1,// 音符头
    rest // 休止符
}

// 连音组类型
export enum BeamTypeEnum {
    left = 1
}