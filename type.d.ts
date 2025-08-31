import {AccidentalEnum, ClefEnum, KeySignatureEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";
import {StaffRegion} from "../../types";

const sharpOrder = ["F", "C", "G", "D", "A", "E", "B"];
const flatOrder = ["B", "E", "A", "D", "G", "C", "F"];

const keySigCountMap: Record<KeySignatureEnum, number> = {
    Cb: -7, Gb: -6, Db: -5, Ab: -4, Eb: -3, Bb: -2, F: -1,
    C: 0,
    G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7
};





export

// 调号对应升降音位置
const keySignatureAccidentalMap: Record<KeySignatureEnum, { sharp: string[], flat: string[] }> = {
    C: {sharp: [], flat: []},
    G: {sharp: ["F"], flat: []},
    D: {sharp: ["F", "C"], flat: []},
    A: {sharp: ["F", "C", "G"], flat: []},
    E: {sharp: ["F", "C", "G", "D"], flat: []},
    B: {sharp: ["F", "C", "G", "D", "A"], flat: []},
    'F#': {sharp: ["F", "C", "G", "D", "A", "E"], flat: []},
    'C#': {sharp: ["F", "C", "G", "D", "A", "E", "B"], flat: []},

    F: {sharp: [], flat: ["B"]},
    Bb: {sharp: [], flat: ["B", "E"]},
    Eb: {sharp: [], flat: ["B", "E", "A"]},
    Ab: {sharp: [], flat: ["B", "E", "A", "D"]},
    Db: {sharp: [], flat: ["B", "E", "A", "D", "G"]},
    Gb: {sharp: [], flat: ["B", "E", "A", "D", "G", "C"]},
    Cb: {sharp: [], flat: ["B", "E", "A", "D", "G", "C", "F"]},
};

// 五线谱位置对应音名（高音谱号示例）
// 这里只写了高音谱号 main 区域，其他谱号/区域可扩展
const trebleStaffPositionToNote: Record<string, string> = {
    "main_line_1": "E",
    "main_space_1": "F",
    "main_line_2": "G",
    "main_space_2": "A",
    "main_line_3": "B",
    "main_space_3": "C",
    "main_line_4": "D",
    "main_space_4": "E",
    "main_line_5": "F",
};

function getNoteNameFromStaff(pos: StaffRegion, clef: ClefEnum): string {
    if (clef === ClefEnum.Treble) {
        const key = `${pos.region}_${pos.type}_${pos.index}`;
        return trebleStaffPositionToNote[key] || "C"; // 默认C
    }
    // TODO: 其他谱号转换规则
    return "C";
}

export function getAccidentalForStaffPosition(
    key: KeySignatureEnum,
    pos: StaffRegion,
    clef: ClefEnum
): AccidentalEnum {
    const note = getNoteNameFromStaff(pos, clef);

    const sharps = keySignatureAccidentalMap[key].sharp;
    const flats = keySignatureAccidentalMap[key].flat;

    if (sharps.includes(note)) return AccidentalEnum.Sharp;
    if (flats.includes(note)) return AccidentalEnum.Flat;
    return AccidentalEnum.Natural;
}

// 测试用例
const tests: { key: KeySignatureEnum, pos: StaffRegion, clef: ClefEnum, expected: AccidentalEnum }[] = [
    // 高音谱号，C大调（没有升降号）
    {
        key: KeySignatureEnum.C,
        pos: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1},
        clef: ClefEnum.Treble,
        expected: AccidentalEnum.Natural
    }, // E
    {
        key: KeySignatureEnum.C,
        pos: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 3},
        clef: ClefEnum.Treble,
        expected: AccidentalEnum.Natural
    }, // C

    // 高音谱号，G大调（F#）
    {
        key: KeySignatureEnum.G,
        pos: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 4},
        clef: ClefEnum.Treble,
        expected: AccidentalEnum.Sharp
    }, // E -> 没有升降？ E 在 high treble space4 = E, G大调只有 F#
    {
        key: KeySignatureEnum.G,
        pos: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 1},
        clef: ClefEnum.Treble,
        expected: AccidentalEnum.Natural
    }, // F -> F#? 注意映射表需要对应

    // 高音谱号，F大调（Bb）
    {
        key: KeySignatureEnum.F,
        pos: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 3},
        clef: ClefEnum.Treble,
        expected: AccidentalEnum.Flat
    }, // B -> Bb

    // 高音谱号，D大调（F#, C#）
    {
        key: KeySignatureEnum.D,
        pos: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1},
        clef: ClefEnum.Treble,
        expected: AccidentalEnum.Natural
    }, // E -> E
    {
        key: KeySignatureEnum.D,
        pos: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 1},
        clef: ClefEnum.Treble,
        expected: AccidentalEnum.Sharp
    }, // F -> F#
];

// 执行测试
tests.forEach((t, i) => {
    const result = getAccidentalForStaffPosition(t.key, t.pos, t.clef);
    console.log(`Test ${i + 1}: expected=${t.expected}, got=${result}, pass=${result === t.expected}`);
});

测试结果
Test 1: expected=, got=, pass=true
Test 2: expected=, got=, pass=true
Test 3: expected=#, got=, pass=false
Test 4: expected=, got=#, pass=false
Test 5: expected=b, got=b, pass=true
Test 6: expected=, got=, pass=true
Test 7: expected=#, got=#, pass=true


