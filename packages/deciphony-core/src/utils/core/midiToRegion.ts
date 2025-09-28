import {StaffRegion} from "../../types";
import {AccidentalEnum, ClefEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";

/*
* AI, 经测试，Treble和Bass正确
* */

// 变音符号优先级（可以调整顺序）
const prioritySharp: AccidentalEnum[] = [
    AccidentalEnum.Natural,
    AccidentalEnum.Sharp,
    AccidentalEnum.Flat,

];
const priorityFlat: AccidentalEnum[] = [
    AccidentalEnum.Natural,
    AccidentalEnum.Flat,
    AccidentalEnum.Sharp,
];

function midiToRegion(
    midi: number,
    clef: ClefEnum,
    priority: AccidentalEnum.Sharp | AccidentalEnum.Flat = AccidentalEnum.Sharp
): {
    staffRegion: StaffRegion,
    accidental: AccidentalEnum
} {
    // 基础表：字母顺序与 pitch-class 映射。C=0, C#=1, D=2, ..., B=11
    const letterOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    // 两种拼写优先：sharp 优先或 flat 优先
    const pitchToLetterSharp: Record<number, [string, AccidentalEnum]> = {
        0: ['C', AccidentalEnum.None],
        1: ['C', AccidentalEnum.Sharp],
        2: ['D', AccidentalEnum.None],
        3: ['D', AccidentalEnum.Sharp],
        4: ['E', AccidentalEnum.None],
        5: ['F', AccidentalEnum.None],
        6: ['F', AccidentalEnum.Sharp],
        7: ['G', AccidentalEnum.None],
        8: ['G', AccidentalEnum.Sharp],
        9: ['A', AccidentalEnum.None],
        10: ['A', AccidentalEnum.Sharp],
        11: ['B', AccidentalEnum.None],
    };
    const pitchToLetterFlat: Record<number, [string, AccidentalEnum]> = {
        0: ['C', AccidentalEnum.None],
        1: ['D', AccidentalEnum.Flat], // Db
        2: ['D', AccidentalEnum.None],
        3: ['E', AccidentalEnum.Flat], // Eb
        4: ['E', AccidentalEnum.None],
        5: ['F', AccidentalEnum.None],
        6: ['G', AccidentalEnum.Flat], // Gb
        7: ['G', AccidentalEnum.None],
        8: ['A', AccidentalEnum.Flat], // Ab
        9: ['A', AccidentalEnum.None],
        10: ['B', AccidentalEnum.Flat], // Bb
        11: ['B', AccidentalEnum.None],
    };

    const table = (priority === AccidentalEnum.Sharp) ? pitchToLetterSharp : pitchToLetterFlat;

    // 计算 pitch-class 与字母、变音
    const pitchClass = ((midi % 12) + 12) % 12;
    const [letter, accidental] = table[pitchClass];

    // 计算 octave（标准 MIDI 规则： octave = floor(midi/12) - 1, 即 midi 60 -> C4）
    const octave = Math.floor(midi / 12) - 1;
    const letterIndex = letterOrder.indexOf(letter);
    const diatonicNumber = octave * 7 + letterIndex; // 绝对音阶步数（每个 diatonic step 对应一个 line/space）

    // 辅助：根据 字母+octave 得到 diatonicNumber
    function diatonicOf(letterChr: string, oct: number) {
        const idx = letterOrder.indexOf(letterChr);
        return oct * 7 + idx;
    }

    // 为常用谱号设定参考点： reference.diatonic 对应 reference.staffStep（step 编号）
    // step 编号定义： main_line1 = 0, main_space1 = 1, main_line2 = 2, ..., main_line5 = 8
    const clefRef: Record<ClefEnum, { diatonic: number; staffStep: number }> = {
        [ClefEnum.Treble]: {diatonic: diatonicOf('G', 4), staffStep: 2},          // G4 -> main_line2
        [ClefEnum.MezzoSoprano]: {diatonic: diatonicOf('C', 4), staffStep: 2},   // C4 -> main_line2
        [ClefEnum.Alto]: {diatonic: diatonicOf('C', 4), staffStep: 4},          // C4 -> main_line3
        [ClefEnum.Tenor]: {diatonic: diatonicOf('C', 4), staffStep: 6},         // C4 -> main_line4
        [ClefEnum.BaritoneF]: {diatonic: diatonicOf('F', 3), staffStep: 4},     // 取 F3 -> main_line3（可调整）
        [ClefEnum.BaritoneC]: {diatonic: diatonicOf('C', 4), staffStep: 8},     // C4 -> main_line5
        [ClefEnum.Bass]: {diatonic: diatonicOf('F', 3), staffStep: 6},          // F3 -> main_line4
        [ClefEnum.Subbass]: {diatonic: diatonicOf('F', 2), staffStep: 6},       // F2 -> main_line4（可调整）
    };

    // 如果传入的 clef 没有映射，使用高音谱号作为 fallback
    const ref = clefRef[clef] ?? clefRef[ClefEnum.Treble];

    // 计算目标 note 在 staff 上的 step（可能为负数或 >8）
    const staffStep = diatonicNumber - ref.diatonic + ref.staffStep;

    // 决定区域、line/space 与索引
    let region: StaffRegionEnum;
    let posType: StaffPositionTypeEnum;
    let index: number;

    if (staffStep >= 0 && staffStep <= 8) {
        // Main 区域（main_line1 .. main_line5 / main_space1 .. main_space4）
        region = StaffRegionEnum.Main;
        if (staffStep % 2 === 0) { // even -> line
            posType = StaffPositionTypeEnum.Line;
            index = Math.floor(staffStep / 2) + 1; // step0 -> line1, step2 -> line2, ...
        } else { // odd -> space
            posType = StaffPositionTypeEnum.Space;
            index = Math.floor((staffStep + 1) / 2); // step1 -> space1, step3 -> space2, ...
        }
    } else if (staffStep < 0) {
        // Lower 区域：下方 ledger（lower_space1 = step -1, lower_line1 = step -2, ...）
        region = StaffRegionEnum.Lower;
        const pos = -staffStep; // pos: 1 => lower_space1, 2 => lower_line1, 3 => lower_space2 ...
        if (pos % 2 === 1) { // odd -> space
            posType = StaffPositionTypeEnum.Space;
            index = Math.floor((pos + 1) / 2);
        } else { // even -> line
            posType = StaffPositionTypeEnum.Line;
            index = pos / 2;
        }
    } else {
        // Upper 区域：上方 ledger（upper_space1 = step 9, upper_line1 = step10, ...）
        region = StaffRegionEnum.Upper;
        const posUpper = staffStep - 8; // posUpper: 1 => upper_space1, 2 => upper_line1 ...
        if (posUpper % 2 === 1) { // odd -> space
            posType = StaffPositionTypeEnum.Space;
            index = Math.floor((posUpper + 1) / 2);
        } else { // even -> line
            posType = StaffPositionTypeEnum.Line;
            index = posUpper / 2;
        }
    }

    const staffRegion: StaffRegion = {
        region,
        type: posType,
        index,
    };

    return {staffRegion, accidental};
}

export default midiToRegion

// console.log(midiToRegion(58, ClefEnum.Bass, AccidentalEnum.Sharp))