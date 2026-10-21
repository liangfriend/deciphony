/**
 * 鼓谱倚音符杠（按声部）。
 *
 * 与五线谱 processGraceBeam 对齐，差异：
 * - 数据源是声部内 DrumNote 的 graceNotes / graceNotesAfter，符干方向即声部方向；
 * - 返回移除的符尾数量（本小节符号区间随之缩短，与鼓谱 processBeam 一致）。
 */

import type {DrumNotationSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import type {DrumNotesInfo, MeasureNoteSlot} from "@/types/MusicScoreType";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import type {DrumVoice, NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_PARTIAL_SCALE, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {computeBeamSlope} from "./beamSlope";
import {isDrumNote, slotSymbol} from "../utils/staffSlot";
import {GRACE_NOTE_SCALE} from "@/render/graceNote";
import {markBeamLineRuns} from "@/render/beamLineRuns";

/** 视觉左→右扫描分组，规则同 processBeam.buildBeamGroups */
function buildBeamGroupsLeftToRight(list: DrumNotesInfo[]): DrumNotesInfo[][] {
  const groups: DrumNotesInfo[][] = [];
  for (let i = 0; i < list.length; i++) {
    const ni = list[i]!;
    const next = list[i + 1];
    const pre = list[i - 1];
    const hasTail = ni.chronaxie <= 32;
    const canBeamWithNext = next != null && hasTail && next.chronaxie <= 32
      && ni.beamType !== BeamTypeEnum.None
      && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(next.beamType);
    const canBeamWithPre = pre != null && pre.chronaxie <= 32 && hasTail
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

/** 前倚音 index0 最靠主音（视觉最右），reverse 后才是左→右；后倚音已是左→右 */
function collectGraceBeamGroups(slots: MeasureNoteSlot[]): DrumNotesInfo[][] {
  const result: DrumNotesInfo[][] = [];
  for (const measureSlot of slots) {
    const sym = slotSymbol(measureSlot);
    if (!isDrumNote(sym)) continue;
    if (sym.graceNotes?.length) result.push(...buildBeamGroupsLeftToRight([...sym.graceNotes].reverse()));
    if (sym.graceNotesAfter?.length) result.push(...buildBeamGroupsLeftToRight([...sym.graceNotesAfter]));
  }
  return result;
}

/**
 * 符杠与符干相接处的 x：组内相邻符干交错，符杠从组内一侧切入
 * - up：最左接左缘，最右接右缘，中间接左缘；
 * - down：最左接右缘，最右接左缘，中间接右缘。
 */
function graceStemBeamAttachX(stem: VDom, direction: DrumVoice, index: number, count: number): number {
  const isLeftmost = index === 0;
  const isRightmost = index === count - 1;
  if (direction === 'up') return isRightmost && !isLeftmost ? stem.x + stem.w : stem.x;
  return isRightmost && !isLeftmost ? stem.x : stem.x + stem.w;
}

export function processGraceBeam(params: {
  slots: MeasureNoteSlot[];
  direction: DrumVoice;
  nodeIdMap: NodeIdMap;
  vDoms: VDom[];
  /** 本小节符号 VDom 在 vDoms 中的起始下标（push 符号前记录） */
  symbolVDomsStartIdx: number;
  symbolVDomsLength: number;
  skin: DrumNotationSkinPack;
  measureHeight: number;
  measureLineWidth: number;
  skinName?: string;
}): number {
  const {slots, direction, nodeIdMap, vDoms, symbolVDomsStartIdx, symbolVDomsLength, skin, measureHeight, measureLineWidth, skinName} = params;
  const skinNameForNodes = skinName ?? 'default';
  const minStemLength = MIN_STEM_HEIGHT_RATIO * (measureHeight - 5 * measureLineWidth) * GRACE_NOTE_SCALE;
  const stemSkin = skin[DrumNotationSkinKeyEnum.NoteStem];
  const stemHalfW = stemSkin ? stemSkin.w / 2 : 0;
  const beamedGraceIds = new Set<string>();

  for (const group of collectGraceBeamGroups(slots)) {
    const stems = group.map((ni) => nodeIdMap.get(ni.id)?.noteStem);
    if (stems.some((s) => !s)) continue;
    const groupStems = stems as VDom[];

    // --- 1. 接点与斜率 ---
    const stemEnds = groupStems.map((stem, i) => ({
      x: graceStemBeamAttachX(stem, direction, i, groupStems.length),
      y: direction === 'up' ? stem.y : stem.y + stem.h,
    }));
    const {inclination, anchor} = computeBeamSlope(stemEnds, direction);

    // --- 2. 每段符杠线（同 processBeam）---
    const beamCounts = group.map((ni) => chronaxieToBeamLineCount(ni.chronaxie));
    const lineCount = Math.max(...beamCounts);
    const nStems = groupStems.length;
    type BeamLineSpec = { type: 'left' | 'right' | 'both' | 'none'; scaleX?: number };
    const linesPerSegment: BeamLineSpec[][] = [];
    for (let seg = 0; seg < nStems; seg++) {
      const row: BeamLineSpec[] = [];
      for (let L = 0; L < lineCount; L++) {
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
          row.push({type: seg === 0 ? 'right' : seg === nStems - 1 ? 'left' : 'both', scaleX: BEAM_PARTIAL_SCALE});
        } else if (seg === leftmost) row.push({type: 'right'});
        else if (seg === rightmost) row.push({type: 'left'});
        else row.push({type: 'both'});
      }
      linesPerSegment.push(row);
    }

    // --- 3. 拉长符干至符杠 ---
    groupStems.forEach((stem, i) => {
      beamedGraceIds.add(group[i]!.id);
      const beamY = anchor.y + inclination * (stemEnds[i]!.x - anchor.x);
      const stemTop = stem.y;
      const stemBottom = stem.y + stem.h;
      if (direction === 'up') {
        stem.y = beamY;
        stem.h = Math.max(stemBottom - beamY, minStemLength);
      } else {
        stem.h = Math.max(beamY - stemTop, minStemLength);
      }
    });

    // --- 4. 符杠 VDom（段界用符干中心，相邻段首尾相接不重叠）---
    const centerXs = groupStems.map((stem) => stem.x + stemHalfW);
    const beamStart = vDoms.length;
    for (let j = 0; j < nStems; j++) {
      const leftX = j === 0 ? centerXs[0]! : (centerXs[j - 1]! + centerXs[j]!) / 2;
      const rightX = j === nStems - 1 ? centerXs[nStems - 1]! : (centerXs[j]! + centerXs[j + 1]!) / 2;
      vDoms.push({
        startPoint: {x: leftX, y: anchor.y + inclination * (leftX - anchor.x)},
        endPoint: {x: rightX, y: anchor.y + inclination * (rightX - anchor.x)},
        special: {
          beam: {
            lines: linesPerSegment[j]!,
            centerX: centerXs[j]!,
            spacing: BEAM_LINE_SPACING * measureHeight * GRACE_NOTE_SCALE,
            thickness: BEAM_THICKNESS * measureHeight * GRACE_NOTE_SCALE,
            direction,
          },
        },
        x: 0, y: 0, w: 0, h: 0,
        zIndex: 1200,
        tag: 'noteBeam',
        skinName: skinNameForNodes,
        skinKey: DrumNotationSkinKeyEnum.NoteBeam,
        targetId: '',
        dataComment: '倚音符杠',
      });
    }
    markBeamLineRuns(vDoms, beamStart);
  }

  // --- 5. 移除被连杠倚音的符尾 ---
  if (beamedGraceIds.size === 0) return 0;
  const endIdx = symbolVDomsStartIdx + symbolVDomsLength;
  let removed = 0;
  for (let i = endIdx - 1; i >= symbolVDomsStartIdx; i--) {
    const node = vDoms[i]!;
    if (node.tag === 'noteTail' && node.targetId && beamedGraceIds.has(node.targetId)) {
      vDoms.splice(i, 1);
      removed++;
    }
  }
  return removed;
}
