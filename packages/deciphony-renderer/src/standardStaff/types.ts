import {MusicScoreTypeEnum} from "@/enum";
import {
    AffiliatedSymbolNameEnum,
    NoteSymbolTypeEnum,
    SpanSymbolNameEnum,
    SpanSymbolTypeEnum
} from "@/standardStaff/enum";

export type MusicScore = {
    type: MusicScoreTypeEnum,
    grandStaffs: GrandStaff[],
    spanSymbols: SpanSymbol[]
}
export type GrandStaff = {
    staves: SingleStaff[]
}

export type SingleStaff = {
    measures: Measure[], // 小节

}

export type Measure = {
    notes: NoteSymbol[] // 音符，休止符
}
// 音乐符号
export type NoteSymbol = {
    type: NoteSymbolTypeEnum
    affiliatedSymbols: AffiliatedSymbol[]
    region: number // 在五线谱上的位置，0就是第一间的位置，1是第二线的位置
}
// 音符附属型符号 accent above, accidental等等， 符干符尾不属于附属型符号，它是根据音符时值信息固定逻辑判断是否存在的符号
export type AffiliatedSymbol = {
    name: AffiliatedSymbolNameEnum
}


// 跨小节符号
export type SpanSymbol = {
    type: SpanSymbolTypeEnum
    name: SpanSymbolNameEnum
}