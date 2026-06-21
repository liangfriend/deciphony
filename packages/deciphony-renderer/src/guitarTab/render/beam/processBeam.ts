/**
 * 普通音符符杠处理。
 *
 * 整体流程：
 * 1. 按符干方向（up / down）分别扫描小节，把相邻可连杠的音符分成若干组；
 * 2. 每组：收集符干接点 → 算斜率 → 规划每根符杠线的绘制方式 → 拉长符干至符杠 → 生成符杠 VDom；
 * 3. 被连杠的音符移除符尾（符尾由符杠替代）。
 *
 * 符杠 VDom 以 noteBeam 标签输出，实际绘制由 beam.vue 根据 special.beam 渲染。
 */

import type {GuitarTabSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import type {NoteSymbol, StaffSlot} from "@/types/MusicScoreType";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {GuitarTabSkinKeyEnum} from "@/guitarTab/enums/guitarTabSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_PARTIAL_SCALE, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {computeBeamSlope} from "./beamSlope";
import {getVoiceGroupForDirection} from "../utils/note";
import {isNoteSymbol} from "../utils/staffSlot";

/** 一组连杠成员：一个 NoteSymbol + 该组使用的符干方向 */
type BeamGroupMember = { note: NoteSymbol; direction: 'up' | 'down' };

/**
 * 取该音符在指定符干方向上「最靠符杠一侧」的 notesInfo id。
 * 和弦多声部时，up 取 region 最大（最高音），down 取 region 最小（最低音），
 * 符杠连在该声部的符干上。
 */
function getExtremeNotesInfoId(n: NoteSymbol, direction: 'up' | 'down'): string | undefined {
    const group = getVoiceGroupForDirection(n, direction);
    if (!group || group.notesInfo.length === 0) return undefined;
    const directionUp = direction === 'up';
    const regions = group.notesInfo.map((no) => no.region);
    const extremeRegion = directionUp ? Math.max(...regions) : Math.min(...regions);
    return group.notesInfo.find((no) => no.region === extremeRegion)?.id;
}

/**
 * 把小节内音符按视觉顺序（左→右）划分连杠组。
 *
 * 连杠条件（与相邻音符）：
 * - 双方时值 ≤ 32（有符尾，可连杠）；
 * - 当前音符 beamType ≠ None；
 * - 下一音符 beamType 不是 None / OnlyRight（OnlyRight 只连右侧，不能作为被连入的一端）。
 *
 * beamType 语义：
 * - None：不参与连杠；
 * - OnlyRight：只与右侧连，左侧不延伸符杠；
 * - Combined：左右都连。
 */
function buildBeamGroups(measure: { notes: StaffSlot[] }, direction: 'up' | 'down'): BeamGroupMember[][] {
    const groups: BeamGroupMember[][] = [];
    for (let i = 0; i < measure.notes.length; i++) {
        const slot = measure.notes[i];
        if (!isNoteSymbol(slot)) continue;
        const note = slot;
        const group = getVoiceGroupForDirection(note, direction);
        const nextSlot = i < measure.notes.length - 1 ? measure.notes[i + 1] : undefined;
        const nextNote = nextSlot && isNoteSymbol(nextSlot) ? nextSlot : undefined;
        const nextGroup = nextNote ? getVoiceGroupForDirection(nextNote, direction) : undefined;
        if (!group || group.notesInfo.length === 0) continue;
        const hasTail = group.chronaxie <= 32;
        const prevSlot = i > 0 ? measure.notes[i - 1] : undefined;
        const preNote = prevSlot && isNoteSymbol(prevSlot) ? prevSlot : undefined;
        const preGroup = preNote ? getVoiceGroupForDirection(preNote, direction) : undefined;
        const preHasTail = preGroup && preGroup.chronaxie <= 32;
        const nextHasTail = nextGroup && nextGroup.chronaxie <= 32;
        const canBeamWithNext = nextNote && nextGroup && hasTail && nextHasTail
            && group.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(nextGroup.beamType);
        const canBeamWithPre = preGroup && preHasTail && hasTail
            && preGroup.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(group.beamType);
        const member: BeamGroupMember = {note, direction};
        // 能与前一个连 → 并入上一组
        if (canBeamWithPre && groups.length > 0) {
            groups[groups.length - 1]!.push(member);
            continue;
        }
        // 能与后一个连 → 开新组
        if (canBeamWithNext) groups.push([member]);
    }
    return groups.filter((g) => g.length >= 2);
}

export function processBeam(params: {
    measure: { notes: StaffSlot[] };
    nodeIdMap: NodeIdMap;
    vDoms: VDom[];
    /** 本小节符号 VDom 在 vDoms 中的起始下标（push 符号前记录） */
    symbolVDomsStartIdx: number;
    symbolVDomsLength: number;
    skin: GuitarTabSkinPack;
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
    const minStemLength = MIN_STEM_HEIGHT_RATIO * (measureHeight - 5 * measureLineWidth);
    const beamGroupsUp = buildBeamGroups(measure, 'up');
    const beamGroupsDown = buildBeamGroups(measure, 'down');

    /** 处理单个连杠组 */
    const processBeamGroup = (group: BeamGroupMember[], direction: 'up' | 'down') => {
        // --- 1. 收集符干与符杠的接点（左→右）---
        const stemEnds: Array<{ x: number; y: number }> = [];
        for (const {note, direction: dir} of group) {
            const stemId = getExtremeNotesInfoId(note, dir);
            const stem = stemId ? nodeIdMap.get(stemId)?.noteStem : undefined;
            if (!stem) continue;
            const x = stem.x; // 符干左缘
            const y = direction === 'up' ? stem.y : stem.y + stem.h; // up=顶端，down=底端
            stemEnds.push({x, y});
        }
        if (stemEnds.length < 2) return;

        // --- 2. 斜率与符干半宽 ---
        const {inclination, anchor} = computeBeamSlope(stemEnds, direction);
        const stemSkin = skin[GuitarTabSkinKeyEnum.NoteStem];
        const stemHalfW = stemSkin ? stemSkin.w / 2 : 0;

        // --- 3. 规划每段符杠上各条线的绘制方式 ---
        // beamCounts[i] = 第 i 个音符有几条符杠线（由时值决定，如八分=1、十六分=2）
        const beamCounts = group.map(({note, direction: dir}) => {
            const voiceGroup = getVoiceGroupForDirection(note, dir)!;
            return chronaxieToBeamLineCount(voiceGroup.chronaxie);
        });
        const lineCount = Math.max(...beamCounts); // 组内最多符杠条数
        const nStems = stemEnds.length;

        /**
         * linesPerSegment[seg][L]：第 seg 个音符位置上，第 L 条符杠线如何画。
         * - both：左右都画满（中间音符默认）；
         * - left / right：只画一半（组端或时值较短的音符）；
         * - none：该位置不画这条线；
         * scaleX：半幅符杠的横向缩放（BEAM_PARTIAL_SCALE）。
         */
        type BeamLineSpec = { type: 'left' | 'right' | 'both' | 'none'; scaleX?: number };
        const linesPerSegment: BeamLineSpec[][] = [];
        for (let seg = 0; seg < nStems; seg++) {
            const row: BeamLineSpec[] = [];
            for (let L = 0; L < lineCount; L++) {
                // 第 L 条线：从哪个音符开始、到哪个音符结束
                const leftmost = beamCounts.findIndex((c) => c > L);
                let rightmost = -1;
                if (leftmost >= 0) for (let i = nStems - 1; i >= 0; i--) if (beamCounts[i]! > L) {
                    rightmost = i;
                    break;
                }
                if (leftmost < 0 || seg < leftmost || seg > rightmost) {
                    row.push({type: 'none'});
                    continue;
                }
                if (leftmost === rightmost) {
                    // 只有这一个音符有第 L 条线 → 画半幅
                    row.push({
                        type: seg === 0 ? 'right' : seg === nStems - 1 ? 'left' : 'both',
                        scaleX: BEAM_PARTIAL_SCALE
                    });
                } else if (seg === leftmost) row.push({type: 'right'});
                else if (seg === rightmost) row.push({type: 'left'});
                else row.push({type: 'both'});
            }
            linesPerSegment.push(row);
        }

        // --- 4. 拉长符干，使符干顶端/底端到达符杠 ---
        for (const {note, direction: dir} of group) {
            const stemId = getExtremeNotesInfoId(note, dir);
            const stem = stemId ? (nodeIdMap.get(stemId)?.noteStem as VDom | undefined) : undefined;
            if (!stem) continue;
            const beamY = anchor.y + inclination * (stem.x - anchor.x);
            const stemTop = stem.y;
            const stemBottom = stem.y + stem.h;
            if (direction === 'up') {
                stem.y = beamY;
                stem.h = Math.max(stemBottom - beamY, minStemLength);
            } else {
                stem.h = Math.max(beamY - stemTop, minStemLength);
            }
        }

        // --- 5. 为每个音符位置生成一段符杠 VDom ---
        const overlap = 1; // 相邻段、符杠与符干互相嵌入 1px
        for (let j = 0; j < nStems; j++) {
            // 段界 x：相邻两符干中心的中间点；首尾段界取该符干中心
            const leftX = j === 0 ? stemEnds[0]!.x : (stemEnds[j - 1]!.x + stemEnds[j]!.x) / 2;
            const rightX = j === nStems - 1 ? stemEnds[nStems - 1]!.x : (stemEnds[j]!.x + stemEnds[j + 1]!.x) / 2;
            // 中间段向左右各延伸 overlap，形成嵌入效果
            const leftXAdj = j > 0 ? leftX - overlap : leftX;
            const rightXAdj = j < nStems - 1 ? rightX + overlap : rightX;
            const leftY = anchor.y + inclination * (leftXAdj - anchor.x);
            const rightY = anchor.y + inclination * (rightXAdj - anchor.x);
            const dx = stemHalfW; // 从左缘偏移到符干中心
            const dy = 0;
            vDoms.push({
                startPoint: {x: leftXAdj + dx, y: leftY + dy},
                endPoint: {x: rightXAdj + dx, y: rightY + dy},
                special: {
                    beam: {
                        lines: linesPerSegment[j]!,
                        centerX: stemEnds[j]!.x + stemHalfW, // 该段符杠以符干中心为对称轴
                        spacing: BEAM_LINE_SPACING * measureHeight,
                        thickness: BEAM_THICKNESS * measureHeight,
                        direction,
                    },
                },
                x: 0, y: 0, w: 0, h: 0,
                zIndex: 1200,
                tag: 'noteBeam',
                skinName: skinNameForNodes,
                skinKey: GuitarTabSkinKeyEnum.NoteBeam,
                targetId: '',
                dataComment: '符杠',
            });
        }
    };

    for (const g of beamGroupsUp) processBeamGroup(g, 'up');
    for (const g of beamGroupsDown) processBeamGroup(g, 'down');

    // --- 6. 移除被连杠音符的符尾 ---
    const beamedNoteHeadIds = new Set<string>([
        ...beamGroupsUp.flat().map(({
                                        note,
                                        direction
                                    }) => getExtremeNotesInfoId(note, direction)).filter((id): id is string => id != null),
        ...beamGroupsDown.flat().map(({
                                          note,
                                          direction
                                      }) => getExtremeNotesInfoId(note, direction)).filter((id): id is string => id != null),
    ]);
    // 符号 VDom 区间为 [startIdx, endIdx)；measureRepeat / 附属符号 / 符杠等都 push 在该区间之后，
    // 不能用 vDoms.length 反推，否则窗口会越过起始处，导致组内靠前音符（尤其首音）的符尾漏删。
    const startIdx = symbolVDomsStartIdx;
    const endIdx = symbolVDomsStartIdx + symbolVDomsLength;
    for (let i = endIdx - 1; i >= startIdx; i--) {
        const node = vDoms[i];
        if (node.tag === 'noteTail' && node.targetId && beamedNoteHeadIds.has(node.targetId)) {
            vDoms.splice(i, 1);
        }
    }
}
