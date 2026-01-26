import {MusicScoreTypeEnum} from "@/enum";

type MusicScore = {
    type: MusicScoreTypeEnum,
    multipleStaves: MultipleStaves[]
}
type MultipleStaves = {}

type SingleStaff = {
    measures: Measure[], // 小节

}

type Measure = {
    note: [] // 音符，休止符

}
// 音乐符号
type MsSymbol = {}
// 附属型符号  符干，符尾，
type AffiliatedSymbol = {}