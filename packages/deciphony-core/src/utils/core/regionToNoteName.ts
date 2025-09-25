import {
    AccidentalEnum,
    ClefEnum,
    StaffPositionTypeEnum,
    StaffRegionEnum,
} from "../../musicScoreEnum";
import {NoteName, StaffRegion} from "../../types";

export enum NoteLetterEnum {
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G",
    A = "A",
    B = "B",
}

export type Octave = number;

// 每个谱号的参考点：在哪条线是什么音
const clefReference: Record<
    ClefEnum,
    { letter: NoteLetterEnum; octave: Octave; line: number }
> = {
    [ClefEnum.Treble]: {letter: NoteLetterEnum.G, octave: 4, line: 2}, // 第二线 = G4
    [ClefEnum.MezzoSoprano]: {
        letter: NoteLetterEnum.C,
        octave: 4,
        line: 2,
    }, // 第二线 = C4
    [ClefEnum.Alto]: {letter: NoteLetterEnum.C, octave: 4, line: 3}, // 第三线 = C4
    [ClefEnum.Tenor]: {letter: NoteLetterEnum.C, octave: 3, line: 4}, // 第四线 = C3
    [ClefEnum.BaritoneF]: {letter: NoteLetterEnum.F, octave: 3, line: 5}, // 第五线 = F3
    [ClefEnum.BaritoneC]: {letter: NoteLetterEnum.C, octave: 4, line: 5}, // 第五线 = C4
    [ClefEnum.Bass]: {letter: NoteLetterEnum.F, octave: 3, line: 4}, // 第四线 = F3
    [ClefEnum.Subbass]: {letter: NoteLetterEnum.F, octave: 2, line: 5}, // 第五线 = F2
};

const naturalScale: NoteLetterEnum[] = [
    NoteLetterEnum.C,
    NoteLetterEnum.D,
    NoteLetterEnum.E,
    NoteLetterEnum.F,
    NoteLetterEnum.G,
    NoteLetterEnum.A,
    NoteLetterEnum.B,
];

// 工具：算 step 数（0 = 第一线 E4）
function staffRegionToStep(region: StaffRegion): number {
    if (region.region === StaffRegionEnum.Main) {
        return region.type === StaffPositionTypeEnum.Line
            ? 2 * (region.index - 1) // line
            : 2 * (region.index - 1) + 1; // space
    } else if (region.region === StaffRegionEnum.Lower) {
        return region.type === StaffPositionTypeEnum.Line
            ? -2 * region.index // line
            : -2 * region.index + 1; // space
    } else {
        // Upper
        return region.type === StaffPositionTypeEnum.Line
            ? 8 + 2 * (region.index - 1) // line
            : 9 + 2 * (region.index - 1); // space
    }
}

// 工具：谱号参考点的 step
function clefToStep(clef: ClefEnum): number {
    const ref = clefReference[clef];
    // 以五线谱第一线 = step0 (E4) 为基准
    // 第二线 = step2 (G4)，所以 ref.line n → step = 2*(n-1)
    return 2 * (ref.line - 1);
}

function regionToNoteName(
    region: StaffRegion,
    accidental: AccidentalEnum,
    clef: ClefEnum
): NoteName {
    const ref = clefReference[clef];
    const regionStep = staffRegionToStep(region);
    const refStep = clefToStep(clef);

    // 偏移量
    const stepOffset = regionStep - refStep;

    // 基准音在自然音阶的位置
    const baseIdx = naturalScale.indexOf(ref.letter);

    // 新音的字母
    const newIdx = (baseIdx + stepOffset + 7 * 10) % 7;
    const letter = naturalScale[newIdx];

    // 八度
    const octaveShift = Math.floor((baseIdx + stepOffset) / 7);
    const octave = ref.octave + octaveShift;

    return {letter, accidental, octave};
}

export default regionToNoteName
// console.log(
//     regionToNoteName(
//         {region: StaffRegionEnum.Lower, type: StaffPositionTypeEnum.Line, index: 1},
//         AccidentalEnum.Natural,
//         ClefEnum.Treble
//     )
// );
// // 🎵 第二线 Treble = G4 ✅
//
// console.log(
//     regionToNoteName(
//         {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 3},
//         AccidentalEnum.Natural,
//         ClefEnum.Treble
//     )
// );
// // 🎵 第三间 Treble = C5 ✅
