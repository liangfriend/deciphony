export enum NoteSymbolTypeEnum {
    Note = 1, // 音符
    Rest // 休止符
}

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

// 附属型符号名称
export enum AffiliatedSymbolNameEnum {

}