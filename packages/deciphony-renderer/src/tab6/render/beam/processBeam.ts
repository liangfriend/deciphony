/**
 * 吉他谱普通音符符杠：符干向下；时值 / beamType 取 notes[0]；
 * 符杠斜率 = 组内首、末符干终点连线（见 tab6BeamLine.ts）。
 */

import type {Tab6SkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import type {NoteSymbol, StaffSlot} from "@/types/MusicScoreType";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {Tab6SkinKeyEnum} from "@/tab6/enums/tab6SkinKeyEnum";
import type {NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_PARTIAL_SCALE, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {getSlotBeamChronaxie, getSlotBeamType, getSlotStemTargetId} from "../utils/note";
import {isNoteSymbol} from "../utils/staffSlot";
import {computeTab6BeamFromStemEnds, type StemEndPoint} from "./tab6BeamLine";

const BEAM_DIRECTION = 'down' as const;

function getStemEndPoint(nodeIdMap: NodeIdMap, note: NoteSymbol): StemEndPoint | null {
    const stemId = getSlotStemTargetId(note);
    const stem = stemId ? nodeIdMap.get(stemId)?.noteStem : undefined;
    if (!stem) return null;
    return {
        x: stem.x + stem.w / 2,
        y: stem.y + stem.h,
    };
}

/** 相邻可连杠 slot 分组（时值 / beamType 均用 notes[0]） */
function buildBeamGroups(measure: { notes: StaffSlot[] }): NoteSymbol[][] {
    const groups: NoteSymbol[][] = [];
    for (let i = 0; i < measure.notes.length; i++) {
        const slot = measure.notes[i];
        if (!isNoteSymbol(slot) || slot.notesInfo.length === 0) continue;
        const note = slot;
        const chronaxie = getSlotBeamChronaxie(note);
        const beamType = getSlotBeamType(note);
        const nextSlot = i < measure.notes.length - 1 ? measure.notes[i + 1] : undefined;
        const nextNote = nextSlot && isNoteSymbol(nextSlot) && nextSlot.notesInfo.length > 0
            ? nextSlot
            : undefined;
        const hasTail = chronaxie <= 32;
        const prevSlot = i > 0 ? measure.notes[i - 1] : undefined;
        const preNote = prevSlot && isNoteSymbol(prevSlot) && prevSlot.notesInfo.length > 0
            ? prevSlot
            : undefined;
        const preHasTail = preNote != null && getSlotBeamChronaxie(preNote) <= 32;
        const nextHasTail = nextNote != null && getSlotBeamChronaxie(nextNote) <= 32;
        const canBeamWithNext = nextNote != null && hasTail && nextHasTail
            && beamType !== BeamTypeEnum.None
            && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(getSlotBeamType(nextNote));
        const canBeamWithPre = preNote != null && preHasTail && hasTail
            && getSlotBeamType(preNote) !== BeamTypeEnum.None
            && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(beamType);
        if (canBeamWithPre && groups.length > 0) {
            groups[groups.length - 1]!.push(note);
            continue;
        }
        if (canBeamWithNext) groups.push([note]);
    }
    return groups.filter((g) => g.length >= 2);
}

type BeamLineSpec = { type: 'left' | 'right' | 'both' | 'none'; scaleX?: number };

function buildLinesPerSegment(beamCounts: number[], nStems: number, lineCount: number): BeamLineSpec[][] {
    const linesPerSegment: BeamLineSpec[][] = [];
    for (let seg = 0; seg < nStems; seg++) {
        const row: BeamLineSpec[] = [];
        for (let L = 0; L < lineCount; L++) {
            const leftmost = beamCounts.findIndex((c) => c > L);
            let rightmost = -1;
            if (leftmost >= 0) {
                for (let i = nStems - 1; i >= 0; i--) {
                    if (beamCounts[i]! > L) {
                        rightmost = i;
                        break;
                    }
                }
            }
            if (leftmost < 0 || seg < leftmost || seg > rightmost) {
                row.push({type: 'none'});
                continue;
            }
            if (leftmost === rightmost) {
                row.push({
                    type: seg === 0 ? 'right' : seg === nStems - 1 ? 'left' : 'both',
                    scaleX: BEAM_PARTIAL_SCALE,
                });
            } else if (seg === leftmost) row.push({type: 'right'});
            else if (seg === rightmost) row.push({type: 'left'});
            else row.push({type: 'both'});
        }
        linesPerSegment.push(row);
    }
    return linesPerSegment;
}

export function processBeam(params: {
    measure: { notes: StaffSlot[] };
    nodeIdMap: NodeIdMap;
    vDoms: VDom[];
    symbolVDomsStartIdx: number;
    symbolVDomsLength: number;
    skin: Tab6SkinPack;
    measureHeight: number;
    measureLineWidth: number;
    skinName?: string;
}): void {
    const {
        measure,
        nodeIdMap,
        vDoms,
        symbolVDomsStartIdx,
        symbolVDomsLength,
        measureHeight,
        measureLineWidth,
        skinName,
    } = params;
    const skinNameForNodes = skinName ?? 'default';
    const minStemLength = MIN_STEM_HEIGHT_RATIO * (measureHeight - 5 * measureLineWidth);
    const beamGroups = buildBeamGroups(measure);
    const beamedStemTargetIds = new Set<string>();

    for (const group of beamGroups) {
        const stemEnds: StemEndPoint[] = [];
        for (const note of group) {
            const pt = getStemEndPoint(nodeIdMap, note);
            if (pt) stemEnds.push(pt);
        }
        if (stemEnds.length < 2) continue;

        const {inclination, anchor} = computeTab6BeamFromStemEnds(stemEnds);
        const beamCounts = group.map((note) => chronaxieToBeamLineCount(getSlotBeamChronaxie(note)));
        const lineCount = Math.max(...beamCounts);
        const nStems = stemEnds.length;
        const linesPerSegment = buildLinesPerSegment(beamCounts, nStems, lineCount);

        for (const note of group) {
            const stemId = getSlotStemTargetId(note);
            const stem = stemId ? (nodeIdMap.get(stemId)?.noteStem as VDom | undefined) : undefined;
            if (!stem || !stemId) continue;
            beamedStemTargetIds.add(stemId);
            const stemCenterX = stem.x + stem.w / 2;
            const beamY = anchor.y + inclination * (stemCenterX - anchor.x);
            stem.h = Math.max(beamY - stem.y, minStemLength);
        }

        const overlap = 1;
        for (let j = 0; j < nStems; j++) {
            const leftX = j === 0 ? stemEnds[0]!.x : (stemEnds[j - 1]!.x + stemEnds[j]!.x) / 2;
            const rightX = j === nStems - 1 ? stemEnds[nStems - 1]!.x : (stemEnds[j]!.x + stemEnds[j + 1]!.x) / 2;
            const leftXAdj = j > 0 ? leftX - overlap : leftX;
            const rightXAdj = j < nStems - 1 ? rightX + overlap : rightX;
            const leftY = anchor.y + inclination * (leftXAdj - anchor.x);
            const rightY = anchor.y + inclination * (rightXAdj - anchor.x);
            vDoms.push({
                startPoint: {x: leftXAdj, y: leftY},
                endPoint: {x: rightXAdj, y: rightY},
                special: {
                    beam: {
                        lines: linesPerSegment[j]!,
                        centerX: stemEnds[j]!.x,
                        spacing: BEAM_LINE_SPACING * measureHeight,
                        thickness: BEAM_THICKNESS * measureHeight,
                        direction: BEAM_DIRECTION,
                    },
                },
                x: 0, y: 0, w: 0, h: 0,
                zIndex: 1200,
                tag: 'noteBeam',
                skinName: skinNameForNodes,
                skinKey: Tab6SkinKeyEnum.NoteBeam,
                targetId: '',
                dataComment: '符杠',
            });
        }
    }

    const startIdx = symbolVDomsStartIdx;
    const endIdx = symbolVDomsStartIdx + symbolVDomsLength;
    for (let i = endIdx - 1; i >= startIdx; i--) {
        const node = vDoms[i];
        if (node.tag === 'noteTail' && node.targetId && beamedStemTargetIds.has(node.targetId)) {
            vDoms.splice(i, 1);
        }
    }
}
