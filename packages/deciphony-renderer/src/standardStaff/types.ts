import {MusicScoreTypeEnum} from "@/enum";
import {
    AffiliatedSymbolNameEnum,
    NoteSymbolTypeEnum,
    SpanSymbolNameEnum,
    SpanSymbolTypeEnum
} from "@/standardStaff/enum";

type MusicScore = {
    type: MusicScoreTypeEnum,
    multipleStaves: MultipleStaves[],
    spanSymbol: SpanSymbol[]
}
type MultipleStaves = {}

type SingleStaff = {
    measures: Measure[], // 小节

}

type Measure = {
    note: NoteSymbol[] // 音符，休止符
}
// 音乐符号
type NoteSymbol = {
    type: NoteSymbolTypeEnum
    affiliatedSymbols: AffiliatedSymbol[]
}
// 音符附属型符号 accent above, accidental等等， 符干符尾不属于附属型符号，它是根据音符时值信息固定逻辑判断是否存在的符号
type AffiliatedSymbol = {
    name: AffiliatedSymbolNameEnum
}


// 跨小节符号
type SpanSymbol = {
    type: SpanSymbolTypeEnum
    name: SpanSymbolNameEnum
}