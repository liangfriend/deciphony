import {AccidentalEnum, ClefEnum, KeySignatureEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";
import {StaffRegion} from "../../types";
// 谱号锚点：主体线对应音名
const clefAnchor: Record<ClefEnum, { lineIndex: number; note: string }> = {
    [ClefEnum.Treble]: {lineIndex: 2, note: "G"},
    [ClefEnum.MezzoSoprano]: {lineIndex: 2, note: "C"},
    [ClefEnum.Alto]: {lineIndex: 3, note: "C"},
    [ClefEnum.Tenor]: {lineIndex: 4, note: "C"},
    [ClefEnum.BaritoneF]: {lineIndex: 3, note: "F"},
    [ClefEnum.BaritoneC]: {lineIndex: 5, note: "C"},
    [ClefEnum.Bass]: {lineIndex: 4, note: "F"},
    [ClefEnum.Subbass]: {lineIndex: 5, note: "F"},
};
// 音名序列
const sequence = ["C", "D", "E", "F", "G", "A", "B"];
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

function getNoteLetterFromStaffPosition(pos: StaffRegion, clef: ClefEnum): string {
    const anchor = clefAnchor[clef];
    if (!anchor) throw new Error("Unsupported clef");

    // 主体第一线 = 0, 间格 = +1, 向上每格 +1, 下加线负数
    let step: number;

    if (pos.region === StaffRegionEnum.Main) {
        step = (pos.index - 1) * 2 + (pos.type === StaffPositionTypeEnum.Space ? 1 : 0);
    } else if (pos.region === StaffRegionEnum.Lower) {
        step = -(pos.index * 2) + (pos.type === StaffPositionTypeEnum.Space ? 1 : 0);
    } else { // Upper
        step = 8 + (pos.index - 1) * 2 + (pos.type === StaffPositionTypeEnum.Space ? 1 : 0);
    }

    // 相对锚点
    const relativeStep = step - (anchor.lineIndex - 1) * 2;

    const anchorIndex = sequence.indexOf(anchor.note);
    const noteIndex = (anchorIndex + relativeStep + 700) % 7; // 保证非负
    return sequence[noteIndex];
}

// 获取五线谱上某位置的变音符号
function getAccidentalForStaffPosition(
    key: KeySignatureEnum,
    pos: StaffRegion,
    clef: ClefEnum
): AccidentalEnum {
    const note = getNoteLetterFromStaffPosition(pos, clef);
    const sharps = keySignatureAccidentalMap[key].sharp;
    const flats = keySignatureAccidentalMap[key].flat;

    if (sharps.includes(note)) return AccidentalEnum.Sharp;
    if (flats.includes(note)) return AccidentalEnum.Flat;
    return AccidentalEnum.None;
}

export default getAccidentalForStaffPosition

