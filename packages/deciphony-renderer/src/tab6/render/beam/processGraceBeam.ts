/**
 * 倚音符杠处理。
 *
 * 与普通符杠（processBeam）逻辑对齐，差异：
 * - 数据源是 NoteSymbol 上的 graceNotes / graceNotesAfter，而非小节内主音符；
 * - 前置倚音数组 index0 靠主音，需先 reverse 成视觉左→右再组杠；
 * - 符干/符杠尺寸按 GRACE_NOTE_SCALE（50%）缩放；
 * - 符杠接点 x 用 graceStemBeamAttachX（组内缘），绘制段界仍用符干中心 + overlap 嵌入。
 */

import type {Tab6SkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import type {NoteSymbol, NotesInfo, StaffSlot} from "@/types/MusicScoreType";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {isNoteSymbol} from "../utils/staffSlot";
import {Tab6SkinKeyEnum} from "@/tab6/enums/tab6SkinKeyEnum";
import type {NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_PARTIAL_SCALE, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {computeTab6BeamFromStemEnds} from "./tab6BeamLine";
import {GRACE_NOTE_SCALE} from "@/render/graceNote";

/**
 * 倚音连杠分组，规则同 processBeam.buildBeamGroups（视觉左→右扫描）。
 * 见 processBeam 中 beamType 说明。
 */
function buildBeamGroupsLeftToRight(list: NotesInfo[]): NotesInfo[][] {
    const groups: NotesInfo[][] = [];
    for (let i = 0; i < list.length; i++) {
        const ni = list[i]!;
        const next = list[i + 1];
        const pre = list[i - 1];
        const hasTail = ni.chronaxie <= 32;
        const preHasTail = pre != null && pre.chronaxie <= 32;
        const nextHasTail = next != null && next.chronaxie <= 32;
        const canBeamWithNext = next != null && hasTail && nextHasTail
            && ni.beamType !== BeamTypeEnum.None
            && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(next.beamType);
        const canBeamWithPre = pre != null && preHasTail && hasTail
            && pre.beamType !== BeamTypeEnum.None
            && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(ni.beamType);
        if (canBeamWithPre && groups.length > 0) {
            groups[groups.length - 1]!.push(ni);
            continue;
        }
        if (canBeamWithNext) groups.push([ni]);
    }
    return groups.filter((g) => g.length >= 2);
}

/**
 * 前置倚音：数组 index0 最靠主音（视觉右侧），需 reverse 后才是左→右。
 * 后置倚音：数组顺序已是左→右。
 */
function buildGraceBeamGroups(graceList: NotesInfo[], isBefore: boolean): NotesInfo[][] {
    const leftToRight = isBefore ? [...graceList].reverse() : [...graceList];
    return buildBeamGroupsLeftToRight(leftToRight);
}

/** 扫描小节，收集所有倚音连杠组（吉他谱符干向下） */
function collectGraceBeamGroups(measure: { notes: StaffSlot[] }): Array<{
    visualOrder: NotesInfo[];
    isBefore: boolean;
}> {
    const result: Array<{ visualOrder: NotesInfo[]; isBefore: boolean }> = [];
    for (const slot of measure.notes) {
        if (!isNoteSymbol(slot)) continue;
        if (slot.graceNotes?.length) {
            for (const g of buildGraceBeamGroups(slot.graceNotes, true)) {
                result.push({visualOrder: g, isBefore: true});
            }
        }
        if (slot.graceNotesAfter?.length) {
            for (const g of buildGraceBeamGroups(slot.graceNotesAfter, false)) {
                result.push({visualOrder: g, isBefore: false});
            }
        }
    }
    return result;
}

/**
 * 符杠与符干相接处的 x（用于算斜率、拉长符干）。
 *
 * 倚音符干在音符左侧，组内相邻符干会「交错」：
 * - 符干向上：最左音接左缘，最右音接右缘，中间默认左缘；
 * - 符干向下：最左音接右缘，最右音接左缘，中间默认右缘。
 * 这样符杠从组内一侧切入，避免从符干外侧绕过去。
 */
function graceStemBeamAttachX(
    stem: VDom,
    direction: 'up' | 'down',
    indexInVisual: number,
    visualCount: number,
): number {
    const isRightmost = indexInVisual === visualCount - 1;
    const isLeftmost = indexInVisual === 0;
    if (direction === 'up') {
        if (isLeftmost) return stem.x;
        if (isRightmost) return stem.x + stem.w;
        return stem.x;
    }
    if (isLeftmost) {
        return stem.x + stem.w;
    }
    if (isRightmost) {
        return stem.x;
    }
    return stem.x + stem.w;
}

function getGraceStem(nodeIdMap: NodeIdMap, vDoms: VDom[], niId: string): VDom | undefined {
    return nodeIdMap.get(niId)?.noteStem
        ?? vDoms.find((v) => v.tag === 'noteStem' && v.targetId === niId);
}

export function processGraceBeam(params: {
    measure: { notes: StaffSlot[] };
    nodeIdMap: NodeIdMap;
    vDoms: VDom[];
    /** 本小节符号 VDom 在 vDoms 中的起始下标（push 符号前记录） */
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
        measureLineWidth,
        skinName
    } = params;
    const skinNameForNodes = skinName ?? 'default';
    const minStemLength = MIN_STEM_HEIGHT_RATIO * (measureHeight - 5 * measureLineWidth) * GRACE_NOTE_SCALE;
    const beamScale = GRACE_NOTE_SCALE;
    const beamedGraceIds = new Set<string>();

    for (const {visualOrder} of collectGraceBeamGroups(measure)) {
        const direction = 'down' as const;
        // --- 1. 收集符干终点（中心 x，底端 y）---
        const stemEnds: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < visualOrder.length; i++) {
            const ni = visualOrder[i]!;
            const stem = getGraceStem(nodeIdMap, vDoms, ni.id);
            if (!stem) continue;
            stemEnds.push({
                x: graceStemBeamAttachX(stem, direction, i, visualOrder.length),
                y: stem.y + stem.h,
            });
        }
        if (stemEnds.length < 2) continue;

        const {inclination, anchor} = computeTab6BeamFromStemEnds(stemEnds);
        const stemSkin = skin[Tab6SkinKeyEnum.NoteStem];
        const stemHalfW = stemSkin ? stemSkin.w / 2 : 0;
        const beamCounts = visualOrder.map((ni) => chronaxieToBeamLineCount(ni.chronaxie));
        const lineCount = Math.max(...beamCounts);
        const nStems = stemEnds.length;

        // --- 2. 规划每段符杠线（同 processBeam）---
        type BeamLineSpec = { type: 'left' | 'right' | 'both' | 'none'; scaleX?: number };
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

        // --- 3. 拉长符干至符杠（接点用 attachX，不是符干左缘）---
        for (let i = 0; i < visualOrder.length; i++) {
            const ni = visualOrder[i]!;
            const stem = getGraceStem(nodeIdMap, vDoms, ni.id);
            if (!stem) continue;
            beamedGraceIds.add(ni.id);

            const attachX = graceStemBeamAttachX(stem, direction, i, visualOrder.length);
            const beamY = anchor.y + inclination * (attachX - anchor.x);
            const stemTop = stem.y;
            stem.h = Math.max(beamY - stemTop, minStemLength);
        }

        // --- 4. 生成符杠 VDom（段界用符干中心 + overlap，与普通符杠嵌入效果一致）---
        const overlap = 1;
        const stemCenterXs = visualOrder.map((ni) => {
            const stem = getGraceStem(nodeIdMap, vDoms, ni.id)!;
            return stem.x + stemHalfW;
        });
        for (let j = 0; j < nStems; j++) {
            const leftX = j === 0 ? stemCenterXs[0]! : (stemCenterXs[j - 1]! + stemCenterXs[j]!) / 2;
            // 这里+1 -1 是让符杠之间，符杠和符干之间相互嵌入，优化视觉效果
            const rightX = j === nStems - 1 ? stemCenterXs[nStems - 1]! : (stemCenterXs[j]! + stemCenterXs[j + 1]!) / 2;
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
                        centerX: stemCenterXs[j]!,
                        spacing: BEAM_LINE_SPACING * measureHeight * beamScale,
                        thickness: BEAM_THICKNESS * measureHeight * beamScale,
                        direction,
                    },
                },
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                zIndex: 1200,
                tag: 'noteBeam',
                skinName: skinNameForNodes,
                skinKey: Tab6SkinKeyEnum.NoteBeam,
                targetId: '',
                dataComment: '倚音符杠',
            });
        }
    }

    // --- 5. 移除被连杠倚音的符尾 ---
    if (beamedGraceIds.size === 0) return;
    // 符号 VDom 区间为 [startIdx, endIdx)，不能用 vDoms.length 反推（其后还 push 了符杠等）。
    const startIdx = symbolVDomsStartIdx;
    const endIdx = symbolVDomsStartIdx + symbolVDomsLength;
    for (let i = endIdx - 1; i >= startIdx; i--) {
        const node = vDoms[i];
        if (node.tag === 'noteTail' && node.targetId && beamedGraceIds.has(node.targetId)) {
            vDoms.splice(i, 1);
        }
    }
}
