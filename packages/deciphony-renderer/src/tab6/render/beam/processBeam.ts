/**
 * 吉他谱普通音符符杠：符干向下；时值 / beamType 取 notes[0]；
 * 符杠斜率 = 组内首、末符干终点连线（见 tab6BeamLine.ts）。
 */

import type {Tab6SkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import type {MeasureNoteSlot, NoteSymbol} from "@/types/MusicScoreType";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {Tab6SkinKeyEnum} from "@/tab6/enums/tab6SkinKeyEnum";
import type {NodeIdMap} from "../types";
import {
    BEAM_LINE_SPACING,
    BEAM_PARTIAL_SCALE,
    BEAM_THICKNESS,
    TAB_6_BEAM_END_OFFSET_RATIO,
    TAB_6_BEAM_MAX_LINES,
    TAB_6_STEM_FLAG_CLEARANCE_RATIO,
} from "../constants";
import {getTab6TailStemEndOffset} from "../note/renderStemAndTail";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {getSlotBeamChronaxie, getSlotBeamType, getSlotStemTargetId} from "../utils/note";
import {isNoteSymbol, slotIsNoteSymbol, slotSymbol} from "../utils/staffSlot";
import {computeTab6BeamFromStemEnds, type StemEndPoint} from "./tab6BeamLine";
import {markBeamLineRuns} from "@/render/beamLineRuns";

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
function buildBeamGroups(measure: { notes: MeasureNoteSlot[] }): NoteSymbol[][] {
    const groups: NoteSymbol[][] = [];
    for (let i = 0; i < measure.notes.length; i++) {
        const measureSlot = measure.notes[i];
        if (!slotIsNoteSymbol(measureSlot)) continue;
        const note = slotSymbol(measureSlot) as NoteSymbol;
        if (note.notesInfo.length === 0) continue;
        const chronaxie = getSlotBeamChronaxie(note);
        const beamType = getSlotBeamType(note);
        const nextMeasureSlot = i < measure.notes.length - 1 ? measure.notes[i + 1] : undefined;
        const nextSym = nextMeasureSlot && slotIsNoteSymbol(nextMeasureSlot) ? slotSymbol(nextMeasureSlot) : undefined;
        const nextNote = nextSym && isNoteSymbol(nextSym) && nextSym.notesInfo.length > 0
            ? nextSym as NoteSymbol
            : undefined;
        const hasTail = chronaxie <= 32;
        const prevMeasureSlot = i > 0 ? measure.notes[i - 1] : undefined;
        const preSym = prevMeasureSlot && slotIsNoteSymbol(prevMeasureSlot) ? slotSymbol(prevMeasureSlot) : undefined;
        const preNote = preSym && isNoteSymbol(preSym) && preSym.notesInfo.length > 0
            ? preSym as NoteSymbol
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
    measure: { notes: MeasureNoteSlot[] };
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
        skin,
        measureHeight,
        skinName,
    } = params;
    const skinNameForNodes = skinName ?? 'default';
    // 符干终点按符尾线生成（已含 Frame 偏移）；整体上移到符杠线。
    // 符杠线与时值无关（各组最下一条符杠平行），按最多杠数算：最低弦数字下方也放得下
    const maxStackH = (TAB_6_BEAM_MAX_LINES * BEAM_THICKNESS + (TAB_6_BEAM_MAX_LINES - 1) * BEAM_LINE_SPACING)
        * measureHeight;
    const headHalfH = (skin[Tab6SkinKeyEnum.Tab_note_0]?.h ?? 0) / 2;
    const beamEndOffset = Math.max(
        TAB_6_BEAM_END_OFFSET_RATIO * measureHeight,
        headHalfH + TAB_6_STEM_FLAG_CLEARANCE_RATIO * measureHeight + maxStackH,
    );
    const lift = getTab6TailStemEndOffset(skin, measureHeight) - beamEndOffset;
    const beamGroups = buildBeamGroups(measure);
    const beamedStemTargetIds = new Set<string>();

    for (const group of beamGroups) {
        const beamCounts = group.map((note) => chronaxieToBeamLineCount(getSlotBeamChronaxie(note)));
        const lineCount = Math.max(...beamCounts);
        const stemEnds: StemEndPoint[] = [];
        for (const note of group) {
            const pt = getStemEndPoint(nodeIdMap, note);
            if (pt) stemEnds.push({x: pt.x, y: pt.y - lift});
        }
        if (stemEnds.length < 2) continue;

        const {inclination, anchor} = computeTab6BeamFromStemEnds(stemEnds);
        const nStems = stemEnds.length;
        const linesPerSegment = buildLinesPerSegment(beamCounts, nStems, lineCount);

        group.forEach((note, j) => {
            const stemId = getSlotStemTargetId(note);
            const nodes = stemId ? nodeIdMap.get(stemId) : undefined;
            const stem = nodes?.noteStem as VDom | undefined;
            if (!stem || !stemId) return;
            beamedStemTargetIds.add(stemId);
            const stemCenterX = stem.x + stem.w / 2;
            const beamY = anchor.y + inclination * (stemCenterX - anchor.x);
            const oldEndY = stem.y + stem.h;
            stem.h = Math.max(beamY - stem.y, 0);

            // 附点（renderSymbol 放在符干根部）挪到本符干处最上一条符杠上方，保留其相对符干根部的 Frame 偏移
            const dot = nodes?.augmentationDot as VDom | undefined;
            if (!dot) return;
            const segLines = linesPerSegment[j] ?? [];
            let linesHere = 0;
            segLines.forEach((spec, L) => {
                if (spec.type !== 'none') linesHere = L + 1;
            });
            const stackH = linesHere > 0
                ? (linesHere * BEAM_THICKNESS + (linesHere - 1) * BEAM_LINE_SPACING) * measureHeight
                : 0;
            const frameDy = dot.y - (oldEndY - dot.h);
            dot.y = beamY - stackH - BEAM_LINE_SPACING * measureHeight - dot.h + frameDy;
        });

        const beamStart = vDoms.length;
        for (let j = 0; j < nStems; j++) {
            const leftX = j === 0 ? stemEnds[0]!.x : (stemEnds[j - 1]!.x + stemEnds[j]!.x) / 2;
            const rightX = j === nStems - 1 ? stemEnds[nStems - 1]!.x : (stemEnds[j]!.x + stemEnds[j + 1]!.x) / 2;
            const leftY = anchor.y + inclination * (leftX - anchor.x);
            const rightY = anchor.y + inclination * (rightX - anchor.x);
            vDoms.push({
                startPoint: {x: leftX, y: leftY},
                endPoint: {x: rightX, y: rightY},
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
        markBeamLineRuns(vDoms, beamStart);
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
