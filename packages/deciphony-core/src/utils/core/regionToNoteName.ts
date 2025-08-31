import {NoteName, StaffRegion} from "../../types";
import {AccidentalEnum, ClefEnum, NoteLetterEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";

interface StaffMapItem {
    region: StaffRegionEnum;
    type: StaffPositionTypeEnum;
    index: number;
    note: NoteLetterEnum;
    octave: number;
}

// 高音谱号
const TREBLE_MAP: StaffMapItem[] = [
    // 下方区域
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.E, octave: 3},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.F, octave: 3},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.G, octave: 3},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.A, octave: 3},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 3, note: NoteLetterEnum.B, octave: 3},

    // 本体区域（Main）
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.C, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.D, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.E, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.F, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 3, note: NoteLetterEnum.G, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 3, note: NoteLetterEnum.A, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 4, note: NoteLetterEnum.B, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 4, note: NoteLetterEnum.C, octave: 5},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 5, note: NoteLetterEnum.D, octave: 5},

    // 上方区域
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.E, octave: 5},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.F, octave: 5},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.G, octave: 5},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.A, octave: 5},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 3, note: NoteLetterEnum.B, octave: 5},
];


// 次女高音谱号 (MezzoSoprano) 与高音谱号类似，偏低1线
const MEZZO_MAP = TREBLE_MAP.map(item => ({
    ...item,
    octave: item.octave - 1
}));

// 中音谱号 (Alto)
const ALTO_MAP: StaffMapItem[] = [
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.G, octave: 2},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.A, octave: 2},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.B, octave: 2},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.C, octave: 3},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 3, note: NoteLetterEnum.D, octave: 3},

    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.C, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.D, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.E, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.F, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 3, note: NoteLetterEnum.G, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 3, note: NoteLetterEnum.A, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 4, note: NoteLetterEnum.B, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 4, note: NoteLetterEnum.C, octave: 4},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 5, note: NoteLetterEnum.D, octave: 4},

    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.E, octave: 4},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.F, octave: 4},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.G, octave: 4},
];

// 次男高音谱号 (Tenor) = 中音谱号上移一个八度
const TENOR_MAP = ALTO_MAP.map(item => ({
    ...item,
    octave: item.octave + 1
}));

// 男中音C谱号
const BARITONE_C_MAP = ALTO_MAP.map(item => ({
    ...item,
    octave: item.octave
}));

// 男中音F谱号
const BARITONE_F_MAP: StaffMapItem[] = [
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.C, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.E, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 3, note: NoteLetterEnum.G, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 4, note: NoteLetterEnum.B, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 5, note: NoteLetterEnum.D, octave: 4},
];

// 低音谱号
const BASS_MAP: StaffMapItem[] = [
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.E, octave: 1},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.F, octave: 1},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.G, octave: 1},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.A, octave: 1},
    {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 3, note: NoteLetterEnum.B, octave: 1},

    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.G, octave: 2},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.A, octave: 2},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.B, octave: 2},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.C, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 3, note: NoteLetterEnum.D, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 3, note: NoteLetterEnum.E, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 4, note: NoteLetterEnum.F, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 4, note: NoteLetterEnum.G, octave: 3},
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 5, note: NoteLetterEnum.A, octave: 3},

    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 1, note: NoteLetterEnum.B, octave: 3},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Line, index: 1, note: NoteLetterEnum.C, octave: 4},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 2, note: NoteLetterEnum.D, octave: 4},
    {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Line, index: 2, note: NoteLetterEnum.E, octave: 4},
];

// 次低音谱号 = 低音谱号下降一八度
const SUBBASS_MAP = BASS_MAP.map(item => ({...item, octave: item.octave - 1}));

// 汇总所有谱号映射
const CLEF_MAP: Record<ClefEnum, StaffMapItem[]> = {
    [ClefEnum.Treble]: TREBLE_MAP,
    [ClefEnum.MezzoSoprano]: MEZZO_MAP,
    [ClefEnum.Alto]: ALTO_MAP,
    [ClefEnum.Tenor]: TENOR_MAP,
    [ClefEnum.BaritoneC]: BARITONE_C_MAP,
    [ClefEnum.BaritoneF]: BARITONE_F_MAP,
    [ClefEnum.Bass]: BASS_MAP,
    [ClefEnum.Subbass]: SUBBASS_MAP,
};

// 通用转换函数
export function RegionToNoteName(region: StaffRegion, accidental: AccidentalEnum, clef: ClefEnum): NoteName {
    const map = CLEF_MAP[clef];
    if (!map) throw new Error(`谱号 ${clef} 暂未支持`);

    const found = map.find(m => m.region === region.region && m.type === region.type && m.index === region.index);
    if (!found) {
        throw new Error(`未找到对应音符: region=${region.region}, type=${region.type}, index=${region.index}`);
    }

    return {
        letter: found.note,
        octave: found.octave,
        accidental
    };
}

export default RegionToNoteName

export function testRegionToNoteName() {
    const testCases = [
        {
            clef: ClefEnum.Treble,
            region: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1},
            accidental: AccidentalEnum.Natural
        },
        {
            clef: ClefEnum.Treble,
            region: {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Space, index: 2},
            accidental: AccidentalEnum.Sharp
        },
        {
            clef: ClefEnum.Bass,
            region: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 3},
            accidental: AccidentalEnum.Flat
        },
        {
            clef: ClefEnum.Alto,
            region: {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Space, index: 2},
            accidental: AccidentalEnum.DoubleSharp
        },
        {
            clef: ClefEnum.Subbass,
            region: {region: StaffRegionEnum.Upper, type: StaffPositionTypeEnum.Line, index: 1},
            accidental: AccidentalEnum.DoubleFlat
        }
    ];

    console.log("=== RegionToNoteName 测试 ===");
    for (const tc of testCases) {
        try {
            const note = RegionToNoteName(tc.region, tc.accidental, tc.clef);
            console.log(`谱号: ${ClefEnum[tc.clef]}, 区域: ${tc.region.region}, ${tc.region.type} ${tc.region.index}, 变音: ${tc.accidental} => 音符: ${note.letter}${note.accidental}${note.octave}`);
        } catch (err) {
            console.error("错误:", err);
        }
    }
}

// 调用测试
// testRegionToNoteName();