// ---------------- 基础表 ----------------

import {AccidentalEnum, ClefEnum, KeySignatureEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";
import {StaffRegion} from "../../types";

const naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];

const naturalSemitones: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

// 每个谱号 anchor 对应的 lineIndex
const clefAnchorLine: Record<ClefEnum, number> = {
    [ClefEnum.Treble]: 2,
    [ClefEnum.Bass]: 4,
    [ClefEnum.Alto]: 3,
    [ClefEnum.Tenor]: 4,
    [ClefEnum.MezzoSoprano]: 2,
    [ClefEnum.BaritoneF]: 5,
    [ClefEnum.BaritoneC]: 5,
    [ClefEnum.Subbass]: 3,
};

// 谱号锚点（基准：某条线对应的音）
const clefAnchors: Record<ClefEnum, { note: string; midi: number }> = {
    [ClefEnum.Treble]: {note: "G", midi: 67},       // 第二线 = G4
    [ClefEnum.Bass]: {note: "F", midi: 53},         // 第四线 = F3
    [ClefEnum.Alto]: {note: "C", midi: 60},         // 第三线 = C4
    [ClefEnum.Tenor]: {note: "C", midi: 57},        // 第四线 = C3
    [ClefEnum.MezzoSoprano]: {note: "C", midi: 62}, // 第二线 = C4
    [ClefEnum.BaritoneF]: {note: "F", midi: 45},    // 第五线 = F2
    [ClefEnum.BaritoneC]: {note: "C", midi: 55},    // 第五线 = C3
    [ClefEnum.Subbass]: {note: "F", midi: 41},      // 第三线 = F2
};

// 调号 → 默认升降表
const keySignatureAccidentals: Record<KeySignatureEnum, Record<string, number>> = {
    [KeySignatureEnum.C]: {},

    [KeySignatureEnum.G]: {F: 1},
    [KeySignatureEnum.D]: {F: 1, C: 1},
    [KeySignatureEnum.A]: {F: 1, C: 1, G: 1},
    [KeySignatureEnum.E]: {F: 1, C: 1, G: 1, D: 1},
    [KeySignatureEnum.B]: {F: 1, C: 1, G: 1, D: 1, A: 1},
    [KeySignatureEnum["F#"]]: {F: 1, C: 1, G: 1, D: 1, A: 1, E: 1},
    [KeySignatureEnum["C#"]]: {F: 1, C: 1, G: 1, D: 1, A: 1, E: 1, B: 1},

    [KeySignatureEnum.F]: {B: -1},
    [KeySignatureEnum.Bb]: {B: -1, E: -1},
    [KeySignatureEnum.Eb]: {B: -1, E: -1, A: -1},
    [KeySignatureEnum.Ab]: {B: -1, E: -1, A: -1, D: -1},
    [KeySignatureEnum.Db]: {B: -1, E: -1, A: -1, D: -1, G: -1},
    [KeySignatureEnum.Gb]: {B: -1, E: -1, A: -1, D: -1, G: -1, C: -1},
    [KeySignatureEnum.Cb]: {B: -1, E: -1, A: -1, D: -1, G: -1, C: -1, F: -1},
};

// ---------------- 工具函数 ----------------

function accidentalToOffset(acc: AccidentalEnum): number {
    switch (acc) {
        case AccidentalEnum.Sharp:
            return 1;
        case AccidentalEnum.Flat:
            return -1;
        case AccidentalEnum.DoubleSharp:
            return 2;
        case AccidentalEnum.DoubleFlat:
            return -2;
        default:
            return 0;
    }
}

/**
 * StaffRegion → step（每线/间算 1 步，间 +0.5）
 */
function staffRegionToStep(region: StaffRegion, clef: ClefEnum): number {
    const anchorLine = clefAnchorLine[clef];
    let step = 0;

    if (region.region === StaffRegionEnum.Main) {
        step = (region.index - anchorLine) * 2;
        if (region.type === StaffPositionTypeEnum.Space) step += 1;
    } else if (region.region === StaffRegionEnum.Upper) {
        const offset = 5 - anchorLine;
        step = offset * 2 + region.index * 2;
        if (region.type === StaffPositionTypeEnum.Space) step -= 1;
    } else if (region.region === StaffRegionEnum.Lower) {
        const offset = anchorLine - 1;
        step = -(offset * 2 + region.index * 2);
        if (region.type === StaffPositionTypeEnum.Space) step += 1;
    }

    return step;
}

function stepToMidi(anchorNote: string, anchorMidi: number, step: number) {
    let noteIndex = naturalNotes.indexOf(anchorNote);
    if (noteIndex === -1) throw new Error(`Invalid anchorNote: ${anchorNote}`);

    let currentMidi = anchorMidi;
    let currentNoteIndex = noteIndex;
    const direction = step >= 0 ? 1 : -1;

    for (let i = 0; i < Math.abs(step); i++) {
        const prevNoteIndex = currentNoteIndex;
        currentNoteIndex = (currentNoteIndex + direction + 7) % 7;

        const prevNote = naturalNotes[prevNoteIndex];
        const nextNote = naturalNotes[currentNoteIndex];

        let diff = (naturalSemitones[nextNote] - naturalSemitones[prevNote] + 12) % 12;
        if (direction === -1) diff = -((naturalSemitones[prevNote] - naturalSemitones[nextNote] + 12) % 12);

        currentMidi += diff;
    }

    const noteName = naturalNotes[currentNoteIndex];
    const octave = Math.floor(currentMidi / 12) - 1;
    return {midi: currentMidi, noteName, octave};
}

// ---------------- 主函数 ----------------

function getMidi(
    accidental: AccidentalEnum,
    region: StaffRegion,
    clef: ClefEnum,
    keySignature: KeySignatureEnum
): number {
    const anchor = clefAnchors[clef];

    const step = staffRegionToStep(region, clef);
    const {midi: baseMidi, noteName} = stepToMidi(anchor.note, anchor.midi, step);

    const keyOffset = keySignatureAccidentals[keySignature][noteName] ?? 0;
    const accidentalOffset = accidentalToOffset(accidental);

    return baseMidi + keyOffset + accidentalOffset;
}

export default getMidi;


