export enum MsTypeNameEnum {
    MultipStaves = 1,
    SingleStaff,
    Measure,
    SpanSymbol,
    MsSymbolContainer,
    MsSymbol,

}

export enum MusicScoreRegionEnum {
    // 下方区域
    lower_line_18 = 1,
    lower_space_18,
    lower_line_17,
    lower_space_17,
    lower_line_16,
    lower_space_16,
    lower_line_15,
    lower_space_15,
    lower_line_14,
    lower_space_14,
    lower_line_13,
    lower_space_13,
    lower_line_12,
    lower_space_12,
    lower_line_11,
    lower_space_11,
    lower_line_10,
    lower_space_10,
    lower_line_9,
    lower_space_9,
    lower_line_8,
    lower_space_8,
    lower_line_7,
    lower_space_7,
    lower_line_6,
    lower_space_6,
    lower_line_5,
    lower_space_5,
    lower_line_4,
    lower_space_4,
    lower_line_3,
    lower_space_3,
    lower_line_2,
    lower_space_2,
    lower_line_1,
    lower_space_1,

    // 五线谱本体
    line_1,
    space_1,
    line_2,
    space_2,
    line_3,
    space_3,
    line_4,
    space_4,
    line_5,

    // 上方区域
    upper_space_1,
    upper_line_1,
    upper_space_2,
    upper_line_2,
    upper_space_3,
    upper_line_3,
    upper_space_4,
    upper_line_4,
    upper_space_5,
    upper_line_5,
    upper_space_6,
    upper_line_6,
    upper_space_7,
    upper_line_7,
    upper_space_8,
    upper_line_8,
    upper_space_9,
    upper_line_9,
    upper_space_10,
    upper_line_10,
    upper_space_11,
    upper_line_11,
    upper_space_12,
    upper_line_12,
    upper_space_13,
    upper_line_13,
    upper_space_14,
    upper_line_14,
    upper_space_15,
    upper_line_15,
    upper_space_16,
    upper_line_16,
}

export enum ClefEnum {
    treble = 1,       // 高音谱号（G）
    mezzoSoprano, // 次女高音谱号（C）
    alto,         // 中音谱号（C）
    tenor,        // 次男高音谱号（C）
    baritoneF,    // 男中音F谱号（F）
    baritoneC,    // 男中音C谱号（C）
    bass,         // 低音谱号（F）
    subbass       // 次低音谱号（F）
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

export enum ScaleDegreeEnum {
    1 = 1,
    2 = 2,
    3 = 3,
    4 = 4,
    5 = 5,
    6 = 6,
    7 = 7,
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
    Natural = "",   // 还原
    Sharp = "#",    // 升
    Flat = "b",     // 降
    DoubleSharp = "##", // 重升
    DoubleFlat = "bb",  // 重降
}

// 八度数（可以用 number，而不是枚举）
export type Octave = number

// 组合成音名 (NoteName)
export interface NoteName {
    letter: NoteLetterEnum
    accidental: AccidentalEnum
    octave: Octave
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
    noteHead = 'noteHead', // 线谱指音符头， 简谱指音符
    noteBar = 'noteBar',
    noteTail = 'noteTail',
    rest = 'rest',
    slur = 'slur', // 圆滑线  不同音高
    tie = 'tie',  // 延音线  延音线只能连接两个音
    durationDot = 'durationDot', // 附点
    accidental = 'accidental',
    tuplet = 'tuplet', // 连音符
    clef = 'clef',
    clef_f = 'clef_f', // 前置谱号
    keySignature = 'keySignature',  //
    timeSignature = 'timeSignature',
    barLine = 'barLine', // 小节线
    barLine_f = 'barLine_f',
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