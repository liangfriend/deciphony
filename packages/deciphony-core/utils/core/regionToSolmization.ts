import {
    AccidentalEnum,
    ClefEnum,
    KeySignatureEnum,
    SolmizationEnum,
    StaffPositionTypeEnum,
    StaffRegionEnum
} from "../../musicScoreEnum";
import {StaffRegion} from "../../types";


// 1. 调号到主音（Do）字母
const KeySignatureToTonic: Record<KeySignatureEnum, string> = {
    [KeySignatureEnum.Cb]: "Cb",
    [KeySignatureEnum.Gb]: "Gb",
    [KeySignatureEnum.Db]: "Db",
    [KeySignatureEnum.Ab]: "Ab",
    [KeySignatureEnum.Eb]: "Eb",
    [KeySignatureEnum.Bb]: "Bb",
    [KeySignatureEnum.F]: "F",
    [KeySignatureEnum.C]: "C",
    [KeySignatureEnum.G]: "G",
    [KeySignatureEnum.D]: "D",
    [KeySignatureEnum.A]: "A",
    [KeySignatureEnum.E]: "E",
    [KeySignatureEnum.B]: "B",
    [KeySignatureEnum["F#"]]: "F#",
    [KeySignatureEnum["C#"]]: "C#",
};

// 2. 字母音名顺序表（循环）
const AlphabetOrder = ["C", "D", "E", "F", "G", "A", "B"];
// 音名字母顺序 (带八度)
const AlphabetCycle = ["C", "D", "E", "F", "G", "A", "B"];

// clef 对应基准点：某条线对应的绝对音名
const ClefAnchor: Record<ClefEnum, { region: StaffRegion, note: string }> = {
    [ClefEnum.Treble]: {
        region: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 2},
        note: "G4" // 高音谱号第二线 = G4
    },
    [ClefEnum.Bass]: {
        region: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 2},
        note: "F3" // 低音谱号第二线 = F3
    },
    [ClefEnum.Alto]: {
        region: {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 3},
        note: "C4" // 中音谱号第三线 = C4
    },
    // 其他谱号可按规则继续补
} as any;

function regionToNoteLetter(region: StaffRegion, clef: ClefEnum): string {
    const anchor = ClefAnchor[clef];
    if (!anchor) throw new Error("Unsupported clef");

    // anchor 的 note，如 "G4"
    const [anchorLetter, anchorOctaveStr] = anchor.note.match(/[A-G]|[0-9]+/g)!;
    let anchorOctave = parseInt(anchorOctaveStr, 10);

    // anchor 的谱位偏移量（把 line/space 转成一个“格子索引”）
    const anchorIndex = (anchor.region.index - 1) * 2 + (anchor.region.type === StaffPositionTypeEnum.Space ? 1 : 0);

    const currentIndex = (region.index - 1) * 2 + (region.type === StaffPositionTypeEnum.Space ? 1 : 0);

    // 差值（多少个字母音）
    const diff = currentIndex - anchorIndex;

    // 找到字母位置
    const anchorPos = AlphabetCycle.indexOf(anchorLetter);
    let notePos = (anchorPos + diff) % 7;
    if (notePos < 0) notePos += 7;

    // 算八度
    let noteOctave = anchorOctave;
    const octaveShift = Math.floor((anchorPos + diff) / 7);
    noteOctave += octaveShift;

    return AlphabetCycle[notePos] + noteOctave;
}

// 3. 主函数
function regionToSolmization(
    region: StaffRegion,
    clef: ClefEnum,
    keySignature: KeySignatureEnum
): { solmization: SolmizationEnum, accidental: AccidentalEnum } {
    const note = regionToNoteLetter(region, clef); // e.g. "C4"
    const noteLetter = note[0]; // 只取字母部分

    const tonic = KeySignatureToTonic[keySignature]; // e.g. "G"
    const tonicLetter = tonic.replace(/[#b]/, ""); // 暂不考虑升降

    const tonicIndex = AlphabetCycle.indexOf(tonicLetter);
    const noteIndex = AlphabetCycle.indexOf(noteLetter);

    const degree = ((noteIndex - tonicIndex + 7) % 7) + 1;
    return degree as SolmizationEnum;
}


export default regionToSolmization

