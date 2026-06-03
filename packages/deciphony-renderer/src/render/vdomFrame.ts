import {NoteSymbolTypeEnum} from '@/enums/musicScoreEnum';
import type {Frame, VDom} from '@/types/common';
import type {
    Accidental,
    AugmentationDot,
    Measure,
    MusicScore,
    NoteNumber,
    NoteRest,
    NotesInfo,
    NotesNumberInfo,
    NoteSymbol,
    SingleNoteAffiliatedSymbol,
    StaffSlot,
} from '@/types/MusicScoreType';

export type RelativeFrame = Pick<Frame, 'relativeX' | 'relativeY' | 'relativeW' | 'relativeH'>;

const ZERO_FRAME: RelativeFrame = {
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
};

function isNoteNumber(slot: StaffSlot | NoteNumber): slot is NoteNumber {
    return !('type' in slot);
}

function frameOf(frame: Partial<Frame> | undefined | null): RelativeFrame {
    return {
        relativeX: frame?.relativeX ?? 0,
        relativeY: frame?.relativeY ?? 0,
        relativeW: frame?.relativeW ?? 0,
        relativeH: frame?.relativeH ?? 0,
    };
}

function mergeFrames(...frames: Array<Partial<Frame> | RelativeFrame | undefined | null>): RelativeFrame {
    return frames.reduce<RelativeFrame>((acc, frame) => {
        const cur = frameOf(frame);
        acc.relativeX += cur.relativeX;
        acc.relativeY += cur.relativeY;
        acc.relativeW += cur.relativeW;
        acc.relativeH += cur.relativeH;
        return acc;
    }, {...ZERO_FRAME});
}

function registerFrame(
    map: Map<string, RelativeFrame>,
    id: string | undefined,
    ...frames: Array<Partial<Frame> | RelativeFrame | undefined | null>
): void {
    if (!id) return;
    map.set(id, mergeFrames(...frames));
}

function registerAccidental(
    map: Map<string, RelativeFrame>,
    accidental: Accidental | undefined,
    ...parents: Array<Partial<Frame> | RelativeFrame | undefined | null>
): void {
    if (!accidental) return;
    registerFrame(map, accidental.id, ...parents, accidental);
}

function registerAugmentationDot(
    map: Map<string, RelativeFrame>,
    dot: AugmentationDot | undefined,
    ...parents: Array<Partial<Frame> | RelativeFrame | undefined | null>
): void {
    if (!dot) return;
    registerFrame(map, dot.id, ...parents, dot);
}

function registerSingleNoteAffiliatedSymbols(
    map: Map<string, RelativeFrame>,
    symbols: SingleNoteAffiliatedSymbol[] | undefined,
    ...parents: Array<Partial<Frame> | RelativeFrame | undefined | null>
): void {
    for (const sym of symbols ?? []) {
        registerFrame(map, sym.id, ...parents, sym);
    }
}

function registerNotesInfo(
    map: Map<string, RelativeFrame>,
    info: NotesInfo,
    ...parents: Array<Partial<Frame> | RelativeFrame | undefined | null>
): void {
    const frame = mergeFrames(...parents, info);
    registerFrame(map, info.id, frame);
    registerAccidental(map, info.accidental, frame);
    registerAugmentationDot(map, info.augmentationDot, frame);
    registerSingleNoteAffiliatedSymbols(map, info.affiliatedSymbols, frame);
}

function registerStandardGraceNotes(
    map: Map<string, RelativeFrame>,
    notes: NotesInfo[] | undefined,
    ...parents: Array<Partial<Frame> | RelativeFrame | undefined | null>
): void {
    for (const info of notes ?? []) {
        registerNotesInfo(map, info, ...parents);
    }
}

function registerNoteSymbol(map: Map<string, RelativeFrame>, note: NoteSymbol): void {
    registerFrame(map, note.id, note);
    if (note.clef) {
        registerFrame(map, note.clef.id, note, note.clef);
    }
    for (const info of note.notesInfo) {
        registerNotesInfo(map, info, note);
    }
    registerStandardGraceNotes(map, note.graceNotes, note);
    registerStandardGraceNotes(map, note.graceNotesAfter, note);
}

function registerNoteRest(map: Map<string, RelativeFrame>, rest: NoteRest): void {
    registerFrame(map, rest.id, rest);
    if (rest.clef) {
        registerFrame(map, rest.clef.id, rest, rest.clef);
    }
    registerAugmentationDot(map, rest.augmentationDot, rest);
    registerSingleNoteAffiliatedSymbols(map, rest.affiliatedSymbols, rest);
}

function registerNotesNumberInfo(
    map: Map<string, RelativeFrame>,
    info: NotesNumberInfo,
    ...parents: Array<Partial<Frame> | RelativeFrame | undefined | null>
): void {
    const frame = mergeFrames(...parents);
    registerFrame(map, info.id, frame);
    registerAccidental(map, info.accidental, frame);
    for (const grace of info.graceNotes ?? []) {
        registerNotesNumberInfo(map, grace, frame);
    }
    for (const grace of info.graceNotesAfter ?? []) {
        registerNotesNumberInfo(map, grace, frame);
    }
}

function registerNoteNumber(map: Map<string, RelativeFrame>, note: NoteNumber): void {
    registerFrame(map, note.id, note);
    registerAugmentationDot(map, note.augmentationDot, note);
    registerSingleNoteAffiliatedSymbols(map, note.affiliatedSymbols, note);
    for (const info of note.notesInfo) {
        registerNotesNumberInfo(map, info, note);
    }
}

function registerMeasure(map: Map<string, RelativeFrame>, measure: Measure): void {
    registerFrame(map, measure.id, measure);
    registerFrame(map, measure.barline_f?.id, measure.barline_f);
    registerFrame(map, measure.barline_b?.id, measure.barline_b);
    registerFrame(map, measure.clef_f?.id, measure.clef_f);
    registerFrame(map, measure.clef_b?.id, measure.clef_b);
    registerFrame(map, measure.keySignature_f?.id, measure.keySignature_f);
    registerFrame(map, measure.keySignature_b?.id, measure.keySignature_b);
    registerFrame(map, measure.timeSignature_f?.id, measure.timeSignature_f);
    registerFrame(map, measure.timeSignature_b?.id, measure.timeSignature_b);
    registerFrame(map, measure.startRepeat?.id, measure.startRepeat);
    registerFrame(map, measure.endRepeat?.id, measure.endRepeat);
    for (const sym of measure.affiliatedSymbols ?? []) {
        registerFrame(map, sym.id, sym);
    }
    for (const slot of measure.notes) {
        if (isNoteNumber(slot)) {
            registerNoteNumber(map, slot);
        } else if (slot.type === NoteSymbolTypeEnum.Rest) {
            registerNoteRest(map, slot);
        } else {
            registerNoteSymbol(map, slot);
        }
    }
}

export function collectRelativeFrameMap(musicScore: MusicScore): Map<string, RelativeFrame> {
    const map = new Map<string, RelativeFrame>();
    for (const grandStaff of musicScore.grandStaffs) {
        registerFrame(map, grandStaff.id, grandStaff);
        registerFrame(map, grandStaff.bracket?.id, grandStaff.bracket);
        for (const staff of grandStaff.staves) {
            registerFrame(map, staff.id, staff);
            for (const measure of staff.measures) {
                registerMeasure(map, measure);
            }
        }
    }
    for (const sym of musicScore.affiliatedSymbols ?? []) {
        registerFrame(map, sym.id, sym);
    }
    return map;
}

export function applyRelativeFrameToVDom<T extends VDom>(
    node: T,
    frame: Partial<Frame> | RelativeFrame | undefined | null,
): T {
    const f = frameOf(frame);
    node.x += f.relativeX;
    node.y += f.relativeY;
    node.w += f.relativeW;
    node.h += f.relativeH;

    if (f.relativeX !== 0 || f.relativeY !== 0) {
        if (node.tag === 'noteBeam' || node.special?.slur) {
            node.startPoint = {
                x: node.startPoint.x + f.relativeX,
                y: node.startPoint.y + f.relativeY,
            };
            node.endPoint = {
                x: node.endPoint.x + f.relativeX,
                y: node.endPoint.y + f.relativeY,
            };
        }
    }
    return node;
}

export function applyRelativeFramesToVDoms(
    nodes: VDom[],
    frameMap: ReadonlyMap<string, RelativeFrame>,
    startIndex = 0,
): void {
    for (let i = startIndex; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node?.targetId) continue;
        const frame = frameMap.get(node.targetId);
        if (frame) applyRelativeFrameToVDom(node, frame);
    }
}
