import {StaffRegion} from "../../types";
import {AccidentalEnum, ClefEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";

/*
* AI 没有全面测试
* */
const clefMidiMap: Record<number, Record<StaffRegionEnum, number>> = {
    // 高音谱号（G 谱号，G4 在第 2 线）
    [ClefEnum.Treble]: {
        [StaffRegionEnum.Main]: 64, // main_line_1 = E4
        [StaffRegionEnum.Upper]: 79, // upper_space_1 = G5
        [StaffRegionEnum.Lower]: 62, // lower_space_1 = D4
    },

    // 次女高音谱号（Mezzo-soprano C 谱号，C4 在第 2 线）
    [ClefEnum.MezzoSoprano]: {
        [StaffRegionEnum.Main]: 57, // main_line_1 = A3
        [StaffRegionEnum.Upper]: 72, // upper_space_1 = C5
        [StaffRegionEnum.Lower]: 55, // lower_space_1 = G3
    },

    // 中音谱号（Alto C 谱号，C4 在第 3 线）
    [ClefEnum.Alto]: {
        [StaffRegionEnum.Main]: 53, // main_line_1 = F3
        [StaffRegionEnum.Upper]: 69, // upper_space_1 = A4
        [StaffRegionEnum.Lower]: 52, // lower_space_1 = E3
    },

    // 次男高音谱号（Tenor C 谱号，C4 在第 4 线）
    [ClefEnum.Tenor]: {
        [StaffRegionEnum.Main]: 50, // main_line_1 = D3
        [StaffRegionEnum.Upper]: 65, // upper_space_1 = F4
        [StaffRegionEnum.Lower]: 48, // lower_space_1 = C3
    },

    // 男中音 F 谱号（Baritone F，常把 F 放第 3 线）
    [ClefEnum.BaritoneF]: {
        [StaffRegionEnum.Main]: 47, // main_line_1 = B2
        [StaffRegionEnum.Upper]: 62, // upper_space_1 = D4
        [StaffRegionEnum.Lower]: 45, // lower_space_1 = A2
    },

    // 男中音 C 谱号（Baritone C，C4 在第 5 线）
    [ClefEnum.BaritoneC]: {
        [StaffRegionEnum.Main]: 53, // main_line_1 = F3
        [StaffRegionEnum.Upper]: 62, // upper_space_1 = D4 (C4 在 line5, 所以上方第一个间是 D4)
        [StaffRegionEnum.Lower]: 52, // lower_space_1 = E3
    },

    // 低音谱号（Bass, F 谱号，F3 在第 4 线）
    [ClefEnum.Bass]: {
        [StaffRegionEnum.Main]: 43, // main_line_1 = G2
        [StaffRegionEnum.Upper]: 60, // upper_space_1 = C4
        [StaffRegionEnum.Lower]: 41, // lower_space_1 = F2
    },

    // 次低音谱号（Subbass）——这里采用常见约定：F 在第 5 线 (F2)
    [ClefEnum.Subbass]: {
        [StaffRegionEnum.Main]: 28, // main_line_1 = E1  （五线最下面一线非常低）
        [StaffRegionEnum.Upper]: 43, // upper_space_1 = G2
        [StaffRegionEnum.Lower]: 26, // lower_space_1 = D1
    },
};
const baseDiatonicPattern = [2, 2, 1, 2, 2, 2, 1]; // intervals starting from C: C->D, D->E, E->F, ...

const pcToDiatonicIndex: Record<number, number> = {
    0: 0,  // C
    2: 1,  // D
    4: 2,  // E
    5: 3,  // F
    7: 4,  // G
    9: 5,  // A
    11: 6, // B
};

function rotateArray<T>(arr: T[], n: number): T[] {
    n = ((n % arr.length) + arr.length) % arr.length;
    return arr.slice(n).concat(arr.slice(0, n));
}

function regionToMidi(
    region: StaffRegion,
    accidental: AccidentalEnum,
    clef: ClefEnum
): number {
    const map = clefMidiMap[clef];
    if (!map || typeof map[StaffRegionEnum.Main] !== "number") {
        throw new Error(`No clef mapping for clef ${clef}. please add clefMidiMap entry.`);
    }
    const baseMidi = map[StaffRegionEnum.Main]; // main_line_1 的 MIDI

    // 1) 计算 posIndex（与原逻辑等价，但写得更直观）
    const {region: reg, type, index} = region;
    if (index < 1) throw new Error("StaffRegion.index should be >= 1");

    let posIndex: number;
    if (reg === StaffRegionEnum.Main) {
        posIndex = (index - 1) * 2 + (type === StaffPositionTypeEnum.Space ? 1 : 0);
    } else if (reg === StaffRegionEnum.Upper) {
        // main_line_5 的 posIndex = 8；upper 从 9 (upper_space_1) / 10 (upper_line_1) 开始
        posIndex = 8 + (index - 1) * 2 + (type === StaffPositionTypeEnum.Space ? 1 : 2);
    } else if (reg === StaffRegionEnum.Lower) {
        // lower_space_1 -> -1, lower_line_1 -> -2, ...
        posIndex = -((index - 1) * 2 + (type === StaffPositionTypeEnum.Space ? 1 : 2));
    } else {
        throw new Error("Unknown StaffRegionEnum: " + reg);
    }

    // 2) 根据 baseMidi 的音类（C D E F G A B）旋转半音模式
    const pc = ((baseMidi % 12) + 12) % 12;
    let startIdx = pcToDiatonicIndex[pc];

    // 容错：如果 baseMidi 不是“纯自然音”的 MIDI（极少见），退回到 C 起点（通常 clef 映射都是自然音）
    if (startIdx === undefined) {
        // 这里可以选择更复杂的处理（例如向下寻找最近的自然音并调整），但通常不需要。
        startIdx = 0; // 以 C 为起点作为 fallback
    }

    const upPattern = rotateArray(baseDiatonicPattern, startIdx); // 从 base note 向上走的步距序列

    // 3) 累加 semitone offset
    let semitoneOffset = 0;
    if (posIndex > 0) {
        for (let i = 0; i < posIndex; i++) {
            semitoneOffset += upPattern[i % upPattern.length];
        }
    } else if (posIndex < 0) {
        // 向下走：从 upPattern 的末尾开始向前累加
        const n = Math.abs(posIndex);
        for (let i = 0; i < n; i++) {
            // 取 upPattern[6 - i], upPattern[5 - i], ...
            const idx = (upPattern.length - 1 - i) % upPattern.length;
            semitoneOffset -= upPattern[(upPattern.length - 1 - i) % upPattern.length];
        }
    }

    // 4) 变音偏移
    let accOffset = 0;
    switch (accidental) {
        case AccidentalEnum.Sharp:
            accOffset = 1;
            break;
        case AccidentalEnum.Flat:
            accOffset = -1;
            break;
        case AccidentalEnum.DoubleSharp:
            accOffset = 2;
            break;
        case AccidentalEnum.DoubleFlat:
            accOffset = -2;
            break;
        default:
            accOffset = 0;
    }

    return baseMidi + semitoneOffset + accOffset;
}

export default regionToMidi;
// console.log(regionToMidi({
//     region: StaffRegionEnum.Upper,
//     type: StaffPositionTypeEnum.Line,
//     index: 1
// }, AccidentalEnum.None, ClefEnum.Bass))